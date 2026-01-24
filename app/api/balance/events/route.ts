/**
 * POST /api/balance/events endpoint
 * 
 * Task: 5.1 Create event listener for Deposit events
 * Requirements: 1.2
 * 
 * Manages the balance event listener service.
 * This endpoint can be used to start/stop the event listener or check its status.
 * 
 * Note: In a production environment, this would typically run as a separate
 * background service or worker process. For development, this endpoint provides
 * a way to manually trigger event listening.
 */

import { NextRequest, NextResponse } from 'next/server';
import { configureFlow, getCurrentNetwork } from '@/lib/flow/config';
import { startBalanceEventListener } from '@/lib/flow/balanceEventListeners';

// Store the unsubscribe function globally (in production, use a proper state management solution)
let eventListenerUnsubscribe: (() => void) | null = null;
let isListening = false;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'start') {
      // Check if already listening
      if (isListening) {
        return NextResponse.json({
          success: false,
          message: 'Event listener is already running',
          isListening: true,
        });
      }

      // Configure Flow
      const network = getCurrentNetwork();
      configureFlow(network);

      // Get contract address from environment or use default
      const contractAddress = process.env.NEXT_PUBLIC_EMULATOR_CONTRACT_ADDRESS || '0xf8d6e0586b0a20c7';

      console.log('[EventsAPI] Starting balance event listener for contract:', contractAddress);

      // Start the event listener
      eventListenerUnsubscribe = startBalanceEventListener(contractAddress);
      isListening = true;

      return NextResponse.json({
        success: true,
        message: 'Balance event listener started successfully',
        isListening: true,
        contractAddress,
        network,
      });
    } else if (action === 'stop') {
      // Check if listener is running
      if (!isListening || !eventListenerUnsubscribe) {
        return NextResponse.json({
          success: false,
          message: 'Event listener is not running',
          isListening: false,
        });
      }

      console.log('[EventsAPI] Stopping balance event listener');

      // Stop the event listener
      eventListenerUnsubscribe();
      eventListenerUnsubscribe = null;
      isListening = false;

      return NextResponse.json({
        success: true,
        message: 'Balance event listener stopped successfully',
        isListening: false,
      });
    } else if (action === 'status') {
      // Return current status
      return NextResponse.json({
        success: true,
        isListening,
        message: isListening ? 'Event listener is running' : 'Event listener is not running',
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "start", "stop", or "status"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[EventsAPI] Error managing event listener:', error);
    return NextResponse.json(
      { error: 'An error occurred managing the event listener' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Return current status
  return NextResponse.json({
    success: true,
    isListening,
    message: isListening ? 'Event listener is running' : 'Event listener is not running',
  });
}
