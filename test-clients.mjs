// Veri tabanı yük testi için script
// Açıklama: Bu script, bir PostgreSQL veritabanında çok sayıda test danışanı oluşturur 
// veya temizler. Yük testleri ve performans değerlendirmesi için kullanılabilir.

import { db } from './server/db.js';
import { clients, measurements } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function countClients() {
  try {
    // Veri tabanında kaç danışan var?
    const allClients = await db.select().from(clients);
    console.log(`Veritabanında toplam ${allClients.length} danışan bulunuyor.`);
    
    // Hangi kullanıcılar için danışanlar var?
    const userIds = [...new Set(allClients.map(c => c.userId))].filter(id => id !== null);
    console.log('Danışanı olan kullanıcılar:', userIds);
    
    // Her kullanıcı için danışan sayısını gösterelim
    for (const userId of userIds) {
      const userClients = allClients.filter(c => c.userId === userId);
      console.log(`Kullanıcı ID ${userId}: ${userClients.length} danışan`);
    }
    
    return allClients.length;
  } catch (err) {
    console.error('Hata:', err);
    return 0;
  }
}

// Kullanım örneği
countClients().then(() => {
  console.log('Danışan sayma işlemi tamamlandı.');
});
