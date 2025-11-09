/**
 * Database Seed Script
 *
 * Populates the database with sample data for testing and development
 */

import 'dotenv/config';
import { db } from './index';
import { uuid } from 'drizzle-orm';

// Import schema tables
import {
  locations,
  mikrotikDevices,
  customers,
  customerContacts,
  employees,
  bandwidthProfiles,
  pppoeUsers
} from './schema';

async function seed() {
  console.log('Starting database seeding...');

  try {
    // Create sample locations
    console.log('Creating sample locations...');

    const mainOffice = await db.insert(locations).values({
      id: uuid(),
      name: 'Main Office',
      code: 'MAIN-001',
      type: 'main_office',
      status: 'active',
      address: '123 ISP Street',
      city: 'Techville',
      state: 'CA',
      postalCode: '94025',
      country: 'US',
      contactName: 'John Manager',
      contactEmail: 'manager@ispmgr.com',
      contactPhone: '+1-555-0101',
      isMainLocation: true,
      timezone: 'America/Los_Angeles'
    }).returning();

    const branchOffice = await db.insert(locations).values({
      id: uuid(),
      name: 'Branch Office',
      code: 'BRANCH-001',
      type: 'branch_office',
      status: 'active',
      address: '456 Network Avenue',
      city: 'Datacity',
      state: 'NY',
      postalCode: '10001',
      country: 'US',
      contactName: 'Jane Supervisor',
      contactEmail: 'supervisor@ispmgr.com',
      contactPhone: '+1-555-0102',
      isMainLocation: false,
      timezone: 'America/New_York'
    }).returning();

    console.log('✓ Created sample locations');

    // Create sample devices
    console.log('Creating sample MikroTik devices...');

    const router1 = await db.insert(mikrotikDevices).values({
      id: uuid(),
      name: 'Main Router',
      hostname: 'router-main.isp.local',
      ipAddress: '192.168.1.1',
      subnetMask: '255.255.255.0',
      gateway: '192.168.1.254',
      apiPort: 8728,
      apiUsername: 'admin',
      apiPassword: 'secure_password_1',
      type: 'router',
      status: 'online',
      connectionType: 'wired',
      locationId: mainOffice[0].id,
      model: 'RB4011iGS+',
      firmwareVersion: '7.12.1',
      licenseLevel: '6',
      isMonitored: true,
      pppoeEnabled: true,
      maxPppoeUsers: 500,
      description: 'Main edge router for office network'
    }).returning();

    const router2 = await db.insert(mikrotikDevices).values({
      id: uuid(),
      name: 'Branch Router',
      hostname: 'router-branch.isp.local',
      ipAddress: '192.168.2.1',
      subnetMask: '255.255.255.0',
      gateway: '192.168.2.254',
      apiPort: 8728,
      apiUsername: 'admin',
      apiPassword: 'secure_password_2',
      type: 'router',
      status: 'online',
      connectionType: 'wired',
      locationId: branchOffice[0].id,
      model: 'RB750Gr3',
      firmwareVersion: '7.11.2',
      licenseLevel: '5',
      isMonitored: true,
      pppoeEnabled: true,
      maxPppoeUsers: 200,
      description: 'Branch office router'
    }).returning();

    console.log('✓ Created sample devices');

    // Create sample employees
    console.log('Creating sample employees...');

    const admin = await db.insert(employees).values({
      id: uuid(),
      employeeNumber: 'EMP001',
      firstName: 'System',
      lastName: 'Administrator',
      displayName: 'System Administrator',
      workEmail: 'admin@ispmgr.com',
      department: 'management',
      role: 'admin',
      title: 'ISP Manager',
      hireDate: new Date('2023-01-01'),
      status: 'active',
      workLocationId: mainOffice[0].id,
      salary: '75000.00',
      canManageCustomers: true,
      canManageInventory: true,
      canManageFinance: true,
      canViewReports: true,
      networkAccess: true,
      mikrotikCertification: 'MTCRE',
      technicalLevel: 'Expert',
      isActive: true
    }).returning();

    const technician = await db.insert(employees).values({
      id: uuid(),
      employeeNumber: 'EMP002',
      firstName: 'Network',
      lastName: 'Technician',
      displayName: 'Network Technician',
      workEmail: 'tech@ispmgr.com',
      department: 'technical',
      role: 'technician',
      title: 'Network Technician',
      hireDate: new Date('2023-06-01'),
      status: 'active',
      workLocationId: mainOffice[0].id,
      salary: '55000.00',
      reportsTo: admin[0].id,
      canManageCustomers: true,
      canManageInventory: true,
      canViewReports: true,
      networkAccess: true,
      mikrotikCertification: 'MTCNA',
      technicalLevel: 'Advanced',
      isActive: true
    }).returning();

    console.log('✓ Created sample employees');

    // Create sample bandwidth profiles
    console.log('Creating sample bandwidth profiles...');

    const basicProfile = await db.insert(bandwidthProfiles).values({
      id: uuid(),
      name: 'Basic-10Mbps',
      displayName: 'Basic 10 Mbps',
      uploadLimit: 10000000, // 10 Mbps
      downloadLimit: 10000000, // 10 Mbps
      priority: 8,
      monthlyPrice: '29.99',
      category: 'residential',
      isSymmetrical: true,
      mikrotikProfileName: '10Mbps',
      description: 'Basic residential plan with 10 Mbps symmetrical bandwidth'
    }).returning();

    const standardProfile = await db.insert(bandwidthProfiles).values({
      id: uuid(),
      name: 'Standard-50Mbps',
      displayName: 'Standard 50 Mbps',
      uploadLimit: 50000000, // 50 Mbps
      downloadLimit: 50000000, // 50 Mbps
      priority: 6,
      monthlyPrice: '49.99',
      category: 'residential',
      isSymmetrical: true,
      mikrotikProfileName: '50Mbps',
      description: 'Standard residential plan with 50 Mbps symmetrical bandwidth'
    }).returning();

    const businessProfile = await db.insert(bandwidthProfiles).values({
      id: uuid(),
      name: 'Business-100Mbps',
      displayName: 'Business 100 Mbps',
      uploadLimit: 100000000, // 100 Mbps
      downloadLimit: 100000000, // 100 Mbps
      priority: 4,
      monthlyPrice: '149.99',
      category: 'business',
      isBusinessClass: true,
      isSymmetrical: true,
      mikrotikProfileName: '100Mbps-Business',
      description: 'Business plan with 100 Mbps symmetrical bandwidth and priority support'
    }).returning();

    console.log('✓ Created sample bandwidth profiles');

    // Create sample customers
    console.log('Creating sample customers...');

    const customer1 = await db.insert(customers).values({
      id: uuid(),
      customerCode: 'CUST-000001',
      firstName: 'John',
      lastName: 'Doe',
      displayName: 'John Doe',
      type: 'residential',
      status: 'active',
      primaryEmail: 'john.doe@email.com',
      primaryPhone: '+1-555-0201',
      serviceAddress: '123 Customer Street',
      serviceCity: 'Techville',
      serviceState: 'CA',
      servicePostalCode: '94025',
      serviceCountry: 'US',
      locationId: mainOffice[0].id,
      serviceStartDate: new Date('2023-02-01'),
      contractTermMonths: 12,
      accountManager: technician[0].id,
      paperlessBilling: true,
      tags: ['residential', 'loyal_customer']
    }).returning();

    const customer2 = await db.insert(customers).values({
      id: uuid(),
      customerCode: 'CUST-000002',
      companyName: 'Tech Solutions Inc',
      firstName: 'Jane',
      lastName: 'Smith',
      displayName: 'Tech Solutions Inc',
      type: 'business',
      status: 'active',
      primaryEmail: 'jane.smith@techsolutions.com',
      primaryPhone: '+1-555-0202',
      serviceAddress: '456 Business Blvd',
      serviceCity: 'Datacity',
      serviceState: 'NY',
      servicePostalCode: '10001',
      serviceCountry: 'US',
      locationId: branchOffice[0].id,
      serviceStartDate: new Date('2023-03-01'),
      contractTermMonths: 24,
      accountManager: admin[0].id,
      paperlessBilling: true,
      tags: ['business', 'priority']
    }).returning();

    console.log('✓ Created sample customers');

    // Create sample customer contacts
    console.log('Creating sample customer contacts...');

    await db.insert(customerContacts).values({
      id: uuid(),
      customerId: customer1[0].id,
      name: 'John Doe',
      email: 'john.doe@email.com',
      phone: '+1-555-0201',
      isPrimary: true,
      isBilling: true,
      isTechnical: true,
      canAccessPortal: true,
      canViewBills: true,
      canMakePayments: true
    });

    await db.insert(customerContacts).values({
      id: uuid(),
      customerId: customer2[0].id,
      name: 'Jane Smith',
      title: 'IT Manager',
      department: 'IT',
      email: 'jane.smith@techsolutions.com',
      phone: '+1-555-0202',
      isPrimary: true,
      isBilling: true,
      isTechnical: true,
      canAccessPortal: true,
      canViewBills: true,
      canMakePayments: true
    });

    await db.insert(customerContacts).values({
      id: uuid(),
      customerId: customer2[0].id,
      name: 'Bob Johnson',
      title: 'CEO',
      department: 'Executive',
      email: 'bob.johnson@techsolutions.com',
      phone: '+1-555-0203',
      isPrimary: false,
      isBilling: true,
      isTechnical: false,
      canAccessPortal: true,
      canViewBills: true,
      canMakePayments: false
    });

    console.log('✓ Created sample customer contacts');

    // Create sample PPPoE users
    console.log('Creating sample PPPoE users...');

    await db.insert(pppoeUsers).values({
      id: uuid(),
      mikrotikUserId: '*1',
      username: 'john_doe_pppoe',
      password: 'SecurePassword123!',
      serviceType: 'pppoe',
      customerId: customer1[0].id,
      customerName: 'John Doe',
      deviceId: router1[0].id,
      profileId: standardProfile[0].id,
      profileName: '50Mbps',
      isActive: true,
      isDisabled: false,
      connectionStatus: 'connected',
      authStatus: 'authenticated',
      localAddress: '192.168.1.100',
      remoteAddress: '10.0.0.100',
      monthlyFee: '49.99',
      lastSyncAt: new Date(),
      syncStatus: 'synced',
      comment: 'Residential customer - Standard plan',
      createdBy: technician[0].id,
      lastConnectedAt: new Date(),
      currentSessionStart: new Date(Date.now() - 3600000), // 1 hour ago
      totalBytesIn: 1073741824, // 1GB
      totalBytesOut: 536870912, // 512MB
      currentSessionBytesIn: 104857600, // 100MB
      currentSessionBytesOut: 52428800, // 50MB
    });

    await db.insert(pppoeUsers).values({
      id: uuid(),
      mikrotikUserId: '*2',
      username: 'techsolutions_pppoe',
      password: 'BusinessPass456!',
      serviceType: 'pppoe',
      customerId: customer2[0].id,
      customerName: 'Tech Solutions Inc',
      deviceId: router2[0].id,
      profileId: businessProfile[0].id,
      profileName: '100Mbps-Business',
      isActive: true,
      isDisabled: false,
      connectionStatus: 'connected',
      authStatus: 'authenticated',
      localAddress: '192.168.2.200',
      remoteAddress: '10.0.1.200',
      monthlyFee: '149.99',
      lastSyncAt: new Date(),
      syncStatus: 'synced',
      comment: 'Business customer - Business plan',
      createdBy: admin[0].id,
      lastConnectedAt: new Date(),
      currentSessionStart: new Date(Date.now() - 7200000), // 2 hours ago
      totalBytesIn: 5368709120, // 5GB
      totalBytesOut: 2684354560, // 2.5GB
      currentSessionBytesIn: 1073741824, // 1GB
      currentSessionBytesOut: 536870912, // 512MB
    });

    console.log('✓ Created sample PPPoE users');

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\nSample data created:');
    console.log(`- ${mainOffice.length + branchOffice.length} locations`);
    console.log(`- ${router1.length + router2.length} MikroTik devices`);
    console.log(`- ${admin.length + technician.length} employees`);
    console.log(`- ${basicProfile.length + standardProfile.length + businessProfile.length} bandwidth profiles`);
    console.log(`- ${customer1.length + customer2.length} customers`);
    console.log(`- 3 customer contacts`);
    console.log(`- 2 PPPoE users`);

  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

// Run the seeding
if (require.main === module) {
  seed()
    .then(() => {
      console.log('Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

export { seed };