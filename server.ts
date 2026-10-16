import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import {
  AuthConflictError,
  AuthStore,
  AuthValidationError,
  authConfig,
} from './auth.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '100kb' }));

const authStore = new AuthStore(authConfig.dataFile);
const authRateLimit = new Map<string, { count: number; resetAt: number }>();
const AUTH_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const AUTH_RATE_LIMIT_MAX = 20;

function getClientAddress(req: express.Request): string {
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function isAuthRateLimited(req: express.Request): boolean {
  const now = Date.now();
  const key = getClientAddress(req);
  const current = authRateLimit.get(key);
  if (!current || current.resetAt <= now) {
    authRateLimit.set(key, { count: 1, resetAt: now + AUTH_RATE_LIMIT_WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > AUTH_RATE_LIMIT_MAX;
}

interface ClientMeta {
  playerName?: string;
  clanTag?: string;
  accountId?: string;
  sessionToken?: string;
}

const connectedClients = new Map<WebSocket, ClientMeta>();

function notifySessionSuperseded(accountId: string, currentSessionToken?: string, reason?: string) {
  const payload = JSON.stringify({
    type: 'auth:session_superseded',
    reason:
      reason ||
      'Dein Account wurde auf einem anderen Gerät angemeldet. Aus Sicherheitsgründen kann immer nur 1 aktives Gerät eingeloggt sein.',
  });

  connectedClients.forEach((meta, client) => {
    // Only kick connections for this account that have a DIFFERENT session token (i.e. another login/device)
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

function parseCookies(req: express.Request): Record<string, string> {
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
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const candidate = authHeader.slice(7).trim();
    if (candidate) return candidate;
  }
  return parseCookies(req)[authConfig.cookieName];
}

function setSessionCookie(res: express.Response, token: string, expiresAt: string): void {
  const isSecure = authConfig.secureCookie;
  // Use SameSite=None when secure for iframe embedding, otherwise Lax for local development
  const sameSite = isSecure ? 'None' : 'Lax';
  const attributes = [
    `${authConfig.cookieName}=${encodeURIComponent(token)}`,
    'HttpOnly',
    'Path=/',
    `Expires=${new Date(expiresAt).toUTCString()}`,
    `Max-Age=${Math.max(0, Math.floor((Date.parse(expiresAt) - Date.now()) / 1000))}`,
    `SameSite=${sameSite}`,
  ];
  if (isSecure) attributes.push('Secure');
  res.setHeader('Set-Cookie', attributes.join('; '));
}

function clearSessionCookie(res: express.Response): void {
  const isSecure = authConfig.secureCookie;
  const sameSite = isSecure ? 'None' : 'Lax';
  res.setHeader(
    'Set-Cookie',
    `${authConfig.cookieName}=; HttpOnly; Path=/; Max-Age=0; SameSite=${sameSite}${
      isSecure ? '; Secure' : ''
    }`
  );
}

function currentAccount(req: express.Request) {
  const token = extractRequestToken(req);
  return token ? authStore.getAccountBySession(token) : null;
}

function requireAccount(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const account = currentAccount(req);
  if (!account) {
    res.status(401).json({ error: 'Anmeldung erforderlich.' });
    return;
  }
  res.locals.account = account;
  next();
}

app.post('/api/auth/register', (req, res) => {
  if (isAuthRateLimited(req)) return res.status(429).json({ error: 'Zu viele Versuche. Bitte später erneut versuchen.' });
  try {
    const account = authStore.register(
      String(req.body?.username || ''),
      req.body?.password,
      req.body?.legalConsent
    );
    const session = authStore.createSession(account.id, authConfig.sessionTtlMs);
    setSessionCookie(res, session.token, session.expiresAt);
    notifySessionSuperseded(account.id, session.token);
    res.status(201).json({ success: true, account, token: session.token });
  } catch (error) {
    if (error instanceof AuthConflictError || error instanceof AuthValidationError) {
      return res.status(error instanceof AuthConflictError ? 409 : 400).json({ error: error.message });
    }
    console.error('Account registration failed:', error);
    res.status(500).json({ error: 'Konto konnte nicht erstellt werden.' });
  }
});

app.post('/api/auth/login', (req, res) => {
  if (isAuthRateLimited(req)) return res.status(429).json({ error: 'Zu viele Versuche. Bitte später erneut versuchen.' });
  const account = authStore.verifyCredentials(String(req.body?.username || ''), req.body?.password);
  if (!account) return res.status(401).json({ error: 'Benutzername oder Passwort ist ungültig.' });
  const session = authStore.createSession(account.id, authConfig.sessionTtlMs);
  setSessionCookie(res, session.token, session.expiresAt);
  notifySessionSuperseded(account.id, session.token);
  res.json({ success: true, account, token: session.token });
});

app.get('/api/auth/me', requireAccount, (req, res) => {
  res.json({ authenticated: true, account: res.locals.account });
});

app.post('/api/auth/logout', (req, res) => {
  const token = extractRequestToken(req);
  if (token) authStore.revokeSession(token);
  clearSessionCookie(res);
  res.json({ success: true });
});

// DSGVO / GDPR Auskunftsrecht & Datenexport
app.get('/api/auth/export', requireAccount, (req, res) => {
  const accountId = (res.locals.account as { id: string }).id;
  const data = authStore.exportAccountData(accountId);
  if (!data) return res.status(404).json({ error: 'Kontodaten nicht gefunden.' });
  
  // Also include player leaderboard entry if exists
  const leaderboardEntry = state.leaderboard.find(
    (p) => p.name.toLowerCase() === res.locals.account.username.toLowerCase()
  );

  res.json({
    account: data,
    operatorProfile: leaderboardEntry || null,
    exportedAt: new Date().toISOString(),
  });
});

// DSGVO / GDPR Recht auf Vergessenwerden: Kontolöschung
app.post('/api/auth/delete', requireAccount, (req, res) => {
  const account = res.locals.account as { id: string; username: string };
  const password = String(req.body?.password || '');
  if (!password) {
    return res.status(400).json({ error: 'Zur Kontolöschung ist die Eingabe deines Passworts erforderlich.' });
  }

  const success = authStore.deleteAccount(account.id, password);
  if (!success) {
    return res.status(403).json({ error: 'Das eingegebene Passwort ist nicht korrekt.' });
  }

  // Remove player from active leaderboard & broadcast
  state.leaderboard = state.leaderboard.filter(
    (p) => p.name.toLowerCase() !== account.username.toLowerCase()
  );
  sortAndSaveLeaderboard();
  broadcastLeaderboardSync();

  // Terminate any connected WebSocket for this account
  notifySessionSuperseded(account.id, 'Dein Konto wurde erfolgreich und unwiderruflich gelöscht.');

  clearSessionCookie(res);
  res.json({ success: true, message: 'Konto und alle zugehörigen Daten wurden gelöscht.' });
});

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Persistent disk storage for REAL player leaderboard (ZERO fake bots!)
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'real_leaderboard.json');

export interface RealLeaderboardEntry {
  id: string;
  name: string;
  clanTag: string;
  city: string;
  score: number;
  bestMatchScore: number;
  kills: number;
  wins: number;
  highestWave: number;
  unlockedMapsCount: number;
  signatureWeapon: string;
  currentArena: string;
  statusText: string;
  lastSeen: number;
  rank: number;
  title: string;
}

export interface LiveFeedEvent {
  id: string;
  playerName: string;
  clanTag: string;
  text: string;
  timestamp: number;
  type: 'join' | 'victory' | 'wave' | 'unlock' | 'upgrade';
}

interface PersistedState {
  leaderboard: RealLeaderboardEntry[];
  derbyStats: {
    neuAnspachPoints: number;
    wehrheimPoints: number;
    totalBattles: number;
    currentContestedDistrict: string;
  };
  recentEvents: LiveFeedEvent[];
}

function loadPersistedState(): PersistedState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.leaderboard)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not load real_leaderboard.json, initializing fresh state:', e);
  }
  return {
    leaderboard: [],
    derbyStats: {
      neuAnspachPoints: 0,
      wehrheimPoints: 0,
      totalBattles: 0,
      currentContestedDistrict: 'Freilichtmuseum Hessenpark',
    },
    recentEvents: [],
  };
}

const state: PersistedState = loadPersistedState();

function computeRankTitle(score: number, wins: number, kills: number): string {
  if (wins >= 6 || score >= 15000) return 'Feldberg-Großmarschall';
  if (wins >= 4 || score >= 8000) return 'Hessenpark-Legende';
  if (wins >= 2 || score >= 4000) return 'Taunusbahn-Kommandant';
  if (wins >= 1 || kills >= 25) return 'Bembel-Hauptmann';
  if (kills >= 8 || score >= 500) return 'Taunus-Gefreiter';
  return 'Anspach-Einsatzkraft';
}

function sortAndSaveLeaderboard() {
  state.leaderboard.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.kills - a.kills;
  });

  state.leaderboard = state.leaderboard.slice(0, 100).map((entry, idx) => ({
    ...entry,
    rank: idx + 1,
    title: computeRankTitle(entry.score, entry.wins, entry.kills),
  }));

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Could not write real_leaderboard.json:', e);
  }
}

