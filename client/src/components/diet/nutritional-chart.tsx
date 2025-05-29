import React from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { 
  NUTRIENT_REQUIREMENTS, 
  DIET_TYPES,
  HEALTH_CONDITIONS,
  calculateNutrientPercentage,
  getNutrientStatus,
  sumNutrients,
  checkAbsorptionFactors
} from "@/lib/nutrition-data";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NutritionalChartProps {
  dietPlan?: {
    calorieGoal: number;
    proteinPercentage: number;
    carbsPercentage: number;
    fatPercentage: number;
    meals: { 
      name: string; 
      calories: number;
      nutrients?: { [key: string]: number };
    }[];
    dietType?: string;
    healthConditions?: string[];
  };
}

export default function NutritionalChart({ dietPlan }: NutritionalChartProps) {
  if (!dietPlan) return null;

  // Tüm öğünlerin besin değerlerini topla
  const totalNutrients = sumNutrients(
    dietPlan.meals
      .filter(meal => meal.nutrients)
      .map(meal => meal.nutrients || {})
  );

  // Diyet tipini bul
  const dietType = DIET_TYPES.find(dt => dt.id === dietPlan.dietType);

  // Sağlık durumlarını bul
  const healthConditions = dietPlan.healthConditions
    ?.map(id => HEALTH_CONDITIONS.find(hc => hc.id === id))
    .filter(Boolean);

  // Vitaminleri ve mineralleri grupla
  const vitamins = Object.entries(NUTRIENT_REQUIREMENTS)
    .filter(([key]) => key.startsWith('B') || key === 'A' || key === 'C' || key === 'D' || key === 'E' || key === 'K' || key === 'Folate')
    .map(([key, requirement]) => {
      const value = totalNutrients[key] || 0;
      const status = getNutrientStatus(value, requirement, dietPlan.dietType, dietPlan.healthConditions);
      const absorptionFactors = checkAbsorptionFactors(key, totalNutrients);
      return {
        key,
        ...requirement,
        value,
        percentage: calculateNutrientPercentage(value, requirement),
        status,
        absorptionFactors
      };
    });

  const minerals = Object.entries(NUTRIENT_REQUIREMENTS)
    .filter(([key]) => !key.startsWith('B') && key !== 'A' && key !== 'C' && key !== 'D' && key !== 'E' && key !== 'K' && key !== 'Folate')
    .map(([key, requirement]) => {
      const value = totalNutrients[key] || 0;
      const status = getNutrientStatus(value, requirement, dietPlan.dietType, dietPlan.healthConditions);
      const absorptionFactors = checkAbsorptionFactors(key, totalNutrients);
      return {
        key,
        ...requirement,
        value,
        percentage: calculateNutrientPercentage(value, requirement),
        status,
        absorptionFactors
      };
    });

  // Kritik besinleri kontrol et
  const criticalNutrients = [...vitamins, ...minerals]
    .filter(nutrient => nutrient.status.status === 'critical');

  return (
    <Card className="bg-white shadow-md rounded-xl">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-800">Günlük Besin Değerleri</CardTitle>
      </CardHeader>
      <CardContent>
        {criticalNutrients.length > 0 && (
          <Alert className="mb-4 bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <div className="font-medium mb-1">Dikkat Edilmesi Gereken Besinler:</div>
              <ul className="list-disc list-inside space-y-1">
                {criticalNutrients.map(nutrient => (
                  <li key={nutrient.key}>
                    <div className="font-medium">{nutrient.name}</div>
                    <div className="text-sm">{nutrient.status.message}</div>
                    {nutrient.status.recommendations && (
                      <ul className="list-disc list-inside ml-4 text-sm">
                        {nutrient.status.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {healthConditions && healthConditions.length > 0 && (
          <Alert className="mb-4 bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <div className="font-medium mb-1">Sağlık Durumu Önerileri:</div>
              <ul className="list-disc list-inside space-y-1">
                {healthConditions.map(condition => (
                  <li key={condition.id}>
                    <div className="font-medium">{condition.name}</div>
                    <ul className="list-disc list-inside ml-4 text-sm">
                      {condition.recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="macros" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="macros">Makrolar</TabsTrigger>
            <TabsTrigger value="vitamins">Vitaminler</TabsTrigger>
            <TabsTrigger value="minerals">Mineraller</TabsTrigger>
          </TabsList>

          <TabsContent value="macros" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Protein</span>
                  <span className="text-sm font-semibold text-green-600">
                    {Math.round((dietPlan.calorieGoal * (dietPlan.proteinPercentage / 100)) / 4)}g
                  </span>
                </div>
                <Progress value={dietPlan.proteinPercentage} className="h-2 bg-green-100" />
                <span className="text-xs text-gray-500">{dietPlan.proteinPercentage}%</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Karbonhidrat</span>
                  <span className="text-sm font-semibold text-blue-600">
                    {Math.round((dietPlan.calorieGoal * (dietPlan.carbsPercentage / 100)) / 4)}g
                  </span>
                </div>
                <Progress value={dietPlan.carbsPercentage} className="h-2 bg-blue-100" />
                <span className="text-xs text-gray-500">{dietPlan.carbsPercentage}%</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Yağ</span>
                  <span className="text-sm font-semibold text-orange-600">
                    {Math.round((dietPlan.calorieGoal * (dietPlan.fatPercentage / 100)) / 9)}g
                  </span>
                </div>
                <Progress value={dietPlan.fatPercentage} className="h-2 bg-orange-100" />
                <span className="text-xs text-gray-500">{dietPlan.fatPercentage}%</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="vitamins" className="space-y-4">
            <div className="space-y-3">
              {vitamins.map((vitamin) => (
                <TooltipProvider key={vitamin.key}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-600">{vitamin.name}</span>
                          <span className="text-sm font-semibold">
                            {vitamin.value.toFixed(1)}{vitamin.unit}
                          </span>
                        </div>
                        <Progress 
                          value={vitamin.percentage} 
                          className={`h-2 ${
                            vitamin.status.status === 'critical' 
                              ? 'bg-red-100' 
                              : vitamin.status.status === 'warning'
                              ? 'bg-yellow-100'
                              : 'bg-green-100'
                          }`} 
                        />
                        {vitamin.status.status !== 'success' && (
                          <div className="flex items-center gap-1">
                            {vitamin.status.status === 'critical' ? (
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-yellow-600" />
                            )}
                            <span className={`text-xs ${
                              vitamin.status.status === 'critical' ? 'text-red-600' : 'text-yellow-600'
                            }`}>
                              {vitamin.status.message}
                            </span>
                          </div>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="p-3 space-y-2">
                      <div className="font-medium">{vitamin.name}</div>
                      <div className="text-sm space-y-1">
                        <p>Günlük Değer: {vitamin.dailyValue}{vitamin.unit}</p>
                        <p>Mevcut Değer: {vitamin.value.toFixed(1)}{vitamin.unit}</p>
                        <p>Hedef: %{vitamin.percentage.toFixed(0)}</p>
                        {vitamin.status.recommendations && (
                          <div className="mt-2">
                            <p className="font-medium">Öneriler:</p>
                            <ul className="list-disc list-inside">
                              {vitamin.status.recommendations.map((rec, index) => (
                                <li key={index} className="text-xs">{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {vitamin.absorptionFactors && (
                          <div className="mt-2">
                            <p className="font-medium">Emilim Faktörleri:</p>
                            {vitamin.absorptionFactors.increases.length > 0 && (
                              <div>
                                <p className="text-xs text-green-600">Artıranlar:</p>
                                <ul className="list-disc list-inside">
                                  {vitamin.absorptionFactors.increases.map((factor, index) => (
                                    <li key={index} className="text-xs">{factor}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {vitamin.absorptionFactors.decreases.length > 0 && (
                              <div>
                                <p className="text-xs text-red-600">Azaltanlar:</p>
                                <ul className="list-disc list-inside">
                                  {vitamin.absorptionFactors.decreases.map((factor, index) => (
                                    <li key={index} className="text-xs">{factor}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="minerals" className="space-y-4">
            <div className="space-y-3">
              {minerals.map((mineral) => (
                <TooltipProvider key={mineral.key}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-600">{mineral.name}</span>
                          <span className="text-sm font-semibold">
                            {mineral.value.toFixed(1)}{mineral.unit}
                          </span>
                        </div>
                        <Progress 
                          value={mineral.percentage} 
                          className={`h-2 ${
                            mineral.status.status === 'critical' 
                              ? 'bg-red-100' 
                              : mineral.status.status === 'warning'
                              ? 'bg-yellow-100'
                              : 'bg-green-100'
                          }`} 
                        />
                        {mineral.status.status !== 'success' && (
                          <div className="flex items-center gap-1">
                            {mineral.status.status === 'critical' ? (
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-yellow-600" />
                            )}
                            <span className={`text-xs ${
                              mineral.status.status === 'critical' ? 'text-red-600' : 'text-yellow-600'
                            }`}>
                              {mineral.status.message}
                            </span>
                          </div>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="p-3 space-y-2">
                      <div className="font-medium">{mineral.name}</div>
                      <div className="text-sm space-y-1">
                        <p>Günlük Değer: {mineral.dailyValue}{mineral.unit}</p>
                        <p>Mevcut Değer: {mineral.value.toFixed(1)}{mineral.unit}</p>
                        <p>Hedef: %{mineral.percentage.toFixed(0)}</p>
                        {mineral.status.recommendations && (
                          <div className="mt-2">
                            <p className="font-medium">Öneriler:</p>
                            <ul className="list-disc list-inside">
                              {mineral.status.recommendations.map((rec, index) => (
                                <li key={index} className="text-xs">{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {mineral.absorptionFactors && (
                          <div className="mt-2">
                            <p className="font-medium">Emilim Faktörleri:</p>
                            {mineral.absorptionFactors.increases.length > 0 && (
                              <div>
                                <p className="text-xs text-green-600">Artıranlar:</p>
                                <ul className="list-disc list-inside">
                                  {mineral.absorptionFactors.increases.map((factor, index) => (
                                    <li key={index} className="text-xs">{factor}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {mineral.absorptionFactors.decreases.length > 0 && (
                              <div>
                                <p className="text-xs text-red-600">Azaltanlar:</p>
                                <ul className="list-disc list-inside">
                                  {mineral.absorptionFactors.decreases.map((factor, index) => (
                                    <li key={index} className="text-xs">{factor}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
