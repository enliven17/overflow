'use client';

import React from 'react';
import { GameBoard } from '@/components/game';
import { BetHistory } from '@/components/history';
import { WalletConnect, WalletInfo } from '@/components/wallet';
import { NetworkSelector } from '@/components/NetworkSelector';

export default function Home() {
  return (
    <div className="h-screen w-screen bg-[#02040A] overflow-hidden flex flex-col relative">
      {/* Header - Floating minimal */}
      <header className="absolute top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <div className="pointer-events-auto">
          <h1 className="text-2xl font-bold text-white tracking-wider flex items-center gap-2">
            OVERFLOW <span className="text-neon-blue text-xs font-normal border border-neon-blue px-2 py-0.5 rounded">BETA</span>
          </h1>
        </div>

        <div className="pointer-events-auto flex items-center gap-4">
          <NetworkSelector />
          <WalletInfo />
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
