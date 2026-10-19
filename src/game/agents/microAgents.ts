import * as THREE from 'three';
import { WeaponAttachments } from '../../types';

export type AgentRole = 'flanker' | 'sniper' | 'shocktrooper' | 'boss';

export interface WehrheimerAgent {
  id: string;
  role: AgentRole;
  name: string;
  faction: 'wehrheim';
  mesh: THREE.Group;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  health: number;
  maxHealth: number;
  speed: number;
  damage: number;
  range: number;
  attackCooldown: number;
  currentOrder: string;
  lastBark: string;
  lastBarkTime: number;
  ringMesh?: THREE.Mesh;
}

export interface AllyAgent {
  id: string;
  name: string;
  role: 'pionier' | 'ranger' | 'feuerwehr';
  faction: 'neu-anspach';
  mesh: THREE.Group;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  health: number;
  maxHealth: number;
  speed: number;
  damage: number;
  range: number;
  attackCooldown: number;
  lastBark: string;
  lastBarkTime: number;
  targetEnemyId?: string | null;
  ringMesh?: THREE.Mesh;
}

export interface AgentBullet {
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  damage: number;
  life: number;
  fromPlayer: boolean;
  fromAlly?: boolean;
  fromAllyId?: string;
  fromEnemyId?: string;
  color: string;
  splashRadius: number;
}

/**
 * Builds a detailed 3D weapon model held in the character's right hand, including visible 3D weapon attachments!
 */
