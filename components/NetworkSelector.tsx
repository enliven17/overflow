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
    emulator: 'text-blue-400 border-blue-500',
    testnet: 'text-yellow-400 border-yellow-500',
    mainnet: 'text-green-400 border-green-500'
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
          border-2 rounded px-3 py-1.5 text-sm font-semibold
          hover:bg-gray-800 transition-colors
          flex items-center gap-2
        `}
      >
        <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
        {networkLabels[currentNetwork]}
        <span className="text-xs">▼</span>
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
          <div className="absolute top-full right-0 mt-2 bg-[#0a0a0a] border-2 border-gray-700 rounded-lg shadow-lg z-50 min-w-[150px]">
            {(['emulator', 'testnet', 'mainnet'] as Network[]).map((network) => (
              <button
                key={network}
                onClick={() => handleNetworkChange(network)}
                className={`
                  w-full text-left px-4 py-2 hover:bg-gray-800 transition-colors
                  flex items-center gap-2
                  ${currentNetwork === network ? 'bg-gray-800' : ''}
                  ${network === 'emulator' ? 'rounded-t-lg' : ''}
                  ${network === 'mainnet' ? 'rounded-b-lg' : ''}
                `}
              >
                <span className={`w-2 h-2 rounded-full ${networkColors[network].split(' ')[0].replace('text-', 'bg-')}`} />
                <span className={networkColors[network].split(' ')[0]}>
                  {networkLabels[network]}
                </span>
                {currentNetwork === network && (
                  <span className="ml-auto text-[#FF006E]">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
