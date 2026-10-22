import React, { useState } from 'react';
import {
  Target,
  Coins,
  Award,
  Wrench,
  Building2,
  Trophy,
  Users,
  CheckCircle2,
  ChevronRight,
  Radio,
  Play,
  Monitor,
  MapPin,
  Lock,
  Zap,
  Smartphone,
  Flame,
} from 'lucide-react';
import { DailyMissionsState, getReputationRank } from '../game/missions';
import { ARENAS, checkArenaUnlocked } from '../game/three/arenas';
import { soundFx } from '../audio/soundFx';

export interface MobileTacticalHubProps {
  budget: number;
  reputation: number;
  skillPoints?: number;
  playerName: string;
  clanTag: string;
  totalIncomePerSec: number;
  totalWins: number;
  unlockedMaps: string[];
  dailyMissionsState: DailyMissionsState;
  isMobileHardware?: boolean;
  isLandscape?: boolean;
  onOpenDailyMissions: () => void;
  onClaimDailyMission: (missionId: string) => void;
  onNavigateTab: (tab: 'gunsmith' | 'skilltree' | 'tycoon' | 'leaderboard' | 'multiplayer') => void;
  onSwitchToPcMode: () => void;
  onSimulatePatrol: (arenaId: string) => void;
  onLaunch3DMobileCombat?: (arenaId?: string) => void;
}

