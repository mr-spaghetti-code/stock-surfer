import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ExplosionProps {
  position: [number, number, number];
  onComplete?: () => void;
}

const Explosion = ({ position, onComplete }: ExplosionProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const [particles, setParticles] = useState<
    Array<{
      position: THREE.Vector3;
      velocity: THREE.Vector3;
      color: THREE.Color;
      scale: number;
      rotation: THREE.Euler;
    }>
  >([]);

  const [timer, setTimer] = useState(0);
  const duration = 1.5; // Duration of explosion in seconds

  // Initialize particles
  useEffect(() => {
    const particleCount = 30;
    const newParticles = [];

    // Create explosion particles
    for (let i = 0; i < particleCount; i++) {
      // Random direction
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      // Random velocity
      const speed = 2 + Math.random() * 3;
      const velocity = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.sin(phi) * Math.sin(theta) * speed,
        Math.cos(phi) * speed,
      );

      // Random color (cyberpunk colors for explosion effect)
      const colorChoice = Math.random();
      let color;
      if (colorChoice < 0.3) {
        color = new THREE.Color(0xff00ff); // Magenta
      } else if (colorChoice < 0.6) {
        color = new THREE.Color(0x00ffff); // Cyan
      } else {
        color = new THREE.Color(0xff3366); // Neon pink
      }

      // Random scale
      const scale = 0.2 + Math.random() * 0.8;

      // Random rotation
      const rotation = new THREE.Euler(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
      );

      newParticles.push({
        position: new THREE.Vector3(0, 0, 0),
        velocity,
        color,
        scale,
        rotation,
      });
    }

    setParticles(newParticles);
  }, []);

  // Animate particles
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Update timer
    setTimer((prev) => {
      const newTimer = prev + delta;

      // Call onComplete when animation is done
      if (newTimer >= duration && onComplete) {
        onComplete();
      }

      return newTimer;
    });

    // Calculate progress (0 to 1)
    const progress = Math.min(timer / duration, 1);

    // Update each particle
    groupRef.current.children.forEach((child, index) => {
      if (index < particles.length) {
        const particle = particles[index];
        const mesh = child as THREE.Mesh;

        // Update position based on velocity and time
        const newPos = new THREE.Vector3(
          particle.position.x + particle.velocity.x * delta,
          particle.position.y + particle.velocity.y * delta,
          particle.position.z + particle.velocity.z * delta,
        );

        // Apply gravity effect
        particle.velocity.y -= 2 * delta;

        // Update particle position
        mesh.position.copy(newPos);
        particle.position.copy(newPos);

        // Fade out based on progress
        if (mesh.material instanceof THREE.MeshStandardMaterial) {
          mesh.material.opacity = 1 - progress;

          // Add glow effect by increasing emissive intensity at start
          const emissiveIntensity = 1 - progress;
          mesh.material.emissiveIntensity = emissiveIntensity;
        }

        // Rotate particle
        mesh.rotation.x += delta * 2;
        mesh.rotation.y += delta * 2;

        // Scale down slightly over time
        const scale = particle.scale * (1 - progress * 0.5);
        mesh.scale.set(scale, scale, scale);
      }
    });
  });

  return (
    <group ref={groupRef} position={position}>
      {particles.map((particle, index) => (
        <mesh key={index} position={[0, 0, 0]} rotation={particle.rotation}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial
            color={particle.color}
            transparent={true}
            opacity={1}
            emissive={particle.color}
            emissiveIntensity={2}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
};

export default Explosion;
