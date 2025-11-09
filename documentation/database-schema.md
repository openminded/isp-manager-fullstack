# ISP Management Database Schema

This document describes the comprehensive database schema for the ISP Management Application, covering all entities required to manage customers, devices, services, finances, and employees.

## Overview

The database is built using PostgreSQL and Drizzle ORM, providing a robust and scalable foundation for ISP operations. The schema is organized into logical modules:

- **Authentication** - User management and sessions
- **Locations** - Physical sites and facilities
- **Devices** - MikroTik RouterOS equipment
- **Customers** - Customer management and relationships
- **PPPoE** - PPPoE user management and service tracking
- **Inventory** - Equipment and supply management
- **Finance** - Billing, payments, and financial tracking
- **Employees** - Staff management and performance tracking

## Schema Architecture

### Core Design Principles

1. **UUID Primary Keys**: All tables use UUID primary keys for better scalability and security
2. **Soft Deletes**: Important tables include `deletedAt` columns for soft deletion
3. **Audit Trails**: Created/updated timestamps and user tracking for accountability
4. **Type Safety**: Full TypeScript support with Drizzle ORM
5. **Relationships**: Comprehensive foreign key relationships with proper cascade rules
6. **Enums**: Extensive use of enums for data consistency and validation

### Database Features

- **Extensions**: UUID generation via `uuid-ossp` extension
- **Indexes**: Proper indexing for performance on frequently queried columns
- **Constraints**: Foreign key constraints for data integrity
- **Default Values**: Sensible defaults for required fields
- **Validation**: Database-level constraints and enum types

## Table Documentation

### 1. Authentication Tables

#### `user`
User authentication and profile information.

**Key Fields:**
- `id` - UUID primary key
- `name` - Display name
- `email` - Unique email address
- `emailVerified` - Email verification status
- `createdAt` / `updatedAt` - Audit timestamps

**Relationships:**
- One-to-many with `sessions`, `accounts`, `verifications`

#### `session`
User session management for authentication.

**Key Fields:**
- `id` - Session identifier
- `userId` - Foreign key to user
- `expiresAt` - Session expiration
- `token` - Session token

#### `account`
OAuth account linking and credentials.

#### `verification`
Email verification and password reset tokens.

### 2. Location Management

#### `locations`
Physical locations, offices, and data centers.

**Key Fields:**
- `id` - UUID primary key
- `name` - Location name
- `code` - Unique location code
- `type` - Location type (main_office, branch_office, data_center, etc.)
- `status` - Location status (active, inactive, maintenance, etc.)
- `address` - Full address information
- `contact*` - Contact information
- `isMainLocation` - Flag for main office

**Enums:**
- `location_type` - Type of location
- `location_status` - Operational status

**Relationships:**
- One-to-many with devices, customers, employees

### 3. Device Management

#### `mikrotik_devices`
MikroTik RouterOS device inventory and management.

**Key Fields:**
- `id` - UUID primary key
- `name` - Device display name
- `hostname` - Network hostname
- `ipAddress` - Management IP address
- `apiPort` - API port (default 8728)
- `apiUsername` / `apiPassword` - API credentials
- `type` - Device type (router, switch, wireless_ap, etc.)
- `status` - Device status (online, offline, maintenance, etc.)
- `locationId` - Foreign key to locations
- `model` / `firmwareVersion` - Device details
- `pppoeEnabled` - PPPoE service flag
- `maxPppoeUsers` - Maximum PPPoE users supported

**Monitoring Fields:**
- `cpuLoad`, `memoryUsage`, `diskUsage` - Performance metrics
- `uptime` - System uptime
- `lastSeen` - Last online timestamp

**Enums:**
- `device_type` - Type of network device
- `device_status` - Current operational status
- `connection_type` - Connection method

#### `device_connection_history`
Historical connection status and performance data.

#### `device_interfaces`
Network interface configuration and statistics.

### 4. Customer Management

#### `customers`
Customer master data and relationship management.

**Key Fields:**
- `id` - UUID primary key
- `customerCode` - Unique customer identifier
- `firstName` / `lastName` - Customer name
- `companyName` - For business customers
- `type` - Customer type (residential, business, wholesale, etc.)
- `status` - Customer status (active, inactive, suspended, etc.)
- `primaryEmail` / `primaryPhone` - Contact information
- `serviceAddress*` - Service location details
- `billingAddress*` - Billing information
- `locationId` - Service location
- `creditLimit` / `outstandingBalance` - Financial data
- `serviceStartDate` / `contractTermMonths` - Service terms

**Financial Fields:**
- `creditLimit` - Maximum credit amount
- `outstandingBalance` - Current balance
- `paymentMethod` - Preferred payment method
- `autoRenew` - Automatic contract renewal

