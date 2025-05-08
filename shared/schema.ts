import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, array } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema (extended from the existing schema)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  name: text("name"),
  role: text("role").default("user"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
});

// Diet Plans schema
export const dietPlans = pgTable("diet_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  calorieGoal: integer("calorie_goal").notNull(),
  proteinPercentage: integer("protein_percentage").notNull(),
  carbsPercentage: integer("carbs_percentage").notNull(),
  fatPercentage: integer("fat_percentage").notNull(),
  meals: integer("meals").notNull(),
  includeDessert: boolean("include_dessert").default(false),
  includeSnacks: boolean("include_snacks").default(true),
  status: text("status").default("draft"),
  durationDays: integer("duration_days").default(7),
  tags: text("tags").array(),
  dietType: text("diet_type"),
  content: jsonb("content"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDietPlanSchema = createInsertSchema(dietPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Diet Requirements (for generating plans)
export const dietRequirementSchema = z.object({
  name: z.string(),
  age: z.number(),
  gender: z.enum(["male", "female"]),
  height: z.number(),
  weight: z.number(),
  activityLevel: z.enum([
    "sedentary",
    "light",
    "moderate",
    "active",
    "very_active",
  ]),
  dietType: z.enum([
    "balanced",
    "low_carb",
    "high_protein",
    "vegetarian",
    "vegan",
    "keto",
    "paleo",
    "mediterranean",
    "custom",
  ]),
  allergies: z.string().optional(),
  healthConditions: z.string().optional(),
  calorieGoal: z.number().optional(),
  proteinPercentage: z.number(),
  carbsPercentage: z.number(),
  fatPercentage: z.number(),
  meals: z.number(),
  includeDessert: z.boolean().default(false),
  includeSnacks: z.boolean().default(true),
});

// Food schema (for USDA Food Database)
export const foods = pgTable("foods", {
  fdcId: text("fdc_id").primaryKey(),
  dataType: text("data_type"),
  description: text("description").notNull(),
  brandName: text("brand_name"),
  ingredients: text("ingredients"),
  servingSize: integer("serving_size"),
  servingSizeUnit: text("serving_size_unit"),
  foodCategory: text("food_category"),
  publishedDate: timestamp("published_date"),
  foodAttributes: jsonb("food_attributes"),
  foodNutrients: jsonb("food_nutrients"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFoodSchema = createInsertSchema(foods).omit({
  createdAt: true,
});

// SavedFood schema
export const savedFoods = pgTable("saved_foods", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  fdcId: text("fdc_id").references(() => foods.fdcId),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSavedFoodSchema = createInsertSchema(savedFoods).omit({
  id: true,
  createdAt: true,
});

// Food Nutrient schema
export const foodNutrients = pgTable("food_nutrients", {
  id: serial("id").primaryKey(),
  fdcId: text("fdc_id").references(() => foods.fdcId),
  nutrientId: integer("nutrient_id"),
  name: text("name").notNull(),
  amount: integer("amount").notNull(),
  unit: text("unit").notNull(),
  percentDailyValue: integer("percent_daily_value"),
});

export const insertFoodNutrientSchema = createInsertSchema(foodNutrients).omit({
  id: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type DietPlan = typeof dietPlans.$inferSelect;
export type InsertDietPlan = z.infer<typeof insertDietPlanSchema>;
export type DietRequirement = z.infer<typeof dietRequirementSchema>;

export type Food = typeof foods.$inferSelect;
export type InsertFood = z.infer<typeof insertFoodSchema>;

export type SavedFood = typeof savedFoods.$inferSelect;
export type InsertSavedFood = z.infer<typeof insertSavedFoodSchema>;

export type FoodNutrient = typeof foodNutrients.$inferSelect;
export type InsertFoodNutrient = z.infer<typeof insertFoodNutrientSchema>;

// Search result type
export interface FoodSearchResult {
  foods: Food[];
  totalHits: number;
  currentPage: number;
  totalPages: number;
}
