import * as THREE from 'three';
import { WalkableSurface } from '../../types';

export interface DestructibleProp {
  id: string;
  mesh: THREE.Group;
  box: THREE.Box3;
  position: THREE.Vector3;
  hp: number;
  maxHp: number;
  kind: 'crate' | 'barrel' | 'market_stall' | 'tech_case';
  lootBias?: 'attachment' | 'shield' | 'mixed';
}

const textureCache: Record<string, THREE.CanvasTexture> = {};

function getCachedTexture(
  key: string,
  width: number,
  height: number,
  repeatX: number,
  repeatY: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
): THREE.CanvasTexture {
  const cacheKey = `${key}_${repeatX}_${repeatY}`;
  if (textureCache[cacheKey]) {
    return textureCache[cacheKey];
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  draw(ctx, width, height);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = 8;
  tex.needsUpdate = true;

  textureCache[cacheKey] = tex;
  return tex;
}

export function createCobblestoneTexture(repeatX = 18, repeatY = 18): THREE.CanvasTexture {
  return getCachedTexture('cobble', 512, 512, repeatX, repeatY, (ctx, w, h) => {
    ctx.fillStyle = '#3B3F46';
    ctx.fillRect(0, 0, w, h);

    const rows = 8;
    const cols = 8;
    const cellW = w / cols;
    const cellH = h / rows;

    for (let r = 0; r < rows; r++) {
      const offset = (r % 2) * (cellW * 0.5);
      for (let c = -1; c <= cols; c++) {
        const x = c * cellW + offset + 3;
        const y = r * cellH + 3;
        const cw = cellW - 6;
        const ch = cellH - 6;

        const shade = 78 + ((r * 17 + c * 31) % 36);
        const warm = (r + c) % 3 === 0 ? 8 : 0;
        ctx.fillStyle = `rgb(${shade + warm}, ${shade + 2}, ${shade - 4})`;
        ctx.beginPath();
        ctx.roundRect(x, y, cw, ch, 8);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  });
}

export function createAsphaltTexture(repeatX = 12, repeatY = 12): THREE.CanvasTexture {
  return getCachedTexture('asphalt', 512, 512, repeatX, repeatY, (ctx, w, h) => {
    ctx.fillStyle = '#252830';
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 3500; i++) {
      const x = (i * 73) % w;
      const y = (i * 139) % h;
      const v = 30 + (i % 32);
      ctx.fillStyle = `rgb(${v},${v + 2},${v + 5})`;
      ctx.fillRect(x, y, 2, 2);
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.5);
    ctx.lineTo(w, h * 0.5);
    ctx.stroke();
  });
}

export function createGrassGroundTexture(repeatX = 20, repeatY = 20): THREE.CanvasTexture {
  return getCachedTexture('grass', 512, 512, repeatX, repeatY, (ctx, w, h) => {
    ctx.fillStyle = '#2B4C28';
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 4000; i++) {
      const x = (i * 97) % w;
      const y = (i * 181) % h;
      const g = 65 + (i % 40);
      const r = 34 + (i % 20);
      ctx.fillStyle = `rgb(${r}, ${g}, 32)`;
      ctx.fillRect(x, y, 3, 4);
    }
  });
}

export function createFachwerkTexture(repeatX = 2, repeatY = 1): THREE.CanvasTexture {
  return getCachedTexture('fachwerk', 512, 512, repeatX, repeatY, (ctx, w, h) => {
    // Warm Hessian plaster background
    ctx.fillStyle = '#F3EDE0';
    ctx.fillRect(0, 0, w, h);

    // Subtle plaster grain
    for (let i = 0; i < 1200; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(210,195,170,0.25)' : 'rgba(255,255,255,0.25)';
      ctx.fillRect((i * 53) % w, (i * 113) % h, 3, 3);
    }

    const beamColor = '#3A2214';
    ctx.fillStyle = beamColor;

    // Horizontal beams
    ctx.fillRect(0, 0, w, 24);
    ctx.fillRect(0, h * 0.48, w, 20);
    ctx.fillRect(0, h - 24, w, 24);

    // Vertical posts
    for (let x = 0; x <= w; x += 128) {
      ctx.fillRect(x - 10, 0, 20, h);
    }

    // Diagonal struts (Streben)
    ctx.strokeStyle = beamColor;
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.moveTo(10, h - 20);
    ctx.lineTo(118, h * 0.5);
    ctx.moveTo(118, h * 0.5);
    ctx.lineTo(10, 20);

    ctx.moveTo(w - 10, h - 20);
    ctx.lineTo(w - 118, h * 0.5);
    ctx.moveTo(w - 118, h * 0.5);
    ctx.lineTo(w - 10, 20);
    ctx.stroke();

    // Traditional Sprossenfenster (Windows)
    const drawWindow = (wx: number, wy: number) => {
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(wx, wy, 68, 76);
      ctx.fillStyle = '#38BDF8';
      ctx.globalAlpha = 0.35;
      ctx.fillRect(wx + 4, wy + 4, 60, 68);
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = '#F8FAFC';
      ctx.lineWidth = 4;
      ctx.strokeRect(wx + 2, wy + 2, 64, 72);
      ctx.beginPath();
      ctx.moveTo(wx + 34, wy + 2);
      ctx.lineTo(wx + 34, wy + 74);
      ctx.moveTo(wx + 2, wy + 38);
      ctx.lineTo(wx + 66, wy + 38);
      ctx.stroke();
    };

    drawWindow(158, 76);
    drawWindow(286, 76);
    drawWindow(158, 300);
    drawWindow(286, 300);
  });
}

export function createModernFacadeTexture(repeatX = 2, repeatY = 1, accentHex = '#0284C7'): THREE.CanvasTexture {
  return getCachedTexture(`facade_${accentHex}`, 512, 512, repeatX, repeatY, (ctx, w, h) => {
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(0, 0, w, h);

    // Architectural concrete panels
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 3;
    for (let x = 0; x <= w; x += 128) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Accent fascia band
    ctx.fillStyle = accentHex;
    ctx.fillRect(0, 0, w, 38);
    ctx.fillRect(0, h * 0.5 - 12, w, 24);

    // Modern Ribbon Windows
    for (let row = 0; row < 2; row++) {
      const wy = row === 0 ? 74 : 300;
      for (let col = 0; col < 4; col++) {
        const wx = 22 + col * 124;
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(wx, wy, 84, 110);
        const grad = ctx.createLinearGradient(wx, wy, wx + 84, wy + 110);
        grad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
        grad.addColorStop(1, 'rgba(15, 23, 42, 0.85)');
        ctx.fillStyle = grad;
        ctx.fillRect(wx + 4, wy + 4, 76, 102);
      }
    }
  });
}

export function createRoofTileTexture(repeatX = 4, repeatY = 3): THREE.CanvasTexture {
  return getCachedTexture('rooftiles', 256, 256, repeatX, repeatY, (ctx, w, h) => {
    ctx.fillStyle = '#8C2D19';
    ctx.fillRect(0, 0, w, h);

    const rows = 8;
    const cols = 8;
    const cw = w / cols;
    const ch = h / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const shade = (r + c) % 2 === 0 ? '#9E3620' : '#7C2614';
        ctx.fillStyle = shade;
        ctx.fillRect(c * cw + 1, r * ch + 1, cw - 2, ch - 3);
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.fillRect(c * cw, (r + 1) * ch - 3, cw, 3);
      }
    }
  });
}

