import { 
  users, 
  type User, 
  type InsertUser,
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
  private dietPlans: Map<number, DietPlan>;
  private foods: Map<string, Food>;
  private savedFoods: Map<number, SavedFood>;
  private foodNutrients: Map<number, FoodNutrient>;
  
  private userIdCounter: number;
  private dietPlanIdCounter: number;
  private savedFoodIdCounter: number;
  private foodNutrientIdCounter: number;
  private recentViews: string[];

  constructor() {
    this.users = new Map();
    this.dietPlans = new Map();
    this.foods = new Map();
    this.savedFoods = new Map();
    this.foodNutrients = new Map();
    
    this.userIdCounter = 1;
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
    const user: User = { ...insertUser, id, createdAt, role: "user" };
    this.users.set(id, user);
    return user;
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
