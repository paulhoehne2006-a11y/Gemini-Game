export interface AuthUser {
  id: string;
  email?: string;
  username?: string;
  displayName?: string;
  clanTag?: string;
  faction?: 'neu-anspach' | 'wehrheim';
  createdAt?: string;
}

export interface LegalConsentRecord {
  acceptedAt: string;
  noticeVersion: string;
  privacyPolicyVersion: string;
  termsVersion: string;
}

interface AuthResponse {
  user?: AuthUser;
  account?: AuthUser;
  token?: string;
  csrfToken?: string;
  error?: string;
}

export class AuthRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'AuthRequestError';
    this.status = status;
  }
}

// In-memory CSRF token storage (safe from persistent disk XSS extraction)
let inMemoryCsrfToken: string | null = null;

export function getCsrfToken(): string | null {
  return inMemoryCsrfToken;
}

export function setCsrfToken(token: string | null): void {
  inMemoryCsrfToken = token;
}

// Backward-compatible stubs (session token is now managed strictly via HttpOnly cookie)
export const AUTH_TOKEN_KEY = 'na_auth_token';

export function getStoredToken(): string | null {
  return null;
}

export function setStoredToken(_token: string): void {
  // Session tokens are now securely stored in HttpOnly cookies, no-op
}

export function removeStoredToken(): void {
  setCsrfToken(null);
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {}
}

function normalizeUser(response: AuthResponse): AuthUser | null {
  return response.user || response.account || null;
}

export async function requestAuth(path: string, init?: RequestInit): Promise<AuthResponse> {
  const method = (init?.method || 'GET').toUpperCase();
  const isMutating = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(isMutating && inMemoryCsrfToken ? { 'X-CSRF-Token': inMemoryCsrfToken } : {}),
    ...(init?.headers as Record<string, string> | undefined),
  };

  const response = await fetch(path, {
    ...init,
    credentials: 'include',
    headers,
  });

  let body: AuthResponse = {};
  try {
    body = (await response.json()) as AuthResponse;
  } catch {
    // Keep empty object
  }

  if (!response.ok) {
    if (response.status === 401) {
      removeStoredToken();
    }
    throw new AuthRequestError(body.error || 'Die Anfrage konnte nicht verarbeitet werden.', response.status);
  }

  if (body.csrfToken) {
    setCsrfToken(body.csrfToken);
  }

  return body;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const res = await requestAuth('/api/auth/me');
    return normalizeUser(res);
  } catch (error) {
    if (error instanceof AuthRequestError && error.status === 401) return null;
    throw error;
  }
}

export async function login(username: string, password: string): Promise<AuthUser> {
  const res = await requestAuth('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  const user = normalizeUser(res);
  if (!user) throw new AuthRequestError('Die Anmeldung hat kein Benutzerkonto zurückgegeben.', 502);
  return user;
}

export async function register(
  username: string,
  password: string,
  clanTag: string,
  faction: 'neu-anspach' | 'wehrheim',
  legalConsent: LegalConsentRecord
): Promise<AuthUser> {
  const res = await requestAuth('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password, clanTag, faction, legalConsent }),
  });
  const user = normalizeUser(res);
  if (!user) throw new AuthRequestError('Die Registrierung hat kein Benutzerkonto zurückgegeben.', 502);
  return user;
}

export async function logout(): Promise<void> {
  try {
    await requestAuth('/api/auth/logout', { method: 'POST' });
  } finally {
    removeStoredToken();
  }
}

export async function exportUserData(): Promise<any> {
  const res = await fetch('/api/auth/export', {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Export fehlgeschlagen.');
  return await res.json();
}

export async function deleteUserAccount(password: string): Promise<void> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(inMemoryCsrfToken ? { 'X-CSRF-Token': inMemoryCsrfToken } : {}),
  };

  const res = await fetch('/api/auth/delete', {
    method: 'POST',
    credentials: 'include',
    headers,
    body: JSON.stringify({ password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Kontolöschung fehlgeschlagen.');
  }
  removeStoredToken();
}
