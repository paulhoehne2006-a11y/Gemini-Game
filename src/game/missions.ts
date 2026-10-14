/**
 * Daily Mission System & Operator Reputation System
 * 61267 Neu-Anspach Royale
 */

import { ArenaId } from '../types';

export type MissionTargetType =
  | 'kills_arena'
  | 'kills_role'
  | 'kills_weapon'
  | 'boss'
  | 'streak'
  | 'wave'
  | 'taler_collected'
  | 'gunsmith_upgrade';

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  category: 'combat' | 'exploration' | 'boss' | 'taler' | 'gunsmith';
  targetType: MissionTargetType;
  targetCount: number;
  currentProgress: number;
  completed: boolean;
  claimed: boolean;
  rewardNAT: number; // Extra budget rewards
  rewardReputation: number; // Reputation points
  arenaId?: ArenaId | 'any';
  targetRole?: 'flanker' | 'sniper' | 'shocktrooper' | 'boss';
  targetWeapon?: string;
  badge: string;
  difficulty: 'normal' | 'schwer' | 'heroisch';
}

export interface ReputationRankInfo {
  rank: number;
  title: string;
  minPoints: number;
  nextPoints: number;
  perkDescription: string;
  badgeColor: string;
}

export interface DailyMissionsState {
  dateKey: string;
  missions: DailyMission[];
  grandBonusClaimed: boolean;
  grandBonusRewardNAT: number;
  grandBonusRewardReputation: number;
}

export interface MissionEventPayload {
  type: 'kill' | 'streak' | 'wave' | 'taler' | 'gunsmith';
  arenaId?: string;
  role?: string;
  isBoss?: boolean;
  weaponId?: string;
  streakCount?: number;
  wave?: number;
  amount?: number;
}

export const REPUTATION_RANKS: ReputationRankInfo[] = [
  {
    rank: 1,
    title: 'Anspacher Rekrut',
    minPoints: 0,
    nextPoints: 300,
    perkDescription: 'Bürgerwehr-Grundausbildung: Standard-Kampfeinsätze freigeschaltet.',
    badgeColor: 'border-slate-500 text-slate-300 bg-slate-900',
  },
  {
    rank: 2,
    title: 'Taunus-Späher',
    minPoints: 300,
    nextPoints: 700,
    perkDescription: '+5% mehr Taler-Fundrate bei Kisten & gegnerischen Drops.',
    badgeColor: 'border-emerald-500/50 text-emerald-400 bg-emerald-950/40',
  },
  {
    rank: 3,
    title: 'Bembel-Wächter',
    minPoints: 700,
    nextPoints: 1400,
    perkDescription: '+10% Arena-Siegprämie & schnellere Schild-Regeneration.',
    badgeColor: 'border-sky-500/50 text-sky-400 bg-sky-950/40',
  },
  {
    rank: 4,
    title: 'Feldberg-Kavallerie',
    minPoints: 1400,
    nextPoints: 2300,
    perkDescription: '+15% Taler-Fundrate & +6% Sprint-Ausdauer im Gefecht.',
    badgeColor: 'border-purple-500/50 text-purple-400 bg-purple-950/40',
  },
  {
    rank: 5,
    title: 'Apfeldorf-Bezwinger',
    minPoints: 2300,
    nextPoints: 3500,
    perkDescription: '-15% Gunsmith- & Pack-a-Punch-Kosten in der Waffenschmiede.',
    badgeColor: 'border-amber-500/60 text-amber-400 bg-amber-950/40',
  },
  {
    rank: 6,
    title: 'Ehrenbürger von Neu-Anspach',
    minPoints: 3500,
    nextPoints: 5000,
    perkDescription: 'Maximale Hochtaunus-Anerkennung: +25% alle Match-Prämien & Gold-Insignie.',
    badgeColor: 'border-yellow-400 text-yellow-300 bg-yellow-950/60 font-black',
  },
];

export function getReputationRank(points: number): ReputationRankInfo {
  for (let i = REPUTATION_RANKS.length - 1; i >= 0; i--) {
    if (points >= REPUTATION_RANKS[i].minPoints) {
      return REPUTATION_RANKS[i];
    }
  }
  return REPUTATION_RANKS[0];
}