**Enums:**
- `customer_type` - Type of customer
- `customer_status` - Account status
- `payment_method` - Payment preference

#### `customer_contacts`
Multiple contact persons per customer.

#### `customer_documents`
Document management (contracts, IDs, proof of address).

### 5. PPPoE Service Management

#### `bandwidth_profiles`
Service tier definitions and bandwidth limits.

**Key Fields:**
- `id` - UUID primary key
- `name` - Profile identifier
- `displayName` - Customer-friendly name
- `uploadLimit` / `downloadLimit` - Bandwidth caps (bps)
- `burstLimit` / `burstThreshold` - Burst settings
- `priority` - QoS priority level
- `monthlyPrice` - Service pricing
- `dataCap` - Monthly data limit (GB)
- `category` - Service category (residential, business)
- `mikrotikProfileName` - RouterOS profile name

**Pricing Fields:**
- `monthlyPrice` - Base monthly fee
- `setupFee` - One-time setup cost
- `overageRate` - Per-GB overage charges

#### `pppoe_users`
PPPoE user accounts and service provisioning.

**Key Fields:**
- `id` - UUID primary key
- `mikrotikUserId` - RouterOS user ID
- `username` / `password` - PPP credentials
- `serviceType` - Service type (pppoe, pppptp, l2tp)
- `customerId` - Customer association
- `deviceId` - Router assignment
- `profileId` - Bandwidth profile
- `connectionStatus` - Current connection state
- `authStatus` - Authentication status
- `localAddress` / `remoteAddress` - IP assignment

**Usage Tracking:**
- `totalBytesIn` / `totalBytesOut` - Cumulative usage
- `currentSessionBytes*` - Current session usage
- `sessionCount` - Connection attempts
- `totalUptime` - Total connected time

**Status Fields:**
- `isActive` / `isDisabled` - Account status
- `connectionStatus` - Real-time connection state
- `lastConnectedAt` - Last connection timestamp

**Enums:**
- `service_type` - PPP service type
- `connection_status` - Connection state
- `auth_status` - Authentication state

#### `pppoe_sessions`
Historical connection sessions for analysis.

#### `pppoe_usage_logs`
Daily aggregated usage statistics.

### 6. Inventory Management

#### `inventory_categories`
Product and equipment categorization.

#### `inventory_items`
Individual inventory items and equipment tracking.

**Key Fields:**
- `id` - UUID primary key
- `sku` - Stock keeping unit
- `serialNumber` - Unique serial number
- `name` - Item description
- `manufacturer` / `model` - Product details
- `categoryId` - Category assignment
- `type` - Item type (router, cable, antenna, etc.)
- `status` - Current status (in_stock, in_use, failed, etc.)
- `locationId` - Current location
- `assignedToDeviceId` - Device deployment
- `purchasePrice` / `currentValue` - Financial tracking
- `supplier` - Vendor information

**Financial Fields:**
- `purchasePrice` - Acquisition cost
- `currentValue` - Depreciated value
- `warrantyExpiry` - Warranty period
- `depreciationYears` - Asset lifespan

**Enums:**
- `item_type` - Type of inventory item
- `item_status` - Current condition/status
- `condition` - Physical condition

#### `inventory_transactions`
Inventory movement and transaction history.

#### `inventory_audits`
Physical audit and reconciliation records.

#### `inventory_alerts`
Low stock and maintenance alerts.

### 7. Financial Management

#### `invoices`
Customer billing and invoicing.

**Key Fields:**
- `id` - UUID primary key
- `invoiceNumber` - Unique invoice number
- `customerId` - Customer association
- `status` - Invoice status (draft, sent, paid, etc.)
- `subtotal` / `taxAmount` / `totalAmount` - Financial totals
- `paidAmount` / `balanceAmount` - Payment tracking
- `issueDate` / `dueDate` - Billing dates
- `paymentTerms` - Payment conditions
- `isRecurring` - Recurring billing flag

**Financial Calculations:**
- Automatic tax calculation
- Discount processing
- Late fee computation
- Balance tracking

**Enums:**
- `invoice_status` - Invoice lifecycle status
- `payment_method` - Payment type

#### `invoice_items`
Line items for detailed invoicing.

#### `payments`
Payment processing and tracking.

**Key Fields:**
- `id` - UUID primary key
- `paymentNumber` - Unique payment ID
- `customerId` / `invoiceId` - Payment association
- `amount` - Payment amount
- `paymentMethod` - Payment type
- `status` - Processing status
- `processor` - Payment processor
- `transactionId` - Gateway transaction ID

**Processing Fields:**
- `processingFee` - Gateway fees
- `refundedAmount` - Refund tracking
- `disputed` - Dispute handling

#### `expenses`
Operational expense tracking.

