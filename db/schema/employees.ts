/**
 * Employees Schema
 *
 * Defines the database schema for managing ISP employees and their information
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
import { locations } from "./locations";

// Employee type enum
export const employeeTypeEnum = pgEnum("employee_type", [
  "full_time",
  "part_time",
  "contract",
  "intern",
  "volunteer",
  "other"
]);

// Employee status enum
export const employeeStatusEnum = pgEnum("employee_status", [
  "active",
  "inactive",
  "on_leave",
  "terminated",
  "pending"
]);

// Department enum
export const departmentEnum = pgEnum("department", [
  "management",
  "technical",
  "customer_service",
  "sales",
  "finance",
  "administration",
  "operations",
  "maintenance",
  "other"
]);

// Role enum
export const roleEnum = pgEnum("role", [
  "admin",
  "manager",
  "supervisor",
  "technician",
  "customer_service_rep",
  "sales_rep",
  "accountant",
  "installer",
  "network_engineer",
  "support_specialist",
  "other"
]);

export const employees = pgTable("employees", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeNumber: text("employee_number").unique(),
  userId: text("user_id").unique(), // Reference to auth user table

  // Personal information
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  middleName: text("middle_name"),
  displayName: text("display_name"), // Calculated display name
  preferredName: text("preferred_name"),

  // Employee details
  type: employeeTypeEnum("type").notNull().default("full_time"),
  status: employeeStatusEnum("status").notNull().default("pending"),
  department: departmentEnum("department").notNull(),
  role: roleEnum("role").notNull(),
  level: text("level"), // Seniority level like "Senior", "Junior", etc.
  title: text("title").notNull(),

  // Contact information
  workEmail: text("work_email").unique(),
  personalEmail: text("personal_email"),
  workPhone: text("work_phone"),
  mobilePhone: text("mobile_phone"),
  homePhone: text("home_phone"),
  emergencyContact: jsonb("emergency_contact"), // Emergency contact details

  // Address information
  workAddress: text("work_address"),
  workLocationId: uuid("work_location_id").references(() => locations.id, { onDelete: "SET NULL" }),
  homeAddress: text("home_address"),
  homeCity: text("home_city"),
  homeState: text("home_state"),
  homePostalCode: text("home_postal_code"),
  homeCountry: text("home_country"),

  // Employment details
  hireDate: date("hire_date").notNull(),
  terminationDate: date("termination_date"),
  probationEnds: date("probation_ends"),
  contractEnds: date("contract_ends"),

  // Reporting structure
  reportsTo: uuid("reports_to"), // Employee ID of supervisor
  manages: text("manages").array(), // Array of employee IDs they manage

  // Compensation
  salary: decimal("salary", { precision: 12, scale: 2 }),
  hourlyRate: decimal("hourly_rate", { precision: 8, scale: 2 }),
  overtimeRate: decimal("overtime_rate", { precision: 8, scale: 2 }),
  currency: text("currency").notNull().default("USD"),
  payFrequency: text("pay_frequency").notNull().default("monthly"), // weekly, biweekly, monthly

  // Benefits
  benefitsPackage: text("benefits_package"),
  healthInsurance: boolean("health_insurance").default(false),
  dentalInsurance: boolean("dental_insurance").default(false),
  visionInsurance: boolean("vision_insurance").default(false),
  retirementPlan: boolean("retirement_plan").default(false),
  lifeInsurance: boolean("life_insurance").default(false),

  // Work schedule
  workSchedule: jsonb("work_schedule"), // JSON object with schedule details
  workHours: text("work_hours"), // "9:00-17:00"
  workDays: text("work_days").array(), // ["Monday", "Tuesday", etc.]
  timeZone: text("time_zone").default("America/New_York"),
  remoteWorkAllowed: boolean("remote_work_allowed").default(false),
  remoteWorkDays: integer("remote_work_days").default(0),

  // Skills and qualifications
  skills: text("skills").array(), // Array of skills
  certifications: jsonb("certifications"), // Array of certification objects
  education: jsonb("education"), // Array of education records
  experience: jsonb("experience"), // Array of work experience records

  // Technical permissions and access
  technicalLevel: text("technical_level"), // Beginner, Intermediate, Advanced, Expert
  mikrotikCertification: text("mikrotik_certification"), // MTCNA, MTCRE, etc.
  networkAccess: boolean("network_access").default(false),
  canAccessDevices: text("can_access_devices").array(), // Array of device IDs they can access
  canManageCustomers: boolean("can_manage_customers").default(false),
  canManageInventory: boolean("can_manage_inventory").default(false),
  canManageFinance: boolean("can_manage_finance").default(false),
  canViewReports: boolean("can_view_reports").default(true),

  // Location and service area
  assignedLocations: text("assigned_locations").array(), // Array of location IDs
  serviceArea: text("service_area"), // Geographic area they serve
  travelRadius: integer("travel_radius"), // Kilometers

  // Performance and metrics
  performanceRating: text("performance_rating"), // Excellent, Good, Average, Poor
  lastReviewDate: date("last_review_date"),
  nextReviewDate: date("next_review_date"),
  kpis: jsonb("kpis"), // Key Performance Indicators
  targets: jsonb("targets"), // Performance targets
  achievements: jsonb("achievements"), // Achievement records

  // Time off and availability
  vacationDaysPerYear: integer("vacation_days_per_year").default(0),
  sickDaysPerYear: integer("sick_days_per_year").default(0),
  currentVacationBalance: integer("current_vacation_balance").default(0),
  currentSickBalance: integer("current_sick_balance").default(0),
  availableForOvertime: boolean("available_for_overtime").default(true),

  // Equipment assigned
  assignedEquipment: jsonb("assigned_equipment"), // Array of equipment items
  companyVehicle: text("company_vehicle"),
  toolsAndSupplies: jsonb("tools_and_supplies"),

  // Training and development
  trainingRequired: jsonb("training_required"), // Array of required training
  trainingCompleted: jsonb("training_completed"), // Array of completed training
  trainingBudget: decimal("training_budget", { precision: 10, scale: 2 }),
  certificationsRenewal: jsonb("certifications_renewal"), // Certification renewal dates

  // Security and compliance
  backgroundCheckDate: date("background_check_date"),
  backgroundCheckResult: text("background_check_result"),
  ndaSigned: boolean("nda_signed").default(false),
  securityClearance: text("security_clearance"),

  // Communication preferences
  preferredCommunication: text("preferred_communication").default("email"),
  emailNotifications: boolean("email_notifications").default(true),
  smsNotifications: boolean("sms_notifications").default(false),
  language: text("language").default("en"),

  // Additional information
  bio: text("bio"),
  interests: text("interests").array(),
  notes: text("notes"),
  internalNotes: text("internal_notes"),
  tags: text("tags").array(),

  // Social profiles
  linkedinProfile: text("linkedin_profile"),
  githubProfile: text("github_profile"),
  otherProfiles: jsonb("other_profiles"),

  // System information
  lastLoginAt: timestamp("last_login_at"),
  loginCount: integer("login_count").default(0),
  passwordChangedAt: timestamp("password_changed_at"),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),

  // Status and flags
  isOnCall: boolean("is_on_call").default(false),
  isTraveling: boolean("is_traveling").default(false),
  isAvailableForEmergency: boolean("is_available_for_emergency").default(false),
  isActive: boolean("is_active").default(true),

  // Metadata
  customFields: jsonb("custom_fields"),
  metadata: jsonb("metadata"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: text("created_by"), // Employee ID who created this record
  updatedBy: text("updated_by"), // Employee ID who last updated this record

  // Soft delete
  deletedAt: timestamp("deleted_at"),
});

// Employee documents
export const employeeDocuments = pgTable("employee_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id").references(() => employees.id, { onDelete: "CASCADE" }).notNull(),

  name: text("name").notNull(),
  type: text("type").notNull(), // contract, resume, certification, background_check, etc.
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),

  // Document details
  description: text("description"),
  issuer: text("issuer"),
  issueDate: date("issue_date"),
  expiryDate: date("expiry_date"),
  documentNumber: text("document_number"),

  // Security and access
  isConfidential: boolean("is_confidential").default(false),
  accessLevel: text("access_level").default("employee"), // employee, manager, hr, admin
  canDownload: boolean("can_download").default(true),

  // Status
  status: text("status").notNull().default("active"), // active, expired, revoked, pending
  verified: boolean("verified").default(false),
  verifiedBy: text("verified_by"), // Employee ID who verified
  verifiedAt: timestamp("verified_at"),

  // Notifications
  reminderDate: date("reminder_date"), // For expiring documents
  remindersSent: integer("reminders_sent").default(0),

  // Metadata
  tags: text("tags").array(),
  uploadedBy: text("uploaded_by"), // Employee ID

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Employee time tracking
export const employeeTimeEntries = pgTable("employee_time_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id").references(() => employees.id, { onDelete: "CASCADE" }).notNull(),

  // Time period
  clockInAt: timestamp("clock_in_at").notNull(),
  clockOutAt: timestamp("clock_out_at"),
  duration: integer("duration"), // Duration in minutes
  breakDuration: integer("break_duration").default(0), // Break duration in minutes

  // Work details
  workType: text("work_type").notNull(), // regular, overtime, holiday, sick, vacation
  projectId: text("project_id"),
  taskId: text("task_id"),
  locationId: uuid("location_id").references(() => locations.id, { onDelete: "SET NULL" }),

  // Description
  description: text("description"),
  notes: text("notes"),

  // Approval
  approvedBy: text("approved_by"), // Employee ID
  approvedAt: timestamp("approved_at"),
  rejected: boolean("rejected").default(false),
  rejectionReason: text("rejection_reason"),

  // Payroll
  billable: boolean("billable").default(false),
  hourlyRate: decimal("hourly_rate", { precision: 8, scale: 2 }),
  totalPay: decimal("total_pay", { precision: 10, scale: 2 }),
  includedInPayroll: boolean("included_in_payroll").default(true),

  // GPS and location tracking (for field workers)
  clockInLocation: jsonb("clock_in_location"), // GPS coordinates
  clockOutLocation: jsonb("clock_out_location"), // GPS coordinates

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Employee performance reviews
export const employeePerformanceReviews = pgTable("employee_performance_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id").references(() => employees.id, { onDelete: "CASCADE" }).notNull(),

  // Review details
  reviewPeriod: text("review_period").notNull(), // Q1-2024, Annual-2024, etc.
  reviewType: text("review_type").notNull(), // quarterly, annual, probation, special
  reviewDate: date("review_date").notNull(),
  reviewerId: uuid("reviewer_id").references(() => employees.id, { onDelete: "SET NULL" }),

  // Ratings
  overallRating: integer("overall_rating"), // 1-5 scale
  performanceRating: integer("performance_rating"), // 1-5 scale
  attitudeRating: integer("attitude_rating"), // 1-5 scale
  teamworkRating: integer("teamwork_rating"), // 1-5 scale
  communicationRating: integer("communication_rating"), // 1-5 scale

  // Goals and achievements
  goals: jsonb("goals"), // Array of goals
  achievements: jsonb("achievements"), // Array of achievements
  areasForImprovement: jsonb("areas_for_improvement"), // Array of improvement areas

  // Feedback
  strengths: text("strengths"),
  weaknesses: text("weaknesses"),
  employeeComments: text("employee_comments"),
  reviewerComments: text("reviewer_comments"),
  actionPlan: text("action_plan"),

  // Outcomes
  salaryIncrease: decimal("salary_increase", { precision: 12, scale: 2 }),
  bonus: decimal("bonus", { precision: 10, scale: 2 }),
  promotion: text("promotion"),
  additionalTraining: jsonb("additional_training"),

  // Status
  status: text("status").notNull().default("draft"), // draft, submitted, approved, rejected
  employeeAcknowledged: boolean("employee_acknowledged").default(false),
  acknowledgedAt: timestamp("acknowledged_at"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;
export type EmployeeDocument = typeof employeeDocuments.$inferSelect;
export type NewEmployeeDocument = typeof employeeDocuments.$inferInsert;
export type EmployeeTimeEntry = typeof employeeTimeEntries.$inferSelect;
export type NewEmployeeTimeEntry = typeof employeeTimeEntries.$inferInsert;
export type EmployeePerformanceReview = typeof employeePerformanceReviews.$inferSelect;
export type NewEmployeePerformanceReview = typeof employeePerformanceReviews.$inferInsert;