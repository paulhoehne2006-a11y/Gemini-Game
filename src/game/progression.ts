/**
 * Gamification, Roguelite Wave Perks, Season Battle Pass & Achievements System
 * 61267 Neu-Anspach Royale
 */

export type MatchPerkId =
  | 'vampir_aeppler'
  | 'schnellfinger'
  | 'explosiv_kerne'
  | 'goldrausch'
  | 'adrenalin_schub'
  | 'panzer_weste'
  | 'scharfschuetzen_fokus'
  | 'trupp_moral';

export interface MatchPerkDef {
  id: MatchPerkId;
  name: string;
  title: string;
  subtitle: string;
  description: string;
  rarity: 'selten' | 'episch' | 'legendaer';
  accentColor: string;
  badgeText: string;
  badge: string;
  iconName: string;
}

export const MATCH_PERK_POOL: MatchPerkDef[] = [
  {
    id: 'vampir_aeppler',
    name: 'Vampir-Äppler',
    title: 'Vampir-Äppler',
    subtitle: 'Schild- & Lebensentzug bei Abschüssen',
    description: 'Jeder eliminierte Gegner stellt sofort +20 Schild und +10 Lebenspunkte wieder her.',
    rarity: 'episch',
    accentColor: '#10B981',
    badgeText: '+20 SCHILD / KILL',
    badge: '+20 SCHILD / KILL',
    iconName: 'Heart',
  },
  {
    id: 'schnellfinger',
    name: 'Bembel-Schnelllader',
    title: 'Bembel-Schnelllader',
    subtitle: 'Extremes Nachladetempo & Magazinplus',
    description: 'Reduziert die Nachladezeit um 40% und füllt sofort deine gesamte Munition auf.',
    rarity: 'selten',
    accentColor: '#38BDF8',
    badgeText: '-40% NACHLADEN',
    badge: '-40% NACHLADEN',
    iconName: 'Zap',
  },
  {
    id: 'explosiv_kerne',
    name: 'Taunus-Splitterkern',
    title: 'Taunus-Splitterkern',
    subtitle: 'Hochdruck-Munition & Flächenschaden',
    description: 'Erhöht deinen gesamten Waffenschaden um +25% und vergrößert den Wirkungsradius um +35%.',
    rarity: 'legendaer',
    accentColor: '#F59E0B',
    badgeText: '+25% FEUERKRAFT',
    badge: '+25% FEUERKRAFT',
    iconName: 'Flame',
  },
  {
    id: 'goldrausch',
    name: 'Stadtkassen-Goldrausch',
    title: 'Stadtkassen-Goldrausch',
    subtitle: 'Schatzjäger-Multiplikator',
    description: 'Gewährt sofort +60 NAT-Taler und steigert alle Beute-Punkte in diesem Match um +40%.',
    rarity: 'episch',
    accentColor: '#FACC15',
    badgeText: '+60 NAT SOFORT',
    badge: '+60 NAT SOFORT',
    iconName: 'Coins',
  },
  {
    id: 'adrenalin_schub',
    name: 'Feldberg-Adrenalin',
    title: 'Feldberg-Adrenalin',
    subtitle: 'Überladenes Bewegungstempo & Taktik-Abklingzeit',
    description: '+18% Bewegungs- & Sprinttempo sowie -30% Abklingzeit auf alle 3 Taktik-Fähigkeiten [Q/E/F].',
    rarity: 'episch',
    accentColor: '#A855F7',
    badgeText: '-30% COOLDOWN',
    badge: '-30% COOLDOWN',
    iconName: 'Sparkles',
  },
  {
    id: 'panzer_weste',
    name: 'Feuerwehr-Titanweste',
    title: 'Feuerwehr-Titanweste',
    subtitle: 'Maximale Panzerung & Sofort-Reparatur',
    description: 'Erhöht Max-Schild und Max-Leben um jeweils +40 und lädt beides sofort zu 100% auf.',
    rarity: 'selten',
    accentColor: '#06B6D4',
    badgeText: '+80 MAX PANZERUNG',
    badge: '+80 MAX PANZERUNG',
    iconName: 'Shield',
  },
  {
    id: 'scharfschuetzen_fokus',
    name: 'Adlerauge vom Hessenpark',
    title: 'Adlerauge vom Hessenpark',
    subtitle: 'Tödliche Präzision & Krit-Treffer',
    description: 'Steigert deine kritische Trefferchance um +25% und erhöht kritischen Kopftreffer-Schaden massiv.',
    rarity: 'legendaer',
    accentColor: '#EF4444',
    badgeText: '+25% KRIT-CHANCE',
    badge: '+25% KRIT-CHANCE',
    iconName: 'Crosshair',
  },
  {
    id: 'trupp_moral',
    name: 'Bürgerwehr-Großaufgebot',
    title: 'Bürgerwehr-Großaufgebot',
    subtitle: 'Squad-Heilung & Feuerkraft-Boost',
    description: 'Heilt alle KI-Kollegen vollständig und steigert deren Feuerrate & Schaden um +40%.',
    rarity: 'selten',
    accentColor: '#34D399',
    badgeText: '+40% SQUAD-DMG',
    badge: '+40% SQUAD-DMG',
    iconName: 'Users',
  },
];

