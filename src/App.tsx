import React, { useState, useEffect } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { AuthUser, AuthRequestError, getCurrentUser, logout } from './auth';
import { TopBar, AppTab } from './components/TopBar';
import { ThreeCanvas } from './components/ThreeCanvas';
import { TycoonHub } from './components/TycoonHub';
import { MultiplayerLobby } from './components/MultiplayerLobby';
import { LeaderboardView } from './components/LeaderboardView';
import { GunsmithView } from './components/GunsmithView';
import { OperatorOnboardingModal } from './components/OperatorOnboardingModal';
import { LegalModal } from './components/LegalModal';
import { DailyMissionsModal } from './components/DailyMissionsModal';
import { MobileTacticalHub } from './components/MobileTacticalHub';
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
import { INITIAL_FACILITIES, Facility } from './game/tycoon';
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
} from './game/weapons';
import { ARENAS, ARENA_UNLOCK_RULES, checkArenaUnlocked } from './game/three/arenas';
import { AllWeaponsUpgrades, AttachmentType, WeaponAttachments } from './types';
import { soundFx } from './audio/soundFx';
import { LegalConsentRecord } from './legal';

export default function App() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [sessionSupersededNotice, setSessionSupersededNotice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('battle');
  const [showHome, setShowHome] = useState(true);
  const [showMobileCommandOverlay, setShowMobileCommandOverlay] = useState(false);
  const [currentArena, setCurrentArena] = useState<string>('hessenpark');

  // Auto-detect mobile device/screen, or allow switching anytime in the TopBar
  const [isMobileMode, setIsMobileMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 820 || ('ontouchstart' in window && navigator.maxTouchPoints > 0);
    }
    return false;
  });

  // Operator Profile & Onboarding State ("Am anfang soll man sich mit einen Benutzernamen geben")
  const [isOperatorRegistered, setIsOperatorRegistered] = useState<boolean>(() => {
    return localStorage.getItem('na_operator_registered') === 'true';
  });
  const [showProfileModal, setShowProfileModal] = useState<boolean>(() => {
    return localStorage.getItem('na_operator_registered') !== 'true';
  });
  const [showLegalModal, setShowLegalModal] = useState<boolean>(false);
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
    return localStorage.getItem('na_clan_tag') || '61267';
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
    return saved ? parseInt(saved, 10) : 450;
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

  // CoD: Black Ops Cold War Weapon Upgrades State (5-Slot Gunsmith, Rarity Tiers I-V, Pack-a-Punch I-III)
  const [weaponUpgrades, setWeaponUpgrades] = useState<AllWeaponsUpgrades>(() => {
    try {
      const saved = localStorage.getItem('na_weapon_upgrades');
      if (saved) {
        return { ...INITIAL_WEAPON_UPGRADES, ...JSON.parse(saved) };
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

  useEffect(() => {
    let active = true;
    getCurrentUser()
      .then((user) => {
        if (active) {
          setAuthUser(user);
          if (user) {
            const profileClanTag = user.clanTag || '61267';
            const profileCity = user.faction === 'wehrheim' ? 'Wehrheim' : 'Neu-Anspach';
            setClanTag(profileClanTag);
            setPlayerCity(profileCity);
            setIsOperatorRegistered(true);
            setShowProfileModal(false);
            localStorage.setItem('na_clan_tag', profileClanTag);
            localStorage.setItem('na_player_city', profileCity);
            localStorage.setItem('na_operator_registered', 'true');
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
      const profileClanTag = user.clanTag || clanTag || '61267';
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
      registerOperatorProfile({
        name: cleanName,
        clanTag: profileClanTag,
        city: profileCity,
      }).catch(() => {});
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

  // Passive Income Timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (totalIncomePerSec > 0) {
        setBudget((prev) => {
          const next = prev + totalIncomePerSec;
          localStorage.setItem('na_budget', next.toString());
          return next;
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [totalIncomePerSec]);

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
    saveCareerStats(careerStats);
  }, [careerStats]);

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

  const todayDateStr = new Date().toISOString().slice(0, 10);
  const canClaimDailyLogin = careerStats.lastLoginDate !== todayDateStr;

  const handleClaimDailyLoginBonus = () => {
    if (!canClaimDailyLogin) return;
    const nextStreak = careerStats.loginStreakDays + 1;
    const rewardNAT = 75 + Math.min(150, nextStreak * 25);
    const rewardRep = 40;
    soundFx.playRewardClaim();
    setBudget((prev) => prev + rewardNAT);
    setReputation((prev) => prev + rewardRep);
    setCareerStats((prev) => ({
      ...prev,
      loginStreakDays: nextStreak,
      lastLoginDate: todayDateStr,
      totalTalerEarned: prev.totalTalerEarned + rewardNAT,
    }));
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

  // CoD Cold War Gunsmith Handlers
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
      setBudget((prev) => prev + res.rewardedNAT);
      setReputation((prev) => prev + res.rewardedReputation);
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
      setBudget((prev) => prev + res.rewardedNAT);
      setReputation((prev) => prev + res.rewardedReputation);
    }
  };

  const handleSimulatePatrol = (arenaId: string) => {
    const patrolKills = Math.floor(Math.random() * 3) + 2;
    const earnedNAT = 45 + patrolKills * 12;
    const earnedScore = patrolKills * 125;

    setBudget((prev) => prev + earnedNAT);
    setLastMatchKills((prev) => prev + patrolKills);
    setLastMatchScore((prev) => prev + earnedScore);
    setCareerStats((prev) => ({
      ...prev,
      totalKills: prev.totalKills + patrolKills,
      totalTalerEarned: prev.totalTalerEarned + earnedNAT,
    }));

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

    const waveBonus = stats.wave * 6;
    const scoreBonus = Math.round(stats.score * 0.06);
    const winBonus = victory ? 45 : 12;
    const reward = Math.max(8, waveBonus + scoreBonus + winBonus);
    setLastMatchReward(reward);
    setBudget((prev) => prev + reward);
    setReputation((prev) => prev + (victory ? 65 : 25));

    let nextWins = totalWins;
    let nextUnlocked = [...unlockedMaps];

    if (victory) {
      nextWins = totalWins + 1;
      setTotalWins(nextWins);

      Object.values(ARENA_UNLOCK_RULES).forEach((rule) => {
        if (nextWins >= rule.requiredWins && !nextUnlocked.includes(rule.id)) {
          nextUnlocked.push(rule.id);
        }
      });
      setUnlockedMaps(nextUnlocked);
    }

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
    setShowHome(false);
  };

  const openTab = (tab: AppTab) => {
    if (matchState === 'active' || matchState === 'paused') {
      return;
    }
    setActiveTab(tab);
    setShowHome(false);
    setShowMobileCommandOverlay(false);
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

  const currentRankObj = getReputationRank(reputation);
  const primaryWeaponDps = Math.round(primaryWeaponStats.damage * primaryWeaponStats.fireRate);

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
        <AuthScreen onAuthenticated={handleAuthenticated} />
        {authError && (
          <div role="alert" className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-red-500/40 bg-red-950/90 px-4 py-3 text-xs text-red-100 shadow-xl">
            {authError}
          </div>
        )}
      </>
    );
  }

  return (
    <div
      className={`flex flex-col w-full bg-slate-950 font-sans text-slate-100 overflow-x-hidden ${
        !showHome && activeTab === 'battle' && !showMobileCommandOverlay
          ? 'h-screen overflow-hidden'
          : 'min-h-screen'
      }`}
    >
      {/* Operator Username / Callsign Onboarding Modal on First Launch or Profile Edit */}
      {showProfileModal && (
        <OperatorOnboardingModal
          initialName={playerName}
          initialClanTag={clanTag}
          initialCity={playerCity}
          isFirstTime={!isOperatorRegistered}
          onComplete={handleCompleteOnboarding}
          onOpenLegal={() => setShowLegalModal(true)}
          onClose={isOperatorRegistered ? () => setShowProfileModal(false) : undefined}
          onLogout={handleLogout}
        />
      )}

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
          setShowHome(false);
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

      {!showHome && (activeTab !== 'battle' || isMobileMode) && (
        <TopBar
          activeTab={activeTab}
          setActiveTab={openTab}
          budget={budget}
          reputation={reputation}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
          onRequestCommander={requestCommanderOrders}
          isCommanderThinking={isCommanderThinking}
          isMobileMode={isMobileMode}
          setIsMobileMode={setIsMobileMode}
          playerName={playerName}
          clanTag={clanTag}
          onOpenHome={() => setShowHome(true)}
          onOpenProfileModal={() => setShowProfileModal(true)}
          onOpenLegalModal={() => setShowLegalModal(true)}
          onOpenDailyMissions={() => setShowDailyMissionsModal(true)}
          onLogout={handleLogout}
          unclaimedMissionsCount={unclaimedMissionsCount}
          completedMissionsCount={completedMissionsCount}
          totalMissionsCount={dailyMissionsState.missions.length}
          navigationDisabled={matchState === 'active' || matchState === 'paused'}
        />
      )}

      {/* Main View Router */}
      <main
        className={`flex-1 w-full relative ${
          showHome || activeTab !== 'battle' || showMobileCommandOverlay
            ? 'overflow-y-auto'
            : 'overflow-hidden'
        }`}
      >
        {showHome && (
          <section className="relative isolate min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_right,_rgba(245,158,11,0.22),_transparent_40%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.14),_transparent_35%),linear-gradient(135deg,_#020617_0%,_#0f172a_55%,_#111827_100%)] px-4 py-8 sm:px-8 lg:px-14">
            <div className="mx-auto max-w-7xl space-y-8">
              {/* TOP COMMAND CENTER HEADER BAR */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-slate-950/75 p-4 sm:px-6 backdrop-blur-md shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 font-mono text-sm font-black text-slate-950 shadow-lg">
                    {clanTag}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-black uppercase tracking-widest text-amber-400">
                        SAISON 1 · OPERATION TAUNUS-STURM
                      </span>
                      <span className="rounded-md bg-purple-500/20 border border-purple-400/40 px-2 py-0.5 font-mono text-[10px] font-bold text-purple-300">
                        Rang {currentRankObj.rank}: {currentRankObj.title}
                      </span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                      <span>{playerName}</span>
                      <span className="text-xs font-mono font-normal text-slate-400">({playerCity})</span>
                    </h2>
                  </div>
                </div>

                {/* Live Economy, Streak & Quick Actions */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {canClaimDailyLogin ? (
                    <button
                      type="button"
                      onClick={handleClaimDailyLoginBonus}
                      className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 px-3.5 py-2 text-xs font-black text-slate-950 shadow-lg shadow-emerald-500/20 hover:scale-105 transition-transform cursor-pointer animate-pulse"
                    >
                      <Gift className="h-4 w-4" />
                      <span>Tages-Bonus holen (+{75 + Math.min(150, (careerStats.loginStreakDays + 1) * 25)} NAT)</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 rounded-2xl border border-emerald-500/30 bg-emerald-950/30 px-3 py-1.5 font-mono text-xs text-emerald-300">
                      <Flame className="h-3.5 w-3.5 text-amber-400" />
                      <span>Serie: {careerStats.loginStreakDays}T</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 rounded-2xl border border-amber-500/40 bg-slate-900/90 px-3.5 py-2 font-mono text-xs font-black text-amber-400">
                    <Coins className="h-4 w-4" />
                    <span>{budget.toLocaleString('de-DE')} NAT</span>
                    <span className="text-[10px] text-emerald-400 font-bold">(+{totalIncomePerSec}/s)</span>
                  </div>

                  <div className="flex items-center gap-1.5 rounded-2xl border border-purple-500/40 bg-slate-900/90 px-3.5 py-2 font-mono text-xs font-black text-purple-300">
                    <Award className="h-4 w-4 text-purple-400" />
                    <span>{reputation} RUF</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowDailyMissionsModal(true)}
                    className="flex items-center gap-1.5 rounded-2xl border border-white/15 bg-slate-900 hover:bg-slate-800 px-3.5 py-2 font-mono text-xs font-bold text-white cursor-pointer"
                  >
                    <Target className="h-4 w-4 text-amber-400" />
                    <span>Tagesbefehle ({completedMissionsCount}/{dailyMissionsState.missions.length})</span>
                  </button>
                </div>
              </div>

              {/* HERO DEPLOYMENT & OPERATOR SHOWCASE GRID */}
              <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3.5 py-1 font-mono text-xs font-bold uppercase tracking-[0.25em] text-amber-300">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>61267 · Neu-Anspach · PC & Mobile 3D Crossplay</span>
                  </div>

                  <h1 className="max-w-3xl text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl leading-[1.05]">
                    Hessenpark
                    <span className="block bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300 bg-clip-text text-transparent">
                      Battle Royale
                    </span>
                  </h1>

                  <p className="max-w-2xl text-sm sm:text-base leading-relaxed text-slate-300">
                    Dein taktischer Einsatz im Hochtaunus: Verteidige 7 reale Neu-Anspacher Einsatzgebiete mit
                    aktiven Operator-Fähigkeiten (<span className="text-amber-300 font-mono font-bold">[Q] Bembel-Nova</span>,{' '}
                    <span className="text-cyan-300 font-mono font-bold">[E] Taktik-Dash</span>,{' '}
                    <span className="text-red-300 font-mono font-bold">[F] Feldberg-Luftschlag</span>),
                    Roguelite-Feld-Upgrades und dem Saison-1 Taunus-Ehrenpass!
                  </p>

                  {/* QUICK ARENA SELECTOR CHIPS */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                      <span className="uppercase tracking-wider font-bold text-amber-400">
                        Aktives Einsatzgebiet wählen ({effectiveUnlockedMaps.length}/7 freigeschaltet):
                      </span>
                      <span className="text-emerald-400 font-bold">{ARENAS[currentArena]?.name}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Object.values(ARENAS).map((arena) => {
                        const unlocked = checkArenaUnlocked(arena.id, totalWins, unlockedMaps);
                        const selected = currentArena === arena.id;
                        return (
                          <button
                            key={arena.id}
                            type="button"
                            onClick={() => {
                              if (unlocked) {
                                soundFx.playUiClick();
                                setCurrentArena(arena.id);
                              } else {
                                openTab('tycoon');
                              }
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold border transition-all cursor-pointer ${
                              selected
                                ? 'bg-amber-500 text-slate-950 border-amber-300 font-black shadow-lg shadow-amber-500/25 scale-105'
                                : unlocked
                                ? 'bg-slate-900/80 text-slate-200 border-white/15 hover:border-amber-400/50'
                                : 'bg-slate-950/60 text-slate-500 border-slate-800'
                            }`}
                          >
                            {!unlocked && <Lock className="w-3 h-3 text-amber-400/70" />}
                            <span>
                              {arena.name
                                .replace('Freilichtmuseum ', '')
                                .replace(' Neu-Anspach', '')
                                .replace(' (Taunusbahn)', '')}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* PRIMARY LAUNCH CTA BUTTONS */}
                  <div className="flex flex-wrap gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowMobileCommandOverlay(false);
                        setActiveTab('battle');
                        setShowHome(false);
                      }}
                      className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 px-6 py-4 text-base font-black text-slate-950 shadow-[0_0_30px_rgba(245,158,11,0.35)] transition hover:scale-[1.02] hover:from-amber-400 hover:to-yellow-300 cursor-pointer"
                    >
                      <Crosshair className="h-5 w-5" aria-hidden="true" />
                      Einsatz starten
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      onClick={() => openTab('gunsmith')}
                      className="inline-flex items-center gap-2 rounded-2xl border border-amber-500/40 bg-slate-900/80 px-5 py-4 font-bold text-amber-300 transition hover:bg-slate-800 hover:text-white cursor-pointer"
                    >
                      <Wrench className="h-5 w-5" aria-hidden="true" />
                      Waffenschmiede
                    </button>

                    <button
                      type="button"
                      onClick={() => openTab('tycoon')}
                      className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-slate-900/80 px-5 py-4 font-bold text-emerald-300 transition hover:bg-slate-800 hover:text-white cursor-pointer"
                    >
                      <Building2 className="h-5 w-5" aria-hidden="true" />
                      Stadt-Tycoon
                    </button>

                    <button
                      type="button"
                      onClick={() => openTab('multiplayer')}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/70 px-5 py-4 font-bold text-slate-200 transition hover:border-amber-400/60 hover:text-white cursor-pointer"
                    >
                      <Users className="h-5 w-5" aria-hidden="true" />
                      Freunde-Lobby
                    </button>
                  </div>

                  <p className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
                    PC: Maus & WASD + [Q/E/F] Fähigkeiten · Handy: 3D Twin-Stick + Smart Auto-Fire
                  </p>
                </div>

                {/* RIGHT COLUMN: ACTIVE OPERATOR LOADOUT & CAREER TELEMETRY CARD */}
                <div className="rounded-3xl border border-white/15 bg-slate-950/80 p-6 backdrop-blur-md shadow-2xl space-y-5">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div>
                      <span className="font-mono text-[10px] font-black uppercase tracking-widest text-amber-400">
                        AKTIVES KAMPF-LOADOUT
                      </span>
                      <h3 className="text-xl font-black text-white mt-0.5">{signatureWeaponName}</h3>
                      <span className="text-xs font-mono text-slate-400">{primaryWeaponObj.codArchetype}</span>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-[10px] text-slate-400 uppercase block">Feuerkraft</span>
                      <span className="text-2xl font-black text-amber-400">{primaryWeaponDps} DPS</span>
                    </div>
                  </div>

                  {/* Career Combat Telemetry Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center font-mono">
                    <div className="p-3 rounded-2xl bg-slate-900/90 border border-white/10">
                      <div className="text-[10px] text-slate-400 uppercase">Siege</div>
                      <div className="text-lg font-black text-emerald-400 tabular-nums">{totalWins}</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-900/90 border border-white/10">
                      <div className="text-[10px] text-slate-400 uppercase">Elims</div>
                      <div className="text-lg font-black text-red-400 tabular-nums">{careerStats.totalKills}</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-900/90 border border-white/10">
                      <div className="text-[10px] text-slate-400 uppercase">Max Combo</div>
                      <div className="text-lg font-black text-amber-400 tabular-nums">x{careerStats.highestCombo}</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-900/90 border border-white/10">
                      <div className="text-[10px] text-slate-400 uppercase">Bosse</div>
                      <div className="text-lg font-black text-purple-400 tabular-nums">{careerStats.bossesDefeated}</div>
                    </div>
                  </div>

                  {/* Feature Cards */}
                  <div className="grid gap-2.5 sm:grid-cols-3">
                    {[
                      { icon: Crosshair, title: '3D-Einsatz', text: 'Volle Action auf PC & Smartphone', tab: 'battle' as AppTab },
                      { icon: Wrench, title: 'Waffenschmiede', text: 'Aufsätze & Pack-a-Punch', tab: 'gunsmith' as AppTab },
                      { icon: Trophy, title: 'Rangliste', text: 'Live-Derby Neu-Anspach vs. Wehrheim', tab: 'leaderboard' as AppTab },
                    ].map(({ icon: Icon, title, text, tab }) => (
                      <button
                        key={title}
                        type="button"
                        onClick={() => openTab(tab)}
                        className="rounded-2xl border border-white/10 bg-slate-900/75 hover:border-amber-400/50 p-3.5 text-left transition-all cursor-pointer"
                      >
                        <Icon className="mb-2 h-4 w-4 text-amber-400" aria-hidden="true" />
                        <h2 className="text-xs font-black text-white">{title}</h2>
                        <p className="mt-0.5 text-[11px] leading-snug text-slate-400">{text}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ===================================================================== */}
              {/* SEASON 1 BATTLE PASS ("TAUNUS-EHRENPASS")                             */}
              {/* ===================================================================== */}
              <div className="rounded-3xl border border-amber-500/30 bg-slate-950/85 p-5 sm:p-6 backdrop-blur-md shadow-2xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-widest text-amber-400">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>SAISON 1 EHRENPASS · FORTSCHRITT DURCH OPERATOR-RUF</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      Taunus-Ehrenpass (Stufe {SEASON_BATTLE_PASS.filter((t) => reputation >= t.requiredReputation).length} / {SEASON_BATTLE_PASS.length})
                    </h3>
                  </div>
                  <span className="rounded-xl bg-amber-500/15 border border-amber-400/40 px-3 py-1 font-mono text-xs font-black text-amber-300">
                    Dein Ruf: {reputation} Pkt
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
                  {SEASON_BATTLE_PASS.map((tier) => {
                    const isUnlocked = reputation >= tier.requiredReputation;
                    const isClaimed = careerStats.claimedBattlePassTiers.includes(tier.tier);
                    return (
                      <div
                        key={tier.tier}
                        className={`flex flex-col justify-between rounded-2xl border p-3 transition-all ${
                          isClaimed
                            ? 'border-emerald-500/40 bg-emerald-950/20'
                            : isUnlocked
                            ? 'border-amber-400 bg-amber-500/15 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                            : 'border-slate-800 bg-slate-900/60 opacity-75'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between font-mono text-[10px] font-black">
                            <span className="text-amber-400">STUFE {tier.tier}</span>
                            <span className="text-slate-400">{tier.requiredReputation} RUF</span>
                          </div>
                          <div className="mt-1.5 text-xs font-black text-white leading-snug">
                            {tier.title}
                          </div>
                          <div className="mt-1 text-[10px] font-mono text-amber-300 font-bold">
                            {tier.rewardLabel}
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-white/10">
                          {isClaimed ? (
                            <span className="flex items-center justify-center gap-1 text-[10px] font-mono font-bold text-emerald-400">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Eingelöst</span>
                            </span>
                          ) : isUnlocked ? (
                            <button
                              type="button"
                              onClick={() => handleClaimBattlePassTier(tier.tier)}
                              className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 py-1.5 font-mono text-[10px] font-black uppercase text-slate-950 shadow cursor-pointer"
                            >
                              Abholen (+{tier.rewardNAT})
                            </button>
                          ) : (
                            <span className="block text-center font-mono text-[10px] text-slate-500">
                              Noch {tier.requiredReputation - reputation} Ruf
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ===================================================================== */}
              {/* CAREER ACHIEVEMENTS ("TAUNUS-AUSZEICHNUNGEN")                         */}
              {/* ===================================================================== */}
              <div className="rounded-3xl border border-white/10 bg-slate-950/85 p-5 sm:p-6 backdrop-blur-md shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-mono text-[10px] font-black uppercase tracking-widest text-emerald-400">
                      KARRIERE-MEILENSTEINE & PRÄMIEN
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      Taunus-Auszeichnungen ({careerStats.claimedAchievements.length}/{ACHIEVEMENTS_LIST.length} eingelöst)
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {ACHIEVEMENTS_LIST.map((ach) => {
                    const unlocked = ach.checkUnlocked(careerStats);
                    const claimed = careerStats.claimedAchievements.includes(ach.id);
                    const prog = ach.progressText(careerStats);

                    return (
                      <div
                        key={ach.id}
                        className={`flex items-center justify-between gap-3 rounded-2xl border p-3.5 ${
                          claimed
                            ? 'border-emerald-500/30 bg-emerald-950/15'
                            : unlocked
                            ? 'border-amber-400 bg-amber-500/15'
                            : 'border-slate-800 bg-slate-900/70'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-white truncate">{ach.title}</span>
                            <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-300">
                              {prog}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[11px] text-slate-400 leading-snug">{ach.description}</p>
                          <div className="mt-1 font-mono text-[10px] font-bold text-emerald-400">
                            Prämie: +{ach.rewardNAT} NAT · +{ach.rewardReputation} RUF
                          </div>
                        </div>

                        <div className="shrink-0">
                          {claimed ? (
                            <span className="flex items-center gap-1 font-mono text-[10px] font-bold text-emerald-400">
                              <CheckCircle2 className="h-4 w-4" />
                            </span>
                          ) : unlocked ? (
                            <button
                              type="button"
                              onClick={() => handleClaimAchievement(ach.id)}
                              className="rounded-xl bg-amber-500 hover:bg-amber-400 px-3 py-1.5 font-mono text-[10px] font-black uppercase text-slate-950 shadow cursor-pointer"
                            >
                              Holen
                            </button>
                          ) : (
                            <Lock className="h-4 w-4 text-slate-600" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        )}

        {!showHome && activeTab === 'battle' && (
          showMobileCommandOverlay ? (
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
              onSwitchToPcMode={() => {
                setIsMobileMode(false);
                setShowMobileCommandOverlay(false);
              }}
              onSimulatePatrol={handleSimulatePatrol}
              onLaunch3DMobileCombat={(arenaId) => {
                if (arenaId) setCurrentArena(arenaId);
                setShowMobileCommandOverlay(false);
              }}
            />
          ) : (
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
              onOpenMobileCommandHub={() => setShowMobileCommandOverlay(true)}
              onComboRecord={handleComboRecord}
            />
          )
        )}

        {!showHome && activeTab === 'gunsmith' && (
          <GunsmithView
            budget={budget}
            weaponUpgrades={weaponUpgrades}
            activeWeaponId={selectedGunsmithWeapon}
            onSelectWeapon={(wId) => setSelectedGunsmithWeapon(wId)}
            onUpgradeAttachment={handleUpgradeAttachment}
            onUpgradeRarity={handleUpgradeRarity}
            onUpgradePackAPunch={handleUpgradePackAPunch}
            onClose={() => setActiveTab('battle')}
          />
        )}

        {!showHome && activeTab === 'tycoon' && (
          <TycoonHub
            budget={budget}
            onUpgradeFacility={handleUpgradeFacility}
            facilities={facilities}
            totalWins={totalWins}
            unlockedMaps={effectiveUnlockedMaps}
            onUnlockMap={handleUnlockMap}
            totalIncomePerSec={totalIncomePerSec}
            commanderCrisisEvent={crisisEvent}
            onAcceptCrisisEvent={handleAcceptCrisis}
            onStartArena={(arenaId) => {
              setCurrentArena(arenaId);
              setActiveTab('battle');
            }}
          />
        )}

        {!showHome && activeTab === 'multiplayer' && (
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

        {!showHome && activeTab === 'leaderboard' && (
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
      </main>
    </div>
  );
}
