/**
 * Customers Schema
 *
 * Defines the database schema for managing ISP customers and their information
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
  date
} from "drizzle-orm/pg-core";
import { locations } from "./locations";

// Customer type enum
export const customerTypeEnum = pgEnum("customer_type", [
  "residential",
  "business",
  "wholesale",
  "government",
  "nonprofit",
  "other"
]);

// Customer status enum
export const customerStatusEnum = pgEnum("customer_status", [
  "active",
  "inactive",
  "suspended",
  "trial",
  "pending",
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
  "other"
]);

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerCode: text("customer_code").notNull().unique(), // Like "CUST-000123"

  // Basic information
  companyName: text("company_name"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  displayName: text("display_name"), // Calculated field for display

  // Customer type and status
  type: customerTypeEnum("type").notNull().default("residential"),
  status: customerStatusEnum("status").notNull().default("pending"),

  // Contact information
  primaryEmail: text("primary_email").notNull(),
  secondaryEmail: text("secondary_email"),
  primaryPhone: text("primary_phone"),
  secondaryPhone: text("secondary_phone"),
  mobilePhone: text("mobile_phone"),

  // Address information
  serviceAddress: text("service_address").notNull(),
  serviceAddress2: text("service_address2"),
  serviceCity: text("service_city").notNull(),
  serviceState: text("service_state"),
  servicePostalCode: text("service_postal_code"),
  serviceCountry: text("service_country").default("US"),

  // Billing address (may be different from service address)
  billingAddress: text("billing_address"),
  billingAddress2: text("billing_address2"),
  billingCity: text("billing_city"),
  billingState: text("billing_state"),
  billingPostalCode: text("billing_postal_code"),
  billingCountry: text("billing_country"),

  // Location assignment
  locationId: uuid("location_id").references(() => locations.id, { onDelete: "SET NULL" }),

  // Identification and verification
  taxId: text("tax_id"), // Tax ID or SSN (encrypted)
  idNumber: text("id_number"), // Government ID (encrypted)
  idType: text("id_type"), // Driver's license, passport, etc.
  idExpiration: date("id_expiration"),

  // Financial information
  creditLimit: decimal("credit_limit", { precision: 10, scale: 2 }).default("0.00"),
  outstandingBalance: decimal("outstanding_balance", { precision: 10, scale: 2 }).default("0.00"),
  paymentMethod: paymentMethodEnum("payment_method").default("credit_card"),

  // Service information
  serviceStartDate: date("service_start_date"),
  serviceEndDate: date("service_end_date"),
  contractTermMonths: integer("contract_term_months").default(1),
  autoRenew: boolean("auto_renew").default(true),

  // Technical information
  installationNotes: text("installation_notes"),
  technicalRequirements: text("technical_requirements"),
  preferredContactMethod: text("preferred_contact_method").default("email"),

  // Marketing and sales
  referralSource: text("referral_source"),
  salesRepresentative: text("sales_representative"), // Employee ID
  marketingCampaign: text("marketing_campaign"),

  // Account management
  accountManager: text("account_manager"), // Employee ID
  billingContact: text("billing_contact"),
  technicalContact: text("technical_contact"),

  // Preferences
  billingFrequency: text("billing_frequency").default("monthly"), // monthly, quarterly, annually
  invoiceDelivery: text("invoice_delivery").default("email"), // email, mail, both
  paperlessBilling: boolean("paperless_billing").default(true),

  // Notes and comments
  notes: text("notes"),
  internalNotes: text("internal_notes"),
  alerts: text("alerts").array(), // Array of alert messages

  // Additional data
  customFields: text("custom_fields").array(), // Array of custom field objects
  tags: text("tags").array(), // Array of tags for categorization

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at"),
  lastPaymentAt: timestamp("last_payment_at"),

  // Soft delete
  deletedAt: timestamp("deleted_at"),
});

// Customer contacts (multiple contacts per customer)
export const customerContacts = pgTable("customer_contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "CASCADE" }).notNull(),

  name: text("name").notNull(),
  title: text("title"),
  department: text("department"),
  email: text("email"),
  phone: text("phone"),
  mobile: text("mobile"),

  // Contact preferences
  isPrimary: boolean("is_primary").default(false),
  isBilling: boolean("is_billing").default(false),
  isTechnical: boolean("is_technical").default(false),

  // Permissions
  canAccessPortal: boolean("can_access_portal").default(false),
  canViewBills: boolean("can_view_bills").default(false),
  canMakePayments: boolean("can_make_payments").default(false),

  // Notes
  notes: text("notes"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Customer documents
export const customerDocuments = pgTable("customer_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "CASCADE" }).notNull(),

  name: text("name").notNull(),
  type: text("type").notNull(), // contract, id_proof, address_proof, etc.
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),

  // Security
  isEncrypted: boolean("is_encrypted").default(false),
  requiresAuth: boolean("requires_auth").default(false),

  // Metadata
  uploadedBy: text("uploaded_by"), // Employee ID
  description: text("description"),
  tags: text("tags").array(),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
export type CustomerContact = typeof customerContacts.$inferSelect;
export type NewCustomerContact = typeof customerContacts.$inferInsert;
export type CustomerDocument = typeof customerDocuments.$inferSelect;
export type NewCustomerDocument = typeof customerDocuments.$inferInsert;