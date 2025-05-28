import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import session from "express-session";
import cookieParser from "cookie-parser";
import connectPgSimple from 'connect-pg-simple';
import { pool } from "./db";
import { 
  insertDietPlanSchema, 
  dietRequirementSchema,
  insertSavedFoodSchema
} from "@shared/schema";
import { openaiService } from "./services/openai-service";
import { geminiService } from "./services/gemini-service";
import { usdaService } from "./services/usda-service";
import clientsRouter from "./routes/clients";
import { authRouter } from './routes/auth';
import { subscriptionRouter } from './routes/subscription';
import { adminRouter } from './routes/admin';
import clientPortalRouter from './routes/client-portal';
import appointmentsRouter from './routes/appointments';
import messagesRouter from './routes/messages';
import notificationsRouter from './routes/notifications';
import { fatsecretRouter } from './routes/fatsecret';
import { hashPassword } from "./utils/password-utils";
import userRouter from './routes/user';
import express from 'express';
import * as dotenv from 'dotenv';
import { generateDietPlan } from './src/routes/diet-plans';
import geminiRouter from './routes/gemini';

dotenv.config();

const router = express.Router();

// Admin kontrolü için yardımcı fonksiyon
function isAdmin(req: Request): boolean {
  return req.session?.user?.role === "admin";
}

