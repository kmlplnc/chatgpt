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
    console.log("Login endpoint hit, body:", req.body);

    // Sadece access_code'u alın
    const { access_code } = req.body;

    if (!access_code) {
      console.error("No access_code provided");
      return res.status(400).json({ message: 'Erişim kodu gereklidir' });
    }

    // Erişim kodu ile danışanı bul
    const client = await storage.getClientByAccessCode(access_code);
    console.log("Client found:", client);

    if (!client) {
      console.error("No client found for access_code:", access_code);
      return res.status(401).json({ message: 'Geçersiz erişim kodu' });
    }

    // Oturum tokeni oluştur
    const sessionToken = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 gün geçerli

    // Oturumu veritabanına kaydet
    const session = await storage.createClientSession({
      client_id: client.id,
      session_token: sessionToken,
      expires_at: expiresAt
    });
    console.log("Session created:", session);

    // Oturum bilgilerini cookie ile gönder (httpOnly güvenlik için)
    res.cookie('client_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 gün
      sameSite: 'strict'
    });

    // Danışan bilgilerini gönder - client_visible_notes dahil
    res.json({
      id: client.id,
      first_name: client.first_name,
      last_name: client.last_name,
      email: client.email,
      client_visible_notes: client.client_visible_notes || null, // Danışana görünecek notlar
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
    if (new Date() > session.expires_at) {
      await storage.deleteClientSession(sessionToken);
      res.clearCookie('client_session');
      return res.status(401).json({ message: 'Oturumunuzun süresi dolmuş' });
    }

    // Danışan bilgilerini al
    const client = await storage.getClient(session.client_id);

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

    // Danışan bilgilerini gönder - client_visible_notes dahil
    res.json({
      id: client.id,
      first_name: client.first_name,
      last_name: client.last_name,
      email: client.email,
      client_visible_notes: client.client_visible_notes || null, // Danışana görünecek notlar
    });
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({ message: 'Danışan bilgileri getirilirken bir hata oluştu' });
  }
});

// Diyetisyen bilgilerini getir
clientPortalRouter.get('/dietitian', verifyClientSession, async (req: Request, res: Response) => {
  try {
    const { client } = req.clientSession!;

    // Diyetisyen bilgilerini getir
    const dietitian = await storage.getUser(client.user_id);

    if (!dietitian) {
      return res.status(404).json({ message: 'Diyetisyen bulunamadı' });
    }

    // Diyetisyen bilgilerini gönder (sadece gerekli alanlar)
    res.json({
      id: dietitian.id,
      name: dietitian.full_name || dietitian.username,
      email: dietitian.email
    });
  } catch (error) {
    console.error('Get dietitian error:', error);
    res.status(500).json({ message: 'Diyetisyen bilgileri getirilirken bir hata oluştu' });
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

    if (client.client_visible_notes) {
      // Diyetisyenin danışan için yazdığı notları tavsiye olarak döndür
      res.json([
        {
          id: 1,
          title: 'Diyetisyeninizden Notlar',
          content: client.client_visible_notes,
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

// Randevuları getir
clientPortalRouter.get('/appointments', verifyClientSession, async (req: Request, res: Response) => {
  try {
    const { client } = req.clientSession!;

    const appointments = await storage.getAppointments(client.id);

    res.json(appointments);
  } catch (error) {
    console.error('Get client appointments error:', error);
    res.status(500).json({ message: 'Randevular getirilirken bir hata oluştu' });
  }
});

// Mesajları getir
clientPortalRouter.get('/messages', verifyClientSession, async (req: Request, res: Response) => {
  try {
    const { client } = req.clientSession!;

    // Danışanın diyetisyeni ile olan mesajlarını getir
    const messages = await storage.getMessages(client.id, client.userId);

    res.json(messages);
  } catch (error) {
    console.error('Get client messages error:', error);
    res.status(500).json({ message: 'Mesajlar getirilirken bir hata oluştu' });
  }
});

// Danışandan diyetisyene mesaj gönder
clientPortalRouter.post('/messages', verifyClientSession, async (req: Request, res: Response) => {
  try {
    const { client } = req.clientSession!;
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Mesaj içeriği boş olamaz' });
    }

    // Mesaj oluştur
    const message = await storage.createMessage({
      clientId: client.id,
      userId: client.userId,
      content,
      fromClient: true, // Danışandan gelen mesaj
      isRead: false
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Mesaj gönderilirken bir hata oluştu' });
  }
});

// Mesaj silme
clientPortalRouter.delete('/messages/:messageId', verifyClientSession, async (req: Request, res: Response) => {
  try {
    const { client } = req.clientSession!;
    const messageId = Number(req.params.messageId);

    // Mesajı getir ve kontrol et
    const message = await storage.getMessageById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Mesaj bulunamadı" });
    }

    // Mesajın bu danışana ait olduğunu doğrula
    if (message.clientId !== client.id) {
      return res.status(403).json({ message: "Bu mesajı silme izniniz yok" });
    }

    // Mesajı sil
    const success = await storage.deleteMessage(messageId);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(500).json({ message: "Mesaj silinemedi" });
    }
  } catch (error) {
    console.error("Mesaj silme hatası:", error);
    res.status(500).json({ message: "Mesaj silinemedi" });
  }
});

// Mesaj gönder
clientPortalRouter.post('/messages', verifyClientSession, async (req: Request, res: Response) => {
  try {
    const { client } = req.clientSession!;
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Mesaj içeriği boş olamaz' });
    }

    // Mesaj oluştur
    const message = await storage.createMessage({
      clientId: client.id,
      userId: client.userId,
      content,
      fromClient: true, // Danışandan gelen mesaj
      isRead: false
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Mesaj gönderilirken bir hata oluştu' });
  }
});

// Okunmamış mesaj sayısını getir
clientPortalRouter.get('/messages/unread/count', verifyClientSession, async (req: Request, res: Response) => {
  try {
    const { client } = req.clientSession!;

    const unreadCount = await storage.getUnreadMessages(client.id, client.userId);

    res.json({ count: unreadCount });
  } catch (error) {
    console.error('Get unread message count error:', error);
    res.status(500).json({ message: 'Okunmamış mesaj sayısı getirilirken bir hata oluştu' });
  }
});

// Mesajları okundu olarak işaretle
clientPortalRouter.post('/messages/mark-as-read', verifyClientSession, async (req: Request, res: Response) => {
  try {
    const { client } = req.clientSession!;
    const { messageIds } = req.body;

    if (!messageIds || !Array.isArray(messageIds)) {
      return res.status(400).json({ message: 'Geçerli mesaj ID\'leri gönderilmelidir' });
    }

    // Her mesajı okundu olarak işaretle
    const updatePromises = messageIds.map(id => storage.markMessageAsRead(id));
    await Promise.all(updatePromises);

    res.json({ success: true });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({ message: 'Mesajlar okundu olarak işaretlenirken bir hata oluştu' });
  }
});

export default clientPortalRouter;