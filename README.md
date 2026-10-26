# 🎮 Gemini-Game: Neu-Anspach 61267 Battle Royale & Tycoon

Ein produktionsbereites 3D-Third-Person-Battle-Royale- und Tycoon-Spiel, entwickelt mit **React 19**, **Three.js**, **Express**, **WebSockets**, **Neon Serverless PostgreSQL** und **TypeScript**.

Das Spiel bietet authentische Schauplätze der Stadt Neu-Anspach (Freilichtmuseum Hessenpark, Waldschwimmbad, Bahnhof Taunusbahn, Bürgerhaus, Taunus-Center, Adolf-Reichwein-Schule, Feldbergblick), Gunsmith-Waffen-Upgrades, ein Echtzeit-Leaderboard, Co-op-Multiplayer sowie **duale Authentifizierung** (Pseudonym + Passwort oder **„Anmelden mit Google“** via Google OAuth 2.0 / OpenID Connect).

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

Das Projekt verfügt über eine umfassende Testsuite (Auth, Passwörter, scrypt, Google OAuth, Sessions, Single-Session-Enforcement, CSRF-Schutz, Multiplayer-Ownership, Anti-Cheat-Bounds und WebSockets):

```bash
# Gesamte Backend- & Komponenten-Testsuite ausführen
npm test

# TypeScript-Typüberprüfung
npm run lint

# Produktionsbuild testen
npm run build
```

---

## ⚙️ Umgebungsvariablen & Konfiguration

Kopiere `.env.example` nach `.env` bzw. hinterlege folgende Variablen im Dashboard von **Render**:

| Variable | Standardwert | Beschreibung |
| :--- | :--- | :--- |
| `PORT` | `3000` | Port für Express & WebSockets (wird bei Render automatisch gesetzt). |
| `NODE_ENV` | `development` | Auf `production` setzen für optimierte statische Auslieferung und strikte HTTPS-Cookies. |
| `DATABASE_URL` | *(leer)* | **Neon PostgreSQL** Connection String (inkl. `?sslmode=require`). Bleibt dieser leer, nutzt der Server lokal automatisch SQLite. |
| `SQLITE_DB_PATH` | `data/game.sqlite` | Dateipfad zur lokalen SQLite-Datenbank (Fallback für lokale Entwicklung). |
| `DB_SSL_REJECT_UNAUTHORIZED` | `false` | TLS-Zertifikatsprüfung für Cloud-PostgreSQL-Verbindungen (Neon / Render). |
| `AUTH_COOKIE_NAME` | `gemini_game_session` | Name des sicheren `HttpOnly`-Sitzungscookies. |
| `AUTH_SESSION_TTL_MS` | `2592000000` | Sitzungsdauer in Millisekunden (Standard: 30 Tage). |
| `AUTH_SECURE_COOKIE` | `true` (in Prod) | Auf `true` setzen, sobald die Anwendung über HTTPS ausgeliefert wird. |
| `GOOGLE_CLIENT_ID` | *(leer)* | OAuth 2.0 Client-ID aus der Google Cloud Console für „Anmelden mit Google“. |
| `VITE_GOOGLE_CLIENT_ID` | *(leer)* | Identische Google Client-ID für das Frontend (Google Identity Services Button). |
| `GOOGLE_CLIENT_SECRET` | *(leer)* | OAuth 2.0 Client-Secret für den serverseitigen Authorization-Code-Flow (`/api/auth/google/callback`). |
| `GOOGLE_CALLBACK_URL` | *(automatisch)* | Explizite Redirect-URI (z. B. `https://deine-app.onrender.com/api/auth/google/callback`). |
| `VITE_LEGAL_OPERATOR_NAME` | *(Platzhalter)* | Vollständiger Name des Betreibers für das Impressum gemäß § 5 DDG. |
| `VITE_LEGAL_OPERATOR_ADDRESS` | *(Platzhalter)* | Ladungsfähige Anschrift für das Impressum gemäß § 5 DDG. |
| `VITE_LEGAL_CONTACT_EMAIL` | `datenschutz@...` | Kontakt-E-Mail-Adresse für Datenschutzanfragen (DSGVO) und Impressum. |
| `ALLOWED_ORIGINS` | *(leer)* | Kommagetrennte Liste erlaubter Domains für CORS und WebSockets. |

