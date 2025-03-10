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
// SkyboxSphere is not used, so commenting it out
// import SkyboxSphere from './components/SkyboxSphere';
import PsychedelicSphere from './components/PsychedelicSphere';
import CyberpunkEffects from './components/CyberpunkEffects';
import NeonGrid from './components/NeonGrid';
import PriceDataProvider, { PriceData } from './components/PriceFeed';
import InstructionsPage from './components/InstructionsPage';
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
import { Asset, AVAILABLE_ASSETS } from './components/AssetSelector';

useGLTF.preload('/models/ship.gltf');

const GameScene = () => {
  // Game state
  const [gameState, setGameState] = useState<
    'start' | 'instructions' | 'playing' | 'gameover'
  >('start');
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const lastUpdateTimeRef = useRef(0);

  // Price data state
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset>(
    AVAILABLE_ASSETS[0],
  ); // Default to first asset (AAPL)
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
  const floorProximityBonusRef = useRef<number>(0);

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
  const {
    terrainSpeed: initialTerrainSpeed,
    boxCount,
    terrainDepth,
  } = useControls('Terrain', {
    terrainSpeed: { value: 15, min: 5, max: 30, step: 1 },
    boxCount: { value: 150, min: 50, max: 300, step: 10 },
    terrainDepth: { value: 120, min: 50, max: 200, step: 10 },
  });

  // State to track the current terrain speed (can be modified by price changes)
  const [terrainSpeed, setTerrainSpeed] = useState(initialTerrainSpeed);
  const lastPriceRef = useRef<number | null>(null);

  // Min and max terrain speed limits
  const MIN_TERRAIN_SPEED = 5;
  const MAX_TERRAIN_SPEED = 30;
  const SPEED_CHANGE_FACTOR = 0.5; // How much to change speed on price change

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

      // Adjust terrain speed based on price changes
      if (gameState === 'playing' && lastPriceRef.current !== null) {
        // Check if price increased or decreased
        const priceIncreased = priceData.price > lastPriceRef.current;
        const priceDecreased = priceData.price < lastPriceRef.current;

        // Adjust speed based on price change direction
        if (priceIncreased) {
          // Slow down when price increases
          setTerrainSpeed((prevSpeed) =>
            Math.max(MIN_TERRAIN_SPEED, prevSpeed - SPEED_CHANGE_FACTOR),
          );
        } else if (priceDecreased) {
          // Speed up when price decreases
          setTerrainSpeed((prevSpeed) =>
            Math.min(MAX_TERRAIN_SPEED, prevSpeed + SPEED_CHANGE_FACTOR),
          );
        }
      }

      // Update last price reference
      lastPriceRef.current = priceData.price;
    }
  }, [
    priceData,
    requiredPriceSamples,
    readyToStart,
    updateDifficulty,
    gameState,
  ]);

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
          const baseScoreIncrement = Math.floor(
            (effectiveTerrainSpeed * deltaTime) / 100,
          );

          // Apply floor proximity bonus if available
          const bonusMultiplier = 1 + floorProximityBonusRef.current;
          const totalScoreIncrement = Math.floor(
            baseScoreIncrement * bonusMultiplier,
          );

          scoreRef.current += totalScoreIncrement;
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

  // Auto-advance to instructions when data is ready
  useEffect(() => {
    if (readyToStart && gameState === 'start') {
      // Short delay before transitioning to instructions
      const timer = setTimeout(() => {
        setGameState('instructions');
      }, 500); // 500ms delay for a smooth transition

      return () => clearTimeout(timer);
    }
  }, [readyToStart, gameState]);

  // Handle price updates
  const handlePriceUpdate = (newPriceData: PriceData) => {
    setPriceData(newPriceData);
  };

  // Handle asset selection
  const handleAssetSelect = (asset: Asset) => {
    setSelectedAsset(asset);
    console.log(`Selected asset: ${asset.name} (${asset.id})`);
    // Reset price data when changing assets
    setPriceData(null);
  };

  // Game control functions
  const handleStartGame = () => {
    // Instead of starting the game, show instructions first
    setGameState('instructions');
  };

  const handleEnterGame = () => {
    // Only allow starting if we have enough price data
    if (readyToStart) {
      setGameState('playing');
      scoreRef.current = 0;
      setScore(0);
      lastUpdateTimeRef.current = Date.now();

      // Reset terrain speed to initial value
      setTerrainSpeed(initialTerrainSpeed);

      // Reset floor proximity bonus
      floorProximityBonusRef.current = 0;
    }
  };

  const handleRestartGame = () => {
    // Only allow restarting if we have enough price data
    if (readyToStart) {
      // Reset explosion state
      setShowExplosion(false);

      // First set to gameover (if not already) to ensure the terrain reset logic triggers
      // when we transition to playing state
      setGameState('gameover');

      // Use setTimeout to ensure state update has time to process
      setTimeout(() => {
        // Reset game state
        setGameState('playing');

        // Reset score
        scoreRef.current = 0;
        setScore(0);

        // Reset time tracking
        lastUpdateTimeRef.current = Date.now();

        // Reset volatility data
        const initialVolatilityData = initVolatilityData();
        setVolatilityData(initialVolatilityData);
        volatilityDataRef.current = initialVolatilityData;

        // Reset difficulty
        setDifficultyMultiplier(1.0);

        // Reset terrain speed to initial value
        setTerrainSpeed(initialTerrainSpeed);

        // Reset ship position (the actual position will be set by the SpaceFighter component)
        shipPositionRef.current = [0, 0, 0];
        floorProximityBonusRef.current = 0;

        console.log('Game completely reset - terrain should be regenerated');
      }, 50); // Short delay to ensure state updates properly
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

  const updateShipPosition = (
    position: [number, number, number],
    floorProximityBonus: number = 0,
  ) => {
    shipPositionRef.current = position;
    floorProximityBonusRef.current = floorProximityBonus;
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
      <PriceDataProvider
        onPriceUpdate={handlePriceUpdate}
        assetId={selectedAsset.id}
      />

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

        {/* Psychedelic background sphere */}
        <PsychedelicSphere
          radius={500}
          speed={0.3}
          scale={1.5}
          intensity={0.4}
          color1="#ff00ff"
          color2="#00ffff"
          color3="#2200ff"
          priceTrend={
            priceData
              ? Math.min(Math.max(priceData.priceChangePercent / 5, -1), 1)
              : 0
          }
        />

        {/* Neon grid for cyberpunk aesthetic */}
        <NeonGrid size={100} divisions={30} color="#00ffff" />

        {/* Main camera - positioned behind and above the ship */}
        <PerspectiveCamera
          makeDefault
          position={[0, 2, 15]}
          fov={75}
          near={0.1}
          far={1000}
        />

        <Physics gravity={[0, -9.8, 0]} timeStep="vary" interpolate={true}>
          <EndlessTerrain
            speed={effectiveTerrainSpeed}
            boxCount={boxCount}
            depth={terrainDepth}
            priceData={priceData}
            volatilityScalar={10.0}
            gameState={gameState}
          />
          <Suspense fallback={null}>
            {/* Only show the ship when the game is in playing state */}
            {gameState === 'playing' && !showExplosion && (
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
          {gameState === 'instructions' ? (
            <InstructionsPage
              onEnterGame={handleEnterGame}
              onAssetSelect={handleAssetSelect}
              selectedAssetId={selectedAsset.id}
            />
          ) : (
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
              assetName={selectedAsset.name}
              floorProximityBonus={floorProximityBonusRef.current}
              terrainSpeed={terrainSpeed}
            />
          )}
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

        {/* Post-processing effects - only add when game has started */}
        {gameState === 'playing' && (
          <CyberpunkEffects
            bloomIntensity={1.8}
            noiseOpacity={0.12}
            vignetteIntensity={0.6}
            chromaticAberrationOffset={0.001}
          />
        )}
      </Canvas>
    </div>
  );
};

export default GameScene;
