import crypto from 'node:crypto';
import path from 'node:path';
import { GameStorage, LegalConsentRecord, StoredAccount, StoredSession } from './src/server/storage.ts';
import { LEGAL_NOTICE_VERSION } from './src/legal.ts';

export interface PublicAccount {
  id: string;
  username: string;
  clanTag: string;
  faction: Faction;
  authProvider: 'password' | 'google';
  email?: string;
  avatarUrl?: string;
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

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

export class AuthValidationError extends AuthError {
  constructor(message: string, status = 400) {
    super(message, status);
    this.name = 'AuthValidationError';
  }
}

export class AuthConflictError extends AuthError {
  constructor(message: string) {
    super(message, 409);
    this.name = 'AuthConflictError';
  }
}

export function normalizeClanTag(clanTag?: string): string {
  const cleaned = (clanTag || '').trim().toUpperCase();
  if (!cleaned) return '';
  if (!CLAN_TAG_PATTERN.test(cleaned)) {
    throw new AuthValidationError(
      'Das Clantag muss 2-6 Zeichen lang sein und darf nur Buchstaben, Zahlen, _ oder - enthalten.'
    );
  }
  return cleaned;
}

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
    authProvider: account.authProvider || 'password',
    ...(account.email ? { email: account.email } : {}),
    ...(account.avatarUrl ? { avatarUrl: account.avatarUrl } : {}),
    createdAt: account.createdAt,
  };
}

export interface GoogleAuthInput {
  googleSub: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  clanTag?: string;
  faction?: string;
  legalConsent?: LegalConsentRecord;
}

export class AuthStore {
  constructor(private readonly storage: GameStorage) {}

  async register(
    usernameInput: string,
    password: string,
    clanTagInput?: string,
    factionInput: string = 'neu-anspach',
    legalConsent?: LegalConsentRecord
  ): Promise<PublicAccount> {
    const username = (usernameInput || '').trim();
    const clanTag = (clanTagInput || '').trim().toUpperCase();
    this.validateCredentials(username, password);
    this.validateProfile(clanTag, factionInput);
    if (legalConsent) {
      this.validateLegalConsent(legalConsent);
    } else {
      throw new AuthValidationError('Bitte bestätige die rechtlichen Hinweise und Datenschutzinformationen.');
    }

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
      authProvider: 'password',
      googleSub: null,
      email: null,
      avatarUrl: null,
      legalConsent,
      createdAt: new Date().toISOString(),
    };

