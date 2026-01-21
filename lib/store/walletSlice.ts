/**
 * Wallet state slice for Zustand store
 * Manages wallet connection, authentication, and balance
 */

import * as fcl from "@onflow/fcl";
import { StateCreator } from "zustand";

export interface WalletState {
  // State
  address: string | null;
  balance: string;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
  clearError: () => void;
}

/**
 * Create wallet slice for Zustand store
 * Handles wallet connection, disconnection, and balance management
 */
export const createWalletSlice: StateCreator<WalletState> = (set, get) => ({
  // Initial state
  address: null,
  balance: "0.0",
  isConnected: false,
  isConnecting: false,
  error: null,
  
  /**
   * Connect wallet using FCL authentication
   * Triggers FCL authentication flow and updates state on success/failure
   * Persists session to localStorage for automatic restoration
   */
  connect: async () => {
    try {
      set({ isConnecting: true, error: null });
      
      // Authenticate with FCL
      await fcl.authenticate();
      
      // Get current user
      const user = await fcl.currentUser.snapshot();
      
      if (user.loggedIn && user.addr) {
        // Update state with connected wallet
        set({
          address: user.addr,
          isConnected: true,
          isConnecting: false,
          error: null
        });
        
        // Persist session to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('overflow_wallet_session', JSON.stringify({
            address: user.addr,
            timestamp: Date.now()
          }));
        }
        
        // Fetch initial balance
        await get().refreshBalance();
      } else {
        throw new Error("Authentication failed");
      }
    } catch (error) {
      console.error("Wallet connection error:", error);
      set({
        isConnecting: false,
        error: error instanceof Error ? error.message : "Failed to connect wallet"
      });
    }
  },
  
  /**
   * Disconnect wallet and clear session
   * Unauthenticates from FCL and clears localStorage
   */
  disconnect: () => {
    fcl.unauthenticate();
    
    // Clear localStorage session
    if (typeof window !== 'undefined') {
      localStorage.removeItem('overflow_wallet_session');
    }
    
    // Reset state
    set({
      address: null,
      balance: "0.0",
      isConnected: false,
      isConnecting: false,
      error: null
    });
  },
  
  /**
   * Refresh FLOW token balance for connected wallet
   * Queries blockchain for current balance
   */
  refreshBalance: async () => {
    const { address, isConnected } = get();
    
    if (!isConnected || !address) {
      return;
    }
    
    try {
      // Query balance using FCL script
      const balance = await fcl.query({
        cadence: `
          import FlowToken from 0xFlowToken
          import FungibleToken from 0xFungibleToken
          
          access(all) fun main(address: Address): UFix64 {
            let account = getAccount(address)
            
            // Try to borrow the balance capability
            if let vaultRef = account.capabilities.get<&{FungibleToken.Balance}>(/public/flowTokenBalance).borrow() {
              return vaultRef.balance
            }
            
            // If capability doesn't exist, return 0.0
            return 0.0
          }
        `,
        args: (arg: any, t: any) => [arg(address, t.Address)]
      });
      
      // Update balance in state
      set({ balance: balance.toString() });
    } catch (error) {
      console.error("Error refreshing balance:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to refresh balance"
      });
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
 * Restore wallet session from localStorage
 * Should be called on app initialization
 * @returns Promise that resolves when session is restored (or fails)
 */
export const restoreWalletSession = async (
  connect: () => Promise<void>
): Promise<void> => {
  try {
    // Only run on client-side
    if (typeof window === 'undefined') {
      return;
    }
    
    // Check if user is already authenticated with FCL
    const user = await fcl.currentUser.snapshot();
    
    if (user.loggedIn && user.addr) {
      // User is already authenticated, trigger connect to update state
      await connect();
      return;
    }
    
    // Check localStorage for previous session
    const sessionData = localStorage.getItem('overflow_wallet_session');
    
    if (sessionData) {
      const session = JSON.parse(sessionData);
      
      // Check if session is recent (within 24 hours)
      const sessionAge = Date.now() - session.timestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (sessionAge < maxAge) {
        // Attempt to restore session
        await connect();
      } else {
        // Session expired, clear it
        localStorage.removeItem('overflow_wallet_session');
      }
    }
  } catch (error) {
    console.error("Error restoring wallet session:", error);
    // Clear invalid session
    if (typeof window !== 'undefined') {
      localStorage.removeItem('overflow_wallet_session');
    }
  }
};