export function rollMatchPerks(alreadyPicked: MatchPerkId[] = [], count = 3): MatchPerkDef[] {
  const available = MATCH_PERK_POOL.filter((p) => !alreadyPicked.includes(p.id));
  const pool = available.length >= count ? [...available] : [...MATCH_PERK_POOL];
  const selected: MatchPerkDef[] = [];
  while (selected.length < count && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    selected.push(pool.splice(idx, 1)[0]);
  }
  return selected;
}

export interface BattlePassTier {
  tier: number;
  requiredReputation: number;
  title: string;
  rewardLabel: string;
  rewardNAT: number;
  unlockedTitle?: string;
  rarity: 'standard' | 'selten' | 'episch' | 'legendaer';
}

export const SEASON_BATTLE_PASS: BattlePassTier[] = [
  {
    tier: 1,
    requiredReputation: 150,
    title: 'Stufe 1 · Anspacher Einsatzstart',
    rewardLabel: '120 NAT Startprämie',
    rewardNAT: 120,
    unlockedTitle: 'Hessenpark-Wächter',
    rarity: 'standard',
  },
  {
    tier: 2,
    requiredReputation: 300,
    title: 'Stufe 2 · Waldschwimmbad-Patrouille',
    rewardLabel: '180 NAT + Titel „Bademeister der Reserve“',
    rewardNAT: 180,
    unlockedTitle: 'Bademeister der Reserve',
    rarity: 'standard',
  },
  {
    tier: 3,
    requiredReputation: 500,
    title: 'Stufe 3 · Taunusbahn-Sicherung',
    rewardLabel: '240 NAT + Gunsmith-Förderung',
    rewardNAT: 240,
    unlockedTitle: 'RB15-Gleiswächter',
    rarity: 'selten',
  },
  {
    tier: 4,
    requiredReputation: 750,
    title: 'Stufe 4 · Äppler-Schmiedemeister',
    rewardLabel: '300 NAT + Titel „Bembel-Pionier“',
    rewardNAT: 300,
    unlockedTitle: 'Bembel-Pionier',
    rarity: 'selten',
  },
  {
    tier: 5,
    requiredReputation: 1050,
    title: 'Stufe 5 · Neue Mitte Verteidiger',
    rewardLabel: '400 NAT + Goldene Vorratskiste',
    rewardNAT: 400,
    unlockedTitle: 'Taunus-Center-Kommandant',
    rarity: 'episch',
  },
  {
    tier: 6,
    requiredReputation: 1400,
    title: 'Stufe 6 · Lochmühle-Schreck',
    rewardLabel: '500 NAT + Titel „Wehrheimer Albtraum“',
    rewardNAT: 500,
    unlockedTitle: 'Wehrheimer Albtraum',
    rarity: 'episch',
  },
  {
    tier: 7,
    requiredReputation: 1850,
    title: 'Stufe 7 · Feldberg-Sturmtrupp',
    rewardLabel: '650 NAT + Pack-a-Punch Zuschuss',
    rewardNAT: 650,
    unlockedTitle: 'Feldberg-Sturmgrenadier',
    rarity: 'episch',
  },
  {
    tier: 8,
    requiredReputation: 2400,
    title: 'Stufe 8 · Hochtaunus-Legende',
    rewardLabel: '900 NAT + Titel „Ehrenbürger 61267“',
    rewardNAT: 900,
    unlockedTitle: 'Ehrenbürger 61267',
    rarity: 'legendaer',
  },
];

