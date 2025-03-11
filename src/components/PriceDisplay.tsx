import React from 'react';
import { Text } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { PriceData } from './PriceFeed';
import { VolatilityData } from '../utils/priceUtils';

interface PriceDisplayProps {
  priceData: PriceData | null;
  volatilityData?: VolatilityData;
  assetName?: string;
}
const PriceDisplay: React.FC<PriceDisplayProps> = ({
  priceData,
  volatilityData,
  assetName = '',
}) => {
  const { viewport } = useThree();

  if (!priceData) {
    return (
      <Text
        position={[viewport.width / 2 - 2, viewport.height / 2 - 1, 0]}
        fontSize={0.6}
        color="#ffffff"
        anchorX="right"
        anchorY="top"
      >
        Loading...
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

  // Format price change percentage
  const priceChangePercent = Math.abs(priceData.priceChangePercent).toFixed(2);

  // Determine arrow based on price direction
  const priceArrow = priceData.priceChange >= 0 ? '▲' : '▼';

  // Optional: Use volatility data to enhance display
  const volatilityInfo =
    volatilityData && volatilityData.isReady
      ? `Vol: ${(volatilityData.volatility * 100).toFixed(1)}%`
      : '';

  return (
    <group>
      {/* Asset Name */}
      <Text
        position={[viewport.width / 2 - 2, viewport.height / 2 - 0.5, 0]}
        fontSize={0.5}
        color="#66ccff"
        anchorX="right"
        anchorY="top"
        font="/fonts/Orbitron-SemiBold.ttf"
      >
        {assetName}
      </Text>

      {/* Price with arrow */}
      <Text
        position={[viewport.width / 2 - 2, viewport.height / 2 - 1.1, 0]}
        fontSize={0.8}
        color={priceColor}
        anchorX="right"
        anchorY="top"
        font="/fonts/Orbitron-SemiBold.ttf"
        fontWeight="bold"
      >
        {priceArrow} ${formattedPrice}
      </Text>

      {/* Remove separate arrow text since it's now part of the price */}
    </group>
  );
};

export default PriceDisplay;
