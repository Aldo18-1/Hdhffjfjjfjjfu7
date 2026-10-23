import * as THREE from 'three';
import { BlockType } from '../types/game';
import { textureAtlas } from './textures';

// Simple fast 2D / 3D Perlin-like noise generator
class FastNoise {
  private p: number[] = [];

  constructor(seed = 1337) {
    const permutation: number[] = [];
    for (let i = 0; i < 256; i++) permutation[i] = i;

    // Seeded shuffle
    let s = seed % 2147483647;
    for (let i = 255; i > 0; i--) {
      s = (s * 16807) % 2147483647;
      const j = Math.floor(((s - 1) / 2147483646) * (i + 1));
      const tmp = permutation[i];
      permutation[i] = permutation[j];
      permutation[j] = tmp;
    }

    this.p = new Array(512);
    for (let i = 0; i < 512; i++) {
      this.p[i] = permutation[i & 255];
    }
  }

  private fade(t: number) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number) {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number) {
    const h = hash & 7;
    const u = h < 4 ? x : y;
    const v = h < 4 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  public noise2D(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const u = this.fade(xf);
    const v = this.fade(yf);

    const A = this.p[X] + Y;
    const B = this.p[X + 1] + Y;

    return this.lerp(
      v,
      this.lerp(u, this.grad(this.p[A], xf, yf), this.grad(this.p[B], xf - 1, yf)),
      this.lerp(u, this.grad(this.p[A + 1], xf, yf - 1), this.grad(this.p[B + 1], xf - 1, yf - 1))
    );
  }

  public fbm2D(x: number, y: number, octaves = 4, persistence = 0.5): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;
    for (let i = 0; i < octaves; i++) {
      total += this.noise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }
    return total / maxValue;
  }
}

export const WORLD_SIZE_X = 64;
export const WORLD_SIZE_Z = 64;
export const WORLD_HEIGHT = 36;
export const SEA_LEVEL = 10;

export class VoxelWorld {
  private blocks: Uint8Array;
  private noise: FastNoise;
  private oreNoise: FastNoise;
  public group: THREE.Group;
  private instancedMeshes: Map<BlockType, THREE.InstancedMesh> = new Map();
  private dirty = true;
  private unitBoxGeometry: THREE.BoxGeometry;
  public seed: number;

  constructor(seed = Math.floor(Math.random() * 100000)) {
    this.seed = seed;
    this.blocks = new Uint8Array(WORLD_SIZE_X * WORLD_HEIGHT * WORLD_SIZE_Z);
    this.noise = new FastNoise(seed);
    this.oreNoise = new FastNoise(seed + 4242);
    this.group = new THREE.Group();
    this.group.name = 'VoxelWorld';
    this.unitBoxGeometry = new THREE.BoxGeometry(1, 1, 1);

    this.generateTerrain();
    this.rebuildAllMeshes();
  }

  public getIndex(x: number, y: number, z: number): number {
    if (x < 0 || x >= WORLD_SIZE_X || y < 0 || y >= WORLD_HEIGHT || z < 0 || z >= WORLD_SIZE_Z) {
      return -1;
    }
    return x + y * WORLD_SIZE_X + z * WORLD_SIZE_X * WORLD_HEIGHT;
  }

  public getBlock(x: number, y: number, z: number): BlockType {
    const idx = this.getIndex(x, y, z);
    if (idx < 0) return BlockType.AIR;
    return this.blocks[idx] as BlockType;
  }

  public setBlock(x: number, y: number, z: number, type: BlockType): boolean {
    const idx = this.getIndex(x, y, z);
    if (idx < 0) return false;
    this.blocks[idx] = type;
    this.dirty = true;
    return true;
  }

