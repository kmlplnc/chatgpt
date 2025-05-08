import { apiRequest } from "./queryClient";
import type { Food, DietPlan, InsertDietPlan, FoodNutrient, DietRequirement } from "@shared/schema";

// Diet Plans API
export async function saveDietPlan(dietPlan: InsertDietPlan) {
  const response = await apiRequest("POST", "/api/diet-plans", dietPlan);
  return response.json();
}

export async function updateDietPlan(id: number, updates: Partial<DietPlan>) {
  const response = await apiRequest("PATCH", `/api/diet-plans/${id}`, updates);
  return response.json();
}

export async function deleteDietPlan(id: number) {
  await apiRequest("DELETE", `/api/diet-plans/${id}`);
  return { success: true };
}

export async function exportDietPlan(id: number, format: "pdf" | "json") {
  const response = await apiRequest("GET", `/api/diet-plans/${id}/export?format=${format}`);
  return response.json();
}

// Food Database API
export async function searchFoods(query: string, page = 1, pageSize = 20) {
  const response = await apiRequest("GET", `/api/foods/search?query=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}`);
  return response.json();
}

export async function getFoodDetails(fdcId: string): Promise<Food> {
  const response = await apiRequest("GET", `/api/foods/${fdcId}`);
  return response.json();
}

export async function getFoodNutrients(fdcId: string): Promise<FoodNutrient[]> {
  const response = await apiRequest("GET", `/api/foods/${fdcId}/nutrients`);
  return response.json();
}

// User Saved Foods
export async function getSavedFoods() {
  const response = await apiRequest("GET", "/api/saved-foods");
  return response.json();
}

export async function saveFood(fdcId: string) {
  const response = await apiRequest("POST", "/api/saved-foods", { fdcId });
  return response.json();
}

export async function removeSavedFood(fdcId: string) {
  await apiRequest("DELETE", `/api/saved-foods/${fdcId}`);
  return { success: true };
}
