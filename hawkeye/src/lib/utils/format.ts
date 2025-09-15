/**
 * Format bytes to megabytes with appropriate decimal places
 */
export function formatBytesToMB(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb < 0.01) return '0.00 MB';
  if (mb < 1) return mb.toFixed(3) + ' MB';
  if (mb < 10) return mb.toFixed(2) + ' MB';
  if (mb < 100) return mb.toFixed(1) + ' MB';
  return Math.round(mb).toLocaleString() + ' MB';
}

/**
 * Format bytes to the most appropriate unit (MB, GB, TB)
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  const value = bytes / Math.pow(k, i);
  
  if (i <= 2) { // B, KB, MB - show more precision
    return parseFloat(value.toFixed(2)) + ' ' + sizes[i];
  } else { // GB, TB, PB - show less precision
    return parseFloat(value.toFixed(1)) + ' ' + sizes[i];
  }
}

/**
 * Convert bytes to megabytes as a number
 */
export function bytesToMB(bytes: number): number {
  return bytes / (1024 * 1024);
}

/**
 * Convert megabytes to bytes
 */
export function mbToBytes(mb: number): number {
  return mb * 1024 * 1024;
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD' 
  }).format(amount);
}