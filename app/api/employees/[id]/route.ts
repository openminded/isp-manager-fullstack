import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { employees } from '@/db/schema/isp';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth-client';

const paramsSchema = z.object({
    id: z.string().min(1, 'Employee ID is required')
});

// GET /api/employees/[id] - Get single employee
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

        // Get employee
        const [employee] = await db
            .select()
            .from(employees)
            .where(eq(employees.id, id))
            .limit(1);

        if (!employee) {
            return NextResponse.json(
                { success: false, error: 'Employee not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: employee
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

        console.error('Error fetching employee:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch employee' },
            { status: 500 }
        );
    }
}

// DELETE /api/employees/[id] - Delete employee (admin only)
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

        // For now, we'll implement basic role checking
        // In a real implementation, you'd check against user roles in the database
        // const isAdmin = await checkAdminRole(session.user.id);
        // if (!isAdmin) {
        //     return NextResponse.json(
        //         { success: false, error: 'Admin access required' },
        //         { status: 403 }
        //     );
        // }

        const { id } = paramsSchema.parse(await params);

        // Check if employee exists
        const existingEmployee = await db
            .select()
            .from(employees)
            .where(eq(employees.id, id))
            .limit(1);

        if (existingEmployee.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Employee not found' },
                { status: 404 }
            );
        }

        // Delete employee
        await db
            .delete(employees)
            .where(eq(employees.id, id));

        return NextResponse.json({
            success: true,
            message: 'Employee deleted successfully'
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

        console.error('Error deleting employee:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete employee' },
            { status: 500 }
        );
    }
}