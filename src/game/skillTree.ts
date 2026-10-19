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
    maxLevel: 3,
    costSP: 1,
    costNATPerLevel: 120,
    effectLabels: ['+12% Waffenschaden pro Stufe (bis +36%)'],
  },
  {
    id: 'schnellfinger',
    branch: 'combat',
    tier: 2,
    name: 'Taunus-Schnellfinger',
    subtitle: 'Stufe 2 · Nachladen & Kadenz',
    description: 'Geübte Handgriffe verkürzen die Nachladezeit drastisch und steigern die Schussfrequenz.',
    maxLevel: 3,
    costSP: 1,
    costNATPerLevel: 180,
    requiresSkillId: 'bembel_wucht',
    requiresSkillLevel: 1,
    effectLabels: ['+16% Nachladetempo pro Stufe', '+6% Feuerrate pro Stufe'],
  },
  {
    id: 'adlerauge',
    branch: 'combat',
    tier: 3,
    name: 'Feldberg-Adlerauge',
    subtitle: 'Stufe 3 · Kritische Präzision',
    description: 'Schwachstellen-Visierung erhöht die kritische Trefferchance sowie den kritischen Schadensfaktor.',
    maxLevel: 3,
    costSP: 1,
    costNATPerLevel: 260,
    requiresSkillId: 'schnellfinger',
    requiresSkillLevel: 1,
    effectLabels: ['+7% Krit-Chance pro Stufe', '+18% Krit-Schaden pro Stufe'],
  },
  {
    id: 'sprengmeister',
    branch: 'combat',
    tier: 4,
    name: 'Traktor-Horst-Bezwinger (ULTIMATE)',
    subtitle: 'Stufe 4 · Boss- & Explosiv-Dominanz',
    description: 'Ultimative Offensiv-Meisterschaft: Massiver Zusatzschaden gegen Bosse & vergrößerter Wirkungsradius.',
    maxLevel: 2,
    costSP: 2,
    costNATPerLevel: 420,
    requiresSkillId: 'adlerauge',
    requiresSkillLevel: 2,
    effectLabels: ['+25% Schaden gegen Bosse & Stoßtruppen pro Stufe', '+25% Splitter-/Wirkungsradius pro Stufe'],
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
    maxLevel: 3,
    costSP: 1,
    costNATPerLevel: 120,
    effectLabels: ['+30 Maximale HP pro Stufe (bis +90 HP)'],
  },
  {
    id: 'elektro_schild',
    branch: 'defense',
    tier: 2,
    name: 'Stadtwerke-Energieschild',
    subtitle: 'Stufe 2 · Schild-Kapazität',
    description: 'Hochspannungs-Kondensator der Stadtwerke Neu-Anspach vergrößert deinen blauen Schutzschild.',
    maxLevel: 3,
    costSP: 1,
    costNATPerLevel: 180,
    requiresSkillId: 'kevlar_weste',
    requiresSkillLevel: 1,
    effectLabels: ['+30 Maximaler Schild pro Stufe (bis +90 Schild)'],
  },
  {
    id: 'handkaes_vitalitaet',
    branch: 'defense',
    tier: 3,
    name: 'Handkäs-Regeneration',
    subtitle: 'Stufe 3 · Automatische Selbstheilung',
    description: 'Regeneriert im laufenden Einsatz kontinuierlich Lebenspunkte und Schildenergie pro Sekunde.',
    maxLevel: 3,
    costSP: 1,
    costNATPerLevel: 260,
    requiresSkillId: 'elektro_schild',
    requiresSkillLevel: 1,
    effectLabels: ['+2.5 HP & +2.5 Schild / Sekunde pro Stufe'],
  },
  {
    id: 'nebel_bollwerk',
    branch: 'defense',
    tier: 4,
    name: 'Taunus-Titanenrüstung (ULTIMATE)',
    subtitle: 'Stufe 4 · Schadensreduktion & Nebelfilter',
    description: 'Ultimativer Schutz: Reduziert allen erlittenen Feind- und Taunus-Nebel-Schaden drastisch.',
    maxLevel: 2,
    costSP: 2,
    costNATPerLevel: 420,
    requiresSkillId: 'handkaes_vitalitaet',
    requiresSkillLevel: 2,
    effectLabels: ['-15% erlittener Feindschaden pro Stufe', '-35% Taunus-Nebel-Schaden pro Stufe'],
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
    maxLevel: 3,
    costSP: 1,
    costNATPerLevel: 120,
    effectLabels: ['+7% Bewegungstempo & +8% Sprungkraft pro Stufe'],
  },
  {
    id: 'schatzsucher',
    branch: 'tactics',
    tier: 2,
    name: 'Anspacher Beute-Scanner',
    subtitle: 'Stufe 2 · Mehr NAT, Waffen-XP & Munition',
    description: 'Jeder ausgeschaltete Gegner und jede Kiste liefert deutlich mehr NAT-Taler, Operator-XP und Waffen-XP.',
    maxLevel: 3,
    costSP: 1,
    costNATPerLevel: 180,
    requiresSkillId: 'lochmuehle_sprinter',
    requiresSkillLevel: 1,
    effectLabels: ['+25% Waffen-XP, Operator-XP & NAT-Beute pro Stufe'],
  },
  {
    id: 'trupp_kommandant',
    branch: 'tactics',
    tier: 3,
    name: 'Bürgerwehr-Kommandant',
    subtitle: 'Stufe 3 · Verstärkter KI-Squad',
    description: 'Deine KI-Kameraden (Florian, Lena & Timo) erhalten deutlich mehr Lebenspunkte und Feuerkraft.',
    maxLevel: 3,
    costSP: 1,
    costNATPerLevel: 260,
    requiresSkillId: 'schatzsucher',
    requiresSkillLevel: 1,
    effectLabels: ['+30% Squad-HP & +25% Squad-Schaden pro Stufe'],
  },
  {
    id: 'feldberg_berserker',
    branch: 'tactics',
    tier: 4,
    name: 'Feldberg-Vampirismus (ULTIMATE)',
    subtitle: 'Stufe 4 · Sofort-Schildraub bei jedem Kill',
    description: 'Jeder eliminierte Wehrheimer lädt deinen Schild sofort auf und füllt dein Magazin teilweise nach.',
    maxLevel: 2,
    costSP: 2,
    costNATPerLevel: 420,
    requiresSkillId: 'trupp_kommandant',
    requiresSkillLevel: 2,
    effectLabels: ['+18 Schild & +8 HP sofort pro Kill (je Stufe)', '+4 Schuss Direkt-Magazin pro Kill'],
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

export function isSkillNodeUnlocked(node: SkillNodeDef, levels: SkillTreeLevels): boolean {
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

  const damageReduction = Math.min(0.45, bollwerk * 0.15);
  const stormDamageReduction = Math.min(0.75, bollwerk * 0.35);
  const regenPerSec = vital * 2.5;
  const speedMultiplier = 1 + sprinter * 0.07;
  const jumpMultiplier = 1 + sprinter * 0.08;
  const lootXpMultiplier = 1 + schatz * 0.25;
  const critChanceBonus = adler * 0.07;
  const maxHpBonus = kevlar * 30;
  const maxShieldBonus = schild * 30;
  const killShieldRestore = vampir * 18;
  const killHpRestore = vampir * 8;
  const killAmmoRestore = vampir * 4;

  return {
    damageMultiplier: 1 + wucht * 0.12,
    fireRateMultiplier: 1 + schnell * 0.06,
    reloadSpeedMultiplier: 1 + schnell * 0.16,
    critChanceBonus,
    critChance: critChanceBonus,
    critDamageMultiplier: 1.5 + adler * 0.18,
    splashRadiusMultiplier: 1 + spreng * 0.25,
    bossDamageMultiplier: 1 + spreng * 0.25,
    maxHpBonus,
    bonusMaxHp: maxHpBonus,
    maxShieldBonus,
    bonusMaxShield: maxShieldBonus,
    bonusMagCapacity: schnell * 4,
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
    allyHpMultiplier: 1 + trupp * 0.3,
    allyDamageMultiplier: 1 + trupp * 0.25,
    killShieldRestore,
    shieldOnKill: killShieldRestore,
    killHpRestore,
    hpOnKill: killHpRestore,
    killAmmoRestore,
    ammoRefundOnKill: killAmmoRestore,
    totalPointsSpent: getTotalSpentSkillPoints(levels),
  };
}
