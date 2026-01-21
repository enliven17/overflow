'use client';

import React from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';

export const WalletConnect: React.FC = () => {
  const isConnected = useStore((state) => state.isConnected);
  const isConnecting = useStore((state) => state.isConnecting);
  const connect = useStore((state) => state.connect);
  const disconnect = useStore((state) => state.disconnect);
  const error = useStore((state) => state.error);
  
  const handleClick = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
  };
  
  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        onClick={handleClick}
        disabled={isConnecting}
        variant={isConnected ? 'secondary' : 'primary'}
      >
        {isConnecting ? 'Connecting...' : isConnected ? 'Disconnect' : 'Connect Wallet'}
      </Button>
      
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </div>
  );
};
