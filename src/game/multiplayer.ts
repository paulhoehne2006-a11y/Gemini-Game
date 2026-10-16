export interface RoomPlayer {
  id: string;
  name: string;
  clanTag?: string;
  kills: number;
  health: number;
  score: number;
  sector: string;
  lastSeen: number;
}

export interface MultiplayerRoom {
  code: string;
  host: string;
  arena: string;
  players: Record<string, RoomPlayer>;
  wave: number;
  totalKills: number;
  status: 'lobby' | 'in_game' | 'victory' | 'defeat';
  updatedAt: number;
}

export interface LeaderboardEntry {
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
  isOnline?: boolean;
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

export interface DerbyStats {
  neuAnspachPoints: number;
  wehrheimPoints: number;
  totalBattles: number;
  currentContestedDistrict: string;
}

export interface LeaderboardPayload {
  leaderboard: LeaderboardEntry[];
  derbyStats: DerbyStats;
  recentEvents: LiveFeedEvent[];
  onlineCount: number;
}

export interface OperatorProfileConsent {
  acceptedAt: string;
  noticeVersion: string;
  privacyPolicyVersion: string;
  termsVersion: string;
}

export async function registerOperatorProfile(payload: {
  name: string;
  clanTag?: string;
  city?: string;
  consent?: OperatorProfileConsent;
  unlockedMapsCount?: number;
  signatureWeapon?: string;
  currentArena?: string;
}): Promise<LeaderboardPayload> {
  const res = await fetch('/api/leaderboard/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function fetchLeaderboard(): Promise<LeaderboardPayload> {
  const res = await fetch('/api/leaderboard');
  return res.json();
}

export async function submitScore(payload: {
  name: string;
  clanTag?: string;
  score: number;
  kills: number;
  wave?: number;
  victory: boolean;
  city?: string;
  unlockedMapsCount?: number;
  signatureWeapon?: string;
  currentArena?: string;
  eventNotice?: string;
}): Promise<LeaderboardPayload> {
  const res = await fetch('/api/leaderboard/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function joinMultiplayerRoom(
  code: string,
  playerName: string,
  arena: string,
  clanTag = '61267'
): Promise<{ room: MultiplayerRoom; playerId: string }> {
  const res = await fetch('/api/multiplayer/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, playerName, clanTag, arena }),
  });
  const data = await res.json();
  if (!res.ok || !data.success || !data.room || !data.playerId) {
    throw new Error(data.error || 'Fehler beim Beitreten');
  }
  return { room: data.room, playerId: data.playerId };
}

export async function fetchMultiplayerRoom(roomCode: string): Promise<MultiplayerRoom> {
  const res = await fetch(`/api/multiplayer/rooms/${encodeURIComponent(roomCode)}`);
  const data = await res.json();
  if (!res.ok || !data.success || !data.room) {
    throw new Error(data.error || 'Raum nicht gefunden');
  }
  return data.room;
}

export async function updateMultiplayerState(
  roomCode: string,
  playerId: string,
  kills: number,
  health: number,
  score: number,
  wave: number
): Promise<MultiplayerRoom> {
  const res = await fetch('/api/multiplayer/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomCode, playerId, kills, health, score, wave }),
  });
  const data = await res.json();
  if (!res.ok || !data.success || !data.room) {
    throw new Error(data.error || 'Multiplayer-Status konnte nicht synchronisiert werden');
  }
  return data.room;
}

/**
 * Establishes a real-time WebSocket connection to /ws for live Leaderboard & Friend Presence updates.
 */
export function connectLeaderboardSocket(
  onSync: (payload: LeaderboardPayload) => void,
  onStatusChange?: (connected: boolean) => void,
  onSessionSuperseded?: (reason: string) => void
) {
  let ws: WebSocket | null = null;
  let reconnectTimer: number | null = null;
  let isDisposed = false;

  const connect = () => {
    if (isDisposed || typeof window === 'undefined') return;
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const url = `${protocol}//${window.location.host}/ws`;
      ws = new WebSocket(url);

      ws.onopen = () => {
        onStatusChange?.(true);
        const storedToken = localStorage.getItem('na_auth_token');
        if (storedToken && ws?.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'auth:bind_session', token: storedToken }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'leaderboard:sync' && msg.data) {
            onSync(msg.data);
          } else if (msg.type === 'auth:session_superseded') {
            onSessionSuperseded?.(
              msg.reason ||
                'Dein Account wurde auf einem anderen Gerät angemeldet. Aus Sicherheitsgründen kann immer nur 1 Gerät aktiv sein.'
            );
          }
        } catch {}
      };

      ws.onclose = () => {
        onStatusChange?.(false);
        if (!isDisposed) {
          reconnectTimer = window.setTimeout(connect, 3500);
        }
      };

      ws.onerror = () => {
        try {
          ws?.close();
        } catch {}
      };
    } catch {
      onStatusChange?.(false);
    }
  };

  connect();

  return {
    sendPresence: (presence: {
      playerName: string;
      clanTag?: string;
      currentArena?: string;
      statusText?: string;
      unlockedMapsCount?: number;
      signatureWeapon?: string;
    }) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'player:presence', ...presence }));
      }
    },
    bindSession: (token: string) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'auth:bind_session', token }));
      }
    },
    disconnect: () => {
      isDisposed = true;
      if (reconnectTimer !== null) {
        clearTimeout(reconnectTimer);
      }
      try {
        ws?.close();
      } catch {}
    },
  };
}