export interface CareerStats {
  totalKills: number;
  totalBossKills: number;
  bossesDefeated: number;
  highestStreak: number;
  highestCombo: number;
  highestWave: number;
  abilitiesUsed: number;
  totalMatchesPlayed: number;
  totalTalerEarned: number;
  gunsmithUpgrades: number;
  claimedBattlePassTiers: number[];
  claimedAchievements: string[];
  equippedTitle: string;
  lastDailyBonusDate: string;
  lastLoginDate: string;
  loginStreakDays: number;
}

const DEFAULT_CAREER_STATS: CareerStats = {
  totalKills: 0,
  totalBossKills: 0,
  bossesDefeated: 0,
  highestStreak: 0,
  highestCombo: 1,
  highestWave: 1,
  abilitiesUsed: 0,
  totalMatchesPlayed: 0,
  totalTalerEarned: 0,
  gunsmithUpgrades: 0,
  claimedBattlePassTiers: [],
  claimedAchievements: [],
  equippedTitle: 'Hessenpark-Wächter',
  lastDailyBonusDate: '',
  lastLoginDate: '',
  loginStreakDays: 1,
};

export function loadCareerStats(): CareerStats {
  try {
    const raw = localStorage.getItem('na_career_stats');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        return { ...DEFAULT_CAREER_STATS };
      }
      return {
        totalKills: typeof parsed.totalKills === 'number' ? parsed.totalKills : DEFAULT_CAREER_STATS.totalKills,
        totalBossKills: typeof parsed.totalBossKills === 'number' ? parsed.totalBossKills : DEFAULT_CAREER_STATS.totalBossKills,
        bossesDefeated: typeof parsed.bossesDefeated === 'number' ? parsed.bossesDefeated : DEFAULT_CAREER_STATS.bossesDefeated,
        highestStreak: typeof parsed.highestStreak === 'number' ? parsed.highestStreak : DEFAULT_CAREER_STATS.highestStreak,
        highestCombo: typeof parsed.highestCombo === 'number' ? parsed.highestCombo : DEFAULT_CAREER_STATS.highestCombo,
        highestWave: typeof parsed.highestWave === 'number' ? parsed.highestWave : DEFAULT_CAREER_STATS.highestWave,
        abilitiesUsed: typeof parsed.abilitiesUsed === 'number' ? parsed.abilitiesUsed : DEFAULT_CAREER_STATS.abilitiesUsed,
        totalMatchesPlayed: typeof parsed.totalMatchesPlayed === 'number' ? parsed.totalMatchesPlayed : DEFAULT_CAREER_STATS.totalMatchesPlayed,
        totalTalerEarned: typeof parsed.totalTalerEarned === 'number' ? parsed.totalTalerEarned : DEFAULT_CAREER_STATS.totalTalerEarned,
        gunsmithUpgrades: typeof parsed.gunsmithUpgrades === 'number' ? parsed.gunsmithUpgrades : DEFAULT_CAREER_STATS.gunsmithUpgrades,
        equippedTitle: typeof parsed.equippedTitle === 'string' ? parsed.equippedTitle : DEFAULT_CAREER_STATS.equippedTitle,
        lastDailyBonusDate: typeof parsed.lastDailyBonusDate === 'string' ? parsed.lastDailyBonusDate : DEFAULT_CAREER_STATS.lastDailyBonusDate,
        lastLoginDate: typeof parsed.lastLoginDate === 'string' ? parsed.lastLoginDate : DEFAULT_CAREER_STATS.lastLoginDate,
        loginStreakDays: typeof parsed.loginStreakDays === 'number' ? parsed.loginStreakDays : DEFAULT_CAREER_STATS.loginStreakDays,
        claimedBattlePassTiers: Array.isArray(parsed.claimedBattlePassTiers)
          ? parsed.claimedBattlePassTiers.filter((x: any) => typeof x === 'number')
          : [],
        claimedAchievements: Array.isArray(parsed.claimedAchievements)
          ? parsed.claimedAchievements.filter((x: any) => typeof x === 'string')
          : [],
      };
    }
  } catch {}
  return { ...DEFAULT_CAREER_STATS };
}

