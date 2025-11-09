/**
 * Customer Server Actions
 *
 * Server Actions for customer management CRUD operations
 */

'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { customers, customerContacts, customerDocuments } from '@/db/schema';
import { eq, and, desc, ilike, or } from 'drizzle-orm';
import { z } from 'zod';

// Validation schemas
const CustomerCreateSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  companyName: z.string().optional(),
  type: z.enum(['residential', 'business', 'wholesale', 'government', 'nonprofit', 'other']),
  primaryEmail: z.string().email('Valid email is required'),
  primaryPhone: z.string().optional(),
  mobilePhone: z.string().optional(),
  serviceAddress: z.string().min(1, 'Service address is required'),
  serviceCity: z.string().min(1, 'Service city is required'),
  serviceState: z.string().optional(),
  servicePostalCode: z.string().optional(),
  serviceCountry: z.string().default('US'),
  billingAddress: z.string().optional(),
  billingCity: z.string().optional(),
  billingState: z.string().optional(),
  billingPostalCode: z.string().optional(),
  billingCountry: z.string().optional(),
  locationId: z.string().uuid().optional(),
  serviceStartDate: z.string().optional(),
  contractTermMonths: z.number().min(1).default(1),
  accountManager: z.string().uuid().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

const CustomerUpdateSchema = CustomerCreateSchema.partial().extend({
  id: z.string().uuid(),
});

const CustomerContactSchema = z.object({
  customerId: z.string().uuid(),
  name: z.string().min(1, 'Contact name is required'),
  title: z.string().optional(),
  department: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  isPrimary: z.boolean().default(false),
  isBilling: z.boolean().default(false),
  isTechnical: z.boolean().default(false),
  canAccessPortal: z.boolean().default(false),
  canViewBills: z.boolean().default(false),
  canMakePayments: z.boolean().default(false),
  notes: z.string().optional(),
});

// Types
export type CustomerCreateData = z.infer<typeof CustomerCreateSchema>;
export type CustomerUpdateData = z.infer<typeof CustomerUpdateSchema>;
export type CustomerContactData = z.infer<typeof CustomerContactSchema>;

