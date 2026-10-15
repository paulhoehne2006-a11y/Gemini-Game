import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export interface PublicAccount {
  id: string;
  username: string;
  createdAt: string;
}

interface StoredAccount extends PublicAccount {
  passwordSalt: string;
  passwordHash: string;
}

interface StoredSession {
  accountId: string;
  tokenHash: string;
  createdAt: string;
  expiresAt: string;
  revokedAt?: string;
}

interface AuthDatabase {
  accounts: StoredAccount[];
  sessions: StoredSession[];
}

const PASSWORD_MIN_LENGTH = 10;
const PASSWORD_MAX_LENGTH = 128;
const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{3,24}$/;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 32 * 1024 * 1024 };

export class AuthValidationError extends Error {}
export class AuthConflictError extends Error {}

function createEmptyDatabase(): AuthDatabase {
  return { accounts: [], sessions: [] };
}

function hashPassword(password: string, salt: Buffer): Buffer {
  return crypto.scryptSync(password, salt, 64, SCRYPT_OPTIONS);
}

function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function toPublicAccount(account: StoredAccount): PublicAccount {
  return {
    id: account.id,
    username: account.username,
    createdAt: account.createdAt,
  };
}

export class AuthStore {
  private database: AuthDatabase;

  constructor(private readonly filePath: string) {
    this.database = this.load();
  }

  register(usernameInput: string, password: string): PublicAccount {
    const username = usernameInput.trim();
    this.validateCredentials(username, password);

    if (this.database.accounts.some((account) => account.username.toLowerCase() === username.toLowerCase())) {
      throw new AuthConflictError('Ein Konto mit diesem Benutzernamen existiert bereits.');
    }

    const salt = crypto.randomBytes(16);
    const account: StoredAccount = {
      id: `acct_${crypto.randomUUID()}`,
      username,
      passwordSalt: salt.toString('base64url'),
      passwordHash: hashPassword(password, salt).toString('base64url'),
      createdAt: new Date().toISOString(),
    };
    this.database.accounts.push(account);
    this.save();
    return toPublicAccount(account);
  }

  verifyCredentials(usernameInput: string, password: string): PublicAccount | null {
    const username = usernameInput.trim();
    const account = this.database.accounts.find(
      (candidate) => candidate.username.toLowerCase() === username.toLowerCase()
    );
    if (!account || typeof password !== 'string' || password.length > PASSWORD_MAX_LENGTH) {
      return null;
    }

    const salt = Buffer.from(account.passwordSalt, 'base64url');
    const expected = Buffer.from(account.passwordHash, 'base64url');
    const actual = hashPassword(password, salt);
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual)
      ? toPublicAccount(account)
      : null;
  }

  createSession(accountId: string, ttlMs: number): { token: string; expiresAt: string } {
    const token = crypto.randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + ttlMs).toISOString();
    this.database.sessions = this.database.sessions.filter(
      (session) => session.expiresAt > new Date().toISOString() && !session.revokedAt
    );
    this.database.sessions.push({
      accountId,
      tokenHash: hashSessionToken(token),
      createdAt: new Date().toISOString(),
      expiresAt,
    });
    this.save();
    return { token, expiresAt };
  }

  getAccountBySession(token: string): PublicAccount | null {
    const session = this.database.sessions.find(
      (candidate) =>
        candidate.tokenHash === hashSessionToken(token) &&
        !candidate.revokedAt &&
        candidate.expiresAt > new Date().toISOString()
    );
    if (!session) return null;
    const account = this.database.accounts.find((candidate) => candidate.id === session.accountId);
    return account ? toPublicAccount(account) : null;
  }

  revokeSession(token: string): void {
    const tokenHash = hashSessionToken(token);
    const session = this.database.sessions.find((candidate) => candidate.tokenHash === tokenHash);
    if (session && !session.revokedAt) {
      session.revokedAt = new Date().toISOString();
      this.save();
    }
  }

  private validateCredentials(username: string, password: string): void {
    if (!USERNAME_PATTERN.test(username)) {
      throw new AuthValidationError(
        'Der Benutzername muss 3-24 Zeichen lang sein und darf nur Buchstaben, Zahlen, _ oder - enthalten.'
      );
    }
    if (
      typeof password !== 'string' ||
      password.length < PASSWORD_MIN_LENGTH ||
      password.length > PASSWORD_MAX_LENGTH ||
      !/[a-z]/.test(password) ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      throw new AuthValidationError(
        'Das Passwort muss 10-128 Zeichen lang sein und mindestens einen Großbuchstaben, Kleinbuchstaben und eine Zahl enthalten.'
      );
    }
  }

  private load(): AuthDatabase {
    try {
      const raw = fs.readFileSync(this.filePath, 'utf8');
      const parsed = JSON.parse(raw) as AuthDatabase;
      if (Array.isArray(parsed.accounts) && Array.isArray(parsed.sessions)) return parsed;
    } catch {
      // Missing or invalid local state starts empty; writes surface errors explicitly.
    }
    return createEmptyDatabase();
  }

  private save(): void {
    const directory = path.dirname(this.filePath);
    fs.mkdirSync(directory, { recursive: true });
    const temporaryPath = `${this.filePath}.${process.pid}.tmp`;
    fs.writeFileSync(temporaryPath, JSON.stringify(this.database, null, 2), {
      encoding: 'utf8',
      mode: 0o600,
    });
    fs.renameSync(temporaryPath, this.filePath);
  }
}

export const authConfig = {
  dataFile: process.env.AUTH_DATA_FILE || path.join(process.cwd(), 'data', 'accounts.json'),
  cookieName: process.env.AUTH_COOKIE_NAME || 'gemini_game_session',
  sessionTtlMs: Number(process.env.AUTH_SESSION_TTL_MS || 30 * 24 * 60 * 60 * 1000),
  secureCookie:
    process.env.AUTH_SECURE_COOKIE === 'true' ||
    (process.env.AUTH_SECURE_COOKIE !== 'false' && process.env.NODE_ENV === 'production'),
};
