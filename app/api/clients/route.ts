import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { clients, bandwidthPlans } from '@/db/schema/isp';
import { eq, and, ilike, desc, asc } from 'drizzle-orm';
import { auth } from '@/lib/auth-client';
import { mikrotikService } from '@/lib/mikrotik';
import { MikroTikUtils } from '@/lib/mikrotik-utils';

// Validation schemas
const createClientSchema = z.object({
    name: z.string().min(1, 'Client name is required').max(100),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(1, 'Phone number is required').max(20),
    address: z.string().min(1, 'Address is required').max(255),
    pppoeUsername: z.string().min(3, 'PPPoE username must be at least 3 characters').max(32),
    pppoePassword: z.string().min(8, 'PPPoE password must be at least 8 characters').max(32),
    bandwidthPlanId: z.string().min(1, 'Bandwidth plan is required'),
    notes: z.string().max(1000, 'Notes must be at most 1000 characters').optional(),
    installationDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
    nextBillingDate: z.string().optional().transform(val => val ? new Date(val) : undefined)
});

const updateClientSchema = createClientSchema.partial().extend({
    id: z.string().min(1, 'Client ID is required'),
    status: z.enum(['active', 'inactive', 'suspended', 'pending']).optional()
});

const querySchema = z.object({
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? Math.min(parseInt(val), 100) : 20),
    search: z.string().optional(),
    status: z.enum(['active', 'inactive', 'suspended', 'pending']).optional(),
    bandwidthPlanId: z.string().optional(),
    sortBy: z.enum(['name', 'email', 'createdAt', 'nextBillingDate', 'status']).default('name'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
    includeBandwidthPlan: z.string().optional().transform(val => val === 'true')
});

// GET /api/clients - List clients
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
        if (query.status) {
            conditions.push(eq(clients.status, query.status));
        }
        if (query.bandwidthPlanId) {
            conditions.push(eq(clients.bandwidthPlanId, query.bandwidthPlanId));
        }
        if (query.search) {
            conditions.push(ilike(clients.name, `%${query.search}%`));
        }

        // Build order by
        const orderBy = query.sortOrder === 'desc'
            ? desc(clients[query.sortBy])
            : asc(clients[query.sortBy]);

        // Get clients
        let clientsData;
        if (query.includeBandwidthPlan) {
            clientsData = await db
                .select({
                    id: clients.id,
                    name: clients.name,
                    email: clients.email,
                    phone: clients.phone,
                    address: clients.address,
                    pppoeUsername: clients.pppoeUsername,
                    status: clients.status,
                    installationDate: clients.installationDate,
                    nextBillingDate: clients.nextBillingDate,
                    notes: clients.notes,
                    createdAt: clients.createdAt,
                    updatedAt: clients.updatedAt,
                    bandwidthPlan: {
                        id: bandwidthPlans.id,
                        name: bandwidthPlans.name,
                        downloadSpeed: bandwidthPlans.downloadSpeed,
                        uploadSpeed: bandwidthPlans.uploadSpeed,
                        price: bandwidthPlans.price
                    }
                })
                .from(clients)
                .leftJoin(bandwidthPlans, eq(clients.bandwidthPlanId, bandwidthPlans.id))
                .where(and(...conditions))
                .orderBy(orderBy)
                .limit(query.limit)
                .offset(offset);
        } else {
            clientsData = await db
                .select()
                .from(clients)
                .where(and(...conditions))
                .orderBy(orderBy)
                .limit(query.limit)
                .offset(offset);
        }

        // Get total count
        const [{ count }] = await db
            .select({ count: clients.id })
            .from(clients)
            .where(and(...conditions));

        const totalPages = Math.ceil(Number(count) / query.limit);

        return NextResponse.json({
            success: true,
            data: clientsData,
            pagination: {
                page: query.page,
                limit: query.limit,
                total: Number(count),
                totalPages
            }
        });

    } catch (error) {
        console.error('Error fetching clients:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch clients' },
            { status: 500 }
        );
    }
}

