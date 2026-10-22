import React, { useState } from 'react';
import { Facility, DISTRICTS } from '../game/tycoon';
import {
  ARENAS,
  ARENA_UNLOCK_RULES,
  checkArenaUnlocked,
  MAX_MAP_LEVEL,
  INITIAL_MAP_LEVELS,
  getMapUpgradeCostNAT,
  getMapBotScaling,
} from '../game/three/arenas';
import { MapLevelsState } from '../types';
import {
  Landmark,
  Wifi,
  Zap,
  Beer,
  TrainTrack,
  Waves,
  ArrowUpRight,
  CheckCircle2,
  Lock,
  Sparkles,
  Building2,
  Unlock,
  Skull,
  Flame,
  Sun,
  Moon,
} from 'lucide-react';
import { soundFx } from '../audio/soundFx';

interface TycoonHubProps {
  budget: number;
  onUpgradeFacility: (facilityId: string, cost: number) => void;
  facilities: Record<string, Facility>;
  totalWins: number;
  unlockedMaps: string[];
  onUnlockMap: (arenaId: string, costNAT: number) => void;
  totalIncomePerSec: number;
  commanderCrisisEvent?: {
    title: string;
    description: string;
    budgetBonus: number;
    recommendedUpgrade: string;
  } | null;
  onAcceptCrisisEvent?: () => void;
  onStartArena: (arenaId: string) => void;
  mapLevels?: MapLevelsState;
  onUpgradeMapLevel?: (arenaId: string, costNAT: number) => void;
  isMobileHardware?: boolean;
}

const FACILITY_ICONS: Record<string, React.FC<{ className?: string }>> = {
  hessenpark: Landmark,
  breitband: Wifi,
  stadtwerke: Zap,
  kelterei: Beer,
  taunusbahn: TrainTrack,
  waldschwimmbad: Waves,
};