export function createPoolTileTexture(repeatX = 8, repeatY = 8): THREE.CanvasTexture {
  return getCachedTexture('pooltiles', 256, 256, repeatX, repeatY, (ctx, w, h) => {
    ctx.fillStyle = '#0284C7';
    ctx.fillRect(0, 0, w, h);

    const step = 32;
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        ctx.fillStyle = (x / step + y / step) % 2 === 0 ? '#0EA5E9' : '#0369A1';
        ctx.fillRect(x + 2, y + 2, step - 4, step - 4);
      }
    }
  });
}

export function createWoodPlankTexture(repeatX = 2, repeatY = 2): THREE.CanvasTexture {
  return getCachedTexture('woodplank', 256, 256, repeatX, repeatY, (ctx, w, h) => {
    ctx.fillStyle = '#78472A';
    ctx.fillRect(0, 0, w, h);

    for (let y = 0; y < h; y += 32) {
      ctx.fillStyle = (y / 32) % 2 === 0 ? '#854D2E' : '#6D3E23';
      ctx.fillRect(0, y, w, 30);
      ctx.fillStyle = '#3E2211';
      ctx.fillRect(0, y + 30, w, 2);
    }
  });
}

/**
 * Creates a realistic 3D car / SUV / Police / Fire vehicle with wheels, windows, headlights, and collision box.
 */
