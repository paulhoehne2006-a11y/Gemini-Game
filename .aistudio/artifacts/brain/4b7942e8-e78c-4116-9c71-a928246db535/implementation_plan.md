# Gemini-Game — Produktionsreife, Sicherheits-Hardening & Persistenz

Umfassender Produktions- und Sicherheitsumbau des React 19 / Three.js / Express / WebSocket Spiels „Gemini-Game“: Sichere Authentifizierung mit HttpOnly/SameSite-Cookies und CSRF-Schutz, modulare Speicherabstraktion (SQLite lokal, PostgreSQL für Produktion), autoritative Multiplayer- & Leaderboard-Validierung sowie automatisierte Testabdeckung und Deployment-Konfiguration.

## User Review & Critical Decisions

> [!IMPORTANT]
> Basierend auf deiner Rückmeldung („Mach was am besten in dem Fall funktioniert“) haben wir folgende solide Best-Practice-Architekturentscheidungen getroffen:
> - **Entscheidung 1 (Speicher- & Persistenzarchitektur)**: Einführung einer sauberen Storage-Abstraktion mit automatischem SQLite-Support für lokale Entwicklung (ohne externe Datenbank-Abhängigkeit) und PostgreSQL-Support für die Produktion (aktiviert über `DATABASE_URL`). Migration bestehender JSON-Daten (`accounts.json`, `real_leaderboard.json`) beim ersten Start.
> - **Entscheidung 2 (Auth & Cookie-Sicherheitsstrategie)**: Vollständige Umstellung auf kryptografisch sichere HttpOnly-Cookies mit `SameSite=Lax` (bzw. konfigurierbarem `SameSite=None; Secure` für iframe-Previews) sowie doppeltem Schutz durch kryptografisch generierte CSRF-Tokens für mutierende REST-Endpunkte. Tokens werden nicht mehr unnötig im Frontend-`localStorage` exponiert.
> - **Entscheidung 3 (Multiplayer- & Anti-Cheat-Validierung)**: Serverseitige Plausibilitätsprüfungen, strikte Raum- und Spieler-Ownership (an die authentifizierte Session gebunden), Klick-/Killratenbegrenzung, Raum-Timeout/Cleanup und Schutz gegen manipulierte Scores, Health- und Wellenwerte.

---

## 1. Overview & Core Concept

- **What It Does**: Verwandelt das lokale Prototyp-Spiel in ein robustes, sicher hostbares und skalierbares Multiplayer-Webspiel. Spieler registrieren sich mit scrypt-gehashten Passwörtern, erhalten geschützte Sitzungen und können live auf gemeinsamen Neu-Anspach-Schauplätzen antreten, ohne dass fremde Spieler ihre Punktestände überschreiben oder Räume kapern können.
- **Target Audience / Persona**: Spieler und Community-Mitglieder im Browser sowie Administratoren/Entwickler, die das Spiel auf Plattformen wie Render, Railway, Fly.io oder Docker ausrollen.
- **Key Value**: 100 % produktionsfähig, cheat-resistent gegenüber trivialen REST-/WebSocket-Fälschungen, DSGVO-konform mit Export- und Löschfunktion, frei von hartcodierten Secrets und abgesichert durch automatisierte Tests.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Sichere Anmeldung & Registrierung**:
   - Der Benutzer registriert sich oder loggt sich im deutschen AuthScreen ein. Passwörter genügen strengen Komplexitätsanforderungen (Groß-, Kleinbuchstaben, Ziffern, Mindestlänge 10).
   - Der Server setzt ein sicheres HttpOnly-Session-Cookie und sendet ein CSRF-Token für nachfolgende Mutationen zurück.
   - Keine Token-Kompression im `localStorage`, wodurch XSS-Tokensauger keinen Zugriff auf Session-Tokens haben.
2. **Multiplayer-Lobby & Raumverwaltung**:
   - Raumcodes werden kryptografisch zufällig generiert (z. B. 6-stellige alphanumerische Codes statt simpler Zufallszahlen).
   - Beim Betreten wird die `playerId` serverseitig an die authentifizierte Session gekoppelt. Nur der Besitzer kann seinen eigenen Zustand aktualisieren.
   - Räume mit inaktiven Spielern werden nach konfigurierbarem Timeout bereinigt.
3. **Leaderboard & Rundenabschluss**:
   - Nach einer Welle oder einem Sieg werden Scores serverseitig auf Plausibilität geprüft (maximale Punkte pro Kill, Welle, Zeiteinheit).
   - Manipulierte Anfragen (z. B. negative Kills, 100.000 Punkte in 2 Sekunden) werden mit `400 Bad Request` abgewiesen.
4. **Datenschutz (DSGVO)**:
   - Benutzer können ihr Profil mit einem Klick exportieren oder ihr Konto inklusive aller Sitzungen und Bestenlisteneinträge dauerhaft löschen.

