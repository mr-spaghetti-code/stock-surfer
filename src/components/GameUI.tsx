import { useState, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';

interface GameUIProps {
  gameState: 'start' | 'playing' | 'gameover';
  score: number;
  onStartGame: () => void;
  onRestartGame: () => void;
}

const GameUI = ({
  gameState,
  score,
  onStartGame,
  onRestartGame,
}: GameUIProps) => {
  const { viewport } = useThree();
  const [spacePressed, setSpacePressed] = useState(false);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && gameState === 'start') {
        setSpacePressed(true);
        onStartGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState, onStartGame]);

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
        <Text
          position={[0, 0, 0]}
          fontSize={0.5}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          Press SPACE to start
        </Text>
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
      </group>
    );
  }

  // In-game UI (score)
  return (
    <Text
      position={[-viewport.width / 2 + 2, viewport.height / 2 - 1, 0]}
      fontSize={0.5}
      color="#ffffff"
      anchorX="left"
      anchorY="top"
    >
      Score: {score}
    </Text>
  );
};

export default GameUI;
