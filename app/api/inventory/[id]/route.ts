import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { inventoryItems, clients } from '@/db/schema/isp';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth-client';

const paramsSchema = z.object({
    id: z.string().min(1, 'Item ID is required')
});

// GET /api/inventory/[id] - Get single inventory item
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

        // Get inventory item with assigned client
        const [item] = await db
            .select({
                id: inventoryItems.id,
                name: inventoryItems.name,
                category: inventoryItems.category,
                description: inventoryItems.description,
                quantity: inventoryItems.quantity,
                unitPrice: inventoryItems.unitPrice,
                supplier: inventoryItems.supplier,
                model: inventoryItems.model,
                serialNumber: inventoryItems.serialNumber,
                purchaseDate: inventoryItems.purchaseDate,
                warrantyExpiry: inventoryItems.warrantyExpiry,
                status: inventoryItems.status,
                location: inventoryItems.location,
                assignedToClientId: inventoryItems.assignedToClientId,
                notes: inventoryItems.notes,
                createdAt: inventoryItems.createdAt,
                updatedAt: inventoryItems.updatedAt,
                assignedClient: {
                    id: clients.id,
                    name: clients.name,
                    email: clients.email,
                    phone: clients.phone,
                    address: clients.address
                }
            })
            .from(inventoryItems)
            .leftJoin(clients, eq(inventoryItems.assignedToClientId, clients.id))
            .where(eq(inventoryItems.id, id))
            .limit(1);

        if (!item) {
            return NextResponse.json(
                { success: false, error: 'Inventory item not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: item
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

        console.error('Error fetching inventory item:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch inventory item' },
            { status: 500 }
        );
    }
}

// DELETE /api/inventory/[id] - Delete inventory item
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

        // Check if item exists
        const existingItem = await db
            .select()
            .from(inventoryItems)
            .where(eq(inventoryItems.id, id))
            .limit(1);

        if (existingItem.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Inventory item not found' },
                { status: 404 }
            );
        }

        const item = existingItem[0];

        // Check if item is currently deployed to a client
        if (item.assignedToClientId) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Cannot delete inventory item that is currently deployed to a client'
                },
                { status: 409 }
            );
        }

        // Delete inventory item
        await db
            .delete(inventoryItems)
            .where(eq(inventoryItems.id, id));

        return NextResponse.json({
            success: true,
            message: 'Inventory item deleted successfully'
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

        console.error('Error deleting inventory item:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete inventory item' },
            { status: 500 }
        );
    }
}