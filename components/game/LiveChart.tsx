'use client';

import React, { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import * as d3Shape from 'd3-shape';
import { useStore } from '@/lib/store';

interface LiveChartProps {
  betAmount: string;
  setBetAmount: (amount: string) => void;
}

interface ResolvedCell {
  id: string;
  row: number;
  won: boolean;
  timestamp: number;
}

export const LiveChart: React.FC<LiveChartProps> = ({ betAmount, setBetAmount }) => {
  const priceHistory = useStore((state) => state.priceHistory);
  const currentPrice = useStore((state) => state.currentPrice);
  const placeBet = useStore((state) => state.placeBet);

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [now, setNow] = useState(Date.now());

  // Track resolved (past) cells - cells that have been "hit" by the chart
  const [resolvedCells, setResolvedCells] = useState<ResolvedCell[]>([]);

  // Stable Y-Axis Domain
  const yDomain = useRef({ min: 0, max: 100, initialized: false });

  // Update dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    window.addEventListener('resize', updateDimensions);
    updateDimensions();
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Smooth Animation Loop
  useEffect(() => {
    let frameId: number;
    let lastTime = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      // Throttle to ~30fps for smoother visual (less re-renders)
      if (currentTime - lastTime > 33) {
        setNow(currentTime);
        lastTime = currentTime;
      }
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Configuration
  const historyWidthRatio = 0.55; // Chart tip at 55% - more room for future grid
  const pixelsPerSecond = 60; // Speed
  const gridInterval = 2500; // 2.5s per column
  const numRows = 8;

  // Scales
  const scales = useMemo(() => {
    if (dimensions.width === 0 || currentPrice === 0) return null;

    // Use ±1% of current price for Y-axis range
    const rangePercent = 0.01; // 1%
    const targetMin = currentPrice * (1 - rangePercent);
    const targetMax = currentPrice * (1 + rangePercent);

    const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;

    if (!yDomain.current.initialized) {
      yDomain.current = { min: targetMin, max: targetMax, initialized: true };
    } else {
      // Smooth transition to new range
      yDomain.current.min = lerp(yDomain.current.min, targetMin, 0.02);
      yDomain.current.max = lerp(yDomain.current.max, targetMax, 0.02);
    }

    const { min: minY, max: maxY } = yDomain.current;

    const yScale = (price: number) => {
      return dimensions.height - ((price - minY) / (maxY - minY)) * dimensions.height;
    };

    const tipX = dimensions.width * historyWidthRatio;

    const xScale = (timestamp: number) => {
      const diffMs = timestamp - now;
      const diffSeconds = diffMs / 1000;
      return tipX + (diffSeconds * pixelsPerSecond);
    };

    return { yScale, xScale, tipX, minY, maxY };
  }, [dimensions, priceHistory, currentPrice, now]);

  // Chart Path
  const chartPath = useMemo(() => {
    if (!scales || priceHistory.length < 2) return '';

    const visiblePoints = priceHistory.filter((p: any) => {
      const x = scales.xScale(p.timestamp);
      return x > -50 && x <= scales.tipX + 5;
    });

    if (visiblePoints.length < 2) return '';

    const pointsToRender = [...visiblePoints];
    // Add current live point
    pointsToRender.push({ timestamp: now, price: currentPrice });

    const lineGenerator = d3Shape.line<{ timestamp: number, price: number }>()
      .x((d) => scales.xScale(d.timestamp))
      .y((d) => scales.yScale(d.price))
      .curve(d3Shape.curveMonotoneX);

    return lineGenerator(pointsToRender) || '';
  }, [scales, priceHistory, currentPrice, now]);

  // Continuous Grid Generation
  // Key: Use modulo arithmetic for infinite scroll effect
  const betCells = useMemo(() => {
    if (!scales || dimensions.height === 0) return [];

    const cells = [];
    const colWidth = (gridInterval / 1000) * pixelsPerSecond;
    const rowHeight = dimensions.height / numRows;

    // Calculate base offset for smooth scrolling
    // This creates a continuous "conveyor belt" effect
    const baseOffset = (now % gridInterval) / 1000 * pixelsPerSecond;

    // Generate enough columns to fill screen + buffer
    const totalGridWidth = dimensions.width - scales.tipX + colWidth * 2;
    const columnsNeeded = Math.ceil(totalGridWidth / colWidth) + 2;

    const currentPriceY = scales.yScale(currentPrice);

    for (let col = -1; col < columnsNeeded; col++) {
      // Column X position: starts at tipX, flows right-to-left
      const colX = scales.tipX + (col * colWidth) - baseOffset + colWidth;

      // Calculate the "virtual time" this column represents
      const colTimeOffset = col * gridInterval;
      const colTimestamp = Math.floor(now / gridInterval) * gridInterval + colTimeOffset + gridInterval;

      // Skip if completely off-screen left
      if (colX + colWidth < scales.tipX - 50) continue;
      // Skip if too far right
      if (colX > dimensions.width + 50) continue;

      // Determine if this column is crossing the tip
      const isCrossing = colX <= scales.tipX && colX + colWidth > scales.tipX;
      const isPast = colX + colWidth <= scales.tipX;

      for (let row = 0; row < numRows; row++) {
        const y = row * rowHeight;
        const cellBottom = y + rowHeight;
        const centerY = y + rowHeight / 2;

        // Determine win/loss for cells crossing or past
        let status: 'future' | 'active' | 'won' | 'lost' = 'future';

        if (isCrossing || isPast) {
          // Check if price is in this row
          if (currentPriceY >= y && currentPriceY <= cellBottom) {
            status = 'won';
          } else {
            status = isPast ? 'lost' : 'active';
          }
        }

        // Color based on position relative to center
        const isUp = centerY < dimensions.height / 2;

        // Multiplier calculation (reduced values)
        const distFromCenter = Math.abs(centerY - dimensions.height / 2) / dimensions.height;
        const timeBonus = Math.max(0, (colX - scales.tipX) / 200) * 0.2;
        const multiplier = (1.1 + distFromCenter * 2 + timeBonus).toFixed(2);

        cells.push({
          id: `cell-${colTimestamp}-${row}`,
          x: colX,
          y,
          width: colWidth - 3,
          height: rowHeight - 3,
          multiplier,
          isUp,
          status,
          color: isUp ? '#00ff9d' : '#ff006e'
        });
      }
    }

    return cells;
  }, [scales, now, currentPrice, dimensions]);

  return (
    <div ref={containerRef} className="absolute inset-0 z-0 bg-[#02040A] overflow-hidden select-none">
      {/* Background Grid */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}
      />

      {/* Cells Layer - Rendered BEHIND the chart line */}
      <div className="absolute inset-0 z-5 overflow-hidden pointer-events-none">
        {betCells.map((cell: any) => {
          // Visual styling based on status
          let opacity = 0.7;
          let bg = `${cell.color}15`;
          let borderStyle = `1px solid ${cell.color}40`;
          let transform = 'scale(1)';
          let boxShadow = 'none';
          let canBet = cell.status === 'future'; // Only future cells can be bet on

          if (cell.status === 'won') {
            opacity = 1;
            bg = cell.color;
            borderStyle = `2px solid #ffffff`;
            transform = 'scale(1.05)';
            boxShadow = `0 0 25px ${cell.color}, 0 0 50px ${cell.color}50`;
          } else if (cell.status === 'lost') {
            // Don't render lost cells
            return null;
          } else if (cell.status === 'active') {
            opacity = 0.9;
            borderStyle = `1px solid ${cell.color}80`;
          }

          const handleClick = () => {
            if (canBet && betAmount) {
              placeBet(betAmount, `${cell.isUp ? 'UP' : 'DOWN'}-${cell.multiplier}`);
            }
          };

          return (
            <button
              key={cell.id}
              onClick={handleClick}
              disabled={!canBet}
              className={`absolute rounded-sm flex flex-col items-center justify-center transition-all duration-150 ${canBet ? 'pointer-events-auto cursor-pointer hover:scale-105 hover:brightness-125' : 'pointer-events-none'}`}
              style={{
                left: cell.x,
                top: cell.y,
                width: cell.width,
                height: cell.height,
                backgroundColor: bg,
                border: borderStyle,
                opacity,
                transform,
                boxShadow,
                zIndex: cell.status === 'won' ? 100 : 1
              }}
            >
              <span className={`text-[10px] font-mono font-bold ${cell.status === 'won' ? 'text-black' : 'text-white'} drop-shadow-sm`}>
                x{cell.multiplier}
              </span>
            </button>
          );
        })}
      </div>

      {/* SVG Layer for Chart - ON TOP */}
      <svg className="absolute inset-0 w-full h-full z-10 pointer-events-none">
        {scales && (
          <>
            {/* Glow effect */}
            <path
              d={chartPath}
              fill="none"
              stroke="#00F0FF"
              strokeWidth="15"
              strokeOpacity="0.15"
              strokeLinecap="round"
            />
            {/* Main line */}
            <path
              d={chartPath}
              fill="none"
              stroke="#00F0FF"
              strokeWidth="3"
              strokeLinecap="round"
              className="drop-shadow-[0_0_10px_rgba(0,240,255,0.8)]"
            />

            {/* Tip indicator */}
            <circle
              cx={scales.tipX}
              cy={scales.yScale(currentPrice)}
              r="6"
              fill="#ffffff"
              stroke="#00F0FF"
              strokeWidth="2"
              className="animate-pulse"
            />

            {/* Horizontal price line */}
            <line
              x1={0}
              y1={scales.yScale(currentPrice)}
              x2={scales.tipX - 10}
              y2={scales.yScale(currentPrice)}
              stroke="#00F0FF"
              strokeOpacity="0.3"
              strokeDasharray="4 4"
            />
          </>
        )}
      </svg>

      {/* Price Header - positioned below the main header */}
      <div className="absolute top-20 left-6 z-30 pointer-events-none">
        <h2 className="text-gray-500 text-xs tracking-widest font-mono mb-1">BTC/USD</h2>
        <p className="text-white text-4xl font-black font-mono tracking-tight drop-shadow-2xl">
          ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
    </div>
  );
};
