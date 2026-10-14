import React, { useEffect, useRef, useState } from 'react';
import { ArenaSceneManager, TargetInfo, AllyStatusInfo, WaveInfo } from '../game/three/ArenaScene';
import { ARENAS, ARENA_UNLOCK_RULES, checkArenaUnlocked } from '../game/three/arenas';
import { WEAPONS, getEffectiveWeaponStats, INITIAL_WEAPON_UPGRADES } from '../game/weapons';
import { WeaponAttachments, AllWeaponsUpgrades } from '../types';
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
  Wrench,
  Lock,
  Unlock,
  Trophy,
  Award,
  CheckCircle2,
  Gift,
} from 'lucide-react';
import { soundFx } from '../audio/soundFx';
import { DailyMissionsState, DailyMission } from '../game/missions';
import { AgentRole } from '../game/agents/microAgents';

interface ThreeCanvasProps {
  currentArena: string;
  onChangeArena: (arenaId: string) => void;
  onMatchComplete: (victory: boolean, stats: { kills: number; score: number; wave: number }) => void;
  unlockedFacilities: Record<string, number>;
  latestCommanderBark?: string;
  commanderDirectives?: any;
  isMobileMode?: boolean;
  onCollectTaler?: (amount: number) => void;
  onOpenTycoon?: () => void;
  onOpenGunsmith?: () => void;
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
  onClaimDailyMission?: (missionId: string) => void;
}

