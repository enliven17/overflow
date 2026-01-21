'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface BetControlsProps {
  selectedTarget: string | null;
  betAmount: string;
  onBetAmountChange: (amount: string) => void;
  onPlaceBet: () => void;
}

export const BetControls: React.FC<BetControlsProps> = ({
  selectedTarget,
  betAmount,
  onBetAmountChange,
  onPlaceBet
}) => {
  const balance = useStore((state) => state.balance);
  const isConnected = useStore((state) => state.isConnected);
  const activeRound = useStore((state) => state.activeRound);
  const targetCells = useStore((state) => state.targetCells);
  const isPlacingBet = useStore((state) => state.isPlacingBet);
  
  const [error, setError] = useState<string | null>(null);
  
  // Get selected target details
  const selectedTargetCell = targetCells.find(cell => cell.id === selectedTarget);
  
  // Calculate potential payout
  const potentialPayout = selectedTargetCell && betAmount
    ? (parseFloat(betAmount) * selectedTargetCell.multiplier).toFixed(2)
    : '0.00';
  
  // Validate bet
  const validateBet = (): boolean => {
    setError(null);
    
    if (!isConnected) {
      setError('Please connect your wallet');
      return false;
    }
    
    if (activeRound) {
      setError('Round in progress. Wait for settlement.');
      return false;
    }
    
    if (!selectedTarget) {
      setError('Please select a target');
      return false;
    }
    
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid bet amount');
      return false;
    }
    
    const walletBalance = parseFloat(balance);
    if (amount > walletBalance) {
      setError(`Insufficient balance. You have ${walletBalance.toFixed(2)} FLOW`);
      return false;
    }
    
    return true;
  };
  
  const handlePlaceBet = () => {
    if (validateBet()) {
      onPlaceBet();
    }
  };
  
  // Quick bet amount buttons
  const quickAmounts = ['1', '5', '10', '25'];
  
  return (
    <Card>
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white">Place Bet</h3>
        
        {/* Wallet Balance */}
        {isConnected && (
          <div className="bg-gray-900 rounded p-3">
            <p className="text-gray-400 text-xs uppercase tracking-wider">Available Balance</p>
            <p className="text-white text-lg font-bold">{parseFloat(balance).toFixed(2)} FLOW</p>
          </div>
        )}
        
        {/* Bet Amount Input */}
        <div>
          <label className="block text-gray-400 text-sm mb-2">Bet Amount (FLOW)</label>
          <input
            type="number"
            value={betAmount}
            onChange={(e) => onBetAmountChange(e.target.value)}
            placeholder="0.00"
            min="0"
            step="0.1"
            disabled={!isConnected || !!activeRound}
            className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-[#FF006E] disabled:opacity-50"
          />
        </div>
        
        {/* Quick Amount Buttons */}
        <div className="grid grid-cols-4 gap-2">
          {quickAmounts.map(amount => (
            <button
              key={amount}
              onClick={() => onBetAmountChange(amount)}
              disabled={!isConnected || !!activeRound}
              className="bg-gray-800 hover:bg-gray-700 text-white py-2 rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {amount}
            </button>
          ))}
        </div>
        
        {/* Selected Target Info */}
        {selectedTargetCell && (
          <div className="bg-gray-900 rounded p-3">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Selected Target</p>
            <p className="text-white font-semibold">{selectedTargetCell.label}</p>
            <p className="text-[#FF006E] text-sm">Multiplier: x{selectedTargetCell.multiplier}</p>
          </div>
        )}
        
        {/* Potential Payout */}
        {selectedTarget && betAmount && parseFloat(betAmount) > 0 && (
          <div className="bg-[#FF006E]/10 border border-[#FF006E] rounded p-3">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Potential Win</p>
            <p className="text-[#FF006E] text-2xl font-bold">{potentialPayout} FLOW</p>
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        
        {/* Place Bet Button */}
        <Button
          onClick={handlePlaceBet}
          disabled={!isConnected || !!activeRound || isPlacingBet}
          className="w-full"
          size="lg"
        >
          {isPlacingBet ? 'Placing Bet...' : 'Place Bet'}
        </Button>
        
        {!isConnected && (
          <p className="text-gray-500 text-sm text-center">
            Connect your wallet to place bets
          </p>
        )}
      </div>
    </Card>
  );
};
