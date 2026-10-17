import crypto from 'node:crypto';
import path from 'node:path';
import { GameStorage, LegalConsentRecord, StoredAccount, StoredSession } from './src/server/storage.ts';

export interface PublicAccount {
  id: string;
  username: string;
  clanTag: string;
  faction: Faction;
  createdAt: string;
}

export type Faction = 'neu-anspach' | 'wehrheim';
export type { LegalConsentRecord };

const PASSWORD_MIN_LENGTH = 10;
const PASSWORD_MAX_LENGTH = 128;
const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{3,24}$/;
const CLAN_TAG_PATTERN = /^[a-zA-Z0-9_-]{2,6}$/;
const FACTIONS: readonly Faction[] = ['neu-anspach', 'wehrheim'];
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 32 * 1024 * 1024 };

// Constant dummy salt & hash for timing-attack protection against user enumeration
const DUMMY_SALT = crypto.randomBytes(16);
const DUMMY_HASH = crypto.scryptSync('dummy_password_for_timing_safety_123', DUMMY_SALT, 64, SCRYPT_OPTIONS);

export class AuthValidationError extends Error {}
export class AuthConflictError extends Error {}

export function hashPassword(password: string, salt: Buffer): Buffer {
  return crypto.scryptSync(password, salt, 64, SCRYPT_OPTIONS);
}

export function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateCsrfToken(): string {
  return crypto.randomBytes(24).toString('base64url');
}

export function toPublicAccount(account: StoredAccount): PublicAccount {
  return {
    id: account.id,
    username: account.username,
    clanTag: account.clanTag,
    faction: account.faction,
    createdAt: account.createdAt,
  };
}

export class AuthStore {
  constructor(private readonly storage: GameStorage) {}

  async register(
    usernameInput: string,
    password: string,
    clanTagInput: string,
    factionInput: string,
    legalConsent: LegalConsentRecord
  ): Promise<PublicAccount> {
    const username = (usernameInput || '').trim();
    const clanTag = (clanTagInput || '').trim().toUpperCase();
    this.validateCredentials(username, password);
    this.validateProfile(clanTag, factionInput);
    this.validateLegalConsent(legalConsent);

    const existing = await this.storage.getAccountByUsername(username);
    if (existing) {
      throw new AuthConflictError('Ein Konto mit diesem Benutzernamen existiert bereits.');
    }

    const salt = crypto.randomBytes(16);
    const account: StoredAccount = {
      id: `acct_${crypto.randomUUID()}`,
      username,
      clanTag,
      faction: factionInput as Faction,
      passwordSalt: salt.toString('base64url'),
      passwordHash: hashPassword(password, salt).toString('base64url'),
      legalConsent,
      createdAt: new Date().toISOString(),
    };

    await this.storage.saveAccount(account);
    return toPublicAccount(account);
  }

  async verifyCredentials(usernameInput: string, password: string): Promise<PublicAccount | null> {
    const username = (usernameInput || '').trim();
    if (!username || typeof password !== 'string' || password.length > PASSWORD_MAX_LENGTH) {
      // Run dummy hash to prevent timing differentiation
      crypto.timingSafeEqual(DUMMY_HASH, hashPassword(password || '', DUMMY_SALT));
      return null;
    }

    const account = await this.storage.getAccountByUsername(username);
    if (!account) {
      // Run dummy scrypt hash to equalize timing with valid accounts
      crypto.timingSafeEqual(DUMMY_HASH, hashPassword(password, DUMMY_SALT));
      return null;
    }

    const salt = Buffer.from(account.passwordSalt, 'base64url');
    const expected = Buffer.from(account.passwordHash, 'base64url');
    const actual = hashPassword(password, salt);

    if (expected.length === actual.length && crypto.timingSafeEqual(expected, actual)) {
      return toPublicAccount(account);
    }

    return null;
  }

  async createSession(
    accountId: string,
    ttlMs: number
  ): Promise<{ token: string; csrfToken: string; expiresAt: string }> {
    const token = crypto.randomBytes(32).toString('base64url');
    const csrfToken = generateCsrfToken();
    const tokenHash = hashSessionToken(token);
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + ttlMs).toISOString();

