import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getFoodNutrients, saveFood, removeSavedFood } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { formatNutrientValue } from "@/lib/usda";

// Simple translation functions
const simplifiedUI = (text: string) => text;
const simplifiedFood = (text: string | null | undefined) => text || "";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookmarkPlus, BookmarkCheck, Share2, Printer } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FoodDetailProps {
  fdcId: string;
  food: any;
}

export default function FoodDetailSimple({ fdcId, food }: FoodDetailProps) {
  const { toast } = useToast();
  
  // Fetch food nutrients
  const { 
    data: nutrients, 
    isLoading: isLoadingNutrients,
    error: nutrientsError
  } = useQuery({
    queryKey: [`/api/foods/${fdcId}/nutrients`],
    queryFn: () => getFoodNutrients(fdcId),
    enabled: !!food,
  });
  
  // Check if food is saved
  const { 
    data: savedFoods, 
    isLoading: isLoadingSaved 
  } = useQuery({
    queryKey: ["/api/saved-foods"],
    queryFn: () => fetch("/api/saved-foods").then(res => res.json()),
  });
  
  const isSaved = savedFoods?.some((saved: any) => saved.fdcId === fdcId);
  
  // Save/remove food mutations
  const saveMutation = useMutation({
    mutationFn: saveFood,
    onSuccess: () => {
      toast({
        title: "Food saved",
        description: "Food added to your saved foods",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/saved-foods"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save food: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    },
  });
  
  const removeMutation = useMutation({
    mutationFn: removeSavedFood,
    onSuccess: () => {
      toast({
        title: "Food removed",
        description: "Food removed from your saved foods",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/saved-foods"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to remove food: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle save/unsave
  const handleSaveToggle = () => {
    if (isSaved) {
      removeMutation.mutate(fdcId);
    } else {
      saveMutation.mutate(fdcId);
    }
  };

  // Group nutrients by category for display
  const macronutrients = nutrients?.filter((n: any) => 
    typeof n.name === 'string' && 
    (n.name.includes("Protein") || 
     n.name.includes("Total lipid") || 
     n.name.includes("Total Fat") || 
     n.name.includes("Carbohydrate") || 
     n.name.includes("Fiber") || 
     n.name.includes("Sugars") || 
     n.name.includes("Energy") ||
     n.name.includes("Calories"))
  ) || [];
  
  const nutrientCategories: Record<string, any[]> = {
    "Macronutrients": macronutrients,
    "Vitamins": nutrients?.filter((n: any) => 
      typeof n.name === 'string' && (
        n.name.includes("Vitamin") || 
        n.name.includes("vitamin") || 
        n.name.includes("Folate") ||
        n.name.includes("Niacin") ||
        n.name.includes("Riboflavin") ||
        n.name.includes("Thiamin")
      )
    ) || [],
    "Minerals": nutrients?.filter((n: any) => 
      typeof n.name === 'string' && (
        n.name.includes("Calcium") || 
        n.name.includes("Iron") || 
        n.name.includes("Magnesium") || 
        n.name.includes("Phosphorus") || 
        n.name.includes("Potassium") || 
        n.name.includes("Sodium") || 
        n.name.includes("Zinc") ||
        n.name.includes("Copper") ||
        n.name.includes("Manganese") ||
        n.name.includes("Selenium") ||
        n.name.includes("Fluoride")
      )
    ) || [],
    "Fatty Acids": nutrients?.filter((n: any) => 
      typeof n.name === 'string' && (
        n.name.includes("fatty acid") || 
        n.name.includes("Fatty acids") ||
        n.name.includes("saturated") ||
        n.name.includes("monounsaturated") ||
        n.name.includes("polyunsaturated") ||
        n.name.includes("trans") ||
        n.name.includes("Cholesterol")
      )
    ) || [],
    "Other Nutrients": nutrients?.filter((n: any) => 
      typeof n.name === 'string' && (
        !n.name.includes("Vitamin") && 
        !n.name.includes("vitamin") && 
        !n.name.includes("Calcium") && 
        !n.name.includes("Iron") && 
        !n.name.includes("Magnesium") && 
        !n.name.includes("Phosphorus") && 
        !n.name.includes("Potassium") && 
        !n.name.includes("Sodium") && 
        !n.name.includes("Zinc") &&
        !n.name.includes("fatty acid") &&
        !n.name.includes("Fatty acids") &&
        !n.name.includes("saturated") &&
        !n.name.includes("monounsaturated") &&
        !n.name.includes("polyunsaturated") &&
        !n.name.includes("trans") &&
        !n.name.includes("Cholesterol") &&
        !["Protein", "Total Fat", "Carbohydrates", "Fiber", "Sugars", "Calories"].includes(n.name)
      )
    ) || [],
  };
  
  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{food.description}</CardTitle>
              {food.brandName && (
                <CardDescription className="text-md">
                  {food.brandName}
                </CardDescription>
              )}
            </div>
            <div className="text-sm border px-2 py-1 rounded-md">
              {typeof food.dataType === 'string' ? simplifiedFood(food.dataType) : 'Foundation'}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {food.foodCategory && (
              <div className="text-xs border px-2 py-1 rounded-md">
                {simplifiedFood(food.foodCategory)}
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-4 mt-4">
            <Button 
              variant={isSaved ? "default" : "outline"} 
              size="sm"
              onClick={handleSaveToggle}
              disabled={saveMutation.isPending || removeMutation.isPending || isLoadingSaved}
            >
              {isSaved ? (
                <>
                  <BookmarkCheck className="h-4 w-4 mr-2" />
                  {simplifiedUI("Saved")}
                </>
              ) : (
                <>
                  <BookmarkPlus className="h-4 w-4 mr-2" />
                  {simplifiedUI("Save")}
                </>
              )}
            </Button>
            
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              {simplifiedUI("Share")}
            </Button>
            
            <Button variant="outline" size="sm">
              <Printer className="h-4 w-4 mr-2" />
              {simplifiedUI("Print")}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {isLoadingNutrients ? (
            <div className="flex justify-center items-center h-64 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Loading nutritional data...</p>
            </div>
          ) : nutrients && nutrients.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Nutrition Chart</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <h3 className="font-medium">Macronutrients</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {macronutrients.slice(0, 3).map((nutrient, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold">
                          {formatNutrientValue(nutrient.amount, nutrient.unit)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {simplifiedFood(nutrient.name)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex justify-center items-center h-64 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No nutritional data available</p>
            </div>
          )}
        </div>
        
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{simplifiedUI("Nutrition Facts")}</CardTitle>
              <CardDescription>
                {simplifiedUI("Serving Size")}: {food.servingSize || "100"}{food.servingSizeUnit || "g"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {nutrients && nutrients.length > 0 ? (
                <Tabs defaultValue="all">
                  <TabsList className="grid grid-cols-4 mb-4">
                    <TabsTrigger value="all" className="px-1">{simplifiedUI("All")}</TabsTrigger>
                    <TabsTrigger value="macros" className="px-1">{simplifiedUI("Macros")}</TabsTrigger>
                    <TabsTrigger value="vitamins" className="px-1">{simplifiedUI("Vitamins")}</TabsTrigger>
                    <TabsTrigger value="minerals" className="px-1">{simplifiedUI("Minerals")}</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="all">
                    <ScrollArea className="h-[400px] pr-4">
                      {Object.entries(nutrientCategories).map(([category, categoryNutrients]) => (
                        <div key={category} className="mb-4">
                          <h3 className="font-medium text-sm mb-2">{category}</h3>
                          <div className="space-y-1">
                            {Array.isArray(categoryNutrients) && categoryNutrients.length > 0 ? 
                              categoryNutrients.map((nutrient: any, i: number) => (
                                <div key={i} className="flex justify-between text-sm">
                                  <span>{nutrient.name && typeof nutrient.name === 'string' ? simplifiedFood(nutrient.name) : ''}</span>
                                  <span className="font-mono">
                                    {formatNutrientValue(nutrient.amount, nutrient.unit)}
                                    {nutrient.percentDailyValue ? ` (${nutrient.percentDailyValue}% DV)` : ""}
                                  </span>
                                </div>
                              )) : null
                            }
                          </div>
                          <Separator className="my-2" />
                        </div>
                      ))}
                    </ScrollArea>
                  </TabsContent>
                  
                  <TabsContent value="macros">
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-1">
                        {macronutrients && Array.isArray(macronutrients) && macronutrients.length > 0 && 
                          macronutrients.map((nutrient: any, i: number) => (
                            <div key={i} className="flex justify-between text-sm">
                              <span>{nutrient.name && typeof nutrient.name === 'string' ? simplifiedFood(nutrient.name) : ''}</span>
                              <span className="font-mono">
                                {formatNutrientValue(nutrient.amount, nutrient.unit)}
                                {nutrient.percentDailyValue ? ` (${nutrient.percentDailyValue}% DV)` : ""}
                              </span>
                            </div>
                          ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  
                  <TabsContent value="vitamins">
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-1">
                        {nutrientCategories["Vitamins"] && 
                         Array.isArray(nutrientCategories["Vitamins"]) && 
                         nutrientCategories["Vitamins"].map((nutrient: any, i: number) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span>{nutrient.name && typeof nutrient.name === 'string' ? simplifiedFood(nutrient.name) : ''}</span>
                            <span className="font-mono">
                              {formatNutrientValue(nutrient.amount, nutrient.unit)}
                              {nutrient.percentDailyValue ? ` (${nutrient.percentDailyValue}% DV)` : ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  
                  <TabsContent value="minerals">
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-1">
                        {nutrientCategories["Minerals"] && 
                         Array.isArray(nutrientCategories["Minerals"]) && 
                         nutrientCategories["Minerals"].map((nutrient: any, i: number) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span>{nutrient.name && typeof nutrient.name === 'string' ? simplifiedFood(nutrient.name) : ''}</span>
                            <span className="font-mono">
                              {formatNutrientValue(nutrient.amount, nutrient.unit)}
                              {nutrient.percentDailyValue ? ` (${nutrient.percentDailyValue}% DV)` : ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="py-8 text-center">
                  <p>{simplifiedUI("No nutritional information available")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}