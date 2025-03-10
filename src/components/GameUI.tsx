import { useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import PriceDisplay from './PriceDisplay';
import { PriceData } from './PriceFeed';
import { VolatilityData } from '../utils/priceUtils';
import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface GameUIProps {
  gameState: 'start' | 'instructions' | 'playing' | 'gameover';
  score: number;
  onStartGame: () => void;
  onRestartGame: () => void;
  priceData: PriceData | null;
  volatilityData: VolatilityData;
  difficultyMultiplier: number;
  readyToStart: boolean;
  requiredSamples: number;
  assetName: string;
  floorProximityBonus?: number;
  terrainSpeed?: number;
}

const GameUI = ({
  gameState,
  score,
  onStartGame: _onStartGame,
  onRestartGame,
  priceData,
  volatilityData,
  difficultyMultiplier,
  readyToStart: _readyToStart,
  requiredSamples,
  assetName,
  floorProximityBonus = 0,
  terrainSpeed = 15,
}: GameUIProps) => {
  const { viewport } = useThree();
  const [buttonHovered, setButtonHovered] = useState(false);
  const buttonRef = useRef<THREE.Mesh>(null);
  const buttonGroupRef = useRef<THREE.Group>(null);

  // Create materials once
  const materials = useMemo(() => {
    return {
      darkPanel: new THREE.MeshBasicMaterial({
        color: '#000033',
        transparent: true,
        opacity: 0.8,
      }),
      progressBarBg: new THREE.MeshBasicMaterial({ color: '#222222' }),
      progressBarFill: new THREE.MeshBasicMaterial({ color: '#00ffff' }),
      headerPanel: new THREE.MeshBasicMaterial({
        color: '#000066',
        transparent: true,
        opacity: 0.9,
      }),
      contentPanel: new THREE.MeshBasicMaterial({
        color: '#000022',
        transparent: true,
        opacity: 0.85,
      }),
    };
  }, []);

  // Button materials
  const buttonMaterial = new THREE.MeshBasicMaterial({
    color: buttonHovered ? '#4477ff' : '#3366ff',
  });

  const buttonBorderMaterial = new THREE.MeshBasicMaterial({
    color: '#8899ff',
    transparent: true,
    opacity: 0.7,
  });

  // Animation for the button
  useFrame((state) => {
    if (gameState === 'gameover' && buttonGroupRef.current) {
      // Subtle floating animation for the button group
      const t = state.clock.getElapsedTime();
      buttonGroupRef.current.position.y = -2.5 + Math.sin(t * 1.5) * 0.05;

      // Pulse effect when hovered
      if (buttonHovered && buttonRef.current) {
        const scale = 1 + Math.sin(t * 8) * 0.05;
        buttonRef.current.scale.set(scale, scale, 1);
      } else if (buttonRef.current) {
        // Smooth transition back to normal size
        buttonRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
      }
    }
  });

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
          font="/fonts/Orbitron-SemiBold.ttf"
        >
          BTC SURFER
        </Text>

        {/* Progress Bar */}
        <group position={[0, 0, 0]}>
          {/* Progress Bar Background */}
          <mesh position={[0, 0, -0.01]} material={materials.progressBarBg}>
            <planeGeometry args={[4, 0.4]} />
          </mesh>

          {/* Progress Bar Fill */}
          <mesh
            position={[
              -2 + (volatilityData.priceHistory.length / requiredSamples) * 2,
              0,
              0,
            ]}
            material={materials.progressBarFill}
          >
            <planeGeometry
              args={[
                4 * (volatilityData.priceHistory.length / requiredSamples),
                0.4,
              ]}
            />
          </mesh>

          {/* Progress Text */}
          <Text
            position={[0, 0, 0.01]}
            fontSize={0.2}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            {`${volatilityData.priceHistory.length}/${requiredSamples}`}
          </Text>
        </group>

        <PriceDisplay
          priceData={priceData}
          volatilityData={volatilityData}
          assetName={assetName}
        />
      </group>
    );
  }

  // Game over screen
  if (gameState === 'gameover') {
    return (
      <group position={[0, 0, 0]}>
        {/* Main background panel */}
        <mesh position={[0, 0, -0.1]} material={materials.darkPanel}>
          <planeGeometry args={[viewport.width * 0.9, viewport.height * 0.9]} />
        </mesh>

        {/* Header Section */}
        <group position={[0, 3, 0]}>
          <mesh position={[0, 0, -0.05]} material={materials.headerPanel}>
            <planeGeometry args={[viewport.width * 0.8, 2.5]} />
          </mesh>
          <Text
            position={[0, 0, 0]}
            fontSize={1.2}
            color="#ff3333"
            anchorX="center"
            anchorY="middle"
            font="/fonts/Orbitron-SemiBold.ttf"
          >
            GAME OVER
          </Text>
        </group>

        {/* Score Section */}
        <group position={[0, 0.5, 0]}>
          <mesh position={[0, 0, -0.05]} material={materials.contentPanel}>
            <planeGeometry args={[viewport.width * 0.7, 3.5]} />
          </mesh>

          <Text
            position={[0, 1, 0]}
            fontSize={0.7}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            font="/fonts/Orbitron-Medium.ttf"
          >
            Final Score: {score}
          </Text>
        </group>

        {/* Try Again Button - using a group to keep button and text together */}
        <group ref={buttonGroupRef} position={[0, -2.5, 0]}>
          {/* Button border */}
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[5.2, 1.7]} />
            <primitive object={buttonBorderMaterial} attach="material" />
          </mesh>

          {/* Main button */}
          <mesh
            ref={buttonRef}
            onClick={onRestartGame}
            onPointerOver={() => setButtonHovered(true)}
            onPointerOut={() => setButtonHovered(false)}
            material={buttonMaterial}
          >
            <planeGeometry args={[5, 1.5]} />
          </mesh>
          <Text
            position={[0, 0, 0.1]}
            fontSize={0.6}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            font="/fonts/Orbitron-Medium.ttf"
          >
            TRY AGAIN
          </Text>
        </group>

        <PriceDisplay
          priceData={priceData}
          volatilityData={volatilityData}
          assetName={assetName}
        />
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
        font="/fonts/Orbitron-Medium.ttf"
      >
        Score: {score}
      </Text>

      {floorProximityBonus > 0 && (
        <Text
          position={[-viewport.width / 2 + 2, viewport.height / 2 - 2.6, 0]}
          fontSize={0.3}
          color="#ff5500"
          anchorX="left"
          anchorY="top"
        >
          Floor Bonus: +{(floorProximityBonus * 100).toFixed(0)}%
        </Text>
      )}
      <Text
        position={[-viewport.width / 2 + 2, viewport.height / 2 - 3.4, 0]}
        fontSize={0.3}
        color={priceData && priceData.priceChange < 0 ? '#ff3333' : '#33ff33'}
        anchorX="left"
        anchorY="top"
        font="/fonts/Orbitron-Medium.ttf"
      >
        Speed: {terrainSpeed.toFixed(1)}
      </Text>
      <PriceDisplay
        priceData={priceData}
        volatilityData={volatilityData}
        assetName={assetName}
      />
    </>
  );
};

export default GameUI;
