/**
 * Main Zustand store for Overflow dApp
 * Combines wallet, game, and history slices
 * Sets up event subscriptions for blockchain events
 */

import { create } from "zustand";
import { WalletState, createWalletSlice, restoreWalletSession } from "./walletSlice";
import { GameState, createGameSlice, startPriceFeed } from "./gameSlice";
import { HistoryState, createHistorySlice, restoreBetHistory } from "./historySlice";
import { BalanceState, createBalanceSlice } from "./balanceSlice";
import { subscribeToBetEvents } from "@/lib/flow/events";
import { BetPlacedEvent, RoundSettledEvent } from "@/lib/flow/events";
import { BetRecord } from "@/types/bet";
import { TargetCell } from "@/types/game";

/**
 * Combined store type
 */
export type OverflowStore = WalletState & GameState & HistoryState & BalanceState;

/**
 * Create the main Zustand store
 * Combines all slices into a single store
 */
export const useOverflowStore = create<OverflowStore>()((...args) => ({
  ...createWalletSlice(...args),
  ...createGameSlice(...args),
  ...createHistorySlice(...args),
  ...createBalanceSlice(...args)
}));

/**
 * Initialize the store
 * Restores sessions, loads data, and sets up event subscriptions
 * Should be called once on app initialization
 */
export const initializeStore = async (): Promise<void> => {
  const store = useOverflowStore.getState();
  
  try {
    // Restore wallet session from localStorage
    await restoreWalletSession(store.connect);
    
    // Restore bet history from localStorage
    restoreBetHistory((bets) => {
      useOverflowStore.setState({ bets });
    });
    
    // Load target cells from blockchain
    await store.loadTargetCells();
    
    // Fetch house balance if wallet is connected
    if (store.address) {
      await store.fetchBalance(store.address);
    }
    
    // Set up event subscriptions
    setupEventSubscriptions();
    
    // Start price feed polling
    const stopPriceFeed = startPriceFeed(store.updatePrice);
    
    // Store cleanup function for later use
    (window as any).__overflowCleanup = () => {
      stopPriceFeed();
    };
    
    console.log("Overflow store initialized successfully");
  } catch (error) {
    console.error("Error initializing store:", error);
  }
};

/**
 * Set up blockchain event subscriptions
 * Listens for BetPlaced and RoundSettled events and updates store
 */
const setupEventSubscriptions = async (): Promise<void> => {
  try {
    // Get contract address from FCL config
    const fcl = await import("@onflow/fcl");
    const contractAddress = await fcl.config.get('0xOverflowGame') as string;
    
    if (!contractAddress) {
      console.warn("Contract address not configured, skipping event subscriptions");
      return;
    }
    
    // Subscribe to bet events
    const unsubscribe = subscribeToBetEvents(
      contractAddress,
      handleBetPlacedEvent,
      handleRoundSettledEvent
    );
    
    // Store cleanup function
    const existingCleanup = (window as any).__overflowCleanup;
    (window as any).__overflowCleanup = () => {
      if (existingCleanup) existingCleanup();
      unsubscribe();
    };
    
    console.log("Event subscriptions set up successfully");
  } catch (error) {
    console.error("Error setting up event subscriptions:", error);
  }
};

/**
 * Handle BetPlaced event
 * Updates active round and adds bet to history
 */
const handleBetPlacedEvent = (event: BetPlacedEvent): void => {
  const store = useOverflowStore.getState();
  
  // Check if this bet is for the current user
  if (store.address && event.player === store.address) {
    // Parse target cell data
    const priceChange = parseFloat(event.priceChange);
    const direction = event.direction === '0' ? 'UP' : 'DOWN';
    const multiplier = parseFloat(event.multiplier);
    
    const target: TargetCell = {
      id: event.targetCellId,
      label: `${priceChange >= 0 ? '+' : ''}$${Math.abs(priceChange)} in 30s`,
      multiplier,
      priceChange,
      direction
    };
    
    // Update active round
    store.setActiveRound({
      betId: event.betId,
      amount: event.amount,
      target,
      startPrice: parseFloat(event.startPrice),
      startTime: parseFloat(event.startTime) * 1000, // Convert to milliseconds
      endTime: parseFloat(event.endTime) * 1000, // Convert to milliseconds
      status: 'active'
    });
    
    // Add to history (as active bet)
    const betRecord: BetRecord = {
      id: event.betId,
      timestamp: parseFloat(event.startTime) * 1000,
      amount: event.amount,
      target,
      startPrice: parseFloat(event.startPrice),
      endPrice: 0, // Not settled yet
      actualChange: 0,
      won: false,
      payout: "0.0"
    };
    
    store.addBet(betRecord);
    
    // Refresh wallet balance
    store.refreshBalance();
    
    // Refresh house balance
    if (store.address) {
      store.fetchBalance(store.address);
    }
  }
};

