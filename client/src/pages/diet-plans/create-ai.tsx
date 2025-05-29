import React, { useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Sparkles, Loader2, InfoIcon, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import ProtectedFeature from "@/components/premium/protected-feature";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { dietRequirementSchema, type DietRequirement, type Client, type Measurement } from "@shared/schema";
import { CardFooter } from "@/components/ui/card";
import DietPlanResult from "@/components/diet/DietPlanResult";

// Form validation schema
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.coerce.number().min(1, "Age is required"),
  gender: z.enum(["male", "female"]),
  height: z.coerce.number().min(1, "Height is required"),
  weight: z.coerce.number().min(1, "Weight is required"),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"]),
  dietType: z.enum(["balanced", "low_carb", "low_fat", "high_protein", "vegetarian", "vegan"]),
  allergies: z.array(z.string()).default([]),
  healthConditions: z.array(z.string()).default([]),
  calorieGoal: z.coerce.number().optional(),
  proteinPercentage: z.coerce.number().min(0).max(100),
  carbsPercentage: z.coerce.number().min(0).max(100),
  fatPercentage: z.coerce.number().min(0).max(100),
  mainMeals: z.coerce.number().min(1).max(6),
  snackCount: z.coerce.number().min(0).max(3),
  dislikedFoods: z.array(z.string()).default([]),
  healthyFoodRatio: z.coerce.number().min(0).max(100),
  // Mikro besin gereksinimleri
  vitaminA: z.coerce.number().optional(),
  vitaminC: z.coerce.number().optional(),
  vitaminD: z.coerce.number().optional(),
  vitaminE: z.coerce.number().optional(),
  vitaminK: z.coerce.number().optional(),
  thiamin: z.coerce.number().optional(),
  riboflavin: z.coerce.number().optional(),
  niacin: z.coerce.number().optional(),
  vitaminB6: z.coerce.number().optional(),
  folate: z.coerce.number().optional(),
  vitaminB12: z.coerce.number().optional(),
  calcium: z.coerce.number().optional(),
  iron: z.coerce.number().optional(),
  magnesium: z.coerce.number().optional(),
  phosphorus: z.coerce.number().optional(),
  zinc: z.coerce.number().optional(),
  potassium: z.coerce.number().optional(),
  sodium: z.coerce.number().optional(),
  copper: z.coerce.number().optional(),
  manganese: z.coerce.number().optional(),
  selenium: z.coerce.number().optional(),
  chromium: z.coerce.number().optional(),
  molybdenum: z.coerce.number().optional(),
  iodine: z.coerce.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Activity levels
const activityLevels = [
  { value: "sedentary", label: "Sedentary (Little or no exercise)" },
  { value: "sedentary", label: "Hareketsiz (Masa başı çalışma, az veya hiç egzersiz yok)" },
  { value: "light", label: "Hafif (Haftada 1-3 kez hafif egzersiz)" },
  { value: "moderate", label: "Orta (Haftada 3-5 kez orta düzey egzersiz)" },
  { value: "active", label: "Aktif (Haftada 5-7 kez yoğun egzersiz)" },
  { value: "very_active", label: "Çok Aktif (Günde iki kez veya ağır fiziksel iş)" },
] as const;

// Client selection schema
const clientSelectSchema = z.object({
  clientId: z.string().min(1, "Please select a client"),
});

type ClientSelectFormData = z.infer<typeof clientSelectSchema>;

// Diet type options
const dietTypes = [
  { value: "balanced", label: "Balanced" },
  { value: "low_carb", label: "Low Carb" },
  { value: "high_protein", label: "High Protein" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "keto", label: "Keto" },
  { value: "paleo", label: "Paleo" },
  { value: "mediterranean", label: "Mediterranean" },
  { value: "custom", label: "Custom" },
] as const;

type DietType = typeof dietTypes[number]["value"];

// Add this type guard function at the top of the file
function isError(error: unknown): error is Error {
  return error instanceof Error;
}

// Add type for the client info display
interface ClientInfoItemProps {
  label: string;
  value: ReactNode;
}

function ClientInfoItem({ label, value }: ClientInfoItemProps) {
  return (
    <div>
      <Label>{label}</Label>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function getActivityLevelLabel(level: string | undefined): string {
  if (!level) return "Belirtilmemiş";
  
  switch (level) {
    case "sedentary":
      return "Hareketsiz";
    case "light":
      return "Hafif Hareketli";
    case "moderate":
      return "Orta Derecede Hareketli";
    case "active":
      return "Aktif";
    case "very_active":
      return "Çok Aktif";
    default:
      return "Belirtilmemiş";
  }
}

// Yardımcı fonksiyon: Dizi 3'lü gruplara böl
function chunkArray(arr: any[], size: number) {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

// Label mappingler
const medicalConditionLabels: Record<string, string> = {
  metabolic_syndrome: "Metabolik Sendrom",
  b12_deficiency: "B12 Eksikliği",
  hypertension: "Hipertansiyon",
  diabetes: "Diyabet",
  obesity: "Obezite",
  pcos: "Polikistik Over Sendromu",
  hypothyroidism: "Hipotiroidi",
  hyperthyroidism: "Hipertiroidi",
  anemia: "Anemi",
  // ... diğerleri
};
const allergyLabels: Record<string, string> = {
  gluten: "Gluten",
  lactose: "Laktoz",
  casein: "Kazein",
  egg_white: "Yumurta Beyazı",
  egg_yolk: "Yumurta Sarısı",
  hazelnut: "Fındık",
  walnut: "Ceviz",
  almond: "Badem",
  peanut: "Yer Fıstığı",
  // ... diğerleri
};
const medicationLabels: Record<string, string> = {
  metformin: "Metformin",
  insulin: "İnsülin",
  euthyrox: "Euthyrox",
  warfarin: "Warfarin",
  heparin: "Heparin",
  statins: "Statinler",
  // ... diğerleri
};
const dietPreferenceLabels: Record<string, string> = {
  vegan: "Vegan",
  vegetarian: "Vejetaryen",
  pescatarian: "Pesketaryen",
  gluten_free: "Glutensiz",
  lactose_free: "Laktozsuz",
  keto: "Ketojenik",
  paleo: "Paleo",
  mediterranean: "Akdeniz",
  // ... diğerleri
};

function getLabel(key: string, map: Record<string, string>) {
  return map[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Ek form için tip
interface ExtraDietForm {
  mealCount: number;
  sleepTime: string;
  wakeTime: string;
  weightGoal: "koruma" | "verme";
  exerciseType: string;
  exerciseFrequency: string;
  foodLikes: string;
  foodDislikes: string;
  dailyWater: string;
}

// Veri dönüştürme yardımcı fonksiyonları
const parseArray = (value: any): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return value.split(',').map((item: string) => item.trim());
    }
  }
  return [];
};

const parseNumber = (value: any, fallback: number = 0): number => {
  if (value === null || value === undefined || value === '') return fallback;
  const num = Number(value);
  return isNaN(num) ? fallback : num;
};

const parseGender = (value: any): 'male' | 'female' => {
  const gender = String(value).toLowerCase();
  return gender === 'female' ? 'female' : 'male';
};

const parseActivityLevel = (value: any): 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' => {
  const level = String(value).toLowerCase();
  const validLevels = ['sedentary', 'light', 'moderate', 'active', 'very_active'] as const;
  return validLevels.includes(level as any) ? level as any : 'moderate';
};

const parseDietType = (value: any): 'balanced' | 'low_carb' | 'high_protein' | 'vegetarian' | 'vegan' | 'keto' | 'paleo' | 'mediterranean' | 'custom' => {
  const type = String(value).toLowerCase();
  const validTypes = ['balanced', 'low_carb', 'high_protein', 'vegetarian', 'vegan', 'keto', 'paleo', 'mediterranean', 'custom'] as const;
  return validTypes.includes(type as any) ? type as any : 'balanced';
};

const calculateAge = (birthDate: string | null | undefined): number => {
  if (!birthDate) return 30; // Default age
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// Ana veri hazırlama fonksiyonu
const preparePayloadFromClientData = (client: any, measurement: any) => {
  // Temel bilgiler
  const name = client?.first_name && client?.last_name 
    ? `${client.first_name} ${client.last_name}`
    : 'İsimsiz Danışan';

  const age = calculateAge(client?.birth_date);
  const gender = parseGender(client?.gender);
  const height = parseNumber(measurement?.height, 170);
  const weight = parseNumber(measurement?.weight, 70);
  const activityLevel = parseActivityLevel(measurement?.activityLevel);
  const dietType = parseDietType(parseArray(client?.diet_preferences)[0]);

  // Sağlık bilgileri
  const healthConditions = parseArray(client?.medical_conditions);
  const allergies = parseArray(client?.allergies);
  const medications = parseArray(client?.medications);
  const dietPreferences = parseArray(client?.diet_preferences);

  // Ölçüm bilgileri
  const bmi = parseNumber(measurement?.bmi, 22);
  const bodyFatPercentage = parseNumber(measurement?.bodyFatPercentage, 20);
  const measurements = {
    waist: parseNumber(measurement?.waistCircumference, 80),
    hip: parseNumber(measurement?.hipCircumference, 90),
    chest: parseNumber(measurement?.chestCircumference, 95),
    arm: parseNumber(measurement?.armCircumference, 30),
    thigh: parseNumber(measurement?.thighCircumference, 50),
    calf: parseNumber(measurement?.calfCircumference, 35),
  };

  // Metabolik bilgiler
  const bmr = parseNumber(measurement?.basalMetabolicRate, 1500);
  const tdee = parseNumber(measurement?.totalDailyEnergyExpenditure, 2000);

  // Zod'un beklediği formatta payload oluştur
  return {
    // Zorunlu alanlar
    name,
    age,
    gender,
    height,
    weight,
    activityLevel,
    dietType,
    proteinPercentage: 30,
    carbsPercentage: 40,
    fatPercentage: 30,
    meals: 3,

    // Ek bilgiler
    healthConditions,
    allergies,
    medications,
    dietPreferences,
    calorieGoal: tdee,
    bmi,
    bodyFatPercentage,
    measurements,
    metabolicInfo: {
      bmr,
      tdee,
    },
  };
};

export default function CreateAIDietPlan() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [selectedTab, setSelectedTab] = useState<string>("client");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClientData, setSelectedClientData] = useState<Partial<FormValues> | null>(null);
  const [extraClientInfo, setExtraClientInfo] = useState<any>(null);
  const [extraMeasurementInfo, setExtraMeasurementInfo] = useState<any>(null);
  const [showExtraForm, setShowExtraForm] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [extraForm, setExtraForm] = useState<ExtraDietForm>({
    mealCount: 3,
    sleepTime: "23:00",
    wakeTime: "07:00",
    weightGoal: "koruma",
    exerciseType: "",
    exerciseFrequency: "",
    foodLikes: "",
    foodDislikes: "",
    dailyWater: "2",
  });
  const [generatedDietPlan, setGeneratedDietPlan] = useState<string | null>(null);

  // Form initialization with proper types
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      age: 0,
      gender: "male",
      height: 0,
      weight: 0,
      activityLevel: "moderate",
      dietType: "balanced",
      allergies: [],
      healthConditions: [],
      proteinPercentage: 30,
      carbsPercentage: 40,
      fatPercentage: 30,
      mainMeals: 3,
      snackCount: 0,
      dislikedFoods: [],
      healthyFoodRatio: 50,
    },
  });

  // Danışanları getir
  const { data: clients = [], isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Seçilen danışanın ölçümlerini getir
  const { data: measurements = [], isLoading: measurementsLoading } = useQuery<Measurement[]>({
    queryKey: [`/api/clients/${selectedClientId}/measurements`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!selectedClientId,
  });

  // Debug için useEffect ekle
  useEffect(() => {
    console.log("Clients:", clients);
    console.log("Measurements:", measurements);
    console.log("Selected Client ID:", selectedClientId);
  }, [clients, measurements, selectedClientId]);

  // Danışan seçme formu
  const clientSelectForm = useForm<ClientSelectFormData>({
    resolver: zodResolver(clientSelectSchema),
    defaultValues: {
      clientId: "",
    },
  });

  // Danışan seçildiğinde
  const onClientSelect = async (data: ClientSelectFormData) => {
    try {
      console.log("Client select data:", data);
      setSelectedClientId(data.clientId);
      
      // Danışan bilgilerini getir
      const client = clients.find(c => c.id.toString() === data.clientId);
      console.log("Found client:", client);

      if (!client) {
        toast({
          title: "Hata",
          description: "Danışan bulunamadı",
          variant: "destructive"
        });
        return;
      }

      // Son ölçümü bul
      const latestMeasurement = measurements.length > 0 
        ? [...measurements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
        : null;

      console.log("Latest measurement:", latestMeasurement);

      if (!latestMeasurement) {
        toast({
          title: "Hata",
          description: "Danışanın ölçüm bilgileri bulunamadı",
          variant: "destructive"
        });
        return;
      }

      // Sağlık bilgilerini array olarak parse et
      const parseMaybeArray = (val: any) => {
        if (!val) return [];
        if (Array.isArray(val)) return val;
        if (typeof val === 'string') {
          try { return JSON.parse(val); } catch { return [val]; }
        }
        return [];
      };

      // Form alanlarını güncelle
      const clientInfo: Partial<FormValues> = {
        name: `${client.first_name} ${client.last_name}`,
        height: Number(latestMeasurement.height),
        weight: Number(latestMeasurement.weight),
        gender: client.gender.toLowerCase() as "male" | "female",
        age: client.birth_date 
          ? Math.floor((new Date().getTime() - new Date(client.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) 
          : 30,
        activityLevel: (latestMeasurement.activityLevel || "moderate") as FormValues["activityLevel"],
        allergies: parseMaybeArray(client.allergies),
        healthConditions: parseMaybeArray(client.medical_conditions),
      };

      setSelectedClientData(clientInfo);
      
      // Ekstra danışan bilgileri
      setExtraClientInfo({
        medications: parseMaybeArray(client.medications),
        dietPreferences: parseMaybeArray(client.diet_preferences),
      });

      // Son ölçüm bilgileri
      setExtraMeasurementInfo({
        bmi: latestMeasurement.bmi,
        bodyFatPercentage: latestMeasurement.bodyFatPercentage,
        waistCircumference: latestMeasurement.waistCircumference,
        hipCircumference: latestMeasurement.hipCircumference,
        chestCircumference: latestMeasurement.chestCircumference,
        armCircumference: latestMeasurement.armCircumference,
        thighCircumference: latestMeasurement.thighCircumference,
        calfCircumference: latestMeasurement.calfCircumference,
        basalMetabolicRate: latestMeasurement.basalMetabolicRate,
        totalDailyEnergyExpenditure: latestMeasurement.totalDailyEnergyExpenditure,
        activityLevel: latestMeasurement.activityLevel,
      });

      toast({
        title: "Başarılı",
        description: "Danışan bilgileri yüklendi",
        variant: "default"
      });
    } catch (error) {
      console.error("Danışan bilgileri yüklenirken hata:", error);
      toast({
        title: "Hata",
        description: "Danışan bilgileri yüklenirken bir hata oluştu",
        variant: "destructive"
      });
    }
  };

  // Form değerlerini sıfırla
  const resetForm = () => {
    form.reset();
    clientSelectForm.reset({
      clientId: "",
    });
    setSelectedClientId(null);
    setSelectedClientData(null);
    setExtraClientInfo(null);
    setExtraMeasurementInfo(null);
  };

  // API'den gelen client objesini logla
  useEffect(() => {
    if (clients && selectedClientId) {
      const client = Array.isArray(clients) ? clients.find(c => c.id.toString() === selectedClientId) : undefined;
      console.log('client:', client);
    }
  }, [clients, selectedClientId]);

  // En son ölçümü bul ve form değerlerini güncelle
  useEffect(() => {
    if (Array.isArray(measurements) && measurements.length > 0 && selectedClientId) {
      const latestMeasurement = [...measurements].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0];
      const client = Array.isArray(clients) ? clients.find(c => c.id.toString() === selectedClientId) : undefined;
      if (client && latestMeasurement) {
        // Sağlık bilgilerini array olarak parse et
        const parseMaybeArray = (val: any) => {
          if (!val) return [];
          if (Array.isArray(val)) return val;
          if (typeof val === 'string') {
            try { return JSON.parse(val); } catch { return [val]; }
          }
          return [];
        };
        // Sadece form alanları
        const clientInfo: Partial<FormValues> = {
          name: `${client.first_name} ${client.last_name}`,
          height: Number(latestMeasurement.height),
          weight: Number(latestMeasurement.weight),
          gender: client.gender.toLowerCase() as "male" | "female",
          age: client.birth_date 
            ? Math.floor((new Date().getTime() - new Date(client.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) 
            : 30,
          activityLevel: (latestMeasurement.activityLevel || "moderate") as FormValues["activityLevel"],
          allergies: parseMaybeArray(client.allergies),
          healthConditions: parseMaybeArray(client.medical_conditions),
        };
        setSelectedClientData(clientInfo);
        // Ekstra danışan bilgileri
        setExtraClientInfo({
          medications: parseMaybeArray(client.medications),
          dietPreferences: parseMaybeArray(client.diet_preferences),
        });
        // Ekstra ölçüm bilgileri
        setExtraMeasurementInfo({
          bmi: latestMeasurement.bmi,
          bodyFatPercentage: latestMeasurement.bodyFatPercentage,
          waistCircumference: latestMeasurement.waistCircumference,
          hipCircumference: latestMeasurement.hipCircumference,
          chestCircumference: latestMeasurement.chestCircumference,
          armCircumference: latestMeasurement.armCircumference,
          thighCircumference: latestMeasurement.thighCircumference,
          calfCircumference: latestMeasurement.calfCircumference,
          basalMetabolicRate: latestMeasurement.basalMetabolicRate,
          totalDailyEnergyExpenditure: latestMeasurement.totalDailyEnergyExpenditure,
          activityLevel: latestMeasurement.activityLevel,
        });
      }
    }
  }, [measurements, selectedClientId, clients, form]);

  // Handle diet type change
  const handleDietTypeChange = (dietType: DietType) => {
    switch (dietType) {
      case "low_carb":
        form.setValue("proteinPercentage", 40);
        form.setValue("carbsPercentage", 20);
        form.setValue("fatPercentage", 40);
        break;
      case "high_protein":
        form.setValue("proteinPercentage", 50);
        form.setValue("carbsPercentage", 30);
        form.setValue("fatPercentage", 20);
        break;
      case "keto":
        form.setValue("proteinPercentage", 25);
        form.setValue("carbsPercentage", 5);
        form.setValue("fatPercentage", 70);
        break;
      case "paleo":
        form.setValue("proteinPercentage", 35);
        form.setValue("carbsPercentage", 25);
        form.setValue("fatPercentage", 40);
        break;
      case "mediterranean":
        form.setValue("proteinPercentage", 20);
        form.setValue("carbsPercentage", 50);
        form.setValue("fatPercentage", 30);
        break;
      case "vegetarian":
        form.setValue("proteinPercentage", 25);
        form.setValue("carbsPercentage", 50);
        form.setValue("fatPercentage", 25);
        break;
      case "vegan":
        form.setValue("proteinPercentage", 20);
        form.setValue("carbsPercentage", 60);
        form.setValue("fatPercentage", 20);
        break;
      default:
        form.setValue("proteinPercentage", 30);
        form.setValue("carbsPercentage", 40);
        form.setValue("fatPercentage", 30);
    }
  };

  // Toplam makro yüzdeleri
  const totalMacros = form.watch("proteinPercentage") + form.watch("carbsPercentage") + form.watch("fatPercentage");

  // Diyet planı oluşturma mutation'ı
  const createDietPlanMutation = useMutation({
    mutationFn: async (values: FormValues & ExtraDietForm) => {
      const response = await apiRequest("POST", "/api/generate/diet-plan", values);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/diet-plans"] });
      toast({
        title: "Başarılı",
        description: "Yapay zeka diyet planı başarıyla oluşturuldu",
        variant: "default"
      });
      navigate("/diet-plans");
    },
    onError: (error: unknown) => {
      const errorMessage = isError(error) ? error.message : "Diyet planı oluşturulurken bir hata oluştu";
      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive"
      });
    },
  });

  // Form submit handler'ını güncelle
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClientId) {
      toast({
        title: "Hata",
        description: "Lütfen önce bir danışan seçin",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsGenerating(true);
      setGenerationProgress(10);

      // Client ve measurement verilerini al
      const client = clients.find(c => c.id.toString() === selectedClientId);
      const latestMeasurement = measurements.length > 0 
        ? [...measurements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
        : null;

      if (!client || !latestMeasurement) {
        throw new Error("Danışan veya ölçüm bilgileri bulunamadı");
      }

      // Payload'ı hazırla
      const payload = preparePayloadFromClientData(client, latestMeasurement);
      console.log('Sending payload to API:', payload);

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/generate/diet-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      setGenerationProgress(60);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error occurred' }));
        throw new Error(errorData.message || 'Diyet planı oluşturulurken bir hata oluştu');
      }

      const responseData = await response.json();
      console.log('Diyet planı başarıyla oluşturuldu:', responseData);
      setGeneratedDietPlan(responseData.plan);
      setIsGenerating(false);
      setGenerationProgress(100);

      toast({
        title: "Başarılı",
        description: "Diyet planı başarıyla oluşturuldu",
        variant: "default"
      });

      navigate("/diet-plans");
    } catch (error) {
      console.error('Fetch error:', error);
      if (error instanceof Error) {
        toast({
          title: "Hata",
          description: error.message || 'Backend sunucusuna bağlanılamadı. Lütfen backend\'in çalıştığından emin olun.',
          variant: "destructive"
        });
      } else {
        toast({
          title: "Hata",
          description: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.",
          variant: "destructive"
        });
      }
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    console.log('selectedClientId:', selectedClientId);
  }, [selectedClientId]);

  // showExtraForm state'ini logla
  useEffect(() => { console.log('showExtraForm:', showExtraForm); }, [showExtraForm]);

  // Danışan seçildiğinde mikro besin gereksinimlerini de ekle
  useEffect(() => {
    if (Array.isArray(measurements) && measurements.length > 0 && selectedClientId) {
      const latestMeasurement = measurements[measurements.length - 1];
      
      // Mevcut ölçüm bilgilerini güncelle
      setExtraMeasurementInfo({
        bmi: latestMeasurement.bmi,
        bodyFatPercentage: latestMeasurement.bodyFatPercentage,
        waistCircumference: latestMeasurement.waistCircumference,
        hipCircumference: latestMeasurement.hipCircumference,
        chestCircumference: latestMeasurement.chestCircumference,
        armCircumference: latestMeasurement.armCircumference,
        thighCircumference: latestMeasurement.thighCircumference,
        calfCircumference: latestMeasurement.calfCircumference,
        basalMetabolicRate: latestMeasurement.basalMetabolicRate,
        totalDailyEnergyExpenditure: latestMeasurement.totalDailyEnergyExpenditure,
        activityLevel: latestMeasurement.activityLevel,
        // Mikro besin değerlerini ekle
        vitaminA: latestMeasurement.vitaminA,
        vitaminC: latestMeasurement.vitaminC,
        vitaminD: latestMeasurement.vitaminD,
        vitaminE: latestMeasurement.vitaminE,
        vitaminK: latestMeasurement.vitaminK,
        thiamin: latestMeasurement.thiamin,
        riboflavin: latestMeasurement.riboflavin,
        niacin: latestMeasurement.niacin,
        vitaminB6: latestMeasurement.vitaminB6,
        folate: latestMeasurement.folate,
        vitaminB12: latestMeasurement.vitaminB12,
        biotin: latestMeasurement.biotin,
        pantothenicAcid: latestMeasurement.pantothenicAcid,
        calcium: latestMeasurement.calcium,
        iron: latestMeasurement.iron,
        magnesium: latestMeasurement.magnesium,
        phosphorus: latestMeasurement.phosphorus,
        zinc: latestMeasurement.zinc,
        potassium: latestMeasurement.potassium,
        sodium: latestMeasurement.sodium,
        copper: latestMeasurement.copper,
        manganese: latestMeasurement.manganese,
        selenium: latestMeasurement.selenium,
        chromium: latestMeasurement.chromium,
        molybdenum: latestMeasurement.molybdenum,
        iodine: latestMeasurement.iodine
      });

      // Debug için log ekle
      console.log('Latest measurement:', latestMeasurement);
      console.log('Extra measurement info:', {
        vitaminA: latestMeasurement.vitaminA,
        vitaminC: latestMeasurement.vitaminC,
        vitaminD: latestMeasurement.vitaminD,
        // ... diğer mikro besinler
      });
    }
  }, [measurements, selectedClientId]);

  return (
    <ProtectedFeature featureName="AI Diet Plan Creation">
      <div className="container mx-auto px-4 py-6">
        <div className="grid gap-6 max-w-7xl mx-auto">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">AI ile Diyet Planı Oluştur</h1>
                <p className="text-muted-foreground mt-2">
                  Google Gemini AI destekli kişiselleştirilmiş diyet planları oluşturun.
                </p>
              </div>
              <Sparkles className="h-8 w-8 text-blue-500" />
            </div>
          </Card>

          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto mb-6">
              <TabsTrigger value="client" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Danışan Seç
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Manuel Giriş
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="client" className="border rounded-md p-4">
              <h3 className="text-lg font-medium mb-4">Danışan Seçin</h3>
              <p className="text-muted-foreground mb-6">
                Diyet planı oluşturmak istediğiniz danışanı seçin. Son ölçüm değerleri otomatik olarak kullanılacaktır.
              </p>
              
              <Form {...clientSelectForm}>
                <form onSubmit={(e) => { console.log('Form submitted'); clientSelectForm.handleSubmit(onClientSelect)(e); }} className="space-y-6">
                  <FormField
                    control={clientSelectForm.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Danışan</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Diyet planı oluşturmak için bir danışan seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clientsLoading ? (
                              <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                <span>Danışanlar yükleniyor...</span>
                              </div>
                            ) : clients && clients.length > 0 ? (
                              clients.map((client) => (
                                <SelectItem key={client.id} value={client.id.toString()}>
                                  {client.first_name} {client.last_name}
                                </SelectItem>
                              ))
                            ) : (
                              <div className="p-2 text-center">Danışan bulunamadı</div>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" disabled={clientsLoading}>
                    {measurementsLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Yükleniyor...
                      </>
                    ) : (
                      "Danışanı Seç"
                    )}
                  </Button>
                </form>
              </Form>
              
              {selectedClientData && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Danışan Bilgileri</CardTitle>
                    <CardDescription>
                      Diyet planı oluşturulacak danışanın bilgileri
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={handleFormSubmit} className="space-y-4">
                        {/* Kişisel Bilgiler */}
                        <h4 className="font-semibold text-base mb-2 mt-2 text-blue-700 flex items-center gap-2">👤 Kişisel Bilgiler</h4>
                        <table className="w-full mb-4 bg-blue-50 rounded-lg overflow-hidden">
                          <tbody>
                            <tr className="border-b">
                              <td className="py-2 px-3 font-medium">🧑‍🎓 İsim</td>
                              <td className="py-2 px-3">{selectedClientData.name}</td>
                              <td className="py-2 px-3 font-medium">🎂 Yaş</td>
                              <td className="py-2 px-3">{selectedClientData.age} yaşında</td>
                            </tr>
                            <tr className="border-b">
                              <td className="py-2 px-3 font-medium">⚥ Cinsiyet</td>
                              <td className="py-2 px-3">{selectedClientData.gender === "female" ? "Kadın" : "Erkek"}</td>
                              <td className="py-2 px-3 font-medium">📏 Boy</td>
                              <td className="py-2 px-3">{selectedClientData.height} cm</td>
                            </tr>
                            <tr>
                              <td className="py-2 px-3 font-medium">⚖️ Kilo</td>
                              <td className="py-2 px-3">{selectedClientData.weight} kg</td>
                              <td className="py-2 px-3 font-medium">🏃‍♂️ Aktivite</td>
                              <td className="py-2 px-3">{getActivityLevelLabel(selectedClientData.activityLevel || '')}</td>
                            </tr>
                          </tbody>
                        </table>

                        {/* Son Ölçüm */}
                        {extraMeasurementInfo && (
                          <>
                            <h4 className="font-semibold text-base mb-2 mt-6 text-green-700 flex items-center gap-2">📅 Son Ölçüm</h4>
                            <table className="w-full mb-4 bg-green-50 rounded-lg overflow-hidden">
                              <tbody>
                                <tr className="border-b">
                                  <td className="py-2 px-3 font-medium">🧮 VKİ (BMI)</td>
                                  <td className="py-2 px-3">{extraMeasurementInfo.bmi}</td>
                                  <td className="py-2 px-3 font-medium">🧈 Vücut Yağ Oranı</td>
                                  <td className="py-2 px-3">{extraMeasurementInfo.bodyFatPercentage ? `%${extraMeasurementInfo.bodyFatPercentage}` : '-'}</td>
                                </tr>
                                <tr className="border-b">
                                  <td className="py-2 px-3 font-medium">🔥 BMH (BMR)</td>
                                  <td className="py-2 px-3">{extraMeasurementInfo.basalMetabolicRate ? `${extraMeasurementInfo.basalMetabolicRate} kcal` : '-'}</td>
                                  <td className="py-2 px-3 font-medium">🔥 TDEE</td>
                                  <td className="py-2 px-3">{extraMeasurementInfo.totalDailyEnergyExpenditure ? `${extraMeasurementInfo.totalDailyEnergyExpenditure} kcal` : '-'}</td>
                                </tr>
                              </tbody>
                            </table>

                            {/* Çevre Ölçümleri */}
                            <h4 className="font-semibold text-base mb-2 mt-6 text-purple-700 flex items-center gap-2">🏷️ Çevre Ölçümleri</h4>
                            <table className="w-full mb-4 bg-purple-50 rounded-lg overflow-hidden">
                              <tbody>
                                <tr>
                                  {extraMeasurementInfo.waistCircumference && <><td className="py-2 px-3 font-medium">🦴 Bel</td><td className="py-2 px-3">{extraMeasurementInfo.waistCircumference}</td></>}
                                  {extraMeasurementInfo.hipCircumference && <><td className="py-2 px-3 font-medium">🦵 Kalça</td><td className="py-2 px-3">{extraMeasurementInfo.hipCircumference}</td></>}
                                  {extraMeasurementInfo.chestCircumference && <><td className="py-2 px-3 font-medium">💪 Göğüs</td><td className="py-2 px-3">{extraMeasurementInfo.chestCircumference}</td></>}
                                  {extraMeasurementInfo.armCircumference && <><td className="py-2 px-3 font-medium">💪 Kol</td><td className="py-2 px-3">{extraMeasurementInfo.armCircumference}</td></>}
                                  {extraMeasurementInfo.thighCircumference && <><td className="py-2 px-3 font-medium">🦵 Bacak</td><td className="py-2 px-3">{extraMeasurementInfo.thighCircumference}</td></>}
                                  {extraMeasurementInfo.calfCircumference && <><td className="py-2 px-3 font-medium">🦶 Baldır</td><td className="py-2 px-3">{extraMeasurementInfo.calfCircumference}</td></>}
                                </tr>
                              </tbody>
                            </table>

                            {/* Makro Besin Dağılımı */}
                            <h4 className="font-semibold text-base mb-2 mt-6 text-orange-700 flex items-center gap-2">🥩🍞🥑 Makro Besin Dağılımı</h4>
                            <table className="w-full mb-4 bg-orange-50 rounded-lg overflow-hidden">
                              <tbody>
                                <tr>
                                  <td className="py-2 px-3 font-medium">🥩 Protein (%)</td>
                                  <td className="py-2 px-3">{form.watch('proteinPercentage')}%</td>
                                  <td className="py-2 px-3 font-medium">🍞 Karbonhidrat (%)</td>
                                  <td className="py-2 px-3">{form.watch('carbsPercentage')}%</td>
                                  <td className="py-2 px-3 font-medium">🥑 Yağ (%)</td>
                                  <td className="py-2 px-3">{form.watch('fatPercentage')}%</td>
                                </tr>
                              </tbody>
                            </table>

                            {/* Mikro Besin Gereksinimleri */}
                            <h4 className="font-semibold text-base mb-2 mt-6 text-pink-700 flex items-center gap-2">💊 Mikro Besin Gereksinimleri</h4>
                            <table className="w-full mb-4 bg-pink-50 rounded-lg overflow-hidden">
                              <tbody>
                                <tr>
                                  <td className="py-2 px-3 font-medium">A Vitamini (mcg)</td>
                                  <td className="py-2 px-3">{extraMeasurementInfo?.vitaminA ?? '-'}</td>
                                  <td className="py-2 px-3 font-medium">C Vitamini (mg)</td>
                                  <td className="py-2 px-3">{extraMeasurementInfo?.vitaminC ?? '-'}</td>
                                  <td className="py-2 px-3 font-medium">D Vitamini (mcg)</td>
                                  <td className="py-2 px-3">{extraMeasurementInfo?.vitaminD ?? '-'}</td>
                                </tr>
                                <tr>
                                  <td className="py-2 px-3 font-medium">E Vitamini (mg)</td>
                                  <td className="py-2 px-3">{extraMeasurementInfo?.vitaminE ?? '-'}</td>
                                  <td className="py-2 px-3 font-medium">K Vitamini (mcg)</td>
                                  <td className="py-2 px-3">{extraMeasurementInfo?.vitaminK ?? '-'}</td>
                                  <td className="py-2 px-3 font-medium">B1 Vitamini (mg)</td>
                                  <td className="py-2 px-3">{extraMeasurementInfo?.thiamin ?? '-'}</td>
                                </tr>
                                <tr>
                                  <td className="py-2 px-3 font-medium">B2 Vitamini (mg)</td>
                                  <td className="py-2 px-3">{extraMeasurementInfo?.riboflavin ?? '-'}</td>
                                  <td className="py-2 px-3 font-medium">B3 Vitamini (mg)</td>
                                  <td className="py-2 px-3">{extraMeasurementInfo?.niacin ?? '-'}</td>
                                  <td className="py-2 px-3 font-medium">B6 Vitamini (mg)</td>
                                  <td className="py-2 px-3">{extraMeasurementInfo?.vitaminB6 ?? '-'}</td>
                                </tr>
                                <tr>
                                  <td className="py-2 px-3 font-medium">Folat (mcg)</td>
                                  <td className="py-2 px-3">{extraMeasurementInfo?.folate ?? '-'}</td>
                                  <td className="py-2 px-3 font-medium">B12 Vitamini (mcg)</td>
                                  <td className="py-2 px-3">{extraMeasurementInfo?.vitaminB12 ?? '-'}</td>
                                  <td className="py-2 px-3 font-medium">Biotin (mcg)</td>
                                  <td className="py-2 px-3">{extraMeasurementInfo?.biotin ?? '-'}</td>
                                </tr>
                                <tr>
                                  <td className="py-2 px-3 font-medium">Pantotenik Asit (mg)</td>
                                  <td className="py-2 px-3">{extraMeasurementInfo?.pantothenicAcid ?? '-'}</td>
                                  <td className="py-2 px-3 font-medium">Kalsiyum (mg)</td>
                                  <td className="py-2 px-3">{extraMeasurementInfo?.calcium ?? '-'}</td>
                                  <td className="py-2 px-3 font-medium">Demir (mg)</td>
                                  <td className="py-2 px-3">{extraMeasurementInfo?.iron ?? '-'}</td>
                                </tr>
                                <tr>
                                  <td className="py-2 px-3 font-medium">Magnezyum (mg)</td>
                                  <td className="py-2 px-3">{extraMeasurementInfo?.magnesium ?? '-'}</td>
                                  <td className="py-2 px-3 font-medium">Fosfor (mg)</td>
                                  <td className="py-2 px-3">{extraMeasurementInfo?.phosphorus ?? '-'}</td>
                                  <td className="py-2 px-3 font-medium">Çinko (mg)</td>
                                  <td className="py-2 px-3">{extraMeasurementInfo?.zinc ?? '-'}</td>
                                </tr>
                                <tr>
                                  <td className="py-2 px-3 font-medium">Potasyum (mg)</td>
                                  <td className="py-2 px-3">{extraMeasurementInfo?.potassium ?? '-'}</td>
                                  <td className="py-2 px-3 font-medium">Sodyum (mg)</td>
                                  <td className="py-2 px-3">{extraMeasurementInfo?.sodium ?? '-'}</td>
                                  <td className="py-2 px-3 font-medium">Bakır (mcg)</td>
                                  <td className="py-2 px-3">{extraMeasurementInfo?.copper ?? '-'}</td>
                                </tr>
                                <tr>
                                  <td className="py-2 px-3 font-medium">Manganez (mg)</td>
                                  <td className="py-2 px-3">{extraMeasurementInfo?.manganese ?? '-'}</td>
                                  <td className="py-2 px-3 font-medium">Selenyum (mcg)</td>
                                  <td className="py-2 px-3">{extraMeasurementInfo?.selenium ?? '-'}</td>
                                  <td className="py-2 px-3 font-medium">Krom (mcg)</td>
                                  <td className="py-2 px-3">{extraMeasurementInfo?.chromium ?? '-'}</td>
                                </tr>
                                <tr>
                                  <td className="py-2 px-3 font-medium">Molibden (mcg)</td>
                                  <td className="py-2 px-3">{extraMeasurementInfo?.molybdenum ?? '-'}</td>
                                  <td className="py-2 px-3 font-medium">İyot (mcg)</td>
                                  <td className="py-2 px-3">{extraMeasurementInfo?.iodine ?? '-'}</td>
                                  <td className="py-2 px-3"></td>
                                  <td className="py-2 px-3"></td>
                                </tr>
                              </tbody>
                            </table>

                            {/* Sağlık Bilgileri */}
                            <h4 className="font-semibold text-base mb-2 mt-6 text-red-700 flex items-center gap-2">🩺 Sağlık Bilgileri</h4>
                            <table className="w-full mb-4 bg-red-50 rounded-lg overflow-hidden">
                              <tbody>
                                {Array.isArray(selectedClientData.healthConditions) && selectedClientData.healthConditions.length > 0 && (
                                  <tr>
                                    <td className="py-2 px-3 font-medium">🩺 Hastalıklar</td>
                                    <td className="py-2 px-3">{selectedClientData.healthConditions.map((k: string) => getLabel(k, medicalConditionLabels)).join(', ')}</td>
                                  </tr>
                                )}
                                {Array.isArray(selectedClientData.allergies) && selectedClientData.allergies.length > 0 && (
                                  <tr>
                                    <td className="py-2 px-3 font-medium">🌸 Alerjiler</td>
                                    <td className="py-2 px-3">{selectedClientData.allergies.map((k: string) => getLabel(k, allergyLabels)).join(', ')}</td>
                                  </tr>
                                )}
                                {Array.isArray(extraClientInfo.medications) && extraClientInfo.medications.length > 0 && (
                                  <tr>
                                    <td className="py-2 px-3 font-medium">💊 İlaçlar</td>
                                    <td className="py-2 px-3">{extraClientInfo.medications.map((k: string) => getLabel(k, medicationLabels)).join(', ')}</td>
                                  </tr>
                                )}
                                {Array.isArray(extraClientInfo.dietPreferences) && extraClientInfo.dietPreferences.length > 0 && (
                                  <tr>
                                    <td className="py-2 px-3 font-medium">🥗 Diyet Tercihleri</td>
                                    <td className="py-2 px-3">{extraClientInfo.dietPreferences.map((k: string) => getLabel(k, dietPreferenceLabels)).join(', ')}</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </>
                        )}

                        {/* Diyet Planı Ayarları */}
                        <div className="space-y-6">
                          <h3 className="text-lg font-semibold">Diyet Planı Ayarları</h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="dietType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Diyet Tipi</FormLabel>
                                  <Select
                                    onValueChange={(value) => {
                                      field.onChange(value);
                                      handleDietTypeChange(value as DietType);
                                    }}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Diyet tipi seçin" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {dietTypes.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                          {type.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="mainMeals"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Ana Öğün Sayısı</FormLabel>
                                  <FormControl>
                                    <Select
                                      onValueChange={(value) => field.onChange(Number(value))}
                                      defaultValue={field.value.toString()}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Ana öğün sayısı seçin" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="1">1 Öğün</SelectItem>
                                        <SelectItem value="2">2 Öğün</SelectItem>
                                        <SelectItem value="3">3 Öğün</SelectItem>
                                        <SelectItem value="4">4 Öğün</SelectItem>
                                        <SelectItem value="5">5 Öğün</SelectItem>
                                        <SelectItem value="6">6 Öğün</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="snackCount"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Ara Öğün Sayısı</FormLabel>
                                  <FormControl>
                                    <Select
                                      onValueChange={(value) => field.onChange(Number(value))}
                                      defaultValue={field.value.toString()}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Ara öğün sayısı seçin" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="0">Ara Öğün Yok</SelectItem>
                                        <SelectItem value="1">1 Ara Öğün</SelectItem>
                                        <SelectItem value="2">2 Ara Öğün</SelectItem>
                                        <SelectItem value="3">3 Ara Öğün</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="healthyFoodRatio"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Sağlıklı Besin Oranı (%)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      min={0} 
                                      max={100} 
                                      {...field} 
                                      onChange={e => field.onChange(Number(e.target.value))}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Diyet planındaki sağlıklı besinlerin yüzdesi (Kalan kısım junk food olacak)
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="space-y-4">
                            <FormField
                              control={form.control}
                              name="dislikedFoods"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Sevilmeyen Yiyecekler</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Sevilmeyen yiyecekleri virgülle ayırarak yazın"
                                      {...field}
                                      onChange={e => field.onChange(e.target.value.split(',').map(s => s.trim()))}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Diyet planında yer almasını istemediğiniz yiyecekleri yazın
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        <div className="flex justify-end space-x-4">
                          <Button type="submit" disabled={isGenerating}>
                            {isGenerating ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Oluşturuluyor...
                              </>
                            ) : (
                              <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Diyet Planı Oluştur
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSelectedClientId(null);
                        setSelectedClientData(null);
                        setExtraClientInfo(null);
                        setExtraMeasurementInfo(null);
                        resetForm();
                        clientSelectForm.reset();
                      }}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Başka Danışan Seç
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="manual">
              <Card>
                <CardHeader>
                  <CardTitle>Diyet Planı Gereksinimleri</CardTitle>
                  <CardDescription>
                    Kişiselleştirilmiş diyet planı oluşturmak için aşağıdaki bilgileri giriniz.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={handleFormSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-6">
                          <h3 className="text-lg font-semibold">Kişisel Bilgiler</h3>

                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>İsim</FormLabel>
                                <FormControl>
                                  <Input placeholder="Danışanın adı" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="age"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Yaş</FormLabel>
                                  <FormControl>
                                    <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                  </FormControl>
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
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="height"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Boy (cm)</FormLabel>
                                  <FormControl>
                                    <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
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
                                    <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                  </FormControl>
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
                                      <SelectValue placeholder="Aktivite seviyesi seçin" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {activityLevels.map((level) => (
                                      <SelectItem key={level.value} value={level.value}>
                                        {level.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="healthConditions"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Sağlık Durumları</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Diyabet, hipertansiyon, kalp hastalığı vb."
                                    {...field}
                                    onChange={e => field.onChange(e.target.value.split(',').map(s => s.trim()))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="allergies"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Alerjiler / İntoleranslar</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Fıstık, gluten, süt ürünleri vb."
                                    {...field}
                                    onChange={e => field.onChange(e.target.value.split(',').map(s => s.trim()))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="space-y-6">
                          <h3 className="text-lg font-semibold">Diyet Gereksinimleri</h3>

                          <FormField
                            control={form.control}
                            name="calorieGoal"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Kalori Hedefi (opsiyonel)</FormLabel>
                                <HoverCard>
                                  <HoverCardTrigger>
                                    <FormLabel className="flex items-center gap-1">
                                      <InfoIcon className="h-4 w-4 text-muted-foreground" />
                                    </FormLabel>
                                  </HoverCardTrigger>
                                  <HoverCardContent className="w-80">
                                    <p className="text-sm">
                                      Boş bırakırsanız, aktivite seviyesi ve vücut bilgilerine göre otomatik olarak hesaplanacaktır.
                                    </p>
                                  </HoverCardContent>
                                </HoverCard>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="Boş bırakın otomatik hesaplansın"
                                    {...field}
                                    onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="space-y-8 pt-4">
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="font-medium">Makro Besin Dağılımı</h4>
                                <span className={totalMacros === 100 ? "text-green-500" : "text-red-500"}>
                                  Toplam: {totalMacros}%
                                </span>
                              </div>

                              <FormField
                                control={form.control}
                                name="proteinPercentage"
                                render={({ field }) => (
                                  <FormItem className="space-y-2">
                                    <div className="flex justify-between">
                                      <FormLabel>Protein</FormLabel>
                                      <span>{field.value}%</span>
                                    </div>
                                    <FormControl>
                                      <Slider
                                        defaultValue={[field.value]}
                                        min={0}
                                        max={100}
                                        step={5}
                                        onValueChange={(values) => {
                                          field.onChange(values[0]);
                                        }}
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
                                  <FormItem className="space-y-2">
                                    <div className="flex justify-between">
                                      <FormLabel>Karbonhidrat</FormLabel>
                                      <span>{field.value}%</span>
                                    </div>
                                    <FormControl>
                                      <Slider
                                        defaultValue={[field.value]}
                                        min={0}
                                        max={100}
                                        step={5}
                                        onValueChange={(values) => {
                                          field.onChange(values[0]);
                                        }}
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
                                  <FormItem className="space-y-2">
                                    <div className="flex justify-between">
                                      <FormLabel>Yağ</FormLabel>
                                      <span>{field.value}%</span>
                                    </div>
                                    <FormControl>
                                      <Slider
                                        defaultValue={[field.value]}
                                        min={0}
                                        max={100}
                                        step={5}
                                        onValueChange={(values) => {
                                          field.onChange(values[0]);
                                        }}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <Separator />

                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="mainMeals"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Günlük Öğün Sayısı</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        min={1} 
                                        max={6} 
                                        {...field} 
                                        onChange={e => field.onChange(Number(e.target.value))}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="space-y-4">
                              <FormField
                                control={form.control}
                                name="includeSnacks"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-lg border p-4">
                                    <div className="space-y-1">
                                      <FormLabel className="text-base">Atıştırmalık Dahil Et</FormLabel>
                                      <FormDescription>
                                        Diyet planına atıştırmalıklar eklensin mi?
                                      </FormDescription>
                                    </div>
                                    <FormControl>
                                      <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 space-x-2 flex justify-end items-center">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => navigate("/diet-plans")}
                        >
                          İptal
                        </Button>
                        <Button
                          type="submit"
                          disabled={form.formState.isSubmitting}
                          className="gap-2"
                        >
                          {form.formState.isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                          {form.formState.isSubmitting ? "Oluşturuluyor..." : "Diyet Planı Oluştur"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      {generatedDietPlan && (
        <DietPlanResult initialPlan={generatedDietPlan} />
      )}
      {isGenerating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
            <div className="text-center mb-6">
              <Sparkles className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-pulse" />
              <h3 className="text-xl font-semibold mb-2">Diyet Planı Oluşturuluyor</h3>
              <p className="text-gray-600">Yapay zeka diyet planınızı hazırlıyor...</p>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${generationProgress}%` }}
              ></div>
            </div>
            
            <div className="text-center text-sm text-gray-500">
              {generationProgress < 30 && "Danışan bilgileri analiz ediliyor..."}
              {generationProgress >= 30 && generationProgress < 60 && "Besin değerleri hesaplanıyor..."}
              {generationProgress >= 60 && generationProgress < 90 && "Öğün planı oluşturuluyor..."}
              {generationProgress >= 90 && "Son düzenlemeler yapılıyor..."}
            </div>
          </div>
        </div>
      )}
    </ProtectedFeature>
  );
}