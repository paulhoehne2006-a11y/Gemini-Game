import * as THREE from 'three';
import { WalkableSurface, MapLevelsState } from '../../types';
import {
  DestructibleProp,
  createCobblestoneTexture,
  createAsphaltTexture,
  createGrassGroundTexture,
  createFachwerkTexture,
  createModernFacadeTexture,
  createRoofTileTexture,
  createPoolTileTexture,
  createWoodPlankTexture,
  create3DVehicle,
  createEnterableBuilding,
  createDestructibleProp,
  createStylizedTree,
  createStylizedGrassClump,
  createWildflowerClump,
  createStylizedRock,
  createFortniteGoldenChest,
  createSandbagBunker,
  createShippingContainer,
  createStreetLamp,
} from './textures';

export interface ArenaBuildResult {
  obstacles: THREE.Box3[];
  walkableSurfaces: WalkableSurface[];
  destructibles: DestructibleProp[];
  update?: (delta: number) => void;
}

/**
 * Per-map lighting & mood preset. Consumed by ArenaSceneManager to build the sky dome,
 * fog, hemisphere/sun/rim lights and tone-mapping exposure for each arena.
 */
export interface ArenaAtmosphere {
  /** Short German label shown in the UI, e.g. 'Goldene Stunde' or 'Nachteinsatz'. */
  timeOfDay: string;
  skyTop: number;
  skyMid: number;
  skyHorizon: number;
  fogColor: number;
  fogDensity: number;
  hemiSky: number;
  hemiGround: number;
  hemiIntensity: number;
  sunColor: number;
  sunIntensity: number;
  /** Sun offset relative to the player (shadow frustum follows the player). */
  sunOffset: [number, number, number];
  rimColor: number;
  rimIntensity: number;
  exposure: number;
  /** Colour of the visible sun / moon disc in the sky. */
  sunDiscColor: number;
  /** Night maps get a moon, stars and darker clouds. */
  isNight?: boolean;
}

export interface ArenaConfig {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  district: string;
  skyColor: number;
  fogColor: number;
  atmosphere?: ArenaAtmosphere;
  buildScene: (scene: THREE.Scene) => ArenaBuildResult;
}

export interface ArenaUnlockRule {
  id: string;
  order: number;
  requiredWins: number;
  unlockCostNAT: number;
  difficultyLabel: string;
}

export const ARENA_UNLOCK_RULES: Record<string, ArenaUnlockRule> = {
  hessenpark: {
    id: 'hessenpark',
    order: 1,
    requiredWins: 0,
    unlockCostNAT: 0,
    difficultyLabel: 'Stufe 1 · Start-Einsatzgebiet',
  },
  waldschwimmbad: {
    id: 'waldschwimmbad',
    order: 2,
    requiredWins: 1,
    unlockCostNAT: 250,
    difficultyLabel: 'Stufe 2 · Waldrand-Gefecht',
  },
  bahnhof: {
    id: 'bahnhof',
    order: 3,
    requiredWins: 2,
    unlockCostNAT: 450,
    difficultyLabel: 'Stufe 3 · Gleis-Verteidigung',
  },
  buergerhaus: {
    id: 'buergerhaus',
    order: 4,
    requiredWins: 3,
    unlockCostNAT: 700,
    difficultyLabel: 'Stufe 4 · Stadtmitte-Belagerung',
  },
  taunuscenter: {
    id: 'taunuscenter',
    order: 5,
    requiredWins: 4,
    unlockCostNAT: 950,
    difficultyLabel: 'Stufe 5 · Neue Mitte Häuserkampf',
  },
  ars: {
    id: 'ars',
    order: 6,
    requiredWins: 5,
    unlockCostNAT: 1250,
    difficultyLabel: 'Stufe 6 · Schulcampus-Offensive',
  },
  feldbergblick: {
    id: 'feldbergblick',
    order: 7,
    requiredWins: 6,
    unlockCostNAT: 1600,
    difficultyLabel: 'Stufe 7 · Taunuskamm-Endschlacht',
  },
};

export const MAX_MAP_LEVEL = 10;

export const INITIAL_MAP_LEVELS: MapLevelsState = {
  hessenpark: 1,
  waldschwimmbad: 1,
  bahnhof: 1,
  buergerhaus: 1,
  taunuscenter: 1,
  ars: 1,
  feldbergblick: 1,
};

export function getMapUpgradeCostNAT(arenaId: string, currentMapLevel = 1): number {
  const order = ARENA_UNLOCK_RULES[arenaId]?.order || 1;
  return Math.round(140 + order * 35 + (currentMapLevel - 1) * 95);
}

export interface MapBotScalingInfo {
  arenaId: string;
  campaignTier: number;      // 1..7 (Map order in campaign)
  mapUpgradeLevel: number;   // 1..10 (Player's upgraded map level)
  effectiveBotLevel: number; // Combined bot threat level (campaignTier + mapUpgradeLevel - 1)
  hpMultiplier: number;
  hpMult: number;
  damageMultiplier: number;
  dmgMult: number;
  speedMultiplier: number;
  fireRateMultiplier: number;
  extraEnemiesPerWave: number;
  extraBotsPerWave: number;
  rewardMultiplier: number;
  natRewardMult: number;
  xpRewardMult: number;
  threatTitle: string;
}

/**
 * Calculates how much stronger Wehrheimer bots become on higher-tier and leveled-up maps,
 * as well as the increased NAT & Weapon-XP reward multiplier.
 */
export function getMapBotScaling(
  arenaId: string,
  mapLevelsOrLevel: MapLevelsState | number = INITIAL_MAP_LEVELS
): MapBotScalingInfo {
  const campaignTier = ARENA_UNLOCK_RULES[arenaId]?.order || 1;
  const rawLevel =
    typeof mapLevelsOrLevel === 'number'
      ? mapLevelsOrLevel
      : mapLevelsOrLevel[arenaId] || 1;
  const mapUpgradeLevel = Math.max(1, Math.min(MAX_MAP_LEVEL, rawLevel));
  const effectiveBotLevel = campaignTier + (mapUpgradeLevel - 1);

  const hpMultiplier = Number((1 + (effectiveBotLevel - 1) * 0.22).toFixed(2));
  const damageMultiplier = Number((1 + (effectiveBotLevel - 1) * 0.16).toFixed(2));
  const speedMultiplier = Number((1 + Math.min(0.42, (effectiveBotLevel - 1) * 0.045)).toFixed(2));
  const fireRateMultiplier = Number((1 + Math.min(0.65, (effectiveBotLevel - 1) * 0.08)).toFixed(2));
  const extraEnemiesPerWave = Math.floor((effectiveBotLevel - 1) * 0.75);
  const rewardMultiplier = Number((1 + (effectiveBotLevel - 1) * 0.25).toFixed(2));
  const xpRewardMult = Number((1 + (effectiveBotLevel - 1) * 0.28).toFixed(2));

  const threatTitle =
    effectiveBotLevel >= 9
      ? 'EXTREM · ELITE-GARDE'
      : effectiveBotLevel >= 6
      ? 'SCHWER · STOSS-KOMMANDO'
      : effectiveBotLevel >= 3
      ? 'ERHÖHT · VETERANEN'
      : 'STANDARD · SPÄHTRUPP';

  return {
    arenaId,
    campaignTier,
    mapUpgradeLevel,
    effectiveBotLevel,
    hpMultiplier,
    hpMult: hpMultiplier,
    damageMultiplier,
    dmgMult: damageMultiplier,
    speedMultiplier,
    fireRateMultiplier,
    extraEnemiesPerWave,
    extraBotsPerWave: extraEnemiesPerWave,
    rewardMultiplier,
    natRewardMult: rewardMultiplier,
    xpRewardMult,
    threatTitle,
  };
}

export function checkArenaUnlocked(
  arenaId: string,
  totalWins: number,
  unlockedMapsList: string[]
): boolean {
  if (arenaId === 'hessenpark') return true;
  if (unlockedMapsList.includes(arenaId)) return true;
  const rule = ARENA_UNLOCK_RULES[arenaId];
  if (!rule) return true;
  return totalWins >= rule.requiredWins;
}

/**
 * Places lush Fortnite-style stylized trees, boulders, and foliage perimeter.
 */
function addTaunusTreeRing(scene: THREE.Scene, obstacles: THREE.Box3[], innerRadius = 46, count = 38) {
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (i % 3) * 0.05;
    const dist = innerRadius + (i % 4) * 3.5;
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    const scale = 0.95 + (i % 5) * 0.15;

    // Stylized cartoon tree
    const tree = createStylizedTree(scale);
    tree.position.set(x, 0, z);
    scene.add(tree);

    // Natural rock or grass tuft next to some trees
    if (i % 2 === 0) {
      const rock = createStylizedRock(0.7 + (i % 3) * 0.3);
      rock.position.set(x + (Math.random() - 0.5) * 2, 0, z + (Math.random() - 0.5) * 2);
      scene.add(rock);
    }

    const grass = createStylizedGrassClump(1.2);
    grass.position.set(x + 1.2, 0, z - 1.2);
    scene.add(grass);

    obstacles.push(
      new THREE.Box3(
        new THREE.Vector3(x - 0.9, 0, z - 0.9),
        new THREE.Vector3(x + 0.9, 6.5, z + 0.9)
      )
    );
  }
}

/**
 * Scatters 3D grass tufts, wildflowers, and glowing golden supply chests around the arena ground!
 */
