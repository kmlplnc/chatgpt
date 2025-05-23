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

export default function CreateAIDietPlan() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [selectedTab, setSelectedTab] = useState<string>("client");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClientData, setSelectedClientData] = useState<Partial<FormValues> | null>(null);

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
    queryKey: ["/api/client-measurements", selectedClientId],
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

  // En son ölçümü bul ve form değerlerini güncelle
  useEffect(() => {
    if (measurements && measurements.length > 0 && selectedClientId) {
      const latestMeasurement = measurements.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0];
      
      const client = clients?.find(c => c.id.toString() === selectedClientId);
      
      if (client && latestMeasurement) {
        const clientInfo: Partial<FormValues> = {
          name: `${client.firstName} ${client.lastName}`,
          height: Number(latestMeasurement.height),
          weight: Number(latestMeasurement.weight),
          gender: client.gender.toLowerCase() as "male" | "female",
          age: client.birthDate 
            ? Math.floor((new Date().getTime() - new Date(client.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) 
            : 30,
          activityLevel: (latestMeasurement.activityLevel || "moderate") as FormValues["activityLevel"],
          allergies: Array.isArray(client.allergies) ? client.allergies : [],
          healthConditions: Array.isArray(client.medicalConditions) ? client.medicalConditions : [],
        };

        setSelectedClientData(clientInfo);
        
        // Update form values
        Object.entries(clientInfo).forEach(([key, value]) => {
          if (value !== undefined) {
            form.setValue(key as keyof FormValues, value);
          }
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
    mutationFn: async (values: FormValues) => {
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
    try {
      await createDietPlanMutation.mutateAsync(data);
    } catch (error: unknown) {
      const errorMessage = isError(error) ? error.message : "Failed to create diet plan";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Danışan seçildiğinde
  const onClientSelect = (data: ClientSelectFormData) => {
    setSelectedClientId(data.clientId);
  };

  return (
    <ProtectedFeature featureName="AI Diet Plan Creation">
      <div className="container mx-auto px-4 py-6">
        <div className="grid gap-6 max-w-7xl mx-auto">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Create Diet Plan with AI</h1>
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
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Danışan Bilgileri</CardTitle>
                    <CardDescription>
                      Diyet planı oluşturulacak danışanın bilgileri
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <ClientInfoItem 
                        label="İsim" 
                        value={selectedClientData.name} 
                      />
                      <ClientInfoItem 
                        label="Yaş" 
                        value={`${selectedClientData.age} yaşında`} 
                      />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <ClientInfoItem 
                        label="Boy" 
                        value={`${selectedClientData.height} cm`} 
                      />
                      <ClientInfoItem 
                        label="Kilo" 
                        value={`${selectedClientData.weight} kg`} 
                      />
                      <ClientInfoItem 
                        label="Cinsiyet" 
                        value={selectedClientData.gender === "female" ? "Kadın" : "Erkek"} 
                      />
                    </div>
                    
                    <div className="mt-4">
                      <ClientInfoItem 
                        label="Aktivite Seviyesi" 
                        value={getActivityLevelLabel(selectedClientData.activityLevel || '')} 
                      />
                    </div>
                    
                    {selectedClientData.allergies && selectedClientData.allergies.length > 0 && (
                      <div className="mt-4">
                        <ClientInfoItem 
                          label="Alerjiler" 
                          value={selectedClientData.allergies.join(", ")} 
                        />
                      </div>
                    )}
                    
                    {selectedClientData.healthConditions && selectedClientData.healthConditions.length > 0 && (
                      <div className="mt-4">
                        <ClientInfoItem 
                          label="Sağlık Durumu" 
                          value={selectedClientData.healthConditions.join(", ")} 
                        />
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSelectedClientId(null);
                        setSelectedClientData(null);
                        resetForm();
                        clientSelectForm.reset();
                      }}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Başka Danışan Seç
                    </Button>
                    <Button 
                      onClick={() => setSelectedTab("manual")}
                      className="ml-auto"
                    >
                      Devam Et ve Diyet Planı Detaylarını Ayarla
                      <ArrowRight className="ml-2 h-4 w-4" />
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
    </ProtectedFeature>
  );
}