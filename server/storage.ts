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
  type InsertNotification
} from "@shared/schema";
import { db } from "./db";
import { and, desc, eq, sql, count, inArray, like } from "drizzle-orm";
import { json } from "drizzle-orm/pg-core";

// Helper function for pagination
function paginate<T>(query: T, limit?: number, offset?: number): T {
  if (limit !== undefined) {
    query = (query as any).limit(limit);
  }
  if (offset !== undefined) {
    query = (query as any).offset(offset);
  }
  return query;
}

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  getAllUsers(limit?: number, offset?: number): Promise<User[]>;
  updateUserSubscription(
    id: number,
    subscription: { subscriptionStatus?: string, subscriptionPlan?: string | null, subscriptionStartDate?: Date | null, subscriptionEndDate?: Date | null }
  ): Promise<User>;

  // Client operations
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<Client>): Promise<Client>;
  deleteClient(id: number): Promise<void>;
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

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values({
      ...user,
      role: "user",
      subscriptionStatus: "free",
      subscriptionPlan: null,
      subscriptionStartDate: null,
      subscriptionEndDate: null,
      createdAt: new Date()
    }).returning();

    return newUser;
  }

  async updateUser(id: number, user: Partial<User>): Promise<User> {
    const [updatedUser] = await db.update(users)
      .set(user)
      .where(eq(users.id, id))
      .returning();

    return updatedUser;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getAllUsers(limit?: number, offset?: number): Promise<User[]> {
    let query = db.select().from(users).orderBy(desc(users.createdAt));
    
    query = paginate(query, limit, offset);

    return query;
  }

  async updateUserSubscription(
    id: number,
    subscription: { subscriptionStatus?: string, subscriptionPlan?: string | null, subscriptionStartDate?: Date | null, subscriptionEndDate?: Date | null }
  ): Promise<User> {
    if (!subscription || Object.keys(subscription).length === 0) {
      throw new Error("No subscription fields provided for update");
    }
    const [updatedUser] = await db.update(users)
      .set(subscription)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Client operations
  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db.insert(clients).values({
      ...client,
      height: client.height !== undefined ? sql`${client.height}::numeric(5,2)` : null,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    return newClient;
  }

  async updateClient(id: number, client: Partial<Client>): Promise<Client> {
    console.log("updateClient - Gelen veri:", client);
    console.log("updateClient - Boy değeri tipi:", typeof client.height);
    console.log("updateClient - Boy değeri:", client.height);

    // Create a copy of the client object to avoid modifying the original
    let updatedData = { ...client };

    // Handle height separately if it exists
    if (updatedData.height !== undefined) {
      console.log("updateClient - Boy güncellemesi başlıyor");
      console.log("updateClient - SQL öncesi boy değeri:", updatedData.height);
      
      // Use raw SQL to ensure proper numeric type handling
      await db.execute(sql`
        UPDATE clients 
        SET height = ${updatedData.height}::numeric(5,2)
        WHERE id = ${id}
      `);
      
      console.log("updateClient - Boy SQL sorgusu tamamlandı");
      
      // Remove height from the update object since we handled it separately
      const { height, ...restData } = updatedData;
      updatedData = restData;
    }

    console.log("updateClient - Diğer alanlar için güncellenecek veri:", updatedData);

    // Update remaining fields and get the updated client
    const [updatedClient] = await db.update(clients)
      .set({
        ...updatedData,
        updatedAt: new Date()
      })
      .where(eq(clients.id, id))
      .returning();

    // Get the updated client with all fields to ensure we have the correct height
    const [finalClient] = await db.select()
      .from(clients)
      .where(eq(clients.id, id));

    console.log("updateClient - Son danışan durumu:", finalClient);

    return finalClient;
  }

  // Danışan silme işlemi: Ölçümler, randevular, mesajlar, bildirimler ve oturumlar silinir
  async deleteClient(id: number): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        // Önce ölçümleri sil
        await tx.delete(measurements).where(eq(measurements.clientId, id));
        // Sonra randevuları sil
        await tx.delete(appointments).where(eq(appointments.clientId, id));
        // Sonra mesajları sil
        await tx.delete(messages).where(eq(messages.clientId, id));
        // Sonra bildirimleri sil
        await tx.delete(notifications).where(eq(notifications.clientId, id));
        // Sonra client sessionları sil
        await tx.delete(clientSessions).where(eq(clientSessions.clientId, id));
        // En son danışanı sil
        await tx.delete(clients).where(eq(clients.id, id));
      });
    } catch (error) {
      console.error("Error deleting client:", error);
      throw new Error("Danışan silinirken bir hata oluştu. Lütfen tekrar deneyin.");
    }
  }

  async getAllClients(userId: number, limit?: number, offset?: number): Promise<Client[]> {
    let query = db.select()
      .from(clients)
      .where(eq(clients.userId, userId))
      .orderBy(desc(clients.createdAt));
    
    query = paginate(query, limit, offset);

    return query;
  }

  // getClients metodu - getAllClients metodunu kullanarak hem userId alan hem de almayan hali destekler
  async getClients(userId?: number, limit?: number, offset?: number): Promise<Client[]> {
    if (userId) {
      return this.getAllClients(userId, limit, offset);
    } else {
      // Admin için tüm danışanları getir (userId filtresi olmadan)
      let query = db.select()
        .from(clients)
        .orderBy(desc(clients.createdAt));
      
      query = paginate(query, limit, offset);
      return query;
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
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

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

  async getUserDietPlans(userId: number, limit?: number, offset?: number): Promise<DietPlan[]> {
    let query = db.select()
      .from(dietPlans)
      .where(eq(dietPlans.userId, userId))
      .orderBy(desc(dietPlans.createdAt));
    
    query = paginate(query, limit, offset);

    return query;
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
  async getSavedFood(id: number): Promise<SavedFood | undefined> {
    const [savedFood] = await db.select().from(savedFoods).where(eq(savedFoods.id, id));
    return savedFood;
  }

  async createSavedFood(savedFood: InsertSavedFood): Promise<SavedFood> {
    const [newSavedFood] = await db.insert(savedFoods).values({
      ...savedFood,
      createdAt: new Date()
    }).returning();

    return newSavedFood;
  }

  async deleteSavedFood(id: number): Promise<void> {
    await db.delete(savedFoods).where(eq(savedFoods.id, id));
  }

  async getUserSavedFoods(userId: number, limit?: number, offset?: number): Promise<SavedFood[]> {
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
      .where(eq(clients.accessCode, accessCode));
    
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
      .set({ accessCode: code })
      .where(eq(clients.id, clientId));
    
    return code;
  }
  
  // Update client access code
  async updateClientAccessCode(clientId: number, accessCode: string): Promise<boolean> {
    try {
      await db
        .update(clients)
        .set({ accessCode: accessCode })
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
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id));
    return appointment;
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [newAppointment] = await db.insert(appointments).values({
      ...appointment,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    return newAppointment;
  }

  async updateAppointment(id: number, appointment: Partial<Appointment>): Promise<Appointment> {
    const [updatedAppointment] = await db.update(appointments)
      .set({
        ...appointment,
        updatedAt: new Date()
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
      .where(eq(appointments.clientId, clientId))
      .orderBy(desc(appointments.date));
    
    query = paginate(query, limit, offset);

    return query;
  }

  async getUserAppointments(userId: number, limit?: number, offset?: number): Promise<Appointment[]> {
    let query = db.select()
      .from(appointments)
      .where(eq(appointments.userId, userId))
      .orderBy(desc(appointments.date));
    
    query = paginate(query, limit, offset);

    return query;
  }

  // Message operations
  async getMessage(id: number): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message;
  }

  // getMessageById - getMessage ile aynı işlevi görür
  async getMessageById(id: number): Promise<Message | undefined> {
    return this.getMessage(id);
  }

  // Bir danışan ile ilgili tüm mesajları getir
  async getMessages(clientId: number, userId: number): Promise<Message[]> {
    return db.select()
      .from(messages)
      .where(eq(messages.clientId, clientId))
      .orderBy(desc(messages.createdAt));
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

  async getUserMessages(userId: number, limit?: number, offset?: number): Promise<Message[]> {
    let query = db.select()
      .from(messages)
      .where(eq(messages.userId, userId))
      .orderBy(desc(messages.createdAt));
    
    query = paginate(query, limit, offset);

    return query;
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
  async markAllClientMessagesAsRead(clientId: number, userId: number): Promise<boolean> {
    try {
      await db.update(messages)
        .set({ isRead: true })
        .where(
          and(
            eq(messages.clientId, clientId),
            eq(messages.userId, userId),
            eq(messages.isRead, false)
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
    
    if (clientId) conditions.push(eq(messages.clientId, clientId));
    if (userId) conditions.push(eq(messages.userId, userId));
    if (forClient !== undefined) conditions.push(eq(messages.fromClient, !forClient));
    
    conditions.push(eq(messages.isRead, false));
    
    const [result] = await db
      .select({ count: count() })
      .from(messages)
      .where(and(...conditions));
    
    return result.count || 0;
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
      .where(eq(messages.clientId, clientId))
      .orderBy(desc(messages.createdAt))
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
          clientName: `${client.firstName} ${client.lastName}`,
          lastMessage: lastMessage || null
        };
      })
    );
    
    return lastMessages;
  }

  // Birden fazla mesajı okundu olarak işaretle
  async markMultipleMessagesAsRead(messageIds: number[]): Promise<boolean> {
    try {
      for (const id of messageIds) {
        await db.update(messages)
          .set({ isRead: true })
          .where(eq(messages.id, id));
      }
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
            eq(messages.clientId, clientId),
            eq(messages.userId, userId)
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
      createdAt: new Date()
    }).returning();

    return newNotification;
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
      content: `${client.firstName} ${client.lastName} ile ${new Date(appointment.date).toLocaleDateString('tr-TR')} tarihinde ${new Date(appointment.startTime).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})} saatinde randevunuz var.`,
      type: "appointment",
      relatedId: appointmentId,
      isRead: false,
      scheduledFor: scheduledFor
    };
    
    return this.createNotification(notification);
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
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
    
    query = paginate(query, limit, offset);

    return query;
  }

  // Bir danışanın son ölçümünü getir
  async getLastMeasurement(clientId: number): Promise<Measurement | undefined> {
    const [measurement] = await db.select()
      .from(measurements)
      .where(eq(measurements.clientId, clientId))
      .orderBy(desc(measurements.date))
      .limit(1);
    return measurement;
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
        // Tüm randevuları getir
        return await db.select()
          .from(appointments)
          .orderBy(desc(appointments.date));
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      return [];
    }
  }
}

// Export a single instance of DatabaseStorage
export const storage = new DatabaseStorage();
