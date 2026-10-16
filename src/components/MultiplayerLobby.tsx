import React, { useEffect, useState } from 'react';
import { fetchMultiplayerRoom, MultiplayerRoom, joinMultiplayerRoom } from '../game/multiplayer';
import { Users, Play, Copy, Check, Radio, Swords, ShieldAlert, Trophy } from 'lucide-react';
import { ARENAS, checkArenaUnlocked } from '../game/three/arenas';

interface MultiplayerLobbyProps {
  onStartGameWithRoom: (room: MultiplayerRoom, playerId: string) => void;
  playerName: string;
  clanTag: string;
  onOpenProfileModal: () => void;
  onOpenLeaderboard: () => void;
  totalWins: number;
  unlockedMaps: string[];
}

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({
  onStartGameWithRoom,
  playerName,
  clanTag,
  onOpenProfileModal,
  onOpenLeaderboard,
  totalWins,
  unlockedMaps,
}) => {
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [selectedArena, setSelectedArena] = useState('hessenpark');
  const [currentRoom, setCurrentRoom] = useState<MultiplayerRoom | null>(null);
  const [localPlayerId, setLocalPlayerId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!currentRoom) return;
    let disposed = false;
    const syncRoom = async () => {
      try {
        const room = await fetchMultiplayerRoom(currentRoom.code);
        if (!disposed) setCurrentRoom(room);
      } catch (error) {
        if (!disposed) setErrorMsg(error instanceof Error ? error.message : 'Lobby-Verbindung verloren');
      }
    };
    const timer = window.setInterval(syncRoom, 2000);
    syncRoom();
    return () => {
      disposed = true;
      window.clearInterval(timer);
    };
  }, [currentRoom?.code]);

  const handleJoinOrCreate = async (codeToUse?: string) => {
    try {
      setIsJoining(true);
      setErrorMsg(null);
      const code = codeToUse || roomCodeInput.trim() || undefined;
      const { room, playerId } = await joinMultiplayerRoom(
        code || '',
        playerName || 'Operator',
        selectedArena,
        clanTag || '61267'
      );
      setCurrentRoom(room);
      setLocalPlayerId(playerId);
    } catch (err: any) {
      setErrorMsg(err.message || 'Verbindung fehlgeschlagen');
    } finally {
      setIsJoining(false);
    }
  };

  const copyCode = () => {
    if (currentRoom) {
      navigator.clipboard.writeText(currentRoom.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full min-h-full bg-slate-950 text-slate-100 p-4 sm:p-6 pb-28 lg:pb-12">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider mb-1">
              <Radio className="w-4 h-4 text-emerald-400" />
              <span>Taunus Freunde-Netzwerk & Squad-Lobbys</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Gemeinsam mit Freunden spielen & vergleichen
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Erstelle eine Raum-Lobby für dein Squad oder vergleiche deine Punkte, Kills und Siege in Echtzeit über euren gemeinsamen Clan-Tag im echten Live-Leaderboard!
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenLeaderboard}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer shrink-0"
          >
            <Trophy className="w-4 h-4" />
            <span>Zum echten Live-Leaderboard</span>
          </button>
        </div>

        {/* Active Operator Profile Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-mono font-bold text-amber-400">
              {playerName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-[10px] font-mono text-slate-400">DEIN AKTIVES OPERATOR-PROFIL</div>
              <div className="text-sm font-bold text-white font-mono">
                <span className="text-amber-400 mr-1.5">[{clanTag || '61267'}]</span>
                <span>{playerName}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenProfileModal}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-semibold transition-colors cursor-pointer"
          >
            Benutzername / Clan-Tag ändern
          </button>
        </div>

        {/* Current Active Room State */}
        {currentRoom ? (
          <div className="p-6 rounded-2xl bg-slate-900 border border-emerald-500/40 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-mono text-slate-400 uppercase">Aktive Schlacht-Lobby</span>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-3xl font-extrabold tracking-wider text-emerald-400 font-mono">
                    #{currentRoom.code}
                  </span>
                  <button
                    type="button"
                    onClick={copyCode}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                    title="Code kopieren"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono text-slate-400 uppercase">Austragungsort</span>
                <div className="text-sm font-semibold text-white">
                  {ARENAS[currentRoom.arena]?.name || currentRoom.arena}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>VERBUNDENE VERTEIDIGER ({Object.keys(currentRoom.players).length})</span>
                <span className="text-emerald-400">Online & Bereit</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.values(currentRoom.players).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center font-bold text-xs">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-1.5 font-mono">
                          {p.clanTag && <span className="text-amber-400">[{p.clanTag}]</span>}
                          <span>{p.name}</span>
                          {p.id === localPlayerId && (
                            <span className="text-[10px] text-emerald-400 font-normal">· Du</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Kills: {p.kills} · Score: {p.score}
                        </div>
                      </div>
                    </div>
                    <div className="text-right font-mono text-xs text-slate-400">
                      Sektor: {p.sector}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Alle Match-Punkte fließen live in das echte Server-Leaderboard.</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (localPlayerId) {
                    onStartGameWithRoom(currentRoom, localPlayerId);
                  }
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg transition-colors cursor-pointer"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Schlacht gemeinsam starten</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Create Room */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase mb-1">
                  <Swords className="w-4 h-4" />
                  <span>Neuen Raum eröffnen</span>
                </div>
                <h3 className="text-lg font-bold text-white">Eigene Squad-Schlacht erstellen</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Wähle eine deiner freigeschalteten Neu-Anspacher Maps als Arena und teile den Raumcode mit deinen Freunden.
                </p>

                <div className="mt-4 space-y-2">
                  <label className="text-xs font-mono text-slate-300">FREIGESCHALTETE ARENA WÄHLEN:</label>
                  <select
                    value={selectedArena}
                    onChange={(e) => setSelectedArena(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                  >
                    {Object.values(ARENAS).map((a) => {
                      const unlocked = checkArenaUnlocked(a.id, totalWins, unlockedMaps);
                      return (
                        <option key={a.id} value={a.id} disabled={!unlocked}>
                          {unlocked ? a.name : `🔒 ${a.name} (Erst freischalten)`}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleJoinOrCreate()}
                disabled={isJoining}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                {isJoining ? 'Erstelle Raum...' : 'Raum eröffnen & Code erhalten'}
              </button>
            </div>

            {/* Join Room */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-sky-400 uppercase mb-1">
                  <Users className="w-4 h-4" />
                  <span>Raum beitreten</span>
                </div>
                <h3 className="text-lg font-bold text-white">Freundes-Lobby betreten</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Gib den 4-stelligen Raumcode deiner Freunde ein, um direkt in ihre Einsatzgruppe einzusteigen.
                </p>

                <div className="mt-4 space-y-2">
                  <label className="text-xs font-mono text-slate-300">RAUMCODE EINGEBEN:</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={roomCodeInput}
                    onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                    placeholder="z.B. 4821"
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm tracking-widest font-mono text-center uppercase focus:outline-none focus:border-sky-500"
                  />
                </div>
                {errorMsg && <div className="text-xs text-red-400 mt-2 font-mono">{errorMsg}</div>}
              </div>

              <button
                type="button"
                onClick={() => handleJoinOrCreate()}
                disabled={isJoining || !roomCodeInput.trim()}
                className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                {isJoining ? 'Trete bei...' : 'Raum beitreten'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
