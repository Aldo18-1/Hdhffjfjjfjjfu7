import React, { useEffect, useRef, useState } from 'react';
import { GameEngine, GameStateMode } from './engine/game';
import { BlockType, GameMode, PlayerStats, ToolType } from './types/game';
import { TitleScreen } from './components/TitleScreen';
import { HUD } from './components/HUD';
import { InventoryModal } from './components/InventoryModal';
import { PauseModal } from './components/PauseModal';
import { TouchControls } from './components/TouchControls';
import { sound } from './engine/audio';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // React state synced with engine
  const [gameState, setGameState] = useState<GameStateMode>('title');
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [activeSlot, setActiveSlot] = useState(0);
  const [hotbar, setHotbar] = useState<{ blockType?: BlockType; toolType?: ToolType; name: string }[]>([]);
  const [gameMode, setGameMode] = useState<GameMode>('creative');
  const [isMuted, setIsMuted] = useState(false);
  const [seed, setSeed] = useState(1337);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Detect touch capability
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      setIsTouchDevice(true);
    }

    if (!mountRef.current) return;

    // Instantiate game engine
    const engine = new GameEngine(mountRef.current);
    engineRef.current = engine;
    setHotbar([...engine.hotbarItems]);
    setSeed(engine.world.seed);

    // Callbacks
    engine.onStatsUpdate = (newStats) => {
      setStats(newStats);
    };

    engine.onStateChange = (newState) => {
      setGameState(newState);
    };

    engine.onHotbarChange = (slot) => {
      setActiveSlot(slot);
      setHotbar([...engine.hotbarItems]);
    };

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  const handleStartGame = () => {
    if (engineRef.current) {
      engineRef.current.setState('playing');
    }
  };

  const handleNewWorld = () => {
    if (engineRef.current) {
      const newSeed = Math.floor(Math.random() * 900000) + 100000;
      engineRef.current.resetWorld(newSeed);
      setSeed(newSeed);
    }
  };

  const handleToggleMode = () => {
    if (engineRef.current) {
      const nextMode = gameMode === 'creative' ? 'survival' : 'creative';
      setGameMode(nextMode);
      engineRef.current.creativeMode = nextMode === 'creative';
      if (nextMode === 'survival') {
        engineRef.current.physics.isFlying = false;
      }
    }
  };

  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const handleSelectSlot = (slot: number) => {
    if (engineRef.current) {
      engineRef.current.setActiveSlot(slot);
    }
  };

  const handleSetHotbarSlot = (
    slot: number,
    item: { blockType?: BlockType; toolType?: ToolType; name: string }
  ) => {
    if (engineRef.current) {
      engineRef.current.setSlotItem(slot, item);
      setHotbar([...engineRef.current.hotbarItems]);
    }
  };

  const handleSetTimeOfDay = (time: number) => {
    if (engineRef.current) {
      engineRef.current.timeOfDay = time;
    }
  };

  const handleToggleFly = () => {
    if (engineRef.current && engineRef.current.creativeMode) {
      engineRef.current.physics.isFlying = !engineRef.current.physics.isFlying;
      engineRef.current.physics.velocity.set(0, 0, 0);
      sound.playJump();
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* Isolated WebGL canvas container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-crosshair" />

      {/* Title Screen Overlay */}
      {gameState === 'title' && (
        <TitleScreen
          onStartGame={handleStartGame}
          onNewWorld={handleNewWorld}
          mode={gameMode}
          onToggleMode={handleToggleMode}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          seed={seed}
        />
      )}

      {/* Playing HUD Overlay */}
      {gameState === 'playing' && (
        <>
          <HUD
            stats={stats}
            hotbar={hotbar}
            activeSlot={activeSlot}
            onSelectSlot={handleSelectSlot}
            onOpenInventory={() => engineRef.current?.setState('inventory')}
            onOpenPause={() => engineRef.current?.setState('paused')}
            onToggleFly={handleToggleFly}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
          />

          {isTouchDevice && (
            <TouchControls
              onMove={(fwd, rgt) => {
                if (engineRef.current) {
                  // Simulate key inputs
                  (engineRef.current as any).keys['KeyW'] = fwd > 0;
                  (engineRef.current as any).keys['KeyS'] = fwd < 0;
                  (engineRef.current as any).keys['KeyD'] = rgt > 0;
                  (engineRef.current as any).keys['KeyA'] = rgt < 0;
                }
              }}
              onJump={(jumping) => {
                if (engineRef.current) {
                  (engineRef.current as any).keys['Space'] = jumping;
                }
              }}
              onBreak={() => engineRef.current?.breakTargetBlock()}
              onPlace={() => engineRef.current?.placeActiveBlock()}
            />
          )}
        </>
      )}

      {/* Inventory Modal */}
      {gameState === 'inventory' && (
        <InventoryModal
          onClose={() => engineRef.current?.setState('playing')}
          activeSlot={activeSlot}
          hotbar={hotbar}
          onSetHotbarSlot={handleSetHotbarSlot}
          onSetTimeOfDay={handleSetTimeOfDay}
          isFlying={stats?.isFlying || false}
          onToggleFly={handleToggleFly}
        />
      )}

      {/* Pause Menu Modal */}
      {gameState === 'paused' && (
        <PauseModal
          onResume={() => engineRef.current?.setState('playing')}
          onResetWorld={handleNewWorld}
          mode={gameMode}
          onToggleMode={handleToggleMode}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onBackToTitle={() => engineRef.current?.setState('title')}
        />
      )}
    </div>
  );
}
