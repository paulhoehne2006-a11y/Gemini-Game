# Account authentication backend

The server exposes:

- `POST /api/auth/register` with `{ "username": string, "password": string, "clanTag": string, "faction": "neu-anspach" | "wehrheim", "legalConsent": object }`
- `POST /api/auth/login` with `{ "username": string, "password": string }`
- `GET /api/auth/me` to retrieve the current account
- `POST /api/auth/logout` to revoke the current session

Successful register/login responses set one `HttpOnly`, `SameSite=Strict` session cookie. The browser therefore has one active account identity for this session; logout revokes the opaque server-side session token. Successful responses include the public account profile (`username`, `clanTag`, and `faction`) but never passwords or password hashes. Passwords are never stored directly: they are salted and hashed with Node's built-in `scrypt`, and session tokens are stored only as SHA-256 hashes. Authentication endpoints are rate limited per client address.

The default `AuthStore` persists to `data/accounts.json`, selected by `AUTH_DATA_FILE`. This is a safe local-development fallback, not a guarantee of production durability: ephemeral containers, multiple replicas without a shared filesystem, and concurrent writers can lose or diverge state. Production deployment must provide a shared durable filesystem or replace `AuthStore` with a transactional database adapter while keeping the same store interface. Set `AUTH_SECURE_COOKIE=true` when serving over HTTPS (production defaults to secure cookies).

The game leaderboard remains a separate legacy store. Account authentication does not automatically trust the unauthenticated leaderboard submission endpoints; those endpoints should be migrated to `requireAccount` before treating scores as authoritative.