function addLiveFeedEvent(
  playerName: string,
  clanTag: string,
  text: string,
  type: LiveFeedEvent['type']
) {
  const ev: LiveFeedEvent = {
    id: 'ev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    playerName,
    clanTag: clanTag || '',
    text,
    timestamp: Date.now(),
    type,
  };
  state.recentEvents.unshift(ev);
  if (state.recentEvents.length > 25) {
    state.recentEvents = state.recentEvents.slice(0, 25);
  }
}

// Multiplayer Co-op Rooms in memory
interface RoomPlayer {
  id: string;
  name: string;
  clanTag?: string;
  kills: number;
  health: number;
  score: number;
  sector: string;
  lastSeen: number;
}

interface Room {
  code: string;
  host: string;
  arena: string;
  players: Record<string, RoomPlayer>;
  wave: number;
  totalKills: number;
  status: 'lobby' | 'in_game' | 'victory' | 'defeat';
  updatedAt: number;
}

const rooms: Record<string, Room> = {};

// WebSocket Server for Real-Time Leaderboard & Friends Presence Sync
const wss = new WebSocketServer({ server, path: '/ws' });

function getPublicLeaderboardPayload() {
  const now = Date.now();
  const onlineNames = new Set<string>();
  connectedClients.forEach((meta) => {
    if (meta.playerName) onlineNames.add(meta.playerName.toLowerCase());
  });

  const enrichedLeaderboard = state.leaderboard.map((entry) => ({
    ...entry,
    isOnline:
      onlineNames.has(entry.name.toLowerCase()) || now - (entry.lastSeen || 0) < 90000,
  }));

  return {
    leaderboard: enrichedLeaderboard,
    derbyStats: state.derbyStats,
    recentEvents: state.recentEvents,
    onlineCount: Math.max(1, connectedClients.size),
  };
}

