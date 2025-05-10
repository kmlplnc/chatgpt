import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Sparkles, Loader2, InfoIcon, User } from "lucide-react";
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

// Form doğrulama şeması
const formSchema = z.object({
  name: z.string().min(2, { message: "İsim en az 2 karakter olmalıdır" }),
  age: z.coerce.number().min(15, { message: "Yaş en az 15 olmalıdır" }).max(100, { message: "Yaş en fazla 100 olmalıdır" }),
  gender: z.enum(["male", "female"], { message: "Lütfen cinsiyet seçin" }),
  height: z.coerce.number().min(120, { message: "Boy en az 120 cm olmalıdır" }).max(220, { message: "Boy en fazla 220 cm olmalıdır" }),
  weight: z.coerce.number().min(30, { message: "Kilo en az 30 kg olmalıdır" }).max(200, { message: "Kilo en fazla 200 kg olmalıdır" }),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"], { message: "Lütfen aktivite seviyesi seçin" }),
  dietType: z.enum(["balanced", "low_carb", "high_protein", "vegetarian", "vegan", "keto", "paleo", "mediterranean", "custom"], { message: "Lütfen diyet türü seçin" }),
  allergies: z.string().optional(),
  healthConditions: z.string().optional(),
  calorieGoal: z.coerce.number().optional(),
  proteinPercentage: z.coerce.number().min(0, { message: "Protein yüzdesi en az 0 olmalıdır" }).max(100, { message: "Protein yüzdesi en fazla 100 olmalıdır" }),
  carbsPercentage: z.coerce.number().min(0, { message: "Karbonhidrat yüzdesi en az 0 olmalıdır" }).max(100, { message: "Karbonhidrat yüzdesi en fazla 100 olmalıdır" }),
  fatPercentage: z.coerce.number().min(0, { message: "Yağ yüzdesi en az 0 olmalıdır" }).max(100, { message: "Yağ yüzdesi en fazla 100 olmalıdır" }),
  meals: z.coerce.number().min(2, { message: "Öğün sayısı en az 2 olmalıdır" }).max(6, { message: "Öğün sayısı en fazla 6 olmalıdır" }),
  includeDessert: z.boolean().default(false),
  includeSnacks: z.boolean().default(true),
}).refine(data => {
  // Makro besinlerin toplamı 100 olmalı
  return (data.proteinPercentage + data.carbsPercentage + data.fatPercentage) === 100;
}, {
  message: "Protein, karbonhidrat ve yağ yüzdelerinin toplamı 100 olmalıdır",
  path: ["proteinPercentage"], // Hangi alanda hata gösterileceği
});

// Aktivite seviyeleri
const activityLevels = [
  { value: "sedentary", label: "Hareketsiz (Masa başı çalışma, az veya hiç egzersiz yok)" },
  { value: "light", label: "Hafif (Haftada 1-3 kez hafif egzersiz)" },
  { value: "moderate", label: "Orta (Haftada 3-5 kez orta düzey egzersiz)" },
  { value: "active", label: "Aktif (Haftada 5-7 kez yoğun egzersiz)" },
  { value: "very_active", label: "Çok Aktif (Günde iki kez veya ağır fiziksel iş)" },
];

// Diyet türleri
const dietTypes = [
  { value: "balanced", label: "Dengeli (Genel sağlıklı beslenme)" },
  { value: "low_carb", label: "Düşük Karbonhidrat" },
  { value: "high_protein", label: "Yüksek Protein" },
  { value: "vegetarian", label: "Vejetaryen" },
  { value: "vegan", label: "Vegan" },
  { value: "keto", label: "Ketojenik" },
  { value: "paleo", label: "Paleo" },
  { value: "mediterranean", label: "Akdeniz" },
  { value: "custom", label: "Özel (Kendi makro dağılımınız)" },
];

// Danışan seçme formu için şema
const clientSelectSchema = z.object({
  clientId: z.string().min(1, { message: "Lütfen bir danışan seçin" }),
});

