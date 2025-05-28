import { 
  users, 
  type User, 
  type InsertUser,
  clients,
  type Client,
  type InsertClient,
  measurements,
  type Measurement,
  type InsertMeasurement,
  dietPlans,
  type DietPlan,
  type InsertDietPlan,
  foods,
  type Food,
  type InsertFood,
  savedFoods,
  type SavedFood,
  type InsertSavedFood,
  foodNutrients,
  type FoodNutrient,
  type InsertFoodNutrient,
  clientSessions,
  type ClientSession,
  type InsertClientSession,
  appointments,
  type Appointment,
  type InsertAppointment,
  messages,
  type Message,
  type InsertMessage,
  notifications,
  type Notification,
  type InsertNotification,
  clientNotes
} from "@shared/schema";
import db from "./db";
import { and, desc, eq, sql, count, inArray, like } from "drizzle-orm";
import { json } from "drizzle-orm/pg-core";

// Helper function for pagination
function paginate<T>(query: any, limit?: number, offset?: number): any {
  if (limit !== undefined) {
    query = query.limit(limit);
  }
  if (offset !== undefined) {
    query = query.offset(offset);
  }
  return query;
}

// Helper function for safe number conversion
function safeNumberConversion(value: string | number): number {
  if (typeof value === 'number') return value;
  const num = Number(value);
  if (isNaN(num)) throw new Error('Invalid number conversion');
  return num;
}

// Helper function for safe string conversion
function safeStringConversion(value: string | number): string {
  if (typeof value === 'string') return value;
  return String(value);
}

// Helper function for safe comparison
function safeCompare(a: string | number, b: string | number): boolean {
  const numA = safeNumberConversion(a);
  const numB = safeNumberConversion(b);
  return numA === numB;
}

