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
  saveDailyMissions,
  processDailyMissionEvent,
  claimDailyMission,
  claimDailyGrandBonus,
} from './game/missions';
import { AgentRole } from './game/agents/microAgents';
import { INITIAL_FACILITIES, Facility } from './game/tycoon';
import {
  MultiplayerRoom,
  updateMultiplayerState,
  submitScore,
  registerOperatorProfile,
} from './game/multiplayer';
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
  const [activeTab, setActiveTab] = useState<AppTab>('battle');
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
        if (active) setAuthUser(user);
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
    setAuthUser(user);
    const identity = user.displayName || user.username || user.email;
    if (identity && localStorage.getItem('na_operator_registered') !== 'true') {
      setPlayerName(identity.slice(0, 20));
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
  const signatureWeaponName = getEffectiveWeaponStats(
    primaryWeaponObj,
    weaponUpgrades[selectedGunsmithWeapon]
  ).displayName;

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
    // Generate 2-4 tactical enemy eliminations in the target arena
    const patrolKills = Math.floor(Math.random() * 3) + 2;
    const earnedNAT = 45 + patrolKills * 12;
    const earnedScore = patrolKills * 125;

    setBudget((prev) => prev + earnedNAT);
    setLastMatchKills((prev) => prev + patrolKills);
    setLastMatchScore((prev) => prev + earnedScore);

    // Trigger daily missions progression for each kill in this arena!
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

    // Also trigger taler event for the collected NAT
    triggerMissionEvent({
      type: 'taler',
      amount: earnedNAT,
    });

    submitScore({
      name: playerName,
      clanTag,
      score: earnedScore,
      kills: patrolKills,
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
    setBudget((prev) => prev + reward);

    let nextWins = totalWins;
    let nextUnlocked = [...unlockedMaps];

    if (victory) {
      nextWins = totalWins + 1;
      setTotalWins(nextWins);

      // Automatically unlock maps whose requiredWins <= nextWins
      Object.values(ARENA_UNLOCK_RULES).forEach((rule) => {
        if (nextWins >= rule.requiredWins && !nextUnlocked.includes(rule.id)) {
          nextUnlocked.push(rule.id);
        }
      });
      setUnlockedMaps(nextUnlocked);
    }

    submitScore({
      name: playerName,
      clanTag,
      score: stats.score,
      kills: stats.kills,
      wave: stats.wave,
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
        stats.kills,
        victory ? 100 : 0,
        stats.score,
        stats.wave
      ).catch(console.error);
    }
  };

  const handleStartGameWithRoom = (room: MultiplayerRoom, playerId: string) => {
    setActiveRoom(room);
    setLocalPlayerId(playerId);
    setCurrentArena(room.arena || 'hessenpark');
    setActiveTab('battle');
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
    <div className="flex flex-col min-h-screen w-full bg-slate-950 font-sans text-slate-100 overflow-x-hidden">
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

      {/* 3-Zone Top Navigation Contract */}
      <TopBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
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
        onOpenProfileModal={() => setShowProfileModal(true)}
        onOpenLegalModal={() => setShowLegalModal(true)}
        onOpenDailyMissions={() => setShowDailyMissionsModal(true)}
        onLogout={handleLogout}
        unclaimedMissionsCount={unclaimedMissionsCount}
        completedMissionsCount={completedMissionsCount}
        totalMissionsCount={dailyMissionsState.missions.length}
      />

      {/* Main View Router - with native smooth scrolling on desktop and mobile */}
      <main className="flex-1 w-full relative overflow-y-auto">
        {activeTab === 'battle' && (
          isMobileMode ? (
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
              onNavigateTab={(tab) => setActiveTab(tab)}
              onSwitchToPcMode={() => setIsMobileMode(false)}
              onSimulatePatrol={handleSimulatePatrol}
            />
          ) : (
            <ThreeCanvas
              currentArena={currentArena}
              onChangeArena={(arenaId) => setCurrentArena(arenaId)}
              onMatchComplete={handleMatchComplete}
              unlockedFacilities={facilityLevels}
              latestCommanderBark={latestCommanderBark}
              commanderDirectives={commanderDirectives}
              isMobileMode={false}
              onCollectTaler={handleCollectTaler}
              onOpenTycoon={() => setActiveTab('tycoon')}
              onOpenGunsmith={() => setActiveTab('gunsmith')}
              onOpenLeaderboard={() => setActiveTab('leaderboard')}
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
              onClaimDailyMission={handleClaimMission}
            />
          )
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
            onClose={() => setActiveTab('battle')}
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
            commanderCrisisEvent={crisisEvent}
            onAcceptCrisisEvent={handleAcceptCrisis}
            onStartArena={(arenaId) => {
              setCurrentArena(arenaId);
              setActiveTab('battle');
            }}
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
      </main>
    </div>
  );
}
