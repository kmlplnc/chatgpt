// scripts/clean-test-clients.mjs
// Bu script, sistem üzerindeki test danışanlarını temizlemek için kullanılır
// Özellikle kullanıcı ID'si 2 olan ve belli bir sayının üzerindeki danışanları siler
// Kullanım: node scripts/clean-test-clients.mjs

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// __dirname özelliğini ES modülleri için tanımla
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ortam değişkenlerini yükle
dotenv.config({ path: join(__dirname, '..', '.env') });

const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL ortam değişkeni bulunamadı");
  process.exit(1);
}

const client = new Client({
  connectionString: DATABASE_URL,
});

async function cleanTestClients() {
  try {
    await client.connect();
    console.log("Veritabanına bağlandı");

    // Kaç tane danışan var, kontrol et
    const countResult = await client.query(
      "SELECT COUNT(*) FROM clients WHERE userId = 2"
    );
    const clientCount = parseInt(countResult.rows[0].count);
    console.log(`Toplam ${clientCount} adet test danışanı bulundu`);

    if (clientCount <= 20) {
      console.log("Silinecek test danışanı yok, maksimum sayının altında");
      await client.end();
      return;
    }

    // Korunacak danışanların listesini al (en yeni eklenmiş 20 danışan)
    const keepResult = await client.query(
      "SELECT id FROM clients WHERE userId = 2 ORDER BY createdAt DESC LIMIT 20"
    );
    const keepIds = keepResult.rows.map(row => row.id);
    
    if (keepIds.length === 0) {
      console.log("Korunacak danışan bulunamadı");
      await client.end();
      return;
    }
    
    console.log(`Korunacak danışan ID'leri: ${keepIds.join(', ')}`);

    // Bu danışanların ölçümlerini sil
    const deleteMeasurementsQuery = `
      DELETE FROM measurements 
      WHERE clientId IN (
        SELECT id FROM clients 
        WHERE userId = 2 AND id NOT IN (${keepIds.map((_, i) => `$${i + 1}`).join(',')})
      )
    `;
    
    const deleteMeasurementsResult = await client.query(deleteMeasurementsQuery, keepIds);
    console.log(`${deleteMeasurementsResult.rowCount || 0} adet ölçüm silindi`);

    // Test danışanlarını sil
    const deleteClientQuery = `
      DELETE FROM clients 
      WHERE userId = 2 AND id NOT IN (${keepIds.map((_, i) => `$${i + 1}`).join(',')})
    `;
    
    const deleteResult = await client.query(deleteClientQuery, keepIds);
    console.log(`${deleteResult.rowCount || 0} adet test danışanı silindi`);

    console.log("İşlem tamamlandı");
  } catch (error) {
    console.error("Hata oluştu:", error);
  } finally {
    await client.end();
    console.log("Veritabanı bağlantısı kapatıldı");
  }
}

// Script'i çalıştır
cleanTestClients().catch(console.error);