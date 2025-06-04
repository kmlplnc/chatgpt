import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function renameColumn() {
  try {
    await pool.connect();
    console.log('Connected to database');

    // Rename the column
    await pool.query('ALTER TABLE users RENAME COLUMN name TO full_name');
    console.log('Successfully renamed name column to full_name');

  } catch (err) {
    console.error('Error renaming column:', err);
  } finally {
    await pool.end();
  }
}

renameColumn(); 