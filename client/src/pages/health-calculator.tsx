import React, { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  calculateDailyCalories, 
  calculateMacros 
} from "@/lib/utils";
import { 
  Alert, 
  AlertTitle, 
  AlertDescription 
} from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

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

export default function HealthCalculator() {
  const [activeTab, setActiveTab] = useState("bmr-calculator");
  const [calculationResult, setCalculationResult] = useState<{
    bmr: number;
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
  const onSubmit = (data: HealthFormValues) => {
    // BMR hesapla (Bazal Metabolizma Hızı)
    const bmr = calculateDailyCalories(
      data.age,
      data.gender,
      data.weight,
      data.height,
      data.activityLevel
    );
    
    // BMI hesapla (Beden Kitle İndeksi)
    const bmi = calculateBMI(data.weight, data.height);
    const bmiCategory = getBMICategory(bmi);
    
    // Hedef kalorileri hesapla
    const targetCalories = Math.round(bmr * goalFactors[data.goal]);
    
    // Makro besinleri hesapla
    const macros = calculateMacros(
      targetCalories,
      data.proteinPercentage,
      data.carbsPercentage,
      data.fatPercentage
    );
    
    // Sonuçları ayarla
    setCalculationResult({
      bmr: Math.round(bmr / activityMultipliers[data.activityLevel]), // Gerçek BMR değeri (aktivite çarpanı olmadan)
      tdee: bmr, // TDEE (Toplam Günlük Enerji Harcaması)
      bmi,
      bmiCategory,
      macros: {
        protein: macros.proteinGrams,
        carbs: macros.carbGrams,
        fat: macros.fatGrams
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
    <div className="container max-w-4xl mx-auto py-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Sağlık Hesaplayıcısı</h1>
        <p className="text-muted-foreground">
          BMH (Bazal Metabolizma Hızı), BKİ (Beden Kitle İndeksi) ve besin gereksinimlerinizi hesaplayın
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="bmr-calculator">Hesaplayıcı</TabsTrigger>
          <TabsTrigger value="results" disabled={!calculationResult}>
            Sonuçlar
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="bmr-calculator" className="p-4 border rounded-lg mt-4">
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
                            <SelectItem value="maintain">Kiloyu Korumak</SelectItem>
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
                  <CardTitle>Makro Besin Dağılımı</CardTitle>
                  <CardDescription>
                    Protein, karbonhidrat ve yağ dağılımını ayarlayın (toplam %100 olmalıdır)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex justify-between items-center text-sm">
                    <span>Toplam: {watchedValues.proteinPercentage + watchedValues.carbsPercentage + watchedValues.fatPercentage}%</span>
                    {watchedValues.proteinPercentage + watchedValues.carbsPercentage + watchedValues.fatPercentage !== 100 && (
                      <span className="text-destructive">Toplam %100 olmalıdır</span>
                    )}
                  </div>
                
                  <FormField
                    control={form.control}
                    name="proteinPercentage"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <div className="flex justify-between">
                          <FormLabel>Protein: {field.value}%</FormLabel>
                        </div>
                        <FormControl>
                          <Slider
                            value={[field.value]}
                            min={10}
                            max={60}
                            step={1}
                            onValueChange={(values) => field.onChange(values[0])}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="carbsPercentage"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <div className="flex justify-between">
                          <FormLabel>Karbonhidrat: {field.value}%</FormLabel>
                        </div>
                        <FormControl>
                          <Slider
                            value={[field.value]}
                            min={10}
                            max={70}
                            step={1}
                            onValueChange={(values) => field.onChange(values[0])}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="fatPercentage"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <div className="flex justify-between">
                          <FormLabel>Yağ: {field.value}%</FormLabel>
                        </div>
                        <FormControl>
                          <Slider
                            value={[field.value]}
                            min={10}
                            max={70}
                            step={1}
                            disabled={true}
                            onValueChange={(values) => field.onChange(values[0])}
                          />
                        </FormControl>
                        <FormDescription>
                          Yağ değeri otomatik olarak hesaplanır (Protein + Karbonhidrat toplamının %100'e tamamlayıcısı)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              
              <div className="flex justify-end">
                <Button type="submit" size="lg">
                  Hesapla
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>
        
        <TabsContent value="results" className="mt-4">
          {calculationResult && (
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Metabolizma ve Kalori Sonuçları</CardTitle>
                  <CardDescription>
                    Hesaplamalarınıza göre metabolizma ve kalori ihtiyacınız
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">BMH (Bazal Metabolizma Hızı)</h3>
                      <div className="text-3xl font-bold text-primary">
                        {calculationResult.bmr} kcal
                      </div>
                      <p className="text-sm text-muted-foreground">
                        İstirahat halinde vücudunuzun harcadığı enerji miktarı
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">TDEE (Toplam Enerji Harcaması)</h3>
                      <div className="text-3xl font-bold text-primary">
                        {calculationResult.tdee} kcal
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Günlük aktiviteleriniz dahil toplam harcadığınız enerji
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Hedef Kalori</h3>
                      <div className="text-3xl font-bold text-primary">
                        {calculationResult.targetCalories} kcal
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Seçtiğiniz hedefe göre günlük almanız gereken kalori
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">BKİ (Beden Kitle İndeksi)</h3>
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl font-bold w-24">
                        {calculationResult.bmi.toFixed(1)}
                      </div>
                      <div className="flex-1">
                        <div className="relative w-full h-3 bg-gray-200 rounded-full">
                          <div 
                            className="absolute h-3 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full"
                            style={{ width: "100%" }}
                          />
                          <div 
                            className="absolute w-4 h-4 bg-primary rounded-full -top-0.5 border-2 border-white"
                            style={{ 
                              left: `${Math.min(Math.max(calculationResult.bmi / 40 * 100, 0), 90)}%`,
                              transform: "translateX(-50%)" 
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span>18.5</span>
                          <span>25</span>
                          <span>30</span>
                          <span>40</span>
                        </div>
                      </div>
                      <div className="w-32 text-right">
                        <span className={`font-semibold px-2 py-1 rounded-full text-white
                          ${calculationResult.bmi < 18.5 ? 'bg-blue-500' : ''}
                          ${calculationResult.bmi >= 18.5 && calculationResult.bmi < 25 ? 'bg-green-500' : ''}
                          ${calculationResult.bmi >= 25 && calculationResult.bmi < 30 ? 'bg-yellow-500' : ''}
                          ${calculationResult.bmi >= 30 ? 'bg-red-500' : ''}
                        `}>
                          {calculationResult.bmiCategory}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      BKİ, boy ve kilonuza göre vücut durumunuzu kategorize eder. Bu değer sadece genel bir göstergedir ve vücut kompozisyonunuzdaki kas, yağ dağılımını dikkate almaz.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Makro Besin Gereksinimi</CardTitle>
                  <CardDescription>
                    Günlük makro besin gereksinimleriniz
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col items-center p-4 bg-green-50 rounded-lg border border-green-100">
                      <div className="text-xl font-bold text-green-600 mb-1">Protein</div>
                      <div className="text-3xl font-bold">{calculationResult.macros.protein}g</div>
                      <div className="text-sm text-muted-foreground">
                        {Math.round(calculationResult.macros.protein * 4)} kcal
                      </div>
                      <Progress 
                        value={watchedValues.proteinPercentage} 
                        className="h-2 mt-2 bg-green-100" 
                      />
                      <div className="text-sm mt-1">{watchedValues.proteinPercentage}%</div>
                    </div>
                    
                    <div className="flex flex-col items-center p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="text-xl font-bold text-blue-600 mb-1">Karbonhidrat</div>
                      <div className="text-3xl font-bold">{calculationResult.macros.carbs}g</div>
                      <div className="text-sm text-muted-foreground">
                        {Math.round(calculationResult.macros.carbs * 4)} kcal
                      </div>
                      <Progress 
                        value={watchedValues.carbsPercentage} 
                        className="h-2 mt-2 bg-blue-100" 
                      />
                      <div className="text-sm mt-1">{watchedValues.carbsPercentage}%</div>
                    </div>
                    
                    <div className="flex flex-col items-center p-4 bg-amber-50 rounded-lg border border-amber-100">
                      <div className="text-xl font-bold text-amber-600 mb-1">Yağ</div>
                      <div className="text-3xl font-bold">{calculationResult.macros.fat}g</div>
                      <div className="text-sm text-muted-foreground">
                        {Math.round(calculationResult.macros.fat * 9)} kcal
                      </div>
                      <Progress 
                        value={watchedValues.fatPercentage} 
                        className="h-2 mt-2 bg-amber-100" 
                      />
                      <div className="text-sm mt-1">{watchedValues.fatPercentage}%</div>
                    </div>
                  </div>
                  
                  <div className="mt-6 text-sm text-muted-foreground">
                    <p>
                      <strong>Protein:</strong> Kas onarımı ve büyümesi için önemlidir. Her kilogram vücut ağırlığı için 1.6-2.2g protein önerilir.
                    </p>
                    <p className="mt-2">
                      <strong>Karbonhidrat:</strong> Birincil enerji kaynağınızdır. Aktivite seviyenize göre toplam kalorinin %40-60'ı karbonhidratlardan gelmelidir.
                    </p>
                    <p className="mt-2">
                      <strong>Yağ:</strong> Hormonal fonksiyonlar için gereklidir. Toplam kalorinin en az %20'si yağlardan gelmelidir.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Vitamin ve Mineral Gereksinimleri</CardTitle>
                  <CardDescription>
                    Günlük vitamin ve mineral ihtiyaçlarınız
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="vitamins" className="w-full">
                    <TabsList className="grid grid-cols-2 w-full">
                      <TabsTrigger value="vitamins">Vitaminler</TabsTrigger>
                      <TabsTrigger value="minerals">Mineraller</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="vitamins" className="pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {nutrientRequirements[watchedValues.gender]
                          .filter(nutrient => nutrient.group === "vitamin")
                          .map((vitamin, index) => (
                            <div key={index} className="flex justify-between p-3 border rounded-lg">
                              <div>
                                <div className="font-medium">{vitamin.name}</div>
                                <div className="text-xs text-muted-foreground">{vitamin.description}</div>
                              </div>
                              <div className="font-semibold text-right">
                                {vitamin.amount} {vitamin.unit}
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="minerals" className="pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {nutrientRequirements[watchedValues.gender]
                          .filter(nutrient => nutrient.group === "mineral")
                          .map((mineral, index) => (
                            <div key={index} className="flex justify-between p-3 border rounded-lg">
                              <div>
                                <div className="font-medium">{mineral.name}</div>
                                <div className="text-xs text-muted-foreground">{mineral.description}</div>
                              </div>
                              <div className="font-semibold text-right">
                                {mineral.amount} {mineral.unit}
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm">
                    <p className="font-medium text-blue-800">Not:</p>
                    <p className="text-blue-700">
                      Bu değerler yetişkinler için genel referans değerlerdir. Bireysel ihtiyaçlarınız yaş, cinsiyet, sağlık durumu ve özel koşullarınıza göre değişebilir. Detaylı bilgi için diyetisyen veya sağlık uzmanına danışınız.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex justify-end space-x-4">
                <Button variant="outline" onClick={() => setActiveTab("bmr-calculator")}>
                  Düzenle
                </Button>
                <Button>
                  Sonuçları Kaydet
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}