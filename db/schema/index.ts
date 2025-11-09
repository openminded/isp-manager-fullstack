/**
 * Database Schema Index
 *
 * Main export file for all database schemas
 */

// Import all schemas
export * from "./auth";
export * from "./locations";
export * from "./devices";
export * from "./customers";
export * from "./pppoe";
export * from "./inventory";
export * from "./finance";
export * from "./employees";

// Import relationships and indexes
import { relations } from "drizzle-orm";
import {
  user,
  session,
  account,
  verification
} from "./auth";

import {
  locations,
  deviceConnectionHistory,
  deviceInterfaces
} from "./locations";

import {
  mikrotikDevices
} from "./devices";

import {
  customers,
  customerContacts,
  customerDocuments
} from "./customers";

import {
  bandwidthProfiles,
  pppoeUsers,
  pppoeSessions,
  pppoeUsageLogs
} from "./pppoe";

import {
  inventoryCategories,
  inventoryItems,
  inventoryTransactions,
  inventoryAudits,
  inventoryAlerts
} from "./inventory";

import {
  invoices,
  invoiceItems,
  payments,
  expenses,
  revenue
} from "./finance";

import {
  employees,
  employeeDocuments,
  employeeTimeEntries,
  employeePerformanceReviews
} from "./employees";

// Define relationships between tables
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  verifications: many(verification),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const verificationRelations = relations(verification, ({ one }) => ({
  user: one(user, {
    fields: [verification.identifier],
    references: [user.email],
  }),
}));

// Location relationships
export const locationsRelations = relations(locations, ({ many }) => ({
  devices: many(mikrotikDevices),
  customers: many(customers),
  employees: many(employees),
}));

// Device relationships
export const mikrotikDevicesRelations = relations(mikrotikDevices, ({ one, many }) => ({
  location: one(locations, {
    fields: [mikrotikDevices.locationId],
    references: [locations.id],
  }),
  connectionHistory: many(deviceConnectionHistory),
  interfaces: many(deviceInterfaces),
  pppoeUsers: many(pppoeUsers),
  pppoeSessions: many(pppoeSessions),
  pppoeUsageLogs: many(pppoeUsageLogs),
}));

export const deviceConnectionHistoryRelations = relations(deviceConnectionHistory, ({ one }) => ({
  device: one(mikrotikDevices, {
    fields: [deviceConnectionHistory.deviceId],
    references: [mikrotikDevices.id],
  }),
}));

export const deviceInterfacesRelations = relations(deviceInterfaces, ({ one }) => ({
  device: one(mikrotikDevices, {
    fields: [deviceInterfaces.deviceId],
    references: [mikrotikDevices.id],
  }),
}));

// Customer relationships
export const customersRelations = relations(customers, ({ one, many }) => ({
  location: one(locations, {
    fields: [customers.locationId],
    references: [locations.id],
  }),
  contacts: many(customerContacts),
  documents: many(customerDocuments),
  pppoeUsers: many(pppoeUsers),
  invoices: many(invoices),
  payments: many(payments),
  expenses: many(expenses),
  revenue: many(revenue),
}));

export const customerContactsRelations = relations(customerContacts, ({ one }) => ({
  customer: one(customers, {
    fields: [customerContacts.customerId],
    references: [customers.id],
  }),
}));

export const customerDocumentsRelations = relations(customerDocuments, ({ one }) => ({
  customer: one(customers, {
    fields: [customerDocuments.customerId],
    references: [customers.id],
  }),
}));

// PPPoE relationships
export const bandwidthProfilesRelations = relations(bandwidthProfiles, ({ many }) => ({
  pppoeUsers: many(pppoeUsers),
}));

export const pppoeUsersRelations = relations(pppoeUsers, ({ one, many }) => ({
  customer: one(customers, {
    fields: [pppoeUsers.customerId],
    references: [customers.id],
  }),
  device: one(mikrotikDevices, {
    fields: [pppoeUsers.deviceId],
    references: [mikrotikDevices.id],
  }),
  profile: one(bandwidthProfiles, {
    fields: [pppoeUsers.profileId],
    references: [bandwidthProfiles.id],
  }),
  sessions: many(pppoeSessions),
  usageLogs: many(pppoeUsageLogs),
  invoiceItems: many(invoiceItems),
}));

export const pppoeSessionsRelations = relations(pppoeSessions, ({ one }) => ({
  user: one(pppoeUsers, {
    fields: [pppoeSessions.userId],
    references: [pppoeUsers.id],
  }),
  device: one(mikrotikDevices, {
    fields: [pppoeSessions.deviceId],
    references: [mikrotikDevices.id],
  }),
}));

