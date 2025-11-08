import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { inventoryItems, clients } from '@/db/schema/isp';
import { eq, and, ilike, desc, asc } from 'drizzle-orm';
import { auth } from '@/lib/auth-client';

// Validation schemas
const createInventoryItemSchema = z.object({
    name: z.string().min(1, 'Item name is required').max(100),
    category: z.enum(['router', 'cable', 'antenna', 'connector', 'power_supply', 'network_card', 'other']),
    description: z.string().max(255, 'Description must be at most 255 characters').optional(),
    quantity: z.number().int().min(0, 'Quantity must be non-negative'),
    unitPrice: z.number().min(0, 'Unit price must be non-negative'),
    supplier: z.string().min(1, 'Supplier is required').max(100),
    model: z.string().max(50, 'Model must be at most 50 characters').optional(),
    serialNumber: z.string().max(100, 'Serial number must be at most 100 characters').optional(),
    purchaseDate: z.string().transform(val => new Date(val)),
    warrantyExpiry: z.string().optional().transform(val => val ? new Date(val) : undefined),
    location: z.string().min(1, 'Location is required').max(100),
    assignedToClientId: z.string().optional(),
    notes: z.string().max(1000, 'Notes must be at most 1000 characters').optional()
});

const updateInventoryItemSchema = createInventoryItemSchema.partial().extend({
    id: z.string().min(1, 'Item ID is required'),
    status: z.enum(['in_stock', 'deployed', 'maintenance', 'retired']).optional()
});

const querySchema = z.object({
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? Math.min(parseInt(val), 100) : 20),
    search: z.string().optional(),
    category: z.enum(['router', 'cable', 'antenna', 'connector', 'power_supply', 'network_card', 'other']).optional(),
    status: z.enum(['in_stock', 'deployed', 'maintenance', 'retired']).optional(),
    supplier: z.string().optional(),
    location: z.string().optional(),
    assignedToClientId: z.string().optional(),
    sortBy: z.enum(['name', 'category', 'quantity', 'purchaseDate', 'status', 'location']).default('name'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
    includeClient: z.string().optional().transform(val => val === 'true')
});

// GET /api/inventory - List inventory items
export async function GET(request: NextRequest) {
    try {
        // Check authentication
        const session = await auth.getSession();
        if (!session) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const query = querySchema.parse(Object.fromEntries(searchParams));

        const offset = (query.page - 1) * query.limit;

        // Build where conditions
        const conditions = [];
        if (query.category) {
            conditions.push(eq(inventoryItems.category, query.category));
        }
        if (query.status) {
            conditions.push(eq(inventoryItems.status, query.status));
        }
        if (query.supplier) {
            conditions.push(ilike(inventoryItems.supplier, `%${query.supplier}%`));
        }
        if (query.location) {
            conditions.push(ilike(inventoryItems.location, `%${query.location}%`));
        }
        if (query.assignedToClientId) {
            conditions.push(eq(inventoryItems.assignedToClientId, query.assignedToClientId));
        }
        if (query.search) {
            conditions.push(and(
                ilike(inventoryItems.name, `%${query.search}%`)
            ));
        }

        // Build order by
        const orderBy = query.sortOrder === 'desc'
            ? desc(inventoryItems[query.sortBy])
            : asc(inventoryItems[query.sortBy]);

        // Get inventory items
        let inventoryData;
        if (query.includeClient) {
            inventoryData = await db
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
                        email: clients.email
                    }
                })
                .from(inventoryItems)
                .leftJoin(clients, eq(inventoryItems.assignedToClientId, clients.id))
                .where(and(...conditions))
                .orderBy(orderBy)
                .limit(query.limit)
                .offset(offset);
        } else {
            inventoryData = await db
                .select()
                .from(inventoryItems)
                .where(and(...conditions))
                .orderBy(orderBy)
                .limit(query.limit)
                .offset(offset);
        }

        // Get total count
        const [{ count }] = await db
            .select({ count: inventoryItems.id })
            .from(inventoryItems)
            .where(and(...conditions));

        const totalPages = Math.ceil(Number(count) / query.limit);

        return NextResponse.json({
            success: true,
            data: inventoryData,
            pagination: {
                page: query.page,
                limit: query.limit,
                total: Number(count),
                totalPages
            }
        });

    } catch (error) {
        console.error('Error fetching inventory items:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch inventory items' },
            { status: 500 }
        );
    }
}

