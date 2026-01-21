'use client';

import React, { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { Card } from '@/components/ui/Card';

export const WalletInfo: React.FC = () => {
  const address = useStore((state) => state.address);
  const balance = useStore((state) => state.balance);
  const isConnected = useStore((state) => state.isConnected);

  if (!isConnected || !address) {
    return null;
  }

  // Format address to show first 6 and last 4 characters
  const formatAddress = (addr: string) => {
    if (addr.length <= 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Format balance to 2 decimal places
  const formatBalance = (bal: string) => {
    const num = parseFloat(bal);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  return (
    <Card className="min-w-[200px] border border-white/10 !bg-black/40 backdrop-blur-md">
      <div className="space-y-2">
        <div>
          <p className="text-gray-400 text-[10px] uppercase tracking-wider font-mono">Address</p>
          <p className="text-white font-mono text-xs">{formatAddress(address)}</p>
        </div>

        <div>
          <p className="text-gray-400 text-[10px] uppercase tracking-wider font-mono">Balance</p>
          <p className="text-neon-blue font-bold text-lg font-mono text-shadow-neon">
            {formatBalance(balance)} FLOW
          </p>
        </div>
      </div>
    </Card>
  );
};
