import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
import { Pool } from 'pg';
import * as schema from '@shared/schema';
import * as dotenv from 'dotenv';

dotenv.config();

console.log('Database connection string:', process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 10000, // How long to wait for a connection (increased to 10 seconds)
  maxUses: 7500, // Close a connection after it has been used this many times
  keepAlive: true, // Keep the connection alive
  keepAliveInitialDelayMillis: 10000, // Initial delay before sending keepalive
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Test database connection with retry
async function testConnection(retries = 5, delay = 5000) { // Increased delay to 5 seconds
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