// POST /api/clients - Create new client
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
        const validatedData = createClientSchema.parse(body);

        // Validate PPPoE credentials
        if (!MikroTikUtils.isValidUsername(validatedData.pppoeUsername)) {
            return NextResponse.json(
                { success: false, error: 'Invalid PPPoE username format' },
                { status: 400 }
            );
        }

        const passwordValidation = MikroTikUtils.validatePasswordStrength(validatedData.pppoePassword);
        if (!passwordValidation.isValid) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'PPPoE password does not meet security requirements',
                    details: passwordValidation.issues
                },
                { status: 400 }
            );
        }

        // Check if bandwidth plan exists and is active
        const [plan] = await db
            .select()
            .from(bandwidthPlans)
            .where(and(
                eq(bandwidthPlans.id, validatedData.bandwidthPlanId),
                eq(bandwidthPlans.isActive, true)
            ))
            .limit(1);

        if (!plan) {
            return NextResponse.json(
                { success: false, error: 'Bandwidth plan not found or inactive' },
                { status: 404 }
            );
        }

        // Check if client with same email or PPPoE username already exists
        const existingClient = await db
            .select()
            .from(clients)
            .where(and(
                ilike(clients.email, validatedData.email),
                eq(clients.pppoeUsername, validatedData.pppoeUsername)
            ))
            .limit(1);

        if (existingClient.length > 0) {
            const conflict = existingClient[0];
            if (conflict.email.toLowerCase() === validatedData.email.toLowerCase()) {
                return NextResponse.json(
                    { success: false, error: 'Client with this email already exists' },
                    { status: 409 }
                );
            }
            if (conflict.pppoeUsername === validatedData.pppoeUsername) {
                return NextResponse.json(
                    { success: false, error: 'PPPoE username already exists' },
                    { status: 409 }
                );
            }
        }

        // Create PPPoE user on router
        const mikrotikResult = await mikrotikService.createPppoeUser(
            validatedData.pppoeUsername,
            validatedData.pppoePassword,
            MikroTikUtils.generateProfileName(plan.downloadSpeed, plan.uploadSpeed),
            `Client: ${validatedData.name} (${validatedData.email})`
        );

        if (!mikrotikResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to create PPPoE user on router',
                    details: MikroTikUtils.formatErrorMessage(mikrotikResult.error || 'Unknown error')
                },
                { status: 500 }
            );
        }

        // Create client in database
        const [newClient] = await db
            .insert(clients)
            .values({
                ...validatedData,
                createdBy: session.user.id,
                createdAt: new Date(),
                updatedAt: new Date()
            })
            .returning();

        return NextResponse.json({
            success: true,
            data: newClient,
            message: 'Client created successfully and PPPoE user provisioned'
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

        console.error('Error creating client:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create client' },
            { status: 500 }
        );
    }
}

// PUT /api/clients - Update client
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
        const validatedData = updateClientSchema.parse(body);

        // Check if client exists
        const existingClient = await db
            .select()
            .from(clients)
            .where(eq(clients.id, validatedData.id))
            .limit(1);

        if (existingClient.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Client not found' },
                { status: 404 }
            );
        }

        const client = existingClient[0];

        // Validate bandwidth plan if being changed
        if (validatedData.bandwidthPlanId && validatedData.bandwidthPlanId !== client.bandwidthPlanId) {
            const [plan] = await db
                .select()
                .from(bandwidthPlans)
                .where(and(
                    eq(bandwidthPlans.id, validatedData.bandwidthPlanId),
                    eq(bandwidthPlans.isActive, true)
                ))
                .limit(1);

            if (!plan) {
                return NextResponse.json(
                    { success: false, error: 'Bandwidth plan not found or inactive' },
                    { status: 404 }
                );
            }
        }

        // Check for email conflicts if email is being changed
        if (validatedData.email && validatedData.email.toLowerCase() !== client.email.toLowerCase()) {
            const emailConflict = await db
                .select()
                .from(clients)
                .where(and(
                    eq(clients.email, validatedData.email),
                    eq(clients.id, validatedData.id)
                ))
                .limit(1);

            if (emailConflict.length > 0) {
                return NextResponse.json(
                    { success: false, error: 'Client with this email already exists' },
                    { status: 409 }
                );
            }
        }

        // Update client in database
        const { id, ...updateData } = validatedData;
        const [updatedClient] = await db
            .update(clients)
            .set({
                ...updateData,
                updatedAt: new Date()
            })
            .where(eq(clients.id, id))
            .returning();

        // Sync with RouterOS if bandwidth plan or PPPoE credentials changed
        if (validatedData.bandwidthPlanId || validatedData.pppoePassword) {
            try {
                const [plan] = await db
                    .select()
                    .from(bandwidthPlans)
                    .where(eq(bandwidthPlans.id, updatedClient.bandwidthPlanId))
                    .limit(1);

                if (plan) {
                    const mikrotikResult = await mikrotikService.updatePppoeUser(
                        updatedClient.pppoeUsername,
                        MikroTikUtils.generateProfileName(plan.downloadSpeed, plan.uploadSpeed),
                        validatedData.pppoePassword
                    );

                    if (!mikrotikResult.success) {
                        console.warn('⚠️  Failed to sync client changes with RouterOS:', mikrotikResult.error);
                    }
                }
            } catch (error) {
                console.warn('⚠️  Error syncing with RouterOS:', error);
            }
        }

        return NextResponse.json({
            success: true,
            data: updatedClient,
            message: 'Client updated successfully'
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

        console.error('Error updating client:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update client' },
            { status: 500 }
        );
    }
}