  public generateTerrain() {
    this.blocks.fill(BlockType.AIR);

    // 1. Heightmap & layers
    for (let x = 0; x < WORLD_SIZE_X; x++) {
      for (let z = 0; z < WORLD_SIZE_Z; z++) {
        // Multi-octave terrain
        const nx = x / 35;
        const nz = z / 35;
        const elev = this.noise.fbm2D(nx, nz, 4, 0.5); // -1 to 1 approx
        const h = Math.floor(SEA_LEVEL + 3 + elev * 11);
        const surfaceHeight = Math.min(Math.max(h, 4), WORLD_HEIGHT - 6);

        // Bedrock layer
        this.blocks[this.getIndex(x, 0, z)] = BlockType.BEDROCK;

        // Biome factors
        const moisture = this.noise.noise2D(x / 40 + 10, z / 40 + 10);
        const isDesert = moisture < -0.3;

        // Fill columns
        for (let y = 1; y <= surfaceHeight; y++) {
          const idx = this.getIndex(x, y, z);
          if (y === surfaceHeight) {
            if (surfaceHeight <= SEA_LEVEL + 1) {
              this.blocks[idx] = BlockType.SAND; // Beach
            } else if (isDesert) {
              this.blocks[idx] = BlockType.SAND;
            } else {
              this.blocks[idx] = BlockType.GRASS;
            }
          } else if (y >= surfaceHeight - 3) {
            this.blocks[idx] = isDesert ? BlockType.SAND : BlockType.DIRT;
          } else {
            // Stone with ores
            const oreVal = this.oreNoise.noise2D(x / 5 + y / 4, z / 5 + y / 4);
            if (y < 8 && oreVal > 0.65) {
              this.blocks[idx] = BlockType.DIAMOND_ORE;
            } else if (y < 14 && oreVal > 0.55) {
              this.blocks[idx] = BlockType.GOLD_ORE;
            } else if (y < 22 && oreVal > 0.42) {
              this.blocks[idx] = BlockType.IRON_ORE;
            } else if (oreVal > 0.35) {
              this.blocks[idx] = BlockType.COAL_ORE;
            } else {
              this.blocks[idx] = BlockType.STONE;
            }
          }
        }

        // Fill Water up to SEA_LEVEL
        if (surfaceHeight < SEA_LEVEL) {
          for (let y = surfaceHeight + 1; y <= SEA_LEVEL; y++) {
            this.blocks[this.getIndex(x, y, z)] = BlockType.WATER;
          }
        }
      }
    }

    // 2. Trees generation
    const treeNoise = new FastNoise(this.seed + 999);
    for (let x = 4; x < WORLD_SIZE_X - 4; x += 3) {
      for (let z = 4; z < WORLD_SIZE_Z - 4; z += 3) {
        const val = treeNoise.noise2D(x * 0.25, z * 0.25);
        if (val > 0.35) {
          // Find surface height
          let surfaceY = -1;
          for (let y = WORLD_HEIGHT - 6; y >= SEA_LEVEL + 1; y--) {
            if (this.getBlock(x, y, z) === BlockType.GRASS) {
              surfaceY = y;
              break;
            }
          }

          if (surfaceY > 0 && surfaceY + 8 < WORLD_HEIGHT) {
            this.growTree(x, surfaceY + 1, z);
          }
        }
      }
    }
  }

  private growTree(x: number, y: number, z: number) {
    const trunkHeight = 4 + Math.floor(Math.random() * 2);
    // Trunk
    for (let ty = 0; ty < trunkHeight; ty++) {
      this.setBlock(x, y + ty, z, BlockType.WOOD_LOG);
    }

    // Leaves canopy
    const leafStart = y + trunkHeight - 2;
    for (let ly = leafStart; ly <= y + trunkHeight + 1; ly++) {
      const radius = ly > y + trunkHeight ? 1 : 2;
      for (let lx = -radius; lx <= radius; lx++) {
        for (let lz = -radius; lz <= radius; lz++) {
          if (Math.abs(lx) === radius && Math.abs(lz) === radius && Math.random() > 0.6) continue;
          const curr = this.getBlock(x + lx, ly, z + lz);
          if (curr === BlockType.AIR) {
            this.setBlock(x + lx, ly, z + lz, BlockType.LEAVES);
          }
        }
      }
    }
  }

  // Check if a block has any transparent or exposed neighbors
  private isBlockExposed(x: number, y: number, z: number): boolean {
    const neighbors = [
      this.getBlock(x + 1, y, z),
      this.getBlock(x - 1, y, z),
      this.getBlock(x, y + 1, z),
      this.getBlock(x, y - 1, z),
      this.getBlock(x, y, z + 1),
      this.getBlock(x, y, z - 1),
    ];

    for (const nb of neighbors) {
      if (
        nb === BlockType.AIR ||
        nb === BlockType.WATER ||
        nb === BlockType.GLASS ||
        nb === BlockType.LEAVES
      ) {
        return true;
      }
    }
    return false;
  }

