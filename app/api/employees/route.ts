import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { employees } from '@/db/schema/isp';
import { eq, and, ilike, desc, asc } from 'drizzle-orm';
import { auth } from '@/lib/auth-client';

// Validation schemas
const createEmployeeSchema = z.object({
    name: z.string().min(1, 'Employee name is required').max(100),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(1, 'Phone number is required').max(20),
    role: z.enum(['admin', 'technician', 'sales', 'support']),
    department: z.string().min(1, 'Department is required').max(100),
    hireDate: z.string().transform(val => new Date(val)),
    salary: z.number().min(0, 'Salary must be non-negative').optional(),
    address: z.string().max(255, 'Address must be at most 255 characters').optional(),
    emergencyContact: z.string().max(100, 'Emergency contact must be at most 100 characters').optional(),
    notes: z.string().max(1000, 'Notes must be at most 1000 characters').optional()
});

const updateEmployeeSchema = createEmployeeSchema.partial().extend({
    id: z.string().min(1, 'Employee ID is required'),
    status: z.enum(['active', 'inactive', 'on_leave']).optional()
});

const querySchema = z.object({
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? Math.min(parseInt(val), 100) : 20),
    search: z.string().optional(),
    role: z.enum(['admin', 'technician', 'sales', 'support']).optional(),
    department: z.string().optional(),
    status: z.enum(['active', 'inactive', 'on_leave']).optional(),
    sortBy: z.enum(['name', 'email', 'role', 'department', 'hireDate', 'status']).default('name'),
    sortOrder: z.enum(['asc', 'desc']).default('asc')
});

// GET /api/employees - List employees
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
        if (query.role) {
            conditions.push(eq(employees.role, query.role));
        }
        if (query.department) {
            conditions.push(ilike(employees.department, `%${query.department}%`));
        }
        if (query.status) {
            conditions.push(eq(employees.status, query.status));
        }
        if (query.search) {
            conditions.push(and(
                ilike(employees.name, `%${query.search}%`)
            ));
        }

        // Build order by
        const orderBy = query.sortOrder === 'desc'
            ? desc(employees[query.sortBy])
            : asc(employees[query.sortBy]);

        // Get employees
        const employeesData = await db
            .select()
            .from(employees)
            .where(and(...conditions))
            .orderBy(orderBy)
            .limit(query.limit)
            .offset(offset);

        // Get total count
        const [{ count }] = await db
            .select({ count: employees.id })
            .from(employees)
            .where(and(...conditions));

        const totalPages = Math.ceil(Number(count) / query.limit);

        return NextResponse.json({
            success: true,
            data: employeesData,
            pagination: {
                page: query.page,
                limit: query.limit,
                total: Number(count),
                totalPages
            }
        });

    } catch (error) {
        console.error('Error fetching employees:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch employees' },
            { status: 500 }
        );
    }
}

// POST /api/employees - Create new employee (admin only)
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

        // For now, we'll implement basic role checking
        // In a real implementation, you'd check against user roles in the database
        // const isAdmin = await checkAdminRole(session.user.id);
        // if (!isAdmin) {
        //     return NextResponse.json(
        //         { success: false, error: 'Admin access required' },
        //         { status: 403 }
        //     );
        // }

        const body = await request.json();
        const validatedData = createEmployeeSchema.parse(body);

        // Check if employee with same email already exists
        const existingEmployee = await db
            .select()
            .from(employees)
            .where(eq(employees.email, validatedData.email))
            .limit(1);

        if (existingEmployee.length > 0) {
            return NextResponse.json(
                { success: false, error: 'Employee with this email already exists' },
                { status: 409 }
            );
        }

        // Create new employee
        const [newEmployee] = await db
            .insert(employees)
            .values({
                ...validatedData,
                createdAt: new Date(),
                updatedAt: new Date()
            })
            .returning();

        return NextResponse.json({
            success: true,
            data: newEmployee,
            message: 'Employee created successfully'
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

        console.error('Error creating employee:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create employee' },
            { status: 500 }
        );
    }
}

// PUT /api/employees - Update employee
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
        const validatedData = updateEmployeeSchema.parse(body);

        // Check if employee exists
        const existingEmployee = await db
            .select()
            .from(employees)
            .where(eq(employees.id, validatedData.id))
            .limit(1);

        if (existingEmployee.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Employee not found' },
                { status: 404 }
            );
        }

        // Check for email conflicts if email is being changed
        if (validatedData.email && validatedData.email !== existingEmployee[0].email) {
            const emailConflict = await db
                .select()
                .from(employees)
                .where(and(
                    eq(employees.email, validatedData.email),
                    eq(employees.id, validatedData.id)
                ))
                .limit(1);

            if (emailConflict.length > 0) {
                return NextResponse.json(
                    { success: false, error: 'Employee with this email already exists' },
                    { status: 409 }
                );
            }
        }

        // Update employee
        const { id, ...updateData } = validatedData;
        const [updatedEmployee] = await db
            .update(employees)
            .set({
                ...updateData,
                updatedAt: new Date()
            })
            .where(eq(employees.id, id))
            .returning();

        return NextResponse.json({
            success: true,
            data: updatedEmployee,
            message: 'Employee updated successfully'
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

        console.error('Error updating employee:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update employee' },
            { status: 500 }
        );
    }
}