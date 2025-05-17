import React, { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Calendar, 
  MessageSquare, 
  AlertTriangle, 
  Info, 
  ArrowRight, 
  Pencil, 
  Trash2, 
  Plus, 
  Edit, 
  ChevronLeft, 
  Activity, 
  Ruler, 
  LineChart, 
  Link, 
  KeyRound, 
  Copy,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Alert,
  AlertDescription,
  AlertTitle
} from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useClientApi } from "@/hooks/use-client-api";
import type { Client, Measurement, Appointment, Message } from "@/types/client";

// Recharts components
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ReferenceLine,
} from "recharts";

// Measurement schema
const measurementSchema = z.object({
  date: z.string(),
  weight: z.string(),
  height: z.string(),
  waistCircumference: z.string().optional(),
  hipCircumference: z.string().optional(),
  chestCircumference: z.string().optional(),
  armCircumference: z.string().optional(),
  thighCircumference: z.string().optional(),
  calfCircumference: z.string().optional(),
  bodyFatPercentage: z.string().optional(),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "veryActive"]),
  notes: z.string().optional(),
});

// Health calculation utilities
const calculateBMI = (weight: number, height: number) => {
  const heightInMeters = height / 100;
  return (weight / (heightInMeters * heightInMeters)).toFixed(1);
};

const calculateBMR = (weight: number, height: number, age: number, gender: string) => {
  if (gender === "male") {
    return Math.round(88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age));
  }
  return Math.round(447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age));
};

const calculateTDEE = (bmr: number, activityLevel: string) => {
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    veryActive: 1.9
  };
  return Math.round(bmr * activityMultipliers[activityLevel as keyof typeof activityMultipliers]);
};

const getHealthStatus = (bmi: number) => {
  if (bmi < 18.5) return { status: "Zayıf", color: "text-amber-500" };
  if (bmi < 25) return { status: "Normal", color: "text-green-500" };
  if (bmi < 30) return { status: "Kilolu", color: "text-amber-500" };
  return { status: "Obez", color: "text-red-500" };
};

const getBodyFatStatus = (bodyFat: number, gender: string) => {
  if (gender === "male") {
    if (bodyFat < 2) return { status: "Tehlikeli Düşük", color: "text-red-500" };
    if (bodyFat <= 6) return { status: "Atletik", color: "text-green-500" };
    if (bodyFat <= 13) return { status: "Fitness", color: "text-green-400" };
    if (bodyFat <= 17) return { status: "Kabul Edilebilir", color: "text-amber-500" };
    if (bodyFat <= 25) return { status: "Yüksek", color: "text-red-400" };
    return { status: "Obez", color: "text-red-500" };
  } else {
    if (bodyFat < 10) return { status: "Tehlikeli Düşük", color: "text-red-500" };
    if (bodyFat <= 14) return { status: "Atletik", color: "text-green-500" };
    if (bodyFat <= 21) return { status: "Fitness", color: "text-green-400" };
    if (bodyFat <= 25) return { status: "Kabul Edilebilir", color: "text-amber-500" };
    if (bodyFat <= 32) return { status: "Yüksek", color: "text-red-400" };
    return { status: "Obez", color: "text-red-500" };
  }
};

// Form validation schema
const measurementFormSchema = z.object({
  date: z.string(),
  weight: z.string().transform(Number),
  height: z.string().transform(Number),
  waistCircumference: z.string().optional(),
  hipCircumference: z.string().optional(),
  bodyFatPercentage: z.string().optional(),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "veryActive"]),
  notes: z.string().optional(),
});

type MeasurementFormValues = z.infer<typeof measurementFormSchema>;

