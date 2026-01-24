/**
 * Balance Synchronization Module
 * 
 * This module provides functions to check and maintain synchronization between
 * the Supabase user_balances table and the Flow blockchain escrow vault.
 * 
 * Requirements: 9.1, 9.2, 9.3
 */

import * as fcl from '@onflow/fcl';
import { supabase } from '../supabase/client';
import { getEscrowVaultBalanceScript, getUserBalanceFromContractScript } from '../flow/scripts';

/**
 * Result of a synchronization check
 */
export interface SyncCheckResult {
  /** Whether the balances are synchronized */
  synchronized: boolean;
  /** Total balance in Supabase user_balances table */
  supabaseTotal: number;
  /** Total balance in the escrow vault on-chain */
  escrowVaultBalance: number;
  /** Discrepancy amount (escrowVaultBalance - supabaseTotal) */
  discrepancy: number;
  /** Timestamp of the check */
  timestamp: Date;
  /** Error message if check failed */
  error?: string;
}

/**
 * Check synchronization between Supabase and escrow vault
 * 
 * This function queries the total of all user balances from Supabase and compares
 * it with the escrow vault balance from the Flow blockchain. If there's a mismatch,
 * it logs a critical error.
 * 
 * @param contractAddress - The Flow address of the OverflowGame contract
 * @returns SyncCheckResult containing synchronization status and details
 * 
 * Requirements: 9.1, 9.2, 9.3
 */
export async function checkBalanceSynchronization(
  contractAddress: string
): Promise<SyncCheckResult> {
  const timestamp = new Date();
  
  try {
    // Query total of all user_balances from Supabase
    const { data: balanceData, error: supabaseError } = await supabase
      .from('user_balances')
      .select('balance');
    
    if (supabaseError) {
      const errorMsg = `Failed to query Supabase balances: ${supabaseError.message}`;
      console.error('[SYNC CHECK ERROR]', errorMsg);
      return {
        synchronized: false,
        supabaseTotal: 0,
        escrowVaultBalance: 0,
        discrepancy: 0,
        timestamp,
        error: errorMsg,
      };
    }
    
    // Calculate total balance from Supabase
    const supabaseTotal = balanceData?.reduce(
      (sum, record) => sum + Number(record.balance),
      0
    ) || 0;
    
    // Query escrow vault balance from contract
    const escrowVaultBalance = await queryEscrowVaultBalance(contractAddress);
    
    // Calculate discrepancy
    const discrepancy = escrowVaultBalance - supabaseTotal;
    
    // Check if synchronized (allow small floating point differences)
    const tolerance = 0.00000001; // 1e-8 FLOW (smallest unit)
    const synchronized = Math.abs(discrepancy) < tolerance;
    
    // Log result
    if (synchronized) {
      console.log('[SYNC CHECK] ✓ Balances synchronized', {
        supabaseTotal,
        escrowVaultBalance,
        discrepancy,
        timestamp: timestamp.toISOString(),
      });
    } else {
      // Emit critical error if mismatch detected (Requirement 9.3)
      console.error('[SYNC CHECK] ✗ CRITICAL: Balance mismatch detected!', {
        supabaseTotal,
        escrowVaultBalance,
        discrepancy,
        timestamp: timestamp.toISOString(),
      });
      
      // Log to audit system (could be extended to send alerts)
      await logSyncDiscrepancy({
        supabaseTotal,
        escrowVaultBalance,
        discrepancy,
        timestamp,
      });
    }
    
    return {
      synchronized,
      supabaseTotal,
      escrowVaultBalance,
      discrepancy,
      timestamp,
    };
  } catch (error) {
    const errorMsg = `Synchronization check failed: ${error instanceof Error ? error.message : String(error)}`;
    console.error('[SYNC CHECK ERROR]', errorMsg);
    
    return {
      synchronized: false,
      supabaseTotal: 0,
      escrowVaultBalance: 0,
      discrepancy: 0,
      timestamp,
      error: errorMsg,
    };
  }
}

/**
 * Query the escrow vault balance from the Flow blockchain
 * 
 * @param contractAddress - The Flow address of the OverflowGame contract
 * @returns The balance of the escrow vault in FLOW tokens
 */
