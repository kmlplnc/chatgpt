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

async function updatePasswordColumn() {
  try {
    const query = fs.readFileSync(path.join(__dirname, 'update-password-column.sql'), 'utf8');
    await pool.query(query);
    console.log('Password sütunu başarıyla güncellendi.');
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await pool.end();
  }
}

updatePasswordColumn(); 