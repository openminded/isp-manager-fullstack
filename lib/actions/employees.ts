/**
 * Employees Server Actions
 *
 * Server Actions for employee management
 */

'use server';

import { db } from '@/db';
import { employees } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function getEmployees() {
  try {
    const result = await db
      .select({
        id: employees.id,
        firstName: employees.firstName,
        lastName: employees.lastName,
        displayName: employees.displayName,
        department: employees.department,
        role: employees.role,
        status: employees.status,
      })
      .from(employees)
      .where(eq(employees.status, 'active'))
      .orderBy(employees.displayName);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Failed to get employees:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch employees',
    };
  }
}