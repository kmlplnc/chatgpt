import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Meal {
  name: string;
  time?: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

interface CalorieDistributionProps {
  meals: Meal[];
  dailyGoal: number;
}

export default function CalorieDistribution({ meals, dailyGoal }: CalorieDistributionProps) {
  const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
  const percentage = (totalCalories / dailyGoal) * 100;

  return (
    <Card className="bg-white shadow-md rounded-xl">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-semibold text-gray-800">
            Günlük Kalori Dağılımı
          </CardTitle>
          <div className="text-right">
            <p className="text-sm text-gray-500">Toplam</p>
            <p className="text-lg font-semibold text-gray-800">
              {totalCalories} / {dailyGoal} kcal
            </p>
            <p className="text-sm text-gray-500">(%{percentage.toFixed(1)})</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {meals.map((meal, index) => {
            const mealPercentage = (meal.calories / dailyGoal) * 100;
            const getColorClass = (percentage: number) => {
              if (percentage > 30) return 'bg-green-100';
              if (percentage > 20) return 'bg-blue-100';
              return 'bg-orange-100';
            };

            return (
              <TooltipProvider key={index}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-600">
                            {meal.name}
                          </span>
                          {meal.time && (
                            <span className="text-xs text-gray-400">
                              ({meal.time})
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-600">
                          {meal.calories} kcal
                        </span>
                      </div>
                      <Progress
                        value={mealPercentage}
                        className={`h-2 ${getColorClass(mealPercentage)}`}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="p-3 space-y-2">
                    <p className="font-medium">{meal.name}</p>
                    <div className="text-sm space-y-1">
                      <p>Kalori: {meal.calories} kcal</p>
                      {meal.protein && <p>Protein: {meal.protein}g</p>}
                      {meal.carbs && <p>Karbonhidrat: {meal.carbs}g</p>}
                      {meal.fat && <p>Yağ: {meal.fat}g</p>}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
} 