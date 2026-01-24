'use client';

import React, { useState, useRef } from 'react';
import { GameBoard } from '@/components/game';
import { BetHistory } from '@/components/history';
import { WalletConnect, WalletInfo } from '@/components/wallet';
import { useStore } from '@/lib/store';

export default function Home() {
  const [clickCount, setClickCount] = useState(0);
  const clickTimer = useRef<NodeJS.Timeout | null>(null);
  const [demoActivated, setDemoActivated] = useState(false);

  // Get store actions for demo mode
  const setAddress = useStore((state) => state.setAddress);
  const setBalance = useStore((state) => state.setBalance);
  const setIsConnected = useStore((state) => state.setIsConnected);

  const handleOverflowClick = () => {
    // Clear existing timer
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
    }

    const newCount = clickCount + 1;
    setClickCount(newCount);

    // Check if 3 clicks reached
    if (newCount >= 3) {
      // Activate demo mode
      setAddress('0xDEMO1234567890');
      setBalance(1000);
      setIsConnected(true);
      setDemoActivated(true);
      setClickCount(0);

      // Show confirmation briefly
      setTimeout(() => setDemoActivated(false), 2000);
    } else {
      // Reset click count after 1 second of inactivity
      clickTimer.current = setTimeout(() => {
        setClickCount(0);
      }, 1000);
    }
  };

  return (
    <div className="h-screen w-screen bg-[#02040A] overflow-hidden flex flex-col relative">
      {/* Header - Mobile Responsive */}
      <header className="absolute top-0 left-0 right-0 z-50 px-3 sm:px-6 py-2 sm:py-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <div className="pointer-events-auto">
          <h1 className="flex items-center gap-2 sm:gap-3">
            <span
              onClick={handleOverflowClick}
              className="text-xl sm:text-3xl font-black tracking-wider sm:tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-400 to-white cursor-pointer select-none"
              style={{ fontFamily: 'var(--font-orbitron)' }}
            >
              OVERFLOW
            </span>
            <span className="text-yellow-400 text-[10px] font-mono font-normal border border-yellow-400/50 px-2 py-0.5 rounded bg-yellow-400/10">
              TESTNET
            </span>
            {demoActivated && (
              <span className="text-green-400 text-[10px] font-mono font-normal border border-green-400/50 px-2 py-0.5 rounded bg-green-400/10 animate-pulse">
                DEMO MODE
              </span>
            )}
          </h1>
        </div>

        <div className="pointer-events-auto flex items-center gap-2 sm:gap-4">
          <WalletConnect />
        </div>
      </header>

      {/* Main Content - Full Screen */}
      <main className="flex-1 w-full h-full relative">
        <GameBoard />
      </main>
    </div>
  );
}
