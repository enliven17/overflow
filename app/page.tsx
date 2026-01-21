'use client';

import React from 'react';
import { GameBoard } from '@/components/game';
import { BetHistory } from '@/components/history';
import { WalletConnect, WalletInfo } from '@/components/wallet';
import { NetworkSelector } from '@/components/NetworkSelector';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div>
              <h1 className="text-3xl font-bold text-[#FF006E]">OVERFLOW</h1>
              <p className="text-gray-400 text-xs">BTC Price Prediction Game</p>
            </div>
            
            {/* Wallet Section */}
            <div className="flex items-center gap-4">
              <NetworkSelector />
              <WalletInfo />
              <WalletConnect />
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Game Board */}
          <GameBoard />
          
          {/* Bet History */}
          <BetHistory />
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-gray-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center text-gray-500 text-sm">
            <p>Overflow - Decentralized BTC Price Prediction Game on Flow Blockchain</p>
            <p className="mt-2 text-xs">⚠️ For entertainment purposes only. Bet responsibly.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