export function saveCareerStats(stats: CareerStats): void {
  try {
    localStorage.setItem('na_career_stats', JSON.stringify(stats));
  } catch {}
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  rewardNAT: number;
  rewardReputation: number;
  checkUnlocked: (career: CareerStats) => boolean;
  progressText: (career: CareerStats) => string;
  getProgress: (career: CareerStats, totalWins?: number, unlockedMapsCount?: number) => {
    current: number;
    target: number;
  };
}

export const ACHIEVEMENTS_LIST: AchievementDef[] = [
  {
    id: 'ach_first_blood',
    title: 'Erster Platzverweis',
    description: 'Eliminiere insgesamt 15 Wehrheimer Eindringlinge.',
    rewardNAT: 180,
    rewardReputation: 80,
    checkUnlocked: (c) => c.totalKills >= 15,
    progressText: (c) => `${Math.min(15, c.totalKills)} / 15 Kills`,
    getProgress: (c) => ({ current: Math.min(15, c.totalKills), target: 15 }),
  },
  {
    id: 'ach_centurion',
    title: 'Bembel-Zenturio',
    description: 'Eliminiere insgesamt 75 Gegner in allen Einsätzen.',
    rewardNAT: 400,
    rewardReputation: 160,
    checkUnlocked: (c) => c.totalKills >= 75,
    progressText: (c) => `${Math.min(75, c.totalKills)} / 75 Kills`,
    getProgress: (c) => ({ current: Math.min(75, c.totalKills), target: 75 }),
  },
  {
    id: 'ach_boss_slayer',
    title: 'Traktor-Abschleppdienst',
    description: 'Besiege den Wehrheimer Endboss Traktor-Horst in Welle 5.',
    rewardNAT: 500,
    rewardReputation: 220,
    checkUnlocked: (c) => (c.bossesDefeated || c.totalBossKills) >= 1,
    progressText: (c) => `${Math.min(1, c.bossesDefeated || c.totalBossKills)} / 1 Boss`,
    getProgress: (c) => ({ current: Math.min(1, c.bossesDefeated || c.totalBossKills), target: 1 }),
  },
  {
    id: 'ach_tactical_master',
    title: 'Taktik-Spezialist',
    description: 'Setze 10-mal deine aktiven Operator-Fähigkeiten (Schockwelle, Dash oder Luftschlag) ein.',
    rewardNAT: 250,
    rewardReputation: 110,
    checkUnlocked: (c) => c.abilitiesUsed >= 10,
    progressText: (c) => `${Math.min(10, c.abilitiesUsed)} / 10 Einsätze`,
    getProgress: (c) => ({ current: Math.min(10, c.abilitiesUsed), target: 10 }),
  },
  {
    id: 'ach_combo_king',
    title: 'Adrenalin-Rausch',
    description: 'Erreiche einen Kombo-Multiplikator von mindestens x4 im Gefecht.',
    rewardNAT: 300,
    rewardReputation: 140,
    checkUnlocked: (c) => c.highestCombo >= 4,
    progressText: (c) => `Max x${Math.min(8, c.highestCombo)} / x4`,
    getProgress: (c) => ({ current: Math.min(4, c.highestCombo), target: 4 }),
  },
  {
    id: 'ach_gunsmith_pro',
    title: 'Waffenschmied vom Taunus',
    description: 'Installiere mindestens 5 Waffen-Upgrades oder Aufsätze im Gunsmith-Labor.',
    rewardNAT: 350,
    rewardReputation: 150,
    checkUnlocked: (c) => c.gunsmithUpgrades >= 5,
    progressText: (c) => `${Math.min(5, c.gunsmithUpgrades)} / 5 Upgrades`,
    getProgress: (c) => ({ current: Math.min(5, c.gunsmithUpgrades), target: 5 }),
  },
];
