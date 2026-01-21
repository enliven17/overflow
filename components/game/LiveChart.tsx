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
  
  // Calculate price range for Y-axis
  const priceRange = useMemo(() => {
    if (priceHistory.length === 0) {
      return { min: 0, max: 100000 };
    }
    
    const prices = priceHistory.map(p => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.1 || 1000; // 10% padding or 1000 if no range
    
    return {
      min: Math.floor(min - padding),
      max: Math.ceil(max + padding)
    };
  }, [priceHistory]);
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0a0a0a] border border-[#FF006E] rounded px-3 py-2">
          <p className="text-white text-sm">
            ${payload[0].value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-gray-400 text-xs">{payload[0].payload.time}</p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <Card className="h-full">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">BTC/USD</h2>
          <div className="text-right">
            <p className="text-[#FF006E] text-2xl font-bold">
              ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-gray-400 text-xs">Live Price</p>
          </div>
        </div>
        
        {/* Chart */}
        <div className="h-[400px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  dataKey="time" 
                  stroke="#666"
                  tick={{ fill: '#999', fontSize: 12 }}
                  tickLine={{ stroke: '#666' }}
                />
                <YAxis 
                  domain={[priceRange.min, priceRange.max]}
                  stroke="#666"
                  tick={{ fill: '#999', fontSize: 12 }}
                  tickLine={{ stroke: '#666' }}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#FF006E" 
                  strokeWidth={2}
                  dot={false}
                  animationDuration={300}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500">Waiting for price data...</p>
            </div>
          )}
        </div>
        
        {/* Info */}
        <div className="flex justify-between text-xs text-gray-400">
          <span>Last 5 minutes</span>
          <span>{chartData.length} data points</span>
        </div>
      </div>
    </Card>
  );
};
