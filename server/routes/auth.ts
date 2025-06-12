import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { insertUserSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import { users } from "@shared/schema";
import db from "../db";
import { fromZodError } from "zod-validation-error";
import { hashPassword, comparePasswords } from "../utils/password-utils";
import bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import { createSession, getSession, deleteSession } from "../session";
import { z } from 'zod';

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

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
});

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  email: z.string().email('Invalid email address'),
  name: z.string().optional()
});

// Giriş yönlendirmesi
authRouter.post("/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = loginSchema.parse(req.body);
    console.log("Login attempt for username:", username);
    
    // Get user
    const user = await storage.getUserByUsername(username);
    if (!user) {
      console.log("User not found:", username);
      return res.status(401).json({ message: "Invalid username or password" });
    }
    
    console.log("User found, verifying password");
    
    // Verify password using bcrypt
    const isValidPassword = await comparePasswords(password, user.password);
    if (!isValidPassword) {
      console.log("Invalid password for user:", username);
      return res.status(401).json({ message: "Invalid username or password" });
    }
    
    console.log("Password verified, setting session");
    
    // Create session using centralized function
    const session = await createSession(user.id);
    if (!session) {
      throw new Error("Failed to create session");
    }
    
    // Set express-session user
    req.session.user = {
      id: user.id,
      username: user.username || '',
      email: user.email || '',
      role: user.role || 'user'
    };
    
    // Set session cookie
    res.cookie('session_token', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: session.expires
    });
    
    // Remove password from response
    const { password: _, ...safeUser } = user;
    console.log("Login successful for user:", username);
    res.json(safeUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: fromZodError(error) 
      });
    }
    console.error("Login error:", error);
    res.status(500).json({ message: "An error occurred during login" });
  }
});

// Kayıt yönlendirmesi
authRouter.post("/register", async (req: Request, res: Response) => {
  try {
    const { username, password, email, name } = registerSchema.parse(req.body);
    console.log("Registration request received:", req.body);
    
    // Check if username already exists
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }
    
    // Check if email already exists
    const existingEmail = await storage.getUserByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    console.log("Password hashed successfully");
    
    // Process user data
    const userData = {
      username,
      password: hashedPassword,
      email,
      name: name || username,
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
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: fromZodError(error) 
      });
    }
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

// Get current user
authRouter.get("/me", async (req: Request, res: Response) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await storage.getUser(req.session.user.id);
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    // Remove password from response
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    console.error("Error getting user:", error);
    res.status(500).json({ message: "An error occurred while getting user information" });
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