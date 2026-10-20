import React, { useEffect, useRef, useState } from 'react';
import {
  ArenaSceneManager,
  ControlSettings,
  DEFAULT_CONTROL_SETTINGS,
  TargetInfo,
  AllyStatusInfo,
  WaveInfo,
  AbilityCooldownsState,
  RadarState,
  KillFeedNotification,
} from '../game/three/ArenaScene';
import {
  ARENAS,
  ARENA_UNLOCK_RULES,
  checkArenaUnlocked,
  INITIAL_MAP_LEVELS,
  getMapBotScaling,
} from '../game/three/arenas';
import {
  WEAPONS,
  getEffectiveWeaponStats,
  INITIAL_WEAPON_UPGRADES,
  getWeaponXpForNextLevel,
  MAX_WEAPON_LEVEL,
} from '../game/weapons';
import {
  WeaponAttachments,
  AllWeaponsUpgrades,
  SkillTreeLevels,
  MapLevelsState,
} from '../types';
import { INITIAL_SKILL_TREE } from '../game/skillTree';
import {
  Shield,
  Sparkles,
  Skull,
  Users,
  Target,
  MousePointer,
  Heart,
  Flame,
  Crosshair,
  ArrowUp,
  Layers,
  Smartphone,
  Coins,
  Building2,
  Compass,
  Lock,
  Unlock,
  Trophy,
  Settings,
  Keyboard,
  Zap,
  Wind,
  Radio,
  RotateCcw,
  Eye,
} from 'lucide-react';
import { soundFx } from '../audio/soundFx';
import { DailyMissionsState } from '../game/missions';
import { AgentRole } from '../game/agents/microAgents';
import { BrawlStarsEndScreen, DetailedMatchStats } from './BrawlStarsEndScreen';
import {
  MatchPerkDef,
  MatchPerkId,
  MATCH_PERK_POOL,
  rollMatchPerks,
} from '../game/progression';

interface ThreeCanvasProps {
  currentArena: string;
  onChangeArena: (arenaId: string) => void;
  onMatchComplete: (victory: boolean, stats: DetailedMatchStats | { kills: number; score: number; wave: number }) => void;
  onMatchStateChange?: (state: 'inactive' | 'active' | 'paused' | 'complete') => void;
  isMultiplayerMatch?: boolean;
  matchReward?: number;
  unlockedFacilities: Record<string, number>;
  latestCommanderBark?: string;
  commanderDirectives?: any;
  isMobileMode?: boolean;
  onCollectTaler?: (amount: number) => void;
  onOpenTycoon?: () => void;
  onOpenLeaderboard?: () => void;
  weaponUpgrades?: AllWeaponsUpgrades;
  onLootAttachmentUpdate?: (weaponId: string, attachments: WeaponAttachments) => void;
  totalWins?: number;
  unlockedMaps?: string[];
  budget?: number;
  onUnlockMap?: (arenaId: string, costNAT: number) => void;
  playerName?: string;
  clanTag?: string;
  dailyMissionsState?: DailyMissionsState;
  onEnemyEliminated?: (details: {
    arenaId: string;
    role: AgentRole;
    isBoss: boolean;
    weaponId: string;
    wave: number;
    isCrit: boolean;
  }) => void;
  onStreakAchieved?: (count: number) => void;
  onWaveAdvanced?: (wave: number) => void;
  onOpenDailyMissions?: () => void;
  skillTree?: SkillTreeLevels;
  mapLevels?: MapLevelsState;
  onWeaponXpGain?: (weaponId: string, xpAmount: number) => void;
  onOperatorLevelUp?: (newLevel: number) => void;
}

