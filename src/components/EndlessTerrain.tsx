import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  RigidBody,
  CuboidCollider,
  RapierRigidBody,
} from '@react-three/rapier';
import * as THREE from 'three';
import { PriceData } from '../components/PriceFeed';
import { Grid } from '@react-three/drei';

interface EndlessTerrainProps {
  width?: number;
  depth?: number;
  boxCount?: number;
  speed?: number;
  priceData?: PriceData | null;
  volatilityScalar?: number;
  transparencyDistance?: number; // Maximum distance for transparency effect
  minOpacity?: number; // Minimum opacity for closest objects
  gameState?: 'start' | 'instructions' | 'playing' | 'gameover'; // Add gameState prop
}

interface BoxData {
  id: number;
  position: [number, number, number];
  scale: [number, number, number];
  color: THREE.Color;
  rotation: [number, number, number];
  opacity?: number; // Add opacity property
}

// Add these cyberpunk color options
const CYBERPUNK_COLORS = [
  new THREE.Color('#ff00ff'), // Magenta
  new THREE.Color('#00ffff'), // Cyan
  new THREE.Color('#ff3366'), // Neon pink
  new THREE.Color('#66ff33'), // Neon green
  new THREE.Color('#3366ff'), // Neon blue
  new THREE.Color('#ffff00'), // Yellow
];