export const TycoonHub: React.FC<TycoonHubProps> = ({
  budget,
  onUpgradeFacility,
  facilities,
  totalWins,
  unlockedMaps,
  onUnlockMap,
  totalIncomePerSec,
  commanderCrisisEvent,
  onAcceptCrisisEvent,
  onStartArena,
  mapLevels = INITIAL_MAP_LEVELS,
  onUpgradeMapLevel,
  isMobileHardware = false,
}) => {
  const [selectedDistrict, setSelectedDistrict] = useState<string>('anspach');

  const getFacilityCost = (f: Facility) => {
    return Math.round(f.baseCost * Math.pow(f.costMultiplier, f.level));
  };

  const handleUpgrade = (f: Facility) => {
    const cost = getFacilityCost(f);
    if (budget >= cost && f.level < f.maxLevel) {
      soundFx.playCoin();
      onUpgradeFacility(f.id, cost);
    }
  };

  return (
    <div className="w-full min-h-full bg-slate-950 text-slate-100 p-4 sm:p-6 pb-28 lg:pb-12">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Stats */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 p-6 rounded-2xl bg-slate-900/85 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.06)]">
          <div>
            <div className="text-xs font-mono text-amber-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
              <span>Stadtverwaltung 61267 Neu-Anspach · Kommunalhaushalt & Map-Aufwertung</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Wirtschafts-, Infrastruktur- & Einsatz-Zentrale
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Investiere Erträge in lokale Einrichtungen, schalte überarbeitete Neu-Anspacher Maps frei und levele Maps hoch (Stufe 1–10) für härtere Bots und massiven NAT- & Waffen-XP-Bonus.
            </p>
          </div>

          <div className="flex items-center gap-6 bg-slate-950/80 px-6 py-3.5 rounded-2xl border border-white/10 font-mono shadow-inner shrink-0">
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Stadtkasse</div>
              <div className="text-xl font-black text-amber-400 tabular-nums">
                {budget.toLocaleString('de-DE')} <span className="text-xs">NAT</span>
              </div>
            </div>
            <div className="w-[1px] h-8 bg-white/10" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Ertrag / Sekunde</div>
              <div className="text-xl font-black text-emerald-400 tabular-nums">
                +{totalIncomePerSec} <span className="text-xs">NAT/s</span>
              </div>
            </div>
            <div className="w-[1px] h-8 bg-white/10" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Errungene Siege</div>
              <div className="text-xl font-black text-sky-400 tabular-nums">{totalWins}</div>
            </div>
          </div>
        </div>

        {/* Gemini Pro Dynamic Municipal Crisis Event */}
        {commanderCrisisEvent && (
          <div className="p-5 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-amber-500/35 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)] shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-black text-amber-400 uppercase tracking-wider">
                    Kommunal-Ereignis
                  </span>
                  <span className="text-xs text-slate-500">·</span>
                  <span className="text-sm font-bold text-white">
                    {commanderCrisisEvent.title}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{commanderCrisisEvent.description}</p>
                <div className="text-[11px] text-amber-300 font-mono mt-1 font-semibold">
                  Empfohlene Investition: {commanderCrisisEvent.recommendedUpgrade}
                </div>
              </div>
            </div>

            {onAcceptCrisisEvent && (
              <button
                type="button"
                onClick={onAcceptCrisisEvent}
                className="btn-tactile px-5 py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-black text-xs rounded-xl shadow-[0_4px_16px_rgba(245,158,11,0.35)] whitespace-nowrap transition-all duration-150 cursor-pointer shrink-0"
              >
                +{commanderCrisisEvent.budgetBonus} NAT Soforthilfe verbuchen
              </button>
            )}
          </div>
        )}

        {/* 7 Neu-Anspach 3D Maps Campaign Progression, Rework & Map Leveling Grid */}
        <div className="space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
              7 Überarbeitete Neu-Anspach Maps · Map-Stufen & Bot-Skalierung ({unlockedMaps.length}/7 freigeschaltet)
            </div>
            <div className="text-xs font-mono text-slate-400">
              Gelevelte Maps machen Wehrheimer Bots stärker, gewähren aber deutlich mehr NAT & Waffen-XP!
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { id: 'hessenpark', title: '1. Freilichtmuseum Hessenpark' },
              { id: 'waldschwimmbad', title: '2. Waldschwimmbad Neu-Anspach' },
              { id: 'bahnhof', title: '3. Bahnhof (Taunusbahn RB15)' },
              { id: 'buergerhaus', title: '4. Bürgerhaus & Rathausplatz' },
              { id: 'taunuscenter', title: '5. Taunus-Center (Neue Mitte)' },
              { id: 'ars', title: '6. Adolf-Reichwein-Schule' },
              { id: 'feldbergblick', title: '7. Feldbergblick & Taunuskamm' },
            ].map((arena) => {
              const unlocked = checkArenaUnlocked(arena.id, totalWins, unlockedMaps);
              const rule = ARENA_UNLOCK_RULES[arena.id];
              const arenaDef = ARENAS[arena.id];
              const canAffordUnlock = rule && budget >= rule.unlockCostNAT;
              const mapLv = mapLevels[arena.id] || 1;
              const botScaling = getMapBotScaling(arena.id, mapLv);
              const upgradeCost = getMapUpgradeCostNAT(arena.id, mapLv);
              const canAffordLevelUp = budget >= upgradeCost && mapLv < MAX_MAP_LEVEL;

              return (
                <div
                  key={arena.id}
                  className={`flex flex-col justify-between p-4 sm:p-5 rounded-2xl border transition-all duration-200 ${
                    unlocked
                      ? 'bg-slate-900/85 backdrop-blur-md border-white/10 hover:border-amber-400/50 shadow-md hover:shadow-xl hover:-translate-y-0.5'
                      : 'bg-slate-900/50 backdrop-blur-sm border-white/5 opacity-80'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-mono text-slate-400 font-semibold">
                        {rule?.difficultyLabel || 'Einsatzgebiet'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {unlocked && (
                          <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-400/40 text-amber-300 text-[10px] font-mono font-black">
                            MAP-LV. {mapLv}/{MAX_MAP_LEVEL}
                          </span>
                        )}
                        {unlocked ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                        )}
                      </div>
                    </div>

                    <div className="text-xs sm:text-sm font-black text-white">{arena.title}</div>
                    <div className="text-[11px] text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                      {arenaDef?.subtitle}
                    </div>

                    {/* Atmosphere & Rework Badge */}
                    {arenaDef?.atmosphere && (
                      <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-950/80 border border-white/10 text-[10px] font-mono text-sky-300">
                        {arenaDef.atmosphere.isNight ? (
                          <Moon className="w-3 h-3 text-indigo-400" />
                        ) : (
                          <Sun className="w-3 h-3 text-amber-400" />
                        )}
                        <span>{arenaDef.atmosphere.timeOfDay}</span>
                        <span className="text-emerald-400 font-bold">· REWORKED</span>
                      </div>
                    )}

                    {/* Bot Strength Scaling Telemetry */}
                    {unlocked && (
                      <div className="mt-3 p-2.5 rounded-xl bg-slate-950/80 border border-white/10 space-y-1 font-mono text-[10px]">
                        <div className="flex items-center justify-between text-red-400 font-bold">
                          <span className="flex items-center gap-1">
                            <Skull className="w-3 h-3" />
                            <span>{botScaling.threatTitle}</span>
                          </span>
                          <span>+{botScaling.extraBotsPerWave} Bots/Welle</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-300">
                          <span>Bot-Kampfkraft:</span>
                          <span className="text-amber-300 font-bold">
                            +{Math.round((botScaling.hpMult - 1) * 100)}% HP · +{Math.round((botScaling.dmgMult - 1) * 100)}% DMG
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-300">
                          <span>Map-Belohnung:</span>
                          <span className="text-emerald-400 font-bold">
                            +{Math.round((botScaling.natRewardMult - 1) * 100)}% NAT · +{Math.round((botScaling.xpRewardMult - 1) * 100)}% XP
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                    {unlocked ? (
                      <>
                        {onUpgradeMapLevel && (
                          <button
                            type="button"
                            disabled={!canAffordLevelUp}
                            onClick={() => {
                              if (canAffordLevelUp) {
                                soundFx.playLevelUp();
                                onUpgradeMapLevel(arena.id, upgradeCost);
                              }
                            }}
                            className={`btn-tactile w-full py-2 px-2.5 rounded-xl font-mono font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                              mapLv >= MAX_MAP_LEVEL
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                                : canAffordLevelUp
                                ? 'bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                                : 'bg-slate-950 border border-white/10 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            <Flame className="w-3.5 h-3.5 text-amber-400" />
                            {mapLv >= MAX_MAP_LEVEL ? (
                              <span>Max. Map-Stufe (Lv. {MAX_MAP_LEVEL})</span>
                            ) : (
                              <span>Map auf Lv. {mapLv + 1} stufen ({upgradeCost} NAT)</span>
                            )}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onStartArena(arena.id)}
                          className="btn-tactile w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-black text-xs transition-all duration-150 cursor-pointer shadow-[0_4px_16px_rgba(16,185,129,0.35)]"
                        >
                          {isMobileHardware ? 'Im Taktik-Hub auswählen →' : '3D-Map starten →'}
                        </button>
                      </>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-[10px] font-mono text-slate-400">
                          Benötigt {rule?.requiredWins} Siege ({totalWins}/{rule?.requiredWins}) oder:
                        </div>
                        <button
                          type="button"
                          disabled={!canAffordUnlock}
                          onClick={() => {
                            if (rule) {
                              soundFx.playLevelUp();
                              onUnlockMap(arena.id, rule.unlockCostNAT);
                            }
                          }}
                          className={`btn-tactile w-full py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                            canAffordUnlock
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_4px_16px_rgba(245,158,11,0.35)]'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                          }`}
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Freischalten ({rule?.unlockCostNAT} NAT)</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Facilities Grid */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
              Lokale Infrastruktur & Sehenswürdigkeiten
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Stufen-Ausbau steigert Erträge & Battle-Royale-Fähigkeiten
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(facilities).map((fac) => {
              const Icon = FACILITY_ICONS[fac.id] || Building2;
              const cost = getFacilityCost(fac);
              const canAfford = budget >= cost && fac.level < fac.maxLevel;
              const isMax = fac.level >= fac.maxLevel;

              return (
                <div
                  key={fac.id}
                  className="flex flex-col justify-between p-5 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-white/10 hover:border-white/20 transition-all duration-200 shadow-md"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-slate-800/80 text-amber-400 border border-white/10 shadow-sm">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-white leading-tight">
                            {fac.name}
                          </h3>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {fac.location}
                          </span>
                        </div>
                      </div>
                      <div className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-white/10 text-amber-400 text-xs font-mono font-black">
                        Lv. {fac.level}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-slate-300 my-3 leading-relaxed">
                      <div className="text-[10px] text-amber-400 font-mono font-bold uppercase tracking-wider mb-0.5">
                        BATTLE-ROYALE PERK:
                      </div>
                      {fac.perkDescription}
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono mb-4 text-slate-400">
                      <span>Ertrag:</span>
                      <span className="text-emerald-400 font-bold tabular-nums">
                        +{fac.level * fac.incomePerSec} NAT/s
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => handleUpgrade(fac)}
                      disabled={!canAfford}
                      className={`btn-tactile flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                        isMax
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                          : canAfford
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_4px_16px_rgba(245,158,11,0.35)]'
                          : 'bg-slate-800/80 text-slate-400 cursor-not-allowed opacity-60 border border-white/5'
                      }`}
                    >
                      {isMax ? (
                        'Maximalstufe erreicht'
                      ) : (
                        <>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          <span>Ausbauen ({cost.toLocaleString('de-DE')} NAT)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
