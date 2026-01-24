#!/usr/bin/env ts-node
/**
 * Balance Synchronization Check Script
 * 
 * This script checks the synchronization between Supabase user balances
 * and the Flow blockchain escrow vault balance.
 * 
 * Usage:
 *   npm run check-sync
 *   or
 *   ts-node scripts/check-balance-sync.ts
 * 
 * Environment Variables:
 *   NEXT_PUBLIC_FLOW_NETWORK - Flow network to use (emulator, testnet, mainnet)
 *   NEXT_PUBLIC_EMULATOR_CONTRACT_ADDRESS - Contract address on emulator
 *   NEXT_PUBLIC_TESTNET_CONTRACT_ADDRESS - Contract address on testnet
 *   NEXT_PUBLIC_MAINNET_CONTRACT_ADDRESS - Contract address on mainnet
 */

import { configureFlow, getCurrentNetwork } from '../lib/flow/config';
import { checkBalanceSynchronization } from '../lib/balance/synchronization';

/**
 * Get the contract address for the current network
 */
function getContractAddress(): string {
  const network = getCurrentNetwork();

  switch (network) {
    case 'emulator':
      return process.env.NEXT_PUBLIC_EMULATOR_CONTRACT_ADDRESS || '0xf8d6e0586b0a20c7';
    case 'testnet':
      return process.env.NEXT_PUBLIC_TESTNET_CONTRACT_ADDRESS || '';
    case 'mainnet':
      return process.env.NEXT_PUBLIC_MAINNET_CONTRACT_ADDRESS || '';
    default:
      throw new Error(`Unknown network: ${network}`);
  }
}

/**
 * Main function to run synchronization check
 */
async function main() {
  console.log('='.repeat(60));
  console.log('Balance Synchronization Check');
  console.log('='.repeat(60));
  console.log();

  // Configure Flow
  const network = getCurrentNetwork();
  console.log(`Network: ${network}`);
  configureFlow();

  // Get contract address
  const contractAddress = getContractAddress();
  console.log(`Contract Address: ${contractAddress}`);
  console.log();

  if (!contractAddress) {
    console.error('Error: Contract address not configured for this network');
    process.exit(1);
  }

  // Run synchronization check
  console.log('Running synchronization check...');
  console.log();

  const result = await checkBalanceSynchronization(contractAddress);

  // Display results
  console.log('='.repeat(60));
  console.log('Results:');
  console.log('='.repeat(60));
  console.log(`Status: ${result.synchronized ? '✓ SYNCHRONIZED' : '✗ NOT SYNCHRONIZED'}`);
  console.log(`Supabase Total: ${result.supabaseTotal.toFixed(8)} FLOW`);
  console.log(`Escrow Vault Balance: ${result.escrowVaultBalance.toFixed(8)} FLOW`);
  console.log(`Discrepancy: ${result.discrepancy.toFixed(8)} FLOW`);
  console.log(`Timestamp: ${result.timestamp.toISOString()}`);

  if (result.error) {
    console.log(`Error: ${result.error}`);
  }

  console.log('='.repeat(60));
  console.log();

  // Exit with appropriate code
  if (result.error || !result.synchronized) {
    console.error('⚠️  Synchronization check failed or balances are not synchronized');
    process.exit(1);
  } else {
    console.log('✓ Synchronization check completed successfully');
    process.exit(0);
  }
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
