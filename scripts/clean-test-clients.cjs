// scripts/clean-test-clients.cjs
// Bu script, sistem üzerindeki test danışanlarını temizlemek için kullanılır
// Özellikle kullanıcı ID'si 2 olan ve belli bir sayının üzerindeki danışanları siler
// Kullanım: node scripts/clean-test-clients.cjs

const { Client } = require('pg');

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
      "SELECT COUNT(*) FROM clients WHERE user_id = 2"
    );
    const clientCount = parseInt(countResult.rows[0].count);
    console.log(`Toplam ${clientCount} adet test danışanı bulundu`);

    if (clientCount <= 20) {
      console.log("Silinecek test danışanı yok, maksimum sayının altında");
      return;
    }

    // Korunacak danışanların listesini al (en yeni eklenmiş 20 danışan)
    const keepResult = await client.query(
      "SELECT id FROM clients WHERE user_id = 2 ORDER BY created_at DESC LIMIT 20"
    );
    const keepIds = keepResult.rows.map(row => row.id);
    console.log(`Korunacak danışan ID'leri: ${keepIds.join(', ')}`);

    // ARRAY tipini kullanarak IN operatörü ile çalıştır
    // Bu danışanların ölçümlerini sil
    const deleteMeasurementsResult = await client.query(
      "DELETE FROM measurements WHERE client_id IN (SELECT id FROM clients WHERE user_id = 2 AND id NOT IN (SELECT unnest($1::int[])))",
      [keepIds]
    );
    console.log(`${deleteMeasurementsResult.rowCount || 0} adet ölçüm silindi`);

    // Test danışanlarını sil
    const deleteResult = await client.query(
      "DELETE FROM clients WHERE user_id = 2 AND id NOT IN (SELECT unnest($1::int[]))",
      [keepIds]
    );
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