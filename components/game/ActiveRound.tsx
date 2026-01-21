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
    <Card glowEffect className="border-2">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-[#FF006E]">Active Round</h3>
          <span className={`
            px-3 py-1 rounded text-sm font-bold uppercase
            ${status === 'active' ? 'bg-green-900/50 text-green-400' : ''}
            ${status === 'settling' ? 'bg-yellow-900/50 text-yellow-400' : ''}
            ${status === 'settled' ? 'bg-gray-900/50 text-gray-400' : ''}
          `}>
            {status}
          </span>
        </div>
        
        {/* Bet Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-900 rounded p-3">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Bet Amount</p>
            <p className="text-white text-lg font-bold">{amount} FLOW</p>
          </div>
          
          <div className="bg-gray-900 rounded p-3">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Target</p>
            <p className="text-white text-lg font-bold">{target.label}</p>
          </div>
        </div>
        
        {/* Price Information */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Start Price:</span>
            <span className="text-white font-semibold">${startPrice.toLocaleString()}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Current Price:</span>
            <span className="text-white font-semibold">${currentPrice.toLocaleString()}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Price Change:</span>
            <span className={`font-bold ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent}%)
            </span>
          </div>
        </div>
        
        {/* Status Indicator */}
        {status === 'active' && (
          <div className={`
            border-2 rounded p-3 text-center
            ${isWinning 
              ? 'border-green-500 bg-green-900/20' 
              : 'border-red-500 bg-red-900/20'
            }
          `}>
            <p className={`text-lg font-bold ${isWinning ? 'text-green-400' : 'text-red-400'}`}>
              {isWinning ? '✓ Currently Winning!' : '✗ Currently Losing'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Need {target.direction === 'UP' ? '+' : ''}{target.priceChange} to win
            </p>
          </div>
        )}
        
        {/* Potential Payout */}
        <div className="bg-[#FF006E]/10 border border-[#FF006E] rounded p-3">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Potential Win</p>
          <p className="text-[#FF006E] text-2xl font-bold">{potentialPayout} FLOW</p>
          <p className="text-gray-400 text-xs mt-1">x{target.multiplier} multiplier</p>
        </div>
      </div>
    </Card>
  );
};
