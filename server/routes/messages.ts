import { Request, Response, Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { insertMessageSchema } from "@shared/schema";
import { NotificationType } from "./notifications";
import { messages } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import type { Message } from "@shared/schema";
import { isValidUUID } from '../utils/uuid-validator';
import { broadcastNotification } from '../websocket';

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
    if (isNaN(clientIdNum)) {
      return res.status(400).json({ message: "Geçerli bir danışan ID gereklidir" });
    }
    
    // Diyetisyenin kendi danışanı olduğunu doğrula
    const client = await storage.getClient(clientIdNum);
    if (!client || (client.userId !== userId && client.userId !== null)) {
      return res.status(403).json({ message: "Bu danışana ait mesajlara erişim izniniz yok" });
    }
    
    // Get messages using the correct user ID from session
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
    // Giriş yapanın portal türüne göre izin kontrolü
    const isClientPortal = !!clientId; // Danışan portalı ise true
    if (isClientPortal) {
      // Danışan portalı: sadece kendi client kaydına erişebilir
      if (!client || client.id !== clientId) {
        return res.status(403).json({ message: "Bu danışana mesaj gönderme izniniz yok" });
      }
    } else {
      // Diyetisyen portalı: sadece kendi danışanına erişebilir
      if (!client || (client.userId !== null && client.userId !== userId)) {
        return res.status(403).json({ message: "Bu danışana mesaj gönderme izniniz yok" });
      }
    }
    
    // Validate request body
    const messageData = insertMessageSchema.parse({
      content: messageContent,
      userId,
      clientId: clientIdNum,
      fromClient,
      isRead: false
    });
    
    // Create message
    const newMessage = await storage.createMessage(messageData);
    console.log("Mesaj oluşturuldu:", newMessage);
    
    // Mesaj gönderildikten sonra ilgili kişiye bildirim gönder
    try {
      const notificationData = {
        type: NotificationType.MESSAGE,
        title: fromClient ? "Yeni Danışan Mesajı" : "Yeni Diyetisyen Mesajı",
        content: messageContent,
        data: {
          messageId: newMessage.id,
          clientId: clientIdNum,
          fromClient
        },
        priority: 'high'
      };
      if (fromClient) {
        // Danışan yazdıysa, bildirimi diyetisyene gönder (sadece userId dolu)
        console.log('BİLDİRİM: Sadece userId:', userId, 'clientId:', clientIdNum);
        await storage.createNotification({
          ...notificationData,
          userId: userId,
          isRead: false
        });
      } else {
        // Diyetisyen yazdıysa, bildirimi danışana gönder (sadece clientId dolu)
        console.log('BİLDİRİM: Sadece clientId:', clientIdNum, 'userId:', userId);
        await storage.createNotification({
          ...notificationData,
          clientId: clientIdNum,
          isRead: false
        });
      }
      // WebSocket ile gerçek zamanlı bildirim
      if (req.app.get('io')) {
        const targetUserId = fromClient ? userId : client.userId;
        if (targetUserId) {
          req.app.get('io').to(`user:${targetUserId}`).emit('new_message', newMessage);
        }
      }
    } catch (notifError) {
      console.error('BİLDİRİM: Bildirim oluşturulamadı:', notifError);
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
    const clientSessionId = (req.session as any).clientId;
    let unreadCount;
    if (clientSessionId) {
      // Danışan portalı: diyetisyenden gelen okunmamış mesajlar
      unreadCount = await storage.getUnreadMessages(Number(clientSessionId), undefined, true);
    } else if (clientId) {
      // Diyetisyen portalı: danışandan gelen okunmamış mesajlar
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

// Get last message for a specific client
messagesRouter.get("/last/:clientId", requireAuth, async (req: Request, res: Response) => {
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
    
    const lastMessage = await storage.getLastMessageByClient(clientId, userId);
    res.json(lastMessage || null);
  } catch (error) {
    console.error("Son mesaj getirilemedi:", error);
    res.status(500).json({ message: "Son mesaj getirilemedi" });
  }
});

// Get last messages for all clients of a user
messagesRouter.get("/last-messages", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.user!.id;
    
    // Diyetisyenin tüm danışanları için son mesajları getir
    const lastMessages = await storage.getLastMessagesForAllClients(userId);
    
    res.json(lastMessages);
  } catch (error) {
    console.error("Son mesajlar getirilemedi:", error);
    res.status(500).json({ message: "Son mesajlar getirilemedi" });
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

// Delete a single message
messagesRouter.delete("/:messageId", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.user!.id;
    const messageId = Number(req.params.messageId);
    
    const message = await storage.getMessageById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Mesaj bulunamadı" });
    }
    
    if (message.userId !== userId) {
      return res.status(403).json({ message: "Bu mesajı silme izniniz yok" });
    }
    
    await storage.deleteMessage(messageId);
    res.json({ success: true });
  } catch (error) {
    console.error("Mesaj silme hatası:", error);
    res.status(500).json({ message: "Mesaj silinemedi" });
  }
});

