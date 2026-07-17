# The Gentlemen – Team Website

Offizielle Website des Airsoft-Teams **The Gentlemen**. Gebaut ohne Frameworks – reines HTML, CSS und vanilla JavaScript.

**Live:** [the-gentlemen.de](https://the-gentlemen.de)

---

## Technik

- Statisches HTML/CSS/JS – kein Framework, kein Build-Schritt
- JSON-gesteuerte Inhalte (Mitglieder, Spielfelder, Galerie, Berichte)
- Interaktive Karte via [Leaflet.js](https://leafletjs.com/)
- Deployment: Git Push → GitHub → Plesk (automatisch via Webhook)

---

## Seitenstruktur

| Datei | Inhalt |
|---|---|
| `index.html` | Splash-/Enter-Screen |
| `start.html` | Startseite mit Slideshow |
| `ueber-uns.html` | Team-Identität, Werte, Erkennungszeichen |
| `mitglieder.html` | Mitgliederübersicht |
| `spielfelder.html` | Interaktive Karte besuchter Felder |
| `berichte.html` | Spieltagesberichte und Felderfahrungen |
| `galerie.html` | Bildergalerie |
| `kontakt.html` | Kontakt und Social Links |
| `impressum.html` | Impressum |
| `datenschutz.html` | Datenschutzerklärung |

---

## Inhalte pflegen

### Mitglieder – `data/team.json`

```json
{
  "callsign": "Spielertag",
  "subtitle": "Kurzbeschreibung",
  "tags": ["CQB", "Woodland"],
  "photo": "resources/members/foto.webp",
  "links": [
    { "label": "Instagram", "url": "https://..." }
  ]
}
```

`photo` ist optional – ohne Foto wird automatisch ein Initialen-Avatar angezeigt.

### Spielfelder – `js/fields-data.js`

Felder werden als JavaScript-Array in `window.vulcanoFields` gepflegt. Heimatstädte der Mitglieder stehen in `window.memberLocations`.

### Berichte – `data/berichte.json`

```json
{
  "id": "eindeutiger-slug",
  "titel": "Spieltag Area-M – Juli 2026",
  "datum": "2026-07-12",
  "feld": "Area M",
  "typ": "spieltag",
  "intro": "Kurzer Einstiegssatz für die Kartenvorschau.",
  "absaetze": [
    "Erster Absatz...",
    "Zweiter Absatz..."
  ],
  "bilder": []
}
```

`typ` ist entweder `spieltag` oder `feldbericht`. `bilder` ist optional (Array von Bildpfaden).

### Galerie / Slideshow – `data/media.json`

Bilder als WebP in `resources/team/slides/` ablegen und in `media.json` eintragen.

---

## Lokale Entwicklung

Da `fetch()` über `file://` nicht funktioniert, wird ein lokaler Server benötigt:

```bash
# Python
python -m http.server 8000

# Node.js
npx serve .
```

Dann im Browser: `http://localhost:8000`

Oder die VS Code Extension **Live Server** verwenden.

---

## Deployment

Jeder Push auf `master` wird automatisch auf [the-gentlemen.de](https://the-gentlemen.de) deployt:

```
git push origin master
```

Pipeline: **GitHub** → Webhook → **Plesk** → Live
