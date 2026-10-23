import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, Compass, Sun, Moon, Feather, Shield, Backpack, Menu } from 'lucide-react';
import { BlockType, PlayerStats } from '../types/game';
import { sound } from '../engine/audio';

interface HUDProps {
  stats: PlayerStats | null;
  hotbar: { blockType?: BlockType; toolType?: string; name: string }[];
  activeSlot: number;
  onSelectSlot: (slot: number) => void;
  onOpenInventory: () => void;
  onOpenPause: () => void;
  onToggleFly: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  hotbar,
  activeSlot,
  onSelectSlot,
  onOpenInventory,
  onOpenPause,
  onToggleFly,
  isMuted,
  onToggleMute,
}) => {
  const [itemNameTip, setItemNameTip] = useState<string>('');

  // Show active item name toast briefly on change
  useEffect(() => {
    const item = hotbar[activeSlot];
    if (item) {
      setItemNameTip(item.name);
      const timer = setTimeout(() => setItemNameTip(''), 1800);
      return () => clearTimeout(timer);
    }
  }, [activeSlot, hotbar]);

  if (!stats) return null;

  // Format time of day (0-24000) into 24h clock
  const hours = Math.floor((stats.timeOfDay / 1000 + 6) % 24);
  const minutes = Math.floor(((stats.timeOfDay % 1000) / 1000) * 60);
  const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  const isNight = hours >= 19 || hours < 6;

  // Icon preview colors for blocks
  const getBlockColorPreview = (type?: BlockType, tool?: string) => {
    if (tool === 'sword') return '#4dedf4';
    if (tool === 'pickaxe') return '#2cb5bd';
    if (tool === 'axe') return '#38c5cd';
    if (tool === 'shovel') return '#62e2ea';

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
      case BlockType.TNT: return '#c72828';
      case BlockType.GLOWSTONE: return '#f2ba42';
      case BlockType.DIAMOND_ORE: return '#4dedf4';
      case BlockType.GOLD_ORE: return '#fcee4b';
      case BlockType.IRON_ORE: return '#d8af93';
      default: return '#888888';
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-3 font-mono">
      {/* 1. TOP PERIMETER STATUS CLUSTER */}
      <div className="flex items-start justify-between">
        {/* Left: Coords & Mode */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 bg-neutral-900/80 border border-neutral-700/80 px-2.5 py-1 text-xs text-neutral-200 shadow">
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-neutral-400">XYZ:</span>
            <span className="tabular-nums font-semibold text-emerald-300">
              {stats.coords.x} / {stats.coords.y} / {stats.coords.z}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="bg-neutral-900/80 border border-neutral-700/80 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider text-amber-300">
              {stats.mode === 'creative' ? 'Modo Creativo' : 'Supervivencia'}
            </span>
            {stats.isFlying && (
              <span className="bg-sky-950/80 border border-sky-600/80 px-2 py-0.5 text-[10px] font-bold text-sky-300 flex items-center gap-1">
                <Feather className="w-3 h-3" /> VOLANDO
              </span>
            )}
          </div>
        </div>

        {/* Center: Title / Brand lockup small badge */}
        <div className="bg-neutral-900/70 border border-neutral-700/60 px-3 py-1 text-xs text-neutral-300 font-bold tracking-wide">
          VOXELCRAFT <span className="text-emerald-400">3D</span>
        </div>

        {/* Right: Time & Audio / Actions Buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Day / Night clock */}
          <div className="flex items-center gap-1.5 bg-neutral-900/80 border border-neutral-700/80 px-2.5 py-1 text-xs text-neutral-200">
            {isNight ? (
              <Moon className="w-3.5 h-3.5 text-indigo-300" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span className="tabular-nums font-semibold">{timeString}</span>
          </div>

          {/* Sound Toggle Button */}
          <button
            onClick={onToggleMute}
            className="p-1.5 bg-neutral-900/80 border border-neutral-700/80 text-neutral-300 hover:text-white hover:bg-neutral-800 transition active:scale-95 cursor-pointer"
            title="Silenciar / Activar Sonido"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Inventory Button (especially handy for mobile/tablets) */}
          <button
            onClick={onOpenInventory}
            className="px-2.5 py-1.5 bg-neutral-900/80 border border-neutral-700/80 text-neutral-200 hover:text-white hover:bg-neutral-800 transition flex items-center gap-1 text-xs active:scale-95 cursor-pointer"
            title="Inventario y Crafteo (E)"
          >
            <Backpack className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Inv (E)</span>
          </button>

          {/* Pause Menu Button */}
          <button
            onClick={onOpenPause}
            className="p-1.5 bg-neutral-900/80 border border-neutral-700/80 text-neutral-300 hover:text-white hover:bg-neutral-800 transition active:scale-95 cursor-pointer"
            title="Menú de Pausa (Esc)"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. CENTER RETICLE / CROSSHAIR */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="relative w-4 h-4 flex items-center justify-center">
          <div className="absolute w-4 h-[2px] bg-white/90 shadow-sm" />
          <div className="absolute h-4 w-[2px] bg-white/90 shadow-sm" />
          <div className="w-1 h-1 bg-black/60" />
        </div>
      </div>

      {/* 3. BOTTOM PERIMETER STATUS & HOTBAR */}
      <div className="flex flex-col items-center gap-2">
        {/* Item Name Floating Toast */}
        {itemNameTip && (
          <div className="bg-neutral-950/90 border border-neutral-600 px-3 py-1 text-xs font-semibold text-white tracking-wide shadow-md transition-opacity duration-200">
            {itemNameTip}
          </div>
        )}

        {/* Survival Status Bars (Health, Hunger, Oxygen) */}
        {stats.mode === 'survival' && (
          <div className="w-full max-w-sm flex items-center justify-between text-xs px-1">
            {/* Hearts (Health) */}
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 10 }).map((_, i) => {
                const filled = stats.health >= (i + 1) * 2;
                const half = stats.health === (i * 2) + 1;
                return (
                  <span
                    key={i}
                    className={`inline-block text-xs ${
                      filled ? 'text-red-500' : half ? 'text-red-400' : 'text-neutral-700'
                    }`}
                  >
                    ❤
                  </span>
                );
              })}
            </div>

            {/* Oxygen Bubbles (if underwater) */}
            {stats.oxygen < stats.maxOxygen && (
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <span
                    key={i}
                    className={`text-[10px] ${
                      stats.oxygen >= (i + 1) * 2 ? 'text-sky-400' : 'text-neutral-700'
                    }`}
                  >
                    🫧
                  </span>
                ))}
              </div>
            )}

            {/* Hunger Drumsticks */}
            <div className="flex items-center gap-0.5 text-amber-600">
              {Array.from({ length: 10 }).map((_, i) => (
                <span
                  key={i}
                  className={`text-xs ${
                    stats.hunger >= (i + 1) * 2 ? 'text-amber-500' : 'text-neutral-700'
                  }`}
                >
                  🍗
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Authentic Minecraft 9-Slot Hotbar */}
        <div className="flex items-center gap-1.5 p-1 bg-neutral-900/90 border-2 border-neutral-700 shadow-2xl pointer-events-auto">
          {hotbar.map((item, idx) => {
            const isSelected = idx === activeSlot;
            const previewColor = getBlockColorPreview(item.blockType, item.toolType);

            return (
              <button
                key={idx}
                onClick={() => onSelectSlot(idx)}
                className={`relative w-11 h-11 flex flex-col items-center justify-center border-2 transition cursor-pointer select-none ${
                  isSelected
                    ? 'border-white bg-neutral-700/80 scale-105 shadow-md shadow-white/20'
                    : 'border-neutral-800 bg-neutral-950/70 hover:bg-neutral-800/80 hover:border-neutral-600'
                }`}
                title={`${item.name} (${idx + 1})`}
              >
                {/* Slot index number (1-9) */}
                <span className="absolute top-0.5 left-1 text-[9px] text-neutral-400 font-bold">
                  {idx + 1}
                </span>

                {/* Voxel preview icon cube */}
                <div
                  className="w-5 h-5 border border-black/40 shadow-inner flex items-center justify-center"
                  style={{
                    backgroundColor: previewColor,
                    boxShadow: 'inset 2px 2px rgba(255,255,255,0.3), inset -2px -2px rgba(0,0,0,0.4)',
                  }}
                >
                  {item.toolType === 'pickaxe' && <span className="text-[9px] text-black font-black">⛏</span>}
                  {item.toolType === 'sword' && <span className="text-[9px] text-black font-black">🗡</span>}
                </div>

                {/* Selected active indicator marker */}
                {isSelected && (
                  <div className="absolute -bottom-1 w-2.5 h-1 bg-amber-400 shadow" />
                )}
              </button>
            );
          })}
        </div>

        {/* Flat control hint line */}
        <div className="text-[11px] text-neutral-300/80 bg-neutral-950/80 border border-neutral-800/80 px-3 py-0.5 tracking-wide text-center">
          <span className="text-amber-400 font-bold">WASD</span> Moverse ·{' '}
          <span className="text-amber-400 font-bold">Espacio</span> Saltar ·{' '}
          <span className="text-amber-400 font-bold">Click Izq</span> Romper ·{' '}
          <span className="text-amber-400 font-bold">Click Der</span> Poner ·{' '}
          <span className="text-amber-400 font-bold">E</span> Inventario ·{' '}
          <span className="text-amber-400 font-bold">F</span> Volar ·{' '}
          <span className="text-amber-400 font-bold">Esc</span> Pausa
        </div>
      </div>
    </div>
  );
};
