import { useTexture } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';

interface SkyboxSphereProps {
  radius?: number;
  position?: [number, number, number];
  textureUrl?: string;
}

const SkyboxSphere = ({
  radius = 500,
  position = [0, 0, 0],
  textureUrl = '/textures/sphere.jpeg',
}: SkyboxSphereProps) => {
  const mesh = useRef<THREE.Mesh>(null);
  const texture = useTexture(textureUrl);

  // Set texture mapping for a sphere
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;

  return (
    <mesh ref={mesh} position={position}>
      <sphereGeometry args={[radius, 64, 64]} />
      <meshBasicMaterial
        map={texture}
        side={THREE.BackSide} // Render on the inside of the sphere
      />
    </mesh>
  );
};

export default SkyboxSphere;
