# 🎮 Gemini-Game: Neu-Anspach 61267 Battle Royale & Tycoon

Ein produktionsbereites 3D-Third-Person-Battle-Royale- und Tycoon-Spiel, entwickelt mit **React 19**, **Three.js**, **Express**, **WebSockets** und **TypeScript**.

Das Spiel bietet authentische Schauplätze der Stadt Neu-Anspach (Freilichtmuseum Hessenpark, Waldschwimmbad, Bahnhof Taunusbahn, Bürgerhaus, Taunus-Center, Adolf-Reichwein-Schule, Feldbergblick), Gunsmith-Waffen-Upgrades, ein Echtzeit-Leaderboard und Co-op-Multiplayer.

---

## 🚀 Schnelleinstieg (Lokale Entwicklung)

### Voraussetzungen
- **Node.js**: Version 20+ (Node.js 22+ empfohlen für integrierten `node:sqlite`-Support)
- **npm** oder **bun**

### Installation
```bash
# Repository klonen & Abhängigkeiten installieren
npm install

# Umgebungsvariablen vorbereiten
cp .env.example .env

# Entwicklungsserver starten (Vite + Express + WebSockets unter Port 3000)
npm run dev
```
Das Spiel ist anschließend unter `http://localhost:3000` im Browser erreichbar.

---

## 🧪 Automatisierte Tests ausführen

Das Projekt verfügt über eine umfassende Testsuite (Auth, Passwörter, scrypt, Sessions, Single-Session-Enforcement, CSRF-Schutz, Multiplayer-Ownership, Anti-Cheat-Bounds und WebSockets):

```bash
# Gesamte Testsuite ausführen
npm test

# TypeScript-Typüberprüfung
npm run lint

# Produktionsbuild testen
npm run build
```

---

## ⚙️ Umgebungsvariablen & Konfiguration

Kopiere `.env.example` nach `.env` und passe die Werte bei Bedarf an:

| Variable | Standardwert | Beschreibung |
| :--- | :--- | :--- |
| `PORT` | `3000` | Port für Express & WebSockets (wird bei Cloud-Hostern automatisch zugewiesen). |
| `NODE_ENV` | `development` | Setze auf `production` für optimierte statische Auslieferung und strikte Cookies. |
| `DATABASE_URL` | *(leer)* | PostgreSQL-Verbindungsstring für die Produktion. Bleibt dieser leer, nutzt der Server automatisch SQLite. |
| `SQLITE_DB_PATH` | `data/game.sqlite` | Dateipfad zur lokalen SQLite-Datenbank. |
| `AUTH_COOKIE_NAME` | `gemini_game_session` | Name des sicheren HttpOnly-Sitzungscookies. |
| `AUTH_SESSION_TTL_MS` | `2592000000` | Sitzungsdauer in Millisekunden (Standard: 30 Tage). |
| `AUTH_SECURE_COOKIE` | `false` (in Dev) | Auf `true` setzen, sobald die Anwendung über HTTPS ausgeliefert wird. |
| `ALLOWED_ORIGINS` | *(leer)* | Kommagetrennte Liste erlaubter Domains für CORS und WebSockets (z. B. `https://spiel.deinedomain.de`). |
| `DB_SSL_REJECT_UNAUTHORIZED` | `false` | SSL-Zertifikatsvalidierung bei Cloud-Datenbanken (z. B. Supabase/Neon/Render). |

> ⚠️ **Wichtig**: Hinterlege niemals echte Passwörter, Secrets oder API-Keys im Git-Repository!

---

## 🗄️ Datenbank & Persistenz

Die Anwendung nutzt eine flexible Speicherabstraktion (`GameStorage` in `src/server/storage.ts`):

1. **Lokale Entwicklung / Single-Node (SQLite)**:
   - Verwendet das in Node.js 22 integrierte `node:sqlite` mit Write-Ahead-Logging (WAL) für hohe Performance und Ausfallsicherheit.
   - Keine zusätzlichen C++ Build-Tools (`node-gyp`) nötig.
   - Datei liegt unter `data/game.sqlite`.
2. **Produktion / Multi-Instance (PostgreSQL)**:
   - Sobald die Umgebungsvariable `DATABASE_URL` (z. B. von Render, Neon, Supabase, Railway) gesetzt ist, wechselt das Backend automatisch auf den PostgreSQL-Pool (`pg`).
   - Automatische Tabellen-Initialisierung (`CREATE TABLE IF NOT EXISTS`) beim Serverstart.
3. **Automatische Migration von Alt-Daten**:
   - Existieren noch historische `data/accounts.json` oder `data/real_leaderboard.json`, werden diese beim ersten Start automatisch in die Datenbank importiert.

### Backup-Strategie
- **SQLite**: Sichere die Datei `data/game.sqlite` sowie eventuelle WAL-Dateien (`data/game.sqlite-wal`).
- **PostgreSQL**: Nutze automatische pg_dump-Snapshots deines Hosting-Providers (z. B. tägliche automatisierte Backups bei Render oder Railway).

---

## 🚢 Deployment-Anleitungen

