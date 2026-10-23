import React, { useEffect } from 'react';
import { Play, Sparkles, RefreshCw, Volume2, VolumeX, Shield, Feather } from 'lucide-react';
import { GameMode } from '../types/game';
import { sound } from '../engine/audio';

interface TitleScreenProps {
  onStartGame: () => void;
  onNewWorld: () => void;
  mode: GameMode;
  onToggleMode: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  seed: number;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onNewWorld,
  mode,
  onToggleMode,
  isMuted,
  onToggleMute,
  seed,
}) => {
  // Listen for Enter / Space to start immediately
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        sound.playClick();
        onStartGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartGame]);

  return (
    <div className="absolute inset-0 select-none flex flex-col justify-between items-center p-6 bg-gradient-to-t from-black/60 via-transparent to-black/40 font-mono">
      {/* Top Bar with Seed & Mute */}
      <div className="w-full flex justify-between items-center text-xs text-neutral-300">
        <div className="bg-neutral-900/80 border border-neutral-700/80 px-3 py-1 flex items-center gap-2">
          <span className="text-neutral-400">Semilla:</span>
          <span className="text-emerald-400 font-bold">{seed}</span>
        </div>

        <button
          onClick={onToggleMute}
          className="p-2 bg-neutral-900/80 border border-neutral-700/80 text-neutral-300 hover:text-white transition active:scale-95 cursor-pointer flex items-center gap-1.5"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          <span>{isMuted ? 'Mudo' : 'Audio On'}</span>
        </button>
      </div>

      {/* Hero Centerpiece: Bespoke inline SVG Title Lockup */}
      <div className="flex flex-col items-center max-w-xl text-center">
        {/* Minecraft 3D Voxel style SVG Title Lockup */}
        <div className="relative mb-6 drop-shadow-[0_12px_24px_rgba(0,0,0,0.8)]">
          <svg
            viewBox="0 0 600 130"
            className="w-[90vw] max-w-[560px] h-auto overflow-visible select-none"
          >
            <defs>
              <linearGradient id="stoneGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#cfcfcf" />
                <stop offset="30%" stopColor="#9a9a9a" />
                <stop offset="70%" stopColor="#666666" />
                <stop offset="100%" stopColor="#444444" />
              </linearGradient>
              <linearGradient id="grassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#82d634" />
                <stop offset="50%" stopColor="#56a022" />
                <stop offset="100%" stopColor="#3b7216" />
              </linearGradient>
              <filter id="voxelShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="8" stdDeviation="4" floodColor="#000" floodOpacity="0.9" />
              </filter>
            </defs>

            {/* Back 3D extruded shadow */}
            <text
              x="300"
              y="74"
              textAnchor="middle"
              fill="#181818"
              fontSize="68"
              fontWeight="900"
              letterSpacing="3"
              filter="url(#voxelShadow)"
              fontFamily="monospace, sans-serif"
            >
              VOXELCRAFT
            </text>

            {/* Main Stone Title */}
            <text
              x="300"
              y="68"
              textAnchor="middle"
              fill="url(#stoneGrad)"
              stroke="#222222"
              strokeWidth="4"
              fontSize="68"
              fontWeight="900"
              letterSpacing="3"
              fontFamily="monospace, sans-serif"
            >
              VOXELCRAFT
            </text>

            {/* 3D Gold Accent Badge */}
            <g transform="translate(450, 68) rotate(-14)">
              <rect
                x="-40"
                y="-18"
                width="80"
                height="32"
                fill="#ffd700"
                stroke="#8b6508"
                strokeWidth="2.5"
                rx="3"
              />
              <text
                x="0"
                y="5"
                textAnchor="middle"
                fill="#3a2500"
                fontSize="20"
                fontWeight="900"
                fontFamily="monospace, sans-serif"
              >
                3D
              </text>
            </g>
          </svg>

          {/* Subtitle splash phrase (like Minecraft yellow splash texts!) */}
          <div className="mt-2 text-xs sm:text-sm text-yellow-300 font-bold tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] animate-pulse">
            ★ ¡Construye, destruye, explora y sobrevive! ★
          </div>
        </div>

        {/* Action Buttons Menu */}
        <div className="flex flex-col gap-3 w-full max-w-xs">
          {/* Main Start CTA */}
          <button
            onClick={() => {
              sound.playClick();
              onStartGame();
            }}
            className="group relative w-full py-3.5 px-6 bg-gradient-to-b from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 border-2 border-emerald-400 text-white font-bold text-base tracking-wider uppercase transition shadow-2xl active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5 fill-white group-hover:scale-110 transition-transform" />
            <span>JUGAR MUNDO</span>
          </button>

          {/* Game Mode Selector Button */}
          <button
            onClick={() => {
              sound.playClick();
              onToggleMode();
            }}
            className="w-full py-2.5 px-4 bg-neutral-900/90 hover:bg-neutral-800 border-2 border-neutral-600 text-neutral-200 font-bold text-xs tracking-wide transition flex items-center justify-between cursor-pointer active:translate-y-0.5"
          >
            <span className="text-neutral-400">Modo de Juego:</span>
            <span className="flex items-center gap-1.5 text-amber-300">
              {mode === 'creative' ? (
                <>
                  <Feather className="w-3.5 h-3.5 text-sky-400" />
                  Creativo (Volar)
                </>
              ) : (
                <>
                  <Shield className="w-3.5 h-3.5 text-red-400" />
                  Supervivencia
                </>
              )}
            </span>
          </button>

          {/* Generate New Seed Button */}
          <button
            onClick={() => {
              sound.playClick();
              onNewWorld();
            }}
            className="w-full py-2.5 px-4 bg-neutral-900/90 hover:bg-neutral-800 border-2 border-neutral-600 text-neutral-300 font-bold text-xs tracking-wide transition flex items-center justify-center gap-2 cursor-pointer active:translate-y-0.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Generar Nuevo Mundo</span>
          </button>
        </div>
      </div>

      {/* Bottom Flat Control Hint Line */}
      <div className="text-xs text-neutral-300/90 bg-neutral-950/80 border border-neutral-800 px-4 py-1.5 text-center shadow-lg">
        <span className="text-amber-400 font-bold">Enter / Espacio</span> Iniciar ·{' '}
        <span className="text-emerald-400 font-bold">WASD</span> Moverse ·{' '}
        <span className="text-emerald-400 font-bold">Espacio</span> Saltar ·{' '}
        <span className="text-emerald-400 font-bold">Click Izq</span> Romper ·{' '}
        <span className="text-emerald-400 font-bold">Click Der</span> Colocar ·{' '}
        <span className="text-emerald-400 font-bold">E</span> Bloques
      </div>
    </div>
  );
};
