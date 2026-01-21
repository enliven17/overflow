'use client';

import React from 'react';
import { useStore } from '@/lib/store';
import { Card } from '@/components/ui/Card';
import { TargetCell } from '@/types/game';

interface TargetGridProps {
  selectedTarget: string | null;
  onSelectTarget: (targetId: string) => void;
  betAmount: string;
}

export const TargetGrid: React.FC<TargetGridProps> = ({
  selectedTarget,
  onSelectTarget,
  betAmount
}) => {
  const targetCells = useStore((state) => state.targetCells);
  const activeRound = useStore((state) => state.activeRound);
  
  const isDisabled = !!activeRound;
  
  // Calculate potential payout
  const calculatePayout = (multiplier: number) => {
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) return '0.00';
    return (amount * multiplier).toFixed(2);
  };
  
  // Group targets by direction
  const upTargets = targetCells.filter(cell => cell.direction === 'UP');
  const downTargets = targetCells.filter(cell => cell.direction === 'DOWN');
  
  const TargetCellButton: React.FC<{ cell: TargetCell }> = ({ cell }) => {
    const isSelected = selectedTarget === cell.id;
    const payout = calculatePayout(cell.multiplier);
    
    return (
      <button
        onClick={() => !isDisabled && onSelectTarget(cell.id)}
        disabled={isDisabled}
        className={`
          relative p-4 rounded-lg border-2 transition-all duration-200
          ${isSelected 
            ? 'border-[#FF006E] bg-[#FF006E]/20 shadow-[0_0_20px_rgba(255,0,110,0.5)]' 
            : 'border-gray-700 bg-[#0a0a0a] hover:border-[#FF006E]/50'
          }
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {/* Multiplier Badge */}
        <div className="absolute top-2 right-2 bg-[#FF006E] text-white text-xs font-bold px-2 py-1 rounded">
          x{cell.multiplier}
        </div>
        
        {/* Target Label */}
        <div className="text-center mb-2">
          <p className={`text-lg font-bold ${cell.direction === 'UP' ? 'text-green-400' : 'text-red-400'}`}>
            {cell.priceChange > 0 ? '+' : ''}{cell.priceChange}
          </p>
          <p className="text-gray-400 text-xs">in 30s</p>
        </div>
        
        {/* Potential Payout */}
        {isSelected && betAmount && parseFloat(betAmount) > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-700">
            <p className="text-[#FF006E] text-sm font-bold">
              Win: {payout} FLOW
            </p>
          </div>
        )}
      </button>
    );
  };
  
  return (
    <Card>
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-white">Select Target</h3>
        
        {/* UP Targets */}
        <div>
          <h4 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
            <span className="text-xl">↑</span> Price UP
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {upTargets.map(cell => (
              <TargetCellButton key={cell.id} cell={cell} />
            ))}
          </div>
        </div>
        
        {/* DOWN Targets */}
        <div>
          <h4 className="text-red-400 font-semibold mb-3 flex items-center gap-2">
            <span className="text-xl">↓</span> Price DOWN
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {downTargets.map(cell => (
              <TargetCellButton key={cell.id} cell={cell} />
            ))}
          </div>
        </div>
        
        {isDisabled && (
          <p className="text-yellow-500 text-sm text-center">
            Round in progress. Wait for settlement to place a new bet.
          </p>
        )}
      </div>
    </Card>
  );
};