export function getTodayKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTimeUntilDailyReset(): { hours: number; minutes: number; seconds: number; formatted: string } {
  const now = new Date();
  const nextReset = new Date(now);
  nextReset.setHours(24, 0, 0, 0); // Next midnight
  const diffMs = Math.max(0, nextReset.getTime() - now.getTime());
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
  const formatted = `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  return { hours, minutes, seconds, formatted };
}

// Pool of possible missions
interface MissionTemplate {
  id: string;
  title: string;
  description: string;
  category: 'combat' | 'exploration' | 'boss' | 'taler' | 'gunsmith';
  targetType: MissionTargetType;
  targetCount: number;
  rewardNAT: number;
  rewardReputation: number;
  arenaId?: ArenaId | 'any';
  targetRole?: 'flanker' | 'sniper' | 'shocktrooper' | 'boss';
  targetWeapon?: string;
  badge: string;
  difficulty: 'normal' | 'schwer' | 'heroisch';
}

const ROTATING_MISSION_POOL: MissionTemplate[] = [
  // Arena-specific secondary
  {
    id: 'opt_waldschwimmbad',
    title: 'Wachposten am Schwimmbad',
    description: 'Eliminiere 8 Gegner im Waldschwimmbad Neu-Anspach',
    category: 'combat',
    targetType: 'kills_arena',
    arenaId: 'waldschwimmbad',
    targetCount: 8,
    rewardNAT: 240,
    rewardReputation: 110,
    badge: 'Waldschwimmbad',
    difficulty: 'normal',
  },
  {
    id: 'opt_bahnhof',
    title: 'Gleissicherung Taunusbahn',
    description: 'Eliminiere 8 Gegner am Bahnhof Neu-Anspach',
    category: 'combat',
    targetType: 'kills_arena',
    arenaId: 'bahnhof',
    targetCount: 8,
    rewardNAT: 230,
    rewardReputation: 105,
    badge: 'Bahnhof',
    difficulty: 'normal',
  },
  {
    id: 'opt_taunuscenter',
    title: 'Einkaufszentrum sichern',
    description: 'Eliminiere 8 Gegner im Taunus-Center',
    category: 'combat',
    targetType: 'kills_arena',
    arenaId: 'taunuscenter',
    targetCount: 8,
    rewardNAT: 250,
    rewardReputation: 115,
    badge: 'Taunus-Center',
    difficulty: 'normal',
  },

  // Role-specific
  {
    id: 'opt_snipers',
    title: 'Gegen-Scharfschützen',
    description: 'Schalte 3 Wehrheimer Snipers in beliebigen Arenen aus',
    category: 'combat',
    targetType: 'kills_role',
    targetRole: 'sniper',
    targetCount: 3,
    rewardNAT: 220,
    rewardReputation: 100,
    badge: 'Scharfschützen',
    difficulty: 'normal',
  },
  {
    id: 'opt_shocktroopers',
    title: 'Stoßtruppen abwehren',
    description: 'Eliminiere 5 Wehrheimer Lochmühle-Stoßtruppen',
    category: 'combat',
    targetType: 'kills_role',
    targetRole: 'shocktrooper',
    targetCount: 5,
    rewardNAT: 260,
    rewardReputation: 125,
    badge: 'Stoßtruppen',
    difficulty: 'schwer',
  },

  // Streak & Skill
  {
    id: 'opt_multikill',
    title: 'Unaufhaltsame Serie',
    description: 'Erzwinge 2 Multi-Kills (Doppel- oder Dreifach-Eliminierungen)',
    category: 'combat',
    targetType: 'streak',
    targetCount: 2,
    rewardNAT: 280,
    rewardReputation: 140,
    badge: 'Killstreak',
    difficulty: 'schwer',
  },

  // Wave milestone
  {
    id: 'opt_wave3',
    title: 'Wellenbrecher',
    description: 'Erreiche oder überstehe Welle 3 in einer beliebigen Arena',
    category: 'combat',
    targetType: 'wave',
    targetCount: 3,
    rewardNAT: 200,
    rewardReputation: 95,
    badge: 'Welle 3',
    difficulty: 'normal',
  },

  // Boss milestone
  {
    id: 'opt_boss_horst',
    title: 'Traktor-Horst stoppen',
    description: 'Besiege den Wehrheimer Endboss Traktor-Horst in Welle 5',
    category: 'boss',
    targetType: 'boss',
    targetCount: 1,
    rewardNAT: 450,
    rewardReputation: 250,
    badge: 'Bosskampf',
    difficulty: 'heroisch',
  },

  // Economy & Collection
  {
    id: 'opt_taler',
    title: 'Neu-Anspach Schatzkammer',
    description: 'Sammle 150 Neu-Anspach-Taler (NAT) in Gefechten oder Stadtrundgängen',
    category: 'taler',
    targetType: 'taler_collected',
    targetCount: 150,
    rewardNAT: 210,
    rewardReputation: 90,
    badge: 'Wirtschaft',
    difficulty: 'normal',
  },

  // Gunsmith & Weapons
  {
    id: 'opt_gunsmith',
    title: 'Meister-Waffenschmied',
    description: 'Installiere 1 Waffen-Aufsatz oder Pack-a-Punch Stufe im Gunsmith',
    category: 'gunsmith',
    targetType: 'gunsmith_upgrade',
    targetCount: 1,
    rewardNAT: 190,
    rewardReputation: 85,
    badge: 'Gunsmith',
    difficulty: 'normal',
  },
  {
    id: 'opt_bembel_kills',
    title: 'Bembel-Bomber Präzision',
    description: 'Eliminiere 12 Gegner mit dem Bembel-Bomber oder Apfelwein-Blaster',
    category: 'combat',
    targetType: 'kills_weapon',
    targetWeapon: 'bembel',
    targetCount: 12,
    rewardNAT: 300,
    rewardReputation: 150,
    badge: 'Waffenmeister',
    difficulty: 'schwer',
  },
];

// Simple deterministic hash based on date string
function simpleDateHash(dateKey: string): number {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash * 31 + dateKey.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash);
}

/**
 * Generates or retrieves daily missions for the specified date.
 * Guarantees the Hessenpark elimination challenge as requested by the user,
 * combined with 3 rotating daily challenges.
 */
export function generateDailyMissions(dateKey: string): DailyMissionsState {
  const hash = simpleDateHash(dateKey);

  // 1. Guaranteed Core Challenge: "Eliminate 10 enemies in the Hessenpark"
  const hessenparkMission: DailyMission = {
    id: `hessenpark_elim_10_${dateKey}`,
    title: 'Einsatz im Hessenpark',
    description: 'Eliminiere 10 Gegner im Freilichtmuseum Hessenpark',
    category: 'combat',
    targetType: 'kills_arena',
    arenaId: 'hessenpark',
    targetCount: 10,
    currentProgress: 0,
    completed: false,
    claimed: false,
    rewardNAT: 250,
    rewardReputation: 120,
    badge: 'Hessenpark',
    difficulty: 'normal',
  };

  // 2. Select 3 distinct rotating missions from the pool using seeded indices
  const availablePool = [...ROTATING_MISSION_POOL];
  const selectedMissions: DailyMission[] = [hessenparkMission];

  let currentSeed = hash;
  for (let i = 0; i < 3 && availablePool.length > 0; i++) {
    currentSeed = (currentSeed * 1664525 + 1013904223) & 0xffffffff;
    const index = Math.abs(currentSeed) % availablePool.length;
    const template = availablePool.splice(index, 1)[0];

    selectedMissions.push({
      id: `${template.id}_${dateKey}`,
      title: template.title,
      description: template.description,
      category: template.category,
      targetType: template.targetType,
      targetCount: template.targetCount,
      currentProgress: 0,
      completed: false,
      claimed: false,
      rewardNAT: template.rewardNAT,
      rewardReputation: template.rewardReputation,
      arenaId: template.arenaId,
      targetRole: template.targetRole,
      targetWeapon: template.targetWeapon,
      badge: template.badge,
      difficulty: template.difficulty,
    });
  }

  return {
    dateKey,
    missions: selectedMissions,
    grandBonusClaimed: false,
    grandBonusRewardNAT: 500,
    grandBonusRewardReputation: 250,
  };
}

export function loadSavedDailyMissions(): DailyMissionsState {
  const todayKey = getTodayKey();
  try {
    const raw = localStorage.getItem('na_daily_missions_data');
    if (raw) {
      const parsed: DailyMissionsState = JSON.parse(raw);
      if (parsed && parsed.dateKey === todayKey && Array.isArray(parsed.missions) && parsed.missions.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load daily missions from localStorage:', err);
  }

  const fresh = generateDailyMissions(todayKey);
  saveDailyMissions(fresh);
  return fresh;
}

export function saveDailyMissions(state: DailyMissionsState): void {
  try {
    localStorage.setItem('na_daily_missions_data', JSON.stringify(state));
  } catch (err) {
    console.warn('Failed to persist daily missions:', err);
  }
}

/**
 * Processes game events (kills, waves, taler, gunsmith) and updates daily mission progress.
 * Returns the list of missions that were just completed during this event (for celebratory toasts & SFX).
 */
export function processDailyMissionEvent(
  state: DailyMissionsState,
  event: MissionEventPayload
): { nextState: DailyMissionsState; newlyCompleted: DailyMission[] } {
  const todayKey = getTodayKey();
  let currentState = state;

  // If date rolled over, regenerate
  if (currentState.dateKey !== todayKey) {
    currentState = generateDailyMissions(todayKey);
  }

  const newlyCompleted: DailyMission[] = [];
  let changed = false;

  const nextMissions = currentState.missions.map((m) => {
    if (m.completed) return m;

    let progressDelta = 0;

    switch (m.targetType) {
      case 'kills_arena':
        if (event.type === 'kill') {
          if (!m.arenaId || m.arenaId === 'any' || m.arenaId === event.arenaId) {
            progressDelta = 1;
          }
        }
        break;

      case 'kills_role':
        if (event.type === 'kill') {
          if (m.targetRole && event.role === m.targetRole) {
            progressDelta = 1;
          }
        }
        break;

      case 'kills_weapon':
        if (event.type === 'kill') {
          if (!m.targetWeapon || event.weaponId === m.targetWeapon || (m.targetWeapon === 'bembel' && event.weaponId === 'apfelwein_blaster')) {
            progressDelta = 1;
          }
        }
        break;

      case 'boss':
        if (event.type === 'kill' && event.isBoss) {
          progressDelta = 1;
        }
        break;

      case 'streak':
        if (event.type === 'streak' && (event.streakCount || 0) >= 2) {
          progressDelta = 1;
        }
        break;

      case 'wave':
        if (event.type === 'wave' && (event.wave || 0) >= m.targetCount) {
          progressDelta = m.targetCount - m.currentProgress;
        }
        break;

      case 'taler_collected':
        if (event.type === 'taler' && (event.amount || 0) > 0) {
          progressDelta = event.amount || 0;
        }
        break;

      case 'gunsmith_upgrade':
        if (event.type === 'gunsmith') {
          progressDelta = 1;
        }
        break;
    }

    if (progressDelta > 0) {
      changed = true;
      const nextProgress = Math.min(m.targetCount, m.currentProgress + progressDelta);
      const isNowCompleted = nextProgress >= m.targetCount;

      if (isNowCompleted && !m.completed) {
        newlyCompleted.push({
          ...m,
          currentProgress: nextProgress,
          completed: true,
        });
      }

      return {
        ...m,
        currentProgress: nextProgress,
        completed: isNowCompleted,
      };
    }

    return m;
  });

  const nextState: DailyMissionsState = {
    ...currentState,
    missions: nextMissions,
  };

  if (changed) {
    saveDailyMissions(nextState);
  }

  return { nextState, newlyCompleted };
}

/**
 * Claims reward for a completed mission.
 */
export function claimDailyMission(
  state: DailyMissionsState,
  missionId: string
): { nextState: DailyMissionsState; rewardedNAT: number; rewardedReputation: number } | null {
  const mission = state.missions.find((m) => m.id === missionId);
  if (!mission || !mission.completed || mission.claimed) {
    return null;
  }

  const nextMissions = state.missions.map((m) =>
    m.id === missionId ? { ...m, claimed: true } : m
  );

  const nextState: DailyMissionsState = {
    ...state,
    missions: nextMissions,
  };

  saveDailyMissions(nextState);

  return {
    nextState,
    rewardedNAT: mission.rewardNAT,
    rewardedReputation: mission.rewardReputation,
  };
}

/**
 * Claims the Daily Grand Bonus (Tages-Meister) when all missions are done.
 */
export function claimDailyGrandBonus(
  state: DailyMissionsState
): { nextState: DailyMissionsState; rewardedNAT: number; rewardedReputation: number } | null {
  if (state.grandBonusClaimed) return null;
  const allCompleted = state.missions.length > 0 && state.missions.every((m) => m.completed);
  if (!allCompleted) return null;

  const nextState: DailyMissionsState = {
    ...state,
    grandBonusClaimed: true,
  };

  saveDailyMissions(nextState);

  return {
    nextState,
    rewardedNAT: state.grandBonusRewardNAT,
    rewardedReputation: state.grandBonusRewardReputation,
  };
}
