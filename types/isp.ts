import {
    BandwidthPlan,
    Client,
    Employee,
    InventoryItem,
    ClientWithBandwidthPlan,
    InventoryItemWithClient,
    EmployeeWithUser
} from '../db/schema/isp';

// API Response Types
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// Client Management Types
export interface CreateClientRequest {
    name: string;
    email: string;
    phone: string;
    address: string;
    pppoeUsername: string;
    pppoePassword: string;
    bandwidthPlanId: string;
    notes?: string;
}

export interface UpdateClientRequest extends Partial<CreateClientRequest> {
    id: string;
    status?: 'active' | 'inactive' | 'suspended' | 'pending';
    installationDate?: Date;
    nextBillingDate?: Date;
}

export interface ClientWithDetails extends Client {
    bandwidthPlan: BandwidthPlan;
    assignedInventory: InventoryItem[];
}

// MikroTik Integration Types
export interface MikroTikConfig {
    host: string;
    user: string;
    password: string;
    port?: number;
    timeout?: number;
}

export interface PppoeUser {
    username: string;
    password: string;
    profile: string;
    disabled?: boolean;
    comment?: string;
}

export interface MikroTikResponse {
    success: boolean;
    data?: any;
    error?: string;
}

// Inventory Management Types
export interface CreateInventoryItemRequest {
    name: string;
    category: 'router' | 'cable' | 'antenna' | 'connector' | 'power_supply' | 'network_card' | 'other';
    description?: string;
    quantity: number;
    unitPrice: number;
    supplier: string;
    model?: string;
    serialNumber?: string;
    purchaseDate: Date;
    warrantyExpiry?: Date;
    location: string;
    assignedToClientId?: string;
    notes?: string;
}

export interface UpdateInventoryItemRequest extends Partial<CreateInventoryItemRequest> {
    id: string;
    status?: 'in_stock' | 'deployed' | 'maintenance' | 'retired';
}

export interface InventoryItemWithDetails extends InventoryItem {
    assignedClient: Client | null;
}

// Employee Management Types
export interface CreateEmployeeRequest {
    name: string;
    email: string;
    phone: string;
    role: 'admin' | 'technician' | 'sales' | 'support';
    department: string;
    hireDate: Date;
    salary?: number;
    address?: string;
    emergencyContact?: string;
    notes?: string;
}

export interface UpdateEmployeeRequest extends Partial<CreateEmployeeRequest> {
    id: string;
    status?: 'active' | 'inactive' | 'on_leave';
}

export interface EmployeeWithDetails extends Employee {
    user: {
        id: string;
        email: string;
        name: string | null;
    } | null;
}

// Bandwidth Plan Types
export interface CreateBandwidthPlanRequest {
    name: string;
    downloadSpeed: number;
    uploadSpeed: number;
    price: number;
    description?: string;
    isActive?: boolean;
}

export interface UpdateBandwidthPlanRequest extends Partial<CreateBandwidthPlanRequest> {
    id: string;
}

// Dashboard Statistics Types
export interface DashboardStats {
    totalClients: number;
    activeClients: number;
    totalEmployees: number;
    totalInventoryItems: number;
    totalInventoryValue: number;
    monthlyRevenue: number;
    recentClients: ClientWithDetails[];
    lowStockItems: InventoryItem[];
    upcomingInstallations: Client[];
}

// Filter and Search Types
export interface ClientFilters {
    status?: string;
    bandwidthPlanId?: string;
    search?: string;
    sortBy?: 'name' | 'email' | 'createdAt' | 'nextBillingDate';
    sortOrder?: 'asc' | 'desc';
}

export interface InventoryFilters {
    category?: string;
    status?: string;
    supplier?: string;
    location?: string;
    search?: string;
    sortBy?: 'name' | 'quantity' | 'purchaseDate';
    sortOrder?: 'asc' | 'desc';
}

export interface EmployeeFilters {
    role?: string;
    department?: string;
    status?: string;
    search?: string;
    sortBy?: 'name' | 'email' | 'hireDate';
    sortOrder?: 'asc' | 'desc';
}

// Form Validation Types
export interface FormErrors {
    [key: string]: string | undefined;
}

export interface FormState<T> {
    data: T;
    errors: FormErrors;
    isSubmitting: boolean;
    isDirty: boolean;
}

// Toast Notification Types
export interface ToastNotification {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    duration?: number;
}

// Export all database types for convenience
export {
    BandwidthPlan,
    Client,
    Employee,
    InventoryItem,
    ClientWithBandwidthPlan,
    InventoryItemWithClient,
    EmployeeWithUser
};