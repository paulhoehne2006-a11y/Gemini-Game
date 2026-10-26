import React, { useState, useEffect, useRef } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { AuthUser, AuthRequestError, getCurrentUser, logout } from './auth';
import { TopBar, AppTab } from './components/TopBar';
import { ThreeCanvas } from './components/ThreeCanvas';
import { TycoonHub } from './components/TycoonHub';
import { MultiplayerLobby } from './components/MultiplayerLobby';
import { LeaderboardView } from './components/LeaderboardView';
import { GunsmithView } from './components/GunsmithView';
import { SkillTreeView } from './components/SkillTreeView';
import { OperatorOnboardingModal } from './components/OperatorOnboardingModal';
import { LegalModal } from './components/LegalModal';
import { DailyMissionsModal } from './components/DailyMissionsModal';
import { TutorialModal } from './components/TutorialModal';
import { MobileTacticalHub } from './components/MobileTacticalHub';
import { ClanHub } from './components/ClanHub';
import { HomeDashboard } from './components/HomeDashboard';
import { MobileAppShell } from './components/MobileAppShell';
import { MobileHeader } from './components/MobileHeader';
import { MobileDock } from './components/MobileDock';
import { MobileHomeView } from './components/MobileHomeView';
import { MobileHubDrawer } from './components/MobileHubDrawer';
import { CloudGameProgress, fetchCloudGameProgress, saveCloudGameProgress } from './game/cloudSave';
import {
  DailyMissionsState,
  loadSavedDailyMissions,
  processDailyMissionEvent,
  claimDailyMission,
  claimDailyGrandBonus,
  getReputationRank,
} from './game/missions';
import {
  SEASON_BATTLE_PASS,
  ACHIEVEMENTS_LIST,
  CareerStats,
  loadCareerStats,
  saveCareerStats,
} from './game/progression';
import { AgentRole } from './game/agents/microAgents';
import { INITIAL_FACILITIES, Facility, getPassiveShiftVaultCap } from './game/tycoon';
import {
  MultiplayerRoom,
  updateMultiplayerState,
  submitScore,
  registerOperatorProfile,
} from './game/multiplayer';
import {
  ArrowRight,
  Award,
  Building2,
  CheckCircle2,
  Coins,
  Crosshair,
  Flame,
  Gift,
  Lock,
  ShieldAlert,
  Sparkles,
  Target,
  Trophy,
  Users,
  Wrench,
} from 'lucide-react';
import {
  WEAPONS,
  INITIAL_WEAPON_UPGRADES,
  getEffectiveWeaponStats,
  addWeaponXpToState,
  MAX_WEAPON_LEVEL,
} from './game/weapons';
import {
  ARENAS,
  ARENA_UNLOCK_RULES,
  checkArenaUnlocked,
  INITIAL_MAP_LEVELS,
  MAX_MAP_LEVEL,
  getMapBotScaling,
} from './game/three/arenas';
import {
  INITIAL_SKILL_TREE,
  SKILL_TREE_NODES,
  computeSkillTreeBonuses,
  getTotalSpentSkillPoints,
  getOperatorXpForNextLevel,
} from './game/skillTree';
import {
  AllWeaponsUpgrades,
  AttachmentType,
  WeaponAttachments,
  SkillTreeLevels,
  MapLevelsState,
} from './types';
import { soundFx } from './audio/soundFx';
import { LegalConsentRecord } from './legal';

/**
 * Detects whether the user is on a mobile/smartphone device (both in portrait AND landscape / "Handy Querformat").
 * Even when a smartphone is rotated to landscape (e.g. 844x390), its shortest side is < 620px or it reports a mobile UA / coarse pointer.
 */
function detectMobileHardware(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const hasTouch =
    'ontouchstart' in window || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0);
  const isCoarsePointer =
    typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
  const shortestSide = Math.min(window.innerWidth, window.innerHeight);
  return (
    isMobileUA ||
    (hasTouch && (isCoarsePointer || shortestSide < 620)) ||
    window.innerWidth < 820
  );
}