export default function CreateAIDietPlan() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isAdjustingMacros, setIsAdjustingMacros] = useState(false);
  const [selectedTab, setSelectedTab] = useState<string>("client");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClientData, setSelectedClientData] = useState<any>(null);

  // Danışanları getir
  const { data: clients, isLoading: clientsLoading } = useQuery({
    queryKey: ["/api/clients"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Seçilen danışanın ölçümlerini getir
  const { data: measurements, isLoading: measurementsLoading } = useQuery({
    queryKey: ["/api/client-measurements", selectedClientId],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!selectedClientId,
  });

  // En son ölçümü bul
  useEffect(() => {
    if (measurements && measurements.length > 0 && selectedClientId) {
      const latestMeasurement = measurements.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0];
      
      const client = clients?.find(c => c.id.toString() === selectedClientId);
      
      if (client && latestMeasurement) {
        const clientInfo = {
          name: `${client.firstName} ${client.lastName}`,
          height: latestMeasurement.height,
          weight: latestMeasurement.weight,
          gender: client.gender,
          age: client.birthDate 
            ? Math.floor((new Date().getTime() - new Date(client.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) 
            : 30,
          activityLevel: latestMeasurement.activityLevel || "moderate",
          allergies: client.allergies || "",
          healthConditions: client.medicalConditions || "",
        };

        setSelectedClientData(clientInfo);
        
        // Form değerlerini güncelle
        form.setValue("name", client.firstName + " " + client.lastName);
        form.setValue("height", Number(clientInfo.height));
        form.setValue("weight", Number(clientInfo.weight));
        form.setValue("gender", clientInfo.gender.toLowerCase() === "female" ? "female" : "male");
        form.setValue("age", clientInfo.age);
        form.setValue("activityLevel", clientInfo.activityLevel || "moderate");
        form.setValue("allergies", clientInfo.allergies || "");
        form.setValue("healthConditions", clientInfo.healthConditions || "");
      }
    }
  }, [measurements, selectedClientId, clients]);

  // Danışan seçme formu
  const clientSelectForm = useForm<z.infer<typeof clientSelectSchema>>({
    resolver: zodResolver(clientSelectSchema),
    defaultValues: {
      clientId: "",
    },
  });

  // Form oluşturma
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      age: 30,
      gender: "male",
      height: 170,
      weight: 70,
      activityLevel: "moderate",
      dietType: "balanced",
      allergies: "",
      healthConditions: "",
      calorieGoal: undefined,
      proteinPercentage: 30,
      carbsPercentage: 40,
      fatPercentage: 30,
      meals: 3,
      includeDessert: false,
      includeSnacks: true,
    },
  });
  
  // Form değerlerini sıfırla
  const resetForm = () => {
    form.reset({
      name: "",
      age: 30,
      gender: "male",
      height: 170,
      weight: 70,
      activityLevel: "moderate",
      dietType: "balanced",
      allergies: "",
      healthConditions: "",
      calorieGoal: undefined,
      proteinPercentage: 30,
      carbsPercentage: 40,
      fatPercentage: 30,
      meals: 3,
      includeDessert: false,
      includeSnacks: true,
    });
  };
  
  // Danışan seçildiğinde
  const onClientSelect = (data: z.infer<typeof clientSelectSchema>) => {
    console.log("Danışan seçildi:", data.clientId);
    setSelectedClientId(data.clientId);
    // Formu manual tab'a geçir, böylece danışan verileri yüklendiğinde görebiliriz
    setSelectedTab("manual");
  };

  // Diyet planı oluşturma mutation'ı
  const createDietPlanMutation = useMutation({
    mutationFn: async (values: any) => {
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
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Diyet planı oluşturulurken bir hata oluştu",
        variant: "destructive",
      });
    },
  });

  // Form gönderme
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Eğer danışan seçildiyse, istek içerisine clientId ekle
    const requestPayload = {
      ...values,
      clientId: selectedClientId || undefined
    };
    
    createDietPlanMutation.mutate(requestPayload);
  };

  // Diyet türü değiştiğinde makro besin dağılımını güncelle
  const handleDietTypeChange = (value: string) => {
    if (!isAdjustingMacros) {
      let protein = 30;
      let carbs = 40;
      let fat = 30;

      switch (value) {
        case "low_carb":
          protein = 35;
          carbs = 25;
          fat = 40;
          break;
        case "high_protein":
          protein = 40;
          carbs = 30;
          fat = 30;
          break;
        case "keto":
          protein = 20;
          carbs = 10;
          fat = 70;
          break;
        case "paleo":
          protein = 30;
          carbs = 30;
          fat = 40;
          break;
        case "vegetarian":
        case "vegan":
          protein = 25;
          carbs = 50;
          fat = 25;
          break;
        case "mediterranean":
          protein = 25;
          carbs = 45;
          fat = 30;
          break;
        default:
          protein = 30;
          carbs = 40;
          fat = 30;
      }

      form.setValue("proteinPercentage", protein);
      form.setValue("carbsPercentage", carbs);
      form.setValue("fatPercentage", fat);
    }
  };

  // Makro besin dağılımını düzenlerken diyet türünü 'custom' olarak ayarla
  const handleMacroChange = () => {
    setIsAdjustingMacros(true);
    form.setValue("dietType", "custom");
  };

  // Toplam makro yüzdeleri
  const totalMacros = form.watch("proteinPercentage") + form.watch("carbsPercentage") + form.watch("fatPercentage");

  return (
    <ProtectedFeature featureName="Yapay Zeka ile Diyet Planı">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Yapay Zeka ile Diyet Planı Oluştur</h1>
            <p className="text-muted-foreground mt-2">
              Google Gemini AI destekli kişiselleştirilmiş diyet planları oluşturun.
            </p>
          </div>
          <Sparkles className="h-8 w-8 text-blue-500" />
        </div>

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
              <form onSubmit={clientSelectForm.handleSubmit(onClientSelect)} className="space-y-6">
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
                                {client.firstName} {client.lastName}
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
              <div className="mt-6 border-t pt-4">
                <h4 className="font-medium mb-2">Seçilen Danışan Bilgileri</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">İsim:</span>
                    <span className="font-medium">{selectedClientData.name}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">Yaş:</span>
                    <span className="font-medium">{selectedClientData.age}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">Boy:</span>
                    <span className="font-medium">{selectedClientData.height} cm</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">Kilo:</span>
                    <span className="font-medium">{selectedClientData.weight} kg</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">Cinsiyet:</span>
                    <span className="font-medium">{selectedClientData.gender === "female" ? "Kadın" : "Erkek"}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">Aktivite Seviyesi:</span>
                    <span className="font-medium">{
                      selectedClientData.activityLevel === "sedentary" ? "Hareketsiz" :
                      selectedClientData.activityLevel === "light" ? "Hafif" :
                      selectedClientData.activityLevel === "moderate" ? "Orta" :
                      selectedClientData.activityLevel === "active" ? "Aktif" :
                      selectedClientData.activityLevel === "very_active" ? "Çok Aktif" :
                      "Belirtilmemiş"
                    }</span>
                  </div>
                </div>
                
                <div className="mt-4">
                  <Button
                    type="button"
                    onClick={() => setSelectedTab("manual")}
                    className="w-full"
                  >
                    Devam Et ve Diyet Planı Detaylarını Ayarla
                  </Button>
                </div>
              </div>
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
                              <Input type="number" {...field} />
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
                            />
                          </FormControl>
                          <FormDescription>
                            Dikkate alınması gereken tüm sağlık durumlarını belirtin
                          </FormDescription>
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
                          <FormLabel>Diyet Türü</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              handleDietTypeChange(value);
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Diyet türü seçin" />
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
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormDescription>
                            Kalori hedefini manuel olarak belirtmek için doldurun
                          </FormDescription>
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
                                    handleMacroChange();
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
                                    handleMacroChange();
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
                                    handleMacroChange();
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
                                <Input type="number" min={2} max={6} {...field} />
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
                    disabled={createDietPlanMutation.isPending}
                    className="gap-2"
                  >
                    {createDietPlanMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    {createDietPlanMutation.isPending ? "Oluşturuluyor..." : "Diyet Planı Oluştur"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
        </TabsContent>
        </Tabs>
      </div>
    </ProtectedFeature>
  );
}