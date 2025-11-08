import { z } from 'zod';
import type { MikroTikConfig, PppoeUser } from '../types/isp';

// Zod schemas for MikroTik operations validation
export const mikrotikConfigSchema = z.object({
    host: z.string().min(1, 'Router host is required'),
    user: z.string().min(1, 'Router username is required'),
    password: z.string().min(1, 'Router password is required'),
    port: z.number().int().min(1).max(65535).default(8728),
    timeout: z.number().int().min(1000).max(60000).default(10000)
});

export const pppoeUserSchema = z.object({
    username: z.string()
        .min(3, 'Username must be at least 3 characters')
        .max(32, 'Username must be at most 32 characters')
        .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),

    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(32, 'Password must be at most 32 characters')
        .regex(/^[a-zA-Z0-9!@#$%^&*()_+=\[\]{}|;:,.<>?]+$/, 'Password contains invalid characters'),

    profile: z.string().min(1, 'Bandwidth profile is required'),
    comment: z.string().max(255, 'Comment must be at most 255 characters').optional()
});

export const bandwidthProfileSchema = z.object({
    name: z.string().min(1, 'Profile name is required'),
    downloadSpeed: z.number().int().min(1, 'Download speed must be at least 1 Mbps'),
    uploadSpeed: z.number().int().min(1, 'Upload speed must be at least 1 Mbps'),
    description: z.string().max(255, 'Description must be at most 255 characters').optional()
});

// Utility functions for MikroTik operations
export class MikroTikUtils {
    /**
     * Generate a random PPPoE password
     */
    static generatePassword(length: number = 12): string {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return password;
    }

    /**
     * Generate a PPPoE username based on client information
     */
    static generateUsername(clientName: string, clientId?: string): string {
        // Clean and format the client name
        const cleanName = clientName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .substring(0, 15);

        // Add random suffix or client ID
        const suffix = clientId || Math.random().toString(36).substring(2, 8);
        return `${cleanName}_${suffix}`;
    }

    /**
     * Validate PPPoE username format
     */
    static isValidUsername(username: string): boolean {
        return /^[a-zA-Z0-9_-]{3,32}$/.test(username);
    }

    /**
     * Validate PPPoE password strength
     */
    static validatePasswordStrength(password: string): {
        isValid: boolean;
        issues: string[];
    } {
        const issues: string[] = [];

        if (password.length < 8) {
            issues.push('Password must be at least 8 characters long');
        }

        if (password.length > 32) {
            issues.push('Password must be at most 32 characters long');
        }

        if (!/[a-z]/.test(password)) {
            issues.push('Password must contain at least one lowercase letter');
        }

        if (!/[A-Z]/.test(password)) {
            issues.push('Password must contain at least one uppercase letter');
        }

        if (!/[0-9]/.test(password)) {
            issues.push('Password must contain at least one number');
        }

        const specialChars = /[!@#$%^&*()_+=\[\]{}|;:,.<>?]/;
        if (!specialChars.test(password)) {
            issues.push('Password must contain at least one special character');
        }

        return {
            isValid: issues.length === 0,
            issues
        };
    }

    /**
     * Create rate limit string for MikroTik (e.g., "10M/5M")
     */
    static createRateLimit(downloadSpeed: number, uploadSpeed: number): string {
        return `${downloadSpeed}M/${uploadSpeed}M`;
    }

    /**
     * Parse rate limit string from MikroTik
     */
    static parseRateLimit(rateLimit: string): {
        downloadSpeed: number;
        uploadSpeed: number;
    } | null {
        if (!rateLimit) return null;

        const match = rateLimit.match(/^(\d+)M\/(\d+)M$/);
        if (!match) return null;

        return {
            downloadSpeed: parseInt(match[1]),
            uploadSpeed: parseInt(match[2])
        };
    }

    /**
     * Validate MikroTik configuration
     */
    static validateConfig(config: Partial<MikroTikConfig>): {
        isValid: boolean;
        errors: string[];
        config: MikroTikConfig;
    } {
        try {
            const validatedConfig = mikrotikConfigSchema.parse(config);
            return {
                isValid: true,
                errors: [],
                config: validatedConfig
            };
        } catch (error) {
            if (error instanceof z.ZodError) {
                return {
                    isValid: false,
                    errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
                    config: {} as MikroTikConfig
                };
            }
            return {
                isValid: false,
                errors: ['Unknown validation error'],
                config: {} as MikroTikConfig
            };
        }
    }

    /**
     * Check if two passwords match securely
     */
    static passwordsMatch(password: string, confirmPassword: string): boolean {
        return password === confirmPassword;
    }

    /**
     * Format MikroTik error messages for user display
     */
    static formatErrorMessage(error: string): string {
        // Common MikroTik error patterns and user-friendly messages
        const errorPatterns: { [key: string]: string } = {
            'invalid user name or password': 'Invalid router credentials. Please check your username and password.',
            'connection timed out': 'Connection to router timed out. Please check the router IP address and network connectivity.',
            'connection refused': 'Router refused connection. Please check if the API service is enabled on the router.',
            'already exists': 'This PPPoE user already exists on the router.',
            'not found': 'The specified PPPoE user was not found on the router.',
            'failure': 'Operation failed. Please check the router logs for more details.',
            'invalid argument': 'Invalid argument provided to router operation.'
        };

        const lowerError = error.toLowerCase();
        for (const [pattern, message] of Object.entries(errorPatterns)) {
            if (lowerError.includes(pattern)) {
                return message;
            }
        }

        return `Router operation failed: ${error}`;
    }

    /**
     * Calculate bandwidth plan cost based on speed
     */
    static calculatePlanPrice(downloadSpeed: number, uploadSpeed: number): number {
        // Simple pricing model - base rate + speed multiplier
        const baseRate = 19.99;
        const downloadRate = downloadSpeed * 0.50; // $0.50 per Mbps download
        const uploadRate = uploadSpeed * 0.25;     // $0.25 per Mbps upload

        return Math.round((baseRate + downloadRate + uploadRate) * 100) / 100;
    }

    /**
     * Generate bandwidth profile name based on speeds
     */
    static generateProfileName(downloadSpeed: number, uploadSpeed: number): string {
        if (downloadSpeed >= 1000) {
            return `${(downloadSpeed / 1000).toFixed(1)}G/${(uploadSpeed / 1000).toFixed(1)}G`;
        }
        return `${downloadSpeed}M/${uploadSpeed}M`;
    }

    /**
     * Check if speed values are reasonable for ISP plans
     */
    static validateSpeedLimits(downloadSpeed: number, uploadSpeed: number): {
        isValid: boolean;
        issues: string[];
    } {
        const issues: string[] = [];

        if (downloadSpeed < 1) {
            issues.push('Download speed must be at least 1 Mbps');
        }

        if (downloadSpeed > 10000) {
            issues.push('Download speed exceeds maximum reasonable limit (10 Gbps)');
        }

        if (uploadSpeed < 1) {
            issues.push('Upload speed must be at least 1 Mbps');
        }

        if (uploadSpeed > 10000) {
            issues.push('Upload speed exceeds maximum reasonable limit (10 Gbps)');
        }

        // Check if upload is reasonable compared to download
        if (uploadSpeed > downloadSpeed) {
            issues.push('Upload speed should not exceed download speed');
        }

        // Check if upload is too low compared to download
        const uploadToDownloadRatio = uploadSpeed / downloadSpeed;
        if (uploadToDownloadRatio < 0.1) {
            issues.push('Upload speed should be at least 10% of download speed');
        }

        return {
            isValid: issues.length === 0,
            issues
        };
    }
}

// Export validation schemas
export { mikrotikConfigSchema, pppoeUserSchema, bandwidthProfileSchema };