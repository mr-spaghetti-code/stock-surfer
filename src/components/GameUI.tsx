import { useState, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import PriceDisplay from './PriceDisplay';
import { PriceData } from './PriceFeed';
import { VolatilityData } from '../utils/priceUtils';

interface GameUIProps {
  gameState: 'start' | 'playing' | 'gameover';
  score: number;
  onStartGame: () => void;
  onRestartGame: () => void;
  priceData: PriceData | null;
  volatilityData: VolatilityData;
  difficultyMultiplier: number;
  readyToStart: boolean;
  requiredSamples: number;
}

const GameUI = ({
  gameState,
  score,
  onStartGame,
  onRestartGame,
  priceData,
  volatilityData,
  difficultyMultiplier,
  readyToStart,
  requiredSamples,
}: GameUIProps) => {
  const { viewport } = useThree();

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.code === 'Space' && gameState === 'start' && readyToStart) {
        onStartGame();
      }
    };

    globalThis.window.addEventListener('keydown', handleKeyDown);
    return () => {
      globalThis.window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState, onStartGame, readyToStart]);

  // Start screen
  if (gameState === 'start') {
    return (
      <group position={[0, 0, 0]}>
        <Text
          position={[0, 2, 0]}
          fontSize={1}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          SPACE SURFER
        </Text>

        {readyToStart ? (
          <Text
            position={[0, 0, 0]}
            fontSize={0.5}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            Press SPACE to start
          </Text>
        ) : (
          <Text
            position={[0, 0, 0]}
            fontSize={0.5}
            color="#aaaaaa"
            anchorX="center"
            anchorY="middle"
          >
            Collecting price data... ({volatilityData.priceHistory.length}/
            {requiredSamples})
          </Text>
        )}

        {/* Display difficulty info */}
        <Text
          position={[0, -1, 0]}
          fontSize={0.3}
          color="#ffaa00"
          anchorX="center"
          anchorY="middle"
        >
          Difficulty: {difficultyMultiplier.toFixed(2)}x
        </Text>

        <Text
          position={[0, -1.5, 0]}
          fontSize={0.3}
          color="#ffaa00"
          anchorX="center"
          anchorY="middle"
        >
          Market Volatility: {(volatilityData.volatility * 100).toFixed(1)}%
        </Text>

        <PriceDisplay priceData={priceData} volatilityData={volatilityData} />
      </group>
    );
  }

  // Game over screen
  if (gameState === 'gameover') {
    return (
      <group position={[0, 0, 0]}>
        <Text
          position={[0, 2, 0]}
          fontSize={1}
          color="#ff0000"
          anchorX="center"
          anchorY="middle"
        >
          GAME OVER
        </Text>
        <Text
          position={[0, 0.5, 0]}
          fontSize={0.5}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          Final Score: {score}
        </Text>
        <Text
          position={[0, -0.2, 0]}
          fontSize={0.3}
          color="#ffaa00"
          anchorX="center"
          anchorY="middle"
        >
          Difficulty: {difficultyMultiplier.toFixed(2)}x
        </Text>
        <group position={[0, -1, 0]} onClick={onRestartGame}>
          <mesh>
            <planeGeometry args={[3, 1]} />
            <meshBasicMaterial color="#3366ff" />
          </mesh>
          <Text
            position={[0, 0, 0.1]}
            fontSize={0.4}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            Try Again
          </Text>
        </group>
        <PriceDisplay priceData={priceData} volatilityData={volatilityData} />
      </group>
    );
  }

  // In-game UI (score and difficulty)
  return (
    <>
      <Text
        position={[-viewport.width / 2 + 2, viewport.height / 2 - 1, 0]}
        fontSize={0.5}
        color="#ffffff"
        anchorX="left"
        anchorY="top"
      >
        Score: {score}
      </Text>
      <Text
        position={[-viewport.width / 2 + 2, viewport.height / 2 - 1.8, 0]}
        fontSize={0.3}
        color="#ffaa00"
        anchorX="left"
        anchorY="top"
      >
        Difficulty: {difficultyMultiplier.toFixed(2)}x
      </Text>
      <PriceDisplay priceData={priceData} volatilityData={volatilityData} />
    </>
  );
};

export default GameUI;