**Key Fields:**
- `id` - UUID primary key
- `expenseNumber` - Unique identifier
- `type` - Expense category
- `amount` - Expense amount
- `vendorName` - Supplier information
- `expenseDate` / `dueDate` - Date tracking
- `paymentStatus` - Payment state
- `requiresApproval` - Workflow flag

**Approval Workflow:**
- Multi-level approval support
- Receipt attachment
- Department allocation

**Enums:**
- `expense_type` - Expense categories
- `revenue_category` - Revenue streams

#### `revenue`
Revenue recognition and tracking.

### 8. Employee Management

#### `employees`
Staff information and performance tracking.

**Key Fields:**
- `id` - UUID primary key
- `employeeNumber` - Staff identifier
- `userId` - Authentication association
- `firstName` / `lastName` - Personal details
- `type` - Employment type (full_time, part_time, contract)
- `status` - Employment status
- `department` - Department assignment
- `role` - Job role and responsibilities
- `workLocationId` - Primary work location
- `reportsTo` - Supervisory relationship
- `salary` / `hourlyRate` - Compensation
- `skills` / `certifications` - Qualifications

**Permissions:**
- Granular access control
- Device access permissions
- System role assignments

**Performance:**
- KPI tracking
- Review scheduling
- Goal management

**Enums:**
- `employee_type` - Employment classification
- `employee_status` - Current status
- `department` - Organizational department
- `role` - Job role

#### `employee_documents`
HR document management.

#### `employee_time_entries`
Time tracking and payroll.

#### `employee_performance_reviews`
Performance evaluation system.

## Relationships and Constraints

### Key Relationships

1. **Customer ↔ PPPoE Users** - One-to-many service relationship
2. **Device ↔ PPPoE Users** - Service provisioning association
3. **Customer ↔ Invoices** - Billing relationship
4. **Employee ↔ Location** - Work assignment
5. **Inventory ↔ Device** - Equipment deployment
6. **Location ↔ Device** - Physical location

### Cascade Rules

- **CASCADE**: Delete dependent records (sessions, contacts)
- **SET NULL**: Clear references (locations, devices)
- **RESTRICT**: Prevent deletion with dependencies

### Indexes

- Primary keys: UUID columns
- Foreign keys: All relationship columns
- Unique constraints: Business identifiers
- Search indexes: Email, phone, codes
- Date indexes: Time-based queries

## Data Types and Constraints

### UUID Usage
All primary keys use UUID for:
- Security (non-sequential IDs)
- Distributed generation
- Collision avoidance
- Future scalability

### Enum Types
Extensive use of PostgreSQL enums for:
- Data consistency
- Type safety
- Performance optimization
- Clear business logic

### Timestamps
Standardized timestamp fields:
- `createdAt` - Record creation
- `updatedAt` - Last modification
- `deletedAt` - Soft deletion
- Business-specific dates

### Numeric Types
Appropriate numeric precision:
- `decimal(12,2)` - Financial amounts
- `decimal(8,2)` - Rates and percentages
- `integer` - Counts and quantities
- `bigint` - Large counters (bytes, packets)

## Migration Strategy

### Development
- Use `npm run db:push` for schema updates
- Seed data via `npm run db:seed`
- Local development database

### Production
- Generated migrations via Drizzle
- Version-controlled schema changes
- Backup before migrations
- Rollback capabilities

## Security Considerations

### Sensitive Data
- Encrypted password storage
- Protected personal information
- Secure API credentials
- Audit trail for all changes

### Access Control
- Row-level security where needed
- Application-level permissions
- Database user restrictions
- Connection encryption

## Performance Optimization

### Indexing Strategy
- Primary keys indexed by default
- Foreign key indexes for joins
- Unique constraints for business rules
- Composite indexes for complex queries

### Query Optimization
- Efficient relationship loading
- Pagination support
- Caching strategies
- Connection pooling

## Scaling Considerations

### Horizontal Scaling
- Database replication support
- Read/write separation capability
- Connection pool management
- Load balancing preparation

### Vertical Scaling
- Partitioning strategy for large tables
- Archive tables for historical data
- Cleanup jobs for temporary data
- Monitoring and alerting

## Backup and Recovery

### Backup Strategy
- Regular automated backups
- Point-in-time recovery capability
- Cross-region backup replication
- Backup verification procedures

### Disaster Recovery
- Recovery time objectives (RTO)
- Recovery point objectives (RPO)
- Failover procedures
- Data validation processes

## Monitoring and Maintenance

### Health Monitoring
- Connection pool monitoring
- Query performance tracking
- Deadlock detection
- Resource usage monitoring

### Regular Maintenance
- Index rebuilds
- Statistics updates
- Table vacuuming
- Log rotation

This comprehensive schema provides a solid foundation for managing all aspects of an ISP business, from customer management to financial reporting, with built-in scalability and security features.