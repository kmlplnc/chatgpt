const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'socialmediamaster',
  password: 'postgres',
  port: 5432,
});

const sql = `
ALTER TABLE clients ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS medical_conditions TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS client_visible_notes TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS access_code TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
`;

async function run() {
  try {
    await client.connect();
    await client.query(sql);
    console.log('Eksik sütunlar başarıyla eklendi!');
  } catch (err) {
    console.error('Hata:', err.message);
  } finally {
    await client.end();
  }
}

run(); 