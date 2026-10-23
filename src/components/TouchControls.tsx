import React, { useRef } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Pickaxe, Box, ArrowUp } from 'lucide-react';

interface TouchControlsProps {
  onMove: (forward: number, right: number) => void;
  onJump: (jump: boolean) => void;
  onBreak: () => void;
  onPlace: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onMove,
  onJump,
  onBreak,
  onPlace,
}) => {
  return (
    <div className="absolute inset-x-0 bottom-16 px-4 flex justify-between items-end pointer-events-none select-none z-30">
      {/* Virtual D-pad for walking */}
      <div className="grid grid-cols-3 gap-1.5 w-36 h-36 bg-black/40 p-2 rounded-2xl border border-white/20 backdrop-blur-none pointer-events-auto">
        <div />
        <button
          onPointerDown={() => onMove(1, 0)}
          onPointerUp={() => onMove(0, 0)}
          className="flex items-center justify-center bg-white/20 active:bg-white/40 rounded-lg text-white font-black"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
        <div />

        <button
          onPointerDown={() => onMove(0, -1)}
          onPointerUp={() => onMove(0, 0)}
          className="flex items-center justify-center bg-white/20 active:bg-white/40 rounded-lg text-white font-black"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center justify-center text-[10px] text-white/50 font-bold">
          MOVE
        </div>
        <button
          onPointerDown={() => onMove(0, 1)}
          onPointerUp={() => onMove(0, 0)}
          className="flex items-center justify-center bg-white/20 active:bg-white/40 rounded-lg text-white font-black"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        <div />
        <button
          onPointerDown={() => onMove(-1, 0)}
          onPointerUp={() => onMove(0, 0)}
          className="flex items-center justify-center bg-white/20 active:bg-white/40 rounded-lg text-white font-black"
        >
          <ChevronDown className="w-6 h-6" />
        </button>
        <div />
      </div>

      {/* Action Buttons (Jump, Break, Place) */}
      <div className="flex flex-col gap-2 pointer-events-auto items-end">
        <div className="flex gap-2">
          {/* Break Block button */}
          <button
            onPointerDown={onBreak}
            className="w-14 h-14 rounded-full bg-red-600/80 active:bg-red-500 border-2 border-red-400 flex flex-col items-center justify-center text-white shadow-lg active:scale-95"
            title="Romper Bloque"
          >
            <span className="text-sm font-bold">MINAR</span>
          </button>

          {/* Place Block button */}
          <button
            onPointerDown={onPlace}
            className="w-14 h-14 rounded-full bg-emerald-600/80 active:bg-emerald-500 border-2 border-emerald-400 flex flex-col items-center justify-center text-white shadow-lg active:scale-95"
            title="Colocar Bloque"
          >
            <span className="text-sm font-bold">PONER</span>
          </button>
        </div>

        {/* Jump button */}
        <button
          onPointerDown={() => onJump(true)}
          onPointerUp={() => onJump(false)}
          className="w-16 h-14 rounded-2xl bg-amber-600/80 active:bg-amber-500 border-2 border-amber-400 flex items-center justify-center text-white shadow-lg active:scale-95"
          title="Saltar"
        >
          <ArrowUp className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
};
