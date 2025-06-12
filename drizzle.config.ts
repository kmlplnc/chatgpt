import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";
dotenv.config();

// URL encode the password to handle special characters
const encodePassword = (password: string) => encodeURIComponent(password);

const connectionString = process.env.DATABASE_URL || 
  `postgresql://${process.env.DB_USER || 'postgres'}:${encodePassword(process.env.DB_PASSWORD || 'postgres')}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'dietkem'}`;

console.log('Drizzle connecting to database with connection string:', connectionString.replace(/:[^:@]+@/, ':****@')); // Log connection string without password

export default {
  schema: "./server/schema.ts",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_NAME || "dietkem"
  }
} satisfies Config;
