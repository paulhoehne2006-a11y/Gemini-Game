export type ArenaId =
  | 'hessenpark'
  | 'waldschwimmbad'
  | 'bahnhof'
  | 'buergerhaus'
  | 'taunuscenter'
  | 'ars'
  | 'feldbergblick';

export interface ArenaConfig {
  id: ArenaId;
  name: string;
  subtitle: string;
  description: string;
  accentColor: string;
  skyColor: number;
  fogColor: number;
  groundColor: number;
  landmarks: string[];
  coordinates: string;
}

export type WeaponType = 'apfelwein_blaster' | 'schnellfeuer' | 'schrot_spritzer' | 'bembel_bomber';

export type AttachmentType = 'scope' | 'barrel' | 'bolt' | 'mag' | 'stock';

export interface WeaponAttachments {
  scope: number;  // Level 0-3: Optik / Visier (Zoom & Präzision)
  barrel: number; // Level 0-3: Lauf (Schaden & Geschossgeschwindigkeit)
  bolt: number;   // Level 0-3: Verschluss / Mündung (Feuerrate & Rückstoßkontrolle)
  mag: number;    // Level 0-3: Magazin (Kapazität, Splitterradius & Krit-Chance)
  stock?: number; // Level 0-3: Schaft & Griff (Bewegungstempo & ZV-Tempo)
}

export interface WeaponUpgradeState {
  rarityTier: number; // 1 = Standard (Grau), 2 = Grün, 3 = Blau, 4 = Episch (Lila), 5 = Legendär (Gold)
  papLevel: number;   // 0 = Basis, 1 = Pack-a-Punch I, 2 = Pack-a-Punch II, 3 = Pack-a-Punch III
  attachments: WeaponAttachments;
}

export type AllWeaponsUpgrades = Record<string, WeaponUpgradeState>;

export interface WalkableSurface {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  yStart: number;
  yEnd: number;
  rampAxis?: 'x' | 'z' | 'none';
}

export interface CombatFeedItem {
  id: string;
  text: string;
  type: 'kill' | 'wave' | 'ally' | 'loot' | 'attachment' | 'boss';
  timestamp: number;
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  stamina: number;
  maxStamina: number;
  ammo: number;
  maxAmmo: number;
  score: number;
  kills: number;
  wave: number;
  enemiesRemaining: number;
  alliesCount: number;
  activeWeapon: WeaponType;
  attachments: WeaponAttachments;
  elevationMeters: number;
  stormRadius: number;
  inStorm: boolean;
  isAiming: boolean;
  gameOver: boolean;
  victory: boolean;
}
