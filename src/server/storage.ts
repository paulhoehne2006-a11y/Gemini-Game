import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', '..', 'data');

export interface LegalConsentRecord {
  acceptedAt: string;
  noticeVersion: string;
  privacyPolicyVersion: string;
  termsVersion: string;
}

export interface StoredAccount {
  id: string;
  username: string;
  clanTag: string;
  faction: 'neu-anspach' | 'wehrheim';
  passwordSalt: string;
  passwordHash: string;
  authProvider?: 'password' | 'google';
  googleSub?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  legalConsent: LegalConsentRecord;
  createdAt: string;
}

export interface StoredSession {
  id: string;
  accountId: string;
  tokenHash: string;
  csrfToken: string;
  createdAt: string;
  expiresAt: string;
  revokedAt?: string;
}

export interface StoredLeaderboardEntry {
  id: string;
  accountId?: string;
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
  rank?: number;
  title?: string;
}

export interface StoredDerbyStats {
  neuAnspachPoints: number;
  wehrheimPoints: number;
  totalBattles: number;
  currentContestedDistrict: string;
}

export interface StoredLiveFeedEvent {
  id: string;
  playerName: string;
  clanTag: string;
  text: string;
  timestamp: number;
  type: 'join' | 'victory' | 'wave' | 'unlock' | 'upgrade';
}

export interface StoredGameProgress {
  accountId: string;
  budget: number;
  reputation: number;
  operatorLevel: number;
  skillPoints: number;
  totalWins: number;
  facilities: Record<string, any>;
  unlockedMaps: string[];
  mapLevels: Record<string, number>;
  skillTree: Record<string, number>;
  weaponUpgrades: Record<string, any>;
  dailyMissions: any;
  careerStats: any;
  updatedAt: number;
}

export interface StoredRoomPlayer {
  id: string;
  accountId?: string;
  name: string;
  clanTag?: string;
  kills: number;
  health: number;
  score: number;
  sector: string;
  lastSeen: number;
}

export interface StoredRoom {
  code: string;
  hostAccountId?: string;
  hostName: string;
  arena: string;
  players: Record<string, StoredRoomPlayer>;
  wave: number;
  totalKills: number;
  status: 'lobby' | 'in_game' | 'victory' | 'defeat';
  updatedAt: number;
  createdAt: number;
}

export interface GameStorage {
  type: 'sqlite' | 'postgres' | 'json';
  init(): Promise<void>;
  close(): Promise<void>;

  // Accounts
  getAccountById(id: string): Promise<StoredAccount | null>;
  getAccountByUsername(username: string): Promise<StoredAccount | null>;
  getAccountByGoogleSub(googleSub: string): Promise<StoredAccount | null>;
  saveAccount(account: StoredAccount): Promise<void>;
  deleteAccount(id: string): Promise<void>;

  // Sessions
  createSession(session: StoredSession): Promise<void>;
  getSessionByTokenHash(tokenHash: string): Promise<StoredSession | null>;
  revokeSessionByTokenHash(tokenHash: string): Promise<void>;
  revokeActiveSessionsForAccount(accountId: string, exceptTokenHash?: string): Promise<void>;
  cleanupExpiredSessions(): Promise<void>;

  // Leaderboard
  getLeaderboard(): Promise<StoredLeaderboardEntry[]>;
  saveLeaderboardEntry(entry: StoredLeaderboardEntry): Promise<void>;
  deleteLeaderboardEntryByName(name: string): Promise<void>;

  // Derby stats
  getDerbyStats(): Promise<StoredDerbyStats>;
  saveDerbyStats(stats: StoredDerbyStats): Promise<void>;

  // Live events
  getRecentEvents(limit?: number): Promise<StoredLiveFeedEvent[]>;
  addRecentEvent(event: StoredLiveFeedEvent): Promise<void>;

  // Multiplayer Rooms
  getRooms(): Promise<Record<string, StoredRoom>>;
  getRoom(code: string): Promise<StoredRoom | null>;
  saveRoom(room: StoredRoom): Promise<void>;
  deleteRoom(code: string): Promise<void>;
  cleanupStaleRooms(maxAgeMs: number): Promise<void>;

  // Game Progress / Cloud Save
  getGameProgress(accountId: string): Promise<StoredGameProgress | null>;
  saveGameProgress(progress: StoredGameProgress): Promise<void>;
}

// ---------------------------------------------------------------------------
// 1. SQLite Storage Adapter (Node.js 22 built-in node:sqlite)
// ---------------------------------------------------------------------------
export class SqliteStorageAdapter implements GameStorage {
  readonly type = 'sqlite';
  private db: any = null;
  private readonly dbPath: string;

  constructor(customPath?: string) {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    this.dbPath = customPath || process.env.SQLITE_DB_PATH || path.join(DATA_DIR, 'game.sqlite');
  }

