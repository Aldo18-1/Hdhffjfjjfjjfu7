import * as THREE from 'three';
import { BlockType } from '../types/game';

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  rotationSpeed: THREE.Vector3;
}

export class ParticleSystem {
  public group: THREE.Group;
  private particles: Particle[] = [];
  private unitMiniBox: THREE.BoxGeometry;

  constructor() {
    this.group = new THREE.Group();
    this.unitMiniBox = new THREE.BoxGeometry(0.12, 0.12, 0.12);
  }

  // Get average color of block for particles
  private getBlockColor(type: BlockType): number {
    switch (type) {
      case BlockType.GRASS: return 0x5b8e32;
      case BlockType.DIRT: return 0x866043;
      case BlockType.STONE: return 0x7b7b7b;
      case BlockType.COBBLESTONE: return 0x6e6e6e;
      case BlockType.WOOD_LOG: return 0x5c3e20;
      case BlockType.WOOD_PLANKS: return 0xb38656;
      case BlockType.LEAVES: return 0x3e7a2b;
      case BlockType.SAND: return 0xe3d494;
      case BlockType.WATER: return 0x468cff;
      case BlockType.GLASS: return 0xd7f0ff;
      case BlockType.BRICK: return 0x9c4132;
      case BlockType.BEDROCK: return 0x222222;
      case BlockType.COAL_ORE: return 0x333333;
      case BlockType.IRON_ORE: return 0xd8af93;
      case BlockType.GOLD_ORE: return 0xfcee4b;
      case BlockType.DIAMOND_ORE: return 0x4dedf4;
      case BlockType.TNT: return 0xc72828;
      case BlockType.GLOWSTONE: return 0xf2ba42;
      default: return 0x888888;
    }
  }

  public spawnBlockBreakParticles(x: number, y: number, z: number, type: BlockType, count = 16) {
    const col = this.getBlockColor(type);
    const mat = new THREE.MeshBasicMaterial({ color: col });

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.unitMiniBox, mat);
      const px = x + 0.5 + (Math.random() - 0.5) * 0.6;
      const py = y + 0.5 + (Math.random() - 0.5) * 0.6;
      const pz = z + 0.5 + (Math.random() - 0.5) * 0.6;
      mesh.position.set(px, py, pz);

      const speed = 2.0 + Math.random() * 3.5;
      const angle = Math.random() * Math.PI * 2;
      const up = 1.5 + Math.random() * 3.0;
      const vx = Math.cos(angle) * speed;
      const vz = Math.sin(angle) * speed;

      const p: Particle = {
        mesh,
        velocity: new THREE.Vector3(vx, up, vz),
        life: 0.5 + Math.random() * 0.4,
        maxLife: 0.8,
        rotationSpeed: new THREE.Vector3(
          Math.random() * 10 - 5,
          Math.random() * 10 - 5,
          Math.random() * 10 - 5
        ),
      };

      this.group.add(mesh);
      this.particles.push(p);
    }
  }

  public spawnExplosionParticles(x: number, y: number, z: number) {
    // Fire & smoke fragments
    const colors = [0xff4500, 0xffa500, 0x555555, 0x888888, 0xffffff];
    for (let i = 0; i < 48; i++) {
      const c = colors[Math.floor(Math.random() * colors.length)];
      const mat = new THREE.MeshBasicMaterial({ color: c });
      const mesh = new THREE.Mesh(this.unitMiniBox, mat);
      mesh.position.set(x + (Math.random() - 0.5) * 0.5, y + 0.5, z + (Math.random() - 0.5) * 0.5);

      const speed = 4.0 + Math.random() * 8.0;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.2) * Math.PI;

      const p: Particle = {
        mesh,
        velocity: new THREE.Vector3(
          Math.cos(theta) * Math.cos(phi) * speed,
          Math.sin(phi) * speed + 3.0,
          Math.sin(theta) * Math.cos(phi) * speed
        ),
        life: 0.6 + Math.random() * 0.6,
        maxLife: 1.2,
        rotationSpeed: new THREE.Vector3(
          Math.random() * 15 - 7.5,
          Math.random() * 15 - 7.5,
          Math.random() * 15 - 7.5
        ),
      };

      this.group.add(mesh);
      this.particles.push(p);
    }
  }

  public update(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;

      if (p.life <= 0) {
        this.group.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }

      // Physics
      p.velocity.y -= 18.0 * dt; // Gravity
      p.mesh.position.addScaledVector(p.velocity, dt);

      // Rotation
      p.mesh.rotation.x += p.rotationSpeed.x * dt;
      p.mesh.rotation.y += p.rotationSpeed.y * dt;
      p.mesh.rotation.z += p.rotationSpeed.z * dt;

      // Scale fade out
      const scale = Math.max(0.01, p.life / p.maxLife);
      p.mesh.scale.set(scale, scale, scale);
    }
  }
}
