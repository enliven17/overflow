'use client';

/**
 * WithdrawModal Component
 * Modal for withdrawing FLOW tokens from house balance to wallet
 * 
 * Task: 10.1 Create WithdrawModal component
 * Requirements: 8.3, 8.4
 */

import React, { useState, useEffect } from 'react';
import * as fcl from '@onflow/fcl';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useOverflowStore } from '@/lib/store';
import { useToast } from '@/lib/hooks/useToast';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (amount: number, txHash: string) => void;
  onError?: (error: string) => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onError
}) => {
  const [amount, setAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { address, withdrawFunds, houseBalance } = useOverflowStore();
  const toast = useToast();
  
  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setAmount('');
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen]);
  
  /**
   * Validate withdrawal amount
   * Returns error message if invalid, null if valid
   */
  const validateAmount = (value: string): string | null => {
    if (!value || value.trim() === '') {
      return 'Please enter an amount';
    }
    
    const numValue = parseFloat(value);
    
    if (isNaN(numValue)) {
      return 'Please enter a valid number';
    }
    
    if (numValue <= 0) {
      return 'Amount must be greater than zero';
    }
    
    if (numValue > houseBalance) {
      return 'Insufficient house balance';
    }
    
    return null;
  };
  
  /**
   * Handle amount input change
   */
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Allow empty string, numbers, and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError(null);
    }
  };
  
  /**
   * Handle max button click
   * Sets amount to entire house balance
   */
  const handleMaxClick = () => {
    if (houseBalance > 0) {
      setAmount(houseBalance.toString());
      setError(null);
    }
  };
  
  /**
   * Execute withdrawal transaction
   */
  const handleWithdraw = async () => {
    // Validate amount
    const validationError = validateAmount(amount);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    if (!address) {
      setError('Please connect your wallet');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const withdrawAmount = parseFloat(amount);
      
      // Show info toast that transaction is being processed
      toast.info('Please confirm the transaction in your wallet...');
      
      // Create withdrawal transaction
      const transactionId = await fcl.mutate({
        cadence: `
import OverflowGame from 0xOverflowGame
import FlowToken from 0xFlowToken
import FungibleToken from 0xFungibleToken

transaction(amount: UFix64) {
  let receiverRef: &{FungibleToken.Receiver}
  
  prepare(signer: auth(BorrowValue) &Account) {
    // Get reference to the signer's FlowToken receiver
    self.receiverRef = signer.capabilities.borrow<&{FungibleToken.Receiver}>(
      /public/flowTokenReceiver
    ) ?? panic("Could not borrow reference to FlowToken receiver")
  }
  
  execute {
    // Withdraw from house balance
    let withdrawnVault <- OverflowGame.withdraw(amount: amount)
    
    // Deposit to user's wallet
    self.receiverRef.deposit(from: <-withdrawnVault)
    
    log("Withdrew ".concat(amount.toString()).concat(" FLOW from house balance"))
  }
}
        `,
        args: (arg: any, t: any) => [
          arg(withdrawAmount.toFixed(8), t.UFix64)
        ],
        limit: 9999
      });
      
      // Show info toast that transaction is being confirmed
      toast.info('Transaction submitted. Waiting for confirmation...');
      
      // Wait for transaction to be sealed
      const transaction = await fcl.tx(transactionId).onceSealed();
      
      if (transaction.status === 4) {
        // Transaction successful - update balance in database
        await withdrawFunds(address, withdrawAmount, transactionId);
        
        // Show success toast with updated balance
        const newBalance = houseBalance - withdrawAmount;
        toast.success(
          `Successfully withdrew ${withdrawAmount.toFixed(4)} FLOW! New balance: ${newBalance.toFixed(4)} FLOW`
        );
        
        // Call success callback
        if (onSuccess) {
          onSuccess(withdrawAmount, transactionId);
        }
        
        // Close modal
        onClose();
      } else {
        throw new Error('Transaction failed with status: ' + transaction.status);
      }
    } catch (err) {
      console.error('Withdrawal error:', err);
      
      // Determine error message
      let errorMessage = 'Failed to withdraw funds';
      
      if (err instanceof Error) {
        if (err.message.includes('Declined: Externally Halted')) {
          errorMessage = 'Transaction was cancelled';
        } else if (err.message.includes('Insufficient house balance')) {
          errorMessage = 'Insufficient house balance for withdrawal';
        } else if (err.message.includes('Could not borrow reference')) {
          errorMessage = 'Unable to access wallet receiver. Please try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      
      // Show error toast
      toast.error(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Withdraw FLOW"
      showCloseButton={!isLoading}
    >
      <div className="space-y-2">
        {/* House Balance Display */}
        <div className="bg-gradient-to-br from-neon-blue/10 to-purple-500/10 border border-neon-blue/30 rounded-lg p-2.5">
          <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-0.5 font-mono">
            House Balance
          </p>
          <p className="text-neon-blue text-base font-bold font-mono">
            {houseBalance.toFixed(4)} FLOW
          </p>
        </div>
        
        {/* Amount Input */}
        <div>
          <div className="relative">
            <input
              id="withdraw-amount"
              type="text"
              value={amount}
              onChange={handleAmountChange}
              placeholder="0.00"
              disabled={isLoading}
              className={`
                w-full px-3 py-2 bg-black/50 border rounded-lg text-sm
                text-white font-mono
                focus:outline-none focus:ring-1 focus:ring-neon-blue
                disabled:opacity-50 disabled:cursor-not-allowed
                ${error ? 'border-red-500' : 'border-neon-blue/30'}
              `}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-mono">
              FLOW
            </span>
          </div>
          
          {/* Max Button */}
          <button
            onClick={handleMaxClick}
            disabled={isLoading || houseBalance === 0}
            className="mt-1 text-[10px] text-neon-blue hover:text-cyan-400 font-mono disabled:opacity-50 transition-colors"
          >
            Withdraw Max
          </button>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg px-2 py-1.5">
            <p className="text-red-400 text-[10px] font-mono">{error}</p>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex gap-2 pt-1">
          <Button
            onClick={onClose}
            variant="secondary"
            size="sm"
            disabled={isLoading}
            className="flex-1 !px-3 !py-1.5 !text-xs"
          >
            Cancel
          </Button>
          <Button
            onClick={handleWithdraw}
            variant="primary"
            size="sm"
            disabled={isLoading || !amount || !!validateAmount(amount)}
            className="flex-1 !px-3 !py-1.5 !text-xs"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-1">
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span className="text-[10px]">Processing...</span>
              </span>
            ) : (
              'Withdraw'
            )}
          </Button>
        </div>
        
        {/* Loading State Info */}
        {isLoading && (
          <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg px-2 py-1.5">
            <p className="text-blue-400 text-[10px] font-mono">
              Confirm transaction in wallet...
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};
