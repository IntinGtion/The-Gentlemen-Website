# The Gentlemen – Team Website (Split UI)

Diese Website ist absichtlich **ohne Frameworks** gebaut (nur HTML/CSS/JS).

**Design-Idee:**
- **Startscreen (Gate):** Team‑Bild + pulsierendes The Gentlemen‑Logo („Klick mich“)
- **Hauptlayout:** Links „Tabs“ (Navigation + Inhalte), rechts rotieren zufällige Bilder.

## Struktur

- `index.html` → Startscreen (Gate)
- `home.html` → eigentliche Startseite
- weitere Seiten: `about.html`, `mitspielen.html`, `regeln.html`, `spielfelder.html`, `kontakt.html`
- Rechtliches: `impressum.html`, `datenschutz.html`

## Inhalte pflegen

### Mitglieder
- Datei: `data/team.json`
- Pro Member ein Objekt unter `members`
- `photo` ist optional. Wenn leer/null, wird automatisch ein Initialen‑Avatar angezeigt.

**Beispiel:**
```json
{
  "callsign": "Paddi",
  "subtitle": "Flanken • Tempo • CQB",
  "tags": ["CQB", "Tempo"],
  "photo": "resources/members/paddi.jpg",
  "links": [
    { "label": "YouTube", "url": "https://…" }
  ]
}
```

### Spielfelder
- Datei: `data/fields.json`
- Listen: `regular` (regelmäßig) und `visited` (schon besucht)

### Slideshow / Bilder rechts
- Datei: `data/media.json`
- Bilder liegen standardmäßig in `resources/team/` (Platzhalter‑SVGs).
- Ersetze die Platzhalter durch echte Bilder (JPG/PNG/WebP) **mit gleichem Pfad** oder passe `data/media.json` an.

## Lokales Testen

⚠️ **Wichtig:** `fetch()` für JSON funktioniert in vielen Browsern nicht über `file://`.

Empfohlen:
- VS Code Extension **Live Server**
- oder im Projektordner:
  - `python -m http.server 8000`
  - dann im Browser öffnen: `http://localhost:8000/`

## GitHub Pages

Für GitHub Pages reicht es, das Repo zu pushen und Pages zu aktivieren.
Die JSON-Dateien liegen im Repo und werden statisch ausgeliefert.
