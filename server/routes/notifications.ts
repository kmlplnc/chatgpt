import { Router } from "express";
import { storage } from "../storage";
import { insertNotificationSchema } from "@shared/schema";
import { isAuthenticated } from "../auth";

const router = Router();

// Kullanıcının okunmamış bildirimlerini alma
router.get("/unread-count", isAuthenticated, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Oturum açmanız gerekiyor" });
    }

    const count = await storage.getUnreadNotificationsCount(req.user.id);
    
    res.json({ count });
  } catch (error) {
    console.error("Bildirim sayısı alınırken hata:", error);
    res.status(500).json({ message: "Bildirim sayısı alınırken bir hata oluştu" });
  }
});

// Kullanıcının bildirimlerini alma
router.get("/", isAuthenticated, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Oturum açmanız gerekiyor" });
    }

    const isRead = req.query.isRead !== undefined 
      ? req.query.isRead === "true" 
      : undefined;

    const notifications = await storage.getNotifications(req.user.id, isRead);
    
    res.json(notifications);
  } catch (error) {
    console.error("Bildirimler alınırken hata:", error);
    res.status(500).json({ message: "Bildirimler alınırken bir hata oluştu" });
  }
});

// Bir bildirimi okundu olarak işaretleme
router.post("/:id/mark-read", isAuthenticated, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Oturum açmanız gerekiyor" });
    }

    const notificationId = parseInt(req.params.id);
    
    if (isNaN(notificationId)) {
      return res.status(400).json({ message: "Geçersiz bildirim ID'si" });
    }

    await storage.markNotificationAsRead(notificationId);
    
    res.json({ success: true });
  } catch (error) {
    console.error("Bildirim işaretlenirken hata:", error);
    res.status(500).json({ message: "Bildirim işaretlenirken bir hata oluştu" });
  }
});

// Tüm bildirimleri okundu olarak işaretleme
router.post("/mark-all-read", isAuthenticated, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Oturum açmanız gerekiyor" });
    }

    await storage.markAllNotificationsAsRead(req.user.id);
    
    res.json({ success: true });
  } catch (error) {
    console.error("Bildirimler işaretlenirken hata:", error);
    res.status(500).json({ message: "Bildirimler işaretlenirken bir hata oluştu" });
  }
});

// Client Portal için bildirim API'leri
router.get("/client/:clientId", isAuthenticated, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Oturum açmanız gerekiyor" });
    }

    const clientId = parseInt(req.params.clientId);
    
    if (isNaN(clientId)) {
      return res.status(400).json({ message: "Geçersiz danışan ID'si" });
    }

    const isRead = req.query.isRead !== undefined 
      ? req.query.isRead === "true" 
      : undefined;

    const notifications = await storage.getClientNotifications(clientId, isRead);
    
    res.json(notifications);
  } catch (error) {
    console.error("Danışan bildirimleri alınırken hata:", error);
    res.status(500).json({ message: "Danışan bildirimleri alınırken bir hata oluştu" });
  }
});

export default router;