export function create3DVehicle(
  x: number,
  z: number,
  rotationY: number,
  colorHex: number,
  variant: 'sedan' | 'suv' | 'bus' | 'firetruck' = 'sedan'
): { mesh: THREE.Group; box: THREE.Box3; roofSurface?: WalkableSurface } {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotationY;

  const paintMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness: 0.25,
    metalness: 0.65,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x0F172A,
    roughness: 0.1,
    metalness: 0.9,
  });
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x18181B,
    roughness: 0.85,
  });
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xD4D4D8,
    roughness: 0.3,
    metalness: 0.8,
  });

  if (variant === 'bus' || variant === 'firetruck') {
    const length = variant === 'bus' ? 11.5 : 9.2;
    const width = 2.7;
    const height = 3.1;

    const hull = new THREE.Mesh(new THREE.BoxGeometry(width, height, length), paintMat);
    hull.position.y = height / 2 + 0.35;
    hull.castShadow = true;
    hull.receiveShadow = true;
    group.add(hull);

    // White stripe & windows
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.04, 0.45, length + 0.02),
      new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.4 })
    );
    stripe.position.y = 1.3;
    group.add(stripe);

    const winBand = new THREE.Mesh(new THREE.BoxGeometry(width + 0.05, 0.95, length - 0.8), glassMat);
    winBand.position.y = 2.35;
    group.add(winBand);

    if (variant === 'firetruck') {
      // Aluminum ladder on top + blue emergency beacons
      const ladder = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.25, length - 1.5),
        new THREE.MeshStandardMaterial({ color: 0xE2E8F0, metalness: 0.8, roughness: 0.25 })
      );
      ladder.position.y = height + 0.5;
      group.add(ladder);

      const beaconMat = new THREE.MeshStandardMaterial({
        color: 0x3B82F6,
        emissive: 0x2563EB,
        emissiveIntensity: 2.5,
      });
      const b1 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.28, 8), beaconMat);
      b1.position.set(-0.7, height + 0.5, length / 2 - 0.6);
      const b2 = b1.clone();
      b2.position.x = 0.7;
      group.add(b1, b2);
    }

    // 6 Heavy Wheels
    const wheelZ = [-length * 0.34, 0, length * 0.34];
    wheelZ.forEach((wz) => {
      [-width / 2 - 0.05, width / 2 + 0.05].forEach((wx) => {
        const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.32, 14), tireMat);
        tire.rotation.z = Math.PI / 2;
        tire.position.set(wx, 0.52, wz);
        group.add(tire);
      });
    });

    const halfX = Math.abs(Math.cos(rotationY)) * (width / 2) + Math.abs(Math.sin(rotationY)) * (length / 2);
    const halfZ = Math.abs(Math.sin(rotationY)) * (width / 2) + Math.abs(Math.cos(rotationY)) * (length / 2);
    const box = new THREE.Box3(
      new THREE.Vector3(x - halfX, 0, z - halfZ),
      new THREE.Vector3(x + halfX, height + 0.4, z + halfZ)
    );
    const roofSurface: WalkableSurface = {
      minX: x - halfX,
      maxX: x + halfX,
      minZ: z - halfZ,
      maxZ: z + halfZ,
      yStart: height + 0.4,
      yEnd: height + 0.4,
      rampAxis: 'none',
    };
    return { mesh: group, box, roofSurface };
  }

  // Sedan or SUV
  const width = 2.15;
  const length = variant === 'suv' ? 4.8 : 4.5;
  const lowerH = variant === 'suv' ? 0.95 : 0.78;
  const cabinH = variant === 'suv' ? 0.85 : 0.72;
  const cabinLen = variant === 'suv' ? 3.1 : 2.35;

  const chassis = new THREE.Mesh(new THREE.BoxGeometry(width, lowerH, length), paintMat);
  chassis.position.y = lowerH / 2 + 0.32;
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  group.add(chassis);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(width - 0.22, cabinH, cabinLen), paintMat);
  cabin.position.set(0, lowerH + cabinH / 2 + 0.3, variant === 'suv' ? -0.25 : -0.15);
  cabin.castShadow = true;
  group.add(cabin);

  const windows = new THREE.Mesh(new THREE.BoxGeometry(width - 0.16, cabinH - 0.14, cabinLen - 0.25), glassMat);
  windows.position.copy(cabin.position);
  group.add(windows);

  // Headlights & Taillights
  const headMat = new THREE.MeshStandardMaterial({ color: 0xFEF08A, emissive: 0xFEF08A, emissiveIntensity: 1.8 });
  const tailMat = new THREE.MeshStandardMaterial({ color: 0xEF4444, emissive: 0xDC2626, emissiveIntensity: 1.5 });
  [-0.72, 0.72].forEach((lx) => {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.08), headMat);
    hl.position.set(lx, 0.78, length / 2 + 0.02);
    group.add(hl);

    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.18, 0.08), tailMat);
    tl.position.set(lx, 0.78, -length / 2 - 0.02);
    group.add(tl);
  });

  // 4 Wheels + Rims
  [-length * 0.32, length * 0.32].forEach((wz) => {
    [-width / 2 - 0.04, width / 2 + 0.04].forEach((wx) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.26, 12), tireMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, 0.38, wz);
      group.add(wheel);

      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.28, 8), rimMat);
      rim.rotation.z = Math.PI / 2;
      rim.position.set(wx, 0.38, wz);
      group.add(rim);
    });
  });

  const totalH = lowerH + cabinH + 0.3;
  const halfX = Math.abs(Math.cos(rotationY)) * (width / 2) + Math.abs(Math.sin(rotationY)) * (length / 2);
  const halfZ = Math.abs(Math.sin(rotationY)) * (width / 2) + Math.abs(Math.cos(rotationY)) * (length / 2);

  const box = new THREE.Box3(
    new THREE.Vector3(x - halfX, 0, z - halfZ),
    new THREE.Vector3(x + halfX, totalH, z + halfZ)
  );
  const roofSurface: WalkableSurface = {
    minX: x - halfX,
    maxX: x + halfX,
    minZ: z - halfZ,
    maxZ: z + halfZ,
    yStart: totalH,
    yEnd: totalH,
    rampAxis: 'none',
  };

  return { mesh: group, box, roofSurface };
}

