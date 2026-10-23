export enum BlockType {
  AIR = 0,
  GRASS = 1,
  DIRT = 2,
  STONE = 3,
  COBBLESTONE = 4,
  WOOD_LOG = 5,
  WOOD_PLANKS = 6,
  LEAVES = 7,
  SAND = 8,
  WATER = 9,
  GLASS = 10,
  BRICK = 11,
  BEDROCK = 12,
  COAL_ORE = 13,
  IRON_ORE = 14,
  GOLD_ORE = 15,
  DIAMOND_ORE = 16,
  BOOKSHELF = 17,
  CRAFTING_TABLE = 18,
  TNT = 19,
  TORCH = 20,
  OBSIDIAN = 21,
  GLOWSTONE = 22,
}

export interface BlockDefinition {
  id: BlockType;
  name: string;
  nameEs: string;
  isTransparent?: boolean;
  isLiquid?: boolean;
  isLightSource?: boolean;
  hardness: number; // break time in seconds
  soundCategory: 'grass' | 'wood' | 'stone' | 'sand' | 'glass' | 'water';
}

export const BLOCK_DEFS: Record<BlockType, BlockDefinition> = {
  [BlockType.AIR]: { id: BlockType.AIR, name: 'Air', nameEs: 'Aire', isTransparent: true, hardness: 0, soundCategory: 'grass' },
  [BlockType.GRASS]: { id: BlockType.GRASS, name: 'Grass Block', nameEs: 'Césped', hardness: 0.6, soundCategory: 'grass' },
  [BlockType.DIRT]: { id: BlockType.DIRT, name: 'Dirt', nameEs: 'Tierra', hardness: 0.5, soundCategory: 'grass' },
  [BlockType.STONE]: { id: BlockType.STONE, name: 'Stone', nameEs: 'Piedra', hardness: 1.5, soundCategory: 'stone' },
  [BlockType.COBBLESTONE]: { id: BlockType.COBBLESTONE, name: 'Cobblestone', nameEs: 'Adoquín', hardness: 1.8, soundCategory: 'stone' },
  [BlockType.WOOD_LOG]: { id: BlockType.WOOD_LOG, name: 'Oak Log', nameEs: 'Tronco de Roble', hardness: 1.2, soundCategory: 'wood' },
  [BlockType.WOOD_PLANKS]: { id: BlockType.WOOD_PLANKS, name: 'Oak Planks', nameEs: 'Tablas de Roble', hardness: 1.0, soundCategory: 'wood' },
  [BlockType.LEAVES]: { id: BlockType.LEAVES, name: 'Oak Leaves', nameEs: 'Hojas de Roble', isTransparent: true, hardness: 0.2, soundCategory: 'grass' },
  [BlockType.SAND]: { id: BlockType.SAND, name: 'Sand', nameEs: 'Arena', hardness: 0.5, soundCategory: 'sand' },
  [BlockType.WATER]: { id: BlockType.WATER, name: 'Water', nameEs: 'Agua', isLiquid: true, isTransparent: true, hardness: 100, soundCategory: 'water' },
  [BlockType.GLASS]: { id: BlockType.GLASS, name: 'Glass', nameEs: 'Cristal', isTransparent: true, hardness: 0.3, soundCategory: 'glass' },
  [BlockType.BRICK]: { id: BlockType.BRICK, name: 'Bricks', nameEs: 'Ladrillos', hardness: 2.0, soundCategory: 'stone' },
  [BlockType.BEDROCK]: { id: BlockType.BEDROCK, name: 'Bedrock', nameEs: 'Piedra Base', hardness: Infinity, soundCategory: 'stone' },
  [BlockType.COAL_ORE]: { id: BlockType.COAL_ORE, name: 'Coal Ore', nameEs: 'Mineral de Carbón', hardness: 2.2, soundCategory: 'stone' },
  [BlockType.IRON_ORE]: { id: BlockType.IRON_ORE, name: 'Iron Ore', nameEs: 'Mineral de Hierro', hardness: 2.5, soundCategory: 'stone' },
  [BlockType.GOLD_ORE]: { id: BlockType.GOLD_ORE, name: 'Gold Ore', nameEs: 'Mineral de Oro', hardness: 2.5, soundCategory: 'stone' },
  [BlockType.DIAMOND_ORE]: { id: BlockType.DIAMOND_ORE, name: 'Diamond Ore', nameEs: 'Mineral de Diamante', hardness: 3.0, soundCategory: 'stone' },
  [BlockType.BOOKSHELF]: { id: BlockType.BOOKSHELF, name: 'Bookshelf', nameEs: 'Librería', hardness: 1.2, soundCategory: 'wood' },
  [BlockType.CRAFTING_TABLE]: { id: BlockType.CRAFTING_TABLE, name: 'Crafting Table', nameEs: 'Mesa de Trabajo', hardness: 1.5, soundCategory: 'wood' },
  [BlockType.TNT]: { id: BlockType.TNT, name: 'TNT', nameEs: 'Dinamita TNT', hardness: 0.1, soundCategory: 'grass' },
  [BlockType.TORCH]: { id: BlockType.TORCH, name: 'Torch', nameEs: 'Antorcha', isTransparent: true, isLightSource: true, hardness: 0.1, soundCategory: 'wood' },
  [BlockType.OBSIDIAN]: { id: BlockType.OBSIDIAN, name: 'Obsidian', nameEs: 'Obsidiana', hardness: 5.0, soundCategory: 'stone' },
  [BlockType.GLOWSTONE]: { id: BlockType.GLOWSTONE, name: 'Glowstone', nameEs: 'Piedra Luminosa', isLightSource: true, hardness: 0.4, soundCategory: 'glass' },
};

export type ToolType = 'none' | 'sword' | 'pickaxe' | 'axe' | 'shovel';

export interface InventoryItem {
  id: string;
  blockType?: BlockType;
  toolType?: ToolType;
  name: string;
  nameEs: string;
  count: number;
  icon?: string;
}

export type GameMode = 'survival' | 'creative';

export interface PlayerStats {
  health: number;
  maxHealth: number;
  hunger: number;
  maxHunger: number;
  oxygen: number;
  maxOxygen: number;
  mode: GameMode;
  isFlying: boolean;
  score: number;
  coords: { x: number; y: number; z: number };
  timeOfDay: number; // 0 to 24000
}

export interface RaycastHit {
  blockPosition: [number, number, number];
  normal: [number, number, number];
  targetPosition: [number, number, number]; // where new block will be placed
  blockType: BlockType;
  distance: number;
}
