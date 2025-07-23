import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { GLTF } from 'three-stdlib';
import { RigidBody } from '@react-three/rapier';

// Import the actual RigidBody type from Rapier
import { RapierRigidBody } from '@react-three/rapier';
// Import the ThrusterEffect component
import ThrusterEffect from './ThrusterEffect';

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
  proximityBonus?: number,
) => void;

const SpaceFighter = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  gameState,
  onCollision,
  onPositionUpdate,
}: SpaceFighterProps) => {
  // Access the default camera and set
  const { camera: defaultCamera, set } = useThree();

  // Load the ship model
  const { nodes, materials } = useGLTF(
    '/models/ship.gltf',
  ) as unknown as GLTFResult;

  // Create a reference to the RigidBody
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  // Reference to the mesh for visual effects
  const meshRef = useRef<THREE.Mesh>(null);
  // Reference for the laser sight dot
  const laserDotRef = useRef<THREE.Mesh>(null);
  // State to track if the laser dot is visible
  const [laserDotVisible, setLaserDotVisible] = useState(false);
  // Use ref for laser dot position to avoid unnecessary re-renders
  const laserDotPositionRef = useRef<[number, number, number]>([0, 0, -10]);
  // State to track camera mode (first-person or third-person)
  const [isFirstPerson, setIsFirstPerson] = useState(false);
  // Ref to track the current camera mode (for more reliable access in event handlers)
  const isFirstPersonRef = useRef(false);
  // State for showing the mode change notification
  const [showModeNotification, setShowModeNotification] = useState(false);
  const modeNotificationTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  // Create a first-person camera
  const fpCamera = useMemo(() => {
    const camera = new THREE.PerspectiveCamera(
      75, // Narrower FOV for better focus
      typeof globalThis.window !== 'undefined'
        ? globalThis.window.innerWidth / globalThis.window.innerHeight
        : 1,
      0.1,
      1000,
    );
    // Initialize with correct rotation
    camera.position.set(0, 0.5, 0);
    camera.rotation.set(-Math.PI / 2, Math.PI, 0);
    return camera;
  }, []);

  // State to track key presses
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isLeftPressed, setIsLeftPressed] = useState(false);
  const [isRightPressed, setIsRightPressed] = useState(false);
  const [isUpPressed, setIsUpPressed] = useState(false);
  const [isDownPressed, setIsDownPressed] = useState(false);

  // Add state to track if thrusters are active
  const [thrustersActive, setThrustersActive] = useState(false);

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
  const MAX_BONUS_MULTIPLIER = 3.0;

  // Create a raycaster for the laser sight
  const raycaster = new THREE.Raycaster();
  // Maximum distance for the raycast
  const MAX_RAYCAST_DISTANCE = 100;

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
        case 'KeyF': {
          // Toggle first-person view when F is pressed
          // Use the ref for the current state to ensure correct toggling
          const newMode = !isFirstPersonRef.current;
          console.log(
            'F key pressed - Current mode (from ref):',
            isFirstPersonRef.current,
          );
          console.log(
            'F key pressed - Setting camera mode to:',
            newMode ? 'First Person' : 'Default',
          );

          // Update the state
          setIsFirstPerson(newMode);

          // Directly set the camera based on the new mode
          if (newMode) {
            set({ camera: fpCamera });
          } else {
            set({ camera: defaultCamera });
          }

          // Show notification
          setShowModeNotification(true);

          // Clear any existing timeout
          if (modeNotificationTimeoutRef.current) {
            clearTimeout(modeNotificationTimeoutRef.current);
          }

          // Hide notification after 2 seconds
          modeNotificationTimeoutRef.current = setTimeout(() => {
            setShowModeNotification(false);
          }, 2000);
          break;
        }
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

  // Update thruster state based on key presses and movement
  useEffect(() => {
    // Thrusters are active when any movement key is pressed
    setThrustersActive(
      isSpacePressed || isUpPressed || isLeftPressed || isRightPressed,
    );
  }, [isSpacePressed, isUpPressed, isLeftPressed, isRightPressed]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (modeNotificationTimeoutRef.current) {
        clearTimeout(modeNotificationTimeoutRef.current);
      }
    };
  }, []);

  // Effect to update the ref when the state changes
  useEffect(() => {
    isFirstPersonRef.current = isFirstPerson;
  }, [isFirstPerson]);

  // Remove the camera update from useFrame to avoid conflicts
  useFrame((state) => {
    if (
      rigidBodyRef.current &&
      (gameState === 'playing' || (gameState === 'gameover' && isFirstPerson))
    ) {
      const body = rigidBodyRef.current;
      const currentPosition = body.translation();
      const currentRotation = body.rotation();

      // Update first-person camera position and rotation if in first-person mode
      if (isFirstPerson) {
        // For game over state, position the camera to view the game over screen
        if (gameState === 'gameover') {
          // Position the camera in front of the game over UI
          fpCamera.position.set(0, 0, 15);

          // Reset rotation to look directly at the game over screen
          fpCamera.quaternion.setFromEuler(new THREE.Euler(0, 0, 0));

          // Make sure the camera is properly initialized
          fpCamera.updateProjectionMatrix();
        } else {
          // Normal gameplay camera positioning
          // Position the camera at the ship's position with a slight offset forward and up
          fpCamera.position.set(
            currentPosition.x,
            currentPosition.y + 0.3, // Position at the cockpit level
            currentPosition.z - 0.5, // More forward for better view
          );

          // Create a quaternion from the ship's rotation
          const shipQuaternion = new THREE.Quaternion(
            currentRotation.x,
            currentRotation.y,
            currentRotation.z,
            currentRotation.w,
          );

          // Create a quaternion for the initial rotation adjustment (match the ship's model orientation)
          const adjustmentQuaternion = new THREE.Quaternion().setFromEuler(
            new THREE.Euler(-Math.PI, Math.PI, Math.PI),
          );

          // Combine the quaternions: first apply the adjustment, then the ship's rotation
          const finalQuaternion = new THREE.Quaternion().multiplyQuaternions(
            shipQuaternion,
            adjustmentQuaternion,
          );

          // Apply the combined rotation
          fpCamera.quaternion.copy(finalQuaternion);

          // Make sure the camera is properly initialized
          fpCamera.updateProjectionMatrix();
        }
      }

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

      // Apply vertical movement
      if (isUpPressed && currentPosition.y < MAX_Y) {
        body.applyImpulse({ x: 0, y: LATERAL_FORCE, z: 0 }, true);
      }
      if (isDownPressed && currentPosition.y > MIN_Y) {
        body.applyImpulse({ x: 0, y: -LATERAL_FORCE, z: 0 }, true);
      }

      // Apply roll recovery - gradually return to level flight
      const currentRoll = body.rotation().z;
      if (Math.abs(currentRoll) > 0.01 && !isLeftPressed && !isRightPressed) {
        // Apply a torque in the opposite direction of the current roll
        const recoveryTorque = -currentRoll * ROLL_RECOVERY_SPEED;
        body.applyTorqueImpulse({ x: 0, y: 0, z: recoveryTorque }, true);
      }

      // Enforce maximum roll angle
      if (Math.abs(currentRoll) > MAX_ROLL_ANGLE) {
        const clampedRoll = Math.sign(currentRoll) * MAX_ROLL_ANGLE;
        const currentQuat = body.rotation();
        body.setRotation(
          {
            x: currentQuat.x,
            y: currentQuat.y,
            z: clampedRoll,
            w: currentQuat.w,
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

      // Update laser sight
      if (meshRef.current) {
        // Get the ship's world position and rotation
        const shipPosition = new THREE.Vector3(
          currentPosition.x,
          currentPosition.y,
          currentPosition.z,
        );

        // Create a direction vector pointing forward from the ship
        // Adjust for the ship's rotation in the scene
        const direction = new THREE.Vector3(0, 0, -1);
        const quaternion = new THREE.Quaternion(
          currentRotation.x,
          currentRotation.y,
          currentRotation.z,
          currentRotation.w,
        );
        direction.applyQuaternion(quaternion);

        // Set the raycaster origin and direction
        raycaster.set(shipPosition, direction);

        // Get all objects in the scene that could be intersected
        const intersectableObjects: THREE.Object3D[] = [];
        state.scene.traverse((object) => {
          // Only include meshes that are not the ship itself or the laser dot
          if (
            object instanceof THREE.Mesh &&
            object !== meshRef.current &&
            object !== laserDotRef.current &&
            // Exclude objects with names that indicate they're not part of the terrain
            !object.name.includes('thruster') &&
            !object.name.includes('explosion')
          ) {
            intersectableObjects.push(object);
          }
        });

        // Cast the ray and check for intersections
        const intersects = raycaster.intersectObjects(intersectableObjects);

        if (intersects.length > 0) {
          // Get the first intersection point
          const hitPoint = intersects[0].point;

          // Update the laser dot position
          laserDotPositionRef.current = [hitPoint.x, hitPoint.y, hitPoint.z];
          setLaserDotVisible(true);

          // Update the laser dot mesh position directly
          if (laserDotRef.current) {
            laserDotRef.current.position.set(
              hitPoint.x,
              hitPoint.y,
              hitPoint.z,
            );
          }
        } else {
          // If no intersection, position the dot at a fixed distance in front of the ship
          const farPoint = shipPosition
            .clone()
            .add(direction.multiplyScalar(MAX_RAYCAST_DISTANCE));
          laserDotPositionRef.current = [farPoint.x, farPoint.y, farPoint.z];
          setLaserDotVisible(false);

          // Update the laser dot mesh position directly
          if (laserDotRef.current) {
            laserDotRef.current.position.set(
              farPoint.x,
              farPoint.y,
              farPoint.z,
            );
          }
        }
      }
    }
  });

  return (
    <>
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

        {/* Add the thruster effect behind the ship, positioned correctly for the ship's rotation */}
        <group rotation={[-Math.PI / 2, Math.PI, 0]}>
          <ThrusterEffect
            position={[0, -0.7, 0]}
            scale={scale * 1.2}
            isActive={thrustersActive && gameState === 'playing'}
            color="#00ffff"
          />
        </group>
      </RigidBody>

      {/* Laser sight dot */}
      {gameState === 'playing' && (
        <group position={laserDotPositionRef.current} visible={laserDotVisible}>
          {/* Main dot */}
          <mesh
            ref={laserDotRef}
            renderOrder={10} // Ensure it renders on top of other objects
          >
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshBasicMaterial color="#ff3333" toneMapped={false} />
          </mesh>

          {/* Glow effect */}
          <mesh renderOrder={9}>
            <sphereGeometry args={[1.0, 16, 16]} />
            <meshBasicMaterial
              color="#ff3333"
              transparent={true}
              opacity={0.3}
              toneMapped={false}
            />
          </mesh>
        </group>
      )}

      {/* First-person mode indicator */}
      {isFirstPerson && gameState === 'playing' && (
        <>
          {/* Crosshair */}
          <group position={[0, 0, -2]}>
            {/* Horizontal line */}
            <mesh position={[0, 0, -1]}>
              <boxGeometry args={[0.03, 0.003, 0.001]} />
              <meshBasicMaterial color="#00ff00" />
            </mesh>
            {/* Vertical line */}
            <mesh position={[0, 0, -1]}>
              <boxGeometry args={[0.003, 0.03, 0.001]} />
              <meshBasicMaterial color="#00ff00" />
            </mesh>
            {/* Center dot */}
            <mesh position={[0, 0, -0.99]}>
              <circleGeometry args={[0.001, 8]} />
              <meshBasicMaterial color="#ff0000" />
            </mesh>
          </group>
        </>
      )}

      {/* Mode change notification */}
      {showModeNotification && gameState === 'playing' && (
        <group position={[0, 2, -5]}>
          <mesh position={[0, 0, -1]}>
            <planeGeometry args={[3, 0.5]} />
            <meshBasicMaterial
              color={isFirstPerson ? '#00ff00' : '#ff9900'}
              transparent
              opacity={0.7}
            />
          </mesh>
          {/* Text indicator */}
          <group position={[0, 0, -0.9]}>
            {isFirstPerson ? (
              // First-person mode indicators (simple shapes to spell "FIRST PERSON")
              <>
                <mesh position={[-1.2, 0, 0]}>
                  <boxGeometry args={[0.1, 0.3, 0.001]} />
                  <meshBasicMaterial color="#ffffff" />
                </mesh>
                <mesh position={[-0.9, 0, 0]}>
                  <boxGeometry args={[0.3, 0.1, 0.001]} />
                  <meshBasicMaterial color="#ffffff" />
                </mesh>
                <mesh position={[-0.5, 0, 0]}>
                  <boxGeometry args={[0.1, 0.3, 0.001]} />
                  <meshBasicMaterial color="#ffffff" />
                </mesh>
                <mesh position={[0, 0, 0]}>
                  <boxGeometry args={[0.3, 0.1, 0.001]} />
                  <meshBasicMaterial color="#ffffff" />
                </mesh>
                <mesh position={[0.5, 0, 0]}>
                  <boxGeometry args={[0.1, 0.3, 0.001]} />
                  <meshBasicMaterial color="#ffffff" />
                </mesh>
                <mesh position={[1.0, 0, 0]}>
                  <boxGeometry args={[0.3, 0.3, 0.001]} />
                  <meshBasicMaterial color="#ffffff" />
                </mesh>
              </>
            ) : (
              // Third-person mode indicators (simple shapes to spell "DEFAULT VIEW")
              <>
                <mesh position={[-1.2, 0, 0]}>
                  <boxGeometry args={[0.3, 0.3, 0.001]} />
                  <meshBasicMaterial color="#ffffff" />
                </mesh>
                <mesh position={[-0.7, 0, 0]}>
                  <boxGeometry args={[0.1, 0.3, 0.001]} />
                  <meshBasicMaterial color="#ffffff" />
                </mesh>
                <mesh position={[-0.2, 0, 0]}>
                  <boxGeometry args={[0.3, 0.1, 0.001]} />
                  <meshBasicMaterial color="#ffffff" />
                </mesh>
                <mesh position={[0.3, 0, 0]}>
                  <boxGeometry args={[0.1, 0.3, 0.001]} />
                  <meshBasicMaterial color="#ffffff" />
                </mesh>
                <mesh position={[0.8, 0, 0]}>
                  <boxGeometry args={[0.3, 0.3, 0.001]} />
                  <meshBasicMaterial color="#ffffff" />
                </mesh>
              </>
            )}
          </group>
        </group>
      )}
    </>
  );
};

// Preload the model to avoid loading during gameplay
useGLTF.preload('/models/ship.gltf');

export default SpaceFighter;
