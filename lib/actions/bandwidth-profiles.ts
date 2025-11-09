/**
 * Bandwidth Profiles Server Actions
 *
 * Server Actions for bandwidth profile management
 */

'use server';

import { db } from '@/db';
import { bandwidthProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function getBandwidthProfiles() {
  try {
    const result = await db
      .select({
        id: bandwidthProfiles.id,
        name: bandwidthProfiles.name,
        displayName: bandwidthProfiles.displayName,
        uploadLimit: bandwidthProfiles.uploadLimit,
        downloadLimit: bandwidthProfiles.downloadLimit,
        monthlyPrice: bandwidthProfiles.monthlyPrice,
        category: bandwidthProfiles.category,
        isBusinessClass: bandwidthProfiles.isBusinessClass,
        isActive: bandwidthProfiles.isActive,
        mikrotikProfileName: bandwidthProfiles.mikrotikProfileName,
        description: bandwidthProfiles.description,
      })
      .from(bandwidthProfiles)
      .where(eq(bandwidthProfiles.isActive, true))
      .orderBy(bandwidthProfiles.monthlyPrice);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Failed to get bandwidth profiles:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch bandwidth profiles',
    };
  }
}