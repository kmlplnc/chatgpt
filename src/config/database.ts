import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Debug logs
// console.log("Password:", process.env.DB_PASSWORD);
// console.log("Type:", typeof process.env.DB_PASSWORD);

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: String(process.env.DB_PASSWORD || '145314'),
  database: process.env.DB_NAME || 'mybd',
  ssl: false
});

// Test the connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Successfully connected to PostgreSQL database');
  release();
});

export default pool; 