import type { Food, InsertFood, InsertFoodNutrient, FoodSearchResult } from "@shared/schema";

// USDA FoodData Central API URL and endpoints
const USDA_API_BASE_URL = "https://api.nal.usda.gov/fdc/v1";
const SEARCH_ENDPOINT = "/foods/search";
const FOOD_DETAILS_ENDPOINT = "/food";

// Search parameters interface
interface SearchParams {
  query: string;
  dataType?: string[];
  pageSize?: number;
  page?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

class USDAService {
  private apiKey: string;

  constructor() {
    // Get API key from environment variables
    this.apiKey = process.env.USDA_API_KEY;
  }

  /**
   * Search for foods in the USDA FoodData Central database
   */
  async searchFoods(params: SearchParams): Promise<FoodSearchResult> {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append("api_key", this.apiKey);
      
      if (params.query) queryParams.append("query", params.query);
      if (params.pageSize) queryParams.append("pageSize", params.pageSize.toString());
      if (params.page) queryParams.append("pageNumber", params.page.toString());
      if (params.sortBy) queryParams.append("sortBy", params.sortBy);
      if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);
      
      if (params.dataType && params.dataType.length > 0) {
        params.dataType.forEach(type => queryParams.append("dataType", type));
      }
      
      // Make API request
      const response = await fetch(`${USDA_API_BASE_URL}${SEARCH_ENDPOINT}?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`USDA API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Map response to our schema
      const foods: Food[] = data.foods.map((food: any) => this.mapFoodFromUSDA(food));
      
      return {
        foods,
        totalHits: data.totalHits || 0,
        currentPage: params.page || 1,
        totalPages: Math.ceil((data.totalHits || 0) / (params.pageSize || 20))
      };
    } catch (error) {
      console.error("Error searching USDA foods:", error);
      throw new Error(`Failed to search foods: ${error.message}`);
    }
  }

  /**
   * Get detailed information for a specific food by FDC ID
   */
  async getFoodDetails(fdcId: string): Promise<Food> {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append("api_key", this.apiKey);
      
      // Make API request
      const response = await fetch(`${USDA_API_BASE_URL}${FOOD_DETAILS_ENDPOINT}/${fdcId}?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`USDA API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Map response to our schema
      return this.mapFoodFromUSDA(data);
    } catch (error) {
      console.error(`Error fetching food details for ${fdcId}:`, error);
      throw new Error(`Failed to get food details: ${error.message}`);
    }
  }

  /**
   * Get nutrient information for a specific food
   */
  async getFoodNutrients(fdcId: string): Promise<InsertFoodNutrient[]> {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append("api_key", this.apiKey);
      
      // Make API request
      const response = await fetch(`${USDA_API_BASE_URL}${FOOD_DETAILS_ENDPOINT}/${fdcId}?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`USDA API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Map food nutrients from response
      const nutrients: InsertFoodNutrient[] = this.mapNutrientsFromUSDA(fdcId, data.foodNutrients || []);
      
      return nutrients;
    } catch (error) {
      console.error(`Error fetching food nutrients for ${fdcId}:`, error);
      throw new Error(`Failed to get food nutrients: ${error.message}`);
    }
  }

  /**
   * Map a food object from USDA API format to our schema
   */
  private mapFoodFromUSDA(usdaFood: any): Food {
    const food: Food = {
      fdcId: usdaFood.fdcId.toString(),
      dataType: usdaFood.dataType || "",
      description: usdaFood.description || "",
      brandName: usdaFood.brandName || null,
      ingredients: usdaFood.ingredients || null,
      servingSize: usdaFood.servingSize || null,
      servingSizeUnit: usdaFood.servingSizeUnit || null,
      foodCategory: usdaFood.foodCategory || null,
      publishedDate: usdaFood.publishedDate ? new Date(usdaFood.publishedDate) : null,
      createdAt: new Date(),
      foodAttributes: usdaFood.foodAttributes || null,
      foodNutrients: usdaFood.foodNutrients || null
    };
    
    return food;
  }

  /**
   * Map food nutrients from USDA API format to our schema
   */
  private mapNutrientsFromUSDA(fdcId: string, usdaNutrients: any[]): InsertFoodNutrient[] {
    const commonNutrients = [
      "Protein",
      "Total lipid (fat)",
      "Carbohydrate, by difference",
      "Energy",
      "Sugars, total including NLEA",
      "Fiber, total dietary",
      "Calcium, Ca",
      "Iron, Fe",
      "Magnesium, Mg",
      "Phosphorus, P",
      "Potassium, K",
      "Sodium, Na",
      "Zinc, Zn",
      "Vitamin A, RAE",
      "Vitamin B-6",
      "Vitamin B-12",
      "Vitamin C, total ascorbic acid",
      "Vitamin D (D2 + D3)",
      "Vitamin E (alpha-tocopherol)",
      "Vitamin K (phylloquinone)",
      "Fatty acids, total saturated",
      "Fatty acids, total monounsaturated",
      "Fatty acids, total polyunsaturated",
      "Fatty acids, total trans",
      "Cholesterol"
    ];
    
    // Filter for common nutrients and map to our schema
    return usdaNutrients
      .filter(nutrient => nutrient.nutrientName && nutrient.value > 0)
      .map(nutrient => {
        // Normalize nutrient names
        let name = nutrient.nutrientName;
        
        if (name === "Total lipid (fat)") name = "Total Fat";
        if (name === "Carbohydrate, by difference") name = "Carbohydrates";
        if (name === "Energy") name = "Calories";
        if (name === "Sugars, total including NLEA") name = "Sugars";
        if (name === "Fiber, total dietary") name = "Fiber";
        
        // Map to our schema
        return {
          fdcId,
          nutrientId: nutrient.nutrientId || 0,
          name,
          amount: nutrient.value || 0,
          unit: nutrient.unitName || "g",
          percentDailyValue: nutrient.percentDailyValue || null
        };
      })
      // Sort nutrients to put common ones first
      .sort((a, b) => {
        const aIndex = commonNutrients.indexOf(a.name);
        const bIndex = commonNutrients.indexOf(b.name);
        
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        
        return a.name.localeCompare(b.name);
      });
  }
}

// Create and export singleton instance
export const usdaService = new USDAService();
