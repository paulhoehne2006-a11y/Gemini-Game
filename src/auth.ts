export interface AuthUser {
  id: string;
  email?: string;
  username?: string;
  displayName?: string;
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

function normalizeUser(response: AuthResponse): AuthUser | null {
  return response.user || response.account || null;
}

async function requestAuth(path: string, init?: RequestInit): Promise<AuthResponse> {
  const response = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  let body: AuthResponse = {};
  try {
    body = (await response.json()) as AuthResponse;
  } catch {
    // The status code still provides a useful error for malformed responses.
  }

  if (!response.ok) {
    throw new AuthRequestError(body.error || 'Die Anmeldung konnte nicht verarbeitet werden.', response.status);
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
  const user = normalizeUser(
    await requestAuth('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, email: username, password }),
    })
  );
  if (!user) throw new AuthRequestError('Die Anmeldung hat kein Benutzerkonto zurückgegeben.', 502);
  return user;
}

export async function register(
  username: string,
  password: string,
  legalConsent: LegalConsentRecord
): Promise<AuthUser> {
  const user = normalizeUser(
    await requestAuth('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email: username, password, legalConsent }),
    })
  );
  if (!user) throw new AuthRequestError('Die Registrierung hat kein Benutzerkonto zurückgegeben.', 502);
  return user;
}

export async function logout(): Promise<void> {
  await requestAuth('/api/auth/logout', { method: 'POST' });
}
