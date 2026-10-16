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

export const AUTH_TOKEN_KEY = 'na_auth_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string): void {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch {}
}

export function removeStoredToken(): void {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {}
}

function normalizeUser(response: AuthResponse): AuthUser | null {
  return response.user || response.account || null;
}

async function requestAuth(path: string, init?: RequestInit): Promise<AuthResponse> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
    // The status code still provides a useful error for malformed responses.
  }

  if (!response.ok) {
    if (response.status === 401) {
      removeStoredToken();
    }
    throw new AuthRequestError(body.error || 'Die Anfrage konnte nicht verarbeitet werden.', response.status);
  }

  if (body.token) {
    setStoredToken(body.token);
  }

  return body;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    return normalizeUser(await requestAuth('/api/auth/me'));
  } catch (error) {
    if (error instanceof AuthRequestError && error.status === 401) return null;
    throw error;
  }
}

export async function login(username: string, password: string): Promise<AuthUser> {
  const res = await requestAuth('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, email: username, password }),
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
    body: JSON.stringify({ username, email: username, password, clanTag, faction, legalConsent }),
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
    headers: {
      ...(getStoredToken() ? { Authorization: `Bearer ${getStoredToken()}` } : {}),
    },
  });
  if (!res.ok) throw new Error('Export fehlgeschlagen.');
  return await res.json();
}

export async function deleteUserAccount(password: string): Promise<void> {
  const res = await fetch('/api/auth/delete', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(getStoredToken() ? { Authorization: `Bearer ${getStoredToken()}` } : {}),
    },
    body: JSON.stringify({ password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Kontolöschung fehlgeschlagen.');
  }
  removeStoredToken();
}
