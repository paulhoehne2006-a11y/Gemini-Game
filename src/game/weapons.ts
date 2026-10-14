import { AllWeaponsUpgrades, AttachmentType, WeaponUpgradeState } from '../types';

export interface Weapon {
  id: string;
  name: string;
  codArchetype: string;
  papNames: [string, string, string]; // Level I, II, III Pack-a-Punch names
  category: 'primary' | 'secondary' | 'special';
  damage: number;
  fireRate: number; // shots per sec
  range: number;
  bulletSpeed: number;
  splashRadius: number;
  color: string;
  papColors: [string, string, string];
  description: string;
  unlockedByDefault: boolean;
  costNAT: number;
  requiredFacility?: string;
}

export interface RarityTierInfo {
  tier: number;
  name: string;
  codLabel: string;
  damageMultiplier: number;
  accuracyBonus: number;
  costNAT: number;
  colorHex: string;
  badgeClass: string;
  borderClass: string;
}

export const COLD_WAR_RARITIES: RarityTierInfo[] = [
  {
    tier: 1,
    name: 'Standard-Ausrüstung',
    codLabel: 'LOADOUT (GRAU)',
    damageMultiplier: 1.0,
    accuracyBonus: 0,
    costNAT: 0,
    colorHex: '#94A3B8',
    badgeClass: 'bg-slate-800 text-slate-300 border-slate-600',
    borderClass: 'border-slate-600',
  },
  {
    tier: 2,
    name: 'Ungewöhnlich',
    codLabel: 'GRÜN (TIER II)',
    damageMultiplier: 1.25,
    accuracyBonus: 10,
    costNAT: 120,
    colorHex: '#22C55E',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
    borderClass: 'border-emerald-500',
  },
  {
    tier: 3,
    name: 'Selten',
    codLabel: 'BLAU (TIER III)',
    damageMultiplier: 1.55,
    accuracyBonus: 20,
    costNAT: 260,
    colorHex: '#3B82F6',
    badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
    borderClass: 'border-blue-500',
  },
  {
    tier: 4,
    name: 'Episch',
    codLabel: 'VIOLETT (TIER IV)',
    damageMultiplier: 1.95,
    accuracyBonus: 30,
    costNAT: 450,
    colorHex: '#A855F7',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/50',
    borderClass: 'border-purple-500',
  },
  {
    tier: 5,
    name: 'Legendär (Ultra)',
    codLabel: 'GOLD (TIER V)',
    damageMultiplier: 2.5,
    accuracyBonus: 45,
    costNAT: 750,
    colorHex: '#F59E0B',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-400',
    borderClass: 'border-amber-400',
  },
];

export interface PackAPunchTierInfo {
  level: number;
  name: string;
  subtitle: string;
  damageMultiplier: number;
  fireRateMultiplier: number;
  costNAT: number;
  badgeColor: string;
}

export const PACK_A_PUNCH_TIERS: PackAPunchTierInfo[] = [
  {
    level: 0,
    name: 'Unmodifiziert',
    subtitle: 'Standard-Fabrikzustand ohne Äppler-Schmiede',
    damageMultiplier: 1.0,
    fireRateMultiplier: 1.0,
    costNAT: 0,
    badgeColor: 'text-slate-400',
  },
  {
    level: 1,
    name: 'Pack-a-Punch STUFE I',
    subtitle: '+45% Feuerkraft, +15% Feuerrate & Cyan-Plasma-Spur',
    damageMultiplier: 1.45,
    fireRateMultiplier: 1.15,
    costNAT: 300,
    badgeColor: 'text-cyan-400',
  },
  {
    level: 2,
    name: 'Pack-a-Punch STUFE II',
    subtitle: '+100% Feuerkraft, +30% Feuerrate & Violett-Äther-Spur',
    damageMultiplier: 2.0,
    fireRateMultiplier: 1.3,
    costNAT: 650,
    badgeColor: 'text-fuchsia-400',
  },
  {
    level: 3,
    name: 'Pack-a-Punch STUFE III (MAX)',
    subtitle: '+180% Feuerkraft, +45% Feuerrate & Ultra-Gold-Plasma',
    damageMultiplier: 2.8,
    fireRateMultiplier: 1.45,
    costNAT: 1100,
    badgeColor: 'text-amber-400',
  },
];