// Auth middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session setup
  app.use(cookieParser());

  // Create PostgreSQL session store
  const pgSession = connectPgSimple(session);
  const store = new pgSession({
    pool: pool,
    tableName: 'session',
    createTableIfMissing: true
  });

  app.use(session({
    store: store,
    secret: process.env.SESSION_SECRET || "dietkem-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    }
  }));
  
  // Add auth routes
  app.use('/api/auth', authRouter);
  
  // Add subscription routes
  app.use('/api/subscription', subscriptionRouter);
  
  // Add clients routes
  app.use('/api/clients', clientsRouter);
  
  // Add admin routes
  app.use('/api/admin', adminRouter);
  
  // Add client portal routes
  app.use('/api/client-portal', clientPortalRouter);
  
  // Add appointments routes
  app.use('/api/appointments', appointmentsRouter);
  
  // Add messages routes
  app.use('/api/messages', messagesRouter);
  
  // Add notifications routes
  app.use('/api/notifications', notificationsRouter);
  
  // Add fatsecret routes
  app.use('/api/fatsecret', fatsecretRouter);
  
  // Add user routes
  app.use('/api/user', userRouter);
  
  // Add Gemini routes
  app.use('/api/gemini', geminiRouter);
  
  // Error handler middleware
  const handleError = (err: any, res: Response) => {
    console.error(err);
    
    if (err instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: fromZodError(err) 
      });
    }
    
    return res.status(500).json({ 
      message: err.message || "Internal server error" 
    });
  };

  // Diet Plans API Routes
  app.get("/api/diet-plans", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      const dietPlans = await storage.getUserDietPlans(userId, limit);
      res.json(dietPlans);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/diet-plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const dietPlan = await storage.getDietPlan(id);
      
      if (!dietPlan) {
        return res.status(404).json({ message: "Diet plan not found" });
      }
      
      res.json(dietPlan);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/diet-plans", async (req, res) => {
    try {
      const validatedData = insertDietPlanSchema.parse({
        ...req.body,
        userId: req.session?.user?.id || null
      });
      
      const dietPlan = await storage.createDietPlan(validatedData);
      res.status(201).json(dietPlan);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.patch("/api/diet-plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const updatedPlan = await storage.updateDietPlan(id, updates);
      
      if (!updatedPlan) {
        return res.status(404).json({ message: "Diet plan not found" });
      }
      
      res.json(updatedPlan);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/diet-plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteDietPlan(id);
      res.status(204).send();
    } catch (err) {
      handleError(err, res);
    }
  });

  // Manual Diet Plan Creation 
  app.post("/api/diet-plans", async (req, res) => {
    try {
      const validatedData = insertDietPlanSchema.parse(req.body);
      
      // Save the diet plan
      const dietPlan = await storage.createDietPlan(validatedData);
      
      res.status(201).json(dietPlan);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Export Diet Plan
  app.get("/api/diet-plans/:id/export", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const format = (req.query.format as string) || "pdf";
      
      const dietPlan = await storage.getDietPlan(id);
      
      if (!dietPlan) {
        return res.status(404).json({ message: "Diet plan not found" });
      }
      
      // In a real app, this would generate a PDF or JSON file
      // For this demo, we'll just return the plan with a simulated URL
      res.json({
        url: `/exports/diet-plan-${id}.${format}`,
        format: format,
        plan: dietPlan
      });
    } catch (err) {
      handleError(err, res);
    }
  });

  // Food Database API Routes
  app.get("/api/foods/search", async (req, res) => {
    try {
      const query = req.query.query as string || "";
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 20;
      const dataType = req.query.dataType as string[] || undefined;
      const sortBy = req.query.sortBy as string || undefined;
      const sortOrder = req.query.sortOrder as string || "asc";
      
      // If query is less than 2 characters, return empty results
      if (query.length < 2) {
        return res.json({
          foods: [],
          totalHits: 0,
          currentPage: page,
          totalPages: 0
        });
      }
      
      // Search USDA database
      const searchResults = await usdaService.searchFoods({
        query,
        dataType: dataType as string[] | undefined,
        page,
        pageSize,
        sortBy,
        sortOrder: sortOrder as "asc" | "desc"
      });
      
      // Save foods to local storage
      for (const food of searchResults.foods) {
        const existingFood = await storage.getFood(food.fdcId);
        if (!existingFood) {
          await storage.createFood({
            fdcId: food.fdcId,
            description: food.description,
            dataType: food.dataType,
            brandName: food.brandName,
            ingredients: food.ingredients,
            servingSize: food.servingSize,
            servingSizeUnit: food.servingSizeUnit,
            foodCategory: food.foodCategory,
            publishedDate: food.publishedDate,
            foodAttributes: food.foodAttributes as any,
            foodNutrients: food.foodNutrients as any,
          });
        }
      }
      
      res.json(searchResults);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/foods/:fdcId", async (req, res) => {
    try {
      const fdcId = req.params.fdcId;
      const food = await storage.getFood(fdcId);
      
      if (!food) {
        return res.status(404).json({ message: "Food not found" });
      }
      
      res.json(food);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/foods/:fdcId/nutrients", async (req, res) => {
    try {
      const fdcId = req.params.fdcId;
      const food = await storage.getFood(fdcId);
      
      if (!food) {
        return res.status(404).json({ message: "Food not found" });
      }
      
      // Extract nutrients from food data
      const nutrients = food.foodNutrients || [];
      res.json(nutrients);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/foods/recent", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const foods = await storage.searchFoods("", limit);
      res.json(foods);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Saved Foods API Routes
  app.get("/api/saved-foods", async (req, res) => {
    try {
      // In a real app, we would use the authenticated user's ID
      // For this demo, we'll use a default user ID
      const userId = req.query.userId ? req.query.userId as string : "00000000-0000-0000-0000-000000000001";
      
      const savedFoods = await storage.getSavedFood(userId);
      res.json(savedFoods);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/saved-foods", async (req, res) => {
    try {
      // Validate the request body
      const { fdcId } = req.body;
      
      if (!fdcId) {
        return res.status(400).json({ message: "fdcId is required" });
      }
      
      // In a real app, we would use the authenticated user's ID
      // For this demo, we'll use a default user ID
      const userId = "00000000-0000-0000-0000-000000000001";
      
      // Check if the food is already saved
      const isSaved = await storage.isFoodSaved(userId, fdcId);
      
      if (isSaved) {
        return res.status(409).json({ message: "Food already saved" });
      }
      
      // Save the food
      const savedFood = await storage.createSavedFood({ userId, fdcId });
      
      // Get the food details
      const food = await storage.getFood(fdcId);
      
      res.status(201).json({ savedFood, food });
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/saved-foods/:fdcId", async (req, res) => {
    try {
      const fdcId = req.params.fdcId;
      
      // In a real app, we would use the authenticated user's ID
      // For this demo, we'll use a default user ID
      const userId = "00000000-0000-0000-0000-000000000001";
      
      const success = await storage.deleteSavedFood(userId, fdcId);
      
      if (!success) {
        return res.status(404).json({ message: "Saved food not found" });
      }
      
      res.status(204).send();
    } catch (err) {
      handleError(err, res);
    }
  });

  // AI Analysis Routes with Google Gemini
  app.post("/api/analyze/meal", async (req, res) => {
    try {
      const { mealDescription } = req.body;
      
      if (!mealDescription) {
        return res.status(400).json({ message: "Meal description is required" });
      }
      
      const analysis = await geminiService.analyzeMeal(mealDescription);
      res.json(analysis);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/generate/diet-tips", async (req, res) => {
    try {
      const { context } = req.body;
      
      if (!context) {
        return res.status(400).json({ message: "Context is required" });
      }
      
      const tips = await geminiService.generateDietTips(context);
      res.json(tips);
    } catch (err) {
      handleError(err, res);
    }
  });
  
  // AI Diet Plan Generation with Google Gemini (geçici olarak devre dışı)
  // app.post("/api/generate/diet-plan", async (req, res) => {
  //   try {
  //     // Kullanıcı yetkisi kontrol et
  //     if (!req.session.user) {
  //       return res.status(401).json({ message: "Oturum açmanız gerekiyor" });
  //     }
  //     // Subscription kontrolü (Free kullanıcılar bu özelliği kullanamaz)
  //     const user = req.session.user as any; // Tipe uygunluk için cast
  //     if (user.subscriptionStatus === "free") {
  //       return res.status(403).json({ 
  //         message: "Bu özellik abonelik gerektirir. Lütfen abonelik planınızı yükseltin."
  //       });
  //     }
  //     // Diyet gereksinimleri doğrulama
  //     const validationResult = dietRequirementSchema.safeParse(req.body);
  //     if (!validationResult.success) {
  //       const validationError = fromZodError(validationResult.error);
  //       return res.status(400).json({ message: validationError.message });
  //     }
  //     // Google Gemini ile diyet planı oluştur
  //     const dietPlan = await geminiService.generateDietPlan(validationResult.data);
  //     // Veritabanına kaydet
  //     const savedPlan = await storage.createDietPlan({
  //       userId: req.session.user.id,
  //       name: `${validationResult.data.name} için Diyet Planı`,
  //       description: dietPlan.description,
  //       content: dietPlan.content,
  //       calorieGoal: validationResult.data.calorieGoal || 2000,
  //       proteinPercentage: validationResult.data.proteinPercentage,
  //       carbsPercentage: validationResult.data.carbsPercentage,
  //       fatPercentage: validationResult.data.fatPercentage,
  //       meals: validationResult.data.meals,
  //       includeDessert: validationResult.data.includeDessert,
  //       includeSnacks: validationResult.data.includeSnacks,
  //       status: "active",
  //       durationDays: dietPlan.durationDays || 7,
  //       tags: Array.isArray(dietPlan.tags) ? dietPlan.tags.join(',') : "",
  //       dietType: validationResult.data.dietType,
  //     });
  //     res.status(201).json(savedPlan);
  //   } catch (err) {
  //     handleError(err, res);
  //   }
  // });

  // Gemini AI ile diyet planı oluşturma (auth olmadan!)
  app.post('/api/generate/diet-plan', generateDietPlan);

  // Admin routes
  app.get("/api/admin/users", requireAuth, async (req, res) => {
    try {
      // Admin kontrolü
      if (!isAdmin(req)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      // Tüm kullanıcıları getir
      const users = await storage.getAllUsers();
      
      // Kullanıcıları düzenle (hassas bilgileri kaldır)
      const sanitizedUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionPlan: user.subscriptionPlan,
        createdAt: user.createdAt
      }));

      return res.json(sanitizedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      return res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users", requireAuth, async (req, res) => {
    try {
      if (!isAdmin(req)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const { username, password, email, name, role, subscriptionStatus, subscriptionPlan } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        email,
        name,
        role: role || "user",
        subscriptionStatus: subscriptionStatus || "free",
        subscriptionPlan: subscriptionPlan || null
      });

      // Remove password from response
      const { password: _, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/admin/users/:id", requireAuth, async (req, res) => {
    try {
      // Admin kontrolü
      if (!isAdmin(req)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const userId = req.params.id;
      const { username, password, email, name, role, subscriptionStatus, subscriptionPlan } = req.body;
      
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
      
      if (subscriptionStatus) {
        subscriptionUpdates.subscriptionStatus = subscriptionStatus;
        hasSubscriptionUpdates = true;
      }
      
      if (subscriptionPlan !== undefined) {
        subscriptionUpdates.subscriptionPlan = subscriptionPlan || null;
        hasSubscriptionUpdates = true;
      }
      
      try {
        // Kullanıcıyı güncelle
        const updatedUser = await storage.updateUser(userId, updates);
        
        // Abonelik bilgilerini güncelle
        if (hasSubscriptionUpdates) {
          await storage.updateUserSubscription(userId, subscriptionUpdates);
        }
        
        // Güncel kullanıcıyı tekrar getir
        const refreshedUser = await storage.getUser(userId);
        
        // Parola bilgisini çıkar
        if (refreshedUser) {
          const { password: _, ...safeUser } = refreshedUser;
          return res.json(safeUser);
        } else {
          return res.status(404).json({ message: "Kullanıcı bulunamadı" });
        }
      } catch (updateError) {
        console.error("Kullanıcı güncelleme hatası:", updateError);
        return res.status(500).json({ message: "Kullanıcı güncellenirken bir hata oluştu" });
      }
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/admin/users/:id", requireAuth, async (req, res) => {
    try {
      // Admin kontrolü
      if (!isAdmin(req)) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const userId = req.params.id;
      
      // Admin kendisini silmeye çalışıyorsa engelle
      if (req.session?.user?.id === userId) {
        return res.status(400).json({ message: "Kendi hesabınızı silemezsiniz" });
      }
      
      // Kullanıcının var olup olmadığını kontrol et
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Kullanıcı bulunamadı" });
      }
      
      // Kullanıcıyı sil
      await storage.deleteUser(userId);
      res.status(200).json({ message: "Kullanıcı başarıyla silindi" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}

export default router;
