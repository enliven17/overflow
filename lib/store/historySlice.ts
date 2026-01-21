/**
 * History state slice for Zustand store
 * Manages bet history, fetching from blockchain events, and persistence
 */

import * as fcl from "@onflow/fcl";
import { StateCreator } from "zustand";
import { BetRecord } from "@/types/bet";
import { TargetCell } from "@/types/game";

export interface HistoryState {
  // State
  bets: BetRecord[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchHistory: (playerAddress: string) => Promise<void>;
  addBet: (bet: BetRecord) => void;
  clearHistory: () => void;
  clearError: () => void;
}

// Maximum bets to store in localStorage
const MAX_STORED_BETS = 50;

/**
 * Create history slice for Zustand store
 * Handles bet history fetching, storage, and management
 */
export const createHistorySlice: StateCreator<HistoryState> = (set, get) => ({
  // Initial state
  bets: [],
  isLoading: false,
  error: null,
  
  /**
   * Fetch bet history from blockchain events
   * Queries BetPlaced and RoundSettled events for the player
   * @param playerAddress - The player's Flow address
   */
  fetchHistory: async (playerAddress: string) => {
    try {
      set({ isLoading: true, error: null });
      
      // Get contract address from FCL config
      const contractAddress = await fcl.config.get('0xOverflowGame') as string;
      const cleanAddress = contractAddress.replace(/^0x/, '');
      
      // Fetch BetPlaced events using pollEvents helper
      const { pollEvents } = await import("@/lib/flow/events");
      const betPlacedEvents = await pollEvents(
        cleanAddress,
        'BetPlaced',
        'latest',
        'latest'
      );
      
      // Fetch RoundSettled events
      const roundSettledEvents = await pollEvents(
        cleanAddress,
        'RoundSettled',
        'latest',
        'latest'
      );
      
      // Filter events for this player
      const playerBetEvents = betPlacedEvents.filter((event: any) => 
        event.data.player === playerAddress
      );
      
      const playerSettledEvents = roundSettledEvents.filter((event: any) => 
        event.data.player === playerAddress
      );
      
      // Create map of settled bets
      const settledBetsMap = new Map<string, any>();
      playerSettledEvents.forEach((event: any) => {
        settledBetsMap.set(event.data.betId, event.data);
      });
      
      // Build bet records
      const betRecords: BetRecord[] = playerBetEvents.map((event: any) => {
        const betId = event.data.betId;
        const settledData = settledBetsMap.get(betId);
        
        // Parse target cell data
        const priceChange = parseFloat(event.data.priceChange);
        const direction = event.data.direction === '0' ? 'UP' : 'DOWN';
        const multiplier = parseFloat(event.data.multiplier);
        
        const target: TargetCell = {
          id: event.data.targetCellId,
          label: `${priceChange >= 0 ? '+' : ''}$${Math.abs(priceChange)} in 30s`,
          multiplier,
          priceChange,
          direction
        };
        
        // Create bet record
        const record: BetRecord = {
          id: betId,
          timestamp: parseFloat(event.data.startTime) * 1000, // Convert to milliseconds
          amount: event.data.amount,
          target,
          startPrice: parseFloat(event.data.startPrice),
          endPrice: settledData ? parseFloat(settledData.endPrice) : 0,
          actualChange: settledData ? parseFloat(settledData.actualPriceChange) : 0,
          won: settledData ? settledData.won : false,
          payout: settledData ? settledData.payout : "0.0"
        };
        
        return record;
      });
      
      // Sort by timestamp (newest first)
      betRecords.sort((a, b) => b.timestamp - a.timestamp);
      
      // Update state
      set({
        bets: betRecords,
        isLoading: false,
        error: null
      });
      
      // Persist to localStorage (last 50 bets)
      saveBetsToLocalStorage(betRecords.slice(0, MAX_STORED_BETS));
    } catch (error) {
      console.error("Error fetching bet history:", error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to fetch bet history"
      });
      
      // Try to load from localStorage on error
      const cachedBets = loadBetsFromLocalStorage();
      if (cachedBets.length > 0) {
        set({ bets: cachedBets });
      }
    }
  },
  
  /**
   * Add a new bet to history
   * Used when a bet is placed to immediately update UI
   * @param bet - The bet record to add
   */
  addBet: (bet: BetRecord) => {
    const { bets } = get();
    
    // Check if bet already exists
    const existingIndex = bets.findIndex(b => b.id === bet.id);
    
    let updatedBets: BetRecord[];
    if (existingIndex >= 0) {
      // Update existing bet
      updatedBets = [...bets];
      updatedBets[existingIndex] = bet;
    } else {
      // Add new bet at the beginning
      updatedBets = [bet, ...bets];
    }
    
    // Sort by timestamp (newest first)
    updatedBets.sort((a, b) => b.timestamp - a.timestamp);
    
    set({ bets: updatedBets });
    
    // Persist to localStorage
    saveBetsToLocalStorage(updatedBets.slice(0, MAX_STORED_BETS));
  },
  
  /**
   * Clear all bet history
   */
  clearHistory: () => {
    set({ bets: [] });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('overflow_bet_history');
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
 * Save bets to localStorage
 * @param bets - Array of bet records to save
 */
const saveBetsToLocalStorage = (bets: BetRecord[]): void => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('overflow_bet_history', JSON.stringify(bets));
    }
  } catch (error) {
    console.error("Error saving bets to localStorage:", error);
  }
};