// Get all customers with pagination and filtering
export async function getCustomers({
  page = 1,
  limit = 20,
  search = '',
  type,
  status,
  locationId,
}: {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  status?: string;
  locationId?: string;
} = {}) {
  try {
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [];

    if (search) {
      whereConditions.push(
        or(
          ilike(customers.firstName, `%${search}%`),
          ilike(customers.lastName, `%${search}%`),
          ilike(customers.companyName, `%${search}%`),
          ilike(customers.primaryEmail, `%${search}%`),
          ilike(customers.customerCode, `%${search}%`)
        )
      );
    }

    if (type) {
      whereConditions.push(eq(customers.type, type as any));
    }

    if (status) {
      whereConditions.push(eq(customers.status, status as any));
    }

    if (locationId) {
      whereConditions.push(eq(customers.locationId, locationId));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get customers
    const customerResults = await db
      .select({
        id: customers.id,
        customerCode: customers.customerCode,
        firstName: customers.firstName,
        lastName: customers.lastName,
        companyName: customers.companyName,
        displayName: customers.displayName,
        type: customers.type,
        status: customers.status,
        primaryEmail: customers.primaryEmail,
        primaryPhone: customers.primaryPhone,
        serviceAddress: customers.serviceAddress,
        serviceCity: customers.serviceCity,
        serviceState: customers.serviceState,
        servicePostalCode: customers.servicePostalCode,
        serviceStartDate: customers.serviceStartDate,
        contractTermMonths: customers.contractTermMonths,
        createdAt: customers.createdAt,
        updatedAt: customers.updatedAt,
        tags: customers.tags,
      })
      .from(customers)
      .where(whereClause)
      .orderBy(desc(customers.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const totalCount = await db
      .select({ count: customers.id })
      .from(customers)
      .where(whereClause);

    return {
      success: true,
      data: customerResults,
      pagination: {
        page,
        limit,
        total: totalCount.length,
        totalPages: Math.ceil(totalCount.length / limit),
      },
    };
  } catch (error) {
    console.error('Failed to get customers:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch customers',
    };
  }
}

// Get single customer by ID
export async function getCustomer(id: string) {
  try {
    const customer = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id))
      .limit(1);

    if (customer.length === 0) {
      return {
        success: false,
        error: 'Customer not found',
      };
    }

    // Get customer contacts
    const contacts = await db
      .select()
      .from(customerContacts)
      .where(eq(customerContacts.customerId, id))
      .orderBy(customerContacts.isPrimary ? 0 : 1);

    // Get customer documents
    const documents = await db
      .select()
      .from(customerDocuments)
      .where(eq(customerDocuments.customerId, id))
      .orderBy(desc(customerDocuments.createdAt));

    return {
      success: true,
      data: {
        ...customer[0],
        contacts,
        documents,
      },
    };
  } catch (error) {
    console.error('Failed to get customer:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch customer',
    };
  }
}

// Create new customer
export async function createCustomer(data: CustomerCreateData) {
  try {
    // Validate input
    const validatedData = CustomerCreateSchema.parse(data);

    // Generate customer code
    const customerCount = await db
      .select({ count: customers.id })
      .from(customers);

    const customerCode = `CUST-${String(customerCount.length + 1).padStart(6, '0')}`;

    // Generate display name
    let displayName = `${validatedData.firstName} ${validatedData.lastName}`;
    if (validatedData.companyName) {
      displayName = `${validatedData.companyName} - ${displayName}`;
    }

    // Create customer
    const [newCustomer] = await db
      .insert(customers)
      .values({
        ...validatedData,
        customerCode,
        displayName,
        serviceStartDate: validatedData.serviceStartDate ? new Date(validatedData.serviceStartDate) : new Date(),
      })
      .returning();

    revalidatePath('/dashboard/customers');

    return {
      success: true,
      data: newCustomer,
    };
  } catch (error) {
    console.error('Failed to create customer:', error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        details: error.errors,
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create customer',
    };
  }
}

// Update existing customer
export async function updateCustomer(data: CustomerUpdateData) {
  try {
    const validatedData = CustomerUpdateSchema.parse(data);

    // Generate display name
    let displayName = `${validatedData.firstName} ${validatedData.lastName}`;
    if (validatedData.companyName) {
      displayName = `${validatedData.companyName} - ${displayName}`;
    }

    // Update customer
    const [updatedCustomer] = await db
      .update(customers)
      .set({
        ...validatedData,
        displayName,
        updatedAt: new Date(),
        serviceStartDate: validatedData.serviceStartDate ? new Date(validatedData.serviceStartDate) : undefined,
      })
      .where(eq(customers.id, validatedData.id))
      .returning();

    if (!updatedCustomer) {
      return {
        success: false,
        error: 'Customer not found',
      };
    }

    revalidatePath('/dashboard/customers');
    revalidatePath(`/dashboard/customers/${validatedData.id}`);

    return {
      success: true,
      data: updatedCustomer,
    };
  } catch (error) {
    console.error('Failed to update customer:', error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        details: error.errors,
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update customer',
    };
  }
}

// Delete customer (soft delete)
export async function deleteCustomer(id: string) {
  try {
    const [deletedCustomer] = await db
      .update(customers)
      .set({
        status: 'cancelled',
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(customers.id, id))
      .returning();

    if (!deletedCustomer) {
      return {
        success: false,
        error: 'Customer not found',
      };
    }

    revalidatePath('/dashboard/customers');

    return {
      success: true,
      data: deletedCustomer,
    };
  } catch (error) {
    console.error('Failed to delete customer:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete customer',
    };
  }
}

// Customer contact management
export async function addCustomerContact(data: CustomerContactData) {
  try {
    const validatedData = CustomerContactSchema.parse(data);

    // If this is the primary contact, unset other primary contacts
    if (validatedData.isPrimary) {
      await db
        .update(customerContacts)
        .set({ isPrimary: false })
        .where(eq(customerContacts.customerId, validatedData.customerId));
    }

    const [newContact] = await db
      .insert(customerContacts)
      .values(validatedData)
      .returning();

    revalidatePath(`/dashboard/customers/${validatedData.customerId}`);

    return {
      success: true,
      data: newContact,
    };
  } catch (error) {
    console.error('Failed to add customer contact:', error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        details: error.errors,
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add contact',
    };
  }
}

export async function updateCustomerContact(id: string, data: Partial<CustomerContactData>) {
  try {
    const validatedData = CustomerContactSchema.partial().parse(data);

    // If this is being set as primary, unset other primary contacts
    if (validatedData.isPrimary) {
      const existingContact = await db
        .select()
        .from(customerContacts)
        .where(eq(customerContacts.id, id))
        .limit(1);

      if (existingContact.length > 0) {
        await db
          .update(customerContacts)
          .set({ isPrimary: false })
          .where(
            and(
              eq(customerContacts.customerId, existingContact[0].customerId),
              // Don't update the current contact
              // We'll handle this in the next update
            )
          );
      }
    }

    const [updatedContact] = await db
      .update(customerContacts)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(customerContacts.id, id))
      .returning();

    if (!updatedContact) {
      return {
        success: false,
        error: 'Contact not found',
      };
    }

    revalidatePath(`/dashboard/customers/${updatedContact.customerId}`);

    return {
      success: true,
      data: updatedContact,
    };
  } catch (error) {
    console.error('Failed to update customer contact:', error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        details: error.errors,
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update contact',
    };
  }
}

export async function deleteCustomerContact(id: string) {
  try {
    const [deletedContact] = await db
      .delete(customerContacts)
      .where(eq(customerContacts.id, id))
      .returning();

    if (!deletedContact) {
      return {
        success: false,
        error: 'Contact not found',
      };
    }

    revalidatePath(`/dashboard/customers/${deletedContact.customerId}`);

    return {
      success: true,
      data: deletedContact,
    };
  } catch (error) {
    console.error('Failed to delete customer contact:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete contact',
    };
  }
}

// Get customer statistics
export async function getCustomerStatistics() {
  try {
    const [
      totalCustomers,
      activeCustomers,
      inactiveCustomers,
      residentialCustomers,
      businessCustomers,
    ] = await Promise.all([
      db.select({ count: customers.id }).from(customers),
      db.select({ count: customers.id }).from(customers).where(eq(customers.status, 'active')),
      db.select({ count: customers.id }).from(customers).where(eq(customers.status, 'inactive')),
      db.select({ count: customers.id }).from(customers).where(eq(customers.type, 'residential')),
      db.select({ count: customers.id }).from(customers).where(eq(customers.type, 'business')),
    ]);

    return {
      success: true,
      data: {
        total: totalCustomers.length,
        active: activeCustomers.length,
        inactive: inactiveCustomers.length,
        residential: residentialCustomers.length,
        business: businessCustomers.length,
      },
    };
  } catch (error) {
    console.error('Failed to get customer statistics:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch statistics',
    };
  }
}