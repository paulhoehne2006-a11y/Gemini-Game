import React, { useEffect, useState } from 'react';
import { fetchMultiplayerRoom, MultiplayerRoom, joinMultiplayerRoom } from '../game/multiplayer';
import { Users, Play, Copy, Check, Radio, Swords, ShieldAlert, Trophy, ShieldCheck, Sparkles } from 'lucide-react';
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
        {/* Header - Tactical HUD Glass */}
        <div className="relative overflow-hidden p-6 sm:p-8 rounded-2xl bg-slate-900/85 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.06)] flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          {/* Subtle Ambient Glows */}
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

          {/* Tactical Corner Brackets */}
          <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-emerald-500/40 pointer-events-none" />
          <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-emerald-500/40 pointer-events-none" />
          <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-emerald-500/40 pointer-events-none" />
          <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-emerald-500/40 pointer-events-none" />

          <div className="relative space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <Radio className="w-4 h-4 text-emerald-400" />
              <span>Taunus Freunde-Netzwerk & Squad-Lobbys</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Gemeinsam mit Freunden spielen & vergleichen
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Erstelle eine Raum-Lobby für dein Squad oder vergleiche deine Punkte, Kills und Siege in Echtzeit über euren gemeinsamen Clan-Tag im echten Live-Leaderboard!
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenLeaderboard}
            className="btn-tactile relative flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-black text-xs transition-all duration-150 cursor-pointer shrink-0 shadow-[0_4px_20px_rgba(245,158,11,0.35)]"
          >
            <Trophy className="w-4 h-4" />
            <span>Zum echten Live-Leaderboard</span>
          </button>
        </div>

        {/* Active Operator Profile Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-white/10 shadow-lg">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center font-mono font-black text-base text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              {playerName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-[10px] font-mono text-slate-400 tracking-wider">DEIN AKTIVES OPERATOR-PROFIL</div>
              <div className="text-sm sm:text-base font-bold text-white font-mono flex items-center gap-2">
                <span className="text-amber-400">[{clanTag || '61267'}]</span>
                <span>{playerName}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenProfileModal}
            className="btn-tactile px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-white/10 border border-white/10 hover:border-white/20 active:scale-[0.98] text-slate-200 text-xs font-mono font-semibold transition-all duration-150 cursor-pointer"
          >
            Benutzername / Clan-Tag ändern
          </button>
        </div>

        {/* Current Active Room State */}
        {currentRoom ? (
          <div className="relative overflow-hidden p-6 sm:p-8 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-emerald-500/35 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(16,185,129,0.15)] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
              <div>
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Aktive Schlacht-Lobby</span>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-3xl sm:text-4xl font-black tracking-wider text-emerald-400 font-mono drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]">
                    #{currentRoom.code}
                  </span>
                  <button
                    type="button"
                    onClick={copyCode}
                    className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
                    title="Code kopieren"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="sm:text-right">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Austragungsort</span>
                <div className="text-base font-bold text-white mt-1">
                  {ARENAS[currentRoom.arena]?.name || currentRoom.arena}
                </div>
              </div>
            </div>

            <div className="space-y-3.5">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span className="tracking-wider">VERBUNDENE VERTEIDIGER ({Object.keys(currentRoom.players).length})</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Online & Bereit</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {Object.values(currentRoom.players).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/80 border border-white/10 hover:border-white/20 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center font-bold text-sm">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-1.5 font-mono">
                          {p.clanTag && <span className="text-amber-400">[{p.clanTag}]</span>}
                          <span>{p.name}</span>
                          {p.id === localPlayerId && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-normal">Du</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
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

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 border-t border-white/10">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Alle Match-Punkte fließen live in das echte Server-Leaderboard.</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (localPlayerId) {
                    onStartGameWithRoom(currentRoom, localPlayerId);
                  }
                }}
                className="btn-tactile w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-black text-sm rounded-xl shadow-[0_4px_25px_rgba(16,185,129,0.4)] transition-all duration-150 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Schlacht gemeinsam starten</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Create Room */}
            <div className="p-6 sm:p-7 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.5)] flex flex-col justify-between space-y-5">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-wider mb-1.5">
                  <Swords className="w-4 h-4" />
                  <span>Neuen Raum eröffnen</span>
                </div>
                <h3 className="text-lg font-black text-white">Eigene Squad-Schlacht erstellen</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Wähle eine deiner freigeschalteten Neu-Anspacher Maps als Arena und teile den Raumcode mit deinen Freunden.
                </p>

                <div className="mt-5 space-y-2">
                  <label className="text-xs font-mono text-slate-300 tracking-wider">FREIGESCHALTETE ARENA WÄHLEN:</label>
                  <select
                    value={selectedArena}
                    onChange={(e) => setSelectedArena(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 transition-all cursor-pointer"
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
                className="btn-tactile w-full py-3 bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-black text-xs rounded-xl transition-all duration-150 cursor-pointer shadow-[0_4px_20px_rgba(245,158,11,0.35)] disabled:opacity-50"
              >
                {isJoining ? 'Erstelle Raum...' : 'Raum eröffnen & Code erhalten'}
              </button>
            </div>

            {/* Join Room */}
            <div className="p-6 sm:p-7 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.5)] flex flex-col justify-between space-y-5">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-sky-400 uppercase tracking-wider mb-1.5">
                  <Users className="w-4 h-4" />
                  <span>Raum beitreten</span>
                </div>
                <h3 className="text-lg font-black text-white">Freundes-Lobby betreten</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Gib den 4-stelligen Raumcode deiner Freunde ein, um direkt in ihre Einsatzgruppe einzusteigen.
                </p>

                <div className="mt-5 space-y-2">
                  <label className="text-xs font-mono text-slate-300 tracking-wider">RAUMCODE EINGEBEN:</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={roomCodeInput}
                    onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                    placeholder="z.B. 4821"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-white text-sm tracking-widest font-mono text-center uppercase focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 transition-all placeholder-slate-600"
                  />
                </div>
                {errorMsg && <div className="text-xs text-red-400 mt-2 font-mono">{errorMsg}</div>}
              </div>

              <button
                type="button"
                onClick={() => handleJoinOrCreate()}
                disabled={isJoining || !roomCodeInput.trim()}
                className="btn-tactile w-full py-3 bg-sky-500 hover:bg-sky-400 active:scale-[0.98] text-slate-950 font-black text-xs rounded-xl transition-all duration-150 cursor-pointer shadow-[0_4px_20px_rgba(14,165,233,0.35)] disabled:opacity-50"
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
