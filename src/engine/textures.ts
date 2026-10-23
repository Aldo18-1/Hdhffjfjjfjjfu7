import * as THREE from 'three';
import { BlockType } from '../types/game';

// Helper to create a 16x16 canvas
function create16Canvas(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

// Pseudo-random seeded generator for consistent textures
function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export class TextureAtlas {
  private textures: Map<string, THREE.CanvasTexture> = new Map();
  private materials: Map<BlockType, THREE.Material | THREE.Material[]> = new Map();

  constructor() {
    this.generateAllTextures();
  }

  private wrapTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.generateMipmaps = false;
    return tex;
  }

  private generateAllTextures() {
    // 1. DIRT
    const [dirtCanvas, dirtCtx] = create16Canvas();
    const randDirt = seededRandom(101);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const val = randDirt();
        let col = '#866043';
        if (val < 0.25) col = '#775238';
        else if (val < 0.5) col = '#946c4d';
        else if (val < 0.75) col = '#694830';
        dirtCtx.fillStyle = col;
        dirtCtx.fillRect(x, y, 1, 1);
      }
    }
    const dirtTex = this.wrapTexture(dirtCanvas);
    this.textures.set('dirt', dirtTex);

    // 2. GRASS TOP
    const [grassTopCanvas, grassTopCtx] = create16Canvas();
    const randGrass = seededRandom(202);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const val = randGrass();
        let col = '#5b8e32';
        if (val < 0.25) col = '#4f7c2b';
        else if (val < 0.5) col = '#679e39';
        else if (val < 0.75) col = '#426824';
        grassTopCtx.fillStyle = col;
        grassTopCtx.fillRect(x, y, 1, 1);
      }
    }
    const grassTopTex = this.wrapTexture(grassTopCanvas);
    this.textures.set('grass_top', grassTopTex);

    // 3. GRASS SIDE
    const [grassSideCanvas, grassSideCtx] = create16Canvas();
    grassSideCtx.drawImage(dirtCanvas, 0, 0);
    for (let x = 0; x < 16; x++) {
      const drop = Math.floor(randGrass() * 3) + 2; // 2 to 4 px of grass
      for (let y = 0; y < drop; y++) {
        grassSideCtx.fillStyle = y === drop - 1 ? '#426824' : '#5b8e32';
        grassSideCtx.fillRect(x, y, 1, 1);
      }
    }
    const grassSideTex = this.wrapTexture(grassSideCanvas);
    this.textures.set('grass_side', grassSideTex);

    // 4. STONE
    const [stoneCanvas, stoneCtx] = create16Canvas();
    const randStone = seededRandom(303);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const val = randStone();
        let col = '#7b7b7b';
        if (val < 0.2) col = '#666666';
        else if (val < 0.4) col = '#8a8a8a';
        else if (val < 0.6) col = '#595959';
        stoneCtx.fillStyle = col;
        stoneCtx.fillRect(x, y, 1, 1);
      }
    }
    const stoneTex = this.wrapTexture(stoneCanvas);
    this.textures.set('stone', stoneTex);

    // 5. COBBLESTONE
    const [cobbleCanvas, cobbleCtx] = create16Canvas();
    const randCobble = seededRandom(404);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const isBorder = (x % 4 === 0 && randCobble() > 0.3) || (y % 4 === 0 && randCobble() > 0.3);
        if (isBorder) {
          cobbleCtx.fillStyle = '#404040';
        } else {
          const v = randCobble();
          cobbleCtx.fillStyle = v < 0.3 ? '#6e6e6e' : v < 0.7 ? '#858585' : '#575757';
        }
        cobbleCtx.fillRect(x, y, 1, 1);
      }
    }
    const cobbleTex = this.wrapTexture(cobbleCanvas);
    this.textures.set('cobblestone', cobbleTex);

    // 6. WOOD LOG SIDE
    const [logSideCanvas, logSideCtx] = create16Canvas();
    const randLog = seededRandom(505);
    for (let x = 0; x < 16; x++) {
      const colBase = (x % 4 === 0) ? '#4a3219' : (x % 4 === 1) ? '#6b4926' : (x % 4 === 2) ? '#5c3e20' : '#3d2914';
      for (let y = 0; y < 16; y++) {
        logSideCtx.fillStyle = randLog() > 0.7 ? '#402a14' : colBase;
        logSideCtx.fillRect(x, y, 1, 1);
      }
    }
    const logSideTex = this.wrapTexture(logSideCanvas);
    this.textures.set('log_side', logSideTex);

    // 7. WOOD LOG TOP
    const [logTopCanvas, logTopCtx] = create16Canvas();
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const dx = x - 7.5;
        const dy = y - 7.5;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 7) logTopCtx.fillStyle = '#4a3219';
        else if (dist > 5.5) logTopCtx.fillStyle = '#a6855b';
        else if (dist > 4) logTopCtx.fillStyle = '#8f6c44';
        else if (dist > 2) logTopCtx.fillStyle = '#a6855b';
        else logTopCtx.fillStyle = '#805f38';
        logTopCtx.fillRect(x, y, 1, 1);
      }
    }
    const logTopTex = this.wrapTexture(logTopCanvas);
    this.textures.set('log_top', logTopTex);

    // 8. WOOD PLANKS
    const [plankCanvas, plankCtx] = create16Canvas();
    const randPlank = seededRandom(606);
    for (let y = 0; y < 16; y++) {
      const isSeam = y % 4 === 3;
      for (let x = 0; x < 16; x++) {
        if (isSeam) {
          plankCtx.fillStyle = '#5c4028';
        } else {
          const v = randPlank();
          plankCtx.fillStyle = v < 0.3 ? '#9c734a' : v < 0.7 ? '#b38656' : '#8f6841';
        }
        plankCtx.fillRect(x, y, 1, 1);
      }
    }
    const plankTex = this.wrapTexture(plankCanvas);
    this.textures.set('planks', plankTex);

    // 9. LEAVES
    const [leavesCanvas, leavesCtx] = create16Canvas();
    const randLeaves = seededRandom(707);
    leavesCtx.fillStyle = '#2d5a1e';
    leavesCtx.fillRect(0, 0, 16, 16);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const v = randLeaves();
        if (v < 0.35) leavesCtx.fillStyle = '#3e7a2b';
        else if (v < 0.6) leavesCtx.fillStyle = '#4c9135';
        else if (v < 0.8) leavesCtx.fillStyle = '#224417';
        else leavesCtx.fillStyle = '#1c3813';
        leavesCtx.fillRect(x, y, 1, 1);
      }
    }
    const leavesTex = this.wrapTexture(leavesCanvas);
    this.textures.set('leaves', leavesTex);

    // 10. SAND
    const [sandCanvas, sandCtx] = create16Canvas();
    const randSand = seededRandom(808);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const v = randSand();
        sandCtx.fillStyle = v < 0.3 ? '#d6c585' : v < 0.7 ? '#e3d494' : '#c9b777';
        sandCtx.fillRect(x, y, 1, 1);
      }
    }
    const sandTex = this.wrapTexture(sandCanvas);
    this.textures.set('sand', sandTex);

    // 11. WATER
    const [waterCanvas, waterCtx] = create16Canvas();
    waterCtx.fillStyle = 'rgba(40, 110, 220, 0.75)';
    waterCtx.fillRect(0, 0, 16, 16);
    waterCtx.fillStyle = 'rgba(70, 140, 255, 0.4)';
    for (let i = 0; i < 6; i++) {
      waterCtx.fillRect(Math.floor(Math.random() * 12), Math.floor(Math.random() * 14), 4, 1);
    }
    const waterTex = this.wrapTexture(waterCanvas);
    this.textures.set('water', waterTex);

    // 12. GLASS
    const [glassCanvas, glassCtx] = create16Canvas();
    glassCtx.fillStyle = 'rgba(215, 240, 255, 0.25)';
    glassCtx.fillRect(0, 0, 16, 16);
    // Border
    glassCtx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    glassCtx.strokeRect(0.5, 0.5, 15, 15);
    // Diagonal shine streaks
    glassCtx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    glassCtx.fillRect(3, 3, 2, 2);
    glassCtx.fillRect(5, 5, 2, 2);
    glassCtx.fillRect(10, 10, 2, 2);
    const glassTex = this.wrapTexture(glassCanvas);
    this.textures.set('glass', glassTex);

    // 13. BRICK
    const [brickCanvas, brickCtx] = create16Canvas();
    brickCtx.fillStyle = '#b8b8b8'; // mortar
    brickCtx.fillRect(0, 0, 16, 16);
    for (let row = 0; row < 4; row++) {
      const y = row * 4;
      const offset = (row % 2) * 4;
      for (let col = -1; col < 3; col++) {
        const x = col * 8 + offset;
        brickCtx.fillStyle = '#9c4132';
        brickCtx.fillRect(x, y, 7, 3);
        brickCtx.fillStyle = '#853527';
        brickCtx.fillRect(x + 1, y + 1, 5, 2);
      }
    }
    const brickTex = this.wrapTexture(brickCanvas);
    this.textures.set('brick', brickTex);

    // 14. BEDROCK
    const [bedrockCanvas, bedrockCtx] = create16Canvas();
    const randBed = seededRandom(909);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const v = randBed();
        bedrockCtx.fillStyle = v < 0.4 ? '#181818' : v < 0.7 ? '#2a2a2a' : '#454545';
        bedrockCtx.fillRect(x, y, 1, 1);
      }
    }
    const bedrockTex = this.wrapTexture(bedrockCanvas);
    this.textures.set('bedrock', bedrockTex);

    // ORE MAKER HELPER
    const makeOre = (oreColor: string, oreDark: string, seed: number) => {
      const [canvas, ctx] = create16Canvas();
      ctx.drawImage(stoneCanvas, 0, 0);
      const rand = seededRandom(seed);
      // Place 4-6 ore fleck clusters
      for (let i = 0; i < 5; i++) {
        const ox = Math.floor(rand() * 12) + 2;
        const oy = Math.floor(rand() * 12) + 2;
        ctx.fillStyle = oreDark;
        ctx.fillRect(ox, oy, 2, 2);
        ctx.fillStyle = oreColor;
        ctx.fillRect(ox + (rand() > 0.5 ? 1 : 0), oy, 1, 1);
      }
      return this.wrapTexture(canvas);
    };

    this.textures.set('coal_ore', makeOre('#222222', '#111111', 1111));
    this.textures.set('iron_ore', makeOre('#d8af93', '#b8896c', 2222));
    this.textures.set('gold_ore', makeOre('#fcee4b', '#d1b828', 3333));
    this.textures.set('diamond_ore', makeOre('#4dedf4', '#2cb5bd', 4444));

    // 15. BOOKSHELF
    const [bookCanvas, bookCtx] = create16Canvas();
    bookCtx.drawImage(plankCanvas, 0, 0);
    // Shelf row 1
    const bookColors = ['#a32e2e', '#2e5aa3', '#2ea342', '#a38a2e', '#6d2ea3', '#9c5b2a'];
    for (let x = 1; x < 15; x += 2) {
      bookCtx.fillStyle = bookColors[x % bookColors.length];
      bookCtx.fillRect(x, 2, 2, 5);
      bookCtx.fillStyle = '#222';
      bookCtx.fillRect(x, 7, 2, 1);
    }
    // Shelf row 2
    for (let x = 1; x < 15; x += 2) {
      bookCtx.fillStyle = bookColors[(x + 3) % bookColors.length];
      bookCtx.fillRect(x, 9, 2, 5);
      bookCtx.fillStyle = '#222';
      bookCtx.fillRect(x, 14, 2, 1);
    }
    const bookTex = this.wrapTexture(bookCanvas);
    this.textures.set('bookshelf', bookTex);

    // 16. CRAFTING TABLE TOP & SIDE
    const [ctTopCanvas, ctTopCtx] = create16Canvas();
    ctTopCtx.drawImage(plankCanvas, 0, 0);
    ctTopCtx.strokeStyle = '#4a3219';
    ctTopCtx.lineWidth = 1;
    ctTopCtx.strokeRect(2.5, 2.5, 11, 11);
    ctTopCtx.strokeRect(6.5, 2.5, 3, 11);
    ctTopCtx.strokeRect(2.5, 6.5, 11, 3);
    this.textures.set('crafting_table_top', this.wrapTexture(ctTopCanvas));

    const [ctSideCanvas, ctSideCtx] = create16Canvas();
    ctSideCtx.drawImage(plankCanvas, 0, 0);
    ctSideCtx.fillStyle = '#5c4028';
    ctSideCtx.fillRect(2, 4, 12, 8);
    // Little saw/hammer icon
    ctSideCtx.fillStyle = '#a8a8a8';
    ctSideCtx.fillRect(5, 5, 2, 6);
    ctSideCtx.fillRect(4, 5, 4, 2);
    ctSideCtx.fillStyle = '#e0e0e0';
    ctSideCtx.fillRect(9, 7, 3, 3);
    this.textures.set('crafting_table_side', this.wrapTexture(ctSideCanvas));

    // 17. TNT TOP & SIDE
    const [tntSideCanvas, tntSideCtx] = create16Canvas();
    tntSideCtx.fillStyle = '#c72828';
    tntSideCtx.fillRect(0, 0, 16, 16);
    // white band
    tntSideCtx.fillStyle = '#ffffff';
    tntSideCtx.fillRect(0, 5, 16, 6);
    tntSideCtx.fillStyle = '#111111';
    tntSideCtx.font = 'bold 5px sans-serif';
    tntSideCtx.fillText('TNT', 2, 10);
    this.textures.set('tnt_side', this.wrapTexture(tntSideCanvas));

    const [tntTopCanvas, tntTopCtx] = create16Canvas();
    tntTopCtx.fillStyle = '#961e1e';
    tntTopCtx.fillRect(0, 0, 16, 16);
    tntTopCtx.fillStyle = '#222222';
    tntTopCtx.fillRect(7, 7, 2, 2);
    tntTopCtx.fillStyle = '#cccccc';
    tntTopCtx.fillRect(8, 5, 1, 2);
    this.textures.set('tnt_top', this.wrapTexture(tntTopCanvas));

    // 18. OBSIDIAN
    const [obsCanvas, obsCtx] = create16Canvas();
    const randObs = seededRandom(5555);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const v = randObs();
        obsCtx.fillStyle = v < 0.2 ? '#1a0e28' : v < 0.6 ? '#10081c' : v < 0.85 ? '#26123b' : '#391754';
        obsCtx.fillRect(x, y, 1, 1);
      }
    }
    this.textures.set('obsidian', this.wrapTexture(obsCanvas));

    // 19. GLOWSTONE
    const [glowCanvas, glowCtx] = create16Canvas();
    const randGlow = seededRandom(6666);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const v = randGlow();
        glowCtx.fillStyle = v < 0.3 ? '#ffdf70' : v < 0.7 ? '#f2ba42' : '#c98a24';
        glowCtx.fillRect(x, y, 1, 1);
      }
    }
    this.textures.set('glowstone', this.wrapTexture(glowCanvas));

    // 20. TORCH
    const [torchCanvas, torchCtx] = create16Canvas();
    torchCtx.clearRect(0, 0, 16, 16);
    torchCtx.fillStyle = '#ffb326';
    torchCtx.fillRect(7, 4, 2, 3);
    torchCtx.fillStyle = '#ffe97a';
    torchCtx.fillRect(7, 5, 2, 1);
    torchCtx.fillStyle = '#5c4028';
    torchCtx.fillRect(7, 7, 2, 8);
    this.textures.set('torch', this.wrapTexture(torchCanvas));

    this.buildMaterials();
  }

  private buildMaterials() {
    const std = (map: THREE.CanvasTexture, rough = 0.85, metal = 0.05) =>
      new THREE.MeshStandardMaterial({
        map,
        roughness: rough,
        metalness: metal,
      });

    // Multi-face materials for blocks like grass, logs, crafting table, TNT:
    // Order of faces: [Right(+x), Left(-x), Top(+y), Bottom(-y), Front(+z), Back(-z)]
    const grassSide = std(this.textures.get('grass_side')!);
    const grassTop = std(this.textures.get('grass_top')!);
    const dirt = std(this.textures.get('dirt')!);

    this.materials.set(BlockType.GRASS, [grassSide, grassSide, grassTop, dirt, grassSide, grassSide]);
    this.materials.set(BlockType.DIRT, dirt);
    this.materials.set(BlockType.STONE, std(this.textures.get('stone')!));
    this.materials.set(BlockType.COBBLESTONE, std(this.textures.get('cobblestone')!));

    const logSide = std(this.textures.get('log_side')!);
    const logTop = std(this.textures.get('log_top')!);
    this.materials.set(BlockType.WOOD_LOG, [logSide, logSide, logTop, logTop, logSide, logSide]);
    this.materials.set(BlockType.WOOD_PLANKS, std(this.textures.get('planks')!));

    this.materials.set(BlockType.LEAVES, new THREE.MeshStandardMaterial({
      map: this.textures.get('leaves')!,
      roughness: 0.9,
      transparent: true,
      opacity: 0.92,
      depthWrite: true,
    }));

    this.materials.set(BlockType.SAND, std(this.textures.get('sand')!));

    this.materials.set(BlockType.WATER, new THREE.MeshStandardMaterial({
      map: this.textures.get('water')!,
      roughness: 0.1,
      metalness: 0.1,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
    }));

    this.materials.set(BlockType.GLASS, new THREE.MeshStandardMaterial({
      map: this.textures.get('glass')!,
      roughness: 0.1,
      metalness: 0.2,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    }));

    this.materials.set(BlockType.BRICK, std(this.textures.get('brick')!));
    this.materials.set(BlockType.BEDROCK, std(this.textures.get('bedrock')!));
    this.materials.set(BlockType.COAL_ORE, std(this.textures.get('coal_ore')!));
    this.materials.set(BlockType.IRON_ORE, std(this.textures.get('iron_ore')!));
    this.materials.set(BlockType.GOLD_ORE, std(this.textures.get('gold_ore')!, 0.4, 0.4));
    this.materials.set(BlockType.DIAMOND_ORE, std(this.textures.get('diamond_ore')!, 0.3, 0.3));
    this.materials.set(BlockType.BOOKSHELF, [
      std(this.textures.get('bookshelf')!),
      std(this.textures.get('bookshelf')!),
      std(this.textures.get('planks')!),
      std(this.textures.get('planks')!),
      std(this.textures.get('bookshelf')!),
      std(this.textures.get('bookshelf')!),
    ]);

    const ctTop = std(this.textures.get('crafting_table_top')!);
    const ctSide = std(this.textures.get('crafting_table_side')!);
    this.materials.set(BlockType.CRAFTING_TABLE, [ctSide, ctSide, ctTop, dirt, ctSide, ctSide]);

    const tntTop = std(this.textures.get('tnt_top')!);
    const tntSide = std(this.textures.get('tnt_side')!);
    this.materials.set(BlockType.TNT, [tntSide, tntSide, tntTop, tntTop, tntSide, tntSide]);

    this.materials.set(BlockType.OBSIDIAN, std(this.textures.get('obsidian')!, 0.6, 0.2));
    this.materials.set(BlockType.GLOWSTONE, new THREE.MeshStandardMaterial({
      map: this.textures.get('glowstone')!,
      emissive: new THREE.Color(0xf2ba42),
      emissiveIntensity: 0.75,
      roughness: 0.5,
    }));

    this.materials.set(BlockType.TORCH, new THREE.MeshStandardMaterial({
      map: this.textures.get('torch')!,
      transparent: true,
      emissive: new THREE.Color(0xffaa20),
      emissiveIntensity: 0.9,
    }));
  }

  public getMaterial(type: BlockType): THREE.Material | THREE.Material[] {
    return this.materials.get(type) || this.materials.get(BlockType.STONE)!;
  }

  public getTexture(key: string): THREE.CanvasTexture | undefined {
    return this.textures.get(key);
  }
}

export const textureAtlas = new TextureAtlas();
