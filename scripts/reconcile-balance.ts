#!/usr/bin/env ts-node
/**
 * Balance Reconciliation Script
 * 
 * This script reconciles user balances between Supabase and the Flow blockchain.
 * It treats the contract balance as the source of truth and updates Supabase accordingly.
 * 
 * Usage:
 *   # Reconcile a specific user
 *   npm run reconcile -- --user 0x1234567890abcdef
 *   
 *   # Reconcile all users (dry run - only report discrepancies)
 *   npm run reconcile -- --all --dry-run
 *   
 *   # Reconcile all users (actually update balances)
 *   npm run reconcile -- --all
 *   
 *   # Specify admin address
 *   npm run reconcile -- --user 0x1234567890abcdef --admin 0xadmin123
 * 
 * Environment Variables:
 *   NEXT_PUBLIC_FLOW_NETWORK - Flow network to use (emulator, testnet, mainnet)
 *   NEXT_PUBLIC_EMULATOR_CONTRACT_ADDRESS - Contract address on emulator
 *   NEXT_PUBLIC_TESTNET_CONTRACT_ADDRESS - Contract address on testnet
 *   NEXT_PUBLIC_MAINNET_CONTRACT_ADDRESS - Contract address on mainnet
 */

import { configureFlow, getCurrentNetwork } from '../lib/flow/config';
import { reconcileUserBalance, reconcileAllUsers } from '../lib/balance/synchronization';

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options: {
    user?: string;
    all?: boolean;
    dryRun?: boolean;
    admin?: string;
  } = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--user':
      case '-u':
        options.user = args[++i];
        break;
      case '--all':
      case '-a':
        options.all = true;
        break;
      case '--dry-run':
      case '-d':
        options.dryRun = true;
        break;
      case '--admin':
        options.admin = args[++i];
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
      default:
        console.error(`Unknown option: ${arg}`);
        printHelp();
        process.exit(1);
    }
  }

  return options;
}

/**
 * Print help message
 */
function printHelp() {
  console.log(`
Balance Reconciliation Script

Usage:
  npm run reconcile -- [options]

Options:
  --user, -u <address>    Reconcile a specific user address
  --all, -a               Reconcile all users
  --dry-run, -d           Dry run mode (only report discrepancies, don't update)
  --admin <address>       Admin address performing reconciliation (default: ADMIN)
  --help, -h              Show this help message

Examples:
  # Reconcile a specific user
  npm run reconcile -- --user 0x1234567890abcdef
  
  # Reconcile all users (dry run)
  npm run reconcile -- --all --dry-run
  
  # Reconcile all users (actually update)
  npm run reconcile -- --all
  
  # Specify admin address
  npm run reconcile -- --user 0x1234567890abcdef --admin 0xadmin123
`);
}

/**
 * Main function to run reconciliation
 */
async function main() {
  console.log('='.repeat(60));
  console.log('Balance Reconciliation');
  console.log('='.repeat(60));
  console.log();

  // Parse command line arguments
  const options = parseArgs();

  // Validate options
  if (!options.user && !options.all) {
    console.error('Error: Must specify either --user or --all');
    printHelp();
    process.exit(1);
  }

  if (options.user && options.all) {
    console.error('Error: Cannot specify both --user and --all');
    printHelp();
    process.exit(1);
  }

  // Configure Flow
  const network = getCurrentNetwork();
  console.log(`Network: ${network}`);
  configureFlow();
  console.log();

  const adminAddress = options.admin || 'ADMIN';

  if (options.user) {
    // Reconcile a specific user
    console.log(`Reconciling user: ${options.user}`);
    console.log(`Admin: ${adminAddress}`);
    console.log();

    const result = await reconcileUserBalance(options.user, adminAddress);

    // Display results
    console.log('='.repeat(60));
    console.log('Results:');
    console.log('='.repeat(60));
    console.log(`Status: ${result.success ? '✓ SUCCESS' : '✗ FAILED'}`);
    console.log(`User Address: ${result.userAddress}`);
    console.log(`Old Balance: ${result.oldBalance.toFixed(8)} FLOW`);
    console.log(`New Balance: ${result.newBalance.toFixed(8)} FLOW`);
    console.log(`Discrepancy: ${result.discrepancy.toFixed(8)} FLOW`);
    console.log(`Timestamp: ${result.timestamp.toISOString()}`);

    if (result.error) {
      console.log(`Error: ${result.error}`);
    }

    console.log('='.repeat(60));
    console.log();

    // Exit with appropriate code
    if (!result.success) {
      console.error('⚠️  Reconciliation failed');
      process.exit(1);
    } else {
      console.log('✓ Reconciliation completed successfully');
      process.exit(0);
    }
  } else if (options.all) {
    // Reconcile all users
    console.log('Reconciling all users');
    console.log(`Admin: ${adminAddress}`);
    console.log(`Mode: ${options.dryRun ? 'DRY RUN (no updates)' : 'LIVE (will update balances)'}`);
    console.log();

    if (options.dryRun) {
      console.log('⚠️  DRY RUN MODE: No balances will be updated');
      console.log();
    }

    const results = await reconcileAllUsers(adminAddress, options.dryRun);

    // Display results
    console.log('='.repeat(60));
    console.log('Results:');
    console.log('='.repeat(60));
    console.log(`Total users processed: ${results.length}`);
    console.log();

    if (results.length === 0) {
      console.log('✓ No discrepancies found');
    } else {
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      console.log(`Successful: ${successful}`);
      console.log(`Failed: ${failed}`);
      console.log();

      // Display details for each user
      results.forEach((result, index) => {
        console.log(`${index + 1}. ${result.userAddress}`);
        console.log(`   Status: ${result.success ? '✓' : '✗'}`);
        console.log(`   Old Balance: ${result.oldBalance.toFixed(8)} FLOW`);
        console.log(`   New Balance: ${result.newBalance.toFixed(8)} FLOW`);
        console.log(`   Discrepancy: ${result.discrepancy.toFixed(8)} FLOW`);
        if (result.error) {
          console.log(`   Error: ${result.error}`);
        }
        console.log();
      });
    }

    console.log('='.repeat(60));
    console.log();

    // Exit with appropriate code
    const hasFailures = results.some(r => !r.success);
    if (hasFailures) {
      console.error('⚠️  Some reconciliations failed');
      process.exit(1);
    } else {
      console.log('✓ All reconciliations completed successfully');
      process.exit(0);
    }
  }
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
