import { Router, Request, Response } from "express";
import { storage } from "../storage";

export const subscriptionRouter = Router();

// Middleware: oturum açmış kullanıcıyı kontrol eder
const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "Yetkilendirme gerekiyor" });
  }
  next();
};

// Abonelik oluşturma veya güncelleme
subscriptionRouter.post("/create", requireAuth, async (req: Request, res: Response) => {
  try {
    const { plan } = req.body;
    
    if (!plan) {
      return res.status(400).json({ message: "Abonelik planı belirtilmelidir" });
    }
    
    const userId = req.session.user!.id;
    
    // Plan geçerli mi?
    const validPlans = ["basic", "premium", "pro"];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ message: "Geçersiz abonelik planı" });
    }
    
    // Abonelik sürelerini belirle
    const now = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1 aylık abonelik
    
    // Kullanıcının abonelik bilgisini güncelle
    const updatedUser = await storage.updateUserSubscription(userId, {
      subscriptionStatus: "active",
      subscriptionPlan: plan,
      subscriptionStartDate: now,
      subscriptionEndDate: endDate
    });
    
    // Şifreyi çıkar
    const { password, ...userWithoutPassword } = updatedUser;
    
    res.status(200).json({
      success: true,
      message: "Abonelik başarıyla oluşturuldu",
      subscription: {
        status: "active",
        plan: plan,
        startDate: now,
        endDate: endDate
      },
      user: userWithoutPassword
    });
  } catch (error) {
    console.error("Abonelik oluşturma hatası:", error);
    res.status(500).json({ message: "Abonelik oluşturulurken bir hata oluştu" });
  }
});

// Abonelik iptali
subscriptionRouter.post("/cancel", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.user!.id;
    
    // Kullanıcının abonelik bilgisini güncelle
    const updatedUser = await storage.updateUserSubscription(userId, {
      subscriptionStatus: "cancelled"
    });
    
    // Şifreyi çıkar
    const { password, ...userWithoutPassword } = updatedUser;
    
    res.status(200).json({
      success: true,
      message: "Abonelik başarıyla iptal edildi",
      user: userWithoutPassword
    });
  } catch (error) {
    console.error("Abonelik iptal hatası:", error);
    res.status(500).json({ message: "Abonelik iptal edilirken bir hata oluştu" });
  }
});

// Abonelik durumunu kontrol etme
subscriptionRouter.get("/status", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.user!.id;
    
    // Kullanıcı bilgisini getir
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }
    
    // Abonelik durumunu kontrol et
    const now = new Date();
    const isActive = 
      user.subscriptionStatus === "active" && 
      user.subscriptionEndDate && 
      new Date(user.subscriptionEndDate) > now;
    
    // Abonelik bilgisini dön
    res.status(200).json({
      status: isActive ? "active" : "inactive",
      plan: user.subscriptionPlan,
      startDate: user.subscriptionStartDate,
      endDate: user.subscriptionEndDate,
      features: getFeaturesByPlan(user.subscriptionPlan)
    });
  } catch (error) {
    console.error("Abonelik durumu kontrol hatası:", error);
    res.status(500).json({ message: "Abonelik durumu kontrol edilirken bir hata oluştu" });
  }
});

// Plan türüne göre özellikleri belirle
function getFeaturesByPlan(plan: string | null): string[] {
  switch (plan) {
    case "basic":
      return [
        "Besin veritabanı erişimi",
        "Sınırlı sayıda danışan yönetimi",
        "Temel raporlama"
      ];
    case "premium":
      return [
        "Besin veritabanı erişimi",
        "Sınırsız danışan yönetimi",
        "Gelişmiş raporlama",
        "Diyet planı oluşturma"
      ];
    case "pro":
      return [
        "Besin veritabanı erişimi",
        "Sınırsız danışan yönetimi",
        "Gelişmiş raporlama",
        "Diyet planı oluşturma",
        "Gelişmiş analiz araçları",
        "PDF rapor çıktıları"
      ];
    default:
      return [
        "Sınırlı besin veritabanı erişimi"
      ];
  }
}