export const ThreeCanvas: React.FC<ThreeCanvasProps> = ({
  currentArena,
  onChangeArena,
  onMatchComplete,
  unlockedFacilities,
  latestCommanderBark,
  commanderDirectives,
  isMobileMode = false,
  onCollectTaler,
  onOpenTycoon,
  onOpenGunsmith,
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
  onClaimDailyMission,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const managerRef = useRef<ArenaSceneManager | null>(null);

  const [matchRound, setMatchRound] = useState(1);
  const [health, setHealth] = useState(100);
  const [maxHealth, setMaxHealth] = useState(100);
  const [shield, setShield] = useState(100);
  const [maxShield, setMaxShield] = useState(100);
  const [kills, setKills] = useState(0);
  const [score, setScore] = useState(0);
  const [collectedRunTaler, setCollectedRunTaler] = useState(0);
  const [zoneTimer, setZoneTimer] = useState(260);
  const [zoneRadius, setZoneRadius] = useState(56);
  const [activeWeapon, setActiveWeapon] = useState('bembel');
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
  const [killStreakNotice, setKillStreakNotice] = useState<string | null>(null);
  const [lockedArenaPrompt, setLockedArenaPrompt] = useState<string | null>(null);
  const [stance, setStance] = useState<'standing' | 'sprinting' | 'crouching'>('standing');

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
    stats: { kills: number; score: number; wave: number };
  } | null>(null);

  const maxHpBonus = (unlockedFacilities.waldschwimmbad || 0) * 15;
  const speedMultiplier = 1 + (unlockedFacilities.breitband || 0) * 0.05;

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
    setCurrentTarget(null);
    setKillStreakNotice(null);
    setLockedArenaPrompt(null);
    setStance('standing');
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
        onZoneTimer: (sec, rad) => {
          setZoneTimer(sec);
          setZoneRadius(rad);
        },
        onGameOver: (victory, stats) => {
          setGameOverState({ over: true, victory, stats });
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
              ? `WAFFENSCHMIEDE-LOOT: ${label}`
              : type === 'taler'
              ? `+${amount} Neu-Anspach-Taler (NAT) gesammelt!`
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
        onHitEnemy: () => {
          setHitMarkerActive(true);
          setTimeout(() => setHitMarkerActive(false), 120);
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
        },
        onEnemyKilled: (details) => {
          onEnemyEliminated?.(details);
        },
        onAttachmentsChange: (att, weaponId) => {
          setAttachments(att);
          if (weaponId && onLootAttachmentUpdate) {
            onLootAttachmentUpdate(weaponId, att);
          }
        },
        onElevationChange: (elev) => {
          setElevation(elev);
        },
        onToggleGunsmith: () => {
          onOpenGunsmith?.();
        },
        onStanceChange: (nextStance) => {
          setStance(nextStance);
        },
      },
      { maxHpBonus, speedMultiplier, peacefulMode: isMobileMode, weaponUpgrades }
    );

    managerRef.current = manager;

    return () => {
      manager.destroy();
      managerRef.current = null;
    };
  }, [currentArena, matchRound, isMobileMode]);

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

  const selectWeapon = (id: string) => {
    setActiveWeapon(id);
    managerRef.current?.setWeapon(id);
    if (weaponUpgrades[id]) {
      setAttachments(weaponUpgrades[id].attachments);
    }
    soundFx.playShoot();
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
  const activeWeaponObj = WEAPONS[activeWeapon] || WEAPONS.bembel;
  const activeWeaponStats = getEffectiveWeaponStats(activeWeaponObj, weaponUpgrades[activeWeapon]);

  return (
    <div
      className={`relative w-full h-[calc(100vh-53px)] lg:h-[calc(100vh-53px)] pb-14 lg:pb-0 overflow-hidden bg-slate-950 select-none touch-none ${
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

      {/* COMPASS TAPE & ELEVATION TELEMETRY (TOP CENTER) */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-20 w-full max-w-md px-3">
        <div className="flex items-center gap-3 px-4 py-1 rounded-xl bg-slate-950/85 backdrop-blur-md border border-white/10 text-white font-mono text-xs shadow-lg">
          <Compass className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-amber-400 font-bold tabular-nums">{heading}°</span>
          <span className="text-white font-black tracking-widest text-sm">
            {currentCompassLabel}
          </span>
          <span className="text-slate-300 text-[11px] font-bold truncate max-w-[160px]">
            {activeArenaDef.name}
          </span>
          {elevation > 0.4 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-bold tabular-nums">
              <ArrowUp className="w-3 h-3" />
              +{elevation.toFixed(1)}m
            </span>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MODE A: MOBILE EXPLORATION HUD (OHNE BATTLE ROYALE!)                  */}
      {/* ===================================================================== */}
      {isMobileMode ? (
        <>
          {/* Peaceful Exploration Banner (Top Center) */}
          <div className="absolute top-11 left-1/2 -translate-x-1/2 flex flex-col items-center z-20 w-full max-w-lg px-3 pointer-events-auto">
            <div className="flex items-center justify-between gap-2 w-full px-3.5 py-2 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-emerald-500/40 shadow-xl">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black text-emerald-300 tracking-tight">
                    HANDY-MODUS · OHNE BATTLE ROYALE
                  </span>
                  <span className="text-[10px] text-slate-300 font-mono">
                    Erkunde Häuser & Dächer in Ruhe · Sammle NAT für deinen Stadt-Tycoon!
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono text-xs font-black tabular-nums">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span>+{collectedRunTaler}</span>
                </div>
                {onOpenTycoon && (
                  <button
                    type="button"
                    onClick={onOpenTycoon}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] shadow cursor-pointer"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Tycoon</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right-Half Touch Look Surface */}
          <div
            onTouchStart={handleLookTouchStart}
            onTouchMove={handleLookTouchMove}
            onTouchEnd={handleLookTouchEnd}
            onTouchCancel={handleLookTouchEnd}
            className="absolute top-24 right-0 bottom-28 w-1/2 z-10 touch-none"
          />

          {/* LEFT VIRTUAL ANALOG THUMBSTICK */}
          <div className="absolute bottom-24 lg:bottom-14 left-5 z-30 flex flex-col items-center gap-1.5 pointer-events-auto">
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
                <span className="text-[10px] font-mono font-black">GEHEN</span>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-300 bg-slate-950/80 px-2 py-0.5 rounded-md border border-white/10">
              Links: Gehen · Rechts: Umsehen
            </span>
          </div>

          {/* RIGHT MOBILE ACTION BUTTONS */}
          <div className="absolute bottom-24 lg:bottom-14 right-5 z-30 flex flex-col items-end gap-2.5 pointer-events-auto">
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
          </div>
        </>
      ) : (
        /* ===================================================================== */
        /* MODE B: PC BATTLE ROYALE / WAVE DEFENSE HUD                           */
        /* ===================================================================== */
        <>
          {/* WAVE ANNOUNCEMENT BANNER (TOP CENTER) */}
          {waveInfo && (
            <div className="absolute top-11 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-20 w-full max-w-lg px-4">
              {waveInfo.status === 'cleared' ? (
                <div className="flex flex-col items-center gap-1 p-2.5 rounded-2xl bg-amber-500/95 backdrop-blur-md text-slate-950 font-black shadow-2xl border border-white/50 text-center w-full">
                  <div className="flex items-center gap-2 text-sm tracking-wide">
                    <Sparkles className="w-4 h-4 fill-slate-950" />
                    <span>WELLE {waveInfo.wave} ERFOLGREICH ABGEWEHRT!</span>
                  </div>
                  <div className="text-[11px] font-mono font-bold text-slate-900 bg-white/40 px-3 py-0.5 rounded-full">
                    Nächste Welle in{' '}
                    <span className="text-red-700 text-xs font-black">{waveInfo.intermissionCountdown ?? 5}s</span> ·
                    Drücke [B] für CoD Waffenschmiede & Pack-a-Punch!
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
          )}

          {/* KILL STREAK COMBO NOTICE */}
          {killStreakNotice && (
            <div className="absolute top-28 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-2 rounded-2xl bg-amber-500 text-slate-950 font-black text-sm shadow-2xl border-2 border-yellow-200 animate-bounce z-30">
              <Flame className="w-5 h-5" />
              <span>{killStreakNotice}</span>
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

              {hitMarkerActive && (
                <div className="absolute inset-0 flex items-center justify-center animate-ping">
                  <div className="w-6 h-6 border-2 border-red-500 rotate-45" />
                </div>
              )}
            </div>
          </div>

          {/* SQUAD TEAM & OPERATOR CALLSIGN (TOP LEFT) */}
          <div className="hidden md:block absolute top-4 left-4 max-w-xs p-3 rounded-xl bg-slate-950/85 backdrop-blur-md border border-white/10 shadow-2xl pointer-events-auto z-20 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-300">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <Users className="w-3.5 h-3.5" />
                <span>SQUAD · [{clanTag}]</span>
              </div>
              <span className="text-[10px] text-amber-400 tabular-nums">{score} Pkt</span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-white font-bold truncate">
                  1. [{clanTag}] {playerName}
                </span>
                <span className="text-emerald-400 font-bold tabular-nums">
                  {Math.round(health)} HP
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-200"
                  style={{ width: `${(health / maxHealth) * 100}%` }}
                />
              </div>
            </div>

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

            <div className="pt-1 border-t border-white/10 text-[10px] font-mono text-slate-400 flex flex-col gap-0.5">
              <div className="flex items-center justify-between">
                <span>SHIFT: Sprint · STRG: Ducken</span>
                <span>SPACE: Sprung</span>
              </div>
              <div className="flex items-center justify-between text-amber-400">
                <span>Rechtsklick: Visier (ADS)</span>
                <span>[B]: Waffenschmiede</span>
              </div>
            </div>

            {/* ACTIVE DAILY MISSION HUD WIDGET */}
            {activeDailyMission && (
              <div
                onClick={() => {
                  managerRef.current?.unlockPointer();
                  onOpenDailyMissions?.();
                }}
                className="mt-2 p-2.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-amber-500/30 hover:border-amber-400 transition-all cursor-pointer pointer-events-auto shadow-xl"
                title="Klicken für alle Tagesbefehle & Belohnungen"
              >
                <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                    <Target className="w-3 h-3" />
                    <span>TAGESBEFEHL:</span>
                    <span className="text-slate-300 font-normal truncate max-w-[120px]">
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
                <div className="flex items-center justify-between mt-1 text-[9px] font-mono text-slate-400">
                  <span className="text-amber-400 font-bold">
                    +{activeDailyMission.rewardNAT} NAT
                  </span>
                  <span className="text-purple-400 font-bold">
                    +{activeDailyMission.rewardReputation} RUF
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* TOP RIGHT: STORM, SCORE & ACTIVE WEHRHEIMER TARGET */}
          <div className="absolute top-4 right-4 flex flex-col items-end gap-2 pointer-events-auto z-20">
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-950/85 backdrop-blur-md border border-white/10 shadow-xl text-white font-mono">
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                  Taunus-Nebel ({zoneRadius}m)
                </span>
                <span className="text-sm font-black tabular-nums text-white">
                  {zoneTimer > 0 ? `${zoneTimer}s` : 'ZONE VERENGT'}
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

            {currentTarget && (
              <div className="max-w-xs p-3 rounded-xl bg-slate-950/85 backdrop-blur-md border border-red-500/50 shadow-xl text-left">
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
          </div>

          {/* POINTER LOCK HELPER BANNER */}
          {!isPointerLocked && !gameOverState?.over && (
            <div
              onClick={() => managerRef.current?.requestLock()}
              className="absolute top-24 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-2xl cursor-pointer hover:bg-amber-400 transition-colors z-30"
            >
              <MousePointer className="w-3.5 h-3.5" />
              <span>Klicke ins Bild für 360°-Maussteuerung · [B] für CoD Waffenschmiede</span>
            </div>
          )}

          {/* GEMINI PRO COMMANDER BARK (FLOATING MID-LEFT) */}
          {latestCommanderBark && (
            <div className="hidden md:block absolute top-52 left-4 max-w-sm px-4 py-2.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-amber-500/30 shadow-lg pointer-events-auto z-20">
              <div className="flex items-center gap-1.5 mb-1 text-[11px] font-bold text-amber-400 font-mono">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Oberkommando Feldberg-Stier:</span>
              </div>
              <p className="text-xs text-slate-200 italic leading-snug">
                "{latestCommanderBark}"
              </p>
            </div>
          )}

          {/* HEALTH, SHIELD & LIVE STANCE STACK (BOTTOM LEFT) */}
          <div className="absolute bottom-14 left-6 flex flex-col gap-2 w-64 md:w-72 pointer-events-auto z-20">
            {/* Live Tactical Stance Badge (Shift Sprint / Strg Crouch) */}
            <div className="flex items-center justify-between px-3 py-1 rounded-lg bg-slate-950/90 backdrop-blur-md border border-white/10 font-mono text-[10px]">
              <span className="text-slate-400 uppercase font-bold">HALTUNG:</span>
              {stance === 'sprinting' ? (
                <span className="text-amber-400 font-black tracking-wider">
                  ⚡ TAKTISCHER SPRINT [SHIFT]
                </span>
              ) : stance === 'crouching' ? (
                <span className="text-cyan-400 font-black tracking-wider">
                  🛡️ GEDUCKT [STRG] (-35% Rückstoß)
                </span>
              ) : (
                <span className="text-emerald-400 font-bold tracking-wider">
                  STEHEND [SHIFT Sprint · STRG Ducken]
                </span>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-cyan-300">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />
                  <span>SCHILD</span>
                </div>
                <span className="tabular-nums text-sm font-black text-white">
                  {Math.round(shield)}/{maxShield}
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-900 border border-cyan-500/30 p-0.5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-cyan-400 transition-all duration-200"
                  style={{ width: `${(shield / maxShield) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-emerald-300">
                <div className="flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
                  <span>LEBEN</span>
                </div>
                <span className="tabular-nums text-sm font-black text-white">
                  {Math.round(health)}/{maxHealth}
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-900 border border-emerald-500/30 p-0.5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-200"
                  style={{ width: `${(health / maxHealth) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* COD COLD WAR GUNSMITH & 4-SLOT INVENTORY HOTBAR (BOTTOM RIGHT) */}
          <div className="absolute bottom-14 right-6 flex flex-col items-end gap-2 pointer-events-auto z-20">
            {/* Live CoD Cold War Gunsmith Attachments & Pack-a-Punch Bar */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/90 backdrop-blur-md border border-slate-800 text-[10px] font-mono shadow-lg">
              <span
                className="font-bold mr-1"
                style={{ color: activeWeaponStats.rarityObj.colorHex }}
              >
                {activeWeaponStats.rarityObj.codLabel}
              </span>
              {(weaponUpgrades[activeWeapon]?.papLevel || 0) > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-fuchsia-500/20 border border-fuchsia-400 text-fuchsia-300 font-bold">
                  PaP {weaponUpgrades[activeWeapon]?.papLevel}
                </span>
              )}
              {[
                { key: 'scope', label: 'OPTIK', lv: attachments.scope || 0 },
                { key: 'barrel', label: 'LAUF', lv: attachments.barrel || 0 },
                { key: 'bolt', label: 'MÜNDUNG', lv: attachments.bolt || 0 },
                { key: 'mag', label: 'MAGAZIN', lv: attachments.mag || 0 },
                { key: 'stock', label: 'SCHAFT', lv: attachments.stock || 0 },
              ].map((mod) => (
                <div
                  key={mod.key}
                  className={`px-2 py-0.5 rounded border tabular-nums font-bold ${
                    mod.lv > 0
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  {mod.label} {mod.lv}
                </div>
              ))}

              {onOpenGunsmith && (
                <button
                  type="button"
                  onClick={() => {
                    managerRef.current?.unlockPointer();
                    onOpenGunsmith();
                  }}
                  className="ml-1 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer transition-colors"
                >
                  <Wrench className="w-3 h-3" />
                  <span>[B] UPGRADES</span>
                </button>
              )}
            </div>

            {/* Weapons Hotbar */}
            <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-white/10 shadow-2xl">
              {Object.values(WEAPONS).map((w, idx) => {
                const isSelected = activeWeapon === w.id;
                const wState = weaponUpgrades[w.id];
                const wStats = getEffectiveWeaponStats(w, wState);

                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => selectWeapon(w.id)}
                    className={`relative flex flex-col items-center justify-between w-16 h-16 md:w-20 md:h-20 p-2 rounded-xl border-2 transition-all cursor-pointer ${wStats.rarityObj.borderClass} ${
                      isSelected
                        ? 'scale-105 shadow-xl ring-2 ring-white bg-slate-900'
                        : 'opacity-75 hover:opacity-100 bg-slate-950'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full text-[9px] font-mono font-bold">
                      <span className="text-slate-400">[{idx + 1}]</span>
                      {(wState?.papLevel || 0) > 0 && (
                        <span className="text-fuchsia-400">PaP{wState?.papLevel}</span>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-white text-center leading-tight truncate w-full">
                      {wStats.displayName.split(' ')[0]}
                    </span>
                    <span className="text-[10px] font-mono text-amber-400 tabular-nums font-bold">
                      {wStats.damage} DMG
                    </span>
                  </button>
                );
              })}
            </div>
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
            </button>
          );
        })}
      </div>

      {/* VICTORY ROYALE MODAL OVERLAY (PC Mode Only) */}
      {!isMobileMode && gameOverState?.over && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50 cursor-default"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full bg-slate-900 border-2 border-amber-500/60 rounded-3xl p-8 shadow-2xl text-center pointer-events-auto"
          >
            {gameOverState.victory ? (
              <>
                <div className="inline-block px-4 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-sm uppercase tracking-widest mb-3">
                  VICTORY ROYALE!
                </div>
                <h2 className="text-3xl font-black text-white tracking-tight mb-2">
                  NEU-ANSPACH TRIUMPHIERT!
                </h2>
                <p className="text-xs text-slate-300 mb-6">
                  Dein Ergebnis wurde automatisch im echten Live-Leaderboard für [{clanTag}] {playerName} gespeichert und schaltet das nächste Einsatzgebiet frei!
                </p>
              </>
            ) : (
              <>
                <div className="inline-block px-4 py-1 rounded-full bg-red-600 text-white font-black text-sm uppercase tracking-widest mb-3">
                  ELIMINIERT!
                </div>
                <h2 className="text-3xl font-black text-white tracking-tight mb-2">
                  VOM APFELDORF ÜBERRANNT
                </h2>
                <p className="text-xs text-slate-300 mb-6">
                  Rüste deine Waffen in der CoD Waffenschmiede auf und starte den Gegenangriff!
                </p>
              </>
            )}

            <div className="grid grid-cols-3 gap-3 p-4 bg-slate-950 rounded-2xl mb-6 font-mono border border-slate-800">
              <div>
                <div className="text-[10px] text-slate-400">ELIMINIERUNGEN</div>
                <div className="text-xl font-black text-red-400 tabular-nums">
                  {gameOverState.stats.kills}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">WELLE</div>
                <div className="text-xl font-black text-amber-400 tabular-nums">
                  {gameOverState.stats.wave} / 5
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">PUNKTE</div>
                <div className="text-xl font-black text-emerald-400 tabular-nums">
                  +{gameOverState.stats.score}
                </div>
              </div>
            </div>

            {/* Daily Missions Progress Summary in Game Over Modal */}
            {dailyMissionsState && (
              <div className="mb-6 p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-left">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400">
                    <Target className="w-3.5 h-3.5" />
                    <span>TAGESBEFEHLE STATUS</span>
                  </div>
                  {onOpenDailyMissions && (
                    <button
                      type="button"
                      onClick={onOpenDailyMissions}
                      className="text-[10px] font-mono text-slate-400 hover:text-white underline cursor-pointer"
                    >
                      Alle ansehen
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {dailyMissionsState.missions.slice(0, 3).map((m) => {
                    const isDone = m.completed;
                    return (
                      <div
                        key={m.id}
                        className="flex items-center justify-between text-xs font-mono bg-slate-900/80 px-2.5 py-1.5 rounded-xl border border-white/5"
                      >
                        <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                          {isDone ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                          )}
                          <span
                            className={`truncate text-[11px] ${
                              isDone ? 'text-white font-bold' : 'text-slate-300'
                            }`}
                          >
                            {m.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-slate-400 tabular-nums">
                            {m.currentProgress}/{m.targetCount}
                          </span>
                          {isDone && !m.claimed && onClaimDailyMission ? (
                            <button
                              type="button"
                              onClick={() => onClaimDailyMission(m.id)}
                              className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] cursor-pointer"
                            >
                              +{m.rewardNAT} NAT
                            </button>
                          ) : isDone && m.claimed ? (
                            <span className="text-[10px] text-emerald-400 font-bold">
                              Eingelöst
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-400 font-bold">
                              +{m.rewardNAT}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5">
              {onOpenGunsmith && (
                <button
                  type="button"
                  onClick={onOpenGunsmith}
                  className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-2xl transition-colors cursor-pointer uppercase tracking-wider"
                >
                  Waffenschmiede
                </button>
              )}
              <button
                type="button"
                onClick={restartMatch}
                className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-2xl shadow-lg transition-all cursor-pointer uppercase tracking-wider"
              >
                Nächste Runde starten
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
