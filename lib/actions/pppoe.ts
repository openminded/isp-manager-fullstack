/**
 * PPPoE Server Actions
 *
 * Server Actions for PPPoE user management with MikroTik synchronization
 */

'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { pppoeUsers, pppoeSessions, customers, mikrotikDevices, bandwidthProfiles } from '@/db/schema';
import { eq, and, desc, ilike, or } from 'drizzle-orm';
import { z } from 'zod';
import mikrotikService from '@/lib/mikrotik';
import { generatePPPoEPassword, generatePPPoEUsername } from '@/lib/mikrotik-utils';

// Validation schemas
const PPPoEUserCreateSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  serviceType: z.enum(['pppoe', 'ppptp', 'l2tp', 'sstp', 'openvpn', 'wireguard', 'other']).default('pppoe'),
  customerId: z.string().uuid(),
  deviceId: z.string().uuid().optional(),
  profileId: z.string().uuid().optional(),
  profileName: z.string().optional(),
  callerId: z.string().optional(),
  localAddress: z.string().optional(),
  remoteAddress: z.string().optional(),
  poolName: z.string().optional(),
  monthlyFee: z.string().optional(),
  comment: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

const PPPoEUserUpdateSchema = PPPoEUserCreateSchema.partial().extend({
  id: z.string().uuid(),
  isActive: z.boolean().optional(),
  isDisabled: z.boolean().optional(),
});

const PPPoEUserStatusSchema = z.object({
  id: z.string().uuid(),
  isActive: z.boolean(),
  isDisabled: z.boolean(),
});

// Types
export type PPPoEUserCreateData = z.infer<typeof PPPoEUserCreateSchema>;
export type PPPoEUserUpdateData = z.infer<typeof PPPoEUserUpdateSchema>;
export type PPPoEUserStatusData = z.infer<typeof PPPoEUserStatusSchema>;

