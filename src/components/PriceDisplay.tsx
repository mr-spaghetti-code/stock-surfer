import React from 'react';
import { Text } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { PriceData } from './PriceFeed';

interface PriceDisplayProps {
  priceData: PriceData | null;
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({ priceData }) => {
  const { viewport } = useThree();

  if (!priceData) {
    return (
      <Text
        position={[viewport.width / 2 - 2, viewport.height / 2 - 1, 0]}
        fontSize={0.4}
        color="#ffffff"
        anchorX="right"
        anchorY="top"
      >
        BTC/USD: Loading...
      </Text>
    );
  }

  // Format the price with commas and 2 decimal places
  const formattedPrice = priceData.price.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Determine color based on price change
  const priceColor = priceData.priceChange >= 0 ? '#00ff00' : '#ff0000';

  return (
    <group>
      <Text
        position={[viewport.width / 2 - 2, viewport.height / 2 - 1, 0]}
        fontSize={0.4}
        color="#ffffff"
        anchorX="right"
        anchorY="top"
      >
        BTC/USD: ${formattedPrice}
      </Text>
      <Text
        position={[viewport.width / 2 - 2, viewport.height / 2 - 1.5, 0]}
        fontSize={0.3}
        color={priceColor}
        anchorX="right"
        anchorY="top"
      >
        {priceData.priceChange >= 0 ? '▲' : '▼'}{' '}
        {Math.abs(priceData.priceChangePercent).toFixed(2)}%
      </Text>
    </group>
  );
};

export default PriceDisplay;
