/**
 * MikroTik Devices Schema
 *
 * Defines the database schema for managing MikroTik RouterOS devices
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
  jsonb
} from "drizzle-orm/pg-core";
import { locations } from "./locations";

// Device type enum
export const deviceTypeEnum = pgEnum("device_type", [
  "router",
  "switch",
  "wireless_ap",
  "point_to_point",
  "firewall",
  "load_balancer",
  "other"
]);

// Device status enum
export const deviceStatusEnum = pgEnum("device_status", [
  "online",
  "offline",
  "maintenance",
  "error",
  "unknown"
]);

// Connection type enum
export const connectionTypeEnum = pgEnum("connection_type", [
  "wired",
  "wireless",
  "fiber",
  "vpn",
  "cellular"
]);

export const mikrotikDevices = pgTable("mikrotik_devices", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  hostname: text("hostname").notNull().unique(),

  // Physical information
  serialNumber: text("serial_number").unique(),
  model: text("model"),
  firmwareVersion: text("firmware_version"),
  licenseLevel: text("license_level"),

  // Network configuration
  ipAddress: text("ip_address").notNull(),
  subnetMask: text("subnet_mask"),
  gateway: text("gateway"),
  primaryDns: text("primary_dns"),
  secondaryDns: text("secondary_dns"),

  // API configuration
  apiPort: integer("api_port").default(8728),
  apiUsername: text("api_username").notNull(),
  apiPassword: text("api_password").notNull(), // This should be encrypted
  useSsl: boolean("use_ssl").default(true),

  // Device type and status
  type: deviceTypeEnum("type").notNull().default("router"),
  status: deviceStatusEnum("status").notNull().default("unknown"),
  connectionType: connectionTypeEnum("connection_type").default("wired"),

  // Location assignment
  locationId: uuid("location_id").references(() => locations.id, { onDelete: "SET NULL" }),
  rackPosition: text("rack_position"),
  rackUnit: text("rack_unit"),

  // Performance metrics
  cpuLoad: decimal("cpu_load", { precision: 5, scale: 2 }), // percentage
  memoryUsage: decimal("memory_usage", { precision: 5, scale: 2 }), // percentage
  diskUsage: decimal("disk_usage", { precision: 5, scale: 2 }), // percentage
  temperature: decimal("temperature", { precision: 5, scale: 2 }), // celsius
  uptime: text("uptime"), // formatted string like "10d 5h 30m"

  // Configuration
  configBackup: text("config_backup"), // Path to backup file
  configTemplate: text("config_template"), // Template name used

  // Monitoring
  isMonitored: boolean("is_monitored").default(true),
  monitoringInterval: integer("monitoring_interval").default(300), // seconds
  alertThresholds: jsonb("alert_thresholds"), // JSON object with alert thresholds

  // Management
  isManaged: boolean("is_managed").default(true),
  managedBy: text("managed_by"), // Employee ID
  lastBackup: timestamp("last_backup"),
  lastConfigUpdate: timestamp("last_config_update"),
  lastReboot: timestamp("last_reboot"),

  // PPPoE information
  pppoeUsersCount: integer("pppoe_users_count").default(0),
  maxPppoeUsers: integer("max_pppoe_users"),
  pppoeEnabled: boolean("pppoe_enabled").default(true),

  // Additional information
  description: text("description"),
  notes: text("notes"),
  tags: text("tags").array(), // Array of tags for categorization

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSeen: timestamp("last_seen"), // Last time device was online

  // Soft delete
  deletedAt: timestamp("deleted_at"),
});

// Device connection history
export const deviceConnectionHistory = pgTable("device_connection_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  deviceId: uuid("device_id").references(() => mikrotikDevices.id, { onDelete: "CASCADE" }).notNull(),

  status: deviceStatusEnum("status").notNull(),
  connectedAt: timestamp("connected_at").defaultNow().notNull(),
  disconnectedAt: timestamp("disconnected_at"),
  duration: integer("duration"), // Connection duration in seconds

  // Performance snapshot
  cpuLoad: decimal("cpu_load", { precision: 5, scale: 2 }),
  memoryUsage: decimal("memory_usage", { precision: 5, scale: 2 }),
  temperature: decimal("temperature", { precision: 5, scale: 2 }),

  // Error information
  errorMessage: text("error_message"),
  errorCode: text("error_code"),

  // Additional data
  metadata: jsonb("metadata"), // Additional connection data
});

// Device interfaces
export const deviceInterfaces = pgTable("device_interfaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  deviceId: uuid("device_id").references(() => mikrotikDevices.id, { onDelete: "CASCADE" }).notNull(),

  name: text("name").notNull(), // Interface name like "ether1", "wlan1"
  type: text("type").notNull(), // Interface type like "ether", "wlan", "bridge"
  status: text("status").notNull(), // "up", "down", "running"

  // Network configuration
  ipAddress: text("ip_address"),
  subnetMask: text("subnet_mask"),
  gateway: text("gateway"),
  macAddress: text("mac_address"),
  mtu: integer("mtu").default(1500),

  // Traffic statistics
  rxBytes: integer("rx_bytes").default(0),
  txBytes: integer("tx_bytes").default(0),
  rxPackets: integer("rx_packets").default(0),
  txPackets: integer("tx_packets").default(0),
  rxErrors: integer("rx_errors").default(0),
  txErrors: integer("tx_errors").default(0),

  // Wireless specific
  ssid: text("ssid"),
  frequency: text("frequency"),
  channel: text("channel"),
  signalStrength: integer("signal_strength"), // dBm
  noiseLevel: integer("noise_level"), // dBm

  // Additional information
  description: text("description"),
  comment: text("comment"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastStatsUpdate: timestamp("last_stats_update"),
});

export type MikrotikDevice = typeof mikrotikDevices.$inferSelect;
export type NewMikrotikDevice = typeof mikrotikDevices.$inferInsert;
export type DeviceConnectionHistory = typeof deviceConnectionHistory.$inferSelect;
export type NewDeviceConnectionHistory = typeof deviceConnectionHistory.$inferInsert;
export type DeviceInterface = typeof deviceInterfaces.$inferSelect;
export type NewDeviceInterface = typeof deviceInterfaces.$inferInsert;