// Helper function for safe UUID validation
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Helper function for safe UUID conversion
function safeUUIDConversion(value: string): string {
  if (!isValidUUID(value)) {
    throw new Error('Invalid UUID format');
  }
  return value;
}

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | null>;
  getUserByUsername(username: string): Promise<User | null>;
  createUser(data: CreateUserInput): Promise<User>;
  updateUser(id: string, data: UpdateUserInput): Promise<User | null>;
  deleteUser(id: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  updateUserSubscription(id: string, data: UpdateSubscriptionInput): Promise<User | null>;

  // Client operations
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: Partial<InsertClient>): Promise<Client>;
  updateClient(id: number, client: Partial<Client>): Promise<Client>;
  deleteClient(id: number): Promise<boolean>;
  getAllClients(userId: string, limit?: number, offset?: number): Promise<Client[]>;
  getClients(userId?: string, limit?: number, offset?: number): Promise<Client[]>;

  // Measurement operations
  getMeasurement(id: number): Promise<Measurement | undefined>;
  createMeasurement(measurement: InsertMeasurement): Promise<Measurement>;
  updateMeasurement(id: number, measurement: Partial<Measurement>): Promise<Measurement>;
  deleteMeasurement(id: number): Promise<void>;
  getClientMeasurements(clientId: number, limit?: number, offset?: number): Promise<Measurement[]>;

  // Diet plan operations
  getDietPlan(id: number): Promise<DietPlan | undefined>;
  createDietPlan(dietPlan: InsertDietPlan): Promise<DietPlan>;
  updateDietPlan(id: number, dietPlan: Partial<DietPlan>): Promise<DietPlan>;
  deleteDietPlan(id: number): Promise<void>;
  getUserDietPlans(userId: string, limit?: number, offset?: number): Promise<DietPlan[]>;

  // Food operations
  getFood(fdcId: string): Promise<Food | undefined>;
  createFood(food: InsertFood): Promise<Food>;
  updateFood(fdcId: string, food: Partial<Food>): Promise<Food>;
  deleteFood(fdcId: string): Promise<void>;
  searchFoods(query: string, limit?: number, offset?: number): Promise<Food[]>;

  // Saved food operations
  getSavedFood(userId: string): Promise<SavedFood[]>;
  createSavedFood(savedFood: InsertSavedFood): Promise<SavedFood>;
  deleteSavedFood(userId: string, fdcId: string): Promise<boolean>;
  isFoodSaved(userId: string, fdcId: string): Promise<boolean>;
  getUserSavedFoods(userId: string, limit?: number, offset?: number): Promise<SavedFood[]>;

  // Client session operations
  getClientSession(sessionToken: string): Promise<ClientSession | undefined>;
  createClientSession(session: InsertClientSession): Promise<ClientSession>;
  deleteClientSession(sessionToken: string): Promise<boolean>;
  deleteExpiredSessions(): Promise<void>;

  // Appointment operations
  getAppointment(id: number): Promise<Appointment | undefined>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, appointment: Partial<Appointment>): Promise<Appointment>;
  deleteAppointment(id: number): Promise<void>;
  getClientAppointments(clientId: number, limit?: number, offset?: number): Promise<Appointment[]>;
  getUserAppointments(userId: string, limit?: number, offset?: number): Promise<Appointment[]>;

  // Message operations
  getMessage(id: number): Promise<Message | undefined>;
  getMessageById(id: number): Promise<Message | undefined>;
  getMessages(clientId: number, userId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessage(id: number, message: Partial<Message>): Promise<Message>;
  deleteMessage(id: number): Promise<void>;
  getClientMessages(clientId: number, limit?: number, offset?: number): Promise<Message[]>;
  getUserMessages(userId: string, limit?: number, offset?: number): Promise<Message[]>;
  markMessageAsRead(messageId: number): Promise<boolean>;
  markAllClientMessagesAsRead(clientId: number, userId: string): Promise<boolean>;
  getUnreadMessages(clientId?: number, userId?: string, forClient?: boolean): Promise<number>;
  getUnreadMessagesByClient(userId: string): Promise<{ clientId: number; count: number }[]>;
  getLastMessageByClient(clientId: number, userId: string): Promise<Message | undefined>;
  getLastMessagesForAllClients(userId: string): Promise<any[]>;
  markMultipleMessagesAsRead(messageIds: number[]): Promise<boolean>;
  deleteAllMessages(clientId: number, userId: string): Promise<boolean>;

  // Notification operations
  getNotification(id: number): Promise<Notification | undefined>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  updateNotification(id: number, notification: Partial<Notification>): Promise<Notification>;
  deleteNotification(id: number): Promise<void>;
  getUserNotifications(userId: string, limit?: number, offset?: number): Promise<Notification[]>;
  getNotificationById(id: number): Promise<Notification | undefined>;
  getNotificationsByUserId(userId: string, options?: NotificationOptions): Promise<Notification[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  markNotificationAsRead(id: number): Promise<Notification>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  deleteAllNotifications(userId: string): Promise<void>;
  
  // Reminder creation
  createAppointmentReminder(appointmentId: number, scheduledFor: Date): Promise<Notification>;

  // Bir danışanın son ölçümünü getir
  getLastMeasurement(clientId: number): Promise<Measurement | undefined>;

  // Bir danışanın tüm ölçümlerini getir
  getMeasurements(clientId: number): Promise<Measurement[]>;

  // Randevuları getir
  getAppointments(clientId?: number): Promise<Appointment[]>;

  // Client Portal operations
  getClientByAccessCode(accessCode: string): Promise<Client | undefined>;
  generateClientAccessCode(clientId: number): Promise<string>;
  updateClientAccessCode(clientId: number, accessCode: string): Promise<boolean>;
  updateClientSessionActivity(sessionToken: string): Promise<boolean>;

  // Çoklu notlar: bir danışanın tüm notlarını getir
  getClientNotes(clientId: number): Promise<any[]>;

  // Çoklu notlar: yeni not ekle
  addClientNote(clientId: number, userId: string, content: string): Promise<any>;

  // Çoklu notlar: not sil
  deleteClientNote(noteId: number): Promise<void>;
}

// Helper type for pagination
type PaginatedQuery<T> = {
  limit: number;
  offset: number;
};

// User input types
interface CreateUserInput {
  username: string;
  email: string;
  password: string;
  name?: string;
  role?: string;
  subscriptionStatus?: string;
  subscriptionPlan?: string | null;
  subscriptionStartDate?: Date | null;
  subscriptionEndDate?: Date | null;
}

interface UpdateUserInput {
  username?: string;
  email?: string;
  password?: string;
  name?: string;
  role?: string;
  subscriptionStatus?: string;
  subscriptionPlan?: string | null;
  subscriptionStartDate?: Date | null;
  subscriptionEndDate?: Date | null;
}

interface UpdateSubscriptionInput {
  subscriptionStatus: string;
  subscriptionPlan?: string | null;
  subscriptionStartDate?: Date | null;
  subscriptionEndDate?: Date | null;
}

interface NotificationOptions {
  type?: string;
  isRead?: boolean;
  limit?: number;
  offset?: number;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | null> {
    try {
      const result = await db.select().from(users).where(eq(users.id, id));
      return result[0] || null;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | null> {
    try {
      console.log('Getting user by username:', username);
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, username));
      
      console.log('User found:', user ? { ...user, password: '[REDACTED]' } : null);
      return user || null;
    } catch (error) {
      console.error('Error getting user by username:', error);
      throw error;
    }
  }

  async createUser(data: CreateUserInput): Promise<User> {
    try {
      console.log('Creating user with data:', { ...data, password: '[REDACTED]' });
      
      // Validate required fields
      if (!data.username || !data.email || !data.password) {
        console.error('Missing required fields:', {
          hasUsername: !!data.username,
          hasEmail: !!data.email,
          hasPassword: !!data.password
        });
        throw new Error('Missing required fields');
      }
      
      // Prepare user data
      const userData = {
        username: data.username,
        email: data.email,
        password: data.password,
        name: data.name || data.username,
        role: data.role || 'user',
        subscriptionStatus: data.subscriptionStatus || 'free',
        subscriptionPlan: data.subscriptionPlan || null,
        subscriptionStartDate: data.subscriptionStartDate || null,
        subscriptionEndDate: data.subscriptionEndDate || null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      console.log('Prepared user data:', { ...userData, password: '[REDACTED]' });
      
      const result = await db.insert(users).values(userData).returning();

      console.log('User created successfully:', { ...result[0], password: '[REDACTED]' });

      if (!result || result.length === 0) {
        throw new Error('Failed to create user');
      }

      return result[0];
    } catch (error) {
      console.error('Error creating user:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack
        });
        if (error.message.includes('duplicate key')) {
          throw new Error('Username or email already exists');
        }
      }
      throw error;
    }
  }

  async updateUser(id: string, data: UpdateUserInput): Promise<User | null> {
    try {
      const result = await db.update(users)
        .set({
          ...data
        })
        .where(eq(users.id, id))
        .returning();
      return result[0] || null;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      const result = await db.delete(users)
        .where(eq(users.id, id))
        .returning();
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      return await db.select().from(users).orderBy(users.createdAt);
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  async updateUserSubscription(id: string, data: UpdateSubscriptionInput): Promise<User | null> {
    try {
      const result = await db.update(users)
        .set({
          ...data
        })
        .where(eq(users.id, id))
        .returning();
      return result[0] || null;
    } catch (error) {
      console.error('Error updating user subscription:', error);
      throw error;
    }
  }

  // Client operations
  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async createClient(client: Partial<InsertClient>): Promise<Client> {
    console.log("[STORAGE] createClient parametresi:", client);
    const firstName = (client as any).firstName ?? "";
    const lastName = (client as any).lastName ?? "";

    const safeFirstName = firstName.trim() !== "" ? firstName : "İsimsiz";
    const safeLastName = lastName.trim() !== "" ? lastName : "Soyadı";

    const dbClient = {
      first_name: safeFirstName,
      last_name: safeLastName,
      email: (client as any).email,
      phone: (client as any).phone,
      birth_date: (client as any).birthDate,
      gender: (client as any).gender,
      height: client.height !== undefined ? sql`${client.height}::numeric(5,2)` : null,
      occupation: (client as any).occupation,
      medical_conditions: (client as any).medicalConditions,
      allergies: (client as any).allergies,
      medications: (client as any).medications,
      notes: (client as any).notes,
      client_visible_notes: (client as any).clientVisibleNotes,
      status: (client as any).status,
      start_date: (client as any).startDate,
      end_date: (client as any).endDate,
      access_code: (client as any).accessCode,
      user_id: (client as any).userId,
      created_at: new Date(),
      updated_at: new Date()
    };
    const [inserted] = await db.insert(clients).values(dbClient).returning({ id: clients.id });
    // Fetch full client row after insert
    const [newClient] = await db.select().from(clients).where(eq(clients.id, inserted.id));
    return newClient;
  }

  async updateClient(id: number, client: Partial<Client>): Promise<Client> {
    // Create a copy of the client object to avoid modifying the original
    let updatedData = { ...client };

    // Handle height separately if it exists
    if (updatedData.height !== undefined && updatedData.height !== null) {
      // Use raw SQL to ensure proper numeric type handling
      await db.execute(sql`
        UPDATE clients 
        SET height = ${updatedData.height}::numeric(5,2)
        WHERE id = ${id}
      `);
      // Remove height from the update object since we handled it separately
      const { height, ...restData } = updatedData;
      updatedData = restData;
    }

    // Handle client_visible_notes separately if it exists
    if (updatedData.client_visible_notes !== undefined) {
      // Ensure client_visible_notes is stored as a JSON array
      await db.execute(sql`
        UPDATE clients 
        SET client_visible_notes = ${JSON.stringify(updatedData.client_visible_notes)}::jsonb
        WHERE id = ${id}
      `);
      // Remove client_visible_notes from the update object since we handled it separately
      const { client_visible_notes, ...restData } = updatedData;
      updatedData = restData;
    }

    // Handle diet_preferences separately if it exists
    if (updatedData.diet_preferences !== undefined) {
      await db.execute(sql`
        UPDATE clients
        SET diet_preferences = ${updatedData.diet_preferences}
        WHERE id = ${id}
      `);
      const { diet_preferences, ...restData } = updatedData;
      updatedData = restData;
    }

    // Update remaining fields and get the updated client
    const [updatedClient] = await db.update(clients)
      .set({
        ...updatedData,
        updated_at: new Date()
      })
      .where(eq(clients.id, id))
      .returning();

    // Get the updated client with all fields to ensure we have the correct height
    const [finalClient] = await db.select()
      .from(clients)
      .where(eq(clients.id, id));

    return finalClient;
  }

  async deleteClient(id: number): Promise<boolean> {
    try {
      const client = await db.select().from(clients).where(eq(clients.id, id));
      if (!client || client.length === 0) {
        return false;
      }
      await db.transaction(async (tx) => {
        await tx.delete(measurements).where(eq(measurements.clientId, id));
        await tx.delete(appointments).where(eq(appointments.clientId, id));
        await tx.delete(messages).where(eq(messages.clientId, id));
        await tx.delete(notifications).where(eq(notifications.clientId, id));
        await tx.delete(clientSessions).where(eq(clientSessions.clientId, id));
        await tx.delete(clients).where(eq(clients.id, id));
      });
      return true;
    } catch (error) {
      console.error("Error deleting client:", error);
      throw new Error("Danışan silinirken bir hata oluştu. Lütfen tekrar deneyin.");
    }
  }

  async getAllClients(userId: string, limit?: number, offset?: number): Promise<Client[]> {
    if (!userId) {
      throw new Error('Invalid userId');
    }
    let query = db.select()
      .from(clients)
      .where(eq(clients.user_id, userId))
      .orderBy(desc(clients.created_at));
    query = paginate(query, limit, offset);
    return query;
  }

  async getClients(userId?: string, limit?: number, offset?: number): Promise<Client[]> {
    try {
      if (userId) {
        return this.getAllClients(userId, limit, offset);
      } else {
        let query = db.select()
          .from(clients)
          .orderBy(desc(clients.created_at));
        query = paginate(query, limit, offset);
        return query;
      }
    } catch (error) {
      console.error("Error getting clients:", error);
      throw error;
    }
  }

  // Measurement operations
  async getMeasurement(id: number): Promise<Measurement | undefined> {
    const [measurement] = await db.select().from(measurements).where(eq(measurements.id, id));
    return measurement;
  }

  async createMeasurement(measurement: InsertMeasurement): Promise<Measurement> {
    console.log("createMeasurement called");
    console.log("createMeasurement param:", measurement);
    // Ensure clientId is set and is a number
    if (!measurement.clientId) {
      throw new Error('Client ID is required for measurement');
    }

    const clientId = Number(measurement.clientId);
    if (isNaN(clientId)) {
      throw new Error('Invalid client ID');
    }

    // Remove any client_id property if present
    const { client_id, basalMetabolicRate, totalDailyEnergyExpenditure, ...rest } = measurement as any;

    const insertObj = {
      ...rest,
      basalMetabolicRate: measurement.basalMetabolicRate != null ? Number(measurement.basalMetabolicRate) : null,
      totalDailyEnergyExpenditure: measurement.totalDailyEnergyExpenditure != null ? Number(measurement.totalDailyEnergyExpenditure) : null,
      clientId: clientId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    console.log("Drizzle insert obj:", insertObj);

    const [newMeasurement] = await db.insert(measurements).values(insertObj).returning();
    return newMeasurement;
  }

  async updateMeasurement(id: number, measurement: Partial<Measurement>): Promise<Measurement> {
    const [updatedMeasurement] = await db.update(measurements)
      .set({
        ...measurement,
        updatedAt: new Date()
      })
      .where(eq(measurements.id, id))
      .returning();
    return updatedMeasurement;
  }

  async deleteMeasurement(id: number): Promise<void> {
    await db.delete(measurements).where(eq(measurements.id, id));
  }

  async getClientMeasurements(clientId: number, limit?: number, offset?: number): Promise<Measurement[]> {
    let query = db.select()
      .from(measurements)
      .where(eq(measurements.clientId, clientId))
      .orderBy(desc(measurements.date));
    query = paginate(query, limit, offset);
    const rows = await query;
    // Ölçümleri döndürürken hem camelCase hem snake_case alanları ekle
    return rows.map(row => ({
      ...row,
      basalMetabolicRate: row.basalMetabolicRate ?? null,
      totalDailyEnergyExpenditure: row.totalDailyEnergyExpenditure ?? null,
    }));
  }

  // Diet plan operations
  async getDietPlan(id: number): Promise<DietPlan | undefined> {
    const [dietPlan] = await db.select().from(dietPlans).where(eq(dietPlans.id, id));
    return dietPlan;
  }

  async createDietPlan(dietPlan: InsertDietPlan): Promise<DietPlan> {
    const [newDietPlan] = await db.insert(dietPlans).values({
      ...dietPlan,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return newDietPlan;
  }

  async updateDietPlan(id: number, dietPlan: Partial<DietPlan>): Promise<DietPlan> {
    const [updatedDietPlan] = await db.update(dietPlans)
      .set({
        ...dietPlan,
        updatedAt: new Date()
      })
      .where(eq(dietPlans.id, id))
      .returning();
    return updatedDietPlan;
  }

  async deleteDietPlan(id: number): Promise<void> {
    await db.delete(dietPlans).where(eq(dietPlans.id, id));
  }

  async getUserDietPlans(userId: string, limit?: number, offset?: number): Promise<DietPlan[]> {
    console.log("userId param:", userId, typeof userId);
    let query = db.select().from(dietPlans);
    const result = await query;
    console.log("TÜM PLANLAR:", result);
    return result;
  }

  // Food operations
  async getFood(fdcId: string): Promise<Food | undefined> {
    const [food] = await db.select().from(foods).where(eq(foods.fdcId, fdcId));
    return food;
  }

  async createFood(food: InsertFood): Promise<Food> {
    const [newFood] = await db.insert(foods).values({
      ...food,
      createdAt: new Date()
    }).returning();
    return newFood;
  }

  async updateFood(fdcId: string, food: Partial<Food>): Promise<Food> {
    const [updatedFood] = await db.update(foods)
      .set(food)
      .where(eq(foods.fdcId, fdcId))
      .returning();
    return updatedFood;
  }

  async deleteFood(fdcId: string): Promise<void> {
    await db.delete(foods).where(eq(foods.fdcId, fdcId));
  }

  async searchFoods(query: string, limit?: number, offset?: number): Promise<Food[]> {
    let sqlQuery = db.select()
      .from(foods)
      .where(like(foods.description, `%${query}%`))
      .orderBy(foods.description);
    sqlQuery = paginate(sqlQuery, limit, offset);
    return sqlQuery;
  }

  // Saved food operations
  async getSavedFood(userId: string): Promise<SavedFood[]> {
    let query = db.select()
      .from(savedFoods)
      .where(eq(savedFoods.userId, userId))
      .orderBy(desc(savedFoods.createdAt));
    return query;
  }

  async createSavedFood(savedFood: InsertSavedFood): Promise<SavedFood> {
    const [newSavedFood] = await db.insert(savedFoods).values({
      ...savedFood,
      createdAt: new Date()
    }).returning();
    return newSavedFood;
  }

  async deleteSavedFood(userId: string, fdcId: string): Promise<boolean> {
    try {
      await db.delete(savedFoods)
        .where(
          and(
            eq(savedFoods.userId, userId),
            eq(savedFoods.fdcId, fdcId)
          )
        );
      return true;
    } catch (error) {
      console.error("Delete saved food error:", error);
      return false;
    }
  }

  async isFoodSaved(userId: string, fdcId: string): Promise<boolean> {
    const [savedFood] = await db.select()
      .from(savedFoods)
      .where(
        and(
          eq(savedFoods.userId, userId),
          eq(savedFoods.fdcId, fdcId)
        )
      );
    return !!savedFood;
  }

  async getUserSavedFoods(userId: string, limit?: number, offset?: number): Promise<SavedFood[]> {
    let query = db.select()
      .from(savedFoods)
      .where(eq(savedFoods.userId, userId))
      .orderBy(desc(savedFoods.createdAt));
    query = paginate(query, limit, offset);
    return query;
  }

  // Client session operations
  async getClientSession(sessionToken: string): Promise<ClientSession | undefined> {
    const [session] = await db.select()
      .from(clientSessions)
      .where(eq(clientSessions.sessionToken, sessionToken));
    return session;
  }

  async createClientSession(session: InsertClientSession): Promise<ClientSession> {
    const [newSession] = await db.insert(clientSessions).values({
      ...session,
      createdAt: new Date(),
      lastActivity: new Date()
    }).returning();
    return newSession;
  }

  // Client Portal operations
  async getClientByAccessCode(accessCode: string): Promise<Client | undefined> {
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.access_code, accessCode));
    
    return client;
  }

  // Generate a unique access code for client portal
  async generateClientAccessCode(clientId: number): Promise<string> {
    // Generate a 6-character alphanumeric code
    const generateCode = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoiding confusable characters (0, O, 1, I)
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };
    
    // Try until we get a unique code
    let code: string;
    let isUnique = false;
    
    do {
      code = generateCode();
      const existingClient = await this.getClientByAccessCode(code);
      isUnique = !existingClient;
    } while (!isUnique);
    
    // Add the code to the client record
    await db
      .update(clients)
      .set({ access_code: code })
      .where(eq(clients.id, clientId));
    
    return code;
  }
  
  // Update client access code
  async updateClientAccessCode(clientId: number, accessCode: string): Promise<boolean> {
    try {
      await db
        .update(clients)
        .set({ access_code: accessCode })
        .where(eq(clients.id, clientId));
      
      return true;
    } catch (error) {
      console.error('Update client access code error:', error);
      return false;
    }
  }

  async updateClientSessionActivity(sessionToken: string): Promise<boolean> {
    try {
      await db
        .update(clientSessions)
        .set({ lastActivity: new Date() })
        .where(eq(clientSessions.sessionToken, sessionToken));
      
      return true;
    } catch (error) {
      console.error('Update session activity error:', error);
      return false;
    }
  }

  async deleteClientSession(sessionToken: string): Promise<boolean> {
    try {
      await db
        .delete(clientSessions)
        .where(eq(clientSessions.sessionToken, sessionToken));
      
      return true;
    } catch (error) {
      console.error('Delete client session error:', error);
      return false;
    }
  }

  async deleteExpiredSessions(): Promise<void> {
    await db.delete(clientSessions)
      .where(sql`${clientSessions.expiresAt} < NOW()`);
  }

  // Appointment operations
  async getAppointment(id: number): Promise<Appointment | undefined> {
    try {
      const [appointment] = await db
        .select()
        .from(appointments)
        .where(eq(appointments.id, id));
      return appointment;
    } catch (error) {
      console.error('Error getting appointment:', error);
      throw error;
    }
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    try {
      const validUserId = safeUUIDConversion(appointment.userId);
      const [newAppointment] = await db.insert(appointments).values({
        ...appointment,
        userId: validUserId,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      return newAppointment;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  }

  async updateAppointment(id: number, appointment: Partial<Appointment>): Promise<Appointment> {
    try {
      const validUserId = appointment.userId ? safeUUIDConversion(appointment.userId) : undefined;
      const [updatedAppointment] = await db.update(appointments)
        .set({
          ...appointment,
          userId: validUserId,
          updatedAt: new Date()
        })
        .where(eq(appointments.id, id))
        .returning();
      return updatedAppointment;
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  }

  async deleteAppointment(id: number): Promise<void> {
    await db.delete(appointments).where(eq(appointments.id, id));
  }

  async getClientAppointments(clientId: number, limit?: number, offset?: number): Promise<Appointment[]> {
    let query = db.select()
      .from(appointments)
      .where(eq(appointments.clientId, clientId))
      .orderBy(desc(appointments.date));
    query = paginate(query, limit, offset);
    return query;
  }

  async getUserAppointments(userId: string, limit?: number, offset?: number): Promise<Appointment[]> {
    try {
      const validUserId = safeUUIDConversion(userId);
      const query = db
        .select()
        .from(appointments)
        .where(eq(appointments.userId, validUserId))
        .orderBy(desc(appointments.date));
      return await paginate(query, limit, offset);
    } catch (error) {
      console.error('Error getting user appointments:', error);
      throw error;
    }
  }

  // Message operations
  async getMessage(id: number): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message;
  }

  async getMessageById(id: number): Promise<Message | undefined> {
    return this.getMessage(id);
  }

  async getMessages(clientId: number, userId: string): Promise<Message[]> {
    try {
      const validUserId = safeUUIDConversion(userId);
      const query = db
        .select()
        .from(messages)
        .where(
          and(
            eq(messages.clientId, clientId),
            eq(messages.userId, validUserId)
          )
        )
        .orderBy(desc(messages.createdAt));
      return query;
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values({
      ...message,
      createdAt: new Date()
    }).returning();
    return newMessage;
  }

  async updateMessage(id: number, message: Partial<Message>): Promise<Message> {
    const [updatedMessage] = await db.update(messages)
      .set(message)
      .where(eq(messages.id, id))
      .returning();
    return updatedMessage;
  }

  async deleteMessage(id: number): Promise<void> {
    await db.delete(messages).where(eq(messages.id, id));
  }

  async getClientMessages(clientId: number, limit?: number, offset?: number): Promise<Message[]> {
    let query = db.select()
      .from(messages)
      .where(eq(messages.clientId, clientId))
      .orderBy(desc(messages.createdAt));
    query = paginate(query, limit, offset);
    return query;
  }

  async getUserMessages(userId: string, limit?: number, offset?: number): Promise<Message[]> {
    try {
      const validUserId = safeUUIDConversion(userId);
      const query = db
        .select()
        .from(messages)
        .where(eq(messages.userId, validUserId))
        .orderBy(desc(messages.createdAt));
      return await paginate(query, limit, offset);
    } catch (error) {
      console.error('Error getting user messages:', error);
      throw error;
    }
  }

  // Mesajı okundu olarak işaretle
  async markMessageAsRead(messageId: number): Promise<boolean> {
    try {
      await db.update(messages)
        .set({ isRead: true })
        .where(eq(messages.id, messageId));
      return true;
    } catch (error) {
      console.error("Message marking error:", error);
      return false;
    }
  }

  // Tüm danışan mesajlarını okundu olarak işaretle
  async markAllClientMessagesAsRead(clientId: number, userId: string): Promise<boolean> {
    try {
      const validUserId = safeUUIDConversion(userId);
      await db
        .update(messages)
        .set({ isRead: true })
        .where(
          and(
            eq(messages.clientId, clientId),
            eq(messages.userId, validUserId)
          )
        );
      return true;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return false;
    }
  }

  // Okunmamış mesaj sayısını getir
  async getUnreadMessages(clientId?: number, userId?: string, forClient?: boolean): Promise<number> {
    try {
      let conditions = [];
      if (clientId) conditions.push(eq(messages.clientId, clientId));
      if (userId) conditions.push(eq(messages.userId, safeUUIDConversion(userId)));
      if (forClient !== undefined) conditions.push(eq(messages.fromClient, !forClient));
      conditions.push(eq(messages.isRead, false));
      const [result] = await db
        .select({ count: sql<number>`count(*)` })
        .from(messages)
        .where(and(...conditions));
      return Number(result.count);
    } catch (error) {
      console.error("Error getting unread messages:", error);
      return 0;
    }
  }

  // Diyetisyenin her danışanı için okunmamış mesaj sayısını getir
  async getUnreadMessagesByClient(userId: string): Promise<{ clientId: number; count: number }[]> {
    const clients = await this.getClients(userId);
    
    const results = await Promise.all(
      clients.map(async (client) => {
        const count = await this.getUnreadMessages(client.id, userId);
        return { clientId: client.id, count };
      })
    );
    
    return results;
  }

  // Bir danışan için son mesajı getir
  async getLastMessageByClient(clientId: number, userId: string): Promise<Message | undefined> {
    const [lastMessage] = await db.select()
      .from(messages)
      .where(eq(messages.clientId, clientId))
      .orderBy(desc(messages.createdAt))
      .limit(1);
    
    return lastMessage;
  }

  // Tüm danışanlar için son mesajları getir
  async getLastMessagesForAllClients(userId: string): Promise<any[]> {
    try {
      const validUserId = safeUUIDConversion(userId);
      return await db
        .select({
          clientId: messages.clientId,
          lastMessage: messages.content,
          lastMessageDate: messages.createdAt,
          isRead: messages.isRead
        })
        .from(messages)
        .where(eq(messages.userId, validUserId))
        .orderBy(desc(messages.createdAt))
        .groupBy(messages.clientId, messages.content, messages.createdAt, messages.isRead);
    } catch (error) {
      console.error('Error getting last messages for all clients:', error);
      throw error;
    }
  }

  // Birden fazla mesajı okundu olarak işaretle
  async markMultipleMessagesAsRead(messageIds: number[]): Promise<boolean> {
    try {
      await db.update(messages)
        .set({ isRead: true })
        .where(inArray(messages.id, messageIds));
      return true;
    } catch (error) {
      console.error("Multiple messages marking error:", error);
      return false;
    }
  }

  // Bir danışanın tüm mesajlarını sil
  async deleteAllMessages(clientId: number, userId: string): Promise<boolean> {
    try {
      const validUserId = safeUUIDConversion(userId);
      await db
        .delete(messages)
        .where(
          and(
            eq(messages.clientId, clientId),
            eq(messages.userId, validUserId)
          )
        );
      return true;
    } catch (error) {
      console.error('Error deleting messages:', error);
      return false;
    }
  }

  // Notification operations
  async getNotification(id: number): Promise<Notification | undefined> {
    const [notification] = await db.select().from(notifications).where(eq(notifications.id, id));
    return notification;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values({
      ...notification,
      createdAt: new Date()
    }).returning();
    return newNotification;
  }

  async updateNotification(id: number, notification: Partial<Notification>): Promise<Notification> {
    const [updatedNotification] = await db.update(notifications)
      .set(notification)
      .where(eq(notifications.id, id))
      .returning();
    return updatedNotification;
  }

  async deleteNotification(id: number): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }

  async getUserNotifications(userId: string, limit?: number, offset?: number): Promise<Notification[]> {
    try {
      const validUserId = safeUUIDConversion(userId);
      const query = db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, validUserId))
        .orderBy(desc(notifications.createdAt));
      return await paginate(query, limit, offset);
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  async getNotificationById(id: number): Promise<Notification | undefined> {
    const [notification] = await db.select().from(notifications).where(eq(notifications.id, id));
    return notification;
  }

  async getNotificationsByUserId(userId: string, options?: NotificationOptions): Promise<Notification[]> {
    try {
      const validUserId = safeUUIDConversion(userId);
      const conditions = [eq(notifications.userId, validUserId)];

      if (options?.type) {
        conditions.push(eq(notifications.type, options.type));
      }

      if (options?.isRead !== undefined) {
        conditions.push(eq(notifications.isRead, options.isRead));
      }

      const query = db.select()
        .from(notifications)
        .where(and(...conditions))
        .orderBy(desc(notifications.createdAt));

      if (options?.limit) {
        query.limit(options.limit);
      }

      if (options?.offset) {
        query.offset(options.offset);
      }

      return query;
    } catch (error) {
      console.error('Error getting notifications by user ID:', error);
      throw error;
    }
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    try {
      const validUserId = safeUUIDConversion(userId);
      const result = await db.select({ count: count() })
        .from(notifications)
        .where(and(
          eq(notifications.userId, validUserId),
          eq(notifications.isRead, false)
        ));
      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      throw error;
    }
  }

  async markNotificationAsRead(id: number): Promise<Notification> {
    const [updatedNotification] = await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return updatedNotification;
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    try {
      const validUserId = safeUUIDConversion(userId);
      await db.update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.userId, validUserId));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async deleteAllNotifications(userId: string): Promise<void> {
    try {
      const validUserId = safeUUIDConversion(userId);
      await db.delete(notifications)
        .where(eq(notifications.userId, validUserId));
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      throw error;
    }
  }

  // Bir danışanın son ölçümünü getir
  async getLastMeasurement(clientId: number): Promise<Measurement | undefined> {
    try {
    const [measurement] = await db.select()
      .from(measurements)
      .where(eq(measurements.clientId, clientId))
      .orderBy(desc(measurements.date))
      .limit(1);
    return measurement;
    } catch (error) {
      console.error("Error fetching last measurement:", error);
      return undefined;
    }
  }

  // Bir danışanın tüm ölçümlerini getir
  async getMeasurements(clientId: number): Promise<Measurement[]> {
    try {
      return await db.select()
        .from(measurements)
        .where(eq(measurements.clientId, clientId))
        .orderBy(desc(measurements.date));
    } catch (error) {
      console.error("Error fetching measurements:", error);
      return [];
    }
  }

  // Randevuları getir
  async getAppointments(clientId?: number): Promise<Appointment[]> {
    try {
      if (clientId) {
        return await db.select()
          .from(appointments)
          .where(eq(appointments.clientId, clientId))
          .orderBy(desc(appointments.date));
      } else {
        return await db.select()
          .from(appointments)
          .orderBy(desc(appointments.date));
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      return [];
    }
  }

  async createAppointmentReminder(appointmentId: number, scheduledFor: Date): Promise<Notification> {
    // Get appointment details first
    const appointment = await this.getAppointment(appointmentId);
    if (!appointment) {
      throw new Error("Appointment not found");
    }
    // Get client details for better notification content
    const client = await this.getClient(appointment.clientId);
    if (!client) {
      throw new Error("Client not found");
    }
    // Create a reminder notification
    const notification: InsertNotification = {
      userId: appointment.userId,
      clientId: appointment.clientId,
      title: "Randevu Hatırlatması",
      content: `${client.first_name} ${client.last_name} ile ${new Date(appointment.date).toLocaleDateString('tr-TR')} tarihinde ${new Date(appointment.startTime).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})} saatinde randevunuz var.`,
      type: "appointment",
      relatedId: appointmentId,
      isRead: false,
      scheduledFor: scheduledFor
    };
    return this.createNotification(notification);
  }

  // Çoklu notlar: bir danışanın tüm notlarını getir
  async getClientNotes(clientId: number): Promise<any[]> {
    return await db.select().from(clientNotes).where(eq(clientNotes.client_id, clientId)).orderBy(desc(clientNotes.created_at));
  }

  // Çoklu notlar: yeni not ekle
  async addClientNote(clientId: number, userId: string, content: string): Promise<any> {
    const [note] = await db.insert(clientNotes).values({
      client_id: clientId,
      user_id: userId,
      content,
      created_at: new Date()
    }).returning();
    return note;
  }

  // Çoklu notlar: not sil
  async deleteClientNote(noteId: number): Promise<void> {
    await db.delete(clientNotes).where(eq(clientNotes.id, noteId));
  }
}

// Export a single instance of DatabaseStorage
export const storage = new DatabaseStorage();

export type NotificationType = "info" | "success" | "warning" | "error";

export async function createNotification(data: Omit<Notification, "id" | "createdAt">) {
  try {
    if (!data.userId) {
      throw new Error('User ID is required');
    }
    const validUserId = safeUUIDConversion(data.userId);
    const [notification] = await db
      .insert(notifications)
      .values({ ...data, userId: validUserId })
      .returning();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}
