const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'socialmediamaster',
  password: 'postgres', // şifrenizi gerekirse değiştirin
  port: 5432,
});

const migrationSQL = `
DO $$ BEGIN
  BEGIN ALTER TABLE clients RENAME COLUMN "firstName" TO "first_name"; EXCEPTION WHEN undefined_column THEN NULL; END;
  BEGIN ALTER TABLE clients RENAME COLUMN "lastName" TO "last_name"; EXCEPTION WHEN undefined_column THEN NULL; END;
  BEGIN ALTER TABLE clients RENAME COLUMN "birthDate" TO "birth_date"; EXCEPTION WHEN undefined_column THEN NULL; END;
  BEGIN ALTER TABLE clients RENAME COLUMN "userId" TO "user_id"; EXCEPTION WHEN undefined_column THEN NULL; END;
  BEGIN ALTER TABLE clients RENAME COLUMN "medicalConditions" TO "medical_conditions"; EXCEPTION WHEN undefined_column THEN NULL; END;
  BEGIN ALTER TABLE clients RENAME COLUMN "clientVisibleNotes" TO "client_visible_notes"; EXCEPTION WHEN undefined_column THEN NULL; END;
  BEGIN ALTER TABLE clients RENAME COLUMN "startDate" TO "start_date"; EXCEPTION WHEN undefined_column THEN NULL; END;
  BEGIN ALTER TABLE clients RENAME COLUMN "endDate" TO "end_date"; EXCEPTION WHEN undefined_column THEN NULL; END;
  BEGIN ALTER TABLE clients RENAME COLUMN "accessCode" TO "access_code"; EXCEPTION WHEN undefined_column THEN NULL; END;
  BEGIN ALTER TABLE clients RENAME COLUMN "createdAt" TO "created_at"; EXCEPTION WHEN undefined_column THEN NULL; END;
  BEGIN ALTER TABLE clients RENAME COLUMN "updatedAt" TO "updated_at"; EXCEPTION WHEN undefined_column THEN NULL; END;
END $$;

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

async function migrate() {
  try {
    await client.connect();
    await client.query('BEGIN');
    await client.query(migrationSQL);
    await client.query('COMMIT');
    console.log('Migration başarıyla tamamlandı!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration hatası:', err.message);
  } finally {
    await client.end();
  }
}

migrate(); 