export const MobileTacticalHub: React.FC<MobileTacticalHubProps> = ({
  budget,
  reputation,
  skillPoints = 0,
  playerName,
  clanTag,
  totalIncomePerSec,
  totalWins,
  unlockedMaps,
  dailyMissionsState,
  isMobileHardware = true,
  isLandscape = false,
  onOpenDailyMissions,
  onClaimDailyMission,
  onNavigateTab,
  onSwitchToPcMode,
  onSimulatePatrol,
  onLaunch3DMobileCombat,
}) => {
  const currentRank = getReputationRank(reputation);
  const [patrolFeedback, setPatrolFeedback] = useState<string | null>(null);
  const [activePatrolArena, setActivePatrolArena] = useState<string | null>(null);

  const handleStartPatrol = (arenaId: string, arenaName: string) => {
    if (activePatrolArena) return;
    setActivePatrolArena(arenaId);
    soundFx.playShoot();

    setTimeout(() => {
      soundFx.playKill();
      soundFx.playCoin();
      onSimulatePatrol(arenaId);
      setPatrolFeedback(`Einsatzbericht: Streife im ${arenaName} hat Wehrheimer Späher neutralisiert!`);
      setActivePatrolArena(null);

      setTimeout(() => setPatrolFeedback(null), 4000);
    }, 900);
  };

  const completedMissionsCount = dailyMissionsState.missions.filter((m) => m.completed).length;

  return (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 space-y-6 pb-28 text-slate-100 animate-in fade-in duration-150">
      {/* Mobile Landscape & 3D Lock Notice */}
      {isLandscape && (
        <div className="p-4 rounded-2xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs flex items-start gap-3 shadow-[0_8px_30px_rgba(239,68,68,0.2)] backdrop-blur-md">
          <div className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4 text-red-400" />
          </div>
          <div className="space-y-1">
            <span className="font-mono font-bold text-red-300 uppercase block tracking-wider text-xs">
              Handy-Querformat erkannt · 3D Battle Royale gesperrt
            </span>
            <p className="text-[11px] text-red-200/90 leading-relaxed">
              Das 3D Battle Royale ist auf dem Handy komplett deaktiviert (weder im Hochformat noch im Querformat spielbar). Hier in der Taktischen Zentrale kannst du Streifen entsenden, Waffen leveln, deinen Skilltree ausbauen und Maps upgraden!
            </p>
          </div>
        </div>
      )}

      {/* 1. Header Card: Operator & Budget Overview */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.6)] backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-mono font-black text-xs shrink-0 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
              [{clanTag || '61267'}]
            </div>
            <div className="truncate">
              <div className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
                OPERATOR-ZENTRALE
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white leading-tight truncate">
                {playerName}
              </h2>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] font-mono text-slate-400 uppercase block tracking-wider">
              Stadtkasse
            </span>
            <span className="text-base sm:text-lg font-mono font-black text-amber-400 tabular-nums text-glow-amber">
              {budget.toLocaleString('de-DE')} NAT
            </span>
          </div>
        </div>

        {/* Reputation & Passive Income Row */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-3 border-t border-white/10 text-xs font-mono">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-white/10 flex items-center gap-2.5 shadow-inner">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
              <Award className="w-4 h-4 text-purple-400" />
            </div>
            <div className="truncate">
              <span className="text-[10px] text-slate-400 block font-sans">Rang {currentRank.rank}</span>
              <span className="text-purple-300 font-bold truncate block">{currentRank.title}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-white/10 flex items-center gap-2.5 shadow-inner">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Coins className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="truncate">
              <span className="text-[10px] text-slate-400 block font-sans">Passives Einkommen</span>
              <span className="text-emerald-400 font-bold tabular-nums">+{totalIncomePerSec} NAT/s</span>
            </div>
          </div>
        </div>

        {onLaunch3DMobileCombat && (
          <button
            type="button"
            onClick={() => onLaunch3DMobileCombat()}
            className="w-full py-3.5 px-4 min-h-[44px] rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2 cursor-pointer transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
          >
            <Flame className="w-4 h-4 fill-slate-950" />
            <span>Zurück in den 3D Touch-Shooter (Battle Royale)</span>
          </button>
        )}
      </div>

      {/* 2. Daily Missions Card (Tagesbefehle) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-amber-500/30 shadow-[0_8px_30px_rgba(0,0,0,0.6),0_0_25px_rgba(245,158,11,0.08)] backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Target className="w-4 h-4 text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Heutige Tagesbefehle
              </h3>
              <p className="text-[11px] text-slate-400">Tägliche Aufträge für NAT & Operator-Ruf</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenDailyMissions}
            className="px-3 py-1.5 min-h-[44px] rounded-lg text-xs font-mono text-amber-400 font-bold hover:bg-amber-500/10 transition-colors cursor-pointer flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
          >
            <span className="tabular-nums">{completedMissionsCount}/{dailyMissionsState.missions.length} Fertig</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Missions preview list */}
        {dailyMissionsState.missions.length === 0 ? (
          <div className="p-6 rounded-xl bg-slate-950/50 border border-white/5 text-center space-y-2">
            <Target className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-xs font-mono font-bold text-slate-400">Keine aktiven Tagesbefehle</div>
            <p className="text-[11px] text-slate-500">Morgen um 00:00 Uhr stehen neue Aufträge bereit.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {dailyMissionsState.missions.map((mission) => {
              const percent = Math.min(100, Math.round((mission.currentProgress / mission.targetCount) * 100));
              return (
                <div
                  key={mission.id}
                  className={`p-3.5 rounded-xl border transition-all duration-150 ${
                    mission.claimed
                      ? 'bg-slate-950/40 border-white/5 opacity-70'
                      : mission.completed
                      ? 'bg-amber-500/10 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                      : 'bg-slate-950/60 border-white/10 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {mission.badge}
                        </span>
                        <span className="text-xs font-bold text-white truncate block">
                          {mission.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        {mission.description}
                      </p>
                    </div>

                    {/* Glowing reward tags */}
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.15)] tabular-nums">
                        +{mission.rewardNAT} NAT
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-purple-500/15 border border-purple-500/30 text-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.15)] tabular-nums">
                        +{mission.rewardReputation} RUF
                      </span>
                    </div>
                  </div>

                  {/* Progress bar & Claim button */}
                  <div className="mt-3 flex items-center justify-between gap-3 pt-2 border-t border-white/5">
                    <div className="flex-1 space-y-1.5">
                      <div className="flex justify-between text-[10px] font-mono text-slate-400">
                        <span>Fortschritt</span>
                        <span className="text-white font-bold tabular-nums">
                          {mission.currentProgress} / {mission.targetCount}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-950 border border-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            mission.completed
                              ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                              : 'bg-gradient-to-r from-amber-500 to-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    {mission.completed && !mission.claimed ? (
                      <button
                        type="button"
                        onClick={() => onClaimDailyMission(mission.id)}
                        className="px-3.5 py-2 min-h-[44px] min-w-[90px] rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs uppercase shadow-[0_0_12px_rgba(245,158,11,0.4)] transition-all duration-150 active:scale-[0.98] cursor-pointer shrink-0 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
                      >
                        Einfordern
                      </button>
                    ) : mission.claimed ? (
                      <span className="min-h-[44px] flex items-center text-[11px] font-mono text-emerald-400 font-bold gap-1.5 shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Eingelöst</span>
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Patrol Feedback Alert Banner */}
      {patrolFeedback && (
        <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold flex items-center gap-2.5 shadow-[0_0_16px_rgba(245,158,11,0.2)] animate-in slide-in-from-top-2 duration-200">
          <Radio className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
          <span>{patrolFeedback}</span>
        </div>
      )}

      {/* 4. Tactical Area Defense & Patrols (2D Operations) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.6)] backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Radio className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Einsatzgebiete & Streifen
              </h3>
              <p className="text-[11px] text-slate-400">Automatische 2D-Gefechte & Schutz der Stadtgrenzen</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 font-bold tabular-nums">
            {unlockedMaps.length} von 7 aktiv
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Entsende Bürgerwehr-Patrouillen, um Wehrheimer Späher abzuwehren, Waffen-XP & Beute zu sichern und deine Tagesbefehle zu erfüllen:
        </p>

        <div className="grid grid-cols-1 gap-2.5">
          {Object.values(ARENAS).map((arena) => {
            const isUnlocked = checkArenaUnlocked(arena.id, totalWins, unlockedMaps);
            const isPatrolling = activePatrolArena === arena.id;

            return (
              <div
                key={arena.id}
                className={`p-3 sm:p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all duration-150 ${
                  isUnlocked
                    ? 'bg-slate-950/60 border-white/10 hover:border-white/20'
                    : 'bg-slate-950/30 border-white/5 opacity-55'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      isUnlocked
                        ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
                        : 'bg-slate-900 border border-white/5 text-slate-500'
                    }`}
                  >
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <span className="text-xs font-bold text-white truncate block">
                      {arena.name}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate block font-mono">
                      {arena.subtitle}
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  {isUnlocked ? (
                    <button
                      type="button"
                      disabled={Boolean(activePatrolArena)}
                      onClick={() => handleStartPatrol(arena.id, arena.name)}
                      className={`px-3.5 py-2 min-h-[44px] min-w-[110px] rounded-xl text-xs font-mono font-bold transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 ${
                        isPatrolling
                          ? 'bg-amber-500 text-slate-950 font-black animate-pulse shadow-[0_0_14px_rgba(245,158,11,0.5)]'
                          : 'bg-slate-800 hover:bg-slate-700/90 text-slate-100 border border-white/10 hover:border-white/20 shadow-md active:scale-[0.98]'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                      <span>{isPatrolling ? 'Im Einsatz...' : 'Patrouille'}</span>
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 px-3 py-2 text-[10px] font-mono text-slate-500 min-h-[44px]">
                      <Lock className="w-3.5 h-3.5 text-slate-600" />
                      <span>Gesperrt</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Mobile Fast Navigation Grid (Skilltree, Gunsmith, Tycoon, Leaderboard, Lobby) */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onNavigateTab('skilltree')}
          className="col-span-2 p-4 sm:p-5 min-h-[72px] rounded-2xl bg-gradient-to-r from-amber-500/15 via-slate-900/90 to-cyan-500/15 border border-amber-500/30 hover:border-amber-400/60 transition-all duration-150 active:scale-[0.98] text-left flex items-center justify-between gap-3 cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-white">Operator-Skilltree</span>
                {skillPoints > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-mono text-[10px] font-black shadow-[0_0_8px_rgba(245,158,11,0.7)] animate-glow-pulse-amber">
                    {skillPoints} SP verfügbar
                  </span>
                )}
              </div>
              <span className="text-[10px] sm:text-[11px] text-slate-300 block font-mono mt-0.5">
                Bembel-Wucht, Taunus-Panzerung & Feldberg-Taktik skillen
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-400 shrink-0" />
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('gunsmith')}
          className="p-4 min-h-[100px] rounded-2xl bg-slate-900/80 border border-white/10 hover:border-amber-500/40 hover:bg-slate-900 transition-all duration-150 active:scale-[0.98] text-left space-y-2 cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.15)]">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Waffenschmiede & Level</span>
            <span className="text-[10px] text-slate-400 block font-mono leading-tight mt-0.5">
              Waffen-Level 1–30, Tarnungen & Aufsätze
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('tycoon')}
          className="p-4 min-h-[100px] rounded-2xl bg-slate-900/80 border border-white/10 hover:border-emerald-500/40 hover:bg-slate-900 transition-all duration-150 active:scale-[0.98] text-left space-y-2 cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Maps & Stadt-Level</span>
            <span className="text-[10px] text-slate-400 block font-mono leading-tight mt-0.5">
              Maps leveln (Stärkere Bots & Beute)
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('leaderboard')}
          className="p-4 min-h-[100px] rounded-2xl bg-slate-900/80 border border-white/10 hover:border-sky-500/40 hover:bg-slate-900 transition-all duration-150 active:scale-[0.98] text-left space-y-2 cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50"
        >
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-[0_0_10px_rgba(14,165,233,0.15)]">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Live-Leaderboard</span>
            <span className="text-[10px] text-slate-400 block font-mono leading-tight mt-0.5">
              Echte Spieler & Derby-Punkte
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('multiplayer')}
          className="p-4 min-h-[100px] rounded-2xl bg-slate-900/80 border border-white/10 hover:border-purple-500/40 hover:bg-slate-900 transition-all duration-150 active:scale-[0.98] text-left space-y-2 cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50"
        >
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.15)]">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Freunde-Lobby</span>
            <span className="text-[10px] text-slate-400 block font-mono leading-tight mt-0.5">
              Squad-Codes & Mitspieler
            </span>
          </div>
        </button>
      </div>

      {/* 6. Mobile 3D Battle Royale Restriction Notice (or PC Return Button on Desktop) */}
      {isMobileHardware ? (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-red-500/30 flex items-center justify-between gap-3 shadow-[0_4px_20px_rgba(239,68,68,0.1)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-red-300 block">
                3D Battle Royale auf dem Handy gesperrt
              </span>
              <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                Auf Smartphones weder im Hochformat noch im Querformat spielbar · Bitte am PC öffnen
              </span>
            </div>
          </div>

          <span className="px-2.5 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-[10px] font-mono font-bold uppercase shrink-0 flex items-center gap-1">
            <Lock className="w-3.5 h-3.5" />
            <span>Nur PC</span>
          </span>
        </div>
      ) : (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-white/10 flex items-center justify-between gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Monitor className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Zurück zum 3D Battle Royale (PC)</span>
              <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                Desktop-Modus mit Maus & Tastatur wieder öffnen
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onSwitchToPcMode}
            className="px-4 py-2 min-h-[44px] rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-mono font-bold transition-all duration-150 active:scale-[0.98] cursor-pointer shrink-0 shadow-[0_0_12px_rgba(245,158,11,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 flex items-center justify-center"
          >
            3D Starten
          </button>
        </div>
      )}
    </div>
  );
};
