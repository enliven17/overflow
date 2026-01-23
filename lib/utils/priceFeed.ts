/**
 * Pyth Network Price Feed Service
 * Fetches real-time BTC/USD price data from Pyth Network
 */

import { HermesClient } from '@pythnetwork/hermes-client';

// Pyth Network BTC/USD Price Feed ID
// This is the official Pyth price feed identifier for BTC/USD
const BTC_USD_PRICE_FEED_ID = '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43';

// Pyth Hermes API endpoint (public, free to use)
const HERMES_ENDPOINT = 'https://hermes.pyth.network';

export interface PriceData {
  price: number;
  confidence: number;
  timestamp: number;
  expo: number;
}

export class PythPriceFeed {
  private client: HermesClient;
  private intervalId: NodeJS.Timeout | null = null;
  private lastPrice: number | null = null;
  private isRunning: boolean = false;
  
  constructor() {
    this.client = new HermesClient(HERMES_ENDPOINT);
  }
  
  /**
   * Fetch current BTC/USD price from Pyth Network
   */
  async fetchPrice(): Promise<PriceData> {
    try {
      const priceFeeds = await this.client.getLatestPriceUpdates([BTC_USD_PRICE_FEED_ID]);
      
      if (!priceFeeds || !priceFeeds.parsed || priceFeeds.parsed.length === 0) {
        throw new Error('No price data received from Pyth Network');
      }
      
      const priceFeed = priceFeeds.parsed[0];
      const priceData = priceFeed.price;
      
      // Pyth prices come with an exponent (e.g., price * 10^expo)
      // For BTC/USD, expo is typically -8, so we need to adjust
      const price = Number(priceData.price) * Math.pow(10, priceData.expo);
      const confidence = Number(priceData.conf) * Math.pow(10, priceData.expo);
      
      this.lastPrice = price;
      
      return {
        price,
        confidence,
        timestamp: Number(priceData.publish_time),
        expo: priceData.expo
      };
    } catch (error) {
      console.error('Error fetching price from Pyth Network:', error);
      
      // If we have a last known price, return it with a warning
      if (this.lastPrice !== null) {
        console.warn('Using last known price due to fetch error');
        return {
          price: this.lastPrice,
          confidence: 0,
          timestamp: Date.now() / 1000,
          expo: -8
        };
      }
      
      throw error;
    }
  }
  
  /**
   * Start the price feed
   * Fetches new prices every second and calls the callback
   */
  async start(callback: (price: number, data: PriceData) => void): Promise<void> {
    if (this.isRunning) {
      console.warn('Price feed already running');
      return;
    }
    
    this.isRunning = true;
    
    // Fetch initial price
    try {
      const priceData = await this.fetchPrice();
      callback(priceData.price, priceData);
    } catch (error) {
      console.error('Failed to fetch initial price:', error);
    }
    
    // Update every second
    this.intervalId = setInterval(async () => {
      try {
        const priceData = await this.fetchPrice();
        callback(priceData.price, priceData);
      } catch (error) {
        console.error('Failed to fetch price update:', error);
      }
    }, 1000);
  }
  
  /**
   * Stop the price feed
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }
  
  /**
   * Get the last fetched price (useful for synchronous access)
   */
  getLastPrice(): number | null {
    return this.lastPrice;
  }
}

/**
 * Create and start a Pyth price feed
 * Returns a function to stop the feed
 */
export const startPythPriceFeed = (
  callback: (price: number, data: PriceData) => void
): (() => void) => {
  const feed = new PythPriceFeed();
  
  feed.start(callback);
  
  return () => feed.stop();
};

/**
 * Fetch a single price snapshot from Pyth Network
 * Useful for one-time price checks
 */
export const fetchBTCPrice = async (): Promise<PriceData> => {
  const feed = new PythPriceFeed();
  return await feed.fetchPrice();
};

// Export for backward compatibility (mock mode for testing)
export class MockPriceFeed {
  private basePrice: number;
  private volatility: number;
  private trend: number;
  private intervalId: NodeJS.Timeout | null = null;
  
  constructor(
    basePrice: number = 50000,
    volatility: number = 0.001,
    trend: number = 0
  ) {
    this.basePrice = basePrice;
    this.volatility = volatility;
    this.trend = trend;
  }
  
  private generateNextPrice(currentPrice: number): number {
    const randomChange = (Math.random() - 0.5) * 2;
    const change = currentPrice * this.volatility * randomChange + this.trend;
    
    if (Math.random() < 0.05) {
      const spike = currentPrice * (Math.random() - 0.5) * 0.01;
      return currentPrice + change + spike;
    }
    
    return currentPrice + change;
  }
  
  start(callback: (price: number) => void): void {
    if (this.intervalId) {
      console.warn('Price feed already running');
      return;
    }
    
    let currentPrice = this.basePrice;
    callback(currentPrice);
    
    this.intervalId = setInterval(() => {
      currentPrice = this.generateNextPrice(currentPrice);
      currentPrice = Math.max(10000, Math.min(100000, currentPrice));
      callback(currentPrice);
    }, 1000);
  }
  
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export const startMockPriceFeed = (
  callback: (price: number) => void,
  options?: {
    basePrice?: number;
    volatility?: number;
    trend?: number;
  }
): (() => void) => {
  const feed = new MockPriceFeed(
    options?.basePrice,
    options?.volatility,
    options?.trend
  );
  
  feed.start(callback);
  
  return () => feed.stop();
};