function broadcastLeaderboardSync() {
  const payload = JSON.stringify({
    type: 'leaderboard:sync',
    data: getPublicLeaderboardPayload(),
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

wss.on('connection', (ws) => {
  connectedClients.set(ws, {});

  // Send immediate initial sync
  ws.send(
    JSON.stringify({
      type: 'leaderboard:sync',
      data: getPublicLeaderboardPayload(),
    })
  );

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      // Bind session for cross-device single-active-session revocation
      if (msg.type === 'auth:bind_session' && typeof msg.token === 'string') {
        const accountId = authStore.getAccountIdBySession(msg.token);
        if (accountId) {
          // Invalidate and notify any other active connection for the same account on a DIFFERENT device (different token)
          connectedClients.forEach((meta, client) => {
            if (
              client !== ws &&
              meta.accountId === accountId &&
              meta.sessionToken &&
              meta.sessionToken !== msg.token &&
              client.readyState === WebSocket.OPEN
            ) {
              try {
                client.send(
                  JSON.stringify({
                    type: 'auth:session_superseded',
                    reason:
                      'Dein Account wurde auf einem anderen Gerät angemeldet. Aus Sicherheitsgründen kann immer nur 1 aktives Gerät eingeloggt sein.',
                  })
                );
                client.close(4001, 'Session superseded');
              } catch {}
            }
          });

          const currentMeta = connectedClients.get(ws) || {};
          currentMeta.accountId = accountId;
          currentMeta.sessionToken = msg.token;
          connectedClients.set(ws, currentMeta);
        }
      }

      if (msg.type === 'player:presence' && msg.playerName) {
        const cleanName = String(msg.playerName).trim().slice(0, 22);
        const cleanTag = String(msg.clanTag || '')
          .trim()
          .toUpperCase()
          .slice(0, 6);
        const meta = connectedClients.get(ws) || {};
        meta.playerName = cleanName;
        meta.clanTag = cleanTag;
        connectedClients.set(ws, meta);

        const existing = state.leaderboard.find(
          (p) => p.name.toLowerCase() === cleanName.toLowerCase()
        );
        if (existing) {
          existing.lastSeen = Date.now();
          if (cleanTag) existing.clanTag = cleanTag;
          if (msg.currentArena) existing.currentArena = msg.currentArena;
          if (msg.statusText) existing.statusText = msg.statusText;
          if (typeof msg.unlockedMapsCount === 'number') {
            existing.unlockedMapsCount = Math.max(
              existing.unlockedMapsCount || 1,
              msg.unlockedMapsCount
            );
          }
          if (msg.signatureWeapon) existing.signatureWeapon = msg.signatureWeapon;
        }
        broadcastLeaderboardSync();
      }
    } catch {}
  });

  ws.on('close', () => {
    connectedClients.delete(ws);
    broadcastLeaderboardSync();
  });
});

