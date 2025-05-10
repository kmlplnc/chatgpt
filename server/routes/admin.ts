import { Router, Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

export const adminRouter = Router();

// Şifre hashleme fonksiyonu
const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Admin yetkisi kontrolü
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.user) {
    return res.status(401).json({ message: "Oturum açılmamış" });
  }
  if (req.session.user.role !== "admin") {
    return res.status(403).json({ message: "Bu işlem için admin yetkisi gereklidir" });
  }
  next();
};

// Tüm kullanıcıları getir
adminRouter.get("/users", requireAdmin, async (req: Request, res: Response) => {
  try {
    const users = await storage.getAllUsers();
    
    // Parola bilgisini çıkar
    const safeUsers = users.map(user => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...safeUser } = user;
      return safeUser;
    });
    
    res.json(safeUsers);
  } catch (error: any) {
    res.status(500).json({ message: "Kullanıcılar getirilirken bir hata oluştu", error: error.message });
  }
});

// Kullanıcı oluştur
adminRouter.post("/users", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { username, password, email, name, role, subscriptionStatus, subscriptionPlan } = req.body;
    
    // Gerekli alanları kontrol et
    if (!username || !password || !email) {
      return res.status(400).json({ message: "Kullanıcı adı, parola ve e-posta gereklidir" });
    }

    // Kullanıcı adı kontrolü
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ message: "Bu kullanıcı adı zaten kullanılıyor" });
    }

    // Parolayı hashle
    const hashedPassword = await hashPassword(password);
    
    // Kullanıcıyı oluştur
    const user = await storage.createUser({
      username,
      password: hashedPassword,
      email,
      name: name || null
    });

    // Rolü güncelle (varsayılan olarak "user")
    if (role && role !== "user") {
      await storage.updateUser(user.id, { role });
    }
    
    // Abonelik bilgilerini güncelle
    if (subscriptionStatus || subscriptionPlan) {
      await storage.updateUserSubscription(user.id, {
        subscriptionStatus,
        subscriptionPlan,
        subscriptionStartDate: new Date(),
        subscriptionEndDate: null
      });
    }
    
    // Parola bilgisini çıkar
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...safeUser } = user;
    
    res.status(201).json(safeUser);
  } catch (error: any) {
    res.status(500).json({ message: "Kullanıcı oluşturulurken bir hata oluştu", error: error.message });
  }
});

// Kullanıcı güncelle
adminRouter.patch("/users/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const { username, password, email, name, role } = req.body;
    
    // Kullanıcının var olup olmadığını kontrol et
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }
    
    // Kullanıcı adı benzersiz olmalı
    if (username && username !== user.username) {
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Bu kullanıcı adı zaten kullanılıyor" });
      }
    }
    
    // Güncellenecek alanları hazırla
    const updates: any = {};
    
    if (username) updates.username = username;
    if (email) updates.email = email;
    if (name !== undefined) updates.name = name;
    if (role) updates.role = role;
    
    // Parola güncellemesi
    if (password && password.trim() !== "") {
      updates.password = await hashPassword(password);
    }
    
    // Abonelik bilgileri
    const subscriptionUpdates: any = {};
    let hasSubscriptionUpdates = false;
    
    if (req.body.subscriptionStatus) {
      subscriptionUpdates.subscriptionStatus = req.body.subscriptionStatus;
      hasSubscriptionUpdates = true;
    }
    
    if (req.body.subscriptionPlan !== undefined) {
      subscriptionUpdates.subscriptionPlan = req.body.subscriptionPlan || null;
      hasSubscriptionUpdates = true;
    }
    
    // Kullanıcıyı güncelle
    const updatedUser = await storage.updateUser(userId, updates);
    
    // Abonelik bilgilerini güncelle
    if (hasSubscriptionUpdates) {
      await storage.updateUserSubscription(userId, subscriptionUpdates);
    }
    
    // Parola bilgisini çıkar
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...safeUser } = updatedUser;
    
    res.json(safeUser);
  } catch (error: any) {
    res.status(500).json({ message: "Kullanıcı güncellenirken bir hata oluştu", error: error.message });
  }
});

// Kullanıcı sil
adminRouter.delete("/users/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Admin kendisini silmeye çalışıyorsa engelle
    if (req.session.user.id === userId) {
      return res.status(400).json({ message: "Kendi hesabınızı silemezsiniz" });
    }
    
    // Kullanıcının var olup olmadığını kontrol et
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }
    
    // Kullanıcıyı sil
    const success = await storage.deleteUser(userId);
    
    if (success) {
      res.status(200).json({ message: "Kullanıcı başarıyla silindi" });
    } else {
      res.status(500).json({ message: "Kullanıcı silinirken bir hata oluştu" });
    }
  } catch (error: any) {
    res.status(500).json({ message: "Kullanıcı silinirken bir hata oluştu", error: error.message });
  }
});