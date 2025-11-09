import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

export const db = drizzle(process.env.DATABASE_URL!, {
  schema,
  logger: process.env.NODE_ENV === 'development'
});

// Re-export schema for convenience
export * from './schema';

// Export the db instance with schema
export { schema };