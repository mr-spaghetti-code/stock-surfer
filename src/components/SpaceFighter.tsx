import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { GLTF } from 'three-stdlib';
import { RigidBody } from '@react-three/rapier';

// Define the type for our GLTF result
type GLTFResult = GLTF & {
  nodes: {
    model: THREE.Mesh;
  };
  materials: {
    CustomMaterial: THREE.MeshStandardMaterial;
  };
};

interface SpaceFighterProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

const SpaceFighter = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}: SpaceFighterProps) => {
  // Load the ship model
  const gltf = useGLTF('/models/ship.gltf');
  const { nodes, materials } = gltf as unknown as GLTFResult;

  // Create a reference to the RigidBody
  const rigidBodyRef = useRef<any>(null);

  // State to track key presses
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isLeftPressed, setIsLeftPressed] = useState(false);
  const [isRightPressed, setIsRightPressed] = useState(false);
  const [isUpPressed, setIsUpPressed] = useState(false);
  const [isDownPressed, setIsDownPressed] = useState(false);

  // Constants for physics
  const THRUST_FORCE = 1;
  const LATERAL_FORCE = 0.5;
  const MAX_X = 15; // Maximum horizontal movement
  const MAX_Y = 10; // Maximum vertical movement

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      switch (e.code) {
        case 'Space':
          setIsSpacePressed(true);
          break;
        case 'ArrowLeft':
        case 'KeyA':
          setIsLeftPressed(true);
          break;
        case 'ArrowRight':
        case 'KeyD':
          setIsRightPressed(true);
          break;
        case 'ArrowUp':
        case 'KeyW':
          setIsUpPressed(true);
          break;
        case 'ArrowDown':
        case 'KeyS':
          setIsDownPressed(true);
          break;
      }
    };

    const handleKeyUp = (e: globalThis.KeyboardEvent) => {
      switch (e.code) {
        case 'Space':
          setIsSpacePressed(false);
          break;
        case 'ArrowLeft':
        case 'KeyA':
          setIsLeftPressed(false);
          break;
        case 'ArrowRight':
        case 'KeyD':
          setIsRightPressed(false);
          break;
        case 'ArrowUp':
        case 'KeyW':
          setIsUpPressed(false);
          break;
        case 'ArrowDown':
        case 'KeyS':
          setIsDownPressed(false);
          break;
      }
    };

    globalThis.window.addEventListener('keydown', handleKeyDown);
    globalThis.window.addEventListener('keyup', handleKeyUp);

    return () => {
      globalThis.window.removeEventListener('keydown', handleKeyDown);
      globalThis.window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Apply forces using Rapier physics
  useFrame(() => {
    if (!rigidBodyRef.current) return;

    const body = rigidBodyRef.current;
    const currentPosition = body.translation();

    // Apply vertical thrust
    if (isSpacePressed) {
      body.applyImpulse({ x: 0, y: THRUST_FORCE, z: 0 }, true);
    }

    // Apply horizontal movement
    if (isLeftPressed && currentPosition.x > -MAX_X) {
      body.applyImpulse({ x: -LATERAL_FORCE, y: 0, z: 0 }, true);
    }
    if (isRightPressed && currentPosition.x < MAX_X) {
      body.applyImpulse({ x: LATERAL_FORCE, y: 0, z: 0 }, true);
    }

    // Apply vertical movement
    if (isUpPressed && currentPosition.y < MAX_Y) {
      body.applyImpulse({ x: 0, y: LATERAL_FORCE, z: 0 }, true);
    }
    if (isDownPressed && currentPosition.y > -MAX_Y) {
      body.applyImpulse({ x: 0, y: -LATERAL_FORCE, z: 0 }, true);
    }

    // Keep the ship at a fixed Z position
    body.setTranslation(
      { x: currentPosition.x, y: currentPosition.y, z: 0 },
      true,
    );

    // Add a slight tilt based on horizontal movement
    const velocity = body.linvel();
    const tiltFactor = 0.2;
    body.setRotation(
      {
        x: rotation[0],
        y: rotation[1],
        z: rotation[2] - velocity.x * tiltFactor,
      },
      true,
    );
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={position}
      rotation={rotation}
      colliders="hull"
      mass={1}
      linearDamping={0.95}
      angularDamping={0.95}
    >
      <mesh
        geometry={nodes.model.geometry}
        material={materials.CustomMaterial}
        scale={scale}
        castShadow
        receiveShadow
      />
    </RigidBody>
  );
};

// Preload the model to avoid loading during gameplay
useGLTF.preload('/models/ship.gltf');

export default SpaceFighter;
