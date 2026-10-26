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
  Zap,
  MapPin,
  Activity,
  Layers,
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
      className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.08)] overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Subtle Cyber Glow Backlights */}
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        {/* Tactical Corner Brackets */}
        <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-amber-500/50 pointer-events-none" />
        <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-amber-500/50 pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-amber-500/50 pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-amber-500/50 pointer-events-none" />

        {/* Modal Header with Tactical Accents */}
        <header className="relative px-6 py-5 bg-slate-950/95 border-b border-white/10 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <Target className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-black text-white tracking-tight uppercase">
                    Tagesbefehle & Operator-Ruf
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-[10px] font-mono font-black border border-amber-400/40 shadow-sm">
                    {completedCount}/{totalCount} ABGESCHLOSSEN
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Tägliche Sonderbefehle für zusätzliche Neu-Anspach-Taler (NAT) & Ansehen
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900/80 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-150 cursor-pointer shrink-0 active:scale-95"
              title="Schließen"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {/* Reset countdown & alert status badge */}
          <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono bg-slate-900/90 px-3.5 py-2 rounded-xl border border-white/10">
            <div className="flex items-center gap-2 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Nächster Tages-Reset in:</span>
              <span className="text-amber-300 font-bold tabular-nums">{resetTimer}</span>
            </div>
            {unclaimedCount > 0 && (
              <span className="text-emerald-300 font-bold flex items-center gap-1.5 animate-pulse">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>{unclaimedCount} {unclaimedCount === 1 ? 'Belohnung bereit!' : 'Belohnungen bereit!'}</span>
              </span>
            )}
          </div>
        </header>

        {/* Scrollable Modal Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Operator Reputation Progression Deck */}
          <section className="p-5 rounded-2xl bg-gradient-to-br from-slate-950/90 via-slate-950/80 to-purple-950/30 border border-purple-500/35 shadow-xl space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-300">
                  OPERATOR-ANSEHEN (RUF)
                </span>
              </div>
              <span className="text-sm font-mono font-black text-purple-300 tabular-nums">
                {reputation.toLocaleString('de-DE')} RUF-PUNKTE
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-base font-black text-white flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-purple-500/20 border border-purple-400/40 text-purple-200 text-xs font-mono font-bold">
                    Rang {currentRank.rank}
                  </span>
                  <span>{currentRank.title}</span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  <strong className="text-emerald-400 font-semibold">Aktiver Rang-Vorteil:</strong>{' '}
                  {currentRank.perkDescription}
                </p>
              </div>

              {nextRank && (
                <div className="text-left sm:text-right text-[11px] font-mono text-slate-400 shrink-0 bg-slate-950/60 p-2.5 rounded-xl border border-white/10">
                  <span className="block text-slate-500">Nächster Rang:</span>
                  <span className="text-white font-bold">{nextRank.title}</span>
                  <span className="text-purple-300 font-semibold block tabular-nums">
                    +{Math.max(0, nextRank.minPoints - reputation)} Ruf nötig
                  </span>
                </div>
              )}
            </div>

            {/* Reputation Progress Bar with Glowing Shimmer */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>Fortschritt zu Rang {currentRank.rank + (nextRank ? 1 : 0)}</span>
                <span className="text-purple-300 font-bold tabular-nums">{progressPercent}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-950 border border-white/10 p-0.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-amber-400 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </section>

          {/* Grand Completion Bonus Jackpot Banner */}
          <section
            className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 ${
              missionsState.grandBonusClaimed
                ? 'bg-slate-950/60 border-emerald-500/35 shadow-md'
                : allCompleted
                ? 'bg-gradient-to-r from-amber-500/20 via-purple-500/15 to-amber-500/20 border-amber-400/60 shadow-[0_0_30px_rgba(245,158,11,0.25)]'
                : 'bg-slate-950/50 border-white/10'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform ${
                    missionsState.grandBonusClaimed
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : allCompleted
                      ? 'bg-amber-500 text-slate-950 border border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.6)] animate-bounce'
                      : 'bg-slate-800 text-slate-400 border border-white/10'
                  }`}
                >
                  <Gift className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-black text-amber-400 uppercase tracking-wider">
                      TAGES-MEISTER JACKPOT
                    </span>
                    {allCompleted && !missionsState.grandBonusClaimed && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 text-[10px] font-black uppercase shadow-sm">
                        BEREIT!
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">
                    Schließe alle {totalCount} Tagesbefehle ab für den täglichen Jackpot:{' '}
                    <span className="text-amber-300 font-black">+350 NAT</span>,{' '}
                    <span className="text-purple-300 font-black">+200 RUF</span> &{' '}
                    <span className="text-cyan-300 font-black">+1 SP</span>
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center justify-end">
                {missionsState.grandBonusClaimed ? (
                  <span className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold shadow-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Jackpot Eingelöst ✓</span>
                  </span>
                ) : allCompleted ? (
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playLevelUp();
                      onClaimGrandBonus();
                    }}
                    className="btn-tactile flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 text-xs font-black uppercase tracking-wider shadow-[0_4px_20px_rgba(245,158,11,0.4)] transition-all duration-150 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 fill-slate-950" />
                    <span>Jackpot Einfordern (+350 NAT & +1 SP)</span>
                  </button>
                ) : (
                  <span className="text-xs font-mono text-slate-400 px-3 py-1.5 rounded-lg bg-slate-950/60 border border-white/10">
                    {completedCount} von {totalCount} erfüllt
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* Missions List */}
          <section className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-amber-400" />
                <span>Heutige Tagesbefehle ({completedCount}/{totalCount})</span>
              </h3>
            </div>

            <div className="space-y-3">
              {missionsState.missions.map((mission) => {
                const percent = Math.min(
                  100,
                  Math.round((mission.currentProgress / mission.targetCount) * 100)
                );

                return (
                  <div
                    key={mission.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 ${
                      mission.claimed
                        ? 'bg-slate-950/40 border-white/5 opacity-70'
                        : mission.completed
                        ? 'bg-slate-950/90 border-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.15)] ring-1 ring-amber-400/40'
                        : 'bg-slate-950/70 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 border border-amber-500/40 text-amber-300">
                            {mission.badge}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              mission.difficulty === 'heroisch'
                                ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-[0_0_8px_rgba(239,68,68,0.2)]'
                                : mission.difficulty === 'schwer'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                : 'bg-slate-800 text-slate-300 border border-white/10'
                            }`}
                          >
                            {mission.difficulty}
                          </span>
                          <h4 className="text-sm font-black text-white tracking-tight">
                            {mission.title}
                          </h4>
                        </div>

                        <p className="text-xs text-slate-300 font-medium leading-relaxed">
                          {mission.description}
                        </p>
                      </div>

                      {/* Reward Pills */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold shadow-sm">
                          <Coins className="w-3.5 h-3.5 text-amber-400" />
                          <span>+{mission.rewardNAT} NAT</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/15 border border-purple-500/40 text-purple-300 font-mono text-xs font-bold shadow-sm">
                          <Award className="w-3.5 h-3.5 text-purple-400" />
                          <span>+{mission.rewardReputation} RUF</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar & Actions */}
                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/10">
                      <div className="flex-1 space-y-1.5">
                        <div className="flex justify-between text-[11px] font-mono">
                          <span className="text-slate-400">Fortschritt:</span>
                          <span className="text-white font-bold tabular-nums">
                            {mission.currentProgress} / {mission.targetCount} ({percent}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-900 border border-white/10 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              mission.completed
                                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                                : 'bg-gradient-to-r from-amber-500 to-yellow-400'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      {/* Claim or Action Trigger Button */}
                      <div className="shrink-0 flex items-center justify-end">
                        {mission.claimed ? (
                          <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Eingelöst ✓</span>
                          </span>
                        ) : mission.completed ? (
                          <button
                            type="button"
                            onClick={() => {
                              soundFx.playCoin();
                              onClaimMission(mission.id);
                            }}
                            className="btn-tactile flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_4px_16px_rgba(245,158,11,0.35)] transition-all duration-150 cursor-pointer"
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
                            className="btn-tactile flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-white/10 text-slate-200 hover:text-white text-xs font-mono font-bold transition-all duration-150 cursor-pointer border border-white/10 hover:border-white/20 active:scale-[0.98]"
                          >
                            <span>Zur Map</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-xs font-mono text-slate-400 px-2.5 py-1 rounded-lg bg-slate-900 border border-white/10">
                            Noch {mission.targetCount - mission.currentProgress} nötig
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Modal Footer */}
        <footer className="px-6 py-4 bg-slate-950/95 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span className="font-mono text-[11px]">
            Tagesbefehle rotieren täglich um 00:00 Uhr Serverzeit.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="btn-tactile px-5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-white/10 text-white font-mono font-bold text-xs cursor-pointer transition-all duration-150 border border-white/10 hover:border-white/20 active:scale-[0.98]"
          >
            Fertig
          </button>
        </footer>
      </div>
    </div>
  );
};
