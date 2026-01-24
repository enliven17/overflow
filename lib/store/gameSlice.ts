/**
 * Game state slice for Zustand store
 * Manages game state, active rounds, price data, and betting actions
 */

import * as fcl from "@onflow/fcl";
import { StateCreator } from "zustand";
import { TargetCell, PricePoint, ActiveRound } from "@/types/game";
import { placeBetTransaction, settleRoundTransaction } from "@/lib/flow/transactions";

/**
 * Format a number to Flow's UFix64 format (exactly 8 decimal places)
 * @param value - Number or string to format
 * @returns String formatted as UFix64 (e.g., "1.00000000")
 */
const toUFix64 = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return "0.00000000";
  return num.toFixed(8);
};

/**
 * Format a number to Flow's Fix64 format (exactly 8 decimal places, can be negative)
 * @param value - Number or string to format
 * @returns String formatted as Fix64 (e.g., "-5.00000000")
 */
const toFix64 = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return "0.00000000";
  return num.toFixed(8);
};

// Active bet type for instant-resolution system
export interface ActiveBet {
  id: string;
  cellId: string; // The cell this bet is placed on (e.g., "cell-1737748395000-3")
  amount: number;
  multiplier: number;
  direction: 'UP' | 'DOWN';
  timestamp: number;
}

export interface GameState {
  // State
  currentPrice: number;
  priceHistory: PricePoint[];
  activeRound: ActiveRound | null; // Keep for backward compatibility
  activeBets: ActiveBet[]; // Multiple concurrent bets
  targetCells: TargetCell[];
  isPlacingBet: boolean;
  isSettling: boolean;
  error: string | null;

  // Actions
  placeBet: (amount: string, targetId: string) => Promise<void>;
  placeBetFromHouseBalance: (amount: string, targetId: string, userAddress: string, cellId?: string) => Promise<{ betId: string; remainingBalance: number; bet: ActiveBet } | void>;
  addActiveBet: (bet: ActiveBet) => void;
  resolveBet: (betId: string, won: boolean, payout: number) => void;
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
  activeBets: [], // Multiple concurrent bets
  targetCells: DEFAULT_TARGET_CELLS,
  isPlacingBet: false,
  isSettling: false,
  error: null,

