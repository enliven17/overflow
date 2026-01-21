'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';

export const RoundTimer: React.FC = () => {
  const activeRound = useStore((state) => state.activeRound);
  const settleRound = useStore((state) => state.settleRound);
  const isSettling = useStore((state) => state.isSettling);
  
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [canSettle, setCanSettle] = useState<boolean>(false);
  const [manualSettleAvailable, setManualSettleAvailable] = useState<boolean>(false);
  
  useEffect(() => {
    if (!activeRound || activeRound.status !== 'active') {
      setTimeRemaining(0);
      setCanSettle(false);
      setManualSettleAvailable(false);
      return;
    }
    
    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, activeRound.endTime - now);
      const remainingSeconds = Math.ceil(remaining / 1000);
      
      setTimeRemaining(remainingSeconds);
      
      // Can settle when time is up
      if (remaining <= 0) {
        setCanSettle(true);
        
        // Manual settle available after 5 minutes
        const timeSinceEnd = now - activeRound.endTime;
        if (timeSinceEnd > 5 * 60 * 1000) {
          setManualSettleAvailable(true);
        }
      }
    };
    
    // Update immediately
    updateTimer();
    
    // Update every 100ms for smooth countdown
    const interval = setInterval(updateTimer, 100);
    
    return () => clearInterval(interval);
  }, [activeRound]);
  
  const handleSettle = async () => {
    if (activeRound && canSettle) {
      try {
        await settleRound(activeRound.betId);
      } catch (error) {
        console.error('Error settling round:', error);
      }
    }
  };
  
  if (!activeRound || activeRound.status !== 'active') {
    return null;
  }
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="bg-[#0a0a0a] border-2 border-[#FF006E] rounded-lg p-4 shadow-[0_0_20px_rgba(255,0,110,0.3)]">
      <div className="text-center space-y-3">
        {/* Timer Display */}
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Time Remaining</p>
          <p className={`
            text-5xl font-bold font-mono
            ${timeRemaining > 10 ? 'text-[#FF006E]' : 'text-yellow-400 animate-pulse'}
          `}>
            {formatTime(timeRemaining)}
          </p>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-[#FF006E] h-full transition-all duration-100"
            style={{
              width: `${Math.max(0, Math.min(100, (timeRemaining / 30) * 100))}%`
            }}
          />
        </div>
        
        {/* Settle Button */}
        {canSettle && (
          <div className="space-y-2">
            <Button
              onClick={handleSettle}
              disabled={isSettling}
              className="w-full"
              size="lg"
            >
              {isSettling ? 'Settling...' : 'Settle Round'}
            </Button>
            
            {manualSettleAvailable && (
              <p className="text-yellow-400 text-xs">
                ⚠️ Auto-settlement timeout. Manual settlement required.
              </p>
            )}
          </div>
        )}
        
        {!canSettle && timeRemaining <= 5 && (
          <p className="text-yellow-400 text-sm animate-pulse">
            Round ending soon...
          </p>
        )}
      </div>
    </div>
  );
};
