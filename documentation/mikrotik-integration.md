# MikroTik RouterOS Integration

This document describes the MikroTik RouterOS API integration for the ISP Management Application.

## Overview

The MikroTik integration provides a comprehensive service for managing PPPoE users, monitoring devices, and synchronizing data between the management application and MikroTik RouterOS devices.

## Features

- **Connection Management**: Secure connection handling with retry logic and exponential backoff
- **PPPoE User Management**: Create, read, update, and delete PPPoE users on RouterOS devices
- **Real-time Monitoring**: Track active connections, bandwidth usage, and device status
- **Bandwidth Profiles**: Manage bandwidth limiting profiles and rate settings
- **Bulk Operations**: Support for importing and exporting PPPoE user data
- **Error Handling**: Comprehensive error handling with detailed error messages
- **Multi-device Support**: Manage multiple MikroTik devices across different locations

## Configuration

### Environment Variables

Configure your MikroTik devices using the `MIKROTIK_DEVICES` environment variable:

```bash
MIKROTIK_DEVICES='[
  {
    "id": "router-01",
    "name": "Main Office Router",
    "host": "192.168.1.1",
    "port": 8728,
    "username": "admin",
    "password": "your-router-password",
    "location": "Main Office",
    "enabled": true
  }
]'
```

### Device Configuration Options

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier for the device |
| `name` | string | Yes | Display name for the device |
| `host` | string | Yes | IP address or hostname of the RouterOS device |
| `port` | number | Yes | API port (default: 8728) |
| `username` | string | Yes | RouterOS API username |
| `password` | string | Yes | RouterOS API password |
| `location` | string | No | Physical location of the device |
| `enabled` | boolean | No | Whether the device is active (default: true) |

### API Configuration

```bash
MIKROTIK_TIMEOUT=10000      # Connection timeout in milliseconds
MIKROTIK_RETRIES=3          # Number of connection retry attempts
MIKROTIK_RETRY_DELAY=1000   # Delay between retries in milliseconds
MIKROTIK_MAX_CONNECTIONS=10 # Maximum concurrent connections
```

## RouterOS Setup

### Enable API Service

1. Connect to your MikroTik device via WinBox or Terminal
2. Navigate to **IP → Services**
3. Enable the **api-ssl** service
4. Configure the port (default: 8728)
5. Set appropriate IP restrictions if needed

### Create API User

```bash
# Create a dedicated API user with limited permissions
/user add name=ispmanager group=full password=securepassword

# Or create a user with specific permissions
/user add name=ispapi group=api password=securepassword
```

### API Permissions

The API user should have permissions for:
- `/ppp/secret` - PPPoE user management
- `/ppp/active` - Active connection monitoring
- `/ppp/profile` - Bandwidth profile management
- `/system/resource` - Device monitoring
- `/interface` - Interface monitoring

## Usage

### Basic Operations

```typescript
import mikrotikService from '@/lib/mikrotik';

// Get all configured devices
const devices = mikrotikService.getDevices();

// Connect to a device
const connection = await mikrotikService.connectToDevice('router-01');

// Get PPPoE users
const users = await mikrotikService.getPPPoEUsers('router-01');

// Create a new PPPoE user
const newUser = await mikrotikService.createPPPoEUser('router-01', {
  name: 'john_doe',
  password: 'securepassword123',
  profile: '10Mbps',
  comment: 'Customer John Doe'
});

// Update existing user
const updatedUser = await mikrotikService.updatePPPoEUser('router-01', '*1', {
  password: 'newpassword123',
  profile: '20Mbps'
});

// Delete a user
await mikrotikService.deletePPPoEUser('router-01', '*1');

// Get active connections
const activeConnections = await mikrotikService.getActivePPPoEConnections('router-01');

// Get device status
const status = await mikrotikService.getConnectionStatus('router-01');
```

### Error Handling

```typescript
import { MikroTikError } from '@/lib/mikrotik';

try {
  const result = await mikrotikService.getPPPoEUsers('router-01');
  if (result.success) {
    console.log('Users:', result.data);
  } else {
    console.error('Error:', result.error);
  }
} catch (error) {
  if (error instanceof MikroTikError) {
    console.error('MikroTik Error:', error.message);
    console.error('Device:', error.device);
    console.error('Code:', error.code);
  }
}
```

## API Endpoints

### Test Connection
```http
GET /api/mikrotik/test?deviceId=router-01
```

