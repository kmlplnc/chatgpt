import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function mergeColumns() {
  try {
    await pool.connect();
    console.log('Connected to database');

    // First, update full_name with name values where full_name is null
    await pool.query(`
      UPDATE users 
      SET full_name = name 
      WHERE full_name IS NULL AND name IS NOT NULL
    `);
    console.log('Updated full_name with name values');

    // Then drop the name column
    await pool.query('ALTER TABLE users DROP COLUMN name');
    console.log('Successfully dropped name column');

  } catch (err) {
    console.error('Error merging columns:', err);
  } finally {
    await pool.end();
  }
}

mergeColumns(); 