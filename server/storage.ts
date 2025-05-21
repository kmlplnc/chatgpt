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
  saved_foods,
  type SavedFood,
  type InsertSavedFood,
  food_nutrients,
  type FoodNutrient,
  type InsertFoodNutrient,
  client_sessions,
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
  type InsertNotification
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
  getAllClients(userId: number, limit?: number, offset?: number): Promise<Client[]>;
  getClients(userId?: number, limit?: number, offset?: number): Promise<Client[]>;

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
  getUserDietPlans(userId: number, limit?: number, offset?: number): Promise<DietPlan[]>;

  // Food operations
  getFood(fdcId: string): Promise<Food | undefined>;
  createFood(food: InsertFood): Promise<Food>;
  updateFood(fdcId: string, food: Partial<Food>): Promise<Food>;
  deleteFood(fdcId: string): Promise<void>;
  searchFoods(query: string, limit?: number, offset?: number): Promise<Food[]>;

  // Saved food operations
  getSavedFood(id: number): Promise<SavedFood | undefined>;
  createSavedFood(savedFood: InsertSavedFood): Promise<SavedFood>;
  deleteSavedFood(id: number): Promise<void>;
  getUserSavedFoods(userId: number, limit?: number, offset?: number): Promise<SavedFood[]>;

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
  getUserAppointments(userId: number, limit?: number, offset?: number): Promise<Appointment[]>;

  // Message operations
  getMessage(id: number): Promise<Message | undefined>;
  getMessageById(id: number): Promise<Message | undefined>;
  getMessages(clientId: number, userId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessage(id: number, message: Partial<Message>): Promise<Message>;
  deleteMessage(id: number): Promise<void>;
  getClientMessages(clientId: number, limit?: number, offset?: number): Promise<Message[]>;
  getUserMessages(userId: number, limit?: number, offset?: number): Promise<Message[]>;
  markMessageAsRead(messageId: number): Promise<boolean>;
  markAllClientMessagesAsRead(clientId: number, userId: number): Promise<boolean>;
  getUnreadMessages(clientId?: number, userId?: number, forClient?: boolean): Promise<number>;
  getUnreadMessagesByClient(userId: number): Promise<{ clientId: number; count: number }[]>;
  getLastMessageByClient(clientId: number, userId: number): Promise<Message | undefined>;
  getLastMessagesForAllClients(userId: number): Promise<any[]>;
  markMultipleMessagesAsRead(messageIds: number[]): Promise<boolean>;
  deleteAllMessages(clientId: number, userId: number): Promise<boolean>;

  // Notification operations
  getNotification(id: number): Promise<Notification | undefined>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  updateNotification(id: number, notification: Partial<Notification>): Promise<Notification>;
  deleteNotification(id: number): Promise<void>;
  getUserNotifications(userId: number, limit?: number, offset?: number): Promise<Notification[]>;
  
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
  full_name?: string;
  role?: string;
  subscription_status?: string;
  subscription_plan?: string | null;
  subscription_start_date?: Date | null;
  subscription_end_date?: Date | null;
}

interface UpdateUserInput {
  username?: string;
  email?: string;
  password?: string;
  full_name?: string;
  role?: string;
  subscription_status?: string;
  subscription_plan?: string | null;
  subscription_start_date?: Date | null;
  subscription_end_date?: Date | null;
}

