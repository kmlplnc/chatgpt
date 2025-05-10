import React, { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import ProtectedFeature from "@/components/premium/protected-feature";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { 
  calculateBMI, 
  getBMICategory, 
  getBMIColorClass,
  calculateBMH,
  calculateTDEE
} from "@/lib/utils";
import { 
  Alert, 
  AlertTitle, 
  AlertDescription 
} from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

// Form schema
const healthFormSchema = z.object({
  age: z.coerce.number()
    .min(12, "Yaş en az 12 olmalıdır")
    .max(100, "Yaş en fazla 100 olmalıdır"),
  gender: z.enum(["male", "female"]),
  weight: z.coerce.number()
    .min(30, "Kilo en az 30 kg olmalıdır")
    .max(250, "Kilo en fazla 250 kg olmalıdır"),
  height: z.coerce.number()
    .min(120, "Boy en az 120 cm olmalıdır")
    .max(250, "Boy en fazla 250 cm olmalıdır"),
  activityLevel: z.enum([
    "sedentary", 
    "light", 
    "moderate", 
    "active", 
    "very_active"
  ]),
  goal: z.enum(["lose", "maintain", "gain"]),
  proteinPercentage: z.coerce.number().min(10).max(60),
  carbsPercentage: z.coerce.number().min(10).max(70),
  fatPercentage: z.coerce.number().min(10).max(70),
}).refine(data => {
  return data.proteinPercentage + data.carbsPercentage + data.fatPercentage === 100;
}, {
  message: "Protein, karbonhidrat ve yağ toplamı 100% olmalıdır",
  path: ["proteinPercentage"]
});

type HealthFormValues = z.infer<typeof healthFormSchema>;

// Vitamin ve mineral günlük gereksinim tablosu
interface NutrientRequirement {
  name: string;
  amount: string;
  unit: string;
  group: string;
  description?: string;
}

const nutrientRequirements: { [key: string]: NutrientRequirement[] } = {
  male: [
    { name: "Vitamin A", amount: "900", unit: "mcg", group: "vitamin", description: "Görme, bağışıklık sistemi ve hücre büyümesi için önemlidir" },
    { name: "Vitamin C", amount: "90", unit: "mg", group: "vitamin", description: "Bağışıklık sistemi ve doku onarımı için gereklidir" },
    { name: "Vitamin D", amount: "15", unit: "mcg", group: "vitamin", description: "Kemik sağlığı ve kalsiyum emilimi için önemlidir" },
    { name: "Vitamin E", amount: "15", unit: "mg", group: "vitamin", description: "Antioksidan özelliği vardır" },
    { name: "Vitamin K", amount: "120", unit: "mcg", group: "vitamin", description: "Kan pıhtılaşması için gereklidir" },
    { name: "Tiamin (B1)", amount: "1.2", unit: "mg", group: "vitamin", description: "Enerji metabolizması için gereklidir" },
    { name: "Riboflavin (B2)", amount: "1.3", unit: "mg", group: "vitamin", description: "Enerji üretimi ve hücre fonksiyonu için önemlidir" },
    { name: "Niasin (B3)", amount: "16", unit: "mg", group: "vitamin", description: "Sinir sistemi sağlığı için gereklidir" },
    { name: "B6 Vitamini", amount: "1.3", unit: "mg", group: "vitamin", description: "Protein metabolizması için önemlidir" },
    { name: "Folat (B9)", amount: "400", unit: "mcg", group: "vitamin", description: "DNA sentezi ve hücre bölünmesi için gereklidir" },
    { name: "B12 Vitamini", amount: "2.4", unit: "mcg", group: "vitamin", description: "Sinir sistemi sağlığı ve kan hücresi oluşumu için önemlidir" },
    { name: "Biotin", amount: "30", unit: "mcg", group: "vitamin", description: "Enerji metabolizması için gereklidir" },
    { name: "Pantotenik Asit", amount: "5", unit: "mg", group: "vitamin", description: "Enerji metabolizması için önemlidir" },
    { name: "Kalsiyum", amount: "1000", unit: "mg", group: "mineral", description: "Kemik ve diş sağlığı için gereklidir" },
    { name: "Demir", amount: "8", unit: "mg", group: "mineral", description: "Oksijen taşınması için önemlidir" },
    { name: "Magnezyum", amount: "400", unit: "mg", group: "mineral", description: "Kas ve sinir fonksiyonu için gereklidir" },
    { name: "Fosfor", amount: "700", unit: "mg", group: "mineral", description: "Kemik sağlığı için önemlidir" },
    { name: "Çinko", amount: "11", unit: "mg", group: "mineral", description: "Bağışıklık sistemi ve yara iyileşmesi için gereklidir" },
    { name: "Potasyum", amount: "3400", unit: "mg", group: "mineral", description: "Kalp ve kas fonksiyonu için önemlidir" },
    { name: "Sodyum", amount: "2300", unit: "mg", group: "mineral", description: "Sıvı dengesi için gereklidir" },
    { name: "Bakır", amount: "900", unit: "mcg", group: "mineral", description: "Demir metabolizması için önemlidir" },
    { name: "Manganez", amount: "2.3", unit: "mg", group: "mineral", description: "Kemik gelişimi için gereklidir" },
    { name: "Selenyum", amount: "55", unit: "mcg", group: "mineral", description: "Antioksidan fonksiyonlar için önemlidir" },
    { name: "Krom", amount: "35", unit: "mcg", group: "mineral", description: "Glikoz metabolizması için gereklidir" },
    { name: "Molibden", amount: "45", unit: "mcg", group: "mineral", description: "Enzim aktivitesi için önemlidir" },
    { name: "İyot", amount: "150", unit: "mcg", group: "mineral", description: "Tiroid fonksiyonu için gereklidir" },
  ],
  female: [
    { name: "Vitamin A", amount: "700", unit: "mcg", group: "vitamin", description: "Görme, bağışıklık sistemi ve hücre büyümesi için önemlidir" },
    { name: "Vitamin C", amount: "75", unit: "mg", group: "vitamin", description: "Bağışıklık sistemi ve doku onarımı için gereklidir" },
    { name: "Vitamin D", amount: "15", unit: "mcg", group: "vitamin", description: "Kemik sağlığı ve kalsiyum emilimi için önemlidir" },
    { name: "Vitamin E", amount: "15", unit: "mg", group: "vitamin", description: "Antioksidan özelliği vardır" },
    { name: "Vitamin K", amount: "90", unit: "mcg", group: "vitamin", description: "Kan pıhtılaşması için gereklidir" },
    { name: "Tiamin (B1)", amount: "1.1", unit: "mg", group: "vitamin", description: "Enerji metabolizması için gereklidir" },
    { name: "Riboflavin (B2)", amount: "1.1", unit: "mg", group: "vitamin", description: "Enerji üretimi ve hücre fonksiyonu için önemlidir" },
    { name: "Niasin (B3)", amount: "14", unit: "mg", group: "vitamin", description: "Sinir sistemi sağlığı için gereklidir" },
    { name: "B6 Vitamini", amount: "1.3", unit: "mg", group: "vitamin", description: "Protein metabolizması için önemlidir" },
    { name: "Folat (B9)", amount: "400", unit: "mcg", group: "vitamin", description: "DNA sentezi ve hücre bölünmesi için gereklidir" },
    { name: "B12 Vitamini", amount: "2.4", unit: "mcg", group: "vitamin", description: "Sinir sistemi sağlığı ve kan hücresi oluşumu için önemlidir" },
    { name: "Biotin", amount: "30", unit: "mcg", group: "vitamin", description: "Enerji metabolizması için gereklidir" },
    { name: "Pantotenik Asit", amount: "5", unit: "mg", group: "vitamin", description: "Enerji metabolizması için önemlidir" },
    { name: "Kalsiyum", amount: "1000", unit: "mg", group: "mineral", description: "Kemik ve diş sağlığı için gereklidir" },
    { name: "Demir", amount: "18", unit: "mg", group: "mineral", description: "Oksijen taşınması için önemlidir" },
    { name: "Magnezyum", amount: "310", unit: "mg", group: "mineral", description: "Kas ve sinir fonksiyonu için gereklidir" },
    { name: "Fosfor", amount: "700", unit: "mg", group: "mineral", description: "Kemik sağlığı için önemlidir" },
    { name: "Çinko", amount: "8", unit: "mg", group: "mineral", description: "Bağışıklık sistemi ve yara iyileşmesi için gereklidir" },
    { name: "Potasyum", amount: "2600", unit: "mg", group: "mineral", description: "Kalp ve kas fonksiyonu için önemlidir" },
    { name: "Sodyum", amount: "2300", unit: "mg", group: "mineral", description: "Sıvı dengesi için gereklidir" },
    { name: "Bakır", amount: "900", unit: "mcg", group: "mineral", description: "Demir metabolizması için önemlidir" },
    { name: "Manganez", amount: "1.8", unit: "mg", group: "mineral", description: "Kemik gelişimi için gereklidir" },
    { name: "Selenyum", amount: "55", unit: "mcg", group: "mineral", description: "Antioksidan fonksiyonlar için önemlidir" },
    { name: "Krom", amount: "25", unit: "mcg", group: "mineral", description: "Glikoz metabolizması için gereklidir" },
    { name: "Molibden", amount: "45", unit: "mcg", group: "mineral", description: "Enzim aktivitesi için önemlidir" },
    { name: "İyot", amount: "150", unit: "mcg", group: "mineral", description: "Tiroid fonksiyonu için gereklidir" },
  ]
};

// Aktivite seviyesi açıklamaları
const activityLevelDescriptions: { [key: string]: string } = {
  sedentary: "Hareketsiz (masabaşı iş, egzersiz yok)",
  light: "Hafif Aktivite (haftada 1-3 gün hafif egzersiz)",
  moderate: "Orta Aktivite (haftada 3-5 gün orta şiddetli egzersiz)",
  active: "Aktif (haftada 6-7 gün yoğun egzersiz)",
  very_active: "Çok Aktif (günde iki kez egzersiz veya fiziksel iş)"
};

// Diyet hedefi değişiklik faktörleri
const goalFactors = {
  lose: 0.8,     // %20 kalori azaltması
  maintain: 1.0, // Değişiklik yok
  gain: 1.2      // %20 kalori artışı
};

// Danışan verileri almak için API fonksiyonu
async function getClients() {
  const response = await fetch('/api/clients');
  if (!response.ok) {
    throw new Error('Danışanlar yüklenemedi');
  }
  return response.json();
}

// Ölçüm kaydetme API fonksiyonu
async function addMeasurement(clientId: number, data: any) {
  try {
    const response = await fetch(`/api/clients/${clientId}/measurements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ölçüm eklenemedi: ${errorText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Ölçüm ekleme hatası:', error);
    throw error;
  }
}

export default function HealthCalculator() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("bmh-calculator");
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [calculationResult, setCalculationResult] = useState<{
    bmh: number;
    tdee: number;
    bmi: number;
    bmiCategory: string;
    macros: {
      protein: number;
      carbs: number;
      fat: number;
    };
    targetCalories: number;
  } | null>(null);
  
  // Danışanları getir
  const { data: clients, isLoading: isClientsLoading } = useQuery({
    queryKey: ['/api/clients'],
    queryFn: getQueryFn({ on401: "returnNull" })
  });
  
  // Ölçüm kaydetme mutation'ı
  const saveMeasurementMutation = useMutation({
    mutationFn: (data: any) => {
      if (!selectedClientId) {
        throw new Error('Lütfen bir danışan seçin');
      }
      return addMeasurement(selectedClientId, data);
    },
    onSuccess: () => {
      toast({
        title: 'Başarılı',
        description: 'Ölçüm danışana kaydedildi',
      });
      // Danışan ölçümlerini güncellemek için queryClient'ı kullan
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${selectedClientId}/measurements`] });
    },
    onError: (error: any) => {
      toast({
        title: 'Hata',
        description: error.message || 'Ölçüm kaydedilirken bir hata oluştu',
        variant: 'destructive',
      });
    },
  });
  
  // Form oluşturma
  const form = useForm<HealthFormValues>({
    resolver: zodResolver(healthFormSchema),
    defaultValues: {
      age: 30,
      gender: "male",
      weight: 70,
      height: 170,
      activityLevel: "moderate",
      goal: "maintain",
      proteinPercentage: 30,
      carbsPercentage: 40,
      fatPercentage: 30,
    },
  });

  // Form değerlerini izleme
  const watchedValues = form.watch();
  
  // Makro değerlerini güncelleme
  const updateMacrosTotals = () => {
    const proteinPct = form.getValues("proteinPercentage");
    const carbsPct = form.getValues("carbsPercentage");
    const fatPct = 100 - proteinPct - carbsPct;
    
    if (fatPct >= 10 && fatPct <= 70) {
      form.setValue("fatPercentage", fatPct);
    }
  };

  // Protein veya karbonhidrat değişikliklerini izleme
  useEffect(() => {
    updateMacrosTotals();
  }, [form.watch("proteinPercentage"), form.watch("carbsPercentage")]);

  // Form gönderimi işleme
  // Ölçüm sonuçlarını kaydetme fonksiyonu
  const saveMeasurementToClient = () => {
    if (!calculationResult || !selectedClientId) {
      toast({
        title: "Hata",
        description: "Lütfen bir danışan seçin ve hesaplama yapın",
        variant: "destructive",
      });
      return;
    }
    
    const formValues = form.getValues();
    
    // Ölçüm verisini oluştur
    const measurementData = {
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD formatında bugünün tarihi
      height: formValues.height.toString(),
      weight: formValues.weight.toString(),
      activityLevel: formValues.activityLevel,
      bmi: calculationResult.bmi.toFixed(1),
      bmr: calculationResult.bmh.toString(),
      targetCalories: calculationResult.targetCalories.toString(),
      proteinPercentage: formValues.proteinPercentage,
      carbsPercentage: formValues.carbsPercentage,
      fatPercentage: formValues.fatPercentage,
      totalDailyEnergyExpenditure: calculationResult.tdee,
    };
    
    // Mutation'ı çalıştır
    saveMeasurementMutation.mutate(measurementData);
  };

  const onSubmit = (data: HealthFormValues) => {
    // BMH hesapla (Bazal Metabolizma Hızı)
    const bmh = calculateBMH(
      data.weight,
      data.height,
      data.age,
      data.gender
    );
    
    // TDEE hesapla (Toplam Günlük Enerji Tüketimi)
    const tdee = calculateTDEE(bmh, data.activityLevel);
    
    // BMI hesapla (Beden Kitle İndeksi)
    const bmi = calculateBMI(data.weight, data.height);
    const bmiCategory = getBMICategory(bmi);
    
    // Hedef kalorileri hesapla
    const targetCalories = Math.round(tdee * goalFactors[data.goal]);
    
    // Makro besinleri hesapla
    const proteinGrams = Math.round((targetCalories * (data.proteinPercentage / 100)) / 4); // 1g protein = 4 kalori
    const carbGrams = Math.round((targetCalories * (data.carbsPercentage / 100)) / 4); // 1g karbonhidrat = 4 kalori
    const fatGrams = Math.round((targetCalories * (data.fatPercentage / 100)) / 9); // 1g yağ = 9 kalori
    
    const macros = {
      protein: proteinGrams,
      carbs: carbGrams,
      fat: fatGrams
    };
    
    // Sonuçları ayarla
    setCalculationResult({
      bmh: Math.round(bmh), // Gerçek BMH değeri
      tdee: Math.round(tdee), // TDEE (Toplam Günlük Enerji Harcaması)
      bmi,
      bmiCategory,
      macros: {
        protein: macros.protein,
        carbs: macros.carbs,
        fat: macros.fat
      },
      targetCalories
    });
    
    // Sonuçlar sekmesine geçiş yap
    setActiveTab("results");
  };

  // Aktivite çarpanları
  const activityMultipliers: { [key: string]: number } = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  };
  
  return (
    <ProtectedFeature featureName="Sağlık Hesaplayıcısı">
      <div className="container max-w-4xl mx-auto py-6 space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Sağlık Hesaplayıcısı</h1>
          <p className="text-muted-foreground">
            BMH (Bazal Metabolizma Hızı), BKİ (Beden Kitle İndeksi) ve besin gereksinimlerinizi hesaplayın
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="bmh-calculator">Hesaplayıcı</TabsTrigger>
            <TabsTrigger value="results" disabled={!calculationResult}>
              Sonuçlar
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="bmh-calculator" className="p-4 border rounded-lg mt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Kişisel Bilgiler</CardTitle>
                    <CardDescription>
                      Doğru sonuçlar için lütfen tüm bilgileri doğru şekilde girin
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cinsiyet</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Cinsiyet seçin" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="male">Erkek</SelectItem>
                                <SelectItem value="female">Kadın</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="age"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Yaş</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="height"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Boy (cm)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Kilo (kg)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormDescription>
                              Güncel BKİ: {calculateBMI(watchedValues.weight, watchedValues.height).toFixed(1)} - 
                              {getBMICategory(calculateBMI(watchedValues.weight, watchedValues.height))}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="activityLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Aktivite Seviyesi</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Aktivite seviyenizi seçin" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="sedentary">Hareketsiz</SelectItem>
                              <SelectItem value="light">Hafif Aktivite</SelectItem>
                              <SelectItem value="moderate">Orta Aktivite</SelectItem>
                              <SelectItem value="active">Aktif</SelectItem>
                              <SelectItem value="very_active">Çok Aktif</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            {activityLevelDescriptions[watchedValues.activityLevel]}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="goal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hedef</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Hedefinizi seçin" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="lose">Kilo Vermek</SelectItem>
                              <SelectItem value="maintain">Kilo Korumak</SelectItem>
                              <SelectItem value="gain">Kilo Almak</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Makro Besin Oranları</CardTitle>
                    <CardDescription>
                      Protein, karbonhidrat ve yağ oranlarınızı ayarlayın (toplam 100% olmalıdır)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <FormLabel>Protein (%{watchedValues.proteinPercentage})</FormLabel>
                        <span className="text-sm text-muted-foreground">{watchedValues.proteinPercentage}%</span>
                      </div>
                      <FormField
                        control={form.control}
                        name="proteinPercentage"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Slider
                                min={10}
                                max={60}
                                step={1}
                                value={[field.value]}
                                onValueChange={([value]) => field.onChange(value)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <FormLabel>Karbonhidrat (%{watchedValues.carbsPercentage})</FormLabel>
                        <span className="text-sm text-muted-foreground">{watchedValues.carbsPercentage}%</span>
                      </div>
                      <FormField
                        control={form.control}
                        name="carbsPercentage"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Slider
                                min={10}
                                max={70}
                                step={1}
                                value={[field.value]}
                                onValueChange={([value]) => field.onChange(value)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <FormLabel>Yağ (%{watchedValues.fatPercentage})</FormLabel>
                        <span className="text-sm text-muted-foreground">{watchedValues.fatPercentage}%</span>
                      </div>
                      <FormField
                        control={form.control}
                        name="fatPercentage"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Slider
                                min={10}
                                max={70}
                                step={1}
                                disabled
                                value={[field.value]}
                              />
                            </FormControl>
                            <FormDescription>
                              Yağ oranı otomatik olarak hesaplanır (Protein + Karbonhidrat + Yağ = 100%)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {watchedValues.proteinPercentage + watchedValues.carbsPercentage + watchedValues.fatPercentage !== 100 && (
                      <Alert variant="destructive">
                        <AlertTitle>Dikkat!</AlertTitle>
                        <AlertDescription>
                          Makro besin oranları toplamı 100% olmalıdır. Şu anki toplam: {watchedValues.proteinPercentage + watchedValues.carbsPercentage + watchedValues.fatPercentage}%
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Danışan Seçimi (Opsiyonel)</CardTitle>
                    <CardDescription>
                      Sonuçları kaydetmek için bir danışan seçebilirsiniz
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Select
                      value={selectedClientId?.toString() || ""}
                      onValueChange={(value) => setSelectedClientId(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Danışan seçin (opsiyonel)" />
                      </SelectTrigger>
                      <SelectContent>
                        {isClientsLoading ? (
                          <SelectItem value="loading" disabled>Yükleniyor...</SelectItem>
                        ) : !clients || clients.length === 0 ? (
                          <SelectItem value="empty" disabled>Danışan bulunamadı</SelectItem>
                        ) : (
                          clients.map((client: any) => (
                            <SelectItem key={client.id} value={client.id.toString()}>
                              {client.firstName} {client.lastName}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button type="button" variant="outline">Sıfırla</Button>
                    <Button type="submit">Hesapla</Button>
                  </CardFooter>
                </Card>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="results" className="mt-4">
            {calculationResult && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Genel Metabolik Değerler</CardTitle>
                    <CardDescription>
                      Hesaplanan metabolik değerleriniz ve günlük enerji ihtiyacınız
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Bazal Metabolizma Hızı (BMH)</h3>
                        <div className="text-3xl font-bold">{calculationResult.bmh} kcal</div>
                        <p className="text-xs text-muted-foreground">
                          Hiçbir aktivite yapmadan günlük yakılan kalori miktarı
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Toplam Günlük Enerji Tüketimi</h3>
                        <div className="text-3xl font-bold">{calculationResult.tdee} kcal</div>
                        <p className="text-xs text-muted-foreground">
                          Aktivite seviyenize göre günlük yakılan kalori
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Beden Kitle İndeksi (BKİ)</h3>
                        <div className="text-3xl font-bold">{calculationResult.bmi.toFixed(1)}</div>
                        <p className={`text-xs ${getBMIColorClass(calculationResult.bmi)}`}>
                          {calculationResult.bmiCategory}
                        </p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Hedef Günlük Kalori</h3>
                      <div className="text-4xl font-bold">{calculationResult.targetCalories} kcal</div>
                      <p className="text-sm text-muted-foreground">
                        {form.getValues().goal === "lose" && "Kilo vermek için günlük kalori hedefiniz"}
                        {form.getValues().goal === "maintain" && "Kilonuzu korumak için günlük kalori hedefiniz"}
                        {form.getValues().goal === "gain" && "Kilo almak için günlük kalori hedefiniz"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Makro Besin Dağılımı</CardTitle>
                    <CardDescription>
                      Günlük protein, karbonhidrat ve yağ miktarları
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Protein</h3>
                        <div className="text-3xl font-bold">{calculationResult.macros.protein}g</div>
                        <p className="text-xs text-muted-foreground">
                          Günlük protein ihtiyacınız (toplam kalorilerin %{form.getValues().proteinPercentage}'i)
                        </p>
                        <Progress value={form.getValues().proteinPercentage} className="h-2 bg-secondary" />
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Karbonhidrat</h3>
                        <div className="text-3xl font-bold">{calculationResult.macros.carbs}g</div>
                        <p className="text-xs text-muted-foreground">
                          Günlük karbonhidrat ihtiyacınız (toplam kalorilerin %{form.getValues().carbsPercentage}'i)
                        </p>
                        <Progress value={form.getValues().carbsPercentage} className="h-2 bg-secondary" />
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Yağ</h3>
                        <div className="text-3xl font-bold">{calculationResult.macros.fat}g</div>
                        <p className="text-xs text-muted-foreground">
                          Günlük yağ ihtiyacınız (toplam kalorilerin %{form.getValues().fatPercentage}'i)
                        </p>
                        <Progress value={form.getValues().fatPercentage} className="h-2 bg-secondary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Vitamin ve Mineral Gereksinimleri</CardTitle>
                    <CardDescription>
                      Cinsiyetinize göre günlük vitamin ve mineral gereksinimleri
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Vitaminler</h3>
                        <div className="space-y-3">
                          {nutrientRequirements[form.getValues().gender]
                            .filter(nutrient => nutrient.group === "vitamin")
                            .map((nutrient, index) => (
                              <div key={index} className="flex justify-between items-center">
                                <div>
                                  <span className="font-medium">{nutrient.name}</span>
                                  <p className="text-xs text-muted-foreground">{nutrient.description}</p>
                                </div>
                                <span className="text-sm font-semibold">
                                  {nutrient.amount} {nutrient.unit}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Mineraller</h3>
                        <div className="space-y-3">
                          {nutrientRequirements[form.getValues().gender]
                            .filter(nutrient => nutrient.group === "mineral")
                            .map((nutrient, index) => (
                              <div key={index} className="flex justify-between items-center">
                                <div>
                                  <span className="font-medium">{nutrient.name}</span>
                                  <p className="text-xs text-muted-foreground">{nutrient.description}</p>
                                </div>
                                <span className="text-sm font-semibold">
                                  {nutrient.amount} {nutrient.unit}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {selectedClientId && (
                  <div className="flex justify-end mt-6">
                    <Button onClick={saveMeasurementToClient} disabled={saveMeasurementMutation.isPending}>
                      {saveMeasurementMutation.isPending ? "Kaydediliyor..." : "Danışana Kaydet"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedFeature>
  );
}