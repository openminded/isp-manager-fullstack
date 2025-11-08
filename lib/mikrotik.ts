import { connect } from 'node-routeros';
import type { Client } from 'node-routeros';
import type {
    MikroTikConfig,
    PppoeUser,
    MikroTikResponse
} from '../types/isp';

class MikroTikService {
    private config: MikroTikConfig;
    private connection: Client | null = null;
    private lastConnectionAttempt: number = 0;
    private readonly CONNECTION_TIMEOUT = 30000; // 30 seconds
    private readonly RETRY_ATTEMPTS = 3;
    private readonly RETRY_DELAY = 1000; // 1 second base delay

    constructor() {
        this.config = {
            host: process.env.ROUTER_HOST || '192.168.88.1',
            user: process.env.ROUTER_USER || 'admin',
            password: process.env.ROUTER_PASS || '',
            port: parseInt(process.env.ROUTER_PORT || '8728'),
            timeout: parseInt(process.env.ROUTER_TIMEOUT || '10000')
        };

        if (!this.config.password) {
            console.warn('⚠️  MikroTik router password not configured in environment variables');
        }
    }

    /**
     * Establish connection to MikroTik router with retry logic
     */
    private async connectToRouter(): Promise<Client> {
        const now = Date.now();

        // Reuse existing connection if it's still valid
        if (this.connection && (now - this.lastConnectionAttempt) < this.CONNECTION_TIMEOUT) {
            try {
                // Test connection with a simple command
                await this.connection.write('/system/resource/print');
                return this.connection;
            } catch (error) {
                console.warn('⚠️  Existing MikroTik connection failed, reconnecting...');
                this.connection = null;
            }
        }

        // Establish new connection with retry logic
        for (let attempt = 1; attempt <= this.RETRY_ATTEMPTS; attempt++) {
            try {
                console.log(`🔗 Connecting to MikroTik router at ${this.config.host} (attempt ${attempt}/${this.RETRY_ATTEMPTS})`);

                this.connection = await connect({
                    host: this.config.host,
                    user: this.config.user,
                    password: this.config.password,
                    port: this.config.port,
                    timeout: this.config.timeout
                });

                this.lastConnectionAttempt = now;
                console.log('✅ Successfully connected to MikroTik router');
                return this.connection;

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                console.error(`❌ MikroTik connection attempt ${attempt} failed:`, errorMessage);

                if (attempt === this.RETRY_ATTEMPTS) {
                    throw new Error(`Failed to connect to MikroTik router after ${this.RETRY_ATTEMPTS} attempts: ${errorMessage}`);
                }

                // Exponential backoff
                const delay = this.RETRY_DELAY * Math.pow(2, attempt - 1);
                await this.sleep(delay);
            }
        }

        throw new Error('Failed to establish MikroTik connection');
    }

    /**
     * Close the router connection
     */
    private async closeConnection(): Promise<void> {
        if (this.connection) {
            try {
                await this.connection.close();
                this.connection = null;
                console.log('🔌 MikroTik connection closed');
            } catch (error) {
                console.warn('⚠️  Error closing MikroTik connection:', error);
            }
        }
    }

