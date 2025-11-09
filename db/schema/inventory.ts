/**
 * Inventory Schema
 *
 * Defines the database schema for managing ISP inventory, equipment, and supplies
 */

import {
  pgTable,
  text,
  timestamp,
  boolean,
  pgEnum,
  uuid,
  integer,
  decimal,
  date,
  jsonb
} from "drizzle-orm/pg-core";
import { locations } from "./locations";
import { mikrotikDevices } from "./devices";

// Item type enum
export const itemTypeEnum = pgEnum("item_type", [
  "router",
  "switch",
  "wireless_ap",
  "antenna",
  "cable",
  "connector",
  "power_supply",
  "rack",
  "patch_panel",
  "media_converter",
  "sfp_module",
  "software_license",
  "consumable",
  "tool",
  "other"
]);

// Item status enum
export const itemStatusEnum = pgEnum("item_status", [
  "in_stock",
  "in_use",
  "reserved",
  "maintenance",
  "failed",
  "retired",
  "lost",
  "disposed"
]);

// Condition enum
export const conditionEnum = pgEnum("condition", [
  "new",
  "excellent",
  "good",
  "fair",
  "poor",
  "failed"
]);

export const inventoryCategories = pgTable("inventory_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description"),

  // Hierarchy
  parentId: uuid("parent_id"),
  level: integer("level").default(0),
  path: text("path"), // Category path like "Networking/Routers/Wireless"

  // Configuration
  fields: jsonb("fields"), // Custom fields for this category
  defaultSettings: jsonb("default_settings"),

  // Status
  isActive: boolean("is_active").default(true),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),

  // Soft delete
  deletedAt: timestamp("deleted_at"),
});

export const inventoryItems = pgTable("inventory_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  sku: text("sku").unique(), // Stock Keeping Unit
  serialNumber: text("serial_number").unique(),
  assetTag: text("asset_tag").unique(),

  // Basic information
  name: text("name").notNull(),
  description: text("description"),
  manufacturer: text("manufacturer"),
  model: text("model"),
  partNumber: text("part_number"),
  version: text("version"),
  firmware: text("firmware"),

  // Classification
  categoryId: uuid("category_id").references(() => inventoryCategories.id, { onDelete: "SET NULL" }),
  itemType: itemTypeEnum("item_type").notNull(),
  status: itemStatusEnum("item_status").notNull().default("in_stock"),
  condition: conditionEnum("condition").notNull().default("new"),

  // Location tracking
  locationId: uuid("location_id").references(() => locations.id, { onDelete: "SET NULL" }),
  roomId: text("room_id"),
  rackId: text("rack_id"),
  rackPosition: text("rack_position"),
  rackUnit: text("rack_unit"),

  // Assignment
  assignedToDeviceId: uuid("assigned_to_device_id").references(() => mikrotikDevices.id, { onDelete: "SET NULL" }),
  assignedToEmployee: text("assigned_to_employee"),
  assignedToCustomer: text("assigned_to_customer"),
  assignedAt: timestamp("assigned_at"),

  // Financial information
  purchasePrice: decimal("purchase_price", { precision: 12, scale: 2 }),
  currentValue: decimal("current_value", { precision: 12, scale: 2 }),
  depreciationMethod: text("depreciation_method"), // straight_line, declining_balance
  depreciationYears: integer("depreciation_years"),
  warrantyExpiry: timestamp("warranty_expiry"),
  maintenanceContract: text("maintenance_contract"),
  maintenanceExpiry: timestamp("maintenance_expiry"),

  // Supplier information
  supplier: text("supplier"),
  supplierPartNumber: text("supplier_part_number"),
  purchaseDate: date("purchase_date"),
  purchaseOrder: text("purchase_order"),
  invoiceNumber: text("invoice_number"),

  // Inventory management
  minStockLevel: integer("min_stock_level"),
  maxStockLevel: integer("max_stock_level"),
  reorderPoint: integer("reorder_point"),
  reorderQuantity: integer("reorder_quantity"),
  leadTimeDays: integer("lead_time_days"),

  // Technical specifications
  technicalSpecs: jsonb("technical_specs"), // JSON object with technical specifications
  capabilities: text("capabilities").array(), // Array of capabilities
  limitations: text("limitations").array(), // Array of limitations
  compatibility: text("compatibility").array(), // Array of compatible items

  // Network equipment specific
  ipAddress: text("ip_address"),
  macAddress: text("mac_address"),
  ports: integer("ports"),
  portsConfiguration: jsonb("ports_configuration"),
  powerConsumption: integer("power_consumption"), // in watts
  operatingTemperature: text("operating_temperature"), // temperature range

  // Software and licensing
  softwareVersion: text("software_version"),
  licenseKey: text("license_key"),
  licenseExpiry: timestamp("license_expiry"),
  licenseType: text("license_type"), // perpetual, subscription, trial

  // Physical characteristics
  weight: decimal("weight", { precision: 8, scale: 2 }), // in kg
  dimensions: jsonb("dimensions"), // { length, width, height, unit }
  color: text("color"),
  material: text("material"),

  // Usage tracking
  totalUsageHours: integer("total_usage_hours").default(0),
  lastUsedAt: timestamp("last_used_at"),
  usageHistory: jsonb("usage_history"), // Array of usage records

  // Maintenance and repair
  lastMaintenanceAt: timestamp("last_maintenance_at"),
  nextMaintenanceDue: timestamp("next_maintenance_due"),
  maintenanceNotes: text("maintenance_notes"),
  repairHistory: jsonb("repair_history"), // Array of repair records

  // Quality control
  qualityChecks: jsonb("quality_checks"), // Array of quality check records
  inspectionDue: timestamp("inspection_due"),
  certifiedBy: text("certified_by"),
  certificationDate: date("certification_date"),

  // Documentation
  manualUrl: text("manual_url"),
  datasheetUrl: text("datasheet_url"),
  supportUrl: text("support_url"),
  photos: text("photos").array(), // Array of photo URLs
  documents: text("documents").array(), // Array of document URLs

  // Additional data
  tags: text("tags").array(), // Array of tags for categorization
  customFields: jsonb("custom_fields"), // Custom fields specific to item type
  notes: text("notes"),
  internalNotes: text("internalNotes"),

  // Barcodes and QR codes
  barcode: text("barcode"),
  qrCode: text("qr_code"),

  // Metadata
  createdBy: text("created_by"), // Employee ID
  updatedBy: text("updated_by"), // Employee ID
  importedAt: timestamp("imported_at"),
  importSource: text("import_source"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  firstSeenAt: timestamp("first_seen_at"),

  // Soft delete
  deletedAt: timestamp("deleted_at"),
});

