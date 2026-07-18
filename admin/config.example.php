<?php
// ── The Gentlemen Admin – Konfiguration ─────────────────────────────────────
//
// 1. Diese Datei kopieren und als "config.php" im selben Verzeichnis speichern.
// 2. config.php NUR auf dem Server ablegen – niemals ins Git-Repo einchecken!
//
// ── Passwort-Hash erzeugen ───────────────────────────────────────────────────
// Lokal in der Konsole ausführen (PHP muss installiert sein):
//   php -r "echo password_hash('DEIN_PASSWORT', PASSWORD_DEFAULT);"
// Den ausgegebenen Hash unten eintragen.
//
// ── GitHub Personal Access Token ────────────────────────────────────────────
// Erstellen unter: https://github.com/settings/tokens → "Generate new token (classic)"
// Erforderliche Berechtigung: repo → Contents (read & write)
//
// ────────────────────────────────────────────────────────────────────────────

define('ADMIN_PASSWORD_HASH', '$2y$10$HIER_DEINEN_HASH_EINTRAGEN');

define('GITHUB_TOKEN',  'ghp_HIER_DEINEN_TOKEN_EINTRAGEN');
define('GITHUB_REPO',   'IntinGtion/The-Gentlemen-Website');
define('GITHUB_BRANCH', 'master');
