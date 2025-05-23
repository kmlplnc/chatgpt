import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Apple, BookmarkIcon, Search, FastForward, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import FoodSearch from "@/components/food/food-search";
import FoodCard from "@/components/food/food-card";
import { useQuery } from "@tanstack/react-query";
import ProtectedFeature from "@/components/premium/protected-feature";
import { Input } from "@/components/ui/input";
import { searchFoods } from "@/lib/usda";
import type { Food } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { getQueryFn } from "@/lib/queryClient";

interface SavedFoodsResponse {
  foods: Record<string, Food>;
}

interface FoodSearchResult {
  foods: Food[];
  totalHits: number;
  pageSize: number;
  currentPage: number;
}

export default function FoodDatabase() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const { data: savedFoodsData, isLoading: isLoadingSaved } = useQuery<SavedFoodsResponse>({
    queryKey: ["/api/foods/saved"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  const { data: recentFoodsData, isLoading: isLoadingRecent } = useQuery<Food[]>({
    queryKey: ["/api/foods/recent"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  const { data: searchData, isLoading: isLoadingSearch } = useQuery<FoodSearchResult>({
    queryKey: ["/api/foods/search", searchQuery, page],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: searchQuery.length > 0,
  });
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };
  
  const savedFoods = savedFoodsData?.foods || {};
  const recentFoods = recentFoodsData || [];
  const searchResults = searchData?.foods || [];
  
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 animate-page-transition">
      <div className="w-full max-w-6xl mx-auto px-4 ml-8 md:ml-24">
        <ProtectedFeature featureName="Food Database">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Food Database</h1>
              <p className="text-muted-foreground">
                Search through our comprehensive database of over 300,000 foods
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
                      Search our database by food name, brand, or ingredients
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSearch} className="flex gap-2 mb-8">
                      <div className="relative flex-1">
                        <Input
                          type="search"
                          placeholder="Search for foods..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                      <Button type="submit" disabled={isLoadingSearch}>
                        {isLoadingSearch ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                        <span className="ml-2">Search</span>
                      </Button>
                    </form>
                  </CardContent>
                </Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <Card>
                    <CardHeader>
                      <CardTitle>Food Data Types</CardTitle>
                      <CardDescription>
                        Understanding different food data sources
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Foundation Foods</h3>
                        <p className="text-sm text-muted-foreground">
                          Nutrient values from analyses, recipes, and other calculations. Most accurate and complete data.
                        </p>
                        <Separator className="my-2" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Survey Foods</h3>
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
                      <CardTitle>Nutrition Information</CardTitle>
                      <CardDescription>
                        Understanding the nutrition data available for each food
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Macronutrients</h3>
                        <p className="text-sm text-muted-foreground">
                          Data on protein, carbohydrates, fat, and calories - the main energy-providing components of food.
                        </p>
                        <Separator className="my-2" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Vitamins and Minerals</h3>
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
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              <TabsContent value="saved">
                {isLoadingSaved ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className="h-56 animate-pulse bg-muted rounded-lg"></div>
                    ))}
                  </div>
                ) : Object.keys(savedFoods).length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Apple className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Saved Foods</h3>
                      <p className="text-muted-foreground mb-4">
                        You haven't saved any foods yet. Search for foods to bookmark them for easy access.
                      </p>
                      <Button asChild>
                        <TabsTrigger value="search">Search Foods</TabsTrigger>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="food-grid">
                    {Object.values(savedFoods).map((food: Food) => (
                      <FoodCard key={food.fdcId} food={food} />
                    ))}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="recent">
                {isLoadingRecent ? (
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
                        You haven't viewed any foods yet. Search for foods to see detailed nutrition information.
                      </p>
                      <Button asChild>
                        <TabsTrigger value="search">Search Foods</TabsTrigger>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="food-grid">
                    {recentFoods.map((food: Food) => (
                      <FoodCard key={food.fdcId} food={food} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </ProtectedFeature>
      </div>
    </div>
  );
}