// Inventory transactions
export const inventoryTransactions = pgTable("inventory_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  itemId: uuid("item_id").references(() => inventoryItems.id, { onDelete: "CASCADE" }).notNull(),

  // Transaction details
  transactionType: text("transaction_type").notNull(), // purchase, sale, assign, return, dispose, etc.
  quantity: integer("quantity").notNull(),
  unitCost: decimal("unit_cost", { precision: 12, scale: 2 }),
  totalCost: decimal("total_cost", { precision: 12, scale: 2 }),

  // Related entities
  locationId: uuid("location_id").references(() => locations.id, { onDelete: "SET NULL" }),
  deviceId: uuid("device_id").references(() => mikrotikDevices.id, { onDelete: "SET NULL" }),
  employeeId: text("employee_id"),
  customerId: text("customer_id"),
  orderId: text("order_id"),
  invoiceId: text("invoice_id"),

  // Reference information
  referenceNumber: text("reference_number"),
  referenceType: text("reference_type"), // purchase_order, work_order, etc.

  // Status and approval
  status: text("status").notNull().default("pending"), // pending, approved, completed, cancelled
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at"),

  // Reason and notes
  reason: text("reason").notNull(),
  notes: text("notes"),
  attachments: text("attachments").array(), // Array of document URLs

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// Inventory audits
export const inventoryAudits = pgTable("inventory_audits", {
  id: uuid("id").primaryKey().defaultRandom(),
  itemId: uuid("item_id").references(() => inventoryItems.id, { onDelete: "CASCADE" }).notNull(),

  // Audit details
  auditType: text("audit_type").notNull(), // physical_count, cycle_count, annual, etc.
  auditDate: date("audit_date").notNull(),
  auditorId: text("auditor_id").notNull(),

  // Counts
  systemCount: integer("system_count").notNull(),
  actualCount: integer("actual_count").notNull(),
  variance: integer("variance").notNull(),
  varianceValue: decimal("variance_value", { precision: 12, scale: 2 }),

  // Location and condition
  actualLocationId: uuid("actual_location_id").references(() => locations.id, { onDelete: "SET NULL" }),
  actualCondition: conditionEnum("actual_condition"),
  actualStatus: itemStatusEnum("actual_status"),

  // Findings
  findings: text("findings"),
  recommendations: text("recommendations"),
  correctiveActions: text("corrective_actions"),

  // Approval
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  isApproved: boolean("is_approved").default(false),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Inventory alerts
export const inventoryAlerts = pgTable("inventory_alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  itemId: uuid("item_id").references(() => inventoryItems.id, { onDelete: "CASCADE" }).notNull(),

  // Alert details
  alertType: text("alert_type").notNull(), // low_stock, warranty_expiry, maintenance_due, etc.
  severity: text("severity").notNull(), // low, medium, high, critical
  title: text("title").notNull(),
  message: text("message").notNull(),

  // Thresholds and triggers
  thresholdValue: decimal("threshold_value", { precision: 12, scale: 2 }),
  currentValue: decimal("current_value", { precision: 12, scale: 2 }),
  triggerDate: date("trigger_date"),

  // Status
  status: text("status").notNull().default("active"), // active, acknowledged, resolved, dismissed
  acknowledgedBy: text("acknowledged_by"),
  acknowledgedAt: timestamp("acknowledged_at"),
  resolvedBy: text("resolved_by"),
  resolvedAt: timestamp("resolved_at"),
  resolutionNotes: text("resolution_notes"),

  // Notifications
  notificationsSent: integer("notifications_sent").default(0),
  lastNotificationAt: timestamp("last_notification_at"),
  nextNotificationAt: timestamp("next_notification_at"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});

export type InventoryCategory = typeof inventoryCategories.$inferSelect;
export type NewInventoryCategory = typeof inventoryCategories.$inferInsert;
export type InventoryItem = typeof inventoryItems.$inferSelect;
export type NewInventoryItem = typeof inventoryItems.$inferInsert;
export type InventoryTransaction = typeof inventoryTransactions.$inferSelect;
export type NewInventoryTransaction = typeof inventoryTransactions.$inferInsert;
export type InventoryAudit = typeof inventoryAudits.$inferSelect;
export type NewInventoryAudit = typeof inventoryAudits.$inferInsert;
export type InventoryAlert = typeof inventoryAlerts.$inferSelect;
export type NewInventoryAlert = typeof inventoryAlerts.$inferInsert;