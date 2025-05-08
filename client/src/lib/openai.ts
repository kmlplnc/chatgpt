import { apiRequest } from "./queryClient";
import type { DietRequirement } from "@shared/schema";

// Function to generate diet plan using OpenAI
export async function generateDietPlan(requirements: DietRequirement) {
  try {
    const response = await apiRequest("POST", "/api/diet-plans/generate", requirements);
    
    if (!response.ok) {
      throw new Error(`Failed to generate diet plan: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error generating diet plan:", error);
    throw error;
  }
}

// Function to generate diet tips or recommendations
export async function generateDietTips(context: string) {
  try {
    const response = await apiRequest("POST", "/api/generate/diet-tips", { context });
    
    if (!response.ok) {
      throw new Error(`Failed to generate tips: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error generating diet tips:", error);
    throw error;
  }
}

// Function to analyze a meal and provide nutritional feedback
export async function analyzeMeal(mealDescription: string) {
  try {
    const response = await apiRequest("POST", "/api/analyze/meal", { mealDescription });
    
    if (!response.ok) {
      throw new Error(`Failed to analyze meal: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error analyzing meal:", error);
    throw error;
  }
}
