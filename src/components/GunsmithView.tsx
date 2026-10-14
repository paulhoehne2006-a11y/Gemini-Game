import React, { useState } from 'react';
import {
  WEAPONS,
  COLD_WAR_RARITIES,
  PACK_A_PUNCH_TIERS,
  GUNSMITH_CATALOG,
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
  X,
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
  onClose,
}) => {
  const [selectedWeaponId, setSelectedWeaponId] = useState<string>(activeWeaponId || 'bembel');
  const weapon = WEAPONS[selectedWeaponId] || WEAPONS.bembel;
  const currentState = weaponUpgrades[selectedWeaponId] || {
    rarityTier: 1,
    papLevel: 0,
    attachments: { scope: 0, barrel: 0, bolt: 0, mag: 0, stock: 0 },
  };

  const stats = getEffectiveWeaponStats(weapon, currentState);
  const nextRarity = COLD_WAR_RARITIES.find((r) => r.tier === currentState.rarityTier + 1);
  const nextPap = PACK_A_PUNCH_TIERS.find((p) => p.level === currentState.papLevel + 1);

  const handleSelectWeaponTab = (id: string) => {
    setSelectedWeaponId(id);
    onSelectWeapon(id);
    soundFx.playShoot();
  };

  return (
    <div className="w-full min-h-full bg-slate-950 text-slate-100 p-4 sm:p-6 pb-28 lg:pb-12">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div>
            <div className="text-xs font-mono text-amber-400 tracking-wider">
              WAFFENSCHMIEDE (GUNSMITH) & PACK-A-PUNCH ARSENAL · BLACK OPS COLD WAR SYSTEM
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight mt-0.5">
              Waffen-Aufsätze, Seltenheitsstufen & Äppler-Pack-a-Punch
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Rüste deine Waffen an 5 Gunsmith-Stationen auf, steigere die Waffen-Seltenheit bis Legendär (Tier V) und aktiviere die 3-stufige Pack-a-Punch-Schmiede.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono">
              <Coins className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-[10px] text-slate-500">VERFÜGBARE TALER</div>
                <div className="text-base font-bold text-amber-400 tabular-nums">
                  {budget.toLocaleString('de-DE')} NAT
                </div>
              </div>
            </div>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Zurück ins Gefecht</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Weapon Selector Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.values(WEAPONS).map((w) => {
            const wState = weaponUpgrades[w.id] || {
              rarityTier: 1,
              papLevel: 0,
              attachments: { scope: 0, barrel: 0, bolt: 0, mag: 0, stock: 0 },
            };
            const wStats = getEffectiveWeaponStats(w, wState);
            const isSelected = selectedWeaponId === w.id;

            return (
              <button
                key={w.id}
                type="button"
                onClick={() => handleSelectWeaponTab(w.id)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 border-amber-400 shadow-lg'
                    : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                  <span>{wStats.rarityObj.codLabel}</span>
                  {wState.papLevel > 0 && (
                    <span className="text-amber-400 font-bold">PaP {wState.papLevel}</span>
                  )}
                </div>
                <div className="text-sm font-bold text-white truncate">{wStats.displayName}</div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5">{w.codArchetype}</div>
                <div className="mt-3 flex items-center justify-between text-xs font-mono">
                  <span className="text-amber-400 font-bold tabular-nums">{wStats.damage} DMG</span>
                  <span className="text-sky-400 tabular-nums">{wStats.fireRate}/s</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Main Weapon Overview + Cold War Rarity & Pack-a-Punch Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Live Weapon Telemetry & Stat Bars */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
                <span>AKTUELLE KONFIGURATION</span>
                <span style={{ color: stats.rarityObj.colorHex }} className="font-bold">
                  {stats.rarityObj.name}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">{stats.displayName}</h2>
              <p className="text-xs text-slate-400 mt-1">{weapon.description}</p>

              {/* Stat Progress Bars (Cold War Style) */}
              <div className="mt-5 space-y-3 font-mono text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-400">FEUERKRAFT (SCHADEN)</span>
                    <span className="text-amber-400 font-bold tabular-nums">{stats.damage} DMG</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 transition-all duration-200"
                      style={{ width: `${Math.min(100, (stats.damage / 260) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-400">FEUERRATE (KADENZ)</span>
                    <span className="text-sky-400 font-bold tabular-nums">{stats.fireRate} Schuss/s</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                    <div
                      className="h-full bg-sky-400 transition-all duration-200"
                      style={{ width: `${Math.min(100, (stats.fireRate / 18) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-400">GESCHOSSTEMPO (MÜNDUNG)</span>
                    <span className="text-emerald-400 font-bold tabular-nums">{stats.bulletSpeed} m/s</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 transition-all duration-200"
                      style={{ width: `${Math.min(100, (stats.bulletSpeed / 280) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-400">KRIT-CHANCE & SPLITTER</span>
                    <span className="text-purple-400 font-bold tabular-nums">
                      {stats.critChancePct}% Krit · {stats.splashRadius}m
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                    <div
                      className="h-full bg-purple-400 transition-all duration-200"
                      style={{ width: `${Math.min(100, stats.critChancePct * 1.4)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-400">SCHAFT-MOBILITÄT & ZV</span>
                    <span className="text-cyan-400 font-bold tabular-nums">+{stats.moveBonusPct}% Tempo</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 transition-all duration-200"
                      style={{ width: `${Math.min(100, 35 + stats.moveBonusPct * 3.5)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>Leuchtspur-Kaliber:</span>
              <span className="font-bold" style={{ color: stats.tracerColor }}>
                {currentState.papLevel > 0
                  ? `Pack-a-Punch Stufe ${currentState.papLevel} Plasma`
                  : 'Standard-Hartkern'}
              </span>
            </div>
          </div>

          {/* Column 2: Cold War Arsenal Rarity Upgrade (Tier 1 to Tier 5) */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-emerald-400 mb-1">
                <span>COLD WAR ARSENAL-MASCHINE</span>
                <span>SELTENHEIT {currentState.rarityTier} / 5</span>
              </div>
              <h3 className="text-lg font-bold text-white">Waffen-Seltenheit (Rarity Tier)</h3>
              <p className="text-xs text-slate-400 mt-1">
                Wie in CoD Cold War vervielfacht jede höhere Seltenheitsstufe den Grundschaden und verbessert die Präzision deiner Waffe dauerhaft.
              </p>

              <div className="mt-4 space-y-2">
                {COLD_WAR_RARITIES.map((r) => {
                  const isCurrent = currentState.rarityTier === r.tier;
                  const isUnlocked = currentState.rarityTier >= r.tier;
                  return (
                    <div
                      key={r.tier}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-mono ${
                        isCurrent
                          ? 'bg-slate-950 border-amber-400 text-white'
                          : isUnlocked
                          ? 'bg-slate-950/60 border-slate-800 text-slate-300'
                          : 'bg-slate-950/30 border-slate-800/60 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-sm shrink-0"
                          style={{ backgroundColor: r.colorHex }}
                        />
                        <span className="font-bold">{r.codLabel}</span>
                      </div>
                      <span className="tabular-nums">
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
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  budget >= nextRarity.costNAT
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>
                  Auf {nextRarity.name} aufwerten ({nextRarity.costNAT} NAT)
                </span>
              </button>
            ) : (
              <div className="w-full py-3 px-4 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono font-bold text-xs text-center">
                MAXIMALE SELTENHEIT (LEGENDÄR TIER V) ERREICHT
              </div>
            )}
          </div>

          {/* Column 3: Pack-a-Punch Schmiede (Stufe I - III) */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-fuchsia-400 mb-1">
                <span>ÄPPLER PACK-A-PUNCH SCHMIEDE</span>
                <span>STUFE {currentState.papLevel} / 3</span>
              </div>
              <h3 className="text-lg font-bold text-white">Pack-a-Punch Überladung</h3>
              <p className="text-xs text-slate-400 mt-1">
                Verwandelt deine Waffe in eine überladene Spezial-Edition mit leuchtender Plasma-Tarnung, höherer Feuerrate und bis zu 280% Feuerkraft!
              </p>

              <div className="mt-4 space-y-2">
                {PACK_A_PUNCH_TIERS.slice(1).map((pap) => {
                  const isUnlocked = currentState.papLevel >= pap.level;
                  const papWeaponName = weapon.papNames[pap.level - 1];
                  return (
                    <div
                      key={pap.level}
                      className={`p-3 rounded-xl border text-xs ${
                        isUnlocked
                          ? 'bg-slate-950 border-fuchsia-500/60 text-white'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono font-bold">
                        <span className={pap.badgeColor}>{pap.name}</span>
                        <span>{Math.round(pap.damageMultiplier * 100)}% DMG</span>
                      </div>
                      <div className="text-[11px] font-semibold text-white mt-0.5">
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
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  budget >= nextPap.costNAT
                    ? 'bg-fuchsia-500 hover:bg-fuchsia-400 text-slate-950 shadow-md'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>
                  {nextPap.name} schmieden ({nextPap.costNAT} NAT)
                </span>
              </button>
            ) : (
              <div className="w-full py-3 px-4 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono font-bold text-xs text-center">
                PACK-A-PUNCH STUFE III (ULTRA-MAX) AKTIV
              </div>
            )}
          </div>
        </div>

        {/* 5-Slot Cold War Gunsmith Attachments Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-mono text-amber-400 uppercase tracking-wider">
              5-Slot Waffenschmiede (Gunsmith Aufsätze für {stats.displayName})
            </div>
            <div className="text-xs font-mono text-slate-400">
              Jeder Aufsatz ist sofort in 3D an deiner Waffe sichtbar
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {GUNSMITH_CATALOG.map((cat) => {
              const currentLv = currentState.attachments[cat.slot] || 0;
              const nextTier = cat.tiers.find((t) => t.level === currentLv + 1);
              const activeTier = cat.tiers.find((t) => t.level === currentLv);

              return (
                <div
                  key={cat.slot}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                      <span>{cat.codSlotName}</span>
                      <span className="text-amber-400 font-bold">Lv. {currentLv}/3</span>
                    </div>
                    <h4 className="text-sm font-bold text-white">{cat.label}</h4>

                    {/* Level indicator bars */}
                    <div className="grid grid-cols-3 gap-1.5 my-3">
                      {[1, 2, 3].map((lv) => (
                        <div
                          key={lv}
                          className={`h-1.5 rounded-full ${
                            currentLv >= lv ? 'bg-amber-400' : 'bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Current or Next Tier Details */}
                    {nextTier ? (
                      <div className="space-y-2 text-xs">
                        <div className="font-semibold text-amber-300">
                          Nächste Stufe: {nextTier.name}
                        </div>
                        <div className="space-y-1">
                          {nextTier.pros.map((pro, i) => (
                            <div key={i} className="text-[11px] text-emerald-400 font-mono">
                              {pro}
                            </div>
                          ))}
                          {nextTier.cons.map((con, i) => (
                            <div key={i} className="text-[11px] text-red-400 font-mono">
                              {con}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      activeTier && (
                        <div className="space-y-2 text-xs">
                          <div className="font-semibold text-emerald-400">
                            Montiert: {activeTier.name}
                          </div>
                          <div className="space-y-1">
                            {activeTier.pros.map((pro, i) => (
                              <div key={i} className="text-[11px] text-emerald-300 font-mono">
                                {pro}
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
                      className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        budget >= nextTier.costNAT
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Montieren ({nextTier.costNAT} NAT)</span>
                    </button>
                  ) : (
                    <div className="w-full py-2 px-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono font-bold text-[11px] text-center">
                      STUFE 3 MONTIERT
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
