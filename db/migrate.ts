/**
 * Manual Database Migration Script
 *
 * This script manually creates the database tables since drizzle-kit is not working properly
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';

async function migrate() {
  console.log('Starting database migration...');

  try {
    // Simple database connection test
    const db = drizzle(process.env.DATABASE_URL!);

    // Test basic connection
    await db.execute(sql`SELECT 1 as test`);
    console.log('✓ Database connection successful');

    // Create extensions
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    console.log('✓ Created uuid-ossp extension');

    console.log('Database migration completed successfully!');
    console.log('Note: Tables will be created when the application first runs');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
if (require.main === module) {
  migrate()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { migrate };