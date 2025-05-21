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

async function checkUsers() {
  try {
    const query = fs.readFileSync(path.join(__dirname, 'check-users.sql'), 'utf8');
    const result = await pool.query(query);
    console.log('\nUsers tablosundaki kullanıcılar:');
    console.log('----------------------------');
    if (result.rows.length === 0) {
      console.log('Henüz hiç kullanıcı yok.');
    } else {
      result.rows.forEach(user => {
        console.log(`ID: ${user.id}`);
        console.log(`Username: ${user.username}`);
        console.log(`Email: ${user.email}`);
        console.log(`Full Name: ${user.full_name}`);
        console.log(`Role: ${user.role}`);
        console.log(`Created At: ${user.created_at}`);
        console.log(`Subscription Status: ${user.subscription_status}`);
        console.log('----------------------------');
      });
    }
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await pool.end();
  }
}

checkUsers(); 