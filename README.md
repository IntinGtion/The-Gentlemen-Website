# The Gentlemen – Team Website

Private Team-Website der **The Gentlemen** (Airsoft-Team). Gebaut bewusst **ohne Frameworks** – nur HTML, CSS und Vanilla JS.

## Design-Idee

- **Startscreen (Gate)** – `index.html`: Team-Bild + pulsierendes The-Gentlemen-Logo („Klick mich“)
- **Hauptlayout** – `home.html`: links Tabs (Navigation + Inhalte), rechts rotierende Bilder

## Projektstruktur

```
├── index.html          Startscreen (Gate)
├── home.html           Hauptseite
├── about.html          Über das Team
├── mitspielen.html     Mitspielen / Bewerbung
├── fields.html         Spielfelder
├── galerie.html        Galerie
├── kontakt.html         Kontakt
├── impressum.html      Impressum
├── datenschutz.html    Datenschutzerklärung
├── css/                Zusätzliche Stylesheets (z.B. fields.css)
├── js/                 Zusätzliche Scripts (z.B. fields.js)
├── data/               Inhalte als JSON (Mitglieder, Spielfelder, Galerie, …)
└── resources/          Bilder, Videos, Logos, Slides
```

## Inhalte pflegen

### Mitglieder
- Datei: `data/team.json`
- Pro Member ein Objekt unter `members`
- `photo` ist optional. Wenn leer/null, wird automatisch ein Initialen-Avatar angezeigt.

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

### Galerie
- Datei: `data/gallery.json`
- Alben liegen in `resources/gallery/alben/…`

### Slideshow / Bilder rechts
- Datei: `data/media.json`
- Bilder liegen standardmäßig in `resources/team/slides/`.
- Ersetze die Platzhalter durch echte Bilder (JPG/PNG/WebP) **mit gleichem Pfad** oder passe `data/media.json` an.

## Lokal testen

⚠️ **Wichtig:** `fetch()` für JSON funktioniert in vielen Browsern nicht über `file://`.

Empfohlen:
- VS Code Extension **Live Server**
- oder im Projektordner:
  ```bash
  python -m http.server 8000
  ```
  dann im Browser öffnen: `http://localhost:8000/`

## Tech-Stack

- HTML5 / CSS3 / Vanilla JavaScript
- Keine Build-Tools, keine Dependencies

## Lizenz / Nutzung

Privates Projekt des Teams **The Gentlemen**. Alle Rechte an Bildern, Logos und Inhalten liegen beim Team.
