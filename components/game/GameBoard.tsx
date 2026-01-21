'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { LiveChart } from './LiveChart';
import { RoundTimer } from './RoundTimer';

export const GameBoard: React.FC = () => {
  const [betAmount, setBetAmount] = useState<string>('1.0');
  const [activeTab, setActiveTab] = useState<'bet' | 'wallet'>('bet');

  const activeRound = useStore((state) => state.activeRound);
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

      {/* Timer Overlay */}
      {activeRound && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="pointer-events-auto scale-125">
            <RoundTimer />
          </div>
        </div>
      )}

      {/* Quick Bet Panel - Mobile Responsive */}
      <div className="absolute bottom-2 sm:bottom-8 left-2 right-2 sm:left-8 sm:right-auto z-30">
        <div className="bg-black/90 backdrop-blur-md border border-white/10 rounded-xl shadow-xl overflow-hidden sm:min-w-[240px]">
          {/* Tabs */}
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setActiveTab('bet')}
              className={`flex-1 px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider transition-all ${activeTab === 'bet'
                ? 'bg-purple-500/20 text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-500 hover:text-white hover:bg-white/5'
                }`}
            >
              Bet
            </button>
            <button
              onClick={() => setActiveTab('wallet')}
              className={`flex-1 px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider transition-all ${activeTab === 'wallet'
                ? 'bg-purple-500/20 text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-500 hover:text-white hover:bg-white/5'
                }`}
            >
              Wallet
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-3 sm:p-4">
            {activeTab === 'bet' ? (
              <>
                <label className="text-gray-400 text-[10px] sm:text-xs font-mono mb-2 block">QUICK BET</label>
                <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                  {[1, 5, 10, 25, 50].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setBetAmount(amt.toString())}
                      className={`
                        px-2.5 sm:px-3 py-1.5 sm:py-2 rounded font-mono font-bold text-xs sm:text-sm border transition-all
                        ${betAmount === amt.toString()
                          ? 'bg-purple-500 text-white border-purple-400'
                          : 'bg-white/5 text-white border-white/10 hover:bg-white/10'
                        }
                      `}
                    >
                      {amt}
                    </button>
                  ))}
                </div>
                <div className="mt-2 sm:mt-3 flex items-center gap-2">
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    className="bg-black/50 border border-white/20 rounded px-2 sm:px-3 py-1 text-white font-mono w-20 sm:w-24 text-sm focus:border-purple-400 outline-none"
                  />
                  <span className="text-[10px] sm:text-xs text-gray-500 font-mono">FLOW</span>
                </div>
              </>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {isConnected && address ? (
                  <>
                    <div>
                      <p className="text-gray-500 text-[10px] uppercase tracking-wider font-mono">Address</p>
                      <p className="text-white font-mono text-xs sm:text-sm">{formatAddress(address)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-[10px] uppercase tracking-wider font-mono">Balance</p>
                      <p className="text-purple-400 font-bold text-lg sm:text-xl font-mono">
                        {formatBalance(balance)} <span className="text-xs sm:text-sm text-gray-400">FLOW</span>
                      </p>
                    </div>
                    <button
                      onClick={() => useStore.getState().disconnect()}
                      className="w-full mt-1 sm:mt-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-red-500/20 border border-red-500/50 text-red-400 rounded font-mono text-[10px] sm:text-xs hover:bg-red-500/30 transition-all"
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <p className="text-gray-500 text-xs sm:text-sm font-mono">Not connected</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
