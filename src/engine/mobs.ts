import * as THREE from 'three';
import { VoxelWorld, WORLD_SIZE_X, WORLD_SIZE_Z } from './world';
import { BlockType } from '../types/game';
import { sound } from './audio';

export type MobType = 'sheep' | 'pig';

export class Mob {
  public group: THREE.Group;
  public type: MobType;
  public position: THREE.Vector3;
  public velocity: THREE.Vector3;
  private legs: THREE.Mesh[] = [];
  private head: THREE.Group;
  private walkTime = 0;
  private wanderTimer = 0;
  private wanderDir = new THREE.Vector3();
  private isWalking = false;
  private soundTimer = 0;

  constructor(type: MobType, startPos: THREE.Vector3) {
    this.type = type;
    this.position = startPos.clone();
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.group = new THREE.Group();
    this.group.position.copy(this.position);
    this.head = new THREE.Group();

    if (type === 'sheep') {
      this.buildSheep();
    } else {
      this.buildPig();
    }

    this.soundTimer = 5 + Math.random() * 15;
  }

  private buildSheep() {
    const woolMat = new THREE.MeshStandardMaterial({
      color: 0xf5f5f5,
      roughness: 0.95,
    });
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xdfcfbe,
      roughness: 0.8,
    });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x222222 });

    // 1. Wool Torso
    const torsoGeo = new THREE.BoxGeometry(0.85, 0.75, 1.25);
    const torso = new THREE.Mesh(torsoGeo, woolMat);
    torso.position.set(0, 0.85, 0);
    torso.castShadow = true;
    this.group.add(torso);

    // 2. Head Group (allows tilting)
    this.head.position.set(0, 1.05, 0.65);

    const headGeo = new THREE.BoxGeometry(0.48, 0.48, 0.52);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.position.set(0, 0, 0);
    headMesh.castShadow = true;
    this.head.add(headMesh);

    // Wool cap on top of head
    const capGeo = new THREE.BoxGeometry(0.5, 0.22, 0.54);
    const cap = new THREE.Mesh(capGeo, woolMat);
    cap.position.set(0, 0.16, -0.02);
    this.head.add(cap);

    // Eyes
    const eyeGeo = new THREE.BoxGeometry(0.06, 0.06, 0.02);
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.25, 0.05, 0.27);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.25, 0.05, 0.27);
    this.head.add(eyeL);
    this.head.add(eyeR);

    this.group.add(this.head);

    // 3. 4 Legs
    const legGeo = new THREE.BoxGeometry(0.22, 0.65, 0.22);
    // Pivot at top of leg
    legGeo.translate(0, -0.325, 0);

    const legPositions = [
      [-0.26, 0.65, 0.4],
      [0.26, 0.65, 0.4],
      [-0.26, 0.65, -0.4],
      [0.26, 0.65, -0.4],
    ];

    legPositions.forEach((pos) => {
      const leg = new THREE.Mesh(legGeo, skinMat);
      leg.position.set(pos[0], pos[1], pos[2]);
      leg.castShadow = true;
      this.group.add(leg);
      this.legs.push(leg);
    });
  }

  private buildPig() {
    const pinkMat = new THREE.MeshStandardMaterial({
      color: 0xf39c9b,
      roughness: 0.75,
    });
    const darkPinkMat = new THREE.MeshStandardMaterial({
      color: 0xd97574,
      roughness: 0.75,
    });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x222222 });

    // 1. Pig Body
    const bodyGeo = new THREE.BoxGeometry(0.85, 0.7, 1.2);
    const body = new THREE.Mesh(bodyGeo, pinkMat);
    body.position.set(0, 0.75, 0);
    body.castShadow = true;
    this.group.add(body);

    // 2. Pig Head
    this.head.position.set(0, 0.9, 0.65);
    const headGeo = new THREE.BoxGeometry(0.55, 0.55, 0.55);
    const headMesh = new THREE.Mesh(headGeo, pinkMat);
    this.head.add(headMesh);

    // Snout
    const snoutGeo = new THREE.BoxGeometry(0.28, 0.18, 0.12);
    const snout = new THREE.Mesh(snoutGeo, darkPinkMat);
    snout.position.set(0, -0.06, 0.32);
    this.head.add(snout);

    // Eyes
    const eyeGeo = new THREE.BoxGeometry(0.06, 0.06, 0.02);
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.28, 0.08, 0.28);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.28, 0.08, 0.28);
    this.head.add(eyeL);
    this.head.add(eyeR);

    this.group.add(this.head);

    // 3. Legs
    const legGeo = new THREE.BoxGeometry(0.22, 0.5, 0.22);
    legGeo.translate(0, -0.25, 0);

    const legPositions = [
      [-0.26, 0.5, 0.38],
      [0.26, 0.5, 0.38],
      [-0.26, 0.5, -0.38],
      [0.26, 0.5, -0.38],
    ];

    legPositions.forEach((pos) => {
      const leg = new THREE.Mesh(legGeo, pinkMat);
      leg.position.set(pos[0], pos[1], pos[2]);
      leg.castShadow = true;
      this.group.add(leg);
      this.legs.push(leg);
    });
  }

  public update(dt: number, world: VoxelWorld) {
    // Wander AI
    this.wanderTimer -= dt;
    if (this.wanderTimer <= 0) {
      this.wanderTimer = 2.0 + Math.random() * 4.0;
      this.isWalking = Math.random() > 0.4;
      if (this.isWalking) {
        const ang = Math.random() * Math.PI * 2;
        this.wanderDir.set(Math.sin(ang), 0, Math.cos(ang));
        this.group.rotation.y = ang;
      } else {
        this.wanderDir.set(0, 0, 0);
      }
    }

    // Cute mob sound intervals
    this.soundTimer -= dt;
    if (this.soundTimer <= 0) {
      this.soundTimer = 15 + Math.random() * 20;
      sound.playMobSound(this.type === 'sheep' ? 1.1 : 0.8);
    }

    // Walking speed
    const speed = 1.6;
    if (this.isWalking) {
      this.velocity.x = this.wanderDir.x * speed;
      this.velocity.z = this.wanderDir.z * speed;
      this.walkTime += dt * 6.0;
    } else {
      this.velocity.x = 0;
      this.velocity.z = 0;
    }

    // Gravity
    this.velocity.y -= 25.0 * dt;

    // Movement & simple stepping collision
    const nextX = this.position.x + this.velocity.x * dt;
    const nextZ = this.position.z + this.velocity.z * dt;
    let nextY = this.position.y + this.velocity.y * dt;

    // Step check in front
    const blockFront = world.getBlock(
      Math.floor(nextX + this.wanderDir.x * 0.4),
      Math.floor(this.position.y),
      Math.floor(nextZ + this.wanderDir.z * 0.4)
    );
    const blockFrontAbove = world.getBlock(
      Math.floor(nextX + this.wanderDir.x * 0.4),
      Math.floor(this.position.y + 1),
      Math.floor(nextZ + this.wanderDir.z * 0.4)
    );

    // Auto-step 1 block
    if (blockFront !== BlockType.AIR && blockFront !== BlockType.WATER && blockFrontAbove === BlockType.AIR) {
      this.velocity.y = 5.0;
    }

    // Check ground block
    const groundY = Math.floor(this.position.y);
    const blockBelow = world.getBlock(Math.floor(this.position.x), groundY, Math.floor(this.position.z));
    if (blockBelow !== BlockType.AIR && blockBelow !== BlockType.WATER && nextY < groundY + 1) {
      nextY = groundY + 1;
      this.velocity.y = 0;
    }

    // Prevent wandering off world bounds
    if (nextX > 2 && nextX < WORLD_SIZE_X - 2) this.position.x = nextX;
    if (nextZ > 2 && nextZ < WORLD_SIZE_Z - 2) this.position.z = nextZ;
    this.position.y = Math.max(1, nextY);

    this.group.position.copy(this.position);

    // Leg swing animation
    const legSwing = Math.sin(this.walkTime) * 0.45;
    if (this.legs.length === 4) {
      this.legs[0].rotation.x = legSwing;
      this.legs[1].rotation.x = -legSwing;
      this.legs[2].rotation.x = -legSwing;
      this.legs[3].rotation.x = legSwing;
    }

    // Head subtle bob
    this.head.rotation.x = Math.sin(this.walkTime * 0.5) * 0.1;
  }
}

