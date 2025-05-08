import React from "react";
import { 
  MacronutrientChart, 
  NutrientBarChart, 
  CalorieBreakdownChart 
} from "@/components/ui/chart";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Food, FoodNutrient } from "@shared/schema";

interface NutritionalChartProps {
  food?: Food;
  nutrients?: FoodNutrient[];
  dietPlan?: {
    calorieGoal: number;
    proteinPercentage: number;
    carbsPercentage: number;
    fatPercentage: number;
    meals: { name: string; calories: number }[];
  };
}

export default function NutritionalChart({ 
  food, 
  nutrients = [], 
  dietPlan 
}: NutritionalChartProps) {
  // Extract macronutrients
  const protein = nutrients.find(n => n.name === "Protein")?.amount || 0;
  const carbs = nutrients.find(n => n.name === "Carbohydrates")?.amount || 0;
  const fat = nutrients.find(n => n.name === "Total Fat")?.amount || 0;
  
  // Calculate calories
  const calories = (protein * 4) + (carbs * 4) + (fat * 9);
  
  // Calculate macronutrient percentages
  const totalMacros = protein + carbs + fat;
  const proteinPercentage = totalMacros ? Math.round((protein / totalMacros) * 100) : 0;
  const carbsPercentage = totalMacros ? Math.round((carbs / totalMacros) * 100) : 0;
  const fatPercentage = totalMacros ? Math.round((fat / totalMacros) * 100) : 0;
  
  // For Diet Plan view
  const macroPercentages = dietPlan 
    ? {
        protein: dietPlan.proteinPercentage,
        carbs: dietPlan.carbsPercentage,
        fat: dietPlan.fatPercentage
      }
    : {
        protein: proteinPercentage,
        carbs: carbsPercentage,
        fat: fatPercentage
      };
  
  // Create vitamin data for chart
  const vitamins = nutrients
    .filter(n => n.name.includes("Vitamin") && n.amount > 0)
    .map(n => ({
      name: n.name.replace("Vitamin ", ""),
      value: n.amount,
      unit: n.unit,
      percentage: n.percentDailyValue || 0
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 8);
  
  // Create mineral data for chart
  const minerals = nutrients
    .filter(n => 
      ["Calcium", "Iron", "Magnesium", "Phosphorus", "Potassium", "Sodium", "Zinc"].includes(n.name) && 
      n.amount > 0
    )
    .map(n => ({
      name: n.name,
      value: n.amount,
      unit: n.unit,
      percentage: n.percentDailyValue || 0
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 8);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Nutritional Information</CardTitle>
        {food && (
          <CardDescription>
            {food.description}, {food.brandName || "Generic"}
          </CardDescription>
        )}
        {dietPlan && (
          <CardDescription>
            Daily target: {dietPlan.calorieGoal} calories
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="macros" className="w-full">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="macros">Macronutrients</TabsTrigger>
            <TabsTrigger value="vitamins">Vitamins</TabsTrigger>
            <TabsTrigger value="minerals">Minerals</TabsTrigger>
          </TabsList>
          
          <TabsContent value="macros" className="space-y-4">
            <div className="flex flex-col items-center justify-center py-4">
              <MacronutrientChart 
                protein={macroPercentages.protein} 
                carbs={macroPercentages.carbs} 
                fat={macroPercentages.fat} 
                size={240}
              />
              
              {!dietPlan && food && (
                <div className="text-center mt-4">
                  <p className="text-sm text-muted-foreground">Per serving</p>
                  <p className="text-2xl font-bold">{Math.round(calories)} kcal</p>
                  <div className="flex justify-center gap-6 mt-4 text-sm">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white bg-[#4CAF50] mx-auto shadow-md">
                        {macroPercentages.protein}%
                      </div>
                      <p className="font-medium mt-2">Protein</p>
                      <p>{Math.round(protein)}g</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white bg-[#2196F3] mx-auto shadow-md">
                        {macroPercentages.carbs}%
                      </div>
                      <p className="font-medium mt-2">Carbs</p>
                      <p>{Math.round(carbs)}g</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white bg-[#FF9800] mx-auto shadow-md">
                        {macroPercentages.fat}%
                      </div>
                      <p className="font-medium mt-2">Fat</p>
                      <p>{Math.round(fat)}g</p>
                    </div>
                  </div>
                </div>
              )}
              
              {dietPlan && dietPlan.meals && (
                <div className="w-full mt-4">
                  <h3 className="text-sm font-medium mb-2">Daily Calorie Distribution</h3>
                  <CalorieBreakdownChart 
                    meals={dietPlan.meals} 
                    dailyGoal={dietPlan.calorieGoal} 
                    height={220} 
                    width={400} 
                  />
                  <ul className="mt-4 space-y-1 text-sm">
                    {dietPlan.meals.map((meal, i) => (
                      <li key={i} className="flex justify-between">
                        <span>{meal.name}</span>
                        <span className="font-medium">{meal.calories} kcal</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="vitamins">
            {vitamins.length > 0 ? (
              <div className="p-2">
                <NutrientBarChart 
                  data={vitamins} 
                  title="Vitamin Content" 
                  height={300} 
                  width={500} 
                />
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  {vitamins.map((vitamin, i) => (
                    <div key={i} className="flex justify-between">
                      <span>{vitamin.name}</span>
                      <span>
                        {vitamin.value.toFixed(1)} {vitamin.unit} 
                        {vitamin.percentage ? ` (${vitamin.percentage}% DV)` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                No vitamin data available
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="minerals">
            {minerals.length > 0 ? (
              <div className="p-2">
                <NutrientBarChart 
                  data={minerals} 
                  title="Mineral Content" 
                  height={300} 
                  width={500} 
                />
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  {minerals.map((mineral, i) => (
                    <div key={i} className="flex justify-between">
                      <span>{mineral.name}</span>
                      <span>
                        {mineral.value.toFixed(1)} {mineral.unit} 
                        {mineral.percentage ? ` (${mineral.percentage}% DV)` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                No mineral data available
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