> ⚠️ **Wichtig**: Hinterlege niemals echte Passwörter, `GOOGLE_CLIENT_SECRET` oder produktive `DATABASE_URL`-Strings im Git-Repository!

---

## 🗄️ Datenbank & Persistenz (Neon Serverless PostgreSQL & SQLite)

Die Anwendung nutzt eine transaktionale Speicherabstraktion (`GameStorage` in `src/server/storage.ts`):

1. **Produktion (Neon Serverless PostgreSQL)**:
   - Sobald `DATABASE_URL` gesetzt ist, verbindet sich das Backend über TLS (`sslmode=require`) mit deiner **Neon PostgreSQL**-Datenbank.
   - Beim Start werden alle benötigten Tabellen (`accounts`, `sessions`, `leaderboard`, `derby_stats`, `live_events`, `rooms`) inklusive Schema-Migrationen für Google OAuth (`auth_provider`, `google_sub`, `email`, `avatar_url`) automatisch per `CREATE TABLE IF NOT EXISTS` und `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` angelegt.
2. **Lokale Entwicklung (SQLite)**:
   - Verwendet das in Node.js 22 integrierte `node:sqlite` mit Write-Ahead-Logging (WAL) unter `data/game.sqlite`.

---

## 🚢 Schritt-für-Schritt Deployment: Render + Neon SQL + Google OAuth 2.0

