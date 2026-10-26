import { requestAuth } from '../auth';

export interface CloudGameProgress {
  budget: number;
  reputation: number;
  operatorLevel: number;
  skillPoints: number;
  totalWins: number;
  facilities: Record<string, any>;
  unlockedMaps: string[];
  mapLevels: Record<string, number>;
  skillTree: Record<string, number>;
  weaponUpgrades: Record<string, any>;
  dailyMissions: any;
  careerStats: any;
  updatedAt?: number;
}

export async function fetchCloudGameProgress(): Promise<CloudGameProgress | null> {
  try {
    const res = (await requestAuth('/api/game/progress', { method: 'GET' })) as any;
    return res?.progress || null;
  } catch (err) {
    console.warn('[CloudSave] Konnte Spielstand vom Server nicht abrufen:', err);
    return null;
  }
}

export async function saveCloudGameProgress(progress: CloudGameProgress): Promise<boolean> {
  try {
    const res = (await requestAuth('/api/game/progress', {
      method: 'POST',
      body: JSON.stringify(progress),
    })) as any;
    return Boolean(res?.success);
  } catch (err) {
    console.warn('[CloudSave] Konnte Spielstand nicht synchronisieren:', err);
    return false;
  }
}
