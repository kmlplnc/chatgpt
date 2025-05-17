import React, { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
import { UserIcon, CalculatorIcon, Loader2 } from "lucide-react";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";

// Form schema
const healthFormSchema = z.object({
  weight: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Geçerli bir kilo giriniz"),
  height: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Geçerli bir boy giriniz"),
  age: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Geçerli bir yaş giriniz"),
  gender: z.enum(["male", "female"]),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"]),
  goal: z.enum(["lose", "maintain", "gain"]),
  dietType: z.enum(["balanced", "low_carb", "high_protein", "keto"]),
  proteinPercentage: z.number().min(0).max(100),
  carbsPercentage: z.number().min(0).max(100),
  fatPercentage: z.number().min(0).max(100)
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

// Danışanın ölçümlerini almak için API fonksiyonu
async function getClientMeasurements(clientId: number) {
  const response = await fetch(`/api/clients/${clientId}/measurements`);
  if (!response.ok) {
    throw new Error('Danışan ölçümleri yüklenemedi');
  }
  return response.json();
}

// Danışan detaylarını almak için API fonksiyonu
async function getClientDetails(clientId: number) {
  const response = await fetch(`/api/clients/${clientId}`);
  if (!response.ok) {
    throw new Error('Danışan bilgileri yüklenemedi');
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

// Danışan güncelleme API fonksiyonu
async function updateClient(id: string, data: Omit<Client, "id">): Promise<Client> {
  const response = await fetch(`/api/clients/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Danışan güncellenemedi");
  }
  return response.json();
}

// Client type tanımı
interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  occupation: string;
  status: "active" | "inactive";
  gender: "male" | "female";
  height: number;
  birthDate?: string;
}

// API response type
interface ApiResponse {
  data: Client[];
}

async function getClients(): Promise<Client[]> {
  const response = await apiRequest("GET", "/api/clients");
  if (!response.ok) {
    throw new Error("Danışanlar alınamadı");
  }
  return response.json();
}

function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

function calculateBmrFromString(weight: string, height: string, age: number, gender: string): number {
  // Parse weight and height to numbers, ensuring they are valid
  const weightNum = parseFloat(weight);
  const heightNum = parseFloat(height);
  
  // Validate inputs
  if (isNaN(weightNum) || isNaN(heightNum) || isNaN(age) || 
      weightNum <= 0 || heightNum <= 0 || age <= 0) {
    throw new Error('Invalid input values for BMR calculation');
  }

  // Harris-Benedict Formula
  if (gender === "male") {
    // Men: BMR = 88.362 + (13.397 × weight in kg) + (4.799 × height in cm) - (5.677 × age in years)
    return 88.362 + (13.397 * weightNum) + (4.799 * heightNum) - (5.677 * age);
  } else {
    // Women: BMR = 447.593 + (9.247 × weight in kg) + (3.098 × height in cm) - (4.330 × age in years)
    return 447.593 + (9.247 * weightNum) + (3.098 * heightNum) - (4.330 * age);
  }
}

// Helper: Bir makro azaltılırsa açılan boşluğu öncelikli olarak diğer makroya ekle
function redistributeMacros({changed, value, protein, carbs, fat}: {changed: 'protein'|'carbs'|'fat', value: number, protein: number, carbs: number, fat: number}) {
  let newProtein = protein;
  let newCarbs = carbs;
  let newFat = fat;
  let total = protein + carbs + fat;
  let diff = value - (changed === 'protein' ? protein : changed === 'carbs' ? carbs : fat);

  if (changed === 'protein') {
    newProtein = value;
    let sum = newProtein + newCarbs + newFat;
    if (sum !== 100) {
      let delta = 100 - sum;
      // Öncelik: karbonhidrat, sonra yağ
      if (delta > 0) {
        let addToCarbs = Math.min(100 - newCarbs, delta);
        newCarbs += addToCarbs;
        delta -= addToCarbs;
        if (delta > 0) {
          newFat += delta;
        }
      } else if (delta < 0) {
        // Azaltma: önce karbonhidrat, sonra yağ
        let reduceFromCarbs = Math.min(newCarbs, -delta);
        newCarbs -= reduceFromCarbs;
        delta += reduceFromCarbs;
        if (delta < 0) {
          newFat += delta; // delta negatif, azaltır
        }
      }
    }
  } else if (changed === 'carbs') {
    newCarbs = value;
    let sum = newProtein + newCarbs + newFat;
    if (sum !== 100) {
      let delta = 100 - sum;
      // Öncelik: protein, sonra yağ
      if (delta > 0) {
        let addToProtein = Math.min(100 - newProtein, delta);
        newProtein += addToProtein;
        delta -= addToProtein;
        if (delta > 0) {
          newFat += delta;
        }
      } else if (delta < 0) {
        // Azaltma: önce protein, sonra yağ
        let reduceFromProtein = Math.min(newProtein, -delta);
        newProtein -= reduceFromProtein;
        delta += reduceFromProtein;
        if (delta < 0) {
          newFat += delta;
        }
      }
    }
  } else if (changed === 'fat') {
    newFat = value;
    let sum = newProtein + newCarbs + newFat;
    if (sum !== 100) {
      let delta = 100 - sum;
      // Öncelik: protein, sonra karbonhidrat
      if (delta > 0) {
        let addToProtein = Math.min(100 - newProtein, delta);
        newProtein += addToProtein;
        delta -= addToProtein;
        if (delta > 0) {
          newCarbs += delta;
        }
      } else if (delta < 0) {
        // Azaltma: önce protein, sonra karbonhidrat
        let reduceFromProtein = Math.min(newProtein, -delta);
        newProtein -= reduceFromProtein;
        delta += reduceFromProtein;
        if (delta < 0) {
          newCarbs += delta;
        }
      }
    }
  }
  // Negatif değerleri sıfırla, 100'ü aşmasın
  newProtein = Math.max(0, Math.min(100, Math.round(newProtein)));
  newCarbs = Math.max(0, Math.min(100, Math.round(newCarbs)));
  newFat = Math.max(0, Math.min(100, Math.round(newFat)));
  return {protein: newProtein, carbs: newCarbs, fat: newFat};
}

export default function HealthCalculator() {
  const form = useForm<HealthFormValues>({
    resolver: zodResolver(healthFormSchema),
    defaultValues: {
      weight: "",
      height: "170",
      age: "",
      gender: "male",
      activityLevel: "sedentary",
      goal: "maintain",
      dietType: "balanced",
      proteinPercentage: 30,
      carbsPercentage: 40,
      fatPercentage: 30
    },
    mode: "onChange"
  });

  const [calculationResult, setCalculationResult] = React.useState<{
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
  
  const [activeClient, setActiveClient] = React.useState<Client | null>(null);
  const [clientList, setClientList] = React.useState<Client[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("bmh-calculator");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch clients on component mount
  React.useEffect(() => {
    const fetchClients = async () => {
      setIsLoading(true);
      try {
        const fetchedClients = await getClients();
        setClientList(fetchedClients);
      } catch (error) {
        console.error("Error fetching clients:", error);
        toast({
          title: "Hata",
          description: "Danışan listesi alınırken bir hata oluştu",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchClients();
  }, [toast]);

  const handleClientSelect = async (clientId: string) => {
    setIsLoading(true);
    try {
      const client = clientList.find(c => c.id === clientId);
      if (client) {
        setActiveClient(client);
        form.reset({
          ...form.getValues(),
          height: client.height.toString(),
          age: client.birthDate ? calculateAge(client.birthDate).toString() : "",
          gender: client.gender,
          activityLevel: "sedentary",
          goal: "maintain",
          dietType: "balanced"
        });

        // Fetch latest measurements
        const measurements = await getClientMeasurements(Number(client.id));
        if (measurements && measurements.length > 0) {
          const latestMeasurement = measurements[0];
          form.setValue("weight", latestMeasurement.weight.toString());
        }
      }
    } catch (error) {
      console.error("Error selecting client:", error);
      toast({
        title: "Hata",
        description: "Danışan bilgileri alınırken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: HealthFormValues) => {
    setIsLoading(true);
    try {
      // Parse numeric values
      const weightNum = parseFloat(data.weight);
      const heightNum = parseFloat(data.height);
      const ageNum = parseFloat(data.age);

      // Calculate BMR
      const bmr = calculateBmrFromString(
        data.weight,
        data.height,
        ageNum,
        data.gender
      );

      // Calculate BMI
      const bmi = calculateBMI(weightNum, heightNum);

      // Calculate TDEE
      const tdee = calculateTDEE(bmr, data.activityLevel);

      // Calculate target calories based on goal
      const targetCalories = Math.round(tdee * goalFactors[data.goal]);

      // Calculate macros
      const proteinCalories = targetCalories * (data.proteinPercentage / 100);
      const carbsCalories = targetCalories * (data.carbsPercentage / 100);
      const fatCalories = targetCalories * (data.fatPercentage / 100);

      // Set calculation result
      setCalculationResult({
        bmh: Math.round(bmr),
        tdee: Math.round(tdee),
        bmi: Number(bmi.toFixed(1)),
        bmiCategory: getBMICategory(bmi),
        macros: {
          protein: Math.round(proteinCalories / 4),
          carbs: Math.round(carbsCalories / 4),
          fat: Math.round(fatCalories / 9)
        },
        targetCalories: Math.round(targetCalories)
      });

      // Show success message
      toast({
        title: "Hesaplama Tamamlandı",
        description: "Sonuçlar sekmesine yönlendiriliyorsunuz...",
      });

      // Switch to results tab after a short delay
      setTimeout(() => {
        setActiveTab("results");
      }, 500);

    } catch (error) {
      toast({
        title: "Hata",
        description: "Hesaplama sırasında bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!activeClient || !calculationResult) {
      toast({
        title: "Hata",
        description: "Kaydetmek için bir danışan seçili olmalı ve hesaplama yapılmış olmalı",
        variant: "destructive",
      });
      return;
    }

    try {
      const data = form.getValues();
      await addMeasurement(Number(activeClient.id), {
        weight: parseFloat(data.weight),
        height: parseFloat(data.height),
        date: new Date().toISOString(),
        activityLevel: data.activityLevel,
        basalMetabolicRate: calculationResult.bmh,
        totalDailyEnergyExpenditure: calculationResult.tdee,
        bmi: calculationResult.bmi
      });
      
      toast({
        title: "Başarılı",
        description: "Ölçüm danışan profiline kaydedildi.",
      });
      
      // Refresh client list
      const updatedClients = await getClients();
      setClientList(updatedClients);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Ölçüm kaydedilirken bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Sağlık Hesaplayıcı</h1>
            <p className="text-muted-foreground">
              Vücut ölçülerinizi girerek BMH, BMI ve makro besin ihtiyaçlarınızı hesaplayın
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="bmh-calculator">Hesaplayıcı</TabsTrigger>
            <TabsTrigger value="results">Sonuçlar</TabsTrigger>
          </TabsList>

          <TabsContent value="bmh-calculator">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Danışan Seçme Bölümü */}
                <Card className="bg-white shadow-md border-none hover:shadow-lg transition-all duration-300">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b">
                    <CardTitle className="flex items-center gap-2">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <UserIcon className="h-5 w-5 text-blue-700" />
                      </div>
                      Danışan Seçimi
                    </CardTitle>
                    <CardDescription>
                      Hesaplama yapmak istediğiniz danışanı seçin (opsiyonel)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                        <span className="ml-2 text-sm text-muted-foreground">Danışanlar yükleniyor...</span>
                      </div>
                    ) : clientList.length === 0 ? (
                      <Alert>
                        <AlertTitle>Bilgi</AlertTitle>
                        <AlertDescription>
                          Henüz kayıtlı danışan bulunmuyor.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Select onValueChange={(val) => {
                        if (val === 'guest') {
                          setActiveClient(null);
                          form.reset({
                            weight: '',
                            height: '',
                            age: '',
                            gender: 'male',
                            activityLevel: 'sedentary',
                            goal: 'maintain',
                            dietType: 'balanced',
                            proteinPercentage: 30,
                            carbsPercentage: 40,
                            fatPercentage: 30
                          });
                        } else {
                          handleClientSelect(val);
                        }
                      }} value={activeClient?.id || (activeClient === null ? 'guest' : '')}>
                        <SelectTrigger>
                          <SelectValue placeholder="Danışan seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="guest">Misafir / Serbest Kullanıcı</SelectItem>
                          {clientList.map((client: Client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.firstName} {client.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {activeClient === null && (
                      <div className="mt-2 text-blue-600 text-sm font-medium">Serbest hesaplama modundasınız. Tüm alanlar düzenlenebilir.</div>
                    )}
                  </CardContent>
                </Card>

                {/* Kişisel Bilgiler */}
                <Card>
                  <CardHeader>
                    <CardTitle>Kişisel Bilgiler</CardTitle>
                    <CardDescription>
                      Doğru sonuçlar için lütfen tüm bilgileri eksiksiz doldurun
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Kilo (kg)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  const weight = Number(e.target.value);
                                  const height = Number(form.getValues("height"));
                                  if (weight && height) {
                                    const bmi = calculateBMI(weight, height);
                                    console.log("BMI:", bmi);
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="height"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Boy (cm)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field}
                                disabled={!!activeClient && activeClient !== null}
                                className={activeClient ? "bg-slate-100" : ""}
                              />
                            </FormControl>
                            <FormDescription>
                              {activeClient && "Boy değeri danışan bilgilerinden otomatik alınmıştır"}
                            </FormDescription>
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
                              <Input 
                                type="number" 
                                {...field}
                                disabled={!!activeClient && activeClient !== null}
                                className={activeClient ? "bg-slate-100" : ""}
                              />
                            </FormControl>
                            <FormDescription>
                              {activeClient && "Yaş danışan bilgilerinden otomatik hesaplanmıştır"}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cinsiyet</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={!!activeClient && activeClient !== null}
                            >
                              <SelectTrigger className={activeClient ? "bg-slate-100" : ""}>
                                <SelectValue placeholder="Cinsiyet seçin" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="male">Erkek</SelectItem>
                                <SelectItem value="female">Kadın</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              {activeClient && "Cinsiyet danışan bilgilerinden otomatik alınmıştır"}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="activityLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Aktivite Seviyesi</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Aktivite seviyenizi seçin" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sedentary">Hareketsiz</SelectItem>
                                <SelectItem value="light">Hafif Aktivite</SelectItem>
                                <SelectItem value="moderate">Orta Aktivite</SelectItem>
                                <SelectItem value="active">Aktif</SelectItem>
                                <SelectItem value="very_active">Çok Aktif</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              {activityLevelDescriptions[form.getValues("activityLevel")]}
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
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Hedefinizi seçin" />
                              </SelectTrigger>
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
                    </div>
                  </CardContent>
                </Card>

                {/* Macro nutrients card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Makro Besin Oranları</CardTitle>
                    <CardDescription>
                      Protein, karbonhidrat ve yağ oranlarınızı ayarlayın. Toplam 100% olmalıdır.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="proteinPercentage"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between items-center mb-1">
                            <FormLabel className="text-blue-700 font-semibold">Protein</FormLabel>
                            <span className="text-blue-700 font-bold text-lg">{field.value}%</span>
                          </div>
                          <FormControl>
                            <Slider
                              min={0}
                              max={100}
                              step={1}
                              value={[field.value]}
                              onValueChange={(value) => {
                                const protein = value[0];
                                const carbs = form.getValues("carbsPercentage");
                                const fat = form.getValues("fatPercentage");
                                const adjusted = redistributeMacros({
                                  changed: 'protein',
                                  value: protein,
                                  protein,
                                  carbs,
                                  fat
                                });
                                form.setValue("proteinPercentage", adjusted.protein);
                                form.setValue("carbsPercentage", adjusted.carbs);
                                form.setValue("fatPercentage", adjusted.fat);
                              }}
                              className="[&_[role=slider]]:bg-blue-600"
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
                        <FormItem>
                          <div className="flex justify-between items-center mb-1">
                            <FormLabel className="text-green-700 font-semibold">Karbonhidrat</FormLabel>
                            <span className="text-green-700 font-bold text-lg">{field.value}%</span>
                          </div>
                          <FormControl>
                            <Slider
                              min={0}
                              max={100}
                              step={1}
                              value={[field.value]}
                              onValueChange={(value) => {
                                const carbs = value[0];
                                const protein = form.getValues("proteinPercentage");
                                const fat = form.getValues("fatPercentage");
                                const adjusted = redistributeMacros({
                                  changed: 'carbs',
                                  value: carbs,
                                  protein,
                                  carbs,
                                  fat
                                });
                                form.setValue("proteinPercentage", adjusted.protein);
                                form.setValue("carbsPercentage", adjusted.carbs);
                                form.setValue("fatPercentage", adjusted.fat);
                              }}
                              className="[&_[role=slider]]:bg-green-600"
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
                        <FormItem>
                          <div className="flex justify-between items-center mb-1">
                            <FormLabel className="text-yellow-700 font-semibold">Yağ</FormLabel>
                            <span className="text-yellow-700 font-bold text-lg">{field.value}%</span>
                          </div>
                          <FormControl>
                            <Slider
                              min={0}
                              max={100}
                              step={1}
                              value={[field.value]}
                              onValueChange={(value) => {
                                const fat = value[0];
                                const protein = form.getValues("proteinPercentage");
                                const carbs = form.getValues("carbsPercentage");
                                const adjusted = redistributeMacros({
                                  changed: 'fat',
                                  value: fat,
                                  protein,
                                  carbs,
                                  fat
                                });
                                form.setValue("proteinPercentage", adjusted.protein);
                                form.setValue("carbsPercentage", adjusted.carbs);
                                form.setValue("fatPercentage", adjusted.fat);
                              }}
                              className="[&_[role=slider]]:bg-yellow-400"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="mt-4 text-center text-md font-medium">
                      Toplam: <span className={
                        form.getValues("proteinPercentage") + 
                        form.getValues("carbsPercentage") + 
                        form.getValues("fatPercentage") === 100 
                          ? "text-green-600" 
                          : "text-red-600"
                      }>
                        {form.getValues("proteinPercentage") + 
                         form.getValues("carbsPercentage") + 
                         form.getValues("fatPercentage")}%
                      </span>
                      {form.getValues("proteinPercentage") + 
                       form.getValues("carbsPercentage") + 
                       form.getValues("fatPercentage") !== 100 && (
                        <span className="ml-2 text-xs text-red-500">
                          (Toplam 100% olmalı)
                        </span>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end space-x-2 pt-6">
                    <Button 
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Hesaplanıyor...
                        </>
                      ) : (
                        "Hesapla"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="results">
            {calculationResult && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Hesaplama Sonuçları</CardTitle>
                    <CardDescription>
                      Bazal metabolizma hızınız ve günlük kalori ihtiyacınız aşağıda gösterilmiştir
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg">BMH (Bazal Metabolizma Hızı)</h3>
                        <p className="text-3xl font-bold text-blue-600">
                          {calculationResult.bmh} kcal
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Hiç hareket etmediğinizde vücudunuzun harcadığı kalori miktarı
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg">TDEE (Günlük Kalori İhtiyacı)</h3>
                        <p className="text-3xl font-bold text-green-600">
                          {calculationResult.tdee} kcal
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Aktivite seviyenize göre günlük harcadığınız kalori miktarı
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg">BKİ (Beden Kitle İndeksi)</h3>
                        <p className="text-3xl font-bold text-purple-600">
                          {calculationResult.bmi}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Kategori: {calculationResult.bmiCategory}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg">Hedef Kalori</h3>
                        <p className="text-3xl font-bold text-orange-600">
                          {calculationResult.targetCalories} kcal
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Hedefinize göre günlük almanız gereken kalori miktarı
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Makro Besin Dağılımı</CardTitle>
                    <CardDescription>
                      Günlük almanız gereken protein, karbonhidrat ve yağ miktarları
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg text-blue-600">Protein</h3>
                        <p className="text-3xl font-bold">
                          {calculationResult.macros.protein}g
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {form.getValues("proteinPercentage")}% - {calculationResult.macros.protein * 4} kcal
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg text-green-600">Karbonhidrat</h3>
                        <p className="text-3xl font-bold">
                          {calculationResult.macros.carbs}g
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {form.getValues("carbsPercentage")}% - {calculationResult.macros.carbs * 4} kcal
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg text-yellow-600">Yağ</h3>
                        <p className="text-3xl font-bold">
                          {calculationResult.macros.fat}g
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {form.getValues("fatPercentage")}% - {calculationResult.macros.fat * 9} kcal
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Vitamin ve Mineral Gereksinimleri */}
                <Card>
                  <CardHeader>
                    <CardTitle>Vitamin ve Mineral Gereksinimleri</CardTitle>
                    <CardDescription>
                      Cinsiyetinize göre günlük almanız gereken vitamin ve mineral miktarları
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Vitaminler */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Vitaminler</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {nutrientRequirements[form.getValues("gender")]
                            .filter(nutrient => nutrient.group === "vitamin")
                            .map((vitamin, index) => (
                              <div key={index} className="p-4 rounded-lg border bg-card">
                                <h4 className="font-medium">{vitamin.name}</h4>
                                <p className="text-2xl font-bold text-primary">{vitamin.amount} {vitamin.unit}</p>
                                <p className="text-sm text-muted-foreground">{vitamin.description}</p>
                              </div>
                            ))}
                        </div>
                      </div>

                      {/* Mineraller */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Mineraller</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {nutrientRequirements[form.getValues("gender")]
                            .filter(nutrient => nutrient.group === "mineral")
                            .map((mineral, index) => (
                              <div key={index} className="p-4 rounded-lg border bg-card">
                                <h4 className="font-medium">{mineral.name}</h4>
                                <p className="text-2xl font-bold text-primary">{mineral.amount} {mineral.unit}</p>
                                <p className="text-sm text-muted-foreground">{mineral.description}</p>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Save Button Card - Only show if client is selected */}
                {activeClient && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Ölçüm Kaydetme</CardTitle>
                      <CardDescription>
                        Bu hesaplama sonuçlarını {activeClient.firstName} {activeClient.lastName} için kaydedin
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Kaydettiğinizde, bu ölçüm danışanın profilinde görünecek ve ilerleme takibi yapılabilecek
                      </p>
                      <Button 
                        onClick={handleSave}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        Danışan Profiline Kaydet
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}