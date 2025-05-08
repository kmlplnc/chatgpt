import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, date, numeric, unique, foreignKey, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

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

// Clients (danışanlar) schema
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  birthDate: date("birth_date"),
  gender: text("gender").notNull(), // "male", "female", "other"
  occupation: text("occupation"),
  medicalConditions: text("medical_conditions"),
  allergies: text("allergies"),
  notes: text("notes"),
  status: text("status").default("active").notNull(), // "active", "inactive"
  startDate: date("start_date").defaultNow().notNull(),
  endDate: date("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Client Measurements schema (ölçümler)
export const measurements = pgTable("measurements", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  date: date("date").defaultNow().notNull(),
  weight: numeric("weight", { precision: 5, scale: 2 }).notNull(), // kg
  height: numeric("height", { precision: 5, scale: 2 }).notNull(), // cm
  bmi: numeric("bmi", { precision: 5, scale: 2 }).notNull(),
  bodyFatPercentage: numeric("body_fat_percentage", { precision: 5, scale: 2 }),
  waistCircumference: numeric("waist_circumference", { precision: 5, scale: 2 }), // cm
  hipCircumference: numeric("hip_circumference", { precision: 5, scale: 2 }), // cm
  chestCircumference: numeric("chest_circumference", { precision: 5, scale: 2 }), // cm
  armCircumference: numeric("arm_circumference", { precision: 5, scale: 2 }), // cm
  thighCircumference: numeric("thigh_circumference", { precision: 5, scale: 2 }), // cm
  calfCircumference: numeric("calf_circumference", { precision: 5, scale: 2 }), // cm
  basalMetabolicRate: integer("basal_metabolic_rate"), // BMR (kcal)
  totalDailyEnergyExpenditure: integer("total_daily_energy_expenditure"), // TDEE (kcal)
  activityLevel: text("activity_level"), // "sedentary", "light", "moderate", "active", "very_active"
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
  tags: text("tags"),
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
