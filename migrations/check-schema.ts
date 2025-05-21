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

async function checkSchema() {
  try {
    const query = fs.readFileSync(path.join(__dirname, 'check-schema.sql'), 'utf8');
    const result = await pool.query(query);
    console.log('\nUsers tablosu yapısı:');
    console.log('----------------------------');
    result.rows.forEach(column => {
      console.log(`Sütun: ${column.column_name}`);
      console.log(`Tip: ${column.data_type}`);
      console.log(`Null olabilir: ${column.is_nullable}`);
      console.log(`Varsayılan değer: ${column.column_default}`);
      console.log('----------------------------');
    });
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await pool.end();
  }
}

checkSchema(); 