interface UpdateSubscriptionInput {
  subscription_status: string;
  subscription_plan?: string | null;
  subscription_start_date?: Date | null;
  subscription_end_date?: Date | null;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | null> {
    try {
      const result = await db.select().from(users).where(eq(users.id, parseInt(id)));
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
        full_name: data.full_name || data.username,
        role: data.role || 'user',
        subscription_status: data.subscription_status || 'free',
        subscription_plan: data.subscription_plan || null,
        subscription_start_date: data.subscription_start_date || null,
        subscription_end_date: data.subscription_end_date || null,
        created_at: new Date(),
        updated_at: new Date()
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
          ...data,
          updated_at: new Date()
        })
        .where(eq(users.id, parseInt(id)))
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
        .where(eq(users.id, parseInt(id)))
        .returning();
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      return await db.select().from(users).orderBy(users.created_at);
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  async updateUserSubscription(id: string, data: UpdateSubscriptionInput): Promise<User | null> {
    try {
      const result = await db.update(users)
        .set({
          ...data,
          updated_at: new Date()
        })
        .where(eq(users.id, parseInt(id)))
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
    const firstName = (client as any).first_name ?? (client as any).firstName ?? "";
    const lastName = (client as any).last_name ?? (client as any).lastName ?? "";

    const safeFirstName = firstName.trim() !== "" ? firstName : "İsimsiz";
    const safeLastName = lastName.trim() !== "" ? lastName : "Soyadı";

    const dbClient = {
      first_name: safeFirstName,
      last_name: safeLastName,
      email: (client as any).email ?? (client as any).email,
      phone: (client as any).phone ?? (client as any).phone,
      birth_date: (client as any).birth_date ?? (client as any).birthDate,
      gender: (client as any).gender ?? (client as any).gender,
      height: client.height !== undefined ? sql`${client.height}::numeric(5,2)` : null,
      occupation: (client as any).occupation ?? (client as any).occupation,
      medical_conditions: (client as any).medical_conditions ?? (client as any).medicalConditions,
      allergies: (client as any).allergies ?? (client as any).allergies,
      medications: (client as any).medications ?? (client as any).medications,
      notes: (client as any).notes ?? (client as any).notes,
      client_visible_notes: (client as any).client_visible_notes ?? (client as any).clientVisibleNotes,
      status: (client as any).status ?? (client as any).status,
      start_date: (client as any).start_date ?? (client as any).startDate,
      end_date: (client as any).end_date ?? (client as any).endDate,
      access_code: (client as any).access_code ?? (client as any).accessCode,
      user_id: (client as any).user_id ?? (client as any).userId,
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
    if (updatedData.height !== undefined) {
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
        await tx.delete(measurements).where(eq(measurements.client_id, id));
        await tx.delete(appointments).where(eq(appointments.client_id, id));
        await tx.delete(messages).where(eq(messages.client_id, id));
        await tx.delete(notifications).where(eq(notifications.client_id, id));
        await tx.delete(client_sessions).where(eq(client_sessions.client_id, id));
        await tx.delete(clients).where(eq(clients.id, id));
      });
      return true;
    } catch (error) {
      console.error("Error deleting client:", error);
      throw new Error("Danışan silinirken bir hata oluştu. Lütfen tekrar deneyin.");
    }
  }

  async getAllClients(userId: number, limit?: number, offset?: number): Promise<Client[]> {
    if (typeof userId !== 'number' || isNaN(userId)) {
      throw new Error('Invalid userId');
    }
    let query = db.select()
      .from(clients)
      .where(eq(clients.user_id, userId))
      .orderBy(desc(clients.created_at));
    query = paginate(query, limit, offset);
    return query;
  }

  async getClients(userId?: number, limit?: number, offset?: number): Promise<Client[]> {
    try {
      if (userId !== undefined && userId !== null && !isNaN(Number(userId))) {
        return this.getAllClients(Number(userId), limit, offset);
      } else {
        let query = db.select()
          .from(clients)
          .orderBy(desc(clients.created_at));
        query = paginate(query, limit, offset);
        return query;
      }
    } catch (error) {
      console.error('Error in getClients:', error);
      throw new Error('Failed to fetch clients');
    }
  }

  // Measurement operations
  async getMeasurement(id: number): Promise<Measurement | undefined> {
    const [measurement] = await db.select().from(measurements).where(eq(measurements.id, id));
    return measurement;
  }

  async createMeasurement(measurement: InsertMeasurement): Promise<Measurement> {
    const [newMeasurement] = await db.insert(measurements).values({
      ...measurement,
      created_at: new Date(),
      updated_at: new Date()
    }).returning();
    return newMeasurement;
  }

