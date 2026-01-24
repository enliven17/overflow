'use client';

import React, { useState } from 'react';
import { useOverflowStore } from '@/lib/store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DepositModal } from './DepositModal';
import { WithdrawModal } from './WithdrawModal';
import { useToast } from '@/lib/hooks/useToast';

/**
 * BalanceDisplay Component
 * 
 * Displays the user's house balance with controls for deposit and withdrawal
 * 
 * Task: 8.1 Create BalanceDisplay component
 * Requirements: 8.1
 * 
 * Features:
 * - Display current house balance with FLOW symbol
 * - Refresh button to fetch latest balance
 * - Deposit and Withdraw buttons with modals
 * - Show loading state while fetching
 * - Format balance to 4 decimal places
 */
export const BalanceDisplay: React.FC = () => {
  const houseBalance = useOverflowStore(state => state.houseBalance);
  const isLoading = useOverflowStore(state => state.isLoading);
  const address = useOverflowStore(state => state.address);
  const fetchBalance = useOverflowStore(state => state.fetchBalance);
  const toast = useToast();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  /**
   * Handle refresh button click
   * Fetches the latest balance from the API
   */
  const handleRefresh = async () => {
    if (!address || isLoading) return;
    
    setIsRefreshing(true);
    try {
      await fetchBalance(address);
      toast.success('Balance refreshed');
    } catch (error) {
      console.error('Error refreshing balance:', error);
      toast.error('Failed to refresh balance');
    } finally {
      setIsRefreshing(false);
    }
  };

  /**
   * Handle deposit button click
   * Opens the deposit modal
   */
  const handleDeposit = () => {
    setIsDepositModalOpen(true);
  };

  /**
   * Handle withdraw button click
   * Opens the withdraw modal
   */
  const handleWithdraw = () => {
    setIsWithdrawModalOpen(true);
  };

  /**
   * Handle successful deposit
   * Refreshes balance and shows success message
   */
  const handleDepositSuccess = async (amount: number, txHash: string) => {
    if (address) {
      await fetchBalance(address);
    }
  };

  /**
   * Handle successful withdrawal
   * Refreshes balance and shows success message
   */
  const handleWithdrawSuccess = async (amount: number, txHash: string) => {
    if (address) {
      await fetchBalance(address);
    }
  };

  // Format balance to 4 decimal places
  const formattedBalance = houseBalance.toFixed(4);

  return (
    <>
      <div className="bg-black/30 rounded-xl border border-white/5">
        <div className="p-3 space-y-2">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
              House Balance
            </h3>
            
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={!address || isLoading || isRefreshing}
              className="text-neon-blue hover:text-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Refresh balance"
            >
              <svg
                className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>

          {/* Balance Display */}
          <div className="bg-gradient-to-br from-neon-blue/10 to-purple-500/10 border border-neon-blue/30 rounded-lg p-2.5">
            <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-0.5 font-mono">
              Available Balance
            </p>
            
            {isLoading ? (
              <div className="flex items-center gap-1.5">
                <div className="animate-pulse bg-white/20 h-6 w-24 rounded" />
                <span className="text-gray-500 text-xs font-mono">Loading...</span>
              </div>
            ) : (
              <div className="flex items-baseline gap-1.5">
                <p className="text-neon-blue text-xl font-bold font-mono text-shadow-neon">
                  {formattedBalance}
                </p>
                <span className="text-neon-blue/70 text-sm font-mono">FLOW</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleDeposit}
              disabled={!address || isLoading}
              variant="primary"
              size="sm"
              className="w-full !px-2 !py-1.5 !text-xs"
            >
              Deposit
            </Button>
            
            <Button
              onClick={handleWithdraw}
              disabled={!address || isLoading || houseBalance <= 0}
              variant="secondary"
              size="sm"
              className="w-full !px-2 !py-1.5 !text-xs"
            >
              Withdraw
            </Button>
          </div>

          {/* Info Message */}
          {!address && (
            <p className="text-gray-500 text-[10px] text-center font-mono">
              Connect wallet to view balance
            </p>
          )}
        </div>
      </div>

      {/* Deposit Modal */}
      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        onSuccess={handleDepositSuccess}
      />

      {/* Withdraw Modal */}
      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        onSuccess={handleWithdrawSuccess}
      />
    </>
  );
};