### 1. Deployment auf Render.com
1. Erstelle ein neues **Web Service** auf [render.com](https://render.com).
2. Verbinde dein GitHub-Repository.
3. Konfiguriere folgende Einstellungen:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. (Optional, empfohlen) Erstelle eine kostenlose **PostgreSQL Database** auf Render und füge die interne Verbindungs-URL als Umgebungsvariable `DATABASE_URL` im Web Service hinzu.
5. Setze `NODE_ENV=production` und `AUTH_SECURE_COOKIE=true`.
6. Deploy starten!

### 2. Deployment auf Railway.app
1. Neues Projekt erstellen -> **Deploy from GitHub repo**.
2. Füge ein PostgreSQL-Plugin zum Projekt hinzu. Railway verknüpft die `DATABASE_URL` automatisch.
3. In den Service-Einstellungen:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
4. Railway vergibt automatisch eine HTTPS-Domain.

### 3. Deployment auf Fly.io
1. Fly CLI installieren: `fly launch`
2. Konfiguriere ein Volume für persistenten Speicher, falls du SQLite nutzen möchtest, oder verbinde eine Postgres-Instanz via `fly postgres attach`.
3. Starte mit: `fly deploy`.

---

## 🔒 Sicherheitsarchitektur & Authentifizierung

- **Passworthashing**: Sicheres Scrypt (`N=16384, r=8, p=1`, 64-Byte Key) mit individuellem 16-Byte kryptografischem Salt (`crypto.randomBytes(16)`).
- **Schutz vor User-Enumeration**: Konstante Dummy-Scrypt-Hashes bei unbekannten Benutzernamen verhindern Timing-Attacks.
- **Session-Tokens**: 32 Bytes kryptografisch zufällig (`base64url`), in der Datenbank als SHA-256-Hash gespeichert.
- **HttpOnly-Cookies**: Das Session-Token wird **nicht** im `localStorage` exponiert, sondern ausschließlich über geschützte `HttpOnly; SameSite=Lax; Secure` Cookies transportiert.
- **CSRF-Schutz**: Bei allen zustandsverändernden REST-Anfragen (`POST`, `PUT`, `DELETE`) wird ein sitzungsgebundenes CSRF-Token im `X-CSRF-Token`-Header validiert.
- **Single-Active-Session**: Pro Account ist jeweils nur eine aktive Gerätesitzung gestattet. Bei Neuanmeldung auf einem anderen Gerät wird die alte Sitzung widerrufen und der WebSocket-Client mit dem Hinweis `Session superseded` getrennt.
- **Security-Header**: Express ist über `helmet` mit strikter Content Security Policy (CSP) und Anti-Clickjacking-Headern geschützt.
- **Rate Limiting**: IP-basierte Ratenbegrenzung auf Login-, Registrierungs- und Score-Endpunkten verhindert Brute-Force- und Denial-of-Service-Angriffe.

---

## 🌐 Multiplayer-Sicherheit & Anti-Cheat

- **Zufällige Raumcodes**: 6-stellige kryptografische Codes (`crypto.randomBytes(3).toString('hex').toUpperCase()`).
- **Raum- & Spieler-Ownership**:
  - Jeder Spieler erhält eine eindeutige `playerId`, die an seine verifizierte Benutzersitzung gekoppelt ist.
  - Ein Spieler kann **nur** seinen eigenen Status aktualisieren. Manipulationsversuche an fremden Spielern werden serverseitig mit `403 Forbidden` abgewiesen.
- **Plausibilitäts- & Bounds-Validierung**:
  - Scores, Kills, Health und Wellenwerte unterliegen strikten mathematischen Grenzen.
  - Sprunghafte, unplausible Änderungen (z. B. Wellensprünge, unrealistische Kills pro Sekunde) werden mit `400 Bad Request` zurückgewiesen.
- **Raum-Bereinigung**: Inaktive Räume werden nach 10 Minuten Inaktivität automatisch aus Speicher und Datenbank entfernt.
- **WebSocket-Absicherung**: Origin-Prüfung, Heartbeat-Ping/Pong alle 30 Sekunden zur Erkennung toter Verbindungen und automatische WSS/WS-Protokollerkennung im Frontend.

### ⚠️ Wichtige Einschränkung (Transparenzhinweis)
> Das Spiel nutzt eine **Client-seitige Three.js-Physiksimulation** mit serverseitigen Plausibilitätsprüfungen.
> Das bedeutet: Triviales REST-Spammen, Manipulieren fremder Spieler, Session-Kapern und Score-Exploits sind wirksam unterbunden. Ein modifizierter Spiel-Client könnte jedoch theoretisch lokale Treffer (z. B. Aimbot im Three.js Canvas) vortäuschen, solange diese innerhalb der serverseitigen Plausibilitätsgrenzen bleiben. Eine 100 % cheat-sichere Lösung würde eine voll autoritative, headless Server-Physiksimulation (Tickrate-Engine) erfordern.

---

## 📜 Datenschutz (DSGVO) & Rechtliches

- **Datensparsamkeit**: Gespeichert werden ausschließlich der gewählte Benutzername, das Clantag, die Fraktion, ein scrypt-gehashtes Passwort, der Zeitstempel der Registrierung sowie aggregierte Spielstatistiken (Punkte, Kills, Siege).
- **Auskunftsrecht (Art. 15 DSGVO)**: Über `/api/auth/export` können angemeldete Spieler jederzeit eine vollständige JSON-Kopie aller gespeicherten personenbezogenen Daten exportieren.
- **Recht auf Vergessenwerden (Art. 17 DSGVO)**: Über `/api/auth/delete` kann das Konto nach erneuter Passwortbestätigung unwiderruflich gelöscht werden (löscht Konto, Sitzungen und Leaderboard-Einträge).
- **Vor einer öffentlichen Bereitstellung erforderlich**:
  - Ergänzung eines rechtskonformen **Impressums** gemäß § 5 DDG.
  - Ergänzung einer vollständigen, individuellen **Datenschutzerklärung** gemäß Art. 13 DSGVO.
  - Anpassung der Cookie- und Einwilligungs-Banner an die konkrete Hosting- und Domain-Situation.
