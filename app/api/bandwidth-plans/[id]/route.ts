import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { bandwidthPlans, clients } from '@/db/schema/isp';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth-client';

const paramsSchema = z.object({
    id: z.string().min(1, 'Plan ID is required')
});

// GET /api/bandwidth-plans/[id] - Get single bandwidth plan
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

        // Get plan
        const [plan] = await db
            .select()
            .from(bandwidthPlans)
            .where(eq(bandwidthPlans.id, id))
            .limit(1);

        if (!plan) {
            return NextResponse.json(
                { success: false, error: 'Bandwidth plan not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: plan
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

        console.error('Error fetching bandwidth plan:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch bandwidth plan' },
            { status: 500 }
        );
    }
}

// DELETE /api/bandwidth-plans/[id] - Delete bandwidth plan
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Check authentication and admin role
        const session = await auth.getSession();
        if (!session) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = paramsSchema.parse(await params);

        // Check if plan exists
        const existingPlan = await db
            .select()
            .from(bandwidthPlans)
            .where(eq(bandwidthPlans.id, id))
            .limit(1);

        if (existingPlan.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Bandwidth plan not found' },
                { status: 404 }
            );
        }

        // Check if plan is being used by any active clients
        const activeClients = await db
            .select({ count: clients.id })
            .from(clients)
            .where(and(
                eq(clients.bandwidthPlanId, id),
                eq(clients.status, 'active')
            ))
            .limit(1);

        if (activeClients.length > 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Cannot delete bandwidth plan that is being used by active clients'
                },
                { status: 409 }
            );
        }

        // Delete plan
        await db
            .delete(bandwidthPlans)
            .where(eq(bandwidthPlans.id, id));

        return NextResponse.json({
            success: true,
            message: 'Bandwidth plan deleted successfully'
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

        console.error('Error deleting bandwidth plan:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete bandwidth plan' },
            { status: 500 }
        );
    }
}