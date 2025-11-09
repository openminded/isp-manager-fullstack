/**
 * Finance Schema
 *
 * Defines the database schema for managing ISP financial operations, billing, and payments
 */

import {
  pgTable,
  text,
  timestamp,
  boolean,
  pgEnum,
  uuid,
  decimal,
  integer,
  date,
  jsonb
} from "drizzle-orm/pg-core";
import { customers } from "./customers";
import { pppoeUsers } from "./pppoe";

// Invoice status enum
export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "sent",
  "viewed",
  "paid",
  "partially_paid",
  "overdue",
  "cancelled",
  "written_off"
]);

// Payment status enum
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "processing",
  "completed",
  "failed",
  "refunded",
  "partially_refunded",
  "cancelled"
]);

// Payment method enum
export const paymentMethodEnum = pgEnum("payment_method", [
  "credit_card",
  "bank_transfer",
  "cash",
  "check",
  "auto_debit",
  "online_payment",
  "cryptocurrency",
  "other"
]);

// Expense type enum
export const expenseTypeEnum = pgEnum("expense_type", [
  "internet_transit",
  "equipment",
  "maintenance",
  "staff_salary",
  "rent",
  "utilities",
  "marketing",
  "software_licenses",
  "insurance",
  "taxes",
  "travel",
  "training",
  "supplies",
  "other"
]);

// Revenue category enum
export const revenueCategoryEnum = pgEnum("revenue_category", [
  "internet_service",
  "equipment_rental",
  "installation",
  "maintenance",
  "consulting",
  "late_fees",
  "data_overage",
  "setup_fees",
  "other"
]);

export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  customerPoNumber: text("customer_po_number"),

  // Customer information
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "CASCADE" }).notNull(),
  customerName: text("customer_name").notNull(), // Denormalized for easy access
  customerEmail: text("customer_email"),
  billingAddress: jsonb("billing_address"), // JSON object with billing address

  // Invoice details
  status: invoiceStatusEnum("status").notNull().default("draft"),
  type: text("type").notNull().default("invoice"), // invoice, credit_note, quote
  currency: text("currency").notNull().default("USD"),
  language: text("language").notNull().default("en"),

  // Financial amounts
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }).notNull().default("0.00"),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).notNull().default("0.00"),
  discountAmount: decimal("discount_amount", { precision: 12, scale: 2 }).notNull().default("0.00"),
  discountRate: decimal("discount_rate", { precision: 5, scale: 2 }).notNull().default("0.00"),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  paidAmount: decimal("paid_amount", { precision: 12, scale: 2 }).notNull().default("0.00"),
  balanceAmount: decimal("balance_amount", { precision: 12, scale: 2 }).notNull(),

  // Dates
  issueDate: date("issue_date").notNull(),
  dueDate: date("due_date").notNull(),
  periodStartDate: date("period_start_date"),
  periodEndDate: date("period_end_date"),

  // Payment terms
  paymentTerms: text("payment_terms").notNull().default("NET 30"),
  lateFeeRate: decimal("late_fee_rate", { precision: 5, scale: 2 }).default("1.50"), // 1.5% per month
  lateFeeAmount: decimal("late_fee_amount", { precision: 12, scale: 2 }).default("0.00"),

  // Recurring billing
  isRecurring: boolean("is_recurring").default(false),
  recurringPeriod: text("recurring_period"), // monthly, quarterly, annually
  recurringEndDate: date("recurring_end_date"),
  nextInvoiceDate: date("next_invoice_date"),

  // Service period breakdown
  servicePeriods: jsonb("service_periods"), // Array of service periods

  // Itemized charges
  items: jsonb("items").notNull(), // Array of invoice items

  // Taxes and discounts
  taxDetails: jsonb("tax_details"), // Tax breakdown details
  discountDetails: jsonb("discount_details"), // Discount breakdown details

  // Notes and terms
  notes: text("notes"),
  terms: text("terms"),
  footer: text("footer"),

  // Status tracking
  sentAt: timestamp("sent_at"),
  viewedAt: timestamp("viewed_at"),
  paidAt: timestamp("paid_at"),
  lastReminderAt: timestamp("last_reminder_at"),
  reminderCount: integer("reminder_count").default(0),

  // Automation
  autoSend: boolean("auto_send").default(false),
  autoCharge: boolean("auto_charge").default(false),
  dunningEnabled: boolean("dunning_enabled").default(true),

  // Metadata
  tags: text("tags").array(),
  metadata: jsonb("metadata"), // Additional invoice metadata

  // System fields
  createdBy: text("created_by"), // Employee ID
  updatedBy: text("updated_by"), // Employee ID
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),

  // Soft delete
  deletedAt: timestamp("deleted_at"),
});

