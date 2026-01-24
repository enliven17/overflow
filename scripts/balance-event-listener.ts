#!/usr/bin/env ts-node
/**
 * Balance Event Listener Service
 * 
 * Task: 5.1 Create event listener for Deposit events
 * Task: 5.2 Create event listener for Withdrawal events
 * Task: 5.3 Create event listener for payout events
 * Requirements: 1.2, 4.2, 4.5
 * 
 * This script runs as a standalone service that listens for Deposit, Withdrawal,
 * and RoundSettled events from the OverflowGame contract and updates Supabase
 * balances via API endpoints.
 * 
 * Usage:
 *   ts-node scripts/balance-event-listener.ts
 * 
 * Environment Variables:
 *   NEXT_PUBLIC_FLOW_NETWORK - Flow network to use (emulator, testnet, mainnet)
 *   NEXT_PUBLIC_EMULATOR_CONTRACT_ADDRESS - Contract address for emulator
 *   NEXT_PUBLIC_TESTNET_CONTRACT_ADDRESS - Contract address for testnet
 *   NEXT_PUBLIC_MAINNET_CONTRACT_ADDRESS - Contract address for mainnet
 *   API_BASE_URL - Base URL for API calls (default: http://localhost:3000)
 */

import * as fcl from "@onflow/fcl";
import fetch from 'cross-fetch';

// Make fetch available globally for the event handlers
(global as any).fetch = fetch;

type FlowNetwork = 'emulator' | 'testnet' | 'mainnet';

interface NetworkConfig {
  accessNode: string;
  contractAddress: string;
}

const getNetworkConfig = (network: FlowNetwork): NetworkConfig => {
  const configs: Record<FlowNetwork, NetworkConfig> = {
    emulator: {
      accessNode: process.env.NEXT_PUBLIC_EMULATOR_ACCESS_NODE || "http://localhost:8888",
      contractAddress: process.env.NEXT_PUBLIC_EMULATOR_CONTRACT_ADDRESS || "0xf8d6e0586b0a20c7"
    },
    testnet: {
      accessNode: process.env.NEXT_PUBLIC_TESTNET_ACCESS_NODE || "https://rest-testnet.onflow.org",
      contractAddress: process.env.NEXT_PUBLIC_TESTNET_CONTRACT_ADDRESS || ""
    },
    mainnet: {
      accessNode: process.env.NEXT_PUBLIC_MAINNET_ACCESS_NODE || "https://rest-mainnet.onflow.org",
      contractAddress: process.env.NEXT_PUBLIC_MAINNET_CONTRACT_ADDRESS || ""
    }
  };
  
  return configs[network];
};

interface DepositEvent {
  userAddress: string;
  amount: string;
  timestamp: string;
}

interface WithdrawalEvent {
  userAddress: string;
  amount: string;
  timestamp: string;
}

interface RoundSettledEvent {
  betId: string;
  player: string;
  won: boolean;
  actualPriceChange: string;
  payout: string;
  startPrice: string;
  endPrice: string;
  timestamp: string;
}

const handleDepositEvent = async (
  event: DepositEvent,
  apiBaseUrl: string,
  txHash?: string
): Promise<void> => {
  try {
    console.log('[DepositHandler] Processing deposit event:', event);
    
    const transactionHash = txHash || `tx_${event.timestamp}`;
    
    const response = await fetch(`${apiBaseUrl}/api/balance/deposit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userAddress: event.userAddress,
        amount: parseFloat(event.amount),
        txHash: transactionHash,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('[DepositHandler] API error:', errorData);
      throw new Error(`API error: ${errorData.error || 'Unknown error'}`);
    }
    
    const result = await response.json();
    console.log('[DepositHandler] Successfully updated balance:', result);
  } catch (error) {
    console.error('[DepositHandler] Error handling deposit event:', error);
  }
};

const handleWithdrawalEvent = async (
  event: WithdrawalEvent,
  apiBaseUrl: string,
  txHash?: string
): Promise<void> => {
  try {
    console.log('[WithdrawalHandler] Processing withdrawal event:', event);
    
    const transactionHash = txHash || `tx_${event.timestamp}`;
    
    const response = await fetch(`${apiBaseUrl}/api/balance/withdraw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userAddress: event.userAddress,
        amount: parseFloat(event.amount),
        txHash: transactionHash,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('[WithdrawalHandler] API error:', errorData);
      throw new Error(`API error: ${errorData.error || 'Unknown error'}`);
    }
    
    const result = await response.json();
    console.log('[WithdrawalHandler] Successfully updated balance:', result);
  } catch (error) {
    console.error('[WithdrawalHandler] Error handling withdrawal event:', error);
  }
};

