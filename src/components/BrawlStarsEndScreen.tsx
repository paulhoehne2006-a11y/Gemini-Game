import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Award,
  Zap,
  Skull,
  Shield,
  Heart,
  ArrowRight,
  RotateCcw,
  Wrench,
  Home,
  Flame,
  Star,
  Sparkles,
  ChevronRight,
  BarChart3,
  Users,
} from 'lucide-react';
import { soundFx } from '../audio/soundFx';

export interface MatchParticipantStats {
  id: string;
  name: string;
  role: string;
  faction: 'neu-anspach' | 'wehrheim';
  isPlayer: boolean;
  isBot: boolean;
  isBoss?: boolean;
  kills: number;
  damageDealt: number;
  damageTaken: number;
  deaths: number;
  isStarPlayer?: boolean;
}

export interface DetailedMatchStats {
  kills: number;
  score: number;
  wave: number;
  maxWave: number;
  victory: boolean;
  durationSeconds: number;
  playerStats: MatchParticipantStats;
  alliesStats: MatchParticipantStats[];
  enemiesStats: MatchParticipantStats[];
  totalDamageDealt: number;
  totalDamageTaken: number;
  starPlayerId: string;
}

interface BrawlStarsEndScreenProps {
  victory: boolean;
  stats: DetailedMatchStats;
  matchReward: number;
  playerName: string;
  clanTag: string;
  currentArenaName: string;
  onPlayAgain: () => void;
  onExitToMenu?: () => void;
}

