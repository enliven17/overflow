'use client';

/**
 * DepositModal Component
 * Modal for depositing FLOW tokens into house balance
 * 
 * Task: 9.1 Create DepositModal component
 * Requirements: 8.2, 8.4
 */

import React, { useState, useEffect } from 'react';
import * as fcl from '@onflow/fcl';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useOverflowStore } from '@/lib/store';
import { useToast } from '@/lib/hooks/useToast';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (amount: number, txHash: string) => void;
  onError?: (error: string) => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onError
}) => {
  const [amount, setAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { address, balance: walletBalance, depositFunds, houseBalance } = useOverflowStore();
  const toast = useToast();
  
  // Quick select amounts
  const quickAmounts = [1, 5, 10, 25];
  
  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setAmount('');
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen]);
  
  /**
   * Validate deposit amount
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
    
    const walletBalanceNum = parseFloat(walletBalance);
    if (numValue > walletBalanceNum) {
      return 'Insufficient wallet balance';
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
   * Handle quick select button click
   */
  const handleQuickSelect = (value: number) => {
    setAmount(value.toString());
    setError(null);
  };
  
  /**
   * Handle max button click
   * Sets amount to entire wallet balance
   */
  const handleMaxClick = () => {
    const walletBalanceNum = parseFloat(walletBalance);
    if (walletBalanceNum > 0) {
      setAmount(walletBalance);
      setError(null);
    }
  };
  
  /**
   * Execute deposit transaction
   */
  const handleDeposit = async () => {
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
      
      const depositAmount = parseFloat(amount);
      
      // Show info toast that transaction is being processed
      toast.info('Please confirm the transaction in your wallet...');
      
      // Create deposit transaction
      const transactionId = await fcl.mutate({
        cadence: `
import OverflowGame from 0xOverflowGame
import FlowToken from 0xFlowToken
import FungibleToken from 0xFungibleToken

transaction(amount: UFix64) {
  let paymentVault: @{FungibleToken.Vault}
  
  prepare(signer: auth(BorrowValue) &Account) {
    // Withdraw FLOW tokens from signer's vault
    let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
      from: /storage/flowTokenVault
    ) ?? panic("Could not borrow reference to FlowToken.Vault")
    
    self.paymentVault <- vaultRef.withdraw(amount: amount)
  }
  
  execute {
    // Deposit to house balance
    let depositedAmount = OverflowGame.deposit(vault: <-self.paymentVault)
    
    log("Deposited ".concat(depositedAmount.toString()).concat(" FLOW to house balance"))
  }
}
        `,
        args: (arg: any, t: any) => [
          arg(depositAmount.toFixed(8), t.UFix64)
        ],
        limit: 9999
      });
      
      // Show info toast that transaction is being confirmed
      toast.info('Transaction submitted. Waiting for confirmation...');
      
      // Wait for transaction to be sealed
      const transaction = await fcl.tx(transactionId).onceSealed();
      
      if (transaction.status === 4) {
        // Transaction successful - update balance in database
        await depositFunds(address, depositAmount, transactionId);
        
        // Show success toast with updated balance
        const newBalance = houseBalance + depositAmount;
        toast.success(
          `Successfully deposited ${depositAmount.toFixed(4)} FLOW! New balance: ${newBalance.toFixed(4)} FLOW`
        );
        
        // Call success callback
        if (onSuccess) {
          onSuccess(depositAmount, transactionId);
        }
        
        // Close modal
        onClose();
      } else {
        throw new Error('Transaction failed with status: ' + transaction.status);
      }
    } catch (err) {
      console.error('Deposit error:', err);
      
      // Determine error message
      let errorMessage = 'Failed to deposit funds';
      
      if (err instanceof Error) {
        if (err.message.includes('Declined: Externally Halted')) {
          errorMessage = 'Transaction was cancelled';
        } else if (err.message.includes('Insufficient wallet balance')) {
          errorMessage = 'Insufficient wallet balance for deposit';
        } else if (err.message.includes('Could not borrow reference')) {
          errorMessage = 'Unable to access wallet vault. Please try again.';
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
      title="Deposit FLOW"
      showCloseButton={!isLoading}
    >
      <div className="space-y-2">
        {/* Wallet Balance Display */}
        <div className="bg-gradient-to-br from-neon-blue/10 to-purple-500/10 border border-neon-blue/30 rounded-lg p-2.5">
          <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-0.5 font-mono">
            Wallet Balance
          </p>
          <p className="text-neon-blue text-base font-bold font-mono">
            {parseFloat(walletBalance).toFixed(4)} FLOW
          </p>
        </div>
        
        {/* Amount Input */}
        <div>
          <div className="relative">
            <input
              id="deposit-amount"
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
            disabled={isLoading}
            className="mt-1 text-[10px] text-neon-blue hover:text-cyan-400 font-mono disabled:opacity-50 transition-colors"
          >
            Use Max
          </button>
        </div>
        
        {/* Quick Select Buttons */}
        <div className="grid grid-cols-4 gap-1.5">
          {quickAmounts.map((quickAmount) => (
            <button
              key={quickAmount}
              onClick={() => handleQuickSelect(quickAmount)}
              disabled={isLoading || parseFloat(walletBalance) < quickAmount}
              className={`
                px-2 py-1 rounded border font-mono text-xs
                transition-all duration-200
                ${
                  amount === quickAmount.toString()
                    ? 'bg-neon-blue/20 border-neon-blue text-neon-blue shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                    : 'bg-black/30 border-neon-blue/30 text-gray-300 hover:border-neon-blue hover:text-neon-blue'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {quickAmount}
            </button>
          ))}
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
            onClick={handleDeposit}
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
              'Deposit'
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