export default function App() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [sessionSupersededNotice, setSessionSupersededNotice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [showMobileCommandOverlay, setShowMobileCommandOverlay] = useState(false);
  const [currentArena, setCurrentArena] = useState<string>('hessenpark');

  // Strict Mobile & Landscape ("Handy Querformat") Hardware Lock:
  // On mobile devices, 3D Battle Royale is completely disabled in both portrait and landscape orientation.
  const [isMobileHardware, setIsMobileHardware] = useState<boolean>(() => detectMobileHardware());
  const [isLandscape, setIsLandscape] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth > window.innerHeight;
  });
  const [isMobileMode, setIsMobileMode] = useState<boolean>(() => detectMobileHardware());

  useEffect(() => {
    const syncViewportAndOrientation = () => {
      const mobileHw = detectMobileHardware();
      const landscape = window.innerWidth > window.innerHeight;
      setIsMobileHardware(mobileHw);
      setIsLandscape(landscape);
      if (mobileHw) {
        setIsMobileMode(true);
      } else {
        const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
        const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
        if (!isMobileUA) {
          setIsMobileMode(false);
        }
      }
    };
    window.addEventListener('resize', syncViewportAndOrientation);
    window.addEventListener('orientationchange', syncViewportAndOrientation);
    return () => {
      window.removeEventListener('resize', syncViewportAndOrientation);
      window.removeEventListener('orientationchange', syncViewportAndOrientation);
    };
  }, []);

  const handleSetMobileMode = (nextMobile: boolean) => {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    if (isMobileUA && !nextMobile) {
      setIsMobileMode(true);
      return;
    }
    setIsMobileMode(nextMobile);
  };

  // Operator Profile & Onboarding State ("Am anfang soll man sich mit einen Benutzernamen geben")
  const [isOperatorRegistered, setIsOperatorRegistered] = useState<boolean>(() => {
    return localStorage.getItem('na_operator_registered') === 'true';
  });
  const [showProfileModal, setShowProfileModal] = useState<boolean>(() => {
    return localStorage.getItem('na_operator_registered') !== 'true';
  });
  const [showLegalModal, setShowLegalModal] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [isTutorialMinimized, setIsTutorialMinimized] = useState<boolean>(false);
  const [tutorialRewardClaimed, setTutorialRewardClaimed] = useState<boolean>(() => {
    return localStorage.getItem('na_tutorial_reward_claimed') === 'true';
  });
  const [legalConsent, setLegalConsent] = useState<LegalConsentRecord | undefined>(() => {
    const stored = localStorage.getItem('na_legal_consent');
    if (!stored) return undefined;
    try {
      return JSON.parse(stored) as LegalConsentRecord;
    } catch {
      return undefined;
    }
  });

  const [playerName, setPlayerName] = useState<string>(() => {
    return localStorage.getItem('na_player_name') || 'AnspachOperator';
  });
  const [clanTag, setClanTag] = useState<string>(() => {
    return localStorage.getItem('na_clan_tag') || '';
  });
  const [playerCity, setPlayerCity] = useState<string>(() => {
    return localStorage.getItem('na_player_city') || 'Neu-Anspach';
  });

  // Daily Mission System & Operator Reputation Progression
  const [showDailyMissionsModal, setShowDailyMissionsModal] = useState<boolean>(false);
  const [dailyMissionsState, setDailyMissionsState] = useState<DailyMissionsState>(() => {
    return loadSavedDailyMissions();
  });
  const [reputation, setReputation] = useState<number>(() => {
    const saved = localStorage.getItem('na_reputation');
    return saved ? parseInt(saved, 10) : 150;
  });
  const [careerStats, setCareerStats] = useState<CareerStats>(() => loadCareerStats());
  const [completedMissionToast, setCompletedMissionToast] = useState<{
    id: string;
    title: string;
    description: string;
    rewardNAT: number;
    rewardReputation: number;
  } | null>(null);

  // Economy & Progression State
  const [budget, setBudget] = useState<number>(() => {
    const saved = localStorage.getItem('na_budget');
    return saved ? parseInt(saved, 10) : 250;
  });
  const [facilities, setFacilities] = useState<Record<string, Facility>>(() => {
    const saved = localStorage.getItem('na_facilities');
    return saved ? JSON.parse(saved) : INITIAL_FACILITIES;
  });
  const [totalWins, setTotalWins] = useState<number>(() => {
    const saved = localStorage.getItem('na_wins');
    return saved ? parseInt(saved, 10) : 0;
  });

  // Unlocked Maps Progression State (Starts with Hessenpark unlocked!)
  const [unlockedMaps, setUnlockedMaps] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('na_unlocked_maps');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return ['hessenpark'];
  });

  // Map Levels State (Lv. 1-10 per map -> stronger bots & higher NAT/XP rewards)
  const [mapLevels, setMapLevels] = useState<MapLevelsState>(() => {
    try {
      const saved = localStorage.getItem('na_map_levels');
      if (saved) {
        return { ...INITIAL_MAP_LEVELS, ...JSON.parse(saved) };
      }
    } catch {}
    return INITIAL_MAP_LEVELS;
  });

  // Operator Skilltree State (3 branches, 12 skills) & Skill Points (SP)
  const [skillTree, setSkillTree] = useState<SkillTreeLevels>(() => {
    try {
      const saved = localStorage.getItem('na_skill_tree');
      if (saved) {
        return { ...INITIAL_SKILL_TREE, ...JSON.parse(saved) };
      }
    } catch {}
    return INITIAL_SKILL_TREE;
  });
  const [skillPoints, setSkillPoints] = useState<number>(() => {
    const saved = localStorage.getItem('na_skill_points');
    return saved ? parseInt(saved, 10) : 1;
  });
  const [operatorLevel, setOperatorLevel] = useState<number>(() => {
    const saved = localStorage.getItem('na_operator_level');
    return saved ? parseInt(saved, 10) : 1;
  });
  const [operatorXp, setOperatorXp] = useState<number>(() => {
    const saved = localStorage.getItem('na_operator_xp');
    return saved ? Math.max(0, parseInt(saved, 10)) : 0;
  });
  const [passiveShiftEarned, setPassiveShiftEarned] = useState<number>(() => {
    const saved = localStorage.getItem('na_passive_shift_earned');
    return saved ? Math.max(0, parseInt(saved, 10)) : 0;
  });
  const [spSpentCount, setSpSpentCount] = useState<number>(() => {
    const saved = localStorage.getItem('na_sp_spent');
    return saved ? Math.max(0, parseInt(saved, 10)) : 0;
  });

  const operatorLevelRef = useRef<number>(operatorLevel);
  operatorLevelRef.current = operatorLevel;
  const operatorXpRef = useRef<number>(operatorXp);
  operatorXpRef.current = operatorXp;

  const gainOperatorXp = (amount: number) => {
    if (amount <= 0) return;
    let xp = operatorXpRef.current + Math.round(amount);
    let lv = operatorLevelRef.current;
    let gainedSpTotal = 0;

    while (lv < 250 && xp >= getOperatorXpForNextLevel(lv)) {
      xp -= getOperatorXpForNextLevel(lv);
      lv += 1;
      gainedSpTotal += lv % 5 === 0 ? 2 : 1;
    }

    operatorXpRef.current = xp;
    setOperatorXp(xp);
    localStorage.setItem('na_operator_xp', xp.toString());

    if (lv !== operatorLevelRef.current) {
      operatorLevelRef.current = lv;
      setOperatorLevel(lv);
      localStorage.setItem('na_operator_level', lv.toString());
      soundFx.playLevelUp();
    }
    if (gainedSpTotal > 0) {
      setSkillPoints((prev) => {
        const next = prev + gainedSpTotal;
        localStorage.setItem('na_skill_points', next.toString());
        return next;
      });
    }
  };

  // CoD: Black Ops Cold War Weapon Upgrades State (5-Slot Gunsmith, Rarity Tiers I-V, Pack-a-Punch I-III, Weapon Level 1-30 & Mastery Camos)
  const [weaponUpgrades, setWeaponUpgrades] = useState<AllWeaponsUpgrades>(() => {
    try {
      const saved = localStorage.getItem('na_weapon_upgrades');
      if (saved) {
        const parsed = JSON.parse(saved);
        const merged: AllWeaponsUpgrades = { ...INITIAL_WEAPON_UPGRADES };
        for (const k of Object.keys(merged)) {
          if (parsed[k]) {
            merged[k] = {
              ...merged[k],
              ...parsed[k],
              attachments: {
                ...merged[k].attachments,
                ...(parsed[k].attachments || {}),
              },
            };
          }
        }
        return merged;
      }
    } catch {}
    return INITIAL_WEAPON_UPGRADES;
  });
  const [selectedGunsmithWeapon, setSelectedGunsmithWeapon] = useState<string>('bembel');

  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [lastMatchScore, setLastMatchScore] = useState(0);
  const [lastMatchKills, setLastMatchKills] = useState(0);
  const [lastMatchReward, setLastMatchReward] = useState(0);
  const [matchState, setMatchState] = useState<'inactive' | 'active' | 'paused' | 'complete'>('inactive');

  // Gemini Pro Master-Commander State
  const [isCommanderThinking, setIsCommanderThinking] = useState(false);
  const [latestCommanderBark, setLatestCommanderBark] = useState<string>(
    'Ei gude! Packt die Bembel aus un vertreibt die Wehrheimer vom Hessenpark-Marktplatz!'
  );
  const [commanderDirectives, setCommanderDirectives] = useState<any>(null);
  const [crisisEvent, setCrisisEvent] = useState<{
    title: string;
    description: string;
    budgetBonus: number;
    recommendedUpgrade: string;
  } | null>(null);

  // Multiplayer sync state
  const [activeRoom, setActiveRoom] = useState<MultiplayerRoom | null>(null);
  const [localPlayerId, setLocalPlayerId] = useState<string | null>(null);

  // Server-Authoritative Cloud Save State Refs
  const hasHydratedFromCloudRef = useRef<boolean>(false);
  const cloudSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadCloudSaveIntoState = (cloud: CloudGameProgress) => {
    if (typeof cloud.budget === 'number') setBudget(cloud.budget);
    if (typeof cloud.reputation === 'number') setReputation(cloud.reputation);
    if (typeof cloud.operatorLevel === 'number') setOperatorLevel(cloud.operatorLevel);
    if (typeof cloud.skillPoints === 'number') setSkillPoints(cloud.skillPoints);
    if (typeof cloud.totalWins === 'number') setTotalWins(cloud.totalWins);
    if (cloud.facilities && typeof cloud.facilities === 'object') {
      setFacilities((prev) => ({ ...prev, ...cloud.facilities }));
    }
    if (Array.isArray(cloud.unlockedMaps) && cloud.unlockedMaps.length > 0) {
      setUnlockedMaps(cloud.unlockedMaps);
    }
    if (cloud.mapLevels && typeof cloud.mapLevels === 'object') {
      setMapLevels(cloud.mapLevels);
    }
    if (cloud.skillTree && typeof cloud.skillTree === 'object') {
      setSkillTree(cloud.skillTree);
    }
    if (cloud.weaponUpgrades && typeof cloud.weaponUpgrades === 'object') {
      setWeaponUpgrades(cloud.weaponUpgrades);
    }
    if (cloud.dailyMissions && typeof cloud.dailyMissions === 'object' && Array.isArray(cloud.dailyMissions.missions)) {
      setDailyMissionsState(cloud.dailyMissions);
    }
    if (cloud.careerStats && typeof cloud.careerStats === 'object') {
      setCareerStats((prev) => {
        const next = { ...prev, ...cloud.careerStats };
        saveCareerStats(next);
        return next;
      });
      if (cloud.careerStats.lastLoginDate) {
        try { localStorage.setItem('na_last_daily_bonus_date', cloud.careerStats.lastLoginDate); } catch {}
      }
    }
  };

  const syncAccountProgress = async () => {
    try {
      const cloud = await fetchCloudGameProgress();
      if (cloud) {
        loadCloudSaveIntoState(cloud);
      } else {
        await saveCloudGameProgress({
          budget,
          reputation,
          operatorLevel,
          skillPoints,
          totalWins,
          facilities,
          unlockedMaps,
          mapLevels,
          skillTree,
          weaponUpgrades,
          dailyMissions: dailyMissionsState,
          careerStats,
        });
      }
    } catch (err) {
      console.warn('[CloudSave] Error syncing on auth:', err);
    } finally {
      hasHydratedFromCloudRef.current = true;
    }
  };

  useEffect(() => {
    let active = true;
    getCurrentUser()
      .then((user) => {
        if (active) {
          setAuthUser(user);
          if (user) {
            const identity = user.displayName || user.username || user.email;
            if (identity) {
              const cleanName = identity.slice(0, 20);
              setPlayerName(cleanName);
              localStorage.setItem('na_player_name', cleanName);
            }
            const profileClanTag = user.clanTag || '';
            const profileCity = user.faction === 'wehrheim' ? 'Wehrheim' : 'Neu-Anspach';
            setClanTag(profileClanTag);
            setPlayerCity(profileCity);
            setIsOperatorRegistered(true);
            const hasGoogleOnboardingFlag =
              typeof window !== 'undefined' &&
              new URLSearchParams(window.location.search).get('google_onboarding') === '1';
            if (hasGoogleOnboardingFlag) {
              window.history.replaceState({}, '', window.location.pathname);
              setShowTutorial(true);
              setIsTutorialMinimized(false);
            }
            setShowProfileModal(false);
            localStorage.setItem('na_clan_tag', profileClanTag);
            localStorage.setItem('na_player_city', profileCity);
            localStorage.setItem('na_operator_registered', 'true');
            syncAccountProgress();
          }
        }
      })
      .catch(() => {
        if (active) setAuthError('Die Sitzung konnte nicht geprüft werden. Bitte lade die Seite neu.');
      })
      .finally(() => {
        if (active) setAuthLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleAuthenticated = (user: AuthUser) => {
    setAuthError(null);
    setSessionSupersededNotice(null);
    setAuthUser(user);
    const identity = user.displayName || user.username || user.email;
    if (identity) {
      const cleanName = identity.slice(0, 20);
      const profileClanTag = user.clanTag || '';
      const profileCity = user.faction === 'wehrheim' ? 'Wehrheim' : 'Neu-Anspach';
      setPlayerName(cleanName);
      setClanTag(profileClanTag);
      setPlayerCity(profileCity);
      localStorage.setItem('na_player_name', cleanName);
      localStorage.setItem('na_clan_tag', profileClanTag);
      localStorage.setItem('na_player_city', profileCity);
      localStorage.setItem('na_operator_registered', 'true');
      setIsOperatorRegistered(true);
      setShowProfileModal(false);
      if (user.isNewAccount) {
        setShowTutorial(true);
        setIsTutorialMinimized(false);
      }
      registerOperatorProfile({
        name: cleanName,
        clanTag: profileClanTag,
        city: profileCity,
      }).catch(() => {});
      syncAccountProgress();
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      if (!(error instanceof AuthRequestError && error.status === 401)) {
        setAuthError('Die Abmeldung konnte nicht bestätigt werden. Bitte versuche es erneut.');
        return;
      }
    }
    setAuthUser(null);
    setIsOperatorRegistered(false);
    setShowProfileModal(false);
    localStorage.removeItem('na_operator_registered');
    localStorage.removeItem('na_player_name');
    localStorage.removeItem('na_clan_tag');
    localStorage.removeItem('na_player_city');
    hasHydratedFromCloudRef.current = false;
  };

  // Compute current signature weapon display name for Real Leaderboard
  const primaryWeaponObj = WEAPONS[selectedGunsmithWeapon] || WEAPONS.bembel;
  const primaryWeaponStats = getEffectiveWeaponStats(
    primaryWeaponObj,
    weaponUpgrades[selectedGunsmithWeapon]
  );
  const signatureWeaponName = primaryWeaponStats.displayName;

  // Total count of unlocked maps (combining explicit unlocks + win threshold unlocks)
  const effectiveUnlockedMaps = Object.keys(ARENAS).filter((id) =>
    checkArenaUnlocked(id, totalWins, unlockedMaps)
  );

  // Calculate total passive income per second
  const totalIncomePerSec = Object.values(facilities).reduce(
    (acc, f) => acc + f.level * f.incomePerSec,
    0
  );

  // Passive Income Timer (ticks every 3000ms and enforces Tycoon Shift Vault Cap)
  useEffect(() => {
    const interval = setInterval(() => {
      if (totalIncomePerSec > 0) {
        setPassiveShiftEarned((prevShift) => {
          const vaultCap = getPassiveShiftVaultCap(facilities);
          const roomLeft = Math.max(0, vaultCap - prevShift);
          const payout = Math.min(totalIncomePerSec, roomLeft);
          if (payout <= 0) return prevShift;
          setBudget((prevBudget) => {
            const nextBudget = prevBudget + payout;
            localStorage.setItem('na_budget', nextBudget.toString());
            return nextBudget;
          });
          const nextShift = prevShift + payout;
          localStorage.setItem('na_passive_shift_earned', nextShift.toString());
          return nextShift;
        });
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [totalIncomePerSec, facilities]);

  // Persist state in localStorage
  useEffect(() => {
    localStorage.setItem('na_budget', budget.toString());
  }, [budget]);

  useEffect(() => {
    localStorage.setItem('na_facilities', JSON.stringify(facilities));
  }, [facilities]);

  useEffect(() => {
    localStorage.setItem('na_wins', totalWins.toString());
  }, [totalWins]);

  useEffect(() => {
    localStorage.setItem('na_unlocked_maps', JSON.stringify(unlockedMaps));
  }, [unlockedMaps]);

  useEffect(() => {
    localStorage.setItem('na_weapon_upgrades', JSON.stringify(weaponUpgrades));
  }, [weaponUpgrades]);

  useEffect(() => {
    localStorage.setItem('na_reputation', reputation.toString());
  }, [reputation]);

  useEffect(() => {
    localStorage.setItem('na_map_levels', JSON.stringify(mapLevels));
  }, [mapLevels]);

  useEffect(() => {
    localStorage.setItem('na_skill_tree', JSON.stringify(skillTree));
  }, [skillTree]);

  useEffect(() => {
    localStorage.setItem('na_skill_points', skillPoints.toString());
  }, [skillPoints]);

  useEffect(() => {
    localStorage.setItem('na_operator_level', operatorLevel.toString());
  }, [operatorLevel]);

  useEffect(() => {
    localStorage.setItem('na_operator_xp', operatorXp.toString());
  }, [operatorXp]);

  useEffect(() => {
    localStorage.setItem('na_passive_shift_earned', passiveShiftEarned.toString());
  }, [passiveShiftEarned]);

  useEffect(() => {
    localStorage.setItem('na_sp_spent', spSpentCount.toString());
  }, [spSpentCount]);

  useEffect(() => {
    saveCareerStats(careerStats);
  }, [careerStats]);

  // Auto-sync debounced cloud save to database when progress changes
  useEffect(() => {
    if (!authUser || !hasHydratedFromCloudRef.current) return;
    if (cloudSaveTimerRef.current) {
      clearTimeout(cloudSaveTimerRef.current);
    }
    cloudSaveTimerRef.current = setTimeout(() => {
      saveCloudGameProgress({
        budget,
        reputation,
        operatorLevel,
        skillPoints,
        totalWins,
        facilities,
        unlockedMaps,
        mapLevels,
        skillTree,
        weaponUpgrades,
        dailyMissions: dailyMissionsState,
        careerStats,
      }).catch(() => {});
    }, 1500);

    return () => {
      if (cloudSaveTimerRef.current) {
        clearTimeout(cloudSaveTimerRef.current);
      }
    };
  }, [
    authUser,
    budget,
    reputation,
    operatorLevel,
    skillPoints,
    totalWins,
    facilities,
    unlockedMaps,
    mapLevels,
    skillTree,
    weaponUpgrades,
    dailyMissionsState,
    careerStats,
  ]);

  // Toast auto-dismiss timer
  useEffect(() => {
    if (!completedMissionToast) return;
    const timer = setTimeout(() => {
      setCompletedMissionToast(null);
    }, 5500);
    return () => clearTimeout(timer);
  }, [completedMissionToast]);

  // Sync registered operator profile with real server on startup
  useEffect(() => {
    if (isOperatorRegistered && playerName) {
      registerOperatorProfile({
        name: playerName,
        clanTag,
        city: playerCity,
        consent: legalConsent,
        unlockedMapsCount: effectiveUnlockedMaps.length,
        signatureWeapon: signatureWeaponName,
        currentArena: ARENAS[currentArena]?.name || currentArena,
      }).catch(() => {});
    }
  }, [isOperatorRegistered, legalConsent]);

  const getTodayLocalDateStr = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayDateStr = getTodayLocalDateStr();
  const todayUtcStr = new Date().toISOString().slice(0, 10);
  const storedDailyBonusDate = typeof window !== 'undefined' ? localStorage.getItem('na_last_daily_bonus_date') : null;

  const canClaimDailyLogin =
    careerStats.lastLoginDate !== todayDateStr &&
    careerStats.lastLoginDate !== todayUtcStr &&
    careerStats.lastDailyBonusDate !== todayDateStr &&
    careerStats.lastDailyBonusDate !== todayUtcStr &&
    storedDailyBonusDate !== todayDateStr &&
    storedDailyBonusDate !== todayUtcStr;

  const handleClaimDailyLoginBonus = () => {
    if (!canClaimDailyLogin) return;

    const currentClaimDate = getTodayLocalDateStr();
    if (
      careerStats.lastLoginDate === currentClaimDate ||
      careerStats.lastDailyBonusDate === currentClaimDate ||
      (typeof window !== 'undefined' && localStorage.getItem('na_last_daily_bonus_date') === currentClaimDate)
    ) {
      return;
    }

    let nextStreak = 1;
    if (careerStats.lastLoginDate) {
      const last = new Date(careerStats.lastLoginDate);
      const curr = new Date(currentClaimDate);
      const diffDays = Math.round((curr.getTime() - last.getTime()) / (1000 * 3600 * 24));
      if (diffDays === 1) {
        nextStreak = (careerStats.loginStreakDays || 0) + 1;
      } else if (diffDays === 0) {
        return;
      } else {
        nextStreak = 1;
      }
    }

    const rewardNAT = 75 + Math.min(150, nextStreak * 25);
    const rewardRep = 40;
    soundFx.playRewardClaim();

    if (typeof window !== 'undefined') {
      try { localStorage.setItem('na_last_daily_bonus_date', currentClaimDate); } catch {}
    }

    setBudget((prev) => prev + rewardNAT);
    setReputation((prev) => prev + rewardRep);
    setCareerStats((prev) => {
      const updated: CareerStats = {
        ...prev,
        loginStreakDays: nextStreak,
        lastLoginDate: currentClaimDate,
        lastDailyBonusDate: currentClaimDate,
        totalTalerEarned: prev.totalTalerEarned + rewardNAT,
      };
      saveCareerStats(updated);
      return updated;
    });
  };

  const handleClaimBattlePassTier = (tier: number) => {
    const tierDef = SEASON_BATTLE_PASS.find((t) => t.tier === tier);
    if (!tierDef) return;
    if (reputation < tierDef.requiredReputation) return;
    if (careerStats.claimedBattlePassTiers.includes(tier)) return;

    soundFx.playRewardClaim();
    setBudget((prev) => prev + tierDef.rewardNAT);
    setReputation((prev) => prev + 25);
    setCareerStats((prev) => ({
      ...prev,
      claimedBattlePassTiers: [...prev.claimedBattlePassTiers, tier],
      totalTalerEarned: prev.totalTalerEarned + tierDef.rewardNAT,
    }));
  };

  const handleClaimAchievement = (achievementId: string) => {
    const ach = ACHIEVEMENTS_LIST.find((a) => a.id === achievementId);
    if (!ach) return;
    if (!ach.checkUnlocked(careerStats)) return;
    if (careerStats.claimedAchievements.includes(achievementId)) return;

    soundFx.playRewardClaim();
    setBudget((prev) => prev + ach.rewardNAT);
    setReputation((prev) => prev + ach.rewardReputation);
    setCareerStats((prev) => ({
      ...prev,
      claimedAchievements: [...prev.claimedAchievements, achievementId],
      totalTalerEarned: prev.totalTalerEarned + ach.rewardNAT,
    }));
  };

  const handleCompleteOnboarding = (profile: {
    name: string;
    clanTag: string;
    city: string;
    consent?: LegalConsentRecord;
  }) => {
    setPlayerName(profile.name);
    setClanTag(profile.clanTag);
    setPlayerCity(profile.city);
    setIsOperatorRegistered(true);
    setShowProfileModal(false);

    localStorage.setItem('na_player_name', profile.name);
    localStorage.setItem('na_clan_tag', profile.clanTag);
    localStorage.setItem('na_player_city', profile.city);
    localStorage.setItem('na_operator_registered', 'true');
    if (profile.consent) {
      setLegalConsent(profile.consent);
      localStorage.setItem('na_legal_consent', JSON.stringify(profile.consent));
    }

    registerOperatorProfile({
      name: profile.name,
      clanTag: profile.clanTag,
      city: profile.city,
      consent: profile.consent,
      unlockedMapsCount: effectiveUnlockedMaps.length,
      signatureWeapon: signatureWeaponName,
      currentArena: ARENAS[currentArena]?.name || currentArena,
    }).catch(console.error);
  };

  const triggerMissionEvent = (event: Parameters<typeof processDailyMissionEvent>[1]) => {
    setDailyMissionsState((prev) => {
      const { nextState, newlyCompleted } = processDailyMissionEvent(prev, event);
      if (newlyCompleted.length > 0) {
        soundFx.playMissionComplete();
        const first = newlyCompleted[0];
        setCompletedMissionToast({
          id: first.id,
          title: first.title,
          description: first.description,
          rewardNAT: first.rewardNAT,
          rewardReputation: first.rewardReputation,
        });
      }
      return nextState;
    });
  };

  // CoD Cold War Gunsmith & Weapon Leveling Handlers
  const handleUpgradeAttachment = (
    weaponId: string,
    slot: AttachmentType,
    targetLevel: number,
    cost: number
  ) => {
    if (budget < cost) return;
    setBudget((prev) => prev - cost);
    triggerMissionEvent({ type: 'gunsmith' });
    setCareerStats((prev) => ({ ...prev, gunsmithUpgrades: prev.gunsmithUpgrades + 1 }));
    setWeaponUpgrades((prev) => {
      const cur = prev[weaponId] || INITIAL_WEAPON_UPGRADES[weaponId];
      return {
        ...prev,
        [weaponId]: {
          ...cur,
          attachments: {
            ...cur.attachments,
            [slot]: targetLevel,
          },
        },
      };
    });
  };

  const handleUpgradeRarity = (weaponId: string, targetTier: number, cost: number) => {
    if (budget < cost) return;
    setBudget((prev) => prev - cost);
    setCareerStats((prev) => ({ ...prev, gunsmithUpgrades: prev.gunsmithUpgrades + 1 }));
    setWeaponUpgrades((prev) => {
      const cur = prev[weaponId] || INITIAL_WEAPON_UPGRADES[weaponId];
      return {
        ...prev,
        [weaponId]: {
          ...cur,
          rarityTier: targetTier,
        },
      };
    });
  };

  const handleUpgradePackAPunch = (weaponId: string, targetLevel: number, cost: number) => {
    if (budget < cost) return;
    setBudget((prev) => prev - cost);
    triggerMissionEvent({ type: 'gunsmith' });
    setCareerStats((prev) => ({ ...prev, gunsmithUpgrades: prev.gunsmithUpgrades + 1 }));
    const papWeaponName = WEAPONS[weaponId]?.papNames[targetLevel - 1] || WEAPONS[weaponId]?.name;
    setWeaponUpgrades((prev) => {
      const cur = prev[weaponId] || INITIAL_WEAPON_UPGRADES[weaponId];
      return {
        ...prev,
        [weaponId]: {
          ...cur,
          papLevel: targetLevel,
        },
      };
    });

    if (isOperatorRegistered) {
      submitScore({
        name: playerName,
        clanTag,
        score: 0,
        kills: 0,
        victory: false,
        city: playerCity,
        unlockedMapsCount: effectiveUnlockedMaps.length,
        signatureWeapon: papWeaponName,
        currentArena: ARENAS[currentArena]?.name || currentArena,
        eventNotice: `hat „${papWeaponName}“ (Pack-a-Punch Stufe ${targetLevel}) geschmiedet!`,
      }).catch(() => {});
    }
  };

  const handleTrainWeaponLevel = (weaponId: string, levelsToGain: number, costNAT: number) => {
    if (budget < costNAT) return;
    setBudget((prev) => prev - costNAT);
    triggerMissionEvent({ type: 'gunsmith' });
    setWeaponUpgrades((prev) => {
      const cur = prev[weaponId] || INITIAL_WEAPON_UPGRADES[weaponId];
      const currentLv = cur.weaponLevel || 1;
      const nextLv = Math.min(MAX_WEAPON_LEVEL, currentLv + levelsToGain);
      return {
        ...prev,
        [weaponId]: {
          ...cur,
          weaponLevel: nextLv,
          weaponXp: nextLv >= MAX_WEAPON_LEVEL ? 0 : cur.weaponXp || 0,
        },
      };
    });
  };

  const handleSelectWeaponMastery = (weaponId: string, masteryId: string) => {
    setWeaponUpgrades((prev) => {
      const cur = prev[weaponId] || INITIAL_WEAPON_UPGRADES[weaponId];
      return {
        ...prev,
        [weaponId]: {
          ...cur,
          masteryId,
        },
      };
    });
  };

  const handleWeaponXpGain = (weaponId: string, xpAmount: number) => {
    setWeaponUpgrades((prev) => {
      const cur = prev[weaponId] || INITIAL_WEAPON_UPGRADES[weaponId];
      const { nextState, leveledUp } = addWeaponXpToState(cur, xpAmount);
      if (leveledUp) {
        soundFx.playLevelUp();
      }
      return {
        ...prev,
        [weaponId]: nextState,
      };
    });
  };

  const handleOperatorLevelUp = (newLevel: number) => {
    setOperatorLevel((prev) => {
      if (newLevel > prev) {
        const gainedSP = newLevel - prev;
        setSkillPoints((sp) => sp + gainedSP);
        return newLevel;
      }
      return prev;
    });
  };

  // Operator Skilltree Handlers
  const handleUpgradeSkillWithSP = (nodeId: string, costSP: number) => {
    const node = SKILL_TREE_NODES.find((n) => n.id === nodeId);
    if (!node) return;
    const currentLv = skillTree[nodeId] || 0;
    if (currentLv >= node.maxLevel) return;
    if (skillPoints < costSP) return;

    setSkillPoints((prev) => prev - costSP);
    setSpSpentCount((prev) => {
      const next = prev + costSP;
      localStorage.setItem('na_sp_spent', next.toString());
      return next;
    });
    setSkillTree((prev) => ({
      ...prev,
      [nodeId]: (prev[nodeId] || 0) + 1,
    }));
  };

  const handleUpgradeSkillWithNAT = (nodeId: string, costNAT: number) => {
    const node = SKILL_TREE_NODES.find((n) => n.id === nodeId);
    if (!node) return;
    const currentLv = skillTree[nodeId] || 0;
    if (currentLv >= node.maxLevel) return;
    if (budget < costNAT) return;

    setBudget((prev) => prev - costNAT);
    setSkillTree((prev) => ({
      ...prev,
      [nodeId]: (prev[nodeId] || 0) + 1,
    }));
  };

  const handleResetSkillTree = () => {
    const spent = getTotalSpentSkillPoints(skillTree);
    if (spent <= 0) return;
    const trackedSpSpent = Math.max(0, spSpentCount);
    const refund = Math.min(spent, trackedSpSpent);
    setSkillTree(INITIAL_SKILL_TREE);
    setSpSpentCount(0);
    localStorage.setItem('na_sp_spent', '0');
    if (refund > 0) {
      setSkillPoints((prev) => prev + refund);
    }
  };

  // Map Level Upgrade Handler (Lv. 1-10 -> stronger bots & higher NAT/XP rewards)
  const handleUpgradeMapLevel = (arenaId: string, costNAT: number) => {
    if (budget < costNAT) return;
    const curLv = mapLevels[arenaId] || 1;
    if (curLv >= MAX_MAP_LEVEL) return;
    setBudget((prev) => prev - costNAT);
    setMapLevels((prev) => ({
      ...prev,
      [arenaId]: Math.min(MAX_MAP_LEVEL, (prev[arenaId] || 1) + 1),
    }));
  };

  const handleLootAttachmentUpdate = (weaponId: string, newAtt: WeaponAttachments) => {
    setWeaponUpgrades((prev) => {
      const cur = prev[weaponId] || INITIAL_WEAPON_UPGRADES[weaponId];
      return {
        ...prev,
        [weaponId]: {
          ...cur,
          attachments: {
            ...cur.attachments,
            ...newAtt,
          },
        },
      };
    });
  };

  // Map Unlock Handler
  const handleUnlockMap = (arenaId: string, costNAT: number) => {
    if (budget < costNAT) return;
    setBudget((prev) => prev - costNAT);
    setUnlockedMaps((prev) => {
      const next = prev.includes(arenaId) ? prev : [...prev, arenaId];
      if (isOperatorRegistered) {
        submitScore({
          name: playerName,
          clanTag,
          score: 0,
          kills: 0,
          victory: false,
          city: playerCity,
          unlockedMapsCount: next.length,
          signatureWeapon: signatureWeaponName,
          currentArena: ARENAS[arenaId]?.name || arenaId,
          eventNotice: `hat das Einsatzgebiet „${ARENAS[arenaId]?.name || arenaId}“ freigeschaltet!`,
        }).catch(() => {});
      }
      return next;
    });
  };

  // Request Gemini Pro Commander analysis
  const requestCommanderOrders = async () => {
    try {
      setIsCommanderThinking(true);
      const activePerks = Object.values(facilities)
        .filter((f) => f.level > 0)
        .map((f) => f.name);

      const res = await fetch('/api/ai/commander', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          arena: currentArena,
          wave: totalWins + 1,
          playerHealth: 100,
          budget,
          currentPerks: activePerks,
        }),
      });

      const data = await res.json();
      if (data.commander) {
        if (data.commander.hessianCombatBark) {
          setLatestCommanderBark(data.commander.hessianCombatBark);
        }
        if (data.commander.wehrheimAgentsOrders) {
          setCommanderDirectives({
            flankers: data.commander.wehrheimAgentsOrders.flankers,
            snipers: data.commander.wehrheimAgentsOrders.snipers,
            shocktroopers: data.commander.wehrheimAgentsOrders.shocktroopers,
            bark: data.commander.hessianCombatBark,
          });
        }
        if (data.commander.tycoonCrisisEvent) {
          setCrisisEvent(data.commander.tycoonCrisisEvent);
        }
      }
    } catch (err) {
      console.error('Commander error:', err);
    } finally {
      setIsCommanderThinking(false);
    }
  };

  const handleUpgradeFacility = (facilityId: string, cost: number) => {
    if (budget >= cost) {
      setBudget((prev) => prev - cost);
      setFacilities((prev) => ({
        ...prev,
        [facilityId]: {
          ...prev[facilityId],
          level: prev[facilityId].level + 1,
        },
      }));
    }
  };

  const handleAcceptCrisis = () => {
    if (crisisEvent) {
      soundFx.playCoin();
      setBudget((prev) => prev + crisisEvent.budgetBonus);
      setCrisisEvent(null);
    }
  };

  const handleCollectTaler = (amount: number) => {
    setBudget((prev) => prev + amount);
    triggerMissionEvent({ type: 'taler', amount });
    setCareerStats((prev) => ({
      ...prev,
      totalTalerEarned: prev.totalTalerEarned + amount,
    }));
  };

  const handleEnemyEliminated = (details: {
    arenaId: string;
    role: AgentRole;
    isBoss: boolean;
    weaponId: string;
    wave: number;
    isCrit: boolean;
  }) => {
    triggerMissionEvent({
      type: 'kill',
      arenaId: details.arenaId,
      role: details.role,
      isBoss: details.isBoss,
      weaponId: details.weaponId,
      wave: details.wave,
    });
    setCareerStats((prev) => ({
      ...prev,
      totalKills: prev.totalKills + 1,
      bossesDefeated: details.isBoss ? prev.bossesDefeated + 1 : prev.bossesDefeated,
      highestWave: Math.max(prev.highestWave, details.wave),
    }));
  };

  const handleComboRecord = (combo: number) => {
    setCareerStats((prev) =>
      combo > prev.highestCombo ? { ...prev, highestCombo: combo } : prev
    );
  };

  const handleStreakAchieved = (streakCount: number) => {
    triggerMissionEvent({
      type: 'streak',
      streakCount,
    });
  };

  const handleWaveAdvanced = (wave: number) => {
    triggerMissionEvent({
      type: 'wave',
      wave,
    });
    setCareerStats((prev) =>
      wave > prev.highestWave ? { ...prev, highestWave: wave } : prev
    );
  };

  const handleClaimMission = (missionId: string) => {
    const res = claimDailyMission(dailyMissionsState, missionId);
    if (res) {
      soundFx.playRewardClaim();
      setDailyMissionsState(res.nextState);
      setBudget((prev) => prev + Math.round(res.rewardedNAT * 0.75));
      setReputation((prev) => prev + res.rewardedReputation);
      gainOperatorXp(65);
      if (completedMissionToast?.id === missionId) {
        setCompletedMissionToast(null);
      }
    }
  };

  const handleClaimGrandBonus = () => {
    const res = claimDailyGrandBonus(dailyMissionsState);
    if (res) {
      soundFx.playRewardClaim();
      setDailyMissionsState(res.nextState);
      setBudget((prev) => prev + 350);
      setReputation((prev) => prev + res.rewardedReputation);
      setSkillPoints((prev) => prev + 1);
      gainOperatorXp(160);
    }
  };

  const handleSimulatePatrol = (arenaId: string) => {
    const mapLv = mapLevels[arenaId] || 1;
    const botScaling = getMapBotScaling(arenaId, mapLv);
    const skillBonuses = computeSkillTreeBonuses(skillTree);

    // Generate 1-2 tactical enemy eliminations in the target arena
    const patrolKills = Math.floor(Math.random() * 2) + 1;
    const earnedNAT = Math.round(
      (16 + patrolKills * 7) * botScaling.natRewardMult * skillBonuses.talerBonusMultiplier
    );
    const earnedScore = patrolKills * 125;
    const earnedWeaponXp = Math.round(
      patrolKills * 18 * botScaling.xpRewardMult * skillBonuses.weaponXpMultiplier
    );

    setBudget((prev) => prev + earnedNAT);
    setLastMatchKills((prev) => prev + patrolKills);
    setLastMatchScore((prev) => prev + earnedScore);
    handleWeaponXpGain(selectedGunsmithWeapon, earnedWeaponXp);
    gainOperatorXp(25);

    for (let i = 0; i < patrolKills; i++) {
      triggerMissionEvent({
        type: 'kill',
        arenaId,
        role: i === 0 ? 'sniper' : 'flanker',
        isBoss: false,
        weaponId: selectedGunsmithWeapon,
        wave: 2,
      });
    }

    triggerMissionEvent({
      type: 'taler',
      amount: earnedNAT,
    });

    submitScore({
      name: playerName,
      clanTag,
      score: Math.min(24900, earnedScore),
      kills: Math.min(295, patrolKills),
      victory: false,
      city: playerCity,
      unlockedMapsCount: effectiveUnlockedMaps.length,
      signatureWeapon: signatureWeaponName,
      currentArena: ARENAS[arenaId]?.name || arenaId,
      eventNotice: `hat eine Bürgerwehr-Streife in „${ARENAS[arenaId]?.name || arenaId}“ gesichert (+${earnedNAT} NAT)!`,
    }).catch(() => {});
  };

  const handleMatchComplete = (
    victory: boolean,
    stats: { kills: number; score: number; wave: number }
  ) => {
    setLastMatchKills(stats.kills);
    setLastMatchScore(stats.score);

    const mapLv = mapLevels[currentArena] || 1;
    const botScaling = getMapBotScaling(currentArena, mapLv);
    const skillBonuses = computeSkillTreeBonuses(skillTree);

    const waveBonus = stats.wave * 4;
    const scoreBonus = Math.round(stats.score * 0.03);
    const winBonus = victory ? 32 : 10;
    const rawReward = Math.max(8, waveBonus + scoreBonus + winBonus);
    const reward = Math.round(
      rawReward * botScaling.natRewardMult * skillBonuses.talerBonusMultiplier
    );
    setLastMatchReward(reward);
    setBudget((prev) => prev + reward);
    setReputation((prev) => prev + (victory ? 65 : 25));
    setPassiveShiftEarned(0);
    localStorage.setItem('na_passive_shift_earned', '0');

    let nextWins = totalWins;
    const nextUnlocked = [...unlockedMaps];

    if (victory) {
      nextWins = totalWins + 1;
      setTotalWins(nextWins);
    }

    gainOperatorXp(
      victory
        ? 125 + stats.wave * 18 + stats.kills * 3
        : 40 + stats.wave * 8 + stats.kills * 1.5
    );

    const clampedScore = Math.min(24900, Math.max(0, Math.round(stats.score)));
    const clampedKills = Math.min(295, Math.max(0, Math.round(stats.kills)));
    const clampedWave = Math.min(50, Math.max(1, Math.round(stats.wave)));

    submitScore({
      name: playerName,
      clanTag,
      score: clampedScore,
      kills: clampedKills,
      wave: clampedWave,
      victory,
      city: playerCity,
      unlockedMapsCount: nextUnlocked.length,
      signatureWeapon: signatureWeaponName,
      currentArena: ARENAS[currentArena]?.name || currentArena,
    }).catch(console.error);

    if (activeRoom && localPlayerId) {
      updateMultiplayerState(
        activeRoom.code,
        localPlayerId,
        clampedKills,
        victory ? 100 : 0,
        clampedScore,
        clampedWave
      ).catch(console.error);
    }
  };

  const handleStartGameWithRoom = (room: MultiplayerRoom, playerId: string) => {
    setActiveRoom(room);
    setLocalPlayerId(playerId);
    setCurrentArena(room.arena || 'hessenpark');
    setActiveTab('battle');
  };

  const openTab = (tab: AppTab) => {
    setActiveTab(tab);
    setShowMobileCommandOverlay(false);
    if (showTutorial && !isTutorialMinimized) {
      setIsTutorialMinimized(true);
    }
  };

  const handleCompleteTutorialAndClaimReward = () => {
    if (!tutorialRewardClaimed) {
      soundFx.playRewardClaim();
      setBudget((prev) => prev + 250);
      setReputation((prev) => prev + 150);
      setSkillPoints((prev) => prev + 1);
      gainOperatorXp(80);
      setTutorialRewardClaimed(true);
      try {
        localStorage.setItem('na_tutorial_reward_claimed', 'true');
      } catch {}
    }
    setShowTutorial(false);
    setIsTutorialMinimized(false);
  };

  // Return from a running/finished match (pause menu or end screen) to the integrated main menu.
  const handleExitToMenu = () => {
    if (document.pointerLockElement) {
      document.exitPointerLock?.();
    }
    setActiveRoom(null);
    setLocalPlayerId(null);
    setMatchState('inactive');
    openTab('home');
  };

  const facilityLevels = Object.fromEntries(
    Object.entries(facilities).map(([k, v]) => [k, v.level])
  );

  const unclaimedMissionsCount = dailyMissionsState.missions.filter(
    (m) => m.completed && !m.claimed
  ).length;
  const completedMissionsCount = dailyMissionsState.missions.filter(
    (m) => m.completed
  ).length;

  // Hard Mobile & Landscape ("Handy Querformat") Lock:
  // If on mobile hardware, ALWAYS use Mobile Tactical Hub and never render the 3D Battle Royale canvas.
  const effectiveMobileMode = isMobileMode || isMobileHardware;

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-center text-slate-300">
        <p role="status" className="font-mono text-xs uppercase tracking-widest">Sitzung wird geprüft ...</p>
      </main>
    );
  }

  if (!authUser) {
    return (
      <>
        {sessionSupersededNotice && (
          <div
            role="alert"
            className="fixed top-4 left-1/2 z-50 -translate-x-1/2 w-11/12 max-w-md rounded-2xl border border-amber-500/50 bg-amber-950/95 p-4 text-xs text-amber-100 shadow-2xl flex items-start gap-3 backdrop-blur-md"
          >
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-amber-300">Sitzung auf diesem Gerät beendet</div>
              <div className="text-amber-200/90 mt-0.5">{sessionSupersededNotice}</div>
            </div>
            <button
              onClick={() => setSessionSupersededNotice(null)}
              className="text-amber-400 hover:text-white text-xs font-mono font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
        <AuthScreen
          onAuthenticated={handleAuthenticated}
          onOpenLegal={() => setShowLegalModal(true)}
        />
        <LegalModal
          isOpen={showLegalModal}
          onClose={() => setShowLegalModal(false)}
        />
        {authError && (
          <div role="alert" className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-red-500/40 bg-red-950/90 px-4 py-3 text-xs text-red-100 shadow-xl">
            {authError}
          </div>
        )}
      </>
    );
  }

  const renderSharedModals = () => (
    <>
      {/* Operator Username / Callsign Onboarding Modal on First Launch or Profile Edit */}
      {showProfileModal && (
        <OperatorOnboardingModal
          initialName={playerName}
          initialClanTag={clanTag}
          initialCity={playerCity}
          isFirstTime={!isOperatorRegistered}
          authProvider={authUser.authProvider}
          userEmail={authUser.email}
          onComplete={handleCompleteOnboarding}
          onAccountLinked={(linkedUser) => {
            handleAuthenticated(linkedUser);
          }}
          onOpenClanHub={() => {
            setShowProfileModal(false);
            openTab('clan');
          }}
          onOpenLegal={() => setShowLegalModal(true)}
          onClose={isOperatorRegistered ? () => setShowProfileModal(false) : undefined}
          onLogout={handleLogout}
        />
      )}

      {/* Comprehensive 8-Chapter First-Time Registration & Bootcamp Tutorial Modal */}
      <TutorialModal
        isOpen={showTutorial}
        isMinimized={isTutorialMinimized}
        playerName={playerName}
        rewardClaimed={tutorialRewardClaimed}
        onMinimizeToggle={(minimized) => setIsTutorialMinimized(minimized)}
        onClose={() => {
          setShowTutorial(false);
          setIsTutorialMinimized(false);
        }}
        onCompleteAndClaimReward={handleCompleteTutorialAndClaimReward}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          setShowMobileCommandOverlay(false);
          setIsTutorialMinimized(true);
        }}
        onOpenProfileModal={() => {
          setIsTutorialMinimized(true);
          setShowProfileModal(true);
        }}
      />

      {/* Legal & Privacy Transparency Modal */}
      <LegalModal
        isOpen={showLegalModal}
        onClose={() => setShowLegalModal(false)}
      />

      {/* Daily Missions & Operator Reputation Modal */}
      <DailyMissionsModal
        isOpen={showDailyMissionsModal}
        onClose={() => setShowDailyMissionsModal(false)}
        missionsState={dailyMissionsState}
        reputation={reputation}
        onClaimMission={handleClaimMission}
        onClaimGrandBonus={handleClaimGrandBonus}
        onSelectArenaAndPlay={(arenaId) => {
          setCurrentArena(arenaId);
          setActiveTab('battle');
        }}
      />

      {/* In-Game Daily Mission Completed Toast Overlay */}
      {completedMissionToast && (
        <div
          onClick={() => {
            setShowDailyMissionsModal(true);
            setCompletedMissionToast(null);
          }}
          className="fixed top-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 p-3.5 sm:px-5 rounded-2xl bg-slate-950/95 border-2 border-amber-500 shadow-2xl text-slate-100 cursor-pointer animate-in slide-in-from-top-4 duration-300"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 text-sm">
            🎯
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-black text-amber-400 uppercase tracking-wider">
                TAGESBEFEHL ERFÜLLT!
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                +{completedMissionToast.rewardNAT} NAT · +{completedMissionToast.rewardReputation} RUF
              </span>
            </div>
            <div className="text-xs font-bold text-white truncate max-w-xs sm:max-w-md">
              {completedMissionToast.description}
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClaimMission(completedMissionToast.id);
            }}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] uppercase tracking-wider shrink-0 transition-transform active:scale-95 cursor-pointer"
          >
            Einfordern
          </button>
        </div>
      )}
    </>
  );

  // --- 1. SMARTPHONE / MOBILE DEVICE EXPERIENCE (PR #18 Redesign) ---
  if (effectiveMobileMode) {
    return (
      <MobileAppShell>
        {renderSharedModals()}
      {/* Sleek Native Mobile Header */}
      <MobileHeader
        playerName={playerName}
        clanTag={clanTag}
        operatorLevel={operatorLevel}
        budget={budget}
        reputation={reputation}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        unclaimedMissionsCount={unclaimedMissionsCount}
        completedMissionsCount={completedMissionsCount}
        totalMissionsCount={dailyMissionsState.missions.length}
        onRequestCommander={requestCommanderOrders}
        isCommanderThinking={isCommanderThinking}
        isMobileHardware={isMobileHardware}
        onSwitchToPcMode={() => handleSetMobileMode(false)}
        onOpenProfileModal={() => setShowProfileModal(true)}
        onOpenDailyMissions={() => setShowDailyMissionsModal(true)}
        onOpenLegalModal={() => setShowLegalModal(true)}
        onLogout={handleLogout}
      />

      {/* Main Scrollable View Router */}
      <main className="flex-1 w-full relative overflow-y-auto overflow-x-hidden select-none">
        {activeTab === 'home' && (
          <MobileHomeView
            playerName={playerName}
            clanTag={clanTag}
            playerCity={playerCity}
            operatorLevel={operatorLevel}
            reputation={reputation}
            budget={budget}
            totalWins={totalWins}
            careerStats={careerStats}
            skillPoints={skillPoints}
            selectedGunsmithWeapon={selectedGunsmithWeapon}
            weaponUpgrades={weaponUpgrades}
            currentArena={currentArena}
            unlockedMaps={effectiveUnlockedMaps}
            mapLevels={mapLevels}
            dailyMissionsState={dailyMissionsState}
            canClaimDailyLogin={canClaimDailyLogin}
            onNavigateTab={openTab}
            onOpenProfileModal={() => setShowProfileModal(true)}
            onOpenDailyMissionsModal={() => setShowDailyMissionsModal(true)}
            onClaimDailyMission={handleClaimMission}
            onClaimDailyGrandBonus={handleClaimGrandBonus}
            onClaimDailyLoginBonus={handleClaimDailyLoginBonus}
            onStartBattle={(arenaId) => {
              if (arenaId) setCurrentArena(arenaId);
              openTab('battle');
            }}
            onSimulatePatrol={handleSimulatePatrol}
            onOpenTutorial={() => {
              setShowTutorial(true);
              setIsTutorialMinimized(false);
            }}
          />
        )}

        {activeTab === 'battle' && (
          <MobileTacticalHub
            budget={budget}
            reputation={reputation}
            playerName={playerName}
            clanTag={clanTag}
            totalIncomePerSec={totalIncomePerSec}
            totalWins={totalWins}
            unlockedMaps={effectiveUnlockedMaps}
            dailyMissionsState={dailyMissionsState}
            onOpenDailyMissions={() => setShowDailyMissionsModal(true)}
            onClaimDailyMission={handleClaimMission}
            onNavigateTab={openTab}
            onSimulatePatrol={handleSimulatePatrol}
            skillPoints={skillPoints}
            isMobileHardware={isMobileHardware}
            onSwitchToPcMode={() => handleSetMobileMode(false)}
          />
        )}

        {activeTab === 'gunsmith' && (
          <GunsmithView
            budget={budget}
            weaponUpgrades={weaponUpgrades}
            activeWeaponId={selectedGunsmithWeapon}
            onSelectWeapon={(wId) => setSelectedGunsmithWeapon(wId)}
            onUpgradeAttachment={handleUpgradeAttachment}
            onUpgradeRarity={handleUpgradeRarity}
            onUpgradePackAPunch={handleUpgradePackAPunch}
            onTrainWeaponLevel={handleTrainWeaponLevel}
            onSelectWeaponMastery={handleSelectWeaponMastery}
            onClose={() => openTab('home')}
          />
        )}

        {activeTab === 'skilltree' && (
          <SkillTreeView
            budget={budget}
            skillPoints={skillPoints}
            skillTree={skillTree}
            operatorLevel={operatorLevel}
            operatorXp={operatorXp}
            onUpgradeSkillWithSP={handleUpgradeSkillWithSP}
            onUpgradeSkillWithNAT={handleUpgradeSkillWithNAT}
            onResetSkillTree={handleResetSkillTree}
            onClose={() => openTab('home')}
          />
        )}

        {activeTab === 'hub' && (
          <MobileHubDrawer
            playerName={playerName}
            clanTag={clanTag}
            operatorLevel={operatorLevel}
            budget={budget}
            reputation={reputation}
            totalIncomePerSec={totalIncomePerSec}
            totalWins={totalWins}
            onNavigateTab={openTab}
            onOpenProfileModal={() => setShowProfileModal(true)}
            onOpenDailyMissions={() => setShowDailyMissionsModal(true)}
            onOpenLegalModal={() => setShowLegalModal(true)}
            onLogout={handleLogout}
          />
        )}

        {activeTab === 'clan' && (
          <div className="p-2 pb-24 space-y-3">
            <div className="flex items-center justify-between px-2 pt-1">
              <button
                type="button"
                onClick={() => openTab('hub')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs font-mono text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                ← Zurück zum Hub
              </button>
            </div>
            <ClanHub
              playerName={playerName}
              operatorLevel={operatorLevel}
              budget={budget}
              reputation={reputation}
              highestWave={careerStats.highestWave || 1}
              playerScore={lastMatchScore}
              onClanTagChange={(tag) => {
                setClanTag(tag);
                localStorage.setItem('na_clan_tag', tag);
              }}
              onSpendNAT={(amount) => {
                setBudget((prev) => Math.max(0, prev - amount));
              }}
              onEarnRewards={(rewards) => {
                if (rewards.nat) setBudget((prev) => prev + rewards.nat!);
                if (rewards.reputation) setReputation((prev) => prev + rewards.reputation!);
                if (rewards.skillPoints) setSkillPoints((prev) => prev + rewards.skillPoints!);
              }}
            />
          </div>
        )}

        {activeTab === 'tycoon' && (
          <div className="p-2 pb-24 space-y-3">
            <div className="flex items-center justify-between px-2 pt-1">
              <button
                type="button"
                onClick={() => openTab('hub')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs font-mono text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                ← Zurück zum Hub
              </button>
            </div>
            <TycoonHub
              budget={budget}
              onUpgradeFacility={handleUpgradeFacility}
              facilities={facilities}
              totalWins={totalWins}
              unlockedMaps={effectiveUnlockedMaps}
              onUnlockMap={handleUnlockMap}
              totalIncomePerSec={totalIncomePerSec}
              passiveShiftEarned={passiveShiftEarned}
              passiveShiftCap={getPassiveShiftVaultCap(facilities)}
              commanderCrisisEvent={crisisEvent}
              onAcceptCrisisEvent={handleAcceptCrisis}
              onStartArena={(arenaId) => {
                setCurrentArena(arenaId);
                openTab('battle');
              }}
              mapLevels={mapLevels}
              onUpgradeMapLevel={handleUpgradeMapLevel}
              isMobileHardware={true}
            />
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="p-2 pb-24 space-y-3">
            <div className="flex items-center justify-between px-2 pt-1">
              <button
                type="button"
                onClick={() => openTab('hub')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs font-mono text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                ← Zurück zum Hub
              </button>
            </div>
            <LeaderboardView
              currentScore={lastMatchScore}
              currentKills={lastMatchKills}
              playerName={playerName}
              clanTag={clanTag}
              playerCity={playerCity}
              unlockedMapsCount={effectiveUnlockedMaps.length}
              signatureWeapon={signatureWeaponName}
              currentArenaName={ARENAS[currentArena]?.name || currentArena}
              onEditProfile={() => setShowProfileModal(true)}
            />
          </div>
        )}

        {activeTab === 'multiplayer' && (
          <div className="p-2 pb-24 space-y-3">
            <div className="flex items-center justify-between px-2 pt-1">
              <button
                type="button"
                onClick={() => openTab('hub')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs font-mono text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                ← Zurück zum Hub
              </button>
            </div>
            <MultiplayerLobby
              onStartGameWithRoom={handleStartGameWithRoom}
              playerName={playerName}
              clanTag={clanTag}
              onOpenProfileModal={() => setShowProfileModal(true)}
              onOpenLeaderboard={() => openTab('leaderboard')}
              totalWins={totalWins}
              unlockedMaps={effectiveUnlockedMaps}
            />
          </div>
        )}
      </main>

      {/* Sleek 5-Tab Mobile Dock Bar */}
      <MobileDock
        activeTab={activeTab}
        onSelectTab={(tab) => openTab(tab)}
        skillPoints={skillPoints}
        unclaimedMissionsCount={unclaimedMissionsCount}
      />
    </MobileAppShell>
    );
  }

  // --- 2. PC / DESKTOP EXPERIENCE (Full Width HUD, 3D Battle Royale, Rich Menus) ---
  return (
    <div className={`flex flex-col w-full bg-slate-950 font-sans text-slate-100 overflow-x-hidden ${
      activeTab === 'battle' ? 'h-screen overflow-hidden' : 'min-h-screen'
    }`}>
      {renderSharedModals()}
      {activeTab !== 'battle' && (
        <TopBar
          activeTab={activeTab === 'hub' ? 'home' : activeTab}
          setActiveTab={openTab}
          budget={budget}
          reputation={reputation}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
          onRequestCommander={requestCommanderOrders}
          isCommanderThinking={isCommanderThinking}
          isMobileMode={effectiveMobileMode}
          setIsMobileMode={handleSetMobileMode}
          isMobileHardware={isMobileHardware}
          skillPoints={skillPoints}
          playerName={playerName}
          clanTag={clanTag}
          onOpenHome={() => openTab('home')}
          onOpenProfileModal={() => setShowProfileModal(true)}
          onOpenLegalModal={() => setShowLegalModal(true)}
          onOpenDailyMissions={() => setShowDailyMissionsModal(true)}
          onLogout={handleLogout}
          unclaimedMissionsCount={unclaimedMissionsCount}
          completedMissionsCount={completedMissionsCount}
          totalMissionsCount={dailyMissionsState.missions.length}
          navigationDisabled={false}
        />
      )}

      {/* Main View Router - the match is viewport-locked; menu surfaces retain scrolling. */}
      <main className={`flex-1 w-full relative ${
        activeTab !== 'battle' ? 'overflow-y-auto' : 'overflow-hidden'
      }`}>
        {/* Integrated main menu (former start page) - reachable via TopBar, pause menu & end screen */}
        {(activeTab === 'home' || activeTab === 'hub') && (
          <HomeDashboard
            playerName={playerName}
            clanTag={clanTag}
            playerCity={playerCity}
            operatorLevel={operatorLevel}
            reputation={reputation}
            budget={budget}
            totalWins={totalWins}
            careerStats={careerStats}
            skillPoints={skillPoints}
            selectedGunsmithWeapon={selectedGunsmithWeapon}
            weaponUpgrades={weaponUpgrades}
            currentArena={currentArena}
            unlockedMaps={effectiveUnlockedMaps}
            mapLevels={mapLevels}
            dailyMissionsState={dailyMissionsState}
            effectiveMobileMode={effectiveMobileMode}
            canClaimDailyLogin={canClaimDailyLogin}
            onStartBattle={(arenaId) => {
              if (arenaId) setCurrentArena(arenaId);
              setActiveTab('battle');
            }}
            onSelectArena={(arenaId) => setCurrentArena(arenaId)}
            onOpenTab={openTab}
            onOpenProfileModal={() => setShowProfileModal(true)}
            onOpenDailyMissionsModal={() => setShowDailyMissionsModal(true)}
            onClaimDailyMission={handleClaimMission}
            onClaimDailyGrandBonus={handleClaimGrandBonus}
            onClaimAchievement={handleClaimAchievement}
            onClaimDailyLoginBonus={handleClaimDailyLoginBonus}
            onUnlockMap={handleUnlockMap}
            onOpenTutorial={() => {
              setShowTutorial(true);
              setIsTutorialMinimized(false);
            }}
          />
        )}

        {activeTab === 'battle' && (
            <ThreeCanvas
              currentArena={currentArena}
              onChangeArena={(arenaId) => setCurrentArena(arenaId)}
              onMatchComplete={handleMatchComplete}
              onMatchStateChange={setMatchState}
              isMultiplayerMatch={activeRoom !== null}
              matchReward={lastMatchReward}
              unlockedFacilities={facilityLevels}
              latestCommanderBark={latestCommanderBark}
              commanderDirectives={commanderDirectives}
              isMobileMode={isMobileMode}
              onCollectTaler={handleCollectTaler}
              onOpenTycoon={() => openTab('tycoon')}
              onOpenLeaderboard={() => openTab('leaderboard')}
              weaponUpgrades={weaponUpgrades}
              onLootAttachmentUpdate={handleLootAttachmentUpdate}
              totalWins={totalWins}
              unlockedMaps={effectiveUnlockedMaps}
              budget={budget}
              onUnlockMap={handleUnlockMap}
              playerName={playerName}
              clanTag={clanTag}
              dailyMissionsState={dailyMissionsState}
              onEnemyEliminated={handleEnemyEliminated}
              onStreakAchieved={handleStreakAchieved}
              onWaveAdvanced={handleWaveAdvanced}
              onOpenDailyMissions={() => setShowDailyMissionsModal(true)}
              skillTree={skillTree}
              mapLevels={mapLevels}
              onWeaponXpGain={handleWeaponXpGain}
              onOperatorLevelUp={handleOperatorLevelUp}
              onExitToMenu={handleExitToMenu}
            />
        )}

        {activeTab === 'gunsmith' && (
          <GunsmithView
            budget={budget}
            weaponUpgrades={weaponUpgrades}
            activeWeaponId={selectedGunsmithWeapon}
            onSelectWeapon={(wId) => setSelectedGunsmithWeapon(wId)}
            onUpgradeAttachment={handleUpgradeAttachment}
            onUpgradeRarity={handleUpgradeRarity}
            onUpgradePackAPunch={handleUpgradePackAPunch}
            onTrainWeaponLevel={handleTrainWeaponLevel}
            onSelectWeaponMastery={handleSelectWeaponMastery}
            onClose={() => openTab('home')}
          />
        )}

        {activeTab === 'skilltree' && (
          <SkillTreeView
            budget={budget}
            skillPoints={skillPoints}
            skillTree={skillTree}
            operatorLevel={operatorLevel}
            operatorXp={operatorXp}
            onUpgradeSkillWithSP={handleUpgradeSkillWithSP}
            onUpgradeSkillWithNAT={handleUpgradeSkillWithNAT}
            onResetSkillTree={handleResetSkillTree}
            onClose={() => openTab('home')}
          />
        )}

        {activeTab === 'tycoon' && (
          <TycoonHub
            budget={budget}
            onUpgradeFacility={handleUpgradeFacility}
            facilities={facilities}
            totalWins={totalWins}
            unlockedMaps={effectiveUnlockedMaps}
            onUnlockMap={handleUnlockMap}
            totalIncomePerSec={totalIncomePerSec}
            passiveShiftEarned={passiveShiftEarned}
            passiveShiftCap={getPassiveShiftVaultCap(facilities)}
            commanderCrisisEvent={crisisEvent}
            onAcceptCrisisEvent={handleAcceptCrisis}
            onStartArena={(arenaId) => {
              setCurrentArena(arenaId);
              setActiveTab('battle');
              setShowMobileCommandOverlay(false);
            }}
            mapLevels={mapLevels}
            onUpgradeMapLevel={handleUpgradeMapLevel}
            isMobileHardware={isMobileHardware}
          />
        )}

        {activeTab === 'multiplayer' && (
          <MultiplayerLobby
            onStartGameWithRoom={handleStartGameWithRoom}
            playerName={playerName}
            clanTag={clanTag}
            onOpenProfileModal={() => setShowProfileModal(true)}
            onOpenLeaderboard={() => setActiveTab('leaderboard')}
            totalWins={totalWins}
            unlockedMaps={effectiveUnlockedMaps}
          />
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardView
            currentScore={lastMatchScore}
            currentKills={lastMatchKills}
            playerName={playerName}
            clanTag={clanTag}
            playerCity={playerCity}
            unlockedMapsCount={effectiveUnlockedMaps.length}
            signatureWeapon={signatureWeaponName}
            currentArenaName={ARENAS[currentArena]?.name || currentArena}
            onEditProfile={() => setShowProfileModal(true)}
          />
        )}

        {activeTab === 'clan' && (
          <ClanHub
            playerName={playerName}
            operatorLevel={operatorLevel}
            budget={budget}
            reputation={reputation}
            highestWave={careerStats.highestWave || 1}
            playerScore={lastMatchScore}
            onClanTagChange={(tag) => {
              setClanTag(tag);
              localStorage.setItem('na_clan_tag', tag);
            }}
            onSpendNAT={(amount) => {
              setBudget((prev) => Math.max(0, prev - amount));
            }}
            onEarnRewards={(rewards) => {
              if (rewards.nat) setBudget((prev) => prev + rewards.nat!);
              if (rewards.reputation) setReputation((prev) => prev + rewards.reputation!);
              if (rewards.skillPoints) setSkillPoints((prev) => prev + rewards.skillPoints!);
            }}
          />
        )}
      </main>
    </div>
  );
}
