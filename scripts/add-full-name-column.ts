import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'diyetisyen_db',
});

async function addFullNameColumn() {
  try {
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS full_name TEXT;
    `);
    console.log('Successfully added full_name column to users table');
  } catch (error) {
    console.error('Error adding full_name column:', error);
  } finally {
    await pool.end();
  }
}

addFullNameColumn(); 