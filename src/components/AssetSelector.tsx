import React, { useState } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';

// Define the available assets
export interface Asset {
  id: string;
  name: string;
}

export const AVAILABLE_ASSETS: Asset[] = [
  {
    id: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
    name: 'BTC',
  },

  {
    id: '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
    name: 'SOL',
  },
  {
    id: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
    name: 'ETH',
  },
];

interface AssetSelectorProps {
  onAssetSelect: (asset: Asset) => void;
  selectedAssetId: string;
}

const AssetSelector: React.FC<AssetSelectorProps> = ({
  onAssetSelect,
  selectedAssetId,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Find the currently selected asset
  const selectedAsset =
    AVAILABLE_ASSETS.find((asset) => asset.id === selectedAssetId) ||
    AVAILABLE_ASSETS[0];

  // Materials for the selector
  const selectorMaterial = new THREE.MeshBasicMaterial({
    color: '#1a1a3a',
    transparent: true,
    opacity: 0.9,
  });

  const optionMaterial = new THREE.MeshBasicMaterial({
    color: '#2a2a4a',
    transparent: true,
    opacity: 0.9,
  });

  const hoverMaterial = new THREE.MeshBasicMaterial({
    color: '#3a3a6a',
    transparent: true,
    opacity: 0.9,
  });

  const handleSelect = (asset: Asset) => {
    onAssetSelect(asset);
    setIsOpen(false);
  };

  return (
    <group position={[0, 0, 0.1]}>
      {/* Selector header */}
      <group>
        <Text
          position={[0, 0.8, 0]}
          fontSize={0.35}
          color="#aaddff"
          anchorX="center"
          anchorY="middle"
          font="/fonts/Orbitron-Medium.ttf"
        >
          Select Asset:
        </Text>

        {/* Current selection - clickable to open dropdown */}
        <group position={[0, 0.3, 0]}>
          <mesh material={selectorMaterial} onClick={() => setIsOpen(!isOpen)}>
            <planeGeometry args={[3.2, 0.7]} />
          </mesh>
          <Text
            position={[0, 0, 0.01]}
            fontSize={0.35}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
          >
            {selectedAsset.name}
          </Text>
        </group>
      </group>

      {/* Dropdown options */}
      {isOpen && (
        <group position={[0, -0.9, 0.1]}>
          {AVAILABLE_ASSETS.map((asset, index) => (
            <group key={asset.id} position={[0, -index * 0.75, 0]}>
              <mesh
                material={
                  asset.id === selectedAssetId ? hoverMaterial : optionMaterial
                }
                onClick={() => handleSelect(asset)}
                onPointerOver={(e: ThreeEvent<PointerEvent>) => {
                  const mesh = e.object as THREE.Mesh;
                  mesh.material = hoverMaterial;
                  if (typeof window !== 'undefined') {
                    window.document.body.style.cursor = 'pointer';
                  }
                }}
                onPointerOut={(e: ThreeEvent<PointerEvent>) => {
                  const mesh = e.object as THREE.Mesh;
                  mesh.material =
                    asset.id === selectedAssetId
                      ? hoverMaterial
                      : optionMaterial;
                  if (typeof window !== 'undefined') {
                    window.document.body.style.cursor = 'auto';
                  }
                }}
              >
                <planeGeometry args={[3.2, 0.7]} />
              </mesh>
              <Text
                position={[0, 0, 0.01]}
                fontSize={0.35}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
              >
                {asset.name}
              </Text>
            </group>
          ))}
        </group>
      )}
    </group>
  );
};

export default AssetSelector;
