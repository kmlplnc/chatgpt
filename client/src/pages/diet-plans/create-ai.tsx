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
  meals: z.coerce.number().min(2).max(6),
  includeSnacks: z.boolean().default(false),
  includeDessert: z.boolean().default(false),
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

export default function CreateAIDietPlan() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [selectedTab, setSelectedTab] = useState<string>("client");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClientData, setSelectedClientData] = useState<Partial<FormValues> | null>(null);
  const [extraClientInfo, setExtraClientInfo] = useState<any>(null);
  const [extraMeasurementInfo, setExtraMeasurementInfo] = useState<any>(null);
  const [showExtraForm, setShowExtraForm] = useState(false);
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
      meals: 3,
      includeSnacks: false,
      includeDessert: false,
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

  // Danışan seçme formu
  const clientSelectForm = useForm<ClientSelectFormData>({
    resolver: zodResolver(clientSelectSchema),
    defaultValues: {
      clientId: "",
    },
  });

  // Form değerlerini sıfırla
  const resetForm = () => {
    form.reset();
    clientSelectForm.reset({
      clientId: "",
    });
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
          neck_circumference: latestMeasurement.neckCircumference,
          basalMetabolicRate: latestMeasurement.basalMetabolicRate,
          totalDailyEnergyExpenditure: latestMeasurement.totalDailyEnergyExpenditure,
          microNutrients: Object.entries(latestMeasurement)
            .filter(([key, value]) => key.startsWith('vitamin') || [
              'calcium','iron','magnesium','phosphorus','zinc','potassium','sodium','copper','manganese','selenium','chromium','molybdenum','iodine'
            ].includes(key))
            .map(([key, value]) => ({ key, value: typeof value === 'object' && value instanceof Date ? value.toISOString() : value || '-' }))
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
        title: "Diyet planı oluşturuldu",
        description: "Yapay zeka diyet planı başarıyla oluşturuldu",
      });
      navigate("/diet-plans");
    },
    onError: (error: unknown) => {
      const errorMessage = isError(error) ? error.message : "Diyet planı oluşturulurken bir hata oluştu";
      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Form gönderme
  const onSubmit = async (data: FormValues) => {
    console.log("onSubmit çalıştı", { data, selectedClientData, extraForm, extraClientInfo, extraMeasurementInfo });
    const mergedData = {
      // Temel bilgiler
      name: selectedClientData?.name || data.name || "",
      age: Number(selectedClientData?.age || data.age || 0),
      gender: selectedClientData?.gender || data.gender || "male",
      height: Number(selectedClientData?.height || data.height || 0),
      weight: Number(selectedClientData?.weight || data.weight || 0),
      activityLevel: selectedClientData?.activityLevel || data.activityLevel || "moderate",
      dietType: data.dietType || "balanced",
      // Sağlık ve diyet
      allergies: selectedClientData?.allergies || data.allergies || [],
      healthConditions: selectedClientData?.healthConditions || data.healthConditions || [],
      medications: extraClientInfo?.medications || [],
      dietPreferences: extraClientInfo?.dietPreferences || [],
      // Makro dağılımı
      proteinPercentage: Number(data.proteinPercentage ?? 30),
      carbsPercentage: Number(data.carbsPercentage ?? 40),
      fatPercentage: Number(data.fatPercentage ?? 30),
      calorieGoal: Number(data.calorieGoal ?? 0),
      // Ekstra form
      meals: Number(extraForm.mealCount || 3),
      sleepTime: extraForm.sleepTime || "23:00",
      wakeTime: extraForm.wakeTime || "07:00",
      exerciseType: extraForm.exerciseType || "",
      exerciseFrequency: extraForm.exerciseFrequency || "",
      foodLikes: extraForm.foodLikes || "",
      foodDislikes: extraForm.foodDislikes || "",
      dailyWater: Number(extraForm.dailyWater || "2"),
      includeSnacks: data.includeSnacks ?? false,
      includeDessert: data.includeDessert ?? false,
      weightGoal: extraForm.weightGoal || "koruma",
      // Son ölçümden gelenler
      bmi: extraMeasurementInfo?.bmi ? Number(extraMeasurementInfo.bmi) : null,
      bodyFatPercentage: extraMeasurementInfo?.bodyFatPercentage ? Number(extraMeasurementInfo.bodyFatPercentage) : null,
      basalMetabolicRate: extraMeasurementInfo?.basalMetabolicRate ? Number(extraMeasurementInfo.basalMetabolicRate) : null,
      totalDailyEnergyExpenditure: extraMeasurementInfo?.totalDailyEnergyExpenditure ? Number(extraMeasurementInfo.totalDailyEnergyExpenditure) : null,
      waistCircumference: extraMeasurementInfo?.waistCircumference ? Number(extraMeasurementInfo.waistCircumference) : null,
      hipCircumference: extraMeasurementInfo?.hipCircumference ? Number(extraMeasurementInfo.hipCircumference) : null,
      chestCircumference: extraMeasurementInfo?.chestCircumference ? Number(extraMeasurementInfo.chestCircumference) : null,
      armCircumference: extraMeasurementInfo?.armCircumference ? Number(extraMeasurementInfo.armCircumference) : null,
      thighCircumference: extraMeasurementInfo?.thighCircumference ? Number(extraMeasurementInfo.thighCircumference) : null,
      calfCircumference: extraMeasurementInfo?.calfCircumference ? Number(extraMeasurementInfo.calfCircumference) : null,
      neckCircumference: extraMeasurementInfo?.neck_circumference ? Number(extraMeasurementInfo.neck_circumference) : null,
      // Mikro besinler - düzgün formatta
      microNutrients: extraMeasurementInfo?.microNutrients?.map((item: any) => ({
        name: item.key,
        value: typeof item.value === 'string' ? Number(item.value) || 0 : Number(item.value) || 0
      })) || []
    };
    console.log("API'ye gönderilen veri:", mergedData);
    try {
      const result = await createDietPlanMutation.mutateAsync(mergedData);
      if (result && result.dietPlan) {
        setGeneratedDietPlan(result.dietPlan);
      }
    } catch (error) {
      // hata zaten toast ile gösteriliyor
    }
  };

  // Danışan seçildiğinde
  const onClientSelect = (data: ClientSelectFormData) => {
    console.log('onClientSelect called with:', data);
    setSelectedClientId(data.clientId);
  };

  useEffect(() => {
    console.log('selectedClientId:', selectedClientId);
  }, [selectedClientId]);

  // showExtraForm state'ini logla
  useEffect(() => { console.log('showExtraForm:', showExtraForm); }, [showExtraForm]);

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
                              {extraMeasurementInfo.neck_circumference && <><td className="py-2 px-3 font-medium">🦱 Boyun</td><td className="py-2 px-3">{extraMeasurementInfo.neck_circumference}</td></>}
                            </tr>
                          </tbody>
                        </table>

                        {/* Makro Dağılımı */}
                        <h4 className="font-semibold text-base mb-2 mt-6 text-orange-700 flex items-center gap-2">🥩🍞🥑 Makro Dağılımı</h4>
                        <table className="w-full mb-4 bg-orange-50 rounded-lg overflow-hidden">
                          <tbody>
                            <tr>
                              <td className="py-2 px-3 font-medium">🥩 Protein (%)</td>
                              <td className="py-2 px-3">{form.watch('proteinPercentage') + '%'}</td>
                              <td className="py-2 px-3 font-medium">🍞 Karbonhidrat (%)</td>
                              <td className="py-2 px-3">{form.watch('carbsPercentage') + '%'}</td>
                              <td className="py-2 px-3 font-medium">🥑 Yağ (%)</td>
                              <td className="py-2 px-3">{form.watch('fatPercentage') + '%'}</td>
                            </tr>
                          </tbody>
                        </table>

                        {/* Mikro Besinler */}
                        {extraMeasurementInfo.microNutrients && extraMeasurementInfo.microNutrients.filter((item: any) => item.value && item.value !== '-').length > 0 && (
                          <>
                            <h4 className="font-semibold text-base mb-2 mt-6 text-pink-700 flex items-center gap-2">💊 Mikro Besinler</h4>
                            <table className="w-full mb-4 bg-pink-50 rounded-lg overflow-hidden">
                              <tbody>
                                {chunkArray(extraMeasurementInfo.microNutrients.filter((item: any) => item.value && item.value !== '-'), 3).map((group, rowIdx) => (
                                  <tr key={rowIdx}>
                                    {group.map((item: any, colIdx: number) => (
                                      <React.Fragment key={rowIdx + '-' + item.key}>
                                        <td className="py-2 px-3 font-medium">🥕 {item.key.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase())}</td>
                                        <td className="py-2 px-3">{item.value}</td>
                                      </React.Fragment>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </>
                        )}
                      </>
                    )}

                    {/* Sağlık Bilgileri */}
                    {extraClientInfo && (
                      <>
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

                    {/* Ek Diyet Planı Bilgileri */}
                    <h4 className="font-semibold text-base mb-2 mt-6 text-yellow-700 flex items-center gap-2">📝 Ek Diyet Planı Bilgileri</h4>
                    <form onSubmit={e => { e.preventDefault(); onSubmit({ ...selectedClientData, ...extraForm }); }} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="font-medium">Öğün Sayısı</label>
                          <select
                            className="w-full border rounded p-2"
                            value={extraForm.mealCount}
                            onChange={e => setExtraForm(f => ({ ...f, mealCount: Number(e.target.value) }))}
                          >
                            <option value={1}>1</option>
                            <option value={2}>2</option>
                            <option value={3}>3</option>
                            <option value={4}>4</option>
                            <option value={5}>5</option>
                            <option value={6}>6</option>
                          </select>
                        </div>
                        <div>
                          <label className="font-medium">Uyku Saati</label>
                          <input
                            type="time"
                            className="w-full border rounded p-2"
                            value={extraForm.sleepTime}
                            onChange={e => setExtraForm(f => ({ ...f, sleepTime: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="font-medium">Uyanma Saati</label>
                          <input
                            type="time"
                            className="w-full border rounded p-2"
                            value={extraForm.wakeTime}
                            onChange={e => setExtraForm(f => ({ ...f, wakeTime: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="font-medium">Egzersiz Türü</label>
                          <input
                            type="text"
                            className="w-full border rounded p-2"
                            placeholder="Örn: Yürüyüş, Fitness"
                            value={extraForm.exerciseType}
                            onChange={e => setExtraForm(f => ({ ...f, exerciseType: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="font-medium">Egzersiz Sıklığı</label>
                          <input
                            type="text"
                            className="w-full border rounded p-2"
                            placeholder="Örn: Haftada 3 gün"
                            value={extraForm.exerciseFrequency}
                            onChange={e => setExtraForm(f => ({ ...f, exerciseFrequency: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="font-medium">Sevdiği Yiyecekler</label>
                          <input
                            type="text"
                            className="w-full border rounded p-2"
                            placeholder="Örn: Tavuk, Yoğurt"
                            value={extraForm.foodLikes}
                            onChange={e => setExtraForm(f => ({ ...f, foodLikes: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="font-medium">Sevmediği Yiyecekler</label>
                          <input
                            type="text"
                            className="w-full border rounded p-2"
                            placeholder="Örn: Balık, Brokoli"
                            value={extraForm.foodDislikes}
                            onChange={e => setExtraForm(f => ({ ...f, foodDislikes: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="font-medium">Günlük Su Tüketimi (Litre)</label>
                          <input
                            type="number"
                            className="w-full border rounded p-2"
                            min={0.5}
                            step={0.1}
                            value={extraForm.dailyWater}
                            onChange={e => setExtraForm(f => ({ ...f, dailyWater: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end mt-4 gap-2">
                        <Button type="submit" className="bg-green-600 text-white">Diyet Planı Oluştur</Button>
                      </div>
                    </form>
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
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                            name="dietType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Diet Type</FormLabel>
                                <Select 
                                  onValueChange={(value: DietType) => {
                                    field.onChange(value);
                                    handleDietTypeChange(value);
                                  }} 
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select diet type" />
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
                                name="meals"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Günlük Öğün Sayısı</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        min={2} 
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

                              <FormField
                                control={form.control}
                                name="includeDessert"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-lg border p-4">
                                    <div className="space-y-1">
                                      <FormLabel className="text-base">Tatlı Dahil Et</FormLabel>
                                      <FormDescription>
                                        Diyet planına tatlılar eklensin mi?
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
    </ProtectedFeature>
  );
}