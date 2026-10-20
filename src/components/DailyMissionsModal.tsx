import React, { useState, useEffect } from 'react';
import {
  X,
  Target,
  Trophy,
  Award,
  Sparkles,
  CheckCircle2,
  Clock,
  Coins,
  Shield,
  ArrowRight,
  Flame,
  ChevronRight,
  Gift,
} from 'lucide-react';
import {
  DailyMission,
  DailyMissionsState,
  getReputationRank,
  getTimeUntilDailyReset,
  REPUTATION_RANKS,
} from '../game/missions';
import { soundFx } from '../audio/soundFx';

interface DailyMissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  missionsState: DailyMissionsState;
  reputation: number;
  onClaimMission: (missionId: string) => void;
  onClaimGrandBonus: () => void;
  onSelectArenaAndPlay?: (arenaId: string) => void;
}

export const DailyMissionsModal: React.FC<DailyMissionsModalProps> = ({
  isOpen,
  onClose,
  missionsState,
  reputation,
  onClaimMission,
  onClaimGrandBonus,
  onSelectArenaAndPlay,
}) => {
  const [resetTimer, setResetTimer] = useState(getTimeUntilDailyReset().formatted);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setResetTimer(getTimeUntilDailyReset().formatted);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const currentRank = getReputationRank(reputation);
  const nextRank = REPUTATION_RANKS.find((r) => r.rank === currentRank.rank + 1);

  const pointsInCurrentRank = Math.max(0, reputation - currentRank.minPoints);
  const pointsForNextRank = nextRank ? nextRank.minPoints - currentRank.minPoints : 1000;
  const progressPercent = nextRank
    ? Math.min(100, Math.round((pointsInCurrentRank / pointsForNextRank) * 100))
    : 100;

  const completedCount = missionsState.missions.filter((m) => m.completed).length;
  const totalCount = missionsState.missions.length;
  const allCompleted = totalCount > 0 && completedCount === totalCount;
  const unclaimedCount = missionsState.missions.filter((m) => m.completed && !m.claimed).length;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Header with tactical motif */}
        <div className="relative px-6 py-5 bg-slate-950 border-b border-slate-800 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-white tracking-tight uppercase">
                    Tagesbefehle & Operator-Ruf
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-mono font-bold border border-amber-500/40">
                    {completedCount}/{totalCount} ABGESCHLOSSEN
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tägliche Herausforderungen für zusätzliche Neu-Anspach-Taler (NAT) & Ansehenspunkte
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer shrink-0"
              title="Schließen"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Reset countdown badge */}
          <div className="mt-3 flex items-center justify-between text-xs font-mono bg-slate-900/80 px-3 py-1.5 rounded-xl border border-white/5">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Nächster Tages-Reset in:</span>
              <span className="text-amber-400 font-bold">{resetTimer}</span>
            </div>
            {unclaimedCount > 0 && (
              <span className="text-emerald-400 font-bold animate-pulse">
                {unclaimedCount} {unclaimedCount === 1 ? 'Belohnung bereit!' : 'Belohnungen bereit!'}
              </span>
            )}
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Operator Reputation Progression Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-purple-500/20 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-400" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-300">
                  OPERATOR-ANSEHEN (RUF)
                </span>
              </div>
              <span className="text-sm font-mono font-black text-purple-400 tabular-nums">
                {reputation.toLocaleString('de-DE')} RUF-PUNKTE
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-base font-black text-white flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-mono font-bold">
                    Rang {currentRank.rank}
                  </span>
                  <span>{currentRank.title}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  <span className="text-emerald-400 font-semibold">Aktiver Rang-Vorteil:</span>{' '}
                  {currentRank.perkDescription}
                </p>
              </div>

              {nextRank && (
                <div className="text-right text-[11px] font-mono text-slate-400 shrink-0">
                  <span className="block text-slate-500">Nächster Rang:</span>
                  <span className="text-white font-bold">{nextRank.title}</span>
                  <span className="text-purple-400 block tabular-nums">
                    +{Math.max(0, nextRank.minPoints - reputation)} Ruf nötig
                  </span>
                </div>
              )}
            </div>

            {/* Reputation Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>Fortschritt zu Rang {currentRank.rank + (nextRank ? 1 : 0)}</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-amber-400 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Grand Completion Bonus Banner */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              missionsState.grandBonusClaimed
                ? 'bg-slate-950/60 border-emerald-500/30'
                : allCompleted
                ? 'bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-amber-500/20 border-amber-500/60 shadow-xl'
                : 'bg-slate-950/40 border-slate-800'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                    missionsState.grandBonusClaimed
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : allCompleted
                      ? 'bg-amber-500 text-slate-950 animate-bounce'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                      TAGES-MEISTER JACKPOT
                    </span>
                    {allCompleted && !missionsState.grandBonusClaimed && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 text-[10px] font-black uppercase">
                        BEREIT!
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300">
                    Schließe alle {totalCount} Tagesbefehle ab für den täglichen Sonderbonus:{' '}
                    <span className="text-amber-400 font-black">+500 NAT</span> &{' '}
                    <span className="text-purple-400 font-black">+250 RUF</span>
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center justify-end">
                {missionsState.grandBonusClaimed ? (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Jackpot Eingelöst ✓</span>
                  </span>
                ) : allCompleted ? (
                  <button
                    type="button"
                    onClick={onClaimGrandBonus}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg transition-transform cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 fill-slate-950" />
                    <span>Jackpot Einfordern (+500 NAT)</span>
                  </button>
                ) : (
                  <span className="text-xs font-mono text-slate-500">
                    {completedCount} von {totalCount} erfüllt
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Missions List */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              HEUTIGE TAGESBEFEHLE ({completedCount}/{totalCount})
            </h3>

            <div className="space-y-3">
              {missionsState.missions.map((mission) => {
                const percent = Math.min(
                  100,
                  Math.round((mission.currentProgress / mission.targetCount) * 100)
                );

                return (
                  <div
                    key={mission.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      mission.claimed
                        ? 'bg-slate-950/40 border-slate-800/80 opacity-75'
                        : mission.completed
                        ? 'bg-slate-950/90 border-amber-500/60 shadow-lg shadow-amber-500/5'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400">
                            {mission.badge}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              mission.difficulty === 'heroisch'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : mission.difficulty === 'schwer'
                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {mission.difficulty}
                          </span>
                          <h4 className="text-sm font-bold text-white tracking-tight">
                            {mission.title}
                          </h4>
                        </div>

                        <p className="text-xs text-slate-300 font-medium">
                          {mission.description}
                        </p>
                      </div>

                      {/* Reward Pills */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold">
                          <Coins className="w-3.5 h-3.5" />
                          <span>+{mission.rewardNAT} NAT</span>
                        </div>
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 font-mono text-xs font-bold">
                          <Award className="w-3.5 h-3.5" />
                          <span>+{mission.rewardReputation} RUF</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar & Actions */}
                    <div className="mt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between text-[11px] font-mono">
                          <span className="text-slate-400">Fortschritt:</span>
                          <span className="text-white font-bold tabular-nums">
                            {mission.currentProgress} / {mission.targetCount} ({percent}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              mission.completed
                                ? 'bg-emerald-400'
                                : 'bg-gradient-to-r from-amber-500 to-yellow-400'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      {/* Claim or Action button */}
                      <div className="shrink-0 flex items-center justify-end">
                        {mission.claimed ? (
                          <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Eingefordert</span>
                          </span>
                        ) : mission.completed ? (
                          <button
                            type="button"
                            onClick={() => onClaimMission(mission.id)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition-transform cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                            <span>Einfordern</span>
                          </button>
                        ) : mission.arenaId && mission.arenaId !== 'any' && onSelectArenaAndPlay ? (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectArenaAndPlay(mission.arenaId as string);
                              onClose();
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-mono font-bold transition-colors cursor-pointer"
                          >
                            <span>Zur Map</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-xs font-mono text-slate-500">
                            Noch {mission.targetCount - mission.currentProgress} nötig
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span className="font-mono">
            Tagesbefehle aktualisieren sich jeden Tag um Mitternacht (00:00 Uhr).
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono font-bold text-xs cursor-pointer transition-colors"
          >
            Fertig
          </button>
        </div>
      </div>
    </div>
  );
};
