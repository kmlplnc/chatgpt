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

// Get messages for a specific client-user pair
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
    const { clientId, content, fromClient = false } = req.body;
    
    if (!clientId) {
      return res.status(400).json({ message: "Danışan ID gereklidir" });
    }
    
    const clientIdNum = Number(clientId);
    
    // Diyetisyenin kendi danışanı olduğunu doğrula
    const client = await storage.getClient(clientIdNum);
    if (!client || (client.userId !== userId && client.userId !== null)) {
      return res.status(403).json({ message: "Bu danışana mesaj gönderme izniniz yok" });
    }
    
    // Validate request body
    const messageData = insertMessageSchema.parse({
      content,
      userId,
      clientId: clientIdNum,
      fromClient, // false = Diyetisyenden gönderilen mesaj
      isRead: false
    });
    
    // Create message
    const message = await storage.createMessage(messageData);
    
    res.status(201).json(message);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Geçersiz mesaj bilgileri", errors: error.errors });
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

export default messagesRouter;