import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  EffectComposer,
  Bloom,
  Noise,
  Vignette,
  ChromaticAberration,
} from '@react-three/postprocessing';
import { BlendFunction, KernelSize } from 'postprocessing';
import * as THREE from 'three';

interface CyberpunkEffectsProps {
  bloomIntensity?: number;
  noiseOpacity?: number;
  vignetteIntensity?: number;
  chromaticAberrationOffset?: number;
}

const CyberpunkEffects = ({
  bloomIntensity = 1.5,
  noiseOpacity = 0.15,
  vignetteIntensity = 0.5,
  chromaticAberrationOffset = 0.004,
}: CyberpunkEffectsProps) => {
  // Pulse effect for bloom intensity
  const pulseRef = useRef({ value: 0 });

  useFrame((state, delta) => {
    // Create a pulsing effect for the bloom
    pulseRef.current.value += delta * 2;
    // The pulseFactor will be used in future enhancements
  });

  return (
    <EffectComposer>
      {/* Bloom effect for neon glow */}
      <Bloom
        intensity={bloomIntensity}
        luminanceThreshold={0.2}
        luminanceSmoothing={0.9}
        kernelSize={KernelSize.LARGE}
        blendFunction={BlendFunction.SCREEN}
      />

      {/* Chromatic aberration for that digital distortion look */}
      <ChromaticAberration
        offset={
          new THREE.Vector2(
            chromaticAberrationOffset,
            chromaticAberrationOffset,
          )
        }
        blendFunction={BlendFunction.NORMAL}
      />

      {/* Noise effect for film grain */}
      <Noise opacity={noiseOpacity} blendFunction={BlendFunction.OVERLAY} />

      {/* Vignette for darkened edges */}
      <Vignette
        darkness={vignetteIntensity}
        eskil={false}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
};

export default CyberpunkEffects;
