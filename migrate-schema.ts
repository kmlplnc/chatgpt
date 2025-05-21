import pkg from 'pg';
const { Pool } = pkg;
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function migrateSchema() {
  try {
    // Base schema
    const baseSchema = fs.readFileSync(path.join(__dirname, 'base-schema.sql'), 'utf8');
    await pool.query(baseSchema);
    console.log('Base schema migration completed successfully');

    // Additional schema updates
    const additionalSchema = fs.readFileSync(path.join(__dirname, 'db-schema-updates.sql'), 'utf8');
    await pool.query(additionalSchema);
    console.log('Additional schema migration completed successfully');

    // Client portal schema
    const clientPortalSchema = fs.readFileSync(path.join(__dirname, 'client-portal-schema.sql'), 'utf8');
    await pool.query(clientPortalSchema);
    console.log('Client portal schema migration completed successfully');

    // Add username column
    const addUsernameColumn = fs.readFileSync(path.join(__dirname, 'add-username-column.sql'), 'utf8');
    await pool.query(addUsernameColumn);
    console.log('Username column added successfully');

    console.log('All schema migrations completed successfully');
  } catch (error) {
    console.error('Schema migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrateSchema(); 