  async updateMeasurement(id: number, measurement: Partial<Measurement>): Promise<Measurement> {
    const [updatedMeasurement] = await db.update(measurements)
      .set({
        ...measurement,
        updated_at: new Date()
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
      .where(eq(measurements.client_id, clientId))
      .orderBy(desc(measurements.date));
    query = paginate(query, limit, offset);
    return query;
  }

  // Diet plan operations
  async getDietPlan(id: number): Promise<DietPlan | undefined> {
    const [dietPlan] = await db.select().from(dietPlans).where(eq(dietPlans.id, id));
    return dietPlan;
  }

  async createDietPlan(dietPlan: InsertDietPlan): Promise<DietPlan> {
    const [newDietPlan] = await db.insert(dietPlans).values({
      ...dietPlan,
      created_at: new Date(),
      updated_at: new Date()
    }).returning();
    return newDietPlan;
  }

  async updateDietPlan(id: number, dietPlan: Partial<DietPlan>): Promise<DietPlan> {
    const [updatedDietPlan] = await db.update(dietPlans)
      .set({
        ...dietPlan,
        updated_at: new Date()
      })
      .where(eq(dietPlans.id, id))
      .returning();
    return updatedDietPlan;
  }

  async deleteDietPlan(id: number): Promise<void> {
    await db.delete(dietPlans).where(eq(dietPlans.id, id));
  }

  async getUserDietPlans(userId: number, limit?: number, offset?: number): Promise<DietPlan[]> {
    let query = db.select()
      .from(dietPlans)
      .where(eq(dietPlans.user_id, userId))
      .orderBy(desc(dietPlans.created_at));
    query = paginate(query, limit, offset);
    return query;
  }

  // Food operations
  async getFood(fdcId: string): Promise<Food | undefined> {
    const [food] = await db.select().from(foods).where(eq(foods.fdc_id, fdcId));
    return food;
  }

  async createFood(food: InsertFood): Promise<Food> {
    const [newFood] = await db.insert(foods).values({
      ...food,
      created_at: new Date()
    }).returning();
    return newFood;
  }

  async updateFood(fdcId: string, food: Partial<Food>): Promise<Food> {
    const [updatedFood] = await db.update(foods)
      .set(food)
      .where(eq(foods.fdc_id, fdcId))
      .returning();
    return updatedFood;
  }

  async deleteFood(fdcId: string): Promise<void> {
    await db.delete(foods).where(eq(foods.fdc_id, fdcId));
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
  async getSavedFood(id: number): Promise<SavedFood | undefined> {
    const [savedFood] = await db.select().from(saved_foods).where(eq(saved_foods.id, id));
    return savedFood;
  }

  async createSavedFood(savedFood: InsertSavedFood): Promise<SavedFood> {
    const [newSavedFood] = await db.insert(saved_foods).values({
      ...savedFood,
      created_at: new Date()
    }).returning();
    return newSavedFood;
  }

  async deleteSavedFood(id: number): Promise<void> {
    await db.delete(saved_foods).where(eq(saved_foods.id, id));
  }

  async getUserSavedFoods(userId: number, limit?: number, offset?: number): Promise<SavedFood[]> {
    let query = db.select()
      .from(saved_foods)
      .where(eq(saved_foods.user_id, userId))
      .orderBy(desc(saved_foods.created_at));
    query = paginate(query, limit, offset);
    return query;
  }

  // Client session operations
  async getClientSession(sessionToken: string): Promise<ClientSession | undefined> {
    const [session] = await db.select()
      .from(client_sessions)
      .where(eq(client_sessions.session_token, sessionToken));
    return session;
  }

  async createClientSession(session: InsertClientSession): Promise<ClientSession> {
    const [newSession] = await db.insert(client_sessions).values({
      ...session,
      created_at: new Date(),
      last_activity: new Date()
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
        .update(client_sessions)
        .set({ last_activity: new Date() })
        .where(eq(client_sessions.session_token, sessionToken));
      
      return true;
    } catch (error) {
      console.error('Update session activity error:', error);
      return false;
    }
  }

  async deleteClientSession(sessionToken: string): Promise<boolean> {
    try {
      await db
        .delete(client_sessions)
        .where(eq(client_sessions.session_token, sessionToken));
      
      return true;
    } catch (error) {
      console.error('Delete client session error:', error);
      return false;
    }
  }

  async deleteExpiredSessions(): Promise<void> {
    await db.delete(client_sessions)
      .where(sql`${client_sessions.expires_at} < NOW()`);
  }

  // Appointment operations
  async getAppointment(id: number): Promise<Appointment | undefined> {
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id));
    return appointment;
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [newAppointment] = await db.insert(appointments).values({
      ...appointment,
      created_at: new Date(),
      updated_at: new Date()
    }).returning();
    return newAppointment;
  }

  async updateAppointment(id: number, appointment: Partial<Appointment>): Promise<Appointment> {
    const [updatedAppointment] = await db.update(appointments)
      .set({
        ...appointment,
        updated_at: new Date()
      })
      .where(eq(appointments.id, id))
      .returning();
    return updatedAppointment;
  }

  async deleteAppointment(id: number): Promise<void> {
    await db.delete(appointments).where(eq(appointments.id, id));
  }

  async getClientAppointments(clientId: number, limit?: number, offset?: number): Promise<Appointment[]> {
    let query = db.select()
      .from(appointments)
      .where(eq(appointments.client_id, clientId))
      .orderBy(desc(appointments.date));
    query = paginate(query, limit, offset);
    return query;
  }

  async getUserAppointments(userId: number, limit?: number, offset?: number): Promise<Appointment[]> {
    let query = db.select()
      .from(appointments)
      .where(eq(appointments.user_id, userId))
      .orderBy(desc(appointments.date));
    query = paginate(query, limit, offset);
    return query;
  }

  // Message operations
  async getMessage(id: number): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message;
  }

  async getMessageById(id: number): Promise<Message | undefined> {
    return this.getMessage(id);
  }

  async getMessages(clientId: number, userId: number): Promise<Message[]> {
    return db.select()
      .from(messages)
      .where(eq(messages.client_id, clientId))
      .orderBy(desc(messages.created_at));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values({
      ...message,
      created_at: new Date()
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
      .where(eq(messages.client_id, clientId))
      .orderBy(desc(messages.created_at));
    query = paginate(query, limit, offset);
    return query;
  }

  async getUserMessages(userId: number, limit?: number, offset?: number): Promise<Message[]> {
    let query = db.select()
      .from(messages)
      .where(eq(messages.user_id, userId))
      .orderBy(desc(messages.created_at));
    query = paginate(query, limit, offset);
    return query;
  }

  // Mesajı okundu olarak işaretle
  async markMessageAsRead(messageId: number): Promise<boolean> {
    try {
      await db.update(messages)
        .set({ is_read: true })
        .where(eq(messages.id, messageId));
      return true;
    } catch (error) {
      console.error("Message marking error:", error);
      return false;
    }
  }

  // Tüm danışan mesajlarını okundu olarak işaretle
  async markAllClientMessagesAsRead(clientId: number, userId: number): Promise<boolean> {
    try {
      await db.update(messages)
        .set({ is_read: true })
        .where(
          and(
            eq(messages.client_id, clientId),
            eq(messages.user_id, userId),
            eq(messages.is_read, false)
          )
        );
      return true;
    } catch (error) {
      console.error("Message marking error:", error);
      return false;
    }
  }

  // Okunmamış mesaj sayısını getir
  async getUnreadMessages(clientId?: number, userId?: number, forClient?: boolean): Promise<number> {
    let conditions = [];
    if (clientId) conditions.push(eq(messages.client_id, clientId));
    if (userId) conditions.push(eq(messages.user_id, userId));
    if (forClient !== undefined) conditions.push(eq(messages.from_client, !forClient));
    conditions.push(eq(messages.is_read, false));
    const [result] = await db
      .select({ count: count() })
      .from(messages)
      .where(and(...conditions));
    return result?.count || 0;
  }

  // Diyetisyenin her danışanı için okunmamış mesaj sayısını getir
  async getUnreadMessagesByClient(userId: number): Promise<{ clientId: number; count: number }[]> {
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
  async getLastMessageByClient(clientId: number, userId: number): Promise<Message | undefined> {
    const [lastMessage] = await db.select()
      .from(messages)
      .where(eq(messages.client_id, clientId))
      .orderBy(desc(messages.created_at))
      .limit(1);
    
    return lastMessage;
  }

  // Tüm danışanlar için son mesajları getir
  async getLastMessagesForAllClients(userId: number): Promise<any[]> {
    const clients = await this.getClients(userId);
    const lastMessages = await Promise.all(
      clients.map(async (client) => {
        const lastMessage = await this.getLastMessageByClient(client.id, userId);
        return {
          clientId: client.id,
          clientName: `${client.first_name} ${client.last_name}`,
          lastMessage: lastMessage || null
        };
      })
    );
    return lastMessages;
  }

  // Birden fazla mesajı okundu olarak işaretle
  async markMultipleMessagesAsRead(messageIds: number[]): Promise<boolean> {
    try {
      await db.update(messages)
        .set({ is_read: true })
        .where(inArray(messages.id, messageIds));
      return true;
    } catch (error) {
      console.error("Multiple messages marking error:", error);
      return false;
    }
  }

  // Bir danışanın tüm mesajlarını sil
  async deleteAllMessages(clientId: number, userId: number): Promise<boolean> {
    try {
      await db.delete(messages)
        .where(
          and(
            eq(messages.client_id, clientId),
            eq(messages.user_id, userId)
          )
        );
      return true;
    } catch (error) {
      console.error("Delete all messages error:", error);
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
      created_at: new Date()
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

  async getUserNotifications(userId: number, limit?: number, offset?: number): Promise<Notification[]> {
    let query = db.select()
      .from(notifications)
      .where(eq(notifications.user_id, userId))
      .orderBy(desc(notifications.created_at));
    query = paginate(query, limit, offset);
    return query;
  }

  // Bir danışanın son ölçümünü getir
  async getLastMeasurement(clientId: number): Promise<Measurement | undefined> {
    try {
    const [measurement] = await db.select()
      .from(measurements)
      .where(eq(measurements.client_id, clientId))
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
        .where(eq(measurements.client_id, clientId))
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
          .where(eq(appointments.client_id, clientId))
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
    const client = await this.getClient(appointment.client_id);
    if (!client) {
      throw new Error("Client not found");
    }
    // Create a reminder notification
    const notification: InsertNotification = {
      user_id: appointment.user_id,
      client_id: appointment.client_id,
      title: "Randevu Hatırlatması",
      content: `${client.first_name} ${client.last_name} ile ${new Date(appointment.date).toLocaleDateString('tr-TR')} tarihinde ${new Date(appointment.start_time).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})} saatinde randevunuz var.`,
      type: "appointment",
      related_id: appointmentId,
      is_read: false,
      scheduled_for: scheduledFor
    };
    return this.createNotification(notification);
  }
}

// Export a single instance of DatabaseStorage
export const storage = new DatabaseStorage();