const handleRoundSettledEvent = async (
  event: RoundSettledEvent,
  apiBaseUrl: string
): Promise<void> => {
  try {
    console.log('[RoundSettledHandler] Processing round settled event:', event);
    
    // Only process winning bets
    if (!event.won) {
      console.log('[RoundSettledHandler] Bet lost, no payout needed');
      return;
    }
    
    // Parse payout amount
    const payoutAmount = parseFloat(event.payout);
    
    // Validate payout amount
    if (payoutAmount <= 0) {
      console.error('[RoundSettledHandler] Invalid payout amount:', payoutAmount);
      return;
    }
    
    const response = await fetch(`${apiBaseUrl}/api/balance/payout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userAddress: event.player,
        payoutAmount: payoutAmount,
        betId: event.betId,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('[RoundSettledHandler] API error:', errorData);
      throw new Error(`API error: ${errorData.error || 'Unknown error'}`);
    }
    
    const result = await response.json();
    console.log('[RoundSettledHandler] Successfully credited payout to balance:', result);
  } catch (error) {
    console.error('[RoundSettledHandler] Error handling round settled event:', error);
  }
};

const startListener = () => {
  // Get configuration from environment
  const network = (process.env.NEXT_PUBLIC_FLOW_NETWORK as FlowNetwork) || 'emulator';
  const config = getNetworkConfig(network);
  const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
  
  console.log('='.repeat(60));
  console.log('Balance Event Listener Service');
  console.log('='.repeat(60));
  console.log(`Network: ${network}`);
  console.log(`Access Node: ${config.accessNode}`);
  console.log(`Contract Address: ${config.contractAddress}`);
  console.log(`API Base URL: ${apiBaseUrl}`);
  console.log('='.repeat(60));
  
  // Configure FCL
  fcl.config()
    .put("accessNode.api", config.accessNode);
  
  // Remove 0x prefix from contract address
  const cleanAddress = config.contractAddress.replace(/^0x/, '');
  
  // Subscribe to Deposit events
  console.log(`\n[Listener] Subscribing to Deposit events from A.${cleanAddress}.OverflowGame.Deposit`);
  const depositUnsubscribe = fcl.events(`A.${cleanAddress}.OverflowGame.Deposit`)
    .subscribe((event: any) => {
      try {
        console.log('\n[Listener] Received Deposit event:', JSON.stringify(event, null, 2));
        
        const eventData = event.data;
        handleDepositEvent({
          userAddress: eventData.userAddress,
          amount: eventData.amount,
          timestamp: eventData.timestamp
        }, apiBaseUrl);
      } catch (error) {
        console.error('[Listener] Error processing Deposit event:', error);
      }
    });
  
  // Subscribe to Withdrawal events
  console.log(`[Listener] Subscribing to Withdrawal events from A.${cleanAddress}.OverflowGame.Withdrawal`);
  const withdrawalUnsubscribe = fcl.events(`A.${cleanAddress}.OverflowGame.Withdrawal`)
    .subscribe((event: any) => {
      try {
        console.log('\n[Listener] Received Withdrawal event:', JSON.stringify(event, null, 2));
        
        const eventData = event.data;
        handleWithdrawalEvent({
          userAddress: eventData.userAddress,
          amount: eventData.amount,
          timestamp: eventData.timestamp
        }, apiBaseUrl);
      } catch (error) {
        console.error('[Listener] Error processing Withdrawal event:', error);
      }
    });
  
  // Subscribe to RoundSettled events
  console.log(`[Listener] Subscribing to RoundSettled events from A.${cleanAddress}.OverflowGame.RoundSettled`);
  const roundSettledUnsubscribe = fcl.events(`A.${cleanAddress}.OverflowGame.RoundSettled`)
    .subscribe((event: any) => {
      try {
        console.log('\n[Listener] Received RoundSettled event:', JSON.stringify(event, null, 2));
        
        const eventData = event.data;
        handleRoundSettledEvent({
          betId: eventData.betId.toString(),
          player: eventData.player,
          won: eventData.won,
          actualPriceChange: eventData.actualPriceChange,
          payout: eventData.payout,
          startPrice: eventData.startPrice,
          endPrice: eventData.endPrice,
          timestamp: eventData.timestamp
        }, apiBaseUrl);
      } catch (error) {
        console.error('[Listener] Error processing RoundSettled event:', error);
      }
    });
  
  console.log('\n[Listener] Event listeners started successfully!');
  console.log('[Listener] Waiting for events... (Press Ctrl+C to stop)\n');
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n[Listener] Shutting down gracefully...');
    depositUnsubscribe();
    withdrawalUnsubscribe();
    roundSettledUnsubscribe();
    console.log('[Listener] Event listeners stopped');
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\n\n[Listener] Shutting down gracefully...');
    depositUnsubscribe();
    withdrawalUnsubscribe();
    roundSettledUnsubscribe();
    console.log('[Listener] Event listeners stopped');
    process.exit(0);
  });
};

// Start the listener
startListener();
