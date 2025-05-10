import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { randomBytes } from 'crypto';
import { eq } from 'drizzle-orm';

export const clientPortalRouter = Router();

// Danışan portalı için özel Request tipi tanımlama
declare global {
  namespace Express {
    interface Request {
      clientSession?: {
        client: any;
        session: any;
      };
    }
  }
}

// Danışan girişi için endpoint
clientPortalRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { accessCode } = req.body;
    
    if (!accessCode) {
      return res.status(400).json({ message: 'Erişim kodu gereklidir' });
    }
    
    // Erişim kodu ile danışanı bul
    const client = await storage.getClientByAccessCode(accessCode);
    
    if (!client) {
      return res.status(401).json({ message: 'Geçersiz erişim kodu' });
    }
    
    // Oturum tokeni oluştur
    const sessionToken = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 gün geçerli
    
    // Oturumu veritabanına kaydet
    const session = await storage.createClientSession({
      clientId: client.id,
      sessionToken,
      expiresAt
    });
    
    // Oturum bilgilerini cookie ile gönder (httpOnly güvenlik için)
    res.cookie('client_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 gün
      sameSite: 'strict'
    });
    
    // Danışan bilgilerini gönder - clientVisibleNotes dahil
    res.json({
      id: client.id,
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      clientVisibleNotes: client.clientVisibleNotes || null, // Danışana görünecek notlar
    });
    
  } catch (error) {
    console.error('Client login error:', error);
    res.status(500).json({ message: 'Giriş yapılırken bir hata oluştu' });
  }
});

// Çıkış endpoint'i
clientPortalRouter.post('/logout', async (req: Request, res: Response) => {
  try {
    const sessionToken = req.cookies['client_session'];
    
    if (sessionToken) {
      // Oturumu veritabanından sil
      await storage.deleteClientSession(sessionToken);
      
      // Cookie'yi temizle
      res.clearCookie('client_session');
    }
    
    res.json({ message: 'Başarıyla çıkış yapıldı' });
  } catch (error) {
    console.error('Client logout error:', error);
    res.status(500).json({ message: 'Çıkış yapılırken bir hata oluştu' });
  }
});

// Oturum doğrulama middleware'i
export const verifyClientSession = async (req: Request, res: Response, next: Function) => {
  try {
    const sessionToken = req.cookies['client_session'];
    
    if (!sessionToken) {
      return res.status(401).json({ message: 'Giriş yapmanız gerekiyor' });
    }
    
    // Oturumu kontrol et
    const session = await storage.getClientSession(sessionToken);
    
    if (!session) {
      res.clearCookie('client_session');
      return res.status(401).json({ message: 'Oturumunuz sona ermiş' });
    }
    
    // Oturum süresini kontrol et
    if (new Date() > session.expiresAt) {
      await storage.deleteClientSession(sessionToken);
      res.clearCookie('client_session');
      return res.status(401).json({ message: 'Oturumunuzun süresi dolmuş' });
    }
    
    // Danışan bilgilerini al
    const client = await storage.getClient(session.clientId);
    
    if (!client) {
      await storage.deleteClientSession(sessionToken);
      res.clearCookie('client_session');
      return res.status(401).json({ message: 'Danışan bulunamadı' });
    }
    
    // Son aktivite zamanını güncelle
    await storage.updateClientSessionActivity(sessionToken);
    
    // İsteğe danışan bilgisini ekle
    req.clientSession = {
      client,
      session
    };
    
    next();
  } catch (error) {
    console.error('Verify client session error:', error);
    res.status(500).json({ message: 'Oturum doğrulanırken bir hata oluştu' });
  }
};

// Danışan bilgilerini getir
clientPortalRouter.get('/me', verifyClientSession, async (req: Request, res: Response) => {
  try {
    const { client } = req.clientSession!;
    
    // Danışan bilgilerini gönder - clientVisibleNotes dahil
    res.json({
      id: client.id,
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      clientVisibleNotes: client.clientVisibleNotes || null, // Danışana görünecek notlar
    });
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({ message: 'Danışan bilgileri getirilirken bir hata oluştu' });
  }
});

// Danışanın ölçümlerini getir
clientPortalRouter.get('/measurements', verifyClientSession, async (req: Request, res: Response) => {
  try {
    const { client } = req.clientSession!;
    
    const measurements = await storage.getMeasurements(client.id);
    
    res.json(measurements);
  } catch (error) {
    console.error('Get client measurements error:', error);
    res.status(500).json({ message: 'Ölçümler getirilirken bir hata oluştu' });
  }
});

// Danışanın diyet planını getir
clientPortalRouter.get('/diet-plans', verifyClientSession, async (req: Request, res: Response) => {
  try {
    const { client } = req.clientSession!;
    
    // Burada client.id ile ilişkilendirilmiş diyet planlarını getir
    // DietPlan modeli henüz bağlantılı olmayabilir, güncelleme gerekebilir
    const dietPlans = await storage.getDietPlans(client.userId);
    
    res.json(dietPlans);
  } catch (error) {
    console.error('Get client diet plans error:', error);
    res.status(500).json({ message: 'Diyet planları getirilirken bir hata oluştu' });
  }
});

// Diyetisyen tavsiyelerini getir (danışana görünecek notlar)
clientPortalRouter.get('/recommendations', verifyClientSession, async (req: Request, res: Response) => {
  try {
    const { client } = req.clientSession!;
    
    if (client.clientVisibleNotes) {
      // Diyetisyenin danışan için yazdığı notları tavsiye olarak döndür
      res.json([
        {
          id: 1,
          title: 'Diyetisyeninizden Notlar',
          content: client.clientVisibleNotes,
          createdAt: new Date().toISOString()
        }
      ]);
    } else {
      // Danışan için not yoksa boş dizi döndür
      res.json([]);
    }
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ message: 'Tavsiyeler getirilirken bir hata oluştu' });
  }
});

export default clientPortalRouter;