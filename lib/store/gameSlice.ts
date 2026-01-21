/**
 * Game state slice for Zustand store
 * Manages game state, active rounds, price data, and betting actions
 */

import * as fcl from "@onflow/fcl";
import { StateCreator } from "zustand";
import { TargetCell, PricePoint, ActiveRound } from "@/types/game";
import { placeBetTransaction, settleRoundTransaction } from "@/lib/flow/transactions";

export interface GameState {
  // State
  currentPrice: number;
  priceHistory: PricePoint[];
  activeRound: ActiveRound | null;
  targetCells: TargetCell[];
  isPlacingBet: boolean;
  isSettling: boolean;
  error: string | null;
  
  // Actions
  placeBet: (amount: string, targetId: string) => Promise<void>;
  settleRound: (betId: string) => Promise<void>;
  updatePrice: (price: number) => void;
  setActiveRound: (round: ActiveRound | null) => void;
  loadTargetCells: () => Promise<void>;
  clearError: () => void;
}

// Maximum price history points (5 minutes at 1 second intervals)
const MAX_PRICE_HISTORY = 300;

// Default target cells configuration
const DEFAULT_TARGET_CELLS: TargetCell[] = [
  { id: '1', label: '+$5 in 30s', multiplier: 1.5, priceChange: 5, direction: 'UP' },
  { id: '2', label: '+$10 in 30s', multiplier: 2.0, priceChange: 10, direction: 'UP' },
  { id: '3', label: '+$20 in 30s', multiplier: 3.0, priceChange: 20, direction: 'UP' },
  { id: '4', label: '+$50 in 30s', multiplier: 5.0, priceChange: 50, direction: 'UP' },
  { id: '5', label: '+$100 in 30s', multiplier: 10.0, priceChange: 100, direction: 'UP' },
  { id: '6', label: '-$5 in 30s', multiplier: 1.5, priceChange: -5, direction: 'DOWN' },
  { id: '7', label: '-$10 in 30s', multiplier: 2.0, priceChange: -10, direction: 'DOWN' },
  { id: '8', label: '-$20 in 30s', multiplier: 3.0, priceChange: -20, direction: 'DOWN' },
];

/**
 * Create game slice for Zustand store
 * Handles betting, round management, and price updates
 */
