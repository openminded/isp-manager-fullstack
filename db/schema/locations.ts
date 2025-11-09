/**
 * Locations Schema
 *
 * Defines the database schema for managing ISP locations and sites
 */

import {
  pgTable,
  text,
  timestamp,
  boolean,
  pgEnum,
  uuid
} from "drizzle-orm/pg-core";

// Location type enum
export const locationTypeEnum = pgEnum("location_type", [
  "main_office",
  "branch_office",
  "data_center",
  "pop_site",
  "customer_site",
  "warehouse",
  "other"
]);

// Location status enum
export const locationStatusEnum = pgEnum("location_status", [
  "active",
  "inactive",
  "maintenance",
  "planned",
  "decommissioned"
]);

export const locations = pgTable("locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(), // Location code like "OFFICE-001"
  type: locationTypeEnum("type").notNull().default("branch_office"),
  status: locationStatusEnum("status").notNull().default("active"),

  // Address information
  address: text("address"),
  address2: text("address2"),
  city: text("city").notNull(),
  state: text("state"),
  postalCode: text("postal_code"),
  country: text("country").notNull().default("US"),

  // Contact information
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),

  // Geographic information
  latitude: text("latitude"),
  longitude: text("longitude"),
  timezone: text("timezone").default("America/New_York"),

  // Network information
  networkRange: text("network_range"), // IP range for this location
  vlanRange: text("vlan_range"), // VLAN range allocation

  // Additional details
  description: text("description"),
  notes: text("notes"),

  // Management
  isMainLocation: boolean("is_main_location").default(false),
  managedBy: text("managed_by"), // Employee ID who manages this location

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),

  // Soft delete
  deletedAt: timestamp("deleted_at"),
});

export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;