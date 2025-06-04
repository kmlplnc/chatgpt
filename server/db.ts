import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
import { Pool } from 'pg';
import * as schema from '@shared/schema';
import * as dotenv from 'dotenv';

dotenv.config();

// URL encode the password to handle special characters
const encodePassword = (password: string) => encodeURIComponent(password);

const connectionString = process.env.DATABASE_URL || 
  `postgresql://${process.env.DB_USER || 'postgres'}:${encodePassword(process.env.DB_PASSWORD || 'postgres')}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'mybd'}`;

console.log('Connecting to database with connection string:', connectionString.replace(/:[^:@]+@/, ':****@')); // Log connection string without password

const pool = new Pool({
  connectionString,
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  maxUses: 7500,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Test database connection with retry
async function testConnection(retries = 5, delay = 5000) {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      console.log('Database connection successful');
      client.release();
      return true;
    } catch (err) {
      console.error(`Database connection attempt ${i + 1} failed:`, err);
      if (i === retries - 1) {
        console.error('All database connection attempts failed');
        return false;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return false;
}

// Test the connection
testConnection().then(success => {
  if (!success) {
    console.error('Failed to establish database connection');
    process.exit(1);
  }
});

const db = drizzle(pool, { schema });

// Export the pool for use in other files (e.g., connect-pg-simple)
export { pool };

export default db;
