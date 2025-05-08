import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getFoodDetails, getFoodNutrients, saveFood, removeSavedFood } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import NutritionalChart from "@/components/diet/nutritional-chart";
import { formatNutrientValue } from "@/lib/usda";
import { translateFood, translateUI } from "@/lib/translations";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Share2, Printer, BookmarkPlus, BookmarkCheck } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FoodDetailProps {
  fdcId: string;
}

export default function FoodDetail({ fdcId }: FoodDetailProps) {
  const { toast } = useToast();
  
  // Fetch food details
  const { 
    data: food, 
    isLoading: isLoadingFood,
    error: foodError
  } = useQuery({
    queryKey: [`/api/foods/${fdcId}`],
    queryFn: () => getFoodDetails(fdcId),
  });
  
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
  
  // Loading state
  if (isLoadingFood) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-pulse text-primary">Loading food details...</div>
      </div>
    );
  }
  
  // Error state
  if (foodError) {
    return (
      <div className="text-center text-destructive p-4">
        <p>Error loading food details.</p>
        <p className="text-sm">{foodError instanceof Error ? foodError.message : "Unknown error"}</p>
      </div>
    );
  }
  
  if (!food) {
    return (
      <div className="text-center text-muted-foreground p-4">
        Food not found
      </div>
    );
  }
  
  // Helper function to check if a nutrient exists
  const hasNutrient = (name: string) => {
    return nutrients?.some((n: any) => n.name === name || (typeof n.name === 'string' && n.name.includes(name)));
  };

  // For debugging
  console.log('Nutrients received:', nutrients?.length, nutrients?.map((n: any) => n.name).join(', '));

  // Group nutrients by category for display
  const macronutrients = nutrients?.filter((n: any) => 
    typeof n.name === 'string' && 
    ["Protein", "Total lipid (fat)", "Carbohydrate, by difference", "Fiber, total dietary", "Sugars, total", "Energy"].some(
      macroName => n.name.includes(macroName)
    )
  ) || [];
  
  // For debugging
  console.log('Macronutrients:', macronutrients?.map((n: any) => n.name).join(', '));
  
  const nutrientCategories: Record<string, any[]> = {
    [translateUI("Macronutrients")]: macronutrients,
    [translateUI("Vitamins")]: nutrients?.filter((n: any) => 
      typeof n.name === 'string' && (
        n.name.includes("Vitamin") || 
        n.name.includes("vitamin") || 
        n.name.includes("Folate") ||
        n.name.includes("Niacin") ||
        n.name.includes("Riboflavin") ||
        n.name.includes("Thiamin")
      )
    ) || [],
    [translateUI("Minerals")]: nutrients?.filter((n: any) => 
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
    [translateUI("Fatty Acids")]: nutrients?.filter((n: any) => 
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
    [translateUI("Other Nutrients")]: nutrients?.filter((n: any) => 
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
              <CardTitle className="text-2xl">{translateFood(food.description)}</CardTitle>
              {food.brandName && (
                <CardDescription className="text-md">
                  {food.brandName}
                </CardDescription>
              )}
            </div>
            <Badge>{translateFood(food.dataType || "")}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {food.foodCategory && (
              <Badge variant="outline" className="text-xs">
                {translateFood(food.foodCategory)}
              </Badge>
            )}
            {food.foodAttributes && Array.isArray(food.foodAttributes) && food.foodAttributes.map((attr: any, i: number) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {attr && attr.value}
              </Badge>
            ))}
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
                  {translateUI("Saved")}
                </>
              ) : (
                <>
                  <BookmarkPlus className="h-4 w-4 mr-2" />
                  {translateUI("Save")}
                </>
              )}
            </Button>
            
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              {translateUI("Share")}
            </Button>
            
            <Button variant="outline" size="sm">
              <Printer className="h-4 w-4 mr-2" />
              {translateUI("Print")}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {nutrients && nutrients.length > 0 && (
            <NutritionalChart 
              food={food} 
              nutrients={nutrients} 
            />
          )}
        </div>
        
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{translateUI("Nutrition Facts")}</CardTitle>
              <CardDescription>
                {translateUI("Serving Size")}: {food.servingSize || "100"}{food.servingSizeUnit || "g"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {nutrients && nutrients.length > 0 ? (
                <Tabs defaultValue="all">
                  <TabsList className="grid grid-cols-4 mb-4">
                    <TabsTrigger value="all" className="px-1">{translateUI("All")}</TabsTrigger>
                    <TabsTrigger value="macros" className="px-1">{translateUI("Macros")}</TabsTrigger>
                    <TabsTrigger value="vitamins" className="px-1">{translateUI("Vitamins")}</TabsTrigger>
                    <TabsTrigger value="minerals" className="px-1">{translateUI("Minerals")}</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="all">
                    <ScrollArea className="h-[400px] pr-4">
                      {Object.entries(nutrientCategories).map(([category, categoryNutrients]) => (
                        <div key={category} className="mb-4">
                          <h3 className="font-medium text-sm mb-2">{category}</h3>
                          <div className="space-y-1">
                            {Array.isArray(categoryNutrients) && categoryNutrients.length > 0 ? 
                              // For vitamins, minerals, fatty acids
                              categoryNutrients.map((nutrient: any, i: number) => (
                                <div key={i} className="flex justify-between text-sm">
                                  <span>{nutrient.name && typeof nutrient.name === 'string' && translateFood(nutrient.name)}</span>
                                  <span className="font-mono">
                                    {formatNutrientValue(nutrient.amount, nutrient.unit)}
                                    {nutrient.percentDailyValue ? ` (${nutrient.percentDailyValue}% DV)` : ""}
                                  </span>
                                </div>
                              )) :
                              // For macronutrients (strings array)
                              nutrients && Array.isArray(nutrients) && Array.isArray(categoryNutrients) && 
                              nutrients
                                .filter((n: any) => categoryNutrients.includes(n.name))
                                .map((nutrient: any, i: number) => (
                                  <div key={i} className="flex justify-between text-sm">
                                    <span>{nutrient.name && typeof nutrient.name === 'string' && translateFood(nutrient.name)}</span>
                                    <span className="font-mono">
                                      {formatNutrientValue(nutrient.amount, nutrient.unit)}
                                      {nutrient.percentDailyValue ? ` (${nutrient.percentDailyValue}% DV)` : ""}
                                    </span>
                                  </div>
                                ))
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
                        {nutrients && Array.isArray(nutrients) && 
                          nutrients
                          .filter((n: any) => Array.isArray(nutrientCategories[translateUI("Macronutrients")]) && nutrientCategories[translateUI("Macronutrients")].includes(n.name))
                          .map((nutrient: any, i: number) => (
                            <div key={i} className="flex justify-between text-sm">
                              <span>{nutrient.name && typeof nutrient.name === 'string' && translateFood(nutrient.name)}</span>
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
                        {nutrientCategories[translateUI("Vitamins")] && 
                         Array.isArray(nutrientCategories[translateUI("Vitamins")]) && 
                         nutrientCategories[translateUI("Vitamins")].map((nutrient: any, i: number) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span>{nutrient.name && typeof nutrient.name === 'string' && translateFood(nutrient.name)}</span>
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
                        {nutrientCategories[translateUI("Minerals")] && 
                         Array.isArray(nutrientCategories[translateUI("Minerals")]) && 
                         nutrientCategories[translateUI("Minerals")].map((nutrient: any, i: number) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span>{nutrient.name && typeof nutrient.name === 'string' && translateFood(nutrient.name)}</span>
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
                  <p>{translateUI("No nutritional information available")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
