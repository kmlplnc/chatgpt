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
    queryKey: [`/api/foods/${id || ''}`],
    queryFn: () => id ? getFoodDetails(id) : Promise.reject('No food ID provided'),
    enabled: !!id,
  });
  
  // Fetch food nutrients
  const { 
    data: nutrients, 
    isLoading: isLoadingNutrients,
    error: nutrientsError,
    isError: isNutrientsError
  } = useQuery({
    queryKey: [`/api/foods/${id || ''}/nutrients`],
    queryFn: () => id ? getFoodNutrients(id) : Promise.reject('No food ID provided'),
    enabled: !!id && !!food,
  });
  
  // Handle back button click
  const handleBack = () => {
    setLocation("/food-database");
  };
  
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 animate-page-transition">
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
                  <CardTitle className="text-2xl">{typeof food.description === 'string' ? food.description : 'Food Details'}</CardTitle>
                  {food.brandName && typeof food.brandName === 'string' && (
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
                {food.foodCategory && typeof food.foodCategory === 'string' && (
                  <div className="text-xs border px-2 py-1 rounded-md">
                    {food.foodCategory}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {nutrients && nutrients.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Makro Besinler</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      {/* Macro nutrients - top boxes */}
                      {nutrients.filter((n: any) => 
                        typeof n.name === 'string' && (
                          n.name.includes("Protein") || 
                          n.name.includes("Carbohydrate") || 
                          n.name.includes("Total Fat") ||
                          n.name.includes("Total lipid") ||
                          n.name.includes("Energy")
                        )
                      ).slice(0, 3).map((nutrient: any, i: number) => (
                        <div key={i} className="bg-slate-50 p-4 rounded-lg text-center">
                          <div className="text-2xl font-bold">
                            {typeof nutrient.amount === 'number' ? nutrient.amount.toFixed(1) : nutrient.amount} {nutrient.unit}
                          </div>
                          <div className="text-sm text-slate-500">
                            {typeof nutrient.name === 'string' ? nutrient.name : 'Besin'}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Progress bars for macros with percentages */}
                    <div className="space-y-4">
                      {nutrients.filter((n: any) => 
                        typeof n.name === 'string' && (
                          n.name.includes("Protein") || 
                          n.name.includes("Carbohydrate") || 
                          n.name.includes("Total Fat") ||
                          n.name.includes("Total lipid")
                        )
                      ).map((nutrient: any, i: number) => {
                        // Calculate percentages - can be refined based on actual daily values
                        const maxValues: Record<string, number> = {
                          "Protein": 50,
                          "Carbohydrate": 300,
                          "Total Fat": 65,
                          "Total lipid": 65
                        };
                        
                        const percentKey = Object.keys(maxValues).find(key => 
                          nutrient.name && typeof nutrient.name === 'string' && nutrient.name.includes(key)
                        );
                        
                        const maxValue = percentKey ? maxValues[percentKey] : 100;
                        const percentage = Math.min(Math.round((nutrient.amount / maxValue) * 100), 100);

                        // Choose color based on type
                        const colors: Record<string, string> = {
                          "Protein": "bg-blue-500",
                          "Carbohydrate": "bg-orange-500", 
                          "Total Fat": "bg-rose-500",
                          "Total lipid": "bg-rose-500"
                        };
                        
                        const color = percentKey ? colors[percentKey] : "bg-slate-500";
                        
                        return (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">
                                {typeof nutrient.name === 'string' ? nutrient.name : 'Besin'}
                              </span>
                              <span className="font-mono">
                                {typeof nutrient.amount === 'number' ? nutrient.amount.toFixed(1) : nutrient.amount} {nutrient.unit} ({percentage}%)
                              </span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full ${color}`} style={{ width: `${percentage}%` }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg">Besin Değerleri</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <Tabs defaultValue="all">
                      <TabsList className="grid grid-cols-4 mb-4">
                        <TabsTrigger value="all" className="px-1">Tümü</TabsTrigger>
                        <TabsTrigger value="vitamins" className="px-1">Vitaminler</TabsTrigger>
                        <TabsTrigger value="minerals" className="px-1">Mineraller</TabsTrigger>
                        <TabsTrigger value="others" className="px-1">Diğer</TabsTrigger>
                      </TabsList>

                      <TabsContent value="all">
                        <div className="h-[300px] overflow-y-auto pr-2">
                          {nutrients.map((nutrient: any, i: number) => (
                            <div key={i} className="flex justify-between text-sm border-b pb-1 mb-1">
                              <span className="mr-2">{typeof nutrient.name === 'string' ? nutrient.name : 'Besin'}</span>
                              <span className="font-mono">
                                {typeof nutrient.amount === 'number' ? nutrient.amount.toFixed(1) : nutrient.amount} {nutrient.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      </TabsContent>

                      <TabsContent value="vitamins">
                        <div className="h-[300px] overflow-y-auto pr-2">
                          {nutrients.filter((n: any) => 
                            typeof n.name === 'string' && (
                              n.name.includes("Vitamin") || 
                              n.name.includes("vitamin") || 
                              n.name.includes("Folate") ||
                              n.name.includes("Niacin") ||
                              n.name.includes("Riboflavin") ||
                              n.name.includes("Thiamin")
                            )
                          ).map((nutrient: any, i: number) => {
                            // Calculate DV percentage where possible
                            const dvValues: Record<string, number> = {
                              "Vitamin A": 900, // mcg
                              "Vitamin C": 90, // mg
                              "Vitamin D": 20, // mcg
                              "Vitamin E": 15, // mg
                              "Vitamin K": 120, // mcg
                              "Thiamin": 1.2, // mg
                              "Riboflavin": 1.3, // mg
                              "Niacin": 16, // mg
                              "Vitamin B-6": 1.7, // mg
                              "Folate": 400, // mcg
                              "Vitamin B-12": 2.4, // mcg
                            };
                            
                            const dvKey = Object.keys(dvValues).find(key => 
                              nutrient.name && typeof nutrient.name === 'string' && 
                              nutrient.name.includes(key)
                            );
                            
                            const dvValue = dvKey ? dvValues[dvKey] : null;
                            const dvPercentage = dvValue && nutrient.amount ? 
                              Math.round((nutrient.amount / dvValue) * 100) : null;
                            
                            return (
                              <div key={i} className="flex justify-between text-sm border-b pb-1 mb-1">
                                <span className="mr-2">{typeof nutrient.name === 'string' ? nutrient.name : 'Vitamin'}</span>
                                <span className="font-mono">
                                  {typeof nutrient.amount === 'number' ? nutrient.amount.toFixed(1) : nutrient.amount} {nutrient.unit}
                                  {dvPercentage !== null ? ` (${dvPercentage}% DV)` : ''}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </TabsContent>

                      <TabsContent value="minerals">
                        <div className="h-[300px] overflow-y-auto pr-2">
                          {nutrients.filter((n: any) => 
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
                          ).map((nutrient: any, i: number) => {
                            // Calculate DV percentage where possible
                            const dvValues: Record<string, number> = {
                              "Calcium": 1300, // mg
                              "Iron": 18, // mg
                              "Magnesium": 420, // mg
                              "Phosphorus": 1250, // mg
                              "Potassium": 4700, // mg
                              "Sodium": 2300, // mg
                              "Zinc": 11, // mg
                              "Copper": 0.9, // mg
                              "Manganese": 2.3, // mg
                              "Selenium": 55, // mcg
                            };
                            
                            const dvKey = Object.keys(dvValues).find(key => 
                              nutrient.name && typeof nutrient.name === 'string' && 
                              nutrient.name.includes(key)
                            );
                            
                            const dvValue = dvKey ? dvValues[dvKey] : null;
                            const dvPercentage = dvValue && nutrient.amount ? 
                              Math.round((nutrient.amount / dvValue) * 100) : null;
                            
                            return (
                              <div key={i} className="flex justify-between text-sm border-b pb-1 mb-1">
                                <span className="mr-2">{typeof nutrient.name === 'string' ? nutrient.name : 'Mineral'}</span>
                                <span className="font-mono">
                                  {typeof nutrient.amount === 'number' ? nutrient.amount.toFixed(1) : nutrient.amount} {nutrient.unit}
                                  {dvPercentage !== null ? ` (${dvPercentage}% DV)` : ''}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </TabsContent>

                      <TabsContent value="others">
                        <div className="h-[300px] overflow-y-auto pr-2">
                          {nutrients.filter((n: any) => 
                            typeof n.name === 'string' && !(
                              n.name.includes("Vitamin") || 
                              n.name.includes("vitamin") || 
                              n.name.includes("Calcium") || 
                              n.name.includes("Iron") || 
                              n.name.includes("Magnesium") || 
                              n.name.includes("Phosphorus") || 
                              n.name.includes("Potassium") || 
                              n.name.includes("Sodium") || 
                              n.name.includes("Zinc") ||
                              n.name.includes("Protein") || 
                              n.name.includes("Carbohydrate") || 
                              n.name.includes("Total Fat") ||
                              n.name.includes("Total lipid") ||
                              n.name.includes("Energy")
                            )
                          ).map((nutrient: any, i: number) => (
                            <div key={i} className="flex justify-between text-sm border-b pb-1 mb-1">
                              <span className="mr-2">{typeof nutrient.name === 'string' ? nutrient.name : 'Besin'}</span>
                              <span className="font-mono">
                                {typeof nutrient.amount === 'number' ? nutrient.amount.toFixed(1) : nutrient.amount} {nutrient.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
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
