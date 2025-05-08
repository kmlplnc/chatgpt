import React from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getFoodDetails, getFoodNutrients } from "@/lib/api";
import { ArrowLeft, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function FoodDetailPage() {
  const { id } = useParams();
  const [_, setLocation] = useLocation();
  
  // Fetch food details
  const { 
    data: food, 
    isLoading: isLoadingFood,
    error: foodError,
    isError: isFoodError
  } = useQuery({
    queryKey: [`/api/foods/${id}`],
    queryFn: () => getFoodDetails(id),
  });
  
  // Fetch food nutrients
  const { 
    data: nutrients, 
    isLoading: isLoadingNutrients,
    error: nutrientsError,
    isError: isNutrientsError
  } = useQuery({
    queryKey: [`/api/foods/${id}/nutrients`],
    queryFn: () => getFoodNutrients(id),
    enabled: !!food,
  });
  
  // Handle back button click
  const handleBack = () => {
    setLocation("/food-database");
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Food Details</h1>
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Database
        </Button>
      </div>
      
      {(isFoodError || isNutrientsError) && (
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {isFoodError ? 
              `Failed to load food details: ${foodError instanceof Error ? foodError.message : "Unknown error"}` : 
              `Failed to load nutrient information: ${nutrientsError instanceof Error ? nutrientsError.message : "Unknown error"}`
            }
          </AlertDescription>
        </Alert>
      )}
      
      {isLoadingFood ? (
        <div className="space-y-4">
          <div className="h-32 animate-pulse bg-muted rounded-lg w-full"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 h-96 animate-pulse bg-muted rounded-lg"></div>
            <div className="h-96 animate-pulse bg-muted rounded-lg"></div>
          </div>
        </div>
      ) : food ? (
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
                  {typeof food.dataType === 'string' ? food.dataType : 'Foundation'}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {food.foodCategory && (
                  <div className="text-xs border px-2 py-1 rounded-md">
                    {food.foodCategory}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Food Not Found</AlertTitle>
          <AlertDescription>
            The food you're looking for could not be found. It may have been removed or the ID is incorrect.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