export const createGameSlice: StateCreator<GameState> = (set, get) => ({
  // Initial state
  currentPrice: 0,
  priceHistory: [],
  activeRound: null,
  targetCells: DEFAULT_TARGET_CELLS,
  isPlacingBet: false,
  isSettling: false,
  error: null,
  
  /**
   * Place a bet on a target cell
   * Initiates transaction to deposit FLOW tokens and create bet on-chain
   * @param amount - Bet amount in FLOW tokens (e.g., "1.0")
   * @param targetId - ID of the target cell (1-8)
   */
  placeBet: async (amount: string, targetId: string) => {
    const { targetCells, activeRound, currentPrice } = get();
    
    try {
      // Validate no active round
      if (activeRound) {
        throw new Error("Cannot place bet while a round is active");
      }
      
      // Find target cell
      const target = targetCells.find(cell => cell.id === targetId);
      if (!target) {
        throw new Error("Invalid target cell");
      }
      
      // Validate amount
      const betAmount = parseFloat(amount);
      if (isNaN(betAmount) || betAmount <= 0) {
        throw new Error("Invalid bet amount");
      }
      
      set({ isPlacingBet: true, error: null });
      
      // Prepare transaction arguments
      const targetCellId = target.id;
      const priceChange = target.priceChange.toString();
      const direction = target.direction === 'UP' ? '0' : '1';
      const multiplier = target.multiplier.toString();
      
      // Execute transaction
      const transactionId = await fcl.mutate({
        cadence: placeBetTransaction(amount, targetCellId, multiplier),
        args: (arg: any, t: any) => [
          arg(amount, t.UFix64),
          arg(targetCellId, t.UInt8),
          arg(priceChange, t.Fix64),
          arg(direction, t.UInt8),
          arg(multiplier, t.UFix64)
        ],
        limit: 9999
      });
      
      // Wait for transaction to be sealed
      const transaction = await fcl.tx(transactionId).onceSealed();
      
      if (transaction.statusCode !== 0) {
        throw new Error(transaction.errorMessage || "Transaction failed");
      }
      
      // Extract bet ID from events
      const betPlacedEvent = transaction.events.find((e: any) => 
        e.type.includes('OverflowGame.BetPlaced')
      );
      
      if (betPlacedEvent) {
        const betId = betPlacedEvent.data.betId;
        const startTime = parseFloat(betPlacedEvent.data.startTime);
        const endTime = parseFloat(betPlacedEvent.data.endTime);
        
        // Create active round
        const newRound: ActiveRound = {
          betId: betId.toString(),
          amount,
          target,
          startPrice: currentPrice,
          startTime: startTime * 1000, // Convert to milliseconds
          endTime: endTime * 1000, // Convert to milliseconds
          status: 'active'
        };
        
        set({
          activeRound: newRound,
          isPlacingBet: false,
          error: null
        });
      } else {
        throw new Error("Bet placed but event not found");
      }
    } catch (error) {
      console.error("Error placing bet:", error);
      set({
        isPlacingBet: false,
        error: error instanceof Error ? error.message : "Failed to place bet"
      });
      throw error;
    }
  },
  
  /**
   * Settle an active round
   * Initiates transaction to determine win/loss and process payout
   * @param betId - The unique bet ID to settle
   */
  settleRound: async (betId: string) => {
    try {
      set({ isSettling: true, error: null });
      
      // Execute settlement transaction
      const transactionId = await fcl.mutate({
        cadence: settleRoundTransaction(betId),
        args: (arg: any, t: any) => [
          arg(betId, t.UInt64)
        ],
        limit: 9999
      });
      
      // Wait for transaction to be sealed
      const transaction = await fcl.tx(transactionId).onceSealed();
      
      if (transaction.statusCode !== 0) {
        throw new Error(transaction.errorMessage || "Settlement failed");
      }
      
      // Update active round status
      const { activeRound } = get();
      if (activeRound && activeRound.betId === betId) {
        set({
          activeRound: {
            ...activeRound,
            status: 'settled'
          },
          isSettling: false,
          error: null
        });
        
        // Clear active round after a delay to show result
        setTimeout(() => {
          set({ activeRound: null });
        }, 3000);
      } else {
        set({ isSettling: false });
      }
    } catch (error) {
      console.error("Error settling round:", error);
      set({
        isSettling: false,
        error: error instanceof Error ? error.message : "Failed to settle round"
      });
      throw error;
    }
  },
  
  /**
   * Update current price and add to history
   * Maintains rolling 5-minute window of price data
   * @param price - New BTC price in USD
   */
  updatePrice: (price: number) => {
    const { priceHistory } = get();
    const now = Date.now();
    
    // Create new price point
    const newPoint: PricePoint = {
      timestamp: now,
      price
    };
    
    // Add to history
    const updatedHistory = [...priceHistory, newPoint];
    
    // Maintain rolling 5-minute window
    const fiveMinutesAgo = now - (5 * 60 * 1000);
    const filteredHistory = updatedHistory.filter(
      point => point.timestamp >= fiveMinutesAgo
    );
    
    // Limit to MAX_PRICE_HISTORY points
    const trimmedHistory = filteredHistory.slice(-MAX_PRICE_HISTORY);
    
    set({
      currentPrice: price,
      priceHistory: trimmedHistory
    });
  },
  
  /**
   * Set active round (used by event listeners)
   * @param round - Active round data or null to clear
   */
  setActiveRound: (round: ActiveRound | null) => {
    set({ activeRound: round });
  },
  
  /**
   * Load target cells from blockchain
   * Falls back to default configuration if query fails
   */
  loadTargetCells: async () => {
    try {
      // Query target cells from contract
      const cells = await fcl.query({
        cadence: `
          import OverflowGame from 0xOverflowGame
          
          access(all) fun main(): [OverflowGame.TargetCellInfo] {
            return OverflowGame.getTargetCells()
          }
        `
      });
      
      // Transform to frontend format
      const targetCells: TargetCell[] = cells.map((cell: any) => ({
        id: cell.id.toString(),
        label: `${cell.priceChange >= 0 ? '+' : ''}$${Math.abs(cell.priceChange)} in 30s`,
        multiplier: parseFloat(cell.multiplier),
        priceChange: parseFloat(cell.priceChange),
        direction: cell.direction === 0 ? 'UP' : 'DOWN'
      }));
      
      set({ targetCells });
    } catch (error) {
      console.error("Error loading target cells:", error);
      // Use default configuration on error
      set({ targetCells: DEFAULT_TARGET_CELLS });
    }
  },
  
  /**
   * Clear error message
   */
  clearError: () => {
    set({ error: null });
  }
});

/**
 * Start price feed polling
 * Fetches current BTC price from oracle every second
 * @param updatePrice - Function to update price in store
 * @returns Function to stop polling
 */
export const startPriceFeed = (
  updatePrice: (price: number) => void
): (() => void) => {
  let intervalId: NodeJS.Timeout;
  
  const fetchPrice = async () => {
    try {
      const price = await fcl.query({
        cadence: `
          import MockPriceOracle from 0xMockPriceOracle
          
          access(all) fun main(): UFix64 {
            let priceData = MockPriceOracle.getFreshPrice()
            return priceData.price
          }
        `
      });
      
      updatePrice(parseFloat(price));
    } catch (error) {
      console.error("Error fetching price:", error);
    }
  };
  
  // Fetch initial price
  fetchPrice();
  
  // Poll every second
  intervalId = setInterval(fetchPrice, 1000);
  
  // Return cleanup function
  return () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  };
};
