/**
 * MikroTik RouterOS API Integration Service
 *
 * This service provides a comprehensive interface for interacting with MikroTik RouterOS 7 devices
 * via REST API, including connection management, PPPoE user operations, and error handling.
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Connector } from 'node-routeros';

// Types for MikroTik RouterOS API responses and requests
export interface MikroTikDevice {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  location?: string;
  enabled: boolean;
  lastConnected?: Date;
}

export interface PPPoEUser {
  id?: string;
  name: string;
  password: string;
  service: string;
  profile: string;
  callerId?: string;
  comment?: string;
  disabled: boolean;
  uptime?: string;
  bytesIn?: number;
  bytesOut?: number;
  bytesIn6?: number;
  bytesOut6?: number;
  packetsIn?: number;
  packetsOut?: number;
  packetsIn6?: number;
  packetsOut6?: number;
  dynamic?: boolean;
  lastLoggedOut?: string;
  lastLoggedIn?: string;
  active?: boolean;
}

export interface BandwidthProfile {
  id?: string;
  name: string;
  rateLimit?: string;
  burstLimit?: string;
  burstThreshold?: string;
  burstTime?: string;
  priority?: number;
  upload?: string;
  download?: string;
  comment?: string;
  disabled: boolean;
}

export interface MikroTikConnection {
  id: string;
  device: MikroTikDevice;
  connected: boolean;
  lastUsed: Date;
  reconnects: number;
}

export interface MikroTikConfig {
  timeout: number;
  retries: number;
  retryDelay: number;
  maxConnections: number;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface ConnectionStatus {
  connected: boolean;
  device: string;
  uptime?: string;
  version?: string;
  resources?: {
    cpu: number;
    memory: number;
    disk: number;
  };
}

export interface PPPoEStatistics {
  totalUsers: number;
  activeUsers: number;
  disabledUsers: number;
  totalBytesIn: number;
  totalBytesOut: number;
  profiles: Record<string, number>;
}

class MikroTikError extends Error {
  constructor(
    message: string,
    public code?: string,
    public device?: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'MikroTikError';
  }
}

class MikroTikService {
  private connections: Map<string, MikroTikConnection> = new Map();
  private config: MikroTikConfig;
  private devices: Map<string, MikroTikDevice> = new Map();

  constructor(config: Partial<MikroTikConfig> = {}) {
    this.config = {
      timeout: 10000,
      retries: 3,
      retryDelay: 1000,
      maxConnections: 10,
      ...config,
    };

    // Load devices from environment variables
    this.loadDevicesFromEnv();
  }

  /**
   * Load MikroTik device configurations from environment variables
   */
  private loadDevicesFromEnv(): void {
    const devicesEnv = process.env.MIKROTIK_DEVICES;
    if (!devicesEnv) {
      console.warn('No MikroTik devices configured in MIKROTIK_DEVICES environment variable');
      return;
    }

    try {
      const devices = JSON.parse(devicesEnv);
      devices.forEach((device: any) => {
        this.devices.set(device.id, device);
      });
    } catch (error) {
      console.error('Failed to parse MikroTik devices from environment:', error);
    }
  }

  /**
   * Add a new MikroTik device configuration
   */
  public addDevice(device: MikroTikDevice): void {
    this.devices.set(device.id, device);
  }

  /**
   * Get all configured devices
   */
  public getDevices(): MikroTikDevice[] {
    return Array.from(this.devices.values());
  }

  /**
   * Get a specific device by ID
   */
  public getDevice(id: string): MikroTikDevice | undefined {
    return this.devices.get(id);
  }

  /**
   * Create an HTTP client for MikroTik REST API
   */
  private createHttpClient(device: MikroTikDevice): AxiosInstance {
    const client = axios.create({
      baseURL: `https://${device.host}:${device.port}/rest`,
      timeout: this.config.timeout,
      auth: {
        username: device.username,
        password: device.password,
      },
      headers: {
        'Content-Type': 'application/json',
      },
      // Disable SSL verification for development
      httpsAgent: new (require('https').Agent)({
        rejectUnauthorized: false,
      }),
    });

    return client;
  }

  /**
   * Create an API connection to MikroTik device
   */
  private async createAPIConnection(device: MikroTikDevice): Promise<any> {
    try {
      const connection = await new Connector({
        host: device.host,
        port: device.port || 8728,
        username: device.username,
        password: device.password,
        timeout: this.config.timeout / 1000,
      }).connect();
      return connection;
    } catch (error) {
      throw new MikroTikError(
        `Failed to connect to MikroTik device ${device.name}`,
        'CONNECTION_FAILED',
        device.id,
        error
      );
    }
  }

  /**
   * Connect to a MikroTik device with retry logic
   */
  public async connectToDevice(deviceId: string): Promise<APIResponse<MikroTikConnection>> {
    const device = this.devices.get(deviceId);
    if (!device) {
      return {
        success: false,
        error: `Device with ID ${deviceId} not found`,
        timestamp: new Date(),
      };
    }

    let lastError: any;
    let connectionId = `${deviceId}-${Date.now()}`;

    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      try {
        // Try API connection first
        const httpClient = this.createHttpClient(device);

        // Test connection
        const response = await httpClient.get('/system/resource');

        const connection: MikroTikConnection = {
          id: connectionId,
          device,
          connected: true,
          lastUsed: new Date(),
          reconnects: attempt - 1,
        };

        this.connections.set(connectionId, connection);

        return {
          success: true,
          data: connection,
          timestamp: new Date(),
        };
      } catch (error) {
        lastError = error;

        if (attempt < this.config.retries) {
          // Exponential backoff
          await this.delay(this.config.retryDelay * Math.pow(2, attempt - 1));
        }
      }
    }

    return {
      success: false,
      error: `Failed to connect to ${device.name} after ${this.config.retries} attempts: ${lastError.message}`,
      timestamp: new Date(),
    };
  }

  /**
   * Get connection status for a device
   */
  public async getConnectionStatus(deviceId: string): Promise<APIResponse<ConnectionStatus>> {
    const device = this.devices.get(deviceId);
    if (!device) {
      return {
        success: false,
        error: `Device with ID ${deviceId} not found`,
        timestamp: new Date(),
      };
    }

    try {
      const client = this.createHttpClient(device);
      const resourceResponse: AxiosResponse = await client.get('/system/resource');
      const identityResponse: AxiosResponse = await client.get('/system/identity');

      const status: ConnectionStatus = {
        connected: true,
        device: device.name,
        uptime: resourceResponse.data.uptime,
        version: resourceResponse.data.version,
        resources: {
          cpu: resourceResponse.data['cpu-load'] || 0,
          memory: this.calculatePercentage(
            resourceResponse.data['total-memory'] - resourceResponse.data['free-memory'],
            resourceResponse.data['total-memory']
          ),
          disk: this.calculatePercentage(
            resourceResponse.data['total-hdd-space'] - resourceResponse.data['free-hdd-space'],
            resourceResponse.data['total-hdd-space']
          ),
        },
      };

      return {
        success: true,
        data: status,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get connection status: ${error.message}`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get all PPPoE users from a device
   */
  public async getPPPoEUsers(deviceId: string): Promise<APIResponse<PPPoEUser[]>> {
    const device = this.devices.get(deviceId);
    if (!device) {
      return {
        success: false,
        error: `Device with ID ${deviceId} not found`,
        timestamp: new Date(),
      };
    }

    try {
      const client = this.createHttpClient(device);
      const response: AxiosResponse = await client.get('/ppp/secret');

      const users: PPPoEUser[] = response.data.map((user: any) => ({
        id: user['.id'],
        name: user.name,
        password: user.password,
        service: user.service,
        profile: user.profile,
        callerId: user['caller-id'],
        comment: user.comment,
        disabled: user.disabled === 'true',
        dynamic: user['dynamic'] === 'true',
        lastLoggedOut: user['last-logged-out'],
        lastLoggedIn: user['last-logged-in'],
      }));

      return {
        success: true,
        data: users,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get PPPoE users: ${error.message}`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get active PPPoE connections
   */
  public async getActivePPPoEConnections(deviceId: string): Promise<APIResponse<PPPoEUser[]>> {
    const device = this.devices.get(deviceId);
    if (!device) {
      return {
        success: false,
        error: `Device with ID ${deviceId} not found`,
        timestamp: new Date(),
      };
    }

    try {
      const client = this.createHttpClient(device);
      const response: AxiosResponse = await client.get('/ppp/active');

      const activeUsers: PPPoEUser[] = response.data.map((user: any) => ({
        name: user.name,
        service: user.service,
        profile: user.profile,
        uptime: user.uptime,
        bytesIn: parseInt(user['bytes-in']) || 0,
        bytesOut: parseInt(user['bytes-out']) || 0,
        bytesIn6: parseInt(user['bytes-in6']) || 0,
        bytesOut6: parseInt(user['bytes-out6']) || 0,
        packetsIn: parseInt(user['packets-in']) || 0,
        packetsOut: parseInt(user['packets-out']) || 0,
        packetsIn6: parseInt(user['packets-in6']) || 0,
        packetsOut6: parseInt(user['packets-out6']) || 0,
        active: true,
      }));

      return {
        success: true,
        data: activeUsers,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get active PPPoE connections: ${error.message}`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Create a new PPPoE user
   */
  public async createPPPoEUser(deviceId: string, user: Partial<PPPoEUser>): Promise<APIResponse<PPPoEUser>> {
    const device = this.devices.get(deviceId);
    if (!device) {
      return {
        success: false,
        error: `Device with ID ${deviceId} not found`,
        timestamp: new Date(),
      };
    }

    try {
      const client = this.createHttpClient(device);

      const payload: any = {
        name: user.name,
        password: user.password,
        service: user.service || 'pppoe',
        profile: user.profile,
        comment: user.comment || '',
        disabled: user.disabled ? 'yes' : 'no',
      };

      if (user.callerId) {
        payload['caller-id'] = user.callerId;
      }

      const response: AxiosResponse = await client.put('/ppp/secret', payload);

      const createdUser: PPPoEUser = {
        ...user,
        id: response.data['.id'],
        name: response.data.name,
        password: response.data.password,
        service: response.data.service,
        profile: response.data.profile,
        comment: response.data.comment,
        disabled: response.data.disabled === 'true',
      };

      return {
        success: true,
        data: createdUser,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create PPPoE user: ${error.message}`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Update an existing PPPoE user
   */
  public async updatePPPoEUser(deviceId: string, userId: string, updates: Partial<PPPoEUser>): Promise<APIResponse<PPPoEUser>> {
    const device = this.devices.get(deviceId);
    if (!device) {
      return {
        success: false,
        error: `Device with ID ${deviceId} not found`,
        timestamp: new Date(),
      };
    }

    try {
      const client = this.createHttpClient(device);

      const payload: any = {
        '.id': userId,
      };

      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.password !== undefined) payload.password = updates.password;
      if (updates.service !== undefined) payload.service = updates.service;
      if (updates.profile !== undefined) payload.profile = updates.profile;
      if (updates.callerId !== undefined) payload['caller-id'] = updates.callerId;
      if (updates.comment !== undefined) payload.comment = updates.comment;
      if (updates.disabled !== undefined) payload.disabled = updates.disabled ? 'yes' : 'no';

      const response: AxiosResponse = await client.patch('/ppp/secret', payload);

      const updatedUser: PPPoEUser = {
        id: response.data['.id'],
        name: response.data.name,
        password: response.data.password,
        service: response.data.service,
        profile: response.data.profile,
        callerId: response.data['caller-id'],
        comment: response.data.comment,
        disabled: response.data.disabled === 'true',
        dynamic: response.data['dynamic'] === 'true',
        lastLoggedOut: response.data['last-logged-out'],
        lastLoggedIn: response.data['last-logged-in'],
      };

      return {
        success: true,
        data: updatedUser,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update PPPoE user: ${error.message}`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Delete a PPPoE user
   */
  public async deletePPPoEUser(deviceId: string, userId: string): Promise<APIResponse<boolean>> {
    const device = this.devices.get(deviceId);
    if (!device) {
      return {
        success: false,
        error: `Device with ID ${deviceId} not found`,
        timestamp: new Date(),
      };
    }

    try {
      const client = this.createHttpClient(device);
      await client.delete(`/ppp/secret/${userId}`);

      return {
        success: true,
        data: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to delete PPPoE user: ${error.message}`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get bandwidth profiles from a device
   */
  public async getBandwidthProfiles(deviceId: string): Promise<APIResponse<BandwidthProfile[]>> {
    const device = this.devices.get(deviceId);
    if (!device) {
      return {
        success: false,
        error: `Device with ID ${deviceId} not found`,
        timestamp: new Date(),
      };
    }

    try {
      const client = this.createHttpClient(device);
      const response: AxiosResponse = await client.get('/queue/type');

      const profiles: BandwidthProfile[] = response.data
        .filter((item: any) => item.name.startsWith('PPPoE-') || item.comment?.includes('PPPoE'))
        .map((item: any) => ({
          id: item['.id'],
          name: item.name,
          rateLimit: item['rate-limit'],
          burstLimit: item['burst-limit'],
          burstThreshold: item['burst-threshold'],
          burstTime: item['burst-time'],
          priority: parseInt(item.priority) || 8,
          upload: item['max-limit'],
          download: item['max-limit'],
          comment: item.comment,
          disabled: item.disabled === 'true',
        }));

      return {
        success: true,
        data: profiles,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get bandwidth profiles: ${error.message}`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Disconnect an active PPPoE user
   */
  public async disconnectPPPoEUser(deviceId: string, userName: string): Promise<APIResponse<boolean>> {
    const device = this.devices.get(deviceId);
    if (!device) {
      return {
        success: false,
        error: `Device with ID ${deviceId} not found`,
        timestamp: new Date(),
      };
    }

    try {
      const client = this.createHttpClient(device);

      // Find the active connection
      const activeConnections = await client.get('/ppp/active');
      const connection = activeConnections.data.find((conn: any) => conn.name === userName);

      if (!connection) {
        return {
          success: false,
          error: `No active connection found for user ${userName}`,
          timestamp: new Date(),
        };
      }

      // Terminate the connection
      await client.post('/ppp/active/remove', { '.id': connection['.id'] });

      return {
        success: true,
        data: true,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to disconnect PPPoE user: ${error.message}`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get PPPoE statistics
   */
  public async getPPPoEStatistics(deviceId: string): Promise<APIResponse<PPPoEStatistics>> {
    const [usersResponse, activeResponse] = await Promise.all([
      this.getPPPoEUsers(deviceId),
      this.getActivePPPoEConnections(deviceId),
    ]);

    if (!usersResponse.success || !activeResponse.success) {
      return {
        success: false,
        error: 'Failed to fetch user data for statistics',
        timestamp: new Date(),
      };
    }

    const users = usersResponse.data || [];
    const activeUsers = activeResponse.data || [];

    const stats: PPPoEStatistics = {
      totalUsers: users.length,
      activeUsers: activeUsers.length,
      disabledUsers: users.filter(u => u.disabled).length,
      totalBytesIn: activeUsers.reduce((sum, user) => sum + (user.bytesIn || 0), 0),
      totalBytesOut: activeUsers.reduce((sum, user) => sum + (user.bytesOut || 0), 0),
      profiles: this.getProfileCounts(users),
    };

    return {
      success: true,
      data: stats,
      timestamp: new Date(),
    };
  }

  /**
   * Close all connections and cleanup
   */
  public async disconnect(): Promise<void> {
    // Close all connections
    const connectionsArray = Array.from(this.connections.values());
    for (const connection of connectionsArray) {
      try {
        // Close the connection if it has a close method
        if ('close' in connection) {
          (connection as any).close();
        }
      } catch (error) {
        console.error('Error closing connection:', error);
      }
    }

    this.connections.clear();
  }

  // Helper methods
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private calculatePercentage(used: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((used / total) * 100);
  }

  private getProfileCounts(users: PPPoEUser[]): Record<string, number> {
    return users.reduce((counts, user) => {
      counts[user.profile] = (counts[user.profile] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
  }
}

// Create and export a singleton instance
const mikrotikService = new MikroTikService();

export default mikrotikService;
export { MikroTikService, MikroTikError };