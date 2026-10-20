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

interface MobileTacticalHubProps {
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
    <div className="w-full max-w-2xl mx-auto p-4 space-y-5 pb-24 text-slate-100 animate-in fade-in duration-150">
      {/* Mobile Landscape & 3D Lock Notice */}
      {isLandscape && (
        <div className="p-3.5 rounded-2xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs flex items-start gap-3 shadow-lg">
          <Lock className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-mono font-bold text-red-300 uppercase block">
              Handy-Querformat erkannt · 3D Battle Royale gesperrt
            </span>
            <p className="text-[11px] text-red-200/90 mt-0.5 leading-relaxed">
              Das 3D Battle Royale ist auf dem Handy komplett deaktiviert (weder im Hochformat noch im Querformat spielbar). Hier in der Taktischen Zentrale kannst du Streifen entsenden, Waffen leveln, deinen Skilltree ausbauen und Maps upgraden!
            </p>
          </div>
        </div>
      )}

      {/* 1. Header Card: Operator & Budget Overview */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs">
              [{clanTag || '61267'}]
            </div>
            <div>
              <div className="text-xs font-mono text-slate-400">OPERATOR-ZENTRALE</div>
              <h2 className="text-base font-bold text-white leading-tight">{playerName}</h2>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Stadtkasse</span>
            <span className="text-base font-mono font-black text-amber-400 tabular-nums">
              {budget.toLocaleString('de-DE')} NAT
            </span>
          </div>
        </div>

        {/* Reputation & Passive Income Row */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs font-mono">
          <div className="p-2 rounded-xl bg-slate-950/60 border border-white/5 flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-400 shrink-0" />
            <div className="truncate">
              <span className="text-[10px] text-slate-500 block">Rang {currentRank.rank}</span>
              <span className="text-purple-300 font-bold truncate block">{currentRank.title}</span>
            </div>
          </div>

          <div className="p-2 rounded-xl bg-slate-950/60 border border-white/5 flex items-center gap-2">
            <Coins className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-500 block">Passives Einkommen</span>
              <span className="text-emerald-400 font-bold">+{totalIncomePerSec} NAT/s</span>
            </div>
          </div>
        </div>

        {onLaunch3DMobileCombat && (
          <button
            type="button"
            onClick={() => onLaunch3DMobileCombat()}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <Flame className="w-4 h-4 fill-slate-950" />
            <span>Zurück in den 3D Touch-Shooter (Battle Royale)</span>
          </button>
        )}
      </div>

      {/* 2. Daily Missions Card (Tagesbefehle) */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/30 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">
              Heutige Tagesbefehle
            </h3>
          </div>
          <button
            type="button"
            onClick={onOpenDailyMissions}
            className="text-xs font-mono text-amber-400 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
          >
            <span>{completedMissionsCount}/{dailyMissionsState.missions.length} Fertig</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Missions preview list */}
        <div className="space-y-2">
          {dailyMissionsState.missions.map((mission) => {
            const percent = Math.min(100, Math.round((mission.currentProgress / mission.targetCount) * 100));
            return (
              <div
                key={mission.id}
                className={`p-3 rounded-xl border transition-colors ${
                  mission.claimed
                    ? 'bg-slate-950/40 border-slate-800 opacity-70'
                    : mission.completed
                    ? 'bg-amber-500/10 border-amber-500/50'
                    : 'bg-slate-950/70 border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-400">
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

                  <div className="shrink-0 text-right">
                    <span className="text-[10px] font-mono text-amber-400 font-bold block">
                      +{mission.rewardNAT} NAT
                    </span>
                    <span className="text-[10px] font-mono text-purple-400 block">
                      +{mission.rewardReputation} RUF
                    </span>
                  </div>
                </div>

                {/* Progress bar & Claim button */}
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>Fortschritt</span>
                      <span className="text-white font-bold tabular-nums">
                        {mission.currentProgress}/{mission.targetCount}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          mission.completed ? 'bg-emerald-400' : 'bg-amber-400'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {mission.completed && !mission.claimed ? (
                    <button
                      type="button"
                      onClick={() => onClaimDailyMission(mission.id)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-black text-xs uppercase shadow transition-transform active:scale-95 cursor-pointer shrink-0"
                    >
                      Einfordern
                    </button>
                  ) : mission.claimed ? (
                    <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Eingelöst</span>
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Patrol Feedback Alert Banner */}
      {patrolFeedback && (
        <div className="p-3.5 rounded-2xl bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-mono font-bold flex items-center gap-2.5 animate-in slide-in-from-top-2">
          <Radio className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
          <span>{patrolFeedback}</span>
        </div>
      )}

      {/* 4. Tactical Area Defense & Patrols (2D Operations) */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">
              Einsatzgebiete & Streifen
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {unlockedMaps.length} von 7 aktiv
          </span>
        </div>

        <p className="text-xs text-slate-400">
          Entsende Bürgerwehr-Patrouillen, um Wehrheimer Späher abzuwehren, Waffen-XP & Beute zu sichern und deine Tagesbefehle zu erfüllen:
        </p>

        <div className="grid grid-cols-1 gap-2.5">
          {Object.values(ARENAS).map((arena) => {
            const isUnlocked = checkArenaUnlocked(arena.id, totalWins, unlockedMaps);
            const isPatrolling = activePatrolArena === arena.id;

            return (
              <div
                key={arena.id}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                  isUnlocked
                    ? 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-950/40 border-slate-800/60 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                      isUnlocked
                        ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <span className="text-xs font-bold text-white truncate block">
                      {arena.name}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate block">
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isPatrolling
                          ? 'bg-amber-500 text-slate-950 animate-pulse'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>{isPatrolling ? 'Im Einsatz...' : 'Patrouille'}</span>
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-slate-500">
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

      {/* 5. Mobile Fast Navigation Grid (Skilltree, Gunsmith, Tycoon, Leaderboard, Lobby) */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onNavigateTab('skilltree')}
          className="col-span-2 p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-slate-900 to-cyan-500/15 border border-amber-500/40 hover:border-amber-400 transition-colors text-left flex items-center justify-between gap-3 cursor-pointer shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Operator-Skilltree</span>
                {skillPoints > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-mono text-[10px] font-black">
                    {skillPoints} SP verfügbar
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-300 block font-mono">
                Bembel-Wucht, Taunus-Panzerung & Feldberg-Taktik skillen
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-400 shrink-0" />
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('gunsmith')}
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 transition-colors text-left space-y-2 cursor-pointer shadow-lg"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Waffenschmiede & Level</span>
            <span className="text-[10px] text-slate-400 block font-mono">
              Waffen-Level 1–30, Tarnungen & Aufsätze
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('tycoon')}
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-colors text-left space-y-2 cursor-pointer shadow-lg"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Maps & Stadt-Level</span>
            <span className="text-[10px] text-slate-400 block font-mono">
              Maps leveln (Stärkere Bots & Beute)
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('leaderboard')}
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-sky-500/50 transition-colors text-left space-y-2 cursor-pointer shadow-lg"
        >
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Live-Leaderboard</span>
            <span className="text-[10px] text-slate-400 block font-mono">
              Echte Spieler & Derby-Punkte
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('multiplayer')}
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 transition-colors text-left space-y-2 cursor-pointer shadow-lg"
        >
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Freunde-Lobby</span>
            <span className="text-[10px] text-slate-400 block font-mono">
              Squad-Codes & Mitspieler
            </span>
          </div>
        </button>
      </div>

      {/* 6. Mobile 3D Battle Royale Restriction Notice (or PC Return Button on Desktop) */}
      {isMobileHardware ? (
        <div className="p-4 rounded-2xl bg-slate-950/90 border border-red-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-red-300 block">
                3D Battle Royale auf dem Handy gesperrt
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">
                Auf Smartphones weder im Hochformat noch im Querformat spielbar · Bitte am PC öffnen
              </span>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-[10px] font-mono font-bold uppercase shrink-0 flex items-center gap-1">
            <Lock className="w-3 h-3" />
            <span>Nur PC</span>
          </span>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Monitor className="w-5 h-5 text-amber-400" />
            <div>
              <span className="text-xs font-bold text-white block">Zurück zum 3D Battle Royale (PC)</span>
              <span className="text-[10px] text-slate-400 block font-mono">
                Desktop-Modus mit Maus & Tastatur wieder öffnen
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onSwitchToPcMode}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-mono font-bold transition-colors cursor-pointer shrink-0"
          >
            3D Starten
          </button>
        </div>
      )}
    </div>
  );
};
