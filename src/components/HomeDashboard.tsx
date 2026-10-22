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
  Compass,
  MapPin,
  Clock,
  Star,
  Gift,
  Radio,
  Layers,
  Sword,
  Activity,
  ChevronUp,
  Volume2,
  Users,
  Building2,
  Sun,
  Moon,
  CloudSun,
  Eye,
  Check,
  AlertCircle,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';
import {
  ARENAS,
  ARENA_UNLOCK_RULES,
  checkArenaUnlocked,
  getMapBotScaling,
  getMapUpgradeCostNAT,
  ArenaConfig,
} from '../game/three/arenas';
import {
  ACHIEVEMENTS_LIST,
  AchievementDef,
  CareerStats,
} from '../game/progression';
import {
  DailyMissionsState,
  DailyMission,
  getReputationRank,
  getTimeUntilDailyReset,
  REPUTATION_RANKS,
} from '../game/missions';
import {
  WEAPONS,
  getEffectiveWeaponStats,
  COLD_WAR_RARITIES,
  MAX_WEAPON_LEVEL,
} from '../game/weapons';
import { soundFx } from '../audio/soundFx';
import { AppTab } from './TopBar';
import { AllWeaponsUpgrades, MapLevelsState } from '../types';

export interface HomeDashboardProps {
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
  effectiveMobileMode: boolean;
  canClaimDailyLogin: boolean;
  onStartBattle: (arenaId?: string) => void;
  onSelectArena: (arenaId: string) => void;
  onOpenTab: (tab: AppTab) => void;
  onOpenProfileModal: () => void;
  onOpenDailyMissionsModal: () => void;
  onClaimDailyMission: (missionId: string) => void;
  onClaimDailyGrandBonus: () => void;
  onClaimAchievement: (achievementId: string) => void;
  onClaimDailyLoginBonus: () => void;
  onUnlockMap?: (arenaId: string, costNAT: number) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
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
  effectiveMobileMode,
  canClaimDailyLogin,
  onStartBattle,
  onSelectArena,
  onOpenTab,
  onOpenProfileModal,
  onOpenDailyMissionsModal,
  onClaimDailyMission,
  onClaimDailyGrandBonus,
  onClaimAchievement,
  onClaimDailyLoginBonus,
  onUnlockMap,
}) => {
  // Live Reset Countdown for Daily Missions
  const [resetTimer, setResetTimer] = useState<string>(() => getTimeUntilDailyReset().formatted);
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'missions' | 'achievements'>('all');

  useEffect(() => {
    const timer = setInterval(() => {
      setResetTimer(getTimeUntilDailyReset().formatted);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute Reputation Rank Info
  const repRank = getReputationRank(reputation);
  const nextRank = REPUTATION_RANKS.find((r) => r.rank === repRank.rank + 1);
  const pointsInRank = Math.max(0, reputation - repRank.minPoints);
  const pointsForNext = nextRank ? nextRank.minPoints - repRank.minPoints : 1000;
  const rankProgressPct = nextRank
    ? Math.min(100, Math.round((pointsInRank / pointsForNext) * 100))
    : 100;

  // Compute Weapon Profile
  const primaryWeaponObj = WEAPONS[selectedGunsmithWeapon] || WEAPONS.bembel;
  const primaryWeaponStats = getEffectiveWeaponStats(
    primaryWeaponObj,
    weaponUpgrades[selectedGunsmithWeapon]
  );
  const weaponRarity = COLD_WAR_RARITIES[
    Math.min(4, Math.max(0, (weaponUpgrades[selectedGunsmithWeapon]?.rarityTier || 1) - 1))
  ];

  // Daily Mission Counts
  const completedMissionsCount = dailyMissionsState.missions.filter((m) => m.completed).length;
  const unclaimedMissionsCount = dailyMissionsState.missions.filter(
    (m) => m.completed && !m.claimed
  ).length;
  const allMissionsFinished =
    dailyMissionsState.missions.length > 0 &&
    completedMissionsCount === dailyMissionsState.missions.length;

  // Current active arena details
  const activeArenaConfig = ARENAS[currentArena] || ARENAS.hessenpark;
  const currentMapLevel = mapLevels[currentArena] || 1;
  const botScaling = getMapBotScaling(currentArena, currentMapLevel);

  // Unlocked arenas list
  const effectiveUnlockedList = Object.keys(ARENAS).filter((id) =>
    checkArenaUnlocked(id, totalWins, unlockedMaps)
  );

  const handleDeployQuick = () => {
    soundFx.playShoot(selectedGunsmithWeapon);
    onStartBattle(currentArena);
  };

  const handleSelectArenaCard = (arenaId: string) => {
    const isUnlocked = checkArenaUnlocked(arenaId, totalWins, unlockedMaps);
    if (isUnlocked) {
      soundFx.playUiClick();
      onSelectArena(arenaId);
    }
  };

  const handleLaunchSpecificArena = (arenaId: string) => {
    const isUnlocked = checkArenaUnlocked(arenaId, totalWins, unlockedMaps);
    if (isUnlocked) {
      soundFx.playShoot(selectedGunsmithWeapon);
      onSelectArena(arenaId);
      onStartBattle(arenaId);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full overflow-hidden bg-slate-950 text-slate-100 pb-20 selection:bg-amber-500/30 selection:text-white">
      {/* Background Tactical Grid & Multi-Layer Ambient Atmospheric Glows */}
      <div className="absolute inset-0 tactical-grid opacity-25 pointer-events-none" aria-hidden="true" />
      <div
        className="absolute -top-36 -left-36 w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-[140px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute top-1/4 -right-36 w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[150px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-12 left-1/4 w-[600px] h-[360px] rounded-full bg-purple-500/8 blur-[160px] pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-8 sm:space-y-10">
        
        {/* ========================================================================= */}
        {/* TOP STATUS BAR & TELEMETRY TICKER                                         */}
        {/* ========================================================================= */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono uppercase tracking-wider text-slate-400 border-b border-white/10 pb-3 sm:pb-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 font-bold shadow-sm shadow-emerald-950/50">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              BÜRGERWEHR-RADAR ONLINE
            </span>
            <span className="hidden sm:inline text-slate-600">//</span>
            <span className="text-amber-400/90 font-bold hidden sm:inline">
              [SEKTOR 61267] HOCHTAUNUS-VERTEIDIGUNG
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <div className="hidden md:flex items-center gap-1.5 text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{playerCity}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Befehl-Reset: <span className="text-cyan-300 font-bold tracking-normal">{resetTimer}</span></span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 1: EPIC HERO & COMBAT OPERATOR DOSSIER GRID                       */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
          
          {/* LEFT 7 COLS: HERO COMBAT HUB */}
          <div className="lg:col-span-7 flex flex-col justify-between rounded-3xl p-6 sm:p-8 tactical-glass border border-white/10 hover:border-white/15 transition-all duration-300 shadow-2xl shadow-black/60 relative overflow-hidden hud-corners-amber group">
            {/* Ambient Corner Flare */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-amber-500/15 via-transparent to-transparent pointer-events-none" />

            {/* Tactical Sector Header & Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 font-mono text-xs font-bold uppercase tracking-widest mb-4 sm:mb-6 shadow-sm">
                <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Einsatzraum: {activeArenaConfig.name.replace(' (Reworked)', '')}</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight uppercase leading-[0.95] text-white">
                <span>Hessenpark</span>
                <span className="block mt-1 sm:mt-2 metallic-gold text-glow-amber">
                  Battle Royale
                </span>
              </h1>

              {/* Tactical Subtitle & Briefing */}
              <p className="mt-4 sm:mt-5 text-sm sm:text-base leading-relaxed text-slate-300 max-w-2xl font-normal">
                Wehrheimer Stoßtrupps rücken über den Laubweg und das Freilichtmuseum vor. 
                Rüste deinen Operator in der Waffenschmiede auf, aktiviere mächtige Skilltree-Perks und verteidige Neu-Anspach in 7 überarbeiteten Einsatzgebieten.
              </p>

              {/* Tactical Arena Threat Pill */}
              <div className="mt-4 sm:mt-5 inline-flex flex-wrap items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-xs font-mono text-slate-300 shadow-sm backdrop-blur-md">
                <Activity className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Aktives Gebiet: <strong className="text-white font-semibold">{activeArenaConfig.district}</strong></span>
                <span className="text-slate-600">·</span>
                <span className="text-amber-400 font-bold">{botScaling.threatTitle}</span>
                <span className="text-slate-600 hidden sm:inline">·</span>
                <span className="text-slate-400 hidden sm:inline">(Bedrohung Lv. {botScaling.effectiveBotLevel} · {botScaling.rewardMultiplier}x NAT)</span>
              </div>
            </div>

            {/* High-Impact Combat CTAs */}
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <button
                type="button"
                onClick={handleDeployQuick}
                className="group relative flex-1 min-h-[52px] inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 px-7 py-3.5 text-slate-950 font-black text-base uppercase tracking-wider shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/40 transition-all duration-150 active:scale-[0.98] cursor-pointer hud-chamfer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                <Crosshair className="w-5 h-5 text-slate-950 group-hover:rotate-90 transition-transform duration-300" />
                <span>{effectiveMobileMode ? 'Taktik-Zentrale öffnen' : 'In die Schlacht'}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
              </button>

              <button
                type="button"
                onClick={onOpenDailyMissionsModal}
                className="relative min-h-[52px] inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-white/10 hover:border-amber-400/50 font-mono text-xs font-bold uppercase tracking-wider text-slate-200 hover:text-white transition-all duration-150 active:scale-[0.98] cursor-pointer shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
              >
                <Target className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Tagesbefehle</span>
                <span
                  className={`ml-1 px-2.5 py-0.5 rounded-full text-[10px] font-black transition-all ${
                    unclaimedMissionsCount > 0
                      ? 'bg-amber-400 text-slate-950 shadow-sm shadow-amber-400/50 animate-pulse'
                      : 'bg-slate-800 text-slate-300 border border-white/5'
                  }`}
                >
                  {completedMissionsCount}/{dailyMissionsState.missions.length}
                </span>
              </button>

              {canClaimDailyLogin && (
                <button
                  type="button"
                  onClick={onClaimDailyLoginBonus}
                  className="min-h-[52px] inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-mono text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-500/25 transition-all duration-150 active:scale-[0.98] cursor-pointer animate-glow-pulse-emerald focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/80"
                  title="Täglicher Bürgerwehr-Loginbonus bereit!"
                >
                  <Gift className="w-4 h-4 shrink-0" />
                  <span>Login-Bonus</span>
                </button>
              )}
            </div>

            {/* Quick Navigation Pills */}
            <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  soundFx.playUiClick();
                  onOpenTab('gunsmith');
                }}
                className="group flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-white/10 hover:border-white/20 font-mono text-[11px] font-bold text-slate-300 hover:text-white transition-all duration-150 active:scale-[0.98] cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
              >
                <Wrench className="w-3.5 h-3.5 text-amber-400 transition-transform group-hover:-rotate-12" />
                <span>Waffenschmiede</span>
                <span className="text-[10px] text-amber-300 font-normal">({primaryWeaponStats.displayName})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFx.playUiClick();
                  onOpenTab('skilltree');
                }}
                className="group flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-white/10 hover:border-white/20 font-mono text-[11px] font-bold text-slate-300 hover:text-white transition-all duration-150 active:scale-[0.98] cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 transition-transform group-hover:scale-110" />
                <span>Skilltree</span>
                {skillPoints > 0 && (
                  <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-black text-[10px] border border-cyan-500/40 animate-pulse shadow-sm shadow-cyan-500/30">
                    +{skillPoints} SP
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFx.playUiClick();
                  onOpenTab('leaderboard');
                }}
                className="group flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-white/10 hover:border-white/20 font-mono text-[11px] font-bold text-slate-300 hover:text-white transition-all duration-150 active:scale-[0.98] cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
              >
                <Trophy className="w-3.5 h-3.5 text-yellow-400 transition-transform group-hover:scale-110" />
                <span>Rangliste</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFx.playUiClick();
                  onOpenTab('tycoon');
                }}
                className="group flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-white/10 hover:border-white/20 font-mono text-[11px] font-bold text-slate-300 hover:text-white transition-all duration-150 active:scale-[0.98] cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
              >
                <Building2 className="w-3.5 h-3.5 text-emerald-400 transition-transform group-hover:scale-110" />
                <span>Tycoon-Zentrale</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFx.playUiClick();
                  onOpenTab('clan');
                }}
                className="group flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-white/10 hover:border-white/20 font-mono text-[11px] font-bold text-slate-300 hover:text-white transition-all duration-150 active:scale-[0.98] cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50"
              >
                <Users className="w-3.5 h-3.5 text-purple-400 transition-transform group-hover:scale-110" />
                <span>Clan-HQ</span>
              </button>
            </div>

            {/* Tactical Controls HUD Guide */}
            <div className="mt-5 pt-3.5 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
              {effectiveMobileMode ? (
                <span className="text-amber-400/90 font-bold">
                  📱 Handy-Modus aktiv: Taktik-Zentrale & Waffenverwaltung. Für den 3D-Shooter wechsle an den PC.
                </span>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Tastenbelegung:</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-white/10 text-slate-300 shadow-sm">WASD</span>
                  <span>Bewegen</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-white/10 text-slate-300 shadow-sm">Maus</span>
                  <span>Zielen / Feuern</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-white/10 text-slate-300 shadow-sm">Leertaste</span>
                  <span>Sprung</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-amber-500/30 text-amber-300 font-bold shadow-sm">[Q/E/F]</span>
                  <span>Taktik-Fähigkeiten</span>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT 5 COLS: OPERATOR COMBAT DOSSIER */}
          <div className="lg:col-span-5 flex flex-col justify-between rounded-3xl p-6 sm:p-8 tactical-glass-amber border border-amber-500/30 hover:border-amber-500/40 transition-all duration-300 shadow-2xl shadow-black/60 relative overflow-hidden hud-corners-cyan">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-3xl pointer-events-none" />

            {/* Dossier Header */}
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3.5 mb-5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="font-mono text-xs font-black uppercase tracking-widest text-cyan-300">
                    OPERATOR DOSSIER // 61267
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onOpenProfileModal}
                  className="font-mono text-[11px] font-semibold text-slate-400 hover:text-amber-300 flex items-center gap-1.5 transition-all duration-150 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Profil ändern</span>
                </button>
              </div>

              {/* Operator Identity & Callsign */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 font-mono text-xs font-black text-amber-400 shadow-sm">
                      [{clanTag}]
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      {playerName}
                    </h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-400 font-mono">
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Aktiv im Einsatz
                    </span>
                    <span>·</span>
                    <span className="text-slate-300 font-bold">Stufe {operatorLevel}</span>
                    <span>·</span>
                    <span>{playerCity}</span>
                  </div>
                </div>

                {/* Operator Rank Badge */}
                <div className={`px-3.5 py-2 rounded-xl border text-right font-mono ${repRank.badgeColor} shadow-md backdrop-blur-md shrink-0`}>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rang {repRank.rank}</div>
                  <div className="text-xs font-black">{repRank.title}</div>
                </div>
              </div>

              {/* Reputation Progress Bar */}
              <div className="mt-5 p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 shadow-sm backdrop-blur-md">
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>Operator-Ruf:</span>
                  </span>
                  <span className="text-amber-300 font-black">{reputation} RUF</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-900/90 overflow-hidden border border-white/5">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-300 shadow-sm shadow-amber-500/50 transition-all duration-500"
                    style={{ width: `${rankProgressPct}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mt-1.5">
                  <span className="font-semibold text-slate-300">{repRank.title}</span>
                  <span>{nextRank ? `Nächster Rang: ${nextRank.title} (${pointsForNext - pointsInRank} Pkt)` : 'MAX RANG'}</span>
                </div>
              </div>

              {/* Combat Telemetry Badges Grid */}
              <div className="mt-4 grid grid-cols-2 gap-3 font-mono">
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/10 hover:border-white/20 transition-all duration-200 shadow-sm group">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Einsatz-Siege</div>
                  <div className="text-lg font-black text-amber-400 flex items-center gap-1.5 mt-1">
                    <Trophy className="w-4 h-4 text-amber-400 transition-transform group-hover:scale-110" />
                    <span>{totalWins}</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/10 hover:border-white/20 transition-all duration-200 shadow-sm group">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Abschüsse (Kills)</div>
                  <div className="text-lg font-black text-emerald-400 flex items-center gap-1.5 mt-1">
                    <Flame className="w-4 h-4 text-emerald-400 transition-transform group-hover:scale-110" />
                    <span>{careerStats.totalKills}</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/10 hover:border-white/20 transition-all duration-200 shadow-sm group">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Kriegskasse</div>
                  <div className="text-lg font-black text-yellow-400 flex items-center gap-1.5 mt-1">
                    <Coins className="w-4 h-4 text-yellow-400 transition-transform group-hover:scale-110" />
                    <span>{budget.toLocaleString('de-DE')} ₳</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/10 hover:border-white/20 transition-all duration-200 shadow-sm group">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Skill-Punkte</div>
                  <div className="text-lg font-black text-cyan-400 flex items-center gap-1.5 mt-1">
                    <Sparkles className="w-4 h-4 text-cyan-400 transition-transform group-hover:scale-110" />
                    <span>{skillPoints} SP</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Equipped Weapon Profile */}
            <div className="mt-5 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2.5">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Sword className="w-3.5 h-3.5 text-amber-400" />
                  <span>Aktive Bewaffnung:</span>
                </span>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-black border ${weaponRarity.badgeClass} shadow-sm`}>
                  {weaponRarity.name}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-white/10 hover:border-white/20 transition-all duration-200 flex items-center justify-between gap-3 shadow-md">
                <div className="min-w-0">
                  <div className="text-sm font-black text-white truncate">
                    {primaryWeaponStats.displayName}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-amber-400 font-bold">Stufe {primaryWeaponStats.weaponLevel}/{MAX_WEAPON_LEVEL}</span>
                    <span>·</span>
                    <span>{primaryWeaponStats.damage} Schaden</span>
                    <span>·</span>
                    <span>{primaryWeaponStats.fireRate} Schuss/s</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    soundFx.playUiClick();
                    onOpenTab('gunsmith');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-white/15 font-mono text-[10px] font-black uppercase text-amber-300 hover:text-white transition-all duration-150 active:scale-[0.98] shrink-0 cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
                >
                  Anpassen
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: ARENA QUICK-DEPLOY DECK (7 REWORKED ARENAS)                    */}
        {/* ========================================================================= */}
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <Compass className="w-5 h-5 text-amber-400 shrink-0" />
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
                  Einsatzgebiete // Quick-Deploy Deck
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                Wähle dein Einsatzgebiet im Hochtaunus. Jede Arena bietet einzigartige Deckungen, Aussichtspunkte und Bot-Skalierungen.
              </p>
            </div>

            <div className="font-mono text-xs text-slate-400 flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/10 shadow-sm">
              <span className="text-amber-400 font-bold">{effectiveUnlockedList.length} von 7</span>
              <span>Gebieten gesichert</span>
            </div>
          </div>

          {/* Arena Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {Object.values(ARENAS).map((arena) => {
              const rule = ARENA_UNLOCK_RULES[arena.id];
              const isUnlocked = checkArenaUnlocked(arena.id, totalWins, unlockedMaps);
              const isActive = currentArena === arena.id;
              const mapLv = mapLevels[arena.id] || 1;
              const scaling = getMapBotScaling(arena.id, mapLv);
              const unlockCost = rule?.unlockCostNAT || 0;

              return (
                <div
                  key={arena.id}
                  onClick={() => handleSelectArenaCard(arena.id)}
                  tabIndex={0}
                  role="button"
                  aria-label={`${arena.name} - ${isUnlocked ? (isActive ? 'Ausgewählt' : 'Verfügbar') : 'Gesperrt'}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectArenaCard(arena.id);
                    }
                  }}
                  className={`group relative flex flex-col justify-between rounded-2xl p-4 sm:p-5 transition-all duration-200 border cursor-pointer hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 ${
                    isActive
                      ? 'border-amber-400/90 bg-amber-950/25 shadow-lg shadow-amber-500/20 ring-1 ring-amber-400/60'
                      : isUnlocked
                      ? 'border-white/10 bg-slate-900/75 hover:border-amber-400/50 hover:bg-slate-850/80 hover:shadow-xl hover:shadow-black/40 backdrop-blur-md'
                      : 'border-white/5 bg-slate-950/70 opacity-70 hover:opacity-85'
                  }`}
                >
                  {/* Top Bar with Atmosphere & Unlock Badge */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3 font-mono text-[10px]">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/90 text-cyan-300 font-bold border border-white/10 shadow-sm">
                        {arena.atmosphere?.isNight ? (
                          <Moon className="w-3 h-3 text-cyan-400 shrink-0" />
                        ) : (
                          <Sun className="w-3 h-3 text-amber-400 shrink-0" />
                        )}
                        <span>{arena.atmosphere?.timeOfDay || 'Tagsüber'}</span>
                      </span>

                      {isActive ? (
                        <span className="px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] uppercase tracking-wider shadow-sm shadow-amber-400/40 animate-pulse">
                          Gewählt
                        </span>
                      ) : isUnlocked ? (
                        <span className="px-2 py-1 rounded-md bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 font-bold text-[9px] shadow-sm">
                          Map-Stufe {mapLv}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800/80 border border-white/5 text-slate-400 font-bold text-[9px]">
                          <Lock className="w-2.5 h-2.5 shrink-0" />
                          <span>Gesperrt</span>
                        </span>
                      )}
                    </div>

                    {/* Arena Title & Subtitle */}
                    <h3 className="font-black text-base sm:text-lg text-white tracking-tight group-hover:text-amber-300 transition-colors">
                      {arena.name.replace(' (Reworked)', '')}
                    </h3>
                    <p className="text-[11px] text-slate-300 leading-snug line-clamp-2 mt-1.5 font-normal">
                      {arena.subtitle}
                    </p>
                  </div>

                  {/* Threat Level & Action */}
                  <div className="mt-5 pt-3.5 border-t border-white/10 flex items-center justify-between gap-2">
                    <div className="font-mono text-[10px] text-slate-400">
                      <div className="text-amber-400 font-bold">{scaling.threatTitle}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">{arena.district}</div>
                    </div>

                    <div>
                      {isUnlocked ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLaunchSpecificArena(arena.id);
                          }}
                          className={`px-3.5 py-2 rounded-xl font-mono text-[10px] font-black uppercase tracking-wider transition-all duration-150 active:scale-[0.98] cursor-pointer flex items-center gap-1 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 ${
                            isActive
                              ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-400/25'
                              : 'bg-slate-800/90 hover:bg-amber-400 hover:text-slate-950 text-slate-200 border border-white/10'
                          }`}
                        >
                          <span>{isActive ? 'Starten' : 'Wählen'}</span>
                          <ChevronRight className="w-3 h-3 shrink-0" />
                        </button>
                      ) : (
                        onUnlockMap && unlockCost > 0 && budget >= unlockCost ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUnlockMap(arena.id, unlockCost);
                            }}
                            className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500 hover:text-slate-950 border border-amber-500/40 font-mono text-[10px] font-black text-amber-300 transition-all duration-150 active:scale-[0.98] cursor-pointer shadow-sm"
                          >
                            Freischalten ({unlockCost} ₳)
                          </button>
                        ) : (
                          <span className="font-mono text-[10px] text-slate-500">
                            {rule ? `Benötigt ${rule.requiredWins} Siege` : 'Gesperrt'}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3: TAGESBEFEHLE & ERRUNGENSCHAFTEN HQ (FULL WIDTH & EXPANSIVE)     */}
        {/* ========================================================================= */}
        <div className="space-y-6 pt-4">
          
          {/* Section Header with Category Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <Target className="w-5 h-5 text-amber-400 shrink-0" />
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
                  Tagesbefehle & Bürgerwehr-Errungenschaften
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                Erfülle deine täglichen Befehle für sofortige NAT-Taler & RUF und meistere die lebenslangen Taunus-Erfolge.
              </p>
            </div>

            {/* Sub-tab pills */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/90 border border-white/10 font-mono text-xs shadow-sm self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setActiveSubTab('all')}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition-all duration-150 active:scale-[0.98] cursor-pointer ${
                  activeSubTab === 'all'
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Alle anzeigen
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('missions')}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition-all duration-150 active:scale-[0.98] cursor-pointer flex items-center gap-2 ${
                  activeSubTab === 'missions'
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>Tagesbefehle</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    activeSubTab === 'missions'
                      ? 'bg-slate-950 text-amber-300'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {completedMissionsCount}/{dailyMissionsState.missions.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('achievements')}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition-all duration-150 active:scale-[0.98] cursor-pointer flex items-center gap-2 ${
                  activeSubTab === 'achievements'
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>Errungenschaften</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    activeSubTab === 'achievements'
                      ? 'bg-slate-950 text-amber-300'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {careerStats.claimedAchievements.length}/{ACHIEVEMENTS_LIST.length}
                </span>
              </button>
            </div>
          </div>

          {/* SUBSECTION A: TAGESBEFEHLE (DAILY COMBAT MISSIONS) */}
          {(activeSubTab === 'all' || activeSubTab === 'missions') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm font-mono">
                <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Aktive Tagesbefehle ({completedMissionsCount} von {dailyMissionsState.missions.length} abgeschlossen)
                </span>
                <span className="text-xs text-slate-400">
                  Reset in: <strong className="text-cyan-300">{resetTimer}</strong>
                </span>
              </div>

              {/* Empty State: Tagesbefehle */}
              {dailyMissionsState.missions.length === 0 ? (
                <div className="rounded-3xl p-8 sm:p-12 text-center tactical-glass border border-white/10 flex flex-col items-center justify-center max-w-xl mx-auto shadow-xl">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-400 flex items-center justify-center mb-4 shadow-sm">
                    <Target className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">
                    Keine aktiven Tagesbefehle
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md">
                    Alle Befehle für heute wurden abgeschlossen oder das Bürgerwehr-Hauptquartier stellt neue Einsatzpläne zusammen. Der Reset erfolgt in <strong className="text-cyan-300">{resetTimer}</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={handleDeployQuick}
                    className="mt-6 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-mono text-xs font-black uppercase tracking-wider transition-all duration-150 active:scale-[0.98] cursor-pointer shadow-lg shadow-amber-500/25 flex items-center gap-2"
                  >
                    <Crosshair className="w-4 h-4" />
                    <span>In die Schlacht ziehen</span>
                  </button>
                </div>
              ) : (
                /* Daily Mission Cards Grid */
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                  {dailyMissionsState.missions.map((mission) => {
                    const pct = Math.min(
                      100,
                      Math.round((mission.currentProgress / mission.targetCount) * 100)
                    );

                    return (
                      <div
                        key={mission.id}
                        className={`relative flex flex-col justify-between rounded-2xl p-5 border transition-all duration-200 backdrop-blur-md shadow-md ${
                          mission.claimed
                            ? 'border-emerald-500/30 bg-emerald-950/20'
                            : mission.completed
                            ? 'border-amber-400/80 bg-amber-500/15 shadow-amber-500/15 animate-glow-pulse-amber'
                            : 'border-white/10 bg-slate-900/75 hover:border-white/20'
                        }`}
                      >
                        <div>
                          {/* Top tag: difficulty & category */}
                          <div className="flex items-center justify-between gap-2 mb-2.5 font-mono text-[10px]">
                            <span className="px-2.5 py-0.5 rounded-md bg-slate-800/90 border border-white/10 text-amber-300 font-bold uppercase tracking-wider shadow-sm">
                              {mission.badge}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider shadow-sm ${
                                mission.difficulty === 'heroisch'
                                  ? 'bg-purple-950/80 text-purple-400 border border-purple-500/30'
                                  : mission.difficulty === 'schwer'
                                  ? 'bg-red-950/80 text-red-400 border border-red-500/30'
                                  : 'bg-slate-800/80 text-slate-300 border border-white/5'
                              }`}
                            >
                              {mission.difficulty}
                            </span>
                          </div>

                          {/* Title and Description */}
                          <h4 className="font-black text-white text-base tracking-tight">
                            {mission.title}
                          </h4>
                          <p className="mt-1.5 text-xs text-slate-300 leading-relaxed font-normal">
                            {mission.description}
                          </p>
                        </div>

                        {/* Progress Bar & Rewards */}
                        <div className="mt-5 space-y-3">
                          <div>
                            <div className="flex items-center justify-between font-mono text-[11px] mb-1.5">
                              <span className="text-slate-400">Fortschritt:</span>
                              <span className="text-white font-bold">
                                {mission.currentProgress} / {mission.targetCount}
                              </span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-white/10 shadow-inner">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  mission.completed ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-amber-400 shadow-sm shadow-amber-400/50'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>

                          {/* Rewards & Claim CTA */}
                          <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/10">
                            <div className="font-mono text-[11px] font-bold text-emerald-400">
                              +{mission.rewardNAT} NAT · +{mission.rewardReputation} RUF
                            </div>

                            <div>
                              {mission.claimed ? (
                                <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-emerald-400">
                                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                                  <span>Eingelöst</span>
                                </span>
                              ) : mission.completed ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    soundFx.playRewardClaim();
                                    onClaimDailyMission(mission.id);
                                  }}
                                  className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-mono text-xs font-black uppercase tracking-wider shadow-md shadow-amber-400/30 cursor-pointer transition-all duration-150 active:scale-[0.98]"
                                >
                                  Einfordern
                                </button>
                              ) : (
                                <span className="font-mono text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                                  In Arbeit
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Grand Daily Bonus Banner */}
              {allMissionsFinished && !dailyMissionsState.grandBonusClaimed && (
                <div className="rounded-3xl p-6 sm:p-7 bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-500/20 border border-amber-400/80 shadow-2xl shadow-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-5 animate-glow-pulse-amber backdrop-blur-md">
                  <div className="flex items-center gap-4 text-center sm:text-left">
                    <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-2xl shrink-0 shadow-lg shadow-amber-400/40">
                      🏆
                    </div>
                    <div>
                      <div className="font-mono text-xs font-black uppercase tracking-wider text-amber-300">
                        ALLE TAGESBEFEHLE ERFÜLLT!
                      </div>
                      <div className="font-black text-white text-base sm:text-lg tracking-tight mt-0.5">
                        Großer Bürgerwehr-Tagesbonus freigeschaltet
                      </div>
                      <div className="text-xs font-mono text-emerald-400 mt-1 font-semibold">
                        Prämie: +{dailyMissionsState.grandBonusRewardNAT} NAT · +{dailyMissionsState.grandBonusRewardReputation} RUF · +2 Skillpunkte
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playRewardClaim();
                      onClaimDailyGrandBonus();
                    }}
                    className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-mono text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-400/30 transition-all duration-150 active:scale-[0.98] cursor-pointer shrink-0"
                  >
                    Grand Bonus Abholen
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SUBSECTION B: ERRUNGENSCHAFTEN (ACHIEVEMENTS LIST - EXPANSIVE & SPACIOUS) */}
          {(activeSubTab === 'all' || activeSubTab === 'achievements') && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between text-sm font-mono">
                <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  Bürgerwehr-Errungenschaften ({careerStats.claimedAchievements.length} von {ACHIEVEMENTS_LIST.length} eingelöst)
                </span>
                <span className="text-xs text-slate-400">
                  Permanente Auszeichnungen & Belohnungen
                </span>
              </div>

              {/* Empty State: Errungenschaften */}
              {ACHIEVEMENTS_LIST.length === 0 ? (
                <div className="rounded-3xl p-8 sm:p-12 text-center tactical-glass border border-white/10 flex flex-col items-center justify-center max-w-xl mx-auto shadow-xl">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-400 flex items-center justify-center mb-4 shadow-sm">
                    <Award className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">
                    Keine Errungenschaften gefunden
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md">
                    Das Hauptquartier synchronisiert gerade deine Karriere-Leistungen.
                  </p>
                  <button
                    type="button"
                    onClick={() => onOpenTab('gunsmith')}
                    className="mt-6 px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold uppercase tracking-wider transition-all duration-150 active:scale-[0.98] cursor-pointer"
                  >
                    Waffenschmiede öffnen
                  </button>
                </div>
              ) : (
                /* ACHIEVEMENTS GRID: Spacious cards that never truncate! */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  {ACHIEVEMENTS_LIST.map((ach) => {
                    const unlocked = ach.checkUnlocked(careerStats);
                    const claimed = careerStats.claimedAchievements.includes(ach.id);
                    const progText = ach.progressText(careerStats);
                    const { current, target } = ach.getProgress(careerStats);
                    const pct = Math.min(100, Math.round((current / target) * 100));

                    return (
                      <div
                        key={ach.id}
                        className={`relative flex flex-col justify-between rounded-2xl p-5 border transition-all duration-200 backdrop-blur-md shadow-md ${
                          claimed
                            ? 'border-emerald-500/30 bg-emerald-950/20'
                            : unlocked
                            ? 'border-amber-400/80 bg-amber-500/15 shadow-amber-500/15 animate-glow-pulse-amber'
                            : 'border-white/10 bg-slate-900/75 hover:border-white/20'
                        }`}
                      >
                        <div>
                          {/* Status Icon & Ratio Header */}
                          <div className="flex items-center justify-between gap-2 mb-2.5 font-mono text-[10px]">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-800/90 border border-white/10 text-amber-300 font-bold shadow-sm">
                              <Star className="w-3 h-3 text-amber-400 shrink-0" />
                              <span>{progText}</span>
                            </span>

                            {claimed ? (
                              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-400">
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                <span>Gemeistert</span>
                              </span>
                            ) : unlocked ? (
                              <span className="px-2.5 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-[9px] uppercase tracking-wider animate-pulse shadow-sm shadow-amber-400/40">
                                Bereit
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-slate-500 font-bold">
                                <Lock className="w-3 h-3 shrink-0" />
                                <span>Gesperrt</span>
                              </span>
                            )}
                          </div>

                          {/* Title & Description with NO truncation */}
                          <h4 className="font-black text-white text-base tracking-tight">
                            {ach.title}
                          </h4>
                          <p className="mt-1.5 text-xs text-slate-300 leading-relaxed font-normal">
                            {ach.description}
                          </p>
                        </div>

                        {/* Progress Bar & Rewards */}
                        <div className="mt-5 space-y-3">
                          <div>
                            <div className="flex items-center justify-between font-mono text-[10px] text-slate-400 mb-1.5">
                              <span>Abschluss:</span>
                              <span className="font-bold text-white">{pct}%</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-white/10 shadow-inner">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  claimed ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : unlocked ? 'bg-amber-400 shadow-sm shadow-amber-400/50' : 'bg-slate-700'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>

                          {/* Rewards & Action */}
                          <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/10">
                            <div className="font-mono text-[11px] font-bold text-emerald-400">
                              +{ach.rewardNAT} NAT · +{ach.rewardReputation} RUF
                            </div>

                            <div>
                              {claimed ? (
                                <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-emerald-400">
                                  <Check className="w-4 h-4 shrink-0" />
                                  <span>Erreicht</span>
                                </span>
                              ) : unlocked ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    soundFx.playRewardClaim();
                                    onClaimAchievement(ach.id);
                                  }}
                                  className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-mono text-xs font-black uppercase tracking-wider shadow-md shadow-amber-400/30 cursor-pointer transition-all duration-150 active:scale-[0.98]"
                                >
                                  Einlösen
                                </button>
                              ) : (
                                <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                                  Gesperrt
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
