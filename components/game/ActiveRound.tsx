'use client';

import React from 'react';
import { useStore } from '@/lib/store';
import { Card } from '@/components/ui/Card';

export const ActiveRound: React.FC = () => {
  const activeRound = useStore((state) => state.activeRound);
  const currentPrice = useStore((state) => state.currentPrice);

  if (!activeRound) {
    return null;
  }

  const { amount, target, startPrice, status } = activeRound;

  // Calculate current price change
  const priceChange = currentPrice - startPrice;
  const priceChangePercent = ((priceChange / startPrice) * 100).toFixed(2);

  // Calculate potential payout
  const potentialPayout = (parseFloat(amount) * target.multiplier).toFixed(2);

  // Determine if currently winning
  const isWinning = target.direction === 'UP'
    ? priceChange >= target.priceChange
    : priceChange <= target.priceChange;

  return (
    <Card glowEffect className="border border-neon-blue/50">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-neon-blue tracking-wider font-mono">ACTIVE ROUND</h3>
          <span className={`
            px-3 py-1 rounded text-xs font-bold uppercase tracking-widest
            ${status === 'active' ? 'bg-neon-green/10 text-neon-green border border-neon-green/30' : ''}
            ${status === 'settling' ? 'bg-yellow-900/50 text-yellow-400' : ''}
            ${status === 'settled' ? 'bg-gray-900/50 text-gray-400' : ''}
          `}>
            {status}
          </span>
        </div>

        {/* Bet Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/10 rounded p-3">
            <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1 font-mono">Bet Amount</p>
            <p className="text-white text-lg font-bold font-mono">{amount} FLOW</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded p-3">
            <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-1 font-mono">Target</p>
            <p className="text-white text-lg font-bold font-mono">{target.label}</p>
          </div>
        </div>

        {/* Price Information */}
        <div className="space-y-2 bg-black/20 p-3 rounded border border-white/5">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-xs font-mono">Start Price:</span>
            <span className="text-white font-semibold font-mono">${startPrice.toLocaleString()}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-xs font-mono">Current Price:</span>
            <span className="text-white font-semibold font-mono">${currentPrice.toLocaleString()}</span>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-white/10">
            <span className="text-gray-400 text-xs font-mono">Price Change:</span>
            <span className={`font-bold font-mono ${priceChange >= 0 ? 'text-neon-green' : 'text-red-500'}`}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent}%)
            </span>
          </div>
        </div>

        {/* Status Indicator */}
        {status === 'active' && (
          <div className={`
            border rounded p-3 text-center transition-all duration-300
            ${isWinning
              ? 'border-neon-green/50 bg-neon-green/10 shadow-[0_0_10px_rgba(0,255,157,0.2)]'
              : 'border-red-500/50 bg-red-900/20'
            }
          `}>
            <p className={`text-lg font-bold tracking-wide ${isWinning ? 'text-neon-green' : 'text-red-500'}`}>
              {isWinning ? 'WINNING' : 'LOSING'}
            </p>
            <p className="text-gray-400 text-xs mt-1 font-mono">
              Target: {target.direction === 'UP' ? '+' : ''}{target.priceChange}
            </p>
          </div>
        )}

        {/* Potential Payout */}
        <div className="bg-neon-blue/10 border border-neon-blue/50 rounded p-3 shadow-[0_0_15px_rgba(0,240,255,0.1)]">
          <p className="text-neon-blue text-xs uppercase tracking-wider mb-1 font-mono">Potential Win</p>
          <p className="text-neon-blue text-2xl font-bold font-mono text-shadow-neon">{potentialPayout} FLOW</p>
          <p className="text-neon-blue/70 text-xs mt-1 font-mono">x{target.multiplier} multiplier</p>
        </div>
      </div>
    </Card>
  );
};
