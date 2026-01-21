'use client';

import React, { useState, useEffect } from 'react';
import { configureFlow } from '@/lib/flow/config';

type Network = 'emulator' | 'testnet' | 'mainnet';

export const NetworkSelector: React.FC = () => {
  const [currentNetwork, setCurrentNetwork] = useState<Network>('emulator');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Get initial network from env or localStorage (client-side only)
    if (typeof window !== 'undefined') {
      const savedNetwork = localStorage.getItem('overflow_network') as Network;
      const envNetwork = (process.env.NEXT_PUBLIC_FLOW_NETWORK as Network) || 'emulator';
      const initialNetwork = savedNetwork || envNetwork;

      setCurrentNetwork(initialNetwork);
    }
  }, []);

  const handleNetworkChange = (network: Network) => {
    setCurrentNetwork(network);
    setIsOpen(false);

    // Save to localStorage (client-side only)
    if (typeof window !== 'undefined') {
      localStorage.setItem('overflow_network', network);

      // Reconfigure Flow
      configureFlow(network);

      // Reload page to reinitialize with new network
      window.location.reload();
    }
  };

  const networkColors = {
    emulator: 'text-neon-blue border-neon-blue',
    testnet: 'text-yellow-400 border-yellow-500',
    mainnet: 'text-neon-green border-neon-green'
  };

  const networkLabels = {
    emulator: 'Emulator',
    testnet: 'Testnet',
    mainnet: 'Mainnet'
  };

  return (
    <div className="relative">
      {/* Current Network Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          ${networkColors[currentNetwork]}
          border rounded px-3 py-1.5 text-xs font-bold uppercase tracking-wider
          bg-black/40 hover:bg-black/60 transition-colors backdrop-blur-sm
          flex items-center gap-2 font-mono
        `}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse shadow-[0_0_8px_currentColor]" />
        {networkLabels[currentNetwork]}
        <span className="text-[10px]">▼</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute top-full right-0 mt-2 bg-black/90 border border-white/10 rounded-lg shadow-xl z-50 min-w-[150px] backdrop-blur-xl">
            {(['emulator', 'testnet', 'mainnet'] as Network[]).map((network) => (
              <button
                key={network}
                onClick={() => handleNetworkChange(network)}
                className={`
                  w-full text-left px-4 py-3 hover:bg-white/5 transition-colors
                  flex items-center gap-2 font-mono text-xs
                  ${currentNetwork === network ? 'bg-white/5' : ''}
                  ${network === 'emulator' ? 'rounded-t-lg' : ''}
                  ${network === 'mainnet' ? 'rounded-b-lg' : ''}
                `}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${networkColors[network].split(' ')[0].replace('text-', 'bg-')}`} />
                <span className={networkColors[network].split(' ')[0]}>
                  {networkLabels[network]}
                </span>
                {currentNetwork === network && (
                  <span className="ml-auto text-neon-blue">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
