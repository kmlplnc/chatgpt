import { Router, Request, Response } from "express";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { storage } from "../storage";
import { insertUserSchema } from "@shared/schema";

// Authentication router
export const authRouter = Router();

// Login schema
const loginSchema = z.object({
  username: z.string(),
  password: z.string()
});

// Session extension to include user information
declare module "express-session" {
  interface SessionData {
    user: {
      id: number;
      username: string;
      role: string;
    };
  }
}

// Login route
authRouter.post("/login", async (req: Request, res: Response) => {
  try {
    // Validate request body
    const { username, password } = loginSchema.parse(req.body);
    
    // Find user by username
    const user = await storage.getUserByUsername(username);
    
    // Check if user exists and password matches
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Geçersiz kullanıcı adı veya şifre" });
    }
    
    // Set user in session
    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role || "user"
    };
    
    // Return user data (excluding password)
    const { password: _, ...userData } = user;
    res.json(userData);
  } catch (err) {
    console.error(err);
    
    if (err instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: fromZodError(err) 
      });
    }
    
    return res.status(500).json({ message: "Server error" });
  }
});

// Register route
authRouter.post("/register", async (req: Request, res: Response) => {
  try {
    // Validate request body
    const userData = insertUserSchema.parse(req.body);
    
    // Check if username already exists
    const existingUser = await storage.getUserByUsername(userData.username);
    if (existingUser) {
      return res.status(409).json({ message: "Bu kullanıcı adı zaten kullanılıyor" });
    }
    
    // Create user
    const newUser = await storage.createUser(userData);
    
    // Set user in session
    req.session.user = {
      id: newUser.id,
      username: newUser.username,
      role: newUser.role || "user"
    };
    
    // Return user data (excluding password)
    const { password: _, ...newUserData } = newUser;
    res.status(201).json(newUserData);
  } catch (err) {
    console.error("Register error:", err);
    
    if (err instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: fromZodError(err) 
      });
    }
    
    return res.status(500).json({ message: "Server error" });
  }
});

// Logout route
authRouter.post("/logout", (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ message: "Çıkış yapılırken hata oluştu" });
    }
    
    res.json({ message: "Başarıyla çıkış yapıldı" });
  });
});

// Get current user route
authRouter.get("/me", async (req: Request, res: Response) => {
  try {
    // Check if user is logged in
    if (!req.session.user) {
      return res.status(401).json({ message: "Authenticated değil" });
    }
    
    // Get user from database
    const user = await storage.getUser(req.session.user.id);
    
    if (!user) {
      // Clear invalid session
      req.session.destroy((err) => {
        if (err) console.error("Session destroy error:", err);
      });
      
      return res.status(401).json({ message: "Kullanıcı bulunamadı" });
    }
    
    // Return user data (excluding password)
    const { password: _, ...userData } = user;
    res.json(userData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});