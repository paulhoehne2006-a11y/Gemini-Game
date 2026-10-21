import React, { useState } from 'react';
import {
  WEAPONS,
  COLD_WAR_RARITIES,
  PACK_A_PUNCH_TIERS,
  GUNSMITH_CATALOG,
  WEAPON_MASTERY_CAMOS,
  MAX_WEAPON_LEVEL,
  getWeaponLevelTrainCostNAT,
  getEffectiveWeaponStats,
} from '../game/weapons';
import { AllWeaponsUpgrades, AttachmentType } from '../types';
import {
  Crosshair,
  Flame,
  Zap,
  Shield,
  CheckCircle2,
  ArrowUpRight,
  Coins,
  Wrench,
  Sparkles,
  Award,
  Lock,
  X,
  Volume2,
  Activity,
  Layers,
  ChevronRight,
  Gauge,
  Target,
} from 'lucide-react';
import { soundFx } from '../audio/soundFx';

interface GunsmithViewProps {
  budget: number;
  weaponUpgrades: AllWeaponsUpgrades;
  activeWeaponId: string;
  onSelectWeapon: (weaponId: string) => void;
  onUpgradeAttachment: (weaponId: string, slot: AttachmentType, targetLevel: number, cost: number) => void;
  onUpgradeRarity: (weaponId: string, targetTier: number, cost: number) => void;
  onUpgradePackAPunch: (weaponId: string, targetLevel: number, cost: number) => void;
  onTrainWeaponLevel?: (weaponId: string, levelsToAdd: number, costNAT: number) => void;
  onSelectWeaponMastery?: (weaponId: string, masteryId: string) => void;
  onClose?: () => void;
}

