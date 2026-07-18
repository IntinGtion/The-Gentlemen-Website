<?php
// Einmal-Helfer: bcrypt-Hash erzeugen. Nach Gebrauch SOFORT löschen!
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['pw'])) {
    $hash = password_hash($_POST['pw'], PASSWORD_DEFAULT);
}
?>
<!doctype html>
<html lang="de">
<head><meta charset="utf-8"><title>Hash-Generator</title>
<style>
body{font-family:monospace;background:#0c0e09;color:#f2edd8;padding:2rem;max-width:560px}
input,button{font:inherit;padding:8px 12px;border-radius:6px;border:1px solid #444;background:#1a1f13;color:#f2edd8;width:100%;margin-top:6px;box-sizing:border-box}
button{background:#c9a227;color:#111;font-weight:700;cursor:pointer;margin-top:12px}
.hash{background:#1a1f13;border:1px solid #444;padding:12px;margin-top:16px;border-radius:6px;word-break:break-all;color:#e2c97e;font-size:.85rem}
p{color:#9ca08c;font-size:.85rem}
</style></head>
<body>
<h2>Passwort-Hash erzeugen</h2>
<p>Dieses Skript nach Gebrauch sofort löschen!</p>
<form method="post">
  <label>Passwort:</label>
  <input type="password" name="pw" autofocus required>
  <button type="submit">Hash erzeugen</button>
</form>
<?php if (!empty($hash)): ?>
<div class="hash"><?= htmlspecialchars($hash) ?></div>
<p>Diesen String in <code>config.php</code> als <code>ADMIN_PASSWORD_HASH</code> eintragen.</p>
<?php endif; ?>
</body></html>
