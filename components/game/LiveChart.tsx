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

  // Animation Loop - Optimized for performance
  useEffect(() => {
    let frameId: number;
    let lastTime = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      // Throttle to ~20fps for better performance
      if (currentTime - lastTime > 50) {
        setNow(currentTime);
        lastTime = currentTime;
      }
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Configuration - Responsive
  const isMobile = dimensions.width < 640;
  const historyWidthRatio = isMobile ? 0.35 : 0.50; // More grid space on mobile
  const pixelsPerSecond = isMobile ? 40 : 50;
  const gridInterval = isMobile ? 3000 : 2500; // Fewer cells on mobile
  const numRows = 10; // Same on mobile and desktop

  // Scales
  const scales = useMemo(() => {
    if (dimensions.width === 0 || currentPrice === 0) return null;

    // Use FIRST price in history as stable reference
    const referencePrice = priceHistory.length > 0 ? priceHistory[0].price : currentPrice;

    // Use ±6% of reference price for Y-axis range
    const rangePercent = 0.06; // 6%
    const targetMin = referencePrice * (1 - rangePercent);
    const targetMax = referencePrice * (1 + rangePercent);

    // FIXED Y-axis - only initialize once
    if (!yDomain.current.initialized) {
      yDomain.current = { min: targetMin, max: targetMax, initialized: true };
    }
    // No lerp/update - axis stays fixed

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
  // Cells are now positioned based on PRICE LEVELS, not fixed pixels
  const betCells = useMemo(() => {
    if (!scales || dimensions.height === 0) return [];

    const cells = [];
    const colWidth = (gridInterval / 1000) * pixelsPerSecond;

    // Calculate base offset for smooth scrolling
    const baseOffset = (now % gridInterval) / 1000 * pixelsPerSecond;

    // Generate enough columns to fill screen + buffer
    const totalGridWidth = dimensions.width - scales.tipX + colWidth * 2;
    const columnsNeeded = Math.ceil(totalGridWidth / colWidth) + 2;

    const currentPriceY = scales.yScale(currentPrice);

    // Calculate price range for each row
    const priceRange = scales.maxY - scales.minY;
    const pricePerRow = priceRange / numRows;

    for (let col = -1; col < columnsNeeded; col++) {
      const colX = scales.tipX + (col * colWidth) - baseOffset + colWidth;

      const colTimeOffset = col * gridInterval;
      const colTimestamp = Math.floor(now / gridInterval) * gridInterval + colTimeOffset + gridInterval;

      if (colX + colWidth < scales.tipX - 50) continue;
      if (colX > dimensions.width + 50) continue;

      const isCrossing = colX <= scales.tipX && colX + colWidth > scales.tipX;
      const isPast = colX + colWidth <= scales.tipX;

      for (let row = 0; row < numRows; row++) {
        // Calculate price levels for this row (top = high price, bottom = low price)
        const rowPriceTop = scales.maxY - (row * pricePerRow);
        const rowPriceBottom = scales.maxY - ((row + 1) * pricePerRow);
        const rowPriceCenter = (rowPriceTop + rowPriceBottom) / 2;

        // Convert price to Y position using the scale
        const y = scales.yScale(rowPriceTop);
        const cellBottom = scales.yScale(rowPriceBottom);
        const rowHeight = cellBottom - y;
        const centerY = y + rowHeight / 2;

        // Determine win/loss for cells crossing or past
        let status: 'future' | 'active' | 'won' | 'lost' = 'future';

        if (isCrossing || isPast) {
          // Check if current price is in this row's price range
          if (currentPrice <= rowPriceTop && currentPrice >= rowPriceBottom) {
            status = 'won';
          } else {
            status = isPast ? 'lost' : 'active';
          }
        }

        // Color based on position relative to current price
        const isUp = rowPriceCenter > currentPrice;

        // Multiplier calculation based on price distance
        const priceDist = Math.abs(rowPriceCenter - currentPrice) / priceRange;
        const timeBonus = Math.max(0, (colX - scales.tipX) / 200) * 0.2;
        const multiplier = (1.1 + priceDist * 3 + timeBonus).toFixed(2);

        // Purple gradient color based on distance from current price
        // Close to price = higher opacity, far from price = lower opacity
        const intensity = Math.min(priceDist * 2, 1); // 0 to 1
        const hue = 270; // Purple hue
        const saturation = 50 + intensity * 30; // 50-80%
        const lightness = 45; // Fixed lightness
        const alpha = 0.4 - intensity * 0.3; // 0.4-0.1 (reduced opacity)
        const cellColor = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
        const borderColor = `hsla(${hue}, 70%, 55%, ${0.5 - intensity * 0.3})`;

        cells.push({
          id: `cell-${colTimestamp}-${row}`,
          x: colX,
          y,
          width: colWidth - 3,
          height: Math.max(rowHeight - 3, 10),
          multiplier,
          isUp,
          status,
          color: cellColor,
          borderColor: borderColor
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
          let opacity = 0.9;
          let bg = cell.color;
          let borderStyle = `1px solid ${cell.borderColor}`;
          let canBet = cell.status === 'future';
          let extraClass = '';

          if (cell.status === 'won') {
            // Won cell - purple with explosion ring effect (higher opacity)
            return (
              <div key={cell.id} className="pointer-events-none">
                {/* Explosion ring expanding outward */}
                <div
                  className="absolute rounded-sm animate-ping"
                  style={{
                    left: cell.x - 5,
                    top: cell.y - 5,
                    width: cell.width + 10,
                    height: cell.height + 10,
                    backgroundColor: '#a855f7',
                    opacity: 0.5
                  }}
                />
                {/* Main cell with content - purple, higher opacity */}
                <div
                  className="absolute rounded-sm flex items-center justify-center"
                  style={{
                    left: cell.x,
                    top: cell.y,
                    width: cell.width,
                    height: cell.height,
                    backgroundColor: 'rgba(168, 85, 247, 0.9)',
                    border: '2px solid #ffffff',
                    boxShadow: '0 0 20px #a855f7'
                  }}
                >
                  <span className="text-[10px] font-mono font-bold text-white">
                    x{cell.multiplier}
                  </span>
                </div>
              </div>
            );
          } else if (cell.status === 'lost') {
            return null;
          } else if (cell.status === 'active') {
            // Active cells - subtle glow, keep same color
            opacity = 1;
            borderStyle = `2px solid rgba(255,255,255,0.5)`;
            extraClass = 'ring-1 ring-white/30';
          }

          const handleClick = () => {
            if (canBet && betAmount) {
              placeBet(betAmount, `${cell.isUp ? 'UP' : 'DOWN'}-${cell.multiplier}`);
            }
          };

          return (
            <div
              key={cell.id}
              onClick={handleClick}
              className={`absolute rounded-sm flex items-center justify-center ${canBet ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'} ${extraClass}`}
              style={{
                left: cell.x,
                top: cell.y,
                width: cell.width,
                height: cell.height,
                backgroundColor: bg,
                border: borderStyle,
                opacity
              }}
            >
              <span className="text-[10px] font-mono font-bold text-white/80">
                x{cell.multiplier}
              </span>
            </div>
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
              stroke="#00FF9D"
              strokeWidth="12"
              strokeOpacity="0.2"
              strokeLinecap="round"
            />
            {/* Main line */}
            <path
              d={chartPath}
              fill="none"
              stroke="#00FF9D"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Tip indicator */}
            <circle
              cx={scales.tipX}
              cy={scales.yScale(currentPrice)}
              r="5"
              fill="#00FF9D"
              stroke="#ffffff"
              strokeWidth="2"
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

      {/* Price Header - Mobile Responsive */}
      <div className="absolute top-12 sm:top-20 left-3 sm:left-6 z-30 pointer-events-none">
        <h2 className="text-gray-500 text-[10px] sm:text-xs tracking-widest font-mono mb-0.5 sm:mb-1">BTC/USD</h2>
        <p className="text-white text-2xl sm:text-4xl font-black font-mono tracking-tight">
          ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
    </div>
  );
};
