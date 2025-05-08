import { apiRequest } from "./queryClient";
import type { Food, FoodSearchResult } from "@shared/schema";

// USDA Food Data Central API Interfaces
export interface USDASearchParams {
  query: string;
  dataType?: string[];
  pageSize?: number;
  pageNumber?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Function to search foods from USDA database
export async function searchFoods(params: USDASearchParams): Promise<FoodSearchResult> {
  try {
    const queryParams = new URLSearchParams();
    
    // Add parameters to query string
    if (params.query) queryParams.append("query", params.query);
    if (params.pageSize) queryParams.append("pageSize", params.pageSize.toString());
    if (params.pageNumber) queryParams.append("pageNumber", params.pageNumber.toString());
    if (params.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);
    if (params.dataType && params.dataType.length > 0) {
      params.dataType.forEach(type => queryParams.append("dataType", type));
    }
    
    const response = await apiRequest(
      "GET", 
      `/api/foods/search?${queryParams.toString()}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to search foods: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error searching foods:", error);
    throw error;
  }
}

// Function to get detailed food information
export async function getFoodDetails(fdcId: string): Promise<Food> {
  try {
    const response = await apiRequest("GET", `/api/foods/${fdcId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get food details: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error getting food details:", error);
    throw error;
  }
}

// Helper function to format nutrient values with appropriate units
export function formatNutrientValue(value: number | null | undefined, unit?: string | null): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "N/A";
  }
  const roundedValue = Math.round(value * 10) / 10;
  return `${roundedValue}${unit ? ` ${unit}` : ''}`;
}

// Helper function to calculate calories from macronutrients
export function calculateCalories(proteins: number, carbs: number, fats: number): number {
  // Using the 4-4-9 calorie formula
  return (proteins * 4) + (carbs * 4) + (fats * 9);
}
