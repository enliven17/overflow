/**
 * POST /api/balance/deposit endpoint
 * 
 * Task: 4.2 Create POST /api/balance/deposit endpoint
 * Requirements: 1.2, 7.5
 * 
 * Called by blockchain event listener after deposit transaction.
 * Updates Supabase balance by adding deposit amount.
 * Inserts audit log entry with operation_type='deposit'.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

interface DepositRequest {
  userAddress: string;
  amount: number;
  txHash: string;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: DepositRequest = await request.json();
    const { userAddress, amount, txHash } = body;

    // Validate required fields
    if (!userAddress || amount === undefined || amount === null || !txHash) {
      return NextResponse.json(
        { error: 'Missing required fields: userAddress, amount, txHash' },
        { status: 400 }
      );
    }

    // Validate address format (Flow addresses start with 0x)
    if (!userAddress.startsWith('0x')) {
      return NextResponse.json(
        { error: 'Invalid address format. Flow addresses must start with 0x' },
        { status: 400 }
      );
    }

    // Validate amount is positive
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Deposit amount must be greater than zero' },
        { status: 400 }
      );
    }

    // Call update_balance_for_deposit stored procedure
    // This procedure handles:
    // - Atomic balance update with row-level locking
    // - Creating user record if it doesn't exist
    // - Inserting audit log entry with operation_type='deposit'
    const { data, error } = await supabase.rpc('update_balance_for_deposit', {
      p_user_address: userAddress,
      p_deposit_amount: amount,
      p_transaction_hash: txHash,
    });

    // Handle database errors
    if (error) {
      console.error('Database error in deposit:', error);
      return NextResponse.json(
        { error: 'Service temporarily unavailable. Please try again.' },
        { status: 503 }
      );
    }

    // Parse the JSON result from the stored procedure
    const result = data as { success: boolean; error: string | null; new_balance: number };

    // Check if the procedure reported an error
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Deposit failed' },
        { status: 400 }
      );
    }

    // Return success with new balance
    return NextResponse.json({
      success: true,
      newBalance: parseFloat(result.new_balance.toString()),
    });
  } catch (error) {
    // Handle unexpected errors
    console.error('Unexpected error in POST /api/balance/deposit:', error);
    return NextResponse.json(
      { error: 'An error occurred processing your request' },
      { status: 500 }
    );
  }
}
