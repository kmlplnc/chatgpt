import express, { Request, Response } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { fromZodError } from "zod-validation-error";
import { isValidUUID } from "../utils/uuid-validator";
import { Router } from 'express';
import { db } from '../db';
import { notifications } from '../schema';
import { eq } from 'drizzle-orm';
import { broadcastNotification } from '../websocket';

const router = express.Router();
const notificationsRouter = Router();

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
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.user!.id;
    const notificationData = notificationSchema.parse(req.body);
    
    const notification = await storage.createNotification({
      userId,
      title: notificationData.title,
      content: notificationData.message,
      type: notificationData.type,
      isRead: false
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

// Get notifications for the authenticated user
router.get("/", requireAuth, async (req: Request, res: Response) => {
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

// Get unread notification count
router.get("/unread-count", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.user!.id;
    const count = await storage.getUnreadNotificationCount(userId);
    res.json({ count });
  } catch (error) {
    console.error("Unread notification count error:", error);
    res.status(500).json({ message: "Okunmamış bildirim sayısı alınamadı" });
  }
});

// Mark notification as read
router.post("/:id/mark-read", requireAuth, async (req: Request, res: Response) => {
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
    
    const updatedNotification = await storage.markNotificationAsRead(notificationId);
    res.status(200).json(updatedNotification);
  } catch (error) {
    console.error("Mark notification as read error:", error);
    res.status(500).json({ message: "Bildirim okundu olarak işaretlenemedi" });
  }
});

// Mark all notifications as read
router.post("/mark-all-read", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.user!.id;
    await storage.markAllNotificationsAsRead(userId);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Mark all notifications as read error:", error);
    res.status(500).json({ message: "Bildirimler okundu olarak işaretlenemedi" });
  }
});

// Delete all notifications
router.delete("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.user!.id;
    await storage.deleteAllNotifications(userId);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Delete all notifications error:", error);
    res.status(500).json({ message: "Bildirimler silinemedi" });
  }
});

// Get notifications for a specific user (admin only)
router.get("/user/:userId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    if (!isValidUUID(userId)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }
    
    // Check if user is admin
    if (req.session.user!.role !== 'admin') {
      return res.status(403).json({ message: "Bu işlem için yetkiniz yok" });
    }
    
    const notifications = await storage.getNotificationsByUserId(userId);
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Get all notifications for a user
notificationsRouter.get('/', async (req, res) => {
  try {
    if (!req.session?.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userNotifications = await db.query.notifications.findMany({
      where: eq(notifications.userId, req.session.user.id),
      orderBy: (notifications, { desc }) => [desc(notifications.createdAt)]
    });

    res.json(userNotifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// Mark a notification as read
notificationsRouter.patch('/:id/read', async (req, res) => {
  try {
    if (!req.session?.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const [updatedNotification] = await db.update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, req.params.id))
      .returning();

    if (!updatedNotification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(updatedNotification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Failed to update notification' });
  }
});

// Mark all notifications as read
notificationsRouter.patch('/read-all', async (req, res) => {
  try {
    if (!req.session?.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await db.update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, req.session.user.id));

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Failed to update notifications' });
  }
});

// Delete a notification
notificationsRouter.delete('/:id', async (req, res) => {
  try {
    if (!req.session?.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const [deletedNotification] = await db.delete(notifications)
      .where(eq(notifications.id, req.params.id))
      .returning();

    if (!deletedNotification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Failed to delete notification' });
  }
});

// Create a notification (admin only)
notificationsRouter.post('/', async (req, res) => {
  try {
    if (!req.session?.user?.id || req.session.user.role !== 'admin') {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { userId, title, message, type } = req.body;

    if (!userId || !title || !message || !type) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const [notification] = await db.insert(notifications)
      .values({
        userId,
        title,
        message,
        type,
        read: false
      })
      .returning();

    // Broadcast notification to connected clients
    broadcastNotification(userId, notification);

    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ message: 'Failed to create notification' });
  }
});

export default router;