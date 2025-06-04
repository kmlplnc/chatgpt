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
import { PrismaClient } from '@prisma/client';
import { and, desc, eq, sql, count, inArray, like } from "drizzle-orm";
import { json } from "drizzle-orm/pg-core";
import { db } from "@shared/db";

const prisma = new PrismaClient();

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
      const [user] = await db.select().from(users).where(eq(users.username, username));
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
      const client = await prisma.clients.findUnique({ where: { id } });
      if (!client) return undefined;
      return {
        id: client.id,
        firstName: client.first_name,
        lastName: client.last_name,
        email: client.email,
        phone: client.phone,
        birthDate: client.birth_date,
        gender: client.gender,
        height: client.height?.toString() || null,
        weight: client.weight?.toString() || null,
        occupation: client.occupation,
        medicalConditions: client.medical_conditions,
        allergies: client.allergies,
        medications: client.medications,
        notes: client.notes,
        clientVisibleNotes: client.client_visible_notes,
        status: client.status,
        startDate: client.start_date,
        endDate: client.end_date,
        accessCode: client.access_code,
        userId: client.user_id.toString(),
        createdAt: client.created_at,
        updatedAt: client.updated_at
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

      const newClient = await prisma.clients.create({ data: dbClient });
      return {
        id: newClient.id,
        firstName: newClient.first_name,
        lastName: newClient.last_name,
        email: newClient.email,
        phone: newClient.phone,
        birthDate: newClient.birth_date,
        gender: newClient.gender,
        height: newClient.height?.toString() || null,
        weight: newClient.weight?.toString() || null,
        occupation: newClient.occupation,
        medicalConditions: newClient.medical_conditions,
        allergies: newClient.allergies,
        medications: newClient.medications,
        notes: newClient.notes,
        clientVisibleNotes: newClient.client_visible_notes,
        status: newClient.status,
        startDate: newClient.start_date,
        endDate: newClient.end_date,
        accessCode: newClient.access_code,
        userId: newClient.user_id.toString(),
        createdAt: newClient.created_at,
        updatedAt: newClient.updated_at
      };
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
      await prisma.clients.update({
        where: { id },
        data: {
          height: {
            set: updatedData.height
          }
        }
      });
      // Remove height from the update object since we handled it separately
      const { height, ...restData } = updatedData;
      updatedData = restData;
    }

    // Handle client_visible_notes separately if it exists
    if (updatedData.client_visible_notes !== undefined) {
      // Ensure client_visible_notes is stored as a JSON array
      await prisma.clients.update({
        where: { id },
        data: {
          client_visible_notes: {
            set: updatedData.client_visible_notes
          }
        }
      });
      // Remove client_visible_notes from the update object since we handled it separately
      const { client_visible_notes, ...restData } = updatedData;
      updatedData = restData;
    }

    // Handle diet_preferences separately if it exists
    if (updatedData.diet_preferences !== undefined) {
      await prisma.clients.update({
        where: { id },
        data: {
          diet_preferences: {
            set: updatedData.diet_preferences
          }
        }
      });
      const { diet_preferences, ...restData } = updatedData;
      updatedData = restData;
    }

    // Update remaining fields and get the updated client
    const [updatedClient] = await prisma.clients.update({
      where: { id },
      data: {
        ...updatedData,
        updated_at: new Date()
      }
    }).returning();

    return updatedClient;
  }

  async deleteClient(id: number): Promise<boolean> {
    try {
      const client = await prisma.clients.findUnique({ where: { id } });
      if (!client) {
        return false;
      }

      await prisma.$transaction(async (prisma) => {
        // Delete all related records
        await prisma.measurement.deleteMany({ where: { client_id: id } });
        await prisma.appointment.deleteMany({ where: { client_id: id } });
        await prisma.clientsSession.deleteMany({ where: { client_id: id } });
        await prisma.healthHistory.deleteMany({ where: { client_id: id } });
        await prisma.dietPlan.deleteMany({ where: { client_id: id } });
        
        // Finally delete the client
        await prisma.clients.delete({ where: { id } });
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
    let query = prisma.clients.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' }
    });
    query = paginate(query, limit, offset);
    return query;
  }

  async getClients(userId?: string, limit?: number, offset?: number): Promise<Client[]> {
    try {
      if (userId) {
        return this.getAllClients(userId, limit, offset);
      } else {
        let query = prisma.clients.findMany({
          orderBy: { created_at: 'desc' }
        });
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
      const measurement = await prisma.measurement.findUnique({ where: { id } });
      if (!measurement) return undefined;
      return {
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

      const newMeasurement = await prisma.measurement.create({ data: insertObj });
      return {
        id: newMeasurement.id,
        date: newMeasurement.date.toISOString(),
        height: newMeasurement.height?.toString() || "0",
        weight: newMeasurement.weight?.toString() || "0",
        bmi: newMeasurement.bmi?.toString() || null,
        bodyFatPercentage: newMeasurement.bodyFatPercentage?.toString() || null,
        waistCircumference: newMeasurement.waistCircumference?.toString() || null,
        hipCircumference: newMeasurement.hipCircumference?.toString() || null,
        chestCircumference: newMeasurement.chestCircumference?.toString() || null,
        armCircumference: newMeasurement.armCircumference?.toString() || null,
        thighCircumference: newMeasurement.thighCircumference?.toString() || null,
        calfCircumference: newMeasurement.calfCircumference?.toString() || null,
        basalMetabolicRate: newMeasurement.basalMetabolicRate?.toString() || null,
        totalDailyEnergyExpenditure: newMeasurement.totalDailyEnergyExpenditure?.toString() || null,
        activityLevel: newMeasurement.activityLevel,
        clientId: newMeasurement.client_id,
        notes: null,
        createdAt: newMeasurement.created_at,
        updatedAt: newMeasurement.updated_at
      };
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

      const updatedMeasurement = await prisma.measurement.update({
        where: { id },
        data: updateData
      });

      return {
        id: updatedMeasurement.id,
        date: updatedMeasurement.date.toISOString(),
        height: updatedMeasurement.height?.toString() || "0",
        weight: updatedMeasurement.weight?.toString() || "0",
        bmi: updatedMeasurement.bmi?.toString() || null,
        bodyFatPercentage: updatedMeasurement.bodyFatPercentage?.toString() || null,
        waistCircumference: updatedMeasurement.waistCircumference?.toString() || null,
        hipCircumference: updatedMeasurement.hipCircumference?.toString() || null,
        chestCircumference: updatedMeasurement.chestCircumference?.toString() || null,
        armCircumference: updatedMeasurement.armCircumference?.toString() || null,
        thighCircumference: updatedMeasurement.thighCircumference?.toString() || null,
        calfCircumference: updatedMeasurement.calfCircumference?.toString() || null,
        basalMetabolicRate: updatedMeasurement.basalMetabolicRate?.toString() || null,
        totalDailyEnergyExpenditure: updatedMeasurement.totalDailyEnergyExpenditure?.toString() || null,
        activityLevel: updatedMeasurement.activityLevel,
        clientId: updatedMeasurement.client_id,
        notes: null,
        createdAt: updatedMeasurement.created_at,
        updatedAt: updatedMeasurement.updated_at
      };
    } catch (error) {
      console.error('Error updating measurement:', error);
      throw error;
    }
  }

  async deleteMeasurement(id: number): Promise<void> {
    try {
      await prisma.measurement.delete({
        where: { id }
      });
    } catch (error) {
      console.error('Error deleting measurement:', error);
      throw error;
    }
  }

  async getClientMeasurements(clientId: number): Promise<Measurement[]> {
    try {
      const measurements = await prisma.measurement.findMany({
        where: { client_id: clientId },
        orderBy: { date: 'desc' }
      });

      return measurements.map(measurement => ({
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
    const [dietPlan] = await prisma.dietPlan.findMany({ where: { id } });
    return dietPlan;
  }

  async createDietPlan(dietPlan: InsertDietPlan): Promise<DietPlan> {
    const [newDietPlan] = await prisma.dietPlan.create({
      data: {
        ...dietPlan,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }).returning();
    return newDietPlan;
  }

  async updateDietPlan(id: number, dietPlan: Partial<DietPlan>): Promise<DietPlan> {
    const [updatedDietPlan] = await prisma.dietPlan.update({
      where: { id },
      data: {
        ...dietPlan,
        updatedAt: new Date()
      }
    }).returning();
    return updatedDietPlan;
  }

  async deleteDietPlan(id: number): Promise<void> {
    await prisma.dietPlan.delete({ where: { id } });
  }

  async getUserDietPlans(userId: string, limit?: number, offset?: number): Promise<DietPlan[]> {
    console.log("userId param:", userId, typeof userId);
    let query = prisma.dietPlan.findMany();
    const result = await query;
    console.log("TÜM PLANLAR:", result);
    return result;
  }

  // Food operations
  async getFood(fdcId: string): Promise<Food | undefined> {
    const [food] = await prisma.food.findMany({ where: { fdcId } });
    return food;
  }

  async createFood(food: InsertFood): Promise<Food> {
    const [newFood] = await prisma.food.create({
      data: {
        ...food,
        createdAt: new Date()
      }
    }).returning();
    return newFood;
  }

  async updateFood(fdcId: string, food: Partial<Food>): Promise<Food> {
    const [updatedFood] = await prisma.food.update({
      where: { fdcId },
      data: food
    }).returning();
    return updatedFood;
  }

  async deleteFood(fdcId: string): Promise<void> {
    await prisma.food.delete({ where: { fdcId } });
  }

  async searchFoods(query: string, limit?: number, offset?: number): Promise<Food[]> {
    let sqlQuery = prisma.food.findMany({
      where: {
        description: {
          contains: query,
          mode: 'insensitive'
        }
      },
      orderBy: { description: 'asc' }
    });
    sqlQuery = paginate(sqlQuery, limit, offset);
    return sqlQuery;
  }

  // Saved food operations
  async getSavedFood(userId: string): Promise<SavedFood[]> {
    let query = prisma.savedFood.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    return query;
  }

  async createSavedFood(savedFood: InsertSavedFood): Promise<SavedFood> {
    const [newSavedFood] = await prisma.savedFood.create({
      data: {
        ...savedFood,
        createdAt: new Date()
      }
    }).returning();
    return newSavedFood;
  }

  async deleteSavedFood(userId: string, fdcId: string): Promise<boolean> {
    try {
      await prisma.savedFood.delete({
        where: {
          userId_fdcId: {
            userId,
            fdcId
          }
        }
      });
      return true;
    } catch (error) {
      console.error("Delete saved food error:", error);
      return false;
    }
  }

  async isFoodSaved(userId: string, fdcId: string): Promise<boolean> {
    const [savedFood] = await prisma.savedFood.findMany({
      where: {
        userId,
        fdcId
      }
    });
    return !!savedFood;
  }

  async getUserSavedFoods(userId: string, limit?: number, offset?: number): Promise<SavedFood[]> {
    let query = prisma.savedFood.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    query = paginate(query, limit, offset);
    return query;
  }

  // Client session operations
  async getClientSession(sessionToken: string): Promise<ClientSession | undefined> {
    const [session] = await prisma.clientsSession.findMany({ where: { sessionToken } });
    return session;
  }

  async createClientSession(session: InsertClientSession): Promise<ClientSession> {
    const [newSession] = await prisma.clientsSession.create({
      data: {
        ...session,
        createdAt: new Date(),
        lastActivity: new Date()
      }
    }).returning();
    return newSession;
  }

  // Client Portal operations
  async getClientByAccessCode(accessCode: string): Promise<Client | undefined> {
    const [client] = await prisma.clients.findMany({ where: { access_code: accessCode } });
    return client;
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
    await prisma.clients.update({
      where: { id: clientId },
      data: { access_code: code }
    });
    
    return code;
  }
  
  async updateClientAccessCode(clientId: number, accessCode: string): Promise<boolean> {
    try {
      await prisma.clients.update({
        where: { id: clientId },
        data: { access_code: accessCode }
      });
      
      return true;
    } catch (error) {
      console.error('Update client access code error:', error);
      return false;
    }
  }

  async updateClientSessionActivity(sessionToken: string): Promise<boolean> {
    try {
      await prisma.clientsSession.update({
        where: { sessionToken },
        data: { lastActivity: new Date() }
      });
      
      return true;
    } catch (error) {
      console.error('Update session activity error:', error);
      return false;
    }
  }

  async deleteClientSession(sessionToken: string): Promise<boolean> {
    try {
      await prisma.clientsSession.delete({ where: { sessionToken } });
      
      return true;
    } catch (error) {
      console.error('Delete client session error:', error);
      return false;
    }
  }

  async deleteExpiredSessions(): Promise<void> {
    await prisma.clientsSession.deleteMany({
      where: { expiresAt: { lt: new Date() } }
    });
  }

  // Appointment operations
  async getAppointment(id: number): Promise<Appointment | undefined> {
    try {
      const [appointment] = await prisma.appointment.findMany({ where: { id } });
      return appointment;
    } catch (error) {
      console.error('Error getting appointment:', error);
      throw error;
    }
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    try {
      const validUserId = safeUUIDConversion(appointment.userId);
      const [newAppointment] = await prisma.appointment.create({
        data: {
          ...appointment,
          userId: validUserId,
          createdAt: new Date(),
          updatedAt: new Date()
        }
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
      const [updatedAppointment] = await prisma.appointment.update({
        where: { id },
        data: {
          ...appointment,
          userId: validUserId,
          updatedAt: new Date()
        }
      }).returning();
      return updatedAppointment;
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  }

  async deleteAppointment(id: number): Promise<void> {
    await prisma.appointment.delete({ where: { id } });
  }

  async getClientAppointments(clientId: number, limit?: number, offset?: number): Promise<Appointment[]> {
    let query = prisma.appointment.findMany({
      where: { client_id: clientId },
      orderBy: { date: 'desc' }
    });
    query = paginate(query, limit, offset);
    return query;
  }

  async getUserAppointments(userId: string, limit?: number, offset?: number): Promise<Appointment[]> {
    try {
      const validUserId = safeUUIDConversion(userId);
      const query = prisma.appointment.findMany({
        where: { userId: validUserId },
        orderBy: { date: 'desc' }
      });
      return await paginate(query, limit, offset);
    } catch (error) {
      console.error('Error getting user appointments:', error);
      throw error;
    }
  }

  // Message operations
  async getMessage(id: number): Promise<Message | undefined> {
    const [message] = await prisma.message.findMany({ where: { id } });
    return message;
  }

  async getMessageById(id: number): Promise<Message | undefined> {
    return this.getMessage(id);
  }

  async getMessages(clientId: number, userId: string): Promise<Message[]> {
    try {
      const validUserId = safeUUIDConversion(userId);
      const query = prisma.message.findMany({
        where: {
          client_id: clientId,
          userId: validUserId
        },
        orderBy: { createdAt: 'desc' }
      });
      return query;
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await prisma.message.create({
      data: {
        ...message,
        createdAt: new Date()
      }
    }).returning();
    return newMessage;
  }

  async updateMessage(id: number, message: Partial<Message>): Promise<Message> {
    const [updatedMessage] = await prisma.message.update({
      where: { id },
      data: message
    }).returning();
    return updatedMessage;
  }

  async deleteMessage(id: number): Promise<void> {
    await prisma.message.delete({ where: { id } });
  }

  async getClientMessages(clientId: number, limit?: number, offset?: number): Promise<Message[]> {
    let query = prisma.message.findMany({
      where: { client_id: clientId },
      orderBy: { createdAt: 'desc' }
    });
    query = paginate(query, limit, offset);
    return query;
  }

  async getUserMessages(userId: string, limit?: number, offset?: number): Promise<Message[]> {
    try {
      const validUserId = safeUUIDConversion(userId);
      const query = prisma.message.findMany({
        where: { userId: validUserId },
        orderBy: { createdAt: 'desc' }
      });
      return await paginate(query, limit, offset);
    } catch (error) {
      console.error('Error getting user messages:', error);
      throw error;
    }
  }

  // Mesajı okundu olarak işaretle
  async markMessageAsRead(messageId: number): Promise<boolean> {
    try {
      await prisma.message.update({
        where: { id: messageId },
        data: { isRead: true }
      });
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
      await prisma.message.updateMany({
        where: {
          client_id: clientId,
          userId: validUserId
        },
        data: { isRead: true }
      });
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
      const [result] = await prisma.message.count({ where: { AND: conditions } });
      return Number(result);
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
    const [lastMessage] = await prisma.message.findMany({
      where: { client_id: clientId },
      orderBy: { createdAt: 'desc' },
      take: 1
    });
    
    return lastMessage;
  }

  // Tüm danışanlar için son mesajları getir
  async getLastMessagesForAllClients(userId: string): Promise<any[]> {
    try {
      const validUserId = safeUUIDConversion(userId);
      return await prisma.message.findMany({
        select: {
          client_id: true,
          content: true,
          createdAt: true,
          isRead: true
        },
        where: { userId: validUserId },
        orderBy: { createdAt: 'desc' },
        groupBy: { client_id, content, createdAt, isRead }
      });
    } catch (error) {
      console.error('Error getting last messages for all clients:', error);
      throw error;
    }
  }

  // Birden fazla mesajı okundu olarak işaretle
  async markMultipleMessagesAsRead(messageIds: number[]): Promise<boolean> {
    try {
      await prisma.message.updateMany({
        where: { id: { in: messageIds } },
        data: { isRead: true }
      });
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
      await prisma.message.deleteMany({
        where: {
          client_id: clientId,
          userId: validUserId
        }
      });
      return true;
    } catch (error) {
      console.error('Error deleting messages:', error);
      return false;
    }
  }

  // Notification operations
  async getNotification(id: number): Promise<Notification | undefined> {
    const [notification] = await prisma.notification.findMany({ where: { id } });
    return notification;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await prisma.notification.create({
      data: {
        ...notification,
        createdAt: new Date()
      }
    }).returning();
    return newNotification;
  }

  async updateNotification(id: number, notification: Partial<Notification>): Promise<Notification> {
    const [updatedNotification] = await prisma.notification.update({
      where: { id },
      data: notification
    }).returning();
    return updatedNotification;
  }

  async deleteNotification(id: number): Promise<void> {
    await prisma.notification.delete({ where: { id } });
  }

  async getUserNotifications(userId: string, limit?: number, offset?: number): Promise<Notification[]> {
    try {
      const validUserId = safeUUIDConversion(userId);
      const query = prisma.notification.findMany({
        where: { userId: validUserId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });
      return query;
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  async getNotificationById(id: number): Promise<Notification | undefined> {
    const [notification] = await prisma.notification.findMany({ where: { id } });
    return notification;
  }

  async getNotificationsByUserId(userId: string, options?: NotificationOptions): Promise<Notification[]> {
    try {
      const validUserId = safeUUIDConversion(userId);
      const conditions = [
        { userId: validUserId },
        { type: options?.type },
        { isRead: options?.isRead }
      ];

      const query = prisma.notification.findMany({
        where: { AND: conditions },
        orderBy: { createdAt: 'desc' },
        take: options?.limit,
        skip: options?.offset
      });

      return query;
    } catch (error) {
      console.error('Error getting notifications by user ID:', error);
      throw error;
    }
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    try {
      const validUserId = safeUUIDConversion(userId);
      const result = await prisma.notification.count({
        where: {
          userId: validUserId,
          isRead: false
        }
      });
      return Number(result);
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      throw error;
    }
  }

  async markNotificationAsRead(id: number): Promise<Notification> {
    const [updatedNotification] = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    }).returning();
    return updatedNotification;
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    try {
      const validUserId = safeUUIDConversion(userId);
      await prisma.notification.updateMany({
        where: { userId: validUserId },
        data: { isRead: true }
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async deleteAllNotifications(userId: string): Promise<void> {
    try {
      const validUserId = safeUUIDConversion(userId);
      await prisma.notification.deleteMany({ where: { userId: validUserId } });
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      throw error;
    }
  }

  // Bir danışanın son ölçümünü getir
  async getLastMeasurement(clientId: number): Promise<Measurement | undefined> {
    try {
      const [measurement] = await prisma.measurement.findMany({
        where: { client_id: clientId },
        orderBy: { date: 'desc' },
        take: 1
      });
      return measurement;
    } catch (error) {
      console.error("Error fetching last measurement:", error);
      return undefined;
    }
  }

  // Bir danışanın tüm ölçümlerini getir
  async getMeasurements(clientId: number): Promise<Measurement[]> {
    try {
      return await prisma.measurement.findMany({
        where: { client_id: clientId },
        orderBy: { date: 'desc' }
      });
    } catch (error) {
      console.error("Error fetching measurements:", error);
      return [];
    }
  }

  // Randevuları getir
  async getAppointments(clientId?: number): Promise<Appointment[]> {
    try {
      if (clientId) {
        return await prisma.appointment.findMany({
          where: { client_id: clientId },
          orderBy: { date: 'desc' }
        });
      } else {
        return await prisma.appointment.findMany({
          orderBy: { date: 'desc' }
        });
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
    return await prisma.clientNote.findMany({
      where: { client_id: clientId },
      orderBy: { created_at: 'desc' }
    });
  }

  // Çoklu notlar: yeni not ekle
  async addClientNote(clientId: number, userId: string, content: string): Promise<any> {
    const [note] = await prisma.clientNote.create({
      data: {
        client_id: clientId,
        user_id: userId,
        content,
        created_at: new Date()
      }
    }).returning();
    return note;
  }

  // Çoklu notlar: not sil
  async deleteClientNote(noteId: number): Promise<void> {
    await prisma.clientNote.delete({ where: { id: noteId } });
  }

  // Session operations
  async createSession(userId: string, token: string, expires: Date): Promise<void> {
    try {
      await db.insert(sessions).values({
        user_id: userId,
        token: token,
        expires: expires,
        created_at: new Date()
      });
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async getSession(token: string): Promise<any> {
    try {
      const [session] = await db.select()
        .from(sessions)
        .where(eq(sessions.token, token))
        .leftJoin(users, eq(sessions.user_id, users.id));
      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      throw error;
    }
  }

  async deleteSession(token: string): Promise<void> {
    try {
      await db.delete(sessions).where(eq(sessions.token, token));
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }

  async deleteExpiredSessions(): Promise<void> {
    await db.delete(sessions).where(
      sql`${sessions.expires} < NOW()`
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
    const [notification] = await prisma.notification.create({
      data: { ...data, userId: validUserId },
      returning: true
    });
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}
