import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const { Client } = pg;
dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/socialmediamaster',
});

const createTablesSQL = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  email TEXT,
  name TEXT,
  role TEXT DEFAULT 'user',
  subscription_status TEXT DEFAULT 'free' NOT NULL,
  subscription_plan TEXT,
  subscription_start_date TIMESTAMP,
  subscription_end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  birth_date DATE,
  gender TEXT NOT NULL,
  height NUMERIC(5,2),
  occupation TEXT,
  medical_conditions TEXT,
  allergies TEXT,
  medications TEXT,
  notes TEXT,
  client_visible_notes TEXT,
  status TEXT DEFAULT 'active' NOT NULL,
  start_date DATE DEFAULT NOW() NOT NULL,
  end_date DATE,
  access_code TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Measurements table
CREATE TABLE IF NOT EXISTS measurements (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id) NOT NULL,
  date DATE DEFAULT NOW() NOT NULL,
  weight NUMERIC(5,2) NOT NULL,
  height NUMERIC(5,2) NOT NULL,
  bmi NUMERIC(5,2) NOT NULL,
  body_fat_percentage NUMERIC(5,2),
  waist_circumference NUMERIC(5,2),
  hip_circumference NUMERIC(5,2),
  chest_circumference NUMERIC(5,2),
  arm_circumference NUMERIC(5,2),
  thigh_circumference NUMERIC(5,2),
  calf_circumference NUMERIC(5,2),
  basal_metabolic_rate INTEGER,
  total_daily_energy_expenditure INTEGER,
  activity_level TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_measurements_client_id ON measurements(client_id);
CREATE INDEX IF NOT EXISTS idx_measurements_date ON measurements(date);
`;

async function setupDatabase() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Create tables
    await client.query(createTablesSQL);
    console.log('Database tables created successfully');

    // Create a test user if it doesn't exist
    const testUser = {
      username: 'testuser',
      password: 'testpass', // In production, this should be hashed
      email: 'test@example.com',
      name: 'Test User',
      role: 'admin'
    };

    const userResult = await client.query(
      'INSERT INTO users (username, password, email, name, role) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (username) DO NOTHING RETURNING id',
      [testUser.username, testUser.password, testUser.email, testUser.name, testUser.role]
    );

    console.log('Database setup completed successfully');
  } catch (err) {
    console.error('Error setting up database:', err);
  } finally {
    await client.end();
  }
}

setupDatabase(); 