export const GunsmithView: React.FC<GunsmithViewProps> = ({
  budget,
  weaponUpgrades,
  activeWeaponId,
  onSelectWeapon,
  onUpgradeAttachment,
  onUpgradeRarity,
  onUpgradePackAPunch,
  onTrainWeaponLevel,
  onSelectWeaponMastery,
  onClose,
}) => {
  const [selectedWeaponId, setSelectedWeaponId] = useState<string>(activeWeaponId || 'bembel');
  const weapon = WEAPONS[selectedWeaponId] || WEAPONS.bembel;
  const currentState = weaponUpgrades[selectedWeaponId] || {
    rarityTier: 1,
    papLevel: 0,
    attachments: { scope: 0, barrel: 0, bolt: 0, mag: 0, stock: 0 },
    weaponLevel: 1,
    weaponXp: 0,
    masteryId: 'standard',
  };

  const stats = getEffectiveWeaponStats(weapon, currentState);
  const nextRarity = COLD_WAR_RARITIES.find((r) => r.tier === currentState.rarityTier + 1);
  const nextPap = PACK_A_PUNCH_TIERS.find((p) => p.level === currentState.papLevel + 1);

  const train1Cost = getWeaponLevelTrainCostNAT(stats.weaponLevel);
  const remainingLevels = Math.max(0, MAX_WEAPON_LEVEL - stats.weaponLevel);
  const bulkCount = Math.min(5, remainingLevels);
  const trainBulkCost = Array.from({ length: bulkCount }).reduce<number>(
    (acc, _, idx) => acc + getWeaponLevelTrainCostNAT(stats.weaponLevel + idx),
    0
  );

  const handleSelectWeaponTab = (id: string) => {
    setSelectedWeaponId(id);
    onSelectWeapon(id);
    soundFx.playShoot();
  };

  const getSlotIcon = (slot: AttachmentType) => {
    switch (slot) {
      case 'scope':
        return Target;
      case 'barrel':
        return Flame;
      case 'bolt':
        return Zap;
      case 'mag':
        return Layers;
      case 'stock':
        return Shield;
      default:
        return Wrench;
    }
  };

  return (
    <div className="w-full min-h-full bg-slate-950 text-slate-100 p-3 sm:p-6 pb-28 lg:pb-12">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header - Dark Obsidian Glassmorphism with Tactical Accents */}
        <header className="relative overflow-hidden rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-700/60 p-5 sm:p-6 shadow-2xl">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

          {/* Tactical Corner Marks */}
          <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-amber-500/40 pointer-events-none" />
          <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-amber-500/40 pointer-events-none" />
          <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-amber-500/40 pointer-events-none" />
          <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-amber-500/40 pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 border border-amber-500/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                  [SYSTEM: ARSENAL V5.2]
                </span>
                <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider bg-slate-800/80 border border-slate-700 text-slate-300">
                  WAFFENSCHMIEDE & PACK-A-PUNCH
                </span>
                <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider bg-purple-500/15 border border-purple-500/40 text-purple-300">
                  TAUNUS-MODIFIKATION
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
                <span>Waffen-Arsenal & Meisterschaft</span>
                <span className="text-xs font-mono font-normal px-2.5 py-1 rounded-md bg-slate-800/90 text-amber-400 border border-slate-700">
                  {stats.displayName}
                </span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                Rüste deine Waffe mit 5 individuellen CoD-Gunsmith-Aufsätzen aus, maximiere dein Waffen-Level bis Stufe 30 für +90% Bonusschaden und schalte exklusive 3D-Meisterschafts-Camos & Pack-a-Punch Plasma frei.
              </p>
            </div>

            <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
              {/* Budget Badge with Radiant Amber Glow */}
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-950/90 border border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.15)] font-mono">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-amber-400/80 uppercase tracking-wider font-semibold">
                    Verfügbare Taler
                  </div>
                  <div className="text-lg font-black text-amber-300 tabular-nums">
                    {budget.toLocaleString('de-DE')} <span className="text-xs text-amber-400/70">NAT</span>
                  </div>
                </div>
              </div>

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <X className="w-4 h-4 stroke-[3]" />
                  <span className="hidden sm:inline">Gefecht</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* 4 Weapon Selector Deck - Sleek Tactical Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Object.values(WEAPONS).map((w) => {
            const wState = weaponUpgrades[w.id] || {
              rarityTier: 1,
              papLevel: 0,
              attachments: { scope: 0, barrel: 0, bolt: 0, mag: 0, stock: 0 },
              weaponLevel: 1,
              weaponXp: 0,
              masteryId: 'standard',
            };
            const wStats = getEffectiveWeaponStats(w, wState);
            const isSelected = selectedWeaponId === w.id;
            const xpPct =
              wStats.weaponLevel >= MAX_WEAPON_LEVEL
                ? 100
                : Math.min(100, Math.round((wStats.weaponXp / wStats.nextLevelXp) * 100));

            return (
              <button
                key={w.id}
                type="button"
                onClick={() => handleSelectWeaponTab(w.id)}
                className={`relative p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer overflow-hidden ${
                  isSelected
                    ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/60'
                    : 'bg-slate-900/70 hover:bg-slate-900/90 border-slate-700/60 hover:border-slate-600'
                }`}
              >
                {/* Active Indicator Strip */}
                {isSelected && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
                )}

                <div className="flex items-center justify-between text-[10px] font-mono mb-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black">
                    LV. {wStats.weaponLevel}/{MAX_WEAPON_LEVEL}
                  </span>
                  {wState.papLevel > 0 ? (
                    <span className="px-1.5 py-0.5 rounded bg-fuchsia-500/20 border border-fuchsia-500/50 text-fuchsia-300 font-bold shadow-[0_0_8px_rgba(217,70,239,0.3)]">
                      PaP {wState.papLevel}
                    </span>
                  ) : (
                    <span
                      className="px-1.5 py-0.5 rounded font-bold"
                      style={{ color: wStats.rarityObj.colorHex }}
                    >
                      {wStats.rarityObj.codLabel}
                    </span>
                  )}
                </div>

                <div className="text-sm font-black text-white truncate tracking-tight">{wStats.displayName}</div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5 flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: wStats.activeMastery.colorHex }}
                  />
                  <span className="truncate">{wStats.activeMastery.name}</span>
                </div>

                {/* Progress Mini Bar */}
                <div className="w-full h-1.5 rounded-full bg-slate-950 border border-slate-800 overflow-hidden mt-3">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-300 shadow-[0_0_6px_rgba(245,158,11,0.5)]"
                    style={{ width: `${xpPct}%` }}
                  />
                </div>

                <div className="mt-2.5 flex items-center justify-between text-xs font-mono">
                  <span className="text-amber-400 font-bold tabular-nums flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-500" />
                    {wStats.damage} DMG
                  </span>
                  <span className="text-sky-400 font-bold tabular-nums flex items-center gap-1">
                    <Zap className="w-3 h-3 text-sky-400" />
                    {wStats.fireRate}/s
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* WEAPON LEVEL & MASTERY CAMO FORGE PANEL */}
        <section className="relative rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-purple-950/25 border border-amber-500/35 p-5 sm:p-6 shadow-2xl backdrop-blur-md space-y-5">
          {/* Subtle Cyber Corner Accents */}
          <div className="absolute top-2 left-2 w-2.5 h-2.5 border-t-2 border-l-2 border-amber-500/50" />
          <div className="absolute top-2 right-2 w-2.5 h-2.5 border-t-2 border-r-2 border-amber-500/50" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">
                <Award className="w-4 h-4 text-amber-400" />
                <span>WAFFEN-LEVEL & MEISTERSCHAFTS-FORGE · {stats.displayName}</span>
              </div>

              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-black text-white font-mono tabular-nums tracking-tight">
                  STUFE {stats.weaponLevel}{' '}
                  <span className="text-sm sm:text-base text-slate-400 font-normal">/ {MAX_WEAPON_LEVEL}</span>
                </span>
                <span className="px-3 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                  +{stats.levelDamageBonusPct}% Schaden · +{stats.levelReloadBonusPct}% Nachladetempo · +{stats.bonusMagCapacity} Magazin-Schuss
                </span>
              </div>

              {/* XP Progression Bar with Glowing Head */}
              <div className="max-w-2xl pt-1 space-y-1.5">
                <div className="flex justify-between text-xs font-mono text-slate-300">
                  <span className="text-[11px] text-slate-400">
                    {stats.weaponLevel >= MAX_WEAPON_LEVEL
                      ? '[PRESTIGE STATUS: MAXIMALES WAFFEN-LEVEL ERREICHT]'
                      : 'Waffen-Erfahrung (Kills, Crits & Wellenabschlüsse)'}
                  </span>
                  <span className="text-amber-400 font-bold tabular-nums">
                    {stats.weaponXp} / {stats.nextLevelXp} W-XP
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-950 border border-slate-700/80 p-0.5 overflow-hidden shadow-inner">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 transition-all duration-300 shadow-[0_0_12px_rgba(245,158,11,0.6)]"
                    style={{
                      width: `${
                        stats.weaponLevel >= MAX_WEAPON_LEVEL
                          ? 100
                          : Math.min(100, (stats.weaponXp / stats.nextLevelXp) * 100)
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Direct NAT Weapon Level Up Training Buttons */}
            {onTrainWeaponLevel && stats.weaponLevel < MAX_WEAPON_LEVEL && (
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <button
                  type="button"
                  disabled={budget < train1Cost}
                  onClick={() => {
                    soundFx.playLevelUp();
                    onTrainWeaponLevel(selectedWeaponId, 1, train1Cost);
                  }}
                  className={`px-4 py-3 rounded-xl font-mono font-black text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
                    budget >= train1Cost
                      ? 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:scale-105 active:scale-95'
                      : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4 stroke-[3]" />
                  <span>+1 Level ({train1Cost} NAT)</span>
                </button>

                {bulkCount > 1 && (
                  <button
                    type="button"
                    disabled={budget < trainBulkCost}
                    onClick={() => {
                      soundFx.playLevelUp();
                      onTrainWeaponLevel(selectedWeaponId, bulkCount, trainBulkCost);
                    }}
                    className={`px-4 py-3 rounded-xl font-mono font-black text-xs flex items-center gap-2 transition-all cursor-pointer border ${
                      budget >= trainBulkCost
                        ? 'bg-gradient-to-r from-purple-600/30 to-fuchsia-600/30 hover:from-purple-600/40 hover:to-fuchsia-600/40 text-purple-200 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:scale-105 active:scale-95'
                        : 'bg-slate-900/60 text-slate-600 border-slate-800 cursor-not-allowed'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-purple-300" />
                    <span>+{bulkCount} Level Boost ({trainBulkCost} NAT)</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 6 Mastery Camo Skins Grid with Holographic Shimmer Borders */}
          <div className="pt-4 border-t border-slate-800/80">
            <div className="text-[11px] font-mono text-slate-400 uppercase mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                3D-Meisterschafts-Tarnungen (Durch Waffen-Level freigeschaltet):
              </span>
              <span className="text-amber-300 font-bold px-2 py-0.5 rounded bg-slate-950 border border-amber-500/30">
                Aktiv montiert: {stats.activeMastery.name}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {WEAPON_MASTERY_CAMOS.map((camo) => {
                const isUnlocked = stats.weaponLevel >= camo.requiredLevel;
                const isEquipped = stats.activeMastery.id === camo.id;

                return (
                  <button
                    key={camo.id}
                    type="button"
                    disabled={!isUnlocked}
                    onClick={() => {
                      if (isUnlocked && onSelectWeaponMastery) {
                        soundFx.playShoot();
                        onSelectWeaponMastery(selectedWeaponId, camo.id);
                      }
                    }}
                    className={`relative p-3.5 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between overflow-hidden ${
                      isEquipped
                        ? 'bg-slate-950 border-amber-400 ring-2 ring-amber-400/50 shadow-[0_0_20px_rgba(245,158,11,0.3)] cursor-pointer'
                        : isUnlocked
                        ? 'bg-slate-950/80 hover:bg-slate-950 border-slate-700 hover:border-slate-500 hover:shadow-lg cursor-pointer'
                        : 'bg-slate-950/40 border-slate-800/60 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    {/* Holographic Top Accent Line */}
                    <div
                      className="absolute top-0 left-0 right-0 h-1 transition-opacity"
                      style={{
                        backgroundColor: camo.colorHex,
                        boxShadow: isEquipped ? `0 0 10px ${camo.colorHex}` : 'none',
                      }}
                    />

                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono mb-2">
                        <span className="flex items-center gap-1.5 font-bold" style={{ color: camo.colorHex }}>
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block shadow-sm"
                            style={{
                              backgroundColor: camo.colorHex,
                              boxShadow: `0 0 8px ${camo.colorHex}`,
                            }}
                          />
                          Lv. {camo.requiredLevel}
                        </span>
                        {isEquipped ? (
                          <CheckCircle2 className="w-4 h-4 text-amber-400" />
                        ) : !isUnlocked ? (
                          <Lock className="w-3.5 h-3.5 text-slate-500" />
                        ) : (
                          <span className="text-[9px] font-mono text-emerald-400">READY</span>
                        )}
                      </div>

                      <div className="text-xs font-black text-white leading-tight">{camo.name}</div>
                      <div className="text-[10px] text-slate-400 mt-1 leading-snug line-clamp-2">
                        {camo.subtitle}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/60 text-[10px] font-mono">
                      {isEquipped ? (
                        <span className="text-amber-400 font-bold">[MONTIERT]</span>
                      ) : isUnlocked ? (
                        <span className="text-slate-400 hover:text-white flex items-center gap-0.5">
                          Ausrüsten <ChevronRight className="w-3 h-3" />
                        </span>
                      ) : (
                        <span className="text-slate-500">Gesperrt</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Main Weapon Overview + Cold War Rarity & Pack-a-Punch Row (3 Columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Live Weapon Telemetry Deck & Stat Comparison Bars */}
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-700/60 shadow-2xl flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  LIVE-TELEMETRIE & BALLISTIK
                </span>
                <span
                  style={{ color: stats.rarityObj.colorHex }}
                  className="font-bold px-2 py-0.5 rounded bg-slate-950 border border-slate-800"
                >
                  {stats.rarityObj.name}
                </span>
              </div>

              <h2 className="text-2xl font-black text-white tracking-tight">{stats.displayName}</h2>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{weapon.description}</p>

              {/* Glowing Weapon Stat Comparison Bars */}
              <div className="mt-6 space-y-4 font-mono text-xs">
                {/* 1. Firepower (Damage) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      FEUERKRAFT (SCHADEN)
                    </span>
                    <span className="text-amber-400 font-black tabular-nums text-sm">
                      {stats.damage} DMG
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-950 border border-slate-800 p-0.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                      style={{ width: `${Math.min(100, (stats.damage / 260) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* 2. Fire Rate (Kadenz) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-sky-400" />
                      FEUERRATE (KADENZ)
                    </span>
                    <span className="text-sky-400 font-black tabular-nums text-sm">
                      {stats.fireRate} Schuss/s
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-950 border border-slate-800 p-0.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-300 shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                      style={{ width: `${Math.min(100, (stats.fireRate / 18) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* 3. Bullet Speed (Mündungsgeschwindigkeit) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                      GESCHOSSTEMPO (MÜNDUNG)
                    </span>
                    <span className="text-emerald-400 font-black tabular-nums text-sm">
                      {stats.bulletSpeed} m/s
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-950 border border-slate-800 p-0.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                      style={{ width: `${Math.min(100, (stats.bulletSpeed / 280) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* 4. Crit Chance & Splash */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <Crosshair className="w-3.5 h-3.5 text-purple-400" />
                      KRIT-CHANCE & SPLITTER
                    </span>
                    <span className="text-purple-400 font-black tabular-nums text-sm">
                      {stats.critChancePct}% Krit · {stats.splashRadius}m
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-950 border border-slate-800 p-0.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-400 transition-all duration-300 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                      style={{ width: `${Math.min(100, stats.critChancePct * 1.4)}%` }}
                    />
                  </div>
                </div>

                {/* 5. Mobility & ADS */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-cyan-400" />
                      MOBILITÄT & ZIELGESCHWINDIGKEIT
                    </span>
                    <span className="text-cyan-400 font-black tabular-nums text-sm">
                      +{stats.moveBonusPct}% Tempo
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-950 border border-slate-800 p-0.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-400 transition-all duration-300 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                      style={{ width: `${Math.min(100, 35 + stats.moveBonusPct * 3.5)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-800/80">
              {/* DPS Callout Badge */}
              <div className="p-3.5 rounded-xl bg-slate-950/90 border border-amber-500/35 text-xs font-mono flex items-center justify-between shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                <span className="text-slate-400 font-semibold uppercase tracking-wider">
                  Effektiver Schaden (DPS):
                </span>
                <span className="text-lg font-black text-amber-300 tabular-nums">
                  {Math.round(stats.damage * stats.fireRate)} DMG/s
                </span>
              </div>

              {/* Tracer Caliber Callout */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono text-slate-300 flex items-center justify-between">
                <span>Leuchtspur-Kaliber:</span>
                <span className="font-bold flex items-center gap-1.5" style={{ color: stats.tracerColor }}>
                  <span
                    className="w-2 h-2 rounded-full inline-block shadow-sm"
                    style={{ backgroundColor: stats.tracerColor, boxShadow: `0 0 8px ${stats.tracerColor}` }}
                  />
                  {currentState.papLevel > 0
                    ? `PaP Stufe ${currentState.papLevel} Plasma`
                    : 'Standard-Hartkern'}
                </span>
              </div>

              {/* Weapon Sound & Fire Inspection Trigger */}
              <button
                type="button"
                onClick={() => soundFx.playShoot(selectedWeaponId)}
                className="w-full py-3 px-4 rounded-xl bg-slate-950 hover:bg-slate-800/90 border border-amber-500/40 text-amber-300 font-mono text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-md"
              >
                <Volume2 className="w-4 h-4 text-amber-400" />
                <span>Schussklang & Akustik testen</span>
              </button>
            </div>
          </div>

          {/* Column 2: Cold War Arsenal Rarity Upgrade (Tier 1 to Tier 5) */}
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-700/60 shadow-2xl flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-emerald-400 mb-1.5">
                <span className="flex items-center gap-1.5 font-bold">
                  <Shield className="w-3.5 h-3.5" />
                  COLD WAR ARSENAL-MASCHINE
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 font-bold">
                  TIER {currentState.rarityTier} / 5
                </span>
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">Waffen-Seltenheit (Rarity)</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Wie in CoD Cold War multipliziert jede höhere Seltenheitsstufe den Grundschaden und verringert Waffenstreuung dauerhaft.
              </p>

              <div className="mt-5 space-y-2.5">
                {COLD_WAR_RARITIES.map((r) => {
                  const isCurrent = currentState.rarityTier === r.tier;
                  const isUnlocked = currentState.rarityTier >= r.tier;
                  return (
                    <div
                      key={r.tier}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs font-mono transition-all ${
                        isCurrent
                          ? 'bg-slate-950 border-amber-400 text-white shadow-[0_0_15px_rgba(245,158,11,0.2)] ring-1 ring-amber-400/50'
                          : isUnlocked
                          ? 'bg-slate-950/70 border-slate-700 text-slate-200'
                          : 'bg-slate-950/30 border-slate-800/60 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3 h-3 rounded-sm shrink-0 shadow-sm"
                          style={{
                            backgroundColor: r.colorHex,
                            boxShadow: isCurrent ? `0 0 10px ${r.colorHex}` : 'none',
                          }}
                        />
                        <span className="font-bold">{r.codLabel}</span>
                      </div>
                      <span className="tabular-nums font-semibold">
                        {Math.round(r.damageMultiplier * 100)}% Schaden
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {nextRarity ? (
              <button
                type="button"
                disabled={budget < nextRarity.costNAT}
                onClick={() => {
                  soundFx.playLevelUp();
                  onUpgradeRarity(selectedWeaponId, nextRarity.tier, nextRarity.costNAT);
                }}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                  budget >= nextRarity.costNAT
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-[0.98]'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 stroke-[3]" />
                <span>
                  Auf {nextRarity.name} aufwerten ({nextRarity.costNAT} NAT)
                </span>
              </button>
            ) : (
              <div className="w-full py-3.5 px-4 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-300 font-mono font-bold text-xs text-center shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                [MAXIMALE SELTENHEIT: LEGENDÄR TIER V AKTIV]
              </div>
            )}
          </div>

          {/* Column 3: Pack-a-Punch Forge (Stufe I - III) - Radiant Neon Purple */}
          <div className="relative p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-fuchsia-950/30 backdrop-blur-md border border-fuchsia-500/40 shadow-2xl flex flex-col justify-between space-y-5 overflow-hidden">
            {/* Radiant Energy Glow in Background */}
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-fuchsia-500/15 blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between text-xs font-mono text-fuchsia-400 mb-1.5">
                <span className="flex items-center gap-1.5 font-bold">
                  <Zap className="w-3.5 h-3.5" />
                  ÄPPLER PACK-A-PUNCH SCHMIEDE
                </span>
                <span className="px-2 py-0.5 rounded bg-fuchsia-500/20 border border-fuchsia-500/40 font-bold">
                  STUFE {currentState.papLevel} / 3
                </span>
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">Pack-a-Punch Überladung</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Verwandelt die Waffe in eine überladene Taunus-Elite-Edition mit Leuchtplasma-Geschossen, Feuerraten-Boost und bis zu 280% Feuerkraft!
              </p>

              <div className="mt-5 space-y-2.5">
                {PACK_A_PUNCH_TIERS.slice(1).map((pap) => {
                  const isUnlocked = currentState.papLevel >= pap.level;
                  const papWeaponName = weapon.papNames[pap.level - 1];
                  return (
                    <div
                      key={pap.level}
                      className={`p-3.5 rounded-xl border text-xs transition-all ${
                        isUnlocked
                          ? 'bg-slate-950 border-fuchsia-500/70 text-white shadow-[0_0_15px_rgba(217,70,239,0.2)] ring-1 ring-fuchsia-500/40'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono font-bold">
                        <span className={pap.badgeColor}>{pap.name}</span>
                        <span className="text-fuchsia-300 font-black">
                          {Math.round(pap.damageMultiplier * 100)}% DMG
                        </span>
                      </div>
                      <div className="text-xs font-black text-white mt-1">
                        → „{papWeaponName}“
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{pap.subtitle}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {nextPap ? (
              <button
                type="button"
                disabled={budget < nextPap.costNAT}
                onClick={() => {
                  soundFx.playLevelUp();
                  onUpgradePackAPunch(selectedWeaponId, nextPap.level, nextPap.costNAT);
                }}
                className={`w-full py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                  budget >= nextPap.costNAT
                    ? 'bg-gradient-to-r from-fuchsia-600 via-purple-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white shadow-[0_0_25px_rgba(217,70,239,0.5)] hover:scale-[1.02] active:scale-[0.98]'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                }`}
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>
                  {nextPap.name} schmieden ({nextPap.costNAT} NAT)
                </span>
              </button>
            ) : (
              <div className="w-full py-3.5 px-4 rounded-xl bg-fuchsia-500/20 border border-fuchsia-400/50 text-fuchsia-200 font-mono font-bold text-xs text-center shadow-[0_0_15px_rgba(217,70,239,0.25)]">
                [PACK-A-PUNCH STUFE III (ULTRA-MAX) AKTIV]
              </div>
            )}
          </div>
        </div>

        {/* 5-Slot Cold War Gunsmith Attachments Grid */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-wider font-bold">
              <Wrench className="w-4 h-4" />
              <span>5-Slot Gunsmith-Aufsätze ({stats.displayName})</span>
            </div>
            <div className="text-xs font-mono text-slate-400">
              Jeder Aufsatz wird sofort am 3D-Waffenmodell montiert
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {GUNSMITH_CATALOG.map((cat) => {
              const currentLv = currentState.attachments[cat.slot] || 0;
              const nextTier = cat.tiers.find((t) => t.level === currentLv + 1);
              const activeTier = cat.tiers.find((t) => t.level === currentLv);
              const SlotIcon = getSlotIcon(cat.slot);

              return (
                <div
                  key={cat.slot}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-700/60 shadow-xl flex flex-col justify-between space-y-4 hover:border-slate-600 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
                      <span className="flex items-center gap-1 text-slate-300 font-semibold">
                        <SlotIcon className="w-3.5 h-3.5 text-amber-400" />
                        {cat.codSlotName}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-amber-400 font-bold">
                        Lv. {currentLv}/3
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-white tracking-tight">{cat.label}</h4>

                    {/* Segmented LED Level Indicator Bars */}
                    <div className="grid grid-cols-3 gap-1.5 my-3">
                      {[1, 2, 3].map((lv) => (
                        <div
                          key={lv}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            currentLv >= lv
                              ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                              : 'bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Current or Next Tier Details with Pros / Cons */}
                    {nextTier ? (
                      <div className="space-y-2 text-xs">
                        <div className="font-bold text-amber-300 flex items-center gap-1">
                          <span>Nächste Stufe:</span>
                          <span className="text-white">{nextTier.name}</span>
                        </div>
                        <div className="space-y-1">
                          {nextTier.pros.map((pro, i) => (
                            <div
                              key={i}
                              className="text-[11px] text-emerald-300 font-mono flex items-start gap-1.5"
                            >
                              <span className="text-emerald-400 font-black shrink-0">+</span>
                              <span>{pro}</span>
                            </div>
                          ))}
                          {nextTier.cons.map((con, i) => (
                            <div
                              key={i}
                              className="text-[11px] text-red-400 font-mono flex items-start gap-1.5"
                            >
                              <span className="text-red-500 font-black shrink-0">-</span>
                              <span>{con}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      activeTier && (
                        <div className="space-y-2 text-xs">
                          <div className="font-bold text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Montiert: {activeTier.name}</span>
                          </div>
                          <div className="space-y-1">
                            {activeTier.pros.map((pro, i) => (
                              <div
                                key={i}
                                className="text-[11px] text-emerald-300 font-mono flex items-start gap-1.5"
                              >
                                <span className="text-emerald-400 font-black shrink-0">+</span>
                                <span>{pro}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  {nextTier ? (
                    <button
                      type="button"
                      disabled={budget < nextTier.costNAT}
                      onClick={() => {
                        soundFx.playCoin();
                        onUpgradeAttachment(
                          selectedWeaponId,
                          cat.slot,
                          nextTier.level,
                          nextTier.costNAT
                        );
                      }}
                      className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md ${
                        budget >= nextTier.costNAT
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:scale-[1.02] active:scale-[0.98]'
                          : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      }`}
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Montieren ({nextTier.costNAT} NAT)</span>
                    </button>
                  ) : (
                    <div className="w-full py-2 px-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-[11px] text-center shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                      [MAX. STUFE 3 MONTIERT]
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
