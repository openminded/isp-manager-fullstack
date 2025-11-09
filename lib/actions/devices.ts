/**
 * MikroTik Devices Server Actions
 *
 * Server Actions for device management
 */

'use server';

import { db } from '@/db';
import { mikrotikDevices } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function getMikrotikDevices() {
  try {
    const result = await db
      .select({
        id: mikrotikDevices.id,
        name: mikrotikDevices.name,
        hostname: mikrotikDevices.hostname,
        ipAddress: mikrotikDevices.ipAddress,
        status: mikrotikDevices.status,
        type: mikrotikDevices.type,
        locationId: mikrotikDevices.locationId,
        model: mikrotikDevices.model,
        firmwareVersion: mikrotikDevices.firmwareVersion,
        isMonitored: mikrotikDevices.isMonitored,
        pppoeEnabled: mikrotikDevices.pppoeEnabled,
        maxPppoeUsers: mikrotikDevices.maxPppoeUsers,
      })
      .from(mikrotikDevices)
      .where(eq(mikrotikDevices.isManaged, true))
      .orderBy(mikrotikDevices.name);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Failed to get MikroTik devices:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch devices',
    };
  }
}