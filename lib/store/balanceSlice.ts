/**
 * Balance state slice for Zustand store
 * Manages house balance state and operations (deposit, withdraw, bet)
 * 
 * Task: 7.1 Create balanceSlice with state and actions
 * Requirements: 2.1
 */

import { StateCreator } from "zustand";

export interface BalanceState {
  // State
  houseBalance: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchBalance: (address: string) => Promise<void>;
  setBalance: (balance: number) => void;
  updateBalance: (amount: number, operation: 'add' | 'subtract') => void;
  depositFunds: (address: string, amount: number, txHash: string) => Promise<void>;
  withdrawFunds: (address: string, amount: number, txHash: string) => Promise<void>;
  clearError: () => void;
}

/**
 * Create balance slice for Zustand store
 * Handles house balance fetching, updates, deposits, and withdrawals
 */
export const createBalanceSlice: StateCreator<BalanceState> = (set, get) => ({
  // Initial state
  houseBalance: 0,
  isLoading: false,
  error: null,

  /**
   * Fetch house balance for a user address
   * Queries the balance API endpoint
   * @param address - Flow wallet address (0x...)
   */
  fetchBalance: async (address: string) => {
    if (!address) {
      return;
    }

    // Ensure address starts with 0x
    const formattedAddress = address.startsWith('0x') ? address : `0x${address}`;

    try {
      set({ isLoading: true, error: null });

      const response = await fetch(`/api/balance/${formattedAddress}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch balance');
      }

      const data = await response.json();

      set({
        houseBalance: data.balance || 0,
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('Error fetching balance:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch balance'
      });
    }
  },

  /**
   * Set house balance directly
   * Used by event listeners and after successful operations
   * @param balance - New balance value
   */
  setBalance: (balance: number) => {
    set({ houseBalance: balance });
  },

  /**
   * Update house balance by adding or subtracting an amount
   * Used for optimistic updates before API confirmation
   * @param amount - Amount to add or subtract
   * @param operation - 'add' to increase balance, 'subtract' to decrease
   */
  updateBalance: (amount: number, operation: 'add' | 'subtract') => {
    const { houseBalance } = get();
    const newBalance = operation === 'add' 
      ? houseBalance + amount 
      : Math.max(0, houseBalance - amount); // Prevent negative balance

    set({ houseBalance: newBalance });
  },

  /**
   * Process deposit funds operation
   * Called after deposit transaction completes to update database
   * @param address - User wallet address
   * @param amount - Deposit amount in FLOW
   * @param txHash - Transaction hash for audit trail
   */
  depositFunds: async (address: string, amount: number, txHash: string) => {
    // Ensure address starts with 0x
    const formattedAddress = address.startsWith('0x') ? address : `0x${address}`;

    try {
      set({ isLoading: true, error: null });

      const response = await fetch('/api/balance/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: formattedAddress,
          amount,
          txHash,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process deposit');
      }

      const data = await response.json();

      set({
        houseBalance: data.newBalance,
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('Error processing deposit:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to process deposit'
      });
      throw error;
    }
  },

  /**
   * Process withdraw funds operation
   * Called after withdrawal transaction completes to update database
   * @param address - User wallet address
   * @param amount - Withdrawal amount in FLOW
   * @param txHash - Transaction hash for audit trail
   */
  withdrawFunds: async (address: string, amount: number, txHash: string) => {
    // Ensure address starts with 0x
    const formattedAddress = address.startsWith('0x') ? address : `0x${address}`;

    try {
      set({ isLoading: true, error: null });

      const response = await fetch('/api/balance/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: formattedAddress,
          amount,
          txHash,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process withdrawal');
      }

      const data = await response.json();

      set({
        houseBalance: data.newBalance,
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to process withdrawal'
      });
      throw error;
    }
  },

  /**
   * Clear error message
   */
  clearError: () => {
    set({ error: null });
  }
});
