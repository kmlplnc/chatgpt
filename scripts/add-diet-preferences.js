import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addDietPreferences() {
  try {
    await pool.connect();
    console.log('Connected to database');

    // Add diet_preferences column as TEXT array with default empty array
    await pool.query(`
      ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS diet_preferences TEXT[] DEFAULT ARRAY[]::TEXT[]
    `);
    console.log('Successfully added diet_preferences column');

  } catch (err) {
    console.error('Error adding diet_preferences column:', err);
  } finally {
    await pool.end();
  }
}

addDietPreferences(); 