// API Route: Register / Update Real Operator Profile on Startup
app.post('/api/leaderboard/register', (req, res) => {
  const {
    name,
    clanTag = '61267',
    city = 'Neu-Anspach',
    unlockedMapsCount = 1,
    signatureWeapon = 'XM4 Bembel-Sturmgewehr',
    currentArena = 'Freilichtmuseum Hessenpark',
  } = req.body;

  const cleanName = String(name || '').trim().slice(0, 22);
  if (!cleanName || cleanName.length < 2) {
    return res.status(400).json({ error: 'Bitte gib einen gültigen Benutzernamen (mind. 2 Zeichen) ein.' });
  }

  const cleanTag = String(clanTag || '')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .toUpperCase()
    .slice(0, 6);

  const existingIndex = state.leaderboard.findIndex(
    (p) => p.name.toLowerCase() === cleanName.toLowerCase()
  );

  if (existingIndex >= 0) {
    const entry = state.leaderboard[existingIndex];
    entry.name = cleanName;
    entry.clanTag = cleanTag || entry.clanTag;
    entry.city = city || entry.city;
    entry.unlockedMapsCount = Math.max(entry.unlockedMapsCount || 1, unlockedMapsCount);
    entry.signatureWeapon = signatureWeapon || entry.signatureWeapon;
    entry.currentArena = currentArena || entry.currentArena;
    entry.statusText = `Einsatzbereit in ${currentArena}`;
    entry.lastSeen = Date.now();
  } else {
    state.leaderboard.push({
      id: 'op_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name: cleanName,
      clanTag: cleanTag,
      city: city || 'Neu-Anspach',
      score: 0,
      bestMatchScore: 0,
      kills: 0,
      wins: 0,
      highestWave: 1,
      unlockedMapsCount: Math.max(1, unlockedMapsCount),
      signatureWeapon: signatureWeapon || 'XM4 Bembel-Sturmgewehr',
      currentArena: currentArena || 'Freilichtmuseum Hessenpark',
      statusText: 'Neu registriert · Im Einsatz',
      lastSeen: Date.now(),
      rank: state.leaderboard.length + 1,
      title: 'Anspach-Einsatzkraft',
    });

    addLiveFeedEvent(
      cleanName,
      cleanTag,
      `ist dem Taunus-Einsatznetzwerk beigetreten (${city})!`,
      'join'
    );
  }

  sortAndSaveLeaderboard();
  broadcastLeaderboardSync();

  res.json({
    success: true,
    ...getPublicLeaderboardPayload(),
  });
});

// API Route: Get Real Leaderboard
app.get('/api/leaderboard', (_req, res) => {
  res.json(getPublicLeaderboardPayload());
});

