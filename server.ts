import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'node:fs';
import { fileURLToPath } from 'url';
import crypto from 'node:crypto';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import {
  AuthConflictError,
  AuthStore,
  AuthValidationError,
  authConfig,
  PublicAccount,
} from './auth.ts';
import {
  createStorage,
  GameStorage,
  StoredLeaderboardEntry,
  StoredDerbyStats,
  StoredLiveFeedEvent,
  StoredRoom,
  StoredRoomPlayer,
} from './src/server/storage.ts';

dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
export const server = http.createServer(app);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Security Headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'", 'ws:', 'wss:', 'http:', 'https:'],
        mediaSrc: ["'self'", 'blob:', 'data:'],
        workerSrc: ["'self'", 'blob:'],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '50kb' }));

// CORS configuration (allowlist if specified)
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : [];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.length > 0) {
    if (ALLOWED_ORIGINS.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token, Authorization');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    }
  } else if (!origin) {
    // Same-origin default
  }
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// Storage and AuthStore
export let storage: GameStorage;
export let authStore: AuthStore;

// ---------------------------------------------------------------------------
// Real-Time Visitor & Geo-Location Analytics (Render Console Logger)
// ---------------------------------------------------------------------------
interface VisitorRecord {
  timestamp: string;
  maskedIp: string;
  account: string;
  location: string;
  device: string;
  action: string;
}

const geoCache = new Map<string, { location: string; country: string }>();
const recentVisitorLogs = new Map<string, number>();
const knownUniqueIps = new Set<string>();
export const ipAccountMap = new Map<string, string>();
const cityCounters: Record<string, number> = {};
const accountCounters: Record<string, number> = {};
const deviceCounters: Record<string, number> = {};
const recentVisitorList: VisitorRecord[] = [];
let totalVisitorCounter = 0;

function anonymizeIp(ip: string): string {
  const clean = ip.trim();
  if (clean.includes('.')) {
    const parts = clean.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.***`;
    }
  } else if (clean.includes(':')) {
    const parts = clean.split(':');
    return `${parts.slice(0, 3).join(':')}:****`;
  }
  return clean;
}

function parseDevice(userAgent?: string): string {
  if (!userAgent) return 'Unbekanntes Gerät';
  const ua = userAgent.toLowerCase();
  let os = 'Desktop';
  if (ua.includes('iphone') || ua.includes('ipad')) os = '📱 iOS';
  else if (ua.includes('android')) os = '📱 Android';
  else if (ua.includes('windows')) os = '💻 Windows PC';
  else if (ua.includes('macintosh') || ua.includes('mac os')) os = '💻 Mac';
  else if (ua.includes('linux')) os = '💻 Linux';

  let browser = 'Browser';
  if (ua.includes('edg/')) browser = 'Edge';
  else if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('firefox')) browser = 'Firefox';

  return `${os} (${browser})`;
}

async function resolveVisitorAccount(req: express.Request, rawIp: string): Promise<string> {
  try {
    if (authStore) {
      const token = extractRequestToken(req);
      if (token) {
        const sessionData = await authStore.getSession(token);
        if (sessionData?.account) {
          const accTag = `[${sessionData.account.clanTag}] ${sessionData.account.username}`;
          ipAccountMap.set(rawIp, accTag);
          return accTag;
        }
      }
    }
  } catch {}

  if (ipAccountMap.has(rawIp)) {
    return ipAccountMap.get(rawIp)!;
  }
  return 'Gast (Nicht angemeldet)';
}

async function resolveGeo(ip: string, headers: http.IncomingHttpHeaders): Promise<{ location: string; country: string }> {
  const cfCountry = headers['cf-ipcountry'] as string;
  const cfCity = headers['cf-ipcity'] as string;
  if (cfCountry && cfCity) {
    return { location: `${decodeURIComponent(cfCity)}, ${cfCountry}`, country: cfCountry };
  }

  if (geoCache.has(ip)) {
    return geoCache.get(ip)!;
  }

  if (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip === 'localhost' ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    ip.startsWith('172.16.')
  ) {
    const local = { location: 'Lokales Netzwerk / Dev', country: 'DE' };
    geoCache.set(ip, local);
    return local;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2200);
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = (await res.json()) as any;
      if (data.status === 'success') {
        const cityPart = data.city || '';
        const regionPart = data.regionName ? `, ${data.regionName}` : '';
        const countryPart = data.country ? `, ${data.country}` : '';
        const loc = cityPart ? `${cityPart}${regionPart}${countryPart}` : data.country || 'Global';
        const info = { location: loc, country: data.country || 'DE' };
        geoCache.set(ip, info);
        return info;
      }
    }
  } catch {}

  const fallback = { location: 'Online-Besucher', country: 'DE' };
  geoCache.set(ip, fallback);
  return fallback;
}

// Log incoming visitors in Render console with location, device & authenticated account
app.use((req, res, next) => {
  const p = req.path;
  if (
    p.startsWith('/assets') ||
    p.endsWith('.js') ||
    p.endsWith('.css') ||
    p.endsWith('.png') ||
    p.endsWith('.ico') ||
    p.endsWith('.svg') ||
    p.endsWith('.map') ||
    p.endsWith('.woff') ||
    p.endsWith('.woff2')
  ) {
    return next();
  }

  const rawIp =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    '127.0.0.1';

  const now = Date.now();
  const lastLog = recentVisitorLogs.get(rawIp) || 0;
  const isAction = req.method === 'POST' || p.startsWith('/api/');

  // Throttle regular page loads to once every 2 minutes per IP
  if (isAction || now - lastLog > 120000) {
    recentVisitorLogs.set(rawIp, now);
    totalVisitorCounter += 1;
    knownUniqueIps.add(anonymizeIp(rawIp));

    const device = parseDevice(req.headers['user-agent']);
    deviceCounters[device] = (deviceCounters[device] || 0) + 1;

    Promise.all([resolveGeo(rawIp, req.headers), resolveVisitorAccount(req, rawIp)])
      .then(([geo, accountTag]) => {
        cityCounters[geo.location] = (cityCounters[geo.location] || 0) + 1;
        accountCounters[accountTag] = (accountCounters[accountTag] || 0) + 1;
        const masked = anonymizeIp(rawIp);
        const timeStr = new Date().toLocaleTimeString('de-DE', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        const actionLabel = p === '/' ? 'Startseite geöffnet' : `${req.method} ${p}`;

        const entry: VisitorRecord = {
          timestamp: timeStr,
          maskedIp: masked,
          account: accountTag,
          location: geo.location,
          device,
          action: actionLabel,
        };
        recentVisitorList.unshift(entry);
        if (recentVisitorList.length > 30) recentVisitorList.pop();

        if (process.env.NODE_ENV !== 'test') {
          console.log(
            `🌍 [Besucher ${timeStr}] IP: ${masked} · Account: ${accountTag} · Ort: ${geo.location} · Gerät: ${device} · ${actionLabel}`
          );
        }
      })
      .catch(() => {});
  }

  next();
});

// Visitor Analytics Overview Endpoint
app.get('/api/analytics/visitors', (_req, res) => {
  res.json({
    totalVisits: totalVisitorCounter,
    uniqueIps: knownUniqueIps.size,
    topLocations: cityCounters,
    topAccounts: accountCounters,
    devices: deviceCounters,
    recent: recentVisitorList,
  });
});

// Rate limiting in-memory storage with periodic pruning
interface RateLimitEntry {
  count: number;
  resetAt: number;
}
const rateLimitBuckets = new Map<string, RateLimitEntry>();

function isRateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitBuckets.get(key);
  if (!entry || entry.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  entry.count += 1;
  return entry.count > max;
}

// Prune rate limit buckets periodically
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of rateLimitBuckets.entries()) {
    if (v.resetAt <= now) {
      rateLimitBuckets.delete(k);
    }
  }
}, 60000).unref();

function getClientIp(req: express.Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || '127.0.0.1';
}

function parseCookies(req: express.Request): Record<string, string> {
  if (req.cookies && typeof req.cookies === 'object') {
    return req.cookies;
  }
  const header = req.headers.cookie;
  if (!header) return {};
  return Object.fromEntries(
    header.split(';').flatMap((part) => {
      const separator = part.indexOf('=');
      if (separator < 0) return [];
      return [[part.slice(0, separator).trim(), decodeURIComponent(part.slice(separator + 1).trim())]];
    })
  );
}

function extractRequestToken(req: express.Request): string | undefined {
  const cookies = parseCookies(req);
  if (cookies[authConfig.cookieName]) {
    return cookies[authConfig.cookieName];
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return undefined;
}

function setSessionCookie(req: express.Request, res: express.Response, token: string, expiresAt: string): void {
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https' || authConfig.secureCookie;
  // If running in iframe preview over HTTPS, SameSite=None is required. For standard deployments, SameSite=Lax.
  const sameSite = isHttps ? 'None' : 'Lax';

  res.cookie(authConfig.cookieName, token, {
    httpOnly: true,
    secure: isHttps,
    sameSite: sameSite as any,
    path: '/',
    expires: new Date(expiresAt),
    maxAge: Math.max(0, Date.parse(expiresAt) - Date.now()),
  });
}

function clearSessionCookie(req: express.Request, res: express.Response): void {
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https' || authConfig.secureCookie;
  const sameSite = isHttps ? 'None' : 'Lax';
  res.clearCookie(authConfig.cookieName, {
    httpOnly: true,
    secure: isHttps,
    sameSite: sameSite as any,
    path: '/',
  });
}

// Authentication Middleware
async function currentSessionData(req: express.Request) {
  const token = extractRequestToken(req);
  if (!token) return null;
  return authStore.getSession(token);
}

async function requireAccount(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const sessionData = await currentSessionData(req);
    if (!sessionData) {
      return res.status(401).json({ error: 'Anmeldung erforderlich.' });
    }
    res.locals.account = sessionData.account;
    res.locals.session = sessionData.session;
    res.locals.csrfToken = sessionData.csrfToken;
    next();
  } catch (err) {
    console.error('[Auth] Error checking session:', err);
    res.status(500).json({ error: 'Sitzungsprüfung fehlgeschlagen.' });
  }
}

// CSRF Validation Middleware for state-changing requests
function requireCsrf(req: express.Request, res: express.Response, next: express.NextFunction) {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Exempt auth bootstrap endpoints (login / register) which do not have a session yet
  if (req.path === '/api/auth/login' || req.path === '/api/auth/register') {
    return next();
  }

  const expectedCsrf = res.locals.csrfToken;
  if (!expectedCsrf) {
    // If not authenticated via cookie, requireAccount will reject
    return next();
  }

  const providedCsrf = req.headers['x-csrf-token'] || req.body?.csrfToken;
  if (!providedCsrf || typeof providedCsrf !== 'string' || providedCsrf !== expectedCsrf) {
    return res.status(403).json({ error: 'Ungültiges oder fehlendes CSRF-Sicherheitstoken.' });
  }
  next();
}

// ---------------------------------------------------------------------------
// WebSockets & Real-Time Sync
// ---------------------------------------------------------------------------
interface ClientMeta {
  playerName?: string;
  clanTag?: string;
  accountId?: string;
  sessionToken?: string;
  isAlive?: boolean;
}

const connectedClients = new Map<WebSocket, ClientMeta>();
export const wss = new WebSocketServer({ server, path: '/ws' });

interface ClanRecord {
  id: string;
  tag: string;
  name: string;
  description: string;
  leaderAccountId: string;
  createdAt: string;
}

interface ClanInvitationRecord {
  id: string;
  clanTag: string;
  clanName: string;
  inviterName: string;
  recipientAccountId: string;
  createdAt: string;
  status: 'pending' | 'accepted' | 'declined';
}

interface ClanMessageRecord {
  id: string;
  clanTag: string;
  authorName: string;
  text: string;
  createdAt: string;
}

const clans = new Map<string, ClanRecord>();
const clanInvitations = new Map<string, ClanInvitationRecord>();
const clanMessages = new Map<string, ClanMessageRecord[]>();

async function getClanPayload(account: PublicAccount) {
  const tag = account.clanTag || '61267';
  let record = clans.get(tag);
  if (!record) {
    record = {
      id: `clan_${tag.toLowerCase()}`,
      tag,
      name: `Einsatzgruppe ${tag}`,
      description: 'Gemeinsam für Neu-Anspach.',
      leaderAccountId: account.id,
      createdAt: account.createdAt || new Date().toISOString(),
    };
    clans.set(tag, record);
  }

  const leaderboard = await storage.getLeaderboard();
  const members = leaderboard
    .filter((entry) => entry.clanTag.toUpperCase() === tag.toUpperCase())
    .map((entry) => ({
      accountId: entry.accountId || `leaderboard_${entry.id}`,
      username: entry.name,
      role: entry.accountId === record!.leaderAccountId ? 'leader' : 'member',
      joinedAt: new Date(entry.lastSeen || Date.now()).toISOString(),
      score: entry.score,
      wins: entry.wins,
      kills: entry.kills,
      isOnline: Date.now() - entry.lastSeen < 90000,
    }));

  if (!members.some((member) => member.accountId === account.id)) {
    members.push({
      accountId: account.id,
      username: account.username,
      role: account.id === record.leaderAccountId ? 'leader' : 'member',
      joinedAt: account.createdAt || new Date().toISOString(),
      score: 0,
      wins: 0,
      kills: 0,
      isOnline: true,
    });
  }

  const totalScore = members.reduce((sum, member) => sum + member.score, 0);
  const totalWins = members.reduce((sum, member) => sum + member.wins, 0);
  const totalKills = members.reduce((sum, member) => sum + member.kills, 0);
  const allTags = new Map<string, number>();
  leaderboard.forEach((entry) => allTags.set(entry.clanTag.toUpperCase(), (allTags.get(entry.clanTag.toUpperCase()) || 0) + entry.score));
  allTags.set(tag.toUpperCase(), totalScore);
  const rank = [...allTags.values()].filter((score) => score > totalScore).length + 1;

  return {
    ...record,
    rank,
    totalScore,
    totalWins,
    totalKills,
    memberCount: members.length,
    members,
  };
}

async function broadcastClanMessage(message: ClanMessageRecord) {
  const payload = JSON.stringify({ type: 'clan:message', clanTag: message.clanTag, message });
  connectedClients.forEach((meta, client) => {
    if (meta.clanTag?.toUpperCase() === message.clanTag.toUpperCase() && client.readyState === WebSocket.OPEN) {
      try { client.send(payload); } catch {}
    }
  });
}

function notifySessionSuperseded(accountId: string, currentSessionToken?: string, reason?: string) {
  const payload = JSON.stringify({
    type: 'auth:session_superseded',
    reason:
      reason ||
      'Dein Account wurde auf einem anderen Gerät angemeldet. Aus Sicherheitsgründen kann immer nur 1 aktives Gerät eingeloggt sein.',
  });

  connectedClients.forEach((meta, client) => {
    if (
      meta.accountId === accountId &&
      (!currentSessionToken || (meta.sessionToken && meta.sessionToken !== currentSessionToken)) &&
      client.readyState === WebSocket.OPEN
    ) {
      try {
        client.send(payload);
        client.close(4001, 'Session superseded');
      } catch {}
    }
  });
}

export async function getPublicLeaderboardPayload() {
  const now = Date.now();
  const onlineNames = new Set<string>();
  connectedClients.forEach((meta) => {
    if (meta.playerName) onlineNames.add(meta.playerName.toLowerCase());
  });

  const entries = await storage.getLeaderboard();
  const derbyStats = await storage.getDerbyStats();
  const recentEvents = await storage.getRecentEvents(25);

  const enrichedLeaderboard = entries.map((entry) => ({
    ...entry,
    isOnline:
      onlineNames.has(entry.name.toLowerCase()) || now - (entry.lastSeen || 0) < 90000,
  }));

  return {
    leaderboard: enrichedLeaderboard,
    derbyStats,
    recentEvents,
    onlineCount: Math.max(1, connectedClients.size),
  };
}

export async function broadcastLeaderboardSync() {
  const data = await getPublicLeaderboardPayload();
  const payload = JSON.stringify({
    type: 'leaderboard:sync',
    data,
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(payload);
      } catch {}
    }
  });
}

// WebSocket Heartbeat
const wsHeartbeatInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    const meta = connectedClients.get(ws);
    if (!meta) return;
    if (meta.isAlive === false) {
      connectedClients.delete(ws);
      return ws.terminate();
    }
    meta.isAlive = false;
    try {
      ws.ping();
    } catch {
      ws.terminate();
    }
  });
}, 30000);
wsHeartbeatInterval.unref();

wss.on('connection', async (ws, req) => {
  // Origin verification
  const origin = req.headers.origin;
  const host = req.headers.host;
  if (origin && host) {
    try {
      const url = new URL(origin);
      if (ALLOWED_ORIGINS.length > 0 && !ALLOWED_ORIGINS.includes(origin)) {
        ws.close(4003, 'Forbidden Origin');
        return;
      }
    } catch {
      ws.close(4003, 'Invalid Origin');
      return;
    }
  }

  const meta: ClientMeta = { isAlive: true };
  connectedClients.set(ws, meta);

  ws.on('pong', () => {
    meta.isAlive = true;
  });

  // Check cookie on initial upgrade
  try {
    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
      const cookies = Object.fromEntries(
        cookieHeader.split(';').flatMap((part) => {
          const sep = part.indexOf('=');
          if (sep < 0) return [];
          return [[part.slice(0, sep).trim(), decodeURIComponent(part.slice(sep + 1).trim())]];
        })
      );
      const token = cookies[authConfig.cookieName];
      if (token && authStore) {
        const sessionData = await authStore.getSession(token);
        if (sessionData) {
          meta.accountId = sessionData.account.id;
          meta.playerName = sessionData.account.username;
          meta.clanTag = sessionData.account.clanTag;
          meta.sessionToken = token;
        }
      }
    }
  } catch {}

  // Send initial leaderboard sync
  try {
    const initialPayload = await getPublicLeaderboardPayload();
    ws.send(JSON.stringify({ type: 'leaderboard:sync', data: initialPayload }));
  } catch {}

  ws.on('message', async (raw) => {
    try {
      if (raw.toString().length > 8192) return;
      const msg = JSON.parse(raw.toString());

      if (msg.type === 'auth:bind_session' && typeof msg.token === 'string') {
        const sessionData = await authStore.getSession(msg.token);
        if (sessionData) {
          const accountId = sessionData.account.id;
          notifySessionSuperseded(accountId, msg.token);

          meta.accountId = accountId;
          meta.playerName = sessionData.account.username;
          meta.clanTag = sessionData.account.clanTag;
          meta.sessionToken = msg.token;
        }
      }

      if (msg.type === 'player:presence' && meta.playerName) {
        const cleanName = meta.playerName;
        const cleanTag = String(msg.clanTag || meta.clanTag || '').trim().toUpperCase().slice(0, 6);
        meta.clanTag = cleanTag;

        const entries = await storage.getLeaderboard();
        const existing = entries.find((p) => p.name.toLowerCase() === cleanName.toLowerCase());
        if (existing) {
          existing.lastSeen = Date.now();
          if (cleanTag) existing.clanTag = cleanTag;
          if (msg.currentArena) existing.currentArena = String(msg.currentArena).slice(0, 64);
          if (msg.statusText) existing.statusText = String(msg.statusText).slice(0, 128);
          if (typeof msg.unlockedMapsCount === 'number') {
            existing.unlockedMapsCount = Math.max(1, Math.min(7, Math.floor(msg.unlockedMapsCount)));
          }
          if (msg.signatureWeapon) existing.signatureWeapon = String(msg.signatureWeapon).slice(0, 64);
          await storage.saveLeaderboardEntry(existing);
          await broadcastLeaderboardSync();
        }
      }
    } catch {}
  });

  ws.on('close', () => {
    connectedClients.delete(ws);
    broadcastLeaderboardSync().catch(() => {});
  });
});

// ---------------------------------------------------------------------------
// REST API Endpoints
// ---------------------------------------------------------------------------

// Health & Readiness
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/ready', async (_req, res) => {
  try {
    if (!storage) {
      return res.status(503).json({ status: 'starting', error: 'Storage not initialized' });
    }
    // Verify database connectivity
    await storage.getDerbyStats();
    res.json({ status: 'ready', storageType: storage.type, timestamp: new Date().toISOString() });
  } catch (error: any) {
    res.status(500).json({ status: 'error', error: error?.message || 'Readiness check failed' });
  }
});

// Auth: Register
app.post('/api/auth/register', async (req, res) => {
  const ip = getClientIp(req);
  if (isRateLimited(`auth_reg_${ip}`, 15, 15 * 60 * 1000)) {
    return res.status(429).json({ error: 'Zu viele Registrierungsversuche. Bitte versuche es später erneut.' });
  }

  try {
    const account = await authStore.register(
      String(req.body?.username || ''),
      String(req.body?.password || ''),
      String(req.body?.clanTag || ''),
      String(req.body?.faction || ''),
      req.body?.legalConsent
    );

    const session = await authStore.createSession(account.id, authConfig.sessionTtlMs);
    setSessionCookie(req, res, session.token, session.expiresAt);
    notifySessionSuperseded(account.id, session.token);

    const accTag = `[${account.clanTag}] ${account.username}`;
    ipAccountMap.set(ip, accTag);
    if (process.env.NODE_ENV !== 'test') {
      console.log(`✨ [Registrierung] IP: ${anonymizeIp(ip)} · Account: ${accTag} erfolgreich erstellt`);
    }

    // Initial operator profile in leaderboard
    await storage.saveLeaderboardEntry({
      id: `op_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      accountId: account.id,
      name: account.username,
      clanTag: account.clanTag,
      city: account.faction === 'wehrheim' ? 'Wehrheim' : 'Neu-Anspach',
      score: 0,
      bestMatchScore: 0,
      kills: 0,
      wins: 0,
      highestWave: 1,
      unlockedMapsCount: 1,
      signatureWeapon: 'XM4 Bembel-Sturmgewehr',
      currentArena: 'Freilichtmuseum Hessenpark',
      statusText: 'Neu registriert · Einsatzbereit',
      lastSeen: Date.now(),
    });

    await storage.addRecentEvent({
      id: `ev_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
      playerName: account.username,
      clanTag: account.clanTag,
      text: `ist dem Taunus-Einsatznetzwerk beigetreten!`,
      timestamp: Date.now(),
      type: 'join',
    });

    await broadcastLeaderboardSync();

    res.status(201).json({
      success: true,
      account,
      csrfToken: session.csrfToken,
    });
  } catch (error) {
    if (error instanceof AuthConflictError || error instanceof AuthValidationError) {
      return res.status(error instanceof AuthConflictError ? 409 : 400).json({ error: error.message });
    }
    console.error('[Auth] Registration error:', error);
    res.status(500).json({ error: 'Konto konnte nicht erstellt werden.' });
  }
});

// Auth: Login
app.post('/api/auth/login', async (req, res) => {
  const ip = getClientIp(req);
  if (isRateLimited(`auth_login_${ip}`, 20, 15 * 60 * 1000)) {
    return res.status(429).json({ error: 'Zu viele Anmeldeversuche. Bitte versuche es später erneut.' });
  }

  try {
    const account = await authStore.verifyCredentials(
      String(req.body?.username || ''),
      String(req.body?.password || '')
    );

    if (!account) {
      return res.status(401).json({ error: 'Benutzername oder Passwort ist ungültig.' });
    }

    const session = await authStore.createSession(account.id, authConfig.sessionTtlMs);
    setSessionCookie(req, res, session.token, session.expiresAt);
    notifySessionSuperseded(account.id, session.token);

    const accTag = `[${account.clanTag}] ${account.username}`;
    ipAccountMap.set(ip, accTag);
    if (process.env.NODE_ENV !== 'test') {
      console.log(`🔑 [Login] IP: ${anonymizeIp(ip)} · Account: ${accTag} angemeldet`);
    }

    res.json({
      success: true,
      account,
      csrfToken: session.csrfToken,
    });
  } catch (error) {
    console.error('[Auth] Login error:', error);
    res.status(500).json({ error: 'Anmeldung fehlgeschlagen.' });
  }
});

// Auth: Current User / Me
app.get('/api/auth/me', requireAccount, (_req, res) => {
  res.json({
    authenticated: true,
    account: res.locals.account,
    csrfToken: res.locals.csrfToken,
  });
});

// Auth: Logout
app.post('/api/auth/logout', async (req, res) => {
  const ip = getClientIp(req);
  ipAccountMap.delete(ip);
  const token = extractRequestToken(req);
  if (token) {
    await authStore.revokeSession(token);
  }
  clearSessionCookie(req, res);
  if (process.env.NODE_ENV !== 'test') {
    console.log(`🚪 [Logout] IP: ${anonymizeIp(ip)} hat sich abgemeldet`);
  }
  res.json({ success: true });
});

// DSGVO / GDPR Data Export
app.get('/api/auth/export', requireAccount, async (_req, res) => {
  const account = res.locals.account as PublicAccount;
  const data = await authStore.exportAccountData(account.id);
  if (!data) return res.status(404).json({ error: 'Kontodaten nicht gefunden.' });

  const entries = await storage.getLeaderboard();
  const operatorEntry = entries.find((p) => p.name.toLowerCase() === account.username.toLowerCase());

  res.json({
    account: data,
    operatorProfile: operatorEntry || null,
    exportedAt: new Date().toISOString(),
  });
});

// DSGVO / GDPR Right to be Forgotten: Account Deletion
app.post('/api/auth/delete', requireAccount, requireCsrf, async (req, res) => {
  const account = res.locals.account as PublicAccount;
  const password = String(req.body?.password || '');
  if (!password) {
    return res.status(400).json({ error: 'Zur Kontolöschung ist die Eingabe deines Passworts erforderlich.' });
  }

  const success = await authStore.deleteAccount(account.id, password);
  if (!success) {
    return res.status(403).json({ error: 'Das eingegebene Passwort ist nicht korrekt.' });
  }

  await storage.deleteLeaderboardEntryByName(account.username);
  await broadcastLeaderboardSync();

  notifySessionSuperseded(account.id, undefined, 'Dein Konto wurde erfolgreich und unwiderruflich gelöscht.');
  clearSessionCookie(req, res);

  res.json({ success: true, message: 'Konto und alle zugehörigen Daten wurden gelöscht.' });
});

// ---------------------------------------------------------------------------
// Leaderboard & Derby API
// ---------------------------------------------------------------------------

app.get('/api/leaderboard', async (_req, res) => {
  try {
    const payload = await getPublicLeaderboardPayload();
    res.json(payload);
  } catch (err: any) {
    res.status(500).json({ error: 'Leaderboard konnte nicht geladen werden.' });
  }
});

// Submit match results with strict server-side validation & anti-cheat bounds
app.post('/api/leaderboard/submit', requireAccount, requireCsrf, async (req, res) => {
  const account = res.locals.account as PublicAccount;

  // Rate limit submissions per account (max 1 submit per 3 seconds)
  if (isRateLimited(`submit_${account.id}`, 20, 60 * 1000)) {
    return res.status(429).json({ error: 'Zu viele Punktübermittlungen. Bitte warte einen Moment.' });
  }

  const rawScore = Number(req.body?.score);
  const rawKills = Number(req.body?.kills);
  const rawWave = Number(req.body?.wave);
  const victory = Boolean(req.body?.victory);
  const city = String(req.body?.city || (account.faction === 'wehrheim' ? 'Wehrheim' : 'Neu-Anspach')).trim().slice(0, 32);
  const unlockedMapsCount = Math.max(1, Math.min(7, Math.floor(Number(req.body?.unlockedMapsCount) || 1)));
  const signatureWeapon = String(req.body?.signatureWeapon || 'XM4 Bembel-Sturmgewehr').trim().slice(0, 64);
  const currentArena = String(req.body?.currentArena || 'Freilichtmuseum Hessenpark').trim().slice(0, 64);
  const eventNotice = req.body?.eventNotice ? String(req.body.eventNotice).trim().slice(0, 160) : undefined;

  // Anti-cheat validation bounds
  if (!Number.isFinite(rawScore) || rawScore < 0 || rawScore > 25000) {
    return res.status(400).json({ error: 'Ungültiger oder unplausibler Score-Wert (erlaubt: 0 - 25.000).' });
  }
  if (!Number.isFinite(rawKills) || rawKills < 0 || rawKills > 300) {
    return res.status(400).json({ error: 'Ungültiger oder unplausibler Kill-Wert (erlaubt: 0 - 300).' });
  }
  if (!Number.isFinite(rawWave) || rawWave < 1 || rawWave > 100) {
    return res.status(400).json({ error: 'Ungültige Welle (erlaubt: 1 - 100).' });
  }

  const numericScore = Math.floor(rawScore);
  const numericKills = Math.floor(rawKills);
  const numericWave = Math.floor(rawWave);

  // Update derby stats
  const derby = await storage.getDerbyStats();
  if (numericScore > 0 || victory) {
    const pointsToAdd = Math.floor(numericScore * 0.25) + (victory ? 300 : 40);
    if (city === 'Neu-Anspach') {
      derby.neuAnspachPoints += pointsToAdd;
    } else {
      derby.wehrheimPoints += pointsToAdd;
    }
    derby.totalBattles += 1;
    derby.currentContestedDistrict = currentArena;
    await storage.saveDerbyStats(derby);
  }

  const entries = await storage.getLeaderboard();
  const existing = entries.find((p) => p.name.toLowerCase() === account.username.toLowerCase());

  const rankTitle = (score: number, wins: number, kills: number) => {
    if (wins >= 6 || score >= 15000) return 'Feldberg-Großmarschall';
    if (wins >= 4 || score >= 8000) return 'Hessenpark-Legende';
    if (wins >= 2 || score >= 4000) return 'Taunusbahn-Kommandant';
    if (wins >= 1 || kills >= 25) return 'Bembel-Hauptmann';
    if (kills >= 8 || score >= 500) return 'Taunus-Gefreiter';
    return 'Anspach-Einsatzkraft';
  };

  const statusText = victory
    ? `Victory Royale in ${currentArena}!`
    : numericScore > 0
    ? `Welle ${numericWave} in ${currentArena} (+${numericScore} Pkt)`
    : `Einsatzbereit in ${currentArena}`;

  if (existing) {
    existing.score += numericScore;
    existing.bestMatchScore = Math.max(existing.bestMatchScore, numericScore);
    existing.kills += numericKills;
    if (victory) existing.wins += 1;
    existing.highestWave = Math.max(existing.highestWave, numericWave);
    existing.unlockedMapsCount = Math.max(existing.unlockedMapsCount, unlockedMapsCount);
    existing.clanTag = account.clanTag;
    existing.city = city;
    existing.signatureWeapon = signatureWeapon;
    existing.currentArena = currentArena;
    existing.statusText = statusText;
    existing.lastSeen = Date.now();
    existing.title = rankTitle(existing.score, existing.wins, existing.kills);
    await storage.saveLeaderboardEntry(existing);
  } else {
    const newEntry: StoredLeaderboardEntry = {
      id: `op_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      accountId: account.id,
      name: account.username,
      clanTag: account.clanTag,
      city,
      score: numericScore,
      bestMatchScore: numericScore,
      kills: numericKills,
      wins: victory ? 1 : 0,
      highestWave: numericWave,
      unlockedMapsCount,
      signatureWeapon,
      currentArena,
      statusText,
      lastSeen: Date.now(),
      title: rankTitle(numericScore, victory ? 1 : 0, numericKills),
    };
    await storage.saveLeaderboardEntry(newEntry);
  }

  // Live feed event
  if (eventNotice) {
    await storage.addRecentEvent({
      id: `ev_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
      playerName: account.username,
      clanTag: account.clanTag,
      text: eventNotice,
      timestamp: Date.now(),
      type: 'unlock',
    });
  } else if (victory) {
    await storage.addRecentEvent({
      id: `ev_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
      playerName: account.username,
      clanTag: account.clanTag,
      text: `hat ${currentArena} siegreich verteidigt (+${numericScore} Pkt, ${numericKills} Kills)!`,
      timestamp: Date.now(),
      type: 'victory',
    });
  } else if (numericScore > 0) {
    await storage.addRecentEvent({
      id: `ev_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
      playerName: account.username,
      clanTag: account.clanTag,
      text: `hat Welle ${numericWave} in ${currentArena} abgeschlossen (+${numericScore} Pkt, ${numericKills} Kills).`,
      timestamp: Date.now(),
      type: 'wave',
    });
  }

  await broadcastLeaderboardSync();
  const payload = await getPublicLeaderboardPayload();
  res.json({ success: true, ...payload });
});

// ---------------------------------------------------------------------------
// Clan API
// ---------------------------------------------------------------------------

app.get('/api/clans/me', requireAccount, async (_req, res) => {
  try {
    const account = res.locals.account as PublicAccount;
    const clan = await getClanPayload(account);
    const invitations = [...clanInvitations.values()]
      .filter((invite) => invite.recipientAccountId === account.id && invite.status === 'pending')
      .map(({ id, clanTag, clanName, inviterName, createdAt }) => ({ id, clanTag, clanName, inviterName, createdAt }));
    res.json({ clan, invitations });
  } catch (error) {
    console.error('[Clan] Could not load clan:', error);
    res.status(500).json({ error: 'Clan konnte nicht geladen werden.' });
  }
});

app.post('/api/clans', requireAccount, requireCsrf, async (req, res) => {
  try {
    const account = res.locals.account as PublicAccount;
    const tag = String(req.body?.tag || '').trim().toUpperCase();
    const name = String(req.body?.name || '').trim().slice(0, 32);
    const description = String(req.body?.description || '').trim().slice(0, 160);
    if (!/^[A-Z0-9_-]{2,6}$/.test(tag) || !name) {
      return res.status(400).json({ error: 'Clan-Tag oder Clanname ist ungültig.' });
    }
    if (clans.has(tag)) return res.status(409).json({ error: 'Dieser Clan-Tag ist bereits vergeben.' });
    const existingMembers = (await storage.getLeaderboard()).some((entry) => entry.clanTag.toUpperCase() === tag);
    if (existingMembers) return res.status(409).json({ error: 'Dieser Clan-Tag wird bereits verwendet.' });
    await authStore.updateClanTag(account.id, tag);
    clans.set(tag, {
      id: `clan_${crypto.randomUUID()}`,
      tag,
      name,
      description,
      leaderAccountId: account.id,
      createdAt: new Date().toISOString(),
    });
    const clan = await getClanPayload({ ...account, clanTag: tag });
    res.status(201).json({ success: true, clan });
  } catch (error) {
    console.error('[Clan] Create error:', error);
    res.status(500).json({ error: 'Clan konnte nicht gegründet werden.' });
  }
});

app.post('/api/clans/leave', requireAccount, requireCsrf, async (_req, res) => {
  try {
    const account = res.locals.account as PublicAccount;
    const fallbackTag = '61267';
    await authStore.updateClanTag(account.id, fallbackTag);
    const clan = await getClanPayload({ ...account, clanTag: fallbackTag });
    res.json({ success: true, clan });
  } catch (error) {
    console.error('[Clan] Leave error:', error);
    res.status(500).json({ error: 'Clan konnte nicht verlassen werden.' });
  }
});

app.post('/api/clans/invitations', requireAccount, requireCsrf, async (req, res) => {
  try {
    const account = res.locals.account as PublicAccount;
    const clan = await getClanPayload(account);
    const username = String(req.body?.username || '').trim();
    const recipient = await authStore.getPublicAccountByUsername(username);
    if (!recipient) return res.status(404).json({ error: 'Operator nicht gefunden.' });
    if (recipient.id === account.id) return res.status(400).json({ error: 'Du kannst dich nicht selbst einladen.' });
    if (recipient.clanTag.toUpperCase() === clan.tag.toUpperCase()) return res.status(409).json({ error: 'Der Operator ist bereits in deinem Clan.' });
    const duplicate = [...clanInvitations.values()].find((invite) => invite.recipientAccountId === recipient.id && invite.clanTag === clan.tag && invite.status === 'pending');
    if (duplicate) return res.status(409).json({ error: 'Es gibt bereits eine offene Einladung.' });
    const invitation: ClanInvitationRecord = {
      id: `invite_${crypto.randomUUID()}`,
      clanTag: clan.tag,
      clanName: clan.name,
      inviterName: account.username,
      recipientAccountId: recipient.id,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    clanInvitations.set(invitation.id, invitation);
    res.status(201).json({ success: true });
  } catch (error) {
    console.error('[Clan] Invitation error:', error);
    res.status(500).json({ error: 'Einladung konnte nicht erstellt werden.' });
  }
});

app.post('/api/clans/invitations/:id/:action', requireAccount, requireCsrf, async (req, res) => {
  try {
    const account = res.locals.account as PublicAccount;
    const invitation = clanInvitations.get(String(req.params.id));
    const action = String(req.params.action);
    if (!invitation || invitation.recipientAccountId !== account.id || invitation.status !== 'pending') {
      return res.status(404).json({ error: 'Einladung nicht gefunden.' });
    }
    if (action !== 'accept' && action !== 'decline') return res.status(400).json({ error: 'Ungültige Einladungsaktion.' });
    invitation.status = action === 'accept' ? 'accepted' : 'declined';
    if (action === 'accept') {
      const clan = clans.get(invitation.clanTag);
      if (!clan) return res.status(404).json({ error: 'Der Clan existiert nicht mehr.' });
      await authStore.updateClanTag(account.id, clan.tag);
      res.json({ success: true, clan: await getClanPayload({ ...account, clanTag: clan.tag }) });
    } else {
      res.json({ success: true, clan: await getClanPayload(account) });
    }
  } catch (error) {
    console.error('[Clan] Invitation response error:', error);
    res.status(500).json({ error: 'Einladung konnte nicht verarbeitet werden.' });
  }
});

app.get('/api/clans/messages', requireAccount, async (_req, res) => {
  const account = res.locals.account as PublicAccount;
  const tag = account.clanTag || '61267';
  res.json({ messages: (clanMessages.get(tag) || []).slice(-50) });
});

app.post('/api/clans/messages', requireAccount, requireCsrf, async (req, res) => {
  try {
    const account = res.locals.account as PublicAccount;
    const text = String(req.body?.text || '').trim().slice(0, 240);
    if (!text) return res.status(400).json({ error: 'Nachricht darf nicht leer sein.' });
    const message: ClanMessageRecord = {
      id: `msg_${crypto.randomUUID()}`,
      clanTag: account.clanTag || '61267',
      authorName: account.username,
      text,
      createdAt: new Date().toISOString(),
    };
    const messages = clanMessages.get(message.clanTag) || [];
    messages.push(message);
    clanMessages.set(message.clanTag, messages.slice(-100));
    await broadcastClanMessage(message);
    res.status(201).json({ success: true, message });
  } catch (error) {
    console.error('[Clan] Chat error:', error);
    res.status(500).json({ error: 'Nachricht konnte nicht gesendet werden.' });
  }
});

// ---------------------------------------------------------------------------
// Multiplayer Co-op Rooms API with Anti-Cheat & Ownership
// ---------------------------------------------------------------------------

const ALLOWED_ARENAS = [
  'hessenpark',
  'waldschwimmbad',
  'bahnhof',
  'buergerhaus',
  'taunuscenter',
  'ars',
  'feldberg',
  'Freilichtmuseum Hessenpark',
  'Waldschwimmbad Neu-Anspach',
  'Bahnhof Neu-Anspach (Taunusbahn)',
  'Bürgerhaus & Rathausplatz',
  'Taunus-Center & Neue Mitte',
  'Adolf-Reichwein-Schule (ARS)',
  'Feldbergblick & Taunuskamm',
];

// Clean stale rooms periodically (every 2 minutes)
setInterval(async () => {
  if (storage) {
    try {
      await storage.cleanupStaleRooms(10 * 60 * 1000); // 10 minutes max room age
    } catch {}
  }
}, 120000).unref();

app.get('/api/multiplayer/rooms', async (_req, res) => {
  try {
    const rooms = await storage.getRooms();
    const now = Date.now();
    const activeRooms = Object.values(rooms).filter((r) => now - r.updatedAt < 600000);
    res.json({ rooms: activeRooms });
  } catch (err: any) {
    res.status(500).json({ error: 'Räume konnten nicht geladen werden.' });
  }
});

app.get('/api/multiplayer/rooms/:code', async (req, res) => {
  try {
    const roomCode = String(req.params.code || '').trim().toUpperCase();
    const room = await storage.getRoom(roomCode);
    if (!room || Date.now() - room.updatedAt > 600000) {
      if (room) await storage.deleteRoom(roomCode);
      return res.status(404).json({ success: false, error: 'Raum nicht gefunden oder abgelaufen.' });
    }
    res.json({ success: true, room });
  } catch (err: any) {
    res.status(500).json({ error: 'Raum konnte nicht abgefragt werden.' });
  }
});

app.post('/api/multiplayer/join', requireAccount, requireCsrf, async (req, res) => {
  const account = res.locals.account as PublicAccount;
  const requestedCode = String(req.body?.code || '').trim().toUpperCase();
  // Cryptographically random 6-character room code if none requested
  const roomCode = requestedCode || crypto.randomBytes(3).toString('hex').toUpperCase();

  const playerName = account.username;
  const clanTag = account.clanTag;
  const rawArena = String(req.body?.arena || 'hessenpark').trim();
  const arena = ALLOWED_ARENAS.includes(rawArena) ? rawArena : 'hessenpark';

  let room = await storage.getRoom(roomCode);
  const now = Date.now();

  if (!room) {
    room = {
      code: roomCode,
      hostAccountId: account.id,
      hostName: playerName,
      arena,
      players: {},
      wave: 1,
      totalKills: 0,
      status: 'lobby',
      updatedAt: now,
      createdAt: now,
    };
  }

  // Assign secure server-generated playerId bound to this account
  const playerId = `p_${crypto.randomUUID()}`;
  room.players[playerId] = {
    id: playerId,
    accountId: account.id,
    name: playerName,
    clanTag,
    kills: 0,
    health: 100,
    score: 0,
    sector: 'Marktplatz',
    lastSeen: now,
  };
  room.updatedAt = now;

  await storage.saveRoom(room);

  res.json({
    success: true,
    room,
    playerId,
  });
});

app.post('/api/multiplayer/update', requireAccount, requireCsrf, async (req, res) => {
  const account = res.locals.account as PublicAccount;
  const roomCode = String(req.body?.roomCode || '').trim().toUpperCase();
  const playerId = String(req.body?.playerId || '').trim();
  const { kills, health, score, wave } = req.body || {};

  if (!roomCode || !playerId) {
    return res.status(400).json({ error: 'Raumcode und Spieler-ID erforderlich.' });
  }

  const room = await storage.getRoom(roomCode);
  if (!room) {
    return res.status(404).json({ error: 'Raum nicht gefunden.' });
  }

  const player = room.players[playerId];
  if (!player) {
    return res.status(404).json({ error: 'Spieler nicht im Raum gefunden.' });
  }

  // Strict ownership check: Only the player linked to this account can update their own status
  if (player.accountId && player.accountId !== account.id) {
    return res.status(403).json({ error: 'Keine Berechtigung, fremden Spieler-Status zu manipulieren.' });
  }

  const now = Date.now();

  // Bounds & Plausibility Validation
  if (kills !== undefined) {
    if (!Number.isFinite(kills) || kills < 0 || kills > 1000) {
      return res.status(400).json({ error: 'Unplausibler Kill-Wert.' });
    }
    const killDiff = kills - player.kills;
    // Max 15 kills increase in a single tick
    if (killDiff > 15) {
      return res.status(400).json({ error: 'Unplausible Kill-Erhöhungsrate.' });
    }
    player.kills = Math.max(player.kills, Math.floor(kills));
  }

  if (health !== undefined) {
    if (!Number.isFinite(health) || health < 0 || health > 1000) {
      return res.status(400).json({ error: 'Unplausibler Health-Wert.' });
    }
    player.health = Math.floor(health);
  }

  if (score !== undefined) {
    if (!Number.isFinite(score) || score < 0 || score > 500000) {
      return res.status(400).json({ error: 'Unplausibler Score-Wert.' });
    }
    const scoreDiff = score - player.score;
    // Max 5000 score increase per update
    if (scoreDiff > 5000) {
      return res.status(400).json({ error: 'Unplausible Score-Erhöhungsrate.' });
    }
    player.score = Math.max(player.score, Math.floor(score));
  }

  if (wave !== undefined) {
    if (!Number.isFinite(wave) || wave < 1 || wave > 100) {
      return res.status(400).json({ error: 'Unplausible Welle.' });
    }
    // Max 1 wave advancement per update
    if (wave > room.wave + 1) {
      return res.status(400).json({ error: 'Wellen-Übersprung unzulässig.' });
    }
    room.wave = Math.max(room.wave, Math.floor(wave));
  }

  player.lastSeen = now;
  room.status = 'in_game';
  room.totalKills = Object.values(room.players).reduce((acc, p) => acc + (p.kills || 0), 0);
  room.updatedAt = now;

  await storage.saveRoom(room);

  res.json({ success: true, room });
});

// AI Commander Endpoint
app.post('/api/ai/commander', async (_req, res) => {
  res.json({
    success: true,
    commander: {
      commanderName: 'Groß-Kommandeur Feldberg-Stier',
      tacticalDirective: 'Die Wehrheimer Apfel-Garde formiert sich an den Flanken! Haltet das Hessenpark-Tor!',
      hessianCombatBark: 'Ei gude! Packt die Bembel aus un gebt de Wehrheimern Saures!',
      wehrheimAgentsOrders: {
        flankers: 'Umfassung über die Streuobstwiesen',
        snipers: 'Störfeuer aus dem Schatten der Windmühle',
        shocktroopers: 'Frontaler Ansturm mit Lochmühlen-Rollwagen',
      },
      tycoonCrisisEvent: {
        title: 'Taunusbahn-Expressversorgung',
        description: 'Ein Notfallzug aus Frankfurt hat zusätzliche Taler nach Neu-Anspach gebracht!',
        budgetBonus: 200,
        recommendedUpgrade: 'Breitband Taunus Netze',
      },
    },
  });
});

// ---------------------------------------------------------------------------
// Server Startup & Graceful Shutdown
// ---------------------------------------------------------------------------

let isShuttingDown = false;

export async function startServer(portToListen?: number, customDbPath?: string) {
  storage = await createStorage(customDbPath);
  authStore = new AuthStore(storage);

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath, { maxAge: '1h' }));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else if (process.env.NODE_ENV === 'test') {
    // In test mode, don't mount Vite middleware to avoid port conflicts
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: [
          'neu-anspach.ai.studio',
          '.ai.studio',
          '.run.app',
          'localhost',
          '127.0.0.1',
        ],
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        const indexPath = path.resolve(__dirname, 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  }

  const listenPort = portToListen !== undefined ? portToListen : PORT;
  return new Promise<http.Server>((resolve, reject) => {
    server.once('error', reject);
    server.listen(listenPort, '0.0.0.0', () => {
      server.removeListener('error', reject);
      const addr = server.address();
      const actualPort = typeof addr === 'object' && addr ? addr.port : listenPort;
      console.log(`[Gemini-Game] Server listening on http://0.0.0.0:${actualPort} (Storage: ${storage.type})`);
      resolve(server);
    });
  });
}

export async function stopServer(): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log('[Gemini-Game] Graceful shutdown initiated...');

  // Notify and terminate WebSockets
  wss.clients.forEach((ws) => {
    try {
      ws.close(1001, 'Server shutting down');
    } catch {}
  });

  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });

  if (storage) {
    await storage.close();
  }
  console.log('[Gemini-Game] Shutdown complete.');
}

process.on('SIGTERM', () => {
  stopServer().then(() => process.exit(0));
});

process.on('SIGINT', () => {
  stopServer().then(() => process.exit(0));
});

// Auto-start server when invoked directly from CLI
const isMainModule = Boolean(
  process.argv[1] &&
    (fileURLToPath(import.meta.url) === path.resolve(process.argv[1]) ||
      process.argv[1].endsWith('server.ts') ||
      process.argv[1].endsWith('server.js')) &&
    !process.argv.some((arg) => arg.includes('--test') || arg.includes('test/'))
);

if (isMainModule && process.env.NODE_ENV !== 'test') {
  startServer().catch((err) => {
    console.error('Fatal startup error:', err);
    process.exit(1);
  });
}
