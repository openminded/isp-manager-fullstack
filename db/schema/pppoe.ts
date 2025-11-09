/**
 * PPPoE Schema
 *
 * Defines the database schema for managing PPPoE users, profiles, and connections
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
import { mikrotikDevices } from "./devices";
import { customers } from "./customers";

// Service type enum
export const serviceTypeEnum = pgEnum("service_type", [
  "pppoe",
  "ppptp",
  "l2tp",
  "sstp",
  "openvpn",
  "wireguard",
  "other"
]);

// Connection status enum
export const connectionStatusEnum = pgEnum("connection_status", [
  "connected",
  "disconnected",
  "connecting",
  "error",
  "disabled"
]);

// Authentication status enum
export const authStatusEnum = pgEnum("auth_status", [
  "authenticated",
  "failed",
  "pending",
  "blocked"
]);

export const bandwidthProfiles = pgTable("bandwidth_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),

  // Bandwidth limits
  uploadLimit: decimal("upload_limit", { precision: 12, scale: 2 }), // in bps
  downloadLimit: decimal("download_limit", { precision: 12, scale: 2 }), // in bps
  burstLimit: decimal("burst_limit", { precision: 12, scale: 2 }),
  burstThreshold: decimal("burst_threshold", { precision: 12, scale: 2 }),
  burstTime: integer("burst_time"), // in seconds

  // QoS settings
  priority: integer("priority").default(8),
  maxLatency: integer("max_latency"), // in milliseconds
  packetLoss: decimal("packet_loss", { precision: 5, scale: 2 }), // percentage

  // Rate limiting settings
  rateLimitRx: text("rate_limit_rx"), // MikroTik format like "10M"
  rateLimitTx: text("rate_limit_tx"), // MikroTik format like "5M"

  // Fair queue settings
  queueType: text("queue_type").default("pfifo"),
  fairQueueLimit: integer("fair_queue_limit"),

  // Pricing
  monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }),
  setupFee: decimal("setup_fee", { precision: 10, scale: 2 }).default("0.00"),
  dataCap: integer("data_cap"), // Monthly data cap in GB
  overageRate: decimal("overage_rate", { precision: 10, scale: 2 }), // Per GB overage

  // Profile type and category
  category: text("category"), // residential, business, wholesale
  isBusinessClass: boolean("is_business_class").default(false),
  isSymmetrical: boolean("is_symmetrical").default(false),

  // Availability
  availableForNewCustomers: boolean("available_for_new_customers").default(true),
  availableForUpgrades: boolean("available_for_upgrades").default(true),

  // Device synchronization
  mikrotikProfileName: text("mikrotik_profile_name"), // Name on RouterOS device
  syncedDevices: text("synced_devices").array(), // Array of device IDs this profile is synced to

  // Additional settings
  parentProfileId: uuid("parent_profile_id"),
  restrictions: jsonb("restrictions"), // JSON object with various restrictions
  features: text("features").array(), // Array of features like "static_ip", "port_forwarding"

  // Metadata
  description: text("description"),
  notes: text("notes"),
  tags: text("tags").array(),

  // Status
  isActive: boolean("is_active").default(true),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),

  // Soft delete
  deletedAt: timestamp("deleted_at"),
});

export const pppoeUsers = pgTable("pppoe_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  mikrotikUserId: text("mikrotik_user_id").unique(), // RouterOS user ID (*1, *2, etc.)

  // Authentication
  username: text("username").notNull().unique(),
  password: text("password").notNull(), // This should be encrypted
  serviceType: serviceTypeEnum("service_type").notNull().default("pppoe"),

  // Customer assignment
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "CASCADE" }),
  customerName: text("customer_name"), // Denormalized for easy access

  // Device assignment
  deviceId: uuid("device_id").references(() => mikrotikDevices.id, { onDelete: "SET NULL" }),

  // Bandwidth profile
  profileId: uuid("profile_id").references(() => bandwidthProfiles.id, { onDelete: "SET NULL" }),
  profileName: text("profile_name"), // Denormalized profile name

  // Connection settings
  callerId: text("caller_id"), // MAC address or other identifier
  localAddress: text("local_address"), // IP address assigned to user
  remoteAddress: text("remote_address"), // User's IP address
  poolName: text("pool_name"), // IP pool name

  // Status and state
  isActive: boolean("is_active").default(true),
  isDisabled: boolean("is_disabled").default(false),
  isDynamic: boolean("is_dynamic").default(false),
  connectionStatus: connectionStatusEnum("connection_status").default("disconnected"),
  authStatus: authStatusEnum("auth_status").default("pending"),

  // Connection statistics
  totalUptime: integer("total_uptime"), // Total uptime in seconds
  sessionCount: integer("session_count").default(0),
  lastConnectedAt: timestamp("last_connected_at"),
  lastDisconnectedAt: timestamp("last_disconnected_at"),
  currentSessionStart: timestamp("current_session_start"),
  currentSessionDuration: integer("current_session_duration"), // in seconds

  // Data usage statistics
  totalBytesIn: integer("total_bytes_in").default(0),
  totalBytesOut: integer("total_bytes_out").default(0),
  totalBytesIn6: integer("total_bytes_in_6").default(0),
  totalBytesOut6: integer("total_bytes_out_6").default(0),
  currentSessionBytesIn: integer("current_session_bytes_in").default(0),
  currentSessionBytesOut: integer("current_session_bytes_out").default(0),

  // Packet statistics
  totalPacketsIn: integer("total_packets_in").default(0),
  totalPacketsOut: integer("total_packets_out").default(0),
  droppedPacketsIn: integer("dropped_packets_in").default(0),
  droppedPacketsOut: integer("dropped_packets_out").default(0),

  // Limits and quotas
  monthlyDataLimit: integer("monthly_data_limit"), // in GB
  currentMonthUsage: integer("current_month_usage").default(0), // in GB
  dailyTimeLimit: integer("daily_time_limit"), // in seconds
  dailyUsageTime: integer("daily_usage_time").default(0), // in seconds

  // Advanced settings
  routes: text("routes").array(), // Array of static routes
  dnsServers: text("dns_servers").array(), // Array of DNS servers
  winsServers: text("wins_servers").array(), // Array of WINS servers

  // Security settings
  allowedMacs: text("allowed_macs").array(), // Array of allowed MAC addresses
  blockedMacs: text("blocked_macs").array(), // Array of blocked MAC addresses
  maxConcurrentSessions: integer("max_concurrent_sessions").default(1),

  // Billing and pricing
  monthlyFee: decimal("monthly_fee", { precision: 10, scale: 2 }),
  setupFee: decimal("setup_fee", { precision: 10, scale: 2 }).default("0.00"),
  billingDay: integer("billing_day"), // Day of month for billing

  // Synchronization
  lastSyncAt: timestamp("last_sync_at"),
  syncStatus: text("sync_status").default("pending"), // pending, synced, error
  syncError: text("sync_error"),

  // Notes and comments
  comment: text("comment"),
  internalNotes: text("internal_notes"),
  tags: text("tags").array(),

  // Metadata
  createdBy: text("created_by"), // Employee ID who created this user
  updatedBy: text("updated_by"), // Employee ID who last updated this user

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"), // Account expiration

  // Soft delete
  deletedAt: timestamp("deleted_at"),
});

// PPPoE connection sessions (historical)
export const pppoeSessions = pgTable("pppoe_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => pppoeUsers.id, { onDelete: "CASCADE" }).notNull(),
  deviceId: uuid("device_id").references(() => mikrotikDevices.id, { onDelete: "SET NULL" }),

  // Session identification
  sessionId: text("session_id").notNull(),
  sessionName: text("session_name"), // MikroTik session name

  // Timing
  connectedAt: timestamp("connected_at").notNull(),
  disconnectedAt: timestamp("disconnected_at"),
  duration: integer("duration"), // Session duration in seconds

  // Network information
  localAddress: text("local_address"),
  remoteAddress: text("remote_address"),
  callerId: text("caller_id"),
  serviceType: text("service_type"),

  // Data usage
  bytesIn: integer("bytes_in").default(0),
  bytesOut: integer("bytes_out").default(0),
  bytesIn6: integer("bytes_in_6").default(0),
  bytesOut6: integer("bytes_out_6").default(0),

  // Packet usage
  packetsIn: integer("packets_in").default(0),
  packetsOut: integer("packets_out").default(0),
  errorsIn: integer("errors_in").default(0),
  errorsOut: integer("errors_out").default(0),

  // Session termination
  terminationCause: text("termination_cause"), // user_request, timeout, error, etc.
  terminationReason: text("termination_reason"), // Detailed reason

  // Additional data
  sessionData: jsonb("session_data"), // Additional session-specific data

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// PPPoE usage logs (daily aggregated)
export const pppoeUsageLogs = pgTable("pppoe_usage_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => pppoeUsers.id, { onDelete: "CASCADE" }).notNull(),
  deviceId: uuid("device_id").references(() => mikrotikDevices.id, { onDelete: "SET NULL" }),

  // Date
  logDate: date("log_date").notNull(),

  // Daily statistics
  totalUptimeSeconds: integer("total_uptime_seconds").default(0),
  sessionsCount: integer("sessions_count").default(0),
  maxConcurrentSessions: integer("max_concurrent_sessions").default(0),

  // Data usage
  bytesIn: integer("bytes_in").default(0),
  bytesOut: integer("bytes_out").default(0),
  bytesIn6: integer("bytes_in_6").default(0),
  bytesOut6: integer("bytes_out_6").default(0),

  // Packet usage
  packetsIn: integer("packets_in").default(0),
  packetsOut: integer("packets_out").default(0),
  errorsIn: integer("errors_in").default(0),
  errorsOut: integer("errors_out").default(0),

  // Performance metrics
  avgLatency: integer("avg_latency"), // milliseconds
  maxLatency: integer("max_latency"), // milliseconds
  packetLossRate: decimal("packet_loss_rate", { precision: 5, scale: 2 }), // percentage

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),

  // Unique constraint
  uniqueUserDate: text("unique_user_date").unique().notNull(), // user_id-date combination
});

export type BandwidthProfile = typeof bandwidthProfiles.$inferSelect;
export type NewBandwidthProfile = typeof bandwidthProfiles.$inferInsert;
export type PPPoEUser = typeof pppoeUsers.$inferSelect;
export type NewPPPoEUser = typeof pppoeUsers.$inferInsert;
export type PPPoESession = typeof pppoeSessions.$inferSelect;
export type NewPPPoESession = typeof pppoeSessions.$inferInsert;
export type PPPoEUsageLog = typeof pppoeUsageLogs.$inferSelect;
export type NewPPPoEUsageLog = typeof pppoeUsageLogs.$inferInsert;