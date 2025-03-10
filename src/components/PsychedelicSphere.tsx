import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { vertexShader, fragmentShader } from '../shaders/psychedelicShader';

interface PsychedelicSphereProps {
  radius?: number;
  position?: [number, number, number];
  speed?: number;
  scale?: number;
  intensity?: number;
  color1?: string;
  color2?: string;
  color3?: string;
  priceTrend?: number; // New prop for price trend (-1 to 1)
}

const PsychedelicSphere = ({
  radius = 500,
  position = [0, 0, 0],
  speed = 0.5,
  scale = 1.0,
  intensity = 0.3,
  color1 = '#ff00ff', // Magenta
  color2 = '#00ffff', // Cyan
  color3 = '#ffff00', // Yellow
  priceTrend = 0, // Default to neutral (0)
}: PsychedelicSphereProps) => {
  const mesh = useRef<THREE.Mesh>(null);

  // Convert hex colors to THREE.Vector3 for the shader
  const color1Vec = useMemo(() => {
    const color = new THREE.Color(color1);
    return new THREE.Vector3(color.r, color.g, color.b);
  }, [color1]);

  const color2Vec = useMemo(() => {
    const color = new THREE.Color(color2);
    return new THREE.Vector3(color.r, color.g, color.b);
  }, [color2]);

  const color3Vec = useMemo(() => {
    const color = new THREE.Color(color3);
    return new THREE.Vector3(color.r, color.g, color.b);
  }, [color3]);

  // Create shader uniforms
  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      color1: { value: color1Vec },
      color2: { value: color2Vec },
      color3: { value: color3Vec },
      speed: { value: speed },
      scale: { value: scale },
      intensity: { value: intensity },
      priceTrend: { value: priceTrend }, // Add priceTrend uniform
    }),
    [color1Vec, color2Vec, color3Vec, speed, scale, intensity, priceTrend],
  );

  // Update time uniform on each frame
  useFrame((state, delta) => {
    if (mesh.current?.material) {
      const material = mesh.current.material as THREE.ShaderMaterial;
      material.uniforms.time.value += delta;
    }
  });

  return (
    <mesh ref={mesh} position={position}>
      <sphereGeometry args={[radius, 64, 64]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        side={THREE.BackSide} // Render on the inside of the sphere
      />
    </mesh>
  );
};

export default PsychedelicSphere;
