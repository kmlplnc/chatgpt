import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";
import bcrypt from "bcrypt";

export const authRouter = Router();

// Kullanıcı girişi
authRouter.post("/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: "Kullanıcı adı ve şifre gereklidir" });
    }
    
    const user = await storage.getUserByUsername(username);
    
    if (!user) {
      return res.status(401).json({ message: "Kullanıcı adı veya şifre hatalı" });
    }
    
    // Demo için basit şifre kontrolü
    if (password !== user.password) {
      return res.status(401).json({ message: "Kullanıcı adı veya şifre hatalı" });
    }
    
    // Gerçek sistemde passwordHash karşılaştırması yapılmalı:
    // const match = await bcrypt.compare(password, user.passwordHash);
    // if (!match) {
    //   return res.status(401).json({ message: "Kullanıcı adı veya şifre hatalı" });
    // }
    
    // Session'a kullanıcı bilgisini ekle
    req.session.userId = user.id;
    
    // Hassas bilgileri çıkar
    const { password: _, ...safeUser } = user;
    
    return res.status(200).json(safeUser);
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Giriş sırasında bir hata oluştu" });
  }
});

// Kullanıcı kaydı
authRouter.post("/register", async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      username: z.string().min(3, "Kullanıcı adı en az 3 karakter olmalıdır"),
      password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
      email: z.string().email("Geçerli bir e-posta adresi giriniz"),
      name: z.string().optional(),
    });
    
    const result = schema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        message: "Geçersiz kullanıcı bilgileri", 
        errors: result.error.format() 
      });
    }
    
    const { username, password, email, name } = result.data;
    
    // Kullanıcı adı kontrolü
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ message: "Bu kullanıcı adı zaten kullanımda" });
    }
    
    // Gerçek sistemde şifre hashleme:
    // const passwordHash = await bcrypt.hash(password, 10);
    
    const newUser = await storage.createUser({
      username,
      password, // Gerçek sistemde passwordHash kullanılmalı
      email,
      name,
    });
    
    // Hassas bilgileri çıkar
    const { password: _, ...safeUser } = newUser;
    
    // Otomatik giriş yap
    req.session.userId = newUser.id;
    
    return res.status(201).json(safeUser);
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: "Kayıt sırasında bir hata oluştu" });
  }
});

// Oturum kapatma
authRouter.post("/logout", (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Çıkış yapılırken bir hata oluştu" });
    }
    res.clearCookie("connect.sid");
    return res.status(200).json({ message: "Başarıyla çıkış yapıldı" });
  });
});

// Mevcut kullanıcıyı getir
authRouter.get("/me", async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Oturum açılmamış" });
    }
    
    const user = await storage.getUser(req.session.userId);
    
    if (!user) {
      // Session'da ID var ama kullanıcı bulunamadı, oturumu temizle
      req.session.destroy((err) => {
        if (err) console.error("Session destroy error:", err);
      });
      return res.status(401).json({ message: "Kullanıcı bulunamadı" });
    }
    
    // Hassas bilgileri çıkar
    const { password: _, ...safeUser } = user;
    
    return res.status(200).json(safeUser);
  } catch (error) {
    console.error("Get current user error:", error);
    return res.status(500).json({ message: "Kullanıcı bilgileri alınırken bir hata oluştu" });
  }
});