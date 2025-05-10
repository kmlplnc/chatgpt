// Veri tabanı yük testi için script
// Açıklama: Bu script, bir PostgreSQL veritabanında çok sayıda test danışanı oluşturur 
// veya temizler. Yük testleri ve performans değerlendirmesi için kullanılabilir.

import { db } from './server/db.js';
import { clients, measurements } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function generateTestClients(count = 100, userId = 2) {
  console.log(`${userId} ID'li kullanıcı için ${count} test danışanı oluşturuluyor...`);
  
  const startTime = Date.now();
  const names = ['Ali', 'Ayşe', 'Mehmet', 'Fatma', 'Ahmet', 'Zeynep', 'Mustafa', 'Emine', 'Hüseyin', 'Hatice'];
  const surnames = ['Yılmaz', 'Kaya', 'Demir', 'Çelik', 'Şahin', 'Yıldız', 'Öztürk', 'Aydın', 'Özdemir', 'Arslan'];
  const genders = ['Erkek', 'Kadın'];
  
  // Önce kaç danışan zaten var kontrol edelim
  const existingClients = await db.select().from(clients).where(eq(clients.userId, userId));
  console.log(`${existingClients.length} mevcut danışan bulundu.`);
  
  const batchSize = 50;
  let inserted = 0;

  for (let batch = 0; batch < Math.ceil(count / batchSize); batch++) {
    const clientsToInsert = [];
    const currentBatchSize = Math.min(batchSize, count - inserted);
    
    for (let i = 0; i < currentBatchSize; i++) {
      const firstName = names[Math.floor(Math.random() * names.length)];
      const lastName = surnames[Math.floor(Math.random() * surnames.length)];
      const gender = genders[Math.floor(Math.random() * genders.length)];
      
      clientsToInsert.push({
        userId,
        firstName,
        lastName,
        email: `test_${inserted + i}@example.com`,
        gender,
        status: 'Aktif',
        startDate: new Date().toISOString().split('T')[0],
        endDate: null,
        phone: null,
        birthDate: null,
        occupation: null,
        medicalConditions: null,
        allergies: null,
        notes: null,
        goal: "Kilo vermek",
        height: (160 + Math.floor(Math.random() * 30)).toString(),
        weight: (60 + Math.floor(Math.random() * 40)).toString(),
      });
    }
    
    await db.insert(clients).values(clientsToInsert);
    inserted += currentBatchSize;
    console.log(`Batch ${batch + 1} eklendi, ilerleme: ${inserted}/${count}`);
  }
  
  const endTime = Date.now();
  console.log(`${inserted} test danışanı ${(endTime - startTime) / 1000} saniyede oluşturuldu.`);
  
  // Ekleme sonrası toplam danışan sayısını saydır
  const totalClients = await db.select().from(clients).where(eq(clients.userId, userId));
  console.log(`${userId} ID'li kullanıcı için toplam danışan: ${totalClients.length}`);
}

async function removeSomeTestClients(userId = 2, keepMax = 10) {
  // Tüm test danışanlarını al
  const allClients = await db.select().from(clients).where(eq(clients.userId, userId));
  console.log(`${userId} ID'li kullanıcı için ${allClients.length} danışan bulundu.`);
  
  if (allClients.length <= keepMax) {
    console.log(`Danışan sayısı (${allClients.length}) zaten ${keepMax} veya daha az. Silme işlemi gerekmez.`);
    return;
  }
  
  const testClients = allClients.filter(client => client.email && client.email.startsWith('test_'));
  console.log(`Silinebilecek ${testClients.length} test danışanı bulundu.`);
  
  const clientsToRemove = testClients.length - keepMax > 0 ? testClients.slice(0, testClients.length - keepMax) : [];
  console.log(`${clientsToRemove.length} test danışanı silinecek.`);
  
  if (clientsToRemove.length === 0) return;
  
  const batchSize = 50;
  let removed = 0;
  
  for (let batch = 0; batch < Math.ceil(clientsToRemove.length / batchSize); batch++) {
    const currentBatch = clientsToRemove.slice(batch * batchSize, (batch + 1) * batchSize);
    const clientIds = currentBatch.map(c => c.id);
    
    // Önce bu danışanların ölçümlerini sil
    for (const clientId of clientIds) {
      await db.delete(measurements).where(eq(measurements.clientId, clientId));
    }
    
    // Sonra danışanları sil
    await db.delete(clients).where(clients => clients.id.in(clientIds));
    
    removed += currentBatch.length;
    console.log(`Batch ${batch + 1} silindi, ilerleme: ${removed}/${clientsToRemove.length}`);
  }
  
  console.log(`${removed} test danışanı silindi.`);
  
  // Kalan danışanları say
  const remaining = await db.select().from(clients).where(eq(clients.userId, userId));
  console.log(`${userId} ID'li kullanıcı için kalan danışan: ${remaining.length}`);
}

// Komut satırı argümanlarını ayrıştır
const args = process.argv.slice(2);
const command = args[0];
const param = parseInt(args[1]) || 100;
const userId = parseInt(args[2]) || 2;

if (command === 'generate') {
  generateTestClients(param, userId).catch(console.error);
} else if (command === 'cleanup') {
  removeSomeTestClients(userId, param).catch(console.error);
} else {
  console.log('Kullanım: node test-clients.js [generate|cleanup] [count|keepMax] [userId]');
  console.log('  generate: test danışanları oluşturur');
  console.log('  cleanup: test danışanlarını siler, belirli bir sayıda tutar');
  console.log('  count: oluşturulacak danışan sayısı (varsayılan: 100)');
  console.log('  keepMax: temizleme sırasında tutulacak maksimum danışan sayısı (varsayılan: 10)');
  console.log('  userId: danışanların oluşturulacağı/temizleneceği kullanıcı ID (varsayılan: 2)');
}