  async init(): Promise<void> {
    const { DatabaseSync } = await import('node:sqlite');
    this.db = new DatabaseSync(this.dbPath);

    // Performance & durability settings with container fallback
    try {
      this.db.exec('PRAGMA journal_mode = WAL;');
    } catch {
      try {
        this.db.exec('PRAGMA journal_mode = DELETE;');
      } catch {}
    }
    try {
      this.db.exec(`
        PRAGMA synchronous = NORMAL;
        PRAGMA busy_timeout = 5000;
      `);
    } catch {}

    // Schema initialization
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        clan_tag TEXT NOT NULL,
        faction TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        auth_provider TEXT NOT NULL DEFAULT 'password',
        google_sub TEXT,
        email TEXT,
        avatar_url TEXT,
        legal_consent TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL,
        token_hash TEXT UNIQUE NOT NULL,
        csrf_token TEXT NOT NULL,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        revoked_at TEXT,
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS leaderboard (
        id TEXT PRIMARY KEY,
        account_id TEXT,
        name TEXT UNIQUE NOT NULL,
        clan_tag TEXT NOT NULL,
        city TEXT NOT NULL,
        score INTEGER NOT NULL DEFAULT 0,
        best_match_score INTEGER NOT NULL DEFAULT 0,
        kills INTEGER NOT NULL DEFAULT 0,
        wins INTEGER NOT NULL DEFAULT 0,
        highest_wave INTEGER NOT NULL DEFAULT 1,
        unlocked_maps_count INTEGER NOT NULL DEFAULT 1,
        signature_weapon TEXT NOT NULL,
        current_arena TEXT NOT NULL,
        status_text TEXT NOT NULL,
        last_seen INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS derby_stats (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        neu_anspach_points INTEGER NOT NULL DEFAULT 0,
        wehrheim_points INTEGER NOT NULL DEFAULT 0,
        total_battles INTEGER NOT NULL DEFAULT 0,
        current_contested_district TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS live_events (
        id TEXT PRIMARY KEY,
        player_name TEXT NOT NULL,
        clan_tag TEXT NOT NULL,
        text TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        type TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS rooms (
        code TEXT PRIMARY KEY,
        host_account_id TEXT,
        host_name TEXT NOT NULL,
        arena TEXT NOT NULL,
        players_json TEXT NOT NULL,
        wave INTEGER NOT NULL DEFAULT 1,
        total_kills INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'lobby',
        updated_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
      CREATE INDEX IF NOT EXISTS idx_sessions_account_id ON sessions(account_id);
      CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard(score DESC);
      CREATE INDEX IF NOT EXISTS idx_live_events_timestamp ON live_events(timestamp DESC);

      CREATE TABLE IF NOT EXISTS game_progress (
        account_id TEXT PRIMARY KEY,
        budget INTEGER NOT NULL DEFAULT 500,
        reputation INTEGER NOT NULL DEFAULT 0,
        operator_level INTEGER NOT NULL DEFAULT 1,
        skill_points INTEGER NOT NULL DEFAULT 0,
        total_wins INTEGER NOT NULL DEFAULT 0,
        facilities_json TEXT NOT NULL,
        unlocked_maps_json TEXT NOT NULL,
        map_levels_json TEXT NOT NULL,
        skill_tree_json TEXT NOT NULL,
        weapon_upgrades_json TEXT NOT NULL,
        daily_missions_json TEXT NOT NULL,
        career_stats_json TEXT NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_rooms_updated_at ON rooms(updated_at);
    `);

    // Ensure Google OAuth columns exist on pre-existing SQLite databases
    const accountColumns = this.db.prepare('PRAGMA table_info(accounts)').all() as Array<{ name: string }>;
    const colNames = new Set(accountColumns.map((c) => c.name));
    if (!colNames.has('auth_provider')) {
      this.db.exec("ALTER TABLE accounts ADD COLUMN auth_provider TEXT NOT NULL DEFAULT 'password';");
    }
    if (!colNames.has('google_sub')) {
      this.db.exec('ALTER TABLE accounts ADD COLUMN google_sub TEXT;');
    }
    if (!colNames.has('email')) {
      this.db.exec('ALTER TABLE accounts ADD COLUMN email TEXT;');
    }
    if (!colNames.has('avatar_url')) {
      this.db.exec('ALTER TABLE accounts ADD COLUMN avatar_url TEXT;');
    }
    this.db.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_google_sub
      ON accounts(google_sub)
      WHERE google_sub IS NOT NULL;
    `);

    // Ensure default derby_stats row exists
    const row = this.db.prepare('SELECT id FROM derby_stats WHERE id = 1').get();
    if (!row) {
      this.db.prepare(`
        INSERT INTO derby_stats (id, neu_anspach_points, wehrheim_points, total_battles, current_contested_district)
        VALUES (1, 1420, 1180, 48, 'Freilichtmuseum Hessenpark')
      `).run();
    }

    // Auto-migrate from JSON files if database was just created
    await this.migrateFromJsonIfEmpty();
  }

  private async migrateFromJsonIfEmpty(): Promise<void> {
    const accountCount = this.db.prepare('SELECT COUNT(*) as count FROM accounts').get() as { count: number };
    if (accountCount.count === 0) {
      const accountsJsonPath = path.join(DATA_DIR, 'accounts.json');
      if (fs.existsSync(accountsJsonPath)) {
        try {
          const raw = fs.readFileSync(accountsJsonPath, 'utf-8');
          const data = JSON.parse(raw);
          if (Array.isArray(data.accounts)) {
            const insertStmt = this.db.prepare(`
              INSERT OR IGNORE INTO accounts (
                id, username, clan_tag, faction, password_salt, password_hash,
                auth_provider, google_sub, email, avatar_url, legal_consent, created_at
              )
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            for (const acc of data.accounts) {
              insertStmt.run(
                acc.id,
                acc.username,
                acc.clanTag || '61267',
                acc.faction || 'neu-anspach',
                acc.passwordSalt || '',
                acc.passwordHash || '',
                acc.authProvider || 'password',
                acc.googleSub || null,
                acc.email || null,
                acc.avatarUrl || null,
                JSON.stringify(acc.legalConsent || {}),
                acc.createdAt || new Date().toISOString()
              );
            }
          }
        } catch (e) {
          console.warn('SQLite migration: Could not parse accounts.json:', e);
        }
      }
    }

    const leaderboardCount = this.db.prepare('SELECT COUNT(*) as count FROM leaderboard').get() as { count: number };
    if (leaderboardCount.count === 0) {
      const leaderboardJsonPath = path.join(DATA_DIR, 'real_leaderboard.json');
      if (fs.existsSync(leaderboardJsonPath)) {
        try {
          const raw = fs.readFileSync(leaderboardJsonPath, 'utf-8');
          const data = JSON.parse(raw);
          if (Array.isArray(data.leaderboard)) {
            const insertStmt = this.db.prepare(`
              INSERT OR IGNORE INTO leaderboard (id, account_id, name, clan_tag, city, score, best_match_score, kills, wins, highest_wave, unlocked_maps_count, signature_weapon, current_arena, status_text, last_seen)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            for (const entry of data.leaderboard) {
              insertStmt.run(
                entry.id || `op_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                null,
                entry.name,
                entry.clanTag || '61267',
                entry.city || 'Neu-Anspach',
                entry.score || 0,
                entry.bestMatchScore || entry.score || 0,
                entry.kills || 0,
                entry.wins || 0,
                entry.highestWave || 1,
                entry.unlockedMapsCount || 1,
                entry.signatureWeapon || 'XM4 Bembel-Sturmgewehr',
                entry.currentArena || 'Freilichtmuseum Hessenpark',
                entry.statusText || 'Im Einsatz',
                entry.lastSeen || Date.now()
              );
            }
          }
          if (data.derbyStats) {
            this.db.prepare(`
              UPDATE derby_stats
              SET neu_anspach_points = ?, wehrheim_points = ?, total_battles = ?, current_contested_district = ?
              WHERE id = 1
            `).run(
              data.derbyStats.neuAnspachPoints || 0,
              data.derbyStats.wehrheimPoints || 0,
              data.derbyStats.totalBattles || 0,
              data.derbyStats.currentContestedDistrict || 'Freilichtmuseum Hessenpark'
            );
          }
        } catch (e) {
          console.warn('SQLite migration: Could not parse real_leaderboard.json:', e);
        }
      }
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  private mapSqliteAccount(row: any): StoredAccount {
    return {
      id: row.id,
      username: row.username,
      clanTag: row.clan_tag,
      faction: row.faction as any,
      passwordSalt: row.password_salt,
      passwordHash: row.password_hash,
      authProvider: (row.auth_provider || 'password') as 'password' | 'google',
      googleSub: row.google_sub || null,
      email: row.email || null,
      avatarUrl: row.avatar_url || null,
      legalConsent: typeof row.legal_consent === 'string' ? JSON.parse(row.legal_consent) : row.legal_consent,
      createdAt: row.created_at,
    };
  }

  async getAccountById(id: string): Promise<StoredAccount | null> {
    const row = this.db.prepare('SELECT * FROM accounts WHERE id = ?').get(id) as any;
    if (!row) return null;
    return this.mapSqliteAccount(row);
  }

  async getAccountByUsername(username: string): Promise<StoredAccount | null> {
    const row = this.db.prepare('SELECT * FROM accounts WHERE LOWER(username) = LOWER(?)').get(username.trim()) as any;
    if (!row) return null;
    return this.mapSqliteAccount(row);
  }

  async getAccountByGoogleSub(googleSub: string): Promise<StoredAccount | null> {
    if (!googleSub) return null;
    const row = this.db.prepare('SELECT * FROM accounts WHERE google_sub = ?').get(googleSub.trim()) as any;
    if (!row) return null;
    return this.mapSqliteAccount(row);
  }

  async saveAccount(account: StoredAccount): Promise<void> {
    this.db.prepare(`
      INSERT INTO accounts (
        id, username, clan_tag, faction, password_salt, password_hash,
        auth_provider, google_sub, email, avatar_url, legal_consent, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        username = excluded.username,
        clan_tag = excluded.clan_tag,
        faction = excluded.faction,
        password_salt = excluded.password_salt,
        password_hash = excluded.password_hash,
        auth_provider = excluded.auth_provider,
        google_sub = excluded.google_sub,
        email = excluded.email,
        avatar_url = excluded.avatar_url,
        legal_consent = excluded.legal_consent
    `).run(
      account.id,
      account.username,
      account.clanTag,
      account.faction,
      account.passwordSalt,
      account.passwordHash,
      account.authProvider || 'password',
      account.googleSub || null,
      account.email || null,
      account.avatarUrl || null,
      JSON.stringify(account.legalConsent),
      account.createdAt
    );
  }

  async deleteAccount(id: string): Promise<void> {
    this.db.prepare('DELETE FROM accounts WHERE id = ?').run(id);
    this.db.prepare('DELETE FROM sessions WHERE account_id = ?').run(id);
    this.db.prepare('DELETE FROM game_progress WHERE account_id = ?').run(id);
  }

  async createSession(session: StoredSession): Promise<void> {
    this.db.prepare(`
      INSERT INTO sessions (id, account_id, token_hash, csrf_token, created_at, expires_at, revoked_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      session.id,
      session.accountId,
      session.tokenHash,
      session.csrfToken,
      session.createdAt,
      session.expiresAt,
      session.revokedAt || null
    );
  }

  async getSessionByTokenHash(tokenHash: string): Promise<StoredSession | null> {
    const now = new Date().toISOString();
    const row = this.db.prepare(`
      SELECT * FROM sessions
      WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > ?
    `).get(tokenHash, now) as any;
    if (!row) return null;
    return {
      id: row.id,
      accountId: row.account_id,
      tokenHash: row.token_hash,
      csrfToken: row.csrf_token,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      revokedAt: row.revoked_at || undefined,
    };
  }

  async revokeSessionByTokenHash(tokenHash: string): Promise<void> {
    const now = new Date().toISOString();
    this.db.prepare(`
      UPDATE sessions SET revoked_at = ? WHERE token_hash = ? AND revoked_at IS NULL
    `).run(now, tokenHash);
  }

  async revokeActiveSessionsForAccount(accountId: string, exceptTokenHash?: string): Promise<void> {
    const now = new Date().toISOString();
    if (exceptTokenHash) {
      this.db.prepare(`
        UPDATE sessions SET revoked_at = ?
        WHERE account_id = ? AND token_hash != ? AND revoked_at IS NULL
      `).run(now, accountId, exceptTokenHash);
    } else {
      this.db.prepare(`
        UPDATE sessions SET revoked_at = ?
        WHERE account_id = ? AND revoked_at IS NULL
      `).run(now, accountId);
    }
  }

  async cleanupExpiredSessions(): Promise<void> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    this.db.prepare(`
      DELETE FROM sessions
      WHERE expires_at < ? OR (revoked_at IS NOT NULL AND revoked_at < ?)
    `).run(cutoff, cutoff);
  }

  async getLeaderboard(): Promise<StoredLeaderboardEntry[]> {
    const rows = this.db.prepare(`
      SELECT * FROM leaderboard
      ORDER BY score DESC, wins DESC, kills DESC
      LIMIT 100
    `).all() as any[];

    return rows.map((r, idx) => ({
      id: r.id,
      accountId: r.account_id || undefined,
      name: r.name,
      clanTag: r.clan_tag,
      city: r.city,
      score: r.score,
      bestMatchScore: r.best_match_score,
      kills: r.kills,
      wins: r.wins,
      highestWave: r.highest_wave,
      unlockedMapsCount: r.unlocked_maps_count,
      signatureWeapon: r.signature_weapon,
      currentArena: r.current_arena,
      statusText: r.status_text,
      lastSeen: r.last_seen,
      rank: idx + 1,
    }));
  }

  async saveLeaderboardEntry(entry: StoredLeaderboardEntry): Promise<void> {
    this.db.prepare(`
      INSERT INTO leaderboard (
        id, account_id, name, clan_tag, city, score, best_match_score, kills, wins,
        highest_wave, unlocked_maps_count, signature_weapon, current_arena, status_text, last_seen
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(name) DO UPDATE SET
        account_id = COALESCE(excluded.account_id, leaderboard.account_id),
        clan_tag = excluded.clan_tag,
        city = excluded.city,
        score = excluded.score,
        best_match_score = excluded.best_match_score,
        kills = excluded.kills,
        wins = excluded.wins,
        highest_wave = excluded.highest_wave,
        unlocked_maps_count = excluded.unlocked_maps_count,
        signature_weapon = excluded.signature_weapon,
        current_arena = excluded.current_arena,
        status_text = excluded.status_text,
        last_seen = excluded.last_seen
    `).run(
      entry.id,
      entry.accountId || null,
      entry.name,
      entry.clanTag,
      entry.city,
      entry.score,
      entry.bestMatchScore,
      entry.kills,
      entry.wins,
      entry.highestWave,
      entry.unlockedMapsCount,
      entry.signatureWeapon,
      entry.currentArena,
      entry.statusText,
      entry.lastSeen
    );
  }

  async deleteLeaderboardEntryByName(name: string): Promise<void> {
    this.db.prepare('DELETE FROM leaderboard WHERE LOWER(name) = LOWER(?)').run(name.trim());
  }

  async getDerbyStats(): Promise<StoredDerbyStats> {
    const row = this.db.prepare('SELECT * FROM derby_stats WHERE id = 1').get() as any;
    if (!row) {
      return {
        neuAnspachPoints: 1420,
        wehrheimPoints: 1180,
        totalBattles: 48,
        currentContestedDistrict: 'Freilichtmuseum Hessenpark',
      };
    }
    return {
      neuAnspachPoints: row.neu_anspach_points,
      wehrheimPoints: row.wehrheim_points,
      totalBattles: row.total_battles,
      currentContestedDistrict: row.current_contested_district,
    };
  }

  async saveDerbyStats(stats: StoredDerbyStats): Promise<void> {
    this.db.prepare(`
      UPDATE derby_stats
      SET neu_anspach_points = ?, wehrheim_points = ?, total_battles = ?, current_contested_district = ?
      WHERE id = 1
    `).run(
      stats.neuAnspachPoints,
      stats.wehrheimPoints,
      stats.totalBattles,
      stats.currentContestedDistrict
    );
  }

  async getRecentEvents(limit = 25): Promise<StoredLiveFeedEvent[]> {
    const rows = this.db.prepare(`
      SELECT * FROM live_events
      ORDER BY timestamp DESC
      LIMIT ?
    `).all(limit) as any[];

    return rows.map((r) => ({
      id: r.id,
      playerName: r.player_name,
      clanTag: r.clan_tag,
      text: r.text,
      timestamp: r.timestamp,
      type: r.type as any,
    }));
  }

  async addRecentEvent(event: StoredLiveFeedEvent): Promise<void> {
    this.db.prepare(`
      INSERT OR REPLACE INTO live_events (id, player_name, clan_tag, text, timestamp, type)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      event.id,
      event.playerName,
      event.clanTag,
      event.text,
      event.timestamp,
      event.type
    );

    // Keep table bounded
    this.db.prepare(`
      DELETE FROM live_events
      WHERE id NOT IN (SELECT id FROM live_events ORDER BY timestamp DESC LIMIT 100)
    `).run();
  }

  async getRooms(): Promise<Record<string, StoredRoom>> {
    const rows = this.db.prepare('SELECT * FROM rooms').all() as any[];
    const result: Record<string, StoredRoom> = {};
    for (const r of rows) {
      result[r.code] = {
        code: r.code,
        hostAccountId: r.host_account_id || undefined,
        hostName: r.host_name,
        arena: r.arena,
        players: JSON.parse(r.players_json || '{}'),
        wave: r.wave,
        totalKills: r.total_kills,
        status: r.status,
        updatedAt: r.updated_at,
        createdAt: r.created_at,
      };
    }
    return result;
  }

  async getRoom(code: string): Promise<StoredRoom | null> {
    const r = this.db.prepare('SELECT * FROM rooms WHERE code = ?').get(code) as any;
    if (!r) return null;
    return {
      code: r.code,
      hostAccountId: r.host_account_id || undefined,
      hostName: r.host_name,
      arena: r.arena,
      players: JSON.parse(r.players_json || '{}'),
      wave: r.wave,
      totalKills: r.total_kills,
      status: r.status,
      updatedAt: r.updated_at,
      createdAt: r.created_at,
    };
  }

  async saveRoom(room: StoredRoom): Promise<void> {
    this.db.prepare(`
      INSERT INTO rooms (code, host_account_id, host_name, arena, players_json, wave, total_kills, status, updated_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(code) DO UPDATE SET
        host_account_id = excluded.host_account_id,
        host_name = excluded.host_name,
        arena = excluded.arena,
        players_json = excluded.players_json,
        wave = excluded.wave,
        total_kills = excluded.total_kills,
        status = excluded.status,
        updated_at = excluded.updated_at
    `).run(
      room.code,
      room.hostAccountId || null,
      room.hostName,
      room.arena,
      JSON.stringify(room.players),
      room.wave,
      room.totalKills,
      room.status,
      room.updatedAt,
      room.createdAt
    );
  }

  async deleteRoom(code: string): Promise<void> {
    this.db.prepare('DELETE FROM rooms WHERE code = ?').run(code);
  }

  async cleanupStaleRooms(maxAgeMs: number): Promise<void> {
    const threshold = Date.now() - maxAgeMs;
    this.db.prepare('DELETE FROM rooms WHERE updated_at < ?').run(threshold);
  }

  async getGameProgress(accountId: string): Promise<StoredGameProgress | null> {
    const row = this.db.prepare('SELECT * FROM game_progress WHERE account_id = ?').get(accountId) as any;
    if (!row) return null;
    return {
      accountId: row.account_id,
      budget: Number(row.budget),
      reputation: Number(row.reputation),
      operatorLevel: Number(row.operator_level),
      skillPoints: Number(row.skill_points),
      totalWins: Number(row.total_wins),
      facilities: JSON.parse(row.facilities_json || '{}'),
      unlockedMaps: JSON.parse(row.unlocked_maps_json || '[]'),
      mapLevels: JSON.parse(row.map_levels_json || '{}'),
      skillTree: JSON.parse(row.skill_tree_json || '{}'),
      weaponUpgrades: JSON.parse(row.weapon_upgrades_json || '{}'),
      dailyMissions: JSON.parse(row.daily_missions_json || '{}'),
      careerStats: JSON.parse(row.career_stats_json || '{}'),
      updatedAt: Number(row.updated_at),
    };
  }

  async saveGameProgress(progress: StoredGameProgress): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO game_progress (
        account_id, budget, reputation, operator_level, skill_points, total_wins,
        facilities_json, unlocked_maps_json, map_levels_json, skill_tree_json,
        weapon_upgrades_json, daily_missions_json, career_stats_json, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(account_id) DO UPDATE SET
        budget = excluded.budget,
        reputation = excluded.reputation,
        operator_level = excluded.operator_level,
        skill_points = excluded.skill_points,
        total_wins = excluded.total_wins,
        facilities_json = excluded.facilities_json,
        unlocked_maps_json = excluded.unlocked_maps_json,
        map_levels_json = excluded.map_levels_json,
        skill_tree_json = excluded.skill_tree_json,
        weapon_upgrades_json = excluded.weapon_upgrades_json,
        daily_missions_json = excluded.daily_missions_json,
        career_stats_json = excluded.career_stats_json,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      progress.accountId,
      Math.max(0, Math.floor(progress.budget)),
      Math.max(0, Math.floor(progress.reputation)),
      Math.max(1, Math.floor(progress.operatorLevel)),
      Math.max(0, Math.floor(progress.skillPoints)),
      Math.max(0, Math.floor(progress.totalWins)),
      JSON.stringify(progress.facilities || {}),
      JSON.stringify(progress.unlockedMaps || []),
      JSON.stringify(progress.mapLevels || {}),
      JSON.stringify(progress.skillTree || {}),
      JSON.stringify(progress.weaponUpgrades || {}),
      JSON.stringify(progress.dailyMissions || {}),
      JSON.stringify(progress.careerStats || {}),
      progress.updatedAt || Date.now()
    );
  }
}

// ---------------------------------------------------------------------------
// 2. PostgreSQL Storage Adapter (Production / Neon SQL / Render PostgreSQL)
// ---------------------------------------------------------------------------
export class PostgresStorageAdapter implements GameStorage {
  readonly type = 'postgres';
  private pool: pg.Pool | null = null;

  constructor(private readonly connectionString: string) {}

  async init(): Promise<void> {
    // Reject unauthorized only if explicitly requested, otherwise permit standard cloud DB SSL (Neon / Render)
    const sslConfig =
      this.connectionString.includes('localhost') || this.connectionString.includes('127.0.0.1')
        ? false
        : { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true' };

    this.pool = new pg.Pool({
      connectionString: this.connectionString,
      ssl: sslConfig,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id VARCHAR(64) PRIMARY KEY,
        username VARCHAR(32) UNIQUE NOT NULL,
        clan_tag VARCHAR(16) NOT NULL,
        faction VARCHAR(32) NOT NULL,
        password_salt VARCHAR(64) NOT NULL,
        password_hash VARCHAR(128) NOT NULL,
        auth_provider VARCHAR(32) NOT NULL DEFAULT 'password',
        google_sub VARCHAR(128) UNIQUE,
        email VARCHAR(255),
        avatar_url TEXT,
        legal_consent JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(64) PRIMARY KEY,
        account_id VARCHAR(64) NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        token_hash VARCHAR(64) UNIQUE NOT NULL,
        csrf_token VARCHAR(64) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        revoked_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS leaderboard (
        id VARCHAR(64) PRIMARY KEY,
        account_id VARCHAR(64),
        name VARCHAR(32) UNIQUE NOT NULL,
        clan_tag VARCHAR(16) NOT NULL,
        city VARCHAR(64) NOT NULL,
        score BIGINT NOT NULL DEFAULT 0,
        best_match_score BIGINT NOT NULL DEFAULT 0,
        kills INTEGER NOT NULL DEFAULT 0,
        wins INTEGER NOT NULL DEFAULT 0,
        highest_wave INTEGER NOT NULL DEFAULT 1,
        unlocked_maps_count INTEGER NOT NULL DEFAULT 1,
        signature_weapon VARCHAR(64) NOT NULL,
        current_arena VARCHAR(64) NOT NULL,
        status_text VARCHAR(128) NOT NULL,
        last_seen BIGINT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS derby_stats (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        neu_anspach_points BIGINT NOT NULL DEFAULT 0,
        wehrheim_points BIGINT NOT NULL DEFAULT 0,
        total_battles INTEGER NOT NULL DEFAULT 0,
        current_contested_district VARCHAR(64) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS live_events (
        id VARCHAR(64) PRIMARY KEY,
        player_name VARCHAR(32) NOT NULL,
        clan_tag VARCHAR(16) NOT NULL,
        text VARCHAR(255) NOT NULL,
        timestamp BIGINT NOT NULL,
        type VARCHAR(32) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS rooms (
        code VARCHAR(16) PRIMARY KEY,
        host_account_id VARCHAR(64),
        host_name VARCHAR(32) NOT NULL,
        arena VARCHAR(64) NOT NULL,
        players_json JSONB NOT NULL,
        wave INTEGER NOT NULL DEFAULT 1,
        total_kills INTEGER NOT NULL DEFAULT 0,
        status VARCHAR(32) NOT NULL DEFAULT 'lobby',
        updated_at BIGINT NOT NULL,
        created_at BIGINT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_pg_sessions_token_hash ON sessions(token_hash);
      CREATE INDEX IF NOT EXISTS idx_pg_sessions_account_id ON sessions(account_id);
      CREATE INDEX IF NOT EXISTS idx_pg_leaderboard_score ON leaderboard(score DESC);
      CREATE INDEX IF NOT EXISTS idx_pg_live_events_timestamp ON live_events(timestamp DESC);

      CREATE TABLE IF NOT EXISTS game_progress (
        account_id VARCHAR(64) PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
        budget BIGINT NOT NULL DEFAULT 500,
        reputation BIGINT NOT NULL DEFAULT 0,
        operator_level INTEGER NOT NULL DEFAULT 1,
        skill_points INTEGER NOT NULL DEFAULT 0,
        total_wins INTEGER NOT NULL DEFAULT 0,
        facilities_json JSONB NOT NULL,
        unlocked_maps_json JSONB NOT NULL,
        map_levels_json JSONB NOT NULL,
        skill_tree_json JSONB NOT NULL,
        weapon_upgrades_json JSONB NOT NULL,
        daily_missions_json JSONB NOT NULL,
        career_stats_json JSONB NOT NULL,
        updated_at BIGINT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_pg_rooms_updated_at ON rooms(updated_at);

      ALTER TABLE accounts ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(32) NOT NULL DEFAULT 'password';
      ALTER TABLE accounts ADD COLUMN IF NOT EXISTS google_sub VARCHAR(128);
      ALTER TABLE accounts ADD COLUMN IF NOT EXISTS email VARCHAR(255);
      ALTER TABLE accounts ADD COLUMN IF NOT EXISTS avatar_url TEXT;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_pg_accounts_google_sub ON accounts(google_sub) WHERE google_sub IS NOT NULL;
    `);

    // Ensure default derby_stats
    const derbyRes = await this.pool.query('SELECT id FROM derby_stats WHERE id = 1');
    if (derbyRes.rowCount === 0) {
      await this.pool.query(`
        INSERT INTO derby_stats (id, neu_anspach_points, wehrheim_points, total_battles, current_contested_district)
        VALUES (1, 1420, 1180, 48, 'Freilichtmuseum Hessenpark')
        ON CONFLICT DO NOTHING
      `);
    }
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  private mapPgAccount(r: any): StoredAccount {
    return {
      id: r.id,
      username: r.username,
      clanTag: r.clan_tag,
      faction: r.faction,
      passwordSalt: r.password_salt,
      passwordHash: r.password_hash,
      authProvider: (r.auth_provider || 'password') as 'password' | 'google',
      googleSub: r.google_sub || null,
      email: r.email || null,
      avatarUrl: r.avatar_url || null,
      legalConsent: r.legal_consent,
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
    };
  }

  async getAccountById(id: string): Promise<StoredAccount | null> {
    const res = await this.pool!.query('SELECT * FROM accounts WHERE id = $1', [id]);
    if (res.rowCount === 0) return null;
    return this.mapPgAccount(res.rows[0]);
  }

  async getAccountByUsername(username: string): Promise<StoredAccount | null> {
    const res = await this.pool!.query('SELECT * FROM accounts WHERE LOWER(username) = LOWER($1)', [username.trim()]);
    if (res.rowCount === 0) return null;
    return this.mapPgAccount(res.rows[0]);
  }

  async getAccountByGoogleSub(googleSub: string): Promise<StoredAccount | null> {
    if (!googleSub) return null;
    const res = await this.pool!.query('SELECT * FROM accounts WHERE google_sub = $1', [googleSub.trim()]);
    if (res.rowCount === 0) return null;
    return this.mapPgAccount(res.rows[0]);
  }

  async saveAccount(account: StoredAccount): Promise<void> {
    await this.pool!.query(
      `
      INSERT INTO accounts (
        id, username, clan_tag, faction, password_salt, password_hash,
        auth_provider, google_sub, email, avatar_url, legal_consent, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT(id) DO UPDATE SET
        username = EXCLUDED.username,
        clan_tag = EXCLUDED.clan_tag,
        faction = EXCLUDED.faction,
        password_salt = EXCLUDED.password_salt,
        password_hash = EXCLUDED.password_hash,
        auth_provider = EXCLUDED.auth_provider,
        google_sub = EXCLUDED.google_sub,
        email = EXCLUDED.email,
        avatar_url = EXCLUDED.avatar_url,
        legal_consent = EXCLUDED.legal_consent
    `,
      [
        account.id,
        account.username,
        account.clanTag,
        account.faction,
        account.passwordSalt,
        account.passwordHash,
        account.authProvider || 'password',
        account.googleSub || null,
        account.email || null,
        account.avatarUrl || null,
        JSON.stringify(account.legalConsent),
        account.createdAt,
      ]
    );
  }

  async deleteAccount(id: string): Promise<void> {
    await this.pool!.query('DELETE FROM accounts WHERE id = $1', [id]);
    await this.pool!.query('DELETE FROM game_progress WHERE account_id = $1', [id]);
    await this.pool!.query('DELETE FROM sessions WHERE account_id = $1', [id]);
  }

  async createSession(session: StoredSession): Promise<void> {
    await this.pool!.query(
      `
      INSERT INTO sessions (id, account_id, token_hash, csrf_token, created_at, expires_at, revoked_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
      [
        session.id,
        session.accountId,
        session.tokenHash,
        session.csrfToken,
        session.createdAt,
        session.expiresAt,
        session.revokedAt || null,
      ]
    );
  }

  async getSessionByTokenHash(tokenHash: string): Promise<StoredSession | null> {
    const res = await this.pool!.query(
      `
      SELECT * FROM sessions
      WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > NOW()
    `,
      [tokenHash]
    );
    if (res.rowCount === 0) return null;
    const r = res.rows[0];
    return {
      id: r.id,
      accountId: r.account_id,
      tokenHash: r.token_hash,
      csrfToken: r.csrf_token,
      createdAt: r.created_at.toISOString(),
      expiresAt: r.expires_at.toISOString(),
      revokedAt: r.revoked_at ? r.revoked_at.toISOString() : undefined,
    };
  }

  async revokeSessionByTokenHash(tokenHash: string): Promise<void> {
    await this.pool!.query(
      `
      UPDATE sessions SET revoked_at = NOW() WHERE token_hash = $1 AND revoked_at IS NULL
    `,
      [tokenHash]
    );
  }

  async revokeActiveSessionsForAccount(accountId: string, exceptTokenHash?: string): Promise<void> {
    if (exceptTokenHash) {
      await this.pool!.query(
        `
        UPDATE sessions SET revoked_at = NOW()
        WHERE account_id = $1 AND token_hash != $2 AND revoked_at IS NULL
      `,
        [accountId, exceptTokenHash]
      );
    } else {
      await this.pool!.query(
        `
        UPDATE sessions SET revoked_at = NOW()
        WHERE account_id = $1 AND revoked_at IS NULL
      `,
        [accountId]
      );
    }
  }

  async cleanupExpiredSessions(): Promise<void> {
    await this.pool!.query(`
      DELETE FROM sessions
      WHERE expires_at < NOW() - INTERVAL '1 day' OR (revoked_at IS NOT NULL AND revoked_at < NOW() - INTERVAL '1 day')
    `);
  }

  async getLeaderboard(): Promise<StoredLeaderboardEntry[]> {
    const res = await this.pool!.query(`
      SELECT * FROM leaderboard
      ORDER BY score DESC, wins DESC, kills DESC
      LIMIT 100
    `);
    return res.rows.map((r, idx) => ({
      id: r.id,
      accountId: r.account_id || undefined,
      name: r.name,
      clanTag: r.clan_tag,
      city: r.city,
      score: Number(r.score),
      bestMatchScore: Number(r.best_match_score),
      kills: Number(r.kills),
      wins: Number(r.wins),
      highestWave: Number(r.highest_wave),
      unlockedMapsCount: Number(r.unlocked_maps_count),
      signatureWeapon: r.signature_weapon,
      currentArena: r.current_arena,
      statusText: r.status_text,
      lastSeen: Number(r.last_seen),
      rank: idx + 1,
    }));
  }

  async saveLeaderboardEntry(entry: StoredLeaderboardEntry): Promise<void> {
    await this.pool!.query(
      `
      INSERT INTO leaderboard (
        id, account_id, name, clan_tag, city, score, best_match_score, kills, wins,
        highest_wave, unlocked_maps_count, signature_weapon, current_arena, status_text, last_seen
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT(name) DO UPDATE SET
        account_id = COALESCE(EXCLUDED.account_id, leaderboard.account_id),
        clan_tag = EXCLUDED.clan_tag,
        city = EXCLUDED.city,
        score = EXCLUDED.score,
        best_match_score = EXCLUDED.best_match_score,
        kills = EXCLUDED.kills,
        wins = EXCLUDED.wins,
        highest_wave = EXCLUDED.highest_wave,
        unlocked_maps_count = EXCLUDED.unlocked_maps_count,
        signature_weapon = EXCLUDED.signature_weapon,
        current_arena = EXCLUDED.current_arena,
        status_text = EXCLUDED.status_text,
        last_seen = EXCLUDED.last_seen
    `,
      [
        entry.id,
        entry.accountId || null,
        entry.name,
        entry.clanTag,
        entry.city,
        entry.score,
        entry.bestMatchScore,
        entry.kills,
        entry.wins,
        entry.highestWave,
        entry.unlockedMapsCount,
        entry.signatureWeapon,
        entry.currentArena,
        entry.statusText,
        entry.lastSeen,
      ]
    );
  }

  async deleteLeaderboardEntryByName(name: string): Promise<void> {
    await this.pool!.query('DELETE FROM leaderboard WHERE LOWER(name) = LOWER($1)', [name.trim()]);
  }

  async getDerbyStats(): Promise<StoredDerbyStats> {
    const res = await this.pool!.query('SELECT * FROM derby_stats WHERE id = 1');
    if (res.rowCount === 0) {
      return {
        neuAnspachPoints: 1420,
        wehrheimPoints: 1180,
        totalBattles: 48,
        currentContestedDistrict: 'Freilichtmuseum Hessenpark',
      };
    }
    const r = res.rows[0];
    return {
      neuAnspachPoints: Number(r.neu_anspach_points),
      wehrheimPoints: Number(r.wehrheim_points),
      totalBattles: Number(r.total_battles),
      currentContestedDistrict: r.current_contested_district,
    };
  }

  async saveDerbyStats(stats: StoredDerbyStats): Promise<void> {
    await this.pool!.query(
      `
      UPDATE derby_stats
      SET neu_anspach_points = $1, wehrheim_points = $2, total_battles = $3, current_contested_district = $4
      WHERE id = 1
    `,
      [
        stats.neuAnspachPoints,
        stats.wehrheimPoints,
        stats.totalBattles,
        stats.currentContestedDistrict,
      ]
    );
  }

  async getRecentEvents(limit = 25): Promise<StoredLiveFeedEvent[]> {
    const res = await this.pool!.query(
      `
      SELECT * FROM live_events
      ORDER BY timestamp DESC
      LIMIT $1
    `,
      [limit]
    );

    return res.rows.map((r) => ({
      id: r.id,
      playerName: r.player_name,
      clanTag: r.clan_tag,
      text: r.text,
      timestamp: Number(r.timestamp),
      type: r.type,
    }));
  }

  async addRecentEvent(event: StoredLiveFeedEvent): Promise<void> {
    await this.pool!.query(
      `
      INSERT INTO live_events (id, player_name, clan_tag, text, timestamp, type)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT(id) DO UPDATE SET
        player_name = EXCLUDED.player_name,
        clan_tag = EXCLUDED.clan_tag,
        text = EXCLUDED.text,
        timestamp = EXCLUDED.timestamp,
        type = EXCLUDED.type
    `,
      [
        event.id,
        event.playerName,
        event.clanTag,
        event.text,
        event.timestamp,
        event.type,
      ]
    );

    await this.pool!.query(`
      DELETE FROM live_events
      WHERE id NOT IN (SELECT id FROM live_events ORDER BY timestamp DESC LIMIT 100)
    `);
  }

  async getRooms(): Promise<Record<string, StoredRoom>> {
    const res = await this.pool!.query('SELECT * FROM rooms');
    const result: Record<string, StoredRoom> = {};
    for (const r of res.rows) {
      result[r.code] = {
        code: r.code,
        hostAccountId: r.host_account_id || undefined,
        hostName: r.host_name,
        arena: r.arena,
        players: r.players_json,
        wave: Number(r.wave),
        totalKills: Number(r.total_kills),
        status: r.status,
        updatedAt: Number(r.updated_at),
        createdAt: Number(r.created_at),
      };
    }
    return result;
  }

  async getRoom(code: string): Promise<StoredRoom | null> {
    const res = await this.pool!.query('SELECT * FROM rooms WHERE code = $1', [code]);
    if (res.rowCount === 0) return null;
    const r = res.rows[0];
    return {
      code: r.code,
      hostAccountId: r.host_account_id || undefined,
      hostName: r.host_name,
      arena: r.arena,
      players: r.players_json,
      wave: Number(r.wave),
      totalKills: Number(r.total_kills),
      status: r.status,
      updatedAt: Number(r.updated_at),
      createdAt: Number(r.created_at),
    };
  }

  async saveRoom(room: StoredRoom): Promise<void> {
    await this.pool!.query(
      `
      INSERT INTO rooms (code, host_account_id, host_name, arena, players_json, wave, total_kills, status, updated_at, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT(code) DO UPDATE SET
        host_account_id = EXCLUDED.host_account_id,
        host_name = EXCLUDED.host_name,
        arena = EXCLUDED.arena,
        players_json = EXCLUDED.players_json,
        wave = EXCLUDED.wave,
        total_kills = EXCLUDED.total_kills,
        status = EXCLUDED.status,
        updated_at = EXCLUDED.updated_at
    `,
      [
        room.code,
        room.hostAccountId || null,
        room.hostName,
        room.arena,
        JSON.stringify(room.players),
        room.wave,
        room.totalKills,
        room.status,
        room.updatedAt,
        room.createdAt,
      ]
    );
  }

  async deleteRoom(code: string): Promise<void> {
    await this.pool!.query('DELETE FROM rooms WHERE code = $1', [code]);
  }

  async cleanupStaleRooms(maxAgeMs: number): Promise<void> {
    const threshold = Date.now() - maxAgeMs;
    await this.pool!.query('DELETE FROM rooms WHERE updated_at < $1', [threshold]);
  }

  async getGameProgress(accountId: string): Promise<StoredGameProgress | null> {
    const res = await this.pool!.query('SELECT * FROM game_progress WHERE account_id = $1', [accountId]);
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      accountId: row.account_id,
      budget: Number(row.budget),
      reputation: Number(row.reputation),
      operatorLevel: Number(row.operator_level),
      skillPoints: Number(row.skill_points),
      totalWins: Number(row.total_wins),
      facilities: typeof row.facilities_json === 'string' ? JSON.parse(row.facilities_json) : row.facilities_json || {},
      unlockedMaps: typeof row.unlocked_maps_json === 'string' ? JSON.parse(row.unlocked_maps_json) : row.unlocked_maps_json || [],
      mapLevels: typeof row.map_levels_json === 'string' ? JSON.parse(row.map_levels_json) : row.map_levels_json || {},
      skillTree: typeof row.skill_tree_json === 'string' ? JSON.parse(row.skill_tree_json) : row.skill_tree_json || {},
      weaponUpgrades: typeof row.weapon_upgrades_json === 'string' ? JSON.parse(row.weapon_upgrades_json) : row.weapon_upgrades_json || {},
      dailyMissions: typeof row.daily_missions_json === 'string' ? JSON.parse(row.daily_missions_json) : row.daily_missions_json || {},
      careerStats: typeof row.career_stats_json === 'string' ? JSON.parse(row.career_stats_json) : row.career_stats_json || {},
      updatedAt: Number(row.updated_at),
    };
  }

  async saveGameProgress(progress: StoredGameProgress): Promise<void> {
    await this.pool!.query(`
      INSERT INTO game_progress (
        account_id, budget, reputation, operator_level, skill_points, total_wins,
        facilities_json, unlocked_maps_json, map_levels_json, skill_tree_json,
        weapon_upgrades_json, daily_missions_json, career_stats_json, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT(account_id) DO UPDATE SET
        budget = EXCLUDED.budget,
        reputation = EXCLUDED.reputation,
        operator_level = EXCLUDED.operator_level,
        skill_points = EXCLUDED.skill_points,
        total_wins = EXCLUDED.total_wins,
        facilities_json = EXCLUDED.facilities_json,
        unlocked_maps_json = EXCLUDED.unlocked_maps_json,
        map_levels_json = EXCLUDED.map_levels_json,
        skill_tree_json = EXCLUDED.skill_tree_json,
        weapon_upgrades_json = EXCLUDED.weapon_upgrades_json,
        daily_missions_json = EXCLUDED.daily_missions_json,
        career_stats_json = EXCLUDED.career_stats_json,
        updated_at = EXCLUDED.updated_at
    `, [
      progress.accountId,
      Math.max(0, Math.floor(progress.budget)),
      Math.max(0, Math.floor(progress.reputation)),
      Math.max(1, Math.floor(progress.operatorLevel)),
      Math.max(0, Math.floor(progress.skillPoints)),
      Math.max(0, Math.floor(progress.totalWins)),
      JSON.stringify(progress.facilities || {}),
      JSON.stringify(progress.unlockedMaps || []),
      JSON.stringify(progress.mapLevels || {}),
      JSON.stringify(progress.skillTree || {}),
      JSON.stringify(progress.weaponUpgrades || {}),
      JSON.stringify(progress.dailyMissions || {}),
      JSON.stringify(progress.careerStats || {}),
      progress.updatedAt || Date.now()
    ]);
  }
}

// ---------------------------------------------------------------------------
// 3. Storage Factory
// ---------------------------------------------------------------------------
export async function createStorage(dbPath?: string): Promise<GameStorage> {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!dbPath && databaseUrl && (databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://'))) {
    console.log('[Storage] Attempting PostgreSQL storage from DATABASE_URL (Neon / Cloud SQL)');
    try {
      const adapter = new PostgresStorageAdapter(databaseUrl);
      await adapter.init();
      console.log('[Storage] PostgreSQL storage connected and initialized successfully');
      return adapter;
    } catch (pgError: any) {
      console.warn(`[Storage] PostgreSQL connection failed (${pgError?.message || pgError}). Falling back to SQLite storage.`);
    }
  }

  try {
    const targetPath = dbPath || process.env.SQLITE_DB_PATH;
    const adapter = new SqliteStorageAdapter(targetPath);
    await adapter.init();
    return adapter;
  } catch (error) {
    console.error('[Storage] Failed to initialize SQLite storage:', error);
    throw error;
  }
}