// API Route: Submit Real Match / Wave Score
app.post('/api/leaderboard/submit', (req, res) => {
  const {
    name,
    clanTag = '',
    score = 0,
    kills = 0,
    wave = 1,
    victory = false,
    city = 'Neu-Anspach',
    unlockedMapsCount = 1,
    signatureWeapon = 'XM4 Bembel-Sturmgewehr',
    currentArena = 'Freilichtmuseum Hessenpark',
    eventNotice,
  } = req.body;

  const cleanName = String(name || '').trim().slice(0, 22);
  if (!cleanName) {
    return res.status(400).json({ error: 'Ungültiger Benutzername' });
  }

  const cleanTag = String(clanTag || '')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .toUpperCase()
    .slice(0, 6);

  const numericScore = Math.max(0, Math.round(Number(score) || 0));
  const numericKills = Math.max(0, Math.round(Number(kills) || 0));
  const numericWave = Math.max(1, Math.round(Number(wave) || 1));

  // Update real derby points
  if (numericScore > 0 || victory) {
    if (city === 'Neu-Anspach') {
      state.derbyStats.neuAnspachPoints += Math.floor(numericScore * 0.25) + (victory ? 300 : 40);
    } else {
      state.derbyStats.wehrheimPoints += Math.floor(numericScore * 0.25) + (victory ? 300 : 40);
    }
    state.derbyStats.totalBattles += 1;
    state.derbyStats.currentContestedDistrict = currentArena || 'Freilichtmuseum Hessenpark';
  }

  const existingIndex = state.leaderboard.findIndex(
    (p) => p.name.toLowerCase() === cleanName.toLowerCase()
  );

  if (existingIndex >= 0) {
    const p = state.leaderboard[existingIndex];
    p.score += numericScore;
    p.bestMatchScore = Math.max(p.bestMatchScore || 0, numericScore);
    p.kills += numericKills;
    if (victory) p.wins = (p.wins || 0) + 1;
    p.highestWave = Math.max(p.highestWave || 1, numericWave);
    p.unlockedMapsCount = Math.max(p.unlockedMapsCount || 1, unlockedMapsCount);
    if (cleanTag) p.clanTag = cleanTag;
    if (city) p.city = city;
    if (signatureWeapon) p.signatureWeapon = signatureWeapon;
    if (currentArena) p.currentArena = currentArena;
    p.statusText = victory
      ? `Victory Royale in ${currentArena}!`
      : `Welle ${numericWave} in ${currentArena} (+${numericScore} Pkt)`;
    p.lastSeen = Date.now();
  } else {
    state.leaderboard.push({
      id: 'op_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name: cleanName,
      clanTag: cleanTag,
      city: city || 'Neu-Anspach',
      score: numericScore,
      bestMatchScore: numericScore,
      kills: numericKills,
      wins: victory ? 1 : 0,
      highestWave: numericWave,
      unlockedMapsCount: Math.max(1, unlockedMapsCount),
      signatureWeapon: signatureWeapon || 'XM4 Bembel-Sturmgewehr',
      currentArena: currentArena || 'Freilichtmuseum Hessenpark',
      statusText: victory ? `Victory Royale in ${currentArena}!` : `Im Gefecht (${currentArena})`,
      lastSeen: Date.now(),
      rank: state.leaderboard.length + 1,
      title: computeRankTitle(numericScore, victory ? 1 : 0, numericKills),
    });
  }

  if (eventNotice) {
    addLiveFeedEvent(cleanName, cleanTag, eventNotice, 'unlock');
  } else if (victory) {
    addLiveFeedEvent(
      cleanName,
      cleanTag,
      `hat ${currentArena} siegreich verteidigt (+${numericScore} Pkt, ${numericKills} Kills)!`,
      'victory'
    );
  } else if (numericScore > 0) {
    addLiveFeedEvent(
      cleanName,
      cleanTag,
      `hat Welle ${numericWave} in ${currentArena} abgeschlossen (+${numericScore} Pkt, ${numericKills} Kills).`,
      'wave'
    );
  }

  sortAndSaveLeaderboard();
  broadcastLeaderboardSync();

  res.json({
    success: true,
    ...getPublicLeaderboardPayload(),
  });
});

