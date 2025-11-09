/**
 * MikroTik Utility Functions
 *
 * Helper functions for common MikroTik operations and data transformations
 */

import { MikroTikDevice, PPPoEUser, BandwidthProfile, PPPoEStatistics } from './mikrotik';

// Utility functions for MikroTik operations

/**
 * Generate a secure random password for PPPoE users
 */
export function generatePPPoEPassword(length: number = 12): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }

  return password;
}

/**
 * Generate a unique username for PPPoE
 */
export function generatePPPoEUsername(prefix: string = 'pppoe', customerName?: string): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);

  if (customerName) {
    const sanitized = customerName.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `${prefix}-${sanitized}-${timestamp}`;
  }

  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Convert bytes to human readable format
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Convert MikroTik uptime string to milliseconds
 */
export function uptimeToMs(uptime: string): number {
  if (!uptime) return 0;

  const regex = /(\d+)d\s*(\d+)h\s*(\d+)m\s*(\d+)?s?/;
  const match = uptime.match(regex);

  if (!match) return 0;

  const days = parseInt(match[1]) || 0;
  const hours = parseInt(match[2]) || 0;
  const minutes = parseInt(match[3]) || 0;
  const seconds = parseInt(match[4]) || 0;

  return (days * 24 * 60 * 60 + hours * 60 * 60 + minutes * 60 + seconds) * 1000;
}

/**
 * Convert milliseconds to human readable uptime
 */
export function msToUptime(ms: number): string {
  if (ms === 0) return '0s';

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const remainingHours = hours % 24;
  const remainingMinutes = minutes % 60;
  const remainingSeconds = seconds % 60;

  const parts = [];

  if (days > 0) parts.push(`${days}d`);
  if (remainingHours > 0) parts.push(`${remainingHours}h`);
  if (remainingMinutes > 0) parts.push(`${remainingMinutes}m`);
  if (remainingSeconds > 0 || parts.length === 0) parts.push(`${remainingSeconds}s`);

  return parts.join(' ');
}

/**
 * Validate MikroTik device configuration
 */
export function validateMikroTikDevice(device: Partial<MikroTikDevice>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!device.id || device.id.trim().length === 0) {
    errors.push('Device ID is required');
  }

  if (!device.name || device.name.trim().length === 0) {
    errors.push('Device name is required');
  }

  if (!device.host || !isValidIP(device.host) && !isValidHostname(device.host)) {
    errors.push('Valid IP address or hostname is required');
  }

  if (!device.port || device.port < 1 || device.port > 65535) {
    errors.push('Valid port number (1-65535) is required');
  }

  if (!device.username || device.username.trim().length === 0) {
    errors.push('Username is required');
  }

  if (!device.password || device.password.length === 0) {
    errors.push('Password is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate PPPoE user data
 */
export function validatePPPoEUser(user: Partial<PPPoEUser>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!user.name || user.name.trim().length === 0) {
    errors.push('Username is required');
  } else if (user.name.length < 3) {
    errors.push('Username must be at least 3 characters long');
  } else if (!/^[a-zA-Z0-9_-]+$/.test(user.name)) {
    errors.push('Username can only contain letters, numbers, underscores, and hyphens');
  }

  if (!user.password || user.password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (!user.profile || user.profile.trim().length === 0) {
    errors.push('Bandwidth profile is required');
  }

  if (user.service && !['pppoe', 'ppptp', 'l2tp'].includes(user.service)) {
    errors.push('Service must be one of: pppoe, ppptp, l2tp');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if a string is a valid IP address
 */
function isValidIP(ip: string): boolean {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Regex.test(ip);
}

/**
 * Check if a string is a valid hostname
 */
function isValidHostname(hostname: string): boolean {
  const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return hostnameRegex.test(hostname) && hostname.length <= 253;
}

/**
 * Parse bandwidth profile rate limit string
 */
export function parseRateLimit(rateLimit: string): { upload: number; download: number; unit: string } {
  if (!rateLimit) return { upload: 0, download: 0, unit: 'bps' };

  const parts = rateLimit.split('/');
  const download = parseBandwidth(parts[0] || '0');
  const upload = parseBandwidth(parts[1] || parts[0] || '0');

  return {
    upload: upload.value,
    download: download.value,
    unit: download.unit,
  };
}

/**
 * Parse bandwidth string (e.g., "10M", "500K", "1G")
 */
function parseBandwidth(bandwidth: string): { value: number; unit: string } {
  const match = bandwidth.match(/^(\d+(?:\.\d+)?)([KMGT]?)(bps)?$/i);

  if (!match) {
    return { value: 0, unit: 'bps' };
  }

  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  const hasBps = match[3] === 'bps';

  let multiplier = 1;
  switch (unit) {
    case 'K': multiplier = 1000; break;
    case 'M': multiplier = 1000000; break;
    case 'G': multiplier = 1000000000; break;
    case 'T': multiplier = 1000000000000; break;
  }

  return {
    value: Math.round(value * multiplier),
    unit: hasBps ? 'bps' : 'bps',
  };
}

/**
 * Format bandwidth value to human readable string
 */
export function formatBandwidth(bps: number): string {
  if (bps >= 1000000000) {
    return `${(bps / 1000000000).toFixed(1)}Gbps`;
  } else if (bps >= 1000000) {
    return `${(bps / 1000000).toFixed(1)}Mbps`;
  } else if (bps >= 1000) {
    return `${(bps / 1000).toFixed(1)}Kbps`;
  } else {
    return `${bps}bps`;
  }
}

/**
 * Calculate bandwidth usage percentage
 */
export function calculateBandwidthUsage(used: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((used / total) * 100);
}

/**
 * Merge PPPoE user data from different sources
 */
export function mergePPPoEUserData(
  secretUser: PPPoEUser,
  activeUser?: Partial<PPPoEUser>
): PPPoEUser {
  return {
    ...secretUser,
    uptime: activeUser?.uptime || secretUser.uptime,
    bytesIn: activeUser?.bytesIn || 0,
    bytesOut: activeUser?.bytesOut || 0,
    bytesIn6: activeUser?.bytesIn6 || 0,
    bytesOut6: activeUser?.bytesOut6 || 0,
    packetsIn: activeUser?.packetsIn || 0,
    packetsOut: activeUser?.packetsOut || 0,
    packetsIn6: activeUser?.packetsIn6 || 0,
    packetsOut6: activeUser?.packetsOut6 || 0,
    active: !!activeUser,
  };
}

/**
 * Filter and sort PPPoE users
 */
export function filterPPPoEUsers(
  users: PPPoEUser[],
  filters: {
    search?: string;
    profile?: string;
    active?: boolean;
    disabled?: boolean;
  } = {}
): PPPoEUser[] {
  let filtered = [...users];

  if (filters.search) {
    const search = filters.search.toLowerCase();
    filtered = filtered.filter(user =>
      user.name.toLowerCase().includes(search) ||
      (user.comment && user.comment.toLowerCase().includes(search)) ||
      user.profile.toLowerCase().includes(search)
    );
  }

  if (filters.profile) {
    filtered = filtered.filter(user => user.profile === filters.profile);
  }

  if (filters.active !== undefined) {
    filtered = filtered.filter(user => user.active === filters.active);
  }

  if (filters.disabled !== undefined) {
    filtered = filtered.filter(user => user.disabled === filters.disabled);
  }

  return filtered;
}

/**
 * Sort PPPoE users
 */
export function sortPPPoEUsers(
  users: PPPoEUser[],
  sortBy: keyof PPPoEUser = 'name',
  direction: 'asc' | 'desc' = 'asc'
): PPPoEUser[] {
  return [...users].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];

    // Handle string comparison
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.localeCompare(bValue);
      return direction === 'asc' ? comparison : -comparison;
    }

    // Handle number comparison
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      const comparison = aValue - bValue;
      return direction === 'asc' ? comparison : -comparison;
    }

    // Handle boolean comparison
    if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
      const comparison = (aValue ? 1 : 0) - (bValue ? 1 : 0);
      return direction === 'asc' ? comparison : -comparison;
    }

    return 0;
  });
}