export class MobManager {
  public group: THREE.Group;
  public mobs: Mob[] = [];

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'MobManager';
  }

  public spawnInitialMobs(world: VoxelWorld) {
    const cx = Math.floor(WORLD_SIZE_X / 2);
    const cz = Math.floor(WORLD_SIZE_Z / 2);

    // Spawn 4 sheep and 4 pigs around the center area
    for (let i = 0; i < 8; i++) {
      const type: MobType = i % 2 === 0 ? 'sheep' : 'pig';
      const ox = cx + (Math.random() - 0.5) * 28;
      const oz = cz + (Math.random() - 0.5) * 28;
      const mx = Math.floor(ox);
      const mz = Math.floor(oz);

      // Find surface ground
      let foundY = -1;
      for (let y = 30; y >= 6; y--) {
        const b = world.getBlock(mx, y, mz);
        if (b === BlockType.GRASS || b === BlockType.SAND) {
          foundY = y + 1;
          break;
        }
      }

      if (foundY > 0) {
        const mob = new Mob(type, new THREE.Vector3(mx + 0.5, foundY, mz + 0.5));
        this.mobs.push(mob);
        this.group.add(mob.group);
      }
    }
  }

  public update(dt: number, world: VoxelWorld) {
    for (const mob of this.mobs) {
      mob.update(dt, world);
    }
  }
}
