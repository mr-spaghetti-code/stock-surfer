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
import { useControls } from 'leva';
import { Canvas } from '@react-three/fiber';
import { Suspense, useState, KeyboardEvent } from 'react';
import * as THREE from 'three';

useGLTF.preload('/models/ship.gltf');

const GameScene = () => {
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

  const { rotationX, rotationY, rotationZ } = useControls('Ship Rotation', {
    rotationX: { value: -Math.PI / 2, min: -Math.PI, max: Math.PI, step: 0.01 },
    rotationY: { value: Math.PI, min: -Math.PI, max: Math.PI, step: 0.01 },
    rotationZ: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
  });

  const { terrainSpeed, boxCount, terrainDepth } = useControls('Terrain', {
    terrainSpeed: { value: 15, min: 5, max: 30, step: 1 },
    boxCount: { value: 150, min: 50, max: 300, step: 10 },
    terrainDepth: { value: 120, min: 50, max: 200, step: 10 },
  });

  // Toggle for orbit controls (for debugging)
  const [useOrbitControls, setUseOrbitControls] = useState(false);

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

        <Physics debug={false} timeStep="vary" gravity={[0, -9.8, 0]}>
          <EndlessTerrain
            speed={terrainSpeed}
            boxCount={boxCount}
            depth={terrainDepth}
          />
          <Suspense fallback={null}>
            <SpaceFighter rotation={[rotationX, rotationY, rotationZ]} />
          </Suspense>
        </Physics>

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
