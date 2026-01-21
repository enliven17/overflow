/**
 * Utility functions for formatting numbers, dates, and other data
 */

/**
 * Format a number as USD currency
 */
export const formatUSD = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format a FLOW token amount
 */
export const formatFLOW = (amount: string | number): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `${numAmount.toFixed(4)} FLOW`;
};

/**
 * Format a timestamp as a readable date/time
 */
export const formatDateTime = (timestamp: number): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(timestamp));
};

/**
 * Format a timestamp as a relative time (e.g., "2 minutes ago")
 */
export const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
};

/**
 * Format a countdown timer (seconds remaining)
 */
export const formatCountdown = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Shorten a Flow address for display
 */
export const shortenAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Format a price change with sign
 */
export const formatPriceChange = (change: number): string => {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${formatUSD(change)}`;
};

/**
 * Format a multiplier (e.g., 2.0 -> "x2")
 */
export const formatMultiplier = (multiplier: number): string => {
  return `x${multiplier.toFixed(1)}`;
};