export const ThreeCanvas: React.FC<ThreeCanvasProps> = ({
  currentArena,
  onChangeArena,
  onMatchComplete,
  onMatchStateChange,
  isMultiplayerMatch = false,
  matchReward = 0,
  unlockedFacilities,
  latestCommanderBark,
  commanderDirectives,
  isMobileMode = false,
  onCollectTaler,
  onOpenTycoon,
  onOpenLeaderboard,
  weaponUpgrades = INITIAL_WEAPON_UPGRADES,
  onLootAttachmentUpdate,
  totalWins = 0,
  unlockedMaps = ['hessenpark'],
  budget = 0,
  onUnlockMap,
  playerName = 'Operator',
  clanTag = '61267',
  dailyMissionsState,
  onEnemyEliminated,
  onStreakAchieved,
  onWaveAdvanced,
  onOpenDailyMissions,
  skillTree = INITIAL_SKILL_TREE,
  mapLevels = INITIAL_MAP_LEVELS,
  onWeaponXpGain,
  onOperatorLevelUp,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const managerRef = useRef<ArenaSceneManager | null>(null);

  const [matchRound, setMatchRound] = useState(1);
  // Mobile Mode now defaults to full 3D Battle Royale combat, with a 1-tap toggle for Peaceful Exploration!
  const [isMobilePeaceful, setIsMobilePeaceful] = useState(false);
  const [mobileAutoFire, setMobileAutoFire] = useState(true);
  const [mobileAiming, setMobileAiming] = useState(false);
  const [mobileSprinting, setMobileSprinting] = useState(false);

  const [health, setHealth] = useState(100);
  const [maxHealth, setMaxHealth] = useState(100);
  const [shield, setShield] = useState(100);
  const [maxShield, setMaxShield] = useState(100);
  const [kills, setKills] = useState(0);
  const [score, setScore] = useState(0);
  const [ammo, setAmmo] = useState({ magazine: 30, reserve: 90, capacity: 30 });
  const [isReloading, setIsReloading] = useState(false);
  const [reloadSeconds, setReloadSeconds] = useState(0);
  const [playerLevel, setPlayerLevel] = useState(1);
  const [playerExperience, setPlayerExperience] = useState(0);
  const [experienceToNextLevel, setExperienceToNextLevel] = useState(500);
  const [collectedRunTaler, setCollectedRunTaler] = useState(0);
  const [zoneTimer, setZoneTimer] = useState(260);
  const [zoneRadius, setZoneRadius] = useState(56);
  const [activeWeapon, setActiveWeapon] = useState('bembel');
  const [weaponSwitchNotice, setWeaponSwitchNotice] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<WeaponAttachments>(
    weaponUpgrades.bembel?.attachments || {
      scope: 0,
      barrel: 0,
      bolt: 0,
      mag: 0,
      stock: 0,
    }
  );
  const [elevation, setElevation] = useState(0);
  const [lootNotification, setLootNotification] = useState<string | null>(null);
  const [currentTarget, setCurrentTarget] = useState<TargetInfo | null>(null);
  const [allies, setAllies] = useState<AllyStatusInfo[]>([]);
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const [heading, setHeading] = useState(0);
  const [hitMarkerActive, setHitMarkerActive] = useState(false);
  const [isCritHitMarker, setIsCritHitMarker] = useState(false);
  const [killStreakNotice, setKillStreakNotice] = useState<string | null>(null);
  const [lockedArenaPrompt, setLockedArenaPrompt] = useState<string | null>(null);
  const [stance, setStance] = useState<'standing' | 'sprinting' | 'crouching'>('standing');

  // New Game Juice & Tactical HUD States
  const [comboState, setComboState] = useState<{ multiplier: number; timerRatio: number }>({
    multiplier: 1,
    timerRatio: 0,
  });
  const [abilityCooldowns, setAbilityCooldowns] = useState<AbilityCooldownsState>({
    shockwave: 0,
    shockwaveMax: 10,
    dash: 0,
    dashMax: 5,
    overdrive: 0,
    overdriveMax: 22,
    overdriveActive: false,
  });
  const [radarState, setRadarState] = useState<RadarState>({
    playerX: 0,
    playerZ: 10,
    playerYaw: 0,
    stormRadius: 56,
    blips: [],
  });
  const [killFeedList, setKillFeedList] = useState<KillFeedNotification[]>([]);
  const [damageFlash, setDamageFlash] = useState(false);
  const [abilityBanner, setAbilityBanner] = useState<string | null>(null);

  // Roguelite Mid-Match Wave Perks
  const [activeMatchPerks, setActiveMatchPerks] = useState<MatchPerkId[]>([]);
  const [perkDraftOptions, setPerkDraftOptions] = useState<MatchPerkDef[]>([]);
  const lastDraftedWaveRef = useRef<number>(0);

  const lastKillTimeRef = useRef<number>(0);
  const streakCountRef = useRef<number>(0);

  // Virtual Analog Joystick state for Mobile Mode
  const [joystickVisual, setJoystickVisual] = useState<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });
  const joystickCenterRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const joystickTouchIdRef = useRef<number | null>(null);
  const lookTouchIdRef = useRef<number | null>(null);
  const lookLastPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [waveInfo, setWaveInfo] = useState<WaveInfo>({
    wave: 1,
    totalWaves: 5,
    title: 'WELLE 1/5: WEHRHEIMER KUNDSCHAFTER',
    subtitle: 'Apfeldorf-Späher testen Neu-Anspachs Wachposten!',
    status: 'active',
    remainingEnemies: 4,
    totalEnemies: 4,
  });

  const [gameOverState, setGameOverState] = useState<{
    over: boolean;
    victory: boolean;
    stats: DetailedMatchStats;
  } | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isTrainingMode, setIsTrainingMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [mouseSensitivity, setMouseSensitivity] = useState(() => {
    const saved = localStorage.getItem('na_mouse_sensitivity');
    return saved ? Number(saved) : 1;
  });
  const [controlSettings, setControlSettings] = useState<ControlSettings>(() => {
    try {
      const saved = localStorage.getItem('na_control_settings');
      return saved ? { ...DEFAULT_CONTROL_SETTINGS, ...JSON.parse(saved) } : DEFAULT_CONTROL_SETTINGS;
    } catch {
      return DEFAULT_CONTROL_SETTINGS;
    }
  });
  const [capturingControl, setCapturingControl] = useState<keyof ControlSettings | null>(null);

  const maxHpBonus = (unlockedFacilities.waldschwimmbad || 0) * 15;
  const speedMultiplier = 1 + (unlockedFacilities.breitband || 0) * 0.05;
  const effectivePeacefulMode = isMobileMode && isMobilePeaceful;

  // Active daily mission relevant to current arena or next active incomplete challenge
  const activeDailyMission =
    dailyMissionsState?.missions.find(
      (m) => !m.completed && m.arenaId === currentArena
    ) ||
    dailyMissionsState?.missions.find((m) => !m.completed) ||
    dailyMissionsState?.missions[0];

  useEffect(() => {
    if (!containerRef.current) return;

    setHealth(100 + maxHpBonus);
    setMaxHealth(100 + maxHpBonus);
    setShield(100);
    setMaxShield(100);
    setKills(0);
    setScore(0);
    setCollectedRunTaler(0);
    setElevation(0);
    setGameOverState(null);
    setIsPaused(false);
    onMatchStateChange?.('active');
    setCurrentTarget(null);
    setKillStreakNotice(null);
    setLockedArenaPrompt(null);
    setStance('standing');
    setComboState({ multiplier: 1, timerRatio: 0 });
    setActiveMatchPerks([]);
    setPerkDraftOptions([]);
    setKillFeedList([]);
    lastDraftedWaveRef.current = 0;
    streakCountRef.current = 0;

    const manager = new ArenaSceneManager(
      containerRef.current,
      currentArena,
      {
        onHealthChange: (hp, maxHp, shld, maxShld) => {
          setHealth(hp);
          setMaxHealth(maxHp);
          setShield(shld);
          setMaxShield(maxShld);
        },
        onKillsChange: (k) => {
          setKills(k);
          const now = Date.now();
          if (now - lastKillTimeRef.current < 4500) {
            streakCountRef.current += 1;
            const streak = streakCountRef.current;
            onStreakAchieved?.(streak);
            const streakTitle =
              streak === 2
                ? 'DOPPEL-KILL!'
                : streak === 3
                ? 'DREIFACH-KILL!'
                : streak === 4
                ? 'VIERFACH-KILL!'
                : 'UNAUFHALTBAR (STREAK)!';
            setKillStreakNotice(streakTitle);
            setTimeout(() => setKillStreakNotice(null), 2200);
          } else {
            streakCountRef.current = 1;
          }
          lastKillTimeRef.current = now;
        },
        onScoreChange: (s) => setScore(s),
        onAmmoChange: (magazine, reserve, capacity) => setAmmo({ magazine, reserve, capacity }),
        onReloadStateChange: (reloading, secondsRemaining) => {
          setIsReloading(reloading);
          setReloadSeconds(secondsRemaining);
        },
        onLevelChange: (level, experience, experienceToNext) => {
          setPlayerLevel(level);
          setPlayerExperience(experience);
          setExperienceToNextLevel(experienceToNext);
          onOperatorLevelUp?.(level);
        },
        onZoneTimer: (sec, rad) => {
          setZoneTimer(sec);
          setZoneRadius(rad);
        },
        onGameOver: (victory, stats) => {
          setGameOverState({ over: true, victory, stats });
          setIsPaused(false);
          onMatchStateChange?.('complete');
          onMatchComplete(victory, stats);
        },
        onCombatBark: () => {},
        onLootPickup: (type, amount, label) => {
          if (type === 'taler') {
            setCollectedRunTaler((prev) => prev + amount);
            onCollectTaler?.(amount);
          }
          const msg =
            type === 'attachment'
              ? `WAFFEN-UPGRADE: ${label}`
              : type === 'taler'
              ? label || `+${amount} Neu-Anspach-Taler (NAT) gesammelt!`
              : type === 'shield'
              ? `+${amount} Schildtrank (Blau)`
              : type === 'health'
              ? `+${amount} Handkäs (Heilung)`
              : `+${amount} Munition`;
          setLootNotification(msg);
          setTimeout(() => setLootNotification(null), 2400);
        },
        onTargetUpdate: (target) => {
          setCurrentTarget(target);
        },
        onAlliesChange: (alliesList) => {
          setAllies(alliesList);
        },
        onHitEnemy: (_dmg, isCrit) => {
          setIsCritHitMarker(isCrit);
          setHitMarkerActive(true);
          setTimeout(() => setHitMarkerActive(false), 140);
        },
        onPointerLockChange: (locked) => {
          setIsPointerLocked(locked);
        },
        onHeadingChange: (deg) => {
          setHeading(deg);
        },
        onWaveChange: (info) => {
          setWaveInfo(info);
          onWaveAdvanced?.(info.wave);
          if (info.status === 'cleared' && lastDraftedWaveRef.current < info.wave) {
            lastDraftedWaveRef.current = info.wave;
            setPerkDraftOptions(rollMatchPerks([], 3));
          } else if (info.status !== 'cleared') {
            setPerkDraftOptions([]);
          }
        },
        onEnemyKilled: (details) => {
          onEnemyEliminated?.(details);
        },
        onWeaponXpGain: (weaponId, xpAmount) => {
          onWeaponXpGain?.(weaponId, xpAmount);
        },
        onAttachmentsChange: (att, weaponId) => {
          setAttachments(att);
          if (weaponId && onLootAttachmentUpdate) {
            onLootAttachmentUpdate(weaponId, att);
          }
        },
        onWeaponChange: (wId) => {
          setActiveWeapon(wId);
          if (weaponUpgrades[wId]) {
            setAttachments(weaponUpgrades[wId].attachments);
          }
          const switchedWeapon = WEAPONS[wId];
          if (switchedWeapon) {
            setWeaponSwitchNotice(switchedWeapon.name);
            window.setTimeout(() => setWeaponSwitchNotice(null), 1400);
          }
          soundFx.playShoot(wId);
        },
        onElevationChange: (elev) => {
          setElevation(elev);
        },
        onStanceChange: (nextStance) => {
          setStance(nextStance);
        },
        onComboChange: (mult, ratio) => {
          setComboState({ multiplier: mult, timerRatio: ratio });
          if (mult > 1) {
            onComboRecord?.(mult);
          }
        },
        onAbilityCooldownsChange: (cds) => {
          setAbilityCooldowns(cds);
        },
        onRadarUpdate: (rState) => {
          setRadarState(rState);
        },
        onKillFeedEvent: (item) => {
          setKillFeedList((prev) => [item, ...prev].slice(0, 4));
        },
        onPlayerDamaged: () => {
          setDamageFlash(true);
          window.setTimeout(() => setDamageFlash(false), 260);
        },
        onAbilityUsed: (_ability, label) => {
          setAbilityBanner(label);
          window.setTimeout(() => setAbilityBanner(null), 2000);
        },
      },
      {
        maxHpBonus,
        speedMultiplier,
        peacefulMode: effectivePeacefulMode,
        trainingMode: isTrainingMode,
        mouseSensitivity,
        controls: controlSettings,
        weaponUpgrades,
        skillTree,
        mapLevels,
      }
    );

    manager.setMobileAutoFire(isMobileMode && mobileAutoFire);
    managerRef.current = manager;

    return () => {
      manager.destroy();
      managerRef.current = null;
      onMatchStateChange?.('inactive');
    };
  }, [currentArena, matchRound, effectivePeacefulMode, isTrainingMode]);

  useEffect(() => {
    managerRef.current?.setMobileAutoFire(isMobileMode && mobileAutoFire);
  }, [isMobileMode, mobileAutoFire]);

  useEffect(() => {
    managerRef.current?.setInputSettings(mouseSensitivity, controlSettings);
  }, [mouseSensitivity, controlSettings]);

  // Allow keyboard hotkeys [7], [8], [9] to pick wave perks without even unlocking the mouse!
  useEffect(() => {
    if (perkDraftOptions.length === 0) return;
    const onPerkKey = (e: KeyboardEvent) => {
      if (e.key === '7' && perkDraftOptions[0]) handleSelectPerk(perkDraftOptions[0]);
      if (e.key === '8' && perkDraftOptions[1]) handleSelectPerk(perkDraftOptions[1]);
      if (e.key === '9' && perkDraftOptions[2]) handleSelectPerk(perkDraftOptions[2]);
    };
    window.addEventListener('keydown', onPerkKey);
    return () => window.removeEventListener('keydown', onPerkKey);
  }, [perkDraftOptions]);

  useEffect(() => {
    if (isMobileMode || isMultiplayerMatch) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || gameOverState?.over) return;
      event.preventDefault();
      setIsPaused((paused) => {
        const next = !paused;
        managerRef.current?.setPaused(next);
        onMatchStateChange?.(next ? 'paused' : 'active');
        return next;
      });
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gameOverState?.over, isMobileMode, isMultiplayerMatch, onMatchStateChange]);

  // Sync live Cold War Gunsmith & Pack-a-Punch upgrades into running 3D scene
  useEffect(() => {
    if (managerRef.current && weaponUpgrades) {
      managerRef.current.setWeaponUpgrades(weaponUpgrades);
      const activeUpg = weaponUpgrades[activeWeapon];
      if (activeUpg) {
        setAttachments(activeUpg.attachments);
      }
    }
  }, [weaponUpgrades, activeWeapon]);

  useEffect(() => {
    if (managerRef.current && skillTree) {
      managerRef.current.setSkillTree(skillTree);
    }
  }, [skillTree]);

  useEffect(() => {
    if (managerRef.current && mapLevels) {
      managerRef.current.setMapLevels(mapLevels);
    }
  }, [mapLevels]);

  useEffect(() => {
    if (managerRef.current && commanderDirectives) {
      managerRef.current.applyCommanderDirectives({
        flankers: commanderDirectives.flankers,
        snipers: commanderDirectives.snipers,
        shocktroopers: commanderDirectives.shocktroopers,
        bark: commanderDirectives.bark,
      });
    }
  }, [commanderDirectives]);

  useEffect(() => {
    if (gameOverState?.over) {
      if (document.pointerLockElement) {
        document.exitPointerLock?.();
      }
      managerRef.current?.unlockPointer();
    }
  }, [gameOverState?.over]);

  const handleSelectPerk = (perk: MatchPerkDef) => {
    managerRef.current?.applyMatchPerk(perk.id);
    setActiveMatchPerks((prev) => (prev.includes(perk.id) ? prev : [...prev, perk.id]));
    setPerkDraftOptions([]);
    setAbilityBanner(`DIREKTIVE AKTIV: ${perk.title}`);
    window.setTimeout(() => setAbilityBanner(null), 2200);
  };

  const selectWeapon = (id: string) => {
    managerRef.current?.setWeapon(id);
    setActiveWeapon(id);
    if (weaponUpgrades[id]) {
      setAttachments(weaponUpgrades[id].attachments);
    }
    soundFx.playShoot(id);
  };

  const restartMatch = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (document.pointerLockElement) {
      document.exitPointerLock?.();
    }
    setGameOverState(null);
    setIsPaused(false);
    onMatchStateChange?.('active');
    setMatchRound((prev) => prev + 1);
  };

  // Virtual Analog Thumbstick handlers (Touch + Mouse support)
  const updateJoystickFromPoint = (clientX: number, clientY: number) => {
    const maxRadius = 46;
    const dx = clientX - joystickCenterRef.current.x;
    const dy = clientY - joystickCenterRef.current.y;
    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(maxRadius, dist);
    const angle = Math.atan2(dy, dx);
    const visualX = Math.cos(angle) * clampedDist;
    const visualY = Math.sin(angle) * clampedDist;

    setJoystickVisual({ x: visualX, y: visualY, active: true });
    managerRef.current?.setMobileMoveInput(visualX / maxRadius, visualY / maxRadius);
  };

  const resetJoystick = () => {
    joystickTouchIdRef.current = null;
    setJoystickVisual({ x: 0, y: 0, active: false });
    managerRef.current?.setMobileMoveInput(0, 0);
  };

  const handleJoystickTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const touch = e.changedTouches[0];
    if (!touch) return;
    const rect = e.currentTarget.getBoundingClientRect();
    joystickCenterRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    joystickTouchIdRef.current = touch.identifier;
    updateJoystickFromPoint(touch.clientX, touch.clientY);
  };

  const handleJoystickTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === joystickTouchIdRef.current) {
        updateJoystickFromPoint(t.clientX, t.clientY);
        break;
      }
    }
  };

  const handleJoystickTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joystickTouchIdRef.current) {
        resetJoystick();
        break;
      }
    }
  };

  // Right-side Touch Look Zone handlers
  const handleLookTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.changedTouches[0];
    if (!touch) return;
    lookTouchIdRef.current = touch.identifier;
    lookLastPosRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleLookTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === lookTouchIdRef.current) {
        const dx = t.clientX - lookLastPosRef.current.x;
        const dy = t.clientY - lookLastPosRef.current.y;
        lookLastPosRef.current = { x: t.clientX, y: t.clientY };
        managerRef.current?.addCameraLookDelta(dx, dy);
        break;
      }
    }
  };

  const handleLookTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === lookTouchIdRef.current) {
        lookTouchIdRef.current = null;
        break;
      }
    }
  };

  const compassDirections = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const currentCompassLabel =
    compassDirections[Math.floor(((heading + 22.5) % 360) / 45)] || 'N';

  const activeArenaDef = ARENAS[currentArena] || ARENAS.hessenpark;
  const currentMapLevel = mapLevels[currentArena] || 1;
  const activeBotScaling = getMapBotScaling(currentArena, currentMapLevel);
  const activeWeaponObj = WEAPONS[activeWeapon] || WEAPONS.bembel;
  const activeWeaponState = weaponUpgrades[activeWeapon];
  const activeWeaponStats = getEffectiveWeaponStats(activeWeaponObj, activeWeaponState);
  const activeWeaponXpNext = getWeaponXpForNextLevel(activeWeaponStats.weaponLevel);
  const controlLabels: Record<keyof ControlSettings, string> = {
    forward: 'Vorwärts',
    backward: 'Rückwärts',
    left: 'Links',
    right: 'Rechts',
    reload: 'Nachladen',
    jump: 'Springen',
    sprint: 'Sprint',
    crouch: 'Ducken',
  };

  const displayBinding = (binding: string) => (binding === ' ' ? 'LEERTASTE' : binding.toUpperCase());

  const toggleTrainingMode = () => {
    managerRef.current?.unlockPointer();
    setIsTrainingMode((active) => !active);
    setIsPaused(false);
    onMatchStateChange?.('active');
  };

  const updateSensitivity = (value: number) => {
    const next = Math.min(3, Math.max(0.25, value));
    setMouseSensitivity(next);
    localStorage.setItem('na_mouse_sensitivity', String(next));
  };

  const captureControl = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!capturingControl) return;
    event.preventDefault();
    event.stopPropagation();
    const binding =
      event.key === ' ' ? ' ' : event.key === 'Shift' ? 'shift' : event.key === 'Control' ? 'control' : event.key.toLowerCase();
    const next = { ...controlSettings, [capturingControl]: binding };
    setControlSettings(next);
    localStorage.setItem('na_control_settings', JSON.stringify(next));
    setCapturingControl(null);
  };

  return (
    <div
      className={`fixed inset-0 z-10 w-full h-[100dvh] pb-14 lg:pb-0 overflow-hidden bg-slate-950 select-none touch-none ${
        gameOverState?.over || isMobileMode ? 'cursor-default' : ''
      }`}
    >
      {/* 3D WebGL Canvas Container */}
      <div
        ref={containerRef}
        className={`w-full h-full ${
          gameOverState?.over || isMobileMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'
        }`}
      />

      {/* DIRECTIONAL DAMAGE FLASH VIGNETTE */}
      {damageFlash && (
        <div
          className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-200"
          style={{
            background:
              'radial-gradient(circle at center, transparent 48%, rgba(239, 68, 68, 0.48) 100%)',
          }}
        />
      )}

      {/* OVERDRIVE GOLDEN ENERGIZED VIGNETTE */}
      {abilityCooldowns.overdriveActive && (
        <div
          className="pointer-events-none absolute inset-0 z-20 animate-pulse border-4 border-amber-400/60"
          style={{
            boxShadow: 'inset 0 0 65px rgba(245, 158, 11, 0.35)',
          }}
        />
      )}

      {/* CENTER RETICLE (VISIBLE IN BOTH PC AND MOBILE 3D COMBAT MODE) */}
      {!effectivePeacefulMode && !gameOverState?.over && (
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]"
          aria-hidden="true"
        >
          <Crosshair className="h-7 w-7 stroke-[1.5] opacity-90" />
          <span className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-300 shadow-[0_0_5px_rgba(251,191,36,0.95)]" />
        </div>
      )}

      {/* COMPASS TAPE, MAP LEVEL & ELEVATION TELEMETRY (TOP CENTER) */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-20 w-full max-w-xl px-3">
        <div className="flex items-center gap-2.5 px-3.5 py-1 rounded-xl bg-slate-950/85 backdrop-blur-md border border-white/10 text-white font-mono text-xs shadow-lg">
          <Compass className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-amber-400 font-bold tabular-nums">{heading}°</span>
          <span className="text-white font-black tracking-widest text-sm">
            {currentCompassLabel}
          </span>
          <span className="text-slate-200 text-[11px] font-bold truncate max-w-[150px]">
            {activeArenaDef.name}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-red-500/20 border border-red-400/40 text-red-300 text-[10px] font-black whitespace-nowrap">
            MAP-LV.{currentMapLevel} · {activeBotScaling.threatTitle}
          </span>
          {elevation > 0.4 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-bold tabular-nums">
              <ArrowUp className="w-3 h-3" />
              +{elevation.toFixed(1)}m
            </span>
          )}
        </div>
      </div>

      {/* TOP RIGHT QUICK SETTINGS & TRAINING BUTTONS */}
      {!isMobileMode && (
        <div className="absolute top-2 right-4 z-30 flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={toggleTrainingMode}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[10px] font-black uppercase tracking-wide shadow-lg transition-colors ${
              isTrainingMode
                ? 'border-emerald-300 bg-emerald-500 text-slate-950'
                : 'border-white/15 bg-slate-950/85 text-slate-200 hover:border-emerald-400 hover:text-emerald-300'
            }`}
          >
            <Target className="h-3.5 w-3.5" />
            {isTrainingMode ? 'Schießstand aktiv' : 'Schießstand'}
          </button>
          <button
            type="button"
            onClick={() => {
              managerRef.current?.unlockPointer();
              setShowSettings(true);
            }}
            className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-slate-950/85 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-slate-200 shadow-lg transition-colors hover:border-amber-400 hover:text-amber-300"
          >
            <Settings className="h-3.5 w-3.5" />
            Einstellungen
          </button>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MOBILE MODE TOP MODE SWITCHER BAR (3D BATTLE ROYALE vs. STADTERKUNDUNG) */}
      {/* ===================================================================== */}
      {isMobileMode && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-white/15 shadow-2xl pointer-events-auto max-w-[96vw]">
          <button
            type="button"
            onClick={() => setIsMobilePeaceful(false)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
              !isMobilePeaceful
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>3D BATTLE ROYALE</span>
          </button>
          <button
            type="button"
            onClick={() => setIsMobilePeaceful(true)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
              isMobilePeaceful
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>ERKUNDUNG (RUHIG)</span>
          </button>
          {onOpenMobileCommandHub && (
            <button
              type="button"
              onClick={onOpenMobileCommandHub}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold cursor-pointer"
            >
              <Radio className="w-3 h-3" />
              <span>2D-ZENTRALE</span>
            </button>
          )}
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono text-[11px] font-black tabular-nums">
            <Coins className="w-3 h-3 text-amber-400" />
            <span>+{collectedRunTaler}</span>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TOUCH CONTROLS OVERLAY (ACTIVE WHENEVER isMobileMode IS TRUE)         */}
      {/* ===================================================================== */}
      {isMobileMode && !gameOverState?.over && (
        <>
          {/* Right-Half Touch Look Surface */}
          <div
            onTouchStart={handleLookTouchStart}
            onTouchMove={handleLookTouchMove}
            onTouchEnd={handleLookTouchEnd}
            onTouchCancel={handleLookTouchEnd}
            className="absolute top-24 right-0 bottom-32 w-1/2 z-10 touch-none"
          />

          {/* LEFT VIRTUAL ANALOG THUMBSTICK + STANCE TOGGLES */}
          <div className="absolute bottom-28 lg:bottom-14 left-4 z-30 flex flex-col items-center gap-2 pointer-events-auto">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const next = !mobileSprinting;
                  setMobileSprinting(next);
                  managerRef.current?.setSprintState(next);
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-black border transition-all cursor-pointer ${
                  stance === 'sprinting'
                    ? 'bg-amber-500 text-slate-950 border-amber-200 shadow-lg'
                    : 'bg-slate-900/90 text-slate-300 border-white/15'
                }`}
              >
                ⚡ SPRINT
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileSprinting(false);
                  managerRef.current?.toggleCrouchState();
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-black border transition-all cursor-pointer ${
                  stance === 'crouching'
                    ? 'bg-cyan-400 text-slate-950 border-cyan-100 shadow-lg'
                    : 'bg-slate-900/90 text-slate-300 border-white/15'
                }`}
              >
                🛡️ DUCKEN
              </button>
            </div>

            <div
              onTouchStart={handleJoystickTouchStart}
              onTouchMove={handleJoystickTouchMove}
              onTouchEnd={handleJoystickTouchEnd}
              onTouchCancel={handleJoystickTouchEnd}
              onMouseDown={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                joystickCenterRef.current = {
                  x: rect.left + rect.width / 2,
                  y: rect.top + rect.height / 2,
                };
                updateJoystickFromPoint(e.clientX, e.clientY);
                const onMove = (me: MouseEvent) => updateJoystickFromPoint(me.clientX, me.clientY);
                const onUp = () => {
                  resetJoystick();
                  window.removeEventListener('mousemove', onMove);
                  window.removeEventListener('mouseup', onUp);
                };
                window.addEventListener('mousemove', onMove);
                window.addEventListener('mouseup', onUp);
              }}
              className="relative w-28 h-28 rounded-full bg-slate-950/75 backdrop-blur-md border-2 border-emerald-400/50 shadow-2xl flex items-center justify-center touch-none cursor-pointer"
            >
              <div className="absolute top-2 text-[9px] font-mono font-bold text-emerald-400/70">VOR</div>
              <div className="absolute bottom-2 text-[9px] font-mono font-bold text-emerald-400/70">ZURÜCK</div>
              <div className="absolute left-2 text-[9px] font-mono font-bold text-emerald-400/70">L</div>
              <div className="absolute right-2 text-[9px] font-mono font-bold text-emerald-400/70">R</div>

              <div
                className={`w-12 h-12 rounded-full transition-transform duration-75 flex items-center justify-center shadow-lg border-2 ${
                  joystickVisual.active
                    ? 'bg-emerald-400 border-white text-slate-950 scale-105'
                    : 'bg-emerald-500/80 border-emerald-200 text-slate-950'
                }`}
                style={{
                  transform: `translate(${joystickVisual.x}px, ${joystickVisual.y}px)`,
                }}
              >
                <span className="text-[10px] font-mono font-black">STICK</span>
              </div>
            </div>
          </div>

          {/* RIGHT MOBILE ACTION & SHOOTER BUTTONS */}
          <div className="absolute bottom-28 lg:bottom-14 right-4 z-30 flex flex-col items-end gap-2 pointer-events-auto">
            {effectivePeacefulMode ? (
              <>
                {onOpenTycoon && (
                  <button
                    type="button"
                    onClick={onOpenTycoon}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/90 border border-amber-400/50 text-amber-300 font-black text-xs shadow-lg cursor-pointer"
                  >
                    <Building2 className="w-4 h-4" />
                    <span>STADT-TYCOON</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => managerRef.current?.collectNearbyTalerBurst()}
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-amber-500/90 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs shadow-2xl border-2 border-amber-200 cursor-pointer transition-transform"
                >
                  <Coins className="w-4 h-4" />
                  <span>TALER-SCAN</span>
                </button>
                <button
                  type="button"
                  onClick={() => managerRef.current?.triggerJump()}
                  className="flex items-center justify-center gap-1.5 w-20 h-20 rounded-full bg-emerald-500/90 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs shadow-2xl border-2 border-emerald-200 cursor-pointer transition-transform"
                >
                  <ArrowUp className="w-5 h-5 stroke-[3]" />
                  <span>SPRUNG</span>
                </button>
              </>
            ) : (
              /* FULL MOBILE 3D SHOOTER CLUSTER */
              <div className="flex flex-col items-end gap-2">
                {/* Auto-Fire, ADS & Reload Row */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMobileAutoFire((v) => !v)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-mono text-[10px] font-black border transition-all cursor-pointer ${
                      mobileAutoFire
                        ? 'bg-emerald-500 text-slate-950 border-emerald-200 shadow-lg'
                        : 'bg-slate-900/90 text-slate-300 border-white/15'
                    }`}
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                    <span>AUTO-FEUER {mobileAutoFire ? 'AN' : 'AUS'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next = managerRef.current?.toggleMobileAim() ?? false;
                      setMobileAiming(next);
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-mono text-[10px] font-black border transition-all cursor-pointer ${
                      mobileAiming
                        ? 'bg-sky-400 text-slate-950 border-white shadow-lg'
                        : 'bg-slate-900/90 text-slate-200 border-white/15'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>VISIER</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => managerRef.current?.reloadWeapon()}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-amber-300 border border-amber-400/40 font-mono text-[10px] font-black cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{ammo.magazine}/{ammo.reserve}</span>
                  </button>
                </div>

                {/* Primary Fire & Jump Cluster */}
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => managerRef.current?.triggerJump()}
                    className="flex flex-col items-center justify-center w-15 h-15 rounded-full bg-emerald-500/90 active:scale-95 text-slate-950 font-black text-[10px] shadow-xl border-2 border-emerald-200 cursor-pointer"
                  >
                    <ArrowUp className="w-4 h-4 stroke-[3]" />
                    <span>SPRUNG</span>
                  </button>

                  <button
                    type="button"
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      managerRef.current?.setMobileFireHeld(true);
                    }}
                    onTouchEnd={(e) => {
                      e.stopPropagation();
                      managerRef.current?.setMobileFireHeld(false);
                    }}
                    onTouchCancel={() => managerRef.current?.setMobileFireHeld(false)}
                    onMouseDown={() => managerRef.current?.setMobileFireHeld(true)}
                    onMouseUp={() => managerRef.current?.setMobileFireHeld(false)}
                    className="flex flex-col items-center justify-center w-22 h-22 rounded-full bg-gradient-to-br from-red-500 via-orange-500 to-amber-500 active:scale-95 text-slate-950 font-black text-xs shadow-[0_0_25px_rgba(239,68,68,0.6)] border-2 border-amber-200 cursor-pointer"
                  >
                    <Flame className="w-6 h-6 fill-slate-950" />
                    <span>FEUER</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ===================================================================== */}
      {/* BATTLE ROYALE COMBAT HUD (ACTIVE ON PC AND MOBILE COMBAT MODE!)       */}
      {/* ===================================================================== */}
      {!effectivePeacefulMode && (
        <>
          {/* WAVE ANNOUNCEMENT BANNER (TOP CENTER) */}
          {isTrainingMode ? (
            <div className="absolute top-11 left-1/2 z-20 flex w-full max-w-lg -translate-x-1/2 flex-col items-center px-4 pointer-events-none">
              <div className="flex w-full items-center justify-between rounded-2xl border border-emerald-400/50 bg-slate-950/90 px-4 py-2 shadow-xl backdrop-blur-md">
                <div>
                  <div className="flex items-center gap-2 text-sm font-black tracking-wide text-emerald-300">
                    <Target className="h-4 w-4" />
                    SCHIESSSTAND
                  </div>
                  <div className="text-[10px] font-mono text-slate-300">Keine Gegner greifen an · bewegte Ziele zum Testen</div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-[10px] uppercase text-slate-400">Treffer</div>
                  <div className="text-lg font-black tabular-nums text-white">{kills}</div>
                </div>
              </div>
            </div>
          ) : (
            waveInfo && (
              <div
                className={`absolute ${
                  isMobileMode ? 'top-20' : 'top-11'
                } left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-20 w-full max-w-lg px-4`}
              >
                {waveInfo.status === 'cleared' ? (
                  <div className="flex flex-col items-center gap-1 p-2.5 rounded-2xl bg-amber-500/95 backdrop-blur-md text-slate-950 font-black shadow-2xl border border-white/50 text-center w-full">
                    <div className="flex items-center gap-2 text-sm tracking-wide">
                      <Sparkles className="w-4 h-4 fill-slate-950" />
                      <span>WELLE {waveInfo.wave} ERFOLGREICH ABGEWEHRT!</span>
                    </div>
                    <div className="text-[11px] font-mono font-bold text-slate-900 bg-white/40 px-3 py-0.5 rounded-full">
                      Nächste Welle in{' '}
                      <span className="text-red-700 text-xs font-black">{waveInfo.intermissionCountdown ?? 5}s</span> ·
                      Wähle deine Einsatz-Direktive!
                    </div>
                  </div>
                ) : waveInfo.status === 'boss' ? (
                  <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-slate-950/95 backdrop-blur-md border-2 border-red-500/70 shadow-2xl w-full">
                    <div className="flex items-center justify-between w-full font-mono text-xs font-black text-red-400">
                      <div className="flex items-center gap-1.5">
                        <Skull className="w-4 h-4 text-red-500 animate-bounce" />
                        <span>{waveInfo.title}</span>
                      </div>
                      <span className="text-white bg-red-600/80 px-2 py-0.5 rounded font-mono text-[10px]">
                        {waveInfo.bossInfo ? `${waveInfo.bossInfo.health} / ${waveInfo.bossInfo.maxHealth} HP` : 'BOSS'}
                      </span>
                    </div>
                    {waveInfo.bossInfo && (
                      <div className="w-full h-2.5 rounded-full bg-slate-900 border border-red-500/50 p-0.5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-red-500 transition-all duration-150"
                          style={{ width: `${(waveInfo.bossInfo.health / waveInfo.bossInfo.maxHealth) * 100}%` }}
                        />
                      </div>
                    )}
                    <div className="text-[10px] text-red-300/80 font-mono text-center">
                      {waveInfo.subtitle}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-3 px-4 py-1.5 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-amber-500/40 shadow-xl">
                      <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black text-[11px] font-mono tracking-wider">
                        {waveInfo.title}
                      </span>
                      <div className="flex items-center gap-1 text-slate-200 text-xs font-mono">
                        <Skull className="w-3.5 h-3.5 text-red-400" />
                        <span className="font-bold text-white tabular-nums">{waveInfo.remainingEnemies}</span>
                        <span className="text-slate-400 text-[10px]">/ {waveInfo.totalEnemies} GEGNER</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          )}

          {/* ROGUELITE WAVE INTERMISSION PERK DRAFT ("TAKTISCHE EINSATZ-DIREKTIVE") */}
          {perkDraftOptions.length > 0 && !gameOverState?.over && (
            <div className="absolute top-28 left-1/2 -translate-x-1/2 z-40 w-[94vw] max-w-2xl rounded-3xl border-2 border-amber-400 bg-slate-950/95 p-4 shadow-[0_0_50px_rgba(245,158,11,0.45)] backdrop-blur-md pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-[10px] font-mono font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>ROGUELITE FELD-UPGRADE · TASTE [7] [8] [9] ODER ANTIPPEN</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    Wähle 1 Taktische Einsatz-Direktive für diesen Kampf:
                  </h3>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-400/50 text-amber-300 font-mono text-xs font-black">
                  Welle {waveInfo.wave} Bonus
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {perkDraftOptions.map((perk, idx) => (
                  <button
                    key={perk.id}
                    type="button"
                    onClick={() => handleSelectPerk(perk)}
                    className="group flex flex-col justify-between p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border-2 border-white/15 hover:border-amber-400 text-left transition-all cursor-pointer shadow-lg hover:scale-[1.02]"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className="px-2 py-0.5 rounded text-[9px] font-mono font-black uppercase"
                          style={{ backgroundColor: `${perk.accentColor}25`, color: perk.accentColor }}
                        >
                          {perk.badge}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] font-black">
                          [{idx + 7}]
                        </span>
                      </div>
                      <div className="text-sm font-black text-white group-hover:text-amber-300 transition-colors">
                        {perk.title}
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                        {perk.description}
                      </p>
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-white/10 text-[10px] font-mono font-black text-amber-400 flex items-center justify-between">
                      <span>AKTIVIEREN</span>
                      <span>→</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* KILL STREAK & ABILITY BANNER */}
          {(killStreakNotice || abilityBanner) && (
            <div className="absolute top-26 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-2 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500 text-slate-950 font-black text-xs sm:text-sm shadow-[0_0_30px_rgba(245,158,11,0.6)] border-2 border-white animate-bounce z-30 pointer-events-none">
              <Flame className="w-4 h-4 fill-slate-950" />
              <span>{abilityBanner || killStreakNotice}</span>
            </div>
          )}

          {/* CROSSHAIR & HIT MARKER (CENTER OF SCREEN - TIGHTENS WHEN CROUCHING) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div
              className={`relative flex items-center justify-center transition-all duration-150 ${
                stance === 'crouching'
                  ? 'w-7 h-7'
                  : stance === 'sprinting'
                  ? 'w-14 h-14 opacity-75'
                  : 'w-10 h-10'
              }`}
            >
              <div className="absolute w-2.5 h-[2px] bg-white/90 left-0 shadow-sm" />
              <div className="absolute w-2.5 h-[2px] bg-white/90 right-0 shadow-sm" />
              <div className="absolute h-2.5 w-[2px] bg-white/90 top-0 shadow-sm" />
              <div className="absolute h-2.5 w-[2px] bg-white/90 bottom-0 shadow-sm" />
              <div className="w-1 h-1 rounded-full bg-white shadow-sm" />

              {/* Fortnite Circular Reload Ring around Reticle */}
              {isReloading && (
                <div className="absolute -inset-5 flex items-center justify-center pointer-events-none">
                  <svg className="w-16 h-16 -rotate-90 animate-spin" style={{ animationDuration: '1.6s' }} viewBox="0 0 36 36">
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke="rgba(245, 158, 11, 0.25)"
                      strokeWidth="3.5"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="3.5"
                      strokeDasharray="88"
                      strokeDashoffset="28"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute -bottom-6 text-[10px] font-mono font-black text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] tracking-widest whitespace-nowrap">
                    LÄDT NACH…
                  </span>
                </div>
              )}

              {hitMarkerActive && (
                <div className="absolute inset-0 flex items-center justify-center animate-ping">
                  <div
                    className={`w-6 h-6 border-2 rotate-45 ${
                      isCritHitMarker ? 'border-amber-300 scale-125' : 'border-red-500'
                    }`}
                  />
                </div>
              )}
            </div>
          </div>

          {/* TOP LEFT: 2D TACTICAL RADAR MINIMAP + SQUAD TELEMETRY */}
          <div className="hidden md:flex flex-col gap-2.5 absolute top-4 left-4 w-72 pointer-events-auto z-20">
            {/* LIVE 2D TACTICAL RADAR & SQUAD HEADER */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-white/15 shadow-2xl">
              {/* Circular Radar Screen */}
              <div
                className="relative w-24 h-24 rounded-full bg-slate-900 border-2 border-emerald-500/50 shadow-[inset_0_0_18px_rgba(16,185,129,0.25)] overflow-hidden shrink-0"
                title="Live 2D Taktik-Radar (Grün = Squad, Rot = Wehrheimer, Gelb = Beute)"
              >
                {/* Radar Grid Rings & Crosshair */}
                <div className="absolute inset-2 rounded-full border border-emerald-500/20" />
                <div className="absolute inset-6 rounded-full border border-emerald-500/15" />
                <div className="absolute inset-y-0 left-1/2 w-[1px] bg-emerald-500/20" />
                <div className="absolute inset-x-0 top-1/2 h-[1px] bg-emerald-500/20" />

                {/* Storm Circle Indicator */}
                {(() => {
                  const radarScale = 48 / 55; // 55m world radius -> 48px radar radius
                  const stormPx = Math.min(96, Math.max(12, radarState.stormRadius * radarScale * 2));
                  return (
                    <div
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-purple-400/60 pointer-events-none"
                      style={{ width: `${stormPx}px`, height: `${stormPx}px` }}
                    />
                  );
                })()}

                {/* Player View Cone (Center) */}
                <div
                  className="absolute left-1/2 top-1/2 w-0 h-0 -translate-x-1/2 -translate-y-1/2"
                  style={{
                    transform: `translate(-50%, -50%) rotate(${(-radarState.playerYaw * 180) / Math.PI}deg)`,
                  }}
                >
                  <div
                    className="w-6 h-8 -translate-x-1/2 -translate-y-full opacity-30"
                    style={{
                      background: 'linear-gradient(to top, rgba(16,185,129,0.8), transparent)',
                      clipPath: 'polygon(50% 100%, 0% 0%, 100% 0%)',
                    }}
                  />
                </div>

                {/* Radar Blips (Player-relative) */}
                {radarState.blips.map((blip) => {
                  const dx = (blip.x - radarState.playerX) * 0.95;
                  const dz = (blip.z - radarState.playerZ) * 0.95;
                  const clampedX = Math.max(-42, Math.min(42, dx));
                  const clampedZ = Math.max(-42, Math.min(42, dz));
                  const colorClass =
                    blip.kind === 'boss'
                      ? 'w-3 h-3 bg-red-500 ring-2 ring-amber-300 animate-ping'
                      : blip.kind === 'enemy'
                      ? 'w-2 h-2 bg-red-500 shadow-[0_0_4px_#ef4444]'
                      : blip.kind === 'ally'
                      ? 'w-2 h-2 bg-sky-400'
                      : 'w-1.5 h-1.5 bg-amber-400';

                  return (
                    <span
                      key={blip.id}
                      className={`absolute rounded-full -translate-x-1/2 -translate-y-1/2 ${colorClass}`}
                      style={{
                        left: `${48 + clampedX}px`,
                        top: `${48 + clampedZ}px`,
                      }}
                    />
                  );
                })}

                {/* Player Center Dot */}
                <span className="absolute left-1/2 top-1/2 w-2.5 h-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400 border border-white shadow" />
              </div>

              {/* Operator & Level Summary Next to Radar */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                  <span className="text-emerald-400 flex items-center gap-1 truncate">
                    <Users className="w-3 h-3 shrink-0" />
                    <span>[{clanTag}]</span>
                  </span>
                  <span className="text-amber-400 tabular-nums font-black">{score} Pkt</span>
                </div>

                <div className="text-xs font-black text-white truncate">
                  {playerName}
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center justify-between text-[10px] font-mono text-amber-300">
                    <span>LVL {playerLevel}</span>
                    <span>{playerExperience}/{experienceToNextLevel} XP</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-amber-400 transition-all duration-200"
                      style={{ width: `${Math.min(100, (playerExperience / experienceToNextLevel) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className={isReloading ? 'text-amber-300 animate-pulse' : 'text-sky-300'}>
                    {isReloading ? `LÄDT ${reloadSeconds.toFixed(1)}s` : 'MAGAZIN'}
                  </span>
                  <span className="text-white font-black tabular-nums">
                    {ammo.magazine}/{ammo.reserve}
                  </span>
                </div>
              </div>
            </div>

            {/* SQUAD ALLIES & ACTIVE MATCH PERKS */}
            <div className="p-3 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-white/10 shadow-xl space-y-1.5">
              {allies.map((ally, idx) => (
                <div key={ally.id} className="space-y-0.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-300 truncate">
                      {idx + 2}. {ally.name}
                    </span>
                    <span
                      className={`font-bold tabular-nums ${
                        ally.health > 0 ? 'text-emerald-400' : 'text-red-500 line-through'
                      }`}
                    >
                      {ally.health > 0 ? `${ally.health}` : 'K.O.'}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-sky-500 transition-all duration-200"
                      style={{ width: `${(ally.health / ally.maxHealth) * 100}%` }}
                    />
                  </div>
                </div>
              ))}

              {/* Active Roguelite Match Perks Badges */}
              {activeMatchPerks.length > 0 && (
                <div className="pt-1.5 border-t border-white/10 flex flex-wrap gap-1">
                  {activeMatchPerks.map((pId) => {
                    const pDef = MATCH_PERK_POOL.find((p) => p.id === pId);
                    if (!pDef) return null;
                    return (
                      <span
                        key={pId}
                        className="px-2 py-0.5 rounded-md text-[9px] font-mono font-black border"
                        style={{
                          borderColor: `${pDef.accentColor}66`,
                          backgroundColor: `${pDef.accentColor}20`,
                          color: pDef.accentColor,
                        }}
                        title={pDef.description}
                      >
                        ★ {pDef.title}
                      </span>
                    );
                  })}
                </div>
              )}

              <div className="pt-1 border-t border-white/10 text-[10px] font-mono text-slate-400 flex flex-col gap-0.5">
                <div className="flex items-center justify-between">
                  <span>[Q] Nova · [E] Dash · [F] Luftschlag</span>
                </div>
                <div className="flex items-center justify-between text-amber-400">
                  <span>Rechtsklick: Visier</span>
                  <span>[1-4]: Waffen</span>
                </div>
              </div>
            </div>

            {/* ACTIVE DAILY MISSION HUD WIDGET */}
            {activeDailyMission && (
              <div
                onClick={() => {
                  managerRef.current?.unlockPointer();
                  onOpenDailyMissions?.();
                }}
                className="p-2.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-amber-500/30 hover:border-amber-400 transition-all cursor-pointer pointer-events-auto shadow-xl"
                title="Klicken für alle Tagesbefehle & Belohnungen"
              >
                <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                    <Target className="w-3 h-3" />
                    <span>TAGESBEFEHL:</span>
                    <span className="text-slate-300 font-normal truncate max-w-[110px]">
                      {activeDailyMission.badge}
                    </span>
                  </div>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-black tabular-nums ${
                      activeDailyMission.completed
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-amber-400'
                    }`}
                  >
                    {activeDailyMission.currentProgress}/{activeDailyMission.targetCount}
                  </span>
                </div>
                <div className="text-[11px] font-bold text-white truncate mb-1">
                  {activeDailyMission.description}
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-200 ${
                      activeDailyMission.completed ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        (activeDailyMission.currentProgress / activeDailyMission.targetCount) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* TOP RIGHT: STORM, SCORE, ADRENALINE COMBO METER & LIVE KILLFEED */}
          <div className="absolute top-12 right-4 flex flex-col items-end gap-2 pointer-events-auto z-20">
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-950/85 backdrop-blur-md border border-white/10 shadow-xl text-white font-mono">
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                  {isTrainingMode ? 'Freies Training' : `Taunus-Nebel (${zoneRadius}m)`}
                </span>
                <span className="text-sm font-black tabular-nums text-white">
                  {isTrainingMode ? 'Keine Zone' : zoneTimer > 0 ? `${zoneTimer}s` : 'ZONE VERENGT'}
                </span>
              </div>
              <div className="w-[1px] h-6 bg-slate-800" />
              <div className="flex items-center gap-1.5 text-red-400 text-sm font-bold">
                <Skull className="w-4 h-4" />
                <span className="tabular-nums">{kills}</span>
              </div>
              {onOpenLeaderboard && (
                <>
                  <div className="w-[1px] h-6 bg-slate-800" />
                  <button
                    type="button"
                    onClick={() => {
                      managerRef.current?.unlockPointer();
                      onOpenLeaderboard();
                    }}
                    className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
                    title="Echtes Spieler-Leaderboard öffnen"
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Rangliste</span>
                  </button>
                </>
              )}
            </div>

            {/* ADRENALINE COMBO MULTIPLIER WIDGET */}
            {comboState.multiplier > 1 && (
              <div className="w-56 p-2.5 rounded-2xl bg-gradient-to-r from-amber-500/25 via-orange-500/20 to-red-500/25 backdrop-blur-md border-2 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.35)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-400 fill-amber-400 animate-bounce" />
                    <span className="text-[10px] font-mono font-black uppercase tracking-wider text-amber-300">
                      ADRENALIN-COMBO
                    </span>
                  </div>
                  <span className="text-xl font-black font-mono text-white drop-shadow">
                    x{comboState.multiplier}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-900 mt-1.5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-red-500 transition-all duration-100"
                    style={{ width: `${Math.max(0, Math.min(100, comboState.timerRatio * 100))}%` }}
                  />
                </div>
              </div>
            )}

            {/* ACTIVE WEHRHEIMER TARGET TELEMETRY */}
            {currentTarget && (
              <div className="w-56 p-3 rounded-xl bg-slate-950/85 backdrop-blur-md border border-red-500/50 shadow-xl text-left">
                <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                  <span className="text-red-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    <span>ZIEL:</span>
                  </span>
                  <span className="text-amber-400 font-bold tabular-nums">
                    {currentTarget.distance}m
                  </span>
                </div>
                <div className="text-xs font-bold text-white truncate mb-1">
                  {currentTarget.name}
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-red-500 transition-all duration-200"
                    style={{ width: `${(currentTarget.health / currentTarget.maxHealth) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* LIVE ARCADE KILLFEED POPUPS */}
            {killFeedList.length > 0 && (
              <div className="hidden sm:flex flex-col items-end gap-1 pointer-events-none">
                {killFeedList.map((kf) => (
                  <div
                    key={kf.id}
                    className={`flex items-center gap-2 px-3 py-1 rounded-xl border text-[10px] font-mono font-bold shadow-lg backdrop-blur-md ${
                      kf.isBoss
                        ? 'bg-red-950/90 border-amber-400 text-amber-300'
                        : kf.isCrit
                        ? 'bg-amber-950/85 border-amber-400/60 text-amber-200'
                        : 'bg-slate-950/80 border-white/10 text-slate-200'
                    }`}
                  >
                    <span>{kf.label}</span>
                    <span className="text-emerald-400 font-black">+{kf.points}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* POINTER LOCK HELPER BANNER (PC ONLY) */}
          {!isMobileMode && !isPointerLocked && !gameOverState?.over && perkDraftOptions.length === 0 && (
            <div
              onClick={() => managerRef.current?.requestLock()}
              className="absolute top-24 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-2xl cursor-pointer hover:bg-amber-400 transition-colors z-30"
            >
              <MousePointer className="w-3.5 h-3.5" />
              <span>Klicke ins Bild für 360°-Maussteuerung · [Q/E/F] Fähigkeiten · [1-4] Waffen · [R] Nachladen</span>
            </div>
          )}

          {/* GEMINI PRO COMMANDER BARK (FLOATING MID-LEFT) */}
          {latestCommanderBark && (
            <div className="hidden lg:block absolute top-80 left-4 max-w-xs px-3.5 py-2 rounded-xl bg-slate-950/85 backdrop-blur-md border border-amber-500/30 shadow-lg pointer-events-auto z-20">
              <div className="flex items-center gap-1.5 mb-0.5 text-[10px] font-bold text-amber-400 font-mono">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Oberkommando Feldberg-Stier:</span>
              </div>
              <p className="text-[11px] text-slate-200 italic leading-snug">
                "{latestCommanderBark}"
              </p>
            </div>
          )}

          {/* ===================================================================== */}
          {/* 3 TACTICAL OPERATOR ABILITIES BAR ([Q] NOVA, [E] DASH, [F] LUFTSCHLAG) */}
          {/* ===================================================================== */}
          <div
            className={`absolute ${
              isMobileMode ? 'bottom-56 left-1/2 -translate-x-1/2' : 'bottom-16 left-1/2 -translate-x-1/2'
            } flex items-center gap-2 z-30 pointer-events-auto`}
          >
            {[
              {
                id: 'shockwave' as const,
                keyLabel: 'Q',
                name: 'Bembel-Nova',
                desc: 'AoE + 35 Schild',
                cd: abilityCooldowns.shockwave,
                maxCd: abilityCooldowns.shockwaveMax,
                icon: Zap,
                accent: 'border-amber-400 text-amber-300 bg-amber-500/20',
              },
              {
                id: 'dash' as const,
                keyLabel: 'E',
                name: 'Taktik-Dash',
                desc: 'Schub + Munition',
                cd: abilityCooldowns.dash,
                maxCd: abilityCooldowns.dashMax,
                icon: Wind,
                accent: 'border-cyan-400 text-cyan-300 bg-cyan-500/20',
              },
              {
                id: 'overdrive' as const,
                keyLabel: 'F',
                name: 'Luftschlag',
                desc: '3x Orbit + Overdrive',
                cd: abilityCooldowns.overdrive,
                maxCd: abilityCooldowns.overdriveMax,
                icon: Flame,
                accent: abilityCooldowns.overdriveActive
                  ? 'border-yellow-300 text-slate-950 bg-amber-400 animate-pulse'
                  : 'border-red-400 text-red-300 bg-red-500/20',
              },
            ].map((ab) => {
              const Icon = ab.icon;
              const isReady = ab.cd <= 0;
              const ratio = ab.maxCd > 0 ? Math.max(0, Math.min(1, ab.cd / ab.maxCd)) : 0;

              return (
                <button
                  key={ab.id}
                  type="button"
                  onClick={() => managerRef.current?.triggerAbility(ab.id)}
                  className={`relative overflow-hidden flex items-center gap-2 px-3 py-2 rounded-2xl border-2 backdrop-blur-md shadow-2xl transition-all cursor-pointer ${
                    isReady
                      ? `${ab.accent} hover:scale-105`
                      : 'border-slate-700 bg-slate-950/90 text-slate-500 opacity-80'
                  }`}
                  title={`${ab.name} [${ab.keyLabel}]: ${ab.desc}`}
                >
                  {/* Cooldown Fill Overlay */}
                  {!isReady && (
                    <div
                      className="absolute inset-y-0 left-0 bg-slate-800/80 pointer-events-none transition-all duration-100"
                      style={{ width: `${ratio * 100}%` }}
                    />
                  )}
                  <div className="relative z-10 flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-slate-950/90 text-white font-mono text-[10px] font-black">
                      [{ab.keyLabel}]
                    </span>
                    <Icon className="w-4 h-4 shrink-0" />
                    <div className="text-left leading-tight">
                      <div className="text-[11px] font-black text-white">{ab.name}</div>
                      <div className="text-[9px] font-mono">
                        {isReady ? ab.desc : `${ab.cd.toFixed(1)}s`}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* FORTNITE STYLE HEALTH & SHIELD STACK (BOTTOM LEFT ON PC, TOP-LEFT COMPACT ON MOBILE) */}
          <div
            className={`absolute ${
              isMobileMode ? 'top-24 left-3 w-44' : 'bottom-14 left-6 w-64 md:w-80'
            } flex flex-col gap-1.5 pointer-events-auto z-20`}
          >
            {!isMobileMode && (
              <div className="flex items-center justify-between px-3 py-1 rounded-xl bg-slate-950/90 backdrop-blur-md border border-white/10 font-mono text-[10px]">
                <span className="text-slate-400 uppercase font-bold">HALTUNG:</span>
                {stance === 'sprinting' ? (
                  <span className="text-amber-400 font-black tracking-wider flex items-center gap-1">
                    ⚡ TAKTISCHER SPRINT [SHIFT]
                  </span>
                ) : stance === 'crouching' ? (
                  <span className="text-cyan-400 font-black tracking-wider flex items-center gap-1">
                    🛡️ GEDUCKT [STRG] (-35% Rückstoß)
                  </span>
                ) : (
                  <span className="text-emerald-400 font-bold tracking-wider">
                    STEHEND [SHIFT Sprint · STRG Ducken]
                  </span>
                )}
              </div>
            )}

            {/* Fortnite Shield Bar (Electric Cyan) */}
            <div className="space-y-0.5">
              <div className="flex items-center justify-between text-[11px] font-mono font-black text-cyan-300 drop-shadow">
                <div className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 fill-cyan-400 text-cyan-300" />
                  <span className="tracking-wider">SCHILD</span>
                </div>
                <span className="tabular-nums text-xs sm:text-sm font-black text-white">
                  {Math.round(shield)} <span className="text-[10px] text-cyan-400/80 font-normal">/ {maxShield}</span>
                </span>
              </div>
              <div className="w-full h-3 sm:h-4 rounded-xl bg-slate-950/90 border-2 border-cyan-400/60 p-0.5 shadow-[0_0_15px_rgba(6,182,212,0.35)] overflow-hidden">
                <div
                  className="h-full rounded-lg bg-gradient-to-r from-cyan-500 via-sky-400 to-cyan-300 transition-all duration-200"
                  style={{ width: `${(shield / maxShield) * 100}%` }}
                />
              </div>
            </div>

            {/* Fortnite Health Bar (Lime Green) */}
            <div className="space-y-0.5">
              <div className="flex items-center justify-between text-[11px] font-mono font-black text-emerald-300 drop-shadow">
                <div className="flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 fill-emerald-400 text-emerald-300" />
                  <span className="tracking-wider">LEBEN</span>
                </div>
                <span className="tabular-nums text-xs sm:text-sm font-black text-white">
                  {Math.round(health)} <span className="text-[10px] text-emerald-400/80 font-normal">/ {maxHealth}</span>
                </span>
              </div>
              <div className="w-full h-3 sm:h-4 rounded-xl bg-slate-950/90 border-2 border-emerald-400/60 p-0.5 shadow-[0_0_15px_rgba(16,185,129,0.35)] overflow-hidden">
                <div
                  className="h-full rounded-lg bg-gradient-to-r from-emerald-600 via-green-500 to-lime-400 transition-all duration-200"
                  style={{ width: `${(health / maxHealth) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* FORTNITE WEAPONS & BIG AMMO HUD (BOTTOM RIGHT ON PC, COMPACT TOP-CENTER/BOTTOM ON MOBILE) */}
          <div
            className={`absolute ${
              isMobileMode ? 'bottom-16 left-1/2 -translate-x-1/2' : 'bottom-14 right-6'
            } flex flex-col items-end gap-2 pointer-events-auto z-20`}
          >
            {/* BIG FORTNITE AMMO DISPLAY (PC Only) */}
            {!isMobileMode && (
              <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-950/92 backdrop-blur-md border-2 border-slate-700/80 shadow-2xl font-mono text-right">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {abilityCooldowns.overdriveActive ? (
                      <span className="text-amber-300 animate-pulse flex items-center gap-1 justify-end">
                        ⚡ OVERDRIVE AKTIV (UNENDLICH MAGAZIN!)
                      </span>
                    ) : isReloading ? (
                      <span className="text-amber-400 animate-pulse flex items-center gap-1 justify-end">
                        ⚡ NACHLADEN [{reloadSeconds.toFixed(1)}s]
                      </span>
                    ) : ammo.magazine === 0 ? (
                      <span className="text-red-400 animate-bounce font-black flex items-center gap-1 justify-end">
                        ⚠️ LEER · DRÜCKE [R]
                      </span>
                    ) : (
                      <span className="text-sky-300">MAGAZIN · [R] LÄDT</span>
                    )}
                  </div>
                  <div className="flex items-baseline justify-end gap-1.5">
                    <span
                      className={`text-4xl sm:text-5xl font-black tabular-nums tracking-tight ${
                        abilityCooldowns.overdriveActive
                          ? 'text-amber-300'
                          : isReloading
                          ? 'text-amber-400 animate-pulse'
                          : ammo.magazine <= 3
                          ? 'text-red-400 animate-pulse'
                          : 'text-white'
                      }`}
                    >
                      {abilityCooldowns.overdriveActive ? '∞' : ammo.magazine}
                    </span>
                    <span className="text-xl font-bold text-slate-400 tabular-nums">
                      / {ammo.reserve}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Live weapon status: upgrades are shown as combat telemetry */}
            {!isMobileMode && (
              <div className="hidden sm:flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-950/90 px-3 py-1.5 text-[10px] font-mono shadow-lg">
                <span
                  className="font-bold mr-1"
                  style={{ color: activeWeaponStats.rarityObj.colorHex }}
                >
                  {mod.label} {mod.lv}
                </div>
              ))}
            </div>

            {/* Active weapon readout */}
            <div className="w-full max-w-[22rem] rounded-2xl border border-white/15 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-md">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    <Crosshair className="h-3.5 w-3.5 text-amber-400" />
                    <span>Aktive Waffe · LV. {activeWeaponStats.weaponLevel}/{MAX_WEAPON_LEVEL}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Active weapon readout (PC) */}
            {!isMobileMode && (
              <div className="w-full max-w-[22rem] rounded-2xl border border-white/15 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                      <Crosshair className="h-3.5 w-3.5 text-amber-400" />
                      Aktive Waffe
                    </div>
                    <div className="mt-1 truncate text-lg font-black text-white">
                      {activeWeaponStats.displayName}
                    </div>
                    <div className="mt-0.5 truncate text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      {activeWeaponObj.codArchetype}
                    </div>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    <span className="truncate">{activeWeaponObj.codArchetype}</span>
                    {activeWeaponStats.masteryObj.id !== 'standard' && (
                      <span
                        className="px-1.5 py-0.2 rounded border text-[9px] font-black shrink-0"
                        style={{
                          color: activeWeaponStats.masteryObj.colorHex,
                          borderColor: activeWeaponStats.masteryObj.colorHex,
                        }}
                      >
                        {activeWeaponStats.masteryObj.name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3 text-[10px] font-mono">
                  <span className="font-bold" style={{ color: activeWeaponStats.rarityObj.colorHex }}>
                    {activeWeaponStats.rarityObj.name}
                  </span>
                  <span className="text-slate-400">{activeWeaponStats.damage} DMG · {activeWeaponObj.fireRate.toFixed(1)} SCHUSS/S</span>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 text-[10px] font-mono">
                <span className="font-bold" style={{ color: activeWeaponStats.rarityObj.colorHex }}>
                  {activeWeaponStats.rarityObj.name}
                </span>
                <span className="text-slate-400">{activeWeaponStats.damage} DMG · {activeWeaponStats.fireRate.toFixed(1)} SCHUSS/S</span>
              </div>
              {/* Weapon Level XP Bar */}
              <div className="mt-1.5 space-y-0.5 font-mono">
                <div className="flex items-center justify-between text-[9px] text-amber-300/90">
                  <span>WAFFEN-XP (LV. {activeWeaponStats.weaponLevel})</span>
                  <span>
                    {activeWeaponStats.weaponLevel >= MAX_WEAPON_LEVEL
                      ? 'MAX-LEVEL 30'
                      : `${activeWeaponState?.weaponXp || 0} / ${activeWeaponXpNext} XP`}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 transition-all duration-200"
                    style={{
                      width: `${
                        activeWeaponStats.weaponLevel >= MAX_WEAPON_LEVEL
                          ? 100
                          : Math.min(100, ((activeWeaponState?.weaponXp || 0) / activeWeaponXpNext) * 100)
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Four-slot weapon hotbar */}
            <div className="flex items-center gap-1.5 sm:gap-2 rounded-2xl border-2 border-white/15 bg-slate-950/95 p-1.5 sm:p-2 shadow-2xl">
              {Object.values(WEAPONS).map((w, idx) => {
                const isSelected = activeWeapon === w.id;
                const wState = weaponUpgrades[w.id];
                const wStats = getEffectiveWeaponStats(w, wState);

                const tier = wStats.rarityObj.tier;
                const rarityBg =
                  tier === 5
                    ? 'bg-gradient-to-b from-amber-500/35 via-yellow-500/20 to-amber-950/70 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                    : tier === 4
                    ? 'bg-gradient-to-b from-purple-500/35 via-fuchsia-500/20 to-purple-950/70 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                    : tier === 3
                    ? 'bg-gradient-to-b from-sky-500/35 via-cyan-500/20 to-blue-950/70 border-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.4)]'
                    : tier === 2
                    ? 'bg-gradient-to-b from-emerald-500/35 via-green-500/20 to-emerald-950/70 border-emerald-400'
                    : 'bg-gradient-to-b from-slate-700/35 via-slate-800/20 to-slate-950/70 border-slate-600';

                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => selectWeapon(w.id)}
                    className={`relative flex flex-col items-center justify-between ${
                      isMobileMode ? 'w-14 h-14 p-1.5' : 'w-18 h-18 sm:w-20 sm:h-20 p-2'
                    } rounded-2xl border-2 transition-all cursor-pointer ${rarityBg} ${
                      isSelected
                        ? 'scale-105 shadow-[0_0_24px_rgba(251,191,36,0.45)] ring-2 ring-amber-300 border-amber-200'
                        : 'opacity-75 hover:opacity-100 hover:scale-105'
                    }`}
                    aria-label={`${wStats.displayName}, Slot ${idx + 1}`}
                  >
                    <div className="flex items-center justify-between w-full text-[9px] sm:text-[10px] font-mono font-black">
                      <span className="px-1 py-0.5 rounded-md bg-slate-900/90 text-white shadow">
                        [{idx + 1}]
                      </span>
                      <span className="text-emerald-300 font-bold">
                        Lv.{wStats.weaponLevel}
                      </span>
                    </div>
                    <span className="text-[10px] sm:text-xs font-black text-white text-center leading-tight truncate w-full drop-shadow">
                      {wStats.displayName.split(' ')[0]}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-mono text-amber-300 tabular-nums font-black drop-shadow">
                      {wStats.damage} DMG
                    </span>
                  </button>
                );
              })}
            </div>

            {weaponSwitchNotice && (
              <div className="rounded-xl border border-amber-300/70 bg-amber-400 px-4 py-2 text-center text-xs font-black uppercase tracking-wider text-slate-950 shadow-[0_0_24px_rgba(251,191,36,0.45)] animate-in fade-in slide-in-from-right-2 duration-150">
                Waffe gewechselt · {weaponSwitchNotice}
              </div>
            )}
          </div>
        </>
      )}

      {/* LOOT & TALER NOTIFICATION TOAST */}
      {lootNotification && (
        <div className="absolute top-32 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow-xl border border-white/40 z-30">
          {lootNotification}
        </div>
      )}

      {/* LOCKED ARENA UNLOCK PROMPT POPUP */}
      {lockedArenaPrompt && ARENA_UNLOCK_RULES[lockedArenaPrompt] && (
        <div className="absolute bottom-28 lg:bottom-14 left-1/2 -translate-x-1/2 p-4 rounded-2xl bg-slate-950/95 backdrop-blur-md border border-amber-500/60 shadow-2xl z-30 flex flex-col sm:flex-row items-center gap-4 max-w-lg w-[92vw]">
          <div className="flex-1 text-left">
            <div className="text-[10px] font-mono text-amber-400 uppercase">
              MAP GESPERRT · {ARENA_UNLOCK_RULES[lockedArenaPrompt].difficultyLabel}
            </div>
            <div className="text-sm font-bold text-white">
              {ARENAS[lockedArenaPrompt]?.name}
            </div>
            <div className="text-xs text-slate-300 mt-0.5">
              Benötigt {ARENA_UNLOCK_RULES[lockedArenaPrompt].requiredWins} Siege (aktuell {totalWins}) oder Sofort-Freischaltung für {ARENA_UNLOCK_RULES[lockedArenaPrompt].unlockCostNAT} NAT.
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {budget >= ARENA_UNLOCK_RULES[lockedArenaPrompt].unlockCostNAT && onUnlockMap ? (
              <button
                type="button"
                onClick={() => {
                  const rule = ARENA_UNLOCK_RULES[lockedArenaPrompt];
                  soundFx.playLevelUp();
                  onUnlockMap(lockedArenaPrompt, rule.unlockCostNAT);
                  onChangeArena(lockedArenaPrompt);
                  setLockedArenaPrompt(null);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Für {ARENA_UNLOCK_RULES[lockedArenaPrompt].unlockCostNAT} NAT freischalten</span>
              </button>
            ) : (
              <span className="text-xs font-mono text-slate-400">
                Noch {Math.max(0, ARENA_UNLOCK_RULES[lockedArenaPrompt].unlockCostNAT - budget)} NAT nötig
              </span>
            )}
            <button
              type="button"
              onClick={() => setLockedArenaPrompt(null)}
              className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono cursor-pointer"
            >
              Schließen
            </button>
          </div>
        </div>
      )}

      {/* 7 NEU-ANSPACH ARENA SELECTOR BAR WITH UNLOCK PROGRESSION (BOTTOM CENTER) */}
      <div className="absolute bottom-16 lg:bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/90 backdrop-blur-md border border-white/15 text-[11px] font-mono text-slate-300 pointer-events-auto z-20 max-w-[96vw] overflow-x-auto shadow-2xl">
        <span className="text-amber-400 font-bold flex items-center gap-1 pr-1 shrink-0">
          <Layers className="w-3.5 h-3.5" />
          <span>MAPS ({unlockedMaps.length}/7):</span>
        </span>
        {Object.values(ARENAS).map((a) => {
          const isUnlocked = checkArenaUnlocked(a.id, totalWins, unlockedMaps);
          const isCurrent = currentArena === a.id;
          const mLv = mapLevels[a.id] || 1;

          return (
            <button
              key={a.id}
              type="button"
              onClick={() => {
                if (isUnlocked) {
                  setLockedArenaPrompt(null);
                  onChangeArena(a.id);
                } else {
                  setLockedArenaPrompt(a.id);
                }
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isCurrent
                  ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                  : isUnlocked
                  ? 'hover:bg-slate-800 hover:text-white text-slate-200'
                  : 'bg-slate-900/80 text-slate-500 hover:text-slate-300 border border-slate-800'
              }`}
            >
              {!isUnlocked && <Lock className="w-3 h-3 text-amber-400/80 shrink-0" />}
              <span>
                {a.name
                  .replace('Freilichtmuseum ', '')
                  .replace(' Neu-Anspach', '')
                  .replace(' (Taunusbahn)', '')}
              </span>
              {isUnlocked && (
                <span className={`text-[9px] px-1 rounded ${isCurrent ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-amber-400'}`}>
                  Lv.{mLv}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {showSettings && (
        <div
          className="absolute inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          onClick={() => setShowSettings(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl border border-amber-400/40 bg-slate-900 p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={captureControl}
            tabIndex={-1}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-amber-400">
                  <Settings className="h-4 w-4" />
                  Steuerung & Maus
                </div>
                <h2 className="mt-1 text-2xl font-black text-white">Taktik-Einstellungen</h2>
                <p className="mt-1 text-xs text-slate-400">Änderungen werden automatisch auf diesem Gerät gespeichert.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                aria-label="Einstellungen schließen"
              >
                ×
              </button>
            </div>

            <div className="mb-6 rounded-2xl border border-sky-400/20 bg-sky-950/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="mouse-sensitivity" className="flex items-center gap-2 text-sm font-bold text-sky-200">
                  <Crosshair className="h-4 w-4" />
                  Maus-Sensitivität
                </label>
                <span className="rounded-lg bg-slate-950 px-2 py-1 font-mono text-sm font-black text-white">
                  {mouseSensitivity.toFixed(2)}x
                </span>
              </div>
              <input
                id="mouse-sensitivity"
                type="range"
                min="0.25"
                max="3"
                step="0.05"
                value={mouseSensitivity}
                onChange={(event) => updateSensitivity(Number(event.target.value))}
                className="w-full accent-sky-400"
              />
              <div className="mt-1 flex justify-between font-mono text-[10px] text-slate-500">
                <span>Präzise</span>
                <span>Schnell</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(controlLabels) as Array<keyof ControlSettings>).map((control) => (
                <button
                  key={control}
                  type="button"
                  onClick={() => setCapturingControl(control)}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-colors ${
                    capturingControl === control
                      ? 'border-amber-300 bg-amber-500/20 text-amber-200'
                      : 'border-white/10 bg-slate-950/60 text-slate-200 hover:border-white/30'
                  }`}
                >
                  <span className="text-xs font-bold">{controlLabels[control]}</span>
                  <span className="flex items-center gap-1 rounded-md bg-slate-800 px-2 py-1 font-mono text-[10px] font-black text-amber-300">
                    <Keyboard className="h-3 w-3" />
                    {capturingControl === control ? 'DRÜCKEN…' : displayBinding(controlSettings[control])}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <span className="text-[10px] font-mono text-slate-500">Tipp: Klicke eine Taste und drücke danach die gewünschte Belegung.</span>
              <button
                type="button"
                onClick={() => {
                  setControlSettings(DEFAULT_CONTROL_SETTINGS);
                  localStorage.setItem('na_control_settings', JSON.stringify(DEFAULT_CONTROL_SETTINGS));
                  setMouseSensitivity(1);
                  localStorage.setItem('na_mouse_sensitivity', '1');
                }}
                className="shrink-0 rounded-xl bg-slate-800 px-3 py-2 text-[10px] font-black uppercase text-slate-300 hover:bg-slate-700"
              >
                Zurücksetzen
              </button>
            </div>
          </div>
        </div>
      )}

      {isPaused && !isMultiplayerMatch && !gameOverState?.over && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="max-w-sm w-full rounded-3xl border-2 border-amber-500/60 bg-slate-900 p-8 text-center shadow-2xl">
            <div className="mb-2 text-xs font-mono font-black uppercase tracking-[0.25em] text-amber-400">
              Einsatz pausiert
            </div>
            <h2 className="mb-3 text-3xl font-black text-white">Taktische Pause</h2>
            <p className="mb-6 text-sm text-slate-300">
              Die Arena ist eingefroren. Hub-Bereiche bleiben während des Einsatzes gesperrt.
            </p>
            <button
              type="button"
              onClick={() => {
                managerRef.current?.setPaused(false);
                setIsPaused(false);
                onMatchStateChange?.('active');
              }}
              className="w-full rounded-2xl bg-amber-500 py-3.5 text-xs font-black uppercase tracking-wider text-slate-950 transition-colors hover:bg-amber-400 cursor-pointer font-mono"
            >
              Einsatz fortsetzen
            </button>
            {onExitToMenu && (
              <button
                type="button"
                onClick={() => {
                  managerRef.current?.destroy();
                  onMatchStateChange?.('inactive');
                  onExitToMenu();
                }}
                className="mt-3 w-full rounded-2xl bg-slate-800 hover:bg-slate-700 py-3 text-xs font-black uppercase tracking-wider text-slate-300 hover:text-white transition-colors cursor-pointer font-mono"
              >
                Einsatz beenden & zum Hub
              </button>
            )}
          </div>
        </div>
      )}

      {/* BRAWL STARS END SCREEN (Won or Lost - Complete Stats for Players & Attacker Bots) */}
      {gameOverState?.over && (
        <BrawlStarsEndScreen
          victory={gameOverState.victory}
          stats={gameOverState.stats}
          matchReward={matchReward || (gameOverState.victory ? 150 : 50)}
          playerName={playerName || 'Operator'}
          clanTag={clanTag || 'NA'}
          currentArenaName={ARENAS[currentArena]?.name || currentArena}
          onPlayAgain={() => restartMatch()}
          onExitToMenu={() => {
            setGameOverState(null);
            onMatchStateChange?.('inactive');
            onExitToMenu?.();
          }}
        />
      )}
    </div>
  );
};
