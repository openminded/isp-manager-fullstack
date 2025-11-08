import { db } from '../index';
import {
    bandwidthPlans,
    clients,
    employees,
    inventoryItems,
    type NewBandwidthPlan,
    type NewClient,
    type NewEmployee,
    type NewInventoryItem
} from '../schema/isp';
import { nanoid } from 'nanoid';

// Seed bandwidth plans
export async function seedBandwidthPlans() {
    const plans: NewBandwidthPlan[] = [
        {
            id: nanoid(),
            name: 'Basic Plan',
            downloadSpeed: 10,
            uploadSpeed: 5,
            price: '29.99',
            description: 'Perfect for light browsing and email',
            isActive: true,
        },
        {
            id: nanoid(),
            name: 'Standard Plan',
            downloadSpeed: 50,
            uploadSpeed: 25,
            price: '49.99',
            description: 'Great for streaming and moderate usage',
            isActive: true,
        },
        {
            id: nanoid(),
            name: 'Premium Plan',
            downloadSpeed: 100,
            uploadSpeed: 50,
            price: '79.99',
            description: 'Ideal for heavy users and multiple devices',
            isActive: true,
        },
        {
            id: nanoid(),
            name: 'Business Plan',
            downloadSpeed: 500,
            uploadSpeed: 250,
            price: '199.99',
            description: 'High-speed connection for businesses',
            isActive: true,
        },
    ];

    await db.insert(bandwidthPlans).values(plans);
    console.log('✅ Bandwidth plans seeded successfully');
}

// Seed sample employees
export async function seedEmployees() {
    const employeesData: NewEmployee[] = [
        {
            id: nanoid(),
            name: 'John Smith',
            email: 'john.smith@isp.com',
            phone: '+1-555-0101',
            role: 'admin',
            department: 'Management',
            hireDate: new Date('2023-01-15'),
            status: 'active',
            salary: '75000.00',
            address: '123 Main St, City, State 12345',
            emergencyContact: 'Jane Smith - +1-555-0102',
        },
        {
            id: nanoid(),
            name: 'Sarah Johnson',
            email: 'sarah.johnson@isp.com',
            phone: '+1-555-0103',
            role: 'technician',
            department: 'Technical Support',
            hireDate: new Date('2023-03-20'),
            status: 'active',
            salary: '55000.00',
            address: '456 Oak Ave, City, State 12345',
            emergencyContact: 'Mike Johnson - +1-555-0104',
        },
        {
            id: nanoid(),
            name: 'Mike Wilson',
            email: 'mike.wilson@isp.com',
            phone: '+1-555-0105',
            role: 'technician',
            department: 'Field Operations',
            hireDate: new Date('2023-06-10'),
            status: 'active',
            salary: '52000.00',
            address: '789 Pine Rd, City, State 12345',
            emergencyContact: 'Lisa Wilson - +1-555-0106',
        },
    ];

    await db.insert(employees).values(employeesData);
    console.log('✅ Employees seeded successfully');
}

// Seed sample inventory items
export async function seedInventoryItems() {
    const inventory: NewInventoryItem[] = [
        {
            id: nanoid(),
            name: 'MikroTik hEX RB750Gr3',
            category: 'router',
            description: '5 port Gigabit Ethernet router',
            quantity: 50,
            unitPrice: '59.99',
            supplier: 'MikroTik Distributor Inc.',
            model: 'RB750Gr3',
            purchaseDate: new Date('2024-01-10'),
            warrantyExpiry: new Date('2025-01-10'),
            status: 'in_stock',
            location: 'Warehouse A - Shelf 15',
        },
        {
            id: nanoid(),
            name: 'Cat6 Ethernet Cable 100ft',
            category: 'cable',
            description: 'Indoor/Outdoor CAT6 network cable',
            quantity: 200,
            unitPrice: '12.99',
            supplier: 'CablePro Supply',
            model: 'CAT6-100FT',
            purchaseDate: new Date('2024-02-15'),
            warrantyExpiry: new Date('2026-02-15'),
            status: 'in_stock',
            location: 'Warehouse B - Rack 3',
        },
        {
            id: nanoid(),
            name: 'WiFi 6 Access Point',
            category: 'router',
            description: 'Dual-band WiFi 6 access point',
            quantity: 25,
            unitPrice: '149.99',
            supplier: 'NetworkGear Corp',
            model: 'AP-W6-1200',
            purchaseDate: new Date('2024-03-01'),
            warrantyExpiry: new Date('2025-03-01'),
            status: 'in_stock',
            location: 'Warehouse A - Shelf 8',
        },
        {
            id: nanoid(),
            name: 'RJ45 Connectors',
            category: 'connector',
            description: '8P8C RJ45 modular connectors',
            quantity: 1000,
            unitPrice: '0.25',
            supplier: 'Connector Supply Co.',
            model: 'RJ45-8P8C-100',
            purchaseDate: new Date('2024-01-20'),
            warrantyExpiry: new Date('2026-01-20'),
            status: 'in_stock',
            location: 'Warehouse C - Bin 42',
        },
        {
            id: nanoid(),
            name: '12V Power Adapter',
            category: 'power_supply',
            description: '12V 2A DC power adapter',
            quantity: 75,
            unitPrice: '8.99',
            supplier: 'PowerSource Ltd',
            model: 'PS-12V-2A',
            purchaseDate: new Date('2024-02-10'),
            warrantyExpiry: new Date('2025-02-10'),
            status: 'in_stock',
            location: 'Warehouse B - Shelf 12',
        },
    ];

    await db.insert(inventoryItems).values(inventory);
    console.log('✅ Inventory items seeded successfully');
}

// Main seeding function
export async function seedDatabase() {
    try {
        console.log('🌱 Starting database seeding...');

        await seedBandwidthPlans();
        await seedEmployees();
        await seedInventoryItems();

        console.log('✨ Database seeding completed successfully!');
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    }
}

// Run seeding if this file is executed directly
if (require.main === module) {
    seedDatabase()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}