export interface GunsmithSlotTier {
  level: number;
  name: string;
  costNAT: number;
  pros: string[];
  cons: string[];
}

export interface GunsmithCategoryDef {
  slot: AttachmentType;
  label: string;
  codSlotName: string;
  tiers: GunsmithSlotTier[];
}

export const GUNSMITH_CATALOG: GunsmithCategoryDef[] = [
  {
    slot: 'scope',
    label: 'Optik & Visier',
    codSlotName: 'OPTIC',
    tiers: [
      {
        level: 1,
        name: 'Millstop-Reflexvisier',
        costNAT: 80,
        pros: ['+15% Präzisions-Zoom (ADS)', '-12% Vertikaler Rückstoß'],
        cons: [],
      },
      {
        level: 2,
        name: 'Axial Arms 3x Präzisionsoptik',
        costNAT: 180,
        pros: ['+30% Fernkampf-Zoom', '-25% Streuung im Dauerfeuer'],
        cons: ['-3% ZV-Reaktionszeit'],
      },
      {
        level: 3,
        name: 'Royal & Kross 4x Feldberg-Thermal',
        costNAT: 320,
        pros: ['+45% Scharfschützen-Zoom', '-40% Streuung & Rückstoß'],
        cons: ['-5% ZV-Reaktionszeit'],
      },
    ],
  },
  {
    slot: 'barrel',
    label: 'Lauf (Barrel)',
    codSlotName: 'BARREL',
    tiers: [
      {
        level: 1,
        name: '13.5" Verstärkter Schwerlauf',
        costNAT: 100,
        pros: ['+20% Waffenschaden', '+25% Geschossgeschwindigkeit'],
        cons: [],
      },
      {
        level: 2,
        name: '14.5" Ranger-Präzisionslauf',
        costNAT: 220,
        pros: ['+40% Waffenschaden', '+50% Geschossgeschwindigkeit', '+15% Effektive Reichweite'],
        cons: ['-4% Bewegungstempo beim Zielen'],
      },
      {
        level: 3,
        name: '13.7" Task-Force-Speziallauf',
        costNAT: 380,
        pros: ['+60% Waffenschaden', '+75% Geschossgeschwindigkeit', '+30% Effektive Reichweite'],
        cons: ['-8% Rückstoßkontrolle ohne Visier'],
      },
    ],
  },
  {
    slot: 'bolt',
    label: 'Mündung & Verschluss',
    codSlotName: 'MUZZLE / BOLT',
    tiers: [
      {
        level: 1,
        name: 'Mündungsbremse 5.56 & Leichtbolzen',
        costNAT: 90,
        pros: ['+18% Feuerrate (Kadenz)', '-10% Mündungsfeuer'],
        cons: [],
      },
      {
        level: 2,
        name: 'SOCOM-Kompensator & Schnellverschluss',
        costNAT: 200,
        pros: ['+36% Feuerrate (Kadenz)', '+15% Horizontale Kontrolle'],
        cons: ['-4% Schussreichweite'],
      },
      {
        level: 3,
        name: 'Agency-Schalldämpfer & Titan-Bolzen',
        costNAT: 350,
        pros: ['+54% Feuerrate (Kadenz)', '100% Mündungsfeuer-Dämpfung'],
        cons: ['-5% Geschosstempo'],
      },
    ],
  },
  {
    slot: 'mag',
    label: 'Magazin & Munition',
    codSlotName: 'MAGAZINE',
    tiers: [
      {
        level: 1,
        name: '40-Schuss STANAG-Trommel',
        costNAT: 95,
        pros: ['+8% Kritische Trefferchance', '+20% Wirkungs-/Splitterradius'],
        cons: [],
      },
      {
        level: 2,
        name: 'Dschungel-Schnellwechsel-Magazin',
        costNAT: 210,
        pros: ['+16% Kritische Trefferchance', '+40% Wirkungsradius', '+1 Schrot-Pellet'],
        cons: ['-3% Nachladebewegung'],
      },
      {
        level: 3,
        name: 'Salven-50-Schuss Hochdruck-Trommel',
        costNAT: 360,
        pros: ['+24% Kritische Trefferchance', '+60% Wirkungsradius', '+3 Schrot-Pellets'],
        cons: ['-5% ZV-Tempo'],
      },
    ],
  },
  {
    slot: 'stock',
    label: 'Schaft & Handgriff',
    codSlotName: 'STOCK & REAR GRIP',
    tiers: [
      {
        level: 1,
        name: 'Taktischer Kommandoschaft',
        costNAT: 85,
        pros: ['+6% Geh- & Zielbewegungstempo', '+10% ZV-Geschwindigkeit'],
        cons: [],
      },
      {
        level: 2,
        name: 'Luftlande-Elastikwickel',
        costNAT: 190,
        pros: ['+12% Geh- & Zielbewegungstempo', '+25% ZV-Geschwindigkeit'],
        cons: ['-4% Sprint-zu-Feuer-Verzögerung'],
      },
      {
        level: 3,
        name: 'Raider-Kampfschaft (SAS)',
        costNAT: 310,
        pros: ['+18% Geh- & Zielbewegungstempo', '+40% ZV-Geschwindigkeit'],
        cons: ['-5% Hüftfeuer-Präzision'],
      },
    ],
  },
];

