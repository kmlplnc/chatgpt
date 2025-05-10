// clients tablosuna access_code ekleme
export const clients = pgTable("clients", {
  // Mevcut sütunlar...
  access_code: text("access_code").notNull().default('').unique(),
});

// Client session tablosu ekleyelim
export const clientSessions = pgTable("client_sessions", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id, { onDelete: 'cascade' }),
  sessionToken: text("session_token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  lastActivity: timestamp("last_activity").defaultNow()
});

// Ayrıca tip tanımlarını güncelleyelim
export type ClientSession = typeof clientSessions.$inferSelect;
export type InsertClientSession = typeof clientSessions.$inferInsert;
