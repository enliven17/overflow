/**
 * Mock price feed service for testing
 * Generates realistic BTC price movements for development and testing
 */

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
  
  /**
   * Generate next price using random walk with drift
   * Simulates realistic price movements
   */
  private generateNextPrice(currentPrice: number): number {
    // Random walk with drift
    const randomChange = (Math.random() - 0.5) * 2; // -1 to 1
    const change = currentPrice * this.volatility * randomChange + this.trend;
    
    // Add occasional larger movements (spikes)
    if (Math.random() < 0.05) { // 5% chance of spike
      const spike = currentPrice * (Math.random() - 0.5) * 0.01; // ±0.5% spike
      return currentPrice + change + spike;
    }
    
    return currentPrice + change;
  }
  
  /**
   * Start the price feed
   * Calls the callback with new prices every second
   */
  start(callback: (price: number) => void): void {
    if (this.intervalId) {
      console.warn('Price feed already running');
      return;
    }
    
    let currentPrice = this.basePrice;
    
    // Send initial price
    callback(currentPrice);
    
    // Update every second
    this.intervalId = setInterval(() => {
      currentPrice = this.generateNextPrice(currentPrice);
      
      // Keep price in reasonable range (10k - 100k)
      currentPrice = Math.max(10000, Math.min(100000, currentPrice));
      
      callback(currentPrice);
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
  }
  
  /**
   * Update base price manually (for testing specific scenarios)
   */
  setBasePrice(price: number): void {
    this.basePrice = price;
  }
  
  /**
   * Update volatility (higher = more volatile)
   */
  setVolatility(volatility: number): void {
    this.volatility = volatility;
  }
  
  /**
   * Update trend (positive = upward, negative = downward)
   */
  setTrend(trend: number): void {
    this.trend = trend;
  }
}

/**
 * Create and start a mock price feed
 * Returns a function to stop the feed
 */
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
