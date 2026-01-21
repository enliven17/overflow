'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { LiveChart } from './LiveChart';
import { TargetGrid } from './TargetGrid';
import { BetControls } from './BetControls';
import { ActiveRound } from './ActiveRound';
import { RoundTimer } from './RoundTimer';

export const GameBoard: React.FC = () => {
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState<string>('');
  
  const placeBet = useStore((state) => state.placeBet);
  const activeRound = useStore((state) => state.activeRound);
  
  const handlePlaceBet = async () => {
    if (selectedTarget && betAmount) {
      try {
        await placeBet(betAmount, selectedTarget);
        // Reset form after successful bet
        setSelectedTarget(null);
        setBetAmount('');
      } catch (error) {
        console.error('Error placing bet:', error);
      }
    }
  };
  
  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Main Game Area - Split Screen */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Side - Chart */}
          <div className="space-y-4">
            <LiveChart />
            
            {/* Active Round Display (below chart on left side) */}
            {activeRound && (
              <div className="space-y-4">
                <RoundTimer />
                <ActiveRound />
              </div>
            )}
          </div>
          
          {/* Right Side - Betting Interface */}
          <div className="space-y-4">
            <BetControls
              selectedTarget={selectedTarget}
              betAmount={betAmount}
              onBetAmountChange={setBetAmount}
              onPlaceBet={handlePlaceBet}
            />
            
            <TargetGrid
              selectedTarget={selectedTarget}
              onSelectTarget={setSelectedTarget}
              betAmount={betAmount}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
