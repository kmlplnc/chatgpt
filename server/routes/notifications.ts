import express, { Request, Response } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { fromZodError } from "zod-validation-error";

const notificationsRouter = express.Router();

// Notification types
export enum NotificationType {
  MESSAGE = 'message',
  APPOINTMENT = 'appointment',
  DIET_PLAN = 'diet_plan',
  SYSTEM = 'system'
}

// Notification schema
const notificationSchema = z.object({
  type: z.nativeEnum(NotificationType),
  title: z.string(),
  message: z.string(),
  data: z.record(z.unknown()).optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium')
});

// Middleware to check if user is authenticated
const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: "Oturum açmanız gerekiyor" });
  }
  next();
};

// Create a new notification
notificationsRouter.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.user!.id;
    const notificationData = notificationSchema.parse(req.body);
    
    const notification = await storage.createNotification({
      ...notificationData,
      userId,
      isRead: false,
      createdAt: new Date()
    });
    
    // Emit notification through WebSocket if available
    if (req.app.get('io')) {
      req.app.get('io').to(`user:${userId}`).emit('notification', notification);
    }
    
    res.status(201).json(notification);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Geçersiz bildirim bilgileri", 
        errors: fromZodError(error) 
      });
    }
    console.error("Notification creation error:", error);
    res.status(500).json({ message: "Bildirim oluşturulamadı" });
  }
});

// Bildirimleri getir - sadece diyetisyenin kendi danışanları için
notificationsRouter.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.user!.id;
    const { type, isRead, limit = 50, offset = 0 } = req.query;
    
    const notifications = await storage.getNotificationsByUserId(userId, {
      type: type as NotificationType,
      isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
      limit: Number(limit),
      offset: Number(offset)
    });
    
    res.json(notifications);
  } catch (error) {
    console.error("Notifications fetch error:", error);
    res.status(500).json({ message: "Bildirimler alınamadı" });
  }
});

// Okunmamış bildirim sayısını getir - sadece diyetisyenin kendi danışanları için
notificationsRouter.get("/unread-count", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.user!.id;
    
    // Basitleştirilmiş sayma işlemi
    const count = await storage.getUnreadNotificationCount(userId);
    
    res.json({ count });
  } catch (error) {
    console.error("Unread notification count error:", error);
    res.status(500).json({ message: "Okunmamış bildirim sayısı alınamadı" });
  }
});

// Bildirimi okundu olarak işaretle
notificationsRouter.post("/:id/mark-read", requireAuth, async (req: Request, res: Response) => {
  try {
    const notificationId = parseInt(req.params.id);
    const userId = req.session.user!.id;
    
    if (isNaN(notificationId)) {
      return res.status(400).json({ message: "Geçersiz bildirim ID'si" });
    }
    
    const notification = await storage.getNotificationById(notificationId);
    
    if (!notification) {
      return res.status(404).json({ message: "Bildirim bulunamadı" });
    }
    
    if (notification.userId !== userId) {
      return res.status(403).json({ message: "Bu işlem için yetkiniz yok" });
    }
    
    await storage.markNotificationAsRead(notificationId);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Mark notification as read error:", error);
    res.status(500).json({ message: "Bildirim okundu olarak işaretlenemedi" });
  }
});

// Tüm bildirimleri okundu olarak işaretle
notificationsRouter.post("/mark-all-read", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.user!.id;
    await storage.markAllNotificationsAsRead(userId);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Mark all notifications as read error:", error);
    res.status(500).json({ message: "Bildirimler okundu olarak işaretlenemedi" });
  }
});

// Tüm bildirimleri silme endpoint'i
notificationsRouter.delete("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.user!.id;
    await storage.deleteAllNotifications(userId);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Delete all notifications error:", error);
    res.status(500).json({ message: "Bildirimler silinemedi" });
  }
});

export default notificationsRouter;