/**
 * Handle RoundSettled event
 * Updates bet history and clears active round
 */
const handleRoundSettledEvent = (event: RoundSettledEvent): void => {
  const store = useOverflowStore.getState();
  
  // Check if this bet is for the current user
  if (store.address && event.player === store.address) {
    // Find the bet in history
    const existingBet = store.bets.find(bet => bet.id === event.betId);
    
    if (existingBet) {
      // Update bet with settlement data
      const updatedBet: BetRecord = {
        ...existingBet,
        endPrice: parseFloat(event.endPrice),
        actualChange: parseFloat(event.actualPriceChange),
        won: event.won,
        payout: event.payout
      };
      
      store.addBet(updatedBet);
    }
    
    // Update active round status if it matches
    if (store.activeRound && store.activeRound.betId === event.betId) {
      store.setActiveRound({
        ...store.activeRound,
        status: 'settled'
      });
      
      // Clear active round after a delay to show result
      setTimeout(() => {
        const currentStore = useOverflowStore.getState();
        if (currentStore.activeRound?.betId === event.betId) {
          currentStore.setActiveRound(null);
        }
      }, 3000);
    }
    
    // Refresh wallet balance
    store.refreshBalance();
    
    // Refresh house balance
    if (store.address) {
      store.fetchBalance(store.address);
    }
  }
};

/**
 * Cleanup function
 * Stops price feed and unsubscribes from events
 * Should be called when app is unmounted
 */
export const cleanupStore = (): void => {
  if ((window as any).__overflowCleanup) {
    (window as any).__overflowCleanup();
    delete (window as any).__overflowCleanup;
  }
};

/**
 * Export individual selectors for optimized re-renders
 */
export const useWalletAddress = () => useOverflowStore(state => state.address);
export const useWalletBalance = () => useOverflowStore(state => state.balance);
export const useIsConnected = () => useOverflowStore(state => state.isConnected);
export const useCurrentPrice = () => useOverflowStore(state => state.currentPrice);
export const usePriceHistory = () => useOverflowStore(state => state.priceHistory);
export const useActiveRound = () => useOverflowStore(state => state.activeRound);
export const useTargetCells = () => useOverflowStore(state => state.targetCells);
export const useBetHistory = () => useOverflowStore(state => state.bets);
export const useIsPlacingBet = () => useOverflowStore(state => state.isPlacingBet);
export const useIsSettling = () => useOverflowStore(state => state.isSettling);
export const useHouseBalance = () => useOverflowStore(state => state.houseBalance);
export const useIsLoadingBalance = () => useOverflowStore(state => state.isLoading);

/**
 * Export main store hook (alias for convenience)
 */
export const useStore = useOverflowStore;

/**
 * Export actions
 * Note: These selectors return new objects on each call, which can cause infinite loops.
 * Use direct store access (useOverflowStore(state => state.actionName)) instead.
 */
export const useWalletActions = () => {
  const connect = useOverflowStore(state => state.connect);
  const disconnect = useOverflowStore(state => state.disconnect);
  const refreshBalance = useOverflowStore(state => state.refreshBalance);
  return { connect, disconnect, refreshBalance };
};

export const useGameActions = () => {
  const placeBet = useOverflowStore(state => state.placeBet);
  const placeBetFromHouseBalance = useOverflowStore(state => state.placeBetFromHouseBalance);
  const settleRound = useOverflowStore(state => state.settleRound);
  const updatePrice = useOverflowStore(state => state.updatePrice);
  return { placeBet, placeBetFromHouseBalance, settleRound, updatePrice };
};

export const useHistoryActions = () => {
  const fetchHistory = useOverflowStore(state => state.fetchHistory);
  const addBet = useOverflowStore(state => state.addBet);
  const clearHistory = useOverflowStore(state => state.clearHistory);
  return { fetchHistory, addBet, clearHistory };
};

export const useBalanceActions = () => {
  const fetchBalance = useOverflowStore(state => state.fetchBalance);
  const setBalance = useOverflowStore(state => state.setBalance);
  const updateBalance = useOverflowStore(state => state.updateBalance);
  const depositFunds = useOverflowStore(state => state.depositFunds);
  const withdrawFunds = useOverflowStore(state => state.withdrawFunds);
  const clearError = useOverflowStore(state => state.clearError);
  return { fetchBalance, setBalance, updateBalance, depositFunds, withdrawFunds, clearError };
};
