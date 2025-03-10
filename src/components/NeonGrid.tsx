import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface NeonGridProps {
  size?: number;
  divisions?: number;
  color?: string;
  fadeDistance?: number;
  pulseSpeed?: number;
  pulseIntensity?: number;
}

const NeonGrid = ({
  size = 100,
  divisions = 20,
  color = '#00ffff',
  fadeDistance = 50,
  pulseSpeed = 1,
  pulseIntensity = 0.2,
}: NeonGridProps) => {
  const gridRef = useRef<THREE.GridHelper>(null);
  const materialRef = useRef<THREE.Material>(null);
  const timeRef = useRef(0);

  // Animate the grid
  useFrame((state, delta) => {
    if (gridRef.current && materialRef.current) {
      // Update time for pulsing effect
      timeRef.current += delta * pulseSpeed;

      // Create pulsing effect
      const pulse = Math.sin(timeRef.current) * pulseIntensity + 1;

      // Apply pulse to opacity
      if (materialRef.current instanceof THREE.Material) {
        materialRef.current.opacity = 0.5 * pulse;
      }
    }
  });

  return (
    <group position={[0, -8, 0]} rotation={[0, 0, 0]}>
      <gridHelper
        ref={gridRef}
        args={[size, divisions, new THREE.Color(color), new THREE.Color(color)]}
      >
        <meshBasicMaterial
          ref={materialRef}
          color={color}
          transparent={true}
          opacity={0.5}
          toneMapped={false} // Important for neon effect
        />
      </gridHelper>
    </group>
  );
};

export default NeonGrid;
