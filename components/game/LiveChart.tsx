'use client';

import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useStore } from '@/lib/store';
import { Card } from '@/components/ui/Card';

export const LiveChart: React.FC = () => {
  const priceHistory = useStore((state) => state.priceHistory);
  const currentPrice = useStore((state) => state.currentPrice);

  // Format data for recharts
  const chartData = useMemo(() => {
    return priceHistory.map(point => ({
      time: new Date(point.timestamp).toLocaleTimeString(),
      price: point.price
    }));
  }, [priceHistory]);

  // Calculate price range - Fixed to specific windows to prevent jumping
  const priceRange = useMemo(() => {
    if (priceHistory.length === 0) {
      return { min: 0, max: 100000 };
    }

    const prices = priceHistory.map(p => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    // Round to nearest 100 to reduce jitter
    const padding = (maxPrice - minPrice) * 0.5; // Larger padding to keep it centered but stable
    const min = Math.floor((minPrice - padding) / 100) * 100;
    const max = Math.ceil((maxPrice + padding) / 100) * 100;

    return { min, max };
  }, [priceHistory]); // Only re-calc when history changes, but the rounding helps stability

  return (
    <div className="absolute inset-0 z-0 bg-[#02040A]">
      {/* Background Grid Pattern */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(#112240 1px, transparent 1px), linear-gradient(90deg, #112240 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      {/* Live Price Display - Floating */}
      <div className="absolute top-24 left-8 z-10 transition-all">
        <h2 className="text-gray-400 text-sm tracking-widest font-mono mb-1">BTC/USD</h2>
        <div className="flex items-baseline gap-3">
          <p className="text-white text-5xl font-bold font-mono tracking-tighter">
            ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse"></span>
            <span className="text-neon-green text-sm font-bold">LIVE</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-full w-full">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              {/* Vertical Gradients for that "flowing" feel */}
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00F0FF" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#112240" opacity={0.3} vertical={false} />
              <XAxis
                dataKey="time"
                hide={true}
              />
              <YAxis
                domain={[priceRange.min, priceRange.max]}
                orientation="right"
                stroke="#333"
                tick={{ fill: '#445', fontSize: 11, fontFamily: 'monospace' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
                allowDataOverflow={true} // Prevent recharts from auto-expanding excessively
              />

              <Line
                type="monotone" // Smooth curve as requested "su gibi"
                dataKey="price"
                stroke="#00F0FF"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: '#fff', stroke: '#00F0FF', strokeWidth: 2 }}
                animationDuration={1000} // Slower animation for flow feeling
                animationEasing="linear"
                fill="url(#colorPrice)"
              />
              {/* Glow Line */}
              <Line
                type="monotone"
                dataKey="price"
                stroke="#00F0FF"
                strokeWidth={10}
                strokeOpacity={0.15}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-neon-blue border-t-transparent rounded-full animate-spin"></div>
              <p className="text-neon-blue font-mono text-sm animate-pulse">CONNECTING TO FEED...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
