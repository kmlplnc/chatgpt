import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Apple, BookmarkIcon, Search, FastForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import FoodSearch from "@/components/food/food-search";
import FoodCard from "@/components/food/food-card";
import { useQuery } from "@tanstack/react-query";

export default function FoodDatabase() {
  // Fetch saved foods
  const { 
    data: savedFoods, 
    isLoading: isLoadingSavedFoods 
  } = useQuery({
    queryKey: ["/api/saved-foods"],
  });
  
  // Fetch recent foods
  const { 
    data: recentFoods, 
    isLoading: isLoadingRecentFoods 
  } = useQuery({
    queryKey: ["/api/foods/recent"],
  });
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Food Database</h1>
        <p className="text-muted-foreground">
          Search our comprehensive database of over 300,000 foods with detailed nutritional information
        </p>
      </div>
      
      <Tabs defaultValue="search" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="search">
            <Search className="h-4 w-4 mr-2" />
            Search Foods
          </TabsTrigger>
          <TabsTrigger value="saved">
            <BookmarkIcon className="h-4 w-4 mr-2" />
            Saved Foods
          </TabsTrigger>
          <TabsTrigger value="recent">
            <FastForward className="h-4 w-4 mr-2" />
            Recently Viewed
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="search">
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle>Search Foods</CardTitle>
              <CardDescription>
                Enter a food name, brand, or ingredient to search our database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FoodSearch />
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Food Data Types</CardTitle>
                <CardDescription>
                  Understanding the different food data sources
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Foundation Foods</h3>
                  <p className="text-sm text-muted-foreground">
                    Nutrient values derived from analyses, recipes, and other calculations. The most accurate and complete data.
                  </p>
                  <Separator className="my-2" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Standard Reference (SR Legacy)</h3>
                  <p className="text-sm text-muted-foreground">
                    Basic foods and ingredients containing nutrient data from USDA's National Nutrient Database.
                  </p>
                  <Separator className="my-2" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Survey Foods (FNDDS)</h3>
                  <p className="text-sm text-muted-foreground">
                    Foods reported in the What We Eat in America (WWEIA) dietary survey.
                  </p>
                  <Separator className="my-2" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Branded Foods</h3>
                  <p className="text-sm text-muted-foreground">
                    Commercial products from manufacturers with Nutrition Facts labels.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Nutritional Information</CardTitle>
                <CardDescription>
                  Understand the nutritional data available for each food
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Macronutrients</h3>
                  <p className="text-sm text-muted-foreground">
                    Data on protein, carbohydrates, fats, and calories - the main energy-providing components of food.
                  </p>
                  <Separator className="my-2" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Vitamins & Minerals</h3>
                  <p className="text-sm text-muted-foreground">
                    Essential micronutrients including all major vitamins (A, B complex, C, D, E, K) and minerals (calcium, iron, zinc, etc.).
                  </p>
                  <Separator className="my-2" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Other Components</h3>
                  <p className="text-sm text-muted-foreground">
                    Additional nutritional factors like fiber, cholesterol, fatty acid profiles, amino acids, and more.
                  </p>
                  <Separator className="my-2" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Daily Values</h3>
                  <p className="text-sm text-muted-foreground">
                    Percentage of recommended daily intake for many nutrients based on a 2,000 calorie diet.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="saved">
          {isLoadingSavedFoods ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-56 animate-pulse bg-muted rounded-lg"></div>
              ))}
            </div>
          ) : !savedFoods || savedFoods.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Apple className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Saved Foods</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't saved any foods yet. Search for foods and bookmark them for easy access.
                </p>
                <Button asChild>
                  <TabsTrigger value="search">Search Foods</TabsTrigger>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="food-grid">
              {savedFoods.map((food: any) => (
                <FoodCard key={food.fdcId} food={food} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="recent">
          {isLoadingRecentFoods ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-56 animate-pulse bg-muted rounded-lg"></div>
              ))}
            </div>
          ) : !recentFoods || recentFoods.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <FastForward className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Recently Viewed Foods</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't viewed any foods recently. Search for foods to see their detailed nutritional information.
                </p>
                <Button asChild>
                  <TabsTrigger value="search">Search Foods</TabsTrigger>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="food-grid">
              {recentFoods.map((food: any) => (
                <FoodCard key={food.fdcId} food={food} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
