import { Physics } from '@react-three/rapier';
import {
  Stats,
  useGLTF,
  OrbitControls,
  PerspectiveCamera,
  Environment,
} from '@react-three/drei';
import SpaceFighter from './components/SpaceFighter';
import EndlessTerrain from './components/EndlessTerrain';
import GameUI from './components/GameUI';
import Explosion from './components/Explosion';
import PriceDataProvider, { PriceData } from './components/PriceFeed';
import { useControls } from 'leva';
import { Canvas } from '@react-three/fiber';
import {
  Suspense,
  useState,
  KeyboardEvent,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import * as THREE from 'three';
import {
  VolatilityData,
  initVolatilityData,
  updateVolatilityData,
  calculateDifficultyMultiplier,
} from './utils/priceUtils';

useGLTF.preload('/models/ship.gltf');

const GameScene = () => {
  // Game state
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>(
    'start',
  );
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const lastUpdateTimeRef = useRef(0);

  // Price data state
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [volatilityData, setVolatilityData] = useState<VolatilityData>(
    initVolatilityData(),
  );
  const [difficultyMultiplier, setDifficultyMultiplier] = useState(1.0);
  const [readyToStart, setReadyToStart] = useState(false);
  const requiredPriceSamples = 15;

  // Use refs to prevent circular dependencies in useEffect
  const volatilityDataRef = useRef<VolatilityData>(initVolatilityData());

  // Explosion state
  const [showExplosion, setShowExplosion] = useState(false);
  const [explosionPosition, setExplosionPosition] = useState<
    [number, number, number]
  >([0, 0, 0]);
  const shipPositionRef = useRef<[number, number, number]>([0, 0, 0]);

  // Environment controls
  const { intensity, fogDensity } = useControls('Environment', {
    intensity: {
      value: 0.4,
      min: 0,
      max: 2,
      step: 0.1,
    },
    fogDensity: {
      value: 0.03,
      min: 0,
      max: 0.1,
      step: 0.005,
    },
  });

  // Ship rotation controls
  const { rotationX, rotationY, rotationZ } = useControls('Ship Rotation', {
    rotationX: { value: -Math.PI / 2, min: -Math.PI, max: Math.PI, step: 0.01 },
    rotationY: { value: Math.PI, min: -Math.PI, max: Math.PI, step: 0.01 },
    rotationZ: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
  });

  // Terrain controls
  const { terrainSpeed, boxCount, terrainDepth } = useControls('Terrain', {
    terrainSpeed: { value: 15, min: 5, max: 30, step: 1 },
    boxCount: { value: 150, min: 50, max: 300, step: 10 },
    terrainDepth: { value: 120, min: 50, max: 200, step: 10 },
  });

  // Difficulty controls
  const { baseDifficulty, maxDifficultyMultiplier } = useControls(
    'Difficulty',
    {
      baseDifficulty: { value: 1.0, min: 0.5, max: 2.0, step: 0.1 },
      maxDifficultyMultiplier: { value: 2.0, min: 1.0, max: 3.0, step: 0.1 },
    },
  );

  // Toggle for orbit controls (for debugging)
  const [useOrbitControls, setUseOrbitControls] = useState(false);

  // Memoized function to update difficulty
  const updateDifficulty = useCallback(
    (volatilityValue: number) => {
      const newDifficultyMultiplier = calculateDifficultyMultiplier(
        volatilityValue,
        baseDifficulty,
        maxDifficultyMultiplier,
      );
      setDifficultyMultiplier(newDifficultyMultiplier);
    },
    [baseDifficulty, maxDifficultyMultiplier],
  );

  // Update volatility data when price changes
  useEffect(() => {
    if (priceData) {
      // Use the ref value to avoid dependency on volatilityData state
      const updatedVolatilityData = updateVolatilityData(
        volatilityDataRef.current,
        priceData.price,
        requiredPriceSamples,
      );

      // Update the ref first
      volatilityDataRef.current = updatedVolatilityData;

      // Then update the state (this won't trigger another effect run)
      setVolatilityData(updatedVolatilityData);

      // Update difficulty multiplier based on volatility
      updateDifficulty(updatedVolatilityData.volatility);

      // Set readyToStart when we have enough price samples
      if (updatedVolatilityData.isReady && !readyToStart) {
        setReadyToStart(true);
      }
    }
  }, [priceData, requiredPriceSamples, readyToStart, updateDifficulty]);

  // Calculate effective game speed based on difficulty multiplier
  const effectiveTerrainSpeed =
    terrainSpeed * (gameState === 'playing' ? difficultyMultiplier : 0);

  // Update score based on time played
  useEffect(() => {
    if (gameState !== 'playing') return;

    let animationFrameId: number;
    let lastTime = Date.now();

    const updateScore = () => {
      if (gameState === 'playing') {
        const now = Date.now();
        const deltaTime = now - lastTime;

        // Update score based on time and terrain speed
        if (deltaTime > 0) {
          // Increment score based on terrain speed and difficulty multiplier
          // Higher difficulty = higher score potential
          const scoreIncrement = Math.floor(
            (effectiveTerrainSpeed * deltaTime) / 100,
          );
          scoreRef.current += scoreIncrement;
          setScore(scoreRef.current);
        }

        lastTime = now;
        animationFrameId = globalThis.window.requestAnimationFrame(updateScore);
      }
    };

    // Start the animation frame loop
    lastTime = Date.now();
    animationFrameId = globalThis.window.requestAnimationFrame(updateScore);

    // Clean up animation frame on unmount or when game state changes
    return () => {
      if (animationFrameId) {
        globalThis.window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [gameState, effectiveTerrainSpeed]);

  // Handle price updates
  const handlePriceUpdate = (newPriceData: PriceData) => {
    setPriceData(newPriceData);
  };

  // Game control functions
  const handleStartGame = () => {
    // Only allow starting if we have enough price data
    if (readyToStart) {
      setGameState('playing');
      scoreRef.current = 0;
      setScore(0);
      lastUpdateTimeRef.current = Date.now();
    }
  };

  const handleRestartGame = () => {
    // Only allow restarting if we have enough price data
    if (readyToStart) {
      setShowExplosion(false);
      setGameState('playing');
      scoreRef.current = 0;
      setScore(0);
      lastUpdateTimeRef.current = Date.now();
    }
  };

  const handleCollision = () => {
    if (gameState === 'playing') {
      // Show explosion at the ship's current position
      setExplosionPosition(shipPositionRef.current);
      setShowExplosion(true);
      setGameState('gameover');
    }
  };

  const handleExplosionComplete = () => {
    // Optional: You can add additional logic here after the explosion animation completes
  };

  const updateShipPosition = (position: [number, number, number]) => {
    shipPositionRef.current = position;
  };

  // Toggle orbit controls with 'O' key
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'o' || e.key === 'O') {
      setUseOrbitControls(!useOrbitControls);
    }
  };

  return (
    <div
      style={{ width: '100vw', height: '100vh', background: '#000' }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Price Data Provider */}
      <PriceDataProvider onPriceUpdate={handlePriceUpdate} />

      <Canvas
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
        }}
        shadows
      >
        {/* Scene lighting */}
        <ambientLight intensity={intensity} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />

        {/* Add fog for depth perception */}
        <fog attach="fog" args={['#050a30', 10, 100 * fogDensity]} />
        <Environment preset="night" />

        {/* Main camera - positioned behind and above the ship */}
        <PerspectiveCamera
          makeDefault
          position={[0, 2, 15]}
          fov={75}
          near={0.1}
          far={1000}
        />

        <Physics
          debug={false}
          timeStep="vary"
          gravity={gameState === 'start' ? [0, 0, 0] : [0, -9.8, 0]}
        >
          <EndlessTerrain
            speed={effectiveTerrainSpeed}
            boxCount={boxCount}
            depth={terrainDepth}
          />
          <Suspense fallback={null}>
            {/* Only show the ship if not showing explosion or not in gameover state */}
            {(!showExplosion || gameState !== 'gameover') && (
              <SpaceFighter
                rotation={[rotationX, rotationY, rotationZ]}
                gameState={gameState}
                onCollision={handleCollision}
                onPositionUpdate={updateShipPosition}
              />
            )}
          </Suspense>
        </Physics>

        {/* Explosion effect */}
        {showExplosion && (
          <Explosion
            position={explosionPosition}
            onComplete={handleExplosionComplete}
          />
        )}

        {/* Game UI */}
        <Suspense fallback={null}>
          <GameUI
            gameState={gameState}
            score={score}
            onStartGame={handleStartGame}
            onRestartGame={handleRestartGame}
            priceData={priceData}
            volatilityData={volatilityData}
            difficultyMultiplier={difficultyMultiplier}
            readyToStart={readyToStart}
            requiredSamples={requiredPriceSamples}
          />
        </Suspense>

        {/* Optional orbit controls for debugging */}
        {useOrbitControls && (
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            makeDefault
          />
        )}

        <Stats />
      </Canvas>
    </div>
  );
};

export default GameScene;
