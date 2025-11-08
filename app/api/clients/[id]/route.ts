import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { clients, bandwidthPlans, inventoryItems } from '@/db/schema/isp';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth-client';
import { mikrotikService } from '@/lib/mikrotik';

const paramsSchema = z.object({
    id: z.string().min(1, 'Client ID is required')
});

// GET /api/clients/[id] - Get single client with full details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Check authentication
        const session = await auth.getSession();
        if (!session) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = paramsSchema.parse(await params);

        // Get client with bandwidth plan and assigned inventory
        const [client] = await db
            .select({
                id: clients.id,
                name: clients.name,
                email: clients.email,
                phone: clients.phone,
                address: clients.address,
                pppoeUsername: clients.pppoeUsername,
                status: clients.status,
                installationDate: clients.installationDate,
                lastBillingDate: clients.lastBillingDate,
                nextBillingDate: clients.nextBillingDate,
                notes: clients.notes,
                createdAt: clients.createdAt,
                updatedAt: clients.updatedAt,
                bandwidthPlan: {
                    id: bandwidthPlans.id,
                    name: bandwidthPlans.name,
                    downloadSpeed: bandwidthPlans.downloadSpeed,
                    uploadSpeed: bandwidthPlans.uploadSpeed,
                    price: bandwidthPlans.price,
                    description: bandwidthPlans.description
                }
            })
            .from(clients)
            .leftJoin(bandwidthPlans, eq(clients.bandwidthPlanId, bandwidthPlans.id))
            .where(eq(clients.id, id))
            .limit(1);

        if (!client) {
            return NextResponse.json(
                { success: false, error: 'Client not found' },
                { status: 404 }
            );
        }

        // Get assigned inventory items
        const assignedInventory = await db
            .select()
            .from(inventoryItems)
            .where(eq(inventoryItems.assignedToClientId, id));

        // Get PPPoE user status from router
        let pppoeStatus = null;
        try {
            const routerResult = await mikrotikService.getUserStatus(client.pppoeUsername);
            if (routerResult.success) {
                pppoeStatus = routerResult.data;
            }
        } catch (error) {
            console.warn('⚠️  Could not fetch PPPoE status from router:', error);
        }

        return NextResponse.json({
            success: true,
            data: {
                ...client,
                assignedInventory,
                routerStatus: pppoeStatus
            }
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Validation failed',
                    details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
                },
                { status: 400 }
            );
        }

        console.error('Error fetching client:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch client' },
            { status: 500 }
        );
    }
}

// DELETE /api/clients/[id] - Delete client
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Check authentication
        const session = await auth.getSession();
        if (!session) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = paramsSchema.parse(await params);

        // Check if client exists
        const existingClient = await db
            .select()
            .from(clients)
            .where(eq(clients.id, id))
            .limit(1);

        if (existingClient.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Client not found' },
                { status: 404 }
            );
        }

        const client = existingClient[0];

        // Disable PPPoE user on router
        try {
            const mikrotikResult = await mikrotikService.disablePppoeUser(client.pppoeUsername);
            if (!mikrotikResult.success) {
                console.warn('⚠️  Failed to disable PPPoE user on router:', mikrotikResult.error);
            } else {
                console.log(`✅ Disabled PPPoE user: ${client.pppoeUsername}`);
            }
        } catch (error) {
            console.warn('⚠️  Error disabling PPPoE user on router:', error);
        }

        // Unassign any inventory items
        await db
            .update(inventoryItems)
            .set({ assignedToClientId: null })
            .where(eq(inventoryItems.assignedToClientId, id));

        // Delete client
        await db
            .delete(clients)
            .where(eq(clients.id, id));

        return NextResponse.json({
            success: true,
            message: 'Client deleted successfully and PPPoE user disabled'
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Validation failed',
                    details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
                },
                { status: 400 }
            );
        }

        console.error('Error deleting client:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete client' },
            { status: 500 }
        );
    }
}