/**
 * Generate device configuration from environment variables
 */
export function parseDevicesFromEnv(envString?: string): MikroTikDevice[] {
  if (!envString) {
    envString = process.env.MIKROTIK_DEVICES;
  }

  if (!envString) {
    return [];
  }

  try {
    const devices = JSON.parse(envString);
    return Array.isArray(devices) ? devices : [devices];
  } catch (error) {
    console.error('Failed to parse MikroTik devices from environment:', error);
    return [];
  }
}

/**
 * Export devices to environment variable format
 */
export function devicesToEnvString(devices: MikroTikDevice[]): string {
  return JSON.stringify(devices, null, 2);
}

/**
 * Calculate statistics for PPPoE users
 */
export function calculatePPPoEStatistics(users: PPPoEUser[]): {
  total: number;
  active: number;
  disabled: number;
  online: number;
  offline: number;
  totalBytesIn: number;
  totalBytesOut: number;
  profiles: Record<string, number>;
  topUsersByUsage: PPPoEUser[];
} {
  const stats = {
    total: users.length,
    active: users.filter(u => u.active).length,
    disabled: users.filter(u => u.disabled).length,
    online: users.filter(u => u.active && !u.disabled).length,
    offline: users.filter(u => !u.active && !u.disabled).length,
    totalBytesIn: 0,
    totalBytesOut: 0,
    profiles: {} as Record<string, number>,
    topUsersByUsage: [] as PPPoEUser[],
  };

  users.forEach(user => {
    // Calculate bandwidth usage
    stats.totalBytesIn += user.bytesIn || 0;
    stats.totalBytesOut += user.bytesOut || 0;

    // Count profiles
    stats.profiles[user.profile] = (stats.profiles[user.profile] || 0) + 1;
  });

  // Get top users by usage
  stats.topUsersByUsage = users
    .filter(u => u.active)
    .sort((a, b) => (b.bytesIn || 0) + (b.bytesOut || 0) - ((a.bytesIn || 0) + (a.bytesOut || 0)))
    .slice(0, 10);

  return stats;
}

/**
 * Check if a MikroTik device is reachable
 */
export async function pingDevice(device: MikroTikDevice): Promise<{ reachable: boolean; latency?: number; error?: string }> {
  try {
    // This would implement a proper ping check
    // For now, we'll simulate with a simple fetch
    const startTime = Date.now();

    const response = await fetch(`https://${device.host}:${device.port}`, {
      method: 'HEAD',
      mode: 'no-cors',
      signal: AbortSignal.timeout(5000),
    });

    const latency = Date.now() - startTime;

    return { reachable: true, latency };
  } catch (error) {
    return {
      reachable: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Format device status for display
 */
export function formatDeviceStatus(device: MikroTikDevice, isOnline: boolean): {
  status: 'online' | 'offline' | 'disabled';
  color: 'green' | 'red' | 'gray';
  text: string;
} {
  if (!device.enabled) {
    return {
      status: 'disabled',
      color: 'gray',
      text: 'Disabled',
    };
  }

  if (isOnline) {
    return {
      status: 'online',
      color: 'green',
      text: 'Online',
    };
  }

  return {
    status: 'offline',
    color: 'red',
    text: 'Offline',
  };
}