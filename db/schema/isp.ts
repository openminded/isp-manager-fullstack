import {
    pgTable,
    text,
    integer,
    decimal,
    timestamp,
    boolean,
    pgEnum,
    primaryKey,
    index
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./auth";

// Enums for various statuses and types
export const clientStatusEnum = pgEnum("client_status", ["active", "inactive", "suspended", "pending"]);
export const employeeRoleEnum = pgEnum("employee_role", ["admin", "technician", "sales", "support"]);
export const employeeStatusEnum = pgEnum("employee_status", ["active", "inactive", "on_leave"]);
export const inventoryCategoryEnum = pgEnum("inventory_category", [
    "router",
    "cable",
    "antenna",
    "connector",
    "power_supply",
    "network_card",
    "other"
]);
export const inventoryStatusEnum = pgEnum("inventory_status", ["in_stock", "deployed", "maintenance", "retired"]);

// Bandwidth Plans Table
export const bandwidthPlans = pgTable("bandwidth_plans", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    downloadSpeed: integer("download_speed").notNull(), // in Mbps
    uploadSpeed: integer("upload_speed").notNull(), // in Mbps
    price: decimal("price", { precision: 10, scale: 2 }).notNull(), // monthly price
    description: text("description"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
    nameIdx: index("bandwidth_plans_name_idx").on(table.name),
    activeIdx: index("bandwidth_plans_active_idx").on(table.is_active),
}));

// Clients Table
export const clients = pgTable("clients", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    phone: text("phone").notNull(),
    address: text("address").notNull(),
    pppoeUsername: text("pppoe_username").notNull().unique(),
    pppoePassword: text("pppoe_password").notNull(),
    bandwidthPlanId: text("bandwidth_plan_id").notNull().references(() => bandwidthPlans.id, { onDelete: "restrict" }),
    status: clientStatusEnum("status").notNull().default("pending"),
    installationDate: timestamp("installation_date"),
    lastBillingDate: timestamp("last_billing_date"),
    nextBillingDate: timestamp("next_billing_date"),
    notes: text("notes"),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
    emailIdx: index("clients_email_idx").on(table.email),
    pppoeUsernameIdx: index("clients_pppoe_username_idx").on(table.pppoeUsername),
    statusIdx: index("clients_status_idx").on(table.status),
    bandwidthPlanIdx: index("clients_bandwidth_plan_idx").on(table.bandwidthPlanId),
    nextBillingIdx: index("clients_next_billing_idx").on(table.nextBillingDate),
}));

// Employees Table
export const employees = pgTable("employees", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").unique().references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    phone: text("phone").notNull(),
    role: employeeRoleEnum("role").notNull().default("technician"),
    department: text("department").notNull(),
    hireDate: timestamp("hire_date").notNull(),
    status: employeeStatusEnum("status").notNull().default("active"),
    salary: decimal("salary", { precision: 10, scale: 2 }),
    address: text("address"),
    emergencyContact: text("emergency_contact"),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
    emailIdx: index("employees_email_idx").on(table.email),
    roleIdx: index("employees_role_idx").on(table.role),
    statusIdx: index("employees_status_idx").on(table.status),
    departmentIdx: index("employees_department_idx").on(table.department),
    userIdIdx: index("employees_user_id_idx").on(table.userId),
}));

// Inventory Items Table
export const inventoryItems = pgTable("inventory_items", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    category: inventoryCategoryEnum("category").notNull(),
    description: text("description"),
    quantity: integer("quantity").notNull().default(1),
    unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
    supplier: text("supplier").notNull(),
    model: text("model"),
    serialNumber: text("serial_number").unique(),
    purchaseDate: timestamp("purchase_date").notNull(),
    warrantyExpiry: timestamp("warranty_expiry"),
    status: inventoryStatusEnum("status").notNull().default("in_stock"),
    location: text("location").notNull(),
    assignedToClientId: text("assigned_to_client_id").references(() => clients.id, { onDelete: "set null" }),
    notes: text("notes"),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
    nameIdx: index("inventory_items_name_idx").on(table.name),
    categoryIdx: index("inventory_items_category_idx").on(table.category),
    statusIdx: index("inventory_items_status_idx").on(table.status),
    supplierIdx: index("inventory_items_supplier_idx").on(table.supplier),
    serialNumberIdx: index("inventory_items_serial_number_idx").on(table.serialNumber),
    assignedToClientIdx: index("inventory_items_assigned_to_client_idx").on(table.assignedToClientId),
}));

// Relations
export const bandwidthPlansRelations = relations(bandwidthPlans, ({ many }) => ({
    clients: many(clients),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
    bandwidthPlan: one(bandwidthPlans, {
        fields: [clients.bandwidthPlanId],
        references: [bandwidthPlans.id],
    }),
    assignedInventory: many(inventoryItems),
    creator: one(user, {
        fields: [clients.createdBy],
        references: [user.id],
    }),
}));

export const employeesRelations = relations(employees, ({ one }) => ({
    user: one(user, {
        fields: [employees.userId],
        references: [user.id],
    }),
}));

export const inventoryItemsRelations = relations(inventoryItems, ({ one }) => ({
    assignedClient: one(clients, {
        fields: [inventoryItems.assignedToClientId],
        references: [clients.id],
    }),
    creator: one(user, {
        fields: [inventoryItems.createdBy],
        references: [user.id],
    }),
}));

// TypeScript types for the schemas
export type BandwidthPlan = typeof bandwidthPlans.$inferSelect;
export type NewBandwidthPlan = typeof bandwidthPlans.$inferInsert;
export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;
export type InventoryItem = typeof inventoryItems.$inferSelect;
export type NewInventoryItem = typeof inventoryItems.$inferInsert;

// Extended types with relations
export type ClientWithBandwidthPlan = Client & {
    bandwidthPlan: BandwidthPlan;
    assignedInventory: InventoryItem[];
};

export type InventoryItemWithClient = InventoryItem & {
    assignedClient: Client | null;
};

export type EmployeeWithUser = Employee & {
    user: {
        id: string;
        email: string;
        name: string | null;
    } | null;
};