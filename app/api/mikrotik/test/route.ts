/**
 * MikroTik API Test Route
 *
 * Test endpoint for verifying MikroTik RouterOS API integration
 */

import { NextRequest, NextResponse } from 'next/server';
import mikrotikService, { MikroTikError } from '@/lib/mikrotik';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');

    if (!deviceId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Device ID is required',
          timestamp: new Date(),
        },
        { status: 400 }
      );
    }

    // Test connection
    const connectionResult = await mikrotikService.connectToDevice(deviceId);

    if (!connectionResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: connectionResult.error,
          timestamp: connectionResult.timestamp,
        },
        { status: 500 }
      );
    }

    // Get connection status
    const statusResult = await mikrotikService.getConnectionStatus(deviceId);

    // Get PPPoE users
    const usersResult = await mikrotikService.getPPPoEUsers(deviceId);

    // Get active connections
    const activeResult = await mikrotikService.getActivePPPoEConnections(deviceId);

    // Get statistics
    const statsResult = await mikrotikService.getPPPoEStatistics(deviceId);

    return NextResponse.json({
      success: true,
      data: {
        connection: connectionResult.data,
        status: statusResult.data,
        users: usersResult.data,
        active: activeResult.data,
        statistics: statsResult.data,
        devices: mikrotikService.getDevices(),
      },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('MikroTik test error:', error);

    if (error instanceof MikroTikError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
          device: error.device,
          timestamp: new Date(),
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceId, operation, data } = body;

    if (!deviceId || !operation) {
      return NextResponse.json(
        {
          success: false,
          error: 'Device ID and operation are required',
          timestamp: new Date(),
        },
        { status: 400 }
      );
    }

    let result;

    switch (operation) {
      case 'createUser':
        result = await mikrotikService.createPPPoEUser(deviceId, data);
        break;

      case 'updateUser':
        result = await mikrotikService.updatePPPoEUser(deviceId, data.userId, data.updates);
        break;

      case 'deleteUser':
        result = await mikrotikService.deletePPPoEUser(deviceId, data.userId);
        break;

      case 'disconnectUser':
        result = await mikrotikService.disconnectPPPoEUser(deviceId, data.userName);
        break;

      case 'getProfiles':
        result = await mikrotikService.getBandwidthProfiles(deviceId);
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown operation: ${operation}`,
            timestamp: new Date(),
          },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('MikroTik operation error:', error);

    if (error instanceof MikroTikError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
          device: error.device,
          timestamp: new Date(),
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}