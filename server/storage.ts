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
import { and, desc, eq, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserSubscription(id: number, updates: {
    subscriptionStatus?: string;
    subscriptionPlan?: string;
    subscriptionStartDate?: Date;
    subscriptionEndDate?: Date;
  }): Promise<User>;
  
  // Notification methods
  getNotificationsByUserId(userId: number): Promise<Notification[]>;
  getNotificationById(id: number): Promise<Notification | undefined>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<boolean>;
  markAllNotificationsAsRead(userId: number): Promise<boolean>;
  getUnreadNotificationCount(userId: number): Promise<number>;
  createAppointmentReminder(appointmentId: number, scheduleFor: Date): Promise<Notification>;
  createMessageNotification(messageId: number, recipientId: number, isClient: boolean): Promise<Notification>;
  
  // Admin - User Management methods
  getAllUsers(limit?: number, offset?: number): Promise<User[]>;
  countUsers(): Promise<number>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Client methods
  getClients(userId?: number, limit?: number): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, updates: Partial<Client>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;
  
  // Client Portal methods
  getClientByAccessCode(accessCode: string): Promise<Client | undefined>;
  generateClientAccessCode(clientId: number): Promise<string>;
  updateClientAccessCode(clientId: number, accessCode: string): Promise<boolean>;
  
  // Client Session management
  createClientSession(session: InsertClientSession): Promise<ClientSession>;
  getClientSession(sessionToken: string): Promise<ClientSession | undefined>;
  updateClientSessionActivity(sessionToken: string): Promise<boolean>;
  deleteClientSession(sessionToken: string): Promise<boolean>;
  
  // Measurement methods
  getMeasurements(clientId: number): Promise<Measurement[]>;
  getMeasurement(id: number): Promise<Measurement | undefined>;
  createMeasurement(measurement: InsertMeasurement): Promise<Measurement>;
  updateMeasurement(id: number, updates: Partial<Measurement>): Promise<Measurement | undefined>;
  deleteMeasurement(id: number): Promise<boolean>;
  
  // Diet Plan methods
  getDietPlans(userId?: number, limit?: number): Promise<DietPlan[]>;
  getDietPlan(id: number): Promise<DietPlan | undefined>;
  createDietPlan(dietPlan: InsertDietPlan): Promise<DietPlan>;
  updateDietPlan(id: number, updates: Partial<DietPlan>): Promise<DietPlan | undefined>;
  deleteDietPlan(id: number): Promise<boolean>;
  
  // Food methods
  getFoods(limit?: number, offset?: number): Promise<Food[]>;
  getFoodById(fdcId: string): Promise<Food | undefined>;
  createFood(food: InsertFood): Promise<Food>;
  searchFoods(query: string, page?: number, pageSize?: number): Promise<{ foods: Food[], totalHits: number }>;
  getRecentFoods(limit?: number): Promise<Food[]>;
  
  // Saved Foods methods
  getSavedFoods(userId?: number): Promise<Food[]>;
  saveFood(data: InsertSavedFood): Promise<SavedFood>;
  removeSavedFood(userId: number, fdcId: string): Promise<boolean>;
  isFoodSaved(userId: number, fdcId: string): Promise<boolean>;
  
  // Food Nutrients methods
  getFoodNutrients(fdcId: string): Promise<FoodNutrient[]>;
  createFoodNutrient(nutrient: InsertFoodNutrient): Promise<FoodNutrient>;
  createFoodNutrients(nutrients: InsertFoodNutrient[]): Promise<FoodNutrient[]>;
  
  // Appointment methods
  getAppointments(clientId?: number, userId?: number): Promise<Appointment[]>;
  getAppointmentById(id: number): Promise<Appointment | undefined>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, updates: Partial<Appointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: number): Promise<boolean>;
  
  // Message methods
  getMessages(clientId: number, userId: number): Promise<Message[]>;
  getMessageById(id: number): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<boolean>;
  getUnreadMessages(clientId?: number, userId?: number): Promise<number>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private notifications = new Map<number, Notification>();
  private notificationIdCounter = 1;
  // Client Portal methods
  async getClientByAccessCode(accessCode: string): Promise<Client | undefined> {
    for (const client of this.clients.values()) {
      if (client.accessCode === accessCode) {
        return client;
      }
    }
    return undefined;
  }
  
  async generateClientAccessCode(clientId: number): Promise<string> {
    const client = await this.getClient(clientId);
    if (!client) {
      throw new Error("Danışan bulunamadı");
    }
    
    // 6 karakterli alfanumerik rastgele bir kod oluştur
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let accessCode = '';
    for (let i = 0; i < 6; i++) {
      accessCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Danışanı güncelleyerek erişim kodunu kaydet
    const updatedClient = await this.updateClient(clientId, { accessCode });
    if (!updatedClient) {
      throw new Error("Erişim kodu güncellenemedi");
    }
    
    return accessCode;
  }
  
  async updateClientAccessCode(clientId: number, accessCode: string): Promise<boolean> {
    const client = await this.getClient(clientId);
    if (!client) {
      return false;
    }
    
    await this.updateClient(clientId, { accessCode });
    return true;
  }
  
  // Client Session management
  async createClientSession(session: InsertClientSession): Promise<ClientSession> {
    const newSession: ClientSession = {
      ...session,
      lastActivity: new Date()
    };
    
    this.clientSessions.set(session.sessionToken, newSession);
    return newSession;
  }
  
  async getClientSession(sessionToken: string): Promise<ClientSession | undefined> {
    const session = this.clientSessions.get(sessionToken);
    return session;
  }
  
  async updateClientSessionActivity(sessionToken: string): Promise<boolean> {
    const session = this.clientSessions.get(sessionToken);
    if (!session) {
      return false;
    }
    
    session.lastActivity = new Date();
    this.clientSessions.set(sessionToken, session);
    return true;
  }
  
  async deleteClientSession(sessionToken: string): Promise<boolean> {
    return this.clientSessions.delete(sessionToken);
  }
  private users: Map<number, User>;
  private clients: Map<number, Client>;
  private measurements: Map<number, Measurement>;
  private dietPlans: Map<number, DietPlan>;
  private foods: Map<string, Food>;
  private savedFoods: Map<number, SavedFood>;
  private foodNutrients: Map<number, FoodNutrient>;
  private clientSessions: Map<string, ClientSession>;
  private appointments: Map<number, Appointment>;
  private messages: Map<number, Message>;
  
  private userIdCounter: number;
  private clientIdCounter: number;
  private measurementIdCounter: number;
  private dietPlanIdCounter: number;
  private savedFoodIdCounter: number;
  private foodNutrientIdCounter: number;
  private appointmentIdCounter: number;
  private messageIdCounter: number;
  private recentViews: string[];

  constructor() {
    this.users = new Map();
    this.clients = new Map();
    this.measurements = new Map();
    this.dietPlans = new Map();
    this.foods = new Map();
    this.savedFoods = new Map();
    this.foodNutrients = new Map();
    this.clientSessions = new Map();
    this.appointments = new Map();
    this.messages = new Map();
    
    this.userIdCounter = 1;
    this.clientIdCounter = 1;
    this.measurementIdCounter = 1;
    this.dietPlanIdCounter = 1;
    this.savedFoodIdCounter = 1;
    this.foodNutrientIdCounter = 1;
    this.appointmentIdCounter = 1;
    this.messageIdCounter = 1;
    this.recentViews = [];
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt, 
      role: "user",
      subscriptionStatus: "free",
      subscriptionPlan: null,
      subscriptionStartDate: null,
      subscriptionEndDate: null
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUserSubscription(id: number, updates: {
    subscriptionStatus?: string;
    subscriptionPlan?: string;
    subscriptionStartDate?: Date;
    subscriptionEndDate?: Date;
  }): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    
    const updatedUser = {
      ...user,
      ...updates
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Client methods
  async getClients(userId?: number, limit?: number): Promise<Client[]> {
    let clients = Array.from(this.clients.values());
    
    if (userId) {
      clients = clients.filter(client => client.userId === userId);
    }
    
    // Sort by creation date (newest first)
    clients.sort((a, b) => {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
    
    if (limit) {
      clients = clients.slice(0, limit);
    }
    
    return clients;
  }

  async getClient(id: number): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = this.clientIdCounter++;
    const createdAt = new Date();
    const client: Client = { ...insertClient, id, createdAt };
    this.clients.set(id, client);
    return client;
  }

  async updateClient(id: number, updates: Partial<Client>): Promise<Client | undefined> {
    const existingClient = this.clients.get(id);
    if (!existingClient) return undefined;
    
    const updatedClient = {
      ...existingClient,
      ...updates,
      updatedAt: new Date()
    };
    
    this.clients.set(id, updatedClient);
    return updatedClient;
  }

  async deleteClient(id: number): Promise<boolean> {
    return this.clients.delete(id);
  }

  // Measurement methods
  async getMeasurements(clientId: number): Promise<Measurement[]> {
    let measurements = Array.from(this.measurements.values());
    
    measurements = measurements.filter(m => m.clientId === clientId);
    
    // Sort by date (newest first)
    measurements.sort((a, b) => {
      return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
    });
    
    return measurements;
  }

  async getMeasurement(id: number): Promise<Measurement | undefined> {
    return this.measurements.get(id);
  }

  async createMeasurement(insertMeasurement: InsertMeasurement): Promise<Measurement> {
    const id = this.measurementIdCounter++;
    const createdAt = new Date();
    const updatedAt = new Date();
    
    // Şema gereksinimlerine uygun olarak zorunlu alanları dolduralım
    const measurement: Measurement = { 
      ...insertMeasurement, 
      id, 
      createdAt,
      updatedAt,
      // Null ya da undefined değerler için varsayılan değerler belirleme
      notes: insertMeasurement.notes || null,
      bodyFatPercentage: insertMeasurement.bodyFatPercentage || null,
      waistCircumference: insertMeasurement.waistCircumference || null,
      hipCircumference: insertMeasurement.hipCircumference || null,
      chestCircumference: insertMeasurement.chestCircumference || null,
      armCircumference: insertMeasurement.armCircumference || null,
      thighCircumference: insertMeasurement.thighCircumference || null,
      calfCircumference: insertMeasurement.calfCircumference || null,
      basalMetabolicRate: insertMeasurement.basalMetabolicRate || null,
      totalDailyEnergyExpenditure: insertMeasurement.totalDailyEnergyExpenditure || null,
      activityLevel: insertMeasurement.activityLevel || null
    };
    
    this.measurements.set(id, measurement);
    console.log("Measurement created:", measurement);
    
    return measurement;
  }

  async updateMeasurement(id: number, updates: Partial<Measurement>): Promise<Measurement | undefined> {
    const existingMeasurement = this.measurements.get(id);
    if (!existingMeasurement) return undefined;
    
    console.log("Updating measurement:", id);
    console.log("Original measurement:", JSON.stringify(existingMeasurement, null, 2));
    console.log("Updates received:", JSON.stringify(updates, null, 2));
    
    // Sayısal değerler için güvenli dönüşüm fonksiyonu
    const safeNumberToString = (value: any): string | null => {
      if (value === null || value === undefined || value === '') return null;
      try {
        // Önce number'a çevir, sonra string'e çevir - bu NaN değerleri yakalar
        const num = Number(value);
        return isNaN(num) ? null : String(num);
      } catch (e) {
        console.error(`Sayısal dönüşüm hatası: ${value}`, e);
        return null;
      }
    };
    
    // Güvenli bir şekilde güncellemeleri işle
    const safeUpdates: Partial<Measurement> = {};
    
    // Tarih güncellemesi
    if (updates.date !== undefined) {
      safeUpdates.date = updates.date;
    }
    
    // Temel ölçümler (weight, height)
    if (updates.weight !== undefined) {
      safeUpdates.weight = safeNumberToString(updates.weight) || "0";
    }
    
    if (updates.height !== undefined) {
      safeUpdates.height = safeNumberToString(updates.height) || "0";
    }
    
    // BMI'yi yeniden hesapla veya varsa güncelle
    if (updates.bmi !== undefined) {
      safeUpdates.bmi = safeNumberToString(updates.bmi) || "0";
    } else if (updates.weight !== undefined || updates.height !== undefined) {
      // Ağırlık veya boy değişmişse BMI'yi yeniden hesapla
      const weight = parseFloat(safeUpdates.weight || existingMeasurement.weight || "0");
      const height = parseFloat(safeUpdates.height || existingMeasurement.height || "0") / 100; // cm'den m'ye çevir
      if (height > 0) {
        const bmi = weight / (height * height);
        safeUpdates.bmi = String(Math.round(bmi * 10) / 10); // 1 ondalık basamakla yuvarla
      } else {
        safeUpdates.bmi = "0";
      }
    }
    
    // İsteğe bağlı ölçümler - güvenli null/string dönüşümleri
    const optionalFields = [
      'bodyFatPercentage', 'waistCircumference', 'hipCircumference',
      'chestCircumference', 'armCircumference', 'thighCircumference',
      'calfCircumference', 'basalMetabolicRate', 'totalDailyEnergyExpenditure'
    ];
    
    for (const field of optionalFields) {
      if (field in updates) {
        safeUpdates[field as keyof Measurement] = safeNumberToString(updates[field as keyof Measurement]) as any;
      }
    }
    
    // Aktivite seviyesi, notlar gibi string alanları
    if (updates.activityLevel !== undefined) {
      safeUpdates.activityLevel = updates.activityLevel;
    }
    
    if (updates.notes !== undefined) {
      safeUpdates.notes = updates.notes;
    }
    
    // clientId değişmez
    // clientId'nin mevcut değeri korunmalı
    
    // updatedAt'i güncelle
    safeUpdates.updatedAt = new Date();
    
    console.log("Safe updates:", JSON.stringify(safeUpdates, null, 2));
    
    const updatedMeasurement = {
      ...existingMeasurement,
      ...safeUpdates
    };
    
    console.log("Updated measurement:", JSON.stringify(updatedMeasurement, null, 2));
    
    this.measurements.set(id, updatedMeasurement);
    return updatedMeasurement;
  }

  async deleteMeasurement(id: number): Promise<boolean> {
    return this.measurements.delete(id);
  }

  // Diet Plan methods
  async getDietPlans(userId?: number, limit?: number): Promise<DietPlan[]> {
    let plans = Array.from(this.dietPlans.values());
    
    if (userId) {
      plans = plans.filter(plan => plan.userId === userId);
    }
    
    // Sort by creation date (newest first)
    plans.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    if (limit) {
      plans = plans.slice(0, limit);
    }
    
    return plans;
  }

  async getDietPlan(id: number): Promise<DietPlan | undefined> {
    return this.dietPlans.get(id);
  }

  async createDietPlan(insertDietPlan: InsertDietPlan): Promise<DietPlan> {
    const id = this.dietPlanIdCounter++;
    const createdAt = new Date();
    const updatedAt = new Date();
    const dietPlan: DietPlan = { ...insertDietPlan, id, createdAt, updatedAt };
    this.dietPlans.set(id, dietPlan);
    return dietPlan;
  }

  async updateDietPlan(id: number, updates: Partial<DietPlan>): Promise<DietPlan | undefined> {
    const existingPlan = this.dietPlans.get(id);
    if (!existingPlan) return undefined;
    
    const updatedPlan = { 
      ...existingPlan, 
      ...updates, 
      updatedAt: new Date() 
    };
    
    this.dietPlans.set(id, updatedPlan);
    return updatedPlan;
  }

  async deleteDietPlan(id: number): Promise<boolean> {
    return this.dietPlans.delete(id);
  }

  // Food methods
  async getFoods(limit = 20, offset = 0): Promise<Food[]> {
    const foods = Array.from(this.foods.values());
    return foods.slice(offset, offset + limit);
  }

  async getFoodById(fdcId: string): Promise<Food | undefined> {
    const food = this.foods.get(fdcId);
    
    // Add to recent views if found
    if (food) {
      this.addToRecentViews(fdcId);
    }
    
    return food;
  }

  async createFood(insertFood: InsertFood): Promise<Food> {
    const createdAt = new Date();
    const food: Food = { ...insertFood, createdAt };
    this.foods.set(insertFood.fdcId, food);
    return food;
  }

  async searchFoods(query: string, page = 1, pageSize = 20): Promise<{ foods: Food[], totalHits: number }> {
    const allFoods = Array.from(this.foods.values());
    
    const matchingFoods = allFoods.filter(food => {
      const searchText = `${food.description} ${food.brandName || ''} ${food.foodCategory || ''}`.toLowerCase();
      return searchText.includes(query.toLowerCase());
    });
    
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedFoods = matchingFoods.slice(startIndex, endIndex);
    
    return {
      foods: paginatedFoods,
      totalHits: matchingFoods.length
    };
  }

  async getRecentFoods(limit = 5): Promise<Food[]> {
    const recentFoods: Food[] = [];
    
    for (const fdcId of this.recentViews) {
      const food = this.foods.get(fdcId);
      if (food) {
        recentFoods.push(food);
        if (recentFoods.length >= limit) break;
      }
    }
    
    return recentFoods;
  }

  // Track recently viewed foods
  private addToRecentViews(fdcId: string): void {
    // Remove if already exists to avoid duplicates
    this.recentViews = this.recentViews.filter(id => id !== fdcId);
    
    // Add to beginning of array
    this.recentViews.unshift(fdcId);
    
    // Limit to 10 recent views
    if (this.recentViews.length > 10) {
      this.recentViews.pop();
    }
  }

  // Saved Foods methods
  async getSavedFoods(userId?: number): Promise<Food[]> {
    const savedFoodEntries = Array.from(this.savedFoods.values());
    
    let filteredEntries = savedFoodEntries;
    if (userId) {
      filteredEntries = savedFoodEntries.filter(entry => entry.userId === userId);
    }
    
    // Get the food objects
    const savedFoodsList: Food[] = [];
    for (const entry of filteredEntries) {
      const food = this.foods.get(entry.fdcId);
      if (food) {
        savedFoodsList.push(food);
      }
    }
    
    return savedFoodsList;
  }

  async saveFood(data: InsertSavedFood): Promise<SavedFood> {
    const id = this.savedFoodIdCounter++;
    const createdAt = new Date();
    const savedFood: SavedFood = { ...data, id, createdAt };
    this.savedFoods.set(id, savedFood);
    return savedFood;
  }

  async removeSavedFood(userId: number, fdcId: string): Promise<boolean> {
    const entries = Array.from(this.savedFoods.entries());
    const entryToRemove = entries.find(([_, entry]) => 
      entry.userId === userId && entry.fdcId === fdcId
    );
    
    if (entryToRemove) {
      return this.savedFoods.delete(entryToRemove[0]);
    }
    
    return false;
  }

  async isFoodSaved(userId: number, fdcId: string): Promise<boolean> {
    return Array.from(this.savedFoods.values()).some(
      entry => entry.userId === userId && entry.fdcId === fdcId
    );
  }

  // Food Nutrients methods
  async getFoodNutrients(fdcId: string): Promise<FoodNutrient[]> {
    return Array.from(this.foodNutrients.values()).filter(
      nutrient => nutrient.fdcId === fdcId
    );
  }

  async createFoodNutrient(nutrient: InsertFoodNutrient): Promise<FoodNutrient> {
    const id = this.foodNutrientIdCounter++;
    const foodNutrient: FoodNutrient = { ...nutrient, id };
    this.foodNutrients.set(id, foodNutrient);
    return foodNutrient;
  }

  // Admin - User Management methods
  async getAllUsers(limit = 100, offset = 0): Promise<User[]> {
    const users = Array.from(this.users.values())
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
    
    if (limit && offset) {
      return users.slice(offset, offset + limit);
    }
    
    return users;
  }
  
  async countUsers(): Promise<number> {
    return this.users.size;
  }
  
  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) {
      return undefined;
    }
    
    // Parola güncellemesi ayrı olarak işlenir
    if (updates.password) {
      // Normalde burada parola hash işlemi yapılır
      // Şimdilik basit bırakıyoruz
    }
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    // Kullanıcıyla ilişkili tüm verileri de silmek gerekebilir
    // Örneğin danışanlar, diyet planları, kaydedilmiş besinler vb.
    return this.users.delete(id);
  }
  
  async createFoodNutrients(nutrients: InsertFoodNutrient[]): Promise<FoodNutrient[]> {
    const createdNutrients: FoodNutrient[] = [];
    for (const nutrient of nutrients) {
      const createdNutrient = await this.createFoodNutrient(nutrient);
      createdNutrients.push(createdNutrient);
    }
    
    return createdNutrients;
  }
  
  // Appointment methods
  async getAppointments(clientId?: number, userId?: number): Promise<Appointment[]> {
    const appointments = Array.from(this.appointments.values());
    
    if (clientId && userId) {
      return appointments.filter(app => app.clientId === clientId && app.userId === userId);
    } else if (clientId) {
      return appointments.filter(app => app.clientId === clientId);
    } else if (userId) {
      return appointments.filter(app => app.userId === userId);
    }
    
    return appointments;
  }
  
  async getAppointmentById(id: number): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }
  
  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const id = this.appointmentIdCounter++;
    const now = new Date();
    
    const newAppointment: Appointment = {
      ...appointment,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.appointments.set(id, newAppointment);
    return newAppointment;
  }
  
  async updateAppointment(id: number, updates: Partial<Appointment>): Promise<Appointment | undefined> {
    const appointment = this.appointments.get(id);
    if (!appointment) {
      return undefined;
    }
    
    const updatedAppointment: Appointment = {
      ...appointment,
      ...updates,
      updatedAt: new Date()
    };
    
    this.appointments.set(id, updatedAppointment);
    return updatedAppointment;
  }
  
  async deleteAppointment(id: number): Promise<boolean> {
    return this.appointments.delete(id);
  }
  
  // Message methods
  async getMessages(clientId: number, userId: number): Promise<Message[]> {
    const messages = Array.from(this.messages.values());
    return messages
      .filter(msg => msg.clientId === clientId && msg.userId === userId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
  
  async getMessageById(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }
  
  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    
    const newMessage: Message = {
      ...message,
      id,
      createdAt: new Date()
    };
    
    this.messages.set(id, newMessage);
    return newMessage;
  }
  
  async markMessageAsRead(id: number): Promise<boolean> {
    const message = this.messages.get(id);
    if (!message) {
      return false;
    }
    
    message.isRead = true;
    this.messages.set(id, message);
    return true;
  }
  
  async getUnreadMessages(clientId?: number, userId?: number): Promise<number> {
    const messages = Array.from(this.messages.values());
    
    if (clientId && userId) {
      return messages.filter(msg => 
        msg.clientId === clientId && 
        msg.userId === userId && 
        !msg.isRead
      ).length;
    } else if (clientId) {
      return messages.filter(msg => msg.clientId === clientId && !msg.isRead).length;
    } else if (userId) {
      return messages.filter(msg => msg.userId === userId && !msg.isRead).length;
    }
    
    return messages.filter(msg => !msg.isRead).length;
  }
  
  // Notification methods
  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    const notifications = Array.from(this.notifications.values());
    return notifications
      .filter(notification => notification.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async getNotificationById(id: number): Promise<Notification | undefined> {
    return this.notifications.get(id);
  }
  
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = this.notificationIdCounter++;
    
    const newNotification: Notification = {
      ...notification,
      id,
      createdAt: new Date()
    };
    
    this.notifications.set(id, newNotification);
    return newNotification;
  }
  
  async markNotificationAsRead(id: number): Promise<boolean> {
    const notification = this.notifications.get(id);
    if (!notification) {
      return false;
    }
    
    notification.isRead = true;
    this.notifications.set(id, notification);
    return true;
  }
  
  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    const notifications = Array.from(this.notifications.values());
    let success = true;
    
    notifications
      .filter(notification => notification.userId === userId)
      .forEach(notification => {
        notification.isRead = true;
        this.notifications.set(notification.id, notification);
      });
      
    return success;
  }
  
  async getUnreadNotificationCount(userId: number): Promise<number> {
    const notifications = Array.from(this.notifications.values());
    return notifications.filter(notification => 
      notification.userId === userId && !notification.isRead
    ).length;
  }
  
  // Yardımcı bildirim fonksiyonları
  async createAppointmentReminder(appointmentId: number, scheduleFor: Date): Promise<Notification> {
    // Önce randevuyu getir
    const appointment = await this.getAppointmentById(appointmentId);
    if (!appointment) {
      throw new Error("Randevu bulunamadı");
    }
    
    const client = await this.getClient(appointment.clientId);
    if (!client) {
      throw new Error("Danışan bulunamadı");
    }
    
    // Bildirim içeriği oluştur
    const appointmentTime = new Date(appointment.date).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    let timeUntil = "1 gün";
    if (scheduleFor.getDate() === new Date(appointment.date).getDate()) {
      timeUntil = "1 saat";
    }
    
    // Diyetisyen için bildirim oluştur
    const notification = await this.createNotification({
      userId: appointment.userId,
      clientId: appointment.clientId,
      title: "Yaklaşan Randevu Hatırlatması",
      content: `${client.name} ${client.surname} ile randevunuz ${timeUntil} sonra (${appointmentTime}) gerçekleşecek.`,
      type: "appointment",
      relatedId: appointmentId,
      isRead: false,
      scheduledFor: scheduleFor
    });
    
    return notification;
  }
  
  // Mesaj bildirimi oluştur
  async createMessageNotification(messageId: number, recipientId: number, isClient: boolean): Promise<Notification> {
    // Mesajı getir
    const message = await this.getMessageById(messageId);
    if (!message) {
      throw new Error("Mesaj bulunamadı");
    }
    
    let senderName = "";
    let title = "";
    
    if (isClient) {
      // Danışan için bildirim oluşturuluyor, gönderen diyetisyen
      const user = await this.getUser(message.userId);
      if (!user) {
        throw new Error("Kullanıcı bulunamadı");
      }
      senderName = `${user.name}`;
      title = "Yeni Mesajınız Var";
    } else {
      // Diyetisyen için bildirim oluşturuluyor, gönderen danışan
      const client = await this.getClient(message.clientId);
      if (!client) {
        throw new Error("Danışan bulunamadı");
      }
      senderName = `${client.name} ${client.surname}`;
      title = "Yeni Danışan Mesajı";
    }
    
    // Bildirim oluştur
    const notification = await this.createNotification({
      userId: recipientId,
      clientId: isClient ? message.clientId : null,
      title: title,
      content: `${senderName}: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`,
      type: "message",
      relatedId: messageId,
      isRead: false
    });
    
    return notification;
  }
}

