import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const db = drizzle(pool);

async function test() {
  try {
    const result = await pool.query('SELECT 1');
    console.log('Database connection successful:', result.rows);
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Database connection failed:', err);
    await pool.end();
    process.exit(1);
  }
}

test(); 