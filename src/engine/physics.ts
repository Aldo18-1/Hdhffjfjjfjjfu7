import * as THREE from 'three';
import { BlockType } from '../types/game';
import { VoxelWorld, SEA_LEVEL } from './world';
import { sound } from './audio';

export interface PlayerPhysicsState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  onGround: boolean;
  isInWater: boolean;
  isHeadInWater: boolean;
  isFlying: boolean;
  isSprinting: boolean;
  health: number;
  hunger: number;
  oxygen: number;
}

export class PlayerPhysics {
  public position: THREE.Vector3;
  public velocity: THREE.Vector3;
  public onGround: boolean = false;
  public isInWater: boolean = false;
  public isHeadInWater: boolean = false;
  public isFlying: boolean = false;
  public isSprinting: boolean = false;

  // Stats
  public health: number = 20;
  public maxHealth: number = 20;
  public hunger: number = 20;
  public maxHunger: number = 20;
  public oxygen: number = 20;
  public maxOxygen: number = 20;

  // Collision box
  public readonly width = 0.6;
  public readonly height = 1.8;
  public readonly eyeHeight = 1.62;

  // Physics constants
  private readonly gravity = 28.0;
  private readonly jumpForce = 8.5;
  private readonly walkSpeed = 5.0;
  private readonly sprintMultiplier = 1.45;
  private readonly flySpeed = 12.0;

  // Step audio accumulator
  private stepDistance = 0;
  // Coyote time & jump buffer
  private coyoteTimer = 0;
  private jumpBuffer = 0;
  // Fall damage tracking
  private fallStartHeight = 0;
  private isFalling = false;

  constructor(spawnPos: THREE.Vector3) {
    this.position = spawnPos.clone();
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.fallStartHeight = this.position.y;
  }

  public update(
    dt: number,
    world: VoxelWorld,
    moveForward: number,
    moveRight: number,
    jumpRequested: boolean,
    crouch: boolean,
    yaw: number,
    creativeMode: boolean
  ) {
    // Clamp dt for simulation stability
    const clampedDt = Math.min(dt, 0.05);

    // Check water at feet and head
    const blockAtFeet = world.getBlock(
      Math.floor(this.position.x),
      Math.floor(this.position.y),
      Math.floor(this.position.z)
    );
    const blockAtHead = world.getBlock(
      Math.floor(this.position.x),
      Math.floor(this.position.y + this.eyeHeight),
      Math.floor(this.position.z)
    );

    const prevInWater = this.isInWater;
    this.isInWater = blockAtFeet === BlockType.WATER || this.position.y < SEA_LEVEL + 0.1;
    this.isHeadInWater = blockAtHead === BlockType.WATER || this.position.y + this.eyeHeight < SEA_LEVEL + 0.1;

    if (!prevInWater && this.isInWater) {
      sound.playSplash(0.5);
    }

    // Oxygen handling
    if (this.isHeadInWater && !creativeMode) {
      this.oxygen = Math.max(0, this.oxygen - clampedDt * 2.5);
      if (this.oxygen <= 0) {
        this.takeDamage(1.5 * clampedDt);
      }
    } else {
      this.oxygen = Math.min(this.maxOxygen, this.oxygen + clampedDt * 6);
    }

    // Coyote timer & jump buffering
    if (this.onGround) {
      this.coyoteTimer = 0.15;
    } else {
      this.coyoteTimer -= clampedDt;
    }

    if (jumpRequested) {
      this.jumpBuffer = 0.15;
    } else {
      this.jumpBuffer -= clampedDt;
    }

    // Movement direction vector from yaw
    const sinYaw = Math.sin(yaw);
    const cosYaw = Math.cos(yaw);

    const forwardDir = new THREE.Vector3(-sinYaw, 0, -cosYaw);
    const rightDir = new THREE.Vector3(cosYaw, 0, -sinYaw);

    const wishDir = new THREE.Vector3();
    wishDir.addScaledVector(forwardDir, moveForward);
    wishDir.addScaledVector(rightDir, moveRight);
    if (wishDir.lengthSq() > 0.001) {
      wishDir.normalize();
    }

    // Speed calculation
    let currentSpeed = this.walkSpeed;
    if (this.isFlying) {
      currentSpeed = this.flySpeed;
    } else if (this.isSprinting && this.hunger > 6) {
      currentSpeed *= this.sprintMultiplier;
    }
    if (this.isInWater) {
      currentSpeed *= 0.65;
    }

    // Apply horizontal acceleration
    if (this.isFlying) {
      // Free flight mode
      this.velocity.x = wishDir.x * currentSpeed;
      this.velocity.z = wishDir.z * currentSpeed;

      if (jumpRequested) {
        this.velocity.y = this.flySpeed * 0.8;
      } else if (crouch) {
        this.velocity.y = -this.flySpeed * 0.8;
      } else {
        this.velocity.y = 0;
      }
    } else {
      // Normal ground / air physics
      const accel = this.onGround ? 18.0 : 6.0;
      this.velocity.x += (wishDir.x * currentSpeed - this.velocity.x) * Math.min(accel * clampedDt, 1.0);
      this.velocity.z += (wishDir.z * currentSpeed - this.velocity.z) * Math.min(accel * clampedDt, 1.0);

      // Swimming or Gravity
      if (this.isInWater) {
        // Buoyancy and water jump
        this.velocity.y += (jumpRequested ? 4.0 : -3.0 - this.velocity.y) * 4.0 * clampedDt;
      } else {
        // Apply Gravity
        this.velocity.y -= this.gravity * clampedDt;

        // Jump execution
        if (this.jumpBuffer > 0 && this.coyoteTimer > 0) {
          this.velocity.y = this.jumpForce;
          this.jumpBuffer = 0;
          this.coyoteTimer = 0;
          this.onGround = false;
          sound.playJump();
        }
      }
    }

    // Track fall damage
    if (!this.onGround && !this.isInWater && !this.isFlying) {
      if (!this.isFalling) {
        this.isFalling = true;
        this.fallStartHeight = this.position.y;
      }
    }

    // Collision Resolution with AABB
    this.moveAndCollide(clampedDt, world);

    // Landing detection
    if (this.onGround && this.isFalling) {
      this.isFalling = false;
      const fallDistance = this.fallStartHeight - this.position.y;
      if (fallDistance > 3.5 && !creativeMode && !this.isInWater) {
        const dmg = Math.floor(fallDistance - 3);
        this.takeDamage(dmg);
      }
    }

    // Step sounds when walking on ground
    if (this.onGround && (Math.abs(this.velocity.x) > 0.5 || Math.abs(this.velocity.z) > 0.5)) {
      const horizontalSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
      this.stepDistance += horizontalSpeed * clampedDt;
      if (this.stepDistance > (this.isSprinting ? 2.0 : 2.4)) {
        this.stepDistance = 0;
        const groundBlock = world.getBlock(
          Math.floor(this.position.x),
          Math.floor(this.position.y - 0.2),
          Math.floor(this.position.z)
        );
        const cat = groundBlock === BlockType.STONE || groundBlock === BlockType.COBBLESTONE ? 'stone' :
                    groundBlock === BlockType.WOOD_PLANKS || groundBlock === BlockType.WOOD_LOG ? 'wood' :
                    groundBlock === BlockType.SAND ? 'sand' : 'grass';
        sound.playFootstep(cat);
      }
    }
  }