export function create3DWeaponModel(
  weaponId: string = 'bembel',
  attachments: WeaponAttachments = { scope: 0, barrel: 0, bolt: 0, mag: 0, stock: 0 },
  papLevel: number = 0,
  rarityTier: number = 1
): THREE.Group {
  const gun = new THREE.Group();

  const papColorHex =
    papLevel >= 3
      ? 0xFACC15
      : papLevel === 2
      ? 0xE879F9
      : papLevel === 1
      ? 0x22D3EE
      : null;

  const gunMetal = new THREE.MeshStandardMaterial({
    color: papColorHex ? papColorHex : rarityTier >= 5 ? 0xD97706 : 0x1E293B,
    emissive: papColorHex ? papColorHex : 0x000000,
    emissiveIntensity: papLevel > 0 ? 0.35 + papLevel * 0.15 : 0,
    metalness: 0.85,
    roughness: 0.24,
  });
  const gunDark = new THREE.MeshStandardMaterial({
    color: 0x0F172A,
    metalness: 0.65,
    roughness: 0.4,
  });

  const accentColor =
    papColorHex ||
    (weaponId === 'bembel'
      ? 0x38BDF8
      : weaponId === 'zwille'
      ? 0x4ADE80
      : weaponId === 'spritzer'
      ? 0xFACC15
      : 0xFB923C);

  const accentMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    emissive: accentColor,
    emissiveIntensity: papLevel > 0 ? 1.2 : 0.45,
    metalness: 0.6,
    roughness: 0.25,
  });

  // Main Receiver & Stock
  const receiverLen = weaponId === 'zwille' ? 0.48 : weaponId === 'handkaes' ? 0.78 : 0.62;
  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, receiverLen), gunMetal);
  receiver.position.set(0, 0, 0.14);
  receiver.castShadow = true;
  gun.add(receiver);

  // Side energy/faction stripe
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.035, receiverLen * 0.75), accentMat);
  stripe.position.set(0, 0.02, 0.15);
  gun.add(stripe);

  // Buttstock (+ Raider Stock Attachment if unlocked!)
  const stockLevel = attachments.stock || 0;
  const stockLen = 0.26 + stockLevel * 0.04;
  const stock = new THREE.Mesh(
    new THREE.BoxGeometry(0.085, 0.13 + stockLevel * 0.015, stockLen),
    stockLevel >= 2 ? accentMat : gunDark
  );
  stock.position.set(0, -0.02, -0.22 - stockLevel * 0.02);
  gun.add(stock);

  // Pistol Grip
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 0.1), gunDark);
  grip.position.set(0, -0.13, 0.02);
  grip.rotation.x = -0.25;
  gun.add(grip);

  // Barrel (+ Barrel Attachment Extension if unlocked!)
  const baseBarrelLen = weaponId === 'zwille' ? 0.32 : weaponId === 'spritzer' ? 0.5 : 0.48;
  const extLen = attachments.barrel * 0.11;
  const barrelRadius = weaponId === 'handkaes' ? 0.075 : 0.028;

  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(barrelRadius, barrelRadius * 1.1, baseBarrelLen + extLen, 10),
    gunMetal
  );
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.02, 0.42 + extLen / 2);
  gun.add(barrel);

  // If Barrel Attachment > 0: Heavy Tactical Suppressor / Precision Muzzle Brake
  if (attachments.barrel > 0) {
    const suppressor = new THREE.Mesh(
      new THREE.CylinderGeometry(barrelRadius * 1.6, barrelRadius * 1.6, 0.22 + attachments.barrel * 0.04, 12),
      new THREE.MeshStandardMaterial({
        color: attachments.barrel >= 2 ? 0xF59E0B : 0x475569,
        metalness: 0.85,
        roughness: 0.2,
      })
    );
    suppressor.rotation.x = Math.PI / 2;
    suppressor.position.set(0, 0.02, 0.64 + extLen);
    gun.add(suppressor);
  }

  // Magazine (+ Drum Mag Attachment if unlocked!)
  if (attachments.mag > 0) {
    const drumMag = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12 + attachments.mag * 0.02, 0.12 + attachments.mag * 0.02, 0.13, 14),
      new THREE.MeshStandardMaterial({
        color: 0xF59E0B,
        metalness: 0.75,
        roughness: 0.25,
      })
    );
    drumMag.rotation.z = Math.PI / 2;
    drumMag.position.set(0, -0.13, 0.24);
    gun.add(drumMag);
  } else {
    const stdMag = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.22, 0.11), gunDark);
    stdMag.position.set(0, -0.14, 0.23);
    stdMag.rotation.x = 0.2;
    gun.add(stdMag);
  }

  // Scope Attachment on top rail!
  if (attachments.scope > 0) {
    const scopeBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.042, 0.042, 0.2 + attachments.scope * 0.04, 12),
      gunDark
    );
    scopeBody.rotation.x = Math.PI / 2;
    scopeBody.position.set(0, 0.115, 0.16);
    gun.add(scopeBody);

    const lens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.036, 0.036, 0.22 + attachments.scope * 0.04, 10),
      new THREE.MeshStandardMaterial({
        color: 0x38BDF8,
        emissive: 0x0EA5E9,
        emissiveIntensity: 1.8,
      })
    );
    lens.rotation.x = Math.PI / 2;
    lens.position.set(0, 0.115, 0.16);
    gun.add(lens);
  }

  // Bolt / Rapid-Fire Laser Module on side rail!
  if (attachments.bolt > 0) {
    const laserBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.045, 0.045, 0.15),
      new THREE.MeshStandardMaterial({
        color: 0x10B981,
        emissive: 0x10B981,
        emissiveIntensity: 1.5,
      })
    );
    laserBox.position.set(0.07, 0.02, 0.34);
    gun.add(laserBox);
  }

  return gun;
}

/**
 * Realistic human gait animation with hip swing, natural knee flexion on foot lift,
 * torso counter-rotation, subtle pelvis bobbing, and breathing idle posture.
 */