### Perform Operations
```http
POST /api/mikrotik/test
Content-Type: application/json

{
  "deviceId": "router-01",
  "operation": "createUser",
  "data": {
    "name": "testuser",
    "password": "password123",
    "profile": "10Mbps"
  }
}
```

## Data Models

### PPPoE User

```typescript
interface PPPoEUser {
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
```

### Bandwidth Profile

```typescript
interface BandwidthProfile {
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
```

### Device Status

```typescript
interface ConnectionStatus {
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
```

## Utility Functions

The `mikrotik-utils.ts` module provides helpful utility functions:

```typescript
import {
  generatePPPoEPassword,
  generatePPPoEUsername,
  formatBytes,
  uptimeToMs,
  parseRateLimit,
  filterPPPoEUsers,
  sortPPPoEUsers
} from '@/lib/mikrotik-utils';

// Generate secure password
const password = generatePPPoEPassword(12);

// Generate username
const username = generatePPPoEUsername('pppoe', 'John Doe');

// Format bytes
const formatted = formatBytes(1073741824); // "1 GB"

// Parse bandwidth rate
const rate = parseRateLimit('10M/5M'); // { upload: 5000000, download: 10000000, unit: 'bps' }
```

## Security Considerations

1. **SSL/TLS**: Always use the API-SSL service for secure connections
2. **IP Restrictions**: Limit API access to specific IP addresses in RouterOS
3. **User Permissions**: Create dedicated API users with minimal required permissions
4. **Password Security**: Use strong, unique passwords for API users
5. **Environment Variables**: Store credentials securely using environment variables

## Troubleshooting

### Common Issues

1. **Connection Timeout**
   - Check if the API service is enabled on the RouterOS device
   - Verify the correct port is being used
   - Check firewall rules and IP restrictions

2. **Authentication Failed**
   - Verify username and password are correct
   - Check if the user has API permissions
   - Ensure the user account is not disabled

3. **SSL Certificate Issues**
   - For development, you may need to disable SSL verification
   - In production, ensure proper SSL certificates are installed

4. **Rate Limiting**
   - RouterOS may limit API requests
   - Implement proper request throttling in your application

### Debug Mode

Enable debug logging by setting:

```typescript
const service = new MikroTikService({
  timeout: 5000,
  retries: 3,
  retryDelay: 1000,
  maxConnections: 5,
});
```

### Testing

Use the test endpoint to verify your configuration:

```bash
curl "http://localhost:3000/api/mikrotik/test?deviceId=router-01"
```

## Performance Considerations

1. **Connection Pooling**: The service automatically manages connection pooling
2. **Batch Operations**: Use bulk operations for large datasets
3. **Caching**: Cache frequently accessed data like user lists
4. **Rate Limiting**: Implement client-side rate limiting
5. **Async Operations**: Use async/await for non-blocking operations

## Monitoring and Logging

The service provides comprehensive logging and monitoring:

- Connection attempts and failures
- API request/response logging
- Error tracking with device identification
- Performance metrics and timing

Monitor the application logs for:

```
MikroTik connection established: router-01
MikroTik API request: GET /ppp/secret
MikroTik error: Failed to connect to router-02
```

## Integration Examples

### Bulk User Import

```typescript
async function importUsers(deviceId: string, users: any[]) {
  const results = [];

  for (const userData of users) {
    try {
      const result = await mikrotikService.createPPPoEUser(deviceId, userData);
      results.push({ success: true, data: result.data });
    } catch (error) {
      results.push({ success: false, error: error.message });
    }
  }

  return results;
}
```

### Real-time Monitoring

```typescript
async function monitorDevices() {
  const devices = mikrotikService.getDevices();

  for (const device of devices) {
    if (!device.enabled) continue;

    try {
      const status = await mikrotikService.getConnectionStatus(device.id);
      const stats = await mikrotikService.getPPPoEStatistics(device.id);

      console.log(`Device ${device.name}:`, {
        online: status.data?.connected,
        activeUsers: stats.data?.activeUsers,
        totalUsers: stats.data?.totalUsers
      });
    } catch (error) {
      console.error(`Device ${device.name} error:`, error.message);
    }
  }
}
```

## Support

For issues and questions:

1. Check the application logs for detailed error messages
2. Verify RouterOS API service configuration
3. Test connectivity using the provided test endpoint
4. Review the RouterOS documentation for API specifics
5. Consult the MikroTik forums for advanced configuration issues