import { Router, Request, Response } from "express";
import { storage } from "../storage";

export const subscriptionRouter = Router();

// Abonelik oluşturma
subscriptionRouter.post("/create", async (req: Request, res: Response) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: "Kimlik doğrulama gerekli" });
    }

    const { plan } = req.body;

    if (!plan || !["basic", "pro", "premium"].includes(plan)) {
      return res.status(400).json({ error: "Geçersiz abonelik planı" });
    }

    // Abonelik süresi (varsayılan: 30 gün)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    // Abonelik bilgilerini güncelle
    const user = await storage.updateUserSubscription(req.session.user.id, {
      subscriptionStatus: "active",
      subscriptionPlan: plan,
      subscriptionStartDate: startDate,
      subscriptionEndDate: endDate,
    });

    res.json({
      message: "Abonelik başarıyla oluşturuldu",
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionStartDate: user.subscriptionStartDate,
        subscriptionEndDate: user.subscriptionEndDate,
      },
    });
  } catch (error: any) {
    console.error("Abonelik oluşturma hatası:", error);
    res.status(500).json({ error: `Abonelik oluşturulamadı: ${error.message}` });
  }
});

// Abonelik iptal etme
subscriptionRouter.post("/cancel", async (req: Request, res: Response) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: "Kimlik doğrulama gerekli" });
    }

    // Kullanıcı bilgilerini al
    const user = await storage.getUser(req.session.user.id);
    if (!user) {
      return res.status(404).json({ error: "Kullanıcı bulunamadı" });
    }

    // Abonelik durumunu güncelle
    const updatedUser = await storage.updateUserSubscription(req.session.user.id, {
      subscriptionStatus: "canceled",
      // Diğer bilgiler (plan, tarihler) korunur
    });

    res.json({
      message: "Abonelik başarıyla iptal edildi",
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        role: updatedUser.role,
        subscriptionStatus: updatedUser.subscriptionStatus,
        subscriptionPlan: updatedUser.subscriptionPlan,
        subscriptionStartDate: updatedUser.subscriptionStartDate,
        subscriptionEndDate: updatedUser.subscriptionEndDate,
      },
    });
  } catch (error: any) {
    console.error("Abonelik iptal hatası:", error);
    res.status(500).json({ error: `Abonelik iptal edilemedi: ${error.message}` });
  }
});

// Kullanıcının abonelik bilgilerini alma
subscriptionRouter.get("/status", async (req: Request, res: Response) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: "Kimlik doğrulama gerekli" });
    }

    // Kullanıcı bilgilerini al
    const user = await storage.getUser(req.session.user.id);
    if (!user) {
      return res.status(404).json({ error: "Kullanıcı bulunamadı" });
    }

    // Abonelik bitmiş mi kontrol et
    const now = new Date();
    const endDate = user.subscriptionEndDate ? new Date(user.subscriptionEndDate) : null;
    
    if (endDate && now > endDate && user.subscriptionStatus !== "expired") {
      // Abonelik süresi dolmuş, durumu güncelle
      const updatedUser = await storage.updateUserSubscription(req.session.user.id, {
        subscriptionStatus: "expired",
      });
      
      return res.json({
        subscriptionStatus: updatedUser.subscriptionStatus,
        subscriptionPlan: updatedUser.subscriptionPlan,
        subscriptionStartDate: updatedUser.subscriptionStartDate,
        subscriptionEndDate: updatedUser.subscriptionEndDate,
      });
    }

    // Mevcut abonelik bilgilerini döndür
    res.json({
      subscriptionStatus: user.subscriptionStatus,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionStartDate: user.subscriptionStartDate,
      subscriptionEndDate: user.subscriptionEndDate,
    });
  } catch (error: any) {
    console.error("Abonelik durumu alma hatası:", error);
    res.status(500).json({ error: `Abonelik durumu alınamadı: ${error.message}` });
  }
});