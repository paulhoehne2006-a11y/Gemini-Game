import * as THREE from 'three';
import { WalkableSurface } from '../../types';
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
} from './textures';

export interface ArenaBuildResult {
  obstacles: THREE.Box3[];
  walkableSurfaces: WalkableSurface[];
  destructibles: DestructibleProp[];
  update?: (delta: number) => void;
}

export interface ArenaConfig {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  district: string;
  skyColor: number;
  fogColor: number;
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


function addTaunusTreeRing(scene: THREE.Scene, obstacles: THREE.Box3[], innerRadius = 46, count = 42) {
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x451A03, roughness: 0.9 });
  const leafDark = new THREE.MeshStandardMaterial({ color: 0x14532D, roughness: 0.8 });
  const leafMid = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.75 });

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (i % 3) * 0.04;
    const dist = innerRadius + (i % 4) * 3.8;
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    const scale = 0.85 + (i % 5) * 0.16;

    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.32 * scale, 0.48 * scale, 2.8 * scale, 7), trunkMat);
    trunk.position.y = 1.4 * scale;
    trunk.castShadow = true;
    tree.add(trunk);

    const c1 = new THREE.Mesh(new THREE.ConeGeometry(2.1 * scale, 4.2 * scale, 7), leafDark);
    c1.position.y = 3.6 * scale;
    c1.castShadow = true;
    tree.add(c1);

    const c2 = new THREE.Mesh(new THREE.ConeGeometry(1.6 * scale, 3.5 * scale, 7), leafMid);
    c2.position.y = 5.6 * scale;
    c2.castShadow = true;
    tree.add(c2);

    tree.position.set(x, 0, z);
    scene.add(tree);

    obstacles.push(
      new THREE.Box3(
        new THREE.Vector3(x - 0.8, 0, z - 0.8),
        new THREE.Vector3(x + 0.8, 6, z + 0.8)
      )
    );
  }
}

function addDistantFeldbergBackdrop(scene: THREE.Scene, zOffset = -95) {
  const group = new THREE.Group();
  const mountainMat = new THREE.MeshStandardMaterial({
    color: 0x1E293B,
    roughness: 0.95,
  });

  // Großer Feldberg (879m) & Altkönig ridge silhouette
  const mainPeak = new THREE.Mesh(new THREE.ConeGeometry(55, 42, 7), mountainMat);
  mainPeak.position.set(0, 18, zOffset);
  group.add(mainPeak);

  const westPeak = new THREE.Mesh(new THREE.ConeGeometry(42, 28, 6), mountainMat);
  westPeak.position.set(-48, 12, zOffset + 8);
  group.add(westPeak);

  const eastPeak = new THREE.Mesh(new THREE.ConeGeometry(45, 31, 6), mountainMat);
  eastPeak.position.set(52, 13, zOffset + 10);
  group.add(eastPeak);

  // Iconic Feldberg Fernmeldeturm on summit
  const towerShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 1.1, 14, 10),
    new THREE.MeshStandardMaterial({ color: 0xCBD5E1, roughness: 0.5 })
  );
  towerShaft.position.set(0, 42, zOffset);
  group.add(towerShaft);

  const towerPod = new THREE.Mesh(
    new THREE.CylinderGeometry(2.1, 1.8, 2.2, 12),
    new THREE.MeshStandardMaterial({ color: 0xDC2626, roughness: 0.4 })
  );
  towerPod.position.set(0, 45.5, zOffset);
  group.add(towerPod);

  const spire = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.35, 6, 8),
    new THREE.MeshStandardMaterial({ color: 0xF8FAFC, emissive: 0xEF4444, emissiveIntensity: 0.8 })
  );
  spire.position.set(0, 50.5, zOffset);
  group.add(spire);

  scene.add(group);
}

