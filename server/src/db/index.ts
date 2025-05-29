import { PrismaClient } from '@prisma/client';

// PrismaClient instance'ını oluştur
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  // Neon.tech connection pooling için
  log: ['query', 'error', 'warn'],
});

// Veritabanı bağlantısını test et
async function testConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Veritabanı bağlantısı başarılı');
    
    // Test sorgusu çalıştır
    const clientCount = await prisma.client.count();
    console.log(`📊 Veritabanında ${clientCount} danışan kaydı bulunuyor`);
    
  } catch (error) {
    console.error('❌ Veritabanı bağlantı hatası:', error);
    process.exit(1);
  }
}

// Uygulama kapatıldığında bağlantıyı kapat
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// Bağlantıyı hemen test et
testConnection().catch(console.error);

export { prisma, testConnection }; 