import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';

interface EndlessTerrainProps {
  width?: number;
  depth?: number;
  boxCount?: number;
  speed?: number;
}

interface BoxData {
  id: number;
  position: [number, number, number];
  scale: [number, number, number];
  color: THREE.Color;
  rotation: [number, number, number];
}

const EndlessTerrain = ({
  width = 50,
  depth = 100,
  boxCount = 100,
  speed = 10,
}: EndlessTerrainProps) => {
  const terrainRef = useRef<THREE.Group>(null);
  const boxRefs = useRef<(THREE.Mesh | null)[]>([]);
  const [boxes, setBoxes] = useState<BoxData[]>([]);

  // Generate boxes with random heights, sizes, and colors
  useMemo(() => {
    const items: BoxData[] = [];
    const halfWidth = width / 2;

    // Create a color palette for a more cohesive look
    const colorPalette = [
      new THREE.Color(0.1, 0.2, 0.4), // Dark blue
      new THREE.Color(0.2, 0.3, 0.5), // Medium blue
      new THREE.Color(0.3, 0.4, 0.6), // Light blue
      new THREE.Color(0.2, 0.2, 0.3), // Dark slate
      new THREE.Color(0.1, 0.1, 0.2), // Very dark blue
    ];

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

      // Select a random color from our palette
      const colorIndex = Math.floor(Math.random() * colorPalette.length);
      const color = colorPalette[colorIndex];

      // Add some random variation to the color
      const colorVariation = Math.random() * 0.1 - 0.05;
      color.r += colorVariation;
      color.g += colorVariation;
      color.b += colorVariation;

      items.push({
        id: i,
        position: [x, -8 + height / 2, z] as [number, number, number],
        scale: [boxWidth, height, boxDepth] as [number, number, number],
        color,
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
  }, [width, depth, boxCount]);

  // Move the terrain forward to create the illusion of movement
  useFrame((state, delta) => {
    if (!terrainRef.current) return;

    // Create a new array to hold updated box positions
    const updatedBoxes = [...boxes];
    let needsUpdate = false;

    // Update each box's position
    updatedBoxes.forEach((box, index) => {
      // Move the box forward
      const newZ = box.position[2] + speed * delta;

      // If a box has moved too far forward, move it back to the end
      if (newZ > depth / 2) {
        // Randomize X position when recycling to create more variety
        const newX = Math.random() * width - width / 2;
        updatedBoxes[index] = {
          ...box,
          position: [newX, box.position[1], newZ - depth] as [
            number,
            number,
            number,
          ],
        };
        needsUpdate = true;
      } else {
        // Just update the Z position
        updatedBoxes[index] = {
          ...box,
          position: [box.position[0], box.position[1], newZ] as [
            number,
            number,
            number,
          ],
        };
        needsUpdate = true;
      }
    });

    // Only update state if positions have changed
    if (needsUpdate) {
      setBoxes(updatedBoxes);
    }
  });

  return (
    <group ref={terrainRef}>
      {boxes.map((box, index) => (
        <RigidBody
          key={box.id}
          type="fixed"
          colliders="cuboid"
          position={box.position}
          rotation={box.rotation}
        >
          <mesh
            ref={(el) => (boxRefs.current[index] = el)}
            castShadow
            receiveShadow
          >
            <boxGeometry args={box.scale} />
            <meshStandardMaterial
              color={box.color}
              roughness={0.7}
              metalness={0.2}
            />
          </mesh>
        </RigidBody>
      ))}
    </group>
  );
};

export default EndlessTerrain;
