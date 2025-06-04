import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, date, numeric, unique, foreignKey, json, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User schema (extended from the existing schema)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  full_name: text("full_name"),
  role: text("role").default("user"),
  // Subscription fields
  subscription_status: text("subscription_status").default("free").notNull(), // "free", "trial", "active", "expired", "canceled"
  subscription_plan: text("subscription_plan"), // "basic", "pro", "premium", null for free
  subscription_start_date: timestamp("subscription_start_date", { withTimezone: true }),
  subscription_end_date: timestamp("subscription_end_date", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Session schema
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  user_id: uuid("user_id").references(() => users.id).notNull(),
  token: text("token").notNull().unique(),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Clients (danışanlar) schema
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  user_id: uuid("user_id").references(() => users.id),
  first_name: text("first_name").notNull(),
  last_name: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  birth_date: date("birth_date"),
  gender: text("gender").notNull(), // "male", "female"
  height: numeric("height", { precision: 5, scale: 2 }), // cm cinsinden boy
  occupation: text("occupation"),
  medical_conditions: text("medical_conditions"),
  allergies: text("allergies"),
  medications: text("medications"),
  notes: text("notes"),
  client_visible_notes: jsonb("client_visible_notes"),
  diet_preferences: text("diet_preferences"),
  status: text("status").default("active").notNull(),
  start_date: date("start_date").defaultNow().notNull(),
  end_date: date("end_date"),
  access_code: text("access_code").unique(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Client Measurements schema (ölçümler)
export const measurements = pgTable("measurements", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  date: date("date").defaultNow().notNull(),
  weight: numeric("weight", { precision: 5, scale: 2 }).notNull(), // kg
  height: numeric("height", { precision: 5, scale: 2 }).notNull(), // cm
  bmi: numeric("bmi", { precision: 5, scale: 2 }),
  bodyFatPercentage: numeric("body_fat_percentage", { precision: 5, scale: 2 }),
  waistCircumference: numeric("waist_circumference", { precision: 5, scale: 2 }), // cm
  hipCircumference: numeric("hip_circumference", { precision: 5, scale: 2 }), // cm
  chestCircumference: numeric("chest_circumference", { precision: 5, scale: 2 }), // cm
  armCircumference: numeric("arm_circumference", { precision: 5, scale: 2 }), // cm
  thighCircumference: numeric("thigh_circumference", { precision: 5, scale: 2 }), // cm
  calfCircumference: numeric("calf_circumference", { precision: 5, scale: 2 }), // cm
  basalMetabolicRate: numeric("basal_metabolic_rate", { precision: 7, scale: 2 }), // BMR (kcal)
  totalDailyEnergyExpenditure: numeric("total_daily_energy_expenditure", { precision: 7, scale: 2 }), // TDEE (kcal)
  activityLevel: text("activity_level"), // "sedentary", "light", "moderate", "active", "very_active"
  notes: text("notes"),
  // Micro-nutrients
  vitaminA: numeric("vitamin_a", { precision: 5, scale: 2 }), // mcg
  vitaminC: numeric("vitamin_c", { precision: 5, scale: 2 }), // mg
  vitaminD: numeric("vitamin_d", { precision: 5, scale: 2 }), // mcg
  vitaminE: numeric("vitamin_e", { precision: 5, scale: 2 }), // mg
  vitaminK: numeric("vitamin_k", { precision: 5, scale: 2 }), // mcg
  thiamin: numeric("thiamin", { precision: 5, scale: 2 }), // mg
  riboflavin: numeric("riboflavin", { precision: 5, scale: 2 }), // mg
  niacin: numeric("niacin", { precision: 5, scale: 2 }), // mg
  vitaminB6: numeric("vitamin_b6", { precision: 5, scale: 2 }), // mg
  folate: numeric("folate", { precision: 5, scale: 2 }), // mcg
  vitaminB12: numeric("vitamin_b12", { precision: 5, scale: 2 }), // mcg
  biotin: numeric("biotin", { precision: 5, scale: 2 }), // mcg
  pantothenicAcid: numeric("pantothenic_acid", { precision: 5, scale: 2 }), // mg
  calcium: numeric("calcium", { precision: 5, scale: 2 }), // mg
  iron: numeric("iron", { precision: 5, scale: 2 }), // mg
  magnesium: numeric("magnesium", { precision: 5, scale: 2 }), // mg
  phosphorus: numeric("phosphorus", { precision: 5, scale: 2 }), // mg
  zinc: numeric("zinc", { precision: 5, scale: 2 }), // mg
  potassium: numeric("potassium", { precision: 5, scale: 2 }), // mg
  sodium: numeric("sodium", { precision: 5, scale: 2 }), // mg
  copper: numeric("copper", { precision: 5, scale: 2 }), // mcg
  manganese: numeric("manganese", { precision: 5, scale: 2 }), // mg
  selenium: numeric("selenium", { precision: 5, scale: 2 }), // mcg
  chromium: numeric("chromium", { precision: 5, scale: 2 }), // mcg
  molybdenum: numeric("molybdenum", { precision: 5, scale: 2 }), // mcg
  iodine: numeric("iodine", { precision: 5, scale: 2 }), // mcg
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  full_name: true,
  role: true,
  subscription_status: true,
  subscription_plan: true,
  subscription_start_date: true,
  subscription_end_date: true,
});

// Diet Plans schema
export const dietPlans = pgTable("diet_plans", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id),
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
  allergies: z.array(z.string()).optional(),
  healthConditions: z.array(z.string()).optional(),
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
  userId: uuid("user_id").references(() => users.id),
  fdcId: text("fdc_id").references(() => foods.fdcId),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSavedFoodSchema = createInsertSchema(savedFoods).omit({
  id: true,
  createdAt: true,
});

// Client Sessions schema
export const clientSessions = pgTable("client_sessions", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id, { onDelete: 'cascade' }),
  sessionToken: text("session_token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  lastActivity: timestamp("last_activity").defaultNow()
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

// Create Client schema
export const insertClientSchema = createInsertSchema(clients, {
  height: z.number().min(100).max(250),
  gender: z.enum(["male", "female"]),
  status: z.enum(["active", "inactive"]),
  diet_preferences: z.string().optional(),
  user_id: z.number(),
}).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// Update Client schema
export const updateClientSchema = createSelectSchema(clients, {
  height: z.string().or(z.number()).transform(val => String(val)),
  gender: z.enum(["male", "female"]),
  status: z.enum(["active", "inactive"]),
  diet_preferences: z.string().optional(),
}).omit({
  id: true,
  created_at: true,
  updated_at: true,
  user_id: true,
}).partial();

// Create Measurement schema
export const insertMeasurementSchema = createInsertSchema(measurements, {
  basalMetabolicRate: z.preprocess(val => val === "" || val == null ? null : Number(val), z.number().nullable().optional()),
  totalDailyEnergyExpenditure: z.preprocess(val => val === "" || val == null ? null : Number(val), z.number().nullable().optional()),
  bodyFatPercentage: z.preprocess(val => val === "" || val == null ? null : Number(val), z.number().nullable().optional()),
  waistCircumference: z.preprocess(val => val === "" || val == null ? null : Number(val), z.number().nullable().optional()),
  hipCircumference: z.preprocess(val => val === "" || val == null ? null : Number(val), z.number().nullable().optional()),
  chestCircumference: z.preprocess(val => val === "" || val == null ? null : Number(val), z.number().nullable().optional()),
  armCircumference: z.preprocess(val => val === "" || val == null ? null : Number(val), z.number().nullable().optional()),
  thighCircumference: z.preprocess(val => val === "" || val == null ? null : Number(val), z.number().nullable().optional()),
  calfCircumference: z.preprocess(val => val === "" || val == null ? null : Number(val), z.number().nullable().optional()),
  weight: z.preprocess(val => val === "" || val == null ? null : Number(val), z.number()),
  height: z.preprocess(val => val === "" || val == null ? null : Number(val), z.number()),
  bmi: z.preprocess(val => val === "" || val == null ? null : Number(val), z.number()),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type UpdateSubscriptionInput = {
  subscription_status: string;
  subscription_plan?: string | null;
  subscription_start_date?: Date | null;
  subscription_end_date?: Date | null;
};

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Measurement = typeof measurements.$inferSelect;
export type InsertMeasurement = z.infer<typeof insertMeasurementSchema>;

export type DietPlan = typeof dietPlans.$inferSelect;
export type InsertDietPlan = z.infer<typeof insertDietPlanSchema>;
export type DietRequirement = z.infer<typeof dietRequirementSchema>;

export type Food = typeof foods.$inferSelect;
export type InsertFood = z.infer<typeof insertFoodSchema>;

export type SavedFood = typeof savedFoods.$inferSelect;
export type InsertSavedFood = z.infer<typeof insertSavedFoodSchema>;

export type FoodNutrient = typeof foodNutrients.$inferSelect;
export type InsertFoodNutrient = z.infer<typeof insertFoodNutrientSchema>;

// Randevular tablosu
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  date: timestamp("date").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: text("status").notNull().default("pending"),
  notes: text("notes"),
  type: text("type"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAppointmentSchema = createInsertSchema(appointments, {
  userId: z.preprocess(
    val => String(val),
    z.string().refine(
      val => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val),
      { message: "Invalid UUID format" }
    )
  ),
  type: z.string().min(1, "Randevu tipi zorunludur"),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Mesajlar tablosu
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  fromClient: boolean("from_client").notNull().default(false),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export type ClientSession = typeof clientSessions.$inferSelect;
export type InsertClientSession = typeof clientSessions.$inferInsert;

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// Bildirimler tablosu
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  clientId: integer("client_id").references(() => clients.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull(), // "message", "appointment", "system"
  relatedId: integer("related_id"), // İlgili mesaj, randevu vb. ID'si
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  scheduledFor: timestamp("scheduled_for"), // İleriye dönük bildirimler için
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Search result type
export interface FoodSearchResult {
  foods: Food[];
  totalHits: number;
  currentPage: number;
  totalPages: number;
}

export const clientNotes = pgTable("client_notes", {
  id: serial("id").primaryKey(),
  client_id: integer("client_id").notNull().references(() => clients.id),
  user_id: uuid("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});
