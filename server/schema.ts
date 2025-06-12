import { z } from "zod";
import { pgTable, text, timestamp, uuid, varchar, boolean, integer, jsonb } from 'drizzle-orm/pg-core';

export const insertUserSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  email: z.string().email(),
  full_name: z.string().nullable(),
  role: z.enum(["user", "admin"]).default("user"),
  subscription_status: z.enum(["free", "premium", "pro"]).default("free"),
  subscription_plan: z.string().nullable(),
  subscription_start_date: z.date().nullable(),
  subscription_end_date: z.date().nullable()
});

export const updateUserSchema = insertUserSchema.partial().omit({ password: true });

export const updateSubscriptionSchema = z.object({
  subscription_status: z.enum(["free", "premium", "pro"]).optional(),
  subscription_plan: z.string().nullable().optional(),
  subscription_start_date: z.date().nullable().optional(),
  subscription_end_date: z.date().nullable().optional()
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  role: varchar('role', { length: 50 }).default('user'),
  subscriptionStatus: varchar('subscription_status', { length: 50 }).default('free'),
  subscriptionPlan: varchar('subscription_plan', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  birthDate: timestamp('birth_date'),
  gender: varchar('gender', { length: 50 }),
  height: integer('height'),
  weight: integer('weight'),
  activityLevel: varchar('activity_level', { length: 50 }),
  goal: varchar('goal', { length: 255 }),
  medicalConditions: text('medical_conditions'),
  allergies: text('allergies'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const measurements = pgTable('measurements', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  date: timestamp('date').notNull(),
  weight: integer('weight'),
  height: integer('height'),
  bmi: integer('bmi'),
  bodyFat: integer('body_fat'),
  bodyWater: integer('body_water'),
  muscleMass: integer('muscle_mass'),
  boneMass: integer('bone_mass'),
  waist: integer('waist'),
  hip: integer('hip'),
  chest: integer('chest'),
  arm: integer('arm'),
  thigh: integer('thigh'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const dietPlans = pgTable('diet_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  content: text('content'),
  calorieGoal: integer('calorie_goal'),
  proteinPercentage: integer('protein_percentage'),
  carbsPercentage: integer('carbs_percentage'),
  fatPercentage: integer('fat_percentage'),
  meals: jsonb('meals'),
  includeDessert: boolean('include_dessert').default(false),
  includeSnacks: boolean('include_snacks').default(false),
  status: varchar('status', { length: 50 }).default('active'),
  durationDays: integer('duration_days'),
  tags: text('tags'),
  dietType: varchar('diet_type', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const foods = pgTable('foods', {
  id: uuid('id').primaryKey().defaultRandom(),
  fdcId: varchar('fdc_id', { length: 255 }).notNull().unique(),
  description: text('description').notNull(),
  dataType: varchar('data_type', { length: 50 }),
  brandName: varchar('brand_name', { length: 255 }),
  ingredients: text('ingredients'),
  servingSize: integer('serving_size'),
  servingSizeUnit: varchar('serving_size_unit', { length: 50 }),
  foodCategory: varchar('food_category', { length: 255 }),
  publishedDate: timestamp('published_date'),
  foodAttributes: jsonb('food_attributes'),
  foodNutrients: jsonb('food_nutrients'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const savedFoods = pgTable('saved_foods', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  fdcId: varchar('fdc_id', { length: 255 }).notNull().references(() => foods.fdcId, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  read: boolean('read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  senderId: uuid('sender_id').notNull().references(() => users.id),
  receiverId: uuid('receiver_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  read: boolean('read').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}); 