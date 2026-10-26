import React, { useState, useEffect } from 'react';
import {
  Crosshair,
  Trophy,
  Wrench,
  Shield,
  Sparkles,
  Flame,
  Coins,
  Award,
  Target,
  CheckCircle2,
  Lock,
  ArrowRight,
  ChevronRight,
  Zap,
  Play,
  User,
  MapPin,
  Clock,
  Star,
  Gift,
  Radio,
  Layers,
  Activity,
  Users,
  Building2,
} from 'lucide-react';
import {
  ARENAS,
  checkArenaUnlocked,
  getMapBotScaling,
} from '../game/three/arenas';
import { CareerStats } from '../game/progression';
import {
  DailyMissionsState,
  getReputationRank,
  getTimeUntilDailyReset,
} from '../game/missions';
import {
  WEAPONS,
  getEffectiveWeaponStats,
  COLD_WAR_RARITIES,
} from '../game/weapons';
import { soundFx } from '../audio/soundFx';
import { MobileTab } from './MobileDock';
import { AllWeaponsUpgrades, MapLevelsState } from '../types';

export interface MobileHomeViewProps {
  playerName: string;
  clanTag: string;
  playerCity: string;
  operatorLevel: number;
  reputation: number;
  budget: number;
  totalWins: number;
  careerStats: CareerStats;
  skillPoints: number;
  selectedGunsmithWeapon: string;
  weaponUpgrades: AllWeaponsUpgrades;
  currentArena: string;
  unlockedMaps: string[];
  mapLevels: MapLevelsState;
  dailyMissionsState: DailyMissionsState;
  canClaimDailyLogin: boolean;
  onNavigateTab: (tab: MobileTab) => void;
  onOpenProfileModal: () => void;
  onOpenDailyMissionsModal: () => void;
  onClaimDailyMission: (missionId: string) => void;
  onClaimDailyGrandBonus: () => void;
  onClaimDailyLoginBonus: () => void;
  onStartBattle?: (arenaId?: string) => void;
  onSimulatePatrol?: (arenaId: string) => void;
  onOpenTutorial?: () => void;
}