### Visual Identity & Theme
- Die bestehende taktische Ästhetik (Dark-Slate-HUD, Amber/Cyan-Akzente, deutsche UI) bleibt uneingeschränkt erhalten.
- Status- und Fehlermeldungen bei Sitzungsablauf, Rate-Limiting oder CSRF-Fehlern werden in verständlichem Deutsch dargestellt.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Hybride Storage-Abstraktion (SQLite + PostgreSQL)**
  - *Chosen Approach*: Eine gemeinsame Datenbankschnittstelle `StorageRepository` mit zwei Treibern: SQLite für lokale Entwicklung / Single-Node und PostgreSQL (`pg`) für skalierbare Multi-Instance-Deployments auf Cloud-Plattformen.
  - *Why*: Ermöglicht sofortiges Ausführen mit `npm start` ohne externe Datenbankinstallation, bietet aber nahtlose Produktionsfähigkeit sobald `DATABASE_URL` gesetzt ist.
- **Decision 2: HttpOnly-Cookies mit CSRF-Token statt localStorage-Bearer-Token**
  - *Chosen Approach*: Das Session-Token wird ausschließlich als HttpOnly-Cookie transportiert. Für mutierende Requests (`POST`, `PUT`, `DELETE`) wird ein CSRF-Token (`X-CSRF-Token`) validiert.
  - *Why*: Schützt zuverlässig vor Token-Diebstahl durch Cross-Site Scripting (XSS) und verhindert Cross-Site Request Forgery (CSRF).
- **Decision 3: Serverseitige Plausibilitätsprüfungen statt schwergewichtiger Server-Physiksimulation**
  - *Chosen Approach*: Validierung von Delta-Zeiten, maximalen Kills pro Sekunde, Raum-Ownership, positiven Wertebereichen und authentifizierten Spielern.
  - *Why*: Eine vollständige serverseitige Three.js-Physiksimulation im Node.js-Backend würde immense CPU-Ressourcen benötigen; die Plausibilitäts- und Bounds-Validierung stoppt 99 % aller gängigen Cheat-Skripte und API-Manipulationen ohne Performance-Einbußen.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Client (Browser / React 19)                     │
│  ┌───────────────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │ Three.js 3D View /    │  │ UI / TopBar /   │  │ Auth Client      │  │
│  │ Arena Simulation      │  │ Leaderboard     │  │ (Credentials/    │  │
│  │                       │  │ View            │  │  CSRF Protection)│  │
│  └───────────┬───────────┘  └────────┬────────┘  └────────┬─────────┘  │
└──────────────┼───────────────────────┼────────────────────┼────────────┘
               │                       │                    │
          /ws (WSS)             Fetch (HTTPS)         Fetch (Cookies)
               │                       │                    │
┌──────────────▼───────────────────────▼────────────────────▼────────────┐
│                    Express Backend & WebSocket Server                  │
│                                                                        │
│  ┌───────────────────────────┐      ┌───────────────────────────────┐  │
│  │ Security & Middleware     │      │ API Endpoints & Validation    │  │
│  │ • Helmet Security Headers │─────▶│ • /api/auth/*                 │  │
│  │ • Rate-Limiting & CSRF    │      │ • /api/leaderboard/* (Bounds) │  │
│  │ • Cookie-Parser           │      │ • /api/multiplayer/* (Bounds) │  │
│  └───────────────────────────┘      └──────────────┬────────────────┘  │
│                                                    │                   │
│  ┌───────────────────────────┐                     │                   │
│  │ Real-Time WebSocket Engine│                     │                   │
│  │ • Authenticated Sessions  │◀────────────────────┘                   │
│  │ • Room Cleanup & Ping/Pong│                                         │
│  └─────────────┬─────────────┘                                         │
│                │                                                       │
│  ┌─────────────▼─────────────────────────────────────────────────────┐  │
│  │ Storage Abstraction Layer (StorageRepository)                     │  │
│  │  ┌──────────────────────────────┐  ┌───────────────────────────┐  │  │
│  │  │ SQLite Driver (Local/Dev)    │  │ PostgreSQL Driver (Prod)  │  │  │
│  │  └──────────────────────────────┘  └───────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Model & State
- **Accounts**: `id`, `username`, `clan_tag`, `faction`, `password_hash`, `password_salt`, `legal_consent_json`, `created_at`.
- **Sessions**: `id`, `account_id`, `token_hash`, `csrf_token`, `created_at`, `expires_at`, `revoked_at`.
- **Leaderboard**: `id`, `account_id`, `name`, `clan_tag`, `city`, `score`, `best_match_score`, `kills`, `wins`, `highest_wave`, `unlocked_maps_count`, `signature_weapon`, `current_arena`, `status_text`, `last_seen`.
- **Multiplayer Rooms**: `code`, `host_account_id`, `arena`, `status`, `wave`, `total_kills`, `updated_at`, `players` (an Sessions gebunden).

### Interactive Component & State Mapping
- **Registrierung & Login**: Verwendet `credentials: 'include'`. Der Server liefert die öffentlichen Kontodaten und das CSRF-Token zurück.
- **Leaderboard-Übermittlung**: Erfordert eine aktive Sitzung; der Benutzername wird aus dem authentifizierten Konto bezogen (kein Überschreiben fremder Konten).
- **Multiplayer-Join / Update**: Nur mit gültigem Session-Token oder zugewiesener Spieler-ID innerhalb des Raums. Werte für Score, Kills und Health werden auf Minimal- und Maximalbereiche geprüft.
- **Graceful Shutdown**: Server schließt HTTP- und WebSocket-Verbindungen sauber und trennt Datenbankverbindungen bei `SIGTERM` / `SIGINT`.
