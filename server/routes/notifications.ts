import express, { Request, Response } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { fromZodError } from "zod-validation-error";

const notificationsRouter = express.Router();

// Middleware to check if user is authenticated
const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: "Oturum açmanız gerekiyor" });
  }
  next();
};

// Bildirimleri getir - sadece diyetisyenin kendi danışanları için
notificationsRouter.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.user!.id;
    
    // Önce tüm bildirimleri getir
    const allNotifications = await storage.getNotificationsByUserId(userId);
    
    // Diyetisyenin danışanlarını getir
    const dieticianClients = await storage.getClientsByUserId(userId);
    const clientIds = dieticianClients.map(client => client.id);
    
    // Sadece diyetisyenin kendi danışanları ile ilgili bildirimleri filtrele
    const filteredNotifications = allNotifications.filter(notification => {
      // Eğer bildirim bir danışan ile ilgili değilse (clientId null) veya
      // bildirim diyetisyenin kendi danışanları ile ilgiliyse göster
      return notification.clientId === null || 
             (notification.clientId && clientIds.includes(notification.clientId));
    });
    
    res.json(filteredNotifications);
  } catch (error) {
    console.error("Notifications fetch error:", error);
    res.status(500).json({ message: "Bildirimler alınamadı" });
  }
});

// Okunmamış bildirim sayısını getir - sadece diyetisyenin kendi danışanları için
notificationsRouter.get("/unread-count", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.user!.id;
    
    // Önce tüm bildirimleri getir
    const allNotifications = await storage.getNotificationsByUserId(userId);
    
    // Diyetisyenin danışanlarını getir
    const dieticianClients = await storage.getClientsByUserId(userId);
    const clientIds = dieticianClients.map(client => client.id);
    
    // Sadece diyetisyenin kendi danışanları ile ilgili bildirimleri filtrele
    const filteredNotifications = allNotifications.filter(notification => {
      // Eğer bildirim bir danışan ile ilgili değilse (clientId null) veya
      // bildirim diyetisyenin kendi danışanları ile ilgiliyse göster
      return (notification.isRead === false) && 
             (notification.clientId === null || 
             (notification.clientId && clientIds.includes(notification.clientId)));
    });
    
    res.json({ count: filteredNotifications.length });
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

export default notificationsRouter;