async function queryEscrowVaultBalance(contractAddress: string): Promise<number> {
  try {
    const script = getEscrowVaultBalanceScript();
    
    const balance = await fcl.query({
      cadence: script,
      args: (arg: any, t: any) => [arg(contractAddress, t.Address)],
    });
    
    // Convert from UFix64 string to number
    return Number(balance);
  } catch (error) {
    console.error('[ESCROW QUERY ERROR]', error);
    throw new Error(`Failed to query escrow vault balance: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Log synchronization discrepancy to audit system
 * 
 * This function records balance mismatches for administrative review and debugging.
 * 
 * @param details - Details of the synchronization discrepancy
 */
async function logSyncDiscrepancy(details: {
  supabaseTotal: number;
  escrowVaultBalance: number;
  discrepancy: number;
  timestamp: Date;
}): Promise<void> {
  try {
    // Insert a special audit log entry for sync discrepancies
    const { error } = await supabase
      .from('balance_audit_log')
      .insert({
        user_address: 'SYSTEM',
        operation_type: 'sync_check',
        amount: details.discrepancy,
        balance_before: details.supabaseTotal,
        balance_after: details.escrowVaultBalance,
        created_at: details.timestamp.toISOString(),
      });
    
    if (error) {
      console.error('[SYNC LOG ERROR] Failed to log discrepancy:', error);
    }
  } catch (error) {
    console.error('[SYNC LOG ERROR]', error);
  }
}

/**
 * Run periodic synchronization checks
 * 
 * This function can be called on a schedule (e.g., via cron job) to continuously
 * monitor balance synchronization.
 * 
 * @param contractAddress - The Flow address of the OverflowGame contract
 * @param intervalMs - Interval between checks in milliseconds (default: 5 minutes)
 * @returns A function to stop the periodic checks
 */
export function startPeriodicSyncCheck(
  contractAddress: string,
  intervalMs: number = 5 * 60 * 1000 // 5 minutes
): () => void {
  console.log(`[SYNC CHECK] Starting periodic checks every ${intervalMs}ms`);
  
  // Run initial check
  checkBalanceSynchronization(contractAddress);
  
  // Schedule periodic checks
  const intervalId = setInterval(() => {
    checkBalanceSynchronization(contractAddress);
  }, intervalMs);
  
  // Return function to stop checks
  return () => {
    console.log('[SYNC CHECK] Stopping periodic checks');
    clearInterval(intervalId);
  };
}

/**
 * Result of a reconciliation operation
 */
export interface ReconciliationResult {
  /** Whether the reconciliation was successful */
  success: boolean;
  /** User address that was reconciled */
  userAddress: string;
  /** Balance in Supabase before reconciliation */
  oldBalance: number;
  /** Balance in Supabase after reconciliation (matches contract) */
  newBalance: number;
  /** Discrepancy amount (newBalance - oldBalance) */
  discrepancy: number;
  /** Timestamp of the reconciliation */
  timestamp: Date;
  /** Error message if reconciliation failed */
  error?: string;
}

/**
 * Reconcile a user's balance between Supabase and the contract
 * 
 * This function queries the user's balance from the contract (source of truth)
 * and updates the Supabase balance to match. It logs the reconciliation action
 * in the audit log.
 * 
 * @param userAddress - The Flow address of the user to reconcile
 * @param adminAddress - The address of the admin performing reconciliation (optional)
 * @returns ReconciliationResult containing reconciliation details
 * 
 * Requirements: 9.4, 9.5
 */
export async function reconcileUserBalance(
  userAddress: string,
  adminAddress: string = 'ADMIN'
): Promise<ReconciliationResult> {
  const timestamp = new Date();
  
  try {
    // Query user balance from contract (source of truth)
    const contractBalance = await queryUserBalanceFromContract(userAddress);
    
    console.log('[RECONCILIATION] Querying contract balance for user:', {
      userAddress,
      contractBalance,
    });
    
    // Call stored procedure to reconcile balance in Supabase
    const { data, error } = await supabase.rpc('reconcile_user_balance', {
      p_user_address: userAddress,
      p_contract_balance: contractBalance,
      p_admin_address: adminAddress,
    });
    
    if (error) {
      const errorMsg = `Failed to reconcile balance in Supabase: ${error.message}`;
      console.error('[RECONCILIATION ERROR]', errorMsg);
      return {
        success: false,
        userAddress,
        oldBalance: 0,
        newBalance: 0,
        discrepancy: 0,
        timestamp,
        error: errorMsg,
      };
    }
    
    // Parse result from stored procedure
    const result = data as {
      success: boolean;
      error: string | null;
      old_balance: number;
      new_balance: number;
      discrepancy: number;
    };
    
    if (!result.success) {
      console.error('[RECONCILIATION ERROR]', result.error);
      return {
        success: false,
        userAddress,
        oldBalance: result.old_balance || 0,
        newBalance: result.new_balance || 0,
        discrepancy: result.discrepancy || 0,
        timestamp,
        error: result.error || 'Unknown error',
      };
    }
    
    // Log successful reconciliation
    console.log('[RECONCILIATION] ✓ Balance reconciled successfully', {
      userAddress,
      oldBalance: result.old_balance,
      newBalance: result.new_balance,
      discrepancy: result.discrepancy,
      timestamp: timestamp.toISOString(),
    });
    
    return {
      success: true,
      userAddress,
      oldBalance: result.old_balance,
      newBalance: result.new_balance,
      discrepancy: result.discrepancy,
      timestamp,
    };
  } catch (error) {
    const errorMsg = `Reconciliation failed: ${error instanceof Error ? error.message : String(error)}`;
    console.error('[RECONCILIATION ERROR]', errorMsg);
    
    return {
      success: false,
      userAddress,
      oldBalance: 0,
      newBalance: 0,
      discrepancy: 0,
      timestamp,
      error: errorMsg,
    };
  }
}

/**
 * Query a user's balance from the Flow blockchain contract
 * 
 * Note: This assumes the contract has a getUserBalance function.
 * If the contract doesn't track individual user balances, this will need
 * to be implemented differently (e.g., by tracking deposits/withdrawals).
 * 
 * @param userAddress - The Flow address of the user
 * @returns The user's balance in the contract
 */
async function queryUserBalanceFromContract(userAddress: string): Promise<number> {
  try {
    const script = getUserBalanceFromContractScript();
    
    const balance = await fcl.query({
      cadence: script,
      args: (arg: any, t: any) => [arg(userAddress, t.Address)],
    });
    
    // Convert from UFix64 string to number
    return Number(balance);
  } catch (error) {
    console.error('[CONTRACT QUERY ERROR]', error);
    throw new Error(`Failed to query user balance from contract: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Reconcile all users with balance discrepancies
 * 
 * This function queries all users from Supabase, checks their balance against
 * the contract, and reconciles any discrepancies found.
 * 
 * @param adminAddress - The address of the admin performing reconciliation
 * @param dryRun - If true, only reports discrepancies without updating (default: false)
 * @returns Array of reconciliation results
 */
export async function reconcileAllUsers(
  adminAddress: string = 'ADMIN',
  dryRun: boolean = false
): Promise<ReconciliationResult[]> {
  console.log('[RECONCILIATION] Starting bulk reconciliation', {
    adminAddress,
    dryRun,
  });
  
  try {
    // Query all users from Supabase
    const { data: users, error } = await supabase
      .from('user_balances')
      .select('user_address, balance');
    
    if (error) {
      console.error('[RECONCILIATION ERROR] Failed to query users:', error);
      return [];
    }
    
    if (!users || users.length === 0) {
      console.log('[RECONCILIATION] No users found in database');
      return [];
    }
    
    console.log(`[RECONCILIATION] Found ${users.length} users to check`);
    
    const results: ReconciliationResult[] = [];
    
    // Check each user
    for (const user of users) {
      try {
        // Query contract balance
        const contractBalance = await queryUserBalanceFromContract(user.user_address);
        const supabaseBalance = Number(user.balance);
        const discrepancy = contractBalance - supabaseBalance;
        
        // Check if reconciliation is needed (allow small floating point differences)
        const tolerance = 0.00000001; // 1e-8 FLOW
        const needsReconciliation = Math.abs(discrepancy) >= tolerance;
        
        if (needsReconciliation) {
          console.log('[RECONCILIATION] Discrepancy found:', {
            userAddress: user.user_address,
            supabaseBalance,
            contractBalance,
            discrepancy,
          });
          
          if (!dryRun) {
            // Perform reconciliation
            const result = await reconcileUserBalance(user.user_address, adminAddress);
            results.push(result);
          } else {
            // Dry run - just report the discrepancy
            results.push({
              success: true,
              userAddress: user.user_address,
              oldBalance: supabaseBalance,
              newBalance: contractBalance,
              discrepancy,
              timestamp: new Date(),
            });
          }
        }
      } catch (error) {
        console.error(`[RECONCILIATION ERROR] Failed to check user ${user.user_address}:`, error);
        results.push({
          success: false,
          userAddress: user.user_address,
          oldBalance: Number(user.balance),
          newBalance: 0,
          discrepancy: 0,
          timestamp: new Date(),
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    
    console.log(`[RECONCILIATION] Completed. Processed ${results.length} users with discrepancies`);
    
    return results;
  } catch (error) {
    console.error('[RECONCILIATION ERROR] Bulk reconciliation failed:', error);
    return [];
  }
}
