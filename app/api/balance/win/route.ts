/**
 * POST /api/balance/win endpoint
 * 
 * Credits winning amount to user's house balance.
 * Called when a bet is won in the instant-resolution system.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

interface WinRequest {
    userAddress: string;
    winAmount: number;
    betId: string;
}

export async function POST(request: NextRequest) {
    try {
        // Parse request body
        const body: WinRequest = await request.json();
        const { userAddress, winAmount, betId } = body;

        // Validate required fields
        if (!userAddress || winAmount === undefined || winAmount === null) {
            return NextResponse.json(
                { error: 'Missing required fields: userAddress, winAmount' },
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

        // Validate win amount is positive
        if (winAmount <= 0) {
            return NextResponse.json(
                { error: 'Win amount must be greater than zero' },
                { status: 400 }
            );
        }

        // Get current balance
        const { data: userData, error: fetchError } = await supabase
            .from('user_balances')
            .select('balance')
            .eq('user_address', userAddress)
            .single();

        if (fetchError || !userData) {
            console.error('Error fetching user balance:', fetchError);
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        const currentBalance = parseFloat(userData.balance.toString());
        const newBalance = currentBalance + winAmount;

        // Update balance
        const { error: updateError } = await supabase
            .from('user_balances')
            .update({
                balance: newBalance,
                updated_at: new Date().toISOString()
            })
            .eq('user_address', userAddress);

        if (updateError) {
            console.error('Error updating balance:', updateError);
            return NextResponse.json(
                { error: 'Failed to credit winnings' },
                { status: 500 }
            );
        }

        // Insert audit log entry
        const { error: auditError } = await supabase
            .from('balance_audit_log')
            .insert({
                user_address: userAddress,
                operation_type: 'bet_won',
                amount: winAmount,
                balance_before: currentBalance,
                balance_after: newBalance,
                metadata: { betId }
            });

        if (auditError) {
            console.error('Error inserting audit log:', auditError);
            // Don't fail the request for audit log errors
        }

        // Return success with new balance
        return NextResponse.json({
            success: true,
            newBalance: newBalance,
            winAmount: winAmount
        });

    } catch (error) {
        console.error('Unexpected error in POST /api/balance/win:', error);
        return NextResponse.json(
            { error: 'An error occurred processing your request' },
            { status: 500 }
        );
    }
}