    /**
     * Execute command with automatic connection management
     */
    private async executeCommand<T = any>(command: string[], params: Record<string, any> = {}): Promise<T> {
        let client: Client | null = null;
        try {
            client = await this.connectToRouter();
            const result = await client.write(command, params);
            return result as T;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`❌ MikroTik command failed [${command.join(' ')}]:`, errorMessage);
            throw new Error(`MikroTik command failed: ${errorMessage}`);
        } finally {
            // Don't close connection immediately for efficiency
            // Connection will be closed when it times out or explicitly
        }
    }

    /**
     * Sleep utility for retry delays
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Create a new PPPoE user on the router
     */
    async createPppoeUser(username: string, password: string, profile: string, comment?: string): Promise<MikroTikResponse> {
        try {
            console.log(`👤 Creating PPPoE user: ${username} with profile: ${profile}`);

            // Check if user already exists
            const existingUser = await this.getUserStatus(username);
            if (existingUser.success && existingUser.data) {
                return {
                    success: false,
                    error: `PPPoE user '${username}' already exists`
                };
            }

            // Create new PPPoE user
            const params: Record<string, any> = {
                name: username,
                password: password,
                profile: profile,
                disabled: 'no'
            };

            if (comment) {
                params.comment = comment;
            }

            await this.executeCommand('/ppp/secret/add', params);

            console.log(`✅ Successfully created PPPoE user: ${username}`);
            return {
                success: true,
                message: `PPPoE user '${username}' created successfully`
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                success: false,
                error: `Failed to create PPPoE user: ${errorMessage}`
            };
        }
    }

    /**
     * Update existing PPPoE user
     */
    async updatePppoeUser(username: string, newProfile?: string, newPassword?: string, comment?: string): Promise<MikroTikResponse> {
        try {
            console.log(`🔄 Updating PPPoE user: ${username}`);

            // Find user by name
            const users = await this.executeCommand('/ppp/secret/print', {
                '?name': username
            });

            if (!users || users.length === 0) {
                return {
                    success: false,
                    error: `PPPoE user '${username}' not found`
                };
            }

            const user = users[0];
            const params: Record<string, any> = {
                '.id': user['.id']
            };

            if (newProfile) {
                params.profile = newProfile;
            }
            if (newPassword) {
                params.password = newPassword;
            }
            if (comment !== undefined) {
                params.comment = comment;
            }

            await this.executeCommand('/ppp/secret/set', params);

            console.log(`✅ Successfully updated PPPoE user: ${username}`);
            return {
                success: true,
                message: `PPPoE user '${username}' updated successfully`
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                success: false,
                error: `Failed to update PPPoE user: ${errorMessage}`
            };
        }
    }

    /**
     * Disable PPPoE user account
     */
    async disablePppoeUser(username: string): Promise<MikroTikResponse> {
        try {
            console.log(`🚫 Disabling PPPoE user: ${username}`);

            // Find user by name
            const users = await this.executeCommand('/ppp/secret/print', {
                '?name': username
            });

            if (!users || users.length === 0) {
                return {
                    success: false,
                    error: `PPPoE user '${username}' not found`
                };
            }

            const user = users[0];

            await this.executeCommand('/ppp/secret/set', {
                '.id': user['.id'],
                disabled: 'yes'
            });

            console.log(`✅ Successfully disabled PPPoE user: ${username}`);
            return {
                success: true,
                message: `PPPoE user '${username}' disabled successfully`
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                success: false,
                error: `Failed to disable PPPoE user: ${errorMessage}`
            };
        }
    }

    /**
     * Enable PPPoE user account
     */
    async enablePppoeUser(username: string): Promise<MikroTikResponse> {
        try {
            console.log(`✅ Enabling PPPoE user: ${username}`);

            // Find user by name
            const users = await this.executeCommand('/ppp/secret/print', {
                '?name': username
            });

            if (!users || users.length === 0) {
                return {
                    success: false,
                    error: `PPPoE user '${username}' not found`
                };
            }

            const user = users[0];

            await this.executeCommand('/ppp/secret/set', {
                '.id': user['.id'],
                disabled: 'no'
            });

            console.log(`✅ Successfully enabled PPPoE user: ${username}`);
            return {
                success: true,
                message: `PPPoE user '${username}' enabled successfully`
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                success: false,
                error: `Failed to enable PPPoE user: ${errorMessage}`
            };
        }
    }

    /**
     * Get user status and information
     */
    async getUserStatus(username: string): Promise<MikroTikResponse> {
        try {
            const users = await this.executeCommand('/ppp/secret/print', {
                '?name': username
            });

            if (!users || users.length === 0) {
                return {
                    success: false,
                    error: `PPPoE user '${username}' not found`
                };
            }

            const user = users[0];

            return {
                success: true,
                data: {
                    username: user.name,
                    profile: user.profile,
                    disabled: user.disabled === 'true',
                    comment: user.comment,
                    lastLoggedOut: user['last-logged-out'],
                    uptime: user.uptime
                }
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                success: false,
                error: `Failed to get user status: ${errorMessage}`
            };
        }
    }

    /**
     * Get all PPPoE users (for sync purposes)
     */
    async getAllPppoeUsers(): Promise<MikroTikResponse> {
        try {
            const users = await this.executeCommand('/ppp/secret/print');

            return {
                success: true,
                data: users.map((user: any) => ({
                    username: user.name,
                    profile: user.profile,
                    disabled: user.disabled === 'true',
                    comment: user.comment,
                    lastLoggedOut: user['last-logged-out'],
                    uptime: user.uptime
                }))
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                success: false,
                error: `Failed to get PPPoE users: ${errorMessage}`
            };
        }
    }

    /**
     * Get available bandwidth profiles
     */
    async getBandwidthProfiles(): Promise<MikroTikResponse> {
        try {
            const profiles = await this.executeCommand('/ppp/profile/print');

            return {
                success: true,
                data: profiles.map((profile: any) => ({
                    name: profile.name,
                    rateLimit: profile['rate-limit'],
                    localAddress: profile['local-address'],
                    remoteAddress: profile['remote-address']
                }))
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                success: false,
                error: `Failed to get bandwidth profiles: ${errorMessage}`
            };
        }
    }

    /**
     * Delete PPPoE user
     */
    async deletePppoeUser(username: string): Promise<MikroTikResponse> {
        try {
            console.log(`🗑️  Deleting PPPoE user: ${username}`);

            // Find user by name
            const users = await this.executeCommand('/ppp/secret/print', {
                '?name': username
            });

            if (!users || users.length === 0) {
                return {
                    success: false,
                    error: `PPPoE user '${username}' not found`
                };
            }

            const user = users[0];

            await this.executeCommand('/ppp/secret/remove', {
                '.id': user['.id']
            });

            console.log(`✅ Successfully deleted PPPoE user: ${username}`);
            return {
                success: true,
                message: `PPPoE user '${username}' deleted successfully`
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                success: false,
                error: `Failed to delete PPPoE user: ${errorMessage}`
            };
        }
    }

    /**
     * Test connection to the router
     */
    async testConnection(): Promise<MikroTikResponse> {
        try {
            const client = await this.connectToRouter();
            const systemInfo = await client.write('/system/resource/print');

            return {
                success: true,
                data: {
                    connected: true,
                    routerInfo: {
                        version: systemInfo[0]?.version,
                        boardName: systemInfo[0]?.['board-name'],
                        cpu: systemInfo[0]?.['cpu'],
                        uptime: systemInfo[0]?.uptime
                    }
                },
                message: 'Successfully connected to MikroTik router'
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                success: false,
                error: `Connection test failed: ${errorMessage}`
            };
        } finally {
            await this.closeConnection();
        }
    }

    /**
     * Graceful shutdown
     */
    async disconnect(): Promise<void> {
        await this.closeConnection();
    }
}

// Export singleton instance
export const mikrotikService = new MikroTikService();

// Export class for testing or multiple instances
export { MikroTikService };