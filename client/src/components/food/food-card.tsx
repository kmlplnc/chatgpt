import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Food } from "@shared/schema";
import { Link } from "wouter";
import { Eye, BookmarkPlus, Info } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { saveFood, removeSavedFood } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { translateFood, translateUI } from "@/lib/i18n";

interface FoodNutrient {
  nutrientName: string;
  value: number;
  unitName: string;
}

interface FoodCardProps {
  food: Food;
}

export default function FoodCard({ food }: FoodCardProps) {
  const { toast } = useToast();
  
  // Check if food is saved
  const { data: savedFoods } = useQuery({
    queryKey: ["/api/saved-foods"],
    queryFn: () => fetch("/api/saved-foods").then(res => res.json()),
  });
  
  const isSaved = savedFoods?.some((saved: any) => saved.fdcId === food.fdcId);
  
  // Save food mutation
  const saveMutation = useMutation({
    mutationFn: saveFood,
    onSuccess: () => {
      toast({
        title: "Food saved",
        description: "Food added to your saved items",
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
  
  // Handle save button click
  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    saveMutation.mutate(food.fdcId);
  };
  
  const nutrients = food.foodNutrients ? (food.foodNutrients as FoodNutrient[]).filter(n => 
    ["Protein", "Total lipid (fat)", "Carbohydrate, by difference", "Energy"].includes(n.nutrientName)
  ) : [];
  
  return (
    <Card className="overflow-hidden h-full flex flex-col hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex-grow">
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-start mb-2">
            <div className="text-xs border rounded-sm p-1 inline-block">
              {typeof food.dataType === "string" ? food.dataType : ""}
            </div>
            {food.publishedDate && (
              <span className="text-xs text-muted-foreground">
                {new Date(food.publishedDate).getFullYear()}
              </span>
            )}
          </div>
          
          <h3 className="font-medium line-clamp-2 mb-1">{translateFood(food.description)}</h3>
          
          {food.brandName && (
            <p className="text-sm text-muted-foreground mb-2">{food.brandName}</p>
          )}
          
          <div className="mt-auto">
            {food.foodCategory && (
              <p className="text-xs text-muted-foreground mt-2">
                {translateUI("Category:")}{" "}{translateFood(food.foodCategory)}
              </p>
            )}
            
            {nutrients.map((nutrient) => (
              <div key={nutrient.nutrientName} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{nutrient.nutrientName}</span>
                <span className="font-medium">
                  {nutrient.value} {nutrient.unitName}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 border-t">
        <div className="flex justify-between w-full">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/food/${food.fdcId}`}>
              <Eye className="h-4 w-4 mr-1" /> {translateUI("View")}
            </Link>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSave}
            disabled={saveMutation.isPending || isSaved}
          >
            <BookmarkPlus className="h-4 w-4 mr-1" />
            {isSaved ? translateUI("Saved") : translateUI("Save")}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
