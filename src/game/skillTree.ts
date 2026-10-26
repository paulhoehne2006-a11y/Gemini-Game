import { SkillTreeLevels } from '../types';

export type SkillBranchId = 'combat' | 'defense' | 'tactics';

export interface SkillNodeDef {
  id: string;
  branch: SkillBranchId;
  tier: 1 | 2 | 3 | 4;
  name: string;
  subtitle: string;
  description: string;
  maxLevel: number;
  costSP: number;
  costNATPerLevel: number;
  requiresSkillId?: string;
  requiresSkillLevel?: number;
  requiredOperatorLevel?: number;
  effectLabels: string[];
  isUltimate?: boolean;
}

export interface SkillBranchMeta {
  id: SkillBranchId;
  title: string;
  subtitle: string;
  accentHex: string;
  borderClass: string;
  badgeClass: string;
}

export const SKILL_BRANCHES: SkillBranchMeta[] = [
  {
    id: 'combat',
    title: 'STURM & FEUERKRAFT',
    subtitle: 'Waffenschaden, Nachladetempo, Krit-Treffer & Boss-Brecher',
    accentHex: '#F59E0B',
    borderClass: 'border-amber-500/50',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  {
    id: 'defense',
    title: 'BÜRGERWEHR-BOLLWERK',
    subtitle: 'Maximal-Leben, Elektro-Schild, Selbstheilung & Nebelschutz',
    accentHex: '#06B6D4',
    borderClass: 'border-cyan-500/50',
    badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  },
  {
    id: 'tactics',
    title: 'TAKTIK & TRUPPFÜHRUNG',
    subtitle: 'Sprinttempo, Beute-Multiplikator, Trupp-Stärke & Kill-Schildraub',
    accentHex: '#A855F7',
    borderClass: 'border-purple-500/50',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  },
];

export const SKILL_TREE_NODES: SkillNodeDef[] = [
  // ================= BRANCH 1: COMBAT (STURM & FEUERKRAFT) =================
  {
    id: 'bembel_wucht',
    branch: 'combat',
    tier: 1,
    name: 'Äppler-Hohlspitz',
    subtitle: 'Stufe 1 · Grundlegende Feuerkraft',
    description: 'Verstärkte Taunus-Treibladung erhöht den Grundschaden aller Haupt- und Spezialwaffen.',
    maxLevel: 5,
    costSP: 1,
    costNATPerLevel: 180,
    requiredOperatorLevel: 1,
    effectLabels: ['+8% Waffenschaden pro Stufe (bis +40%)'],
  },
  {
    id: 'schnellfinger',
    branch: 'combat',
    tier: 2,
    name: 'Taunus-Schnellfinger',
    subtitle: 'Stufe 2 · Nachladen & Kadenz',
    description: 'Geübte Handgriffe verkürzen die Nachladezeit drastisch und steigern die Schussfrequenz.',
    maxLevel: 4,
    costSP: 2,
    costNATPerLevel: 320,
    requiresSkillId: 'bembel_wucht',
    requiresSkillLevel: 2,
    requiredOperatorLevel: 3,
    effectLabels: ['+12% Nachladetempo pro Stufe', '+5% Feuerrate pro Stufe'],
  },
  {
    id: 'adlerauge',
    branch: 'combat',
    tier: 3,
    name: 'Feldberg-Adlerauge',
    subtitle: 'Stufe 3 · Kritische Präzision',
    description: 'Schwachstellen-Visierung erhöht die kritische Trefferchance sowie den kritischen Schadensfaktor.',
    maxLevel: 4,
    costSP: 2,
    costNATPerLevel: 520,
    requiresSkillId: 'schnellfinger',
    requiresSkillLevel: 2,
    requiredOperatorLevel: 6,
    effectLabels: ['+5% Krit-Chance pro Stufe', '+14% Krit-Schaden pro Stufe'],
  },
  {
    id: 'sprengmeister',
    branch: 'combat',
    tier: 4,
    name: 'Traktor-Horst-Bezwinger (ULTIMATE)',
    subtitle: 'Stufe 4 · Boss- & Explosiv-Dominanz',
    description: 'Ultimative Offensiv-Meisterschaft: Massiver Zusatzschaden gegen Bosse & vergrößerter Wirkungsradius.',
    maxLevel: 3,
    costSP: 3,
    costNATPerLevel: 900,
    requiresSkillId: 'adlerauge',
    requiresSkillLevel: 3,
    requiredOperatorLevel: 10,
    effectLabels: ['+18% Schaden gegen Bosse & Stoßtruppen pro Stufe', '+18% Splitter-/Wirkungsradius pro Stufe'],
    isUltimate: true,
  },

  // ================= BRANCH 2: DEFENSE (BÜRGERWEHR-BOLLWERK) =================
  {
    id: 'kevlar_weste',
    branch: 'defense',
    tier: 1,
    name: 'Hessenpark-Kevlarweste',
    subtitle: 'Stufe 1 · Körperpanzerung',
    description: 'Verstärkte Schutzplatten unter der Anspacher Einsatzjacke erhöhen deine maximalen Lebenspunkte.',
    maxLevel: 5,
    costSP: 1,
    costNATPerLevel: 180,
    requiredOperatorLevel: 1,
    effectLabels: ['+20 Maximale HP pro Stufe (bis +100 HP)'],
  },
  {
    id: 'elektro_schild',
    branch: 'defense',
    tier: 2,
    name: 'Stadtwerke-Energieschild',
    subtitle: 'Stufe 2 · Schild-Kapazität',
    description: 'Hochspannungs-Kondensator der Stadtwerke Neu-Anspach vergrößert deinen blauen Schutzschild.',
    maxLevel: 4,
    costSP: 2,
    costNATPerLevel: 320,
    requiresSkillId: 'kevlar_weste',
    requiresSkillLevel: 2,
    requiredOperatorLevel: 3,
    effectLabels: ['+25 Maximaler Schild pro Stufe (bis +100 Schild)'],
  },
  {
    id: 'handkaes_vitalitaet',
    branch: 'defense',
    tier: 3,
    name: 'Handkäs-Regeneration',
    subtitle: 'Stufe 3 · Automatische Selbstheilung',
    description: 'Regeneriert im laufenden Einsatz kontinuierlich Lebenspunkte und Schildenergie pro Sekunde.',
    maxLevel: 4,
    costSP: 2,
    costNATPerLevel: 520,
    requiresSkillId: 'elektro_schild',
    requiresSkillLevel: 2,
    requiredOperatorLevel: 6,
    effectLabels: ['+1.8 HP & +1.8 Schild / Sekunde pro Stufe'],
  },
  {
    id: 'nebel_bollwerk',
    branch: 'defense',
    tier: 4,
    name: 'Taunus-Titanenrüstung (ULTIMATE)',
    subtitle: 'Stufe 4 · Schadensreduktion & Nebelfilter',
    description: 'Ultimativer Schutz: Reduziert allen erlittenen Feind- und Taunus-Nebel-Schaden drastisch.',
    maxLevel: 3,
    costSP: 3,
    costNATPerLevel: 900,
    requiresSkillId: 'handkaes_vitalitaet',
    requiresSkillLevel: 3,
    requiredOperatorLevel: 10,
    effectLabels: ['-10% erlittener Feindschaden pro Stufe', '-22% Taunus-Nebel-Schaden pro Stufe'],
    isUltimate: true,
  },

  // ================= BRANCH 3: TACTICS (TAKTIK & TRUPPFÜHRUNG) =================
  {
    id: 'lochmuehle_sprinter',
    branch: 'tactics',
    tier: 1,
    name: 'Lochmühle-Leichtfüßigkeit',
    subtitle: 'Stufe 1 · Mobilität & Sprungkraft',
    description: 'Erhöht dein Geh-, Ziel- und Sprinttempo sowie deine Sprunghöhe auf Dächer und Vorsprünge.',
    maxLevel: 5,
    costSP: 1,
    costNATPerLevel: 180,
    requiredOperatorLevel: 1,
    effectLabels: ['+5% Bewegungstempo & +5% Sprungkraft pro Stufe'],
  },
  {
    id: 'schatzsucher',
    branch: 'tactics',
    tier: 2,
    name: 'Anspacher Beute-Scanner',
    subtitle: 'Stufe 2 · Mehr NAT, Waffen-XP & Munition',
    description: 'Jeder ausgeschaltete Gegner und jede Kiste liefert deutlich mehr NAT-Taler, Operator-XP und Waffen-XP.',
    maxLevel: 4,
    costSP: 2,
    costNATPerLevel: 320,
    requiresSkillId: 'lochmuehle_sprinter',
    requiresSkillLevel: 2,
    requiredOperatorLevel: 3,
    effectLabels: ['+12% Waffen-XP, Operator-XP & NAT-Beute pro Stufe (bis +48%)'],
  },
  {
    id: 'trupp_kommandant',
    branch: 'tactics',
    tier: 3,
    name: 'Bürgerwehr-Kommandant',
    subtitle: 'Stufe 3 · Verstärkter KI-Squad',
    description: 'Deine KI-Kameraden (Florian, Lena & Timo) erhalten deutlich mehr Lebenspunkte und Feuerkraft.',
    maxLevel: 4,
    costSP: 2,
    costNATPerLevel: 520,
    requiresSkillId: 'schatzsucher',
    requiresSkillLevel: 2,
    requiredOperatorLevel: 6,
    effectLabels: ['+20% Squad-HP & +18% Squad-Schaden pro Stufe'],
  },
  {
    id: 'feldberg_berserker',
    branch: 'tactics',
    tier: 4,
    name: 'Feldberg-Vampirismus (ULTIMATE)',
    subtitle: 'Stufe 4 · Sofort-Schildraub bei jedem Kill',
    description: 'Jeder eliminierte Wehrheimer lädt deinen Schild sofort auf und füllt dein Magazin teilweise nach.',
    maxLevel: 3,
    costSP: 3,
    costNATPerLevel: 900,
    requiresSkillId: 'trupp_kommandant',
    requiresSkillLevel: 3,
    requiredOperatorLevel: 10,
    effectLabels: ['+12 Schild & +6 HP sofort pro Kill (je Stufe)', '+3 Schuss Direkt-Magazin pro Kill'],
    isUltimate: true,
  },
];

export const INITIAL_SKILL_TREE: SkillTreeLevels = {
  bembel_wucht: 0,
  schnellfinger: 0,
  adlerauge: 0,
  sprengmeister: 0,
  kevlar_weste: 0,
  elektro_schild: 0,
  handkaes_vitalitaet: 0,
  nebel_bollwerk: 0,
  lochmuehle_sprinter: 0,
  schatzsucher: 0,
  trupp_kommandant: 0,
  feldberg_berserker: 0,
};

export interface SkillTreeBonuses {
  damageMultiplier: number;
  fireRateMultiplier: number;
  reloadSpeedMultiplier: number;
  critChanceBonus: number;
  critChance: number;
  critDamageMultiplier: number;
  splashRadiusMultiplier: number;
  bossDamageMultiplier: number;
  maxHpBonus: number;
  bonusMaxHp: number;
  maxShieldBonus: number;
  bonusMaxShield: number;
  bonusMagCapacity: number;
  regenPerSec: number;
  hpRegenPerSec: number;
  shieldRegenPerSec: number;
  damageReduction: number;
  damageTakenMultiplier: number;
  stormDamageReduction: number;
  stormDamageMultiplier: number;
  speedMultiplier: number;
  moveSpeedMultiplier: number;
  jumpMultiplier: number;
  jumpSpeedMultiplier: number;
  lootXpMultiplier: number;
  talerBonusMultiplier: number;
  weaponXpMultiplier: number;
  allyHpMultiplier: number;
  allyDamageMultiplier: number;
  killShieldRestore: number;
  shieldOnKill: number;
  killHpRestore: number;
  hpOnKill: number;
  killAmmoRestore: number;
  ammoRefundOnKill: number;
  totalPointsSpent: number;
}

export function getOperatorXpForNextLevel(level: number): number {
  const clamped = Math.max(1, level);
  return Math.round(180 + (clamped - 1) * 95 + Math.pow(clamped - 1, 1.3) * 20);
}

export function isSkillNodeUnlocked(
  node: SkillNodeDef,
  levels: SkillTreeLevels,
  operatorLevel = 99
): boolean {
  if (operatorLevel < (node.requiredOperatorLevel || 1)) return false;
  if (!node.requiresSkillId) return true;
  const reqLv = node.requiresSkillLevel || 1;
  return (levels[node.requiresSkillId] || 0) >= reqLv;
}

export function getTotalSpentSkillPoints(levels: SkillTreeLevels): number {
  return SKILL_TREE_NODES.reduce((sum, node) => {
    const lv = levels[node.id] || 0;
    return sum + lv * node.costSP;
  }, 0);
}

export function computeSkillTreeBonuses(levels: SkillTreeLevels = INITIAL_SKILL_TREE): SkillTreeBonuses {
  const wucht = levels.bembel_wucht || 0;
  const schnell = levels.schnellfinger || 0;
  const adler = levels.adlerauge || 0;
  const spreng = levels.sprengmeister || 0;

  const kevlar = levels.kevlar_weste || 0;
  const schild = levels.elektro_schild || 0;
  const vital = levels.handkaes_vitalitaet || 0;
  const bollwerk = levels.nebel_bollwerk || 0;

  const sprinter = levels.lochmuehle_sprinter || 0;
  const schatz = levels.schatzsucher || 0;
  const trupp = levels.trupp_kommandant || 0;
  const vampir = levels.feldberg_berserker || 0;

  const damageReduction = Math.min(0.45, bollwerk * 0.1);
  const stormDamageReduction = Math.min(0.75, bollwerk * 0.22);
  const regenPerSec = Number((vital * 1.8).toFixed(2));
  const speedMultiplier = 1 + sprinter * 0.05;
  const jumpMultiplier = 1 + sprinter * 0.05;
  const lootXpMultiplier = 1 + schatz * 0.12;
  const critChanceBonus = adler * 0.05;
  const maxHpBonus = kevlar * 20;
  const maxShieldBonus = schild * 25;
  const killShieldRestore = vampir * 12;
  const killHpRestore = vampir * 6;
  const killAmmoRestore = vampir * 3;

  return {
    damageMultiplier: 1 + wucht * 0.08,
    fireRateMultiplier: 1 + schnell * 0.05,
    reloadSpeedMultiplier: 1 + schnell * 0.12,
    critChanceBonus,
    critChance: critChanceBonus,
    critDamageMultiplier: 1.5 + adler * 0.14,
    splashRadiusMultiplier: 1 + spreng * 0.18,
    bossDamageMultiplier: 1 + spreng * 0.18,
    maxHpBonus,
    bonusMaxHp: maxHpBonus,
    maxShieldBonus,
    bonusMaxShield: maxShieldBonus,
    bonusMagCapacity: schnell * 3,
    regenPerSec,
    hpRegenPerSec: regenPerSec,
    shieldRegenPerSec: regenPerSec,
    damageReduction,
    damageTakenMultiplier: 1 - damageReduction,
    stormDamageReduction,
    stormDamageMultiplier: 1 - stormDamageReduction,
    speedMultiplier,
    moveSpeedMultiplier: speedMultiplier,
    jumpMultiplier,
    jumpSpeedMultiplier: jumpMultiplier,
    lootXpMultiplier,
    talerBonusMultiplier: lootXpMultiplier,
    weaponXpMultiplier: lootXpMultiplier,
    allyHpMultiplier: 1 + trupp * 0.2,
    allyDamageMultiplier: 1 + trupp * 0.18,
    killShieldRestore,
    shieldOnKill: killShieldRestore,
    killHpRestore,
    hpOnKill: killHpRestore,
    killAmmoRestore,
    ammoRefundOnKill: killAmmoRestore,
    totalPointsSpent: getTotalSpentSkillPoints(levels),
  };
}
