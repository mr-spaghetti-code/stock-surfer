import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ThrusterEffectProps {
  position?: [number, number, number];
  scale?: number;
  isActive?: boolean;
  color?: string;
}

const ThrusterEffect = ({
  position = [0, 0, 0],
  scale = 1,
  isActive = false,
  color = '#00ffff', // Default cyan color
}: ThrusterEffectProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const [particles, setParticles] = useState<
    Array<{
      position: THREE.Vector3;
      velocity: THREE.Vector3;
      color: THREE.Color;
      scale: number;
      life: number;
      maxLife: number;
    }>
  >([]);

  // Constants for the thruster effect
  const MAX_PARTICLES = 40;
  const SPAWN_RATE = 0.5; // Higher rate for more particles
  const PARTICLE_SPEED = 0.8;
  const PARTICLE_SIZE = 0.15;
  const PARTICLE_LIFE = 0.4; // Seconds

  // Thruster colors
  const coreColor = new THREE.Color(color);
  const outerColor = new THREE.Color('#ffffff');

  // Spawn new particles
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Create new particles at a controlled rate
    if (isActive && Math.random() < SPAWN_RATE * delta) {
      // Create multiple particles per frame for a denser effect
      const particlesToAdd = Math.floor(Math.random() * 3) + 1;

      const newParticles = Array(particlesToAdd)
        .fill(null)
        .map(() => createParticle());

      setParticles((prev) => {
        const combined = [...prev, ...newParticles];
        // If we have too many particles, remove the oldest ones
        if (combined.length > MAX_PARTICLES) {
          return combined.slice(combined.length - MAX_PARTICLES);
        }
        return combined;
      });
    }

    // Update existing particles
    setParticles(
      (prev) =>
        prev
          .map((particle) => {
            // Update particle life
            const newLife = particle.life - delta;
            if (newLife <= 0) return null; // Remove dead particles

            // Update position based on velocity
            const newPos = new THREE.Vector3(
              particle.position.x + particle.velocity.x * delta,
              particle.position.y + particle.velocity.y * delta,
              particle.position.z + particle.velocity.z * delta,
            );

            // Expand particles as they move away
            const lifeRatio = newLife / particle.maxLife;
            const newScale = particle.scale * (1 + (1 - lifeRatio) * 0.5);

            return {
              ...particle,
              position: newPos,
              life: newLife,
              scale: newScale,
            };
          })
          .filter(Boolean) as typeof particles,
    );
  });

  // Create a new particle
  const createParticle = () => {
    // Random offset within the thruster nozzle
    const offsetX = (Math.random() - 0.5) * 0.1 * scale;
    const offsetY = (Math.random() - 0.5) * 0.1 * scale;

    // Random velocity with main direction backward (negative z)
    const velocity = new THREE.Vector3(
      offsetX * 3,
      offsetY * 3,
      -PARTICLE_SPEED - Math.random() * 0.8,
    );

    // Random life duration
    const maxLife = PARTICLE_LIFE + Math.random() * 0.3;

    // Determine if this is a core (bright) or outer (fading) particle
    const isCore = Math.random() < 0.3;

    // Choose color based on position in thruster
    const particleColor = isCore
      ? coreColor.clone()
      : coreColor.clone().lerp(outerColor, Math.random() * 0.5);

    // Create the particle
    return {
      position: new THREE.Vector3(0, 0, 0),
      velocity,
      color: particleColor,
      scale:
        PARTICLE_SIZE *
        (0.6 + Math.random() * 0.8) *
        scale *
        (isCore ? 0.7 : 1),
      life: maxLife,
      maxLife,
    };
  };

  // Add a glow effect at the thruster base
  const glowIntensity = isActive ? 1 : 0;

  return (
    <group ref={groupRef} position={position}>
      {/* Base glow effect */}
      <pointLight
        color={color}
        intensity={glowIntensity * 2}
        distance={1.5 * scale}
        decay={2}
      />

      {/* Particles */}
      {particles.map((particle, index) => (
        <mesh key={index} position={particle.position}>
          <sphereGeometry args={[particle.scale, 8, 8]} />
          <meshStandardMaterial
            color={particle.color}
            transparent={true}
            opacity={(particle.life / particle.maxLife) * 0.8}
            emissive={particle.color}
            emissiveIntensity={2}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
};

export default ThrusterEffect;