// Delete all messages in a conversation
messagesRouter.delete("/conversation/:clientId", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.user!.id;
    const clientId = Number(req.params.clientId);
    
    const client = await storage.getClient(clientId);
    if (!client || client.userId !== userId) {
      return res.status(403).json({ message: "Bu sohbeti silme izniniz yok" });
    }
    
    const success = await storage.deleteAllMessages(clientId, userId);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(500).json({ message: "Sohbet silinemedi" });
    }
  } catch (error) {
    console.error("Sohbet silme hatası:", error);
    res.status(500).json({ message: "Sohbet silinemedi" });
  }
});

// Get messages for a client
messagesRouter.get("/client/:clientId", async (req, res) => {
  try {
    const { clientId } = req.params;
    const numericClientId = parseInt(clientId, 10);
    
    if (isNaN(numericClientId)) {
      return res.status(400).json({ error: "Invalid client ID" });
    }
    
    const result = await db
      .select()
      .from(messages)
      .where(eq(messages.clientId, numericClientId))
      .orderBy(messages.createdAt);
      
    res.json(result);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Create new message
messagesRouter.post("/", async (req, res) => {
  try {
    const messageData = req.body as Omit<Message, "id" | "createdAt">;
    
    const [message] = await db
      .insert(messages)
      .values(messageData)
      .returning();
      
    res.status(201).json(message);
  } catch (error) {
    console.error("Error creating message:", error);
    res.status(500).json({ error: "Failed to create message" });
  }
});

// Update message
messagesRouter.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const numericId = parseInt(id, 10);
    
    if (isNaN(numericId)) {
      return res.status(400).json({ error: "Invalid message ID" });
    }
    
    const messageData = req.body as Partial<Message>;
    
    const [message] = await db
      .update(messages)
      .set(messageData)
      .where(eq(messages.id, numericId))
      .returning();
      
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }
    
    res.json(message);
  } catch (error) {
    console.error("Error updating message:", error);
    res.status(500).json({ error: "Failed to update message" });
  }
});

// Delete message
messagesRouter.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const numericId = parseInt(id, 10);
    
    if (isNaN(numericId)) {
      return res.status(400).json({ error: "Invalid message ID" });
    }
    
    await db
      .delete(messages)
      .where(eq(messages.id, numericId));
      
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ error: "Failed to delete message" });
  }
});

// Get all messages between two users
messagesRouter.get('/:userId', async (req, res) => {
  try {
    if (!req.session?.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!isValidUUID(req.params.userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const userMessages = await db.query.messages.findMany({
      where: and(
        eq(messages.senderId, req.session.user.id),
        eq(messages.receiverId, req.params.userId)
      ),
      orderBy: (messages, { asc }) => [asc(messages.createdAt)]
    });

    res.json(userMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

// Send a message
messagesRouter.post('/', async (req, res) => {
  try {
    if (!req.session?.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { receiverId, content } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!isValidUUID(receiverId)) {
      return res.status(400).json({ message: 'Invalid receiver ID' });
    }

    const [message] = await db.insert(messages)
      .values({
        senderId: req.session.user.id,
        receiverId,
        content,
        read: false
      })
      .returning();

    // Send notification to receiver
    broadcastNotification(receiverId, {
      title: 'New Message',
      message: `You have received a new message from ${req.session.user.username}.`,
      type: 'new_message'
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

// Mark message as read
messagesRouter.patch('/:id/read', async (req, res) => {
  try {
    if (!req.session?.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!isValidUUID(req.params.id)) {
      return res.status(400).json({ message: 'Invalid message ID' });
    }

    const message = await db.query.messages.findFirst({
      where: eq(messages.id, req.params.id)
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.receiverId !== req.session.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const [updatedMessage] = await db.update(messages)
      .set({ read: true })
      .where(eq(messages.id, req.params.id))
      .returning();

    res.json(updatedMessage);
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ message: 'Failed to update message' });
  }
});

// Delete message
messagesRouter.delete('/:id', async (req, res) => {
  try {
    if (!req.session?.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!isValidUUID(req.params.id)) {
      return res.status(400).json({ message: 'Invalid message ID' });
    }

    const message = await db.query.messages.findFirst({
      where: eq(messages.id, req.params.id)
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.senderId !== req.session.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await db.delete(messages)
      .where(eq(messages.id, req.params.id));

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Failed to delete message' });
  }
});

export default messagesRouter;