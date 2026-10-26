import React from 'react';
import {
  SKILL_BRANCHES,
  SKILL_TREE_NODES,
  SkillNodeDef,
  computeSkillTreeBonuses,
  isSkillNodeUnlocked,
  getOperatorXpForNextLevel,
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
  Award,
  X,
  Cpu,
  TrendingUp,
  Heart,
  Users,
} from 'lucide-react';
import { soundFx } from '../audio/soundFx';

interface SkillTreeViewProps {
  budget: number;
  skillPoints: number;
  operatorLevel: number;
  operatorXp?: number;
  skillTree: SkillTreeLevels;
  onUpgradeSkillWithSP: (skillId: string, spCost: number) => void;
  onUpgradeSkillWithNAT?: (skillId: string, natCost: number) => void;
  onResetSkillTree: () => void;
  onClose?: () => void;
}

export const SkillTreeView: React.FC<SkillTreeViewProps> = ({
  budget,
  skillPoints,
  operatorLevel,
  operatorXp = 0,
  skillTree,
  onUpgradeSkillWithSP,
  onResetSkillTree,
  onClose,
}) => {
  const bonuses = computeSkillTreeBonuses(skillTree);
  const nextLevelXp = getOperatorXpForNextLevel(operatorLevel);
  const xpPct = Math.min(100, Math.round((operatorXp / Math.max(1, nextLevelXp)) * 100));

  const getBranchIcon = (branchId: string) => {
    if (branchId === 'combat') return Flame;
    if (branchId === 'defense') return Shield;
    return Zap;
  };

  const getBranchTheme = (branchId: string) => {
    switch (branchId) {
      case 'combat':
        return {
          bgGrad: 'from-slate-900/85 via-slate-900/75 to-amber-950/25',
          border: 'border-amber-500/35',
          glow: 'shadow-[0_8px_32px_rgba(245,158,11,0.12)]',
          badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-400/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]',
          pipActive: 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]',
          conduitActive: 'bg-gradient-to-b from-amber-400 via-yellow-300 to-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.8)]',
        };
      case 'defense':
        return {
          bgGrad: 'from-slate-900/85 via-slate-900/75 to-cyan-950/25',
          border: 'border-cyan-500/35',
          glow: 'shadow-[0_8px_32px_rgba(6,182,212,0.12)]',
          badgeBg: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]',
          pipActive: 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]',
          conduitActive: 'bg-gradient-to-b from-cyan-400 via-sky-300 to-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.8)]',
        };
      case 'tactics':
      default:
        return {
          bgGrad: 'from-slate-900/85 via-slate-900/75 to-purple-950/25',
          border: 'border-purple-500/35',
          glow: 'shadow-[0_8px_32px_rgba(168,85,247,0.12)]',
          badgeBg: 'bg-purple-500/15 text-purple-300 border-purple-400/40 shadow-[0_0_12px_rgba(168,85,247,0.2)]',
          pipActive: 'bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]',
          conduitActive: 'bg-gradient-to-b from-purple-400 via-fuchsia-300 to-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.8)]',
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
    <div className="w-full min-h-full bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 pb-32 lg:pb-16 selection:bg-purple-500/30 selection:text-purple-200">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Top Header - Dark Obsidian Glassmorphism with Cyber Conduit Framing */}
        <header className="relative overflow-hidden rounded-3xl bg-slate-900/70 backdrop-blur-xl border border-white/10 p-5 sm:p-7 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          {/* Subtle Cyber Glow Backlights */}
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />

          {/* Tactical Corner Brackets */}
          <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-purple-400/50 pointer-events-none" />
          <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-purple-400/50 pointer-events-none" />
          <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-purple-400/50 pointer-events-none" />
          <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-purple-400/50 pointer-events-none" />

          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider bg-purple-500/15 border border-purple-400/40 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.2)] flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" />
                  [SYSTEM: NEURAL COMBAT CONDUIT]
                </span>
                <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider bg-slate-800/80 border border-white/10 text-slate-300">
                  OPERATOR-FÄHIGKEITENBAUM
                </span>
                <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 border border-amber-400/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                  3 SPEZIALISIERUNGS-PFADE
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                <span>Operator-Skilltree & Talente</span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                Schalte dauerhafte passive Gefechtsvorteile frei! Erhalte Skill-Punkte (SP) durch Operator-Levelaufstiege, Wellen-Überleben und Match-Siege. Höhere Talent-Stufen setzen ein entsprechendes Operator-Level voraus.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto shrink-0">
              {/* Operator Level & Available SP Badge */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-purple-950/60 border border-purple-500/40 shadow-[0_0_24px_rgba(168,85,247,0.2)] font-mono">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.3)]">
                  <Award className="w-5 h-5" />
                </div>
                <div className="min-w-[140px]">
                  <div className="flex items-center justify-between gap-2 text-[10px] text-purple-300/80 uppercase tracking-wider font-bold">
                    <span>Operator Lv. {operatorLevel}</span>
                    <span className="text-purple-200 tabular-nums">
                      {operatorXp} / {getOperatorXpForNextLevel(operatorLevel)} XP
                    </span>
                  </div>
                  <div className="text-base sm:text-lg font-black text-purple-200 tabular-nums">
                    {skillPoints} <span className="text-xs text-purple-300/70 font-semibold">SP verfügbar</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-950 border border-white/10 overflow-hidden mt-1">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-400 transition-all duration-300"
                      style={{ width: `${xpPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Available NAT City Vault Badge */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-950/80 border border-amber-500/35 shadow-[0_0_20px_rgba(245,158,11,0.15)] font-mono">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] text-amber-400/80 uppercase tracking-wider font-bold">
                    Stadtkasse
                  </div>
                  <div className="text-base sm:text-lg font-black text-amber-300 tabular-nums">
                    {budget.toLocaleString('de-DE')} <span className="text-xs text-amber-400/70 font-semibold">NAT</span>
                  </div>
                </div>
              </div>

              {/* Respec Button with Tactile Feedback */}
              {bonuses.totalPointsSpent > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playReload();
                    onResetSkillTree();
                  }}
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-950/80 hover:bg-slate-900 text-slate-200 font-mono font-bold text-xs border border-white/10 hover:border-white/20 transition-all duration-150 cursor-pointer shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
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
                  className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs tracking-wider uppercase transition-all duration-150 shadow-[0_0_24px_rgba(245,158,11,0.35)] hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
                  aria-label="Zurück zum Gefecht"
                >
                  <X className="w-4 h-4 stroke-[3]" />
                  <span>Zurück</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Active Bonus Telemetry Summary Bar */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
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
                className={`p-4 rounded-2xl bg-slate-900/70 backdrop-blur-xl border ${stat.border} ${stat.bg} font-mono transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg shadow-sm`}
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
                className={`p-5 sm:p-7 rounded-3xl bg-gradient-to-b ${theme.bgGrad} border ${theme.border} ${theme.glow} backdrop-blur-xl flex flex-col space-y-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative overflow-hidden`}
              >
                {/* Branch Header with Insignia */}
                <div className="flex items-start gap-4 pb-4 border-b border-white/10 relative">
                  <div
                    className={`p-3.5 rounded-2xl border ${theme.badgeBg} shrink-0 flex items-center justify-center shadow-lg`}
                  >
                    <BranchIcon className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-white tracking-wide uppercase">
                      {branch.title}
                    </h2>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{branch.subtitle}</p>
                  </div>
                </div>

                {/* Vertical Connected Skill Nodes with Tactical Conduits */}
                <div className="space-y-4 relative">
                  {branchNodes.map((node: SkillNodeDef, idx: number) => {
                    const currentLv = skillTree[node.id] || 0;
                    const isMax = currentLv >= node.maxLevel;
                    const unlocked = isSkillNodeUnlocked(node, skillTree, operatorLevel);
                    const canAffordSP = unlocked && !isMax && skillPoints >= node.costSP;
                    const parentNode = node.requiresSkillId
                      ? SKILL_TREE_NODES.find((n) => n.id === node.requiresSkillId)
                      : null;
                    const missingOpLevel = (node.requiredOperatorLevel || 1) > operatorLevel;
                    const missingPrereqSkill =
                      !!node.requiresSkillId &&
                      (skillTree[node.requiresSkillId] || 0) < (node.requiresSkillLevel || 1);

                    return (
                      <React.Fragment key={node.id}>
                        {/* Glowing Energy Conduit between tiers */}
                        {idx > 0 && (
                          <div className="flex flex-col items-center justify-center -my-2.5 relative z-10">
                            <div
                              className={`w-1 h-6 rounded-full transition-all duration-300 ${
                                unlocked ? theme.conduitActive : 'bg-slate-800'
                              }`}
                            />
                            {unlocked && (
                              <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.95)] -mt-2 animate-pulse" />
                            )}
                          </div>
                        )}

                        <div
                          className={`relative p-4 sm:p-5 rounded-2xl border transition-all duration-150 ${
                            isMax
                              ? 'bg-slate-950 border-emerald-500/70 shadow-[0_0_24px_rgba(16,185,129,0.2)] ring-1 ring-emerald-500/40'
                              : unlocked
                              ? node.isUltimate
                                ? 'bg-gradient-to-br from-slate-950 via-slate-950 to-amber-950/30 border-amber-400/80 shadow-[0_0_24px_rgba(245,158,11,0.2)] hover:-translate-y-0.5'
                                : 'bg-slate-950/80 hover:bg-slate-950 border-white/10 hover:border-white/20 shadow-md hover:-translate-y-0.5'
                              : 'bg-slate-950/40 border-white/5 opacity-55'
                          }`}
                        >
                          {/* Corner Accent for Ultimate */}
                          {node.isUltimate && (
                            <div className="absolute top-2.5 right-2.5 flex items-center gap-1 text-[10px] font-mono font-black text-amber-400 bg-amber-500/15 border border-amber-400/40 px-2.5 py-0.5 rounded-full shadow-sm">
                              <Sparkles className="w-3 h-3" />
                              <span>APEX</span>
                            </div>
                          )}

                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-[10px] font-mono">
                                <span
                                  className={`px-2 py-0.5 rounded-md font-black tracking-wider ${
                                    node.isUltimate
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                                      : 'bg-slate-800/80 text-slate-300 border border-white/10'
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

                            <div className="px-2.5 py-1 rounded-lg bg-slate-900 border border-white/10 font-mono text-xs font-black text-amber-400 shrink-0 tabular-nums">
                              Lv. {currentLv}/{node.maxLevel}
                            </div>
                          </div>

                          {/* Segmented LED Pip Progress Bar */}
                          <div
                            className="grid gap-1.5 my-3.5"
                            style={{
                              gridTemplateColumns: `repeat(${node.maxLevel}, minmax(0, 1fr))`,
                            }}
                          >
                            {Array.from({ length: node.maxLevel }).map((_, i) => (
                              <div
                                key={i}
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  currentLv > i
                                    ? isMax
                                      ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.7)]'
                                      : theme.pipActive
                                    : 'bg-slate-850'
                                }`}
                              />
                            ))}
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed font-normal">
                            {node.description}
                          </p>

                          {/* Effect Labels with Glowing Bullets */}
                          <div className="mt-3 space-y-1">
                            {node.effectLabels.map((lbl, i) => (
                              <div
                                key={i}
                                className="text-[11px] font-mono text-emerald-300 font-semibold flex items-center gap-2"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)] shrink-0" />
                                <span>{lbl}</span>
                              </div>
                            ))}
                          </div>

                          {/* Prerequisite Lock Info or SP Upgrade Trigger Button */}
                          <div className="mt-4 pt-3.5 border-t border-white/10">
                            {!unlocked ? (
                              <div className="flex items-center gap-2 text-xs font-mono text-amber-400/90 bg-amber-500/10 border border-amber-500/25 p-3 rounded-xl">
                                <Lock className="w-4 h-4 shrink-0 text-amber-400" />
                                <span>
                                  {missingOpLevel && missingPrereqSkill
                                    ? `Benötigt Operator-Lv. ${node.requiredOperatorLevel} & „${parentNode?.name}“ Lv. ${node.requiresSkillLevel || 1}`
                                    : missingOpLevel
                                    ? `Benötigt Operator-Lv. ${node.requiredOperatorLevel}`
                                    : `Benötigt „${parentNode?.name}“ auf Stufe ${node.requiresSkillLevel || 1}`}
                                </span>
                              </div>
                            ) : isMax ? (
                              <div className="w-full py-2.5 px-3 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 font-mono font-bold text-xs text-center shadow-[0_0_12px_rgba(16,185,129,0.15)] flex items-center justify-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>[STUFE MAXIMIERT · PERK AKTIV]</span>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <button
                                  type="button"
                                  disabled={!canAffordSP}
                                  onClick={() => {
                                    soundFx.playLevelUp();
                                    onUpgradeSkillWithSP(node.id, node.costSP);
                                  }}
                                  className={`w-full py-2.5 px-3 rounded-xl font-mono font-black text-xs flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60 ${
                                    canAffordSP
                                      ? 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:-translate-y-0.5 active:scale-[0.98]'
                                      : 'bg-slate-850 text-slate-500 border border-white/5 cursor-not-allowed'
                                  }`}
                                >
                                  <Award className="w-3.5 h-3.5 shrink-0" />
                                  <span>+{node.costSP} SP lernen</span>
                                </button>
                                <div className="text-[10px] font-mono text-slate-400 text-center">
                                  Erfordert Skill-Punkte (SP) durch Level-Ups & Einsätze
                                </div>
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