export default function ClientDetail() {
  // Router and utility hooks
  const [_, setLocation] = useLocation();
  const params = useParams<{ id?: string }>();
  const id = params?.id;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Early return if no id
  if (!id) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Client ID Required</h2>
          <p className="text-gray-600">Please provide a valid client ID</p>
        </div>
      </div>
    );
  }

  // Get API functions
  const api = useClientApi(id);

  // State declarations
  const [viewedTab, setViewedTab] = useState<"overview" | "measurements" | "health" | "diet" | "notes" | "appointments" | "messages">('overview');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [clientNotes, setClientNotes] = useState<string>();
  const [clientPublicNotes, setClientPublicNotes] = useState<string>();
  const [openNewMeasurementDialog, setOpenNewMeasurementDialog] = useState(false);
  const [openEditMeasurementDialog, setOpenEditMeasurementDialog] = useState(false);
  const [selectedMeasurement, setSelectedMeasurement] = useState<Measurement | null>(null);
  const [confirmDeleteMeasurementOpen, setConfirmDeleteMeasurementOpen] = useState(false);
  const [deleteMeasurementConfirmText, setDeleteMeasurementConfirmText] = useState("");
  const [selectedMeasurementToDelete, setSelectedMeasurementToDelete] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");

  // Queries
  const { 
    data: client, 
    isLoading: isClientLoading, 
    error: clientError 
  } = useQuery({
    queryKey: ["client", id],
    queryFn: api.getClient,
    enabled: !!id && !isNaN(Number(id)),
  });

  const { 
    data: measurements = [], 
    isLoading: isMeasurementsLoading, 
    error: measurementsError 
  } = useQuery({
    queryKey: ["measurements", id],
    queryFn: api.getMeasurements,
    enabled: !!id && !isNaN(Number(id)),
  });

  const { 
    data: appointments = [], 
    isLoading: isAppointmentsLoading, 
    error: appointmentsError 
  } = useQuery({
    queryKey: ["appointments", id],
    queryFn: api.getAppointments,
    enabled: !!id && !isNaN(Number(id)),
  });

  const { 
    data: messages = [], 
    isLoading: isMessagesLoading, 
    error: messagesError 
  } = useQuery({
    queryKey: ["messages", id],
    queryFn: api.getMessages,
    enabled: !!id && !isNaN(Number(id)),
  });

  // Mutations
  const updateClientMutation = useMutation({
    mutationFn: (data: Partial<Client>) => api.updateClient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client", id] });
      toast({
        title: "Başarılı",
        description: "Danışan bilgileri güncellendi.",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Danışan bilgileri güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  const addMeasurementMutation = useMutation({
    mutationFn: (data: Omit<Measurement, "id">) => api.addMeasurement(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["measurements", id] });
      setOpenNewMeasurementDialog(false);
      toast({
        title: "Başarılı",
        description: "Yeni ölçüm eklendi.",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Ölçüm eklenirken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  const updateMeasurementMutation = useMutation({
    mutationFn: (data: Measurement) => api.updateMeasurement(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["measurements", id] });
      setOpenEditMeasurementDialog(false);
      toast({
        title: "Başarılı",
        description: "Ölçüm güncellendi.",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Ölçüm güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  const deleteMeasurementMutation = useMutation({
    mutationFn: (measurementId: number) => api.deleteMeasurement(id, measurementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["measurements", id] });
      setConfirmDeleteMeasurementOpen(false);
      toast({
        title: "Başarılı",
        description: "Ölçüm silindi.",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Ölçüm silinirken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: () => api.deleteClient(id),
    onSuccess: () => {
      setLocation("/clients");
      toast({
        title: "Başarılı",
        description: "Danışan silindi.",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: "Danışan silinirken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  // Calculate health metrics
  const latestMeasurement = measurements?.[0];
  const weight = latestMeasurement?.weight ? parseFloat(latestMeasurement.weight) : 0;
  const height = latestMeasurement?.height ? parseFloat(latestMeasurement.height) : 0;
  const age = client.birthDate ? Math.floor((new Date().getTime() - new Date(client.birthDate).getTime()) / 31557600000) : 0;
  
  const bmi = calculateBMI(weight, height);
  const bmr = calculateBMR(weight, height, age, client.gender);
  const tdee = calculateTDEE(bmr, latestMeasurement?.activityLevel || "sedentary");
  const healthStatus = getHealthStatus(parseFloat(bmi));
  
  const bodyFatPercentage = latestMeasurement?.bodyFatPercentage ? parseFloat(latestMeasurement.bodyFatPercentage) : null;
  const bodyFatStatus = bodyFatPercentage ? getBodyFatStatus(bodyFatPercentage, client.gender) : null;

  // Form initialization
  const form = useForm<MeasurementFormValues>({
    resolver: zodResolver(measurementFormSchema),
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      weight: "",
      height: "",
      waistCircumference: "",
      hipCircumference: "",
      bodyFatPercentage: "",
      activityLevel: "sedentary",
      notes: "",
    },
  });

  // Form submission handler
  const onSubmit = (data: MeasurementFormValues) => {
    if (openNewMeasurementDialog) {
      addMeasurementMutation.mutate({
        ...data,
        clientId: id,
      });
    } else if (selectedMeasurement) {
      updateMeasurementMutation.mutate({
        ...data,
        id: selectedMeasurement.id,
        clientId: id,
      });
    }
  };

  // Effect to populate form when editing
  React.useEffect(() => {
    if (selectedMeasurement) {
      form.reset({
        date: format(new Date(selectedMeasurement.date), "yyyy-MM-dd"),
        weight: selectedMeasurement.weight.toString(),
        height: selectedMeasurement.height.toString(),
        waistCircumference: selectedMeasurement.waistCircumference?.toString() || "",
        hipCircumference: selectedMeasurement.hipCircumference?.toString() || "",
        bodyFatPercentage: selectedMeasurement.bodyFatPercentage?.toString() || "",
        activityLevel: selectedMeasurement.activityLevel || "sedentary",
        notes: selectedMeasurement.notes || "",
      });
    } else {
      form.reset({
        date: format(new Date(), "yyyy-MM-dd"),
        weight: "",
        height: "",
        waistCircumference: "",
        hipCircumference: "",
        bodyFatPercentage: "",
        activityLevel: "sedentary",
        notes: "",
      });
    }
  }, [selectedMeasurement, form]);

  // Loading state
  if (isClientLoading || isMeasurementsLoading || isAppointmentsLoading || isMessagesLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Error state
  if (clientError || measurementsError || appointmentsError || messagesError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2 text-red-600">Bir hata oluştu</h2>
          {clientError && <p className="text-red-500">Danışan: {clientError.message}</p>}
          {measurementsError && <p className="text-red-500">Ölçümler: {measurementsError.message}</p>}
          {appointmentsError && <p className="text-red-500">Randevular: {appointmentsError.message}</p>}
          {messagesError && <p className="text-red-500">Mesajlar: {messagesError.message}</p>}
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Yeniden Dene
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation("/clients")}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Geri
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {client.firstName} {client.lastName}
            </h1>
            <p className="text-gray-500">
              {format(new Date(client.birthDate), "dd MMMM yyyy", { locale: tr })} • {age} yaşında
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setLocation(`/clients/${id}/edit`)}>
            <Pencil className="mr-2 h-4 w-4" />
            Düzenle
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => setConfirmDeleteOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Sil
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-4 gap-6">
        {/* Left sidebar - Quick info */}
        <div className="col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hızlı Bilgiler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-gray-500">E-posta</Label>
                <div className="flex items-center gap-2">
                  <p>{client.email}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(client.email);
                      toast({
                        description: "E-posta adresi kopyalandı",
                      });
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div>
                <Label className="text-sm text-gray-500">Telefon</Label>
                <div className="flex items-center gap-2">
                  <p>{client.phone}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(client.phone);
                      toast({
                        description: "Telefon numarası kopyalandı",
                      });
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {client.emergencyContact && (
                <div>
                  <Label className="text-sm text-gray-500">Acil Durum Kontağı</Label>
                  <p>{client.emergencyContact}</p>
                  <p className="text-sm text-gray-500">{client.emergencyPhone}</p>
                </div>
              )}

              {client.allergies && client.allergies.length > 0 && (
                <div>
                  <Label className="text-sm text-gray-500">Alerjiler</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {client.allergies.map((allergy, index) => (
                      <Badge key={index} variant="secondary">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {client.conditions && client.conditions.length > 0 && (
                <div>
                  <Label className="text-sm text-gray-500">Sağlık Durumları</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {client.conditions.map((condition, index) => (
                      <Badge key={index} variant="secondary">
                        <Info className="mr-1 h-3 w-3" />
                        {condition}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sağlık Metrikleri</CardTitle>
              <CardDescription>
                Son ölçüm: {latestMeasurement ? format(new Date(latestMeasurement.date), "dd MMMM yyyy", { locale: tr }) : "Ölçüm yok"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {latestMeasurement ? (
                <>
                  <div>
                    <Label className="text-sm text-gray-500">Vücut Kitle İndeksi (BMI)</Label>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-semibold">{bmi}</p>
                      <Badge className={healthStatus.color}>{healthStatus.status}</Badge>
                    </div>
                    <Progress 
                      value={Math.min(parseFloat(bmi), 40) * 2.5} 
                      className="mt-2"
                    />
                  </div>

                  {bodyFatPercentage && (
                    <div>
                      <Label className="text-sm text-gray-500">Vücut Yağ Oranı</Label>
                      <div className="flex items-center justify-between">
                        <p className="text-2xl font-semibold">%{bodyFatPercentage}</p>
                        <Badge className={bodyFatStatus?.color}>{bodyFatStatus?.status}</Badge>
                      </div>
                      <Progress 
                        value={Math.min(bodyFatPercentage, 40) * 2.5} 
                        className="mt-2"
                      />
                    </div>
                  )}

                  <div>
                    <Label className="text-sm text-gray-500">Bazal Metabolizma Hızı</Label>
                    <p className="text-2xl font-semibold">{bmr} kcal</p>
                    <p className="text-sm text-gray-500">Günlük kalori ihtiyacı (TDEE)</p>
                    <p className="font-semibold">{tdee} kcal</p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-sm text-gray-500">Boy</Label>
                      <p>{latestMeasurement.height} cm</p>
                    </div>
                    <div className="flex justify-between">
                      <Label className="text-sm text-gray-500">Kilo</Label>
                      <p>{latestMeasurement.weight} kg</p>
                    </div>
                    {latestMeasurement.waistCircumference && (
                      <div className="flex justify-between">
                        <Label className="text-sm text-gray-500">Bel Çevresi</Label>
                        <p>{latestMeasurement.waistCircumference} cm</p>
                      </div>
                    )}
                    {latestMeasurement.hipCircumference && (
                      <div className="flex justify-between">
                        <Label className="text-sm text-gray-500">Kalça Çevresi</Label>
                        <p>{latestMeasurement.hipCircumference} cm</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">Henüz ölçüm girilmemiş</p>
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() => setOpenNewMeasurementDialog(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Ölçüm Ekle
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main content area */}
        <div className="col-span-3">
          <Tabs value={viewedTab} onValueChange={(value) => setViewedTab(value as any)}>
            <TabsList className="w-full justify-start">
              <TabsTrigger value="overview">
                <Activity className="mr-2 h-4 w-4" />
                Genel Bakış
              </TabsTrigger>
              <TabsTrigger value="measurements">
                <Ruler className="mr-2 h-4 w-4" />
                Ölçümler
              </TabsTrigger>
              <TabsTrigger value="health">
                <LineChart className="mr-2 h-4 w-4" />
                Sağlık Takibi
              </TabsTrigger>
              <TabsTrigger value="appointments">
                <Calendar className="mr-2 h-4 w-4" />
                Randevular
              </TabsTrigger>
              <TabsTrigger value="messages">
                <MessageSquare className="mr-2 h-4 w-4" />
                Mesajlar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Progress Charts */}
              <Card>
                <CardHeader>
                  <CardTitle>İlerleme Grafikleri</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    {/* Weight Progress */}
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsLineChart
                          data={measurements?.map(m => ({
                            date: format(new Date(m.date), "dd MMM", { locale: tr }),
                            weight: parseFloat(m.weight)
                          }))}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="weight" 
                            name="Kilo (kg)"
                            stroke="#8884d8" 
                            activeDot={{ r: 8 }} 
                          />
                        </RechartsLineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Body Measurements Progress */}
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsLineChart
                          data={measurements?.map(m => ({
                            date: format(new Date(m.date), "dd MMM", { locale: tr }),
                            waist: m.waistCircumference ? parseFloat(m.waistCircumference) : null,
                            hip: m.hipCircumference ? parseFloat(m.hipCircumference) : null,
                          }))}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="waist" 
                            name="Bel (cm)"
                            stroke="#82ca9d" 
                            activeDot={{ r: 8 }} 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="hip" 
                            name="Kalça (cm)"
                            stroke="#ffc658" 
                            activeDot={{ r: 8 }} 
                          />
                        </RechartsLineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Son Aktiviteler</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {[...measurements || [], ...appointments || [], ...messages || []]
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 5)
                      .map((item, index) => {
                        if ('weight' in item) {
                          return (
                            <div key={index} className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                  <Ruler className="h-4 w-4 text-blue-600" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <p className="text-sm font-medium">Yeni Ölçüm</p>
                                <p className="text-sm text-gray-500">
                                  {format(new Date(item.date), "dd MMMM yyyy", { locale: tr })}
                                </p>
                              </div>
                            </div>
                          );
                        } else if ('startTime' in item) {
                          return (
                            <div key={index} className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                  <Calendar className="h-4 w-4 text-green-600" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <p className="text-sm font-medium">Randevu</p>
                                <p className="text-sm text-gray-500">
                                  {format(new Date(item.startTime), "dd MMMM yyyy HH:mm", { locale: tr })}
                                </p>
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div key={index} className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                                  <MessageSquare className="h-4 w-4 text-purple-600" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <p className="text-sm font-medium">Yeni Mesaj</p>
                                <p className="text-sm text-gray-500">
                                  {format(new Date(item.date), "dd MMMM yyyy HH:mm", { locale: tr })}
                                </p>
                              </div>
                            </div>
                          );
                        }
                      })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="measurements" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Ölçüm Geçmişi</h2>
                <Button onClick={() => setOpenNewMeasurementDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Yeni Ölçüm
                </Button>
              </div>

              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Kilo</TableHead>
                      <TableHead>Boy</TableHead>
                      <TableHead>BMI</TableHead>
                      <TableHead>Vücut Yağı</TableHead>
                      <TableHead>Bel</TableHead>
                      <TableHead>Kalça</TableHead>
                      <TableHead>İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {measurements?.map((measurement) => (
                      <TableRow key={measurement.id}>
                        <TableCell>
                          {format(new Date(measurement.date), "dd MMM yyyy", { locale: tr })}
                        </TableCell>
                        <TableCell>{measurement.weight} kg</TableCell>
                        <TableCell>{measurement.height} cm</TableCell>
                        <TableCell>
                          {calculateBMI(
                            parseFloat(measurement.weight),
                            parseFloat(measurement.height)
                          )}
                        </TableCell>
                        <TableCell>
                          {measurement.bodyFatPercentage ? `%${measurement.bodyFatPercentage}` : "-"}
                        </TableCell>
                        <TableCell>
                          {measurement.waistCircumference ? `${measurement.waistCircumference} cm` : "-"}
                        </TableCell>
                        <TableCell>
                          {measurement.hipCircumference ? `${measurement.hipCircumference} cm` : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedMeasurement(measurement);
                                setOpenEditMeasurementDialog(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedMeasurementToDelete(measurement.id);
                                setConfirmDeleteMeasurementOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="health" className="space-y-6">
              {/* Health tracking content */}
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>BMI Değişimi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsLineChart
                          data={measurements?.map(m => ({
                            date: format(new Date(m.date), "dd MMM", { locale: tr }),
                            bmi: calculateBMI(parseFloat(m.weight), parseFloat(m.height))
                          }))}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis domain={[15, 35]} />
                          <Tooltip />
                          <ReferenceLine y={18.5} stroke="#ffd700" label="Zayıf" />
                          <ReferenceLine y={25} stroke="#00ff00" label="Normal" />
                          <ReferenceLine y={30} stroke="#ff4500" label="Obez" />
                          <Line 
                            type="monotone" 
                            dataKey="bmi" 
                            name="BMI"
                            stroke="#8884d8" 
                            activeDot={{ r: 8 }} 
                          />
                        </RechartsLineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Vücut Yağ Oranı Değişimi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsLineChart
                          data={measurements?.map(m => ({
                            date: format(new Date(m.date), "dd MMM", { locale: tr }),
                            bodyFat: m.bodyFatPercentage ? parseFloat(m.bodyFatPercentage) : null
                          }))}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis domain={[0, 40]} />
                          <Tooltip />
                          <Line 
                            type="monotone" 
                            dataKey="bodyFat" 
                            name="Vücut Yağı %"
                            stroke="#82ca9d" 
                            activeDot={{ r: 8 }} 
                          />
                        </RechartsLineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Bel-Kalça Oranı</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsLineChart
                          data={measurements?.map(m => ({
                            date: format(new Date(m.date), "dd MMM", { locale: tr }),
                            ratio: m.waistCircumference && m.hipCircumference 
                              ? (parseFloat(m.waistCircumference) / parseFloat(m.hipCircumference)).toFixed(2)
                              : null
                          }))}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis domain={[0.6, 1]} />
                          <Tooltip />
                          <Line 
                            type="monotone" 
                            dataKey="ratio" 
                            name="Bel-Kalça Oranı"
                            stroke="#ffc658" 
                            activeDot={{ r: 8 }} 
                          />
                        </RechartsLineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Kalori İhtiyacı Değişimi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={measurements?.map(m => ({
                            date: format(new Date(m.date), "dd MMM", { locale: tr }),
                            bmr: calculateBMR(
                              parseFloat(m.weight),
                              parseFloat(m.height),
                              age,
                              client.gender
                            ),
                            tdee: calculateTDEE(
                              calculateBMR(
                                parseFloat(m.weight),
                                parseFloat(m.height),
                                age,
                                client.gender
                              ),
                              m.activityLevel || "sedentary"
                            )
                          }))}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="bmr" name="BMR (kcal)" fill="#8884d8" />
                          <Bar dataKey="tdee" name="TDEE (kcal)" fill="#82ca9d" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="appointments">
              {/* Appointments content */}
              <AppointmentList 
                clientId={id} 
                appointments={appointments || []} 
                onAppointmentAdded={() => {
                  queryClient.invalidateQueries({ queryKey: ["appointments", id] });
                }}
              />
            </TabsContent>

            <TabsContent value="messages">
              <MessageList
                clientId={id}
                messages={messages || []}
                isLoading={isMessagesLoading}
                error={messagesError}
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                onSendMessage={(content) => {
                  if (!id) return;
                  api.sendMessage(content).then(() => {
                    setNewMessage("");
                    queryClient.invalidateQueries({ queryKey: ["messages", id] });
                  });
                }}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Delete Client Dialog */}
      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Danışanı Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Danışanın tüm bilgileri, ölçümleri ve randevuları silinecektir.
              Silmek için danışanın adını yazın: {client.firstName} {client.lastName}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Danışanın adını yazın"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteConfirmText !== `${client.firstName} ${client.lastName}`}
              onClick={() => deleteClientMutation.mutate()}
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Measurement Dialog */}
      <AlertDialog 
        open={confirmDeleteMeasurementOpen} 
        onOpenChange={setConfirmDeleteMeasurementOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ölçümü Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Ölçüm kaydı tamamen silinecektir.
              Silmek için "SİL" yazın.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <Input
              value={deleteMeasurementConfirmText}
              onChange={(e) => setDeleteMeasurementConfirmText(e.target.value)}
              placeholder='Onaylamak için "SİL" yazın'
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMeasurementConfirmText !== "SİL" || !selectedMeasurementToDelete}
              onClick={() => {
                if (selectedMeasurementToDelete) {
                  deleteMeasurementMutation.mutate(selectedMeasurementToDelete);
                }
              }}
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New/Edit Measurement Dialog */}
      <Dialog 
        open={openNewMeasurementDialog || openEditMeasurementDialog}
        onOpenChange={(open) => {
          if (!open) {
            setOpenNewMeasurementDialog(false);
            setOpenEditMeasurementDialog(false);
            setSelectedMeasurement(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {openNewMeasurementDialog ? "Yeni Ölçüm" : "Ölçüm Düzenle"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tarih</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kilo (kg)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
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
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="waistCircumference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bel Çevresi (cm)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="hipCircumference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kalça Çevresi (cm)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="bodyFatPercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vücut Yağ Oranı (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} />
                    </FormControl>
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
                        <SelectItem value="sedentary">Hareketsiz</SelectItem>
                        <SelectItem value="light">Az Hareketli</SelectItem>
                        <SelectItem value="moderate">Orta Derece Aktif</SelectItem>
                        <SelectItem value="active">Aktif</SelectItem>
                        <SelectItem value="veryActive">Çok Aktif</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Günlük aktivite seviyenizi seçin
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notlar</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit">
                  {openNewMeasurementDialog ? "Ekle" : "Güncelle"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 