<?php
// ── Bootstrap ───────────────────────────────────────────────────────────────
session_start();

$configPath = __DIR__ . '/config.php';
if (!file_exists($configPath)) {
    http_response_code(503);
    die('<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Setup</title>
<style>body{font-family:monospace;background:#0c0e09;color:#f2edd8;padding:2rem;max-width:640px}
code{background:#1e2318;padding:2px 6px;border-radius:4px}</style></head><body>
<h2>Setup erforderlich</h2>
<p><code>admin/config.php</code> nicht gefunden.</p>
<p>Bitte <code>admin/config.example.php</code> als Vorlage nehmen, ausfüllen und als
<code>admin/config.php</code> auf dem Server ablegen (nicht ins Git-Repo einchecken).</p>
</body></html>');
}
require_once $configPath;

// ── GitHub API ──────────────────────────────────────────────────────────────
function ghRequest(string $method, string $path, ?array $body = null): array {
    $ch = curl_init('https://api.github.com/repos/' . GITHUB_REPO . $path);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST  => $method,
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . GITHUB_TOKEN,
            'Accept: application/vnd.github+json',
            'X-GitHub-Api-Version: 2022-11-28',
            'User-Agent: TG-Admin/1.0',
            'Content-Type: application/json',
        ],
    ]);
    if ($body !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    }
    $raw = curl_exec($ch);
    $err = curl_error($ch);
    curl_close($ch);
    if ($err) throw new RuntimeException('cURL: ' . $err);
    $decoded = json_decode($raw, true);
    if (isset($decoded['message']) && str_contains($decoded['message'] ?? '', 'Bad credentials')) {
        throw new RuntimeException('GitHub Token ungültig. Bitte config.php prüfen.');
    }
    return $decoded ?? [];
}

function ghGet(string $path): array {
    return ghRequest('GET', '/contents/' . ltrim($path, '/'));
}

function ghPut(string $path, string $content, string $msg, ?string $sha = null): array {
    $body = ['message' => $msg, 'content' => base64_encode($content), 'branch' => GITHUB_BRANCH];
    if ($sha !== null) $body['sha'] = $sha;
    $res = ghRequest('PUT', '/contents/' . ltrim($path, '/'), $body);
    if (isset($res['message'])) throw new RuntimeException('GitHub: ' . $res['message']);
    return $res;
}

function ghDecode(array $file): string {
    return base64_decode(str_replace(["\n", "\r"], '', $file['content']));
}

function slugify(string $s): string {
    $s = mb_strtolower($s, 'UTF-8');
    $s = strtr($s, ['ä'=>'ae','ö'=>'oe','ü'=>'ue','ß'=>'ss','Ä'=>'ae','Ö'=>'oe','Ü'=>'ue']);
    return trim(preg_replace('/[^a-z0-9]+/', '-', $s), '-');
}

// ── Auth ────────────────────────────────────────────────────────────────────
$loginError = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['_action'] ?? '';

    if ($action === 'login') {
        if (password_verify($_POST['pw'] ?? '', ADMIN_PASSWORD_HASH)) {
            $_SESSION['tg_admin'] = true;
            header('Location: /admin/'); exit;
        }
        $loginError = 'Falsches Passwort.';
    }

    if ($action === 'logout') {
        session_destroy();
        header('Location: /admin/'); exit;
    }
}

$loggedIn = !empty($_SESSION['tg_admin']);

// ── Actions ─────────────────────────────────────────────────────────────────
$flash = ['type' => '', 'text' => ''];

