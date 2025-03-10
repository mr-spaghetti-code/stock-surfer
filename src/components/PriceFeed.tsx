import React, { useState, useEffect, useRef } from 'react';
import { HermesClient } from '@pythnetwork/hermes-client';

// Add type definitions for missing types
type TimeoutRef = ReturnType<typeof setTimeout> | null;

// Interface for price data
export interface PriceData {
  price: number;
  previousPrice: number;
  priceChange: number;
  priceChangePercent: number;
  lastUpdateTime: number;
}

interface PriceDataProviderProps {
  onPriceUpdate: (newPriceData: PriceData) => void;
  assetId: string;
}

// Define a custom EventSource type that matches what we need
interface CustomEventSource {
  close: () => void;
  onmessage: ((event: MessageEvent<any>) => void) | null;
  onerror: ((event: Event) => void) | null;
}

const PriceDataProvider: React.FC<PriceDataProviderProps> = ({
  onPriceUpdate,
  assetId,
}) => {
  const [error, setError] = useState<string | null>(null);
  const connectionRef = useRef<HermesClient | null>(null);
  const eventSourceRef = useRef<CustomEventSource | null>(null);
  const previousPriceRef = useRef<number | null>(null);
  const isConnectingRef = useRef<boolean>(false);
  const reconnectTimeoutRef = useRef<TimeoutRef>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const MAX_RECONNECT_ATTEMPTS = 3;

  // Function to establish connection
  const establishConnection = async () => {
    // Prevent multiple connection attempts
    if (isConnectingRef.current) return;
    isConnectingRef.current = true;

    try {
      // Clean up any existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      // Create a new connection if one doesn't exist
      if (!connectionRef.current) {
        connectionRef.current = new HermesClient(
          'https://hermes.pyth.network',
          {},
        );
      }

      // Use the provided assetId instead of hardcoded BTC/USD
      const priceIds = [assetId];

      console.log(
        `Establishing connection to price feed for asset ID: ${assetId}...`,
      );

      // Start streaming price updates
      const eventSource =
        await connectionRef.current.getPriceUpdatesStream(priceIds);
      eventSourceRef.current = eventSource as unknown as CustomEventSource;

      // Reset error state on successful connection
      if (error) {
        setError(null);
      }

      // Reset reconnect attempts on successful connection
      reconnectAttemptsRef.current = 0;

      // Set up message handler
      if (eventSourceRef.current) {
        eventSourceRef.current.onmessage = (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data);
            if (data.parsed && data.parsed.length > 0) {
              const priceInfo = data.parsed[0].price;

              // Convert price to a number with proper decimal places
              const currentPrice =
                Number(priceInfo.price) * Math.pow(10, priceInfo.expo);

              // Calculate price change
              let priceChange = 0;
              let priceChangePercent = 0;

              if (previousPriceRef.current !== null) {
                priceChange = currentPrice - previousPriceRef.current;
                priceChangePercent =
                  (priceChange / previousPriceRef.current) * 100;
              }

              const newPriceData: PriceData = {
                price: currentPrice,
                previousPrice: previousPriceRef.current || currentPrice,
                priceChange,
                priceChangePercent,
                lastUpdateTime: priceInfo.publish_time,
              };

              // Update previous price for next calculation
              previousPriceRef.current = currentPrice;

              // Call the callback with the price data
              onPriceUpdate(newPriceData);
            }
          } catch (err) {
            console.error('Error parsing price data:', err);
          }
        };

        // Set up error handler
        eventSourceRef.current.onerror = () => {
          console.error('Error receiving updates');

          // Only set error if we don't already have one
          if (!error) {
            setError('Failed to connect to price feed');
          }

          // Close the current connection
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
          }

          // Attempt to reconnect with exponential backoff
          if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
            const reconnectDelay = Math.min(
              1000 * Math.pow(2, reconnectAttemptsRef.current),
              10000,
            );
            console.log(
              `Attempting to reconnect in ${reconnectDelay / 1000} seconds...`,
            );

            // Clear any existing timeout
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
            }

            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttemptsRef.current += 1;
              isConnectingRef.current = false;
              establishConnection();
            }, reconnectDelay);
          } else {
            console.warn(
              `Max reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Stopping reconnection attempts.`,
            );
          }
        };
      }

      console.log('Connection to price feed established successfully');
    } catch (err) {
      console.error('Failed to initialize price feed:', err);

      // Only set error if we don't already have one
      if (!error) {
        setError('Failed to initialize price feed');
      }

      // Attempt to reconnect with exponential backoff
      if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        const reconnectDelay = Math.min(
          1000 * Math.pow(2, reconnectAttemptsRef.current),
          10000,
        );
        console.log(
          `Attempting to reconnect in ${reconnectDelay / 1000} seconds...`,
        );

        // Clear any existing timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }

        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current += 1;
          isConnectingRef.current = false;
          establishConnection();
        }, reconnectDelay);
      } else {
        console.warn(
          `Max reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Stopping reconnection attempts.`,
        );
      }
    } finally {
      isConnectingRef.current = false;
    }
  };

  // Initialize connection on component mount and when assetId changes
  useEffect(() => {
    establishConnection();

    // Cleanup function
    return () => {
      if (eventSourceRef.current) {
        console.log('Closing price feed connection...');
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      connectionRef.current = null;
    };
  }, [assetId]);

  // This component doesn't render anything visible
  return null;
};

export default PriceDataProvider;
