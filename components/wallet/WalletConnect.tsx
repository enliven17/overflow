'use client';

import React from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';

export const WalletConnect: React.FC = () => {
  const isConnected = useStore((state) => state.isConnected);
  const isConnecting = useStore((state) => state.isConnecting);
  const connect = useStore((state) => state.connect);
  const error = useStore((state) => state.error);

  // Don't show anything when connected (disconnect is in bottom panel now)
  if (isConnected) {
    return null;
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        onClick={connect}
        disabled={isConnecting}
        variant="primary"
      >
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </div>
  );
};