    await this.storage.saveAccount(account);
    return toPublicAccount(account);
  }

  async authenticateWithGoogle(
    input: GoogleAuthInput
  ): Promise<{ account: PublicAccount; isNewAccount: boolean }> {
    const googleSub = (input.googleSub || '').trim();
    if (!googleSub || googleSub.length > 128) {
      throw new AuthValidationError('Ungültige Google-Konto-Kennung (sub).');
    }

    const existing = await this.storage.getAccountByGoogleSub(googleSub);
    if (existing) {
      let updated = false;
      if (input.email && input.email !== existing.email) {
        existing.email = input.email.trim().slice(0, 254);
        updated = true;
      }
      if (input.avatarUrl && input.avatarUrl !== existing.avatarUrl) {
        existing.avatarUrl = input.avatarUrl.trim().slice(0, 1024);
        updated = true;
      }
      if (input.legalConsent && input.legalConsent.noticeVersion) {
        existing.legalConsent = input.legalConsent;
        updated = true;
      }
      if (updated) {
        await this.storage.saveAccount(existing);
      }
      return { account: toPublicAccount(existing), isNewAccount: false };
    }

    // New Google Account creation
    const rawClanTag = (input.clanTag || '').trim().toUpperCase();
    const clanTag = rawClanTag && CLAN_TAG_PATTERN.test(rawClanTag) ? rawClanTag : '';
    const faction: Faction = FACTIONS.includes(input.faction as Faction)
      ? (input.faction as Faction)
      : 'neu-anspach';

    const nowIso = new Date().toISOString();
    const legalConsent: LegalConsentRecord =
      input.legalConsent &&
      typeof input.legalConsent.acceptedAt === 'string' &&
      typeof input.legalConsent.noticeVersion === 'string'
        ? input.legalConsent
        : {
            acceptedAt: nowIso,
            noticeVersion: LEGAL_NOTICE_VERSION,
            privacyPolicyVersion: LEGAL_NOTICE_VERSION,
            termsVersion: LEGAL_NOTICE_VERSION,
          };

    const username = await this.generateUniqueGoogleUsername(input.displayName, input.email);

    const account: StoredAccount = {
      id: `acct_${crypto.randomUUID()}`,
      username,
      clanTag,
      faction,
      passwordSalt: crypto.randomBytes(16).toString('base64url'),
      passwordHash: '', // Google-authenticated accounts have no local password
      authProvider: 'google',
      googleSub,
      email: input.email ? input.email.trim().slice(0, 254) : null,
      avatarUrl: input.avatarUrl ? input.avatarUrl.trim().slice(0, 1024) : null,
      legalConsent,
      createdAt: nowIso,
    };

    await this.storage.saveAccount(account);
    return { account: toPublicAccount(account), isNewAccount: true };
  }

  private async generateUniqueGoogleUsername(displayName?: string, email?: string): Promise<string> {
    const rawCandidate = (displayName || (email ? email.split('@')[0] : '') || 'Operator')
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .slice(0, 18);

    const base = rawCandidate.length >= 3 ? rawCandidate : `Op_${rawCandidate || 'Taunus'}`;

    const directCheck = await this.storage.getAccountByUsername(base);
    if (!directCheck && USERNAME_PATTERN.test(base)) {
      return base;
    }

    for (let attempt = 0; attempt < 20; attempt++) {
      const suffix = crypto.randomInt(100, 9999).toString();
      const candidate = `${base.slice(0, 24 - suffix.length - 1)}_${suffix}`;
      if (USERNAME_PATTERN.test(candidate)) {
        const collision = await this.storage.getAccountByUsername(candidate);
        if (!collision) return candidate;
      }
    }

    return `Op_${crypto.randomBytes(4).toString('hex')}`;
  }

  async verifyCredentials(usernameInput: string, password: string): Promise<PublicAccount | null> {
    const username = (usernameInput || '').trim();
    if (!username || typeof password !== 'string' || password.length > PASSWORD_MAX_LENGTH) {
      // Run dummy hash to prevent timing differentiation
      crypto.timingSafeEqual(DUMMY_HASH, hashPassword(password || '', DUMMY_SALT));
      return null;
    }

    const account = await this.storage.getAccountByUsername(username);
    if (!account || !account.passwordHash || !account.passwordSalt) {
      // Run dummy scrypt hash to equalize timing with valid accounts (including Google-only accounts)
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

  async login(usernameInput: string, password: string): Promise<PublicAccount | null> {
    return this.verifyCredentials(usernameInput, password);
  }

  async updateClanTag(accountId: string, clanTag: string): Promise<PublicAccount | null> {
    const account = await this.storage.getAccountById(accountId);
    if (!account) return null;
    account.clanTag = (clanTag || '').trim().toUpperCase();
    await this.storage.saveAccount(account);
    return toPublicAccount(account);
  }

  async updateUsername(accountId: string, newUsername: string, faction?: string): Promise<PublicAccount> {
    const account = await this.storage.getAccountById(accountId);
    if (!account) {
      throw new AuthValidationError('Konto nicht gefunden.', 404);
    }

    const cleanUsername = (newUsername || '').trim();
    if (!USERNAME_PATTERN.test(cleanUsername)) {
      throw new AuthValidationError(
        'Der Benutzername muss 3 bis 24 Zeichen lang sein (Buchstaben, Zahlen, _ oder -).',
        400
      );
    }

    const existing = await this.storage.getAccountByUsername(cleanUsername);
    if (existing && existing.id !== accountId) {
      throw new AuthConflictError('Dieser Benutzername ist bereits vergeben.');
    }

    account.username = cleanUsername;
    if (faction && FACTIONS.includes(faction as Faction)) {
      account.faction = faction as Faction;
    }

    await this.storage.saveAccount(account);
    return toPublicAccount(account);
  }

  async linkLegacyAccount(
    currentAccountId: string,
    legacyUsername: string,
    legacyPassword: string
  ): Promise<PublicAccount> {
    const currentAccount = await this.storage.getAccountById(currentAccountId);
    const verifiedLegacy = await this.verifyCredentials(legacyUsername, legacyPassword);
    if (!verifiedLegacy) {
      throw new AuthValidationError('Ungültiger Benutzername oder falsches Passwort des alten Accounts.', 401);
    }

    const legacyAccount = await this.storage.getAccountById(verifiedLegacy.id);
    if (!legacyAccount) {
      throw new AuthValidationError('Das alte Konto konnte nicht geladen werden.');
    }

    if (legacyAccount.id === currentAccountId) {
      return toPublicAccount(legacyAccount);
    }

    if (currentAccount) {
      const transferredGoogleSub = currentAccount.googleSub || legacyAccount.googleSub || null;
      const transferredEmail = currentAccount.email || legacyAccount.email || null;
      const transferredAvatar = currentAccount.avatarUrl || legacyAccount.avatarUrl || null;

      await this.storage.deleteAccount(currentAccount.id);

      legacyAccount.googleSub = transferredGoogleSub;
      legacyAccount.email = transferredEmail;
      legacyAccount.avatarUrl = transferredAvatar;
      await this.storage.saveAccount(legacyAccount);
    }

    return toPublicAccount(legacyAccount);
  }

  async linkGoogleIdentity(
    accountId: string,
    googleData: { googleSub: string; email?: string; avatarUrl?: string }
  ): Promise<PublicAccount> {
    const account = await this.storage.getAccountById(accountId);
    if (!account) {
      throw new AuthValidationError('Konto nicht gefunden.');
    }

    const googleSub = (googleData.googleSub || '').trim();
    if (!googleSub) {
      throw new AuthValidationError('Ungültige Google-Konto-Kennung (sub).');
    }

    const existingBySub = await this.storage.getAccountByGoogleSub(googleSub);
    if (existingBySub && existingBySub.id !== accountId) {
      if (existingBySub.authProvider === 'google' && !existingBySub.passwordHash) {
        await this.storage.deleteAccount(existingBySub.id);
      } else {
        throw new AuthConflictError('Dieses Google-Konto ist bereits mit einem anderen Operator-Konto verknüpft.');
      }
    }

    account.googleSub = googleSub;
    if (googleData.email) {
      account.email = googleData.email.trim().slice(0, 254);
    }
    if (googleData.avatarUrl) {
      account.avatarUrl = googleData.avatarUrl.trim().slice(0, 1024);
    }

    await this.storage.saveAccount(account);
    return toPublicAccount(account);
  }

  async getPublicAccountByUsername(username: string): Promise<PublicAccount | null> {
    const account = await this.storage.getAccountByUsername(username);
    return account ? toPublicAccount(account) : null;
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

    const provider = account.authProvider || 'password';
    return {
      id: account.id,
      username: account.username,
      clanTag: account.clanTag,
      faction: account.faction,
      authProvider: provider,
      email: account.email || null,
      avatarUrl: account.avatarUrl || null,
      googleLinked: Boolean(account.googleSub),
      createdAt: account.createdAt,
      legalConsent: account.legalConsent,
      security: {
        passwordAlgorithm: provider === 'google' ? 'oauth2-oidc-google' : 'scrypt-pbkdf',
        passwordSaltStored: Boolean(account.passwordHash),
        hashType: provider === 'google' ? 'google-sub-identifier' : 'base64url-scrypt',
      },
      hostingAndProcessors: {
        applicationHost: 'Render (Render Services, Inc.)',
        databaseProvider: 'Neon Serverless PostgreSQL (Neon, Inc.)',
        identityProvider:
          provider === 'google'
            ? 'Google Sign-In / OAuth 2.0 (Google Ireland Limited / Google LLC)'
            : 'Interne Kontoverwaltung (Scrypt-Hash)',
      },
      exportTimestamp: new Date().toISOString(),
    };
  }

  async deleteAccount(accountId: string, passwordOrConfirmation: string): Promise<boolean> {
    const account = await this.storage.getAccountById(accountId);
    if (!account || typeof passwordOrConfirmation !== 'string') return false;

    // Google OAuth accounts have no local passwordHash; allow deletion when confirmed with 'LÖSCHEN', 'DELETE', or their username
    if (account.authProvider === 'google' && !account.passwordHash) {
      const normalized = passwordOrConfirmation.trim();
      const upper = normalized.toUpperCase();
      if (
        upper !== 'LÖSCHEN' &&
        upper !== 'LOESCHEN' &&
        upper !== 'DELETE' &&
        normalized.toLowerCase() !== account.username.toLowerCase()
      ) {
        return false;
      }
      await this.storage.deleteAccount(accountId);
      return true;
    }

    const salt = Buffer.from(account.passwordSalt, 'base64url');
    const expected = Buffer.from(account.passwordHash, 'base64url');
    const actual = hashPassword(passwordOrConfirmation, salt);

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
    if (clanTag && !CLAN_TAG_PATTERN.test(clanTag)) {
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
  googleStateCookieName: 'gemini_google_oauth_state',
  csrfHeaderName: 'x-csrf-token',
  sessionTtlMs: Number(process.env.AUTH_SESSION_TTL_MS || 30 * 24 * 60 * 60 * 1000),
  secureCookie:
    process.env.AUTH_SECURE_COOKIE === 'true' ||
    (process.env.AUTH_SECURE_COOKIE !== 'false' && process.env.NODE_ENV === 'production'),
  get googleClientId(): string {
    return (process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '').trim();
  },
  get googleClientSecret(): string {
    return (process.env.GOOGLE_CLIENT_SECRET || '').trim();
  },
  get googleCallbackUrl(): string {
    return (process.env.GOOGLE_CALLBACK_URL || '').trim();
  },
};
