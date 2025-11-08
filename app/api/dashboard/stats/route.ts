import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { clients, employees, inventoryItems, bandwidthPlans } from '@/db/schema/isp';
import { eq, and, sql, desc, lt } from 'drizzle-orm';
import { auth } from '@/lib/auth-client';

// GET /api/dashboard/stats - Get dashboard statistics
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

        // Get total clients
        const [{ totalClients }] = await db
            .select({ totalClients: sql<number>`count(*)` })
            .from(clients);

        // Get active clients
        const [{ activeClients }] = await db
            .select({ activeClients: sql<number>`count(*)` })
            .from(clients)
            .where(eq(clients.status, 'active'));

        // Get total employees
        const [{ totalEmployees }] = await db
            .select({ totalEmployees: sql<number>`count(*)` })
            .from(employees)
            .where(eq(employees.status, 'active'));

        // Get total inventory items
        const [{ totalInventoryItems }] = await db
            .select({ totalInventoryItems: sql<number>`count(*)` })
            .from(inventoryItems);

        // Get total inventory value
        const [inventoryValue] = await db
            .select({
                totalInventoryValue: sql<number>`sum(quantity * unit_price)`
            })
            .from(inventoryItems);

        // Calculate monthly revenue from active clients
        const [monthlyRevenue] = await db
            .select({
                revenue: sql<number>`sum(bp.price)`
            })
            .from(clients)
            .leftJoin(bandwidthPlans.as('bp'), eq(clients.bandwidthPlanId, sql`bp.id`))
            .where(eq(clients.status, 'active'));

        // Get recent clients (last 5)
        const recentClients = await db
            .select({
                id: clients.id,
                name: clients.name,
                email: clients.email,
                status: clients.status,
                createdAt: clients.createdAt,
                bandwidthPlan: {
                    name: bandwidthPlans.name,
                    price: bandwidthPlans.price
                }
            })
            .from(clients)
            .leftJoin(bandwidthPlans, eq(clients.bandwidthPlanId, bandwidthPlans.id))
            .orderBy(desc(clients.createdAt))
            .limit(5);

        // Get low stock items (quantity < 5)
        const lowStockItems = await db
            .select({
                id: inventoryItems.id,
                name: inventoryItems.name,
                category: inventoryItems.category,
                quantity: inventoryItems.quantity,
                location: inventoryItems.location
            })
            .from(inventoryItems)
            .where(and(
                lt(inventoryItems.quantity, 5),
                eq(inventoryItems.status, 'in_stock')
            ))
            .orderBy(inventoryItems.quantity)
            .limit(10);

        // Get upcoming installations (clients with pending status or future installation dates)
        const today = new Date();
        const upcomingInstallations = await db
            .select({
                id: clients.id,
                name: clients.name,
                email: clients.email,
                phone: clients.phone,
                address: clients.address,
                installationDate: clients.installationDate,
                status: clients.status,
                bandwidthPlan: {
                    name: bandwidthPlans.name
                }
            })
            .from(clients)
            .leftJoin(bandwidthPlans, eq(clients.bandwidthPlanId, bandwidthPlans.id))
            .where(and(
                eq(clients.status, 'pending'),
                sql`${clients.installationDate} >= ${today}`
            ))
            .orderBy(clients.installationDate)
            .limit(10);

        // Get clients by status breakdown
        const clientsByStatus = await db
            .select({
                status: clients.status,
                count: sql<number>`count(*)`
            })
            .from(clients)
            .groupBy(clients.status);

        // Get inventory by category breakdown
        const inventoryByCategory = await db
            .select({
                category: inventoryItems.category,
                count: sql<number>`count(*)`,
                totalValue: sql<number>`sum(quantity * unit_price)`
            })
            .from(inventoryItems)
            .groupBy(inventoryItems.category);

        // Get employees by department breakdown
        const employeesByDepartment = await db
            .select({
                department: employees.department,
                count: sql<number>`count(*)`
            })
            .from(employees)
            .where(eq(employees.status, 'active'))
            .groupBy(employees.department);

        // Get bandwidth plan usage
        const planUsage = await db
            .select({
                planName: bandwidthPlans.name,
                clientCount: sql<number>`count(*)`
            })
            .from(clients)
            .leftJoin(bandwidthPlans, eq(clients.bandwidthPlanId, bandwidthPlans.id))
            .where(eq(clients.status, 'active'))
            .groupBy(bandwidthPlans.name)
            .orderBy(sql`count(*)`)
            .desc();

        const stats = {
            totalClients: Number(totalClients) || 0,
            activeClients: Number(activeClients) || 0,
            totalEmployees: Number(totalEmployees) || 0,
            totalInventoryItems: Number(totalInventoryItems) || 0,
            totalInventoryValue: Number(inventoryValue?.totalInventoryValue) || 0,
            monthlyRevenue: Number(monthlyRevenue?.revenue) || 0,
            recentClients,
            lowStockItems,
            upcomingInstallations,
            breakdowns: {
                clientsByStatus,
                inventoryByCategory,
                employeesByDepartment,
                planUsage
            }
        };

        return NextResponse.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch dashboard statistics' },
            { status: 500 }
        );
    }
}