export function animateCharacterRig(
  group: THREE.Group,
  time: number,
  isMoving: boolean,
  recoilKick = 0,
  speedRatio = 1.0,
  crouchAmount = 0,
  isSprinting = false,
  pitch = 0
) {
  const leftLeg = group.getObjectByName('leftLeg');
  const rightLeg = group.getObjectByName('rightLeg');
  const leftKnee = group.getObjectByName('leftKnee');
  const rightKnee = group.getObjectByName('rightKnee');
  const leftArm = group.getObjectByName('leftArm');
  const rightArm = group.getObjectByName('rightArm');
  const leftElbow = group.getObjectByName('leftElbow');
  const torsoGroup = group.getObjectByName('torsoGroup');
  const headGroup = group.getObjectByName('headGroup');
  const pelvis = group.getObjectByName('pelvis');
  const belt = group.getObjectByName('belt');
  const playerRing = group.getObjectByName('playerRing');
  const weaponMount = group.getObjectByName('weaponMount');

  const hasWeapon = weaponMount && weaponMount.children.length > 0;
  const clampedRatio = Math.max(0.25, Math.min(1.65, speedRatio));
  const c = THREE.MathUtils.clamp(crouchAmount, 0, 1);
  const clampedPitch = THREE.MathUtils.clamp(pitch, -0.75, 0.75);

  // Vertical crouch drop (~0.29m lower hips/torso/head while boots stay planted at y=0)
  const dropY = 0.29 * c;
  const baseThighCrouch = -0.82 * c;
  const baseKneeCrouch = 1.64 * c;

  if (leftLeg) leftLeg.position.y = 0.92 - dropY;
  if (rightLeg) rightLeg.position.y = 0.92 - dropY;
  if (pelvis) pelvis.position.y = 0.94 - dropY;
  if (belt) belt.position.y = 1.01 - dropY;
  if (playerRing) playerRing.visible = false; // Hide weird floating green halo!

  if (isMoving) {
    // Natural human stride cadence (faster when sprinting, stealthier when crouched)
    const phase = time * (isSprinting ? 5.6 : 4.8) * clampedRatio;
    const strideAngle = (isSprinting ? 0.48 : 0.42) * clampedRatio * (1 - c * 0.42);

    // Hip swing + crouch knee/thigh flexion
    if (leftLeg) leftLeg.rotation.x = baseThighCrouch + Math.sin(phase) * strideAngle;
    if (rightLeg) rightLeg.rotation.x = baseThighCrouch + Math.sin(phase + Math.PI) * strideAngle;

    // Realistic knee flexion (knees bend deeper when crouched or sprinting)
    const kneeSwing = (isSprinting ? 0.78 : 0.62) * clampedRatio * (1 - c * 0.35);
    if (leftKnee) {
      leftKnee.rotation.x = baseKneeCrouch + Math.max(0, -Math.cos(phase) * kneeSwing);
    }
    if (rightKnee) {
      rightKnee.rotation.x = baseKneeCrouch + Math.max(0, -Math.cos(phase + Math.PI) * kneeSwing);
    }

    // Upper body subtle vertical bob & natural shoulder counter-rotation
    const sprintLean = isSprinting ? 0.16 : 0.045 * clampedRatio;
    const crouchLean = c * 0.18;
    if (torsoGroup) {
      torsoGroup.position.y = 0.94 - dropY + Math.abs(Math.cos(phase)) * 0.028 * clampedRatio * (1 - c * 0.4);
      torsoGroup.rotation.y = -Math.sin(phase) * (isSprinting ? 0.11 : 0.065) * clampedRatio;
      torsoGroup.rotation.x = sprintLean + crouchLean - clampedPitch * 0.35;
    }

    if (headGroup) {
      headGroup.position.y = 1.66 - dropY * 1.08 + Math.abs(Math.cos(phase)) * 0.02 * clampedRatio * (1 - c * 0.4);
      headGroup.rotation.y = Math.sin(phase) * 0.03;
      headGroup.rotation.x = -clampedPitch * 0.35;
    }

    if (hasWeapon) {
      // Tactical two-handed ready stance (or angled tactical sprint posture when sprinting)
      if (leftArm) {
        leftArm.rotation.x = (isSprinting ? -0.68 : -0.52) + Math.sin(phase + Math.PI) * (isSprinting ? 0.22 : 0.12) * clampedRatio - clampedPitch * 0.55;
        leftArm.rotation.z = isSprinting ? 0.34 : 0.22;
      }
      if (leftElbow) {
        leftElbow.rotation.x = isSprinting ? -0.72 : -0.58;
      }
      if (rightArm) {
        rightArm.rotation.x = (isSprinting ? -0.32 : -0.18) + Math.sin(phase) * (isSprinting ? 0.14 : 0.06) - recoilKick * 2.8 - clampedPitch * 0.65;
      }
    } else {
      // Natural human arm swing when walking/sprinting unarmed (Mobile Exploration Mode)
      if (leftArm) {
        leftArm.rotation.x = Math.sin(phase + Math.PI) * 0.34 * clampedRatio;
        leftArm.rotation.z = 0.06;
      }
      if (leftElbow) {
        leftElbow.rotation.x = -0.22 - Math.max(0, Math.sin(phase + Math.PI)) * 0.25;
      }
      if (rightArm) {
        rightArm.rotation.x = Math.sin(phase) * 0.34 * clampedRatio;
      }
    }
  } else {
    // Natural human breathing & standing / crouched idle posture
    const breath = Math.sin(time * 1.9);
    if (leftLeg) leftLeg.rotation.x = THREE.MathUtils.lerp(leftLeg.rotation.x, baseThighCrouch, 0.2);
    if (rightLeg) rightLeg.rotation.x = THREE.MathUtils.lerp(rightLeg.rotation.x, baseThighCrouch, 0.2);
    if (leftKnee) leftKnee.rotation.x = THREE.MathUtils.lerp(leftKnee.rotation.x, 0.03 + baseKneeCrouch, 0.2);
    if (rightKnee) rightKnee.rotation.x = THREE.MathUtils.lerp(rightKnee.rotation.x, 0.03 + baseKneeCrouch, 0.2);

    if (torsoGroup) {
      torsoGroup.position.y = 0.94 - dropY + breath * 0.008;
      torsoGroup.rotation.y = breath * 0.015;
      torsoGroup.rotation.x = c * 0.16 - clampedPitch * 0.35;
    }

    if (headGroup) {
      headGroup.position.y = 1.66 - dropY * 1.08 + breath * 0.008;
      headGroup.rotation.y = Math.sin(time * 0.8) * 0.04;
      headGroup.rotation.x = -clampedPitch * 0.35;
    }

    if (hasWeapon) {
      if (leftArm) {
        leftArm.rotation.x = -0.48 - c * 0.08 + breath * 0.02 - clampedPitch * 0.55;
        leftArm.rotation.z = 0.22;
      }
      if (leftElbow) leftElbow.rotation.x = -0.55;
      if (rightArm) {
        rightArm.rotation.x = -0.15 - c * 0.06 + breath * 0.015 - recoilKick * 2.8 - clampedPitch * 0.65;
      }
    } else {
      if (leftArm) {
        leftArm.rotation.x = breath * 0.02;
        leftArm.rotation.z = 0.05;
      }
      if (leftElbow) leftElbow.rotation.x = -0.15;
      if (rightArm) {
        rightArm.rotation.x = -breath * 0.02;
      }
    }
  }
}

