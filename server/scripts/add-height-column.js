const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'socialmediamaster',
  password: 'postgres',
  port: 5432,
});

async function addHeightColumn() {
  try {
    // Add height column
    await pool.query(`
      ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS height NUMERIC(5,2);
    `);
    
    // Set default height for existing records
    await pool.query(`
      UPDATE clients 
      SET height = 170.00 
      WHERE height IS NULL;
    `);
    
    console.log('Height column added successfully');
  } catch (error) {
    console.error('Error adding height column:', error);
  } finally {
    await pool.end();
  }
}

addHeightColumn(); 