export const BrawlStarsEndScreen: React.FC<BrawlStarsEndScreenProps> = ({
  victory,
  stats,
  matchReward,
  playerName,
  clanTag,
  currentArenaName,
  onPlayAgain,
  onExitToMenu,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'damage'>('overview');
  const [animatedTrophies, setAnimatedTrophies] = useState(0);
  const [showContent, setShowContent] = useState(false);

  // Trophy gain / loss based on victory and wave performance
  const trophyDelta = victory ? Math.max(8, stats.wave * 2) : Math.max(-4, stats.wave - 5);
  const earnedNAT = matchReward || (victory ? 75 : 25) + stats.kills * 12;
  const earnedXP = stats.score > 0 ? Math.round(stats.score * 0.15) : (victory ? 240 : 90);

  useEffect(() => {
    // Play celebratory or defeat audio
    if (victory) {
      soundFx.playVictory();
    } else {
      soundFx.playDefeat();
    }

    const t1 = setTimeout(() => setShowContent(true), 150);
    const t2 = setTimeout(() => setAnimatedTrophies(trophyDelta), 600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [victory, trophyDelta]);

  // Combine all participants for overall MVP & maximum damage calculation
  const allParticipants = [stats.playerStats, ...stats.alliesStats, ...stats.enemiesStats];
  const maxDamageInMatch = Math.max(1, ...allParticipants.map((p) => p.damageDealt));
  const maxKillsInMatch = Math.max(1, ...allParticipants.map((p) => p.kills));

  // Find Star Player (MVP)
  const starPlayer =
    allParticipants.find((p) => p.id === stats.starPlayerId) ||
    allParticipants.reduce((best, cur) => (cur.damageDealt > best.damageDealt ? cur : best), stats.playerStats);

  const isLocalPlayerStar = starPlayer.isPlayer;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/92 backdrop-blur-xl overflow-y-auto cursor-default animate-in fade-in duration-300"
    >
      <div className="relative w-full max-w-4xl my-auto rounded-[2.5rem] bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-4 border-amber-500/80 shadow-[0_0_60px_rgba(245,158,11,0.35)] overflow-hidden flex flex-col pointer-events-auto">
        {/* Animated Background Rays / Glow */}
        <div
          className={`absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-72 rounded-full blur-3xl pointer-events-none opacity-40 ${
            victory ? 'bg-amber-400' : 'bg-red-600'
          }`}
        />

        {/* TOP STATUS BANNER (Brawl Stars Style Angled Badge) */}
        <div className="relative pt-6 pb-4 px-6 text-center">
          <div className="inline-block relative">
            <div
              className={`px-8 sm:px-14 py-2.5 sm:py-3.5 rounded-2xl font-black text-2xl sm:text-4xl uppercase tracking-wider transform -skew-x-6 shadow-2xl border-4 ${
                victory
                  ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 border-white shadow-amber-500/50'
                  : 'bg-gradient-to-r from-red-600 via-rose-500 to-red-700 text-white border-red-300 shadow-red-600/50'
              }`}
            >
              <div className="flex items-center justify-center gap-3 transform skew-x-6">
                <Star className={`w-7 h-7 sm:w-9 sm:h-9 fill-current ${victory ? 'text-slate-950' : 'text-yellow-300'} animate-spin`} style={{ animationDuration: '8s' }} />
                <span>{victory ? 'SIEG! (VICTORY)' : 'NIEDERLAGE (DEFEAT)'}</span>
                <Star className={`w-7 h-7 sm:w-9 sm:h-9 fill-current ${victory ? 'text-slate-950' : 'text-yellow-300'} animate-spin`} style={{ animationDuration: '8s' }} />
              </div>
            </div>
          </div>

          <div className="mt-2 text-xs sm:text-sm font-mono font-bold text-slate-300">
            EINSATZ: <span className="text-amber-400 font-black">{currentArenaName}</span> · WELLE {stats.wave}/{stats.maxWave}
          </div>
        </div>

        {/* STAR PLAYER (MVP) SPOTLIGHT */}
        <div className="px-4 sm:px-8 py-2">
          <div
            className={`relative rounded-3xl p-4 sm:p-5 border-2 transition-all ${
              isLocalPlayerStar
                ? 'bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.25)]'
                : 'bg-slate-950/70 border-slate-700'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 text-center sm:text-left">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-lg flex items-center justify-center text-slate-950 font-black text-2xl">
                    {isLocalPlayerStar ? '👑' : '⭐'}
                  </div>
                  <span className="absolute -bottom-2 -right-2 px-1.5 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[10px] font-black uppercase font-mono shadow">
                    MVP
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <span className="text-[11px] font-mono font-black text-amber-400 uppercase tracking-widest flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      STAR-SPIELER DES MATCHES
                    </span>
                  </div>
                  <div className="text-lg sm:text-xl font-black text-white">
                    {starPlayer.isPlayer ? `[${clanTag}] ${playerName} (DU)` : starPlayer.name}
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    Rolle: {starPlayer.role} · Team {starPlayer.faction === 'neu-anspach' ? 'Neu-Anspach' : 'Wehrheim'}
                  </div>
                </div>
              </div>

              {/* Star Player Stats Highlights */}
              <div className="flex items-center gap-4 sm:gap-6 bg-slate-950/80 px-5 py-2.5 rounded-2xl border border-white/10 font-mono text-center">
                <div>
                  <div className="text-[10px] uppercase font-bold text-amber-400">SCHADEN</div>
                  <div className="text-lg sm:text-xl font-black text-white tabular-nums">
                    {starPlayer.damageDealt.toLocaleString()}
                  </div>
                </div>
                <div className="w-[1px] h-7 bg-slate-800" />
                <div>
                  <div className="text-[10px] uppercase font-bold text-red-400">KILLS</div>
                  <div className="text-lg sm:text-xl font-black text-white tabular-nums">
                    {starPlayer.kills}
                  </div>
                </div>
                <div className="w-[1px] h-7 bg-slate-800" />
                <div>
                  <div className="text-[10px] uppercase font-bold text-cyan-400">ERLITTEN</div>
                  <div className="text-lg sm:text-xl font-black text-white tabular-nums">
                    {starPlayer.damageTaken.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TAB TOGGLE: ÜBERSICHT vs SCHADEN-DETAILS */}
        <div className="px-4 sm:px-8 pt-3 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-1.5 px-4 py-2 font-black text-xs uppercase tracking-wider rounded-t-xl transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-slate-800 text-amber-400 border-t-2 border-x-2 border-amber-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Belohnungen & Rang</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('damage')}
              className={`flex items-center gap-1.5 px-4 py-2 font-black text-xs uppercase tracking-wider rounded-t-xl transition-all cursor-pointer ${
                activeTab === 'damage'
                  ? 'bg-slate-800 text-amber-400 border-t-2 border-x-2 border-amber-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Schadens-Statistiken (Alle Spieler & Bots)</span>
            </button>
          </div>
        </div>

        {/* TAB CONTENT */}
        <div className="px-4 sm:px-8 py-4 flex-1">
          {activeTab === 'overview' ? (
            <div className="space-y-4">
              {/* Brawl Stars Trophy Road & Rewards Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. TROPHIES / RANK POINTS */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] font-mono font-bold uppercase text-slate-400">
                      Trophäen / Rangpunkte
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-2xl font-black font-mono tabular-nums ${
                          trophyDelta >= 0 ? 'text-amber-400' : 'text-red-400'
                        }`}
                      >
                        {animatedTrophies >= 0 ? `+${animatedTrophies}` : animatedTrophies} 🏆
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        {victory ? 'Rangaufstieg' : 'Trostpunkte'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. NAT TALER / BATTLE COINS */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-yellow-500/20 border border-yellow-400/40 flex items-center justify-center text-yellow-400 shrink-0">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] font-mono font-bold uppercase text-slate-400">
                      Erbeutete NAT-Münzen
                    </div>
                    <div className="text-2xl font-black font-mono text-yellow-300 tabular-nums">
                      +{earnedNAT} NAT
                    </div>
                  </div>
                </div>

                {/* 3. XP / REPUTATION */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-400 shrink-0">
                    <Award className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] font-mono font-bold uppercase text-slate-400">
                      Erfahrung & Ruf
                    </div>
                    <div className="text-2xl font-black font-mono text-purple-300 tabular-nums">
                      +{earnedXP} XP
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Summary of Team vs Wehrheim */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Team Neu-Anspach Summary */}
                <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      TEAM NEU-ANSPACH (VERTEIDIGER)
                    </span>
                    <span className="text-xs font-mono font-black text-emerald-300">
                      {stats.playerStats.kills + stats.alliesStats.reduce((s, a) => s + a.kills, 0)} Kills
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-200">
                    Gesamtschaden Team: <span className="text-emerald-400 font-mono font-black">{(stats.playerStats.damageDealt + stats.alliesStats.reduce((s, a) => s + a.damageDealt, 0)).toLocaleString()}</span>
                  </div>
                </div>

                {/* Team Wehrheim Summary */}
                <div className="p-4 rounded-2xl bg-red-950/30 border border-red-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-black text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Skull className="w-4 h-4" />
                      TEAM WEHRHEIM (ANGREIFER-BOTS)
                    </span>
                    <span className="text-xs font-mono font-black text-red-300">
                      {stats.enemiesStats.reduce((s, e) => s + e.kills, 0)} Kills
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-200">
                    Gesamtschaden Bots: <span className="text-red-400 font-mono font-black">{stats.enemiesStats.reduce((s, e) => s + e.damageDealt, 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* DETAILED DAMAGE BREAKDOWN (Brawl Stars Match Results Screen for All Players & Bots) */
            <div className="space-y-5 max-h-[360px] overflow-y-auto pr-1">
              {/* TEAM NEU-ANSPACH (Blue / Cyan Team) */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono font-black text-sky-400 uppercase mb-2 px-1">
                  <span>🛡️ TEAM NEU-ANSPACH (SPIELER & VERSTÄRKUNG)</span>
                  <span>SCHADEN / KILLS</span>
                </div>
                <div className="space-y-2">
                  {[stats.playerStats, ...stats.alliesStats].map((participant) => {
                    const dmgRatio = Math.min(100, (participant.damageDealt / maxDamageInMatch) * 100);
                    return (
                      <div
                        key={participant.id}
                        className={`p-3 rounded-2xl border transition-all ${
                          participant.isPlayer
                            ? 'bg-sky-950/60 border-sky-400/80 shadow-md ring-1 ring-sky-400/40'
                            : 'bg-slate-950/80 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <div className="flex items-center gap-2">
                            {participant.isStarPlayer && <span title="Star-Spieler (MVP)">👑</span>}
                            <span className="font-bold text-white">
                              {participant.isPlayer ? `[${clanTag}] ${playerName} (DU)` : participant.name}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                              {participant.isPlayer ? 'Spieler' : 'Bot-Kollege'} · {participant.role}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 font-mono font-bold">
                            <span className="text-amber-400 tabular-nums">
                              💥 {participant.damageDealt.toLocaleString()} Schaden
                            </span>
                            <span className="text-red-400 tabular-nums">
                              ☠️ {participant.kills} Kills
                            </span>
                            <span className="text-slate-400 tabular-nums text-[11px]">
                              🛡️ {participant.damageTaken.toLocaleString()} erlitten
                            </span>
                          </div>
                        </div>

                        {/* Damage Bar representation */}
                        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
                            style={{ width: `${dmgRatio}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* TEAM WEHRHEIM (Red / Enemy Bots) */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono font-black text-red-400 uppercase mb-2 px-1">
                  <span>⚔️ TEAM WEHRHEIM (APFELDORF-BOTS)</span>
                  <span>SCHADEN / KILLS</span>
                </div>
                <div className="space-y-2">
                  {stats.enemiesStats.map((enemy) => {
                    const dmgRatio = Math.min(100, (enemy.damageDealt / maxDamageInMatch) * 100);
                    return (
                      <div
                        key={enemy.id}
                        className="p-3 rounded-2xl bg-slate-950/80 border border-red-950/60"
                      >
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <div className="flex items-center gap-2">
                            {enemy.isStarPlayer && <span title="Star-Spieler (MVP)">👑</span>}
                            <span className="font-bold text-red-300">{enemy.name}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950/60 text-red-300 border border-red-800/40">
                              {enemy.isBoss ? 'END-BOSS' : 'BOT'} · {enemy.role}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 font-mono font-bold">
                            <span className="text-amber-400 tabular-nums">
                              💥 {enemy.damageDealt.toLocaleString()} Schaden
                            </span>
                            <span className="text-red-400 tabular-nums">
                              ☠️ {enemy.kills} Kills
                            </span>
                            <span className="text-slate-400 tabular-nums text-[11px]">
                              🛡️ {enemy.damageTaken.toLocaleString()} erlitten
                            </span>
                          </div>
                        </div>

                        {/* Damage Bar */}
                        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-red-600 to-rose-400 rounded-full transition-all duration-500"
                            style={{ width: `${dmgRatio}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM ACTION BUTTONS (Brawl Stars Style Juicy Buttons) */}
        <div className="p-4 sm:p-6 bg-slate-950/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {onExitToMenu && (
              <button
                type="button"
                onClick={onExitToMenu}
                className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer border border-slate-700 shadow-md"
              >
                <Home className="w-4 h-4 text-amber-400" />
                <span>Hauptmenü</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onPlayAgain}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 active:scale-95 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-amber-500/25 transition-transform cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 stroke-[3]" />
            <span>Nochmal spielen (Play Again)</span>
            <ChevronRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      </div>
    </div>
  );
};