// Create billboard canvas for floating name/role indicator in 3D
export function createCharacterBillboard(name: string, roleSubtitle: string, isAlly: boolean): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 256, 64);

  ctx.fillStyle = isAlly ? 'rgba(6, 78, 59, 0.85)' : 'rgba(127, 29, 29, 0.85)';
  ctx.strokeStyle = isAlly ? '#34D399' : '#F87171';
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.roundRect(8, 6, 240, 52, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(name, 128, 28);

  ctx.fillStyle = isAlly ? '#6EE7B7' : '#FCA5A5';
  ctx.font = 'bold 13px monospace';
  ctx.fillText(isAlly ? `✓ KOLLEGE · ${roleSubtitle}` : `✕ FEIND · ${roleSubtitle}`, 128, 48);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(2.9, 0.72, 1);
  return sprite;
}

/**
 * Builds a realistic, anatomically proportioned 3D human character with multi-jointed limbs
 * (hips, thighs, knees, calves, ankles/boots, torso, shoulders, elbows, forearms, hands, neck, head & facial features).
 */
export function createArticulatedHumanoid(options: {
  jacketColor: number;
  vestColor: number;
  pantsColor: number;
  helmetColor: number;
  skinColor?: number;
  hairColor?: number;
  weaponId?: string;
  attachments?: WeaponAttachments;
  hasVisor?: boolean;
  isUnarmed?: boolean;
}): { group: THREE.Group; weaponMount: THREE.Group } {
  const {
    jacketColor,
    vestColor,
    pantsColor,
    helmetColor,
    skinColor = 0xE8B48A,
    hairColor = 0x271C15,
    weaponId = 'bembel',
    attachments,
    hasVisor = false,
    isUnarmed = false,
  } = options;

  const group = new THREE.Group();

  const jacketMat = new THREE.MeshStandardMaterial({ color: jacketColor, roughness: 0.65, metalness: 0.05 });
  const vestMat = new THREE.MeshStandardMaterial({ color: vestColor, roughness: 0.52, metalness: 0.18 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.78, metalness: 0.04 });
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x1C1917, roughness: 0.72, metalness: 0.1 });
  const soleMat = new THREE.MeshStandardMaterial({ color: 0x09090B, roughness: 0.9 });
  const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.52, metalness: 0.02 });
  const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.85 });
  const helmetMat = new THREE.MeshStandardMaterial({ color: helmetColor, roughness: 0.45, metalness: 0.22 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0xF8FAFC, roughness: 0.7 });

  // 1. Multi-jointed Human Legs (Hip -> Rounded Thigh -> Knee Joint -> Rounded Calf -> Boot)
  const createHumanLeg = (name: string, kneeName: string, xOffset: number) => {
    const hipGroup = new THREE.Group();
    hipGroup.name = name;
    hipGroup.position.set(xOffset, 0.92, 0);

    // Hip joint sphere
    const hipBall = new THREE.Mesh(new THREE.SphereGeometry(0.135, 10, 10), pantsMat);
    hipGroup.add(hipBall);

    // Upper Leg (Thigh - tapered cylinder for natural human leg shape)
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.112, 0.44, 12), pantsMat);
    thigh.position.y = -0.22;
    thigh.castShadow = true;
    thigh.receiveShadow = true;
    hipGroup.add(thigh);

    // Knee Joint Group (pivots at y = -0.44)
    const kneeGroup = new THREE.Group();
    kneeGroup.name = kneeName;
    kneeGroup.position.set(0, -0.44, 0);

    const kneeCap = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), pantsMat);
    kneeGroup.add(kneeCap);

    // Lower Leg (Calf - tapered cylinder)
    const calf = new THREE.Mesh(new THREE.CylinderGeometry(0.108, 0.086, 0.42, 12), pantsMat);
    calf.position.y = -0.21;
    calf.castShadow = true;
    calf.receiveShadow = true;
    kneeGroup.add(calf);

    // Realistic Boot / Sneaker
    const ankle = new THREE.Mesh(new THREE.CylinderGeometry(0.092, 0.098, 0.12, 10), bootMat);
    ankle.position.set(0, -0.4, 0);
    kneeGroup.add(ankle);

    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.1, 0.31), bootMat);
    foot.position.set(0, -0.44, 0.055);
    foot.castShadow = true;
    kneeGroup.add(foot);

    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.035, 0.32), soleMat);
    sole.position.set(0, -0.49, 0.055);
    kneeGroup.add(sole);

    hipGroup.add(kneeGroup);
    return hipGroup;
  };

  group.add(createHumanLeg('leftLeg', 'leftKnee', -0.155));
  group.add(createHumanLeg('rightLeg', 'rightKnee', 0.155));

  // 2. Pelvis / Belt Waist
  const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.18, 14), pantsMat);
  pelvis.name = 'pelvis';
  pelvis.position.y = 0.94;
  pelvis.castShadow = true;
  group.add(pelvis);

  const belt = new THREE.Mesh(
    new THREE.CylinderGeometry(0.246, 0.246, 0.055, 14),
    new THREE.MeshStandardMaterial({ color: 0x18181B, roughness: 0.4, metalness: 0.4 })
  );
  belt.name = 'belt';
  belt.position.y = 1.01;
  group.add(belt);

  // 3. Anatomical Upper Torso Group (Chest, Collar, Jacket, Shoulders, Arms)
  const torsoGroup = new THREE.Group();
  torsoGroup.name = 'torsoGroup';
  torsoGroup.position.set(0, 0.94, 0);

  // Tapered human chest (wider at shoulders, narrower at waist)
  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.285, 0.235, 0.62, 14), jacketMat);
  chest.position.y = 0.36;
  chest.scale.set(1.12, 1, 0.78);
  chest.castShadow = true;
  chest.receiveShadow = true;
  torsoGroup.add(chest);

  // Inner shirt collar V-neck
  const shirtNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 10), shirtMat);
  shirtNeck.position.set(0, 0.66, 0.04);
  torsoGroup.add(shirtNeck);

  // Subtle jacket vest / outdoor gilet
  const gilet = new THREE.Mesh(new THREE.CylinderGeometry(0.295, 0.248, 0.5, 14), vestMat);
  gilet.position.y = 0.35;
  gilet.scale.set(1.1, 1, 0.8);
  gilet.castShadow = true;
  torsoGroup.add(gilet);

  // Daypack / Rucksack (sleek human proportion)
  const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.46, 0.18), vestMat);
  backpack.position.set(0, 0.38, -0.26);
  backpack.castShadow = true;
  torsoGroup.add(backpack);

  // Rounded Shoulder Caps
  [-0.34, 0.34].forEach((sx) => {
    const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.115, 10, 10), jacketMat);
    shoulder.position.set(sx, 0.6, 0);
    torsoGroup.add(shoulder);
  });

  // Left Arm (Shoulder -> Upper Arm -> Elbow -> Forearm -> Hand)
  const leftArm = new THREE.Group();
  leftArm.name = 'leftArm';
  leftArm.position.set(-0.35, 0.6, 0);

  const lUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.082, 0.32, 10), jacketMat);
  lUpperArm.position.y = -0.16;
  lUpperArm.castShadow = true;
  leftArm.add(lUpperArm);

  const leftElbow = new THREE.Group();
  leftElbow.name = 'leftElbow';
  leftElbow.position.set(0, -0.32, 0);

  const lElbowBall = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), jacketMat);
  leftElbow.add(lElbowBall);

  const lForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.068, 0.28, 10), jacketMat);
  lForearm.position.y = -0.14;
  lForearm.castShadow = true;
  leftElbow.add(lForearm);

  const lHand = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 10), skinMat);
  lHand.position.set(0, -0.3, 0.02);
  leftElbow.add(lHand);

  leftArm.add(leftElbow);
  torsoGroup.add(leftArm);

  // Right Arm (Shoulder -> Upper Arm -> Elbow -> Forearm -> Hand + Weapon Mount)
  const rightArm = new THREE.Group();
  rightArm.name = 'rightArm';
  rightArm.position.set(0.35, 0.6, 0);

  const rUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.082, 0.32, 10), jacketMat);
  rUpperArm.position.y = -0.16;
  rUpperArm.castShadow = true;
  rightArm.add(rUpperArm);

  const rightElbow = new THREE.Group();
  rightElbow.name = 'rightElbow';
  rightElbow.position.set(0, -0.32, 0);
  rightElbow.rotation.x = isUnarmed ? -0.18 : -Math.PI / 2.6;

  const rElbowBall = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), jacketMat);
  rightElbow.add(rElbowBall);

  const rForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.068, 0.28, 10), jacketMat);
  rForearm.position.y = -0.14;
  rForearm.castShadow = true;
  rightElbow.add(rForearm);

  const rHand = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 10), skinMat);
  rHand.position.set(0, -0.3, 0.02);
  rightElbow.add(rHand);

  const weaponMount = new THREE.Group();
  weaponMount.name = 'weaponMount';
  weaponMount.position.set(-0.04, -0.32, 0.06);
  weaponMount.rotation.x = Math.PI / 2.6;
  if (!isUnarmed) {
    weaponMount.add(create3DWeaponModel(weaponId, attachments));
  }
  rightElbow.add(weaponMount);

  rightArm.add(rightElbow);
  torsoGroup.add(rightArm);

  group.add(torsoGroup);

  // 4. Anatomical Neck & Realistic Human Head Group (Face, Eyes, Nose, Ears, Hair/Cap)
  const headGroup = new THREE.Group();
  headGroup.name = 'headGroup';
  headGroup.position.set(0, 1.66, 0);

  // Neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.11, 0.16, 10), skinMat);
  neck.position.y = 0.04;
  headGroup.add(neck);

  // Human Head (slightly oval cranium + jawline)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.215, 16, 16), skinMat);
  head.position.y = 0.24;
  head.scale.set(0.94, 1.08, 0.98);
  head.castShadow = true;
  headGroup.add(head);

  // Human Ears
  [-0.2, 0.2].forEach((ex) => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), skinMat);
    ear.position.set(ex, 0.23, 0);
    ear.scale.set(0.5, 1.1, 0.8);
    headGroup.add(ear);
  });

  // Human Nose
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.09, 8), skinMat);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, 0.23, 0.22);
  headGroup.add(nose);

  // Eyes (Sclera + Dark Iris/Pupils + Eyebrows)
  const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x1E293B });
  [-0.075, 0.075].forEach((ex) => {
    const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), eyeWhiteMat);
    eyeWhite.position.set(ex, 0.265, 0.185);
    eyeWhite.scale.set(1.1, 0.85, 0.6);
    headGroup.add(eyeWhite);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), pupilMat);
    pupil.position.set(ex, 0.265, 0.202);
    headGroup.add(pupil);

    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.014, 0.02), hairMat);
    brow.position.set(ex, 0.302, 0.195);
    headGroup.add(brow);
  });

  // Mouth / Natural Expression
  const mouth = new THREE.Mesh(
    new THREE.BoxGeometry(0.068, 0.012, 0.015),
    new THREE.MeshBasicMaterial({ color: 0x9A3412 })
  );
  mouth.position.set(0, 0.165, 0.195);
  headGroup.add(mouth);

  // Hair & Cap / Helmet
  const hairBack = new THREE.Mesh(new THREE.SphereGeometry(0.222, 14, 14), hairMat);
  hairBack.position.set(0, 0.26, -0.02);
  hairBack.scale.set(0.95, 1.02, 0.96);
  headGroup.add(hairBack);

  const capCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.215, 0.225, 0.14, 14), helmetMat);
  capCrown.position.set(0, 0.38, 0);
  capCrown.castShadow = true;
  headGroup.add(capCrown);

  // Cap visor brim facing forward (+Z)
  const capBrim = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.025, 0.16), helmetMat);
  capBrim.position.set(0, 0.33, 0.16);
  capBrim.rotation.x = 0.12;
  headGroup.add(capBrim);

  if (hasVisor) {
    const visor = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.075, 0.08),
      new THREE.MeshStandardMaterial({
        color: 0x0EA5E9,
        emissive: 0x0284C7,
        emissiveIntensity: 0.35,
        roughness: 0.15,
        metalness: 0.85,
      })
    );
    visor.position.set(0, 0.265, 0.19);
    headGroup.add(visor);
  }

  group.add(headGroup);

  return { group, weaponMount };
}

