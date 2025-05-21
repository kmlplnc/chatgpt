const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'socialmediamaster',
  password: 'postgres',
  port: 5432,
});

client.connect();
client.query(
  "SELECT column_name FROM information_schema.columns WHERE table_name = 'clients';",
  (err, res) => {
    if (err) throw err;
    console.log('clients tablosundaki sütunlar:', res.rows.map(r => r.column_name));
    client.end();
  }
); 