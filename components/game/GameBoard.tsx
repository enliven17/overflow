'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { LiveChart } from './LiveChart';
import { BalanceDisplay } from '@/components/balance';

export const GameBoard: React.FC = () => {
  const [betAmount, setBetAmount] = useState<string>('1.0');
  const [activeTab, setActiveTab] = useState<'bet' | 'wallet'>('bet');
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  // Instant resolution system - no activeRound needed
  const address = useStore((state) => state.address);
  const balance = useStore((state) => state.balance);
  const isConnected = useStore((state) => state.isConnected);

  const formatAddress = (addr: string) => {
    if (!addr || addr.length <= 10) return addr || '---';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatBalance = (bal: string) => {
    const num = parseFloat(bal);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  return (
    <div className="relative w-full h-full flex overflow-hidden">
      {/* Main Interactive Chart */}
      <div className="absolute inset-0 z-0">
        <LiveChart
          betAmount={betAmount}
          setBetAmount={setBetAmount}
        />
      </div>

      {/* Instant resolution - no timer needed */}

      {/* Floating Toggle Button - Fixed to bottom (Mobile only) */}
      {!isPanelOpen && (
        <button
          onClick={() => setIsPanelOpen(true)}
          className="sm:hidden fixed bottom-4 left-4 w-10 h-10 bg-purple-600 rounded-full shadow-lg shadow-purple-500/40 flex items-center justify-center text-white text-lg font-bold z-40"
        >
          ▲
        </button>
      )}

      {/* Modern Quick Bet Panel - Collapsible on Mobile */}
      <div className="absolute bottom-3 sm:bottom-6 left-3 right-3 sm:left-6 sm:right-auto z-30 pointer-events-none">

        {/* Panel - Animated slide up/down on mobile */}
        <div className={`bg-gradient-to-br from-black/95 via-purple-950/30 to-black/95 backdrop-blur-xl border border-purple-500/20 rounded-2xl shadow-2xl overflow-hidden w-full sm:w-[300px] transition-all duration-300 ease-out pointer-events-auto ${isPanelOpen
          ? 'translate-y-0 opacity-100 scale-100'
          : 'translate-y-full opacity-0 scale-95 !pointer-events-none sm:translate-y-0 sm:opacity-100 sm:scale-100 sm:!pointer-events-auto'
          }`}>

          {/* Close button for mobile */}
          <button
            onClick={() => setIsPanelOpen(false)}
            className="sm:hidden absolute top-2 right-2 w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-gray-400 hover:text-white text-xs z-10"
          >
            ✕
          </button>

          {/* Tab Navigation - Pill Style */}
          <div className="flex gap-1 p-2 bg-black/40">
            <button
              onClick={() => setActiveTab('bet')}
              className={`flex-1 flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${activeTab === 'bet'
                ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              Bet
            </button>
            <button
              onClick={() => setActiveTab('wallet')}
              className={`flex-1 flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${activeTab === 'wallet'
                ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              Wallet
            </button>
          </div>

          {/* Content Area - Fixed Height */}
          <div className="p-4 min-h-[180px]">
            {activeTab === 'bet' ? (
              <div className="space-y-4">
                {/* Amount Presets */}
                <div>
                  <label className="text-gray-500 text-[10px] font-medium uppercase tracking-widest mb-2 block">
                    Quick Amount
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[1, 5, 10, 25, 50].map(amt => (
                      <button
                        key={amt}
                        onClick={() => setBetAmount(amt.toString())}
                        className={`
                          py-2.5 rounded-lg font-bold text-sm transition-all duration-200
                          ${betAmount === amt.toString()
                            ? 'bg-gradient-to-b from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30 scale-105'
                            : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:scale-102'
                          }
                        `}
                      >
                        {amt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Input */}
                <div>
                  <label className="text-gray-500 text-[10px] font-medium uppercase tracking-widest mb-2 block">
                    Custom Amount
                  </label>
                  <div className="flex items-center bg-black/40 rounded-xl p-1 border border-white/5">
                    <input
                      type="number"
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      className="flex-1 bg-transparent px-2 py-2 text-white font-mono text-base focus:outline-none min-w-0"
                      placeholder="0.00"
                    />
                    <span className="px-2 py-1.5 bg-purple-500/20 rounded-lg text-purple-400 text-[10px] font-bold shrink-0">
                      FLOW
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {isConnected && address ? (
                  <>
                    {/* House Balance Display */}
                    <BalanceDisplay />

                    {/* Address Card */}
                    <div className="bg-black/30 rounded-xl p-3 border border-white/5">
                      <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">Wallet Address</p>
                      <p className="text-white font-mono text-sm">{formatAddress(address)}</p>
                    </div>

                    {/* Wallet Balance Display */}
                    <div className="bg-gradient-to-br from-purple-500/10 to-transparent rounded-xl p-4 border border-purple-500/20">
                      <p className="text-gray-400 text-[10px] uppercase tracking-widest mb-1">Wallet Balance</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-white">{formatBalance(balance)}</span>
                        <span className="text-purple-400 text-sm font-medium">FLOW</span>
                      </div>
                    </div>

                    {/* Disconnect Button */}
                    <button
                      onClick={() => useStore.getState().disconnect()}
                      className="w-full py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs font-semibold hover:bg-red-500/20 transition-all duration-200"
                    >
                      Disconnect Wallet
                    </button>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm">No wallet connected</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
