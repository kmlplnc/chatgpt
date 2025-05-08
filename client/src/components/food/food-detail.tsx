import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getFoodDetails, getFoodNutrients, saveFood, removeSavedFood } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import NutritionalChart from "@/components/diet/nutritional-chart";
import { formatNutrientValue } from "@/lib/usda";

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
  const hasNutrient = (name) => {
    return nutrients?.some(n => n.name === name || n.name.includes(name));
  };

  // For debugging
  console.log('Nutrients received:', nutrients?.length, nutrients?.map(n => n.name).join(', '));

  // Group nutrients by category for display
  const nutrientCategories = {
    "Macronutrients": ["Protein", "Total Fat", "Carbohydrates", "Fiber", "Sugars", "Calories"],
    "Vitamins": nutrients?.filter(n => 
      n.name.includes("Vitamin") || 
      n.name.includes("vitamin") || 
      n.name.includes("Folate") ||
      n.name.includes("Niacin") ||
      n.name.includes("Riboflavin") ||
      n.name.includes("Thiamin")
    ) || [],
    "Minerals": nutrients?.filter(n => 
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
    ) || [],
    "Fatty Acids": nutrients?.filter(n => 
      n.name.includes("fatty acid") || 
      n.name.includes("Fatty acids") ||
      n.name.includes("saturated") ||
      n.name.includes("monounsaturated") ||
      n.name.includes("polyunsaturated") ||
      n.name.includes("trans") ||
      n.name.includes("Cholesterol")
    ) || [],
    "Other Nutrients": nutrients?.filter(n => 
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
            <Badge>{food.dataType}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {food.foodCategory && (
              <Badge variant="outline" className="text-xs">
                {food.foodCategory}
              </Badge>
            )}
            {food.foodAttributes && food.foodAttributes.map((attr, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {attr.value}
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
                  Saved
                </>
              ) : (
                <>
                  <BookmarkPlus className="h-4 w-4 mr-2" />
                  Save
                </>
              )}
            </Button>
            
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            
            <Button variant="outline" size="sm">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <NutritionalChart 
            food={food} 
            nutrients={nutrients} 
          />
        </div>
        
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Nutrition Facts</CardTitle>
              <CardDescription>
                Serving Size: {food.servingSize || "100"}{food.servingSizeUnit || "g"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList className="grid grid-cols-4 mb-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="macros">Macros</TabsTrigger>
                  <TabsTrigger value="vitamins">Vitamins</TabsTrigger>
                  <TabsTrigger value="minerals">Minerals</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all">
                  <ScrollArea className="h-[400px] pr-4">
                    {Object.entries(nutrientCategories).map(([category, categoryNutrients]) => (
                      <div key={category} className="mb-4">
                        <h3 className="font-medium text-sm mb-2">{category}</h3>
                        <div className="space-y-1">
                          {Array.isArray(categoryNutrients) ? 
                            // For vitamins, minerals, fatty acids
                            categoryNutrients.map((nutrient, i) => (
                              <div key={i} className="flex justify-between text-sm">
                                <span>{nutrient.name}</span>
                                <span className="font-mono">
                                  {formatNutrientValue(nutrient.amount, nutrient.unit)}
                                  {nutrient.percentDailyValue ? ` (${nutrient.percentDailyValue}% DV)` : ""}
                                </span>
                              </div>
                            )) :
                            // For macronutrients (strings array)
                            nutrients
                              ?.filter(n => categoryNutrients.includes(n.name))
                              .map((nutrient, i) => (
                                <div key={i} className="flex justify-between text-sm">
                                  <span>{nutrient.name}</span>
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
                      {nutrients
                        ?.filter(n => nutrientCategories.Macronutrients.includes(n.name))
                        .map((nutrient, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span>{nutrient.name}</span>
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
                      {nutrientCategories.Vitamins.map((nutrient, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span>{nutrient.name}</span>
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
                      {nutrientCategories.Minerals.map((nutrient, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span>{nutrient.name}</span>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
