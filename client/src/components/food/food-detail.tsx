import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { getFoodDetails, getFoodNutrients, saveFood, removeSavedFood } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import NutritionalChart from "@/components/diet/nutritional-chart";
import { formatNutrientValue } from "@/lib/usda";
// Çeviri fonksiyonlarının yerine basit fonksiyon tanımlayalım
const simplifiedUI = (text: string) => text;
const simplifiedFood = (text: string | null | undefined) => text || "";
// Backward compatibility with old code
const translateUI = simplifiedUI;
const translateFood = simplifiedFood;

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
  // Makro besinler için özel bir filtreleme yapalım
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
  
  // For debugging
  console.log('Macronutrients:', macronutrients?.map((n: any) => n.name).join(', '));
  
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
            <div>
              {typeof food.dataType === 'string' ? simplifiedFood(food.dataType) : 'Foundation'}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {food.foodCategory && (
              <div className="text-xs border rounded p-1">
                {simplifiedFood(food.foodCategory)}
              </div>
            )}
            {/* Food attributes removed to fix rendering issue */}
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
                              // For vitamins, minerals, fatty acids
                              categoryNutrients.map((nutrient: any, i: number) => (
                                <div key={i} className="flex justify-between text-sm">
                                  <span>{nutrient.name && typeof nutrient.name === 'string' && simplifiedFood(nutrient.name)}</span>
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
                                    <span>{nutrient.name && typeof nutrient.name === 'string' && simplifiedFood(nutrient.name)}</span>
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
                        {macronutrients && Array.isArray(macronutrients) && macronutrients.length > 0 && 
                          macronutrients.map((nutrient: any, i: number) => (
                            <div key={i} className="flex justify-between text-sm">
                              <span>{nutrient.name && typeof nutrient.name === 'string' && simplifiedFood(nutrient.name)}</span>
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
                            <span>{nutrient.name && typeof nutrient.name === 'string' && simplifiedFood(nutrient.name)}</span>
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
                            <span>{nutrient.name && typeof nutrient.name === 'string' && simplifiedFood(nutrient.name)}</span>
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