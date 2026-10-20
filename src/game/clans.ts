import { getCsrfToken } from '../auth';

export interface ClanMember {
  accountId: string;
  username: string;
  role: 'leader' | 'member';
  joinedAt: string;
  score: number;
  wins: number;
  kills: number;
  isOnline?: boolean;
}

export interface ClanSummary {
  id: string;
  tag: string;
  name: string;
  description: string;
  leaderAccountId: string;
  createdAt: string;
  rank: number;
  totalScore: number;
  totalWins: number;
  totalKills: number;
  memberCount: number;
  members: ClanMember[];
}

export interface ClanInvitation {
  id: string;
  clanTag: string;
  clanName: string;
  inviterName: string;
  createdAt: string;
}

export interface ClanMessage {
  id: string;
  clanTag: string;
  authorName: string;
  text: string;
  createdAt: string;
}

function headers(): Record<string, string> {
  const csrf = getCsrfToken();
  return {
    'Content-Type': 'application/json',
    ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, credentials: 'include', headers: { ...headers(), ...(init?.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Clan-Anfrage fehlgeschlagen.');
  return data as T;
}

export async function fetchMyClan(): Promise<{ clan: ClanSummary; invitations: ClanInvitation[] }> {
  return request('/api/clans/me');
}

export async function createClan(payload: { tag: string; name: string; description: string }): Promise<{ clan: ClanSummary }> {
  return request('/api/clans', { method: 'POST', body: JSON.stringify(payload) });
}

export async function leaveClan(): Promise<{ clan: ClanSummary }> {
  return request('/api/clans/leave', { method: 'POST', body: '{}' });
}

export async function inviteToClan(username: string): Promise<void> {
  await request('/api/clans/invitations', { method: 'POST', body: JSON.stringify({ username }) });
}

export async function answerClanInvitation(id: string, accept: boolean): Promise<{ clan: ClanSummary }> {
  return request(`/api/clans/invitations/${encodeURIComponent(id)}/${accept ? 'accept' : 'decline'}`, {
    method: 'POST',
    body: '{}',
  });
}

export async function fetchClanMessages(): Promise<{ messages: ClanMessage[] }> {
  return request('/api/clans/messages');
}

export async function sendClanMessage(text: string): Promise<{ message: ClanMessage }> {
  return request('/api/clans/messages', { method: 'POST', body: JSON.stringify({ text }) });
}