// DatabaseStorage implementation
export class DatabaseStorage implements IStorage {
  // Notification methods
  async getNotificationsByUserId(userId: number): Promise<Notification[]> {
    const result = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
    
    return result;
  }
  
  async getNotificationById(id: number): Promise<Notification | undefined> {
    const [notification] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id));
    
    return notification || undefined;
  }
  
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    
    return newNotification;
  }
  
  async markNotificationAsRead(id: number): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
    
    return true;
  }
  
  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
    
    return true;
  }
  
  async getUnreadNotificationCount(userId: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
    
    return result[0]?.count || 0;
  }
  
  // Yardımcı bildirim fonksiyonları
  async createAppointmentReminder(appointmentId: number, scheduleFor: Date): Promise<Notification> {
    // Önce randevuyu getir
    const appointment = await this.getAppointmentById(appointmentId);
    if (!appointment) {
      throw new Error("Randevu bulunamadı");
    }
    
    const client = await this.getClient(appointment.clientId);
    if (!client) {
      throw new Error("Danışan bulunamadı");
    }
    
    // Bildirim içeriği oluştur
    const appointmentTime = new Date(appointment.date).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    let timeUntil = "1 gün";
    if (scheduleFor.getDate() === new Date(appointment.date).getDate()) {
      timeUntil = "1 saat";
    }
    
    // Diyetisyen için bildirim oluştur
    const notification = await this.createNotification({
      userId: appointment.userId,
      clientId: appointment.clientId,
      title: "Yaklaşan Randevu Hatırlatması",
      content: `${client.name} ${client.surname} ile randevunuz ${timeUntil} sonra (${appointmentTime}) gerçekleşecek.`,
      type: "appointment",
      relatedId: appointmentId,
      isRead: false,
      scheduledFor: scheduleFor
    });
    
    return notification;
  }
  
  // Mesaj bildirimi oluştur
  async createMessageNotification(messageId: number, recipientId: number, isClient: boolean): Promise<Notification> {
    // Mesajı getir
    const message = await this.getMessageById(messageId);
    if (!message) {
      throw new Error("Mesaj bulunamadı");
    }
    
    let senderName = "";
    let title = "";
    
    if (isClient) {
      // Danışan için bildirim oluşturuluyor, gönderen diyetisyen
      const user = await this.getUser(message.userId);
      if (!user) {
        throw new Error("Kullanıcı bulunamadı");
      }
      senderName = `${user.name}`;
      title = "Yeni Mesajınız Var";
    } else {
      // Diyetisyen için bildirim oluşturuluyor, gönderen danışan
      const client = await this.getClient(message.clientId);
      if (!client) {
        throw new Error("Danışan bulunamadı");
      }
      senderName = `${client.name} ${client.surname}`;
      title = "Yeni Danışan Mesajı";
    }
    
    // Bildirim oluştur
    const notification = await this.createNotification({
      userId: recipientId,
      clientId: isClient ? message.clientId : null,
      title: title,
      content: `${senderName}: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`,
      type: "message",
      relatedId: messageId,
      isRead: false
    });
    
    return notification;
  }
  // Client Portal methods
  async getClientByAccessCode(accessCode: string): Promise<Client | undefined> {
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.accessCode, accessCode));
    return client || undefined;
  }
  
  async generateClientAccessCode(clientId: number): Promise<string> {
    const client = await this.getClient(clientId);
    if (!client) {
      throw new Error("Danışan bulunamadı");
    }
    
    // 6 karakterli alfanumerik rastgele bir kod oluştur
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let accessCode = '';
    for (let i = 0; i < 6; i++) {
      accessCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Danışanı güncelleyerek erişim kodunu kaydet
    const updatedClient = await this.updateClient(clientId, { accessCode });
    if (!updatedClient) {
      throw new Error("Erişim kodu güncellenemedi");
    }
    
    return accessCode;
  }
  
  async updateClientAccessCode(clientId: number, accessCode: string): Promise<boolean> {
    const result = await db
      .update(clients)
      .set({ accessCode })
      .where(eq(clients.id, clientId));
    
    return result.rowCount > 0;
  }
  
  // Client Session management
  async createClientSession(session: InsertClientSession): Promise<ClientSession> {
    const [newSession] = await db
      .insert(clientSessions)
      .values({
        ...session,
        lastActivity: new Date()
      })
      .returning();
    
    return newSession;
  }
  
  async getClientSession(sessionToken: string): Promise<ClientSession | undefined> {
    const [session] = await db
      .select()
      .from(clientSessions)
      .where(eq(clientSessions.sessionToken, sessionToken));
    
    return session || undefined;
  }
  
  async updateClientSessionActivity(sessionToken: string): Promise<boolean> {
    const result = await db
      .update(clientSessions)
      .set({ lastActivity: new Date() })
      .where(eq(clientSessions.sessionToken, sessionToken));
    
    return result.rowCount > 0;
  }
  
  async deleteClientSession(sessionToken: string): Promise<boolean> {
    const result = await db
      .delete(clientSessions)
      .where(eq(clientSessions.sessionToken, sessionToken));
    
    return result.rowCount > 0;
  }
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async updateUserSubscription(id: number, updates: {
    subscriptionStatus?: string;
    subscriptionPlan?: string;
    subscriptionStartDate?: Date;
    subscriptionEndDate?: Date;
  }): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user;
  }
  
  async getAllUsers(limit: number = 100, offset: number = 0): Promise<User[]> {
    return db.select().from(users).limit(limit).offset(offset);
  }
  
  async countUsers(): Promise<number> {
    const result = await db.select({ count: count() }).from(users);
    return result[0]?.count || 0;
  }
  
  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    const result = await db
      .delete(users)
      .where(eq(users.id, id));
    return result.count > 0;
  }
  
  // Client methods (simple implementation for now)
  async getClients(userId?: number, limit?: number): Promise<Client[]> {
    let query = db.select().from(clients);
    if (userId) {
      query = query.where(eq(clients.userId, userId));
    }
    if (limit) {
      query = query.limit(limit);
    }
    return query;
  }
  
  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || undefined;
  }
  
  async createClient(insertClient: InsertClient): Promise<Client> {
    const [client] = await db
      .insert(clients)
      .values(insertClient)
      .returning();
    return client;
  }
  
  async updateClient(id: number, updates: Partial<Client>): Promise<Client | undefined> {
    const [client] = await db
      .update(clients)
      .set(updates)
      .where(eq(clients.id, id))
      .returning();
    return client;
  }
  
  async deleteClient(id: number): Promise<boolean> {
    const result = await db
      .delete(clients)
      .where(eq(clients.id, id));
    return result.count > 0;
  }
  
  // Measurement methods
  async getMeasurements(clientId: number): Promise<Measurement[]> {
    return db.select().from(measurements).where(eq(measurements.clientId, clientId));
  }
  
  async getMeasurement(id: number): Promise<Measurement | undefined> {
    const [measurement] = await db.select().from(measurements).where(eq(measurements.id, id));
    return measurement || undefined;
  }
  
  async createMeasurement(insertMeasurement: InsertMeasurement): Promise<Measurement> {
    const [measurement] = await db
      .insert(measurements)
      .values(insertMeasurement)
      .returning();
    return measurement;
  }
  
  async updateMeasurement(id: number, updates: Partial<Measurement>): Promise<Measurement | undefined> {
    const [measurement] = await db
      .update(measurements)
      .set(updates)
      .where(eq(measurements.id, id))
      .returning();
    return measurement;
  }
  
  async deleteMeasurement(id: number): Promise<boolean> {
    const result = await db
      .delete(measurements)
      .where(eq(measurements.id, id));
    return result.count > 0;
  }
  
  // Diet Plan methods
  async getDietPlans(userId?: number, limit?: number): Promise<DietPlan[]> {
    let query = db.select().from(dietPlans);
    if (userId) {
      query = query.where(eq(dietPlans.userId, userId));
    }
    if (limit) {
      query = query.limit(limit);
    }
    return query;
  }
  
  async getDietPlan(id: number): Promise<DietPlan | undefined> {
    const [dietPlan] = await db.select().from(dietPlans).where(eq(dietPlans.id, id));
    return dietPlan || undefined;
  }
  
  async createDietPlan(insertDietPlan: InsertDietPlan): Promise<DietPlan> {
    const [dietPlan] = await db
      .insert(dietPlans)
      .values(insertDietPlan)
      .returning();
    return dietPlan;
  }
  
  async updateDietPlan(id: number, updates: Partial<DietPlan>): Promise<DietPlan | undefined> {
    const [dietPlan] = await db
      .update(dietPlans)
      .set(updates)
      .where(eq(dietPlans.id, id))
      .returning();
    return dietPlan;
  }
  
  async deleteDietPlan(id: number): Promise<boolean> {
    const result = await db
      .delete(dietPlans)
      .where(eq(dietPlans.id, id));
    return result.count > 0;
  }
  
  // Food methods - implementing basic methods for now
  async getFoods(limit: number = 20, offset: number = 0): Promise<Food[]> {
    return db.select().from(foods).limit(limit).offset(offset);
  }
  
  async getFoodById(fdcId: string): Promise<Food | undefined> {
    const [food] = await db.select().from(foods).where(eq(foods.fdcId, fdcId));
    return food || undefined;
  }
  
  async createFood(insertFood: InsertFood): Promise<Food> {
    const [food] = await db
      .insert(foods)
      .values(insertFood)
      .returning();
    return food;
  }
  
  async searchFoods(query: string, page: number = 1, pageSize: number = 20): Promise<{ foods: Food[], totalHits: number }> {
    const offset = (page - 1) * pageSize;
    
    // Basic text search - in a real app we'd use full-text search capabilities
    const foods = await db
      .select()
      .from(foods)
      .where(like(foods.description, `%${query}%`))
      .limit(pageSize)
      .offset(offset);
    
    const countResult = await db
      .select({ count: count() })
      .from(foods)
      .where(like(foods.description, `%${query}%`));
    
    const totalHits = countResult[0]?.count || 0;
    
    return {
      foods,
      totalHits,
      currentPage: page,
      totalPages: Math.ceil(totalHits / pageSize)
    };
  }
  
  async getRecentFoods(limit: number = 5): Promise<Food[]> {
    return db
      .select()
      .from(foods)
      .orderBy(desc(foods.createdAt))
      .limit(limit);
  }
  
  // Saved Foods methods
  async getSavedFoods(userId?: number): Promise<Food[]> {
    if (!userId) return [];
    
    const savedFoodsData = await db
      .select({
        food: foods
      })
      .from(savedFoods)
      .leftJoin(foods, eq(savedFoods.fdcId, foods.fdcId))
      .where(eq(savedFoods.userId, userId));
    
    return savedFoodsData.map(item => item.food).filter(Boolean);
  }
  
  async saveFood(data: InsertSavedFood): Promise<SavedFood> {
    const [savedFood] = await db
      .insert(savedFoods)
      .values(data)
      .returning();
    return savedFood;
  }
  
  async removeSavedFood(userId: number, fdcId: string): Promise<boolean> {
    const result = await db
      .delete(savedFoods)
      .where(and(
        eq(savedFoods.userId, userId),
        eq(savedFoods.fdcId, fdcId)
      ));
    return result.count > 0;
  }
  
  async isFoodSaved(userId: number, fdcId: string): Promise<boolean> {
    const [saved] = await db
      .select()
      .from(savedFoods)
      .where(and(
        eq(savedFoods.userId, userId),
        eq(savedFoods.fdcId, fdcId)
      ));
    return !!saved;
  }
  
  // Food Nutrients methods
  async getFoodNutrients(fdcId: string): Promise<FoodNutrient[]> {
    return db
      .select()
      .from(foodNutrients)
      .where(eq(foodNutrients.fdcId, fdcId));
  }
  
  async createFoodNutrient(nutrient: InsertFoodNutrient): Promise<FoodNutrient> {
    const [foodNutrient] = await db
      .insert(foodNutrients)
      .values(nutrient)
      .returning();
    return foodNutrient;
  }
  
  async createFoodNutrients(nutrients: InsertFoodNutrient[]): Promise<FoodNutrient[]> {
    if (nutrients.length === 0) return [];
    
    const foodNutrients = await db
      .insert(foodNutrients)
      .values(nutrients)
      .returning();
    return foodNutrients;
  }
  
  // Appointment methods
  async getAppointments(clientId?: number, userId?: number): Promise<Appointment[]> {
    let query = db.select().from(appointments);
    
    if (clientId && userId) {
      query = query.where(and(
        eq(appointments.clientId, clientId),
        eq(appointments.userId, userId)
      ));
    } else if (clientId) {
      query = query.where(eq(appointments.clientId, clientId));
    } else if (userId) {
      query = query.where(eq(appointments.userId, userId));
    }
    
    return await query.orderBy(appointments.date);
  }
  
  async getAppointmentById(id: number): Promise<Appointment | undefined> {
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, id));
    
    return appointment;
  }
  
  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [newAppointment] = await db
      .insert(appointments)
      .values(appointment)
      .returning();
    
    return newAppointment;
  }
  
  async updateAppointment(id: number, updates: Partial<Appointment>): Promise<Appointment | undefined> {
    const [updatedAppointment] = await db
      .update(appointments)
      .set({...updates, updatedAt: new Date()})
      .where(eq(appointments.id, id))
      .returning();
    
    return updatedAppointment;
  }
  
  async deleteAppointment(id: number): Promise<boolean> {
    const result = await db
      .delete(appointments)
      .where(eq(appointments.id, id));
    
    return result.rowCount > 0;
  }
  
  // Message methods
  async getMessages(clientId: number, userId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(and(
        eq(messages.clientId, clientId),
        eq(messages.userId, userId)
      ))
      .orderBy(messages.createdAt);
  }
  
  async getMessageById(id: number): Promise<Message | undefined> {
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, id));
    
    return message;
  }
  
  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();
    
    return newMessage;
  }
  
  async markMessageAsRead(id: number): Promise<boolean> {
    const result = await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, id));
    
    return result.rowCount > 0;
  }
  
  async markMultipleMessagesAsRead(messageIds: number[]): Promise<boolean> {
    const result = await db
      .update(messages)
      .set({ isRead: true })
      .where(inArray(messages.id, messageIds));
    
    return result.rowCount > 0;
  }
  
  async markAllClientMessagesAsRead(clientId: number, userId: number): Promise<boolean> {
    const result = await db
      .update(messages)
      .set({ isRead: true })
      .where(and(
        eq(messages.clientId, clientId),
        eq(messages.userId, userId),
        eq(messages.isRead, false),
        eq(messages.fromClient, true) // Sadece danışandan gelen mesajları işaretle
      ));
    
    return result.rowCount > 0;
  }
  
  async getUnreadMessages(clientId?: number, userId?: number): Promise<number> {
    let query = db.select({ count: count() }).from(messages).where(eq(messages.isRead, false));
    
    if (clientId && userId) {
      query = query.where(and(
        eq(messages.clientId, clientId),
        eq(messages.userId, userId),
        eq(messages.isRead, false)
      ));
    } else if (clientId) {
      query = query.where(and(
        eq(messages.clientId, clientId),
        eq(messages.isRead, false)
      ));
    } else if (userId) {
      query = query.where(and(
        eq(messages.userId, userId),
        eq(messages.isRead, false)
      ));
    }
    
    const result = await query;
    return Number(result[0].count);
  }
  
  // Notifications
  async getNotifications(userId: number, isRead?: boolean): Promise<Notification[]> {
    let query = db.select().from(notifications)
      .where(eq(notifications.userId, userId));
    
    if (isRead !== undefined) {
      query = query.where(eq(notifications.isRead, isRead));
    }
    
    return query.orderBy(desc(notifications.createdAt));
  }
  
  async getClientNotifications(clientId: number, isRead?: boolean): Promise<Notification[]> {
    let query = db.select().from(notifications)
      .where(eq(notifications.clientId, clientId));
    
    if (isRead !== undefined) {
      query = query.where(eq(notifications.isRead, isRead));
    }
    
    return query.orderBy(desc(notifications.createdAt));
  }
  
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }
  
  async markNotificationAsRead(id: number): Promise<void> {
    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }
  
  async markAllNotificationsAsRead(userId: number): Promise<void> {
    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }
  
  async getUnreadNotificationsCount(userId: number): Promise<number> {
    const [result] = await db.select({ count: count() }).from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      );
    
    return result?.count || 0;
  }
  
  async createAppointmentReminder(appointmentId: number, scheduleFor: Date): Promise<Notification> {
    const appointment = await this.getAppointmentById(appointmentId);
    
    if (!appointment) {
      throw new Error("Randevu bulunamadı");
    }
    
    const client = await this.getClientById(appointment.clientId);
    
    if (!client) {
      throw new Error("Danışan bulunamadı");
    }
    
    // Diyetisyen için bildirim
    const dietitianNotification = await this.createNotification({
      userId: appointment.userId,
      clientId: appointment.clientId,
      title: "Randevu Hatırlatması",
      content: `${client.firstName} ${client.lastName} ile ${new Date(appointment.date).toLocaleDateString('tr-TR')} tarihinde randevunuz var.`,
      type: "appointment",
      relatedId: appointmentId,
      scheduledFor: scheduleFor,
      isRead: false
    });
    
    return dietitianNotification;
  }
  
  async createMessageNotification(messageId: number, recipientId: number, isClient: boolean): Promise<Notification> {
    const message = await this.getMessageById(messageId);
    
    if (!message) {
      throw new Error("Mesaj bulunamadı");
    }
    
    const client = await this.getClientById(message.clientId);
    
    if (!client) {
      throw new Error("Danışan bulunamadı");
    }
    
    let title, content;
    
    if (isClient) {
      // Danışana bildirimi
      title = "Yeni Mesaj";
      content = `Diyetisyeninizden yeni bir mesajınız var.`;
    } else {
      // Diyetisyene bildirimi
      title = "Yeni Mesaj";
      content = `${client.firstName} ${client.lastName} adlı danışanınızdan yeni bir mesajınız var.`;
    }
    
    const notification = await this.createNotification({
      userId: recipientId,
      clientId: message.clientId,
      title,
      content,
      type: "message",
      relatedId: messageId,
      isRead: false
    });
    
    return notification;
  }
}

// Import needed database functions
import { db } from "./db";
import { eq, like, and, desc, count, inArray } from "drizzle-orm";

// Create and export a singleton instance
export const storage = new DatabaseStorage();
