import React, { useState } from 'react';
import { X, Sun, Moon, Feather, Hammer, Sparkles } from 'lucide-react';
import { BLOCK_DEFS, BlockType, ToolType } from '../types/game';
import { sound } from '../engine/audio';

interface InventoryModalProps {
  onClose: () => void;
  activeSlot: number;
  hotbar: { blockType?: BlockType; toolType?: ToolType; name: string }[];
  onSetHotbarSlot: (slot: number, item: { blockType?: BlockType; toolType?: ToolType; name: string }) => void;
  onSetTimeOfDay: (time: number) => void;
  isFlying: boolean;
  onToggleFly: () => void;
}

const ALL_BLOCKS: BlockType[] = [
  BlockType.GRASS,
  BlockType.DIRT,
  BlockType.STONE,
  BlockType.COBBLESTONE,
  BlockType.WOOD_LOG,
  BlockType.WOOD_PLANKS,
  BlockType.LEAVES,
  BlockType.SAND,
  BlockType.GLASS,
  BlockType.BRICK,
  BlockType.BEDROCK,
  BlockType.COAL_ORE,
  BlockType.IRON_ORE,
  BlockType.GOLD_ORE,
  BlockType.DIAMOND_ORE,
  BlockType.BOOKSHELF,
  BlockType.CRAFTING_TABLE,
  BlockType.TNT,
  BlockType.OBSIDIAN,
  BlockType.GLOWSTONE,
];

const ALL_TOOLS: { type: ToolType; name: string; icon: string }[] = [
  { type: 'sword', name: 'Espada de Diamante', icon: '🗡' },
  { type: 'pickaxe', name: 'Pico de Diamante', icon: '⛏' },
  { type: 'axe', name: 'Hacha de Diamante', icon: '🪓' },
  { type: 'shovel', name: 'Pala de Diamante', icon: '🧹' },
];

