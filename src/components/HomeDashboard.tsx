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
    <div className="relative min-h-[calc(100vh-4rem)] w-full overflow-hidden bg-slate-950 text-slate-100 pb-20">
      {/* Background Tactical Grid & Ambient Atmospheric Glows */}
      <div className="absolute inset-0 tactical-grid opacity-35 pointer-events-none" aria-hidden="true" />
      <div
        className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-amber-500/10 blur-[120px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute top-1/3 -right-40 w-96 h-96 rounded-full bg-cyan-500/10 blur-[130px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-10 left-1/4 w-[500px] h-[300px] rounded-full bg-purple-500/5 blur-[140px] pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-10">
        
        {/* ========================================================================= */}
        {/* TOP STATUS BAR & TELEMETRY TICKER                                         */}
        {/* ========================================================================= */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono uppercase tracking-wider text-slate-400 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              BÜRGERWEHR-RADAR ONLINE
            </span>
            <span className="hidden sm:inline text-slate-500">//</span>
            <span className="text-amber-400/90 font-bold hidden sm:inline">
              [SEKTOR 61267] HOCHTAUNUS-VERTEIDIGUNG
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <div className="hidden md:flex items-center gap-1.5 text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>{playerCity}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Befehl-Reset: <span className="text-cyan-300 font-bold">{resetTimer}</span></span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 1: EPIC HERO & COMBAT OPERATOR DOSSIER GRID                       */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* LEFT 7 COLS: HERO COMBAT HUB */}
          <div className="lg:col-span-7 flex flex-col justify-between rounded-3xl p-6 sm:p-8 tactical-glass border border-slate-700/60 shadow-2xl relative overflow-hidden hud-corners-amber">
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-amber-500/15 via-transparent to-transparent pointer-events-none" />

            {/* Tactical Sector Badge */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold uppercase tracking-widest mb-4">
                <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Einsatzraum: {activeArenaConfig.name.replace(' (Reworked)', '')}</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-6xl font-black tracking-tight uppercase leading-none text-white">
                <span>Hessenpark</span>
                <span className="block mt-1 metallic-gold text-glow-amber">
                  Battle Royale
                </span>
              </h1>

              {/* Tactical Subtitle & Briefing */}
              <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-300 max-w-2xl">
                Wehrheimer Stoßtrupps rücken über den Laubweg und das Freilichtmuseum vor. 
                Rüste deinen Operator in der Waffenschmiede auf, aktiviere mächtige Skilltree-Perks und verteidige Neu-Anspach in 7 überarbeiteten Einsatzgebieten.
              </p>

              {/* Tactical Arena Threat Pill */}
              <div className="mt-4 inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono text-slate-300">
                <Activity className="w-4 h-4 text-amber-400" />
                <span>Aktives Gebiet: <strong className="text-white">{activeArenaConfig.district}</strong></span>
                <span className="text-slate-600">·</span>
                <span className="text-amber-400 font-bold">{botScaling.threatTitle}</span>
              </div>
            </div>

            {/* High-Impact Combat CTAs */}
            <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={handleDeployQuick}
                className="group relative flex-1 inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 px-7 py-4 text-slate-950 font-black text-base uppercase tracking-wider shadow-lg shadow-amber-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer hud-chamfer"
              >
                <Crosshair className="w-5 h-5 text-slate-950 group-hover:rotate-45 transition-transform duration-300" />
                <span>{effectiveMobileMode ? 'Taktik-Zentrale öffnen' : 'In die Schlacht'}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={onOpenDailyMissionsModal}
                className="relative inline-flex items-center justify-center gap-2 px-5 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-slate-700/80 hover:border-amber-400/50 font-mono text-xs font-bold uppercase tracking-wider text-slate-200 transition-all cursor-pointer shadow"
              >
                <Target className="w-4 h-4 text-amber-400" />
                <span>Tagesbefehle</span>
                <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
                  unclaimedMissionsCount > 0
                    ? 'bg-amber-400 text-slate-950 animate-pulse'
                    : 'bg-slate-800 text-slate-300'
                }`}>
                  {completedMissionsCount}/{dailyMissionsState.missions.length}
                </span>
              </button>

              {canClaimDailyLogin && (
                <button
                  type="button"
                  onClick={onClaimDailyLoginBonus}
                  className="inline-flex items-center justify-center gap-2 px-4 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-mono text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all cursor-pointer animate-glow-pulse-emerald"
                  title="Täglicher Bürgerwehr-Loginbonus bereit!"
                >
                  <Gift className="w-4 h-4" />
                  <span>Login-Bonus</span>
                </button>
              )}
            </div>

            {/* Quick Navigation Pills */}
            <div className="mt-5 pt-4 border-t border-slate-800/60 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  soundFx.playUiClick();
                  onOpenTab('gunsmith');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-600 font-mono text-[11px] font-bold text-slate-300 hover:text-white transition cursor-pointer"
              >
                <Wrench className="w-3.5 h-3.5 text-amber-400" />
                <span>Waffenschmiede</span>
                <span className="text-[10px] text-amber-300 font-normal">({primaryWeaponStats.displayName})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFx.playUiClick();
                  onOpenTab('skilltree');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-600 font-mono text-[11px] font-bold text-slate-300 hover:text-white transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Skilltree</span>
                {skillPoints > 0 && (
                  <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-black text-[10px] border border-cyan-500/40 animate-pulse">
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-600 font-mono text-[11px] font-bold text-slate-300 hover:text-white transition cursor-pointer"
              >
                <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                <span>Rangliste</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFx.playUiClick();
                  onOpenTab('tycoon');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-600 font-mono text-[11px] font-bold text-slate-300 hover:text-white transition cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tycoon-Zentrale</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFx.playUiClick();
                  onOpenTab('clan');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-600 font-mono text-[11px] font-bold text-slate-300 hover:text-white transition cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-purple-400" />
                <span>Clan-HQ</span>
              </button>
            </div>

            {/* Tactical Controls HUD Guide */}
            <div className="mt-4 pt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
              {effectiveMobileMode ? (
                <span className="text-amber-400/90 font-bold">
                  📱 Handy-Modus aktiv: Taktik-Zentrale & Waffenverwaltung. Für den 3D-Shooter wechsle an den PC.
                </span>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Tastenbelegung:</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">WASD</span>
                  <span>Bewegen</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">Maus</span>
                  <span>Zielen / Feuern</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">Leertaste</span>
                  <span>Sprung</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-300 font-bold">[Q/E/F]</span>
                  <span>Taktik-Fähigkeiten</span>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT 5 COLS: OPERATOR COMBAT DOSSIER */}
          <div className="lg:col-span-5 flex flex-col justify-between rounded-3xl p-6 tactical-glass-amber border border-amber-500/30 shadow-2xl relative overflow-hidden hud-corners-cyan">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-3xl pointer-events-none" />

            {/* Dossier Header */}
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="font-mono text-xs font-black uppercase tracking-widest text-cyan-300">
                    OPERATOR DOSSIER // 61267
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onOpenProfileModal}
                  className="font-mono text-[10px] font-bold text-slate-400 hover:text-amber-300 flex items-center gap-1 transition cursor-pointer"
                >
                  <User className="w-3 h-3" />
                  <span>Profil ändern</span>
                </button>
              </div>

              {/* Operator Identity & Callsign */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 font-mono text-xs font-black text-amber-400">
                      [{clanTag}]
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      {playerName}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 font-mono">
                    <span className="text-emerald-400 font-bold">● Aktiv im Einsatz</span>
                    <span>·</span>
                    <span>{playerCity}</span>
                  </div>
                </div>

                {/* Operator Rank Badge */}
                <div className={`px-3 py-1.5 rounded-xl border text-right font-mono ${repRank.badgeColor}`}>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rang {repRank.rank}</div>
                  <div className="text-xs font-black">{repRank.title}</div>
                </div>
              </div>

              {/* Reputation Progress Bar */}
              <div className="mt-4 p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>Operator-Ruf:</span>
                  </span>
                  <span className="text-amber-300 font-black">{reputation} RUF</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500"
                    style={{ width: `${rankProgressPct}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 mt-1">
                  <span>{repRank.title}</span>
                  <span>{nextRank ? `Nächster Rang: ${nextRank.title} (${pointsForNext - pointsInRank} Pkt)` : 'MAX RANG'}</span>
                </div>
              </div>

              {/* Combat Telemetry Badges Grid */}
              <div className="mt-4 grid grid-cols-2 gap-2.5 font-mono">
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-[10px] uppercase text-slate-400">Einsatz-Siege</div>
                  <div className="text-lg font-black text-amber-400 flex items-center gap-1 mt-0.5">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>{totalWins}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-[10px] uppercase text-slate-400">Abschüsse (Kills)</div>
                  <div className="text-lg font-black text-emerald-400 flex items-center gap-1 mt-0.5">
                    <Flame className="w-4 h-4 text-emerald-400" />
                    <span>{careerStats.totalKills}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-[10px] uppercase text-slate-400">Kriegskasse</div>
                  <div className="text-lg font-black text-yellow-400 flex items-center gap-1 mt-0.5">
                    <Coins className="w-4 h-4 text-yellow-400" />
                    <span>{budget.toLocaleString('de-DE')} ₳</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-[10px] uppercase text-slate-400">Skill-Punkte</div>
                  <div className="text-lg font-black text-cyan-400 flex items-center gap-1 mt-0.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>{skillPoints} SP</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Equipped Weapon Profile */}
            <div className="mt-4 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Sword className="w-3.5 h-3.5 text-amber-400" />
                  <span>Aktive Bewaffnung:</span>
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${weaponRarity.badgeClass}`}>
                  {weaponRarity.name}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-black text-white truncate">
                    {primaryWeaponStats.displayName}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2 mt-0.5">
                    <span className="text-amber-400 font-bold">Waffen-Stufe {primaryWeaponStats.weaponLevel}/{MAX_WEAPON_LEVEL}</span>
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
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 font-mono text-[10px] font-black uppercase text-amber-300 hover:text-white transition shrink-0 cursor-pointer"
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
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-amber-400" />
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
                  Einsatzgebiete // Quick-Deploy Deck
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Wähle dein Einsatzgebiet im Hochtaunus. Jede Arena bietet einzigartige Deckungen, Aussichtspunkte und Bot-Skalierungen.
              </p>
            </div>

            <div className="font-mono text-xs text-slate-400 flex items-center gap-2">
              <span className="text-amber-400 font-bold">{effectiveUnlockedList.length} von 7</span>
              <span>Gebieten gesichert</span>
            </div>
          </div>

          {/* Arena Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  className={`group relative flex flex-col justify-between rounded-2xl p-4 transition-all duration-200 border cursor-pointer ${
                    isActive
                      ? 'border-amber-400 bg-amber-950/20 shadow-lg shadow-amber-500/15 ring-1 ring-amber-400/50'
                      : isUnlocked
                      ? 'border-slate-800 bg-slate-900/70 hover:border-slate-600 hover:bg-slate-850'
                      : 'border-slate-850 bg-slate-950/60 opacity-70'
                  }`}
                >
                  {/* Top Bar with Atmosphere & Unlock Badge */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2 font-mono text-[10px]">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800/80 text-cyan-300 font-bold border border-slate-700/80">
                        {arena.atmosphere?.isNight ? (
                          <Moon className="w-3 h-3 text-cyan-400" />
                        ) : (
                          <Sun className="w-3 h-3 text-amber-400" />
                        )}
                        <span>{arena.atmosphere?.timeOfDay || 'Tagsüber'}</span>
                      </span>

                      {isActive ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] uppercase tracking-wider animate-pulse">
                          Gewählt
                        </span>
                      ) : isUnlocked ? (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 font-bold text-[9px]">
                          Map-Stufe {mapLv}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-bold text-[9px]">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Gesperrt</span>
                        </span>
                      )}
                    </div>

                    {/* Arena Title & Subtitle */}
                    <h3 className="font-black text-base text-white tracking-tight group-hover:text-amber-300 transition-colors">
                      {arena.name.replace(' (Reworked)', '')}
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-snug line-clamp-2 mt-1">
                      {arena.subtitle}
                    </p>
                  </div>

                  {/* Threat Level & Action */}
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <div className="font-mono text-[10px] text-slate-400">
                      <div className="text-amber-400/90 font-bold">{scaling.threatTitle}</div>
                      <div className="text-[9px] text-slate-500">{arena.district}</div>
                    </div>

                    <div>
                      {isUnlocked ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLaunchSpecificArena(arena.id);
                          }}
                          className={`px-3 py-1.5 rounded-xl font-mono text-[10px] font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1 ${
                            isActive
                              ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow'
                              : 'bg-slate-800 hover:bg-amber-400 hover:text-slate-950 text-slate-200 border border-slate-700'
                          }`}
                        >
                          <span>{isActive ? 'Starten' : 'Wählen'}</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      ) : (
                        onUnlockMap && unlockCost > 0 && budget >= unlockCost ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUnlockMap(arena.id, unlockCost);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 hover:text-slate-950 border border-amber-500/40 font-mono text-[10px] font-black text-amber-300 transition cursor-pointer"
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-400" />
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
                  Tagesbefehle & Bürgerwehr-Errungenschaften
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Erfülle deine täglichen Befehle für sofortige NAT-Taler & RUF und meistere die lebenslangen Taunus-Erfolge.
              </p>
            </div>

            {/* Sub-tab pills */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800 font-mono text-xs">
              <button
                type="button"
                onClick={() => setActiveSubTab('all')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  activeSubTab === 'all'
                    ? 'bg-amber-400 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Alle anzeigen
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('missions')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeSubTab === 'missions'
                    ? 'bg-amber-400 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Tagesbefehle</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
                  {completedMissionsCount}/{dailyMissionsState.missions.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('achievements')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  activeSubTab === 'achievements'
                    ? 'bg-amber-400 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Errungenschaften ({careerStats.claimedAchievements.length}/{ACHIEVEMENTS_LIST.length})
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

              {/* Daily Mission Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {dailyMissionsState.missions.map((mission) => {
                  const pct = Math.min(
                    100,
                    Math.round((mission.currentProgress / mission.targetCount) * 100)
                  );

                  return (
                    <div
                      key={mission.id}
                      className={`relative flex flex-col justify-between rounded-2xl p-5 border transition-all ${
                        mission.claimed
                          ? 'border-emerald-500/30 bg-emerald-950/15'
                          : mission.completed
                          ? 'border-amber-400 bg-amber-500/15 shadow-lg shadow-amber-500/15 animate-glow-pulse-amber'
                          : 'border-slate-800 bg-slate-900/70'
                      }`}
                    >
                      <div>
                        {/* Top tag: difficulty & category */}
                        <div className="flex items-center justify-between gap-2 mb-2 font-mono text-[10px]">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-bold uppercase tracking-wider">
                            {mission.badge}
                          </span>
                          <span className={`px-2 py-0.5 rounded font-bold uppercase ${
                            mission.difficulty === 'heroisch'
                              ? 'bg-purple-950 text-purple-400 border border-purple-500/30'
                              : mission.difficulty === 'schwer'
                              ? 'bg-red-950 text-red-400 border border-red-500/30'
                              : 'bg-slate-800 text-slate-300'
                          }`}>
                            {mission.difficulty}
                          </span>
                        </div>

                        {/* Title and Description */}
                        <h4 className="font-black text-white text-base tracking-tight">
                          {mission.title}
                        </h4>
                        <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                          {mission.description}
                        </p>
                      </div>

                      {/* Progress Bar & Rewards */}
                      <div className="mt-5 space-y-3">
                        <div>
                          <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                            <span className="text-slate-400">Fortschritt:</span>
                            <span className="text-white font-bold">
                              {mission.currentProgress} / {mission.targetCount}
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                            <div
                              className={`h-full transition-all duration-300 ${
                                mission.completed ? 'bg-emerald-400' : 'bg-amber-400'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>

                        {/* Rewards & Claim CTA */}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                          <div className="font-mono text-[11px] font-bold text-emerald-400">
                            +{mission.rewardNAT} NAT · +{mission.rewardReputation} RUF
                          </div>

                          <div>
                            {mission.claimed ? (
                              <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-emerald-400">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Eingelöst</span>
                              </span>
                            ) : mission.completed ? (
                              <button
                                type="button"
                                onClick={() => {
                                  soundFx.playRewardClaim();
                                  onClaimDailyMission(mission.id);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-mono text-xs font-black uppercase tracking-wider shadow cursor-pointer transition transform active:scale-95"
                              >
                                Einfordern
                              </button>
                            ) : (
                              <span className="font-mono text-[10px] text-slate-500 uppercase">
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

              {/* Grand Daily Bonus Banner */}
              {allMissionsFinished && !dailyMissionsState.grandBonusClaimed && (
                <div className="rounded-2xl p-5 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border-2 border-amber-400 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-glow-pulse-amber">
                  <div className="flex items-center gap-4 text-center sm:text-left">
                    <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-2xl shrink-0 shadow">
                      🏆
                    </div>
                    <div>
                      <div className="font-mono text-xs font-black uppercase tracking-wider text-amber-300">
                        ALLE TAGESBEFEHLE ERFÜLLT!
                      </div>
                      <div className="font-bold text-white text-base">
                        Großer Bürgerwehr-Tagesbonus freigeschaltet
                      </div>
                      <div className="text-xs font-mono text-emerald-400 mt-0.5">
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
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-mono text-xs font-black uppercase tracking-wider shadow-lg transition active:scale-95 cursor-pointer shrink-0"
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

              {/* ACHIEVEMENTS GRID: Spacious cards that never truncate! */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ACHIEVEMENTS_LIST.map((ach) => {
                  const unlocked = ach.checkUnlocked(careerStats);
                  const claimed = careerStats.claimedAchievements.includes(ach.id);
                  const progText = ach.progressText(careerStats);
                  const { current, target } = ach.getProgress(careerStats);
                  const pct = Math.min(100, Math.round((current / target) * 100));

                  return (
                    <div
                      key={ach.id}
                      className={`relative flex flex-col justify-between rounded-2xl p-5 border transition-all ${
                        claimed
                          ? 'border-emerald-500/30 bg-emerald-950/15'
                          : unlocked
                          ? 'border-amber-400 bg-amber-500/15 shadow-lg shadow-amber-500/15 animate-glow-pulse-amber'
                          : 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        {/* Status Icon & Ratio Header */}
                        <div className="flex items-center justify-between gap-2 mb-2 font-mono text-[10px]">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-bold">
                            <Star className="w-3 h-3 text-amber-400" />
                            <span>{progText}</span>
                          </span>

                          {claimed ? (
                            <span className="inline-flex items-center gap-1 font-bold text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Gemeistert</span>
                            </span>
                          ) : unlocked ? (
                            <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-[9px] uppercase tracking-wider animate-pulse">
                              Bereit
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-500 font-bold">
                              <Lock className="w-3 h-3" />
                              <span>Gesperrt</span>
                            </span>
                          )}
                        </div>

                        {/* Title & Description with NO truncation */}
                        <h4 className="font-black text-white text-base tracking-tight">
                          {ach.title}
                        </h4>
                        <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                          {ach.description}
                        </p>
                      </div>

                      {/* Progress Bar & Rewards */}
                      <div className="mt-5 space-y-3">
                        <div>
                          <div className="flex items-center justify-between font-mono text-[10px] text-slate-400 mb-1">
                            <span>Abschluss:</span>
                            <span className="font-bold text-white">{pct}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                            <div
                              className={`h-full transition-all duration-300 ${
                                claimed ? 'bg-emerald-400' : unlocked ? 'bg-amber-400' : 'bg-slate-700'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>

                        {/* Rewards & Action */}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                          <div className="font-mono text-[11px] font-bold text-emerald-400">
                            +{ach.rewardNAT} NAT · +{ach.rewardReputation} RUF
                          </div>

                          <div>
                            {claimed ? (
                              <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-emerald-400">
                                <Check className="w-4 h-4" />
                                <span>Erreicht</span>
                              </span>
                            ) : unlocked ? (
                              <button
                                type="button"
                                onClick={() => {
                                  soundFx.playRewardClaim();
                                  onClaimAchievement(ach.id);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-mono text-xs font-black uppercase tracking-wider shadow cursor-pointer transition transform active:scale-95"
                              >
                                Einlösen
                              </button>
                            ) : (
                              <span className="font-mono text-[10px] text-slate-600 uppercase">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