export function createWehrheimerMesh(role: AgentRole): THREE.Group {
  const weaponId =
    role === 'sniper'
      ? 'bembel'
      : role === 'shocktrooper'
      ? 'spritzer'
      : role === 'boss'
      ? 'handkaes'
      : 'zwille';

  const jacketColor =
    role === 'shocktrooper'
      ? 0xB91C1C
      : role === 'sniper'
      ? 0x0369A1
      : role === 'boss'
      ? 0x92400E
      : 0x15803D;

  const { group } = createArticulatedHumanoid({
    jacketColor,
    vestColor: 0x1E293B,
    pantsColor: 0x334155,
    helmetColor: role === 'shocktrooper' ? 0x7F1D1D : 0x451A03,
    skinColor: 0xE2A77F,
    weaponId,
    attachments:
      role === 'sniper'
        ? { scope: 2, barrel: 2, bolt: 0, mag: 0 }
        : role === 'boss'
        ? { scope: 2, barrel: 2, bolt: 2, mag: 2 }
        : { scope: 0, barrel: 0, bolt: 0, mag: 0 },
    hasVisor: role === 'sniper',
  });

  if (role === 'boss') {
    // Detailed 200-PS Taunus-Traktor Chassis around Boss Traktor-Horst!
    const tractorMat = new THREE.MeshStandardMaterial({ color: 0x15803D, roughness: 0.35, metalness: 0.5 });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181B, roughness: 0.9 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xEF4444, roughness: 0.4 });

    const hood = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.95, 2.3), tractorMat);
    hood.position.set(0, 0.75, 0.35);
    hood.castShadow = true;
    group.add(hood);

    const exhaust = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 1.4, 8),
      new THREE.MeshStandardMaterial({ color: 0x27272A, metalness: 0.8 })
    );
    exhaust.position.set(0.55, 1.6, 0.9);
    group.add(exhaust);

    // Big rear tractor wheels + front steerable wheels
    [-0.9, 0.9].forEach((wx) => {
      const rearTire = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.42, 14), tireMat);
      rearTire.rotation.z = Math.PI / 2;
      rearTire.position.set(wx, 0.75, -0.45);
      group.add(rearTire);

      const rearRim = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.44, 10), rimMat);
      rearRim.rotation.z = Math.PI / 2;
      rearRim.position.set(wx, 0.75, -0.45);
      group.add(rearRim);

      const frontTire = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.3, 12), tireMat);
      frontTire.rotation.z = Math.PI / 2;
      frontTire.position.set(wx * 0.88, 0.48, 1.15);
      group.add(frontTire);
    });

    group.scale.set(1.22, 1.22, 1.22);
  }

  // RED target ring and indicator over Wehrheimer enemy
  const ringGeo = new THREE.RingGeometry(0.36, 0.5, 16);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xEF4444, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 2.28;
  group.add(ring);

  // Add 3D billboard title badge
  const roleTitle = role === 'boss' ? 'BOSS HORST' : role.toUpperCase();
  const billboard = createCharacterBillboard('Wehrheimer', roleTitle, false);
  billboard.position.y = 2.85;
  group.add(billboard);

  return group;
}

