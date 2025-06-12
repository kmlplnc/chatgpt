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
  clientNotes,
  sessions
} from "@shared/schema";
import { and, desc, eq, sql, count, inArray, like } from "drizzle-orm";
import { json } from "drizzle-orm/pg-core";
import { db } from "@shared/db";
import { pool } from './db';
import { createSession as createUserSession, getSession as getUserSession, deleteSession as deleteUserSession, deleteExpiredSessions as deleteExpiredUserSessions } from './session';

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
  getClientMeasurements(clientId: number): Promise<Measurement[]>;

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

  // Session operations
  createSession(userId: string, token: string, expires: Date): Promise<void>;
  getSession(token: string): Promise<any>;
  deleteSession(token: string): Promise<void>;
  deleteExpiredSessions(): Promise<void>;
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
      const [user] = await db.select().from(users).where(eq(users.id, id));
      if (!user) return null;
      return {
        id: user.id,
        username: user.username,
        password: user.password,
        email: user.email,
        full_name: user.full_name || null,
        role: user.role,
        subscription_status: user.subscription_status || 'free',
        subscription_plan: user.subscription_plan,
        subscription_start_date: user.subscription_start_date,
        subscription_end_date: user.subscription_end_date,
        created_at: user.created_at
      };
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  async getUserByUsername(username: string): Promise<User | null> {
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE username = $1 LIMIT 1',
        [username]
      );
      const user = result.rows[0];
      if (!user) return null;
      return {
        id: user.id,
        username: user.username,
        password: user.password,
        email: user.email,
        full_name: user.full_name || null,
        role: user.role,
        subscription_status: user.subscription_status || 'free',
        subscription_plan: user.subscription_plan,
        subscription_start_date: user.subscription_start_date,
        subscription_end_date: user.subscription_end_date,
        created_at: user.created_at
      };
    } catch (error) {
      console.error('Error getting user by username:', error);
      return null;
    }
  }

  async createUser(data: CreateUserInput): Promise<User> {
    try {
      const userData = {
        username: data.username,
        email: data.email,
        password: data.password,
        full_name: data.name || data.username,
        role: data.role || 'user',
        subscription_status: data.subscriptionStatus || 'free',
        subscription_plan: data.subscriptionPlan || null,
        subscription_start_date: data.subscriptionStartDate || null,
        subscription_end_date: data.subscriptionEndDate || null,
      };
      const [user] = await db.insert(users).values(userData).returning();
      return {
        id: user.id,
        username: user.username,
        password: user.password,
        email: user.email,
        full_name: user.full_name || null,
        role: user.role,
        subscription_status: user.subscription_status || 'free',
        subscription_plan: user.subscription_plan,
        subscription_start_date: user.subscription_start_date,
        subscription_end_date: user.subscription_end_date,
        created_at: user.created_at
      };
    } catch (error) {
      console.error('Error creating user:', error);
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        throw new Error('Username or email already exists');
      }
      throw error;
    }
  }

  async updateUser(id: string, data: UpdateUserInput): Promise<User | null> {
    try {
      const [user] = await db.update(users)
        .set({
          username: data.username,
          email: data.email,
          password: data.password,
          full_name: data.name,
          role: data.role,
          subscription_status: data.subscriptionStatus,
          subscription_plan: data.subscriptionPlan,
          subscription_start_date: data.subscriptionStartDate,
          subscription_end_date: data.subscriptionEndDate,
        })
        .where(eq(users.id, id))
        .returning();

      if (!user) return null;
      return {
        id: user.id,
        username: user.username,
        password: user.password,
        email: user.email,
        full_name: user.full_name || null,
        role: user.role,
        subscription_status: user.subscription_status || 'free',
        subscription_plan: user.subscription_plan,
        subscription_start_date: user.subscription_start_date,
        subscription_end_date: user.subscription_end_date,
        created_at: user.created_at
      };
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      const [deletedUser] = await db.delete(users)
        .where(eq(users.id, id))
        .returning();
      return !!deletedUser;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const users = await db.select().from(users).orderBy(users.created_at);
      return users.map(user => ({
        id: user.id,
        username: user.username,
        password: user.password,
        email: user.email,
        full_name: user.full_name || null,
        role: user.role,
        subscription_status: user.subscription_status || 'free',
        subscription_plan: user.subscription_plan,
        subscription_start_date: user.subscription_start_date,
        subscription_end_date: user.subscription_end_date,
        created_at: user.created_at
      }));
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  async updateUserSubscription(id: string, data: UpdateSubscriptionInput): Promise<User | null> {
    try {
      const [user] = await db.update(users)
        .set({
          subscription_status: data.subscriptionStatus,
          subscription_plan: data.subscriptionPlan,
          subscription_start_date: data.subscriptionStartDate,
          subscription_end_date: data.subscriptionEndDate,
        })
        .where(eq(users.id, id))
        .returning();

      if (!user) return null;
      return {
        id: user.id,
        username: user.username,
        password: user.password,
        email: user.email,
        full_name: user.full_name || null,
        role: user.role,
        subscription_status: user.subscription_status || 'free',
        subscription_plan: user.subscription_plan,
        subscription_start_date: user.subscription_start_date,
        subscription_end_date: user.subscription_end_date,
        created_at: user.created_at
      };
    } catch (error) {
      console.error('Error updating user subscription:', error);
      throw error;
    }
  }

  // Client operations
  async getClient(id: number): Promise<Client | undefined> {
    try {
      const client = await pool.query(
        'SELECT * FROM clients WHERE id = $1 LIMIT 1',
        [id]
      );
      const result = client.rows[0];
      if (!result) return undefined;
      return {
        id: result.id,
        firstName: result.first_name,
        lastName: result.last_name,
        email: result.email,
        phone: result.phone,
        birthDate: result.birth_date,
        gender: result.gender,
        height: result.height?.toString() || null,
        weight: result.weight?.toString() || null,
        occupation: result.occupation,
        medicalConditions: result.medical_conditions,
        allergies: result.allergies,
        medications: result.medications,
        notes: result.notes,
        clientVisibleNotes: result.client_visible_notes,
        status: result.status,
        startDate: result.start_date,
        endDate: result.end_date,
        accessCode: result.access_code,
        userId: result.user_id.toString(),
        createdAt: result.created_at,
        updatedAt: result.updated_at
      };
    } catch (error) {
      console.error('Error getting client:', error);
      return undefined;
    }
  }

  async createClient(client: Partial<InsertClient>): Promise<Client> {
    try {
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
        height: client.height ? parseFloat(client.height) : null,
        weight: client.weight ? parseFloat(client.weight) : null,
        occupation: (client as any).occupation,
        medical_conditions: (client as any).medicalConditions || [],
        allergies: (client as any).allergies || [],
        medications: (client as any).medications || [],
        notes: (client as any).notes,
        client_visible_notes: (client as any).clientVisibleNotes,
        status: (client as any).status || 'active',
        start_date: (client as any).startDate,
        end_date: (client as any).endDate,
        access_code: (client as any).accessCode,
        user_id: parseInt((client as any).userId),
        created_at: new Date(),
        updated_at: new Date()
      };

      const newClient = await pool.query(
        'INSERT INTO clients (first_name, last_name, email, phone, birth_date, gender, height, weight, occupation, medical_conditions, allergies, medications, notes, client_visible_notes, status, start_date, end_date, access_code, user_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22) RETURNING *',
        [
          dbClient.first_name,
          dbClient.last_name,
          dbClient.email,
          dbClient.phone,
          dbClient.birth_date,
          dbClient.gender,
          dbClient.height,
          dbClient.weight,
          dbClient.occupation,
          dbClient.medical_conditions,
          dbClient.allergies,
          dbClient.medications,
          dbClient.notes,
          dbClient.client_visible_notes,
          dbClient.status,
          dbClient.start_date,
          dbClient.end_date,
          dbClient.access_code,
          dbClient.user_id,
          dbClient.created_at,
          dbClient.updated_at
        ]
      );
      return newClient.rows[0];
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  }

  async updateClient(id: number, client: Partial<Client>): Promise<Client> {
    // Create a copy of the client object to avoid modifying the original
    let updatedData = { ...client };

    // Handle height separately if it exists
    if (updatedData.height !== undefined && updatedData.height !== null) {
      // Use raw SQL to ensure proper numeric type handling
      const result = await pool.query(
        'UPDATE clients SET height = $1 WHERE id = $2 RETURNING *',
        [updatedData.height, id]
      );
      // Remove height from the update object since we handled it separately
      const { height, ...restData } = updatedData;
      updatedData = restData;
    }

    // Handle client_visible_notes separately if it exists
    if (updatedData.client_visible_notes !== undefined) {
      // Ensure client_visible_notes is stored as a JSON array
      const result = await pool.query(
        'UPDATE clients SET client_visible_notes = $1 WHERE id = $2 RETURNING *',
        [updatedData.client_visible_notes, id]
      );
      // Remove client_visible_notes from the update object since we handled it separately
      const { client_visible_notes, ...restData } = updatedData;
      updatedData = restData;
    }

    // Handle diet_preferences separately if it exists
    if (updatedData.diet_preferences !== undefined) {
      const result = await pool.query(
        'UPDATE clients SET diet_preferences = $1 WHERE id = $2 RETURNING *',
        [updatedData.diet_preferences, id]
      );
      const { diet_preferences, ...restData } = updatedData;
      updatedData = restData;
    }

    // Update remaining fields and get the updated client
    const result = await pool.query(
      'UPDATE clients SET first_name = $1, last_name = $2, email = $3, phone = $4, birth_date = $5, gender = $6, height = $7, weight = $8, occupation = $9, medical_conditions = $10, allergies = $11, medications = $12, notes = $13, client_visible_notes = $14, status = $15, start_date = $16, end_date = $17, access_code = $18, updated_at = $19 WHERE id = $20 RETURNING *',
      [
        updatedData.first_name,
        updatedData.last_name,
        updatedData.email,
        updatedData.phone,
        updatedData.birth_date,
        updatedData.gender,
        updatedData.height,
        updatedData.weight,
        updatedData.occupation,
        updatedData.medical_conditions,
        updatedData.allergies,
        updatedData.medications,
        updatedData.notes,
        updatedData.client_visible_notes,
        updatedData.status,
        updatedData.start_date,
        updatedData.end_date,
        updatedData.access_code,
        new Date(),
        id
      ]
    );
    return result.rows[0];
  }

  async deleteClient(id: number): Promise<boolean> {
    try {
      const result = await pool.query(
        'DELETE FROM clients WHERE id = $1 RETURNING *',
        [id]
      );
      return !!result.rows.length;
    } catch (error) {
      console.error("Error deleting client:", error);
      throw new Error("Danışan silinirken bir hata oluştu. Lütfen tekrar deneyin.");
    }
  }

  async getAllClients(userId: string, limit?: number, offset?: number): Promise<Client[]> {
    if (!userId) {
      throw new Error('Invalid userId');
    }
    let query = pool.query(
      'SELECT * FROM clients WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    query = paginate(query, limit, offset);
    return query;
  }

  async getClients(userId?: string, limit?: number, offset?: number): Promise<Client[]> {
    try {
      if (userId) {
        return this.getAllClients(userId, limit, offset);
      } else {
        let query = pool.query(
          'SELECT * FROM clients ORDER BY created_at DESC'
        );
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
    try {
      const measurement = await pool.query(
        'SELECT * FROM measurements WHERE id = $1 LIMIT 1',
        [id]
      );
      if (!measurement.rows.length) return undefined;
      const result = measurement.rows[0];
      return {
        id: result.id,
        date: result.date.toISOString(),
        height: result.height?.toString() || "0",
        weight: result.weight?.toString() || "0",
        bmi: result.bmi?.toString() || null,
        bodyFatPercentage: result.bodyFatPercentage?.toString() || null,
        waistCircumference: result.waistCircumference?.toString() || null,
        hipCircumference: result.hipCircumference?.toString() || null,
        chestCircumference: result.chestCircumference?.toString() || null,
        armCircumference: result.armCircumference?.toString() || null,
        thighCircumference: result.thighCircumference?.toString() || null,
        calfCircumference: result.calfCircumference?.toString() || null,
        basalMetabolicRate: result.basalMetabolicRate?.toString() || null,
        totalDailyEnergyExpenditure: result.totalDailyEnergyExpenditure?.toString() || null,
        activityLevel: result.activityLevel,
        clientId: result.client_id,
        notes: null,
        createdAt: result.created_at,
        updatedAt: result.updated_at
      };
    } catch (error) {
      console.error('Error getting measurement:', error);
      return undefined;
    }
  }

  async createMeasurement(measurement: InsertMeasurement): Promise<Measurement> {
    try {
      if (!measurement.clientId) {
        throw new Error('Client ID is required for measurement');
      }

      const clientId = Number(measurement.clientId);
      if (isNaN(clientId)) {
        throw new Error('Invalid client ID');
      }

      const insertObj = {
        client_id: clientId,
        date: new Date(measurement.date),
        height: measurement.height ? parseFloat(measurement.height) : null,
        weight: measurement.weight ? parseFloat(measurement.weight) : null,
        bmi: measurement.bmi ? parseFloat(measurement.bmi) : null,
        bodyFatPercentage: measurement.bodyFatPercentage ? parseFloat(measurement.bodyFatPercentage) : null,
        waistCircumference: measurement.waistCircumference ? parseFloat(measurement.waistCircumference) : null,
        hipCircumference: measurement.hipCircumference ? parseFloat(measurement.hipCircumference) : null,
        chestCircumference: measurement.chestCircumference ? parseFloat(measurement.chestCircumference) : null,
        armCircumference: measurement.armCircumference ? parseFloat(measurement.armCircumference) : null,
        thighCircumference: measurement.thighCircumference ? parseFloat(measurement.thighCircumference) : null,
        calfCircumference: measurement.calfCircumference ? parseFloat(measurement.calfCircumference) : null,
        basalMetabolicRate: measurement.basalMetabolicRate ? parseFloat(measurement.basalMetabolicRate) : null,
        totalDailyEnergyExpenditure: measurement.totalDailyEnergyExpenditure ? parseFloat(measurement.totalDailyEnergyExpenditure) : null,
        activityLevel: measurement.activityLevel,
        created_at: new Date(),
        updated_at: new Date()
      };

      const result = await pool.query(
        'INSERT INTO measurements (client_id, date, height, weight, bmi, bodyFatPercentage, waistCircumference, hipCircumference, chestCircumference, armCircumference, thighCircumference, calfCircumference, basalMetabolicRate, totalDailyEnergyExpenditure, activityLevel, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *',
        [
          insertObj.client_id,
          insertObj.date,
          insertObj.height,
          insertObj.weight,
          insertObj.bmi,
          insertObj.bodyFatPercentage,
          insertObj.waistCircumference,
          insertObj.hipCircumference,
          insertObj.chestCircumference,
          insertObj.armCircumference,
          insertObj.thighCircumference,
          insertObj.calfCircumference,
          insertObj.basalMetabolicRate,
          insertObj.totalDailyEnergyExpenditure,
          insertObj.activityLevel,
          insertObj.created_at,
          insertObj.updated_at
        ]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating measurement:', error);
      throw error;
    }
  }

  async updateMeasurement(id: number, measurement: Partial<Measurement>): Promise<Measurement> {
    try {
      const updateData: any = {};
      
      if (measurement.date) updateData.date = new Date(measurement.date);
      if (measurement.height) updateData.height = parseFloat(measurement.height);
      if (measurement.weight) updateData.weight = parseFloat(measurement.weight);
      if (measurement.bmi) updateData.bmi = parseFloat(measurement.bmi);
      if (measurement.bodyFatPercentage) updateData.bodyFatPercentage = parseFloat(measurement.bodyFatPercentage);
      if (measurement.waistCircumference) updateData.waistCircumference = parseFloat(measurement.waistCircumference);
      if (measurement.hipCircumference) updateData.hipCircumference = parseFloat(measurement.hipCircumference);
      if (measurement.chestCircumference) updateData.chestCircumference = parseFloat(measurement.chestCircumference);
      if (measurement.armCircumference) updateData.armCircumference = parseFloat(measurement.armCircumference);
      if (measurement.thighCircumference) updateData.thighCircumference = parseFloat(measurement.thighCircumference);
      if (measurement.calfCircumference) updateData.calfCircumference = parseFloat(measurement.calfCircumference);
      if (measurement.basalMetabolicRate) updateData.basalMetabolicRate = parseFloat(measurement.basalMetabolicRate);
      if (measurement.totalDailyEnergyExpenditure) updateData.totalDailyEnergyExpenditure = parseFloat(measurement.totalDailyEnergyExpenditure);
      if (measurement.activityLevel) updateData.activityLevel = measurement.activityLevel;
      
      updateData.updated_at = new Date();

      const result = await pool.query(
        'UPDATE measurements SET date = $1, height = $2, weight = $3, bmi = $4, bodyFatPercentage = $5, waistCircumference = $6, hipCircumference = $7, chestCircumference = $8, armCircumference = $9, thighCircumference = $10, calfCircumference = $11, basalMetabolicRate = $12, totalDailyEnergyExpenditure = $13, activityLevel = $14, updated_at = $15 WHERE id = $16 RETURNING *',
        [
          updateData.date,
          updateData.height,
          updateData.weight,
          updateData.bmi,
          updateData.bodyFatPercentage,
          updateData.waistCircumference,
          updateData.hipCircumference,
          updateData.chestCircumference,
          updateData.armCircumference,
          updateData.thighCircumference,
          updateData.calfCircumference,
          updateData.basalMetabolicRate,
          updateData.totalDailyEnergyExpenditure,
          updateData.activityLevel,
          updateData.updated_at,
          id
        ]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error updating measurement:', error);
      throw error;
    }
  }

  async deleteMeasurement(id: number): Promise<void> {
    try {
      await pool.query(
        'DELETE FROM measurements WHERE id = $1',
        [id]
      );
    } catch (error) {
      console.error('Error deleting measurement:', error);
      throw error;
    }
  }

  async getClientMeasurements(clientId: number): Promise<Measurement[]> {
    try {
      const measurements = await pool.query(
        'SELECT * FROM measurements WHERE client_id = $1 ORDER BY date DESC',
        [clientId]
      );

      return measurements.rows.map(measurement => ({
        id: measurement.id,
        date: measurement.date.toISOString(),
        height: measurement.height?.toString() || "0",
        weight: measurement.weight?.toString() || "0",
        bmi: measurement.bmi?.toString() || null,
        bodyFatPercentage: measurement.bodyFatPercentage?.toString() || null,
        waistCircumference: measurement.waistCircumference?.toString() || null,
        hipCircumference: measurement.hipCircumference?.toString() || null,
        chestCircumference: measurement.chestCircumference?.toString() || null,
        armCircumference: measurement.armCircumference?.toString() || null,
        thighCircumference: measurement.thighCircumference?.toString() || null,
        calfCircumference: measurement.calfCircumference?.toString() || null,
        basalMetabolicRate: measurement.basalMetabolicRate?.toString() || null,
        totalDailyEnergyExpenditure: measurement.totalDailyEnergyExpenditure?.toString() || null,
        activityLevel: measurement.activityLevel,
        clientId: measurement.client_id,
        notes: null,
        createdAt: measurement.created_at,
        updatedAt: measurement.updated_at
      }));
    } catch (error) {
      console.error('Error getting client measurements:', error);
      return [];
    }
  }

  // Diet plan operations
  async getDietPlan(id: number): Promise<DietPlan | undefined> {
    const dietPlan = await pool.query(
      'SELECT * FROM dietPlans WHERE id = $1 LIMIT 1',
      [id]
    );
    return dietPlan.rows[0];
  }

  async createDietPlan(dietPlan: InsertDietPlan): Promise<DietPlan> {
    const result = await pool.query(
      'INSERT INTO dietPlans (client_id, name, description, createdAt, updatedAt) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [
        dietPlan.client_id,
        dietPlan.name,
        dietPlan.description,
        dietPlan.createdAt,
        dietPlan.updatedAt
      ]
    );
    return result.rows[0];
  }

  async updateDietPlan(id: number, dietPlan: Partial<DietPlan>): Promise<DietPlan> {
    const result = await pool.query(
      'UPDATE dietPlans SET client_id = $1, name = $2, description = $3, updatedAt = $4 WHERE id = $5 RETURNING *',
      [
        dietPlan.client_id,
        dietPlan.name,
        dietPlan.description,
        dietPlan.updatedAt,
        id
      ]
    );
    return result.rows[0];
  }

  async deleteDietPlan(id: number): Promise<void> {
    await pool.query(
      'DELETE FROM dietPlans WHERE id = $1',
      [id]
    );
  }

  async getUserDietPlans(userId: string, limit?: number, offset?: number): Promise<DietPlan[]> {
    console.log("userId param:", userId, typeof userId);
    let query = pool.query(
      'SELECT * FROM dietPlans WHERE client_id = $1 ORDER BY createdAt DESC',
      [userId]
    );
    const result = await query;
    console.log("TÜM PLANLAR:", result);
    return result.rows;
  }

  // Food operations
  async getFood(fdcId: string): Promise<Food | undefined> {
    const food = await pool.query(
      'SELECT * FROM foods WHERE fdcId = $1 LIMIT 1',
      [fdcId]
    );
    return food.rows[0];
  }

  async createFood(food: InsertFood): Promise<Food> {
    const result = await pool.query(
      'INSERT INTO foods (fdcId, description, createdAt) VALUES ($1, $2, $3) RETURNING *',
      [food.fdcId, food.description, food.createdAt]
    );
    return result.rows[0];
  }

  async updateFood(fdcId: string, food: Partial<Food>): Promise<Food> {
    const result = await pool.query(
      'UPDATE foods SET description = $1, updatedAt = $2 WHERE fdcId = $3 RETURNING *',
      [food.description, new Date(), fdcId]
    );
    return result.rows[0];
  }

  async deleteFood(fdcId: string): Promise<void> {
    await pool.query(
      'DELETE FROM foods WHERE fdcId = $1',
      [fdcId]
    );
  }

  async searchFoods(query: string, limit?: number, offset?: number): Promise<Food[]> {
    let sqlQuery = pool.query(
      'SELECT * FROM foods WHERE description ILIKE $1 ORDER BY description ASC',
      [query]
    );
    sqlQuery = paginate(sqlQuery, limit, offset);
    return sqlQuery;
  }

  // Saved food operations
  async getSavedFood(userId: string): Promise<SavedFood[]> {
    let query = pool.query(
      'SELECT * FROM savedFoods WHERE userId = $1 ORDER BY createdAt DESC',
      [userId]
    );
    return query;
  }

  async createSavedFood(savedFood: InsertSavedFood): Promise<SavedFood> {
    const result = await pool.query(
      'INSERT INTO savedFoods (userId, fdcId, createdAt) VALUES ($1, $2, $3) RETURNING *',
      [savedFood.userId, savedFood.fdcId, savedFood.createdAt]
    );
    return result.rows[0];
  }

  async deleteSavedFood(userId: string, fdcId: string): Promise<boolean> {
    try {
      await pool.query(
        'DELETE FROM savedFoods WHERE userId = $1 AND fdcId = $2 RETURNING *',
        [userId, fdcId]
      );
      return true;
    } catch (error) {
      console.error("Delete saved food error:", error);
      return false;
    }
  }

  async isFoodSaved(userId: string, fdcId: string): Promise<boolean> {
    const result = await pool.query(
      'SELECT * FROM savedFoods WHERE userId = $1 AND fdcId = $2 LIMIT 1',
      [userId, fdcId]
    );
    return !!result.rows.length;
  }

  async getUserSavedFoods(userId: string, limit?: number, offset?: number): Promise<SavedFood[]> {
    let query = pool.query(
      'SELECT * FROM savedFoods WHERE userId = $1 ORDER BY createdAt DESC',
      [userId]
    );
    query = paginate(query, limit, offset);
    return query;
  }

  // Client session operations
  async getClientSession(sessionToken: string): Promise<ClientSession | undefined> {
    const result = await pool.query(
      'SELECT * FROM clientsSession WHERE sessionToken = $1 LIMIT 1',
      [sessionToken]
    );
    return result.rows[0];
  }

  async createClientSession(session: InsertClientSession): Promise<ClientSession> {
    const result = await pool.query(
      'INSERT INTO clientsSession (sessionToken, createdAt, lastActivity) VALUES ($1, $2, $3) RETURNING *',
      [session.sessionToken, session.createdAt, session.lastActivity]
    );
    return result.rows[0];
  }

  // Client Portal operations
  async getClientByAccessCode(accessCode: string): Promise<Client | undefined> {
    const result = await pool.query(
      'SELECT * FROM clients WHERE access_code = $1 LIMIT 1',
      [accessCode]
    );
    return result.rows[0];
  }

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
    await pool.query(
      'UPDATE clients SET access_code = $1 WHERE id = $2',
      [code, clientId]
    );
    
    return code;
  }
  
  async updateClientAccessCode(clientId: number, accessCode: string): Promise<boolean> {
    try {
      await pool.query(
        'UPDATE clients SET access_code = $1 WHERE id = $2',
        [accessCode, clientId]
      );
      
      return true;
    } catch (error) {
      console.error('Update client access code error:', error);
      return false;
    }
  }

  async updateClientSessionActivity(sessionToken: string): Promise<boolean> {
    try {
      await pool.query(
        'UPDATE clientsSession SET lastActivity = $1 WHERE sessionToken = $2',
        [new Date(), sessionToken]
      );
      
      return true;
    } catch (error) {
      console.error('Update session activity error:', error);
      return false;
    }
  }

  async deleteClientSession(sessionToken: string): Promise<boolean> {
    try {
      await pool.query(
        'DELETE FROM clientsSession WHERE sessionToken = $1',
        [sessionToken]
      );
      
      return true;
    } catch (error) {
      console.error('Delete client session error:', error);
      return false;
    }
  }

  async deleteExpiredSessions(): Promise<void> {
    await pool.query(
      'DELETE FROM clientsSession WHERE expiresAt < NOW()'
    );
  }

  // Appointment operations
  async getAppointment(id: number): Promise<Appointment | undefined> {
    try {
      const result = await pool.query(
        'SELECT * FROM appointments WHERE id = $1 LIMIT 1',
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error getting appointment:', error);
      throw error;
    }
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    try {
      const validUserId = safeUUIDConversion(appointment.userId);
      const result = await pool.query(
        'INSERT INTO appointments (client_id, userId, date, startTime, endTime, createdAt, updatedAt) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [
          appointment.client_id,
          validUserId,
          new Date(appointment.date),
          new Date(appointment.startTime),
          new Date(appointment.endTime),
          new Date(),
          new Date()
        ]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  }

  async updateAppointment(id: number, appointment: Partial<Appointment>): Promise<Appointment> {
    try {
      const validUserId = appointment.userId ? safeUUIDConversion(appointment.userId) : undefined;
      const result = await pool.query(
        'UPDATE appointments SET client_id = $1, userId = $2, date = $3, startTime = $4, endTime = $5, updatedAt = $6 WHERE id = $7 RETURNING *',
        [
          appointment.client_id,
          validUserId,
          new Date(appointment.date),
          new Date(appointment.startTime),
          new Date(appointment.endTime),
          new Date(),
          id
        ]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  }

  async deleteAppointment(id: number): Promise<void> {
    await pool.query(
      'DELETE FROM appointments WHERE id = $1',
      [id]
    );
  }

  async getClientAppointments(clientId: number, limit?: number, offset?: number): Promise<Appointment[]> {
    let query = pool.query(
      'SELECT * FROM appointments WHERE client_id = $1 ORDER BY date DESC',
      [clientId]
    );
    query = paginate(query, limit, offset);
    return query;
  }

  async getUserAppointments(userId: string, limit?: number, offset?: number): Promise<Appointment[]> {
    try {
      const validUserId = safeUUIDConversion(userId);
      let query = pool.query(
        'SELECT * FROM appointments WHERE userId = $1 ORDER BY date DESC',
        [validUserId]
      );
      query = paginate(query, limit, offset);
      return query;
    } catch (error) {
      console.error('Error getting user appointments:', error);
      throw error;
    }
  }

  // Message operations
  async getMessage(id: number): Promise<Message | undefined> {
    const result = await pool.query(
      'SELECT * FROM messages WHERE id = $1 LIMIT 1',
      [id]
    );
    return result.rows[0];
  }

  async getMessageById(id: number): Promise<Message | undefined> {
    return this.getMessage(id);
  }

  async getMessages(clientId: number, userId: string): Promise<Message[]> {
    try {
      const validUserId = safeUUIDConversion(userId);
      let query = pool.query(
        'SELECT * FROM messages WHERE client_id = $1 AND userId = $2 ORDER BY createdAt DESC',
        [clientId, validUserId]
      );
      return query;
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const result = await pool.query(
      'INSERT INTO messages (client_id, userId, content, createdAt) VALUES ($1, $2, $3, $4) RETURNING *',
      [message.client_id, message.userId, message.content, new Date()]
    );
    return result.rows[0];
  }

  async updateMessage(id: number, message: Partial<Message>): Promise<Message> {
    const result = await pool.query(
      'UPDATE messages SET client_id = $1, userId = $2, content = $3, updatedAt = $4 WHERE id = $5 RETURNING *',
      [message.client_id, message.userId, message.content, new Date(), id]
    );
    return result.rows[0];
  }

  async deleteMessage(id: number): Promise<void> {
    await pool.query(
      'DELETE FROM messages WHERE id = $1',
      [id]
    );
  }

  async getClientMessages(clientId: number, limit?: number, offset?: number): Promise<Message[]> {
    let query = pool.query(
      'SELECT * FROM messages WHERE client_id = $1 ORDER BY createdAt DESC',
      [clientId]
    );
    query = paginate(query, limit, offset);
    return query;
  }

  async getUserMessages(userId: string, limit?: number, offset?: number): Promise<Message[]> {
    try {
      const validUserId = safeUUIDConversion(userId);
      let query = pool.query(
        'SELECT * FROM messages WHERE userId = $1 ORDER BY createdAt DESC',
        [validUserId]
      );
      query = paginate(query, limit, offset);
      return query;
    } catch (error) {
      console.error('Error getting user messages:', error);
      throw error;
    }
  }

  // Mesajı okundu olarak işaretle
  async markMessageAsRead(messageId: number): Promise<boolean> {
    try {
      await pool.query(
        'UPDATE messages SET isRead = $1 WHERE id = $2',
        [true, messageId]
      );
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
      await pool.query(
        'UPDATE messages SET isRead = $1 WHERE client_id = $2 AND userId = $3',
        [true, clientId, validUserId]
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
      if (clientId) conditions.push({ client_id: clientId });
      if (userId) conditions.push({ userId: safeUUIDConversion(userId) });
      if (forClient !== undefined) conditions.push({ fromClient: !forClient });
      conditions.push({ isRead: false });
      const result = await pool.query(
        'SELECT COUNT(*) FROM messages WHERE ' + conditions.map(condition => Object.keys(condition).map(key => `${key} = ${condition[key]}`).join(' AND ')).join(' OR '),
        conditions.map(condition => Object.values(condition))
      );
      return Number(result.rows[0].count);
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
    const result = await pool.query(
      'SELECT * FROM messages WHERE client_id = $1 ORDER BY createdAt DESC LIMIT 1',
      [clientId]
    );
    return result.rows[0];
  }

  // Tüm danışanlar için son mesajları getir
  async getLastMessagesForAllClients(userId: string): Promise<any[]> {
    try {
      const validUserId = safeUUIDConversion(userId);
      const result = await pool.query(
        'SELECT client_id, content, createdAt, isRead FROM messages WHERE userId = $1 ORDER BY createdAt DESC',
        [validUserId]
      );
      return result.rows.map(message => ({
        client_id: message.client_id,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
        isRead: message.isRead
      }));
    } catch (error) {
      console.error('Error getting last messages for all clients:', error);
      throw error;
    }
  }

  // Birden fazla mesajı okundu olarak işaretle
  async markMultipleMessagesAsRead(messageIds: number[]): Promise<boolean> {
    try {
      await pool.query(
        'UPDATE messages SET isRead = $1 WHERE id = ANY($2)',
        [true, messageIds]
      );
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
      await pool.query(
        'DELETE FROM messages WHERE client_id = $1 AND userId = $2',
        [clientId, validUserId]
      );
      return true;
    } catch (error) {
      console.error('Error deleting messages:', error);
      return false;
    }
  }

  // Notification operations
  async getNotification(id: number): Promise<Notification | undefined> {
    const result = await pool.query(
      'SELECT * FROM notifications WHERE id = $1 LIMIT 1',
      [id]
    );
    return result.rows[0];
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const result = await pool.query(
      'INSERT INTO notifications (userId, client_id, title, content, type, relatedId, isRead, scheduledFor, createdAt) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [
        notification.userId,
        notification.client_id,
        notification.title,
        notification.content,
        notification.type,
        notification.relatedId,
        notification.isRead,
        notification.scheduledFor,
        new Date()
      ]
    );
    return result.rows[0];
  }

  async updateNotification(id: number, notification: Partial<Notification>): Promise<Notification> {
    const result = await pool.query(
      'UPDATE notifications SET userId = $1, client_id = $2, title = $3, content = $4, type = $5, relatedId = $6, isRead = $7, scheduledFor = $8, updatedAt = $9 WHERE id = $10 RETURNING *',
      [
        notification.userId,
        notification.client_id,
        notification.title,
        notification.content,
        notification.type,
        notification.relatedId,
        notification.isRead,
        notification.scheduledFor,
        new Date(),
        id
      ]
    );
    return result.rows[0];
  }

  async deleteNotification(id: number): Promise<void> {
    await pool.query(
      'DELETE FROM notifications WHERE id = $1',
      [id]
    );
  }

  async getUserNotifications(userId: string, limit?: number, offset?: number): Promise<Notification[]> {
    try {
      const validUserId = safeUUIDConversion(userId);
      const result = await pool.query(
        'SELECT * FROM notifications WHERE userId = $1 ORDER BY createdAt DESC LIMIT $2 OFFSET $3',
        [validUserId, limit, offset]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  async getNotificationById(id: number): Promise<Notification | undefined> {
    const result = await pool.query(
      'SELECT * FROM notifications WHERE id = $1 LIMIT 1',
      [id]
    );
    return result.rows[0];
  }

  async getNotificationsByUserId(userId: string, options?: NotificationOptions): Promise<Notification[]> {
    try {
      const validUserId = safeUUIDConversion(userId);
      const conditions = [
        { userId: validUserId },
        { type: options?.type },
        { isRead: options?.isRead }
      ];

      const result = await pool.query(
        'SELECT * FROM notifications WHERE userId = $1 AND type = $2 AND isRead = $3 ORDER BY createdAt DESC LIMIT $4 OFFSET $5',
        [validUserId, options?.type, options?.isRead, options?.limit, options?.offset]
      );

      return result.rows;
    } catch (error) {
      console.error('Error getting notifications by user ID:', error);
      throw error;
    }
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    try {
      const validUserId = safeUUIDConversion(userId);
      const result = await pool.query(
        'SELECT COUNT(*) FROM notifications WHERE userId = $1 AND isRead = $2',
        [validUserId, false]
      );
      return Number(result.rows[0].count);
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      throw error;
    }
  }

  async markNotificationAsRead(id: number): Promise<Notification> {
    const result = await pool.query(
      'UPDATE notifications SET isRead = $1 WHERE id = $2 RETURNING *',
      [true, id]
    );
    return result.rows[0];
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    try {
      const validUserId = safeUUIDConversion(userId);
      await pool.query(
        'UPDATE notifications SET isRead = $1 WHERE userId = $2',
        [true, validUserId]
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async deleteAllNotifications(userId: string): Promise<void> {
    try {
      const validUserId = safeUUIDConversion(userId);
      await pool.query(
        'DELETE FROM notifications WHERE userId = $1',
        [validUserId]
      );
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      throw error;
    }
  }

  // Bir danışanın son ölçümünü getir
  async getLastMeasurement(clientId: number): Promise<Measurement | undefined> {
    try {
      const result = await pool.query(
        'SELECT * FROM measurements WHERE client_id = $1 ORDER BY date DESC LIMIT 1',
        [clientId]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error fetching last measurement:", error);
      return undefined;
    }
  }

  // Bir danışanın tüm ölçümlerini getir
  async getMeasurements(clientId: number): Promise<Measurement[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM measurements WHERE client_id = $1 ORDER BY date DESC',
        [clientId]
      );
      return result.rows.map(measurement => ({
        id: measurement.id,
        date: measurement.date.toISOString(),
        height: measurement.height?.toString() || "0",
        weight: measurement.weight?.toString() || "0",
        bmi: measurement.bmi?.toString() || null,
        bodyFatPercentage: measurement.bodyFatPercentage?.toString() || null,
        waistCircumference: measurement.waistCircumference?.toString() || null,
        hipCircumference: measurement.hipCircumference?.toString() || null,
        chestCircumference: measurement.chestCircumference?.toString() || null,
        armCircumference: measurement.armCircumference?.toString() || null,
        thighCircumference: measurement.thighCircumference?.toString() || null,
        calfCircumference: measurement.calfCircumference?.toString() || null,
        basalMetabolicRate: measurement.basalMetabolicRate?.toString() || null,
        totalDailyEnergyExpenditure: measurement.totalDailyEnergyExpenditure?.toString() || null,
        activityLevel: measurement.activityLevel,
        clientId: measurement.client_id,
        notes: null,
        createdAt: measurement.created_at,
        updatedAt: measurement.updated_at
      }));
    } catch (error) {
      console.error("Error fetching measurements:", error);
      return [];
    }
  }

  // Randevuları getir
  async getAppointments(clientId?: number): Promise<Appointment[]> {
    try {
      if (clientId) {
        return await this.getClientAppointments(clientId);
      } else {
        return await this.getUserAppointments(safeUUIDConversion(clientId), undefined, undefined);
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
      userId: appointment.userId,
      client_id: appointment.client_id,
      title: "Randevu Hatırlatması",
      content: `${client.firstName} ${client.lastName} ile ${new Date(appointment.date).toLocaleDateString('tr-TR')} tarihinde ${new Date(appointment.startTime).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})} saatinde randevunuz var.`,
      type: "appointment",
      relatedId: appointmentId,
      isRead: false,
      scheduledFor: scheduledFor
    };
    return this.createNotification(notification);
  }

  // Çoklu notlar: bir danışanın tüm notlarını getir
  async getClientNotes(clientId: number): Promise<any[]> {
    const result = await pool.query(
      'SELECT * FROM clientNotes WHERE client_id = $1 ORDER BY created_at DESC',
      [clientId]
    );
    return result.rows;
  }

  // Çoklu notlar: yeni not ekle
  async addClientNote(clientId: number, userId: string, content: string): Promise<any> {
    const result = await pool.query(
      'INSERT INTO clientNotes (client_id, user_id, content, created_at) VALUES ($1, $2, $3, $4) RETURNING *',
      [clientId, userId, content, new Date()]
    );
    return result.rows[0];
  }

  // Çoklu notlar: not sil
  async deleteClientNote(noteId: number): Promise<void> {
    await pool.query(
      'DELETE FROM clientNotes WHERE id = $1',
      [noteId]
    );
  }

  // Session operations
  async createSession(userId: string, token: string, expires: Date): Promise<void> {
    try {
      await pool.query(
        'INSERT INTO sessions (user_id, token, expires, created_at) VALUES ($1, $2, $3, $4)',
        [userId, token, expires, new Date()]
      );
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async getSession(token: string): Promise<any> {
    try {
      const result = await pool.query(
        'SELECT s.*, u.* FROM sessions s LEFT JOIN users u ON s.user_id = u.id WHERE s.token = $1 LIMIT 1',
        [token]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error getting session:', error);
      throw error;
    }
  }

  async deleteSession(token: string): Promise<void> {
    try {
      await pool.query(
        'DELETE FROM sessions WHERE token = $1',
        [token]
      );
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }

  async deleteExpiredSessions(): Promise<void> {
    await pool.query(
      'DELETE FROM sessions WHERE expires < NOW()'
    );
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
    const result = await pool.query(
      'INSERT INTO notifications (userId, client_id, title, content, type, relatedId, isRead, scheduledFor, createdAt) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [
        validUserId,
        data.client_id,
        data.title,
        data.content,
        data.type,
        data.relatedId,
        data.isRead,
        data.scheduledFor,
        new Date()
      ]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}