  public rebuildAllMeshes() {
    // Clear old meshes
    this.instancedMeshes.forEach((mesh) => {
      this.group.remove(mesh);
      mesh.dispose();
    });
    this.instancedMeshes.clear();

    // Collect visible block positions per block type
    const blockInstances: Map<BlockType, { x: number; y: number; z: number }[]> = new Map();

    for (let x = 0; x < WORLD_SIZE_X; x++) {
      for (let y = 0; y < WORLD_HEIGHT; y++) {
        for (let z = 0; z < WORLD_SIZE_Z; z++) {
          const type = this.getBlock(x, y, z);
          if (type === BlockType.AIR) continue;

          // Water is transparent so check if surface
          if (this.isBlockExposed(x, y, z)) {
            let list = blockInstances.get(type);
            if (!list) {
              list = [];
              blockInstances.set(type, list);
            }
            list.push({ x, y, z });
          }
        }
      }
    }

    const dummy = new THREE.Object3D();

    blockInstances.forEach((positions, type) => {
      const material = textureAtlas.getMaterial(type);
      const mesh = new THREE.InstancedMesh(this.unitBoxGeometry, material, positions.length);
      mesh.castShadow = type !== BlockType.WATER && type !== BlockType.GLASS;
      mesh.receiveShadow = true;
      mesh.name = `Block_${type}`;

      for (let i = 0; i < positions.length; i++) {
        const p = positions[i];
        dummy.position.set(p.x + 0.5, p.y + 0.5, p.z + 0.5);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }

      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
      this.group.add(mesh);
      this.instancedMeshes.set(type, mesh);
    });

    this.dirty = false;
  }

  public updateIfDirty() {
    if (this.dirty) {
      this.rebuildAllMeshes();
    }
  }

  // Get spawn point on solid ground
  public getSpawnPosition(): THREE.Vector3 {
    const cx = Math.floor(WORLD_SIZE_X / 2);
    const cz = Math.floor(WORLD_SIZE_Z / 2);
    for (let y = WORLD_HEIGHT - 1; y >= 1; y--) {
      const b = this.getBlock(cx, y, cz);
      if (b !== BlockType.AIR && b !== BlockType.WATER) {
        return new THREE.Vector3(cx + 0.5, y + 2.5, cz + 0.5);
      }
    }
    return new THREE.Vector3(cx + 0.5, 18, cz + 0.5);
  }

  // Fast raycast in voxel grid (Digital Differential Analyzer algorithm)
  public raycast(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    maxDistance = 6
  ): {
    hit: boolean;
    blockPos: [number, number, number];
    normal: [number, number, number];
    blockType: BlockType;
  } | null {
    let px = origin.x;
    let py = origin.y;
    let pz = origin.z;

    const dx = direction.x;
    const dy = direction.y;
    const dz = direction.z;

    let mapX = Math.floor(px);
    let mapY = Math.floor(py);
    let mapZ = Math.floor(pz);

    const stepX = dx > 0 ? 1 : -1;
    const stepY = dy > 0 ? 1 : -1;
    const stepZ = dz > 0 ? 1 : -1;

    const deltaDistX = Math.abs(1 / (dx || 0.00001));
    const deltaDistY = Math.abs(1 / (dy || 0.00001));
    const deltaDistZ = Math.abs(1 / (dz || 0.00001));

    let sideDistX = dx > 0 ? (mapX + 1.0 - px) * deltaDistX : (px - mapX) * deltaDistX;
    let sideDistY = dy > 0 ? (mapY + 1.0 - py) * deltaDistY : (py - mapY) * deltaDistY;
    let sideDistZ = dz > 0 ? (mapZ + 1.0 - pz) * deltaDistZ : (pz - mapZ) * deltaDistZ;

    let normalX = 0;
    let normalY = 0;
    let normalZ = 0;

    let dist = 0;

    while (dist < maxDistance) {
      if (sideDistX < sideDistY) {
        if (sideDistX < sideDistZ) {
          dist = sideDistX;
          sideDistX += deltaDistX;
          mapX += stepX;
          normalX = -stepX;
          normalY = 0;
          normalZ = 0;
        } else {
          dist = sideDistZ;
          sideDistZ += deltaDistZ;
          mapZ += stepZ;
          normalX = 0;
          normalY = 0;
          normalZ = -stepZ;
        }
      } else {
        if (sideDistY < sideDistZ) {
          dist = sideDistY;
          sideDistY += deltaDistY;
          mapY += stepY;
          normalX = 0;
          normalY = -stepY;
          normalZ = 0;
        } else {
          dist = sideDistZ;
          sideDistZ += deltaDistZ;
          mapZ += stepZ;
          normalX = 0;
          normalY = 0;
          normalZ = -stepZ;
        }
      }

      if (dist > maxDistance) break;

      const block = this.getBlock(mapX, mapY, mapZ);
      if (block !== BlockType.AIR && block !== BlockType.WATER) {
        return {
          hit: true,
          blockPos: [mapX, mapY, mapZ],
          normal: [normalX, normalY, normalZ],
          blockType: block,
        };
      }
    }

    return null;
  }
}
