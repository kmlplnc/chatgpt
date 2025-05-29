import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Plus, Pencil, Trash2, Save, X, Info } from "lucide-react";
import { searchFoods, type FoodSearchResult } from "@/lib/food-search";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "react-hot-toast";

interface Micronutrient {
  value: number | null;
  unit: string;
  percent: number | null;
}

interface Micronutrients {
  vitamins: {
    a: Micronutrient;
    c: Micronutrient;
    d: Micronutrient;
    e: Micronutrient;
    k: Micronutrient;
    b1: Micronutrient;
    b2: Micronutrient;
    b3: Micronutrient;
    b6: Micronutrient;
    b12: Micronutrient;
    folate: Micronutrient;
  };
  minerals: {
    iron: Micronutrient;
    magnesium: Micronutrient;
    phosphorus: Micronutrient;
    potassium: Micronutrient;
    calcium: Micronutrient;
    zinc: Micronutrient;
    sodium: Micronutrient;
    copper: Micronutrient;
    manganese: Micronutrient;
    selenium: Micronutrient;
    molybdenum: Micronutrient;
    iodine: Micronutrient;
    chromium: Micronutrient;
  };
}

interface Food {
  id: string;
  name: string;
  portion: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes?: string;
  micronutrients: Micronutrients;
}

interface Meal {
  id: string;
  name: string;
  time?: string;
  foods: Food[];
}

interface DietEditorProps {
  initialMeals: Meal[];
  onSave: (meals: Meal[]) => void;
}

