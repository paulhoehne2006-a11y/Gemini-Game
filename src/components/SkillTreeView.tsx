import React from 'react';
import {
  SKILL_BRANCHES,
  SKILL_TREE_NODES,
  SkillNodeDef,
  computeSkillTreeBonuses,
  isSkillNodeUnlocked,
} from '../game/skillTree';
import { SkillTreeLevels } from '../types';
import {
  Flame,
  Shield,
  Zap,
  Lock,
  CheckCircle2,
  Coins,
  Sparkles,
  RotateCcw,
  ArrowUpRight,
  Award,
  X,
  Activity,
  Cpu,
  ChevronRight,
  Crosshair,
  TrendingUp,
  Heart,
  Users,
} from 'lucide-react';
import { soundFx } from '../audio/soundFx';

interface SkillTreeViewProps {
  budget: number;
  skillPoints: number;
  operatorLevel: number;
  skillTree: SkillTreeLevels;
  onUpgradeSkillWithSP: (skillId: string, spCost: number) => void;
  onUpgradeSkillWithNAT: (skillId: string, natCost: number) => void;
  onResetSkillTree: () => void;
  onClose?: () => void;
}

export const SkillTreeView: React.FC<SkillTreeViewProps> = ({
  budget,
  skillPoints,
  operatorLevel,
  skillTree,
  onUpgradeSkillWithSP,
  onUpgradeSkillWithNAT,
  onResetSkillTree,
  onClose,
}) => {
  const bonuses = computeSkillTreeBonuses(skillTree);

  const getBranchIcon = (branchId: string) => {
    if (branchId === 'combat') return Flame;
    if (branchId === 'defense') return Shield;
    return Zap;
  };

  const getBranchTheme = (branchId: string) => {
    switch (branchId) {
      case 'combat':
        return {
          bgGrad: 'from-slate-900/90 via-slate-900/85 to-amber-950/20',
          border: 'border-amber-500/50',
          glow: 'shadow-[0_0_25px_rgba(245,158,11,0.12)]',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
          pipActive: 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.7)]',
          conduitActive: 'bg-gradient-to-b from-amber-400 to-yellow-300 shadow-[0_0_10px_rgba(245,158,11,0.8)]',
        };
      case 'defense':
        return {
          bgGrad: 'from-slate-900/90 via-slate-900/85 to-cyan-950/20',
          border: 'border-cyan-500/50',
          glow: 'shadow-[0_0_25px_rgba(6,182,212,0.12)]',
          badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50',
          pipActive: 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.7)]',
          conduitActive: 'bg-gradient-to-b from-cyan-400 to-sky-300 shadow-[0_0_10px_rgba(6,182,212,0.8)]',
        };
      case 'tactics':
      default:
        return {
          bgGrad: 'from-slate-900/90 via-slate-900/85 to-purple-950/20',
          border: 'border-purple-500/50',
          glow: 'shadow-[0_0_25px_rgba(168,85,247,0.12)]',
          badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/50',
          pipActive: 'bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.7)]',
          conduitActive: 'bg-gradient-to-b from-purple-400 to-fuchsia-300 shadow-[0_0_10px_rgba(168,85,247,0.8)]',
        };
    }
  };

  const getTierLabel = (tier: number, isUltimate?: boolean) => {
    if (isUltimate) return '[TIER 4 · ULTIMATE MEISTERSCHAFT]';
    switch (tier) {
      case 1:
        return '[TIER 1 · REKRUT]';
      case 2:
        return '[TIER 2 · VETERAN]';
      case 3:
        return '[TIER 3 · SPEZIALIST]';
      default:
        return `[TIER ${tier}]`;
    }
  };

  return (
    <div className="w-full min-h-full bg-slate-950 text-slate-100 p-3 sm:p-6 pb-28 lg:pb-12">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header - Dark Obsidian Glassmorphism with Cyber Conduit Framing */}
        <header className="relative overflow-hidden rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-700/60 p-5 sm:p-6 shadow-2xl">
          {/* Subtle Cyber Glow Backlights */}
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

          {/* Tactical Corner Brackets */}
          <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-purple-500/40 pointer-events-none" />
          <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-purple-500/40 pointer-events-none" />
          <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-purple-500/40 pointer-events-none" />
          <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-purple-500/40 pointer-events-none" />

          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider bg-purple-500/15 border border-purple-500/40 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.2)] flex items-center gap-1">
                  <Cpu className="w-3 h-3" />
                  [SYSTEM: NEURAL COMBAT CONDUIT]
                </span>
                <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider bg-slate-800/80 border border-slate-700 text-slate-300">
                  OPERATOR-FÄHIGKEITENBAUM
                </span>
                <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 border border-amber-500/40 text-amber-300">
                  3 SPEZIALISIERUNGS-PFADE
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
                <span>Operator-Skilltree & Talente</span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                Schalte dauerhafte passive Gefechtsvorteile frei! Erhalte Skill-Punkte (SP) durch Operator-Levelaufstiege und Match-Siege – oder trainiere deine Talente direkt mit Neu-Anspach-Talern (NAT).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto shrink-0">
              {/* Operator Level & Available SP Badge */}
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-purple-950/60 border border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.2)] font-mono">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/50 flex items-center justify-center text-purple-300">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-purple-300/80 uppercase tracking-wider font-semibold">
                    Operator Lv. {operatorLevel}
                  </div>
                  <div className="text-base font-black text-purple-200 tabular-nums">
                    {skillPoints} <span className="text-xs text-purple-300/70">SP verfügbar</span>
                  </div>
                </div>
              </div>

              {/* Available NAT City Vault Badge */}
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-950/90 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)] font-mono">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-amber-400/80 uppercase tracking-wider font-semibold">
                    Stadtkasse
                  </div>
                  <div className="text-base font-black text-amber-300 tabular-nums">
                    {budget.toLocaleString('de-DE')} <span className="text-xs text-amber-400/70">NAT</span>
                  </div>
                </div>
              </div>

              {/* Respec Button */}
              {bonuses.totalPointsSpent > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playReload();
                    onResetSkillTree();
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/90 text-slate-200 font-mono font-bold text-xs border border-slate-700 hover:border-slate-600 transition-all cursor-pointer shadow-md"
                  title="Alle investierten Skill-Punkte kostenlos zurückerstatten"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Respec ({bonuses.totalPointsSpent} SP)</span>
                </button>
              )}

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <X className="w-4 h-4 stroke-[3]" />
                  <span>Zurück</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Active Bonus Telemetry Summary Bar */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            {
              icon: Flame,
              label: 'Waffenschaden',
              val: `+${Math.round((bonuses.damageMultiplier - 1) * 100)}%`,
              sub: `Boss: +${Math.round((bonuses.bossDamageMultiplier - 1) * 100)}%`,
              color: 'text-amber-400',
              border: 'border-amber-500/30',
              bg: 'bg-amber-500/5',
            },
            {
              icon: Zap,
              label: 'Nachladen & Kadenz',
              val: `+${Math.round((bonuses.reloadSpeedMultiplier - 1) * 100)}%`,
              sub: `Kadenz: +${Math.round((bonuses.fireRateMultiplier - 1) * 100)}%`,
              color: 'text-orange-400',
              border: 'border-orange-500/30',
              bg: 'bg-orange-500/5',
            },
            {
              icon: Shield,
              label: 'Max HP & Schild',
              val: `+${bonuses.maxHpBonus} HP`,
              sub: `+${bonuses.maxShieldBonus} Schild`,
              color: 'text-cyan-400',
              border: 'border-cyan-500/30',
              bg: 'bg-cyan-500/5',
            },
            {
              icon: Heart,
              label: 'Selbstheilung',
              val: `+${bonuses.regenPerSec.toFixed(1)}/s`,
              sub: `-${Math.round(bonuses.damageReduction * 100)}% Feindschaden`,
              color: 'text-emerald-400',
              border: 'border-emerald-500/30',
              bg: 'bg-emerald-500/5',
            },
            {
              icon: TrendingUp,
              label: 'Tempo & Beute',
              val: `+${Math.round((bonuses.speedMultiplier - 1) * 100)}% Tempo`,
              sub: `+${Math.round((bonuses.lootXpMultiplier - 1) * 100)}% NAT & XP`,
              color: 'text-purple-400',
              border: 'border-purple-500/30',
              bg: 'bg-purple-500/5',
            },
            {
              icon: Users,
              label: 'Trupp & Vampir',
              val: `+${Math.round((bonuses.allyHpMultiplier - 1) * 100)}% Squad`,
              sub: `+${bonuses.killShieldRestore} Schild/Kill`,
              color: 'text-fuchsia-400',
              border: 'border-fuchsia-500/30',
              bg: 'bg-fuchsia-500/5',
            },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={`p-3.5 rounded-xl bg-slate-900/80 backdrop-blur-md border ${stat.border} ${stat.bg} font-mono transition-all hover:scale-[1.02] shadow-md`}
              >
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase tracking-wider truncate mb-1">
                  <Icon className={`w-3.5 h-3.5 ${stat.color} shrink-0`} />
                  <span className="truncate">{stat.label}</span>
                </div>
                <div className={`text-base font-black tabular-nums tracking-tight ${stat.color}`}>
                  {stat.val}
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">{stat.sub}</div>
              </div>
            );
          })}
        </section>

        {/* 3 Skill Tree Branch Columns with Glowing Energy Conduits */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {SKILL_BRANCHES.map((branch) => {
            const BranchIcon = getBranchIcon(branch.id);
            const theme = getBranchTheme(branch.id);
            const branchNodes = SKILL_TREE_NODES.filter((n) => n.branch === branch.id).sort(
              (a, b) => a.tier - b.tier
            );

            return (
              <div
                key={branch.id}
                className={`p-5 sm:p-6 rounded-2xl bg-gradient-to-b ${theme.bgGrad} border ${theme.border} ${theme.glow} backdrop-blur-md flex flex-col space-y-5 shadow-2xl relative overflow-hidden`}
              >
                {/* Branch Header with Insignia */}
                <div className="flex items-start gap-3.5 pb-4 border-b border-slate-800 relative">
                  <div
                    className={`p-3 rounded-xl border ${theme.badgeBg} shrink-0 flex items-center justify-center shadow-lg`}
                  >
                    <BranchIcon className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-white tracking-wide uppercase">
                      {branch.title}
                    </h2>
                    <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{branch.subtitle}</p>
                  </div>
                </div>

                {/* Vertical Connected Skill Nodes with Tactical Conduits */}
                <div className="space-y-4 relative">
                  {branchNodes.map((node: SkillNodeDef, idx: number) => {
                    const currentLv = skillTree[node.id] || 0;
                    const isMax = currentLv >= node.maxLevel;
                    const unlocked = isSkillNodeUnlocked(node, skillTree);
                    const natCost = node.costNATPerLevel * (currentLv + 1);
                    const canAffordSP = unlocked && !isMax && skillPoints >= node.costSP;
                    const canAffordNAT = unlocked && !isMax && budget >= natCost;
                    const parentNode = node.requiresSkillId
                      ? SKILL_TREE_NODES.find((n) => n.id === node.requiresSkillId)
                      : null;

                    return (
                      <React.Fragment key={node.id}>
                        {/* Glowing Energy Conduit between tiers */}
                        {idx > 0 && (
                          <div className="flex flex-col items-center justify-center -my-2.5 relative z-10">
                            <div
                              className={`w-1 h-5 rounded-full transition-all duration-300 ${
                                unlocked ? theme.conduitActive : 'bg-slate-800'
                              }`}
                            />
                            {unlocked && (
                              <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)] -mt-1.5" />
                            )}
                          </div>
                        )}

                        <div
                          className={`relative p-4 sm:p-5 rounded-2xl border transition-all duration-200 ${
                            isMax
                              ? 'bg-slate-950 border-emerald-500/70 shadow-[0_0_25px_rgba(16,185,129,0.2)] ring-1 ring-emerald-500/40'
                              : unlocked
                              ? node.isUltimate
                                ? 'bg-gradient-to-br from-slate-950 via-slate-950 to-amber-950/30 border-amber-400/80 shadow-[0_0_25px_rgba(245,158,11,0.2)]'
                                : 'bg-slate-950/80 hover:bg-slate-950 border-slate-700/80 hover:border-slate-600 shadow-md'
                              : 'bg-slate-950/40 border-slate-800/60 opacity-65'
                          }`}
                        >
                          {/* Corner Accent for Ultimate */}
                          {node.isUltimate && (
                            <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-mono font-black text-amber-400 bg-amber-500/15 border border-amber-400/40 px-2 py-0.5 rounded-full shadow-sm">
                              <Sparkles className="w-3 h-3" />
                              <span>APEX</span>
                            </div>
                          )}

                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-[10px] font-mono">
                                <span
                                  className={`px-1.5 py-0.5 rounded font-black tracking-wider ${
                                    node.isUltimate
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                                  }`}
                                >
                                  {getTierLabel(node.tier, node.isUltimate)}
                                </span>
                                <span className="text-slate-400 font-semibold">{node.subtitle}</span>
                              </div>

                              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                                <span>{node.name}</span>
                                {isMax && (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                )}
                                {!unlocked && (
                                  <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                )}
                              </h3>
                            </div>

                            <div className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs font-black text-amber-400 shrink-0 tabular-nums">
                              Lv. {currentLv}/{node.maxLevel}
                            </div>
                          </div>

                          {/* Segmented LED Pip Progress Bar */}
                          <div
                            className="grid gap-1.5 my-3"
                            style={{
                              gridTemplateColumns: `repeat(${node.maxLevel}, minmax(0, 1fr))`,
                            }}
                          >
                            {Array.from({ length: node.maxLevel }).map((_, i) => (
                              <div
                                key={i}
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                  currentLv > i
                                    ? isMax
                                      ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.7)]'
                                      : theme.pipActive
                                    : 'bg-slate-800'
                                }`}
                              />
                            ))}
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed font-normal">
                            {node.description}
                          </p>

                          {/* Effect Labels with Glowing Bullets */}
                          <div className="mt-2.5 space-y-1">
                            {node.effectLabels.map((lbl, i) => (
                              <div
                                key={i}
                                className="text-[11px] font-mono text-emerald-300 font-semibold flex items-center gap-1.5"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)] shrink-0" />
                                <span>{lbl}</span>
                              </div>
                            ))}
                          </div>

                          {/* Prerequisite Lock Info or Dual Upgrade Trigger Buttons */}
                          <div className="mt-4 pt-3 border-t border-slate-800/80">
                            {!unlocked ? (
                              <div className="flex items-center gap-1.5 text-xs font-mono text-amber-400/90 bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl">
                                <Lock className="w-3.5 h-3.5 shrink-0" />
                                <span>
                                  Benötigt „{parentNode?.name}“ auf Stufe {node.requiresSkillLevel || 1}
                                </span>
                              </div>
                            ) : isMax ? (
                              <div className="w-full py-2.5 px-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-xs text-center shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                                [STUFE MAXIMIERT · PERK AKTIV]
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-2.5">
                                {/* SP Button */}
                                <button
                                  type="button"
                                  disabled={!canAffordSP}
                                  onClick={() => {
                                    soundFx.playLevelUp();
                                    onUpgradeSkillWithSP(node.id, node.costSP);
                                  }}
                                  className={`py-2.5 px-2.5 rounded-xl font-mono font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md ${
                                    canAffordSP
                                      ? 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:scale-[1.02] active:scale-[0.98]'
                                      : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                                  }`}
                                >
                                  <Award className="w-3.5 h-3.5 shrink-0" />
                                  <span>+{node.costSP} SP lernen</span>
                                </button>

                                {/* NAT Button */}
                                <button
                                  type="button"
                                  disabled={!canAffordNAT}
                                  onClick={() => {
                                    soundFx.playLevelUp();
                                    onUpgradeSkillWithNAT(node.id, natCost);
                                  }}
                                  className={`py-2.5 px-2.5 rounded-xl font-mono font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md ${
                                    canAffordNAT
                                      ? 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.25)] hover:scale-[1.02] active:scale-[0.98]'
                                      : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                                  }`}
                                >
                                  <ArrowUpRight className="w-3.5 h-3.5 shrink-0 stroke-[3]" />
                                  <span>{natCost} NAT</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
