/**
 * Locations Server Actions
 *
 * Server Actions for location management
 */

'use server';

import { db } from '@/db';
import { locations } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function getLocations() {
  try {
    const result = await db
      .select({
        id: locations.id,
        name: locations.name,
        code: locations.code,
        type: locations.type,
        status: locations.status,
        city: locations.city,
        state: locations.state,
        country: locations.country,
      })
      .from(locations)
      .where(eq(locations.status, 'active'))
      .orderBy(locations.name);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Failed to get locations:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch locations',
    };
  }
}