// Get all PPPoE users with pagination and filtering
export async function getPPPoEUsers({
  page = 1,
  limit = 20,
  search = '',
  customerId,
  deviceId,
  profileId,
  status,
  activeOnly = false,
}: {
  page?: number;
  limit?: number;
  search?: string;
  customerId?: string;
  deviceId?: string;
  profileId?: string;
  status?: string;
  activeOnly?: boolean;
} = {}) {
  try {
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [];

    if (search) {
      whereConditions.push(
        or(
          ilike(pppoeUsers.username, `%${search}%`),
          ilike(pppoeUsers.customerName, `%${search}%`),
          ilike(pppoeUsers.profileName, `%${search}%`),
          ilike(pppoeUsers.comment, `%${search}%`)
        )
      );
    }

    if (customerId) {
      whereConditions.push(eq(pppoeUsers.customerId, customerId));
    }

    if (deviceId) {
      whereConditions.push(eq(pppoeUsers.deviceId, deviceId));
    }

    if (profileId) {
      whereConditions.push(eq(pppoeUsers.profileId, profileId));
    }

    if (status) {
      whereConditions.push(eq(pppoeUsers.connectionStatus, status as any));
    }

    if (activeOnly) {
      whereConditions.push(eq(pppoeUsers.isActive, true));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get PPPoE users with related data
    const userResults = await db
      .select({
        id: pppoeUsers.id,
        mikrotikUserId: pppoeUsers.mikrotikUserId,
        username: pppoeUsers.username,
        serviceType: pppoeUsers.serviceType,
        customerId: pppoeUsers.customerId,
        customerName: pppoeUsers.customerName,
        deviceId: pppoeUsers.deviceId,
        profileId: pppoeUsers.profileId,
        profileName: pppoeUsers.profileName,
        connectionStatus: pppoeUsers.connectionStatus,
        authStatus: pppoeUsers.authStatus,
        isActive: pppoeUsers.isActive,
        isDisabled: pppoeUsers.isDisabled,
        localAddress: pppoeUsers.localAddress,
        remoteAddress: pppoeUsers.remoteAddress,
        lastConnectedAt: pppoeUsers.lastConnectedAt,
        currentSessionStart: pppoeUsers.currentSessionStart,
        currentSessionDuration: pppoeUsers.currentSessionDuration,
        totalBytesIn: pppoeUsers.totalBytesIn,
        totalBytesOut: pppoeUsers.totalBytesOut,
        currentSessionBytesIn: pppoeUsers.currentSessionBytesIn,
        currentSessionBytesOut: pppoeUsers.currentSessionBytesOut,
        monthlyFee: pppoeUsers.monthlyFee,
        comment: pppoeUsers.comment,
        createdAt: pppoeUsers.createdAt,
        updatedAt: pppoeUsers.updatedAt,
        tags: pppoeUsers.tags,
        // Related customer info
        customerType: customers.type,
        customerStatus: customers.status,
        // Device info
        deviceName: mikrotikDevices.name,
        deviceStatus: mikrotikDevices.status,
        // Profile info
        profileMonthlyPrice: bandwidthProfiles.monthlyPrice,
      })
      .from(pppoeUsers)
      .leftJoin(customers, eq(pppoeUsers.customerId, customers.id))
      .leftJoin(mikrotikDevices, eq(pppoeUsers.deviceId, mikrotikDevices.id))
      .leftJoin(bandwidthProfiles, eq(pppoeUsers.profileId, bandwidthProfiles.id))
      .where(whereClause)
      .orderBy(desc(pppoeUsers.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const totalCount = await db
      .select({ count: pppoeUsers.id })
      .from(pppoeUsers)
      .where(whereClause);

    return {
      success: true,
      data: userResults,
      pagination: {
        page,
        limit,
        total: totalCount.length,
        totalPages: Math.ceil(totalCount.length / limit),
      },
    };
  } catch (error) {
    console.error('Failed to get PPPoE users:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch PPPoE users',
    };
  }
}

// Get single PPPoE user by ID
export async function getPPPoEUser(id: string) {
  try {
    const [user] = await db
      .select({
        ...pppoeUsers,
        customerType: customers.type,
        customerStatus: customers.status,
        deviceName: mikrotikDevices.name,
        deviceStatus: mikrotikDevices.status,
        profileMonthlyPrice: bandwidthProfiles.monthlyPrice,
        profileUploadLimit: bandwidthProfiles.uploadLimit,
        profileDownloadLimit: bandwidthProfiles.downloadLimit,
      })
      .from(pppoeUsers)
      .leftJoin(customers, eq(pppoeUsers.customerId, customers.id))
      .leftJoin(mikrotikDevices, eq(pppoeUsers.deviceId, mikrotikDevices.id))
      .leftJoin(bandwidthProfiles, eq(pppoeUsers.profileId, bandwidthProfiles.id))
      .where(eq(pppoeUsers.id, id))
      .limit(1);

    if (!user) {
      return {
        success: false,
        error: 'PPPoE user not found',
      };
    }

    // Get recent sessions
    const recentSessions = await db
      .select()
      .from(pppoeSessions)
      .where(eq(pppoeSessions.userId, id))
      .orderBy(desc(pppoeSessions.connectedAt))
      .limit(10);

    return {
      success: true,
      data: {
        ...user,
        recentSessions,
      },
    };
  } catch (error) {
    console.error('Failed to get PPPoE user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch PPPoE user',
    };
  }
}

// Create new PPPoE user with MikroTik synchronization
export async function createPPPoEUser(data: PPPoEUserCreateData) {
  try {
    const validatedData = PPPoEUserCreateSchema.parse(data);

    // Get customer info for customer name
    const [customer] = await db
      .select({ firstName: customers.firstName, lastName: customers.lastName, companyName: customers.companyName })
      .from(customers)
      .where(eq(customers.id, validatedData.customerId))
      .limit(1);

    if (!customer) {
      return {
        success: false,
        error: 'Customer not found',
      };
    }

    // Generate customer name
    let customerName = `${customer.firstName} ${customer.lastName}`;
    if (customer.companyName) {
      customerName = customer.companyName;
    }

    // Get profile info if provided
    let profileName = validatedData.profileName;
    if (validatedData.profileId && !profileName) {
      const [profile] = await db
        .select({ name: bandwidthProfiles.name })
        .from(bandwidthProfiles)
        .where(eq(bandwidthProfiles.id, validatedData.profileId))
        .limit(1);

      if (profile) {
        profileName = profile.name;
      }
    }

    // Create PPPoE user in database
    const [newUser] = await db
      .insert(pppoeUsers)
      .values({
        ...validatedData,
        customerName,
        profileName,
        isActive: true,
        isDisabled: false,
        syncStatus: 'pending',
        createdBy: 'system', // TODO: Get from session
      })
      .returning();

    // Sync with MikroTik if device is specified
    if (validatedData.deviceId) {
      try {
        const device = await db
          .select({ host: mikrotikDevices.hostname })
          .from(mikrotikDevices)
          .where(eq(mikrotikDevices.id, validatedData.deviceId))
          .limit(1);

        if (device.length > 0) {
          const mikrotikResult = await mikrotikService.createPPPoEUser(validatedData.deviceId, {
            name: validatedData.username,
            password: validatedData.password,
            service: validatedData.serviceType,
            profile: profileName || 'default',
            comment: validatedData.comment,
            disabled: false,
          });

          if (mikrotikResult.success && mikrotikResult.data) {
            // Update with MikroTik user ID
            await db
              .update(pppoeUsers)
              .set({
                mikrotikUserId: mikrotikResult.data.id,
                syncStatus: 'synced',
                lastSyncAt: new Date(),
              })
              .where(eq(pppoeUsers.id, newUser.id));
          } else {
            // Mark sync as failed
            await db
              .update(pppoeUsers)
              .set({
                syncStatus: 'error',
                syncError: mikrotikResult.error,
                lastSyncAt: new Date(),
              })
              .where(eq(pppoeUsers.id, newUser.id));
          }
        }
      } catch (syncError) {
        console.error('MikroTik sync error:', syncError);
        // Don't fail the whole operation if sync fails
        await db
          .update(pppoeUsers)
          .set({
            syncStatus: 'error',
            syncError: syncError instanceof Error ? syncError.message : 'Unknown sync error',
            lastSyncAt: new Date(),
          })
          .where(eq(pppoeUsers.id, newUser.id));
      }
    }

    revalidatePath('/dashboard/pppoe');
    revalidatePath(`/dashboard/customers/${validatedData.customerId}`);

    return {
      success: true,
      data: newUser,
    };
  } catch (error) {
    console.error('Failed to create PPPoE user:', error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        details: error.errors,
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create PPPoE user',
    };
  }
}

// Update existing PPPoE user
export async function updatePPPoEUser(data: PPPoEUserUpdateData) {
  try {
    const validatedData = PPPoEUserUpdateSchema.parse(data);

    // Get existing user to check device changes
    const [existingUser] = await db
      .select({ deviceId: pppoeUsers.deviceId, mikrotikUserId: pppoeUsers.mikrotikUserId })
      .from(pppoeUsers)
      .where(eq(pppoeUsers.id, validatedData.id))
      .limit(1);

    if (!existingUser) {
      return {
        success: false,
        error: 'PPPoE user not found',
      };
    }

    // Update in database
    const [updatedUser] = await db
      .update(pppoeUsers)
      .set({
        ...validatedData,
        updatedAt: new Date(),
        syncStatus: 'pending',
        updatedBy: 'system', // TODO: Get from session
      })
      .where(eq(pppoeUsers.id, validatedData.id))
      .returning();

    // Sync with MikroTik if user exists in RouterOS
    if (existingUser.mikrotikUserId && validatedData.deviceId) {
      try {
        const mikrotikResult = await mikrotikService.updatePPPoEUser(
          validatedData.deviceId,
          existingUser.mikrotikUserId,
          {
            name: validatedData.username,
            password: validatedData.password,
            service: validatedData.serviceType,
            profile: validatedData.profileName || 'default',
            comment: validatedData.comment,
            disabled: validatedData.isDisabled || false,
          }
        );

        if (mikrotikResult.success) {
          await db
            .update(pppoeUsers)
            .set({
              syncStatus: 'synced',
              syncError: null,
              lastSyncAt: new Date(),
            })
            .where(eq(pppoeUsers.id, validatedData.id));
        } else {
          await db
            .update(pppoeUsers)
            .set({
              syncStatus: 'error',
              syncError: mikrotikResult.error,
              lastSyncAt: new Date(),
            })
            .where(eq(pppoeUsers.id, validatedData.id));
        }
      } catch (syncError) {
        console.error('MikroTik sync error:', syncError);
        await db
          .update(pppoeUsers)
          .set({
            syncStatus: 'error',
            syncError: syncError instanceof Error ? syncError.message : 'Unknown sync error',
            lastSyncAt: new Date(),
          })
          .where(eq(pppoeUsers.id, validatedData.id));
      }
    }

    revalidatePath('/dashboard/pppoe');
    revalidatePath(`/dashboard/pppoe/${validatedData.id}`);

    return {
      success: true,
      data: updatedUser,
    };
  } catch (error) {
    console.error('Failed to update PPPoE user:', error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        details: error.errors,
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update PPPoE user',
    };
  }
}

// Delete PPPoE user
export async function deletePPPoEUser(id: string) {
  try {
    // Get user info for MikroTik deletion
    const [user] = await db
      .select({ deviceId: pppoeUsers.deviceId, mikrotikUserId: pppoeUsers.mikrotikUserId, customerId: pppoeUsers.customerId })
      .from(pppoeUsers)
      .where(eq(pppoeUsers.id, id))
      .limit(1);

    if (!user) {
      return {
        success: false,
        error: 'PPPoE user not found',
      };
    }

    // Delete from MikroTik if exists
    if (user.mikrotikUserId && user.deviceId) {
      try {
        await mikrotikService.deletePPPoEUser(user.deviceId, user.mikrotikUserId);
      } catch (syncError) {
        console.error('MikroTik deletion error:', syncError);
        // Continue with database deletion even if RouterOS deletion fails
      }
    }

    // Delete from database (soft delete)
    const [deletedUser] = await db
      .update(pppoeUsers)
      .set({
        isActive: false,
        isDisabled: true,
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(pppoeUsers.id, id))
      .returning();

    revalidatePath('/dashboard/pppoe');
    if (user.customerId) {
      revalidatePath(`/dashboard/customers/${user.customerId}`);
    }

    return {
      success: true,
      data: deletedUser,
    };
  } catch (error) {
    console.error('Failed to delete PPPoE user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete PPPoE user',
    };
  }
}

// Update PPPoE user status (enable/disable)
export async function updatePPPoEUserStatus(data: PPPoEUserStatusData) {
  try {
    const validatedData = PPPoEUserStatusSchema.parse(data);

    // Get user info for MikroTik update
    const [user] = await db
      .select({ deviceId: pppoeUsers.deviceId, mikrotikUserId: pppoeUsers.mikrotikUserId })
      .from(pppoeUsers)
      .where(eq(pppoeUsers.id, validatedData.id))
      .limit(1);

    if (!user) {
      return {
        success: false,
        error: 'PPPoE user not found',
      };
    }

    // Update in database
    const [updatedUser] = await db
      .update(pppoeUsers)
      .set({
        isActive: validatedData.isActive,
        isDisabled: validatedData.isDisabled,
        updatedAt: new Date(),
        syncStatus: 'pending',
      })
      .where(eq(pppoeUsers.id, validatedData.id))
      .returning();

    // Sync with MikroTik if user exists
    if (user.mikrotikUserId && user.deviceId) {
      try {
        const mikrotikResult = await mikrotikService.updatePPPoEUser(
          user.deviceId,
          user.mikrotikUserId,
          {
            disabled: validatedData.isDisabled,
          }
        );

        if (mikrotikResult.success) {
          await db
            .update(pppoeUsers)
            .set({
              syncStatus: 'synced',
              syncError: null,
              lastSyncAt: new Date(),
            })
            .where(eq(pppoeUsers.id, validatedData.id));
        } else {
          await db
            .update(pppoeUsers)
            .set({
              syncStatus: 'error',
              syncError: mikrotikResult.error,
              lastSyncAt: new Date(),
            })
            .where(eq(pppoeUsers.id, validatedData.id));
        }
      } catch (syncError) {
        console.error('MikroTik status sync error:', syncError);
        await db
          .update(pppoeUsers)
          .set({
            syncStatus: 'error',
            syncError: syncError instanceof Error ? syncError.message : 'Unknown sync error',
            lastSyncAt: new Date(),
          })
          .where(eq(pppoeUsers.id, validatedData.id));
      }
    }

    revalidatePath('/dashboard/pppoe');
    revalidatePath(`/dashboard/pppoe/${validatedData.id}`);

    return {
      success: true,
      data: updatedUser,
    };
  } catch (error) {
    console.error('Failed to update PPPoE user status:', error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        details: error.errors,
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user status',
    };
  }
}

// Disconnect active PPPoE session
export async function disconnectPPPoEUser(id: string) {
  try {
    // Get user info
    const [user] = await db
      .select({ deviceId: pppoeUsers.deviceId, username: pppoeUsers.username, connectionStatus: pppoeUsers.connectionStatus })
      .from(pppoeUsers)
      .where(eq(pppoeUsers.id, id))
      .limit(1);

    if (!user) {
      return {
        success: false,
        error: 'PPPoE user not found',
      };
    }

    if (user.connectionStatus !== 'connected') {
      return {
        success: false,
        error: 'User is not currently connected',
      };
    }

    if (!user.deviceId) {
      return {
        success: false,
        error: 'No device assigned to user',
      };
    }

    // Disconnect from MikroTik
    const result = await mikrotikService.disconnectPPPoEUser(user.deviceId, user.username);

    if (result.success) {
      // Update user status in database
      await db
        .update(pppoeUsers)
        .set({
          connectionStatus: 'disconnected',
          lastDisconnectedAt: new Date(),
        })
        .where(eq(pppoeUsers.id, id));

      revalidatePath('/dashboard/pppoe');
      revalidatePath(`/dashboard/pppoe/${id}`);

      return {
        success: true,
        data: { message: 'User disconnected successfully' },
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to disconnect user',
      };
    }
  } catch (error) {
    console.error('Failed to disconnect PPPoE user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to disconnect user',
    };
  }
}

// Get PPPoE statistics
export async function getPPPoEStatistics() {
  try {
    const [
      totalUsers,
      activeUsers,
      disabledUsers,
      connectedUsers,
      residentialUsers,
      businessUsers,
    ] = await Promise.all([
      db.select({ count: pppoeUsers.id }).from(pppoeUsers).where(eq(pppoeUsers.isActive, true)),
      db.select({ count: pppoeUsers.id }).from(pppoeUsers).where(eq(pppoeUsers.connectionStatus, 'connected')),
      db.select({ count: pppoeUsers.id }).from(pppoeUsers).where(eq(pppoeUsers.isDisabled, true)),
      db.select({ count: pppoeUsers.id }).from(pppoeUsers).where(eq(pppoeUsers.connectionStatus, 'connected')),
      // Join with customers for residential/business counts
      db
        .select({ count: pppoeUsers.id })
        .from(pppoeUsers)
        .leftJoin(customers, eq(pppoeUsers.customerId, customers.id))
        .where(and(eq(pppoeUsers.isActive, true), eq(customers.type, 'residential'))),
      db
        .select({ count: pppoeUsers.id })
        .from(pppoeUsers)
        .leftJoin(customers, eq(pppoeUsers.customerId, customers.id))
        .where(and(eq(pppoeUsers.isActive, true), eq(customers.type, 'business'))),
    ]);

    return {
      success: true,
      data: {
        total: totalUsers.length,
        active: activeUsers.length,
        disabled: disabledUsers.length,
        connected: connectedUsers.length,
        residential: residentialUsers.length,
        business: businessUsers.length,
      },
    };
  } catch (error) {
    console.error('Failed to get PPPoE statistics:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch statistics',
    };
  }
}

// Generate username and password for new PPPoE user
export async function generatePPPoECredentials(customerName?: string) {
  try {
    const username = generatePPPoEUsername('pppoe', customerName);
    const password = generatePPPoEPassword(12);

    // Check if username already exists
    const existing = await db
      .select({ id: pppoeUsers.id })
      .from(pppoeUsers)
      .where(eq(pppoeUsers.username, username))
      .limit(1);

    // If username exists, generate a new one
    const finalUsername = existing.length > 0 ? generatePPPoEUsername('pppoe', customerName) : username;

    return {
      success: true,
      data: {
        username: finalUsername,
        password,
      },
    };
  } catch (error) {
    console.error('Failed to generate PPPoE credentials:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate credentials',
    };
  }
}