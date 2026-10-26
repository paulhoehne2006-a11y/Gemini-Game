# Account Authentication & Identity Architecture

The server exposes a dual authentication system supporting both pseudonymous username/password accounts and **Google Sign-In (OAuth 2.0 / OpenID Connect)**, backed by **Neon Serverless PostgreSQL** in production (or SQLite in local development).

## REST Endpoints

### 1. Local Username & Password Authentication
- `POST /api/auth/register` — Creates a local account with `{ "username": string, "password": string, "clanTag": string, "faction": "neu-anspach" | "wehrheim", "legalConsent": object }`.
- `POST /api/auth/login` — Authenticates an existing local account with `{ "username": string, "password": string }`.

### 2. Google OAuth 2.0 / OpenID Connect ("Anmelden mit Google")
- `GET /api/auth/google/config` — Returns public Google OAuth configuration (`googleClientId`, `oauthRedirectEnabled`, `gisEnabled`, `callbackUrl`).
- `GET /api/auth/google` — Initiates the OAuth 2.0 Authorization Code Redirect flow with Google, setting a short-lived (10-minute), `HttpOnly`, signed CSRF state cookie (`gemini_google_oauth_state`).
- `GET /api/auth/google/callback` — Verifies the OAuth `state` parameter against the state cookie, exchanges the authorization `code` with `https://oauth2.googleapis.com/token`, fetches the verified user profile from `https://openidconnect.googleapis.com/v1/userinfo`, creates or links the Operator account by Google `sub`, sets the session cookie, and redirects to `/`.
- `POST /api/auth/google` — Verifies a Google Identity Services (GIS) ID token (`credential`) via Google's token verification endpoint, or handles explicit local development/test simulation when `NODE_ENV !== 'production'`.

### 3. Session Management & GDPR Self-Service (Art. 15, 17, 20 DSGVO)
- `GET /api/auth/me` — Retrieves the currently authenticated `PublicAccount` and active `csrfToken`.
- `POST /api/auth/logout` — Revokes the current session in the database and clears the session cookie.
- `PUT /api/auth/profile` — Updates the operator's `clanTag` (requires valid `X-CSRF-Token`).
- `GET /api/auth/export` — Exports a complete machine-readable JSON archive of the authenticated user's account record, auth provider metadata, legal consent timestamp, and processor disclosures (Render, Neon, Google).
- `POST /api/auth/delete` — Permanently deletes the account, active sessions, and leaderboard entries from Neon PostgreSQL / SQLite. Password-based accounts confirm with their password; Google OAuth accounts confirm with `LÖSCHEN`, `DELETE`, or their username.

## Security & Storage Guarantees

- **Password Hashing**: Passwords are never stored in plaintext. They are salted (`16 bytes` via `crypto.randomBytes`) and hashed using Node's `crypto.scryptSync` (`N=16384, r=8, p=1`, 64-byte key) and verified with `crypto.timingSafeEqual`.
- **Session Tokens**: 32-byte random `base64url` tokens are transported via `HttpOnly` cookies (`gemini_game_session`) and stored in the `sessions` table strictly as SHA-256 hashes.
- **Single Active Session Policy**: Creating a new session automatically revokes any previous active sessions for the same account and notifies superseded WebSocket connections (`4001 Session superseded`).
- **Database Persistence**: Configured via `DATABASE_URL` (Neon Serverless PostgreSQL with `?sslmode=require`) or `SQLITE_DB_PATH` (`data/game.sqlite` fallback).