// Create Ally Mesh for Neu-Anspach Bot Teammate ("Kollege")
export function createAllyMesh(name: string, role: string, isUnarmed = false): THREE.Group {
  const { group } = createArticulatedHumanoid({
    jacketColor: role === 'feuerwehr' ? 0xDC2626 : role === 'ranger' ? 0x15803D : 0x1D4ED8,
    vestColor: 0x1E293B,
    pantsColor: 0x1E293B,
    helmetColor: role === 'feuerwehr' ? 0xFACC15 : 0x0F172A,
    skinColor: role === 'ranger' ? 0xF1C29B : 0xE8B48A,
    weaponId: role === 'ranger' ? 'zwille' : 'bembel',
    attachments: { scope: 1, barrel: 1, bolt: 0, mag: 0 },
    hasVisor: false,
    isUnarmed,
  });

  // GREEN ring indicating ALLY / KOLLEGE
  const ringGeo = new THREE.RingGeometry(0.36, 0.5, 16);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x10B981, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 2.28;
  group.add(ring);

  // Add 3D billboard title badge
  const billboard = createCharacterBillboard(name, isUnarmed ? 'BÜRGER · 61267' : role.toUpperCase(), true);
  billboard.position.y = 2.85;
  group.add(billboard);

  return group;
}

export const HESSIAN_BARKS = {
  flanker: [
    'Ei gude! Wir packe de Hessepark von hinne!',
    'Horch emol, Neu-Anspach gibt klein bei!',
    'Flankiert die Bembel-Schleuder!',
  ],
  sniper: [
    'Saurer Apfel im Anflug!',
    'Treffer versenkt, ihr Anspacher!',
    'Aus Wehrheim mit Liebe un Äppler!',
  ],
  shocktrooper: [
    'Lochmühle stürmt voran!',
    'Für das Apfeldorf Wehrheim!',
    'Rumpelstilzchen greift an!',
  ],
  boss: [
    'HORST IST DA MIT DEM 200-PS-TRECKER!',
    'Erbarmen zu spät, jetzt wird geackert!',
    'Ganz Neu-Anspach wird Wehrheimer Streuobstwiese!',
  ],
};

export const ALLY_BARKS = [
  'Halt durch Kollege, ich geb dir Rückendeckung!',
  'Bembel ist durchgeladen! Für 61267 Neu-Anspach!',
  'Da drüben ist ein Wehrheimer Schütze, feuer frei!',
  'Wir sichern das Dach und halten die Stellung!',
  'Sauber getroffen Kollege! Weiter so!',
];
