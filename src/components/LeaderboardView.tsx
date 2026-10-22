import React, { useState, useEffect } from 'react';
import {
  LeaderboardEntry,
  DerbyStats,
  LiveFeedEvent,
  fetchLeaderboard,
  submitScore,
  connectLeaderboardSocket,
} from '../game/multiplayer';
import {
  Trophy,
  Swords,
  RefreshCw,
  Users,
  Copy,
  Check,
  UserCheck,
  Edit3,
  MapPin,
  Crosshair,
  Award,
  Crown,
  Medal,
  Radio,
  Flame,
  Shield,
  Activity,
  Terminal,
  CheckCircle2,
} from 'lucide-react';

interface LeaderboardViewProps {
  currentScore: number;
  currentKills: number;
  playerName: string;
  clanTag: string;
  playerCity: string;
  unlockedMapsCount: number;
  signatureWeapon: string;
  currentArenaName: string;
  onEditProfile: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  currentScore,
  currentKills,
  playerName,
  clanTag,
  playerCity,
  unlockedMapsCount,
  signatureWeapon,
  currentArenaName,
  onEditProfile,
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [derby, setDerby] = useState<DerbyStats>({
    neuAnspachPoints: 0,
    wehrheimPoints: 0,
    totalBattles: 0,
    currentContestedDistrict: 'Freilichtmuseum Hessenpark',
  });
  const [recentEvents, setRecentEvents] = useState<LiveFeedEvent[]>([]);
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [copiedInvite, setCopiedInvite] = useState<boolean>(false);
  const [filterMode, setFilterMode] = useState<'all' | 'clan' | 'wins' | 'kills'>('all');

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchLeaderboard();
      if (data.leaderboard) setEntries(data.leaderboard);
      if (data.derbyStats) setDerby(data.derbyStats);
      if (data.recentEvents) setRecentEvents(data.recentEvents);
      if (typeof data.onlineCount === 'number') setOnlineCount(data.onlineCount);
    } catch (e) {
      console.warn('Leaderboard fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const socketCtrl = connectLeaderboardSocket(
      (payload) => {
        if (payload.leaderboard) setEntries(payload.leaderboard);
        if (payload.derbyStats) setDerby(payload.derbyStats);
        if (payload.recentEvents) setRecentEvents(payload.recentEvents);
        if (typeof payload.onlineCount === 'number') setOnlineCount(payload.onlineCount);
        setLoading(false);
      },
      (connected) => {
        setWsConnected(connected);
        if (connected && playerName) {
          socketCtrl.sendPresence({
            playerName,
            clanTag,
            currentArena: currentArenaName,
            statusText: 'Prüft die Echtzeit-Bestenliste',
            unlockedMapsCount,
            signatureWeapon,
          });
        }
      }
    );

    return () => {
      socketCtrl.disconnect();
    };
  }, [playerName, clanTag, currentArenaName, unlockedMapsCount, signatureWeapon]);

  const handleSubmitCurrentScore = async () => {
    if (submitted || currentScore <= 0) return;
    try {
      const res = await submitScore({
        name: playerName,
        clanTag,
        score: currentScore,
        kills: currentKills,
        victory: false,
        city: playerCity,
        unlockedMapsCount,
        signatureWeapon,
        currentArena: currentArenaName,
      });
      if (res.leaderboard) setEntries(res.leaderboard);
      if (res.derbyStats) setDerby(res.derbyStats);
      if (res.recentEvents) setRecentEvents(res.recentEvents);
      setSubmitted(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyFriendInvite = () => {
    const shareUrl = window.location.origin;
    const text = `Komm in unser 61267 Neu-Anspach Battle Royale! Nutze beim Start den Clan-Tag [${
      clanTag || '61267'
    }] für unser gemeinsames Live-Leaderboard: ${shareUrl}`;
    navigator.clipboard.writeText(text);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2500);
  };

  const totalPoints = Math.max(1, derby.neuAnspachPoints + derby.wehrheimPoints);
  const anspachPercent =
    derby.neuAnspachPoints === 0 && derby.wehrheimPoints === 0
      ? 50
      : Math.round((derby.neuAnspachPoints / totalPoints) * 100);
  const wehrheimPercent = 100 - anspachPercent;

  // Filtered & sorted real players
  const displayedEntries = [...entries]
    .filter((e) => {
      if (filterMode === 'clan' && clanTag) {
        return (e.clanTag || '').toUpperCase() === clanTag.toUpperCase();
      }
      return true;
    })
    .sort((a, b) => {
      if (filterMode === 'wins') return (b.wins || 0) - (a.wins || 0) || b.score - a.score;
      if (filterMode === 'kills') return (b.kills || 0) - (a.kills || 0) || b.score - a.score;
      return b.score - a.score;
    });

  const top3 = displayedEntries.slice(0, 3);

  return (
    <div className="w-full min-h-full bg-slate-950 text-slate-100 p-3 sm:p-6 pb-28 lg:pb-12">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header - Dark Obsidian Glassmorphism with Live Radar Insignia */}
        <header className="relative overflow-hidden rounded-2xl bg-slate-900/85 backdrop-blur-xl border border-white/10 p-5 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.06)]">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-red-500/10 blur-3xl pointer-events-none" />

          {/* Tactical Corner Brackets */}
          <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-amber-500/40 pointer-events-none" />
          <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-amber-500/40 pointer-events-none" />
          <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-amber-500/40 pointer-events-none" />
          <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-amber-500/40 pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                    wsConnected
                      ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                      : 'bg-slate-800/80 border border-white/10 text-slate-400'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full inline-block ${
                      wsConnected
                        ? 'bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.8)]'
                        : 'bg-slate-500'
                    }`}
                  />
                  <span>
                    {wsConnected
                      ? `[ECHTZEIT-RADAR: ${onlineCount} OPERATOR ONLINE]`
                      : '[SERVER-SYNCHRONISIERT: OFFLINE]'}
                  </span>
                </span>
                <span className="px-2.5 py-0.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 border border-amber-500/40 text-amber-300">
                  OFFIZIELLE RANG-TABELLE
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
                <span>Taunus-Bestenliste & Derby</span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                Verifizierte Live-Rangliste: Alle Punkte, Kills, Siege und Gebietsgewinne werden in Echtzeit zwischen registrierten Spielern synchronisiert.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start md:self-auto">
              <button
                type="button"
                onClick={onEditProfile}
                className="btn-tactile flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-white/10 text-slate-200 hover:text-white text-xs font-mono font-bold border border-white/10 hover:border-white/20 active:scale-[0.98] transition-all duration-150 cursor-pointer shadow-md"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  [{clanTag || '61267'}] {playerName}
                </span>
              </button>

              <button
                type="button"
                onClick={handleCopyFriendInvite}
                className="btn-tactile flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-black text-xs tracking-wider uppercase transition-all duration-150 shadow-[0_4px_20px_rgba(245,158,11,0.35)] cursor-pointer"
              >
                {copiedInvite ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Kopiert!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Freunde einladen</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={loadData}
                className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 hover:border-white/20 active:scale-95 transition-all duration-150 cursor-pointer"
                title="Bestenliste aktualisieren"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* Live Derby Tug-of-War Bar (Neu-Anspach vs Wehrheim) */}
          <div className="mt-6 pt-5 border-t border-white/10 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-mono font-bold">
              <span className="text-red-400 tabular-nums flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] inline-block" />
                61267 Neu-Anspach: {derby.neuAnspachPoints.toLocaleString('de-DE')} Pkt ({anspachPercent}%)
              </span>
              <span className="text-amber-400 tabular-nums flex items-center gap-1.5 sm:justify-end">
                <span>
                  61273 Wehrheim: {derby.wehrheimPoints.toLocaleString('de-DE')} Pkt ({wehrheimPercent}%)
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)] inline-block" />
              </span>
            </div>

            {/* Glowing Tug-of-War Progress Bar */}
            <div className="relative w-full h-4 rounded-full bg-slate-950 overflow-hidden flex border border-white/10 p-0.5 shadow-inner">
              <div
                className="bg-gradient-to-r from-red-600 to-rose-500 h-full rounded-l-full transition-all duration-700 shadow-[0_0_12px_rgba(239,68,68,0.6)]"
                style={{ width: `${anspachPercent}%` }}
              />
              <div
                className="bg-gradient-to-r from-amber-400 to-yellow-500 h-full rounded-r-full transition-all duration-700 shadow-[0_0_12px_rgba(245,158,11,0.6)]"
                style={{ width: `${wehrheimPercent}%` }}
              />

              {/* Center Battle Indicator */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_8px_rgba(255,255,255,1)] transform -translate-x-1/2 z-10"
                style={{ left: `${anspachPercent}%` }}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 font-mono">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-red-400" />
                Umkämpftes Gebiet: <strong className="text-slate-200">{derby.currentContestedDistrict}</strong>
              </span>
              <span className="tabular-nums flex items-center gap-1.5">
                <Swords className="w-3.5 h-3.5 text-amber-400" />
                Absolvierte Derby-Schlachten: <strong className="text-slate-200">{derby.totalBattles.toLocaleString('de-DE')}</strong>
              </span>
            </div>
          </div>
        </header>

        {/* Manual Submit Banner if player has unsubmitted run points */}
        {currentScore > 0 && !submitted && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-slate-900/90 to-amber-500/10 border border-amber-500/40 shadow-xl backdrop-blur-md">
            <div>
              <div className="text-sm font-black text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Gefechtsergebnis bereit zur Übertragung</span>
              </div>
              <div className="text-xs text-slate-300 font-mono mt-0.5">
                {currentScore.toLocaleString('de-DE')} Punkte · {currentKills} Kills als [{clanTag || '61267'}]{' '}
                {playerName}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmitCurrentScore}
              className="btn-tactile px-5 py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-150 shadow-[0_4px_16px_rgba(245,158,11,0.35)] cursor-pointer shrink-0"
            >
              Punkte in Bestenliste verbuchen
            </button>
          </div>
        )}

        {/* TOP 3 PODIUM GLORY CARDS (Gold, Silver, Bronze) */}
        {top3.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">
              <Trophy className="w-4 h-4" />
              <span>Taunus-Podium · Die 3 Spitzen-Operatoren</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* #2 Silver (Left) */}
              {top3[1] && (
                <div className="relative p-5 rounded-2xl bg-gradient-to-b from-slate-400/15 via-slate-900/95 to-slate-950 border border-slate-300/50 shadow-[0_12px_35px_rgba(0,0,0,0.6)] backdrop-blur-md flex flex-col justify-between order-2 md:order-1">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-0.5 rounded font-mono text-[10px] font-black uppercase tracking-wider bg-slate-300/20 text-slate-200 border border-slate-300/40">
                        [#2 · MEISTER]
                      </span>
                      <Medal className="w-6 h-6 text-slate-300 drop-shadow-[0_0_8px_rgba(203,213,225,0.6)]" />
                    </div>

                    <div className="text-lg font-black text-white truncate">
                      {top3[1].clanTag && (
                        <span className="text-slate-300 mr-1.5">[{top3[1].clanTag}]</span>
                      )}
                      <span>{top3[1].name}</span>
                    </div>

                    <div className="text-xs text-slate-400 font-mono mt-0.5">
                      {top3[1].title || 'Taunus-Operator'} · {top3[1].city}
                    </div>

                    <div className="mt-4 p-3 rounded-xl bg-slate-950/80 border border-white/10 text-xs font-mono space-y-1">
                      <div className="text-slate-400 truncate">
                        Waffe: <span className="text-slate-200">{top3[1].signatureWeapon || 'XM4 Bembel'}</span>
                      </div>
                      <div className="text-slate-400">
                        Maps: <span className="text-slate-200">{top3[1].unlockedMapsCount || 1}/7 freigeschaltet</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between font-mono">
                    <span className="text-xs text-slate-400">PUNKTE:</span>
                    <span className="text-xl font-black text-slate-200 tabular-nums">
                      {top3[1].score.toLocaleString('de-DE')}
                    </span>
                  </div>
                </div>
              )}

              {/* #1 Gold Champion (Center - Raised / Heroic Aura) */}
              {top3[0] && (
                <div className="relative p-6 rounded-2xl bg-gradient-to-b from-amber-500/25 via-slate-900/95 to-slate-950 border-2 border-amber-400 shadow-[0_20px_50px_rgba(245,158,11,0.3)] backdrop-blur-md flex flex-col justify-between order-1 md:order-2 md:-translate-y-2">
                  {/* Radiant Gold Shimmer Accent Strip */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 rounded-t-2xl shadow-[0_0_12px_rgba(245,158,11,0.9)]" />

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-0.5 rounded font-mono text-[11px] font-black uppercase tracking-wider bg-amber-500/30 text-amber-200 border border-amber-400/80 shadow-[0_0_12px_rgba(245,158,11,0.4)]">
                        [#1 · APEX CHAMPION]
                      </span>
                      <Trophy className="w-8 h-8 text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.8)]" />
                    </div>

                    <div className="text-xl font-black text-white truncate flex items-center gap-1.5">
                      {top3[0].clanTag && (
                        <span className="text-amber-400">[{top3[0].clanTag}]</span>
                      )}
                      <span>{top3[0].name}</span>
                    </div>

                    <div className="text-xs text-amber-300 font-mono mt-0.5">
                      {top3[0].title || 'Ehrenbürger'} · {top3[0].city}
                    </div>

                    <div className="mt-4 p-3.5 rounded-xl bg-slate-950/90 border border-amber-500/40 text-xs font-mono space-y-1.5 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                      <div className="text-slate-300 truncate">
                        Signatur: <span className="text-amber-300 font-bold">{top3[0].signatureWeapon || 'XM4 Bembel'}</span>
                      </div>
                      <div className="text-slate-300 flex justify-between">
                        <span>Maps: {top3[0].unlockedMapsCount || 1}/7</span>
                        <span className="text-emerald-400 font-bold">{top3[0].wins || 0} Siege</span>
                        <span className="text-red-400 font-bold">{top3[0].kills || 0} Kills</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-amber-500/40 flex items-center justify-between font-mono">
                    <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                      CHAMPION SCORE:
                    </span>
                    <span className="text-2xl font-black text-amber-300 tabular-nums shadow-sm">
                      {top3[0].score.toLocaleString('de-DE')}
                    </span>
                  </div>
                </div>
              )}

              {/* #3 Bronze (Right) */}
              {top3[2] && (
                <div className="relative p-5 rounded-2xl bg-gradient-to-b from-amber-800/15 via-slate-900/95 to-slate-950 border border-amber-700/60 shadow-[0_12px_35px_rgba(0,0,0,0.6)] backdrop-blur-md flex flex-col justify-between order-3">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-0.5 rounded font-mono text-[10px] font-black uppercase tracking-wider bg-amber-800/25 text-amber-300 border border-amber-700/50">
                        [#3 · ELITE]
                      </span>
                      <Award className="w-6 h-6 text-amber-600 drop-shadow-[0_0_8px_rgba(217,119,6,0.6)]" />
                    </div>

                    <div className="text-lg font-black text-white truncate">
                      {top3[2].clanTag && (
                        <span className="text-amber-500 mr-1.5">[{top3[2].clanTag}]</span>
                      )}
                      <span>{top3[2].name}</span>
                    </div>

                    <div className="text-xs text-slate-400 font-mono mt-0.5">
                      {top3[2].title || 'Taunus-Operator'} · {top3[2].city}
                    </div>

                    <div className="mt-4 p-3 rounded-xl bg-slate-950/80 border border-white/10 text-xs font-mono space-y-1">
                      <div className="text-slate-400 truncate">
                        Waffe: <span className="text-slate-200">{top3[2].signatureWeapon || 'XM4 Bembel'}</span>
                      </div>
                      <div className="text-slate-400">
                        Maps: <span className="text-slate-200">{top3[2].unlockedMapsCount || 1}/7 freigeschaltet</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between font-mono">
                    <span className="text-xs text-slate-400">PUNKTE:</span>
                    <span className="text-xl font-black text-amber-500 tabular-nums">
                      {top3[2].score.toLocaleString('de-DE')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Main Grid: Left 2/3 Tactical Table, Right 1/3 Live Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Real Players Leaderboard Table */}
          <div className="lg:col-span-2 p-5 sm:p-6 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.06)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-black text-white font-mono tracking-wider">
                  OPERATOR-RANGLISTE ({displayedEntries.length})
                </span>
              </div>

              {/* High-Tech Tactical Filter Controls */}
              <div className="flex items-center gap-1 p-1 bg-slate-950/80 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`btn-tactile px-3.5 py-1.5 text-xs font-mono rounded-lg transition-all duration-150 cursor-pointer whitespace-nowrap active:scale-[0.98] ${
                    filterMode === 'all'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-[0_2px_12px_rgba(245,158,11,0.35)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Alle ({entries.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('clan')}
                  className={`btn-tactile px-3.5 py-1.5 text-xs font-mono rounded-lg transition-all duration-150 cursor-pointer whitespace-nowrap active:scale-[0.98] ${
                    filterMode === 'clan'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-[0_2px_12px_rgba(245,158,11,0.35)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Clan [{clanTag || '61267'}]
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('wins')}
                  className={`btn-tactile px-3.5 py-1.5 text-xs font-mono rounded-lg transition-all duration-150 cursor-pointer whitespace-nowrap active:scale-[0.98] ${
                    filterMode === 'wins'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-[0_2px_12px_rgba(245,158,11,0.35)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Siege
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('kills')}
                  className={`btn-tactile px-3.5 py-1.5 text-xs font-mono rounded-lg transition-all duration-150 cursor-pointer whitespace-nowrap active:scale-[0.98] ${
                    filterMode === 'kills'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-[0_2px_12px_rgba(245,158,11,0.35)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Kills
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 text-[11px]">
                    <th className="py-3 px-3">RANG</th>
                    <th className="py-3 px-3">OPERATOR & CLAN</th>
                    <th className="py-3 px-3">SIGNATUR-WAFFE</th>
                    <th className="py-3 px-3 text-right">SIEGE</th>
                    <th className="py-3 px-3 text-right">KILLS</th>
                    <th className="py-3 px-3 text-right">PUNKTE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {displayedEntries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400">
                        Noch keine Einträge vorhanden. Absolviere ein Match oder lade Freunde mit Clan-Tag [{clanTag || '61267'}] ein!
                      </td>
                    </tr>
                  ) : (
                    displayedEntries.map((entry, idx) => {
                      const isMe = entry.name.toLowerCase() === playerName.toLowerCase();
                      const displayRank = idx + 1;

                      return (
                        <tr
                          key={entry.id}
                          className={`transition-colors ${
                            isMe
                              ? 'bg-amber-500/10 hover:bg-amber-500/15 border-l-2 border-l-amber-400'
                              : 'hover:bg-white/[0.04]'
                          }`}
                        >
                          <td className="py-3.5 px-3 font-black tabular-nums">
                            {displayRank === 1 ? (
                              <span className="text-amber-400 font-black">#1</span>
                            ) : displayRank === 2 ? (
                              <span className="text-slate-200 font-bold">#2</span>
                            ) : displayRank === 3 ? (
                              <span className="text-amber-600 font-bold">#3</span>
                            ) : (
                              <span className="text-slate-500">#{displayRank}</span>
                            )}
                          </td>

                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-1.5 font-black text-white">
                              {entry.clanTag && (
                                <span className="text-amber-400 font-bold">[{entry.clanTag}]</span>
                              )}
                              <span>{entry.name}</span>
                              {isMe && (
                                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                                  Du
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span>{entry.title}</span>
                              <span>·</span>
                              <span>{entry.city}</span>
                              {entry.isOnline && (
                                <>
                                  <span>·</span>
                                  <span className="text-emerald-400 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Live
                                  </span>
                                </>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-3">
                            <div className="text-slate-200 truncate max-w-[170px]">
                              {entry.signatureWeapon || 'XM4 Bembel-Sturmgewehr'}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {entry.unlockedMapsCount || 1}/7 Maps · Max Welle {entry.highestWave || 1}
                            </div>
                          </td>

                          <td className="py-3.5 px-3 text-right text-emerald-400 font-bold tabular-nums">
                            {entry.wins || 0}
                          </td>

                          <td className="py-3.5 px-3 text-right text-red-400 font-bold tabular-nums">
                            {entry.kills || 0}
                          </td>

                          <td className="py-3.5 px-3 text-right text-amber-400 font-black tabular-nums text-sm">
                            {(entry.score || 0).toLocaleString('de-DE')}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: Live Comms Ticker & Squad Info */}
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.06)] flex flex-col justify-between space-y-5">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  LIVE-COMMS TICKER
                </span>
                <span className="text-[10px] font-mono text-emerald-400 animate-pulse">● LIVE STREAM</span>
              </div>

              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {recentEvents.length === 0 ? (
                  <div className="text-xs text-slate-400 font-mono py-8 text-center">
                    Noch keine Live-Ereignisse übertragen. Starte eine Runde, um das Log zu füllen!
                  </div>
                ) : (
                  recentEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3 rounded-xl bg-slate-950/80 border border-white/10 text-xs space-y-1 hover:border-white/20 transition-colors"
                    >
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="font-bold text-white flex items-center gap-1">
                          {ev.clanTag ? (
                            <span className="text-amber-400">[{ev.clanTag}]</span>
                          ) : null}
                          <span>{ev.playerName}</span>
                        </span>
                        <span className="text-slate-500 tabular-nums">
                          {new Date(ev.timestamp).toLocaleTimeString('de-DE', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed font-sans">{ev.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/30 text-xs space-y-2 shadow-sm">
              <div className="font-mono font-bold text-amber-300 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-400" />
                <span>Squad-System & Freunde:</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                Teile den Link mit deinem Clan. Sobald deine Freunde denselben Clan-Tag ([{clanTag || '61267'}]) nutzen, seht ihr euch in Echtzeit auf dieser Rangliste!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
