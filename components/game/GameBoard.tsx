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
    <div className="relative w-full h-full flex overflow-hidden">
      {/* Background Chart - Z-0 */}
      <div className="absolute inset-0 z-0">
        <LiveChart />
      </div>

      {/* Active Round Overlay - Centered or Top */}
      {activeRound && (
        <div className="absolute top-32 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="pointer-events-auto scale-125">
            <RoundTimer />
          </div>
        </div>
      )}

      {/* Right Sidebar - Grid Bet Panel - Z-30 */}
      <div className="absolute right-6 top-24 bottom-6 w-[380px] z-30 flex flex-col gap-4">

        {/* Bet Amount Control - Compact Top Bar */}
        <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl">
          <BetControls
            selectedTarget={selectedTarget}
            betAmount={betAmount}
            onBetAmountChange={setBetAmount}
            onPlaceBet={handlePlaceBet}
          />
        </div>

        {/* Target Grid - Main Area */}
        <div className="flex-1 bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl overflow-y-auto">
          <TargetGrid
            selectedTarget={selectedTarget}
            onSelectTarget={setSelectedTarget}
            betAmount={betAmount}
          />
        </div>

        {activeRound && (
          <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl">
            <ActiveRound />
          </div>
        )}
      </div>
    </div>
  );
};
