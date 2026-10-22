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
  MapPin,
  Lock,
  Zap,
  Flame,
  ArrowLeft,
  Sparkles,
  Shield,
  Activity,
} from 'lucide-react';
import { DailyMissionsState, getReputationRank } from '../game/missions';
import { ARENAS, checkArenaUnlocked, getMapBotScaling } from '../game/three/arenas';
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
  onNavigateTab: (tab: any) => void;
  onSwitchToPcMode?: () => void;
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
  onOpenDailyMissions,
  onClaimDailyMission,
  onNavigateTab,
  onSimulatePatrol,
}) => {
  const currentRank = getReputationRank(reputation);
  const [patrolFeedback, setPatrolFeedback] = useState<{
    arenaName: string;
    text: string;
    rewardNAT: number;
    rewardRep: number;
  } | null>(null);
  const [activePatrolArena, setActivePatrolArena] = useState<string | null>(null);

  const handleStartPatrol = (arenaId: string, arenaName: string) => {
    if (activePatrolArena) return;
    setActivePatrolArena(arenaId);
    soundFx.playShoot();

    setTimeout(() => {
      soundFx.playKill();
      soundFx.playCoin();
      onSimulatePatrol(arenaId);

      const bonusNAT = Math.floor(Math.random() * 80) + 90;
      const bonusRep = Math.floor(Math.random() * 20) + 15;

      setPatrolFeedback({
        arenaName,
        text: `Wehrheimer Späher im ${arenaName} erfolgreich abgewehrt!`,
        rewardNAT: bonusNAT,
        rewardRep: bonusRep,
      });
      setActivePatrolArena(null);

      setTimeout(() => setPatrolFeedback(null), 4500);
    }, 850);
  };

  const completedMissionsCount = dailyMissionsState.missions.filter((m) => m.completed).length;

  return (
    <div className="w-full p-4 space-y-4 pb-24 text-slate-100 select-none animate-in fade-in duration-150">
      {/* Top Header & Breadcrumb */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-black block">
            EINSATZLEITUNG 61267
          </span>
          <h1 className="text-xl font-black text-white tracking-tight">
            Taktische Zentrale
          </h1>
        </div>

        <button
          type="button"
          onClick={() => {
            soundFx.playUiClick();
            onNavigateTab('home');
          }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 hover:border-amber-500/30 text-xs font-mono text-slate-300 hover:text-white transition-all active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
          <span>Zentrale</span>
        </button>
      </div>

      {/* 1. Tactical Combat Telemetry Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-amber-950/20 border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.6)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Target className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase">
                BÜRGERWEHR-STATUS
              </div>
              <div className="text-sm font-bold text-white leading-tight">
                [{clanTag || '61267'}] {playerName}
              </div>
            </div>
          </div>

          <div className="text-right font-mono">
            <span className="text-[10px] text-slate-400 block uppercase">Stadtkasse</span>
            <span className="text-sm font-black text-amber-400 tabular-nums">
              {budget.toLocaleString('de-DE')} NAT
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5 flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-400 shrink-0" />
            <div className="truncate">
              <span className="text-[9px] text-slate-400 block">Rang {currentRank.rank}</span>
              <span className="text-purple-300 font-bold truncate block">{currentRank.title}</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5 flex items-center gap-2">
            <Coins className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="truncate">
              <span className="text-[9px] text-slate-400 block">Einkommen</span>
              <span className="text-emerald-400 font-bold tabular-nums">+{totalIncomePerSec} NAT/s</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Real-time Patrol Combat Feedback Banner */}
      {patrolFeedback && (
        <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.25)] space-y-1.5 animate-in slide-in-from-top-3 duration-200">
          <div className="flex items-center gap-2 text-amber-300 text-xs font-mono font-bold">
            <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>EINSATZBERICHT: {patrolFeedback.arenaName}</span>
          </div>
          <p className="text-xs text-white font-medium">
            {patrolFeedback.text}
          </p>
          <div className="flex items-center gap-2 font-mono text-[10px] font-bold">
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
              +{patrolFeedback.rewardNAT} NAT Beute
            </span>
            <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
              +{patrolFeedback.rewardRep} Ruf
            </span>
          </div>
        </div>
      )}

      {/* 3. Daily Missions Preview in Combat Center */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Aktive Tagesbefehle
            </h2>
          </div>
          <button
            type="button"
            onClick={onOpenDailyMissions}
            className="text-[11px] font-mono text-amber-400 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>{completedMissionsCount}/{dailyMissionsState.missions.length} Fertig</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          {dailyMissionsState.missions.slice(0, 2).map((mission) => {
            const percent = Math.min(100, Math.round((mission.currentProgress / mission.targetCount) * 100));
            return (
              <div
                key={mission.id}
                className={`p-2.5 rounded-xl border ${
                  mission.claimed
                    ? 'bg-slate-950/40 border-white/5 opacity-60'
                    : mission.completed
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-slate-950/60 border-white/10'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-bold text-white truncate">
                    {mission.title}
                  </span>
                  <span className="text-[10px] font-mono text-amber-400 font-bold shrink-0">
                    +{mission.rewardNAT} NAT
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden flex-1">
                    <div
                      className={`h-full ${mission.completed ? 'bg-emerald-400' : 'bg-amber-400'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  {mission.completed && !mission.claimed ? (
                    <button
                      type="button"
                      onClick={() => {
                        soundFx.playRewardClaim();
                        onClaimDailyMission(mission.id);
                      }}
                      className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-mono text-[9px] font-black uppercase"
                    >
                      Einlösen
                    </button>
                  ) : (
                    <span className="text-[9px] font-mono text-slate-400">
                      {mission.currentProgress}/{mission.targetCount}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Einsatzgebiete & Streifen (Interactive Arena Patrol Dispatch) */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Einsatzgebiete & Streifen
            </h2>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 font-bold">
            {unlockedMaps.length}/7 Aktiv
          </span>
        </div>

        <p className="text-[11px] text-slate-300 leading-snug">
          Tippe auf ein Einsatzgebiet, um eine Bürgerwehr-Streife zu entsenden und Wehrheimer Späher abzuwehren:
        </p>

        <div className="space-y-2">
          {Object.values(ARENAS).map((arena) => {
            const isUnlocked = checkArenaUnlocked(arena.id, totalWins, unlockedMaps);
            const isPatrolling = activePatrolArena === arena.id;

            return (
              <div
                key={arena.id}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all duration-150 ${
                  isUnlocked
                    ? 'bg-slate-950/60 border-white/10 hover:border-amber-500/30'
                    : 'bg-slate-950/30 border-white/5 opacity-55'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      isUnlocked
                        ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-sm'
                        : 'bg-slate-900 border border-white/5 text-slate-600'
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
                      className={`px-3 py-2 min-h-[40px] min-w-[100px] rounded-xl text-xs font-mono font-bold transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                        isPatrolling
                          ? 'bg-amber-500 text-slate-950 font-black animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                          : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 shadow-sm'
                      }`}
                    >
                      <Play className="w-3 h-3 fill-current shrink-0" />
                      <span>{isPatrolling ? 'Im Einsatz...' : 'Streife'}</span>
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono text-slate-500">
                      <Lock className="w-3 h-3 text-slate-600" />
                      <span>Gesperrt</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
