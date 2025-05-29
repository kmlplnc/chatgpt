import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getQueryFn } from "@/lib/queryClient";
import type { DietPlan } from "@shared/schema";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import NutritionalChart from "@/components/diet/nutritional-chart";
import PlanDetails from "@/components/diet/plan-details";
import CalorieDistribution from "@/components/diet/calorie-distribution";
import { Download, Copy, Plus, Trash2, ArrowLeft } from "lucide-react";
import DietEditor from "@/components/diet/diet-editor";
import { toast } from "react-hot-toast";
import { searchFoods, type FoodSearchResult } from "@/lib/food-search";

interface DietPlanContent {
  description: string;
  dailyCalories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  meals: Array<{
    name: string;
    time?: string;
    foods: Array<{
      name: string;
      portion: string;
      calories: number;
      nutrients?: { [key: string]: number };
    }>;
  }>;
  waterIntake: string;
  exercise: {
    type: string;
    duration: string;
    frequency: string;
  };
  notes: string;
}

export default function DietPlanDetail() {
  const params = useParams();
  const [, navigate] = useLocation();
  const id = params?.id;

  // Move all state declarations to the top
  const [selectedMeal, setSelectedMeal] = useState<any>(null);
  const [isAddingFood, setIsAddingFood] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(null);
  const [customPortion, setCustomPortion] = useState(100);
  const [customUnit, setCustomUnit] = useState("g");

  // Move the query hook to the top
  const { data: plan, isLoading, error } = useQuery<DietPlan>({
    queryKey: [`/api/diet-plans/${id}`],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Move useEffect to the top
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        const results = await searchFoods(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

  // Handle content cleaning
  const cleanContent = (content: any) => {
    if (typeof content === 'string') {
      return content
        .replace(/```json\n?|\n?```/g, '')
        .replace(/^[\s\n]+|[\s\n]+$/g, '')
        .replace(/^[^{]*({.*})[^}]*$/, '$1');
    }
    return content;
  };

  // Parse content if it's a string
  const parseContent = (content: any) => {
    if (typeof content === 'string') {
      try {
        return JSON.parse(cleanContent(content));
      } catch (e) {
        console.error('JSON parse error:', e);
        console.log('Raw content:', content);
        console.log('Cleaned content:', cleanContent(content));
        return content;
      }
    }
    return content;
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-32 bg-muted rounded"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <Button variant="outline" onClick={() => window.history.back()}>← Tüm Planlara Dön</Button>
        <div className="mt-6 text-center p-8 text-red-500">
          Diyet planı yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.
        </div>
      </div>
    );
  }

  const planContent = parseContent(plan.content);

  // Makro besin hedeflerini hesapla
  const calculateMacros = () => {
    if (!planContent?.dailyCalories || !planContent?.macros) return null;
    
    const calories = planContent.dailyCalories;
    return {
      protein: (calories * (plan.proteinPercentage / 100)) / 4, // 4 calories per gram
      carbs: (calories * (plan.carbsPercentage / 100)) / 4, // 4 calories per gram
      fat: (calories * (plan.fatPercentage / 100)) / 9, // 9 calories per gram
    };
  };

  const macros = calculateMacros();

  // Öğün bazlı kalori dağılımını hesapla
  const mealCalories = planContent.meals.map(meal => ({
    name: meal.name,
    time: meal.time,
    calories: meal.foods.reduce((sum, food) => sum + (food.calories || 0), 0),
    foods: meal.foods.map(food => ({
      name: food.name,
      portion: food.portion,
      unit: food.portion.split(' ')[1] || 'g', // Porsiyon birimini ayır (örn: "100 g" -> "g")
      calories: food.calories || 0,
      protein: food.nutrients?.protein || 0,
      carbs: food.nutrients?.carbs || 0,
      fat: food.nutrients?.fat || 0
    })),
    nutrients: meal.foods.reduce((acc, food) => {
      if (food.nutrients) {
        Object.entries(food.nutrients).forEach(([key, value]) => {
          acc[key] = (acc[key] || 0) + value;
        });
      }
      return acc;
    }, {} as { [key: string]: number })
  }));

  // Öğün adına göre emoji seç
  const getMealEmoji = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('kahvaltı')) return '🥣';
    if (lowerName.includes('ara öğün')) return '🍎';
    if (lowerName.includes('öğle')) return '🍽️';
    if (lowerName.includes('akşam')) return '🌙';
    return '🍴';
  };

  // Besin adına göre emoji seç
  const getFoodEmoji = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('yulaf')) return '🥣';
    if (lowerName.includes('muz')) return '🍌';
    if (lowerName.includes('elma')) return '🍎';
    if (lowerName.includes('çilek')) return '🍓';
    if (lowerName.includes('fındık') || lowerName.includes('ceviz')) return '🥜';
    if (lowerName.includes('süt') || lowerName.includes('yoğurt')) return '🥛';
    if (lowerName.includes('tavuk')) return '🍗';
    if (lowerName.includes('balık')) return '🐟';
    if (lowerName.includes('salata')) return '🥗';
    if (lowerName.includes('makarna')) return '🍝';
    if (lowerName.includes('pilav')) return '🍚';
    if (lowerName.includes('ekmek')) return '🍞';
    return '🍽️';
  };

  // Besin seçildiğinde
  const handleFoodSelect = (food: FoodSearchResult) => {
    setSelectedFood(food);
    setCustomPortion(food.servingSize);
    setCustomUnit(food.servingUnit);
  };

  // Besin ekle
  const handleAddFood = () => {
    if (!selectedMeal || !selectedFood) return;

    const newFood = {
      id: selectedFood.id,
      name: selectedFood.name,
      portion: customPortion,
      unit: customUnit,
      calories: Math.round((selectedFood.calories * customPortion) / selectedFood.servingSize),
      protein: Math.round((selectedFood.protein * customPortion) / selectedFood.servingSize * 10) / 10,
      carbs: Math.round((selectedFood.carbs * customPortion) / selectedFood.servingSize * 10) / 10,
      fat: Math.round((selectedFood.fat * customPortion) / selectedFood.servingSize * 10) / 10
    };

    const updatedMeals = planContent.meals.map(meal => 
      meal.name === selectedMeal.name
        ? { ...meal, foods: [...meal.foods, newFood] }
        : meal
    );

    // State'i güncelle
    planContent.meals = updatedMeals;
    
    // API'ye gönder
    handleSaveDietPlan(updatedMeals);

    // Formu sıfırla
    setSelectedFood(null);
    setSearchQuery("");
    setCustomPortion(100);
    setCustomUnit("g");
    setIsAddingFood(false);
  };

  // Besin sil
  const handleDeleteFood = (mealName: string, foodId: string) => {
    const updatedMeals = planContent.meals.map(meal =>
      meal.name === mealName
        ? { ...meal, foods: meal.foods.filter(food => food.id !== foodId) }
        : meal
    );

    // State'i güncelle
    planContent.meals = updatedMeals;
    
    // API'ye gönder
    handleSaveDietPlan(updatedMeals);
  };

  // Diyet planı içeriğini düzenle
  const handleSaveDietPlan = async (meals: any[]) => {
    try {
      const response = await fetch(`/api/diet-plans/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meals: meals.map(meal => ({
            name: meal.name,
            time: meal.time,
            foods: meal.foods.map((food: any) => ({
              name: food.name,
              portion: food.portion,
              unit: food.unit,
              calories: food.calories,
              protein: food.protein,
              carbs: food.carbs,
              fat: food.fat
            }))
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Diyet planı güncellenirken bir hata oluştu');
      }

      toast.success("Diyet planı güncellendi");
    } catch (error) {
      console.error('Diyet planı güncellenirken hata:', error);
      toast.error("Diyet planı güncellenirken bir hata oluştu");
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/diet-plans')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Diyet Planlarına Dön
        </Button>
      </div>

      <div className="max-w-5xl mx-auto p-4 space-y-6">
          <div className="flex justify-between items-start">
            <div>
            <h1 className="text-3xl font-bold">{plan.name}</h1>
            <p className="text-muted-foreground mt-2">
              Oluşturulma: {format(new Date(plan.createdAt || new Date()), "d MMMM yyyy", { locale: tr })}
            </p>
            </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              PDF İndir
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Copy className="h-4 w-4" />
              Planı Kopyala
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <NutritionalChart
            dietPlan={{
              calorieGoal: planContent.dailyCalories,
              proteinPercentage: plan.proteinPercentage,
              carbsPercentage: plan.carbsPercentage,
              fatPercentage: plan.fatPercentage,
              meals: mealCalories,
              dietType: plan.dietType
            }}
          />

          <PlanDetails
            description={planContent.description}
            waterIntake={planContent.waterIntake}
            exercise={planContent.exercise}
            calorieGoal={planContent.dailyCalories}
            dietType={plan.dietType}
            healthNotes={plan.healthNotes}
          />
        </div>

        <CalorieDistribution
          meals={mealCalories}
          dailyGoal={planContent.dailyCalories}
        />

        <Tabs defaultValue="meals" className="w-full">
          <TabsList>
            <TabsTrigger value="meals">Öğünler</TabsTrigger>
            <TabsTrigger value="notes">Notlar</TabsTrigger>
          </TabsList>

          <TabsContent value="meals">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {planContent.meals.map((meal, index) => (
                    <div 
                      key={index} 
                      className="bg-white shadow-md rounded-xl p-6 space-y-4"
                    >
                      <div className="flex items-center justify-between border-b pb-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{getMealEmoji(meal.name)}</span>
                            <h3 className="text-lg font-semibold text-gray-900">{meal.name}</h3>
                          </div>
                          <p className="text-sm text-gray-500">{meal.time || 'Saat belirtilmemiş'}</p>
            </div>
                        <div className="flex items-center gap-2">
                          <span className="text-red-600 font-medium">
                            {meal.foods.reduce((sum, food) => sum + (food.calories || 0), 0)} kcal
                          </span>
                          <Dialog open={isAddingFood && selectedMeal?.name === meal.name} onOpenChange={(open) => {
                            setIsAddingFood(open);
                            if (!open) {
                              setSelectedMeal(null);
                              setSelectedFood(null);
                              setSearchQuery("");
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedMeal(meal)}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Besin Ekle
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Besin Ekle</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label>Besin Ara</Label>
                                  <Command className="rounded-lg border shadow-md">
                                    <CommandInput
                                      placeholder="Besin adı yazın..."
                                      value={searchQuery}
                                      onValueChange={setSearchQuery}
                                    />
                                    <CommandEmpty>
                                      {isSearching ? "Aranıyor..." : "Sonuç bulunamadı"}
                                    </CommandEmpty>
                                    <CommandGroup>
                                      {searchResults.map((food) => (
                                        <CommandItem
                                          key={food.id}
                                          onSelect={() => handleFoodSelect(food)}
                                          className="flex items-center justify-between"
                                        >
                                          <span>{food.name}</span>
                                          <span className="text-sm text-muted-foreground">
                                            {food.calories} kcal
                                          </span>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </Command>
            </div>

                                {selectedFood && (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label>Porsiyon</Label>
                                        <Input
                                          type="number"
                                          value={customPortion}
                                          onChange={(e) => setCustomPortion(Number(e.target.value))}
                                        />
            </div>
                                      <div className="space-y-2">
                                        <Label>Birim</Label>
                                        <Input
                                          value={customUnit}
                                          onChange={(e) => setCustomUnit(e.target.value)}
                                        />
            </div>
          </div>

                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label>Kalori</Label>
                                        <Input
                                          type="number"
                                          value={Math.round((selectedFood.calories * customPortion) / selectedFood.servingSize)}
                                          readOnly
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Protein</Label>
                                        <Input
                                          type="number"
                                          value={Math.round((selectedFood.protein * customPortion) / selectedFood.servingSize * 10) / 10}
                                          readOnly
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Karbonhidrat</Label>
                                        <Input
                                          type="number"
                                          value={Math.round((selectedFood.carbs * customPortion) / selectedFood.servingSize * 10) / 10}
                                          readOnly
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Yağ</Label>
                                        <Input
                                          type="number"
                                          value={Math.round((selectedFood.fat * customPortion) / selectedFood.servingSize * 10) / 10}
                                          readOnly
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}

                                <div className="flex justify-end">
                                  <Button
                                    onClick={handleAddFood}
                                    disabled={!selectedFood}
                                  >
                                    Ekle
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
          </div>
                      
                      <div className="space-y-3">
                        {meal.foods.map((food, foodIndex) => (
                          <div 
                            key={foodIndex} 
                            className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                          >
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{getFoodEmoji(food.name)}</span>
                              <div>
                                <span className="text-sm text-gray-600">{food.name}</span>
                                <span className="text-xs text-gray-400 ml-1">({food.portion} {food.unit})</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-sm text-gray-600">
                                <div>Kalori: {food.calories} kcal</div>
                                <div className="text-xs text-gray-400">
                                  P: {food.protein}g | K: {food.carbs}g | Y: {food.fat}g
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteFood(meal.name, food.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {meal.foods.length === 0 && (
                          <div className="text-center text-muted-foreground py-4">
                            Henüz besin eklenmemiş
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes">
            <Card>
              <CardContent className="p-6">
                <div className="prose max-w-none">
                  <h3 className="text-lg font-medium mb-4">Önemli Notlar</h3>
                  <p className="whitespace-pre-line">{planContent.notes}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

          {plan.tags && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Etiketler</h3>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(plan.tags) ? (
                  plan.tags.map((tag, index) => (
                    <span key={index} className="px-3 py-1 bg-accent rounded-full text-sm">
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="px-3 py-1 bg-accent rounded-full text-sm">
                    {plan.tags}
                  </span>
                )}
              </div>
            </div>
          )}

        <DietEditor
          initialMeals={mealCalories.map(meal => ({
            id: Math.random().toString(36).substr(2, 9),
            name: meal.name,
            time: meal.time,
            foods: meal.foods.map(food => ({
              id: Math.random().toString(36).substr(2, 9),
              name: food.name,
              portion: parseFloat(food.portion.split(' ')[0]) || 100, // Porsiyon miktarını ayır (örn: "100 g" -> 100)
              unit: food.unit,
              calories: food.calories,
              protein: food.protein,
              carbs: food.carbs,
              fat: food.fat
            }))
          }))}
          onSave={handleSaveDietPlan}
        />
      </div>
    </div>
  );
} 