export const invoiceItems = pgTable("invoice_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id").references(() => invoices.id, { onDelete: "CASCADE" }).notNull(),

  // Item details
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 12, scale: 2 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),

  // Service or product classification
  itemType: text("item_type").notNull(), // service, product, usage, fee, discount
  categoryId: text("category_id"), // Revenue category
  sku: text("sku"),
  serviceId: uuid("service_id").references(() => pppoeUsers.id, { onDelete: "SET NULL" }),

  // Tax and discounts
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0.00"),
  taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }).default("0.00"),
  discountRate: decimal("discount_rate", { precision: 5, scale: 2 }).default("0.00"),
  discountAmount: decimal("discount_amount", { precision: 12, scale: 2 }).default("0.00"),

  // Service period
  serviceStartDate: date("service_start_date"),
  serviceEndDate: date("service_end_date"),

  // Usage-based billing
  usageUnit: text("usage_unit"), // GB, hours, etc.
  usageQuantity: decimal("usage_quantity", { precision: 12, scale: 2 }),
  usageRate: decimal("usage_rate", { precision: 12, scale: 2 }),

  // Metadata
  metadata: jsonb("metadata"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  paymentNumber: text("payment_number").notNull().unique(),
  transactionId: text("transaction_id").unique(),

  // Customer and invoice
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "CASCADE" }).notNull(),
  customerName: text("customer_name").notNull(),
  invoiceId: uuid("invoice_id").references(() => invoices.id, { onDelete: "CASCADE" }),
  invoiceNumber: text("invoice_number"),

  // Payment details
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  status: paymentStatusEnum("status").notNull().default("pending"),

  // Payment processing
  processor: text("processor"), // stripe, paypal, square, etc.
  processorTransactionId: text("processor_transaction_id"),
  processorResponse: jsonb("processor_response"),

  // Credit card processing
  cardType: text("card_type"), // visa, mastercard, amex, etc.
  cardLast4: text("card_last4"),
  cardExpiry: text("card_expiry"),
  authorizationCode: text("authorization_code"),

  // Bank details
  bankName: text("bank_name"),
  accountType: text("account_type"), // checking, savings
  accountLast4: text("account_last4"),
  routingNumber: text("routing_number"),

  // Check details
  checkNumber: text("check_number"),
  checkDate: date("check_date"),
  bankName: text("bank_name"),

  // Cash details
  receivedBy: text("received_by"), // Employee ID
  receiptNumber: text("receipt_number"),

  // Payment dates
  paymentDate: date("payment_date").notNull(),
  processedDate: date("processed_date"),
  settledDate: date("settled_date"),

  // Fees and adjustments
  processingFee: decimal("processing_fee", { precision: 12, scale: 2 }).default("0.00"),
  processingFeeRate: decimal("processing_fee_rate", { precision: 5, scale: 2 }).default("0.00"),
  netAmount: decimal("net_amount", { precision: 12, scale: 2 }),

  // Allocation
  allocatedToInvoices: jsonb("allocated_to_invoices"), // Array of invoice allocations
  unallocatedAmount: decimal("unallocated_amount", { precision: 12, scale: 2 }).default("0.00"),

  // Refunds
  refundedAmount: decimal("refunded_amount", { precision: 12, scale: 2 }).default("0.00"),
  refundReason: text("refund_reason"),
  refunds: jsonb("refunds"), // Array of refund transactions

  // Disputes and chargebacks
  disputed: boolean("disputed").default(false),
  disputeReason: text("dispute_reason"),
  disputeStatus: text("dispute_status"),
  disputeResolution: text("dispute_resolution"),

  // Notes and metadata
  notes: text("notes"),
  internalNotes: text("internal_notes"),
  metadata: jsonb("metadata"),

  // Recurring payments
  isRecurring: boolean("is_recurring").default(false),
  recurringPaymentId: text("recurring_payment_id"),
  nextPaymentDate: date("next_payment_date"),

  // System fields
  createdBy: text("created_by"),
  updatedBy: text("updated_by"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),

  // Soft delete
  deletedAt: timestamp("deleted_at"),
});