// API Route: Gemini Pro Master Commander for Multi-Agent Direction
app.post('/api/ai/commander', async (req, res) => {
  try {
    const { arena, wave, playerHealth, budget, activeWeapons, currentPerks } = req.body;

    const prompt = `
Du bist der taktische Ober-General "Groß-Kommandeur Feldberg-Stier" und koordinierst als Master-KI die Schlacht zwischen 61267 Neu-Anspach und den angreifenden Wehrheimern (aus dem Apfeldorf Wehrheim / Freizeitpark Lochmühle).
Aktuelle Lage:
- Arena: ${arena || 'Freilichtmuseum Hessenpark'}
- Wehrheim-Angriffswelle: ${wave || 1}
- Spieler-Gesundheit: ${playerHealth || 100}%
- Stadtkasse Neu-Anspach: ${budget || 500} NAT (Neu-Anspach-Taler)
- Ausrüstung: ${(activeWeapons || ['Bembel-Kanone']).join(', ')}
- Stadtinfrastruktur-Perks: ${(currentPerks || []).join(', ')}

Aufgabe:
Orchestriere die kleineren Sub-Agenten (die Wehrheimer Bot-Einheiten) und gib dem Neu-Anspacher Spieler strategische Anweisungen.
Antworte im validen JSON-Format:
{
  "commanderName": "Groß-Kommandeur Feldberg-Stier",
  "tacticalDirective": "1-2 Sätze taktische Gesamtanalyse für Neu-Anspach",
  "hessianCombatBark": "Ein humorvoller, authentischer hessischer Funkspruch (z.B. Dialekt wie 'Ei gude wie!', 'Die Wehrheimer stürme mit de Apfel-Trecker!', 'Gebt'ne Saures mit'm Bembel!')",
  "wehrheimAgentsOrders": {
    "flankers": "Verhalten der schnellen Wehrheimer Apfel-Flankierer",
    "snipers": "Ziel der Apfelschützen aus Wehrheim",
    "shocktroopers": "Einsatzbefehl der Lochmühle-Zwerge und Traktor-Horden"
  },
  "tycoonCrisisEvent": {
    "title": "Kurzer Name für ein Stadt-Event (z.B. 'Äppler-Spende der Kelterei' oder 'Taunusbahn-Sonderzug')",
    "description": "Erklärung des Events für Neu-Anspach",
    "budgetBonus": 150,
    "recommendedUpgrade": "Eine städtische Infrastruktur zum Ausbauen"
  }
}
Gib AUSSCHLIESSLICH das reine JSON ohne Markdown-Codeblöcke zurück.
`;

    let resultJson: any = null;

    const callModel = async (model: string, config: any, ms = 7000) => {
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms));
      const req = ai.models.generateContent({ model, contents: prompt, config });
      return Promise.race([req, timeout]) as Promise<any>;
    };

    try {
      const response = await callModel('gemini-4-argon', {
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
        responseMimeType: 'application/json',
      }, 7000);

      const text = response.text || '{}';
      resultJson = JSON.parse(text);
    } catch (modelError: any) {
      console.warn('Fallback to gemini-3.8-flash for commander:', modelError?.message);
      try {
        const fallbackResponse = await callModel('gemini-3.8-flash', {
          responseMimeType: 'application/json',
        }, 5000);
        const text = fallbackResponse.text || '{}';
        resultJson = JSON.parse(text);
      } catch (e) {
        console.warn('Using procedural commander preset');
      }
    }

    if (!resultJson) {
      throw new Error('Fallback to preset');
    }

    res.json({ success: true, commander: resultJson });
  } catch (error: any) {
    console.error('Gemini Commander error:', error);
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
  }
});

// API Route: Multiplayer Rooms
app.get('/api/multiplayer/rooms', (_req, res) => {
  const now = Date.now();
  for (const code in rooms) {
    if (now - rooms[code].updatedAt > 600000) {
      delete rooms[code];
    }
  }
  res.json({ rooms: Object.values(rooms) });
});

app.post('/api/multiplayer/join', (req, res) => {
  const { code, playerName, clanTag, arena = 'Freilichtmuseum Hessenpark' } = req.body;
  const roomCode = (code || Math.floor(1000 + Math.random() * 9000).toString()).toUpperCase();

  if (!rooms[roomCode]) {
    rooms[roomCode] = {
      code: roomCode,
      host: playerName || 'Operator',
      arena,
      players: {},
      wave: 1,
      totalKills: 0,
      status: 'lobby',
      updatedAt: Date.now(),
    };
  }

  const playerId = 'p_' + Math.random().toString(36).substring(2, 9);
  rooms[roomCode].players[playerId] = {
    id: playerId,
    name: playerName || 'Operator',
    clanTag: clanTag || '61267',
    kills: 0,
    health: 100,
    score: 0,
    sector: 'Marktplatz',
    lastSeen: Date.now(),
  };
  rooms[roomCode].updatedAt = Date.now();

  res.json({
    success: true,
    room: rooms[roomCode],
    playerId,
  });
});

app.post('/api/multiplayer/update', (req, res) => {
  const { roomCode, playerId, kills, health, score, wave } = req.body;
  if (!roomCode || !rooms[roomCode] || !playerId) {
    return res.status(404).json({ error: 'Raum oder Spieler nicht gefunden' });
  }

  const room = rooms[roomCode];
  if (room.players[playerId]) {
    room.players[playerId].kills = kills ?? room.players[playerId].kills;
    room.players[playerId].health = health ?? room.players[playerId].health;
    room.players[playerId].score = score ?? room.players[playerId].score;
    room.players[playerId].lastSeen = Date.now();
  }
  if (typeof wave === 'number') {
    room.wave = Math.max(room.wave, wave);
  }
  room.totalKills = Object.values(room.players).reduce((acc, p) => acc + (p.kills || 0), 0);
  room.updatedAt = Date.now();

  res.json({ success: true, room });
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Setup Vite or Static
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server + Real-Time WebSocket running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