export const InventoryModal: React.FC<InventoryModalProps> = ({
  onClose,
  activeSlot,
  hotbar,
  onSetHotbarSlot,
  onSetTimeOfDay,
  isFlying,
  onToggleFly,
}) => {
  const [selectedHotbarSlot, setSelectedHotbarSlot] = useState(activeSlot);
  const [tab, setTab] = useState<'blocks' | 'tools' | 'crafting'>('blocks');

  // Preview color for blocks
  const getBlockColor = (type: BlockType): string => {
    switch (type) {
      case BlockType.GRASS: return '#5b8e32';
      case BlockType.DIRT: return '#866043';
      case BlockType.STONE: return '#7b7b7b';
      case BlockType.COBBLESTONE: return '#6e6e6e';
      case BlockType.WOOD_PLANKS: return '#b38656';
      case BlockType.WOOD_LOG: return '#5c3e20';
      case BlockType.LEAVES: return '#3e7a2b';
      case BlockType.GLASS: return '#d7f0ff';
      case BlockType.SAND: return '#e3d494';
      case BlockType.BRICK: return '#9c4132';
      case BlockType.BEDROCK: return '#222222';
      case BlockType.COAL_ORE: return '#333333';
      case BlockType.IRON_ORE: return '#d8af93';
      case BlockType.GOLD_ORE: return '#fcee4b';
      case BlockType.DIAMOND_ORE: return '#4dedf4';
      case BlockType.BOOKSHELF: return '#8f6841';
      case BlockType.CRAFTING_TABLE: return '#b38656';
      case BlockType.TNT: return '#c72828';
      case BlockType.OBSIDIAN: return '#26123b';
      case BlockType.GLOWSTONE: return '#f2ba42';
      default: return '#888888';
    }
  };

  const handlePickBlock = (type: BlockType) => {
    const def = BLOCK_DEFS[type];
    onSetHotbarSlot(selectedHotbarSlot, {
      blockType: type,
      name: def.nameEs,
    });
    sound.playClick();
  };

  const handlePickTool = (tool: { type: ToolType; name: string }) => {
    onSetHotbarSlot(selectedHotbarSlot, {
      toolType: tool.type,
      name: tool.name,
    });
    sound.playClick();
  };

  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-4 z-50 font-mono select-none">
      <div className="w-full max-w-xl bg-neutral-900 border-4 border-neutral-700 shadow-2xl p-5 flex flex-col gap-4 text-neutral-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-neutral-700 pb-2">
          <div className="flex items-center gap-2">
            <Hammer className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold uppercase tracking-wider text-white">
              Inventario & Selector de Bloques
            </h2>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 text-xs font-bold">
          <button
            onClick={() => {
              sound.playClick();
              setTab('blocks');
            }}
            className={`px-3 py-1.5 border-2 transition cursor-pointer ${
              tab === 'blocks'
                ? 'border-amber-400 bg-neutral-800 text-amber-300'
                : 'border-neutral-700 bg-neutral-950 text-neutral-400 hover:text-white'
            }`}
          >
            Bloques de Construcción
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setTab('tools');
            }}
            className={`px-3 py-1.5 border-2 transition cursor-pointer ${
              tab === 'tools'
                ? 'border-amber-400 bg-neutral-800 text-amber-300'
                : 'border-neutral-700 bg-neutral-950 text-neutral-400 hover:text-white'
            }`}
          >
            Herramientas y Armas
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setTab('crafting');
            }}
            className={`px-3 py-1.5 border-2 transition cursor-pointer ${
              tab === 'crafting'
                ? 'border-amber-400 bg-neutral-800 text-amber-300'
                : 'border-neutral-700 bg-neutral-950 text-neutral-400 hover:text-white'
            }`}
          >
            Ajustes del Mundo
          </button>
        </div>

        {/* Body Content */}
        <div className="min-h-[220px] bg-neutral-950 border-2 border-neutral-800 p-3">
          {tab === 'blocks' && (
            <div>
              <div className="text-[11px] text-neutral-400 mb-2">
                Haz clic en cualquier bloque para asignarlo a la casilla seleccionada de la barra rápida:
              </div>
              <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
                {ALL_BLOCKS.map((type) => {
                  const def = BLOCK_DEFS[type];
                  const col = getBlockColor(type);
                  return (
                    <button
                      key={type}
                      onClick={() => handlePickBlock(type)}
                      className="group relative flex flex-col items-center justify-center p-2 bg-neutral-900 border-2 border-neutral-700 hover:border-amber-400 hover:bg-neutral-800 transition active:scale-95 cursor-pointer"
                      title={def.nameEs}
                    >
                      <div
                        className="w-7 h-7 border border-black/50 shadow-inner group-hover:scale-110 transition-transform"
                        style={{
                          backgroundColor: col,
                          boxShadow: 'inset 2px 2px rgba(255,255,255,0.4), inset -2px -2px rgba(0,0,0,0.5)',
                        }}
                      />
                      <span className="mt-1 text-[10px] text-neutral-300 text-center truncate w-full">
                        {def.nameEs}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'tools' && (
            <div>
              <div className="text-[11px] text-neutral-400 mb-2">
                Selecciona herramientas de diamante para equipar en tu barra de acceso rápido:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {ALL_TOOLS.map((t) => (
                  <button
                    key={t.type}
                    onClick={() => handlePickTool(t)}
                    className="p-3 bg-neutral-900 border-2 border-neutral-700 hover:border-cyan-400 hover:bg-neutral-800 transition flex flex-col items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <span className="text-2xl">{t.icon}</span>
                    <span className="text-xs font-bold text-cyan-300 text-center">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === 'crafting' && (
            <div className="flex flex-col gap-4 text-xs">
              <div>
                <span className="font-bold text-neutral-300 block mb-1.5">Cambiar Hora del Día:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      sound.playClick();
                      onSetTimeOfDay(1000); // Morning
                    }}
                    className="px-3 py-1.5 bg-neutral-900 border border-neutral-700 hover:border-amber-400 text-amber-300 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sun className="w-4 h-4 text-amber-400" /> Amanecer
                  </button>
                  <button
                    onClick={() => {
                      sound.playClick();
                      onSetTimeOfDay(6000); // Noon
                    }}
                    className="px-3 py-1.5 bg-neutral-900 border border-neutral-700 hover:border-amber-400 text-amber-300 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sun className="w-4 h-4 text-yellow-400" /> Mediodía
                  </button>
                  <button
                    onClick={() => {
                      sound.playClick();
                      onSetTimeOfDay(12000); // Sunset
                    }}
                    className="px-3 py-1.5 bg-neutral-900 border border-neutral-700 hover:border-amber-400 text-orange-300 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sun className="w-4 h-4 text-orange-400" /> Atardecer
                  </button>
                  <button
                    onClick={() => {
                      sound.playClick();
                      onSetTimeOfDay(18000); // Midnight
                    }}
                    className="px-3 py-1.5 bg-neutral-900 border border-neutral-700 hover:border-amber-400 text-indigo-300 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Moon className="w-4 h-4 text-indigo-400" /> Medianoche
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-800">
                <span className="font-bold text-neutral-300 block mb-1.5">Habilidades Especiales:</span>
                <button
                  onClick={() => {
                    sound.playClick();
                    onToggleFly();
                  }}
                  className={`px-3 py-2 border-2 flex items-center gap-2 cursor-pointer font-bold ${
                    isFlying
                      ? 'border-sky-400 bg-sky-950/80 text-sky-300'
                      : 'border-neutral-700 bg-neutral-900 text-neutral-300'
                  }`}
                >
                  <Feather className="w-4 h-4" />
                  <span>Modo Vuelo: {isFlying ? 'ACTIVADO' : 'DESACTIVADO'} (Tecla F)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Hotbar Slot Destination Selector */}
        <div className="flex flex-col gap-1.5">
          <div className="text-[11px] text-neutral-400 flex items-center justify-between">
            <span>Asignar al espacio de la barra rápida:</span>
            <span className="text-amber-400 font-bold">Casilla #{selectedHotbarSlot + 1}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-neutral-950 p-2 border-2 border-neutral-800">
            {hotbar.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedHotbarSlot(idx)}
                className={`relative flex-1 h-10 flex flex-col items-center justify-center border-2 transition cursor-pointer ${
                  idx === selectedHotbarSlot
                    ? 'border-amber-400 bg-neutral-800'
                    : 'border-neutral-700 bg-neutral-900 hover:bg-neutral-850'
                }`}
              >
                <span className="text-[9px] text-neutral-400 absolute top-0.5 left-1">
                  {idx + 1}
                </span>
                <span className="text-[10px] text-white truncate max-w-full px-0.5">
                  {item.name.substring(0, 5)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-1">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 border-2 border-emerald-500 text-white font-bold text-xs uppercase cursor-pointer"
          >
            Listo (Volver al Juego)
          </button>
        </div>
      </div>
    </div>
  );
};
