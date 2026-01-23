'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useOverflowStore } from '@/lib/store';
import { configureFlow } from '@/lib/flow/config';
import { restoreWalletSession } from '@/lib/store/walletSlice';
import { startPriceFeed } from '@/lib/store/gameSlice';

export function Providers({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false);
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    // Prevent double initialization in development
    if (initialized.current) return;
    initialized.current = true;
    
    const initializeApp = async () => {
      try {
        // Configure Flow for emulator (change to 'testnet' or 'mainnet' as needed)
        const network = (process.env.NEXT_PUBLIC_FLOW_NETWORK as 'emulator' | 'testnet' | 'mainnet') || 'emulator';
        
        configureFlow(network);
        
        // Get store methods directly without subscribing
        const { connect, updatePrice, loadTargetCells } = useOverflowStore.getState();
        
        // Restore wallet session
        await restoreWalletSession(connect).catch(console.error);
        
        // Load target cells
        await loadTargetCells().catch(console.error);
        
        // Start Pyth Network price feed
        console.log('Starting Pyth Network price feed for real-time BTC/USD prices');
        const stopPriceFeed = startPriceFeed(updatePrice);
        
        // Mark as ready
        setIsReady(true);
        
        // Cleanup
        return () => {
          stopPriceFeed();
        };
      } catch (error) {
        console.error('Error initializing app:', error);
        // Still mark as ready to show the app even if initialization fails
        setIsReady(true);
      }
    };
    
    initializeApp();
  }, []); // Empty deps - only run once
  
  // Show loading state while initializing
  if (!isReady) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF006E] mx-auto mb-4"></div>
          <p className="text-gray-400">Initializing Overflow...</p>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}