/**
 * Creates an enterable building with open doorway, interior floor, walkable rooftop terrace, and exterior staircase ramp!
 */
export function createEnterableBuilding(options: {
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  style: 'fachwerk' | 'modern' | 'brick' | 'kiosk';
  accentColor?: string;
  hasRoofStairs?: 'north' | 'south' | 'east' | 'west';
  pitchedRoof?: boolean;
  label?: string;
}): {
  mesh: THREE.Group;
  obstacles: THREE.Box3[];
  walkableSurfaces: WalkableSurface[];
} {
  const {
    x,
    z,
    width,
    depth,
    height,
    style,
    accentColor = '#0284C7',
    hasRoofStairs,
    pitchedRoof = false,
  } = options;

  const group = new THREE.Group();
  const obstacles: THREE.Box3[] = [];
  const walkableSurfaces: WalkableSurface[] = [];

  const wallThickness = 0.55;
  const doorWidth = Math.min(5.2, width * 0.54);
  const sideWallWidth = (width - doorWidth) / 2;

  const wallTex =
    style === 'fachwerk'
      ? createFachwerkTexture(Math.max(1, Math.round(width / 6)), 1)
      : createModernFacadeTexture(Math.max(1, Math.round(width / 7)), 1, accentColor);

  const wallMat = new THREE.MeshStandardMaterial({
    map: wallTex,
    roughness: 0.72,
    metalness: 0.08,
  });

  const roofMat = new THREE.MeshStandardMaterial({
    map: pitchedRoof ? createRoofTileTexture(4, 3) : createAsphaltTexture(4, 4),
    roughness: 0.8,
  });

  // Interior floor
  const floorMesh = new THREE.Mesh(
    new THREE.BoxGeometry(width - 0.2, 0.12, depth - 0.2),
    new THREE.MeshStandardMaterial({ map: createWoodPlankTexture(4, 4), roughness: 0.65 })
  );
  floorMesh.position.set(x, 0.06, z);
  floorMesh.receiveShadow = true;
  group.add(floorMesh);

  // Entrance welcome threshold / ramp so doorway is clearly visible and easy to enter
  const entranceMat = new THREE.Mesh(
    new THREE.BoxGeometry(doorWidth - 0.2, 0.08, 1.4),
    new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.75 })
  );
  entranceMat.position.set(x, 0.04, z + depth / 2 + 0.35);
  entranceMat.receiveShadow = true;
  group.add(entranceMat);

  // Interior warm ceiling light
  const interiorLight = new THREE.PointLight(0xFDE68A, 1.2, Math.max(width, depth) * 1.4);
  interiorLight.position.set(x, height - 0.8, z);
  group.add(interiorLight);

  // Back wall (North: -Z)
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(width, height, wallThickness), wallMat);
  backWall.position.set(x, height / 2, z - depth / 2 + wallThickness / 2);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  group.add(backWall);
  obstacles.push(
    new THREE.Box3(
      new THREE.Vector3(x - width / 2, 0, z - depth / 2),
      new THREE.Vector3(x + width / 2, height, z - depth / 2 + wallThickness)
    )
  );

  // Left wall (West: -X)
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, height, depth), wallMat);
  leftWall.position.set(x - width / 2 + wallThickness / 2, height / 2, z);
  leftWall.castShadow = true;
  leftWall.receiveShadow = true;
  group.add(leftWall);
  obstacles.push(
    new THREE.Box3(
      new THREE.Vector3(x - width / 2, 0, z - depth / 2),
      new THREE.Vector3(x - width / 2 + wallThickness, height, z + depth / 2)
    )
  );

  // Right wall (East: +X)
  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, height, depth), wallMat);
  rightWall.position.set(x + width / 2 - wallThickness / 2, height / 2, z);
  rightWall.castShadow = true;
  rightWall.receiveShadow = true;
  group.add(rightWall);
  obstacles.push(
    new THREE.Box3(
      new THREE.Vector3(x + width / 2 - wallThickness, 0, z - depth / 2),
      new THREE.Vector3(x + width / 2, height, z + depth / 2)
    )
  );

  // Front wall (South: +Z) with wide open walk-in doorway!
  const frontLeft = new THREE.Mesh(new THREE.BoxGeometry(sideWallWidth, height, wallThickness), wallMat);
  frontLeft.position.set(x - width / 2 + sideWallWidth / 2, height / 2, z + depth / 2 - wallThickness / 2);
  frontLeft.castShadow = true;
  frontLeft.receiveShadow = true;
  group.add(frontLeft);
  obstacles.push(
    new THREE.Box3(
      new THREE.Vector3(x - width / 2, 0, z + depth / 2 - wallThickness),
      new THREE.Vector3(x - doorWidth / 2 - 0.15, height, z + depth / 2)
    )
  );

  const frontRight = new THREE.Mesh(new THREE.BoxGeometry(sideWallWidth, height, wallThickness), wallMat);
  frontRight.position.set(x + width / 2 - sideWallWidth / 2, height / 2, z + depth / 2 - wallThickness / 2);
  frontRight.castShadow = true;
  frontRight.receiveShadow = true;
  group.add(frontRight);
  obstacles.push(
    new THREE.Box3(
      new THREE.Vector3(x + doorWidth / 2 + 0.15, 0, z + depth / 2 - wallThickness),
      new THREE.Vector3(x + width / 2, height, z + depth / 2)
    )
  );

  // Door header beam above entrance
  const headerH = Math.max(0.75, height - 3.25);
  const doorHeader = new THREE.Mesh(new THREE.BoxGeometry(doorWidth, headerH, wallThickness), wallMat);
  doorHeader.position.set(x, height - headerH / 2, z + depth / 2 - wallThickness / 2);
  group.add(doorHeader);

  // Walkable flat roof slab
  const roofSlab = new THREE.Mesh(new THREE.BoxGeometry(width + 0.4, 0.45, depth + 0.4), roofMat);
  roofSlab.position.set(x, height + 0.2, z);
  roofSlab.castShadow = true;
  roofSlab.receiveShadow = true;
  group.add(roofSlab);

  const roofTopY = height + 0.42;
  walkableSurfaces.push({
    minX: x - width / 2 - 0.2,
    maxX: x + width / 2 + 0.2,
    minZ: z - depth / 2 - 0.2,
    maxZ: z + depth / 2 + 0.2,
    yStart: roofTopY,
    yEnd: roofTopY,
    rampAxis: 'none',
  });

  // Optional pitched gable roof on half or ornamental ridge if fachwerk
  if (pitchedRoof && !hasRoofStairs) {
    const gable = new THREE.Mesh(
      new THREE.ConeGeometry(Math.max(width, depth) * 0.65, 3.2, 4),
      new THREE.MeshStandardMaterial({ map: createRoofTileTexture(4, 3), roughness: 0.75 })
    );
    gable.rotation.y = Math.PI / 4;
    gable.position.set(x, roofTopY + 1.6, z);
    gable.castShadow = true;
    group.add(gable);
  } else {
    // Low tactical parapet walls on roof for cover when sniping from the roof!
    const parapetMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });
    const pNorth = new THREE.Mesh(new THREE.BoxGeometry(width + 0.4, 0.75, 0.25), parapetMat);
    pNorth.position.set(x, roofTopY + 0.37, z - depth / 2 - 0.05);
    group.add(pNorth);
  }

  // Exterior Staircase / Ramp leading onto the roof!
  if (hasRoofStairs) {
    const stairMat = new THREE.MeshStandardMaterial({
      map: createWoodPlankTexture(2, 6),
      roughness: 0.7,
    });
    const stairRun = height * 1.45;
    const stairWidth = 2.6;
    const steps = 12;

    if (hasRoofStairs === 'east' || hasRoofStairs === 'west') {
      const sideX = hasRoofStairs === 'east' ? x + width / 2 + stairWidth / 2 + 0.1 : x - width / 2 - stairWidth / 2 - 0.1;
      const zStart = z + depth / 2;
      const zEnd = z + depth / 2 - stairRun;

      for (let s = 0; s < steps; s++) {
        const t = (s + 0.5) / steps;
        const stepH = roofTopY * t;
        const stepZ = THREE.MathUtils.lerp(zStart, zEnd, t);
        const stepMesh = new THREE.Mesh(
          new THREE.BoxGeometry(stairWidth, stepH, stairRun / steps + 0.08),
          stairMat
        );
        stepMesh.position.set(sideX, stepH / 2, stepZ);
        stepMesh.castShadow = true;
        stepMesh.receiveShadow = true;
        group.add(stepMesh);
      }

      walkableSurfaces.push({
        minX: sideX - stairWidth / 2 - 0.2,
        maxX: sideX + stairWidth / 2 + 0.2,
        minZ: Math.min(zStart, zEnd) - 0.3,
        maxZ: Math.max(zStart, zEnd) + 0.3,
        yStart: roofTopY,
        yEnd: 0,
        rampAxis: 'z',
      });
    } else {
      // North or South ramp along X
      const sideZ = hasRoofStairs === 'north' ? z - depth / 2 - stairWidth / 2 - 0.1 : z + depth / 2 + stairWidth / 2 + 0.1;
      const xStart = x - width / 2;
      const xEnd = x - width / 2 + stairRun;

      for (let s = 0; s < steps; s++) {
        const t = (s + 0.5) / steps;
        const stepH = roofTopY * t;
        const stepX = THREE.MathUtils.lerp(xStart, xEnd, t);
        const stepMesh = new THREE.Mesh(
          new THREE.BoxGeometry(stairRun / steps + 0.08, stepH, stairWidth),
          stairMat
        );
        stepMesh.position.set(stepX, stepH / 2, sideZ);
        stepMesh.castShadow = true;
        stepMesh.receiveShadow = true;
        group.add(stepMesh);
      }

      walkableSurfaces.push({
        minX: Math.min(xStart, xEnd) - 0.3,
        maxX: Math.max(xStart, xEnd) + 0.3,
        minZ: sideZ - stairWidth / 2 - 0.2,
        maxZ: sideZ + stairWidth / 2 + 0.2,
        yStart: 0,
        yEnd: roofTopY,
        rampAxis: 'x',
      });
    }
  }

  return { mesh: group, obstacles, walkableSurfaces };
}

