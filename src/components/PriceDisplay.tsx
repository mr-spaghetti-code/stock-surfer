import React from 'react';
import { Text } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { PriceData } from './PriceFeed';
import { VolatilityData } from '../utils/priceUtils';

interface PriceDisplayProps {
  priceData: PriceData | null;
  volatilityData?: VolatilityData;
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({
  priceData,
  volatilityData,
}) => {
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
        {priceArrow} {priceChangePercent}%
      </Text>

      {/* Show last update time */}
      <Text
        position={[viewport.width / 2 - 2, viewport.height / 2 - 2, 0]}
        fontSize={0.2}
        color="#aaaaaa"
        anchorX="right"
        anchorY="top"
      >
        Updated: {new Date(priceData.lastUpdateTime).toLocaleTimeString()}
        {volatilityInfo && ` | ${volatilityInfo}`}
      </Text>
    </group>
  );
};

export default PriceDisplay;
