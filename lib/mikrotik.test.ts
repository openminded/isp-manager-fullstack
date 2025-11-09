/**
 * MikroTik Service Test Suite
 *
 * Tests for the MikroTik RouterOS API integration service
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { MikroTikService, MikroTikError } from './mikrotik';

// Mock axios
jest.mock('axios');
jest.mock('node-routeros');

describe('MikroTikService', () => {
  let service: MikroTikService;
  const mockDevice = {
    id: 'test-device-1',
    name: 'Test MikroTik',
    host: '192.168.1.1',
    port: 8728,
    username: 'admin',
    password: 'password',
    location: 'Test Location',
    enabled: true,
  };

  beforeEach(() => {
    service = new MikroTikService({
      timeout: 5000,
      retries: 2,
      retryDelay: 100,
      maxConnections: 5,
    });

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    service.disconnect();
  });

  describe('Device Management', () => {
    it('should add and retrieve devices', () => {
      service.addDevice(mockDevice);
      const devices = service.getDevices();

      expect(devices).toHaveLength(1);
      expect(devices[0]).toEqual(mockDevice);
    });

    it('should get a specific device by ID', () => {
      service.addDevice(mockDevice);
      const device = service.getDevice('test-device-1');

      expect(device).toEqual(mockDevice);
    });

    it('should return undefined for non-existent device', () => {
      const device = service.getDevice('non-existent');
      expect(device).toBeUndefined();
    });
  });

  describe('Connection Management', () => {
    it('should handle device not found error', async () => {
      const result = await service.connectToDevice('non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Device with ID non-existent not found');
    });

    it('should retry connection on failure', async () => {
      const axios = require('axios');
      const mockAxiosInstance = {
        get: jest.fn()
          .mockRejectedValueOnce(new Error('Connection failed'))
          .mockResolvedValueOnce({
            data: { uptime: '1d 2h', version: '7.1.5' }
          })
      };

      axios.create.mockReturnValue(mockAxiosInstance);
      service.addDevice(mockDevice);

      const result = await service.connectToDevice('test-device-1');

      expect(result.success).toBe(true);
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('PPPoE User Management', () => {
    beforeEach(() => {
      service.addDevice(mockDevice);
    });

    it('should handle device not found for PPPoE operations', async () => {
      const result = await service.getPPPoEUsers('non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Device with ID non-existent not found');
    });

    it('should parse PPPoE users correctly', async () => {
      const axios = require('axios');
      const mockAxiosInstance = {
        get: jest.fn().mockResolvedValue({
          data: [
            {
              '.id': '*1',
              name: 'testuser',
              password: 'password123',
              service: 'pppoe',
              profile: '10Mbps',
              comment: 'Test user',
              disabled: 'false',
              'last-logged-in': '2023-01-01 12:00:00',
            },
            {
              '.id': '*2',
              name: 'disableduser',
              password: 'password456',
              service: 'pppoe',
              profile: '5Mbps',
              comment: 'Disabled user',
              disabled: 'true',
            },
          ],
        }),
        put: jest.fn().mockResolvedValue({
          data: {
            '.id': '*3',
            name: 'newuser',
            password: 'newpass',
            service: 'pppoe',
            profile: '10Mbps',
            comment: 'New user',
            disabled: 'false',
          },
        }),
      };

      axios.create.mockReturnValue(mockAxiosInstance);

      // Test getting users
      const getUsersResult = await service.getPPPoEUsers('test-device-1');
      expect(getUsersResult.success).toBe(true);
      expect(getUsersResult.data).toHaveLength(2);
      expect(getUsersResult.data![0].name).toBe('testuser');
      expect(getUsersResult.data![0].disabled).toBe(false);
      expect(getUsersResult.data![1].disabled).toBe(true);

      // Test creating a user
      const createResult = await service.createPPPoEUser('test-device-1', {
        name: 'newuser',
        password: 'newpass',
        profile: '10Mbps',
      });
      expect(createResult.success).toBe(true);
      expect(createResult.data?.name).toBe('newuser');
    });

    it('should handle PPPoE user updates', async () => {
      const axios = require('axios');
      const mockAxiosInstance = {
        patch: jest.fn().mockResolvedValue({
          data: {
            '.id': '*1',
            name: 'updateduser',
            password: 'newpassword',
            service: 'pppoe',
            profile: '20Mbps',
            comment: 'Updated user',
            disabled: 'false',
          },
        }),
      };

      axios.create.mockReturnValue(mockAxiosInstance);

      const result = await service.updatePPPoEUser('test-device-1', '*1', {
        name: 'updateduser',
        password: 'newpassword',
        profile: '20Mbps',
      });

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('updateduser');
      expect(result.data?.profile).toBe('20Mbps');
    });

    it('should handle PPPoE user deletion', async () => {
      const axios = require('axios');
      const mockAxiosInstance = {
        delete: jest.fn().mockResolvedValue({}),
      };

      axios.create.mockReturnValue(mockAxiosInstance);

      const result = await service.deletePPPoEUser('test-device-1', '*1');

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });
  });

  describe('Bandwidth Profiles', () => {
    beforeEach(() => {
      service.addDevice(mockDevice);
    });

    it('should get bandwidth profiles correctly', async () => {
      const axios = require('axios');
      const mockAxiosInstance = {
        get: jest.fn().mockResolvedValue({
          data: [
            {
              '.id': '*1',
              name: 'PPPoE-10Mbps',
              'rate-limit': '10M/10M',
              'burst-limit': '12M/12M',
              'burst-threshold': '8M/8M',
              'burst-time': '10s/10s',
              priority: '8',
              comment: '10Mbps profile',
              disabled: 'false',
            },
            {
              '.id': '*2',
              name: 'Regular-Queue',
              'rate-limit': '5M/5M',
              comment: 'Regular queue',
              disabled: 'false',
            },
          ],
        }),
      };

      axios.create.mockReturnValue(mockAxiosInstance);

      const result = await service.getBandwidthProfiles('test-device-1');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1); // Only PPPoE profiles
      expect(result.data![0].name).toBe('PPPoE-10Mbps');
      expect(result.data![0].rateLimit).toBe('10M/10M');
    });
  });

  describe('Statistics and Monitoring', () => {
    beforeEach(() => {
      service.addDevice(mockDevice);
    });

    it('should get connection status correctly', async () => {
      const axios = require('axios');
      const mockAxiosInstance = {
        get: jest.fn()
          .mockResolvedValueOnce({
            data: {
              uptime: '2d 3h 45m',
              version: '7.1.5',
              'cpu-load': 25,
              'total-memory': 1073741824,
              'free-memory': 536870912,
              'total-hdd-space': 1073741824,
              'free-hdd-space': 536870912,
            },
          })
          .mockResolvedValueOnce({
            data: {
              name: 'TestRouter',
            },
          }),
      };

      axios.create.mockReturnValue(mockAxiosInstance);

      const result = await service.getConnectionStatus('test-device-1');

      expect(result.success).toBe(true);
      expect(result.data?.connected).toBe(true);
      expect(result.data?.device).toBe('Test MikroTik');
      expect(result.data?.version).toBe('7.1.5');
      expect(result.data?.resources?.cpu).toBe(25);
      expect(result.data?.resources?.memory).toBe(50);
      expect(result.data?.resources?.disk).toBe(50);
    });

    it('should calculate PPPoE statistics correctly', async () => {
      const axios = require('axios');
      const mockAxiosInstance = {
        get: jest.fn()
          .mockResolvedValueOnce({
            data: [
              { '.id': '*1', name: 'user1', profile: '10Mbps', disabled: 'false' },
              { '.id': '*2', name: 'user2', profile: '5Mbps', disabled: 'true' },
              { '.id': '*3', name: 'user3', profile: '10Mbps', disabled: 'false' },
            ],
          })
          .mockResolvedValueOnce({
            data: [
              { name: 'user1', 'bytes-in': '1073741824', 'bytes-out': '536870912' },
              { name: 'user3', 'bytes-in': '2147483648', 'bytes-out': '1073741824' },
            ],
          }),
      };

      axios.create.mockReturnValue(mockAxiosInstance);

      const result = await service.getPPPoEStatistics('test-device-1');

      expect(result.success).toBe(true);
      expect(result.data?.totalUsers).toBe(3);
      expect(result.data?.activeUsers).toBe(2);
      expect(result.data?.disabledUsers).toBe(1);
      expect(result.data?.totalBytesIn).toBe(3221225472); // 3GB
      expect(result.data?.totalBytesOut).toBe(1610612736); // 1.5GB
      expect(result.data?.profiles['10Mbps']).toBe(2);
      expect(result.data?.profiles['5Mbps']).toBe(1);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      service.addDevice(mockDevice);
    });

    it('should handle connection timeouts', async () => {
      const axios = require('axios');
      const mockAxiosInstance = {
        get: jest.fn().mockRejectedValue(new Error('timeout of 5000ms exceeded')),
      };

      axios.create.mockReturnValue(mockAxiosInstance);

      const result = await service.connectToDevice('test-device-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to connect');
    });

    it('should handle API authentication errors', async () => {
      const axios = require('axios');
      const mockAxiosInstance = {
        get: jest.fn().mockRejectedValue(new Error('Request failed with status code 401')),
      };

      axios.create.mockReturnValue(mockAxiosInstance);

      const result = await service.getConnectionStatus('test-device-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to get connection status');
    });

    it('should handle malformed API responses', async () => {
      const axios = require('axios');
      const mockAxiosInstance = {
        get: jest.fn().mockResolvedValue({
          data: 'invalid response',
        }),
      };

      axios.create.mockReturnValue(mockAxiosInstance);

      const result = await service.getPPPoEUsers('test-device-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to get PPPoE users');
    });
  });

  describe('Connection Pooling', () => {
    it('should manage connection pool correctly', async () => {
      service.addDevice(mockDevice);

      // Add multiple devices to test pooling
      const device2 = { ...mockDevice, id: 'test-device-2', host: '192.168.1.2' };
      service.addDevice(device2);

      // Mock successful connections
      const axios = require('axios');
      const mockAxiosInstance = {
        get: jest.fn().mockResolvedValue({
          data: { uptime: '1d 2h', version: '7.1.5' },
        }),
      };

      axios.create.mockReturnValue(mockAxiosInstance);

      const result1 = await service.connectToDevice('test-device-1');
      const result2 = await service.connectToDevice('test-device-2');

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      // Check that connections are managed
      const connections = (service as any).connections;
      expect(connections.size).toBe(2);

      // Test cleanup
      await service.disconnect();
      expect(connections.size).toBe(0);
    });
  });
});