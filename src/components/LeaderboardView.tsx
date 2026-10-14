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

  return (
    <div className="w-full min-h-full bg-slate-950 text-slate-100 p-4 sm:p-6 pb-28 lg:pb-12">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header & Friends Clan-Tag Invite Bar */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 tracking-wider mb-1">
                <span>
                  {wsConnected
                    ? `ECHTZEIT-MULTIPLAYER LEADERBOARD · ${onlineCount} OPERATOR ONLINE`
                    : 'ECHTES SPIELER-LEADERBOARD · SERVER-SYNCHRONISIERT'}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Offizielle Rangliste (Nur echte Spieler & Freunde)
              </h1>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Keine Bots, keine gefälschten Einträge: Hier erscheinen ausschließlich echte Spieler, die sich mit ihrem Benutzernamen registriert haben. Alle Punkte, Kills, Siege und freigeschalteten Maps werden live synchronisiert.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={onEditProfile}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  [{clanTag || '61267'}] {playerName}
                </span>
              </button>

              <button
                type="button"
                onClick={handleCopyFriendInvite}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
              >
                {copiedInvite ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Einladung kopiert!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Freunde einladen ([{clanTag || '61267'}])</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={loadData}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                title="Bestenliste aktualisieren"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Real Derby Tug-of-War Bar */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <div className="flex justify-between text-xs font-mono font-bold">
              <span className="text-red-400 tabular-nums">
                61267 Neu-Anspach: {derby.neuAnspachPoints.toLocaleString('de-DE')} Pkt ({anspachPercent}%)
              </span>
              <span className="text-amber-400 tabular-nums">
                61273 Wehrheim: {derby.wehrheimPoints.toLocaleString('de-DE')} Pkt ({wehrheimPercent}%)
              </span>
            </div>

            <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden flex border border-slate-800">
              <div
                className="bg-red-600 transition-all duration-500"
                style={{ width: `${anspachPercent}%` }}
              />
              <div
                className="bg-amber-500 transition-all duration-500"
                style={{ width: `${wehrheimPercent}%` }}
              />
            </div>

            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>Letztes Einsatzgebiet: {derby.currentContestedDistrict}</span>
              <span className="tabular-nums">
                Absolvierte echte Matches: {derby.totalBattles.toLocaleString('de-DE')}
              </span>
            </div>
          </div>
        </div>

        {/* Manual Submit Banner if player has unsubmitted run points */}
        {currentScore > 0 && !submitted && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-amber-500/40">
            <div>
              <div className="text-xs font-bold text-white">
                Aktuelles Gefechtsergebnis bereit zur Übertragung
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {currentScore.toLocaleString('de-DE')} Punkte · {currentKills} Kills als [{clanTag}]{' '}
                {playerName}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmitCurrentScore}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Punkte jetzt in Bestenliste verbuchen
            </button>
          </div>
        )}

        {/* Main Grid: Left 2/3 Real Players Table, Right 1/3 Real-Time Live Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Real Players Leaderboard Table */}
          <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold text-white font-mono">
                  ECHTE SPIELER-RANGLISTE ({displayedEntries.length})
                </span>
              </div>

              {/* Interactive Filter Controls */}
              <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    filterMode === 'all'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Alle ({entries.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('clan')}
                  className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    filterMode === 'clan'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Clan [{clanTag || '61267'}]
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('wins')}
                  className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    filterMode === 'wins'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Siege
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('kills')}
                  className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    filterMode === 'kills'
                      ? 'bg-amber-500 text-slate-950 font-bold'
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
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                    <th className="py-2.5 px-3">RANG</th>
                    <th className="py-2.5 px-3">SPIELER & CLAN</th>
                    <th className="py-2.5 px-3">WAFFE & MAPS</th>
                    <th className="py-2.5 px-3 text-right">SIEGE</th>
                    <th className="py-2.5 px-3 text-right">KILLS</th>
                    <th className="py-2.5 px-3 text-right">PUNKTE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {displayedEntries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Noch keine Spieler in diesem Filter. Spiele eine Runde oder lade Freunde mit dem Clan-Tag [{clanTag || '61267'}] ein!
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
                            isMe ? 'bg-amber-500/10 hover:bg-amber-500/15' : 'hover:bg-slate-800/30'
                          }`}
                        >
                          <td className="py-3 px-3 font-bold tabular-nums">
                            {displayRank === 1 ? (
                              <span className="text-amber-400">#1</span>
                            ) : displayRank === 2 ? (
                              <span className="text-slate-200">#2</span>
                            ) : displayRank === 3 ? (
                              <span className="text-amber-600">#3</span>
                            ) : (
                              <span className="text-slate-500">#{displayRank}</span>
                            )}
                          </td>

                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5 font-bold text-white">
                              {entry.clanTag && (
                                <span className="text-amber-400">[{entry.clanTag}]</span>
                              )}
                              <span>{entry.name}</span>
                              {isMe && (
                                <span className="text-[10px] text-emerald-400 font-normal">
                                  · Du
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
                                  <span className="text-emerald-400">Live Online</span>
                                </>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <div className="text-slate-200 truncate max-w-[180px]">
                              {entry.signatureWeapon || 'XM4 Bembel-Sturmgewehr'}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {entry.unlockedMapsCount || 1}/7 Maps · Max Welle {entry.highestWave || 1}
                            </div>
                          </td>

                          <td className="py-3 px-3 text-right text-emerald-400 font-bold tabular-nums">
                            {entry.wins || 0}
                          </td>

                          <td className="py-3 px-3 text-right text-red-400 font-bold tabular-nums">
                            {entry.kills || 0}
                          </td>

                          <td className="py-3 px-3 text-right text-amber-400 font-bold tabular-nums">
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

          {/* Right Column: Live Activity Feed & Friend Squad Info */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                  LIVE-AKTIVITÄTS-TICKER
                </span>
                <span className="text-[11px] font-mono text-slate-500">Echtzeit-Feed</span>
              </div>

              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {recentEvents.length === 0 ? (
                  <div className="text-xs text-slate-500 font-mono py-6 text-center">
                    Noch keine Live-Ereignisse aufgezeichnet. Starte eine Runde, um den Ticker zu füllen!
                  </div>
                ) : (
                  recentEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="font-bold text-white">
                          {ev.clanTag ? `[${ev.clanTag}] ` : ''}
                          {ev.playerName}
                        </span>
                        <span className="text-slate-500 tabular-nums">
                          {new Date(ev.timestamp).toLocaleTimeString('de-DE', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">{ev.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
              <div className="font-mono font-bold text-slate-200 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>Mit Freunden zusammenspielen:</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Teile den App-Link mit deinen Freunden. Sobald sie ihren Benutzernamen und denselben Clan-Tag ([{clanTag || '61267'}]) eingeben, seht ihr eure Ergebnisse sofort hier im Live-Ranking!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