const EndlessTerrain = ({
  width = 50,
  depth = 100,
  boxCount = 100,
  speed = 10,
  priceData = null,
  volatilityScalar = 5.0, // Default volatility scalar - higher values = more dramatic height changes
  transparencyDistance = 30, // Distance within which objects become transparent
  minOpacity = 0.4, // Minimum opacity for closest objects
  gameState = 'start', // Default to start state
}: EndlessTerrainProps) => {
  const terrainRef = useRef<THREE.Group>(null);
  const boxRefs = useRef<(THREE.Mesh | null)[]>([]);
  const rigidBodyRefs = useRef<(RapierRigidBody | null)[]>([]);
  const floorRef = useRef<THREE.Mesh>(null);
  const gridRef = useRef<THREE.Group>(null);
  const [boxes, setBoxes] = useState<BoxData[]>([]);
  const lastPriceRef = useRef<number | null>(null);
  const heightMultiplierRef = useRef<number>(1);
  // Store material refs to update opacity
  const materialRefs = useRef<(THREE.Material | null)[]>([]);

  // Previous game state ref to detect changes
  const prevGameStateRef = useRef<string>(gameState);

  // Handle game state transitions
  useEffect(() => {
    // Clear terrain when transitioning to gameover
    if (prevGameStateRef.current === 'playing' && gameState === 'gameover') {
      console.log('Clearing terrain for gameover state');

      // Move all boxes far away from the player's view
      const clearedBoxes = boxes.map((box) => ({
        ...box,
        position: [box.position[0], box.position[1], -depth * 10] as [
          number,
          number,
          number,
        ],
      }));

      setBoxes(clearedBoxes);
    }
    // Reset terrain when transitioning from gameover to playing
    // or when the game state is set to playing after being in gameover
    else if (
      (prevGameStateRef.current === 'gameover' && gameState === 'playing') ||
      (gameState === 'playing' &&
        boxes.length > 0 &&
        boxes[0].position[2] < -depth)
    ) {
      console.log('Resetting terrain for playing state');

      // Reset height multiplier
      heightMultiplierRef.current = 1;

      // Reset boxes to initial positions
      const items: BoxData[] = [];
      const halfWidth = width / 2;

      for (let i = 0; i < boxCount; i++) {
        // Vary the box size
        const boxWidth = Math.random() * 4 + 1; // Between 1 and 5
        const boxDepth = Math.random() * 4 + 1; // Between 1 and 5
        const height = Math.random() * 5 + 0.5; // Between 0.5 and 5.5

        // Create clusters of boxes
        const clusterFactor = Math.random() > 0.7 ? 0.2 : 1;
        const x = (Math.random() * width - halfWidth) * clusterFactor;

        // Distribute boxes throughout the depth
        const z = Math.random() * depth - depth;

        // Use cyberpunk colors
        const colorIndex = Math.floor(Math.random() * CYBERPUNK_COLORS.length);
        const color = CYBERPUNK_COLORS[colorIndex].clone();

        // Add slight variation to the color
        const colorVariation = (Math.random() - 0.5) * 0.2;
        color.r += colorVariation;
        color.g += colorVariation;
        color.b += colorVariation;

        items.push({
          id: i,
          position: [x, -8 + height / 2, z] as [number, number, number],
          scale: [boxWidth, height, boxDepth] as [number, number, number],
          color,
          opacity: 1.0, // Start with full opacity
          // Add some rotation for more visual interest
          rotation: [0, Math.random() * Math.PI * 0.1, 0] as [
            number,
            number,
            number,
          ],
        });
      }

      // Reset refs
      boxRefs.current = Array(items.length).fill(null);
      rigidBodyRefs.current = Array(items.length).fill(null);
      materialRefs.current = Array(items.length).fill(null);

      setBoxes(items);
      console.log(`Terrain reset complete: ${items.length} boxes generated`);
    }

    // Update previous game state
    prevGameStateRef.current = gameState;
  }, [gameState, width, depth, boxCount, boxes]);

  // Update height multiplier when price data changes
  useEffect(() => {
    if (priceData && priceData.previousPrice) {
      // Calculate absolute price change percentage
      const priceChangePercent = Math.abs(priceData.priceChangePercent);

      // Apply volatility scalar to make changes more dramatic
      const scaledPriceChange = priceChangePercent * volatilityScalar * 50;

      // Scale the height multiplier based on price change
      // Small changes will have minimal effect
      // Medium changes will have moderate effect
      // Large changes will have significant effect
      if (scaledPriceChange > 2.5) {
        // Large price change
        heightMultiplierRef.current = 1.5 + Math.min(scaledPriceChange, 10);
        console.log(
          `Large price change: ${priceChangePercent}% -> Height multiplier: ${heightMultiplierRef.current}`,
        );
      } else if (scaledPriceChange > 0.5) {
        // Medium price change
        heightMultiplierRef.current = 1.2 + scaledPriceChange * 0.6;
        console.log(
          `Medium price change: ${priceChangePercent}% -> Height multiplier: ${heightMultiplierRef.current}`,
        );
      } else {
        // Small price change
        heightMultiplierRef.current = 1 + scaledPriceChange * 2;
        console.log(
          `Small price change: ${priceChangePercent}% -> Height multiplier: ${heightMultiplierRef.current}`,
        );
      }

      // Store the current price for future reference
      lastPriceRef.current = priceData.price;
    }
  }, [priceData, volatilityScalar]);

  // Generate initial boxes with random heights, sizes, and colors
  useMemo(() => {
    const items: BoxData[] = [];
    const halfWidth = width / 2;

    for (let i = 0; i < boxCount; i++) {
      // Vary the box size
      const boxWidth = Math.random() * 4 + 1; // Between 1 and 5
      const boxDepth = Math.random() * 4 + 1; // Between 1 and 5
      const height = Math.random() * 5 + 0.5; // Between 0.5 and 5.5

      // Create clusters of boxes
      const clusterFactor = Math.random() > 0.7 ? 0.2 : 1;
      const x = (Math.random() * width - halfWidth) * clusterFactor;

      // Distribute boxes throughout the depth
      const z = Math.random() * depth - depth;

      // Use cyberpunk colors instead of random colors
      const colorIndex = Math.floor(Math.random() * CYBERPUNK_COLORS.length);
      const color = CYBERPUNK_COLORS[colorIndex].clone();

      // Add slight variation to the color
      const colorVariation = (Math.random() - 0.5) * 0.2;
      color.r += colorVariation;
      color.g += colorVariation;
      color.b += colorVariation;

      items.push({
        id: i,
        position: [x, -8 + height / 2, z] as [number, number, number],
        scale: [boxWidth, height, boxDepth] as [number, number, number],
        color,
        opacity: 1.0, // Start with full opacity
        // Add some rotation for more visual interest
        rotation: [0, Math.random() * Math.PI * 0.1, 0] as [
          number,
          number,
          number,
        ],
      });
    }

    setBoxes(items);
    boxRefs.current = Array(items.length).fill(null);
    rigidBodyRefs.current = Array(items.length).fill(null);
    materialRefs.current = Array(items.length).fill(null);
  }, [width, depth, boxCount]);

  // Move the terrain forward to create the illusion of movement
  useFrame((state, delta) => {
    if (!terrainRef.current) return;

    // Create a new array to hold updated box positions
    const updatedBoxes = [...boxes];
    let needsUpdate = false;

    // Get camera position for distance calculations
    const cameraPosition = state.camera.position;

    // Update each box's position
    updatedBoxes.forEach((box, index) => {
      // Move the box forward
      const newZ = box.position[2] + speed * delta;

      // Calculate distance to camera
      const boxPosition = new THREE.Vector3(
        box.position[0],
        box.position[1],
        newZ,
      );
      const distanceToCamera = boxPosition.distanceTo(cameraPosition);

      // Calculate opacity based on distance
      // Objects closer than transparencyDistance will have opacity that scales from minOpacity to 1.0
      let opacity = 1.0;
      if (distanceToCamera < transparencyDistance) {
        opacity =
          minOpacity +
          (1.0 - minOpacity) * (distanceToCamera / transparencyDistance);
      }

      // Update material opacity directly if material exists
      if (
        materialRefs.current[index] &&
        materialRefs.current[index] instanceof THREE.Material
      ) {
        const material = materialRefs.current[index] as THREE.Material & {
          opacity?: number;
          transparent?: boolean;
        };
        if (material) {
          material.transparent = opacity < 1.0;
          material.opacity = opacity;
          material.needsUpdate = true;
        }
      }

      // If a box has moved too far forward, move it back to the end
      if (newZ > depth / 2) {
        // Randomize X position when recycling to create more variety
        const newX = Math.random() * width - width / 2;

        // Apply height multiplier based on price changes when recycling
        const baseHeight = Math.random() * 5 + 0.5;
        const height = baseHeight * heightMultiplierRef.current;

        // Update box with new position and height
        updatedBoxes[index] = {
          ...box,
          position: [newX, -8 + height / 2, newZ - depth] as [
            number,
            number,
            number,
          ],
          scale: [box.scale[0], height, box.scale[2]] as [
            number,
            number,
            number,
          ],
          opacity: opacity,
        };
        needsUpdate = true;
      } else {
        // Just update the Z position and opacity
        updatedBoxes[index] = {
          ...box,
          position: [box.position[0], box.position[1], newZ] as [
            number,
            number,
            number,
          ],
          opacity: opacity,
        };
        needsUpdate = true;
      }
    });

    // Only update state if positions have changed
    if (needsUpdate) {
      setBoxes(updatedBoxes);
    }

    // Move the floor along with the terrain
    if (floorRef.current) {
      const floorZ =
        (floorRef.current.position.z + speed * delta) % (depth * 2);
      floorRef.current.position.z = floorZ;
    }

    // Move the grid along with the terrain
    if (gridRef.current) {
      const gridZ = (gridRef.current.position.z + speed * delta) % (depth * 2);
      gridRef.current.position.z = gridZ;
    }
  });

  return (
    <group ref={terrainRef}>
      {/* Add a floor that the player can crash into */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, -15, 0]}>
        <mesh ref={floorRef} receiveShadow>
          <boxGeometry args={[width * 4, 1, depth * 4]} />
          <meshStandardMaterial
            color={new THREE.Color(0.05, 0.1, 0.2)}
            roughness={0.8}
            metalness={0.2}
            transparent={true}
            opacity={0}
          />
        </mesh>
      </RigidBody>

      {/* Add a grid overlay for visual interest */}
      <Grid
        position={[0, -14.45, 0]}
        args={[width * 4, depth * 4]}
        cellSize={5}
        cellThickness={0.5}
        cellColor="#1a3c6e"
        sectionSize={20}
        sectionThickness={1}
        sectionColor="#2a4c7e"
        fadeDistance={depth * 2}
        infiniteGrid={true}
        followCamera={false}
      />

      {boxes.map((box, index) => (
        <RigidBody
          key={box.id}
          ref={(el: RapierRigidBody | null) => {
            if (el) {
              rigidBodyRefs.current[index] = el;
            }
          }}
          type="fixed"
          position={box.position}
          rotation={box.rotation}
          colliders={false} // Disable automatic colliders
        >
          <mesh
            ref={(el) => {
              if (el) {
                boxRefs.current[index] = el;
              }
            }}
            castShadow
            receiveShadow
          >
            <boxGeometry args={box.scale} />
            <meshStandardMaterial
              ref={(el) => {
                if (el) {
                  materialRefs.current[index] = el;
                }
              }}
              color={box.color}
              roughness={0.7}
              metalness={0.2}
              transparent={box.opacity !== undefined && box.opacity < 1.0}
              opacity={box.opacity ?? 1.0}
              emissive={box.color}
              emissiveIntensity={0.5}
              toneMapped={false}
            />
          </mesh>
          {/* Add explicit cuboid collider that matches the box dimensions */}
          <CuboidCollider
            args={[
              box.scale[0] / 2, // Half width (Rapier uses half-extents)
              box.scale[1] / 2, // Half height
              box.scale[2] / 2, // Half depth
            ]}
          />
        </RigidBody>
      ))}
    </group>
  );
};

export default EndlessTerrain;