export const WEAPONS: Record<string, Weapon> = {
  bembel: {
    id: 'bembel',
    name: 'XM4 Bembel-Sturmgewehr',
    codArchetype: 'Assault Rifle · Vollautomatisch',
    papNames: [
      'Äppler-Vollstrecker MK.I',
      'Äppler-Vollstrecker MK.II',
      'Bembel-Götterdämmerung ULTRA',
    ],
    category: 'primary',
    damage: 28,
    fireRate: 6.8,
    range: 65,
    bulletSpeed: 145,
    splashRadius: 1.2,
    color: '#38BDF8',
    papColors: ['#22D3EE', '#E879F9', '#FACC15'],
    description:
      'Vielseitiges Vollautomatik-Sturmgewehr nach CoD Cold War XM4-Vorbild. Hohe Feuerrate, präzise Kontrolle und volle 5-Slot-Waffenschmiede.',
    unlockedByDefault: true,
    costNAT: 0,
  },
  zwille: {
    id: 'zwille',
    name: 'Taunus-MP5 (Schnellfeuer)',
    codArchetype: 'Submachine Gun · Extremes Tempo',
    papNames: [
      'Taunus-Wirbelsturm MK.I',
      'Taunus-Wirbelsturm MK.II',
      'Feldberg-Hurrikan ULTRA',
    ],
    category: 'primary',
    damage: 18,
    fireRate: 11.2,
    range: 52,
    bulletSpeed: 165,
    splashRadius: 0.7,
    color: '#4ADE80',
    papColors: ['#34D399', '#C084FC', '#FDE047'],
    description:
      'Maschinenpistole mit 11,2 Schuss/Sekunde für aggressiven Häuserkampf in engen Gassen und Gebäuden.',
    unlockedByDefault: true,
    costNAT: 150,
  },
  spritzer: {
    id: 'spritzer',
    name: 'Gallo-SA12 Äppler-Shotgun',
    codArchetype: 'Tactical Shotgun · Halbautomatisch',
    papNames: [
      'Kelterei-Donnerschlag MK.I',
      'Kelterei-Donnerschlag MK.II',
      'Hessenpark-Verwüster ULTRA',
    ],
    category: 'secondary',
    damage: 24,
    fireRate: 2.5,
    range: 36,
    bulletSpeed: 130,
    splashRadius: 2.2,
    color: '#FACC15',
    papColors: ['#38BDF8', '#F472B6', '#FB923C'],
    description:
      'Halbautomatische Gefechts-Schrotflinte nach Cold War Gallo-SA12 Vorbild. Verheerende Schrotgarben im Nahkampf.',
    unlockedByDefault: false,
    costNAT: 350,
    requiredFacility: 'kelterei',
  },
  handkaes: {
    id: 'handkaes',
    name: 'M79 Handkäs-Granatwerfer',
    codArchetype: 'Special Launcher · Explosiv',
    papNames: [
      'Taunusbahn-Mörser MK.I',
      'Taunusbahn-Mörser MK.II',
      'Großer-Feldberg-Komet ULTRA',
    ],
    category: 'special',
    damage: 115,
    fireRate: 1.3,
    range: 48,
    bulletSpeed: 58,
    splashRadius: 6.2,
    color: '#FB923C',
    papColors: ['#06B6D4', '#D946EF', '#FDE047'],
    description:
      'Schwerer Granatwerfer mit großem Explosionsradius gegen ganze Wehrheimer Gruppen und Boss Traktor-Horst.',
    unlockedByDefault: false,
    costNAT: 600,
    requiredFacility: 'stadtwerke',
  },
};

