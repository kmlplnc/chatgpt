import { Router, Request, Response } from "express";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "../storage";
import { insertUserSchema, User } from "@shared/schema";

export const authRouter = Router();

// scrypt'i promise tabanlı hale getirme
const scryptAsync = promisify(scrypt);

// Şifre karma (hash) işlemi
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Şifre karşılaştırma işlemi
async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Session tipini genişlet
declare module "express-session" {
  interface SessionData {
    user: {
      id: number;
      username: string;
      role: string;
    };
  }
}

// Giriş yönlendirmesi
authRouter.post("/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Kullanıcı adı ve şifre gereklidir" });
    }

    // Kullanıcıyı bul
    const user = await storage.getUserByUsername(username);

    if (!user) {
      return res.status(401).json({ message: "Geçersiz kullanıcı adı veya şifre" });
    }

    // Şifre doğrulama
    const passwordMatch = await comparePasswords(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Geçersiz kullanıcı adı veya şifre" });
    }

    // Session'a kullanıcı bilgisi ekle
    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role || 'user',
    };

    // Kullanıcı bilgilerini dön (şifre olmadan)
    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error("Giriş hatası:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
});

// Kayıt yönlendirmesi
authRouter.post("/register", async (req: Request, res: Response) => {
  try {
    // Veri doğrulama
    const validation = insertUserSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({ message: "Geçersiz kullanıcı bilgileri", errors: validation.error.errors });
    }

    const { username, email, password } = req.body;

    // Kullanıcı adı kontrol
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ message: "Bu kullanıcı adı zaten kullanılıyor" });
    }

    // Şifreyi hashle
    const hashedPassword = await hashPassword(password);

    // Yeni kullanıcı oluştur
    const user = await storage.createUser({
      ...req.body,
      password: hashedPassword,
      role: 'user',
      subscriptionStatus: 'free',
      subscriptionStartDate: null,
      subscriptionEndDate: null,
      subscriptionPlan: null,
    });

    // Session'a kullanıcı bilgisi ekle
    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role || 'user',
    };

    // Kullanıcı bilgilerini dön (şifre olmadan)
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error("Kayıt hatası:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
});

// Çıkış yönlendirmesi
authRouter.post("/logout", (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Çıkış yaparken bir hata oluştu" });
    }
    res.clearCookie("connect.sid");
    res.status(200).json({ message: "Başarıyla çıkış yapıldı" });
  });
});

// Kullanıcı bilgisi alma
authRouter.get("/me", async (req: Request, res: Response) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: "Oturum açılmamış" });
    }

    const user = await storage.getUser(req.session.user.id);

    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    // Kullanıcı bilgilerini dön (şifre olmadan)
    const { password, ...userWithoutPassword } = user;
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error("Kullanıcı bilgisi alma hatası:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
});