import { sql } from "drizzle-orm";
import { numeric } from "drizzle-orm/pg-core";
import { migrate } from "drizzle-orm/node-postgres/migrator";

export async function up(db: any) {
  await db.execute(sql`
    ALTER TABLE clients ADD COLUMN IF NOT EXISTS height NUMERIC(5,2);
    UPDATE clients SET height = 170.00 WHERE height IS NULL;
  `);
}

export async function down(db: any) {
  await db.execute(sql`
    ALTER TABLE clients DROP COLUMN IF EXISTS height;
  `);
} 