export const INITIAL_WEAPON_UPGRADES: AllWeaponsUpgrades = {
  bembel: {
    rarityTier: 1,
    papLevel: 0,
    attachments: { scope: 0, barrel: 0, bolt: 0, mag: 0, stock: 0 },
  },
  zwille: {
    rarityTier: 1,
    papLevel: 0,
    attachments: { scope: 0, barrel: 0, bolt: 0, mag: 0, stock: 0 },
  },
  spritzer: {
    rarityTier: 1,
    papLevel: 0,
    attachments: { scope: 0, barrel: 0, bolt: 0, mag: 0, stock: 0 },
  },
  handkaes: {
    rarityTier: 1,
    papLevel: 0,
    attachments: { scope: 0, barrel: 0, bolt: 0, mag: 0, stock: 0 },
  },
};

export function getEffectiveWeaponStats(weapon: Weapon, state?: WeaponUpgradeState) {
  const upg = state || INITIAL_WEAPON_UPGRADES[weapon.id] || {
    rarityTier: 1,
    papLevel: 0,
    attachments: { scope: 0, barrel: 0, bolt: 0, mag: 0, stock: 0 },
  };

  const rarityObj = COLD_WAR_RARITIES[Math.min(4, Math.max(0, upg.rarityTier - 1))];
  const papObj = PACK_A_PUNCH_TIERS[Math.min(3, Math.max(0, upg.papLevel))];
  const att = upg.attachments;

  const damage = Math.round(
    weapon.damage *
      rarityObj.damageMultiplier *
      papObj.damageMultiplier *
      (1 + (att.barrel || 0) * 0.2)
  );

  const fireRate = Number(
    (
      weapon.fireRate *
      papObj.fireRateMultiplier *
      (1 + (att.bolt || 0) * 0.18)
    ).toFixed(1)
  );

  const bulletSpeed = Math.round(weapon.bulletSpeed * (1 + (att.barrel || 0) * 0.25));
  const splashRadius = Number((weapon.splashRadius * (1 + (att.mag || 0) * 0.2)).toFixed(1));
  const critChancePct = Math.round(22 + (att.mag || 0) * 8 + (upg.papLevel || 0) * 6);
  const moveBonusPct = Math.round((att.stock || 0) * 6);

  const displayName =
    upg.papLevel > 0 ? weapon.papNames[Math.min(2, upg.papLevel - 1)] : weapon.name;

  const tracerColor =
    upg.papLevel > 0 ? weapon.papColors[Math.min(2, upg.papLevel - 1)] : weapon.color;

  return {
    damage,
    fireRate,
    bulletSpeed,
    splashRadius,
    critChancePct,
    moveBonusPct,
    displayName,
    tracerColor,
    rarityObj,
    papObj,
  };
}
