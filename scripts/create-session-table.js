import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL ortam değişkeni bulunamadı");
  process.exit(1);
}

const client = new Client({
  connectionString: DATABASE_URL,
});

async function createSessionTable() {
  try {
    await client.connect();
    console.log("Veritabanına bağlandı");

    // Session tablosunu oluştur
    await client.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      );

      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
    `);

    console.log("Session tablosu başarıyla oluşturuldu");
  } catch (err) {
    console.error("Hata:", err);
  } finally {
    await client.end();
  }
}

createSessionTable(); 