  public takeDamage(amount: number) {
    if (amount <= 0) return;
    this.health = Math.max(0, this.health - amount);
    sound.playDamage();
  }

  public heal(amount: number) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  private moveAndCollide(dt: number, world: VoxelWorld) {
    const halfW = this.width / 2;

    // 1. Move X
    this.position.x += this.velocity.x * dt;
    if (this.checkCollision(world)) {
      // Resolve X
      if (this.velocity.x > 0) {
        this.position.x = Math.floor(this.position.x + halfW) - halfW - 0.001;
      } else if (this.velocity.x < 0) {
        this.position.x = Math.floor(this.position.x - halfW) + 1.0 + halfW + 0.001;
      }
      this.velocity.x = 0;
    }

    // 2. Move Z
    this.position.z += this.velocity.z * dt;
    if (this.checkCollision(world)) {
      // Resolve Z
      if (this.velocity.z > 0) {
        this.position.z = Math.floor(this.position.z + halfW) - halfW - 0.001;
      } else if (this.velocity.z < 0) {
        this.position.z = Math.floor(this.position.z - halfW) + 1.0 + halfW + 0.001;
      }
      this.velocity.z = 0;
    }

    // 3. Move Y
    this.position.y += this.velocity.y * dt;
    this.onGround = false;
    if (this.checkCollision(world)) {
      if (this.velocity.y > 0) {
        // Head hit ceiling
        this.position.y = Math.floor(this.position.y + this.height) - this.height - 0.001;
        this.velocity.y = 0;
      } else if (this.velocity.y < 0) {
        // Landed on floor
        this.position.y = Math.floor(this.position.y) + 1.0;
        this.velocity.y = 0;
        this.onGround = true;
      }
    }
  }

  private checkCollision(world: VoxelWorld): boolean {
    const halfW = this.width / 2;
    const minX = Math.floor(this.position.x - halfW);
    const maxX = Math.floor(this.position.x + halfW);
    const minY = Math.floor(this.position.y);
    const maxY = Math.floor(this.position.y + this.height);
    const minZ = Math.floor(this.position.z - halfW);
    const maxZ = Math.floor(this.position.z + halfW);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          const block = world.getBlock(x, y, z);
          // Solid blocks collide
          if (block !== BlockType.AIR && block !== BlockType.WATER) {
            return true;
          }
        }
      }
    }
    return false;
  }
}
