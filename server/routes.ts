import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import session from "express-session";
import cookieParser from "cookie-parser";
import { 
  insertDietPlanSchema, 
  dietRequirementSchema,
  insertSavedFoodSchema
} from "@shared/schema";
import { openaiService } from "./services/openai-service";
import { usdaService } from "./services/usda-service";
import { clientsRouter } from './routes/clients';
import { authRouter } from './routes/auth';
import { subscriptionRouter } from './routes/subscription';
import { adminRouter } from './routes/admin';
import clientPortalRouter from './routes/client-portal';
import appointmentsRouter from './routes/appointments';
import messagesRouter from './routes/messages';

export async function registerRoutes(app: Express): Promise<Server> {
  // Session setup
  app.use(cookieParser());
  app.use(session({
    secret: "dietkem-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 saat
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
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      const dietPlans = await storage.getDietPlans(userId, limit);
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
      const validatedData = insertDietPlanSchema.parse(req.body);
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
      const success = await storage.deleteDietPlan(id);
      
      if (!success) {
        return res.status(404).json({ message: "Diet plan not found" });
      }
      
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
        const existingFood = await storage.getFoodById(food.fdcId);
        if (!existingFood) {
          await storage.createFood(food);
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
      
      // Try to get from local storage first
      let food = await storage.getFoodById(fdcId);
      
      // If not found, fetch from USDA
      if (!food) {
        try {
          food = await usdaService.getFoodDetails(fdcId);
          
          // Save to local storage
          if (food) {
            await storage.createFood(food);
          }
        } catch (usdaError) {
          console.error("USDA API error:", usdaError);
          return res.status(404).json({ message: "Food not found" });
        }
      }
      
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
      
      // Try to get nutrients from local storage first
      let nutrients = await storage.getFoodNutrients(fdcId);
      
      // If not found or empty, fetch from USDA
      if (!nutrients || nutrients.length === 0) {
        try {
          const nutrientsData = await usdaService.getFoodNutrients(fdcId);
          
          // Save to local storage
          if (nutrientsData && nutrientsData.length > 0) {
            nutrients = await storage.createFoodNutrients(nutrientsData);
          }
        } catch (usdaError) {
          console.error("USDA API error:", usdaError);
          return res.status(404).json({ message: "Food nutrients not found" });
        }
      }
      
      res.json(nutrients);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.get("/api/foods/recent", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const recentFoods = await storage.getRecentFoods(limit);
      res.json(recentFoods);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Saved Foods API Routes
  app.get("/api/saved-foods", async (req, res) => {
    try {
      // In a real app, we would use the authenticated user's ID
      // For this demo, we'll use a default user ID of 1
      const userId = req.query.userId ? parseInt(req.query.userId as string) : 1;
      
      const savedFoods = await storage.getSavedFoods(userId);
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
      // For this demo, we'll use a default user ID of 1
      const userId = 1;
      
      // Check if the food is already saved
      const isSaved = await storage.isFoodSaved(userId, fdcId);
      
      if (isSaved) {
        return res.status(409).json({ message: "Food already saved" });
      }
      
      // Save the food
      const savedFood = await storage.saveFood({ userId, fdcId });
      
      // Get the food details
      const food = await storage.getFoodById(fdcId);
      
      res.status(201).json({ savedFood, food });
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/saved-foods/:fdcId", async (req, res) => {
    try {
      const fdcId = req.params.fdcId;
      
      // In a real app, we would use the authenticated user's ID
      // For this demo, we'll use a default user ID of 1
      const userId = 1;
      
      const success = await storage.removeSavedFood(userId, fdcId);
      
      if (!success) {
        return res.status(404).json({ message: "Saved food not found" });
      }
      
      res.status(204).send();
    } catch (err) {
      handleError(err, res);
    }
  });

  // AI Analysis Routes
  app.post("/api/analyze/meal", async (req, res) => {
    try {
      const { mealDescription } = req.body;
      
      if (!mealDescription) {
        return res.status(400).json({ message: "Meal description is required" });
      }
      
      const analysis = await openaiService.analyzeMeal(mealDescription);
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
      
      const tips = await openaiService.generateDietTips(context);
      res.json(tips);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