/**
 * Creates a destructible crate, Äppler barrel, or golden tech attachment chest on the map.
 */
export function createDestructibleProp(
  x: number,
  y: number,
  z: number,
  kind: 'crate' | 'barrel' | 'market_stall' | 'tech_case',
  lootBias: 'attachment' | 'shield' | 'mixed' = 'mixed'
): DestructibleProp {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  let radius = 0.85;
  let height = 1.4;
  let hp = 45;

  if (kind === 'crate') {
    const mat = new THREE.MeshStandardMaterial({
      map: createWoodPlankTexture(1, 1),
      roughness: 0.75,
    });
    const boxMesh = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.35, 1.35), mat);
    boxMesh.position.y = 0.68;
    boxMesh.castShadow = true;
    boxMesh.receiveShadow = true;
    group.add(boxMesh);

    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(1.42, 0.18, 1.42),
      new THREE.MeshStandardMaterial({ color: 0x3E2211, roughness: 0.8 })
    );
    frame.position.y = 0.68;
    group.add(frame);
  } else if (kind === 'barrel') {
    const barrelMat = new THREE.MeshStandardMaterial({
      color: 0x92400E,
      roughness: 0.65,
    });
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.64, 1.45, 12), barrelMat);
    cyl.position.y = 0.72;
    cyl.castShadow = true;
    group.add(cyl);

    const hoopMat = new THREE.MeshStandardMaterial({ color: 0x27272A, metalness: 0.8, roughness: 0.3 });
    [0.35, 1.1].forEach((hy) => {
      const hoop = new THREE.Mesh(new THREE.CylinderGeometry(0.63, 0.63, 0.09, 12), hoopMat);
      hoop.position.y = hy;
      group.add(hoop);
    });
  } else if (kind === 'tech_case') {
    // Golden Weapon Attachment Supply Crate!
    hp = 35;
    lootBias = 'attachment';
    const caseMat = new THREE.MeshStandardMaterial({
      color: 0x1E293B,
      metalness: 0.75,
      roughness: 0.25,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xF59E0B,
      emissive: 0xD97706,
      emissiveIntensity: 1.2,
      metalness: 0.85,
      roughness: 0.2,
    });

    const base = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.95, 1.1), caseMat);
    base.position.y = 0.48;
    base.castShadow = true;
    group.add(base);

    const lid = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.24, 1.16), goldMat);
    lid.position.y = 1.02;
    group.add(lid);

    const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), goldMat);
    beacon.position.y = 1.65;
    group.add(beacon);
  } else {
    // Market stall
    radius = 1.6;
    height = 2.4;
    hp = 70;
    const counter = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 1.1, 1.6),
      new THREE.MeshStandardMaterial({ map: createWoodPlankTexture(2, 1), roughness: 0.75 })
    );
    counter.position.y = 0.55;
    counter.castShadow = true;
    group.add(counter);

    const canopy = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, 0.22, 2.0),
      new THREE.MeshStandardMaterial({ color: 0xDC2626, roughness: 0.6 })
    );
    canopy.position.y = 2.35;
    canopy.rotation.x = 0.12;
    canopy.castShadow = true;
    group.add(canopy);
  }

  const box = new THREE.Box3(
    new THREE.Vector3(x - radius, y, z - radius),
    new THREE.Vector3(x + radius, y + height, z + radius)
  );

  return {
    id: `prop_${Math.random().toString(36).substring(2, 8)}`,
    mesh: group,
    box,
    position: new THREE.Vector3(x, y, z),
    hp,
    maxHp: hp,
    kind,
    lootBias,
  };
}
