import React from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Shield, Feather, Home, Save, Download } from 'lucide-react';
import { GameMode } from '../types/game';
import { sound } from '../engine/audio';

interface PauseModalProps {
  onResume: () => void;
  onResetWorld: () => void;
  mode: GameMode;
  onToggleMode: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onBackToTitle: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onResetWorld,
  mode,
  onToggleMode,
  isMuted,
  onToggleMute,
  onBackToTitle,
}) => {
  return (
    <div className="absolute inset-0 bg-black/75 flex items-center justify-center p-4 z-50 font-mono select-none">
      <div className="w-full max-w-sm bg-neutral-900 border-4 border-neutral-700 p-6 shadow-2xl flex flex-col items-center gap-3 text-neutral-200">
        <h2 className="text-xl font-bold uppercase tracking-wider text-white mb-2">
          Juego Pausado
        </h2>

        {/* Resume Button */}
        <button
          onClick={() => {
            sound.playClick();
            onResume();
          }}
          className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-600 border-2 border-emerald-500 text-white font-bold text-sm uppercase tracking-wide transition cursor-pointer flex items-center justify-center gap-2 active:scale-95"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Volver al Juego</span>
        </button>

        {/* Mode Toggle */}
        <button
          onClick={() => {
            sound.playClick();
            onToggleMode();
          }}
          className="w-full py-2.5 px-4 bg-neutral-950 hover:bg-neutral-800 border-2 border-neutral-700 text-neutral-300 font-bold text-xs tracking-wide transition cursor-pointer flex items-center justify-between"
        >
          <span className="text-neutral-400">Modo:</span>
          <span className="flex items-center gap-1 text-amber-300">
            {mode === 'creative' ? (
              <>
                <Feather className="w-3.5 h-3.5 text-sky-400" /> Creativo (Volar)
              </>
            ) : (
              <>
                <Shield className="w-3.5 h-3.5 text-red-400" /> Supervivencia
              </>
            )}
          </span>
        </button>

        {/* Reset World */}
        <button
          onClick={() => {
            sound.playClick();
            onResetWorld();
          }}
          className="w-full py-2.5 px-4 bg-neutral-950 hover:bg-neutral-800 border-2 border-neutral-700 text-neutral-300 font-bold text-xs tracking-wide transition cursor-pointer flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          <span>Generar Nuevo Terreno</span>
        </button>

        {/* Sound Toggle */}
        <button
          onClick={() => {
            sound.playClick();
            onToggleMute();
          }}
          className="w-full py-2.5 px-4 bg-neutral-950 hover:bg-neutral-800 border-2 border-neutral-700 text-neutral-300 font-bold text-xs tracking-wide transition cursor-pointer flex items-center justify-center gap-2"
        >
          {isMuted ? (
            <>
              <VolumeX className="w-3.5 h-3.5 text-red-400" />
              <span>Activar Sonidos</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Silenciar Sonidos</span>
            </>
          )}
        </button>

        {/* Back to Title Screen */}
        <button
          onClick={() => {
            sound.playClick();
            onBackToTitle();
          }}
          className="w-full py-2.5 px-4 bg-neutral-950 hover:bg-neutral-800 border-2 border-neutral-700 text-red-400 hover:text-red-300 font-bold text-xs tracking-wide transition cursor-pointer flex items-center justify-center gap-2 mt-2"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Pantalla de Título</span>
        </button>
      </div>
    </div>
  );
};
