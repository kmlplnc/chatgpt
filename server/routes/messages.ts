import { Request, Response, Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { insertMessageSchema } from "@shared/schema";

const messagesRouter = Router();

// Middleware to check if user is authenticated
const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: "Oturum açmanız gerekiyor" });
  }
  next();
};

// Get messages for a specific client
messagesRouter.get("/:clientId", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.user!.id;
    const clientId = Number(req.params.clientId);
    
    if (isNaN(clientId)) {
      return res.status(400).json({ message: "Geçerli bir danışan ID gereklidir" });
    }
    
    // Diyetisyenin kendi danışanı olduğunu doğrula
    const client = await storage.getClient(clientId);
    if (!client || (client.userId !== userId && client.userId !== null)) {
      return res.status(403).json({ message: "Bu danışana ait mesajlara erişim izniniz yok" });
    }
    
    const messages = await storage.getMessages(clientId, userId);
    res.json(messages);
  } catch (error) {
    console.error("Mesajlar getirilemedi:", error);
    res.status(500).json({ message: "Mesajlar getirilemedi" });
  }
});

// Get messages for a specific client (eski endpoint - geriye uyumluluk için)
messagesRouter.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.user!.id;
    const { clientId } = req.query;
    
    if (!clientId) {
      return res.status(400).json({ message: "Danışan ID gereklidir" });
    }
    
    const clientIdNum = Number(clientId);
    
    // Diyetisyenin kendi danışanı olduğunu doğrula
    const client = await storage.getClient(clientIdNum);
    if (!client || (client.userId !== userId && client.userId !== null)) {
      return res.status(403).json({ message: "Bu danışana ait mesajlara erişim izniniz yok" });
    }
    
    const messages = await storage.getMessages(clientIdNum, userId);
    res.json(messages);
  } catch (error) {
    console.error("Mesajlar getirilemedi:", error);
    res.status(500).json({ message: "Mesajlar getirilemedi" });
  }
});

// Send a new message 
messagesRouter.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.user!.id;
    const { clientId, content, message, fromClient = false } = req.body;
    
    // Hem content hem de message değişkeni destekle (geriye uyumluluk)
    const messageContent = content || message;
    
    if (!clientId) {
      return res.status(400).json({ message: "Danışan ID gereklidir" });
    }
    
    if (!messageContent) {
      return res.status(400).json({ message: "Mesaj içeriği gereklidir" });
    }
    
    console.log("Yeni mesaj gönderiliyor:", { clientId, messageContent, fromClient });
    
    const clientIdNum = Number(clientId);
    
    // Diyetisyenin kendi danışanı olduğunu doğrula
    const client = await storage.getClient(clientIdNum);
    if (!client || (client.userId !== userId && client.userId !== null)) {
      return res.status(403).json({ message: "Bu danışana mesaj gönderme izniniz yok" });
    }
    
    // Validate request body
    const messageData = insertMessageSchema.parse({
      content: messageContent,
      userId,
      clientId: clientIdNum,
      fromClient, // false = Diyetisyenden gönderilen mesaj
      isRead: false
    });
    
    // Create message
    const newMessage = await storage.createMessage(messageData);
    console.log("Mesaj oluşturuldu:", newMessage);
    
    // Mesaj gönderildikten sonra ilgili kişiye bildirim gönder
    try {
      if (fromClient) {
        // Eğer mesaj danışandan geldiyse, diyetisyene bildirim gönder
        await storage.createMessageNotification(newMessage.id, userId, false);
      } else {
        // Eğer mesaj diyetisyenden geldiyse ve danışanın bir user hesabı varsa bildirim gönder
        if (client.userId) {
          await storage.createMessageNotification(newMessage.id, client.userId, true);
        }
      }
    } catch (notifError) {
      console.error("Mesaj bildirimi oluşturulamadı:", notifError);
      // Bildirim oluşturulamazsa bile mesaj gönderilmiş sayılır
    }
    
    res.status(201).json(newMessage);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Geçersiz mesaj bilgileri", 
        errors: error.errors 
      });
    }
    
    console.error("Mesaj gönderilemedi:", error);
    res.status(500).json({ message: "Mesaj gönderilemedi" });
  }
});

// Mark a message as read
messagesRouter.patch("/:messageId/read", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.user!.id;
    const messageId = Number(req.params.messageId);
    
    // Mesajı al
    const message = await storage.getMessageById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Mesaj bulunamadı" });
    }
    
    // Mesajın bu kullanıcıya ait olduğunu doğrula
    if (message.userId !== userId) {
      return res.status(403).json({ message: "Bu mesajı işaretleme izniniz yok" });
    }
    
    // Update message read status
    const success = await storage.markMessageAsRead(messageId);
    
    if (success) {
      res.json({ success: true });
    } else {
      res.status(500).json({ message: "Mesaj okundu olarak işaretlenemedi" });
    }
  } catch (error) {
    console.error("Mesaj okundu olarak işaretlenemedi:", error);
    res.status(500).json({ message: "Mesaj okundu olarak işaretlenemedi" });
  }
});

