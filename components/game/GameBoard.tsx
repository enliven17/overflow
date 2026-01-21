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

      {/* Quick Bet Panel with Tabs */}
      <div className="absolute bottom-8 left-8 z-30">
        <div className="bg-black/80 backdrop-blur-md border border-white/10 rounded-xl shadow-xl overflow-hidden min-w-[240px]">
          {/* Tabs */}
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setActiveTab('bet')}
              className={`flex-1 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-all ${activeTab === 'bet'
                ? 'bg-neon-blue/20 text-neon-blue border-b-2 border-neon-blue'
                : 'text-gray-500 hover:text-white hover:bg-white/5'
                }`}
            >
              Bet
            </button>
            <button
              onClick={() => setActiveTab('wallet')}
              className={`flex-1 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-all ${activeTab === 'wallet'
                ? 'bg-neon-blue/20 text-neon-blue border-b-2 border-neon-blue'
                : 'text-gray-500 hover:text-white hover:bg-white/5'
                }`}
            >
              Wallet
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {activeTab === 'bet' ? (
              <>
                <label className="text-gray-400 text-xs font-mono mb-2 block">QUICK BET</label>
                <div className="flex gap-2">
                  {[1, 5, 10, 25, 50].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setBetAmount(amt.toString())}
                      className={`
                        px-3 py-2 rounded font-mono font-bold text-sm border transition-all
                        ${betAmount === amt.toString()
                          ? 'bg-neon-blue text-black border-neon-blue shadow-[0_0_10px_rgba(0,240,255,0.5)]'
                          : 'bg-white/5 text-white border-white/10 hover:bg-white/10'
                        }
                      `}
                    >
                      {amt}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    className="bg-black/50 border border-white/20 rounded px-3 py-1 text-white font-mono w-24 focus:border-neon-blue outline-none"
                  />
                  <span className="text-xs text-gray-500 font-mono">FLOW</span>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                {isConnected && address ? (
                  <>
                    <div>
                      <p className="text-gray-500 text-[10px] uppercase tracking-wider font-mono">Address</p>
                      <p className="text-white font-mono text-sm">{formatAddress(address)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-[10px] uppercase tracking-wider font-mono">Balance</p>
                      <p className="text-neon-blue font-bold text-xl font-mono">
                        {formatBalance(balance)} <span className="text-sm text-gray-400">FLOW</span>
                      </p>
                    </div>
                    <button
                      onClick={() => useStore.getState().disconnect()}
                      className="w-full mt-2 px-4 py-2 bg-red-500/20 border border-red-500/50 text-red-400 rounded font-mono text-xs hover:bg-red-500/30 transition-all"
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <p className="text-gray-500 text-sm font-mono">Not connected</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