/**
 * Load bets from localStorage
 * @returns Array of bet records from localStorage
 */
const loadBetsFromLocalStorage = (): BetRecord[] => {
  try {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem('overflow_bet_history');
      if (data) {
        return JSON.parse(data);
      }
    }
  } catch (error) {
    console.error("Error loading bets from localStorage:", error);
  }
  return [];
};

/**
 * Restore bet history from localStorage
 * Should be called on app initialization
 * @param setBets - Function to set bets in store
 */
export const restoreBetHistory = (setBets: (bets: BetRecord[]) => void): void => {
  const cachedBets = loadBetsFromLocalStorage();
  if (cachedBets.length > 0) {
    setBets(cachedBets);
  }
};

/**
 * Calculate bet history statistics
 * @param bets - Array of bet records
 * @returns Statistics object with wins, losses, and net profit/loss
 */
export const calculateBetStats = (bets: BetRecord[]) => {
  const settledBets = bets.filter(bet => bet.endPrice > 0);
  
  const wins = settledBets.filter(bet => bet.won).length;
  const losses = settledBets.filter(bet => !bet.won).length;
  
  const totalWagered = settledBets.reduce(
    (sum, bet) => sum + parseFloat(bet.amount),
    0
  );
  
  const totalPayout = settledBets.reduce(
    (sum, bet) => sum + (bet.won ? parseFloat(bet.payout) : 0),
    0
  );
  
  const netProfit = totalPayout - totalWagered;
  
  return {
    totalBets: settledBets.length,
    wins,
    losses,
    winRate: settledBets.length > 0 ? (wins / settledBets.length) * 100 : 0,
    totalWagered,
    totalPayout,
    netProfit
  };
};

/**
 * Filter bets by outcome
 * @param bets - Array of bet records
 * @param filter - Filter type: 'all', 'wins', 'losses', 'active'
 * @returns Filtered array of bet records
 */
export const filterBets = (
  bets: BetRecord[],
  filter: 'all' | 'wins' | 'losses' | 'active'
): BetRecord[] => {
  switch (filter) {
    case 'wins':
      return bets.filter(bet => bet.endPrice > 0 && bet.won);
    case 'losses':
      return bets.filter(bet => bet.endPrice > 0 && !bet.won);
    case 'active':
      return bets.filter(bet => bet.endPrice === 0);
    case 'all':
    default:
      return bets;
  }
};
