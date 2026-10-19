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

  return (
    <div className="w-full min-h-full bg-slate-950 text-slate-100 p-4 sm:p-6 pb-28 lg:pb-12">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div>
            <div className="text-xs font-mono text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>TAUNUS-OPERATOR FÄHIGKEITENBAum (SKILLTREE) · 3 SPEZIALISIERUNGS-ÄSTE</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight mt-0.5">
              Operator-Skilltree & Spezial-Talente
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Schalte dauerhafte Kampfvorteile frei! Du erhältst Skill-Punkte (SP) durch Stufenaufstiege und Siege – oder bildest deinen Operator direkt mit Neu-Anspach-Talern (NAT) weiter.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Operator Level & Available SP */}
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-purple-950/50 border border-purple-500/40 font-mono">
              <Award className="w-5 h-5 text-purple-400" />
              <div>
                <div className="text-[10px] text-purple-300/80 uppercase">
                  OPERATOR LV. {operatorLevel} · SKILL-PUNKTE
                </div>
                <div className="text-base font-black text-purple-300 tabular-nums">
                  {skillPoints} SP verfügbar
                </div>
              </div>
            </div>

            {/* Available NAT */}
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono">
              <Coins className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-[10px] text-slate-500 uppercase">STADTKASSE</div>
                <div className="text-base font-bold text-amber-400 tabular-nums">
                  {budget.toLocaleString('de-DE')} NAT
                </div>
              </div>
            </div>

            {bonuses.totalPointsSpent > 0 && (
              <button
                type="button"
                onClick={() => {
                  soundFx.playReload();
                  onResetSkillTree();
                }}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-xs border border-slate-700 cursor-pointer"
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
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Zurück</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Bonus Telemetry Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {[
            {
              label: 'Waffenschaden',
              val: `+${Math.round((bonuses.damageMultiplier - 1) * 100)}%`,
              sub: `Boss: +${Math.round((bonuses.bossDamageMultiplier - 1) * 100)}%`,
              color: 'text-amber-400',
            },
            {
              label: 'Nachladen & Kadenz',
              val: `+${Math.round((bonuses.reloadSpeedMultiplier - 1) * 100)}%`,
              sub: `Feuerrate +${Math.round((bonuses.fireRateMultiplier - 1) * 100)}%`,
              color: 'text-orange-400',
            },
            {
              label: 'Max HP & Schild',
              val: `+${bonuses.maxHpBonus} HP`,
              sub: `+${bonuses.maxShieldBonus} Schild`,
              color: 'text-cyan-400',
            },
            {
              label: 'Selbstheilung',
              val: `+${bonuses.regenPerSec.toFixed(1)}/s`,
              sub: `-${Math.round(bonuses.damageReduction * 100)}% Feindschaden`,
              color: 'text-emerald-400',
            },
            {
              label: 'Tempo & Beute',
              val: `+${Math.round((bonuses.speedMultiplier - 1) * 100)}% Tempo`,
              sub: `+${Math.round((bonuses.lootXpMultiplier - 1) * 100)}% XP & NAT`,
              color: 'text-purple-400',
            },
            {
              label: 'Trupp & Vampir',
              val: `+${Math.round((bonuses.allyHpMultiplier - 1) * 100)}% Squad`,
              sub: `+${bonuses.killShieldRestore} Schild/Kill`,
              color: 'text-fuchsia-400',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 font-mono"
            >
              <div className="text-[10px] text-slate-400 uppercase truncate">{stat.label}</div>
              <div className={`text-base font-black tabular-nums mt-0.5 ${stat.color}`}>
                {stat.val}
              </div>
              <div className="text-[10px] text-slate-500 truncate">{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* 3 Skill Tree Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {SKILL_BRANCHES.map((branch) => {
            const BranchIcon = getBranchIcon(branch.id);
            const branchNodes = SKILL_TREE_NODES.filter((n) => n.branch === branch.id).sort(
              (a, b) => a.tier - b.tier
            );

            return (
              <div
                key={branch.id}
                className={`p-5 rounded-2xl bg-slate-900/90 border ${branch.borderClass} flex flex-col space-y-4 shadow-xl`}
              >
                {/* Branch Header */}
                <div className="flex items-start gap-3 pb-3 border-b border-slate-800">
                  <div
                    className={`p-2.5 rounded-xl border ${branch.badgeClass} shrink-0 flex items-center justify-center`}
                  >
                    <BranchIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-white tracking-wide">
                      {branch.title}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">{branch.subtitle}</p>
                  </div>
                </div>

                {/* Vertical Connected Skill Nodes */}
                <div className="space-y-3 relative">
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
                        {/* Connector Line between tiers */}
                        {idx > 0 && (
                          <div className="flex justify-center -my-1.5">
                            <div
                              className={`w-1 h-4 rounded-full transition-colors ${
                                unlocked ? 'bg-amber-400' : 'bg-slate-800'
                              }`}
                            />
                          </div>
                        )}

                        <div
                          className={`p-4 rounded-2xl border transition-all ${
                            isMax
                              ? 'bg-slate-950 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.12)]'
                              : unlocked
                              ? node.isUltimate
                                ? 'bg-slate-950/90 border-amber-400/60'
                                : 'bg-slate-950/80 border-slate-700 hover:border-slate-600'
                              : 'bg-slate-950/40 border-slate-800/60 opacity-65'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5 text-[10px] font-mono">
                                <span
                                  className={`px-1.5 py-0.5 rounded font-bold ${
                                    node.isUltimate
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                                      : 'bg-slate-800 text-slate-300'
                                  }`}
                                >
                                  {node.isUltimate ? 'ULTIMATE · TIER 4' : `TIER ${node.tier}`}
                                </span>
                                <span className="text-slate-400">{node.subtitle}</span>
                              </div>
                              <h3 className="text-sm font-black text-white mt-1 flex items-center gap-1.5">
                                <span>{node.name}</span>
                                {isMax && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                                {!unlocked && <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                              </h3>
                            </div>

                            <div className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs font-black text-amber-400 shrink-0 tabular-nums">
                              Lv. {currentLv}/{node.maxLevel}
                            </div>
                          </div>

                          {/* Level Progress Pip Bars */}
                          <div
                            className="grid gap-1.5 my-2.5"
                            style={{ gridTemplateColumns: `repeat(${node.maxLevel}, minmax(0, 1fr))` }}
                          >
                            {Array.from({ length: node.maxLevel }).map((_, i) => (
                              <div
                                key={i}
                                className={`h-1.5 rounded-full transition-colors ${
                                  currentLv > i
                                    ? isMax
                                      ? 'bg-emerald-400'
                                      : 'bg-amber-400'
                                    : 'bg-slate-800'
                                }`}
                              />
                            ))}
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed">{node.description}</p>

                          <div className="mt-2 space-y-1">
                            {node.effectLabels.map((lbl, i) => (
                              <div
                                key={i}
                                className="text-[11px] font-mono text-emerald-400 font-semibold"
                              >
                                {lbl}
                              </div>
                            ))}
                          </div>

                          {/* Prerequisite Lock Info or Upgrade Buttons */}
                          <div className="mt-3 pt-2.5 border-t border-slate-800/80">
                            {!unlocked ? (
                              <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-400/90">
                                <Lock className="w-3.5 h-3.5 shrink-0" />
                                <span>
                                  Benötigt „{parentNode?.name}“ auf Stufe {node.requiresSkillLevel || 1}
                                </span>
                              </div>
                            ) : isMax ? (
                              <div className="w-full py-2 px-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono font-bold text-xs text-center">
                                MAXIMALE STUFE FREIGESCHALTET
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  disabled={!canAffordSP}
                                  onClick={() => {
                                    soundFx.playLevelUp();
                                    onUpgradeSkillWithSP(node.id, node.costSP);
                                  }}
                                  className={`py-2 px-2.5 rounded-xl font-mono font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
                                    canAffordSP
                                      ? 'bg-purple-500 hover:bg-purple-400 text-slate-950 shadow-md'
                                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                  }`}
                                >
                                  <Award className="w-3.5 h-3.5 shrink-0" />
                                  <span>+{node.costSP} SP lernen</span>
                                </button>

                                <button
                                  type="button"
                                  disabled={!canAffordNAT}
                                  onClick={() => {
                                    soundFx.playLevelUp();
                                    onUpgradeSkillWithNAT(node.id, natCost);
                                  }}
                                  className={`py-2 px-2.5 rounded-xl font-mono font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
                                    canAffordNAT
                                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md'
                                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                  }`}
                                >
                                  <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
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
