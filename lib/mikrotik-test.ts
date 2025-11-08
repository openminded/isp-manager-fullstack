import { mikrotikService } from './mikrotik';
import { MikroTikUtils } from './mikrotik-utils';

/**
 * Test script for MikroTik RouterOS API service
 * This file demonstrates how to use the MikroTik service
 */

export async function testMikroTikConnection(): Promise<void> {
    console.log('🧪 Testing MikroTik connection...');

    try {
        const result = await mikrotikService.testConnection();

        if (result.success) {
            console.log('✅ MikroTik connection test successful');
            if (result.data?.routerInfo) {
                console.log('📊 Router Information:', {
                    version: result.data.routerInfo.version,
                    boardName: result.data.routerInfo.boardName,
                    cpu: result.data.routerInfo.cpu,
                    uptime: result.data.routerInfo.uptime
                });
            }
        } else {
            console.error('❌ MikroTik connection test failed:', result.error);
        }
    } catch (error) {
        console.error('❌ MikroTik test error:', error);
    }
}

export async function testPppoeOperations(): Promise<void> {
    console.log('🧪 Testing PPPoE operations...');

    const testUsername = MikroTikUtils.generateUsername('TestClient');
    const testPassword = MikroTikUtils.generatePassword();
    const testProfile = '10M/5M';

    console.log(`📝 Generated test user: ${testUsername} / ${testPassword}`);

    try {
        // Test user creation
        console.log('1️⃣ Testing PPPoE user creation...');
        const createResult = await mikrotikService.createPppoeUser(
            testUsername,
            testPassword,
            testProfile,
            'Test user for API validation'
        );

        if (createResult.success) {
            console.log('✅ PPPoE user created successfully');
        } else {
            console.error('❌ Failed to create PPPoE user:', createResult.error);
            return;
        }

        // Test user status check
        console.log('2️⃣ Testing user status check...');
        const statusResult = await mikrotikService.getUserStatus(testUsername);

        if (statusResult.success) {
            console.log('✅ User status retrieved:', statusResult.data);
        } else {
            console.error('❌ Failed to get user status:', statusResult.error);
        }

        // Test user update
        console.log('3️⃣ Testing user update...');
        const updateResult = await mikrotikService.updatePppoeUser(
            testUsername,
            '20M/10M',
            undefined,
            'Updated test user'
        );

        if (updateResult.success) {
            console.log('✅ User updated successfully');
        } else {
            console.error('❌ Failed to update user:', updateResult.error);
        }

        // Test user disable
        console.log('4️⃣ Testing user disable...');
        const disableResult = await mikrotikService.disablePppoeUser(testUsername);

        if (disableResult.success) {
            console.log('✅ User disabled successfully');
        } else {
            console.error('❌ Failed to disable user:', disableResult.error);
        }

        // Test user enable
        console.log('5️⃣ Testing user enable...');
        const enableResult = await mikrotikService.enablePppoeUser(testUsername);

        if (enableResult.success) {
            console.log('✅ User enabled successfully');
        } else {
            console.error('❌ Failed to enable user:', enableResult.error);
        }

        // Test user deletion (cleanup)
        console.log('6️⃣ Testing user deletion (cleanup)...');
        const deleteResult = await mikrotikService.deletePppoeUser(testUsername);

        if (deleteResult.success) {
            console.log('✅ Test user deleted successfully');
        } else {
            console.error('❌ Failed to delete test user:', deleteResult.error);
        }

    } catch (error) {
        console.error('❌ PPPoE operations test error:', error);
    }
}

export async function testBandwidthProfiles(): Promise<void> {
    console.log('🧪 Testing bandwidth profile operations...');

    try {
        const profilesResult = await mikrotikService.getBandwidthProfiles();

        if (profilesResult.success) {
            console.log('✅ Bandwidth profiles retrieved successfully');
            console.log('📊 Available profiles:', profilesResult.data);
        } else {
            console.error('❌ Failed to get bandwidth profiles:', profilesResult.error);
        }
    } catch (error) {
        console.error('❌ Bandwidth profiles test error:', error);
    }
}

export async function testAllPppoeUsers(): Promise<void> {
    console.log('🧪 Testing get all PPPoE users...');

    try {
        const usersResult = await mikrotikService.getAllPppoeUsers();

        if (usersResult.success) {
            console.log('✅ All PPPoE users retrieved successfully');
            console.log(`📊 Total users: ${usersResult.data?.length || 0}`);
            if (usersResult.data && usersResult.data.length > 0) {
                console.log('👥 Sample users:', usersResult.data.slice(0, 5));
            }
        } else {
            console.error('❌ Failed to get PPPoE users:', usersResult.error);
        }
    } catch (error) {
        console.error('❌ Get all users test error:', error);
    }
}

/**
 * Run all MikroTik tests (for development/debugging)
 */
export async function runAllMikroTikTests(): Promise<void> {
    console.log('🚀 Starting MikroTik API service tests...\n');

    await testMikroTikConnection();
    console.log('\n' + '='.repeat(50) + '\n');

    await testBandwidthProfiles();
    console.log('\n' + '='.repeat(50) + '\n');

    await testAllPppoeUsers();
    console.log('\n' + '='.repeat(50) + '\n');

    // Only run PPPoE operations if connection test passed
    // and we want to test CRUD operations
    if (process.env.NODE_ENV === 'development') {
        await testPppoeOperations();
    }

    console.log('\n🏁 MikroTik API service tests completed');

    // Clean up connection
    await mikrotikService.disconnect();
}

// Export utility functions for convenience
export { MikroTikUtils };

// If this file is run directly, execute all tests
if (require.main === module) {
    runAllMikroTikTests()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error('Test execution failed:', error);
            process.exit(1);
        });
}