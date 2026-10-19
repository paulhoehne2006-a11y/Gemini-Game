import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ARENAS } from './arenas';
import { DestructibleProp, createElectricStormTexture } from './textures';
import { WEAPONS, Weapon, INITIAL_WEAPON_UPGRADES, getEffectiveWeaponStats } from '../weapons';
import { WalkableSurface, WeaponAttachments, AttachmentType, AllWeaponsUpgrades } from '../../types';
import {
  WehrheimerAgent,
  AllyAgent,
  AgentBullet,
  createWehrheimerMesh,
  createAllyMesh,
  createArticulatedHumanoid,
  create3DWeaponModel,
  animateCharacterRig,
  HESSIAN_BARKS,
  ALLY_BARKS,
  AgentRole,
} from '../agents/microAgents';
import { soundFx } from '../../audio/soundFx';
import { DetailedMatchStats, MatchParticipantStats } from '../../components/BrawlStarsEndScreen';

// Reusable math vectors (Zero GC discipline)
const _playerMove = new THREE.Vector3();
const _bulletDir = new THREE.Vector3();
const _tempVec = new THREE.Vector3();
const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _headPos = new THREE.Vector3();
const _camTarget = new THREE.Vector3();
const _desiredCamPos = new THREE.Vector3();
const _skyGradientCanvas = document.createElement('canvas');

