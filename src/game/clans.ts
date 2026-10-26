import { getCsrfToken } from '../auth';

export const CLAN_CREATE_MIN_LEVEL = 3;
export const CLAN_CREATE_COST_NAT = 1000;

export type ClanJoinType = 'open' | 'invite_only' | 'closed';
export type ClanBadgeIcon = 'shield' | 'swords' | 'crown' | 'flame' | 'eagle' | 'skull';
export type ClanMemberRole = 'leader' | 'co_leader' | 'elder' | 'member';
export type ClanWarStage = 'collection' | 'battle_day' | 'boss_siege';

export interface ClanMember {
  accountId: string;
  username: string;
  role: ClanMemberRole;
  joinedAt: string;
  score: number;
  wins: number;
  kills: number;
  warFame?: number;
  questContribution?: number;
  isOnline?: boolean;
}

export interface ClanQuest {
  id: string;
  title: string;
  description: string;
  difficulty: 'hard' | 'extreme' | 'nightmare';
  category: 'kills' | 'waves' | 'bosses' | 'funding' | 'wins';
  progress: number;
  target: number;
  rewardNAT: number;
  rewardReputation: number;
  rewardSkillPoints: number;
  rewardWarFame: number;
  completed: boolean;
  claimedByMe?: boolean;
}

export interface ClanJoinRequest {
  id: string;
  accountId: string;
  username: string;
  operatorLevel: number;
  score: number;
  highestWave: number;
  createdAt: string;
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
  maxMembers: number;
  badge: ClanBadgeIcon;
  joinType: ClanJoinType;
  minLevel: number;
  minScore: number;
  minWave: number;
  warTrophies: number;
  warFame: number;
  warStage: ClanWarStage;
  warTargetFame: number;
  warDecksRemainingToday: number;
  warDecksMaxPerDay: number;
  quests: ClanQuest[];
  joinRequests: ClanJoinRequest[];
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
  type?: 'chat' | 'war' | 'quest' | 'system';
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

export async function fetchMyClan(): Promise<{ clan: ClanSummary | null; invitations: ClanInvitation[]; myJoinRequests?: string[] }> {
  return request('/api/clans/me');
}

export async function fetchClanDirectory(params?: {
  search?: string;
  joinType?: string;
  maxMinLevel?: number;
}): Promise<{ clans: ClanSummary[] }> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.joinType) query.set('joinType', params.joinType);
  if (params?.maxMinLevel !== undefined) query.set('maxMinLevel', String(params.maxMinLevel));
  const qs = query.toString();
  return request(`/api/clans/directory${qs ? `?${qs}` : ''}`);
}

export async function createClan(payload: {
  tag: string;
  name: string;
  description: string;
  badge?: ClanBadgeIcon;
  joinType?: ClanJoinType;
  minLevel?: number;
  minScore?: number;
  minWave?: number;
  operatorLevel?: number;
  budget?: number;
}): Promise<{ clan: ClanSummary; costDeducted?: number; newBudget?: number }> {
  return request('/api/clans', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateClanSettings(payload: {
  description?: string;
  badge?: ClanBadgeIcon;
  joinType?: ClanJoinType;
  minLevel?: number;
  minScore?: number;
  minWave?: number;
}): Promise<{ clan: ClanSummary }> {
  return request('/api/clans/settings', { method: 'PATCH', body: JSON.stringify(payload) });
}

export async function joinClanFromDirectory(
  tag: string,
  playerStats?: { operatorLevel?: number; score?: number; highestWave?: number }
): Promise<{ status: 'joined' | 'requested'; clan?: ClanSummary | null; message?: string }> {
  return request(`/api/clans/${encodeURIComponent(tag)}/join`, {
    method: 'POST',
    body: JSON.stringify(playerStats || {}),
  });
}

export async function respondToJoinRequest(requestId: string, accept: boolean): Promise<{ clan: ClanSummary }> {
  return request(`/api/clans/requests/${encodeURIComponent(requestId)}/${accept ? 'accept' : 'decline'}`, {
    method: 'POST',
    body: '{}',
  });
}

export async function updateClanMemberRole(accountId: string, role: ClanMemberRole): Promise<{ clan: ClanSummary }> {
  return request(`/api/clans/members/${encodeURIComponent(accountId)}/role`, {
    method: 'POST',
    body: JSON.stringify({ role }),
  });
}

export async function kickClanMember(accountId: string): Promise<{ clan: ClanSummary }> {
  return request(`/api/clans/members/${encodeURIComponent(accountId)}/kick`, {
    method: 'POST',
    body: '{}',
  });
}

export async function startClanWarBattle(
  mode: 'raid' | 'siege' | 'boss',
  playerStats?: { operatorLevel?: number; weaponLevel?: number; skillPointsSpent?: number }
): Promise<{
  victory: boolean;
  fameEarned: number;
  rewardNAT: number;
  rewardReputation: number;
  rewardSkillPoints: number;
  combatReport: string;
  clan: ClanSummary;
}> {
  return request('/api/clans/war/battle', {
    method: 'POST',
    body: JSON.stringify({ mode, ...(playerStats || {}) }),
  });
}

export async function contributeClanQuest(questId: string, amount?: number): Promise<{ clan: ClanSummary; costNAT?: number }> {
  return request(`/api/clans/quests/${encodeURIComponent(questId)}/contribute`, {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
}

export async function claimClanQuestReward(questId: string): Promise<{
  rewardNAT: number;
  rewardReputation: number;
  rewardSkillPoints: number;
  clan: ClanSummary;
}> {
  return request(`/api/clans/quests/${encodeURIComponent(questId)}/claim`, {
    method: 'POST',
    body: '{}',
  });
}

export async function leaveClan(): Promise<{ clan: ClanSummary | null }> {
  return request('/api/clans/leave', { method: 'POST', body: '{}' });
}

export async function inviteToClan(username: string): Promise<void> {
  await request('/api/clans/invitations', { method: 'POST', body: JSON.stringify({ username }) });
}

export async function answerClanInvitation(id: string, accept: boolean): Promise<{ clan: ClanSummary | null }> {
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
