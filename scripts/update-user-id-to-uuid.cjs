const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL ortam değişkeni bulunamadı");
  process.exit(1);
}

const client = new Client({
  connectionString: DATABASE_URL,
});

async function updateUserIdToUUID() {
  try {
    await client.connect();
    console.log("Veritabanına bağlandı");

    // Enable UUID extension if not already enabled
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // Start transaction
    await client.query('BEGIN');

    // Update users table first
    await client.query(`
      ALTER TABLE users 
      ALTER COLUMN id TYPE uuid USING id::uuid;
    `);

    // Update clients table
    await client.query(`
      ALTER TABLE clients 
      ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
    `);

    // Update diet_plans table
    await client.query(`
      ALTER TABLE diet_plans 
      ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
    `);

    // Update saved_foods table
    await client.query(`
      ALTER TABLE saved_foods 
      ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
    `);

    // Update appointments table
    await client.query(`
      ALTER TABLE appointments 
      ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
    `);

    // Update messages table
    await client.query(`
      ALTER TABLE messages 
      ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
    `);

    // Update notifications table
    await client.query(`
      ALTER TABLE notifications 
      ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
    `);

    // Commit transaction
    await client.query('COMMIT');
    console.log("Tüm tablolar başarıyla güncellendi!");

  } catch (err) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error("Hata:", err);
  } finally {
    await client.end();
  }
}

updateUserIdToUUID(); 