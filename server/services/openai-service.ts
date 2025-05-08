import OpenAI from "openai";
import type { DietRequirement } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

class OpenAIService {
  private openai: OpenAI;

  constructor() {
    // Initialize OpenAI with API key from environment
    this.openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  // Generate a diet plan based on user requirements
  async generateDietPlan(requirements: DietRequirement) {
    try {
      // Construct a prompt for the diet plan
      const prompt = this.buildDietPlanPrompt(requirements);

      // Call OpenAI API
      const response = await this.openai.chat.completions.create({
        model: MODEL,
        messages: [
          { 
            role: "system", 
            content: "You are a professional dietician specializing in personalized nutrition plans. Create comprehensive, evidence-based meal plans with specific portion sizes and nutritional information."
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const generatedContent = JSON.parse(response.choices[0].message.content);

      // Format the response
      return {
        description: generatedContent.summary || "Personalized diet plan",
        content: generatedContent,
        tags: this.generateTags(requirements),
        durationDays: 7,
        status: "active"
      };
    } catch (error) {
      console.error("OpenAI diet plan generation error:", error);
      throw new Error(`Failed to generate diet plan: ${error.message}`);
    }
  }

  // Analyze a meal description for nutritional content
  async analyzeMeal(mealDescription: string) {
    try {
      const prompt = `
        Analyze the following meal for its nutritional content:
        
        "${mealDescription}"
        
        Provide a detailed analysis including:
        1. Estimated macronutrients (protein, carbs, fat in grams)
        2. Estimated calories
        3. Main nutrients present
        4. Health benefits
        5. Potential improvements
        
        Format your response as a JSON object with these keys: macronutrients (object with protein, carbs, fat), calories, nutrients (array), benefits (array), improvements (array).
      `;

      const response = await this.openai.chat.completions.create({
        model: MODEL,
        messages: [
          { role: "system", content: "You are a nutrition expert with extensive knowledge of food composition and dietary analysis." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error("OpenAI meal analysis error:", error);
      throw new Error(`Failed to analyze meal: ${error.message}`);
    }
  }

  // Generate diet tips based on a specific context
  async generateDietTips(context: string) {
    try {
      const prompt = `
        Provide personalized dietary advice based on the following context:
        
        "${context}"
        
        Generate 5 specific, actionable nutrition tips that are evidence-based and practical.
        Format your response as a JSON object with these keys: tips (array), summary (string).
      `;

      const response = await this.openai.chat.completions.create({
        model: MODEL,
        messages: [
          { role: "system", content: "You are a nutrition expert specializing in practical dietary advice. Provide evidence-based recommendations that are easy to implement." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.5,
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error("OpenAI diet tips generation error:", error);
      throw new Error(`Failed to generate diet tips: ${error.message}`);
    }
  }

  // Helper method to build a prompt for diet plan generation
  private buildDietPlanPrompt(requirements: DietRequirement): string {
    return `
      Generate a detailed 7-day diet plan based on the following requirements:
      
      Personal Information:
      - Name: ${requirements.name}
      - Age: ${requirements.age}
      - Gender: ${requirements.gender}
      - Height: ${requirements.height} cm
      - Weight: ${requirements.weight} kg
      - Activity Level: ${requirements.activityLevel}
      
      Diet Requirements:
      - Diet Type: ${requirements.dietType}
      - Calorie Goal: ${requirements.calorieGoal || "calculated based on profile"}
      - Macronutrient Distribution: Protein ${requirements.proteinPercentage}%, Carbs ${requirements.carbsPercentage}%, Fat ${requirements.fatPercentage}%
      - Number of Meals Per Day: ${requirements.meals}
      - Include Snacks: ${requirements.includeSnacks ? "Yes" : "No"}
      - Include Dessert: ${requirements.includeDessert ? "Yes" : "No"}
      
      ${requirements.allergies ? `Allergies/Intolerances: ${requirements.allergies}` : ""}
      ${requirements.healthConditions ? `Health Conditions: ${requirements.healthConditions}` : ""}
      
      For each day, provide:
      1. A summary of the day's meals
      2. Detailed meal plan with portion sizes
      3. Total calories and macronutrients for each meal
      4. Total daily nutritional summary
      
      Format the response as a JSON object with these keys:
      - summary (string): Brief overview of the diet plan
      - days (array): An array of 7 day objects each containing:
        - dayNumber (number)
        - meals (array): Array of meal objects with:
          - name (string): Name of the meal (e.g., Breakfast, Lunch)
          - foods (array): Array of food items with:
            - name (string): Name of the food
            - portion (string): Portion size
            - calories (number): Estimated calories
            - protein (number): Protein in grams
            - carbs (number): Carbs in grams
            - fat (number): Fat in grams
          - totalCalories (number): Total calories for the meal
          - totalProtein (number): Total protein for the meal
          - totalCarbs (number): Total carbs for the meal
          - totalFat (number): Total fat for the meal
        - dailyTotals (object):
          - calories (number)
          - protein (number)
          - carbs (number)
          - fat (number)
      - nutritionTips (array): Array of strings with diet tips specific to this plan
    `;
  }

  // Helper method to generate tags for a diet plan
  private generateTags(requirements: DietRequirement): string[] {
    const tags: string[] = [requirements.dietType];
    
    // Add activity level tag
    tags.push(requirements.activityLevel);
    
    // Add macro focus tag
    if (requirements.proteinPercentage >= 30) {
      tags.push("high-protein");
    }
    if (requirements.carbsPercentage <= 25) {
      tags.push("low-carb");
    }
    if (requirements.fatPercentage >= 40) {
      tags.push("high-fat");
    }
    
    // Add special condition tags if present
    if (requirements.healthConditions) {
      const conditions = requirements.healthConditions.toLowerCase();
      if (conditions.includes("diabetes")) tags.push("diabetes-friendly");
      if (conditions.includes("heart") || conditions.includes("cardiovascular")) tags.push("heart-healthy");
      if (conditions.includes("blood pressure") || conditions.includes("hypertension")) tags.push("low-sodium");
    }
    
    return tags;
  }
}

// Create and export singleton instance
export const openaiService = new OpenAIService();