export const pppoeUsageLogsRelations = relations(pppoeUsageLogs, ({ one }) => ({
  user: one(pppoeUsers, {
    fields: [pppoeUsageLogs.userId],
    references: [pppoeUsers.id],
  }),
  device: one(mikrotikDevices, {
    fields: [pppoeUsageLogs.deviceId],
    references: [mikrotikDevices.id],
  }),
}));

// Inventory relationships
export const inventoryCategoriesRelations = relations(inventoryCategories, ({ many }) => ({
  items: many(inventoryItems),
}));

export const inventoryItemsRelations = relations(inventoryItems, ({ one, many }) => ({
  category: one(inventoryCategories, {
    fields: [inventoryItems.categoryId],
    references: [inventoryCategories.id],
  }),
  location: one(locations, {
    fields: [inventoryItems.locationId],
    references: [locations.id],
  }),
  assignedToDevice: one(mikrotikDevices, {
    fields: [inventoryItems.assignedToDeviceId],
    references: [mikrotikDevices.id],
  }),
  transactions: many(inventoryTransactions),
  audits: many(inventoryAudits),
  alerts: many(inventoryAlerts),
}));

export const inventoryTransactionsRelations = relations(inventoryTransactions, ({ one }) => ({
  item: one(inventoryItems, {
    fields: [inventoryTransactions.itemId],
    references: [inventoryItems.id],
  }),
  location: one(locations, {
    fields: [inventoryTransactions.locationId],
    references: [locations.id],
  }),
  device: one(mikrotikDevices, {
    fields: [inventoryTransactions.deviceId],
    references: [mikrotikDevices.id],
  }),
}));

export const inventoryAuditsRelations = relations(inventoryAudits, ({ one }) => ({
  item: one(inventoryItems, {
    fields: [inventoryAudits.itemId],
    references: [inventoryItems.id],
  }),
  location: one(locations, {
    fields: [inventoryAudits.actualLocationId],
    references: [locations.id],
  }),
}));

export const inventoryAlertsRelations = relations(inventoryAlerts, ({ one }) => ({
  item: one(inventoryItems, {
    fields: [inventoryAlerts.itemId],
    references: [inventoryItems.id],
  }),
}));

// Finance relationships
export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  items: many(invoiceItems),
  payments: many(payments),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
  service: one(pppoeUsers, {
    fields: [invoiceItems.serviceId],
    references: [pppoeUsers.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  customer: one(customers, {
    fields: [payments.customerId],
    references: [customers.id],
  }),
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  customer: one(customers, {
    fields: [expenses.billedToCustomer],
    references: [customers.id],
  }),
}));

export const revenueRelations = relations(revenue, ({ one }) => ({
  customer: one(customers, {
    fields: [revenue.customerId],
    references: [customers.id],
  }),
  invoice: one(invoices, {
    fields: [revenue.invoiceId],
    references: [invoices.id],
  }),
}));

// Employee relationships
export const employeesRelations = relations(employees, ({ one, many }) => ({
  workLocation: one(locations, {
    fields: [employees.workLocationId],
    references: [locations.id],
  }),
  reportsToEmployee: one(employees, {
    fields: [employees.reportsTo],
    references: [employees.id],
  }),
  documents: many(employeeDocuments),
  timeEntries: many(employeeTimeEntries),
  performanceReviews: many(employeePerformanceReviews),
}));

export const employeeDocumentsRelations = relations(employeeDocuments, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeDocuments.employeeId],
    references: [employees.id],
  }),
}));

export const employeeTimeEntriesRelations = relations(employeeTimeEntries, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeTimeEntries.employeeId],
    references: [employees.id],
  }),
  location: one(locations, {
    fields: [employeeTimeEntries.locationId],
    references: [locations.id],
  }),
}));

export const employeePerformanceReviewsRelations = relations(employeePerformanceReviews, ({ one }) => ({
  employee: one(employees, {
    fields: [employeePerformanceReviews.employeeId],
    references: [employees.id],
  }),
  reviewer: one(employees, {
    fields: [employeePerformanceReviews.reviewerId],
    references: [employees.id],
  }),
}));

// Export all tables and relations for use in the database
export const schema = {
  // Auth tables
  user,
  session,
  account,
  verification,

  // Location tables
  locations,

  // Device tables
  mikrotikDevices,
  deviceConnectionHistory,
  deviceInterfaces,

  // Customer tables
  customers,
  customerContacts,
  customerDocuments,

  // PPPoE tables
  bandwidthProfiles,
  pppoeUsers,
  pppoeSessions,
  pppoeUsageLogs,

  // Inventory tables
  inventoryCategories,
  inventoryItems,
  inventoryTransactions,
  inventoryAudits,
  inventoryAlerts,

  // Finance tables
  invoices,
  invoiceItems,
  payments,
  expenses,
  revenue,

  // Employee tables
  employees,
  employeeDocuments,
  employeeTimeEntries,
  employeePerformanceReviews,
};

export type Schema = typeof schema;