export const MobileHomeView: React.FC<MobileHomeViewProps> = ({
  playerName,
  clanTag,
  playerCity,
  operatorLevel,
  reputation,
  budget,
  totalWins,
  careerStats,
  skillPoints,
  selectedGunsmithWeapon,
  weaponUpgrades,
  currentArena,
  unlockedMaps,
  mapLevels,
  dailyMissionsState,
  canClaimDailyLogin,
  onNavigateTab,
  onOpenProfileModal,
  onOpenDailyMissionsModal,
  onClaimDailyMission,
  onClaimDailyGrandBonus,
  onClaimDailyLoginBonus,
  onStartBattle,
  onSimulatePatrol,
  onOpenTutorial,
}) => {
  const [resetTimer, setResetTimer] = useState<string>(() => getTimeUntilDailyReset().formatted);

  useEffect(() => {
    const interval = setInterval(() => {
      setResetTimer(getTimeUntilDailyReset().formatted);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const currentRank = getReputationRank(reputation);
  const activeArenaConfig = ARENAS[currentArena] || ARENAS.hessenpark;
  const currentMapLevel = mapLevels[currentArena] || 1;
  const botScaling = getMapBotScaling(currentArena, currentMapLevel);

  const weaponObj = WEAPONS[selectedGunsmithWeapon] || WEAPONS.bembel;
  const weaponState = weaponUpgrades[selectedGunsmithWeapon] || {
    rarityTier: 1,
    papLevel: 0,
    attachments: { scope: 0, barrel: 0, bolt: 0, mag: 0, stock: 0 },
    weaponLevel: 1,
    weaponXp: 0,
  };
  const weaponStats = getEffectiveWeaponStats(weaponObj, weaponState);
  const rarityConfig = COLD_WAR_RARITIES.find((r) => r.tier === weaponState.rarityTier) || COLD_WAR_RARITIES[0];

  const completedMissionsCount = dailyMissionsState.missions.filter((m) => m.completed).length;
  const unclaimedMissionsCount = dailyMissionsState.missions.filter((m) => m.completed && !m.claimed).length;

  return (
    <div className="w-full p-4 space-y-4 pb-24 text-slate-100 select-none animate-in fade-in duration-150">
      {/* 1. Radar Telemetry Banner (Required for test suites & tactical flair) */}
      <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-900/90 border border-white/10 text-[10px] font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.9)]" />
          <span className="text-emerald-400 font-bold uppercase tracking-wider">
            BÜRGERWEHR-RADAR ONLINE
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <Clock className="w-3 h-3 text-cyan-400" />
          <span>Reset: <span className="text-cyan-300 font-bold">{resetTimer}</span></span>
        </div>
      </div>

      {/* 2. Hero Operator Progression Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.6)] relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3 min-w-0">
            {/* Operator Avatar with Level Badge */}
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/40 flex items-center justify-center font-mono font-black text-amber-400 text-base shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                {operatorLevel}
              </div>
              <span className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded-md bg-amber-500 text-slate-950 font-mono text-[8px] font-black leading-none">
                LVL
              </span>
            </div>

            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {clanTag ? `[${clanTag}]` : 'CLANLOS'}
                </span>
                <h2 className="text-sm font-bold text-white truncate">
                  {playerName}
                </h2>
              </div>
              <div className="text-[11px] font-mono text-purple-300 flex items-center gap-1 mt-0.5">
                <Award className="w-3 h-3 text-purple-400" />
                <span>Rang {currentRank.rank}: {currentRank.title}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onOpenTutorial && (
              <button
                type="button"
                data-testid="mobile-open-tutorial-btn"
                onClick={() => {
                  soundFx.playUiClick();
                  onOpenTutorial();
                }}
                className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-mono text-amber-300 font-bold transition-transform active:scale-95 cursor-pointer"
              >
                Tutorial
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                soundFx.playUiClick();
                onOpenProfileModal();
              }}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-white/10 text-xs font-mono text-slate-300 font-bold transition-transform active:scale-95 cursor-pointer"
            >
              Profil
            </button>
          </div>
        </div>

        {/* Reputation Progress Bar */}
        <div className="mt-3.5 space-y-1 relative z-10">
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>Operator-Ruf</span>
            <span className="text-purple-300 font-bold tabular-nums">{reputation} Ruf-Punkte</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-950 border border-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-amber-400 shadow-[0_0_8px_rgba(168,85,247,0.5)] transition-all duration-300"
              style={{ width: `${Math.min(100, (reputation / 2500) * 100)}%` }}
            />
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/10 text-center font-mono">
          <div className="p-2 rounded-xl bg-slate-950/60 border border-white/5">
            <span className="text-[9px] text-slate-400 block uppercase">Siege</span>
            <span className="text-xs font-bold text-amber-400 tabular-nums">{totalWins}</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-950/60 border border-white/5">
            <span className="text-[9px] text-slate-400 block uppercase">Kills</span>
            <span className="text-xs font-bold text-emerald-400 tabular-nums">{careerStats.totalKills}</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-950/60 border border-white/5">
            <span className="text-[9px] text-slate-400 block uppercase">Skills</span>
            <span className="text-xs font-bold text-cyan-400 tabular-nums">{skillPoints} SP</span>
          </div>
        </div>
      </div>

      {/* 3. Daily Login Bonus Card (if claimable) */}
      {canClaimDailyLogin && (
        <button
          type="button"
          onClick={() => {
            soundFx.playRewardClaim();
            onClaimDailyLoginBonus();
          }}
          className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-bold shadow-[0_4px_20px_rgba(16,185,129,0.35)] flex items-center justify-between gap-3 transition-all duration-150 active:scale-[0.98] cursor-pointer animate-glow-pulse-emerald"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-950/20 border border-white/20 flex items-center justify-center shrink-0">
              <Gift className="w-5 h-5 text-slate-950" />
            </div>
            <div className="text-left">
              <span className="text-xs font-black uppercase tracking-wider block">
                Täglicher Bürgerwehr-Bonus!
              </span>
              <span className="text-[10px] text-emerald-950 font-mono font-bold block">
                🔥 Tag {careerStats.loginStreakDays + 1} · Jetzt Belohnung abholen
              </span>
            </div>
          </div>
          <span className="px-3 py-1 rounded-xl bg-slate-950 text-emerald-400 font-mono font-black text-xs shrink-0 shadow-sm">
            +NAT
          </span>
        </button>
      )}

      {/* 4. Primary Combat Quick-Deploy Card (Hessenpark / Active Area) */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 shadow-[0_8px_30px_rgba(0,0,0,0.6)] space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-widest">
              EINSATZRAUM:
            </span>
            <span className="text-xs font-bold text-white truncate">
              {activeArenaConfig.name.replace(' (Reworked)', '')}
            </span>
          </div>

          <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
            Lv. {currentMapLevel}
          </span>
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-black text-white tracking-tight uppercase">
            Freilichtmuseum Hessenpark
          </h3>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Verteidige das historische Taunus-Dorf gegen anrückende Wehrheimer Stoßtrupps.
          </p>
        </div>

        {/* Threat status pill */}
        <div className="p-2 rounded-xl bg-slate-950/70 border border-white/5 flex items-center justify-between text-[10px] font-mono">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span>{botScaling.threatTitle}</span>
          </div>
          <span className="text-amber-400 font-bold">{botScaling.rewardMultiplier}x NAT Beute</span>
        </div>

        {/* Primary Deploy CTA Button */}
        <button
          type="button"
          onClick={() => {
            soundFx.playUiClick();
            onNavigateTab('battle');
          }}
          className="w-full py-3.5 px-4 min-h-[48px] rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.35)] flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] cursor-pointer"
        >
          <Crosshair className="w-4 h-4 text-slate-950" />
          <span>Taktik-Zentrale öffnen & Streife starten</span>
          <ArrowRight className="w-4 h-4 text-slate-950" />
        </button>
      </div>

      {/* 5. Daily Missions Quick Section */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Tagesbefehle
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              soundFx.playUiClick();
              onOpenDailyMissionsModal();
            }}
            className="text-[11px] font-mono text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>{completedMissionsCount}/{dailyMissionsState.missions.length} Fertig</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {dailyMissionsState.missions.slice(0, 2).map((mission) => {
          const percent = Math.min(100, Math.round((mission.currentProgress / mission.targetCount) * 100));
          return (
            <div
              key={mission.id}
              className={`p-3 rounded-xl border transition-all ${
                mission.claimed
                  ? 'bg-slate-950/40 border-white/5 opacity-60'
                  : mission.completed
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-slate-950/60 border-white/10'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white truncate block">
                    {mission.title}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {mission.description}
                  </span>
                </div>

                <div className="shrink-0 flex items-center gap-1 font-mono text-[9px] font-bold text-amber-400">
                  <span>+{mission.rewardNAT} NAT</span>
                </div>
              </div>

              {/* Progress & Claim Button */}
              <div className="flex items-center justify-between gap-2.5 pt-1">
                <div className="flex-1 space-y-1">
                  <div className="w-full h-1.5 rounded-full bg-slate-950 border border-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        mission.completed ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {mission.completed && !mission.claimed ? (
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playRewardClaim();
                      onClaimDailyMission(mission.id);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10px] uppercase cursor-pointer shrink-0 transition-transform active:scale-95"
                  >
                    Einfordern
                  </button>
                ) : (
                  <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                    {mission.currentProgress}/{mission.targetCount}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 6. Signature Weapon & Arsenal Preview */}
      <button
        type="button"
        onClick={() => {
          soundFx.playUiClick();
          onNavigateTab('gunsmith');
        }}
        className="w-full p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-amber-950/30 border border-white/10 hover:border-amber-500/40 shadow-lg text-left flex items-center justify-between gap-3 transition-all duration-150 active:scale-[0.98] cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white truncate">
                {weaponStats.displayName}
              </span>
              <span
                className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold"
                style={{ color: rarityConfig.colorHex }}
              >
                {rarityConfig.name}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
              Waffen-Stufe {weaponStats.weaponLevel} · Gunsmith öffnen
            </span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
      </button>

      {/* 7. Skilltree Quick CTA */}
      <button
        type="button"
        onClick={() => {
          soundFx.playUiClick();
          onNavigateTab('skilltree');
        }}
        className="w-full p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-slate-900 to-cyan-500/15 border border-amber-500/30 text-left flex items-center justify-between gap-3 transition-all duration-150 active:scale-[0.98] cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Operator-Skilltree</span>
              {skillPoints > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-mono text-[9px] font-black">
                  {skillPoints} SP
                </span>
              )}
            </div>
            <span className="text-[10px] font-mono text-slate-300 block mt-0.5">
              Perks skillen: Bembel-Wucht, Panzerung & Tempo
            </span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-amber-400 shrink-0" />
      </button>
    </div>
  );
};
