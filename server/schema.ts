import { z } from "zod";

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