export default function DietEditor({ initialMeals, onSave }: DietEditorProps) {
  const [meals, setMeals] = useState<Meal[]>(initialMeals);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [isAddingFood, setIsAddingFood] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(null);
  const [customPortion, setCustomPortion] = useState(100);
  const [customUnit, setCustomUnit] = useState("g");
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [showNutrients, setShowNutrients] = useState(false);
  const [selectedFoodForDetails, setSelectedFoodForDetails] = useState<Food | null>(null);

  // Toplam değerleri hesapla
  const totals = meals.reduce((acc, meal) => {
    meal.foods.forEach(food => {
      acc.calories += food.calories;
      acc.protein += food.protein;
      acc.carbs += food.carbs;
      acc.fat += food.fat;
    });
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  // Besin ara
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
      fat: Math.round((selectedFood.fat * customPortion) / selectedFood.servingSize * 10) / 10,
      micronutrients: {
        vitamins: {
          a: { value: null, unit: 'IU', percent: null },
          c: { value: null, unit: 'mg', percent: null },
          d: { value: null, unit: 'IU', percent: null },
          e: { value: null, unit: 'mg', percent: null },
          k: { value: null, unit: 'mcg', percent: null },
          b1: { value: null, unit: 'mg', percent: null },
          b2: { value: null, unit: 'mg', percent: null },
          b3: { value: null, unit: 'mg', percent: null },
          b6: { value: null, unit: 'mg', percent: null },
          b12: { value: null, unit: 'mcg', percent: null },
          folate: { value: null, unit: 'mcg', percent: null }
        },
        minerals: {
          iron: { value: null, unit: 'mg', percent: null },
          magnesium: { value: null, unit: 'mg', percent: null },
          phosphorus: { value: null, unit: 'mg', percent: null },
          potassium: { value: null, unit: 'mg', percent: null },
          calcium: { value: null, unit: 'mg', percent: null },
          zinc: { value: null, unit: 'mg', percent: null },
          sodium: { value: null, unit: 'mg', percent: null },
          copper: { value: null, unit: 'mg', percent: null },
          manganese: { value: null, unit: 'mg', percent: null },
          selenium: { value: null, unit: 'mcg', percent: null },
          molybdenum: { value: null, unit: 'mcg', percent: null },
          iodine: { value: null, unit: 'mcg', percent: null },
          chromium: { value: null, unit: 'mcg', percent: null }
        }
      }
    };

    const updatedMeals = meals.map(meal => 
      meal.id === selectedMeal.id
        ? { ...meal, foods: [...meal.foods, newFood] }
        : meal
    );

    setMeals(updatedMeals);
    onSave(updatedMeals);
    
    // Formu sıfırla
    setSelectedFood(null);
    setSearchQuery("");
    setCustomPortion(100);
    setCustomUnit("g");
    setIsAddingFood(false);
  };

  // Besin düzenleme modunu aç
  const handleEditFood = (food: Food) => {
    setEditingFood({ ...food });
  };

  // Besin düzenlemeyi kaydet
  const handleSaveEdit = () => {
    if (!editingFood) return;

    const updatedMeals = meals.map(meal => ({
      ...meal,
      foods: meal.foods.map(food => 
        food.id === editingFood.id ? editingFood : food
      )
    }));

    setMeals(updatedMeals);
    onSave(updatedMeals);
    setEditingFood(null);
    toast.success("Besin güncellendi");
  };

  // Besin sil
  const handleDeleteFood = (mealId: string, foodId: string) => {
    const updatedMeals = meals.map(meal =>
      meal.id === mealId
        ? { ...meal, foods: meal.foods.filter(food => food.id !== foodId) }
        : meal
    );

    setMeals(updatedMeals);
    onSave(updatedMeals);
    toast.success("Besin silindi");
  };

  // Besin detaylarını göster
  const handleShowNutrients = (food: Food) => {
    setSelectedFoodForDetails(food);
    setShowNutrients(true);
  };

  return (
    <div className="space-y-6">
      {/* Toplam Değerler */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Toplam Kalori</h3>
              <p className="text-2xl font-bold text-red-600">{totals.calories} kcal</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Protein</h3>
              <p className="text-2xl font-bold text-blue-600">{Math.round(totals.protein)}g</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Karbonhidrat</h3>
              <p className="text-2xl font-bold text-green-600">{Math.round(totals.carbs)}g</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Yağ</h3>
              <p className="text-2xl font-bold text-yellow-600">{Math.round(totals.fat)}g</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Öğünler */}
      <div className="space-y-6">
        {meals.map((meal) => (
          <Card key={meal.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{meal.name}</h3>
                  {meal.time && <p className="text-sm text-gray-500">{meal.time}</p>}
                </div>
                <Dialog open={isAddingFood && selectedMeal?.id === meal.id} onOpenChange={(open) => {
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

              <div className="space-y-3">
                {meal.foods.map((food) => (
                  <div 
                    key={food.id}
                    className="group flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {editingFood?.id === food.id ? (
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Besin Adı</Label>
                          <Input
                            value={editingFood.name}
                            onChange={(e) => setEditingFood({ ...editingFood, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Porsiyon</Label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              value={editingFood.portion}
                              onChange={(e) => setEditingFood({ ...editingFood, portion: Number(e.target.value) })}
                            />
                            <Input
                              value={editingFood.unit}
                              onChange={(e) => setEditingFood({ ...editingFood, unit: e.target.value })}
                              className="w-20"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Kalori</Label>
                          <Input
                            type="number"
                            value={editingFood.calories}
                            onChange={(e) => setEditingFood({ ...editingFood, calories: Number(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Protein</Label>
                          <Input
                            type="number"
                            value={editingFood.protein}
                            onChange={(e) => setEditingFood({ ...editingFood, protein: Number(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Karbonhidrat</Label>
                          <Input
                            type="number"
                            value={editingFood.carbs}
                            onChange={(e) => setEditingFood({ ...editingFood, carbs: Number(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Yağ</Label>
                          <Input
                            type="number"
                            value={editingFood.fat}
                            onChange={(e) => setEditingFood({ ...editingFood, fat: Number(e.target.value) })}
                          />
                        </div>
                        <div className="col-span-2 flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingFood(null)}
                          >
                            <X className="h-4 w-4 mr-2" />
                            İptal
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSaveEdit}
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Kaydet
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getFoodEmoji(food.name)}</span>
                            <div>
                              <span className="text-sm font-medium">{food.name}</span>
                              <span className="text-xs text-gray-500 ml-1">
                                ({food.portion} {food.unit})
                              </span>
                            </div>
                          </div>
                          <div className="mt-1 text-sm text-gray-600">
                            <span className="font-medium text-red-600">{food.calories} kcal</span>
                            <span className="text-gray-400 mx-2">|</span>
                            <span>P: {food.protein}g</span>
                            <span className="text-gray-400 mx-1">•</span>
                            <span>K: {food.carbs}g</span>
                            <span className="text-gray-400 mx-1">•</span>
                            <span>Y: {food.fat}g</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-2"
                              onClick={() => handleShowNutrients(food)}
                            >
                              <Info className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditFood(food)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Düzenle</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteFood(meal.id, food.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Sil</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {meal.foods.length === 0 && (
                  <div className="text-center text-muted-foreground py-4">
                    Henüz besin eklenmemiş
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Besin Detayları Dialog */}
      <Dialog open={showNutrients} onOpenChange={setShowNutrients}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Besin Detayları</DialogTitle>
          </DialogHeader>
          {selectedFoodForDetails && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Vitaminler</h3>
                  <div className="space-y-2">
                    {Object.entries(selectedFoodForDetails.micronutrients.vitamins).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="capitalize">{key.toUpperCase()}</span>
                        <span>
                          {value.value ? `${value.value} ${value.unit}` : 'Bilinmiyor'}
                          {value.percent && ` (${value.percent}%)`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Mineraller</h3>
                  <div className="space-y-2">
                    {Object.entries(selectedFoodForDetails.micronutrients.minerals).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="capitalize">{key}</span>
                        <span>
                          {value.value ? `${value.value} ${value.unit}` : 'Bilinmiyor'}
                          {value.percent && ` (${value.percent}%)`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Besin adına göre emoji seç
function getFoodEmoji(name: string) {
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
  if (lowerName.includes('yumurta')) return '🥚';
  if (lowerName.includes('peynir')) return '🧀';
  if (lowerName.includes('et')) return '🥩';
  if (lowerName.includes('sebze')) return '🥬';
  if (lowerName.includes('meyve')) return '🍎';
  if (lowerName.includes('kuruyemiş')) return '🥜';
  if (lowerName.includes('çorba')) return '🥣';
  if (lowerName.includes('pilav')) return '🍚';
  if (lowerName.includes('makarna')) return '🍝';
  if (lowerName.includes('ekmek')) return '🍞';
  if (lowerName.includes('kahvaltı')) return '☕';
  if (lowerName.includes('öğle')) return '🍽️';
  if (lowerName.includes('akşam')) return '🌙';
  if (lowerName.includes('ara öğün')) return '🍎';
  return '🍽️';
} 