    // Revoke any previous active sessions for this account (1 active session policy)
    await this.storage.revokeActiveSessionsForAccount(accountId);

    const session: StoredSession = {
      id: `sess_${crypto.randomUUID()}`,
      accountId,
      tokenHash,
      csrfToken,
      createdAt: now,
      expiresAt,
    };

    await this.storage.createSession(session);
    return { token, csrfToken, expiresAt };
  }

  async getSession(token: string): Promise<{ account: PublicAccount; csrfToken: string; session: StoredSession } | null> {
    if (!token || typeof token !== 'string') return null;
    const tokenHash = hashSessionToken(token);
    const session = await this.storage.getSessionByTokenHash(tokenHash);
    if (!session) return null;

    const account = await this.storage.getAccountById(session.accountId);
    if (!account) return null;

    return {
      account: toPublicAccount(account),
      csrfToken: session.csrfToken,
      session,
    };
  }

  async getAccountBySession(token: string): Promise<PublicAccount | null> {
    const result = await this.getSession(token);
    return result ? result.account : null;
  }

  async getAccountIdBySession(token: string): Promise<string | null> {
    const result = await this.getSession(token);
    return result ? result.account.id : null;
  }

  async revokeSession(token: string): Promise<void> {
    if (!token) return;
    const tokenHash = hashSessionToken(token);
    await this.storage.revokeSessionByTokenHash(tokenHash);
  }

  async exportAccountData(accountId: string): Promise<any | null> {
    const account = await this.storage.getAccountById(accountId);
    if (!account) return null;

    return {
      id: account.id,
      username: account.username,
      clanTag: account.clanTag,
      faction: account.faction,
      createdAt: account.createdAt,
      legalConsent: account.legalConsent,
      security: {
        passwordAlgorithm: 'scrypt-pbkdf',
        passwordSaltStored: true,
        hashType: 'base64url-scrypt',
      },
      exportTimestamp: new Date().toISOString(),
    };
  }

  async deleteAccount(accountId: string, passwordInput: string): Promise<boolean> {
    const account = await this.storage.getAccountById(accountId);
    if (!account || typeof passwordInput !== 'string') return false;

    const salt = Buffer.from(account.passwordSalt, 'base64url');
    const expected = Buffer.from(account.passwordHash, 'base64url');
    const actual = hashPassword(passwordInput, salt);

    if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
      return false;
    }

    await this.storage.deleteAccount(accountId);
    return true;
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

  private validateLegalConsent(legalConsent: LegalConsentRecord): void {
    if (
      !legalConsent ||
      typeof legalConsent.acceptedAt !== 'string' ||
      typeof legalConsent.noticeVersion !== 'string' ||
      typeof legalConsent.privacyPolicyVersion !== 'string' ||
      typeof legalConsent.termsVersion !== 'string'
    ) {
      throw new AuthValidationError('Bitte bestätige die rechtlichen Hinweise und Datenschutzinformationen.');
    }
  }

  private validateProfile(clanTag: string, faction: string): void {
    if (!CLAN_TAG_PATTERN.test(clanTag)) {
      throw new AuthValidationError(
        'Das Clantag muss 2-6 Zeichen lang sein und darf nur Buchstaben, Zahlen, _ oder - enthalten.'
      );
    }
    if (!FACTIONS.includes(faction as Faction)) {
      throw new AuthValidationError('Bitte wähle eine gültige Fraktion: Neu-Anspach oder Wehrheim.');
    }
  }
}

export const authConfig = {
  dataFile: process.env.AUTH_DATA_FILE || path.join(process.cwd(), 'data', 'accounts.json'),
  cookieName: process.env.AUTH_COOKIE_NAME || 'gemini_game_session',
  csrfHeaderName: 'x-csrf-token',
  sessionTtlMs: Number(process.env.AUTH_SESSION_TTL_MS || 30 * 24 * 60 * 60 * 1000),
  secureCookie:
    process.env.AUTH_SECURE_COOKIE === 'true' ||
    (process.env.AUTH_SECURE_COOKIE !== 'false' && process.env.NODE_ENV === 'production'),
};
