import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { insertUserSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import { users } from "@shared/schema";
import db from "../db";
import { fromZodError } from "zod-validation-error";
import { hashPassword } from "../utils/password-utils";
import bcrypt from "bcrypt";
import { randomBytes } from "crypto";

export const authRouter = Router();

// Extend Express Session type
declare module 'express-session' {
  interface SessionData {
    user?: {
      id: string;
      username: string;
      email: string;
      role: string;
    }
  }
}

// Giriş yönlendirmesi
authRouter.post("/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    console.log("Login attempt for username:", username);
    
    // Validate input
    if (!username || !password) {
      console.log("Missing username or password");
      return res.status(400).json({ message: "Username and password are required" });
    }
    
    // Get user
    const user = await storage.getUserByUsername(username);
    if (!user) {
      console.log("User not found:", username);
      return res.status(401).json({ message: "Invalid username or password" });
    }
    
    console.log("User found, verifying password");
    
    // Verify password using bcrypt
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log("Invalid password for user:", username);
      return res.status(401).json({ message: "Invalid username or password" });
    }
    
    console.log("Password verified, setting session");
    
    // Generate session token
    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    // Create session in database
    await storage.createSession(user.id, token, expires);
    
    // Set express-session user
    req.session.user = {
      id: user.id,
      username: user.username || '',
      email: user.email || '',
      role: user.role || 'user'
    };
    
    // Set session cookie
    res.cookie('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: expires
    });
    
    // Remove password from response
    const { password: _, ...safeUser } = user;
    console.log("Login successful for user:", username);
    res.json(safeUser);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "An error occurred during login" });
  }
});

// Kayıt yönlendirmesi
authRouter.post("/register", async (req: Request, res: Response) => {
  try {
    console.log("Registration request received:", req.body);
    
    // Hash password
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    console.log("Password hashed successfully");
    
    // Process user data
    const userData = {
      username: req.body.username,
      password: hashedPassword,
      email: req.body.email,
      name: req.body.full_name || req.body.username,
      role: "user",
      subscriptionStatus: "free"
    };
    
    console.log("Processed user data:", { ...userData, password: '[REDACTED]' });
    
    // Validate against schema
    const validationResult = insertUserSchema.safeParse(userData);
    if (!validationResult.success) {
      console.error("Validation failed:", validationResult.error);
      return res.status(400).json({
        message: "Invalid input",
        errors: fromZodError(validationResult.error)
      });
    }
    
    // Check if username already exists
    const existingUser = await storage.getUserByUsername(userData.username);
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }
    
    // Create user
    try {
      console.log("Attempting to create user with data:", { ...userData, password: '[REDACTED]' });
      const user = await storage.createUser(userData);
      console.log("User created successfully:", { ...user, password: '[REDACTED]' });
      // Remove password from response
      const { password: _, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (createError) {
      console.error("Error creating user:", createError);
      if (createError instanceof Error) {
        console.error("Error details:", {
          message: createError.message,
          stack: createError.stack
        });
      }
      return res.status(500).json({ 
        message: "Failed to create user",
        error: createError instanceof Error ? createError.message : "Unknown error"
      });
    }
  } catch (error) {
    console.error("Registration error:", error);
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack
      });
    }
    res.status(500).json({ 
      message: "An error occurred during registration",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Çıkış yönlendirmesi
authRouter.post("/logout", async (req: Request, res: Response) => {
  try {
    const token = req.cookies.session_token;
    if (token) {
      try {
        await storage.deleteSession(token);
      } catch (error) {
        console.error("Session deletion error:", error);
        // Session silme hatası olsa bile çıkış işlemine devam et
      }
    }
    
    // Session'ı temizle
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destroy error:", err);
        return res.status(500).json({ message: "Çıkış yaparken bir hata oluştu" });
      }
      
      // Çerezleri temizle
      res.clearCookie("connect.sid");
      res.clearCookie("session_token");
      
      res.status(200).json({ message: "Başarıyla çıkış yapıldı" });
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Çıkış yaparken bir hata oluştu" });
  }
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
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error("Me endpoint hatası:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
});

// Session bilgisi alma
authRouter.get("/session", async (req: Request, res: Response) => {
  try {
    const token = req.cookies.session_token;
    if (!token) {
      return res.status(401).json({ message: "Oturum açılmamış" });
    }

    const session = await storage.getSession(token);
    if (!session || session.expires < new Date()) {
      return res.status(401).json({ message: "Oturum süresi dolmuş" });
    }

    const user = await storage.getUser(session.user.id.toString());
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    // Kullanıcı bilgilerini dön (şifre olmadan)
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      user: userWithoutPassword,
      sessionToken: token
    });
  } catch (error) {
    console.error("Session endpoint hatası:", error);
    res.status(500).json({ message: "Sunucu hatası" });
  }
});