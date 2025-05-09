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
  type InsertFoodNutrient
} from "@shared/schema";

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
  
  // Client methods
  getClients(userId?: number, limit?: number): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, updates: Partial<Client>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;
  
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
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private clients: Map<number, Client>;
  private measurements: Map<number, Measurement>;
  private dietPlans: Map<number, DietPlan>;
  private foods: Map<string, Food>;
  private savedFoods: Map<number, SavedFood>;
  private foodNutrients: Map<number, FoodNutrient>;
  
  private userIdCounter: number;
  private clientIdCounter: number;
  private measurementIdCounter: number;
  private dietPlanIdCounter: number;
  private savedFoodIdCounter: number;
  private foodNutrientIdCounter: number;
  private recentViews: string[];

  constructor() {
    this.users = new Map();
    this.clients = new Map();
    this.measurements = new Map();
    this.dietPlans = new Map();
    this.foods = new Map();
    this.savedFoods = new Map();
    this.foodNutrients = new Map();
    
    this.userIdCounter = 1;
    this.clientIdCounter = 1;
    this.measurementIdCounter = 1;
    this.dietPlanIdCounter = 1;
    this.savedFoodIdCounter = 1;
    this.foodNutrientIdCounter = 1;
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

  async createFoodNutrients(nutrients: InsertFoodNutrient[]): Promise<FoodNutrient[]> {
    const createdNutrients: FoodNutrient[] = [];
    
    for (const nutrient of nutrients) {
      const createdNutrient = await this.createFoodNutrient(nutrient);
      createdNutrients.push(createdNutrient);
    }
    
    return createdNutrients;
  }
}

// Create and export a singleton instance
export const storage = new MemStorage();
