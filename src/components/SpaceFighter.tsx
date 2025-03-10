import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { GLTF } from 'three-stdlib';
import { RigidBody } from '@react-three/rapier';

// Import the actual RigidBody type from Rapier
import { RapierRigidBody } from '@react-three/rapier';

// Define the type for our GLTF result
type GLTFResult = GLTF & {
  nodes: {
    [key: string]: THREE.Mesh;
  };
  materials: {
    [key: string]: THREE.MeshStandardMaterial;
  };
};

interface SpaceFighterProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  gameState: 'start' | 'instructions' | 'playing' | 'gameover';
  onCollision: () => void;
  // Use a type alias for the position update function to avoid linter errors
  onPositionUpdate: PositionUpdateFunction;
}

// Define a type for the position update function
type PositionUpdateFunction = (
  position: [number, number, number],
  floorProximityBonus?: number,
) => void;

const SpaceFighter = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  gameState,
  onCollision,
  onPositionUpdate,
}: SpaceFighterProps) => {
  // Load the ship model
  const { nodes, materials } = useGLTF(
    '/models/ship.gltf',
  ) as unknown as GLTFResult;

  // Create a reference to the RigidBody
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  // Reference to the mesh for visual effects
  const meshRef = useRef<THREE.Mesh>(null);

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
  const MIN_Y = -14; // Minimum vertical position (to prevent going below the floor)

  // Constants for roll effect
  const ROLL_FORCE = 0.02; // Reduced from 0.1 to make rolling less aggressive
  const MAX_ROLL_ANGLE = 0.25; // Reduced from 0.4 (about 14 degrees instead of 23)
  const ROLL_RECOVERY_SPEED = 0.1; // Increased from 0.05 for faster stabilization

  // Constants for floor proximity bonus
  const BONUS_START_HEIGHT = -8; // Height at which bonus starts to apply
  const MAX_BONUS_MULTIPLIER = 3.0; // Maximum bonus multiplier when at minimum height

  // Enhance the material with cyberpunk effects
  useEffect(() => {
    if (materials.CustomMaterial) {
      // Add neon glow effect
      materials.CustomMaterial.emissive = new THREE.Color('#00ffff');
      materials.CustomMaterial.emissiveIntensity = 0.5;
      materials.CustomMaterial.toneMapped = false;

      // Make it slightly metallic for a futuristic look
      materials.CustomMaterial.metalness = 0.7;
      materials.CustomMaterial.roughness = 0.2;
    }
  }, [materials]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (gameState !== 'playing') return;

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
  }, [gameState]);

  // Reset ship position when game state changes
  useEffect(() => {
    if (rigidBodyRef.current && gameState === 'playing') {
      rigidBodyRef.current.setTranslation({ x: 0, y: 0, z: 0 }, true);
      rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      rigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);

      // Reset rotation to ensure ship is facing the correct direction
      rigidBodyRef.current.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
    }
  }, [gameState]);

  // Apply forces using Rapier physics
  useFrame(() => {
    if (rigidBodyRef.current && gameState === 'playing') {
      const body = rigidBodyRef.current;
      const currentPosition = body.translation();
      const currentRotation = body.rotation();

      // Calculate floor proximity bonus
      let floorProximityBonus = 0;
      if (currentPosition.y < BONUS_START_HEIGHT) {
        // Calculate bonus based on how close to MIN_Y the ship is
        // The closer to MIN_Y, the higher the bonus
        const heightRange = BONUS_START_HEIGHT - MIN_Y;
        const heightFromBottom = currentPosition.y - MIN_Y;
        const proximityRatio = 1 - heightFromBottom / heightRange;
        floorProximityBonus = proximityRatio * MAX_BONUS_MULTIPLIER;
      }

      // Update parent component with current position and bonus for explosion effect and scoring
      onPositionUpdate(
        [currentPosition.x, currentPosition.y, currentPosition.z],
        floorProximityBonus,
      );

      // Apply vertical thrust
      if (isSpacePressed) {
        body.applyImpulse({ x: 0, y: THRUST_FORCE, z: 0 }, true);
      }

      // Apply horizontal movement with roll effect
      if (isLeftPressed && currentPosition.x > -MAX_X) {
        body.applyImpulse({ x: -LATERAL_FORCE, y: 0, z: 0 }, true);
        // Apply roll to the left (negative z-axis rotation) when moving left
        body.applyTorqueImpulse({ x: 0, y: 0, z: ROLL_FORCE }, true);
      }
      if (isRightPressed && currentPosition.x < MAX_X) {
        body.applyImpulse({ x: LATERAL_FORCE, y: 0, z: 0 }, true);
        // Apply roll to the right (positive z-axis rotation) when moving right
        body.applyTorqueImpulse({ x: 0, y: 0, z: -ROLL_FORCE }, true);
      }

      // Apply vertical movement with pitch effect
      if (isUpPressed && currentPosition.y < MAX_Y) {
        body.applyImpulse({ x: 0, y: LATERAL_FORCE, z: 0 }, true);
        // Add slight pitch up (positive x-axis rotation) when moving up
        body.applyTorqueImpulse({ x: ROLL_FORCE * 0.5, y: 0, z: 0 }, true);
      }
      if (isDownPressed && currentPosition.y > -MIN_Y) {
        body.applyImpulse({ x: 0, y: -LATERAL_FORCE, z: 0 }, true);
        // Add slight pitch down (negative x-axis rotation) when moving down
        body.applyTorqueImpulse({ x: -ROLL_FORCE * 0.5, y: 0, z: 0 }, true);
      }

      // Improved auto-stabilization for roll and pitch
      if (!isLeftPressed && !isRightPressed && !isUpPressed && !isDownPressed) {
        const euler = new THREE.Euler().setFromQuaternion(
          new THREE.Quaternion(
            currentRotation.x,
            currentRotation.y,
            currentRotation.z,
            currentRotation.w,
          ),
        );

        // If the ship is rolled, apply a counter-torque to level it out
        if (Math.abs(euler.z) > 0.01) {
          const stabilizingForce = -Math.sign(euler.z) * ROLL_RECOVERY_SPEED;
          body.applyTorqueImpulse({ x: 0, y: 0, z: stabilizingForce }, true);
        }

        // If the ship is pitched, apply a counter-torque to level it out
        if (Math.abs(euler.x) > 0.01) {
          const stabilizingForce = -Math.sign(euler.x) * ROLL_RECOVERY_SPEED;
          body.applyTorqueImpulse({ x: stabilizingForce, y: 0, z: 0 }, true);
        }
      } else {
        // Partial stabilization even during movement for more controlled flight
        const euler = new THREE.Euler().setFromQuaternion(
          new THREE.Quaternion(
            currentRotation.x,
            currentRotation.y,
            currentRotation.z,
            currentRotation.w,
          ),
        );

        // Apply partial stabilization for roll
        if (Math.abs(euler.z) > 0.1) {
          const stabilizingForce =
            -Math.sign(euler.z) * ROLL_RECOVERY_SPEED * 0.3;
          body.applyTorqueImpulse({ x: 0, y: 0, z: stabilizingForce }, true);
        }

        // Apply partial stabilization for pitch
        if (Math.abs(euler.x) > 0.1) {
          const stabilizingForce =
            -Math.sign(euler.x) * ROLL_RECOVERY_SPEED * 0.3;
          body.applyTorqueImpulse({ x: stabilizingForce, y: 0, z: 0 }, true);
        }
      }

      // Limit maximum roll angle
      const euler = new THREE.Euler().setFromQuaternion(
        new THREE.Quaternion(
          currentRotation.x,
          currentRotation.y,
          currentRotation.z,
          currentRotation.w,
        ),
      );

      if (Math.abs(euler.z) > MAX_ROLL_ANGLE) {
        // Create a new quaternion with limited roll
        const limitedEuler = new THREE.Euler(
          euler.x,
          euler.y,
          Math.sign(euler.z) * MAX_ROLL_ANGLE,
          euler.order,
        );
        const limitedQuaternion = new THREE.Quaternion().setFromEuler(
          limitedEuler,
        );

        // Apply the limited rotation
        body.setRotation(
          {
            x: limitedQuaternion.x,
            y: limitedQuaternion.y,
            z: limitedQuaternion.z,
            w: limitedQuaternion.w,
          },
          true,
        );
      }

      // Enforce minimum Y position to prevent going below the floor
      if (currentPosition.y < MIN_Y) {
        body.setTranslation(
          { x: currentPosition.x, y: MIN_Y, z: currentPosition.z },
          true,
        );

        // If the ship hits the floor, trigger collision
        if (body.linvel().y < -5) {
          onCollision();
        }
      }

      // Keep the ship at a fixed Z position
      body.setTranslation(
        { x: currentPosition.x, y: currentPosition.y, z: 0 },
        true,
      );
    }
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={position}
      rotation={rotation}
      colliders="hull"
      mass={1}
      linearDamping={0.95}
      angularDamping={2.5}
      sensor
      onIntersectionEnter={onCollision}
    >
      <mesh
        ref={meshRef}
        geometry={nodes.model.geometry}
        material={materials.CustomMaterial}
        scale={scale}
        castShadow
        receiveShadow
        rotation={[-Math.PI / 2, Math.PI, 0]}
      />
    </RigidBody>
  );
};

// Preload the model to avoid loading during gameplay
useGLTF.preload('/models/ship.gltf');

export default SpaceFighter;