export function scatterArenaEnvironment(
  scene: THREE.Scene,
  destructibles: DestructibleProp[],
  chestPositions: Array<[number, number]> = [[-12, 12], [14, -10], [6, 18]]
) {
  // Scatter 3D grass tufts & flowers in open areas
  for (let i = 0; i < 28; i++) {
    const x = (Math.sin(i * 1.7) * 32) + (Math.cos(i * 0.9) * 8);
    const z = (Math.cos(i * 1.7) * 32) + (Math.sin(i * 0.9) * 8);

    const grass = createStylizedGrassClump(0.8 + (i % 3) * 0.2);
    grass.position.set(x, 0, z);
    scene.add(grass);

    if (i % 3 === 0) {
      const flowers = createWildflowerClump(i % 2 === 0 ? 0xFACC15 : 0xEF4444);
      flowers.position.set(x + 0.8, 0, z + 0.6);
      scene.add(flowers);
    }
  }

  // Spawn Fortnite-style Golden Supply Chests
  chestPositions.forEach(([cx, cz], idx) => {
    const chest = createFortniteGoldenChest(cx, 0, cz, idx * 0.8);
    scene.add(chest.group);
    scene.add(chest.beaconLight);

    destructibles.push({
      id: `golden_chest_${idx}`,
      mesh: chest.group,
      box: new THREE.Box3(
        new THREE.Vector3(cx - 0.9, 0, cz - 0.9),
        new THREE.Vector3(cx + 0.9, 2.2, cz + 0.9)
      ),
      position: new THREE.Vector3(cx, 0, cz),
      hp: 25,
      maxHp: 25,
      kind: 'tech_case',
      lootBias: 'attachment',
    });
  });
}

function addDistantFeldbergBackdrop(scene: THREE.Scene, zOffset = -95) {
  const group = new THREE.Group();

  // Majestic layered Taunus Mountain Ridges (Großer Feldberg 879m & Altkönig)
  const mountainFarMat = new THREE.MeshStandardMaterial({
    color: 0x256345, // Rich Taunus pine forest green
    roughness: 0.88,
    flatShading: true,
  });

  const mountainNearMat = new THREE.MeshStandardMaterial({
    color: 0x1E5336, // Deeper pine ridge foreground
    roughness: 0.82,
    flatShading: true,
  });

  // Main Summit: Großer Feldberg (879m)
  const mainPeak = new THREE.Mesh(new THREE.ConeGeometry(58, 44, 9), mountainFarMat);
  mainPeak.position.set(0, 19, zOffset);
  mainPeak.rotation.y = 0.2;
  group.add(mainPeak);

  // Altkönig (798m) to the West
  const westPeak = new THREE.Mesh(new THREE.ConeGeometry(46, 32, 8), mountainNearMat);
  westPeak.position.set(-50, 14, zOffset + 8);
  westPeak.rotation.y = -0.4;
  group.add(westPeak);

  // Pferdskopf / Weilsberg ridge to the East
  const eastPeak = new THREE.Mesh(new THREE.ConeGeometry(48, 35, 8), mountainNearMat);
  eastPeak.position.set(52, 15, zOffset + 10);
  eastPeak.rotation.y = 0.5;
  group.add(eastPeak);

  // Mid-ground lush Taunus foothill mounds
  const footHills = [
    { x: -24, y: 8, z: zOffset + 18, r: 28, h: 20 },
    { x: 26, y: 9, z: zOffset + 16, r: 30, h: 22 },
    { x: 0, y: 7, z: zOffset + 22, r: 25, h: 18 },
  ];
  footHills.forEach((h, idx) => {
    const mound = new THREE.Mesh(new THREE.ConeGeometry(h.r, h.h, 7), mountainNearMat);
    mound.position.set(h.x, h.y, h.z);
    mound.rotation.y = idx * 0.8;
    group.add(mound);
  });

  // Iconic Großer Feldberg Fernmeldeturm & Wetterturm on the Summit!
  const towerShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.85, 1.35, 16, 10),
    new THREE.MeshStandardMaterial({ color: 0xF8FAFC, roughness: 0.35 })
  );
  towerShaft.position.set(0, 44, zOffset);
  group.add(towerShaft);

  // Red and white observation platform / transmitter rings
  const platformRed = new THREE.Mesh(
    new THREE.CylinderGeometry(2.6, 2.2, 2.4, 12),
    new THREE.MeshStandardMaterial({ color: 0xDC2626, roughness: 0.4 })
  );
  platformRed.position.set(0, 48, zOffset);
  group.add(platformRed);

  const spire = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.42, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xEF4444, emissive: 0xEF4444, emissiveIntensity: 0.9 })
  );
  spire.position.set(0, 53.5, zOffset);
  group.add(spire);

  // Blinking red aviation warning beacon on the summit
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0xF87171 });
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 8), beaconMat);
  beacon.position.set(0, 57.8, zOffset);
  group.add(beacon);

  scene.add(group);
}