// POST /api/inventory - Create new inventory item
export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const session = await auth.getSession();
        if (!session) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const validatedData = createInventoryItemSchema.parse(body);

        // Check if serial number already exists (if provided)
        if (validatedData.serialNumber) {
            const existingItem = await db
                .select()
                .from(inventoryItems)
                .where(eq(inventoryItems.serialNumber, validatedData.serialNumber))
                .limit(1);

            if (existingItem.length > 0) {
                return NextResponse.json(
                    { success: false, error: 'Item with this serial number already exists' },
                    { status: 409 }
                );
            }
        }

        // Check if assigned client exists (if provided)
        if (validatedData.assignedToClientId) {
            const [client] = await db
                .select()
                .from(clients)
                .where(eq(clients.id, validatedData.assignedToClientId))
                .limit(1);

            if (!client) {
                return NextResponse.json(
                    { success: false, error: 'Assigned client not found' },
                    { status: 404 }
                );
            }
        }

        // Set status based on assignment
        let status = validatedData.status || 'in_stock';
        if (validatedData.assignedToClientId && !validatedData.status) {
            status = 'deployed';
        }

        // Create new inventory item
        const [newItem] = await db
            .insert(inventoryItems)
            .values({
                ...validatedData,
                status,
                createdBy: session.user.id,
                createdAt: new Date(),
                updatedAt: new Date()
            })
            .returning();

        return NextResponse.json({
            success: true,
            data: newItem,
            message: 'Inventory item created successfully'
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

        console.error('Error creating inventory item:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create inventory item' },
            { status: 500 }
        );
    }
}

// PUT /api/inventory - Update inventory item
export async function PUT(request: NextRequest) {
    try {
        // Check authentication
        const session = await auth.getSession();
        if (!session) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const validatedData = updateInventoryItemSchema.parse(body);

        // Check if item exists
        const existingItem = await db
            .select()
            .from(inventoryItems)
            .where(eq(inventoryItems.id, validatedData.id))
            .limit(1);

        if (existingItem.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Inventory item not found' },
                { status: 404 }
            );
        }

        // Check for serial number conflicts (if serial number is being changed)
        if (validatedData.serialNumber && validatedData.serialNumber !== existingItem[0].serialNumber) {
            const serialConflict = await db
                .select()
                .from(inventoryItems)
                .where(and(
                    eq(inventoryItems.serialNumber, validatedData.serialNumber),
                    eq(inventoryItems.id, validatedData.id)
                ))
                .limit(1);

            if (serialConflict.length > 0) {
                return NextResponse.json(
                    { success: false, error: 'Item with this serial number already exists' },
                    { status: 409 }
                );
            }
        }

        // Check if assigned client exists (if being changed)
        if (validatedData.assignedToClientId !== undefined) {
            if (validatedData.assignedToClientId) {
                const [client] = await db
                    .select()
                    .from(clients)
                    .where(eq(clients.id, validatedData.assignedToClientId))
                    .limit(1);

                if (!client) {
                    return NextResponse.json(
                        { success: false, error: 'Assigned client not found' },
                        { status: 404 }
                    );
                }
            }
        }

        // Update inventory item
        const { id, ...updateData } = validatedData;
        const [updatedItem] = await db
            .update(inventoryItems)
            .set({
                ...updateData,
                updatedAt: new Date()
            })
            .where(eq(inventoryItems.id, id))
            .returning();

        return NextResponse.json({
            success: true,
            data: updatedItem,
            message: 'Inventory item updated successfully'
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

        console.error('Error updating inventory item:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update inventory item' },
            { status: 500 }
        );
    }
}