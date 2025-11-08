import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { bandwidthPlans } from '@/db/schema/isp';
import { eq, and, ilike, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth-client';

// Validation schemas
const createBandwidthPlanSchema = z.object({
    name: z.string().min(1, 'Plan name is required').max(100),
    downloadSpeed: z.number().int().min(1, 'Download speed must be at least 1 Mbps'),
    uploadSpeed: z.number().int().min(1, 'Upload speed must be at least 1 Mbps'),
    price: z.number().min(0, 'Price must be non-negative'),
    description: z.string().max(255, 'Description must be at most 255 characters').optional(),
    isActive: z.boolean().default(true)
});

const updateBandwidthPlanSchema = createBandwidthPlanSchema.partial().extend({
    id: z.string().min(1, 'Plan ID is required')
});

const querySchema = z.object({
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? Math.min(parseInt(val), 100) : 20),
    search: z.string().optional(),
    isActive: z.string().optional().transform(val => val === 'true'),
    sortBy: z.enum(['name', 'price', 'downloadSpeed', 'createdAt']).default('name'),
    sortOrder: z.enum(['asc', 'desc']).default('asc')
});

// GET /api/bandwidth-plans - List bandwidth plans
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
        if (query.isActive !== undefined) {
            conditions.push(eq(bandwidthPlans.isActive, query.isActive));
        }
        if (query.search) {
            conditions.push(ilike(bandwidthPlans.name, `%${query.search}%`));
        }

        // Build order by
        const orderBy = query.sortOrder === 'desc'
            ? desc(bandwidthPlans[query.sortBy])
            : bandwidthPlans[query.sortBy];

        // Get plans
        const plans = await db
            .select()
            .from(bandwidthPlans)
            .where(and(...conditions))
            .orderBy(orderBy)
            .limit(query.limit)
            .offset(offset);

        // Get total count
        const [{ count }] = await db
            .select({ count: bandwidthPlans.id })
            .from(bandwidthPlans)
            .where(and(...conditions));

        const totalPages = Math.ceil(Number(count) / query.limit);

        return NextResponse.json({
            success: true,
            data: plans,
            pagination: {
                page: query.page,
                limit: query.limit,
                total: Number(count),
                totalPages
            }
        });

    } catch (error) {
        console.error('Error fetching bandwidth plans:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch bandwidth plans' },
            { status: 500 }
        );
    }
}

// POST /api/bandwidth-plans - Create new bandwidth plan
export async function POST(request: NextRequest) {
    try {
        // Check authentication and admin role
        const session = await auth.getSession();
        if (!session) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const validatedData = createBandwidthPlanSchema.parse(body);

        // Check if plan with same name already exists
        const existingPlan = await db
            .select()
            .from(bandwidthPlans)
            .where(eq(bandwidthPlans.name, validatedData.name))
            .limit(1);

        if (existingPlan.length > 0) {
            return NextResponse.json(
                { success: false, error: 'Bandwidth plan with this name already exists' },
                { status: 409 }
            );
        }

        // Create new plan
        const [newPlan] = await db
            .insert(bandwidthPlans)
            .values({
                ...validatedData,
                createdAt: new Date(),
                updatedAt: new Date()
            })
            .returning();

        return NextResponse.json({
            success: true,
            data: newPlan,
            message: 'Bandwidth plan created successfully'
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

        console.error('Error creating bandwidth plan:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create bandwidth plan' },
            { status: 500 }
        );
    }
}

// PUT /api/bandwidth-plans - Update bandwidth plan
export async function PUT(request: NextRequest) {
    try {
        // Check authentication and admin role
        const session = await auth.getSession();
        if (!session) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const validatedData = updateBandwidthPlanSchema.parse(body);

        // Check if plan exists
        const existingPlan = await db
            .select()
            .from(bandwidthPlans)
            .where(eq(bandwidthPlans.id, validatedData.id))
            .limit(1);

        if (existingPlan.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Bandwidth plan not found' },
                { status: 404 }
            );
        }

        // Check if name conflict (if name is being changed)
        if (validatedData.name && validatedData.name !== existingPlan[0].name) {
            const nameConflict = await db
                .select()
                .from(bandwidthPlans)
                .where(and(
                    eq(bandwidthPlans.name, validatedData.name),
                    eq(bandwidthPlans.isActive, true)
                ))
                .limit(1);

            if (nameConflict.length > 0) {
                return NextResponse.json(
                    { success: false, error: 'Bandwidth plan with this name already exists' },
                    { status: 409 }
                );
            }
        }

        // Update plan
        const { id, ...updateData } = validatedData;
        const [updatedPlan] = await db
            .update(bandwidthPlans)
            .set({
                ...updateData,
                updatedAt: new Date()
            })
            .where(eq(bandwidthPlans.id, id))
            .returning();

        return NextResponse.json({
            success: true,
            data: updatedPlan,
            message: 'Bandwidth plan updated successfully'
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

        console.error('Error updating bandwidth plan:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update bandwidth plan' },
            { status: 500 }
        );
    }
}