export const ARENAS: Record<string, ArenaConfig> = {
  hessenpark: {
    id: 'hessenpark',
    name: 'Freilichtmuseum Hessenpark (Reworked)',
    subtitle: 'Goldene Stunde · Historischer Marktplatz, Windmühle, Sandsack-Stellungen & Fachwerkscheunen',
    description:
      'Überarbeitetes Freilichtmuseum Hessenpark in warmer Abendsonne: Kämpfe zwischen historischen Fachwerkhäusern, nutze die neuen Sandsack-Stellungen am Dorfbrunnen, erklimme den Scheunen-Dachboden und sichere die Holländer-Windmühle.',
    district: 'Neu-Anspach Süd · Laubweg',
    skyColor: 0xF59E0B,
    fogColor: 0xFDE68A,
    atmosphere: {
      timeOfDay: 'Goldene Stunde',
      skyTop: 0x1D4ED8,
      skyMid: 0xF59E0B,
      skyHorizon: 0xFEF08A,
      fogColor: 0xFDE68A,
      fogDensity: 0.0034,
      hemiSky: 0xFDE68A,
      hemiGround: 0x451A03,
      hemiIntensity: 1.15,
      sunColor: 0xFFFBEB,
      sunIntensity: 2.35,
      sunOffset: [42, 36, 28],
      rimColor: 0xFB923C,
      rimIntensity: 0.95,
      exposure: 1.24,
      sunDiscColor: 0xFDE047,
      isNight: false,
    },
    buildScene: (scene: THREE.Scene) => {
      const obstacles: THREE.Box3[] = [];
      const walkableSurfaces: WalkableSurface[] = [];
      const destructibles: DestructibleProp[] = [];

      // Cobblestone & Meadow ground
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(160, 160),
        new THREE.MeshStandardMaterial({ map: createGrassGroundTexture(22, 22), roughness: 0.9 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);

      // Central Historic Marktplatz Cobblestone
      const plaza = new THREE.Mesh(
        new THREE.CylinderGeometry(30, 30, 0.08, 36),
        new THREE.MeshStandardMaterial({ map: createCobblestoneTexture(14, 14), roughness: 0.82 })
      );
      plaza.position.y = 0.04;
      plaza.receiveShadow = true;
      scene.add(plaza);

      // Historic Dorfbrunnen (Village Fountain) at center
      const wellGroup = new THREE.Group();
      const wellWall = new THREE.Mesh(
        new THREE.CylinderGeometry(2.6, 2.8, 1.25, 16),
        new THREE.MeshStandardMaterial({ color: 0x64748B, roughness: 0.85 })
      );
      wellWall.position.y = 0.62;
      wellWall.castShadow = true;
      wellGroup.add(wellWall);

      const wellWater = new THREE.Mesh(
        new THREE.CylinderGeometry(2.2, 2.2, 1.05, 16),
        new THREE.MeshStandardMaterial({ color: 0x0EA5E9, roughness: 0.15, metalness: 0.6 })
      );
      wellWater.position.y = 0.6;
      wellGroup.add(wellWater);

      const obelisk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.45, 3.8, 8),
        new THREE.MeshStandardMaterial({ color: 0x94A3B8, roughness: 0.7 })
      );
      obelisk.position.y = 1.9;
      wellGroup.add(obelisk);
      scene.add(wellGroup);
      obstacles.push(new THREE.Box3(new THREE.Vector3(-2.7, 0, -2.7), new THREE.Vector3(2.7, 3.5, 2.7)));

      // NEW: Tactical Sandbag Bunkers & Timber Cover around the Marktplatz
      [
        [-7.5, 5.5, 0.4, 4.4],
        [7.5, 5.5, -0.4, 4.4],
        [-7.5, -9.5, -0.35, 4.4],
        [7.5, -9.5, 0.35, 4.4],
      ].forEach(([bx, bz, rot, len]) => {
        const bunker = createSandbagBunker(bx, bz, rot, len);
        scene.add(bunker.mesh);
        obstacles.push(bunker.box);
      });

      // NEW: Historic Lantern Street Lamps illuminating the Fachwerk square
      [
        [-9, -2],
        [9, -2],
        [-9, 10],
        [9, 10],
      ].forEach(([lx, lz], idx) => {
        const lamp = createStreetLamp(lx, lz, 4.4, 0xFBBF24, idx < 2);
        scene.add(lamp.mesh);
        obstacles.push(lamp.box);
      });

      // Enterable Fachwerk Barn (West) with walkable roof & exterior wooden stairs!
      const barnWest = createEnterableBuilding({
        x: -17,
        z: -6,
        width: 11,
        depth: 9,
        height: 4.8,
        style: 'fachwerk',
        hasRoofStairs: 'east',
      });
      scene.add(barnWest.mesh);
      obstacles.push(...barnWest.obstacles);
      walkableSurfaces.push(...barnWest.walkableSurfaces);

      // Enterable Wirtshaus "Zum Adler" (East) with walkable balcony roof!
      const innEast = createEnterableBuilding({
        x: 17,
        z: 4,
        width: 12,
        depth: 9,
        height: 4.8,
        style: 'fachwerk',
        hasRoofStairs: 'west',
      });
      scene.add(innEast.mesh);
      obstacles.push(...innEast.obstacles);
      walkableSurfaces.push(...innEast.walkableSurfaces);

      // Enterable Historic Bakery & Blacksmith (South-West & North-East)
      const bakery = createEnterableBuilding({
        x: -14,
        z: 16,
        width: 9,
        depth: 7.5,
        height: 4.4,
        style: 'fachwerk',
        pitchedRoof: true,
      });
      scene.add(bakery.mesh);
      obstacles.push(...bakery.obstacles);
      walkableSurfaces.push(...bakery.walkableSurfaces);

      const chapel = createEnterableBuilding({
        x: 14,
        z: -16,
        width: 9,
        depth: 8,
        height: 5.2,
        style: 'fachwerk',
        pitchedRoof: true,
      });
      scene.add(chapel.mesh);
      obstacles.push(...chapel.obstacles);
      walkableSurfaces.push(...chapel.walkableSurfaces);

      // Iconic Holländer-Windmühle (North) with rotating blades & walkable platform
      const millGroup = new THREE.Group();
      millGroup.position.set(0, 0, -25);

      const millBase = new THREE.Mesh(
        new THREE.BoxGeometry(10, 3.4, 10),
        new THREE.MeshStandardMaterial({ map: createCobblestoneTexture(4, 2), roughness: 0.8 })
      );
      millBase.position.y = 1.7;
      millBase.castShadow = true;
      millBase.receiveShadow = true;
      millGroup.add(millBase);

      const millTower = new THREE.Mesh(
        new THREE.CylinderGeometry(2.7, 4.1, 11.5, 8),
        new THREE.MeshStandardMaterial({ map: createWoodPlankTexture(4, 4), roughness: 0.75 })
      );
      millTower.position.y = 9.0;
      millTower.castShadow = true;
      millGroup.add(millTower);

      const millCap = new THREE.Mesh(
        new THREE.SphereGeometry(2.85, 10, 10),
        new THREE.MeshStandardMaterial({ color: 0x27272A, roughness: 0.6 })
      );
      millCap.position.y = 14.8;
      millGroup.add(millCap);

      const bladesGroup = new THREE.Group();
      bladesGroup.position.set(0, 13.2, 3.1);
      const bladeMat = new THREE.MeshStandardMaterial({ color: 0xF8FAFC, roughness: 0.5 });
      const sparMat = new THREE.MeshStandardMaterial({ color: 0x451A03, roughness: 0.8 });

      for (let b = 0; b < 4; b++) {
        const arm = new THREE.Group();
        arm.rotation.z = (b * Math.PI) / 2;
        const spar = new THREE.Mesh(new THREE.BoxGeometry(0.28, 7.6, 0.18), sparMat);
        spar.position.y = 3.8;
        arm.add(spar);
        const sail = new THREE.Mesh(new THREE.BoxGeometry(1.15, 6.2, 0.08), bladeMat);
        sail.position.set(0.45, 4.3, 0.06);
        arm.add(sail);
        bladesGroup.add(arm);
      }
      millGroup.add(bladesGroup);
      scene.add(millGroup);
      obstacles.push(new THREE.Box3(new THREE.Vector3(-4.2, 0, -29.2), new THREE.Vector3(4.2, 15, -20.8)));

      // Destructible Crates, Äppler Barrels, Market Stalls & Tech Attachment Chests
      const propCoords: Array<[number, number, number, 'crate' | 'barrel' | 'market_stall' | 'tech_case', 'attachment' | 'shield' | 'mixed']> = [
        [-6, 0, -4, 'market_stall', 'mixed'],
        [6, 0, -4, 'market_stall', 'mixed'],
        [-8, 0, 7, 'barrel', 'shield'],
        [-6.5, 0, 7.5, 'barrel', 'mixed'],
        [8, 0, -8, 'crate', 'mixed'],
        [9.5, 0, -7.5, 'crate', 'mixed'],
        [-17, 5.25, -6, 'tech_case', 'attachment'], // Golden attachment chest on West Barn roof!
        [17, 5.25, 4, 'tech_case', 'attachment'],   // Golden attachment chest on East Inn roof!
        [0, 0, -14, 'tech_case', 'attachment'],
        [5, 0, 12, 'barrel', 'shield'],
        [-5, 0, -15, 'crate', 'mixed'],
      ];

      propCoords.forEach(([px, py, pz, kind, bias]) => {
        const prop = createDestructibleProp(px, py, pz, kind, bias);
        scene.add(prop.mesh);
        destructibles.push(prop);
      });

      addDistantFeldbergBackdrop(scene, -95);
      addTaunusTreeRing(scene, obstacles, 46, 44);
      scatterArenaEnvironment(scene, destructibles, [[-10, 10], [12, -8], [0, -14], [11, 14]]);

      return {
        obstacles,
        walkableSurfaces,
        destructibles,
        update: (delta: number) => {
          bladesGroup.rotation.z += delta * 0.65;
        },
      };
    },
  },

  waldschwimmbad: {
    id: 'waldschwimmbad',
    name: 'Waldschwimmbad Neu-Anspach (Reworked)',
    subtitle: 'Hochsommer · 50m-Becken, Riesen-Wasserrutsche, 5m-Sprungturm & DLRG-Stellung',
    description:
      'Überarbeitetes Waldschwimmbad bei strahlendem Hochsommer: Klettere auf den 5-Meter-Sprungturm, nutze die neue Riesen-Wasserrutsche und die Sandsack-Deckungen am Beckenrand oder verschanze dich auf der Kiosk-Sonnenterrasse.',
    district: 'Anspach Waldrand · Fasanenweg',
    skyColor: 0x0284C7,
    fogColor: 0xBAE6FD,
    atmosphere: {
      timeOfDay: 'Hochsommer-Mittag',
      skyTop: 0x0369A1,
      skyMid: 0x38BDF8,
      skyHorizon: 0xE0F2FE,
      fogColor: 0xBAE6FD,
      fogDensity: 0.0028,
      hemiSky: 0xBAE6FD,
      hemiGround: 0x15803D,
      hemiIntensity: 1.25,
      sunColor: 0xFFFDF4,
      sunIntensity: 2.5,
      sunOffset: [28, 64, 22],
      rimColor: 0x38BDF8,
      rimIntensity: 0.9,
      exposure: 1.28,
      sunDiscColor: 0xFEF9C3,
      isNight: false,
    },
    buildScene: (scene: THREE.Scene) => {
      const obstacles: THREE.Box3[] = [];
      const walkableSurfaces: WalkableSurface[] = [];
      const destructibles: DestructibleProp[] = [];

      // Lawn & sunbed grass
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(160, 160),
        new THREE.MeshStandardMaterial({ map: createGrassGroundTexture(20, 20), roughness: 0.88 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);

      // Poolside tiled deck
      const deck = new THREE.Mesh(
        new THREE.BoxGeometry(42, 0.14, 30),
        new THREE.MeshStandardMaterial({ color: 0xE2E8F0, roughness: 0.65 })
      );
      deck.position.set(0, 0.07, 0);
      deck.receiveShadow = true;
      scene.add(deck);

      // 50m Olympic Pool Basin & Animated Water
      const poolTiledRim = new THREE.Mesh(
        new THREE.BoxGeometry(28, 0.36, 15),
        new THREE.MeshStandardMaterial({ map: createPoolTileTexture(10, 6), roughness: 0.35 })
      );
      poolTiledRim.position.set(0, 0.18, 0);
      scene.add(poolTiledRim);

      const waterMat = new THREE.MeshStandardMaterial({
        color: 0x0EA5E9,
        emissive: 0x0284C7,
        emissiveIntensity: 0.25,
        roughness: 0.12,
        metalness: 0.35,
      });
      const waterMesh = new THREE.Mesh(new THREE.BoxGeometry(26.8, 0.38, 13.8), waterMat);
      waterMesh.position.set(0, 0.22, 0);
      scene.add(waterMesh);

      // Swimming Lane Dividers (Schwimmleinen)
      for (let laneZ = -4.5; laneZ <= 4.5; laneZ += 3) {
        const line = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.08, 26.4, 8),
          new THREE.MeshStandardMaterial({ color: laneZ === 0 ? 0xEF4444 : 0xFACC15 })
        );
        line.rotation.z = Math.PI / 2;
        line.position.set(0, 0.42, laneZ);
        scene.add(line);
      }

      // Walkable 5m Diving Tower (Sprungturm) on East Pool Edge!
      const towerGroup = new THREE.Group();
      const pillarMat = new THREE.MeshStandardMaterial({ color: 0xF8FAFC, roughness: 0.4 });
      const boardMat = new THREE.MeshStandardMaterial({ color: 0x0284C7, roughness: 0.5 });

      const mainColumn = new THREE.Mesh(new THREE.BoxGeometry(3.2, 5.6, 3.2), pillarMat);
      mainColumn.position.set(16.5, 2.8, 0);
      mainColumn.castShadow = true;
      towerGroup.add(mainColumn);

      // Top 5m Platform (Walkable!)
      const platform5m = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.4, 4.4), boardMat);
      platform5m.position.set(14.8, 5.6, 0);
      platform5m.castShadow = true;
      towerGroup.add(platform5m);

      walkableSurfaces.push({
        minX: 11.5,
        maxX: 18.1,
        minZ: -2.2,
        maxZ: 2.2,
        yStart: 5.8,
        yEnd: 5.8,
        rampAxis: 'none',
      });

      // Staircase Ramp up to the 5m Diving Tower (from Z = 10 to Z = 2.2 at X = 16.5)
      const stepsCount = 14;
      for (let s = 0; s < stepsCount; s++) {
        const t = (s + 0.5) / stepsCount;
        const stepH = 5.8 * t;
        const stepZ = THREE.MathUtils.lerp(10.5, 2.2, t);
        const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(2.6, stepH, 0.65), pillarMat);
        stepMesh.position.set(16.5, stepH / 2, stepZ);
        stepMesh.castShadow = true;
        towerGroup.add(stepMesh);
      }
      walkableSurfaces.push({
        minX: 15.1,
        maxX: 17.9,
        minZ: 2.2,
        maxZ: 10.8,
        yStart: 5.8,
        yEnd: 0,
        rampAxis: 'z',
      });
      scene.add(towerGroup);

      // NEW: Bright Yellow/Orange Aqua-Slide (Riesen-Wasserrutsche) at North-West Pool Corner
      const slideMat = new THREE.MeshStandardMaterial({ color: 0xF97316, roughness: 0.25, metalness: 0.2 });
      const slideChute = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 11.5), slideMat);
      slideChute.position.set(-11.5, 2.4, -9.5);
      slideChute.rotation.x = 0.36;
      slideChute.castShadow = true;
      scene.add(slideChute);
      walkableSurfaces.push({
        minX: -12.7,
        maxX: -10.3,
        minZ: -14.8,
        maxZ: -4.2,
        yStart: 4.3,
        yEnd: 0.4,
        rampAxis: 'z',
      });

      // NEW: Poolside Tactical Sandbag Bunkers & DLRG Supply Container
      [
        [-8, 9.5, 0, 4.2],
        [7.5, 9.5, 0, 4.2],
        [-7, -9.5, 0, 4.2],
      ].forEach(([bx, bz, rot, len]) => {
        const sb = createSandbagBunker(bx, bz, rot, len);
        scene.add(sb.mesh);
        obstacles.push(sb.box);
      });

      const dlrgContainer = createShippingContainer(16, -13, 0, 0x0284C7, true);
      scene.add(dlrgContainer.mesh);
      obstacles.push(dlrgContainer.box);
      walkableSurfaces.push(...dlrgContainer.walkableSurfaces);

      // Enterable Kiosk & Changing Rooms (Umkleiden & Freibad-Kiosk mit Pommes-Terrasse)
      const kioskBuilding = createEnterableBuilding({
        x: 0,
        z: -21,
        width: 18,
        depth: 8,
        height: 4.5,
        style: 'modern',
        accentColor: '#0EA5E9',
        hasRoofStairs: 'west',
      });
      scene.add(kioskBuilding.mesh);
      obstacles.push(...kioskBuilding.obstacles);
      walkableSurfaces.push(...kioskBuilding.walkableSurfaces);

      // Enterable DLRG Lifeguard Station (West)
      const dlrgHut = createEnterableBuilding({
        x: -22,
        z: 0,
        width: 8,
        depth: 8,
        height: 4.2,
        style: 'modern',
        accentColor: '#EF4444',
        hasRoofStairs: 'east',
      });
      scene.add(dlrgHut.mesh);
      obstacles.push(...dlrgHut.obstacles);
      walkableSurfaces.push(...dlrgHut.walkableSurfaces);

      // Beach Volleyball Court (South)
      const sandPit = new THREE.Mesh(
        new THREE.BoxGeometry(16, 0.16, 10),
        new THREE.MeshStandardMaterial({ color: 0xFDE68A, roughness: 0.95 })
      );
      sandPit.position.set(-6, 0.08, 22);
      sandPit.receiveShadow = true;
      scene.add(sandPit);

      const net = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 2.2, 9.6),
        new THREE.MeshStandardMaterial({ color: 0xF8FAFC, wireframe: false, roughness: 0.6 })
      );
      net.position.set(-6, 1.2, 22);
      scene.add(net);
      obstacles.push(new THREE.Box3(new THREE.Vector3(-6.3, 0, 17.2), new THREE.Vector3(-5.7, 2.5, 26.8)));

      // Sun Umbrellas & Destructible Crates / Attachment Cases
      const propList: Array<[number, number, number, 'crate' | 'barrel' | 'market_stall' | 'tech_case', 'attachment' | 'shield' | 'mixed']> = [
        [14.8, 5.8, 0, 'tech_case', 'attachment'], // Golden Attachment Crate right on top of the 5m Diving Tower!
        [0, 4.95, -21, 'tech_case', 'attachment'], // Golden Attachment Crate on Kiosk Roof!
        [16, 2.9, -13, 'tech_case', 'attachment'], // On DLRG Container Roof!
        [-12, 0, -11, 'market_stall', 'shield'],
        [11, 0, -11, 'market_stall', 'mixed'],
        [-15, 0, 11, 'crate', 'mixed'],
        [8, 0, 15, 'barrel', 'shield'],
        [9.5, 0, 15.5, 'barrel', 'shield'],
      ];
      propList.forEach(([px, py, pz, kind, bias]) => {
        const prop = createDestructibleProp(px, py, pz, kind, bias);
        scene.add(prop.mesh);
        destructibles.push(prop);
      });

      addDistantFeldbergBackdrop(scene, -95);
      addTaunusTreeRing(scene, obstacles, 46, 44);
      scatterArenaEnvironment(scene, destructibles, [[-12, 10], [14, 12], [-8, -14], [5, 11]]);

      let elapsed = 0;
      return {
        obstacles,
        walkableSurfaces,
        destructibles,
        update: (delta: number) => {
          elapsed += delta;
          waterMesh.position.y = 0.22 + Math.sin(elapsed * 2.6) * 0.04;
        },
      };
    },
  },

  bahnhof: {
    id: 'bahnhof',
    name: 'Bahnhof Neu-Anspach (Reworked)',
    subtitle: 'Dämmerung · RMV LINT-Triebwagen RB15, begehbare Gleis-Überführung & Frachtcontainer',
    description:
      'Überarbeiteter Bahnhof Neu-Anspach in kühler Abenddämmerung: Überquere die neue begehbare Fußgängerbrücke über den Gleisen, erklimme das Zugdach des RB15-Triebwagens und nutze die Frachtcontainer als Deckung.',
    district: 'Bahnhofstraße · Gleis 1 & 2',
    skyColor: 0x1E3A8A,
    fogColor: 0x93C5FD,
    atmosphere: {
      timeOfDay: 'Abenddämmerung',
      skyTop: 0x0F172A,
      skyMid: 0x1E40AF,
      skyHorizon: 0x60A5FA,
      fogColor: 0x93C5FD,
      fogDensity: 0.0042,
      hemiSky: 0x93C5FD,
      hemiGround: 0x1E293B,
      hemiIntensity: 1.05,
      sunColor: 0xFED7AA,
      sunIntensity: 1.95,
      sunOffset: [-38, 34, 24],
      rimColor: 0x38BDF8,
      rimIntensity: 0.95,
      exposure: 1.2,
      sunDiscColor: 0xFB923C,
      isNight: false,
    },
    buildScene: (scene: THREE.Scene) => {
      const obstacles: THREE.Box3[] = [];
      const walkableSurfaces: WalkableSurface[] = [];
      const destructibles: DestructibleProp[] = [];

      // Asphalt P+R ground
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(160, 160),
        new THREE.MeshStandardMaterial({ map: createAsphaltTexture(18, 18), roughness: 0.85 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);

      // Railway Ballast Bed & Steel Tracks (East-West corridor at Z = -12)
      const ballast = new THREE.Mesh(
        new THREE.BoxGeometry(120, 0.28, 9),
        new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.95 })
      );
      ballast.position.set(0, 0.14, -12);
      scene.add(ballast);

      const railMat = new THREE.MeshStandardMaterial({ color: 0xCBD5E1, metalness: 0.85, roughness: 0.25 });
      [-13.8, -12.3, -10.7, -9.2].forEach((rz) => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(120, 0.18, 0.14), railMat);
        rail.position.set(0, 0.34, rz);
        scene.add(rail);
      });

      // Detailed Taunusbahn RB15 LINT-Triebwagen on Track 1!
      const trainGroup = new THREE.Group();
      trainGroup.position.set(-4, 0.35, -12.8);

      const trainPaint = new THREE.MeshStandardMaterial({ color: 0xDC2626, roughness: 0.3, metalness: 0.45 });
      const trainStripe = new THREE.MeshStandardMaterial({ color: 0xF8FAFC, roughness: 0.3 });
      const trainGlass = new THREE.MeshStandardMaterial({
        color: 0xBAE6FD,
        emissive: 0x38BDF8,
        emissiveIntensity: 0.55,
        roughness: 0.1,
      });

      const coachBody = new THREE.Mesh(new THREE.BoxGeometry(32, 3.5, 3.1), trainPaint);
      coachBody.position.y = 2.0;
      coachBody.castShadow = true;
      coachBody.receiveShadow = true;
      trainGroup.add(coachBody);

      const whiteBand = new THREE.Mesh(new THREE.BoxGeometry(32.1, 0.55, 3.16), trainStripe);
      whiteBand.position.y = 1.25;
      trainGroup.add(whiteBand);

      const windowStrip = new THREE.Mesh(new THREE.BoxGeometry(28, 1.1, 3.18), trainGlass);
      windowStrip.position.y = 2.35;
      trainGroup.add(windowStrip);

      scene.add(trainGroup);
      obstacles.push(new THREE.Box3(new THREE.Vector3(-20, 0, -14.5), new THREE.Vector3(12, 4.1, -11.1)));
      // Walkable train roof!
      walkableSurfaces.push({
        minX: -20,
        maxX: 12,
        minZ: -14.4,
        maxZ: -11.2,
        yStart: 4.1,
        yEnd: 4.1,
        rampAxis: 'none',
      });

      // NEW: Walkable Railway Overpass Bridge (Gleis-Fußgängerbrücke) at X = 15 spanning Z = -18..-5
      const bridgeMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.4 });
      const bridgeDeck = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.35, 13), bridgeMat);
      bridgeDeck.position.set(15, 4.3, -11.5);
      bridgeDeck.castShadow = true;
      scene.add(bridgeDeck);
      walkableSurfaces.push({
        minX: 12.9,
        maxX: 17.1,
        minZ: -18,
        maxZ: -5,
        yStart: 4.45,
        yEnd: 4.45,
        rampAxis: 'none',
      });
      // Ramp up from North side (Z = -25 to -18) onto the bridge & train roof level
      const northRamp = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.3, 7.6), bridgeMat);
      northRamp.position.set(15, 2.25, -21.5);
      northRamp.rotation.x = -0.56;
      scene.add(northRamp);
      walkableSurfaces.push({
        minX: 13.0,
        maxX: 17.0,
        minZ: -25.2,
        maxZ: -18.0,
        yStart: 0,
        yEnd: 4.45,
        rampAxis: 'z',
      });

      // NEW: Climbable DB Cargo Container & Tactical Sandbag Bunkers
      const cargoContainer = createShippingContainer(-5, -21, 0, 0xDC2626, true);
      scene.add(cargoContainer.mesh);
      obstacles.push(cargoContainer.box);
      walkableSurfaces.push(...cargoContainer.walkableSurfaces);

      [
        [-6, 1.5, 0, 4.4],
        [5, 1.5, 0, 4.4],
        [0, 8.5, 0, 4.6],
      ].forEach(([bx, bz, rot, len]) => {
        const sb = createSandbagBunker(bx, bz, rot, len);
        scene.add(sb.mesh);
        obstacles.push(sb.box);
      });

      // Platform Street Lamps
      [
        [-14, -6.5],
        [-4, -6.5],
        [6, -6.5],
        [16, -6.5],
      ].forEach(([lx, lz], idx) => {
        const lamp = createStreetLamp(lx, lz, 4.8, 0xE0F2FE, idx % 2 === 0);
        scene.add(lamp.mesh);
        obstacles.push(lamp.box);
      });

      // Covered Station Platform (Bahnsteig Gleis 1)
      const platform = new THREE.Mesh(
        new THREE.BoxGeometry(48, 0.6, 5.5),
        new THREE.MeshStandardMaterial({ color: 0x64748B, roughness: 0.8 })
      );
      platform.position.set(0, 0.3, -6.8);
      platform.receiveShadow = true;
      scene.add(platform);

      // Enterable Bahnhofsgebäude & Bäckerei (Center-East) with Walkable Roof & Ramp!
      const stationBuilding = createEnterableBuilding({
        x: 15,
        z: 5,
        width: 14,
        depth: 9,
        height: 4.6,
        style: 'modern',
        accentColor: '#DC2626',
        hasRoofStairs: 'south',
      });
      scene.add(stationBuilding.mesh);
      obstacles.push(...stationBuilding.obstacles);
      walkableSurfaces.push(...stationBuilding.walkableSurfaces);

      // Enterable Fahrrad-Parkhaus & RMV-Schalter (West) with Walkable Roof!
      const bikeHall = createEnterableBuilding({
        x: -16,
        z: 5,
        width: 11,
        depth: 8,
        height: 4.2,
        style: 'modern',
        accentColor: '#0284C7',
        hasRoofStairs: 'east',
      });
      scene.add(bikeHall.mesh);
      obstacles.push(...bikeHall.obstacles);
      walkableSurfaces.push(...bikeHall.walkableSurfaces);

      // P+R Commuter Parking Lot with 3D Cars & RMV Bus (South Plaza)
      const vehicles: Array<[number, number, number, number, 'sedan' | 'suv' | 'bus']> = [
        [-12, 18, 0.1, 0x2563EB, 'sedan'],
        [-6, 18, -0.05, 0xE2E8F0, 'suv'],
        [8, 19, Math.PI / 2, 0x0EA5E9, 'bus'], // RMV Linienbus
        [-18, -2, Math.PI / 4, 0xF59E0B, 'suv'],
      ];
      vehicles.forEach(([vx, vz, rot, col, type]) => {
        const v = create3DVehicle(vx, vz, rot, col, type);
        scene.add(v.mesh);
        obstacles.push(v.box);
        if (v.roofSurface) walkableSurfaces.push(v.roofSurface);
      });

      // Destructible Crates & Attachment Supply Boxes
      const propList: Array<[number, number, number, 'crate' | 'barrel' | 'market_stall' | 'tech_case', 'attachment' | 'shield' | 'mixed']> = [
        [15, 5.05, 5, 'tech_case', 'attachment'], // On Station Roof
        [-16, 4.65, 5, 'tech_case', 'attachment'], // On Bike Hall Roof
        [15, 4.5, -11.5, 'tech_case', 'attachment'], // On Pedestrian Overpass Bridge!
        [0, 0.6, -6.8, 'tech_case', 'attachment'], // On Station Platform
        [-4, 0, 10, 'crate', 'mixed'],
        [4, 0, 10, 'crate', 'shield'],
        [-10, 0, 12, 'barrel', 'mixed'],
      ];
      propList.forEach(([px, py, pz, kind, bias]) => {
        const prop = createDestructibleProp(px, py, pz, kind, bias);
        scene.add(prop.mesh);
        destructibles.push(prop);
      });

      addDistantFeldbergBackdrop(scene, -95);
      addTaunusTreeRing(scene, obstacles, 48, 38);
      scatterArenaEnvironment(scene, destructibles, [[-10, 8], [12, -8], [6, 12], [-5, -19]]);

      return { obstacles, walkableSurfaces, destructibles };
    },
  },

  buergerhaus: {
    id: 'buergerhaus',
    name: 'Bürgerhaus & Rathausplatz (Reworked)',
    subtitle: 'Abendmarkt · Großes Bürgerhaus, Uhrturm, THW/Feuerwehr-Stellung & Festplatz',
    description:
      'Überarbeiteter Rathausplatz im warmen Abendlicht: Verteidige das Bürgerhaus und das Rathaus, klettere über die Freitreppe auf die Dachterrasse und nutze die neue Feuerwehr-Barrikade & den THW-Container als Deckung.',
    district: 'Stadtmitte · Gustav-Heinemann-Straße',
    skyColor: 0xEA580C,
    fogColor: 0xFED7AA,
    atmosphere: {
      timeOfDay: 'Abendmarkt-Sonnenuntergang',
      skyTop: 0x311042,
      skyMid: 0xEA580C,
      skyHorizon: 0xFDBA74,
      fogColor: 0xFED7AA,
      fogDensity: 0.0036,
      hemiSky: 0xFDBA74,
      hemiGround: 0x27272A,
      hemiIntensity: 1.12,
      sunColor: 0xFFEDD5,
      sunIntensity: 2.2,
      sunOffset: [-45, 28, 30],
      rimColor: 0xF43F5E,
      rimIntensity: 0.9,
      exposure: 1.22,
      sunDiscColor: 0xFB7185,
      isNight: false,
    },
    buildScene: (scene: THREE.Scene) => {
      const obstacles: THREE.Box3[] = [];
      const walkableSurfaces: WalkableSurface[] = [];
      const destructibles: DestructibleProp[] = [];

      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(160, 160),
        new THREE.MeshStandardMaterial({ map: createCobblestoneTexture(20, 20), roughness: 0.82 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);

      // Großes Bürgerhaus Neu-Anspach (North Center) — Enterable Hall + Walkable Roof Terrace!
      const buergerhaus = createEnterableBuilding({
        x: 0,
        z: -19,
        width: 22,
        depth: 11,
        height: 5.4,
        style: 'modern',
        accentColor: '#D97706',
        hasRoofStairs: 'east',
      });
      scene.add(buergerhaus.mesh);
      obstacles.push(...buergerhaus.obstacles);
      walkableSurfaces.push(...buergerhaus.walkableSurfaces);

      // Rathaus & Standesamt (West) — Enterable + Walkable Roof!
      const rathaus = createEnterableBuilding({
        x: -19,
        z: 2,
        width: 11,
        depth: 12,
        height: 4.8,
        style: 'modern',
        accentColor: '#DC2626',
        hasRoofStairs: 'south',
      });
      scene.add(rathaus.mesh);
      obstacles.push(...rathaus.obstacles);
      walkableSurfaces.push(...rathaus.walkableSurfaces);

      // Civic Clock Tower (Uhrturm am Rathausplatz)
      const clockTower = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 13.5, 3.2),
        new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 })
      );
      clockTower.position.set(18, 6.75, -8);
      clockTower.castShadow = true;
      scene.add(clockTower);

      const clockFace = new THREE.Mesh(
        new THREE.CylinderGeometry(1.1, 1.1, 0.25, 16),
        new THREE.MeshStandardMaterial({ color: 0xFEF08A, emissive: 0xF59E0B, emissiveIntensity: 1.6 })
      );
      clockFace.rotation.x = Math.PI / 2;
      clockFace.position.set(18, 11.2, -6.3);
      scene.add(clockFace);
      obstacles.push(new THREE.Box3(new THREE.Vector3(16.4, 0, -9.6), new THREE.Vector3(19.6, 13.5, -6.4)));

      // NEW: Climbable THW / Feuerwehr Command Container & Sandbag Barricades
      const thwContainer = createShippingContainer(17, 1, Math.PI / 2, 0x1D4ED8, true);
      scene.add(thwContainer.mesh);
      obstacles.push(thwContainer.box);
      walkableSurfaces.push(...thwContainer.walkableSurfaces);

      [
        [-8, -7, 0.3, 4.5],
        [8, -7, -0.3, 4.5],
        [-5, 6, 0, 4.2],
        [6, 6, 0, 4.2],
      ].forEach(([bx, bz, rot, len]) => {
        const sb = createSandbagBunker(bx, bz, rot, len);
        scene.add(sb.mesh);
        obstacles.push(sb.box);
      });

      // Warm Evening Plaza Lanterns
      [
        [-11, -10],
        [11, -10],
        [-11, 9],
        [11, 9],
      ].forEach(([lx, lz], idx) => {
        const lamp = createStreetLamp(lx, lz, 4.8, 0xFB923C, idx < 2);
        scene.add(lamp.mesh);
        obstacles.push(lamp.box);
      });

      // Freiwillige Feuerwehr Neu-Anspach Firetruck & Police SUVs
      const firetruck = create3DVehicle(13, 12, -0.35, 0xDC2626, 'firetruck');
      scene.add(firetruck.mesh);
      obstacles.push(firetruck.box);
      if (firetruck.roofSurface) walkableSurfaces.push(firetruck.roofSurface);

      const policeCar = create3DVehicle(-8, 16, 0.25, 0x1D4ED8, 'suv');
      scene.add(policeCar.mesh);
      obstacles.push(policeCar.box);
      if (policeCar.roofSurface) walkableSurfaces.push(policeCar.roofSurface);

      // Destructible Wochenmarkt Stalls, Barrels & Attachment Crates
      const props: Array<[number, number, number, 'crate' | 'barrel' | 'market_stall' | 'tech_case', 'attachment' | 'shield' | 'mixed']> = [
        [-6, 0, -2, 'market_stall', 'mixed'],
        [6, 0, -2, 'market_stall', 'shield'],
        [0, 0, 2, 'market_stall', 'mixed'],
        [0, 5.85, -19, 'tech_case', 'attachment'], // On Bürgerhaus Roof Terrace!
        [-19, 5.25, 2, 'tech_case', 'attachment'], // On Rathaus Roof!
        [17, 2.9, 1, 'tech_case', 'attachment'],    // On THW Container Roof!
        [18, 0, -3, 'tech_case', 'attachment'],
        [-3, 0, 10, 'barrel', 'shield'],
        [4, 0, 10, 'crate', 'mixed'],
      ];
      props.forEach(([px, py, pz, kind, bias]) => {
        const prop = createDestructibleProp(px, py, pz, kind, bias);
        scene.add(prop.mesh);
        destructibles.push(prop);
      });

      addDistantFeldbergBackdrop(scene, -95);
      addTaunusTreeRing(scene, obstacles, 48, 36);
      scatterArenaEnvironment(scene, destructibles, [[-12, 12], [14, -10], [-6, -14], [9, 14]]);

      return { obstacles, walkableSurfaces, destructibles };
    },
  },

  taunuscenter: {
    id: 'taunuscenter',
    name: 'Taunus-Center & Neue Mitte (Reworked)',
    subtitle: 'Neon-Nacht · Einkaufszentrum, Leuchtreklame, Container-Brücke & Parkdeck',
    description:
      'Überarbeitetes Taunus-Center bei atmosphärischer Neon-Nacht: Stürme über die Auffahrtsrampe auf das obere Parkdeck, erklimme die beleuchteten Liefercontainer und nutze die geparkten PKWs als taktische Deckung!',
    district: 'Neue Mitte · Rudolf-Diesel-Straße',
    skyColor: 0x0F172A,
    fogColor: 0x1E1B4B,
    atmosphere: {
      timeOfDay: 'Neon-Nacht',
      skyTop: 0x020617,
      skyMid: 0x1E1B4B,
      skyHorizon: 0x312E81,
      fogColor: 0x1E1B4B,
      fogDensity: 0.0045,
      hemiSky: 0x818CF8,
      hemiGround: 0x1E293B,
      hemiIntensity: 0.92,
      sunColor: 0xC7D2FE,
      sunIntensity: 1.55,
      sunOffset: [30, 52, -24],
      rimColor: 0xEC4899,
      rimIntensity: 1.15,
      exposure: 1.22,
      sunDiscColor: 0xE0E7FF,
      isNight: true,
    },
    buildScene: (scene: THREE.Scene) => {
      const obstacles: THREE.Box3[] = [];
      const walkableSurfaces: WalkableSurface[] = [];
      const destructibles: DestructibleProp[] = [];

      // Asphalt Parking & Shopping Plaza
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(160, 160),
        new THREE.MeshStandardMaterial({ map: createAsphaltTexture(20, 20), roughness: 0.78 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);

      // Taunus-Center Main Shopping Mall Wing (North) with Walkable Upper Parking Deck & Vehicle Ramp!
      const mallMain = createEnterableBuilding({
        x: 0,
        z: -18,
        width: 28,
        depth: 13,
        height: 5.5,
        style: 'modern',
        accentColor: '#F59E0B',
        hasRoofStairs: 'east',
      });
      scene.add(mallMain.mesh);
      obstacles.push(...mallMain.obstacles);
      walkableSurfaces.push(...mallMain.walkableSurfaces);

      // NEW: Glowing Neon Mall Arch & Billboard Sign on top of Taunus-Center
      const neonArchMat = new THREE.MeshStandardMaterial({
        color: 0xEC4899,
        emissive: 0xEC4899,
        emissiveIntensity: 2.2,
        roughness: 0.2,
      });
      const neonSign = new THREE.Mesh(new THREE.BoxGeometry(16, 1.4, 0.45), neonArchMat);
      neonSign.position.set(0, 7.2, -11.3);
      scene.add(neonSign);

      const cyanStripMat = new THREE.MeshStandardMaterial({
        color: 0x22D3EE,
        emissive: 0x06B6D4,
        emissiveIntensity: 2.0,
        roughness: 0.2,
      });
      const cyanStrip = new THREE.Mesh(new THREE.BoxGeometry(26, 0.35, 0.4), cyanStripMat);
      cyanStrip.position.set(0, 5.7, -11.3);
      scene.add(cyanStrip);

      // Retail Pavilion / Supermarkt & Drogerie Wing (West) with Walkable Roof
      const westWing = createEnterableBuilding({
        x: -21,
        z: 4,
        width: 12,
        depth: 15,
        height: 4.6,
        style: 'modern',
        accentColor: '#10B981',
        hasRoofStairs: 'south',
      });
      scene.add(westWing.mesh);
      obstacles.push(...westWing.obstacles);
      walkableSurfaces.push(...westWing.walkableSurfaces);

      // Café & Ladenzeile Neue Mitte (East)
      const eastWing = createEnterableBuilding({
        x: 21,
        z: 6,
        width: 11,
        depth: 13,
        height: 4.6,
        style: 'modern',
        accentColor: '#38BDF8',
        hasRoofStairs: 'north',
      });
      scene.add(eastWing.mesh);
      obstacles.push(...eastWing.obstacles);
      walkableSurfaces.push(...eastWing.walkableSurfaces);

      // NEW: Climbable Delivery Container & Tactical Sandbag Bunkers in Center Plaza
      const mallContainer = createShippingContainer(0, -5, 0, 0x7C3AED, true);
      scene.add(mallContainer.mesh);
      obstacles.push(mallContainer.box);
      walkableSurfaces.push(...mallContainer.walkableSurfaces);

      [
        [-8, 8, 0.3, 4.4],
        [8, 8, -0.3, 4.4],
        [-11, -5, -0.2, 4.2],
        [11, -5, 0.2, 4.2],
      ].forEach(([bx, bz, rot, len]) => {
        const sb = createSandbagBunker(bx, bz, rot, len);
        scene.add(sb.mesh);
        obstacles.push(sb.box);
      });

      // Neon Street Lamps with real PointLights
      [
        [-12, -2, 0x22D3EE],
        [12, -2, 0xEC4899],
        [-12, 12, 0xEC4899],
        [12, 12, 0x22D3EE],
      ].forEach(([lx, lz, col], idx) => {
        const lamp = createStreetLamp(lx, lz, 5.2, col, idx < 3);
        scene.add(lamp.mesh);
        obstacles.push(lamp.box);
      });

      // Numerous Parked 3D Cars on the Taunus-Center Parking Lot!
      const cars: Array<[number, number, number, number, 'sedan' | 'suv']> = [
        [-9, 3, 0, 0xEF4444, 'suv'],
        [-3, 3, 0, 0x3B82F6, 'sedan'],
        [4, 3, 0, 0xF8FAFC, 'suv'],
        [10, 3, 0, 0x10B981, 'sedan'],
        [-7, 16, Math.PI / 2, 0xF59E0B, 'sedan'],
        [7, 16, -Math.PI / 3, 0x6366F1, 'suv'],
      ];
      cars.forEach(([cx, cz, rot, col, kind]) => {
        const car = create3DVehicle(cx, cz, rot, col, kind);
        scene.add(car.mesh);
        obstacles.push(car.box);
        if (car.roofSurface) walkableSurfaces.push(car.roofSurface);
      });

      // Supply Crates & Golden Weapon Attachment Cases
      const props: Array<[number, number, number, 'crate' | 'barrel' | 'market_stall' | 'tech_case', 'attachment' | 'shield' | 'mixed']> = [
        [-6, 5.95, -18, 'tech_case', 'attachment'], // Upper Parking Deck of Taunus-Center!
        [6, 5.95, -18, 'tech_case', 'attachment'],  // Upper Parking Deck of Taunus-Center!
        [0, 2.9, -5, 'tech_case', 'attachment'],    // On Center Container Roof!
        [-21, 5.05, 4, 'tech_case', 'attachment'],  // West Wing Roof!
        [-12, 0, -8, 'crate', 'mixed'],
        [12, 0, -8, 'crate', 'mixed'],
        [5, 0, 10, 'barrel', 'shield'],
      ];
      props.forEach(([px, py, pz, kind, bias]) => {
        const prop = createDestructibleProp(px, py, pz, kind, bias);
        scene.add(prop.mesh);
        destructibles.push(prop);
      });

      addDistantFeldbergBackdrop(scene, -95);
      addTaunusTreeRing(scene, obstacles, 50, 36);
      scatterArenaEnvironment(scene, destructibles, [[-14, 10], [12, 12], [0, -10], [21, 14]]);

      let t = 0;
      return {
        obstacles,
        walkableSurfaces,
        destructibles,
        update: (delta: number) => {
          t += delta;
          neonArchMat.emissiveIntensity = 1.85 + Math.sin(t * 5.0) * 0.45;
        },
      };
    },
  },

  ars: {
    id: 'ars',
    name: 'Adolf-Reichwein-Schule · ARS (Reworked)',
    subtitle: 'Flutlicht-Abend · Schulcampus, Mensa-Dachterrasse, Kleinspielfeld & Sporthalle',
    description:
      'Überarbeiteter Campus der Adolf-Reichwein-Schule unter hellem Flutlicht: Kämpfe auf dem neuen Kleinspielfeld, nutze Tischtennisplatten, Sandsack-Stellungen und den gelben Schulbus als Deckung oder sichere dir das Mensa-Flachdach!',
    district: 'Wiesenau · Adolf-Reichwein-Straße',
    skyColor: 0x0F172A,
    fogColor: 0x1E293B,
    atmosphere: {
      timeOfDay: 'Flutlicht-Abend',
      skyTop: 0x020617,
      skyMid: 0x0F172A,
      skyHorizon: 0x1E3A8A,
      fogColor: 0x1E293B,
      fogDensity: 0.004,
      hemiSky: 0x93C5FD,
      hemiGround: 0x1E293B,
      hemiIntensity: 0.96,
      sunColor: 0xE0F2FE,
      sunIntensity: 1.75,
      sunOffset: [-32, 58, 26],
      rimColor: 0x38BDF8,
      rimIntensity: 1.05,
      exposure: 1.24,
      sunDiscColor: 0xF8FAFC,
      isNight: true,
    },
    buildScene: (scene: THREE.Scene) => {
      const obstacles: THREE.Box3[] = [];
      const walkableSurfaces: WalkableSurface[] = [];
      const destructibles: DestructibleProp[] = [];

      // Schoolyard pavement
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(160, 160),
        new THREE.MeshStandardMaterial({ map: createAsphaltTexture(22, 22), roughness: 0.85 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);

      // NEW: Green Tartan Sports Court (Kleinspielfeld) in the Central Courtyard
      const court = new THREE.Mesh(
        new THREE.BoxGeometry(18, 0.08, 12),
        new THREE.MeshStandardMaterial({ color: 0x15803D, roughness: 0.75 })
      );
      court.position.set(0, 0.04, -3);
      court.receiveShadow = true;
      scene.add(court);

      // ARS Main Classroom & Mensa Building (North) — Enterable + Walkable Flat Roof!
      const mensa = createEnterableBuilding({
        x: 0,
        z: -19,
        width: 24,
        depth: 10,
        height: 5.0,
        style: 'modern',
        accentColor: '#2563EB',
        hasRoofStairs: 'west',
      });
      scene.add(mensa.mesh);
      obstacles.push(...mensa.obstacles);
      walkableSurfaces.push(...mensa.walkableSurfaces);

      // ARS Sporthalle (East) — Enterable + Walkable Roof!
      const sporthalle = createEnterableBuilding({
        x: 20,
        z: 2,
        width: 12,
        depth: 15,
        height: 5.4,
        style: 'modern',
        accentColor: '#EA580C',
        hasRoofStairs: 'south',
      });
      scene.add(sporthalle.mesh);
      obstacles.push(...sporthalle.obstacles);
      walkableSurfaces.push(...sporthalle.walkableSurfaces);

      // Naturwissenschafts-Trakt / Aula (West)
      const nawiTrakt = createEnterableBuilding({
        x: -20,
        z: 3,
        width: 11,
        depth: 13,
        height: 4.8,
        style: 'modern',
        accentColor: '#16A34A',
        hasRoofStairs: 'east',
      });
      scene.add(nawiTrakt.mesh);
      obstacles.push(...nawiTrakt.obstacles);
      walkableSurfaces.push(...nawiTrakt.walkableSurfaces);

      // Concrete Ping-Pong Tables (Tischtennisplatten) on the Schoolyard as Tactical Cover!
      const ttCoords = [
        [-6, -3],
        [6, -3],
        [-6, 7],
        [6, 7],
      ];
      const concreteMat = new THREE.MeshStandardMaterial({ color: 0x94A3B8, roughness: 0.7 });
      const netMat = new THREE.MeshStandardMaterial({ color: 0xF8FAFC, roughness: 0.5 });

      ttCoords.forEach(([tx, tz]) => {
        const table = new THREE.Group();
        const slab = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.16, 1.6), concreteMat);
        slab.position.y = 0.85;
        slab.castShadow = true;
        table.add(slab);

        const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.85, 1.2), concreteMat);
        leg1.position.set(-0.9, 0.42, 0);
        const leg2 = leg1.clone();
        leg2.position.x = 0.9;
        table.add(leg1, leg2);

        const net = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.25, 1.64), netMat);
        net.position.y = 1.02;
        table.add(net);

        table.position.set(tx, 0, tz);
        scene.add(table);
        obstacles.push(new THREE.Box3(new THREE.Vector3(tx - 1.45, 0, tz - 0.85), new THREE.Vector3(tx + 1.45, 1.2, tz + 0.85)));
      });

      // NEW: Climbable Sports Equipment Container & Campus Floodlights + Sandbag Bunkers
      const sportContainer = createShippingContainer(-11, -11, 0, 0xEA580C, true);
      scene.add(sportContainer.mesh);
      obstacles.push(sportContainer.box);
      walkableSurfaces.push(...sportContainer.walkableSurfaces);

      [
        [0, -9.5, 0, 4.6],
        [-9, 11, 0.35, 4.2],
        [9, 11, -0.35, 4.2],
      ].forEach(([bx, bz, rot, len]) => {
        const sb = createSandbagBunker(bx, bz, rot, len);
        scene.add(sb.mesh);
        obstacles.push(sb.box);
      });

      // High Campus Floodlights (Flutlichtmasten)
      [
        [-11, -9],
        [11, -9],
        [-11, 10],
        [11, 10],
      ].forEach(([lx, lz], idx) => {
        const flood = createStreetLamp(lx, lz, 6.2, 0xE0F2FE, idx < 3);
        scene.add(flood.mesh);
        obstacles.push(flood.box);
      });

      // Buswendeschleife (South) with School Bus & Teacher Cars
      const schoolBus = create3DVehicle(0, 20, Math.PI / 2, 0xF59E0B, 'bus');
      scene.add(schoolBus.mesh);
      obstacles.push(schoolBus.box);
      if (schoolBus.roofSurface) walkableSurfaces.push(schoolBus.roofSurface);

      const teacherCar1 = create3DVehicle(-12, 18, 0.2, 0x38BDF8, 'sedan');
      scene.add(teacherCar1.mesh);
      obstacles.push(teacherCar1.box);

      // Attachment Chests & Destructibles
      const props: Array<[number, number, number, 'crate' | 'barrel' | 'market_stall' | 'tech_case', 'attachment' | 'shield' | 'mixed']> = [
        [0, 5.45, -19, 'tech_case', 'attachment'],  // Mensa Roof!
        [20, 5.85, 2, 'tech_case', 'attachment'],   // Sporthalle Roof!
        [-20, 5.25, 3, 'tech_case', 'attachment'],  // NaWi Roof!
        [-11, 2.9, -11, 'tech_case', 'attachment'], // Sports Container Roof!
        [0, 0, 2, 'tech_case', 'attachment'],       // Center Courtyard!
        [-10, 0, -6, 'crate', 'shield'],
        [10, 0, -6, 'crate', 'mixed'],
      ];
      props.forEach(([px, py, pz, kind, bias]) => {
        const prop = createDestructibleProp(px, py, pz, kind, bias);
        scene.add(prop.mesh);
        destructibles.push(prop);
      });

      addDistantFeldbergBackdrop(scene, -95);
      addTaunusTreeRing(scene, obstacles, 50, 40);
      scatterArenaEnvironment(scene, destructibles, [[-12, 8], [14, 10], [8, -14], [-14, -14]]);

      return { obstacles, walkableSurfaces, destructibles };
    },
  },

  feldbergblick: {
    id: 'feldbergblick',
    name: 'Feldbergblick & Taunuskamm (Reworked)',
    subtitle: 'Bergnebel-Morgen · Holz-Aussichtsturm, Funk-Kommandoposten & Bunker-Stellungen',
    description:
      'Überarbeitete Höhenlage oberhalb von Anspach mit direktem Blick auf den Großen Feldberg (879m): Erklimme den hölzernen Taunus-Aussichtsturm, sichere den neuen Funk-Container und verteidige die befestigten Sandsack-Stellungen!',
    district: 'Taunuskamm · Richtung Großer Feldberg',
    skyColor: 0x0284C7,
    fogColor: 0xCFFAFE,
    atmosphere: {
      timeOfDay: 'Nebliger Gipfel-Morgen',
      skyTop: 0x0F172A,
      skyMid: 0x0284C7,
      skyHorizon: 0xA5F3FC,
      fogColor: 0xCFFAFE,
      fogDensity: 0.0046,
      hemiSky: 0xA5F3FC,
      hemiGround: 0x14532D,
      hemiIntensity: 1.15,
      sunColor: 0xFEF9C3,
      sunIntensity: 2.15,
      sunOffset: [44, 38, -28],
      rimColor: 0x22D3EE,
      rimIntensity: 1.0,
      exposure: 1.24,
      sunDiscColor: 0xFDE047,
      isNight: false,
    },
    buildScene: (scene: THREE.Scene) => {
      const obstacles: THREE.Box3[] = [];
      const walkableSurfaces: WalkableSurface[] = [];
      const destructibles: DestructibleProp[] = [];

      // Taunus Highland Meadow Ground
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(160, 160),
        new THREE.MeshStandardMaterial({ map: createGrassGroundTexture(24, 24), roughness: 0.9 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);

      // Walkable Wooden Taunus Observation Tower (Aussichtsturm Feldbergblick) at Center!
      const towerGroup = new THREE.Group();
      const timberMat = new THREE.MeshStandardMaterial({ map: createWoodPlankTexture(2, 6), roughness: 0.8 });

      // 4 Heavy Corner Timber Posts
      [
        [-2.8, -2.8],
        [2.8, -2.8],
        [-2.8, 2.8],
        [2.8, 2.8],
      ].forEach(([px, pz]) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 8.5, 8), timberMat);
        post.position.set(px, 4.25, pz);
        post.castShadow = true;
        towerGroup.add(post);
      });

      // Elevated Sniper Observation Deck at Y = 5.4m
      const deckFloor = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.4, 7.2), timberMat);
      deckFloor.position.set(0, 5.2, 0);
      deckFloor.castShadow = true;
      deckFloor.receiveShadow = true;
      towerGroup.add(deckFloor);

      walkableSurfaces.push({
        minX: -3.6,
        maxX: 3.6,
        minZ: -3.6,
        maxZ: 3.6,
        yStart: 5.4,
        yEnd: 5.4,
        rampAxis: 'none',
      });

      // Tower Roof Canopy (High clearance at Y = 9.0 so player stands comfortably underneath)
      const towerRoof = new THREE.Mesh(
        new THREE.ConeGeometry(5.6, 2.8, 4),
        new THREE.MeshStandardMaterial({ map: createRoofTileTexture(3, 2), roughness: 0.8 })
      );
      towerRoof.rotation.y = Math.PI / 4;
      towerRoof.position.set(0, 9.6, 0);
      towerGroup.add(towerRoof);

      // Rotating Radar / Weather Beacon on top of the Observation Tower
      const radarDish = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 0.45, 0.3),
        new THREE.MeshStandardMaterial({ color: 0x38BDF8, emissive: 0x0284C7, emissiveIntensity: 0.9 })
      );
      radarDish.position.set(0, 11.3, 0);
      towerGroup.add(radarDish);

      // Wooden Ramp / Staircase up to the Observation Tower (South side: Z = 10.5 to Z = 3.6, leaving (0,14) clear!)
      const steps = 14;
      for (let s = 0; s < steps; s++) {
        const t = (s + 0.5) / steps;
        const stepH = 5.4 * t;
        const stepZ = THREE.MathUtils.lerp(10.2, 3.6, t);
        const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(2.8, stepH, 0.55), timberMat);
        stepMesh.position.set(0, stepH / 2, stepZ);
        stepMesh.castShadow = true;
        towerGroup.add(stepMesh);
      }
      walkableSurfaces.push({
        minX: -1.5,
        maxX: 1.5,
        minZ: 3.6,
        maxZ: 10.4,
        yStart: 5.4,
        yEnd: 0,
        rampAxis: 'z',
      });

      scene.add(towerGroup);

      // NEW: Tactical Radio Outpost Container & Fortified Sandbag Ring around the Summit
      const outpostContainer = createShippingContainer(0, -18, 0, 0x15803D, true);
      scene.add(outpostContainer.mesh);
      obstacles.push(outpostContainer.box);
      walkableSurfaces.push(...outpostContainer.walkableSurfaces);

      [
        [-7.5, -6, 0.4, 4.6],
        [7.5, -6, -0.4, 4.6],
        [-7.5, 7, -0.4, 4.6],
        [7.5, 7, 0.4, 4.6],
      ].forEach(([bx, bz, rot, len]) => {
        const sb = createSandbagBunker(bx, bz, rot, len);
        scene.add(sb.mesh);
        obstacles.push(sb.box);
      });

      // Enterable Taunusklub Wander-Schutzhütte (West) & Forsthaus (East)
      const schutzhuette = createEnterableBuilding({
        x: -18,
        z: -8,
        width: 10,
        depth: 8,
        height: 4.2,
        style: 'fachwerk',
        hasRoofStairs: 'south',
      });
      scene.add(schutzhuette.mesh);
      obstacles.push(...schutzhuette.obstacles);
      walkableSurfaces.push(...schutzhuette.walkableSurfaces);

      const forsthaus = createEnterableBuilding({
        x: 18,
        z: -6,
        width: 11,
        depth: 8.5,
        height: 4.4,
        style: 'fachwerk',
        hasRoofStairs: 'south',
      });
      scene.add(forsthaus.mesh);
      obstacles.push(...forsthaus.obstacles);
      walkableSurfaces.push(...forsthaus.walkableSurfaces);

      // Wanderparkplatz SUVs & Taunus Quartzite Rock Boulders
      const rangerSuv = create3DVehicle(-10, 17, 0.35, 0x15803D, 'suv');
      scene.add(rangerSuv.mesh);
      obstacles.push(rangerSuv.box);
      if (rangerSuv.roofSurface) walkableSurfaces.push(rangerSuv.roofSurface);

      const hikerSuv = create3DVehicle(11, 17, -0.25, 0xD97706, 'suv');
      scene.add(hikerSuv.mesh);
      obstacles.push(hikerSuv.box);
      if (hikerSuv.roofSurface) walkableSurfaces.push(hikerSuv.roofSurface);

      const rockMat = new THREE.MeshStandardMaterial({ color: 0x64748B, roughness: 0.92 });
      [
        [-9, -16, 2.2],
        [9, -15, 2.5],
        [-14, 7, 1.9],
        [14, 8, 2.1],
      ].forEach(([rx, rz, rScale]) => {
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(rScale, 1), rockMat);
        rock.position.set(rx, rScale * 0.65, rz);
        rock.castShadow = true;
        rock.receiveShadow = true;
        scene.add(rock);
        obstacles.push(
          new THREE.Box3(
            new THREE.Vector3(rx - rScale * 0.85, 0, rz - rScale * 0.85),
            new THREE.Vector3(rx + rScale * 0.85, rScale * 1.4, rz + rScale * 0.85)
          )
        );
      });

      // Golden Attachment Supply Cases & Wooden Crates
      const props: Array<[number, number, number, 'crate' | 'barrel' | 'market_stall' | 'tech_case', 'attachment' | 'shield' | 'mixed']> = [
        [0, 5.4, 0, 'tech_case', 'attachment'],     // Right on top of the Observation Tower!
        [0, 2.9, -18, 'tech_case', 'attachment'],   // On Radio Outpost Container Roof!
        [-18, 4.65, -8, 'tech_case', 'attachment'], // On Schutzhütte Roof!
        [18, 4.85, -6, 'tech_case', 'attachment'],  // On Forsthaus Roof!
        [-6, 0, 5, 'barrel', 'shield'],
        [6, 0, 5, 'crate', 'mixed'],
        [0, 0, -11, 'crate', 'shield'],
      ];
      props.forEach(([px, py, pz, kind, bias]) => {
        const prop = createDestructibleProp(px, py, pz, kind, bias);
        scene.add(prop.mesh);
        destructibles.push(prop);
      });

      // Massive, closer Großer Feldberg (879m) Mountain Panorama directly North!
      addDistantFeldbergBackdrop(scene, -75);
      addTaunusTreeRing(scene, obstacles, 45, 48);
      scatterArenaEnvironment(scene, destructibles, [[-10, 10], [12, -8], [5, 12], [-12, -18]]);

      return {
        obstacles,
        walkableSurfaces,
        destructibles,
        update: (delta: number) => {
          radarDish.rotation.y += delta * 1.8;
        },
      };
    },
  },
};
