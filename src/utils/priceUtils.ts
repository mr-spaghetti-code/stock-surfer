// Interface for price volatility data
export interface VolatilityData {
  ema: number;
  volatility: number;
  isReady: boolean;
  priceHistory: number[];
}

/**
 * Calculate Exponential Moving Average (EMA)
 * @param prices Array of price values
 * @param period EMA period
 * @returns The calculated EMA value
 */
export const calculateEMA = (prices: number[], period: number): number => {
  if (prices.length === 0) return 0;
  if (prices.length === 1) return prices[0];

  const k = 2 / (period + 1);

  // Calculate initial SMA for the first EMA value
  let ema =
    prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period;

  // Calculate EMA for the remaining prices
  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }

  return ema;
};

/**
 * Calculate price volatility based on recent price changes
 * @param priceHistory Array of recent prices
 * @returns Volatility value (0-1 range)
 */
export const calculateVolatility = (priceHistory: number[]): number => {
  if (priceHistory.length < 2) return 0;

  // Calculate percentage changes between consecutive prices
  const percentChanges = [];
  for (let i = 1; i < priceHistory.length; i++) {
    const change = Math.abs(
      (priceHistory[i] - priceHistory[i - 1]) / priceHistory[i - 1],
    );
    percentChanges.push(change);
  }

  // Calculate average of percentage changes
  const avgChange =
    percentChanges.reduce((sum, change) => sum + change, 0) /
    percentChanges.length;

  // Normalize volatility to a 0-1 range (capping at 0.05 which is 5% average change)
  return Math.min(avgChange * 20, 1);
};

/**
 * Update volatility data with a new price
 * @param volatilityData Current volatility data
 * @param newPrice New price to add
 * @param requiredSamples Number of samples required before EMA is considered valid
 * @param maxHistoryLength Maximum length of price history to maintain
 * @returns Updated volatility data
 */
export const updateVolatilityData = (
  volatilityData: VolatilityData,
  newPrice: number,
  requiredSamples: number = 15,
  maxHistoryLength: number = 30,
): VolatilityData => {
  // Add new price to history
  const updatedHistory = [...volatilityData.priceHistory, newPrice];

  // Trim history if it exceeds max length
  const trimmedHistory =
    updatedHistory.length > maxHistoryLength
      ? updatedHistory.slice(updatedHistory.length - maxHistoryLength)
      : updatedHistory;

  // Calculate new EMA and volatility
  const ema = calculateEMA(
    trimmedHistory,
    Math.min(requiredSamples, trimmedHistory.length),
  );
  const volatility = calculateVolatility(trimmedHistory);

  // Determine if we have enough data
  const isReady = trimmedHistory.length >= requiredSamples;

  return {
    ema,
    volatility,
    isReady,
    priceHistory: trimmedHistory,
  };
};

/**
 * Initialize volatility data structure
 * @returns Empty volatility data structure
 */
export const initVolatilityData = (): VolatilityData => ({
  ema: 0,
  volatility: 0,
  isReady: false,
  priceHistory: [],
});

/**
 * Calculate difficulty multiplier based on volatility
 * @param volatility Price volatility (0-1)
 * @param baseMultiplier Base multiplier value
 * @param maxMultiplier Maximum multiplier value
 * @returns Difficulty multiplier
 */
export const calculateDifficultyMultiplier = (
  volatility: number,
  baseMultiplier: number = 1.0,
  maxMultiplier: number = 2.0,
): number => {
  // Linear scaling from baseMultiplier to maxMultiplier based on volatility
  return baseMultiplier + (maxMultiplier - baseMultiplier) * volatility;
};