### Schritt 1: Neon Serverless PostgreSQL einrichten
1. Melde dich unter [console.neon.tech](https://console.neon.tech) an und erstelle ein neues Projekt (empfohlene Region für DSGVO-Konformität: **AWS Europe (Frankfurt) — `eu-central-1`**).
2. Kopiere im Neon-Dashboard unter **Connection Details** den **Connection String** (Pooled oder Direct Connection), z. B.:
   ```text
   postgresql://neondb_owner:dein_passwort@ep-cool-taunus-123456-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
3. Diesen Wert hinterlegst du später auf Render als `DATABASE_URL`.

### Schritt 2: Google OAuth 2.0 („Anmelden mit Google“) in der Google Cloud Console einrichten
1. Öffne die [Google Cloud Console](https://console.cloud.google.com/).
2. Wähle oder erstelle ein Projekt und navigiere zu **APIs & Services → OAuth consent screen (OAuth-Zustimmungsbildschirm)**:
   - User Type: **External** (Extern)
   - App-Name: `Neu-Anspach 61267: Battle Royale`
   - Support-E-Mail & Entwicklerkontakt hinterlegen
   - Scopes: `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`
3. Navigiere zu **APIs & Services → Credentials (Anmeldedaten) → + Create Credentials → OAuth client ID**:
   - Application type: **Web application**
   - **Authorized JavaScript origins (Autorisierte JavaScript-Quellen)**:
     - `https://deine-app.onrender.com`
     - `http://localhost:3000` *(für lokale Tests)*
   - **Authorized redirect URIs (Autorisierte Weiterleitungs-URIs)**:
     - `https://deine-app.onrender.com/api/auth/google/callback`
     - `http://localhost:3000/api/auth/google/callback` *(für lokale Tests)*
4. Kopiere die erzeugte **Client ID** und das **Client Secret**.

### Schritt 3: Web Service auf Render.com bereitstellen
1. Erstelle einen neuen **Web Service** auf [render.com](https://render.com) und verbinde dein GitHub-Repository.
2. Konfiguriere folgende Einstellungen:
   - **Region**: `Frankfurt (EU Central)`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
3. Trage unter **Environment Variables** in Render folgende Werte ein:
   - `NODE_ENV` = `production`
   - `AUTH_SECURE_COOKIE` = `true`
   - `DATABASE_URL` = *(Dein Neon PostgreSQL Connection String aus Schritt 1)*
   - `GOOGLE_CLIENT_ID` = *(Deine Google OAuth Client-ID aus Schritt 2)*
   - `VITE_GOOGLE_CLIENT_ID` = *(Deine Google OAuth Client-ID aus Schritt 2)*
   - `GOOGLE_CLIENT_SECRET` = *(Dein Google OAuth Client-Secret aus Schritt 2)*
   - `GOOGLE_CALLBACK_URL` = `https://deine-app.onrender.com/api/auth/google/callback`
   - `VITE_LEGAL_OPERATOR_NAME` = `Dein Vor- und Nachname / Betreibername`
   - `VITE_LEGAL_OPERATOR_ADDRESS` = `Deine Straße Hausnr., PLZ Ort, Deutschland`
   - `VITE_LEGAL_CONTACT_EMAIL` = `deine-kontakt-email@domain.de`
4. Klicke auf **Deploy Web Service**.

---

## 🔒 Sicherheitsarchitektur & Authentifizierung

- **Zwei Anmeldewege**:
  1. **Lokales Pseudonym-Konto**: Frei wählbarer Benutzername + starkes Passwort, gehasht mit Scrypt (`N=16384, r=8, p=1`, 64-Byte Key) und individuellem 16-Byte Salt (`crypto.randomBytes(16)`).
  2. **Google Sign-In (OAuth 2.0 / OIDC)**: Unterstützt sowohl den serverseitigen Authorization-Code-Redirect-Flow (`GET /api/auth/google` → `/api/auth/google/callback` mit `HttpOnly` State-Nonce-Cookie) als auch die direkte Google Identity Services ID-Token-Verifizierung (`POST /api/auth/google`).
- **Schutz vor User-Enumeration**: Konstante Dummy-Scrypt-Hashes bei unbekannten Benutzernamen oder reinen Google-Konten verhindern Timing-Attacks.
- **Session-Tokens**: 32 Bytes kryptografisch zufällig (`base64url`), in der Neon-SQL-Datenbank ausschließlich als SHA-256-Hash gespeichert.
- **HttpOnly-Cookies**: Das Session-Token wird über geschützte `HttpOnly; Secure` Cookies transportiert.
- **CSRF-Schutz**: Bei allen zustandsverändernden REST-Anfragen (`POST`, `PUT`, `DELETE`) wird ein sitzungsgebundenes CSRF-Token im `X-CSRF-Token`-Header validiert.
- **Single-Active-Session**: Pro Account ist jeweils nur eine aktive Gerätesitzung gestattet. Bei Neuanmeldung auf einem anderen Gerät wird die alte Sitzung widerrufen und der WebSocket-Client mit `Session superseded` getrennt.

---

## 📜 Datenschutz (DSGVO), Impressum (§ 5 DDG) & TDDDG

Die integrierte Rechts- und Datenschutz-Ansicht (`src/components/LegalModal.tsx`) informiert Nutzer transparent über:
- **Impressum (§ 5 DDG)**: Anbieterkennzeichnung, ladungsfähige Anschrift und Kontakt über `VITE_LEGAL_OPERATOR_NAME`, `VITE_LEGAL_OPERATOR_ADDRESS` und `VITE_LEGAL_CONTACT_EMAIL`.
- **Hosting auf Render (Art. 28 & Art. 6 Abs. 1 lit. f DSGVO)**: Verarbeitung technisch notwendiger Verbindungsdaten und Server-Logs bei Render Services, Inc.
- **Datenbank bei Neon (Art. 28 & Art. 6 Abs. 1 lit. b DSGVO)**: Speicherung von Konten, Sitzungs-Hashes und Ranglisten in einer TLS-verschlüsselten Serverless-PostgreSQL-Datenbank bei Neon, Inc.
- **Google Sign-In (Art. 6 Abs. 1 lit. a & b DSGVO)**: Optionale Übermittlung von Google-ID (`sub`), E-Mail-Adresse, Anzeigename und Profilbild-URL bei Nutzung von Google OAuth; volle Pseudonym-Alternative ohne E-Mail verfügbar.
- **Technisch notwendige Cookies (§ 25 Abs. 2 Nr. 2 TDDDG)**: Ausschließlicher Einsatz technisch erforderlicher Sicherheits-Cookies (`gemini_game_session`, `gemini_google_oauth_state`), keinerlei Werbe- oder Tracking-Cookies.
- **Selbstbedienungs-Export & Kontolöschung (Art. 15, 17, 20 DSGVO)**: Sofortiger JSON-Datenexport (`GET /api/auth/export`) und unwiderrufliche Kontolöschung (`POST /api/auth/delete`) direkt im Operator-Profil.