export const ARENAS: Record<string, ArenaConfig> = {
  hessenpark: {
    id: 'hessenpark',
    name: 'Freilichtmuseum Hessenpark',
    subtitle: 'Historischer Marktplatz, Windmühle & begehbare Fachwerkscheunen',
    description:
      'Authentischer Nachbau des Freilichtmuseums Hessenpark: Kämpfe zwischen historischen Fachwerkhäusern, erklimme den Scheunen-Dachboden über die Außentreppe und nutze die Holländer-Windmühle als Deckung.',
    district: 'Neu-Anspach Süd · Laubweg',
    skyColor: 0x1E293B,
    fogColor: 0x1E293B,
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
        new THREE.CylinderGeometry(28, 28, 0.08, 36),
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
    name: 'Waldschwimmbad Neu-Anspach',
    subtitle: '50m-Schwimmerbecken, begehbarer 5m-Sprungturm & Kiosk-Dachterrasse',
    description:
      'Das beliebte Freibad am Waldrand: Klettere auf den 5-Meter-Sprungturm für freies Schussfeld über das gesamte Becken oder verschanze dich auf der Kiosk-Sonnenterrasse.',
    district: 'Anspach Waldrand · Fasanenweg',
    skyColor: 0x0F172A,
    fogColor: 0x1E293B,
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
        new THREE.BoxGeometry(40, 0.14, 28),
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
        emissiveIntensity: 0.22,
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
    name: 'Bahnhof Neu-Anspach (Taunusbahn)',
    subtitle: 'RMV/HLB LINT-Triebwagen RB15, Bahnsteig, Fußgängerbrücke & P+R-Autos',
    description:
      'Der Bahnhof Neu-Anspach an der Taunusbahn-Strecke RB15: Nutze den wartenden LINT-Zug und die geparkten Pendler-Autos als Deckung oder sichere dir das Dach des Bahnhofsgebäudes.',
    district: 'Bahnhofstraße · Gleis 1 & 2',
    skyColor: 0x0F172A,
    fogColor: 0x1E293B,
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

      // Railway Ballast Bed & Steel Tracks (North-South corridor at Z = -12)
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
        emissiveIntensity: 0.35,
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
        [0, 18, 0, 0x16A34A, 'sedan'],
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

      return { obstacles, walkableSurfaces, destructibles };
    },
  },

  buergerhaus: {
    id: 'buergerhaus',
    name: 'Bürgerhaus & Rathausplatz',
    subtitle: 'Großes Bürgerhaus mit Dachterrasse, Uhrturm, Feuerwehr & Wochenmarkt',
    description:
      'Das gesellschaftliche Zentrum von Neu-Anspach: Verteidige das Bürgerhaus und das Rathaus, klettere über die Freitreppe auf die Dachterrasse und nutze das Feuerwehr-Einsatzfahrzeug als Deckung.',
    district: 'stadtmitte · Gustav-Heinemann-Straße',
    skyColor: 0x0F172A,
    fogColor: 0x1E293B,
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
        new THREE.MeshStandardMaterial({ color: 0xFEF08A, emissive: 0xF59E0B, emissiveIntensity: 1.4 })
      );
      clockFace.rotation.x = Math.PI / 2;
      clockFace.position.set(18, 11.2, -6.3);
      scene.add(clockFace);
      obstacles.push(new THREE.Box3(new THREE.Vector3(16.4, 0, -9.6), new THREE.Vector3(19.6, 13.5, -6.4)));

      // Freiwillige Feuerwehr Neu-Anspach Firetruck & Police SUVs
      const firetruck = create3DVehicle(13, 10, -0.35, 0xDC2626, 'firetruck');
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
        [0, 0, 6, 'market_stall', 'mixed'],
        [0, 5.85, -19, 'tech_case', 'attachment'], // On Bürgerhaus Roof Terrace!
        [-19, 5.25, 2, 'tech_case', 'attachment'], // On Rathaus Roof!
        [18, 0, -3, 'tech_case', 'attachment'],
        [-3, 0, 12, 'barrel', 'shield'],
        [4, 0, 12, 'crate', 'mixed'],
      ];
      props.forEach(([px, py, pz, kind, bias]) => {
        const prop = createDestructibleProp(px, py, pz, kind, bias);
        scene.add(prop.mesh);
        destructibles.push(prop);
      });

      addDistantFeldbergBackdrop(scene, -95);
      addTaunusTreeRing(scene, obstacles, 48, 36);

      return { obstacles, walkableSurfaces, destructibles };
    },
  },

  taunuscenter: {
    id: 'taunuscenter',
    name: 'Taunus-Center & Neue Mitte',
    subtitle: 'Einkaufszentrum, Ladenpassage, Parkdeck-Auffahrt & geparkte Autos',
    description:
      'Das bekannte Einkaufszentrum in der Neuen Mitte von Neu-Anspach: Stürme über die Auffahrtsrampe auf das obere Parkdeck des Taunus-Centers und nutze die geparkten PKWs als taktische Deckung!',
    district: 'Neue Mitte · Rudolf-Diesel-Straße',
    skyColor: 0x0F172A,
    fogColor: 0x1E293B,
    buildScene: (scene: THREE.Scene) => {
      const obstacles: THREE.Box3[] = [];
      const walkableSurfaces: WalkableSurface[] = [];
      const destructibles: DestructibleProp[] = [];

      // Asphalt Parking & Shopping Plaza
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(160, 160),
        new THREE.MeshStandardMaterial({ map: createAsphaltTexture(20, 20), roughness: 0.82 })
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

      // Numerous Parked 3D Cars on the Taunus-Center Parking Lot & Upper Roof Deck!
      const cars: Array<[number, number, number, number, 'sedan' | 'suv']> = [
        [-9, 3, 0, 0xEF4444, 'suv'],
        [-3, 3, 0, 0x3B82F6, 'sedan'],
        [4, 3, 0, 0xF8FAFC, 'suv'],
        [10, 3, 0, 0x10B981, 'sedan'],
        [-7, 15, Math.PI / 2, 0xF59E0B, 'sedan'],
        [6, 15, -Math.PI / 3, 0x6366F1, 'suv'],
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
        [-21, 5.05, 4, 'tech_case', 'attachment'],  // West Wing Roof!
        [0, 0, -4, 'market_stall', 'shield'],
        [-12, 0, -6, 'crate', 'mixed'],
        [12, 0, -6, 'crate', 'mixed'],
        [0, 0, 9, 'barrel', 'shield'],
      ];
      props.forEach(([px, py, pz, kind, bias]) => {
        const prop = createDestructibleProp(px, py, pz, kind, bias);
        scene.add(prop.mesh);
        destructibles.push(prop);
      });

      addDistantFeldbergBackdrop(scene, -95);
      addTaunusTreeRing(scene, obstacles, 50, 36);

      return { obstacles, walkableSurfaces, destructibles };
    },
  },

  ars: {
    id: 'ars',
    name: 'Adolf-Reichwein-Schule (ARS)',
    subtitle: 'Schulcampus, begehbare Mensa-Dachterrasse, Sporthalle & Schulbus-Schleife',
    description:
      'Der große Campus der Adolf-Reichwein-Schule in Neu-Anspach: Nutze die Tischtennisplatten auf dem Pausenhof und den gelben Schulbus als Deckung oder sichere dir das Flachdach der Mensa!',
    district: 'Wiesenau · Adolf-Reichwein-Straße',
    skyColor: 0x0F172A,
    fogColor: 0x1E293B,
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
        [0, 0, 2, 'tech_case', 'attachment'],       // Center Courtyard!
        [-10, 0, -8, 'crate', 'shield'],
        [10, 0, -8, 'crate', 'mixed'],
      ];
      props.forEach(([px, py, pz, kind, bias]) => {
        const prop = createDestructibleProp(px, py, pz, kind, bias);
        scene.add(prop.mesh);
        destructibles.push(prop);
      });

      addDistantFeldbergBackdrop(scene, -95);
      addTaunusTreeRing(scene, obstacles, 50, 40);

      return { obstacles, walkableSurfaces, destructibles };
    },
  },

  feldbergblick: {
    id: 'feldbergblick',
    name: 'Feldbergblick & Taunuskamm',
    subtitle: 'Begehbarer Holz-Aussichtsturm, Wander-Schutzhütte & Großer Feldberg-Panorama',
    description:
      'Die malerische Höhenlage oberhalb von Anspach mit direktem Blick auf den Großen Feldberg (879m): Erklimme den hölzernen Taunus-Aussichtsturm in der Kartenmitte oder verteidige die Schutzhütte am Wanderparkplatz.',
    district: 'Taunuskamm · Richtung Großer Feldberg',
    skyColor: 0x0F172A,
    fogColor: 0x1E293B,
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

      // Wooden Ramp / Staircase up to the Observation Tower (South side: Z = 12 to Z = 3.6)
      const steps = 14;
      for (let s = 0; s < steps; s++) {
        const t = (s + 0.5) / steps;
        const stepH = 5.4 * t;
        const stepZ = THREE.MathUtils.lerp(12.0, 3.6, t);
        const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(2.8, stepH, 0.68), timberMat);
        stepMesh.position.set(0, stepH / 2, stepZ);
        stepMesh.castShadow = true;
        towerGroup.add(stepMesh);
      }
      walkableSurfaces.push({
        minX: -1.5,
        maxX: 1.5,
        minZ: 3.6,
        maxZ: 12.2,
        yStart: 5.4,
        yEnd: 0,
        rampAxis: 'z',
      });

      scene.add(towerGroup);

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

      return { obstacles, walkableSurfaces, destructibles };
    },
  },
};