  /**
   * Place a bet on a target cell
   * Initiates transaction to deposit FLOW tokens and create bet on-chain
   * @param amount - Bet amount in FLOW tokens (e.g., "1.0")
   * @param targetId - ID of the target cell (1-8) OR dynamic grid target (e.g., "UP-2.50")
   */
  placeBet: async (amount: string, targetId: string) => {
    const { targetCells, activeRound, currentPrice } = get();

    try {
      // Validate no active round
      if (activeRound) {
        throw new Error("Cannot place bet while a round is active");
      }

      // Validate amount
      const betAmount = parseFloat(amount);
      if (isNaN(betAmount) || betAmount <= 0) {
        throw new Error("Invalid bet amount");
      }

      let target: TargetCell;

      // Check if this is a dynamic grid target (e.g., "UP-2.50" or "DOWN-1.80")
      if (targetId.startsWith('UP-') || targetId.startsWith('DOWN-')) {
        const parts = targetId.split('-');
        const direction = parts[0] as 'UP' | 'DOWN';
        const multiplier = parseFloat(parts[1]) || 1.5;

        // Create dynamic target
        target = {
          id: targetId,
          label: `${direction} x${multiplier}`,
          multiplier: multiplier,
          priceChange: direction === 'UP' ? 10 : -10, // Placeholder
          direction: direction
        };
      } else {
        // Find predefined target cell
        const foundTarget = targetCells.find(cell => cell.id === targetId);
        if (!foundTarget) {
          throw new Error("Invalid target cell");
        }
        target = foundTarget;
      }

      set({ isPlacingBet: true, error: null });

      // Prepare transaction arguments
      // For dynamic targets, use '9' as a special indicator
      const targetCellId = targetId.startsWith('UP-') || targetId.startsWith('DOWN-') ? '9' : target.id;

      // Format values for Flow's fixed-point types (exactly 8 decimal places)
      const formattedAmount = toUFix64(amount);
      const formattedPriceChange = toFix64(target.priceChange);
      const formattedMultiplier = toUFix64(target.multiplier);
      const directionNum = target.direction === 'UP' ? 0 : 1;

      // Execute transaction
      const transactionId = await fcl.mutate({
        cadence: placeBetTransaction(formattedAmount, targetCellId, formattedMultiplier, formattedPriceChange, directionNum),
        args: (arg: any, t: any) => [
          arg(formattedAmount, t.UFix64),
          arg(targetCellId, t.UInt8),
          arg(formattedPriceChange, t.Fix64),
          arg(directionNum.toString(), t.UInt8),
          arg(formattedMultiplier, t.UFix64)
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
   * Place a bet using house balance (no wallet signature required)
   * Instant-resolution system: bet is placed on a specific cell, resolves when chart hits it
   * @param amount - Bet amount in FLOW tokens
   * @param targetId - Dynamic grid target (e.g., "UP-2.50") containing direction and multiplier
   * @param userAddress - User's wallet address
   * @param cellId - Optional: The specific cell ID this bet is placed on
   */
  placeBetFromHouseBalance: async (amount: string, targetId: string, userAddress: string, cellId?: string) => {
    const { targetCells, currentPrice, addActiveBet } = get();

    try {
      // Parse amount for validation
      const betAmount = parseFloat(amount);
      if (isNaN(betAmount) || betAmount <= 0) {
        throw new Error("Invalid bet amount");
      }

      // Ensure address starts with 0x
      const formattedAddress = userAddress.startsWith('0x') ? userAddress : `0x${userAddress}`;

      let target: TargetCell;
      let direction: 'UP' | 'DOWN' = 'UP';
      let multiplier = 1.5;

      // Check if this is a dynamic grid target (e.g., "UP-2.50" or "DOWN-1.80")
      if (targetId.startsWith('UP-') || targetId.startsWith('DOWN-')) {
        const parts = targetId.split('-');
        direction = parts[0] as 'UP' | 'DOWN';
        multiplier = parseFloat(parts[1]) || 1.5;

        // Create dynamic target
        target = {
          id: targetId,
          label: `${direction} x${multiplier}`,
          multiplier: multiplier,
          priceChange: direction === 'UP' ? 10 : -10,
          direction: direction
        };
      } else {
        // Find predefined target cell
        const foundTarget = targetCells.find(cell => cell.id === targetId);
        if (!foundTarget) {
          throw new Error("Invalid target cell");
        }
        target = foundTarget;
        direction = target.direction;
        multiplier = target.multiplier;
      }

      set({ isPlacingBet: true, error: null });

      // Call API endpoint to place bet from house balance
      const response = await fetch('/api/balance/bet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: formattedAddress,
          betAmount,
          roundId: Date.now(),
          targetPrice: currentPrice,
          isOver: direction === 'UP',
          multiplier: multiplier,
          targetCell: {
            id: 9, // Always use 9 for dynamic grid bets
            priceChange: target.priceChange,
            direction: direction,
            timeframe: 30,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to place bet');
      }

      const data = await response.json();

      // Create active bet for tracking (instant-resolution system)
      const activeBet: ActiveBet = {
        id: data.betId,
        cellId: cellId || targetId,
        amount: betAmount,
        multiplier: multiplier,
        direction: direction,
        timestamp: Date.now()
      };

      // Add to active bets (multiple bets can be active simultaneously)
      addActiveBet(activeBet);

      set({
        isPlacingBet: false,
        error: null
      });

      // Return bet info for UI
      return {
        betId: data.betId,
        remainingBalance: data.remainingBalance,
        bet: activeBet
      };
    } catch (error) {
      console.error("Error placing bet from house balance:", error);
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
   * Add a new active bet (for instant-resolution system)
   * @param bet - The bet to add
   */
  addActiveBet: (bet: ActiveBet) => {
    const { activeBets } = get();
    set({ activeBets: [...activeBets, bet] });
  },

  /**
   * Resolve a bet (win or lose) and update house balance
   * @param betId - The bet ID to resolve
   * @param won - Whether the bet was won
   * @param payout - The payout amount if won
   */
  resolveBet: (betId: string, won: boolean, payout: number) => {
    const { activeBets } = get();
    // Remove the resolved bet from active bets
    set({ activeBets: activeBets.filter(b => b.id !== betId) });

    // Log resolution for debugging
    console.log(`Bet ${betId} resolved: ${won ? 'WON' : 'LOST'}, payout: ${payout}`);
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
 * Fetches real-time BTC price from Pyth Network every second
 * @param updatePrice - Function to update price in store
 * @returns Function to stop polling
 */
export const startPriceFeed = (
  updatePrice: (price: number) => void
): (() => void) => {
  // Import Pyth price feed dynamically to avoid SSR issues
  import('@/lib/utils/priceFeed').then(({ startPythPriceFeed }) => {
    const stopFeed = startPythPriceFeed((price, data) => {
      updatePrice(price);

      // Log price updates with confidence interval
      console.log(`BTC Price: $${price.toFixed(2)} ±$${data.confidence.toFixed(2)}`);
    });

    // Store cleanup function
    (window as any).__stopPriceFeed = stopFeed;
  }).catch(error => {
    console.error('Failed to start Pyth price feed:', error);

    // Fallback to mock price feed for development
    import('@/lib/utils/priceFeed').then(({ startMockPriceFeed }) => {
      const stopFeed = startMockPriceFeed((price) => {
        updatePrice(price);
      });

      (window as any).__stopPriceFeed = stopFeed;
    });
  });

  // Return cleanup function
  return () => {
    if ((window as any).__stopPriceFeed) {
      (window as any).__stopPriceFeed();
      delete (window as any).__stopPriceFeed;
    }
  };
};
