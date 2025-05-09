import { Router, Request, Response } from "express";
import { storage } from "../storage";

export const subscriptionRouter = Router();

// Demo abonelik oluşturma - gerçek ödeme olmadan
subscriptionRouter.post("/create", async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Oturum açılmamış" });
    }
    
    const { planId } = req.body;
    
    if (!planId) {
      return res.status(400).json({ message: "Abonelik planı belirtilmemiş" });
    }
    
    const user = await storage.getUser(req.session.userId);
    
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }
    
    // Abonelik bilgilerini güncelle
    const now = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1 aylık abonelik
    
    const updatedUser = await storage.updateUserSubscription(user.id, {
      subscriptionStatus: "active",
      subscriptionPlan: planId,
      subscriptionStartDate: now,
      subscriptionEndDate: endDate
    });
    
    // Hassas bilgileri çıkar
    const { password: _, ...safeUser } = updatedUser;
    
    return res.status(200).json({
      user: safeUser,
      message: "Abonelik başarıyla oluşturuldu"
    });
  } catch (error) {
    console.error("Create subscription error:", error);
    return res.status(500).json({ message: "Abonelik oluşturulurken bir hata oluştu" });
  }
});

// Abonelik iptal etme
subscriptionRouter.post("/cancel", async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Oturum açılmamış" });
    }
    
    const user = await storage.getUser(req.session.userId);
    
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }
    
    // Aboneliği iptal et, ancak bitiş tarihine kadar aktif kalsın
    const updatedUser = await storage.updateUserSubscription(user.id, {
      subscriptionStatus: "canceled"
    });
    
    // Hassas bilgileri çıkar
    const { password: _, ...safeUser } = updatedUser;
    
    return res.status(200).json({
      user: safeUser,
      message: "Abonelik başarıyla iptal edildi"
    });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    return res.status(500).json({ message: "Abonelik iptal edilirken bir hata oluştu" });
  }
});