// Mark multiple messages as read
messagesRouter.patch("/mark-read", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.user!.id;
    const { messageIds } = req.body;
    
    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ message: "En az bir mesaj ID gereklidir" });
    }
    
    // Mesajları kontrol et
    for (const messageId of messageIds) {
      const message = await storage.getMessageById(messageId);
      if (!message) {
        return res.status(404).json({ message: `Mesaj bulunamadı: ${messageId}` });
      }
      
      // Mesajın bu kullanıcıya ait olduğunu doğrula
      if (message.userId !== userId) {
        return res.status(403).json({ message: `Bu mesajı işaretleme izniniz yok: ${messageId}` });
      }
    }
    
    // Tüm mesajları okundu olarak işaretle
    const success = await storage.markMultipleMessagesAsRead(messageIds);
    
    if (success) {
      res.json({ success: true });
    } else {
      res.status(500).json({ message: "Mesajlar okundu olarak işaretlenemedi" });
    }
  } catch (error) {
    console.error("Mesajlar okundu olarak işaretlenemedi:", error);
    res.status(500).json({ message: "Mesajlar okundu olarak işaretlenemedi" });
  }
});

// Mark all client messages as read
messagesRouter.patch("/read", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.user!.id;
    const { clientId } = req.query;
    
    if (!clientId) {
      return res.status(400).json({ message: "Danışan ID gereklidir" });
    }
    
    const clientIdNum = Number(clientId);
    
    // Diyetisyenin kendi danışanı olduğunu doğrula
    const client = await storage.getClient(clientIdNum);
    if (!client || (client.userId !== userId && client.userId !== null)) {
      return res.status(403).json({ message: "Bu danışana ait mesajları işaretleme izniniz yok" });
    }
    
    // Tüm mesajları okundu olarak işaretle
    const success = await storage.markAllClientMessagesAsRead(clientIdNum, userId);
    
    if (success) {
      res.json({ success: true });
    } else {
      res.status(500).json({ message: "Mesajlar okundu olarak işaretlenemedi" });
    }
  } catch (error) {
    console.error("Mesajlar okundu olarak işaretlenemedi:", error);
    res.status(500).json({ message: "Mesajlar okundu olarak işaretlenemedi" });
  }
});

// Get unread message count for user or specific client
messagesRouter.get("/unread/count", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.user!.id;
    const { clientId } = req.query;
    
    let unreadCount;
    if (clientId) {
      unreadCount = await storage.getUnreadMessages(Number(clientId), userId);
    } else {
      unreadCount = await storage.getUnreadMessages(undefined, userId);
    }
    
    res.json({ count: unreadCount });
  } catch (error) {
    console.error("Okunmamış mesaj sayısı getirilemedi:", error);
    res.status(500).json({ message: "Okunmamış mesaj sayısı getirilemedi" });
  }
});

// Get unread message counts by client
messagesRouter.get("/unread/counts-by-client", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.user!.id;
    
    // Tüm danışanlar için okunmamış mesaj sayılarını getir
    const unreadCounts = await storage.getUnreadMessagesByClient(userId);
    
    res.json(unreadCounts);
  } catch (error) {
    console.error("Okunmamış mesaj sayıları getirilemedi:", error);
    res.status(500).json({ message: "Okunmamış mesaj sayıları getirilemedi" });
  }
});

// Mark all messages from a client as read
messagesRouter.post("/:clientId/mark-as-read", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.user!.id;
    const clientId = Number(req.params.clientId);
    
    console.log(`markAllClientMessagesAsRead çağrıldı: clientId=${clientId}, userId=${userId}`);
    
    if (isNaN(clientId)) {
      return res.status(400).json({ message: "Geçerli bir danışan ID gereklidir" });
    }
    
    // Diyetisyenin kendi danışanı olduğunu doğrula
    const client = await storage.getClient(clientId);
    if (!client) {
      console.error(`Danışan bulunamadı: clientId=${clientId}`);
      return res.status(404).json({ message: "Danışan bulunamadı" });
    }
    
    if (client.userId !== userId && client.userId !== null) {
      console.error(`Erişim hatası: danışan başka bir diyetisyene ait (clientId=${clientId}, clientUserId=${client.userId}, userId=${userId})`);
      return res.status(403).json({ message: "Bu danışana ait mesajları işaretleme izniniz yok" });
    }
    
    // Tüm mesajları okundu olarak işaretle
    const success = await storage.markAllClientMessagesAsRead(clientId, userId);
    
    if (success) {
      console.log(`Danışanın (${clientId}) tüm mesajları okundu olarak işaretlendi`);
      res.json({ success: true });
    } else {
      console.error(`Mesajlar okundu olarak işaretlenemedi: clientId=${clientId}`);
      res.status(500).json({ message: "Mesajlar okundu olarak işaretlenemedi" });
    }
  } catch (error) {
    console.error("Mesajlar okundu olarak işaretlenemedi:", error);
    res.status(500).json({ message: "Mesajlar okundu olarak işaretlenemedi" });
  }
});

export default messagesRouter;