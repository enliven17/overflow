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
          <h1 className="flex items-center gap-3">
            <span
              className="text-3xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-400 to-white"
              style={{ fontFamily: 'var(--font-orbitron)' }}
            >
              OVERFLOW
            </span>
            <span className="text-purple-400 text-[10px] font-mono font-normal border border-purple-400/50 px-2 py-0.5 rounded bg-purple-400/10">
              BETA
            </span>
          </h1>
        </div>

        <div className="pointer-events-auto flex items-center gap-4">
          <NetworkSelector />
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