export const expenses = pgTable("expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  expenseNumber: text("expense_number").notNull().unique(),

  // Expense details
  description: text("description").notNull(),
  type: expenseTypeEnum("type").notNull(),
  category: text("category"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),

  // Vendor information
  vendorName: text("vendor_name").notNull(),
  vendorId: text("vendor_id"),
  vendorContact: text("vendor_contact"),
  vendorEmail: text("vendor_email"),
  vendorPhone: text("vendor_phone"),

  // Dates
  expenseDate: date("expense_date").notNull(),
  dueDate: date("due_date"),
  paidDate: date("paid_date"),

  // Payment information
  paymentMethod: paymentMethodEnum("payment_method"),
  paymentStatus: text("payment_status").notNull().default("unpaid"),
  checkNumber: text("check_number"),
  creditCardLast4: text("credit_card_last4"),

  // Allocation and tracking
  allocatedToProjects: jsonb("allocated_to_projects"), // Array of project allocations
  allocatedToDepartments: jsonb("allocated_to_departments"), // Array of department allocations
  billable: boolean("billable").default(false),
  billedToCustomer: text("billed_to_customer"), // Customer ID

  // Approval workflow
  requiresApproval: boolean("requires_approval").default(false),
  requestedBy: text("requested_by"), // Employee ID
  approvedBy: text("approved_by"), // Employee ID
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),

  // Receipts and documentation
  receiptRequired: boolean("receipt_required").default(true),
  receiptReceived: boolean("receipt_received").default(false),
  receiptAttachments: text("receipt_attachments").array(), // Array of document URLs
  notes: text("notes"),
  internalNotes: text("internal_notes"),

  // Tax information
  taxDeductible: boolean("tax_deductible").default(true),
  taxCategory: text("tax_category"),
  taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }).default("0.00"),

  // Recurring expenses
  isRecurring: boolean("is_recurring").default(false),
  recurringPeriod: text("recurring_period"), // monthly, quarterly, annually
  recurringEndDate: date("recurring_end_date"),
  nextExpenseDate: date("next_expense_date"),

  // Budget tracking
  budgetCategory: text("budget_category"),
  budgetAmount: decimal("budget_amount", { precision: 12, scale: 2 }),
  yearToDateTotal: decimal("year_to_date_total", { precision: 12, scale: 2 }).default("0.00"),

  // Metadata
  tags: text("tags").array(),
  metadata: jsonb("metadata"),

  // System fields
  createdBy: text("created_by"),
  updatedBy: text("updated_by"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),

  // Soft delete
  deletedAt: timestamp("deleted_at"),
});

export const revenue = pgTable("revenue", {
  id: uuid("id").primaryKey().defaultRandom(),
  revenueNumber: text("revenue_number").notNull().unique(),

  // Revenue details
  description: text("description").notNull(),
  category: revenueCategoryEnum("category").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),

  // Source information
  sourceType: text("source_type").notNull(), // service, product, fee, penalty, etc.
  sourceId: text("source_id"), // Related entity ID
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "SET NULL" }),
  customerName: text("customer_name"),
  invoiceId: uuid("invoice_id").references(() => invoices.id, { onDelete: "SET NULL" }),
  invoiceNumber: text("invoice_number"),

  // Dates
  revenueDate: date("revenue_date").notNull(),
  recognizedDate: date("recognized_date"),
  periodStartDate: date("period_start_date"),
  periodEndDate: date("period_end_date"),

  // Revenue recognition
  recognitionMethod: text("recognition_method").notNull().default("accrual"), // accrual, cash
  recognized: boolean("recognized").default(false),
  deferred: boolean("deferred").default(false),
  deferralMonths: integer("deferral_months"),

  // Breakdown
  serviceRevenue: decimal("service_revenue", { precision: 12, scale: 2 }).default("0.00"),
  equipmentRevenue: decimal("equipment_revenue", { precision: 12, scale: 2 }).default("0.00"),
  installationRevenue: decimal("installation_revenue", { precision: 12, scale: 2 }).default("0.00"),
  otherRevenue: decimal("other_revenue", { precision: 12, scale: 2 }).default("0.00"),

  // Cost of goods sold
  costOfGoods: decimal("cost_of_goods", { precision: 12, scale: 2 }).default("0.00"),
  grossMargin: decimal("gross_margin", { precision: 12, scale: 2 }).default("0.00"),
  grossMarginPercent: decimal("gross_margin_percent", { precision: 5, scale: 2 }).default("0.00"),

  // Adjustments
  adjustments: jsonb("adjustments"), // Array of adjustment records
  originalAmount: decimal("original_amount", { precision: 12, scale: 2 }),

  // Metadata
  tags: text("tags").array(),
  metadata: jsonb("metadata"),
  notes: text("notes"),

  // System fields
  createdBy: text("created_by"),
  updatedBy: text("updated_by"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),

  // Soft delete
  deletedAt: timestamp("deleted_at"),
});

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type NewInvoiceItem = typeof invoiceItems.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
export type Revenue = typeof revenue.$inferSelect;
export type NewRevenue = typeof revenue.$inferInsert;