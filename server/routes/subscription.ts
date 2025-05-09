import { Router, Request, Response } from "express";
import { z } from "zod";
import { storage } from "../storage";

// Subscription router
export const subscriptionRouter = Router();

// Create or upgrade subscription route
subscriptionRouter.post("/create", async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.session.user) {
      return res.status(401).json({ message: "Kimlik doğrulama gerekli" });
    }
    
    // Get subscription details from request body
    const { plan } = req.body;
    
    if (!plan || !["basic", "pro", "premium"].includes(plan)) {
      return res.status(400).json({ message: "Geçersiz abonelik planı" });
    }
    
    // Get the user from database
    const user = await storage.getUser(req.session.user.id);
    
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }
    
    // Set subscription start and end dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1 aylık abonelik
    
    // Update user subscription status
    const updatedUser = await storage.updateUserSubscription(user.id, {
      subscriptionStatus: "active",
      subscriptionPlan: plan,
      subscriptionStartDate: startDate,
      subscriptionEndDate: endDate
    });
    
    // Return updated user data (excluding password)
    const { password: _, ...userData } = updatedUser;
    res.json(userData);
  } catch (err) {
    console.error("Create subscription error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Cancel subscription route
subscriptionRouter.post("/cancel", async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.session.user) {
      return res.status(401).json({ message: "Kimlik doğrulama gerekli" });
    }
    
    // Get the user from database
    const user = await storage.getUser(req.session.user.id);
    
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }
    
    // Update user subscription status
    const updatedUser = await storage.updateUserSubscription(user.id, {
      subscriptionStatus: "canceled"
    });
    
    // Return updated user data (excluding password)
    const { password: _, ...userData } = updatedUser;
    res.json(userData);
  } catch (err) {
    console.error("Cancel subscription error:", err);
    res.status(500).json({ message: "Server error" });
  }
});