function createSkyGradientTexture(topColor: string, horizonColor: string): THREE.CanvasTexture {
  _skyGradientCanvas.width = 16;
  _skyGradientCanvas.height = 512;
  const context = _skyGradientCanvas.getContext('2d')!;
  const gradient = context.createLinearGradient(0, 0, 0, _skyGradientCanvas.height);
  gradient.addColorStop(0, topColor || '#0284C7'); // Vibrant Azure Blue Zenith
  gradient.addColorStop(0.35, '#38BDF8'); // Clear Sky Cyan
  gradient.addColorStop(0.65, '#7DD3FC'); // Lower Atmosphere
  gradient.addColorStop(0.85, '#BAE6FD'); // Sunlit Horizon Haze
  gradient.addColorStop(1.0, horizonColor || '#E0F2FE'); // Seamless atmospheric horizon fog blend
  context.fillStyle = gradient;
  context.fillRect(0, 0, _skyGradientCanvas.width, _skyGradientCanvas.height);
  const texture = new THREE.CanvasTexture(_skyGradientCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export const WAVE_CONFIGS = [
  {
    wave: 1,
    title: 'WELLE 1/5: WEHRHEIMER KUNDSCHAFTER',
    subtitle: 'Apfeldorf-Späher testen Neu-Anspachs Wachposten!',
    flankers: 4,
    snipers: 0,
    shocktroopers: 0,
    bosses: 0,
  },
  {
    wave: 2,
    title: 'WELLE 2/5: APFELWEIN-SCHARFSCHÜTZEN',
    subtitle: 'Achtung: Wehrheimer Snipers lauern auf Distanz mit Äppler-Kanonen!',
    flankers: 3,
    snipers: 3,
    shocktroopers: 0,
    bosses: 0,
  },
  {
    wave: 3,
    title: 'WELLE 3/5: LOCHMÜHLE-STURMTRUPP',
    subtitle: 'Wehrheimer Stoßtruppen rücken vor!',
    flankers: 2,
    snipers: 1,
    shocktroopers: 4,
    bosses: 0,
  },
  {
    wave: 4,
    title: 'WELLE 4/5: WEHRHEIMER GROSSOFFENSIVE',
    subtitle: 'Kombinierte Streitkräfte: Scharfschützen, Stoßtruppen und Flankierer!',
    flankers: 4,
    snipers: 3,
    shocktroopers: 3,
    bosses: 0,
  },
  {
    wave: 5,
    title: 'WELLE 5/5: FINALE – TRAKTOR-HORST',
    subtitle: 'DER WEHRHEIMER ENDBOSS AUF SEINEM 200-PS-TRECKER SAMT LEIBGARDE!',
    flankers: 2,
    snipers: 2,
    shocktroopers: 2,
    bosses: 1,
  },
];

export interface TargetInfo {
  id: string;
  name: string;
  role: string;
  distance: number;
  health: number;
  maxHealth: number;
  isBoss: boolean;
}

export interface AllyStatusInfo {
  id: string;
  name: string;
  role: string;
  health: number;
  maxHealth: number;
}

export interface FloatingDamage {
  sprite: THREE.Sprite;
  position: THREE.Vector3;
  life: number;
  maxLife: number;
}

export interface ImpactParticle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
}

export interface WaveInfo {
  wave: number;
  totalWaves: number;
  title: string;
  subtitle: string;
  status: 'active' | 'cleared' | 'boss';
  remainingEnemies: number;
  totalEnemies: number;
  intermissionCountdown?: number;
  bossInfo?: { name: string; health: number; maxHealth: number } | null;
}

export interface ControlSettings {
  forward: string;
  backward: string;
  left: string;
  right: string;
  reload: string;
  jump: string;
  sprint: string;
  crouch: string;
}

export const DEFAULT_CONTROL_SETTINGS: ControlSettings = {
  forward: 'w',
  backward: 's',
  left: 'a',
  right: 'd',
  reload: 'r',
  jump: ' ',
  sprint: 'shift',
  crouch: 'control',
};

import { MatchPerkId } from '../progression';

export interface RadarBlip {
  id: string;
  x: number;
  z: number;
  kind: 'enemy' | 'boss' | 'ally' | 'loot' | 'chest' | 'taler';
}

export interface RadarState {
  playerX: number;
  playerZ: number;
  playerYaw: number;
  stormRadius: number;
  blips: RadarBlip[];
}

export interface AbilityCooldownsState {
  shockwave: number;
  shockwaveMax: number;
  dash: number;
  dashMax: number;
  overdrive: number;
  overdriveMax: number;
  overdriveActive: boolean;
}

export interface KillFeedNotification {
  id: string;
  label: string;
  sublabel?: string;
  points: number;
  isCrit?: boolean;
  isBoss?: boolean;
}

export interface GameEventCallbacks {
  onHealthChange: (hp: number, maxHp: number, shield: number, maxShield: number) => void;
  onKillsChange: (kills: number) => void;
  onScoreChange: (score: number) => void;
  onZoneTimer: (seconds: number, radius: number) => void;
  onGameOver: (victory: boolean, stats: DetailedMatchStats) => void;
  onCombatBark: (agentName: string, text: string) => void;
  onLootPickup: (type: 'ammo' | 'health' | 'taler' | 'shield' | 'attachment', amount: number, label?: string) => void;
  onTargetUpdate: (target: TargetInfo | null) => void;
  onAlliesChange: (allies: AllyStatusInfo[]) => void;
  onHitEnemy: (damage: number, isCrit: boolean) => void;
  onPointerLockChange: (isLocked: boolean) => void;
  onHeadingChange: (degrees: number) => void;
  onWaveChange: (info: WaveInfo) => void;
  onAttachmentsChange?: (attachments: WeaponAttachments, weaponId?: string) => void;
  onElevationChange?: (elevationMeters: number) => void;
  onWeaponChange?: (weaponId: string) => void;
  onToggleGunsmith?: () => void;
  onStanceChange?: (stance: 'standing' | 'sprinting' | 'crouching') => void;
  onAmmoChange?: (magazine: number, reserve: number, capacity: number) => void;
  onReloadStateChange?: (isReloading: boolean, secondsRemaining: number) => void;
  onLevelChange?: (level: number, experience: number, experienceToNextLevel: number) => void;
  onEnemyKilled?: (details: {
    arenaId: string;
    role: AgentRole;
    isBoss: boolean;
    weaponId: string;
    wave: number;
    isCrit: boolean;
  }) => void;
  onComboChange?: (multiplier: number, timerRatio: number) => void;
  onAbilityCooldownsChange?: (state: AbilityCooldownsState) => void;
  onRadarUpdate?: (radar: RadarState) => void;
  onKillFeedEvent?: (item: KillFeedNotification) => void;
  onPlayerDamaged?: (amount: number, source?: string, shieldBroken?: boolean) => void;
  onAbilityUsed?: (abilityId: 'shockwave' | 'dash' | 'overdrive', label: string) => void;
}

function createDamageSprite(amount: number, isCrit: boolean): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 128, 64);
  ctx.fillStyle = isCrit ? '#EF4444' : amount >= 45 ? '#F59E0B' : '#38BDF8';
  ctx.font = '900 38px sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 8;
  ctx.fillText(isCrit ? `${amount}!` : amount.toString(), 64, 46);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const mat = new THREE.SpriteMaterial({ map: texture, depthTest: false, transparent: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(isCrit ? 2.15 : 1.8, isCrit ? 1.08 : 0.9, 1);
  return sprite;
}

export class ArenaSceneManager {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private callbacks: GameEventCallbacks;
  private peacefulMode: boolean;
  private trainingMode: boolean;
  private mouseSensitivity: number;
  private controls: ControlSettings;

  private clock = new THREE.Clock();
  private animationFrameId: number | null = null;
  private isDestroyed = false;

  // Arena, Walkable Roofs & Destructibles
  private currentArenaId: string;
  private arenaUpdateFn?: (delta: number) => void;
  private obstacles: THREE.Box3[] = [];
  private walkableSurfaces: WalkableSurface[] = [];
  private destructibles: DestructibleProp[] = [];

  // Player state & Realistic Human Physics (Much slower, grounded walking pace!)
  private playerGroup: THREE.Group;
  private playerWeaponMount!: THREE.Group;
  private playerPos = new THREE.Vector3(0, 0, 14);
  private playerVelX = 0;
  private playerVelZ = 0;
  private playerVelY = 0;
  private isGrounded = true;
  private playerHealth = 100;
  private playerMaxHealth = 100;
  private playerShield = 100;
  private playerMaxShield = 100;
  // Realistic human walking speed (~5.2 m/s, over 3x slower than before so entrances & stairs are easy to hit!)
  private playerSpeed = 5.2;
  private currentWeapon: Weapon = WEAPONS.bembel;
  private weaponUpgrades: AllWeaponsUpgrades = JSON.parse(JSON.stringify(INITIAL_WEAPON_UPGRADES));
  private attachments: WeaponAttachments = {
    scope: 0,
    barrel: 0,
    bolt: 0,
    mag: 0,
    stock: 0,
  };
  private lastFireTime = 0;
  private muzzleLight: THREE.PointLight;
  private muzzleFlashTimer = 0;
  private kills = 0;
  private score = 0;
  private wave = 1;
  private totalWaves = 5;
  private waveIntermissionTimer = 0;
  private currentWaveTotalEnemies = 4;
  private magazineAmmo = 0;
  private reserveAmmo = 0;
  private reloadTimer = 0;
  private reloadDuration = 1.65;
  private playerLevel = 1;
  private playerExperience = 0;
  private experienceToNextLevel = 500;

  // Gamification: Adrenaline Combo, Roguelite Perks, Abilities & Camera Shake
  private activeMatchPerks = new Set<MatchPerkId>();
  private comboMultiplier = 1;
  private comboTimer = 0;
  private comboMaxTimer = 6.0;
  private lastComboNotifyTime = 0;
  private shockwaveCooldown = 0;
  private shockwaveMaxCooldown = 10;
  private dashCooldown = 0;
  private dashMaxCooldown = 5;
  private overdriveCooldown = 0;
  private overdriveMaxCooldown = 22;
  private overdriveActiveTimer = 0;
  private dashInvulnTimer = 0;
  private dashBurstX = 0;
  private dashBurstZ = 0;
  private lastAbilityNotifyTime = 0;
  private lastRadarNotifyTime = 0;
  private cameraShakeIntensity = 0;
  private mobileAutoFire = true;
  private shockwaveEffects: { mesh: THREE.Mesh; life: number; maxLife: number; maxRadius: number }[] = [];

  // Brawl Stars Detailed Combat Tracking (Player, Allies, Bots)
  private matchStartTime = performance.now();
  private playerParticipantStats: MatchParticipantStats = {
    id: 'player_local',
    name: 'Operator',
    role: 'Sturmtrupp-Scharfschütze',
    faction: 'neu-anspach',
    isPlayer: true,
    isBot: false,
    kills: 0,
    damageDealt: 0,
    damageTaken: 0,
    deaths: 0,
  };
  private allAlliesStats = new Map<string, MatchParticipantStats>();
  private allEnemiesStats = new Map<string, MatchParticipantStats>();
  private clouds: THREE.Group[] = [];

  // Over-The-Shoulder Camera (with spike-free mouse rotation & throttled compass telemetry)
  private cameraYaw = 0;
  private cameraPitch = 0.12;
  private cameraDistance = 4.3;
  private shoulderOffset = 1.15;
  private isAiming = false;
  private isSprinting = false;
  private isCrouching = false;
  private crouchToggle = false;
  private currentCrouchAmount = 0;
  private currentHeadHeight = 1.75;
  private lastReportedStance: 'standing' | 'sprinting' | 'crouching' = 'standing';
  private currentFov = 68;
  private isPointerLocked = false;
  private isGameOver = false;
  private isPaused = false;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private hasValidLastMouse = false;
  private lastReportedHeading = -1;
  private lastHeadingNotifyTime = 0;
  private isMousePhysicallyHeld = false;
  private lastReloadNotifyTime = 0;
  private dirLight!: THREE.DirectionalLight;

  // Mobile Virtual Analog Joystick Input (-1..1)
  private mobileInputX = 0;
  private mobileInputY = 0;

  // Taunus Fog Zone (disabled in peaceful Mobile Mode)
  private stormMesh: THREE.Mesh;
  private stormCenter = new THREE.Vector2(0, 0);
  private stormRadius = 56;
  private targetRadius = 14;
  private stormTimer = 260;
  private stormDamageTimer = 0;

  // Enemies, Allies, Bullets, Loot & Particles
  private agents: WehrheimerAgent[] = [];
  private allies: AllyAgent[] = [];
  private bullets: AgentBullet[] = [];
  private lootItems: {
    mesh: THREE.Group;
    type: 'ammo' | 'health' | 'taler' | 'shield' | 'attachment';
    attachmentType?: AttachmentType;
    pos: THREE.Vector3;
    amount?: number;
  }[] = [];
  private floatingDamages: FloatingDamage[] = [];
  private impactParticles: ImpactParticle[] = [];

  // Active target indicator
  private currentTarget: TargetInfo | null = null;
  private targetHighlightMesh: THREE.Mesh;

  // Key & Mouse tracking
  private keys: Record<string, boolean> = {};
  private isMouseDown = false;
  private recoilPitch = 0;
  private cleanupListeners: (() => void)[] = [];

  constructor(
    container: HTMLElement,
    arenaId: string,
    callbacks: GameEventCallbacks,
    initialPerks: {
      maxHpBonus?: number;
      speedMultiplier?: number;
      peacefulMode?: boolean;
      trainingMode?: boolean;
      mouseSensitivity?: number;
      controls?: Partial<ControlSettings>;
      weaponUpgrades?: AllWeaponsUpgrades;
      playerName?: string;
      clanTag?: string;
    } = {}
  ) {
    this.container = container;
    this.currentArenaId = arenaId;
    this.callbacks = callbacks;
    this.peacefulMode = !!initialPerks.peacefulMode;
    this.trainingMode = !!initialPerks.trainingMode;
    if (initialPerks.playerName) {
      this.playerParticipantStats.name = initialPerks.playerName;
    }
    this.mouseSensitivity = THREE.MathUtils.clamp(initialPerks.mouseSensitivity ?? 1, 0.25, 3);
    this.controls = { ...DEFAULT_CONTROL_SETTINGS, ...(initialPerks.controls || {}) };
    if (initialPerks.weaponUpgrades) {
      this.weaponUpgrades = JSON.parse(JSON.stringify(initialPerks.weaponUpgrades));
      if (this.weaponUpgrades[this.currentWeapon.id]) {
        this.attachments = { ...this.weaponUpgrades[this.currentWeapon.id].attachments };
      }
    }

    if (initialPerks.maxHpBonus) {
      this.playerMaxHealth += initialPerks.maxHpBonus;
      this.playerHealth = this.playerMaxHealth;
    }
    if (initialPerks.speedMultiplier) {
      // Keep speed multiplier subtle so human walking stays realistic and controllable
      const cappedMult = 1 + Math.min(0.2, (initialPerks.speedMultiplier - 1) * 0.5);
      this.playerSpeed *= cappedMult;
    }
    this.resetWeaponAmmo();

    // 1. Setup WebGL Renderer with Realistic Tone Mapping & Soft Shadows
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // 2. Setup Scene & Camera
    const arenaDef = ARENAS[arenaId] || ARENAS.hessenpark;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(arenaDef.skyColor || 0x38BDF8);
    this.scene.fog = new THREE.FogExp2(arenaDef.fogColor || 0xBAE6FD, 0.0035);

    const skyDome = new THREE.Mesh(
      new THREE.SphereGeometry(150, 32, 16),
      new THREE.MeshBasicMaterial({
        map: createSkyGradientTexture(
          `#${new THREE.Color(arenaDef.skyColor || 0x38BDF8).getHexString()}`,
          `#${new THREE.Color(arenaDef.fogColor || 0xBAE6FD).getHexString()}`
        ),
        side: THREE.BackSide,
        depthWrite: false,
      })
    );
    skyDome.renderOrder = -10;
    this.scene.add(skyDome);

    // Glowing Stylized 3D Sun with radiant corona
    const sunGroup = new THREE.Group();
    const sunMesh = new THREE.Mesh(
      new THREE.SphereGeometry(7, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xFFFBEB })
    );
    const sunCorona = new THREE.Mesh(
      new THREE.RingGeometry(7, 14, 24),
      new THREE.MeshBasicMaterial({
        color: 0xFDE047,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
      })
    );
    sunGroup.add(sunMesh);
    sunGroup.add(sunCorona);
    sunGroup.position.set(65, 78, 55);
    sunCorona.lookAt(0, 0, 0);
    this.scene.add(sunGroup);

    // Floating Stylized Low-Poly Puffy Clouds
    this.createStylizedSkyClouds();

    this.camera = new THREE.PerspectiveCamera(
      this.currentFov,
      container.clientWidth / container.clientHeight,
      0.3,
      280
    );

    // 3. PBR RoomEnvironment Map for Realistic Metallic & Glass Reflections
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // 4. Dynamic Sunlight, Sky Hemisphere & Rim Lighting Rig (Fortnite Palette)
    const hemiLight = new THREE.HemisphereLight(0xBAE6FD, 0x334155, 1.15);
    this.scene.add(hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xFFFDF0, 2.2);
    this.dirLight.position.set(42, 65, 32);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    const d = 52;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0003;
    this.dirLight.shadow.radius = 2.2;
    this.scene.add(this.dirLight);
    this.scene.add(this.dirLight.target);

    const rimLight = new THREE.DirectionalLight(0x7DD3FC, 0.85);
    rimLight.position.set(-32, 35, -28);
    this.scene.add(rimLight);

    // 5. Build Neu-Anspach Arena (Buildings, Walkable Roofs, Cars, Destructibles)
    const arenaResult = arenaDef.buildScene(this.scene);
    this.arenaUpdateFn = arenaResult.update;
    this.obstacles = arenaResult.obstacles;
    this.walkableSurfaces = arenaResult.walkableSurfaces || [];
    this.destructibles = arenaResult.destructibles || [];

    // 6. Realistic Human Player Mesh
    this.playerGroup = this.createPlayerMesh();
    this.playerGroup.position.copy(this.playerPos);
    this.scene.add(this.playerGroup);

    this.muzzleLight = new THREE.PointLight(0xFDE047, 0, 8);
    this.scene.add(this.muzzleLight);

    // 7. Fortnite-Style Electric Storm Barrier
    const stormGeo = new THREE.CylinderGeometry(this.stormRadius, this.stormRadius, 32, 64, 1, true);
    const stormTexture = createElectricStormTexture();
    const stormMat = new THREE.MeshStandardMaterial({
      map: stormTexture,
      color: 0xC084FC,
      emissive: 0x9333EA,
      emissiveIntensity: 0.9,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      roughness: 0.3,
      metalness: 0.6,
      depthWrite: false,
    });
    this.stormMesh = new THREE.Mesh(stormGeo, stormMat);
    this.stormMesh.position.y = 16;
    this.stormMesh.visible = !this.peacefulMode && !this.trainingMode;
    this.scene.add(this.stormMesh);

    // 8. Target Highlight Reticle above Active Enemy
    const targetRingGeo = new THREE.RingGeometry(0.65, 0.85, 16);
    const targetRingMat = new THREE.MeshBasicMaterial({
      color: 0xF59E0B,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    this.targetHighlightMesh = new THREE.Mesh(targetRingGeo, targetRingMat);
    this.targetHighlightMesh.rotation.x = -Math.PI / 2;
    this.targetHighlightMesh.position.set(0, -999, 0);
    this.scene.add(this.targetHighlightMesh);

    // 9. Spawn Neu-Anspach Allies / Friendly Citizens
    this.spawnNeuAnspachAllies();

    // 10. Spawn Wehrheim Invaders Wave OR Peaceful Neu-Anspach Taler Exploration Coins
    if (this.peacefulMode) {
      this.spawnPeacefulCityTaler();
    } else if (this.trainingMode) {
      this.spawnTrainingTargets();
    } else {
      this.spawnWehrheimerWave(this.wave);
    }

    // 11. Controls & Event Listeners
    this.initControls();
    window.addEventListener('resize', this.onResize);

    // Initial HUD notifications
    this.callbacks.onHealthChange(this.playerHealth, this.playerMaxHealth, this.playerShield, this.playerMaxShield);
    this.callbacks.onAttachmentsChange?.({ ...this.attachments });
    this.notifyAmmoState();
    this.notifyLevelState();

    // Initialize camera position cleanly behind player
    this.camera.position.set(this.playerPos.x + 1.15, this.playerPos.y + 2.2, this.playerPos.z + 4.3);

    // 12. Start Animation Loop
    this.tick();
  }

  private createStylizedSkyClouds() {
    this.clouds = [];
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      emissive: 0xBAE6FD,
      emissiveIntensity: 0.18,
      roughness: 0.9,
      flatShading: true,
    });

    for (let i = 0; i < 8; i++) {
      const cloud = new THREE.Group();
      const puffCount = 5;
      for (let p = 0; p < puffCount; p++) {
        const radius = 3.2 + Math.random() * 2.2;
        const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(radius, 1), cloudMat);
        puff.position.set(
          (p - puffCount / 2) * 4.2 + (Math.random() - 0.5) * 1.5,
          (Math.random() - 0.5) * 1.2,
          (Math.random() - 0.5) * 2.5
        );
        cloud.add(puff);
      }
      const angle = (i / 8) * Math.PI * 2 + (i % 2) * 0.3;
      const dist = 52 + (i % 3) * 18;
      cloud.position.set(Math.cos(angle) * dist, 32 + (i % 3) * 5, Math.sin(angle) * dist);
      this.scene.add(cloud);
      this.clouds.push(cloud);
    }
  }

  public getDetailedMatchStats(victory: boolean): DetailedMatchStats {
    const duration = Math.round((performance.now() - this.matchStartTime) / 1000);
    const alliesList = Array.from(this.allAlliesStats.values());
    const enemiesList = Array.from(this.allEnemiesStats.values());
    const allList = [this.playerParticipantStats, ...alliesList, ...enemiesList];

    let starPlayer = this.playerParticipantStats;
    let bestScore = -1;
    for (const p of allList) {
      const pScore = p.kills * 300 + p.damageDealt;
      if (pScore > bestScore) {
        bestScore = pScore;
        starPlayer = p;
      }
    }
    for (const p of allList) {
      p.isStarPlayer = p.id === starPlayer.id;
    }

    return {
      kills: this.kills,
      score: this.score,
      wave: this.wave,
      maxWave: this.totalWaves,
      victory,
      durationSeconds: duration,
      playerStats: { ...this.playerParticipantStats },
      alliesStats: alliesList.map((a) => ({ ...a })),
      enemiesStats: enemiesList.map((e) => ({ ...e })),
      totalDamageDealt: this.playerParticipantStats.damageDealt,
      totalDamageTaken: this.playerParticipantStats.damageTaken,
      starPlayerId: starPlayer.id,
    };
  }

  private createPlayerMesh(): THREE.Group {
    const { group, weaponMount } = createArticulatedHumanoid({
      jacketColor: 0xDC2626, // Hessen Anspach Red Jacket
      vestColor: 0x1E293B,
      pantsColor: 0x1E293B,
      helmetColor: 0x15803D, // Taunus Forest Cap
      skinColor: 0xE8B48A,
      weaponId: this.currentWeapon.id,
      attachments: this.attachments,
      hasVisor: false,
      isUnarmed: this.peacefulMode,
    });

    this.playerWeaponMount = weaponMount;

    // Subtle green player indicator ring
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.36, 0.48, 16),
      new THREE.MeshBasicMaterial({ color: 0x10B981, side: THREE.DoubleSide })
    );
    ring.name = 'playerRing';
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 2.28;
    group.add(ring);

    return group;
  }

  private refreshPlayer3DWeapon() {
    if (!this.playerWeaponMount) return;
    while (this.playerWeaponMount.children.length > 0) {
      this.playerWeaponMount.remove(this.playerWeaponMount.children[0]);
    }
    if (!this.peacefulMode) {
      const upg = this.weaponUpgrades[this.currentWeapon.id] || {
        rarityTier: 1,
        papLevel: 0,
        attachments: this.attachments,
      };
      this.playerWeaponMount.add(
        create3DWeaponModel(this.currentWeapon.id, this.attachments, upg.papLevel, upg.rarityTier)
      );
    }
  }

  /**
   * Spawns golden Neu-Anspach-Taler (NAT) coins in buildings, streets & on roofs for Mobile Exploration Mode (without Battle Royale).
   */
  private spawnPeacefulCityTaler() {
    for (let i = 0; i < 22; i++) {
      this.spawnSinglePeacefulTaler();
    }
  }

  private spawnSinglePeacefulTaler() {
    let x = (Math.random() - 0.5) * 76;
    let z = (Math.random() - 0.5) * 76;
    let y = 0;

    // 35% chance to spawn on a walkable roof, car, or diving tower!
    if (this.walkableSurfaces.length > 0 && Math.random() < 0.35) {
      const surf = this.walkableSurfaces[Math.floor(Math.random() * this.walkableSurfaces.length)];
      if (surf.rampAxis === 'none') {
        x = THREE.MathUtils.lerp(surf.minX + 0.8, surf.maxX - 0.8, Math.random());
        z = THREE.MathUtils.lerp(surf.minZ + 0.8, surf.maxZ - 0.8, Math.random());
        y = surf.yStart;
      }
    }

    const lootGroup = new THREE.Group();
    const coinGeo = new THREE.CylinderGeometry(0.46, 0.46, 0.14, 16);
    const coinMat = new THREE.MeshStandardMaterial({
      color: 0xFACC15,
      emissive: 0xF59E0B,
      emissiveIntensity: 0.75,
      metalness: 0.8,
      roughness: 0.2,
    });
    const coinMesh = new THREE.Mesh(coinGeo, coinMat);
    coinMesh.rotation.x = Math.PI / 2;
    coinMesh.position.y = 0.75;
    coinMesh.castShadow = true;
    lootGroup.add(coinMesh);

    const glowRing = new THREE.Mesh(
      new THREE.RingGeometry(0.45, 0.62, 16),
      new THREE.MeshBasicMaterial({ color: 0xFDE047, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
    );
    glowRing.rotation.x = -Math.PI / 2;
    glowRing.position.y = 0.06;
    lootGroup.add(glowRing);

    const pos = new THREE.Vector3(x, y, z);
    lootGroup.position.copy(pos);
    this.scene.add(lootGroup);

    const amount = y > 1.5 ? 25 : 12; // Bonus Taler on rooftops/towers!
    this.lootItems.push({ mesh: lootGroup, type: 'taler', pos, amount });
  }

  public setMobileMoveInput(x: number, y: number) {
    this.mobileInputX = THREE.MathUtils.clamp(x, -1, 1);
    this.mobileInputY = THREE.MathUtils.clamp(y, -1, 1);
  }

  public addCameraLookDelta(dxPixels: number, dyPixels: number) {
    const clampedDx = THREE.MathUtils.clamp(dxPixels, -60, 60);
    const clampedDy = THREE.MathUtils.clamp(dyPixels, -60, 60);
    const sensitivity = 0.0042 * this.mouseSensitivity;

    this.cameraYaw -= clampedDx * sensitivity;
    // Wrap cameraYaw cleanly in [-PI, PI] so it never overflows or bugs out!
    this.cameraYaw = Math.atan2(Math.sin(this.cameraYaw), Math.cos(this.cameraYaw));
    this.cameraPitch = THREE.MathUtils.clamp(this.cameraPitch + clampedDy * sensitivity, -0.52, 1.12);
  }

  public triggerJump() {
    if (this.isCrouching) {
      this.crouchToggle = false;
      this.isCrouching = false;
    }
    if (this.isGrounded) {
      this.playerVelY = 8.8;
      this.isGrounded = false;
    }
  }

  public setSprintState(sprinting: boolean) {
    this.isSprinting = sprinting;
    if (sprinting) {
      this.crouchToggle = false;
      this.isCrouching = false;
    }
  }

  public toggleCrouchState() {
    this.crouchToggle = !this.crouchToggle;
    this.isCrouching = this.crouchToggle;
    if (this.isCrouching) {
      this.isSprinting = false;
    }
  }

  public collectNearbyTalerBurst() {
    let collected = 0;
    for (let i = this.lootItems.length - 1; i >= 0; i--) {
      const item = this.lootItems[i];
      if (this.playerPos.distanceTo(item.pos) <= 9.5) {
        const amt = item.amount || 12;
        collected += amt;
        this.score += amt * 2;
        this.scene.remove(item.mesh);
        this.lootItems.splice(i, 1);
        if (this.peacefulMode) {
          this.spawnSinglePeacefulTaler();
        }
      }
    }
    if (collected > 0) {
      soundFx.playCoin();
      this.callbacks.onLootPickup('taler', collected);
      this.callbacks.onScoreChange(this.score);
    }
  }

  public setMobileFireHeld(held: boolean) {
    if (this.peacefulMode || this.isGameOver) {
      this.isMousePhysicallyHeld = false;
      this.isMouseDown = false;
      return;
    }
    this.isMousePhysicallyHeld = held;
    this.isMouseDown = held;
    if (held) {
      this.firePlayerWeapon();
    }
  }

  public toggleMobileAim(): boolean {
    if (this.peacefulMode) {
      this.isAiming = false;
      return false;
    }
    this.isAiming = !this.isAiming;
    return this.isAiming;
  }

  public setMobileAutoFire(enabled: boolean) {
    this.mobileAutoFire = enabled;
  }

  public applyMatchPerk(perkId: MatchPerkId) {
    this.activeMatchPerks.add(perkId);
    soundFx.playPerkSelect();

    if (perkId === 'panzer_weste') {
      this.playerMaxShield += 40;
      this.playerMaxHealth += 40;
      this.playerShield = this.playerMaxShield;
      this.playerHealth = this.playerMaxHealth;
      this.callbacks.onHealthChange(this.playerHealth, this.playerMaxHealth, this.playerShield, this.playerMaxShield);
    } else if (perkId === 'adrenalin_schub') {
      this.playerSpeed *= 1.18;
    } else if (perkId === 'schnellfinger') {
      this.reloadDuration = Math.max(0.6, this.reloadDuration * 0.6);
      const cap = this.getMagazineCapacity();
      this.magazineAmmo = cap;
      this.reserveAmmo = cap * 4;
      this.notifyAmmoState();
    } else if (perkId === 'trupp_moral') {
      this.revitalizeAllies();
      for (const ally of this.allies) {
        ally.maxHealth += 35;
        ally.health = ally.maxHealth;
        ally.damage = Math.round(ally.damage * 1.4);
        ally.speed *= 1.15;
      }
      this.notifyAllies();
    } else if (perkId === 'goldrausch') {
      this.callbacks.onLootPickup('taler', 60, 'Stadtkassen-Goldrausch (+60 NAT)');
      this.score += 120;
      this.callbacks.onScoreChange(this.score);
    }
  }

  private spawnShockwaveRing(pos: THREE.Vector3, maxRadius: number, colorHex: number) {
    const geo = new THREE.RingGeometry(0.4, 0.95, 32);
    const mat = new THREE.MeshBasicMaterial({
      color: colorHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.92,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(pos.x, pos.y + 0.18, pos.z);
    this.scene.add(mesh);
    this.shockwaveEffects.push({
      mesh,
      life: 0.48,
      maxLife: 0.48,
      maxRadius,
    });
  }

  private incrementCombo(basePoints: number, label: string, isCrit: boolean, isBoss: boolean): number {
    this.comboTimer = this.comboMaxTimer;
    const prevCombo = this.comboMultiplier;
    this.comboMultiplier = Math.min(8, this.comboMultiplier + (isBoss ? 2 : 1));
    if (this.comboMultiplier > prevCombo && this.comboMultiplier >= 2) {
      soundFx.playComboMilestone(this.comboMultiplier);
    }
    const multipliedPoints = Math.round(basePoints * this.comboMultiplier);
    this.score += multipliedPoints;
    this.callbacks.onScoreChange(this.score);
    this.callbacks.onComboChange?.(this.comboMultiplier, 1.0);
    this.callbacks.onKillFeedEvent?.({
      id: `kf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      label,
      sublabel: this.comboMultiplier > 1 ? `${this.comboMultiplier}x ADRENALIN-SERIE` : undefined,
      points: multipliedPoints,
      isCrit,
      isBoss,
    });
    return multipliedPoints;
  }

  public triggerAbility(ability: 'shockwave' | 'dash' | 'overdrive'): boolean {
    if (this.peacefulMode || this.isGameOver || this.isPaused) return false;
    const cdMultiplier = this.activeMatchPerks.has('adrenalin_schub') ? 0.7 : 1.0;

    if (ability === 'shockwave') {
      if (this.shockwaveCooldown > 0) return false;
      this.shockwaveCooldown = this.shockwaveMaxCooldown * cdMultiplier;
      soundFx.playShockwave();
      this.cameraShakeIntensity = Math.max(this.cameraShakeIntensity, 0.36);
      this.spawnShockwaveRing(this.playerPos, 11.5, 0xF59E0B);
      this.spawnImpactSparks(this.playerPos.clone().add(new THREE.Vector3(0, 1.0, 0)), 0xF59E0B, 16);

      // Restore +35 Tactical Shield on Bembel-Nova cast
      this.playerShield = Math.min(this.playerMaxShield, this.playerShield + 35);
      this.callbacks.onHealthChange(this.playerHealth, this.playerMaxHealth, this.playerShield, this.playerMaxShield);

      const blastDamage = 95 + this.wave * 18;
      for (let j = this.agents.length - 1; j >= 0; j--) {
        const ag = this.agents[j];
        const dist = this.playerPos.distanceTo(ag.position);
        if (dist <= 11.5) {
          ag.health -= blastDamage;
          this.playerParticipantStats.damageDealt += blastDamage;
          this.spawnDamageNumber(ag.position, blastDamage, true);
          this.spawnImpactSparks(ag.position.clone().add(new THREE.Vector3(0, 1.1, 0)), 0xF59E0B, 8);

          // Knockback away from player
          const pushDir = ag.position.clone().sub(this.playerPos).setY(0).normalize();
          ag.position.addScaledVector(pushDir, 4.2);
          ag.mesh.position.copy(ag.position);

          if (ag.health <= 0) {
            this.eliminateEnemyAt(j, true, 'Bembel-Nova [Q]');
          }
        }
      }
      this.callbacks.onAbilityUsed?.('shockwave', 'Bembel-Nova Schockwelle (+35 Schild)!');
      return true;
    }

    if (ability === 'dash') {
      if (this.dashCooldown > 0) return false;
      this.dashCooldown = this.dashMaxCooldown * cdMultiplier;
      soundFx.playDash();
      this.dashInvulnTimer = 0.65;
      this.spawnShockwaveRing(this.playerPos, 3.6, 0x38BDF8);

      // Instant combat reload boost (+10 rounds directly into magazine)
      const cap = this.getMagazineCapacity();
      this.magazineAmmo = Math.min(cap, this.magazineAmmo + Math.max(4, Math.round(cap * 0.5)));
      this.notifyAmmoState();

      // Surge forward in movement or camera direction
      const dashDir = new THREE.Vector3(-Math.sin(this.cameraYaw), 0, -Math.cos(this.cameraYaw)).normalize();
      if (Math.hypot(this.playerVelX, this.playerVelZ) > 0.5) {
        dashDir.set(this.playerVelX, 0, this.playerVelZ).normalize();
      }
      this.playerVelX = dashDir.x * 26;
      this.playerVelZ = dashDir.z * 26;
      if (this.isGrounded) {
        this.playerVelY = 4.6;
        this.isGrounded = false;
      }
      this.callbacks.onAbilityUsed?.('dash', 'Taktischer Dash & Schnell-Magazin!');
      return true;
    }

    if (ability === 'overdrive') {
      if (this.overdriveCooldown > 0) return false;
      this.overdriveCooldown = this.overdriveMaxCooldown * cdMultiplier;
      this.overdriveActiveTimer = 7.0;
      soundFx.playOrbitalStrike();
      this.cameraShakeIntensity = Math.max(this.cameraShakeIntensity, 0.48);

      // Refill magazine immediately and heal +30 HP & Shield
      this.magazineAmmo = this.getMagazineCapacity();
      this.notifyAmmoState();
      this.playerShield = Math.min(this.playerMaxShield, this.playerShield + 40);
      this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + 30);
      this.callbacks.onHealthChange(this.playerHealth, this.playerMaxHealth, this.playerShield, this.playerMaxShield);

      // Strike up to 3 highest-priority targets from orbit
      const sortedTargets = [...this.agents].sort((a, b) => {
        if (a.role === 'boss') return -1;
        if (b.role === 'boss') return 1;
        return this.playerPos.distanceTo(a.position) - this.playerPos.distanceTo(b.position);
      });
      const strikeTargets = sortedTargets.slice(0, 3);
      const orbitalDmg = 185 + this.wave * 25;

      if (strikeTargets.length === 0) {
        const forwardStrike = this.playerPos
          .clone()
          .add(new THREE.Vector3(-Math.sin(this.cameraYaw) * 10, 0, -Math.cos(this.cameraYaw) * 10));
        this.spawnShockwaveRing(forwardStrike, 8.5, 0xEF4444);
        this.spawnImpactSparks(forwardStrike.add(new THREE.Vector3(0, 1, 0)), 0xF59E0B, 20);
      } else {
        for (const target of strikeTargets) {
          const strikePos = target.position.clone();
          this.spawnShockwaveRing(strikePos, 7.5, 0xEF4444);
          this.spawnImpactSparks(strikePos.clone().add(new THREE.Vector3(0, 1.4, 0)), 0xF59E0B, 18);

          for (let j = this.agents.length - 1; j >= 0; j--) {
            const ag = this.agents[j];
            if (ag.position.distanceTo(strikePos) <= 6.5) {
              ag.health -= orbitalDmg;
              this.playerParticipantStats.damageDealt += orbitalDmg;
              this.spawnDamageNumber(ag.position, orbitalDmg, true);
              if (ag.health <= 0) {
                this.eliminateEnemyAt(j, true, 'Feldberg-Luftschlag [F]');
              }
            }
          }
        }
      }

      this.callbacks.onAbilityUsed?.('overdrive', 'FELDBERG-LUFTSCHLAG & 7s OVERDRIVE AKTIV!');
      return true;
    }

    return false;
  }

  private eliminateEnemyAt(j: number, isCrit: boolean, sourceLabel?: string) {
    const ag = this.agents[j];
    if (!ag) return;

    this.playerParticipantStats.kills += 1;
    const enemyStats = this.allEnemiesStats.get(ag.id);
    if (enemyStats) {
      enemyStats.deaths += 1;
    }

    // Vampir-Äppler Perk: heal +12 Shield & +6 HP on every kill
    if (this.activeMatchPerks.has('vampir_aeppler')) {
      this.playerShield = Math.min(this.playerMaxShield, this.playerShield + 12);
      this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + 6);
      this.callbacks.onHealthChange(this.playerHealth, this.playerMaxHealth, this.playerShield, this.playerMaxShield);
    }

    if (this.trainingMode) {
      this.kills += 1;
      this.callbacks.onKillsChange(this.kills);
      this.incrementCombo(50, `${ag.name} getroffen`, isCrit, false);
      soundFx.playKill();
      ag.health = ag.maxHealth;
      ag.position.x = (Math.random() - 0.5) * 18;
      ag.position.z = -8 - Math.random() * 5;
      ag.mesh.position.copy(ag.position);
      this.notifyWaveState();
      return;
    }

    this.awardExperience(ag.role === 'boss' ? 250 : 100);
    this.kills += 1;
    this.callbacks.onKillsChange(this.kills);

    const baseScore = ag.role === 'boss' ? 500 : 100;
    const killTitle =
      ag.role === 'boss'
        ? `BOSS ELIMINIERT: ${ag.name}`
        : isCrit
        ? `KRIT-TREFFER: ${ag.name}`
        : `${ag.name} ausgeschaltet${sourceLabel ? ` (${sourceLabel})` : ''}`;
    this.incrementCombo(baseScore, killTitle, isCrit, ag.role === 'boss');

    this.callbacks.onEnemyKilled?.({
      arenaId: this.currentArenaId,
      role: ag.role,
      isBoss: ag.role === 'boss',
      weaponId: this.currentWeapon.id,
      wave: this.wave,
      isCrit,
    });
    this.dropLoot(ag.position);
    soundFx.playKill();

    this.scene.remove(ag.mesh);
    this.agents.splice(j, 1);

    if (this.agents.length === 0) {
      this.awardExperience(250 + this.wave * 50);
      if (this.wave < this.totalWaves) {
        this.waveIntermissionTimer = 6.5;
        soundFx.playWaveVictory();
        this.playerShield = Math.min(this.playerMaxShield, this.playerShield + 35);
        this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + 25);
        this.callbacks.onHealthChange(this.playerHealth, this.playerMaxHealth, this.playerShield, this.playerMaxShield);
        this.revitalizeAllies();
        this.notifyWaveState();
      } else {
        this.isGameOver = true;
        this.unlockPointer();
        soundFx.playLevelUp();
        this.callbacks.onGameOver(true, this.getDetailedMatchStats(true));
      }
    } else {
      this.notifyWaveState();
    }
  }

  private spawnImpactSparks(pos: THREE.Vector3, colorHex: number, count = 7) {
    const geo = new THREE.BoxGeometry(0.14, 0.14, 0.14);
    const mat = new THREE.MeshBasicMaterial({ color: colorHex });
    for (let i = 0; i < count; i++) {
      const m = new THREE.Mesh(geo, mat);
      m.position.copy(pos);
      this.scene.add(m);
      this.impactParticles.push({
        mesh: m,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 9,
          2.5 + Math.random() * 6,
          (Math.random() - 0.5) * 9
        ),
        life: 0.35 + Math.random() * 0.25,
      });
    }
  }

  private spawnNeuAnspachAllies() {
    const allyConfigs = [
      { name: 'Kollege Florian', role: 'pionier' as const, offset: new THREE.Vector3(-2.8, 0, 2.8), hp: 125, dmg: 26 },
      { name: 'Kollegin Lena', role: 'ranger' as const, offset: new THREE.Vector3(2.8, 0, 2.8), hp: 105, dmg: 24 },
      { name: 'Kamerad Timo', role: 'feuerwehr' as const, offset: new THREE.Vector3(0, 0, 4.2), hp: 145, dmg: 28 },
    ];

    this.allies = allyConfigs.map((cfg, idx) => {
      const spawnPos = this.playerPos.clone().add(cfg.offset);
      const mesh = createAllyMesh(cfg.name, cfg.role, this.peacefulMode);
      mesh.position.copy(spawnPos);
      this.scene.add(mesh);

      const allyId = `ally_${idx}`;
      this.allAlliesStats.set(allyId, {
        id: allyId,
        name: cfg.name,
        role: cfg.role.toUpperCase(),
        faction: 'neu-anspach',
        isPlayer: false,
        isBot: true,
        kills: 0,
        damageDealt: 0,
        damageTaken: 0,
        deaths: 0,
      });

      return {
        id: allyId,
        name: cfg.name,
        role: cfg.role,
        faction: 'neu-anspach' as const,
        mesh,
        position: spawnPos,
        velocity: new THREE.Vector3(),
        health: cfg.hp,
        maxHealth: cfg.hp,
        speed: 4.6, // Realistic human walking pace!
        damage: cfg.dmg,
        range: 32,
        attackCooldown: 1.2 + Math.random(),
        lastBark: '',
        lastBarkTime: performance.now() / 1000 - Math.random() * 5,
        targetEnemyId: null,
      };
    });

    this.notifyAllies();
  }

  private notifyAllies() {
    this.callbacks.onAlliesChange(
      this.allies.map((a) => ({
        id: a.id,
        name: a.name,
        role: a.role,
        health: Math.max(0, Math.round(a.health)),
        maxHealth: a.maxHealth,
      }))
    );
  }

  public notifyWaveState() {
    if (this.peacefulMode) return;
    const config = WAVE_CONFIGS[this.wave - 1] || WAVE_CONFIGS[WAVE_CONFIGS.length - 1];
    const boss = this.agents.find((a) => a.role === 'boss');
    const isBossWave = this.wave === this.totalWaves || !!boss;

    this.callbacks.onWaveChange({
      wave: this.wave,
      totalWaves: this.totalWaves,
      title: config.title,
      subtitle: config.subtitle,
      status: this.waveIntermissionTimer > 0 ? 'cleared' : isBossWave ? 'boss' : 'active',
      remainingEnemies: this.agents.length,
      totalEnemies: this.currentWaveTotalEnemies,
      intermissionCountdown: this.waveIntermissionTimer > 0 ? Math.ceil(this.waveIntermissionTimer) : undefined,
      bossInfo: boss
        ? {
            name: boss.name,
            health: Math.max(0, Math.round(boss.health)),
            maxHealth: boss.maxHealth,
          }
        : null,
    });
  }

  private revitalizeAllies() {
    this.allies.forEach((a) => {
      a.health = Math.min(a.maxHealth, a.health + 45);
    });

    if (this.allies.length < 3) {
      const missingIdx = 3 - this.allies.length;
      const backupConfigs = [
        { name: 'Kamerad Timo', role: 'feuerwehr' as const, hp: 145, dmg: 28 },
        { name: 'Kollegin Lena', role: 'ranger' as const, hp: 105, dmg: 24 },
        { name: 'Kollege Florian', role: 'pionier' as const, hp: 125, dmg: 26 },
      ];
      const cfg = backupConfigs[missingIdx % backupConfigs.length];
      const spawnPos = new THREE.Vector3(
        this.playerPos.x + (Math.random() - 0.5) * 5,
        0,
        this.playerPos.z + (Math.random() - 0.5) * 5
      );
      const mesh = createAllyMesh(cfg.name, cfg.role, this.peacefulMode);
      mesh.position.copy(spawnPos);
      this.scene.add(mesh);

      const allyId = `ally_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      this.allAlliesStats.set(allyId, {
        id: allyId,
        name: cfg.name,
        role: cfg.role.toUpperCase(),
        faction: 'neu-anspach',
        isPlayer: false,
        isBot: true,
        kills: 0,
        damageDealt: 0,
        damageTaken: 0,
        deaths: 0,
      });

      this.allies.push({
        id: allyId,
        name: cfg.name,
        role: cfg.role,
        faction: 'neu-anspach',
        mesh,
        position: spawnPos,
        velocity: new THREE.Vector3(),
        health: cfg.hp,
        maxHealth: cfg.hp,
        speed: 4.6,
        damage: cfg.dmg,
        range: 32,
        attackCooldown: 1.2,
        lastBark: '',
        lastBarkTime: performance.now() / 1000,
        targetEnemyId: null,
      });
      this.callbacks.onCombatBark(cfg.name, 'Neu-Anspach Verstärkung ist eingetroffen!');
    }
    this.notifyAllies();
  }

  public spawnWehrheimerWave(waveNumber: number) {
    if (this.peacefulMode) return;
    const config = WAVE_CONFIGS[waveNumber - 1] || WAVE_CONFIGS[WAVE_CONFIGS.length - 1];

    for (const ag of this.agents) {
      this.scene.remove(ag.mesh);
    }
    this.agents = [];

    const spawnList: AgentRole[] = [];
    for (let i = 0; i < config.flankers; i++) spawnList.push('flanker');
    for (let i = 0; i < config.snipers; i++) spawnList.push('sniper');
    for (let i = 0; i < config.shocktroopers; i++) spawnList.push('shocktrooper');
    for (let i = 0; i < config.bosses; i++) spawnList.push('boss');

    this.currentWaveTotalEnemies = spawnList.length;

    spawnList.forEach((role, idx) => {
      const angle = (idx / spawnList.length) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const dist = role === 'boss' ? 34 : 24 + Math.random() * 14;

      const spawnX = Math.cos(angle) * dist;
      const spawnZ = Math.sin(angle) * dist;

      const mesh = createWehrheimerMesh(role);
      mesh.position.set(spawnX, 0, spawnZ);
      this.scene.add(mesh);

      const baseHp = role === 'boss' ? 600 : role === 'shocktrooper' ? 115 : role === 'sniper' ? 95 : 105;
      const maxHp = Math.round(baseHp * (1 + (waveNumber - 1) * 0.08));
      // Realistic human enemy speeds (much slower and grounded!)
      const speed = role === 'flanker' ? 4.3 : role === 'shocktrooper' ? 4.6 : role === 'boss' ? 3.2 : 3.3;
      const damage = role === 'boss' ? 30 : role === 'sniper' ? 20 : 12;
      const range = role === 'sniper' ? 38 : role === 'boss' ? 28 : 20;

      const agent: WehrheimerAgent = {
        id: 'w_' + Math.random().toString(36).substring(2, 8),
        role,
        name: role === 'boss' ? 'Traktor-Horst (Boss)' : `Wehrheimer ${role}`,
        faction: 'wehrheim',
        mesh,
        position: new THREE.Vector3(spawnX, 0, spawnZ),
        velocity: new THREE.Vector3(),
        health: maxHp,
        maxHealth: maxHp,
        speed,
        damage,
        range,
        attackCooldown: 1.4 + Math.random() * 1.5,
        currentOrder: 'Angriff auf Neu-Anspach!',
        lastBark: '',
        lastBarkTime: 0,
      };

      this.allEnemiesStats.set(agent.id, {
        id: agent.id,
        name: agent.name,
        role: role.toUpperCase(),
        faction: 'wehrheim',
        isPlayer: false,
        isBot: true,
        isBoss: role === 'boss',
        kills: 0,
        damageDealt: 0,
        damageTaken: 0,
        deaths: 0,
      });

      this.agents.push(agent);
    });

    this.notifyWaveState();
  }

  public applyCommanderDirectives(directives: {
    flankers?: string;
    snipers?: string;
    shocktroopers?: string;
    bark?: string;
  }) {
    if (directives.bark) {
      this.callbacks.onCombatBark('Master-Commander Feldberg-Stier', directives.bark);
    }
    this.agents.forEach((ag) => {
      if (ag.role === 'flanker' && directives.flankers) ag.currentOrder = directives.flankers;
      if (ag.role === 'sniper' && directives.snipers) ag.currentOrder = directives.snipers;
      if (ag.role === 'shocktrooper' && directives.shocktroopers) ag.currentOrder = directives.shocktroopers;
    });
  }

  public setWeapon(weaponKey: string) {
    if (WEAPONS[weaponKey]) {
      this.currentWeapon = WEAPONS[weaponKey];
      this.reloadTimer = 0;
      this.callbacks.onReloadStateChange?.(false, 0);
      if (this.weaponUpgrades[weaponKey]) {
        this.attachments = { ...this.weaponUpgrades[weaponKey].attachments };
      }
      this.resetWeaponAmmo();
      this.refreshPlayer3DWeapon();
      this.callbacks.onAttachmentsChange?.({ ...this.attachments }, weaponKey);
      this.callbacks.onWeaponChange?.(weaponKey);
    }
  }

  private getMagazineCapacity(): number {
    const baseCapacity = this.currentWeapon.id === 'handkaes' ? 6 : this.currentWeapon.id === 'spritzer' ? 8 : 30;
    return baseCapacity + (this.attachments.mag || 0) * 4;
  }

  private resetWeaponAmmo() {
    this.magazineAmmo = this.getMagazineCapacity();
    this.reserveAmmo = this.getMagazineCapacity() * 3;
    this.notifyAmmoState();
  }

  private notifyAmmoState() {
    this.callbacks.onAmmoChange?.(this.magazineAmmo, this.reserveAmmo, this.getMagazineCapacity());
  }

  private notifyLevelState() {
    this.callbacks.onLevelChange?.(this.playerLevel, this.playerExperience, this.experienceToNextLevel);
  }

  public reloadWeapon() {
    if (this.peacefulMode || this.isGameOver || this.reloadTimer > 0) return;
    const capacity = this.getMagazineCapacity();
    if (this.magazineAmmo >= capacity) return;

    // Tactical emergency ammo scavenging: If reserveAmmo <= 0, award emergency magazine so player is NEVER stranded
    if (this.reserveAmmo <= 0) {
      this.reserveAmmo = capacity;
      this.callbacks.onLootPickup('ammo', capacity, 'Notfall-Munition geborgen');
    }

    this.reloadTimer = this.reloadDuration;
    this.isMouseDown = false;
    soundFx.playReload();
    this.lastReloadNotifyTime = performance.now();
    this.callbacks.onReloadStateChange?.(true, this.reloadTimer);
  }

  private finishReload() {
    const needed = this.getMagazineCapacity() - this.magazineAmmo;
    const loaded = Math.min(needed, Math.max(1, this.reserveAmmo));
    this.magazineAmmo += loaded;
    this.reserveAmmo = Math.max(0, this.reserveAmmo - loaded);
    this.reloadTimer = 0;
    this.callbacks.onReloadStateChange?.(false, 0);
    this.notifyAmmoState();

    // Auto-resume firing smoothly if player is still holding down the left mouse button!
    if (this.isMousePhysicallyHeld && !this.peacefulMode && !this.isGameOver) {
      this.isMouseDown = true;
    }
  }

  private awardExperience(amount: number) {
    if (this.peacefulMode || amount <= 0) return;
    this.playerExperience += amount;
    while (this.playerExperience >= this.experienceToNextLevel) {
      this.playerExperience -= this.experienceToNextLevel;
      this.playerLevel += 1;
      this.experienceToNextLevel = Math.round(this.experienceToNextLevel * 1.18);
      this.playerMaxHealth += 5;
      this.playerMaxShield += 5;
      this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + 5);
      this.playerShield = Math.min(this.playerMaxShield, this.playerShield + 5);
      this.callbacks.onHealthChange(this.playerHealth, this.playerMaxHealth, this.playerShield, this.playerMaxShield);
      soundFx.playLevelUp();
    }
    this.notifyLevelState();
  }

  public setWeaponUpgrades(upgrades: AllWeaponsUpgrades) {
    this.weaponUpgrades = JSON.parse(JSON.stringify(upgrades));
    if (this.weaponUpgrades[this.currentWeapon.id]) {
      this.attachments = { ...this.weaponUpgrades[this.currentWeapon.id].attachments };
    }
    this.refreshPlayer3DWeapon();
  }

  public setInputSettings(mouseSensitivity: number, controls: Partial<ControlSettings>) {
    this.mouseSensitivity = THREE.MathUtils.clamp(mouseSensitivity, 0.25, 3);
    this.controls = { ...this.controls, ...controls };
  }

  public requestLock() {
    if (!this.isGameOver && !this.isPaused && !this.peacefulMode) {
      try {
        this.container.requestPointerLock?.();
      } catch {}
    }
  }

  public unlockPointer() {
    if (document.pointerLockElement) {
      try {
        document.exitPointerLock?.();
      } catch {}
    }
    this.isPointerLocked = false;
    this.callbacks.onPointerLockChange(false);
  }

  public setPaused(paused: boolean) {
    if (this.isGameOver || this.peacefulMode) return;
    this.isPaused = paused;
    this.keys = {};
    this.isMouseDown = false;
    this.isSprinting = false;
    this.isCrouching = false;
    if (paused) {
      this.unlockPointer();
    }
  }

  private initControls() {
    const onLockChange = () => {
      this.isPointerLocked = document.pointerLockElement === this.container;
      this.hasValidLastMouse = false;
      this.callbacks.onPointerLockChange(this.isPointerLocked);
    };
    document.addEventListener('pointerlockchange', onLockChange);
    this.cleanupListeners.push(() => document.removeEventListener('pointerlockchange', onLockChange));

    const onContainerClick = () => {
      if (!this.isGameOver && !this.isPaused && !this.isPointerLocked && !this.peacefulMode) {
        try {
          this.container.requestPointerLock?.();
        } catch {}
      }
    };
    this.container.addEventListener('click', onContainerClick);
    this.cleanupListeners.push(() => this.container.removeEventListener('click', onContainerClick));

    const onKeyDown = (e: KeyboardEvent) => {
      const lowerKey = e.key.toLowerCase();
      this.keys[lowerKey] = true;

      // Prevent browser shortcuts (e.g. Ctrl+S, Ctrl+A, Ctrl+D) when holding Strg (Control) + WASD
      if (e.ctrlKey && ['w', 'a', 's', 'd', ' '].includes(lowerKey)) {
        e.preventDefault();
      }

      if (this.isKey(e, this.controls.jump)) {
        e.preventDefault();
        this.triggerJump();
      }

      if (!e.repeat && (lowerKey === 'r' || this.isKey(e, this.controls.reload))) {
        this.reloadWeapon();
      }

      // SHIFT = SPRINT
      if (this.isKey(e, this.controls.sprint)) {
        this.isSprinting = true;
        this.crouchToggle = false;
        this.isCrouching = false;
      }

      // STRG (Control) = CROUCH (Hold)
      if (this.isKey(e, this.controls.crouch)) {
        e.preventDefault();
        this.isCrouching = true;
        this.isSprinting = false;
      }

      // Optional 'C' key = Toggle Crouch
      if (!e.ctrlKey && lowerKey === 'c') {
        this.crouchToggle = !this.crouchToggle;
        this.isCrouching = this.crouchToggle;
        if (this.isCrouching) {
          this.isSprinting = false;
        }
      }

      if (!this.peacefulMode) {
        const k = e.key;
        const code = e.code;
        if (k === '1' || code === 'Digit1' || code === 'Numpad1') this.setWeapon('bembel');
        if (k === '2' || code === 'Digit2' || code === 'Numpad2') this.setWeapon('zwille');
        if (k === '3' || code === 'Digit3' || code === 'Numpad3') this.setWeapon('spritzer');
        if (k === '4' || code === 'Digit4' || code === 'Numpad4') this.setWeapon('handkaes');
        if (!e.repeat) {
          if (lowerKey === 'q') this.triggerAbility('shockwave');
          if (lowerKey === 'e') this.triggerAbility('dash');
          if (lowerKey === 'f') this.triggerAbility('overdrive');
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    this.cleanupListeners.push(() => window.removeEventListener('keydown', onKeyDown));

    const onKeyUp = (e: KeyboardEvent) => {
      const lowerKey = e.key.toLowerCase();
      this.keys[lowerKey] = false;

      if (this.isKey(e, this.controls.sprint)) {
        this.isSprinting = false;
      }
      if (this.isKey(e, this.controls.crouch)) {
        this.crouchToggle = false;
        this.isCrouching = false;
      }
    };
    window.addEventListener('keyup', onKeyUp);
    this.cleanupListeners.push(() => window.removeEventListener('keyup', onKeyUp));

    const onWindowBlur = () => {
      this.keys = {};
      this.isSprinting = false;
      this.isCrouching = false;
      this.crouchToggle = false;
      this.isMouseDown = false;
      this.isMousePhysicallyHeld = false;
    };
    window.addEventListener('blur', onWindowBlur);
    this.cleanupListeners.push(() => window.removeEventListener('blur', onWindowBlur));

    // Spike-free, zero-React-thrashing mouse look handler!
    const onMouseMove = (e: MouseEvent) => {
      let dx = 0;
      let dy = 0;

      if (this.isPointerLocked) {
        dx = e.movementX || 0;
        dy = e.movementY || 0;
        // Filter out Chromium/Safari PointerLock recentering spikes (>130px in a single event)
        if (Math.abs(dx) > 130 || Math.abs(dy) > 130) {
          return;
        }
      } else if (e.buttons === 1 || e.buttons === 2) {
        if (this.hasValidLastMouse) {
          dx = e.clientX - this.lastMouseX;
          dy = e.clientY - this.lastMouseY;
        }
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        this.hasValidLastMouse = true;
      } else {
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        this.hasValidLastMouse = false;
        return;
      }

      dx = THREE.MathUtils.clamp(dx, -65, 65);
      dy = THREE.MathUtils.clamp(dy, -65, 65);

      if (dx !== 0 || dy !== 0) {
        const sensitivity = (this.isAiming ? 0.0018 : 0.0028) * this.mouseSensitivity;
        this.cameraYaw -= dx * sensitivity;
        // Normalize yaw to [-PI, PI] so continuous 360° rotation never overflows or glitches
        this.cameraYaw = Math.atan2(Math.sin(this.cameraYaw), Math.cos(this.cameraYaw));
        this.cameraPitch = THREE.MathUtils.clamp(this.cameraPitch + dy * sensitivity, -0.52, 1.12);
      }

    };
    window.addEventListener('mousemove', onMouseMove);
    this.cleanupListeners.push(() => window.removeEventListener('mousemove', onMouseMove));

    const onMouseDown = (e: MouseEvent) => {
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      this.hasValidLastMouse = true;

      if (e.button === 0 && !this.peacefulMode) {
        this.isMousePhysicallyHeld = true;
        // Only fire when clicking inside canvas
        if (this.container.contains(e.target as Node) || this.isPointerLocked) {
          this.isMouseDown = true;
          this.firePlayerWeapon();
        }
      } else if (e.button === 2 && !this.peacefulMode) {
        e.preventDefault();
        this.isAiming = true;
      }
    };
    window.addEventListener('mousedown', onMouseDown);
    this.cleanupListeners.push(() => window.removeEventListener('mousedown', onMouseDown));

    const onMouseUp = (e: MouseEvent) => {
      this.hasValidLastMouse = false;
      if (e.button === 0) {
        this.isMousePhysicallyHeld = false;
        this.isMouseDown = false;
      } else if (e.button === 2) {
        this.isAiming = false;
      }
    };
    window.addEventListener('mouseup', onMouseUp);
    this.cleanupListeners.push(() => window.removeEventListener('mouseup', onMouseUp));

    const onContextMenu = (e: MouseEvent) => e.preventDefault();
    window.addEventListener('contextmenu', onContextMenu);
    this.cleanupListeners.push(() => window.removeEventListener('contextmenu', onContextMenu));
  }

  private isKey(event: KeyboardEvent, binding: string): boolean {
    const normalized = binding.toLowerCase();
    if (normalized === ' ') return event.code === 'Space';
    if (normalized === 'shift') return event.key === 'Shift' || event.code.startsWith('Shift');
    if (normalized === 'control' || normalized === 'ctrl') {
      return event.key === 'Control' || event.code.startsWith('Control');
    }
    return event.key.toLowerCase() === normalized || event.code.toLowerCase() === normalized;
  }

  private spawnTrainingTargets() {
    const targetCount = 6;
    this.currentWaveTotalEnemies = targetCount;
    for (let i = 0; i < targetCount; i++) {
      const x = (i - (targetCount - 1) / 2) * 4.2;
      const z = -8 - (i % 2) * 3;
      const mesh = createWehrheimerMesh('flanker');
      mesh.position.set(x, 0, z);
      this.scene.add(mesh);
      this.agents.push({
        id: `training_${i}`,
        role: 'flanker',
        name: `Zielscheibe ${i + 1}`,
        faction: 'wehrheim',
        mesh,
        position: new THREE.Vector3(x, 0, z),
        velocity: new THREE.Vector3(),
        health: 100,
        maxHealth: 100,
        speed: 0,
        damage: 0,
        range: 0,
        attackCooldown: 999,
        currentOrder: 'Bewegt sich auf der Schießbahn',
        lastBark: '',
        lastBarkTime: 0,
      });
    }
    this.notifyWaveState();
  }

  public firePlayerWeapon() {
    if (this.peacefulMode || this.isGameOver) return;
    if (this.reloadTimer > 0) return;

    const upgState = this.weaponUpgrades[this.currentWeapon.id] || {
      rarityTier: 1,
      papLevel: 0,
      attachments: this.attachments,
    };
    const effectiveStats = getEffectiveWeaponStats(this.currentWeapon, {
      ...upgState,
      attachments: this.attachments,
    });

    const now = performance.now() / 1000;
    const overdriveFireMult = this.overdriveActiveTimer > 0 ? 1.45 : 1.0;
    const effectiveFireRate = effectiveStats.fireRate * overdriveFireMult;
    if (now - this.lastFireTime < 1 / effectiveFireRate) {
      return;
    }
    if (this.magazineAmmo <= 0 && this.overdriveActiveTimer <= 0) {
      this.reloadWeapon();
      return;
    }
    if (this.overdriveActiveTimer <= 0) {
      this.magazineAmmo -= 1;
      this.notifyAmmoState();
    }
    this.lastFireTime = now;
    soundFx.playShoot(this.currentWeapon.id);

    const crouchRecoilMult = 1 - this.currentCrouchAmount * 0.35;
    const recoilReduction = Math.max(0.3, (1 - (this.attachments.scope || 0) * 0.16) * crouchRecoilMult);
    this.recoilPitch = Math.min(0.032, this.recoilPitch + 0.0055 * recoilReduction);

    // Use the camera's optical axis so the projectile and the center reticle stay
    // aligned even when the over-the-shoulder camera is pitched up or down.
    this.camera.getWorldDirection(_bulletDir);

    const rightVec = new THREE.Vector3(Math.cos(this.cameraYaw), 0, -Math.sin(this.cameraYaw));
    const muzzleHeight = 1.4 - this.currentCrouchAmount * 0.44;
    const spawnPos = this.playerPos
      .clone()
      .add(new THREE.Vector3(0, muzzleHeight, 0))
      .addScaledVector(rightVec, 0.42)
      .addScaledVector(_bulletDir, 1.05);

    this.muzzleLight.color.set(effectiveStats.tracerColor);
    this.muzzleLight.position.copy(spawnPos);
    this.muzzleLight.intensity = 4.5 + (upgState.papLevel || 0) * 1.5;
    this.muzzleFlashTimer = 0.045;

    const perkDmgMult =
      (this.activeMatchPerks.has('explosiv_kerne') ? 1.25 : 1.0) *
      (this.overdriveActiveTimer > 0 ? 1.25 : 1.0);
    const perkSplashBonus = this.activeMatchPerks.has('explosiv_kerne') ? 1.15 : 0;

    const effectiveDamage = Math.round(effectiveStats.damage * perkDmgMult);
    const effectiveSpeed = effectiveStats.bulletSpeed;
    const effectiveSplash = effectiveStats.splashRadius + perkSplashBonus;
    const activeTracerColor = this.overdriveActiveTimer > 0 ? '#FACC15' : effectiveStats.tracerColor;

    const isMine = this.currentWeapon.id === 'handkaes';
    const isShotgun = this.currentWeapon.id === 'spritzer';

    if (isShotgun) {
      const pelletCount = 4 + (this.attachments.mag || 0) + (upgState.papLevel > 0 ? 2 : 0);
      const baseSpread = Math.max(0.025, 0.08 - (this.attachments.scope || 0) * 0.015);
      const spreadAmount = baseSpread * (1 - this.currentCrouchAmount * 0.25);
      for (let p = 0; p < pelletCount; p++) {
        const spreadDir = _bulletDir
          .clone()
          .add(
            new THREE.Vector3(
              (Math.random() - 0.5) * spreadAmount,
              (Math.random() - 0.5) * spreadAmount,
              (Math.random() - 0.5) * spreadAmount
            )
          )
          .normalize();

        const pelletGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.95, 6);
        const pelletMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(activeTracerColor),
          emissive: new THREE.Color(activeTracerColor),
          emissiveIntensity: 3.4,
        });
        const mesh = new THREE.Mesh(pelletGeo, pelletMat);
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), spreadDir);
        mesh.position.copy(spawnPos);
        this.scene.add(mesh);

        this.bullets.push({
          mesh,
          position: spawnPos.clone(),
          velocity: spreadDir.clone().multiplyScalar(effectiveSpeed),
          damage: effectiveDamage,
          life: (this.currentWeapon.range * 1.15) / effectiveSpeed,
          fromPlayer: true,
          color: activeTracerColor,
          splashRadius: effectiveSplash,
        });
      }
    } else if (isMine) {
      const bulletGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.65, 8);
      const bulletMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(activeTracerColor),
        emissive: new THREE.Color(activeTracerColor),
        emissiveIntensity: 2.8,
      });
      const mesh = new THREE.Mesh(bulletGeo, bulletMat);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), _bulletDir);
      mesh.position.copy(spawnPos);
      this.scene.add(mesh);

      this.bullets.push({
        mesh,
        position: spawnPos,
        velocity: _bulletDir.clone().multiplyScalar(effectiveSpeed),
        damage: effectiveDamage,
        life: (this.currentWeapon.range * 1.2) / effectiveSpeed,
        fromPlayer: true,
        color: activeTracerColor,
        splashRadius: effectiveSplash,
      });
    } else {
      const bulletGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 6);
      const bulletMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(activeTracerColor),
        emissive: new THREE.Color(activeTracerColor),
        emissiveIntensity: 3.8 + (upgState.papLevel || 0) * 0.8,
      });
      const mesh = new THREE.Mesh(bulletGeo, bulletMat);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), _bulletDir);
      mesh.position.copy(spawnPos);
      this.scene.add(mesh);

      this.bullets.push({
        mesh,
        position: spawnPos,
        velocity: _bulletDir.clone().multiplyScalar(effectiveSpeed),
        damage: effectiveDamage,
        life: (this.currentWeapon.range * 1.2) / effectiveSpeed,
        fromPlayer: true,
        color: activeTracerColor,
        splashRadius: effectiveSplash,
      });
    }
  }

  private fireAllyWeapon(ally: AllyAgent, target: WehrheimerAgent) {
    soundFx.playShoot();

    _bulletDir.subVectors(target.position, ally.position);
    _bulletDir.y = 0;
    _bulletDir.normalize();

    const geo = new THREE.CylinderGeometry(0.055, 0.055, 1.3, 6);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x38BDF8,
      emissive: 0x38BDF8,
      emissiveIntensity: 2.8,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), _bulletDir);
    const spawnPos = ally.position.clone().add(new THREE.Vector3(0, 1.35, 0));
    mesh.position.copy(spawnPos);
    this.scene.add(mesh);

    this.bullets.push({
      mesh,
      position: spawnPos,
      velocity: _bulletDir.clone().multiplyScalar(95),
      damage: ally.damage,
      life: 1.5,
      fromPlayer: false,
      fromAlly: true,
      fromAllyId: ally.id,
      color: '#38BDF8',
      splashRadius: 1.5,
    });
  }

  private spawnDamageNumber(pos: THREE.Vector3, amount: number, isCrit = false) {
    const sprite = createDamageSprite(amount, isCrit);
    sprite.position.copy(pos).add(new THREE.Vector3((Math.random() - 0.5) * 0.8, 2.3, (Math.random() - 0.5) * 0.8));
    this.scene.add(sprite);

    this.floatingDamages.push({
      sprite,
      position: sprite.position.clone(),
      life: 0.85,
      maxLife: 0.85,
    });
  }

  private dropLoot(pos: THREE.Vector3, forceType?: 'attachment' | 'shield' | 'health' | 'ammo' | 'taler') {
    const roll = Math.random();
    const type: 'ammo' | 'health' | 'taler' | 'shield' | 'attachment' =
      forceType ||
      (roll < 0.24
        ? 'attachment'
        : roll < 0.52
        ? 'shield'
        : roll < 0.78
        ? 'health'
        : roll < 0.9
        ? 'ammo'
        : 'taler');

    const lootGroup = new THREE.Group();

    let color = 0xF59E0B;
    let geo: THREE.BufferGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.15, 8);
    let attachmentType: AttachmentType | undefined;

    if (type === 'attachment') {
      const types: AttachmentType[] = ['scope', 'barrel', 'bolt', 'mag', 'stock'];
      attachmentType = types[Math.floor(Math.random() * types.length)];
      color = 0xF59E0B;
      geo = new THREE.OctahedronGeometry(0.48, 0);
    } else if (type === 'ammo') {
      color = 0x3B82F6;
      geo = new THREE.BoxGeometry(0.55, 0.55, 0.55);
    } else if (type === 'health') {
      color = 0x10B981;
      geo = new THREE.SphereGeometry(0.4, 10, 10);
    } else if (type === 'shield') {
      color = 0x06B6D4;
      geo = new THREE.CylinderGeometry(0.28, 0.35, 0.7, 10);
    }

    const mesh = new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: type === 'attachment' ? 1.1 : 0.55,
        metalness: 0.6,
        roughness: 0.25,
      })
    );
    mesh.position.y = 0.55;
    lootGroup.add(mesh);
    lootGroup.position.copy(pos);
    this.scene.add(lootGroup);

    this.lootItems.push({ mesh: lootGroup, type, attachmentType, pos: pos.clone() });
  }

  private tick = () => {
    if (this.isDestroyed) return;
    this.animationFrameId = requestAnimationFrame(this.tick);

    const delta = Math.min(this.clock.getDelta(), 0.1);
    const elapsed = this.clock.getElapsedTime();

    if (this.isPaused) {
      this.renderer.render(this.scene, this.camera);
      return;
    }

    if (this.arenaUpdateFn) {
      this.arenaUpdateFn(delta);
    }

    if (this.muzzleFlashTimer > 0) {
      this.muzzleFlashTimer -= delta;
      if (this.muzzleFlashTimer <= 0) {
        this.muzzleLight.intensity = 0;
      }
    }

    // Weapon Reload countdown (Runs continuously independent of muzzle flash!)
    if (this.reloadTimer > 0) {
      this.reloadTimer = Math.max(0, this.reloadTimer - delta);
      const now = performance.now();
      if (now - this.lastReloadNotifyTime > 80 || this.reloadTimer === 0) {
        this.lastReloadNotifyTime = now;
        this.callbacks.onReloadStateChange?.(true, this.reloadTimer);
      }
      if (this.reloadTimer === 0) {
        this.finishReload();
      }
    }

    // Animate Electric Fortnite Storm Wall Texture & Floating Clouds
    if (this.stormMesh && this.stormMesh.material) {
      const mat = this.stormMesh.material as THREE.MeshStandardMaterial;
      if (mat.map) {
        mat.map.offset.y += delta * 0.18;
        mat.map.offset.x += delta * 0.05;
      }
    }
    for (const cloud of this.clouds) {
      cloud.position.x += delta * 1.4;
      if (cloud.position.x > 115) cloud.position.x = -115;
    }

    // Gun recoil decay
    if (this.recoilPitch > 0) {
      this.recoilPitch = Math.max(0, this.recoilPitch - delta * 0.28);
    }

    // Tactical Operator Ability Cooldowns & Overdrive Timer
    if (this.shockwaveCooldown > 0) this.shockwaveCooldown = Math.max(0, this.shockwaveCooldown - delta);
    if (this.dashCooldown > 0) this.dashCooldown = Math.max(0, this.dashCooldown - delta);
    if (this.overdriveCooldown > 0) this.overdriveCooldown = Math.max(0, this.overdriveCooldown - delta);
    if (this.overdriveActiveTimer > 0) this.overdriveActiveTimer = Math.max(0, this.overdriveActiveTimer - delta);
    if (this.dashInvulnTimer > 0) this.dashInvulnTimer = Math.max(0, this.dashInvulnTimer - delta);

    if (elapsed - this.lastAbilityNotifyTime > 0.1) {
      this.lastAbilityNotifyTime = elapsed;
      const cdMult = this.activeMatchPerks.has('adrenalin_schub') ? 0.7 : 1.0;
      this.callbacks.onAbilityCooldownsChange?.({
        shockwave: Math.round(this.shockwaveCooldown * 10) / 10,
        shockwaveMax: Math.round(this.shockwaveMaxCooldown * cdMult * 10) / 10,
        dash: Math.round(this.dashCooldown * 10) / 10,
        dashMax: Math.round(this.dashMaxCooldown * cdMult * 10) / 10,
        overdrive: Math.round(this.overdriveCooldown * 10) / 10,
        overdriveMax: Math.round(this.overdriveMaxCooldown * cdMult * 10) / 10,
        overdriveActive: this.overdriveActiveTimer > 0,
      });
    }

    // Adrenaline Combo Streak Decay
    if (this.comboTimer > 0) {
      this.comboTimer = Math.max(0, this.comboTimer - delta);
      this.callbacks.onComboChange?.(this.comboMultiplier, this.comboTimer / this.comboMaxTimer);
      if (this.comboTimer === 0 && this.comboMultiplier > 1) {
        this.comboMultiplier = 1;
        this.callbacks.onComboChange?.(1, 0);
      }
    }

    // Expanding 3D Shockwave & Orbital Rings
    for (let sIdx = this.shockwaveEffects.length - 1; sIdx >= 0; sIdx--) {
      const sw = this.shockwaveEffects[sIdx];
      sw.life -= delta;
      const progress = 1 - Math.max(0, sw.life / sw.maxLife);
      const scale = Math.max(0.2, progress * sw.maxRadius);
      sw.mesh.scale.set(scale, scale, 1);
      const mat = sw.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, (sw.life / sw.maxLife) * 0.9);
      if (sw.life <= 0) {
        this.scene.remove(sw.mesh);
        this.shockwaveEffects.splice(sIdx, 1);
      }
    }

    // Auto-Fire while holding left mouse button OR Mobile Auto-Fire when locked onto target
    if (!this.isGameOver && !this.peacefulMode) {
      if (this.isMouseDown) {
        this.firePlayerWeapon();
      } else if (this.mobileAutoFire && this.agents.length > 0) {
        // Mobile Smart Aim-Assist & Auto-Fire when an enemy is within frontal cone
        this.camera.getWorldDirection(_bulletDir);
        let bestDot = 0.92; // ~23 degree cone
        let lockTarget: WehrheimerAgent | null = null;
        for (const ag of this.agents) {
          const dist = this.playerPos.distanceTo(ag.position);
          if (dist <= this.currentWeapon.range * 1.15) {
            _tempVec.subVectors(ag.position.clone().add(new THREE.Vector3(0, 1.1, 0)), this.camera.position).normalize();
            const dot = _bulletDir.dot(_tempVec);
            if (dot > bestDot) {
              bestDot = dot;
              lockTarget = ag;
            }
          }
        }
        if (lockTarget) {
          // Gentle magnetic aim assist toward target
          const dx = lockTarget.position.x - this.playerPos.x;
          const dz = lockTarget.position.z - this.playerPos.z;
          const targetYaw = Math.atan2(-dx, -dz);
          let yawDiff = targetYaw - this.cameraYaw;
          yawDiff = Math.atan2(Math.sin(yawDiff), Math.cos(yawDiff));
          this.cameraYaw += yawDiff * Math.min(1, delta * 4.5);
          this.firePlayerWeapon();
        }
      }
    }

    // Wave Intermission Breather countdown
    if (!this.peacefulMode && this.waveIntermissionTimer > 0) {
      this.waveIntermissionTimer -= delta;
      this.notifyWaveState();
      if (this.waveIntermissionTimer <= 0) {
        this.waveIntermissionTimer = 0;
        this.wave += 1;
        this.spawnWehrheimerWave(this.wave);
        if (this.wave === this.totalWaves) {
          soundFx.playBossSpawn();
        } else {
          soundFx.playWaveStart();
        }
      }
    }

    this.updatePlayer(delta, elapsed);
    if (!this.peacefulMode && !this.trainingMode) {
      this.updateStormZone(delta);
      this.updateAgents(delta, elapsed);
      this.updateTargeting();
    } else if (this.trainingMode) {
      this.updateAgents(delta, elapsed);
      this.updateTargeting();
    }
    this.updateBullets(delta);
    this.updateAllies(delta, elapsed);
    this.updateFloatingDamages(delta);
    this.updateImpactParticles(delta);
    this.updateLoot();

    // Throttled 2D Tactical Radar Telemetry Update (~8 Hz)
    if (elapsed - this.lastRadarNotifyTime > 0.12) {
      this.lastRadarNotifyTime = elapsed;
      const blips: RadarBlip[] = [];
      for (const ag of this.agents) {
        blips.push({
          id: ag.id,
          x: ag.position.x,
          z: ag.position.z,
          kind: ag.role === 'boss' ? 'boss' : 'enemy',
        });
      }
      for (const al of this.allies) {
        blips.push({
          id: al.id,
          x: al.position.x,
          z: al.position.z,
          kind: 'ally',
        });
      }
      for (let cIdx = 0; cIdx < this.destructibles.length; cIdx++) {
        const prop = this.destructibles[cIdx];
        if (prop.kind === 'tech_case') {
          blips.push({
            id: `chest_${cIdx}`,
            x: prop.position.x,
            z: prop.position.z,
            kind: 'chest',
          });
        }
      }
      for (let lIdx = 0; lIdx < this.lootItems.length; lIdx++) {
        const lt = this.lootItems[lIdx];
        if (lt.type === 'taler' || lt.type === 'attachment') {
          blips.push({
            id: `loot_${lIdx}`,
            x: lt.pos.x,
            z: lt.pos.z,
            kind: lt.type === 'taler' ? 'taler' : 'chest',
          });
        }
      }
      this.callbacks.onRadarUpdate?.({
        playerX: this.playerPos.x,
        playerZ: this.playerPos.z,
        playerYaw: this.cameraYaw,
        stormRadius: this.stormRadius,
        blips,
      });
    }

    // Throttled Compass Heading Update (prevents React state thrashing on mousemove!)
    if (elapsed - this.lastHeadingNotifyTime > 0.08) {
      let deg = Math.round(((-this.cameraYaw * 180) / Math.PI) % 360);
      if (deg < 0) deg += 360;
      if (Math.abs(deg - this.lastReportedHeading) >= 1) {
        this.lastReportedHeading = deg;
        this.lastHeadingNotifyTime = elapsed;
        this.callbacks.onHeadingChange(deg);
      }
    }

    // Smooth Over-The-Shoulder Camera Positioning with Sprint FOV & Crouch Eye-Level
    const isMovingNow = Math.hypot(this.playerVelX, this.playerVelZ) > 0.25;
    const activeSprintCam = this.isSprinting && !this.isCrouching && !this.isAiming && isMovingNow;

    const targetDist = this.isAiming ? 1.85 : activeSprintCam ? 3.35 : this.isCrouching ? 2.45 : 2.85;
    const targetShoulderOffset = this.peacefulMode ? 0.55 : this.isAiming ? 0.52 : 0.68;
    const adsZoomFov = Math.max(38, 52 - this.attachments.scope * 4);
    const targetFov = this.isAiming ? adsZoomFov : activeSprintCam ? 75 : 66;

    this.cameraDistance = THREE.MathUtils.damp(this.cameraDistance, targetDist, 12, delta);
    this.shoulderOffset = THREE.MathUtils.damp(this.shoulderOffset, targetShoulderOffset, 12, delta);
    this.currentFov = THREE.MathUtils.damp(this.currentFov, targetFov, 12, delta);
    this.camera.fov = this.currentFov;
    this.camera.updateProjectionMatrix();

    // Smoothly interpolate crouch camera height (1.64m standing -> 1.18m crouched)
    const targetHeadHeight = 1.64 - this.currentCrouchAmount * 0.46;
    this.currentHeadHeight = THREE.MathUtils.damp(this.currentHeadHeight, targetHeadHeight, 14, delta);

    _forward.set(-Math.sin(this.cameraYaw), 0, -Math.cos(this.cameraYaw));
    _right.set(Math.cos(this.cameraYaw), 0, -Math.sin(this.cameraYaw));

    _headPos.copy(this.playerPos).add(new THREE.Vector3(0, this.currentHeadHeight, 0));

    const effectivePitch = this.cameraPitch + this.recoilPitch;
    _desiredCamPos
      .copy(_headPos)
      .addScaledVector(_forward, -this.cameraDistance * Math.cos(effectivePitch))
      .addScaledVector(_right, this.shoulderOffset)
      .add(new THREE.Vector3(0, this.cameraDistance * Math.sin(effectivePitch) + 0.18, 0));

    // Apply procedural screen-shake from explosions, abilities, or incoming damage
    if (this.cameraShakeIntensity > 0.005) {
      _desiredCamPos.x += (Math.random() - 0.5) * this.cameraShakeIntensity;
      _desiredCamPos.y += (Math.random() - 0.5) * this.cameraShakeIntensity;
      this.cameraShakeIntensity = Math.max(0, this.cameraShakeIntensity - delta * 1.6);
    } else {
      this.cameraShakeIntensity = 0;
    }

    // Clamp camera height so it never clips under the ground when looking up
    _desiredCamPos.y = Math.max(this.playerPos.y + 0.38, _desiredCamPos.y);

    this.camera.position.copy(_desiredCamPos);

    _camTarget
      .copy(_headPos)
      .addScaledVector(_forward, 28)
      .add(new THREE.Vector3(0, -Math.sin(effectivePitch) * 24, 0));

    this.camera.lookAt(_camTarget);

    // Keep sunlight & dynamic shadow frustum centered right above the player anywhere in arena
    if (this.dirLight) {
      this.dirLight.position.set(this.playerPos.x + 36, 54, this.playerPos.z + 26);
      this.dirLight.target.position.copy(this.playerPos);
      this.dirLight.target.updateMatrixWorld();
    }

    this.renderer.render(this.scene, this.camera);
  };

  /**
   * Computes ground/roof/stair height at (x, z) given the player's current Y height.
   */
  private getSurfaceElevationAt(x: number, z: number, currentY: number): number {
    let bestY = 0;
    for (const surf of this.walkableSurfaces) {
      if (x >= surf.minX && x <= surf.maxX && z >= surf.minZ && z <= surf.maxZ) {
        let surfY = surf.yStart;
        if (surf.rampAxis === 'z') {
          const t = (z - surf.minZ) / Math.max(0.01, surf.maxZ - surf.minZ);
          surfY = THREE.MathUtils.lerp(surf.yStart, surf.yEnd, t);
        } else if (surf.rampAxis === 'x') {
          const t = (x - surf.minX) / Math.max(0.01, surf.maxX - surf.minX);
          surfY = THREE.MathUtils.lerp(surf.yStart, surf.yEnd, t);
        }
        if (surfY <= currentY + 1.45 && surfY > bestY) {
          bestY = surfY;
        }
      }
    }
    return bestY;
  }

  private updatePlayer(delta: number, elapsed: number) {
    _playerMove.set(0, 0, 0);

    _forward.set(-Math.sin(this.cameraYaw), 0, -Math.cos(this.cameraYaw)).normalize();
    _right.set(Math.cos(this.cameraYaw), 0, -Math.sin(this.cameraYaw)).normalize();

    if (this.keys[this.controls.forward] || this.keys['arrowup']) _playerMove.add(_forward);
    if (this.keys[this.controls.backward] || this.keys['arrowdown']) _playerMove.sub(_forward);
    if (this.keys[this.controls.left] || this.keys['arrowleft']) _playerMove.sub(_right);
    if (this.keys[this.controls.right] || this.keys['arrowright']) _playerMove.add(_right);

    // Combine with Mobile Virtual Analog Thumbstick (supports analog slow walking!)
    let inputMagnitude = 1.0;
    if (Math.abs(this.mobileInputX) > 0.04 || Math.abs(this.mobileInputY) > 0.04) {
      _playerMove.addScaledVector(_right, this.mobileInputX);
      _playerMove.addScaledVector(_forward, -this.mobileInputY);
      inputMagnitude = Math.min(1.0, Math.hypot(this.mobileInputX, this.mobileInputY));
    }

    const hasInput = _playerMove.lengthSq() > 0.001;
    const activeSprinting = this.isSprinting && !this.isCrouching && !this.isAiming && hasInput;

    // Smoothly damp crouch amount (0 = standing, 1 = crouched)
    this.currentCrouchAmount = THREE.MathUtils.damp(
      this.currentCrouchAmount,
      this.isCrouching ? 1.0 : 0.0,
      14,
      delta
    );

    // Notify HUD when player stance changes
    const nextStance: 'standing' | 'sprinting' | 'crouching' = this.isCrouching
      ? 'crouching'
      : activeSprinting
      ? 'sprinting'
      : 'standing';
    if (nextStance !== this.lastReportedStance) {
      this.lastReportedStance = nextStance;
      this.callbacks.onStanceChange?.(nextStance);
    }

    // Raider Stock attachment bonus (+7% per level to sprint, crouch & ADS mobility!)
    const stockMobilityBonus = 1 + (this.attachments.stock || 0) * 0.07;
    const maxWalkSpeed = activeSprinting
      ? this.playerSpeed * 1.62 * stockMobilityBonus
      : this.isCrouching
      ? this.playerSpeed * 0.55 * stockMobilityBonus
      : this.isAiming
      ? this.playerSpeed * 0.68 * stockMobilityBonus
      : this.playerSpeed;

    let targetVx = 0;
    let targetVz = 0;
    if (hasInput) {
      _playerMove.normalize();
      targetVx = _playerMove.x * maxWalkSpeed * inputMagnitude;
      targetVz = _playerMove.z * maxWalkSpeed * inputMagnitude;
    }

    // Smooth human acceleration & deceleration (inertia) so walking into doorways is controlled and natural
    this.playerVelX = THREE.MathUtils.damp(this.playerVelX, targetVx, 12, delta);
    this.playerVelZ = THREE.MathUtils.damp(this.playerVelZ, targetVz, 12, delta);

    const currentSpeed = Math.hypot(this.playerVelX, this.playerVelZ);
    const isMoving = currentSpeed > 0.15;

    if (isMoving) {
      const nextX = THREE.MathUtils.clamp(this.playerPos.x + this.playerVelX * delta, -68, 68);
      const nextZ = THREE.MathUtils.clamp(this.playerPos.z + this.playerVelZ * delta, -68, 68);

      const testY = this.playerPos.y + 0.9;
      let blockedX = false;
      let blockedZ = false;
      for (const box of this.obstacles) {
        if (this.playerPos.y < box.max.y - 0.35) {
          const expanded = box.clone();
          const playerRadius = 0.42;
          expanded.min.x -= playerRadius;
          expanded.max.x += playerRadius;
          expanded.min.z -= playerRadius;
          expanded.max.z += playerRadius;
          if (expanded.containsPoint(_tempVec.set(nextX, testY, this.playerPos.z))) blockedX = true;
          if (expanded.containsPoint(_tempVec.set(this.playerPos.x, testY, nextZ))) blockedZ = true;
        }
      }

      if (!blockedX) {
        this.playerPos.x = nextX;
      } else {
        this.playerVelX = 0;
      }
      if (!blockedZ) {
        this.playerPos.z = nextZ;
      } else {
        this.playerVelZ = 0;
      }
    }

    // 3D Vertical Gravity, Jump & Walkable Roof/Stair Elevation!
    const targetGroundY = this.getSurfaceElevationAt(this.playerPos.x, this.playerPos.z, this.playerPos.y);
    this.playerVelY -= 24.0 * delta; // Gravity
    this.playerPos.y += this.playerVelY * delta;

    if (this.playerPos.y <= targetGroundY) {
      this.playerPos.y = targetGroundY;
      this.playerVelY = 0;
      this.isGrounded = true;
    } else if (this.isGrounded && this.playerPos.y - targetGroundY < 0.85) {
      this.playerPos.y = THREE.MathUtils.damp(this.playerPos.y, targetGroundY, 18, delta);
    }

    this.playerGroup.position.copy(this.playerPos);
    this.playerGroup.rotation.y = this.cameraYaw + Math.PI;

    // Animate Realistic Human Gait (including Sprint & Crouch 3D posture + 3D Aim Elevation!)
    const speedRatio = currentSpeed / this.playerSpeed;
    animateCharacterRig(
      this.playerGroup,
      elapsed,
      isMoving,
      this.recoilPitch,
      speedRatio,
      this.currentCrouchAmount,
      activeSprinting,
      this.cameraPitch + this.recoilPitch
    );
    this.callbacks.onElevationChange?.(Math.round(this.playerPos.y * 10) / 10);
  }

  private updateAllies(delta: number, elapsed: number) {
    const now = performance.now() / 1000;

    for (let i = this.allies.length - 1; i >= 0; i--) {
      const ally = this.allies[i];

      const idealOffset =
        ally.role === 'pionier'
          ? new THREE.Vector3(-2.8, 0, 2.8)
          : ally.role === 'ranger'
          ? new THREE.Vector3(2.8, 0, 2.8)
          : new THREE.Vector3(0, 0, 4.2);

      idealOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraYaw);
      const targetPos = new THREE.Vector3(
        this.playerPos.x + idealOffset.x,
        0,
        this.playerPos.z + idealOffset.z
      );

      const distToIdeal = ally.position.distanceTo(targetPos);
      const isMoving = distToIdeal > 2.0;
      if (isMoving) {
        _tempVec.subVectors(targetPos, ally.position).normalize();
        ally.position.addScaledVector(_tempVec, ally.speed * delta);
      }

      if (!this.peacefulMode) {
        let closestEnemy: WehrheimerAgent | null = null;
        let minDist = 999;
        for (const enemy of this.agents) {
          const d = ally.position.distanceTo(enemy.position);
          if (d < minDist) {
            minDist = d;
            closestEnemy = enemy;
          }
        }

        if (closestEnemy && minDist <= ally.range) {
          ally.mesh.lookAt(closestEnemy.position.x, ally.position.y, closestEnemy.position.z);
          ally.attackCooldown -= delta;

          if (ally.attackCooldown <= 0) {
            ally.attackCooldown = 1.6 + Math.random() * 0.8;
            this.fireAllyWeapon(ally, closestEnemy);
          }
        } else {
          ally.mesh.rotation.y = this.cameraYaw + Math.PI;
        }
      } else {
        ally.mesh.rotation.y = this.cameraYaw + Math.PI;
      }

      ally.mesh.position.copy(ally.position);
      animateCharacterRig(ally.mesh, elapsed + i * 0.8, isMoving, 0, 0.85);

      if (now - ally.lastBarkTime > 14 + Math.random() * 10) {
        ally.lastBarkTime = now;
        const bark = ALLY_BARKS[Math.floor(Math.random() * ALLY_BARKS.length)];
        this.callbacks.onCombatBark(ally.name, bark);
      }
    }
  }

  private updateTargeting() {
    let bestTarget: WehrheimerAgent | null = null;
    let minScore = 9999;

    for (const ag of this.agents) {
      const dist = this.playerPos.distanceTo(ag.position);
      const priorityScore = ag.role === 'boss' ? dist - 20 : dist;
      if (priorityScore < minScore) {
        minScore = priorityScore;
        bestTarget = ag;
      }
    }

    if (bestTarget) {
      const dist = Math.round(this.playerPos.distanceTo(bestTarget.position));
      this.currentTarget = {
        id: bestTarget.id,
        name: bestTarget.name,
        role: bestTarget.role.toUpperCase(),
        distance: dist,
        health: Math.max(0, Math.round(bestTarget.health)),
        maxHealth: bestTarget.maxHealth,
        isBoss: bestTarget.role === 'boss',
      };

      this.targetHighlightMesh.position.set(
        bestTarget.position.x,
        bestTarget.role === 'boss' ? 3.5 : 2.6,
        bestTarget.position.z
      );
      this.targetHighlightMesh.rotation.z += 0.05;
      this.callbacks.onTargetUpdate(this.currentTarget);
    } else {
      this.currentTarget = null;
      this.targetHighlightMesh.position.set(0, -999, 0);
      this.callbacks.onTargetUpdate(null);
    }
  }

  private updateStormZone(delta: number) {
    this.stormTimer -= delta;
    if (this.stormTimer > 0) {
      const progress = 1 - Math.max(0, this.stormTimer / 260);
      this.stormRadius = THREE.MathUtils.lerp(56, this.targetRadius, progress);
      this.stormMesh.scale.set(this.stormRadius / 56, 1, this.stormRadius / 56);
      this.callbacks.onZoneTimer(Math.ceil(this.stormTimer), Math.round(this.stormRadius));
    }

    const distFromCenter = Math.hypot(this.playerPos.x - this.stormCenter.x, this.playerPos.z - this.stormCenter.y);
    if (distFromCenter > this.stormRadius) {
      this.stormDamageTimer += delta;
      if (this.stormDamageTimer >= 1.0) {
        this.stormDamageTimer = 0;
        this.damagePlayer(8, 'Taunus-Nebel', true);
        soundFx.playZoneWarning();
      }
    }
  }

  private updateAgents(delta: number, elapsed: number) {
    const now = performance.now() / 1000;

    for (let i = this.agents.length - 1; i >= 0; i--) {
      const ag = this.agents[i];

      if (this.trainingMode) {
        const lane = i - (this.agents.length - 1) / 2;
        ag.position.x = lane * 4.2 + Math.sin(elapsed * 0.9 + i) * 4;
        ag.position.z = -8 - (i % 2) * 3 + Math.cos(elapsed * 0.7 + i) * 1.5;
        ag.mesh.position.copy(ag.position);
        ag.mesh.lookAt(this.playerPos.x, ag.position.y, this.playerPos.z);
        animateCharacterRig(ag.mesh, elapsed + i * 0.7, true, 0, 0.85);
        continue;
      }

      let targetPos = this.playerPos;
      let minDist = ag.position.distanceTo(this.playerPos);

      for (const ally of this.allies) {
        const d = ag.position.distanceTo(ally.position);
        if (d < minDist) {
          minDist = d;
          targetPos = ally.position;
        }
      }

      _tempVec.subVectors(targetPos, ag.position);
      _tempVec.y = 0;
      _tempVec.normalize();

      ag.mesh.lookAt(targetPos.x, ag.position.y, targetPos.z);

      let isMoving = true;
      if (ag.role === 'flanker') {
        const perp = new THREE.Vector3(-_tempVec.z, 0, _tempVec.x);
        ag.position.addScaledVector(minDist > 12 ? _tempVec : perp, ag.speed * delta);
      } else if (ag.role === 'sniper') {
        if (minDist < 16) {
          ag.position.addScaledVector(_tempVec, -ag.speed * delta);
        } else if (minDist > 26) {
          ag.position.addScaledVector(_tempVec, ag.speed * delta);
        } else {
          isMoving = false;
        }
      } else {
        ag.position.addScaledVector(_tempVec, ag.speed * delta);
      }

      ag.mesh.position.copy(ag.position);
      animateCharacterRig(ag.mesh, elapsed + i * 0.7, isMoving, 0, 0.85);

      if (now - ag.lastBarkTime > 8 + Math.random() * 8 && minDist < 30) {
        ag.lastBarkTime = now;
        const barks = HESSIAN_BARKS[ag.role] || HESSIAN_BARKS.flanker;
        const bark = barks[Math.floor(Math.random() * barks.length)];
        this.callbacks.onCombatBark(ag.name, bark);
      }

      ag.attackCooldown -= delta;
      if (ag.attackCooldown <= 0 && minDist <= ag.range) {
        ag.attackCooldown = ag.role === 'boss' ? 2.0 : ag.role === 'sniper' ? 2.4 : 1.8;
        this.fireEnemyBullet(ag, targetPos);
      }
    }
  }

  private fireEnemyBullet(agent: WehrheimerAgent, targetPos: THREE.Vector3) {
    _bulletDir.subVectors(targetPos, agent.position);
    _bulletDir.normalize();

    const isBoss = agent.role === 'boss';
    const geo = isBoss
      ? new THREE.SphereGeometry(0.45, 8, 8)
      : new THREE.CylinderGeometry(0.06, 0.06, 1.2, 6);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xEF4444,
      emissive: 0xEF4444,
      emissiveIntensity: 2.5,
    });
    const mesh = new THREE.Mesh(geo, mat);
    if (!isBoss) {
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), _bulletDir);
    }
    const spawnPos = agent.position.clone().add(new THREE.Vector3(0, 1.4, 0));
    mesh.position.copy(spawnPos);
    this.scene.add(mesh);

    const speed = agent.role === 'sniper' ? 60 : isBoss ? 32 : 42;
    this.bullets.push({
      mesh,
      position: spawnPos,
      velocity: _bulletDir.clone().multiplyScalar(speed),
      damage: agent.damage,
      life: agent.range / speed,
      fromPlayer: false,
      fromEnemyId: agent.id,
      color: '#EF4444',
      splashRadius: isBoss ? 2.5 : 0.8,
    });
  }

  private updateBullets(delta: number) {
    const _prevPos = new THREE.Vector3();
    const _line = new THREE.Line3();
    const _closest = new THREE.Vector3();

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.life -= delta;
      _prevPos.copy(b.position);
      b.position.addScaledVector(b.velocity, delta);
      b.mesh.position.copy(b.position);
      _line.set(_prevPos, b.position);

      // Arena geometry is a hard projectile barrier. Check the travelled segment
      // before agents so shots cannot damage targets through buildings or walls.
      if (this.bulletHitObstacle(_prevPos, b.position)) {
        this.spawnImpactSparks(b.position, 0xB45309, 4);
        this.scene.remove(b.mesh);
        this.bullets.splice(i, 1);
        continue;
      }

      if (b.life <= 0 || b.position.y < -0.5) {
        this.scene.remove(b.mesh);
        this.bullets.splice(i, 1);
        continue;
      }

      if (b.fromPlayer || b.fromAlly) {
        // 1. Check Destructible Props (Crates, Barrels, Market Stalls, Tech Attachment Chests!)
        let hitProp = false;
        for (let dIdx = this.destructibles.length - 1; dIdx >= 0; dIdx--) {
          const prop = this.destructibles[dIdx];
          const propCenter = prop.position.clone().add(new THREE.Vector3(0, 0.8, 0));
          _line.closestPointToPoint(propCenter, true, _closest);
          if (_closest.distanceTo(propCenter) <= (b.splashRadius || 1.45)) {
            prop.hp -= b.damage;
            soundFx.playHit();
            this.spawnImpactSparks(propCenter, prop.kind === 'tech_case' ? 0xF59E0B : 0xB45309, 6);
            this.spawnDamageNumber(propCenter, b.damage, false);

            this.scene.remove(b.mesh);
            this.bullets.splice(i, 1);
            hitProp = true;

            if (prop.hp <= 0) {
              this.spawnImpactSparks(propCenter, 0xFDE047, 14);
              this.scene.remove(prop.mesh);
              this.destructibles.splice(dIdx, 1);
              this.score += 35;
              this.callbacks.onScoreChange(this.score);

              if (prop.lootBias === 'attachment') {
                this.dropLoot(prop.position, 'attachment');
              } else if (prop.lootBias === 'shield') {
                this.dropLoot(prop.position, 'shield');
              } else {
                this.dropLoot(prop.position);
              }
            }
            break;
          }
        }
        if (hitProp) continue;

        // 2. Check Wehrheimer Enemy Agents
        for (let j = this.agents.length - 1; j >= 0; j--) {
          const ag = this.agents[j];
          const enemyChest = ag.position.clone().add(new THREE.Vector3(0, 1.1, 0));
          _line.closestPointToPoint(enemyChest, true, _closest);
          const hitDist = _closest.distanceTo(enemyChest);

          if (hitDist <= (b.splashRadius || 1.45)) {
            const perkCritBonus = this.activeMatchPerks.has('scharfschuetzen_fokus') ? 0.35 : 0;
            const critChance = 0.22 + this.attachments.mag * 0.08 + perkCritBonus;
            const isCrit = b.fromPlayer && Math.random() < critChance;
            const critMult = this.activeMatchPerks.has('scharfschuetzen_fokus') ? 2.1 : 1.5;
            const finalDmg = isCrit ? Math.round(b.damage * critMult) : b.damage;
            ag.health -= finalDmg;

            if (b.fromPlayer) {
              this.playerParticipantStats.damageDealt += finalDmg;
            } else if (b.fromAllyId && this.allAlliesStats.has(b.fromAllyId)) {
              this.allAlliesStats.get(b.fromAllyId)!.damageDealt += finalDmg;
            }
            const enemyStats = this.allEnemiesStats.get(ag.id);
            if (enemyStats) {
              enemyStats.damageTaken += finalDmg;
            }

            if (isCrit) {
              soundFx.playCritHit();
            } else {
              soundFx.playHit();
            }
            this.spawnImpactSparks(_closest, isCrit ? 0xEF4444 : 0x38BDF8, 6);
            this.spawnDamageNumber(ag.position, finalDmg, isCrit);
            if (b.fromPlayer) {
              this.callbacks.onHitEnemy(finalDmg, isCrit);
            }

            this.scene.remove(b.mesh);
            this.bullets.splice(i, 1);

            if (ag.health <= 0) {
              if (!b.fromPlayer && b.fromAllyId && this.allAlliesStats.has(b.fromAllyId)) {
                this.allAlliesStats.get(b.fromAllyId)!.kills += 1;
              }
              this.eliminateEnemyAt(j, isCrit);
            } else if (ag.role === 'boss') {
              this.notifyWaveState();
            }
            break;
          }
        }
      } else {
        const chestHeight = 1.1 - this.currentCrouchAmount * 0.38;
        const hitRadius = 1.25 - this.currentCrouchAmount * 0.3;
        const playerChest = this.playerPos.clone().add(new THREE.Vector3(0, chestHeight, 0));
        _line.closestPointToPoint(playerChest, true, _closest);
        if (_closest.distanceTo(playerChest) <= hitRadius) {
          const shooterStats = b.fromEnemyId ? this.allEnemiesStats.get(b.fromEnemyId) : null;
          if (shooterStats) {
            shooterStats.damageDealt += b.damage;
          }
          this.playerParticipantStats.damageTaken += b.damage;

          this.damagePlayer(b.damage, 'Wehrheimer Apfelgeschoss');
          this.scene.remove(b.mesh);
          this.bullets.splice(i, 1);
          continue;
        }

        for (let k = this.allies.length - 1; k >= 0; k--) {
          const ally = this.allies[k];
          const allyChest = ally.position.clone().add(new THREE.Vector3(0, 1.1, 0));
          _line.closestPointToPoint(allyChest, true, _closest);
          if (_closest.distanceTo(allyChest) <= 1.25) {
            const shooterStats = b.fromEnemyId ? this.allEnemiesStats.get(b.fromEnemyId) : null;
            if (shooterStats) {
              shooterStats.damageDealt += b.damage;
            }
            const allyStats = this.allAlliesStats.get(ally.id);
            if (allyStats) {
              allyStats.damageTaken += b.damage;
            }

            ally.health -= b.damage;
            soundFx.playHit();
            this.scene.remove(b.mesh);
            this.bullets.splice(i, 1);

            if (ally.health <= 0) {
              if (shooterStats) shooterStats.kills += 1;
              if (allyStats) allyStats.deaths += 1;
              this.callbacks.onCombatBark(ally.name, 'Ich bin getroffen! Kämpft weiter für Neu-Anspach!');
              this.scene.remove(ally.mesh);
              this.allies.splice(k, 1);
            }
            this.notifyAllies();
            break;
          }
        }
      }
    }
  }

  private bulletHitObstacle(start: THREE.Vector3, end: THREE.Vector3): boolean {
    const direction = end.clone().sub(start);
    const distance = direction.length();
    if (distance <= 0.001) return false;
    direction.normalize();
    const ray = new THREE.Ray(start, direction);
    const hit = new THREE.Vector3();
    for (const obstacle of this.obstacles) {
      const expanded = obstacle.clone().expandByScalar(0.08);
      if (ray.intersectBox(expanded, hit) && hit.distanceTo(start) <= distance + 0.001) {
        return true;
      }
    }
    return false;
  }

  private updateImpactParticles(delta: number) {
    for (let i = this.impactParticles.length - 1; i >= 0; i--) {
      const p = this.impactParticles[i];
      p.life -= delta;
      p.velocity.y -= 18 * delta;
      p.mesh.position.addScaledVector(p.velocity, delta);
      p.mesh.rotation.x += 8 * delta;
      p.mesh.rotation.y += 8 * delta;

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.impactParticles.splice(i, 1);
      }
    }
  }

  private updateFloatingDamages(delta: number) {
    for (let i = this.floatingDamages.length - 1; i >= 0; i--) {
      const fd = this.floatingDamages[i];
      fd.life -= delta;
      fd.position.y += delta * 2.2;
      fd.sprite.position.copy(fd.position);

      const mat = fd.sprite.material as THREE.SpriteMaterial;
      mat.opacity = Math.max(0, fd.life / fd.maxLife);

      if (fd.life <= 0) {
        this.scene.remove(fd.sprite);
        this.floatingDamages.splice(i, 1);
      }
    }
  }

  private updateLoot() {
    const hasMagnet = this.activeMatchPerks.has('goldrausch');
    const pickupRadius = hasMagnet ? 7.5 : 2.35;

    for (let i = this.lootItems.length - 1; i >= 0; i--) {
      const item = this.lootItems[i];
      item.mesh.rotation.y += 0.04;

      const distToLoot = this.playerPos.distanceTo(item.pos);
      if (hasMagnet && distToLoot <= 9.5 && distToLoot > 1.2) {
        _tempVec.subVectors(this.playerPos, item.pos).normalize();
        item.pos.addScaledVector(_tempVec, 0.28);
        item.mesh.position.copy(item.pos);
      }

      if (distToLoot <= pickupRadius) {
        soundFx.playCoin();
        if (item.type === 'attachment') {
          const att = item.attachmentType || 'barrel';
          const curVal = this.attachments[att] || 0;
          this.attachments[att] = Math.min(3, curVal + 1);
          if (this.weaponUpgrades[this.currentWeapon.id]) {
            this.weaponUpgrades[this.currentWeapon.id].attachments[att] = this.attachments[att];
          }
          this.refreshPlayer3DWeapon();
          this.callbacks.onAttachmentsChange?.({ ...this.attachments }, this.currentWeapon.id);

          const labels: Record<AttachmentType, string> = {
            scope: `Taktisches Visier Lv.${this.attachments.scope} (+Zoom & Präzision)`,
            barrel: `Task-Force-Lauf Lv.${this.attachments.barrel} (+20% Schaden & Tempo)`,
            bolt: `Schnellfeuer-Verschluss Lv.${this.attachments.bolt} (+18% Feuerrate)`,
            mag: `STANAG-Trommel Lv.${this.attachments.mag} (+Splitter & Krit-Chance)`,
            stock: `Raider-Kampfschaft Lv.${this.attachments.stock || 1} (+Mobilität & ZV)`,
          };
          this.callbacks.onLootPickup('attachment', this.attachments[att] || 1, labels[att]);
          this.score += 50;
          this.callbacks.onScoreChange(this.score);
        } else if (item.type === 'taler') {
          const baseAmt = item.amount || 8;
          const amt = hasMagnet ? Math.round(baseAmt * 1.6) : baseAmt;
          this.callbacks.onLootPickup('taler', amt);
          this.score += amt * 2;
          this.callbacks.onScoreChange(this.score);
          if (this.peacefulMode) {
            this.spawnSinglePeacefulTaler();
          }
        } else if (item.type === 'shield') {
          this.playerShield = Math.min(this.playerMaxShield, this.playerShield + 50);
          this.callbacks.onHealthChange(this.playerHealth, this.playerMaxHealth, this.playerShield, this.playerMaxShield);
          this.callbacks.onLootPickup('shield', 50);
        } else if (item.type === 'health') {
          this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + 35);
          this.callbacks.onHealthChange(this.playerHealth, this.playerMaxHealth, this.playerShield, this.playerMaxShield);
          this.allies.forEach((a) => {
            a.health = Math.min(a.maxHealth, a.health + 25);
          });
          this.notifyAllies();
          this.callbacks.onLootPickup('health', 35);
        } else if (item.type === 'ammo') {
          this.reserveAmmo = Math.min(this.getMagazineCapacity() * 4, this.reserveAmmo + this.getMagazineCapacity());
          this.notifyAmmoState();
          this.callbacks.onLootPickup('ammo', this.getMagazineCapacity());
        }

        this.scene.remove(item.mesh);
        this.lootItems.splice(i, 1);
      }
    }

    // In Peaceful Mobile Mode, walking up to crates opens them automatically for Taler!
    if (this.peacefulMode) {
      for (let dIdx = this.destructibles.length - 1; dIdx >= 0; dIdx--) {
        const prop = this.destructibles[dIdx];
        if (this.playerPos.distanceTo(prop.position) <= 2.3) {
          soundFx.playCoin();
          this.spawnImpactSparks(prop.position.clone().add(new THREE.Vector3(0, 0.8, 0)), 0xFDE047, 10);
          this.scene.remove(prop.mesh);
          this.destructibles.splice(dIdx, 1);
          const bonusTaler = prop.kind === 'tech_case' ? 35 : 18;
          this.score += bonusTaler * 2;
          this.callbacks.onScoreChange(this.score);
          this.callbacks.onLootPickup('taler', bonusTaler);
        }
      }
    }
  }

  private damagePlayer(amount: number, _source: string, ignoreShield = false) {
    if (this.peacefulMode || this.dashInvulnTimer > 0) return;

    const incomingAmount = amount;
    const hadShield = this.playerShield > 0;

    if (!ignoreShield && this.playerShield > 0) {
      if (this.playerShield >= amount) {
        this.playerShield -= amount;
        amount = 0;
      } else {
        amount -= this.playerShield;
        this.playerShield = 0;
      }
    }

    if (hadShield && this.playerShield <= 0) {
      soundFx.playShieldBreak();
    }

    if (amount > 0) {
      this.playerHealth = Math.max(0, this.playerHealth - amount);
    }

    this.cameraShakeIntensity = Math.max(this.cameraShakeIntensity, 0.25);
    this.callbacks.onPlayerDamaged?.(incomingAmount);
    this.callbacks.onHealthChange(this.playerHealth, this.playerMaxHealth, this.playerShield, this.playerMaxShield);

    if (this.playerHealth <= 0) {
      this.isGameOver = true;
      this.unlockPointer();
      soundFx.playZoneWarning();
      this.playerParticipantStats.deaths += 1;
      this.callbacks.onGameOver(false, this.getDetailedMatchStats(false));
    }
  }

  private onResize = () => {
    if (!this.container || this.isDestroyed) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  public destroy() {
    this.isDestroyed = true;
    this.unlockPointer();
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onResize);
    this.cleanupListeners.forEach((cleanup) => {
      try {
        cleanup();
      } catch {}
    });
    this.cleanupListeners = [];
    this.renderer.dispose();
    if (this.container && this.renderer.domElement && this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
