import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function makeUserIdNullable() {
  try {
    await pool.connect();
    console.log('Connected to database');

    // Make user_id column nullable
    await pool.query(`
      ALTER TABLE clients 
      ALTER COLUMN user_id DROP NOT NULL
    `);
    console.log('Successfully made user_id column nullable');

  } catch (err) {
    console.error('Error making user_id nullable:', err);
  } finally {
    await pool.end();
  }
}

makeUserIdNullable(); 