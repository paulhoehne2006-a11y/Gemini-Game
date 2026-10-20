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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div>
            <div className="text-xs font-mono text-amber-400 uppercase tracking-wider mb-1">
              Stadtverwaltung 61267 Neu-Anspach · Kommunalhaushalt & Map-Aufwertung
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Wirtschafts-, Infrastruktur- & Einsatz-Zentrale
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Investiere Erträge in lokale Einrichtungen, schalte überarbeitete Neu-Anspacher Maps frei und levele Maps hoch (Stufe 1–10) für härtere Bots und massiven NAT- & Waffen-XP-Bonus.
            </p>
          </div>

          <div className="flex items-center gap-6 bg-slate-950 px-5 py-3 rounded-xl border border-slate-800 font-mono">
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Stadtkasse</div>
              <div className="text-xl font-bold text-amber-400 tabular-nums">
                {budget.toLocaleString('de-DE')} <span className="text-xs">NAT</span>
              </div>
            </div>
            <div className="w-[1px] h-8 bg-slate-800" />
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Ertrag / Sekunde</div>
              <div className="text-xl font-bold text-emerald-400 tabular-nums">
                +{totalIncomePerSec} <span className="text-xs">NAT/s</span>
              </div>
            </div>
            <div className="w-[1px] h-8 bg-slate-800" />
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Errungene Siege</div>
              <div className="text-xl font-bold text-sky-400 tabular-nums">{totalWins}</div>
            </div>
          </div>
        </div>

        {/* Gemini Pro Dynamic Municipal Crisis Event */}
        {commanderCrisisEvent && (
          <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-400 font-mono uppercase">
                    Kommunal-Ereignis
                  </span>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs font-semibold text-white">
                    {commanderCrisisEvent.title}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">{commanderCrisisEvent.description}</p>
                <div className="text-[11px] text-amber-300/80 font-mono mt-1">
                  Empfohlene Investition: {commanderCrisisEvent.recommendedUpgrade}
                </div>
              </div>
            </div>

            {onAcceptCrisisEvent && (
              <button
                type="button"
                onClick={onAcceptCrisisEvent}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-sm whitespace-nowrap transition-colors cursor-pointer"
              >
                +{commanderCrisisEvent.budgetBonus} NAT Soforthilfe verbuchen
              </button>
            )}
          </div>
        )}

        {/* 7 Neu-Anspach 3D Maps Campaign Progression, Rework & Map Leveling Grid */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div className="text-xs font-mono text-amber-400 uppercase tracking-wider">
              7 Überarbeitete Neu-Anspach Maps · Map-Stufen & Bot-Skalierung ({unlockedMaps.length}/7 freigeschaltet)
            </div>
            <div className="text-xs font-mono text-slate-400">
              Gelevelte Maps machen Wehrheimer Bots stärker, gewähren aber deutlich mehr NAT & Waffen-XP!
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
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
                  className={`flex flex-col justify-between p-4 rounded-xl border transition-all ${
                    unlocked
                      ? 'bg-slate-900 border-slate-800 hover:border-amber-500/50'
                      : 'bg-slate-900/50 border-slate-800/80'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-mono text-slate-400">
                        {rule?.difficultyLabel || 'Einsatzgebiet'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {unlocked && (
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-mono font-black">
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

                    <div className="text-xs font-bold text-white">{arena.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                      {arenaDef?.subtitle}
                    </div>

                    {/* Atmosphere & Rework Badge */}
                    {arenaDef?.atmosphere && (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] font-mono text-sky-300">
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
                      <div className="mt-2.5 p-2 rounded-lg bg-slate-950/90 border border-slate-800/90 space-y-1 font-mono text-[10px]">
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

                  <div className="mt-3 pt-2.5 border-t border-slate-800 space-y-2">
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
                            className={`w-full py-1.5 px-2.5 rounded-lg font-mono font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                              mapLv >= MAX_MAP_LEVEL
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                : canAffordLevelUp
                                ? 'bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300'
                                : 'bg-slate-950 border border-slate-800 text-slate-500 cursor-not-allowed'
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
                          className="w-full py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
                        >
                          {isMobileHardware ? 'Im Taktik-Hub auswählen →' : '3D-Map starten →'}
                        </button>
                      </>
                    ) : (
                      <div className="space-y-1.5">
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
                          className={`w-full py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                            canAffordUnlock
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
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
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              Lokale Infrastruktur & Sehenswürdigkeiten
            </span>
            <span className="text-xs text-slate-500 font-mono">
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
                  className="flex flex-col justify-between p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-slate-800 text-amber-400 border border-slate-700">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm text-white leading-tight">
                            {fac.name}
                          </h3>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {fac.location}
                          </span>
                        </div>
                      </div>
                      <div className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-400 text-xs font-mono font-bold">
                        Lv. {fac.level}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 my-3">
                      <div className="text-[10px] text-amber-400/90 font-mono uppercase mb-0.5">
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

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => handleUpgrade(fac)}
                      disabled={!canAfford}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isMax
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : canAfford
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm'
                          : 'bg-slate-800 text-slate-400 cursor-not-allowed opacity-60'
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