if ($loggedIn && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['_action'] ?? '';
    try {
        // ---- Spieltag -------------------------------------------------------
        if ($action === 'spieltag') {
            $data = [
                'date'      => trim($_POST['date'] ?? ''),
                'location'  => trim($_POST['location'] ?? ''),
                'info'      => trim($_POST['info'] ?? ''),
                'confirmed' => isset($_POST['confirmed']),
            ];
            $f = ghGet('data/spieltag.json');
            ghPut(
                'data/spieltag.json',
                json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
                'Update: Spieltag ' . $data['date'],
                $f['sha']
            );
            $flash = ['type' => 'ok', 'text' => 'Spieltag gespeichert – wird in Kürze live.'];
        }

        // ---- Neuer Bericht --------------------------------------------------
        elseif ($action === 'bericht') {
            $titel = trim($_POST['titel'] ?? '');
            $datum = trim($_POST['datum'] ?? '');
            $feld  = trim($_POST['feld'] ?? '');
            $typ   = in_array($_POST['typ'] ?? '', ['spieltag', 'feldbericht'])
                     ? $_POST['typ'] : 'spieltag';
            $intro = trim($_POST['intro'] ?? '');

            if (!$titel || !$datum) throw new RuntimeException('Titel und Datum sind Pflichtfelder.');

            // Parse absaetze: blank lines separate blocks
            $raw      = str_replace("\r\n", "\n", $_POST['absaetze'] ?? '');
            $blocks   = preg_split('/\n{2,}/', trim($raw));
            $absaetze = array_values(array_filter(array_map('trim', $blocks)));

            $post = [
                'id'       => slugify($titel) . '-' . str_replace('-', '', $datum),
                'titel'    => $titel,
                'datum'    => $datum,
                'feld'     => $feld,
                'typ'      => $typ,
                'intro'    => $intro,
                'absaetze' => $absaetze,
                'bilder'   => [],
            ];

            $f        = ghGet('data/berichte.json');
            $berichte = json_decode(ghDecode($f), true) ?? [];
            array_unshift($berichte, $post);

            ghPut(
                'data/berichte.json',
                json_encode($berichte, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
                'Add Bericht: ' . $titel,
                $f['sha']
            );
            $flash = ['type' => 'ok', 'text' => 'Bericht veröffentlicht – wird in Kürze live.'];
        }

        // ---- Galerie-Bild ---------------------------------------------------
        elseif ($action === 'galerie') {
            if (empty($_FILES['bild']['tmp_name'])) {
                throw new RuntimeException('Kein Bild ausgewählt.');
            }
            $album = trim($_POST['album'] ?? '');
            $alt   = trim($_POST['alt'] ?? 'The Gentlemen');
            $meta  = trim($_POST['meta'] ?? '');
            $tmp   = $_FILES['bild']['tmp_name'];
            $mime  = mime_content_type($tmp);

            $image = match($mime) {
                'image/jpeg' => imagecreatefromjpeg($tmp),
                'image/png'  => imagecreatefrompng($tmp),
                'image/webp' => imagecreatefromwebp($tmp),
                default      => throw new RuntimeException(
                    'Nur JPG, PNG oder WebP zulässig (erkannt: ' . $mime . ').'
                ),
            };
            if (!$image) throw new RuntimeException('Bild konnte nicht gelesen werden.');

            ob_start();
            imagewebp($image, null, 85);
            $webpBytes = ob_get_clean();
            imagedestroy($image);

            $filename = slugify($alt) . '-' . date('Ymd-His') . '.webp';
            $relPath  = "resources/gallery/alben/{$album}/{$filename}";

            // Upload image file
            ghPut($relPath, $webpBytes, "Add gallery image: {$filename}");

            // Update gallery.json
            $gf      = ghGet('data/gallery.json');
            $gallery = json_decode(ghDecode($gf), true);
            $found   = false;
            foreach ($gallery['albums'] as &$a) {
                if ($a['id'] === $album) {
                    $a['items'][] = ['src' => $relPath, 'alt' => $alt, 'meta' => $meta];
                    $found = true;
                    break;
                }
            }
            unset($a);
            if (!$found) throw new RuntimeException("Album \"{$album}\" nicht gefunden.");

            ghPut(
                'data/gallery.json',
                json_encode($gallery, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
                "Add image to album: {$album}",
                $gf['sha']
            );
            $flash = ['type' => 'ok', 'text' => "Bild \"{$filename}\" hochgeladen und Galerie aktualisiert."];
        }

    } catch (Throwable $e) {
        $flash = ['type' => 'err', 'text' => $e->getMessage()];
    }
}

// ── Load current data (for pre-filling forms) ────────────────────────────────
$spieltag = ['date' => '', 'location' => '', 'info' => '', 'confirmed' => true];
$albums   = [];
if ($loggedIn) {
    try {
        $sf = ghGet('data/spieltag.json');
        $spieltag = json_decode(ghDecode($sf), true) ?? $spieltag;
    } catch (Throwable) {}
    try {
        $gf = ghGet('data/gallery.json');
        $g  = json_decode(ghDecode($gf), true);
        foreach ($g['albums'] ?? [] as $a) {
            $albums[$a['id']] = $a['title'];
        }
    } catch (Throwable) {}
}
?>
<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Admin – The Gentlemen</title>
<style>
:root {
  --bg:     #0c0e09;
  --panel:  #141810;
  --panel2: #1a1f13;
  --border: rgba(201,162,39,.22);
  --gold:   #c9a227;
  --gold2:  #e2c97e;
  --text:   #f2edd8;
  --muted:  #9ca08c;
  --red:    #c41e1e;
  --r:      10px;
}
*, *::before, *::after { box-sizing: border-box; }
html { font-family: system-ui, sans-serif; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100dvh;
}
a { color: var(--gold2); text-decoration: none; }
a:hover { color: var(--gold); }

/* ── Layout ── */
.topbar {
  background: var(--panel);
  border-bottom: 1px solid var(--border);
  padding: 14px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.topbar__title { font-weight: 800; font-size: 1.05rem; letter-spacing: .05em; }
.topbar__title span { color: var(--gold); }
.wrap { max-width: 820px; margin: 0 auto; padding: 28px 20px 60px; }

/* ── Flash message ── */
.flash {
  padding: 12px 16px;
  border-radius: var(--r);
  margin-bottom: 24px;
  font-weight: 600;
}
.flash--ok  { background: rgba(100,180,60,.12); border: 1px solid rgba(100,180,60,.35); color: #9de070; }
.flash--err { background: rgba(196,30,30,.12);  border: 1px solid rgba(196,30,30,.35);  color: #f07070; }

/* ── Login ── */
.login-wrap {
  max-width: 360px;
  margin: 80px auto;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--r);
  padding: 32px;
}
.login-wrap h2 { margin: 0 0 20px; font-size: 1.2rem; color: var(--gold); }

/* ── Section cards ── */
.section {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--r);
  margin-bottom: 20px;
  overflow: hidden;
}
.section__head {
  padding: 14px 20px;
  background: var(--panel2);
  border-bottom: 1px solid var(--border);
  font-weight: 700;
  font-size: .95rem;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}
.section__head .icon { font-size: 1.1rem; }
.section__head .arrow { margin-left: auto; transition: transform .2s; }
.section__head[aria-expanded="false"] .arrow { transform: rotate(-90deg); }
.section__body { padding: 20px; }
.section__body[hidden] { display: none; }

/* ── Form elements ── */
.field { margin-bottom: 16px; }
.field label { display: block; font-size: .82rem; font-weight: 700; color: var(--muted);
  text-transform: uppercase; letter-spacing: .06em; margin-bottom: 5px; }
.field input[type=text],
.field input[type=date],
.field select,
.field textarea {
  width: 100%;
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.14);
  border-radius: 6px;
  color: var(--text);
  padding: 9px 12px;
  font: inherit;
  font-size: .95rem;
  transition: border-color .15s;
  appearance: auto;
}
.field input:focus,
.field select:focus,
.field textarea:focus {
  outline: none;
  border-color: rgba(201,162,39,.55);
}
.field textarea { resize: vertical; min-height: 120px; }
.field__hint { font-size: .8rem; color: var(--muted); margin-top: 4px; }
.row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
@media (max-width: 520px) { .row2 { grid-template-columns: 1fr; } }

/* ── Checkbox ── */
.check-field { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
.check-field input { width: 18px; height: 18px; accent-color: var(--gold); }
.check-field label { font-size: .95rem; cursor: pointer; margin: 0; }

/* ── Buttons ── */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: rgba(255,255,255,.04);
  color: var(--text);
  font: inherit;
  font-size: .9rem;
  cursor: pointer;
  transition: background .15s, border-color .15s;
}
.btn:hover { background: rgba(201,162,39,.12); border-color: rgba(201,162,39,.4); }
.btn--primary {
  background: linear-gradient(135deg, rgba(201,162,39,.9), rgba(226,201,126,.8));
  border-color: rgba(201,162,39,.6);
  color: #141414;
  font-weight: 800;
}
.btn--primary:hover { filter: brightness(1.06); }
.btn--sm { padding: 6px 12px; font-size: .82rem; }
.btn--danger { border-color: rgba(196,30,30,.4); color: #f07070; }
.btn--danger:hover { background: rgba(196,30,30,.12); }

/* ── Tip box ── */
.tip {
  background: rgba(201,162,39,.07);
  border: 1px solid rgba(201,162,39,.22);
  border-radius: 6px;
  padding: 10px 14px;
  font-size: .82rem;
  color: var(--muted);
  margin-bottom: 16px;
  line-height: 1.6;
}
.tip code { background: rgba(255,255,255,.08); padding: 1px 5px; border-radius: 3px;
  font-family: monospace; font-size: .9em; color: var(--gold2); }

/* ── File input ── */
.file-drop {
  border: 2px dashed rgba(255,255,255,.18);
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: border-color .15s;
}
.file-drop:hover, .file-drop.drag { border-color: var(--gold); }
.file-drop input { display: none; }
.file-drop__label { color: var(--muted); font-size: .9rem; }
.file-drop__preview { display: none; max-width: 200px; max-height: 140px;
  margin: 10px auto 0; border-radius: 6px; }
</style>
</head>
<body>

<div class="topbar">
  <div class="topbar__title"><span>The Gentlemen</span> – Admin</div>
  <?php if ($loggedIn): ?>
  <form method="post" style="margin:0">
    <input type="hidden" name="_action" value="logout">
    <button class="btn btn--sm btn--danger" type="submit">Abmelden</button>
  </form>
  <?php endif; ?>
</div>

<?php if (!$loggedIn): ?>
<!-- ── Login ── -->
<div class="login-wrap">
  <h2>Anmelden</h2>
  <?php if ($loginError): ?>
  <div class="flash flash--err"><?= htmlspecialchars($loginError) ?></div>
  <?php endif; ?>
  <form method="post">
    <input type="hidden" name="_action" value="login">
    <div class="field">
      <label for="pw">Passwort</label>
      <input type="password" id="pw" name="pw" autofocus required>
    </div>
    <button class="btn btn--primary" type="submit" style="width:100%">Anmelden</button>
  </form>
</div>

<?php else: ?>
<!-- ── Dashboard ── -->
<div class="wrap">

<?php if ($flash['type']): ?>
<div class="flash flash--<?= $flash['type'] ?>"><?= htmlspecialchars($flash['text']) ?></div>
<?php endif; ?>

<!-- ══ Spieltag ══════════════════════════════════════════════════════════ -->
<div class="section">
  <div class="section__head" aria-expanded="true" onclick="toggleSection(this)">
    <span class="icon">📅</span> Nächster Spieltag
    <span class="arrow">▾</span>
  </div>
  <div class="section__body">
    <form method="post">
      <input type="hidden" name="_action" value="spieltag">
      <div class="row2">
        <div class="field">
          <label for="st_date">Datum</label>
          <input type="text" id="st_date" name="date" placeholder="z. B. 15.08.2026"
            value="<?= htmlspecialchars($spieltag['date']) ?>" required>
        </div>
        <div class="field">
          <label for="st_loc">Spielfeld</label>
          <input type="text" id="st_loc" name="location" placeholder="z. B. Area M"
            value="<?= htmlspecialchars($spieltag['location']) ?>">
        </div>
      </div>
      <div class="field">
        <label for="st_info">Info (optional)</label>
        <input type="text" id="st_info" name="info" placeholder="z. B. Anfahrt früher – Treffpunkt 9 Uhr"
          value="<?= htmlspecialchars($spieltag['info']) ?>">
      </div>
      <div class="check-field">
        <input type="checkbox" id="st_confirmed" name="confirmed"
          <?= ($spieltag['confirmed'] ?? true) ? 'checked' : '' ?>>
        <label for="st_confirmed">Termin bestätigt</label>
      </div>
      <button class="btn btn--primary" type="submit">Spieltag speichern</button>
    </form>
  </div>
</div>

<!-- ══ Neuer Bericht ═════════════════════════════════════════════════════ -->
<div class="section">
  <div class="section__head" aria-expanded="false" onclick="toggleSection(this)">
    <span class="icon">📝</span> Neuer Bericht
    <span class="arrow">▾</span>
  </div>
  <div class="section__body" hidden>
    <div class="tip">
      <strong>Format für den Inhalt:</strong> Absätze durch eine Leerzeile trennen.<br>
      Überschriften: <code>&lt;h3&gt;Titel&lt;/h3&gt;</code> – Zitate: <code>&lt;blockquote&gt;&lt;p&gt;Text&lt;/p&gt;&lt;/blockquote&gt;</code><br>
      Fettdruck: <code>&lt;strong&gt;Wort&lt;/strong&gt;</code>
    </div>
    <form method="post">
      <input type="hidden" name="_action" value="bericht">
      <div class="field">
        <label for="b_titel">Titel *</label>
        <input type="text" id="b_titel" name="titel" required
          placeholder="z. B. Erster Spieltag auf der Area M: Hitze und Teamgeist">
      </div>
      <div class="row2">
        <div class="field">
          <label for="b_datum">Datum * (JJJJ-MM-TT)</label>
          <input type="date" id="b_datum" name="datum" required
            value="<?= date('Y-m-d') ?>">
        </div>
        <div class="field">
          <label for="b_typ">Typ</label>
          <select id="b_typ" name="typ">
            <option value="spieltag">Spieltag</option>
            <option value="feldbericht">Feldbericht</option>
          </select>
        </div>
      </div>
      <div class="row2">
        <div class="field">
          <label for="b_feld">Spielfeld</label>
          <input type="text" id="b_feld" name="feld" placeholder="z. B. Area M">
        </div>
      </div>
      <div class="field">
        <label for="b_intro">Einleitung (Kurztext für die Karte)</label>
        <textarea id="b_intro" name="intro" rows="2"
          placeholder="Kurzbeschreibung, die auf der Übersichtskarte erscheint…"></textarea>
      </div>
      <div class="field">
        <label for="b_absaetze">Inhalt</label>
        <textarea id="b_absaetze" name="absaetze" rows="14"
          placeholder="Erster Absatz…

Zweiter Absatz nach Leerzeile.

&lt;h3&gt;Zwischenüberschrift&lt;/h3&gt;

Weiterer Absatz…

&lt;blockquote&gt;&lt;p&gt;„Zitattext"&lt;/p&gt;&lt;/blockquote&gt;"></textarea>
        <div class="field__hint">Leerzeile = neuer Absatz. Zeilen die mit &lt; beginnen werden als HTML übernommen.</div>
      </div>
      <button class="btn btn--primary" type="submit">Bericht veröffentlichen</button>
    </form>
  </div>
</div>

<!-- ══ Galerie ═══════════════════════════════════════════════════════════ -->
<div class="section">
  <div class="section__head" aria-expanded="false" onclick="toggleSection(this)">
    <span class="icon">🖼️</span> Bild zur Galerie hinzufügen
    <span class="arrow">▾</span>
  </div>
  <div class="section__body" hidden>
    <div class="tip">
      JPG, PNG oder WebP – wird automatisch zu WebP (85 % Qualität) konvertiert.
    </div>
    <form method="post" enctype="multipart/form-data">
      <input type="hidden" name="_action" value="galerie">
      <div class="field">
        <label>Bild</label>
        <div class="file-drop" id="fileDrop" onclick="document.getElementById('bildInput').click()">
          <input type="file" id="bildInput" name="bild" accept="image/jpeg,image/png,image/webp">
          <div class="file-drop__label">Klicken zum Auswählen (oder Bild hierher ziehen)</div>
          <img class="file-drop__preview" id="filePreview" alt="Vorschau">
        </div>
      </div>
      <div class="row2">
        <div class="field">
          <label for="g_album">Album</label>
          <select id="g_album" name="album">
            <?php foreach ($albums as $id => $title): ?>
            <option value="<?= htmlspecialchars($id) ?>"><?= htmlspecialchars($title) ?></option>
            <?php endforeach; ?>
          </select>
        </div>
        <div class="field">
          <label for="g_alt">Bildbeschreibung (alt-Text)</label>
          <input type="text" id="g_alt" name="alt" placeholder="The Gentlemen – Beschreibung">
        </div>
      </div>
      <div class="field">
        <label for="g_meta">Meta / Untertitel (optional)</label>
        <input type="text" id="g_meta" name="meta" placeholder="z. B. Area M, Juni 2026">
      </div>
      <button class="btn btn--primary" type="submit">Bild hochladen</button>
    </form>
  </div>
</div>

</div><!-- /wrap -->
<?php endif; ?>

<script>
function toggleSection(head) {
  var expanded = head.getAttribute('aria-expanded') === 'true';
  head.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  head.nextElementSibling.hidden = expanded;
}

// File drop + preview
var drop = document.getElementById('fileDrop');
var input = document.getElementById('bildInput');
var preview = document.getElementById('filePreview');

if (input) {
  input.addEventListener('change', function() {
    if (this.files[0]) showPreview(this.files[0]);
  });
}
if (drop) {
  drop.addEventListener('dragover', function(e) { e.preventDefault(); this.classList.add('drag'); });
  drop.addEventListener('dragleave', function() { this.classList.remove('drag'); });
  drop.addEventListener('drop', function(e) {
    e.preventDefault(); this.classList.remove('drag');
    var file = e.dataTransfer.files[0];
    if (file) { input.files = e.dataTransfer.files; showPreview(file); }
  });
}
function showPreview(file) {
  var reader = new FileReader();
  reader.onload = function(e) {
    preview.src = e.target.result;
    preview.style.display = 'block';
    drop.querySelector('.file-drop__label').textContent = file.name;
  };
  reader.readAsDataURL(file);
}
</script>
</body>
</html>
