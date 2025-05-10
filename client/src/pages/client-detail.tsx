import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { Loader2, Plus, Edit, Trash2, ChevronLeft, Activity, Ruler, LineChart } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

// Recharts bileşenleri
import {
  LineChart as ReLineChart,
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
} from "recharts";

// Ölçüm şeması
const measurementSchema = z.object({
  date: z.string().nonempty("Tarih gereklidir"),
  weight: z.string().nonempty("Kilo gereklidir"),
  height: z.string().nonempty("Boy gereklidir"),
  waistCircumference: z.string().optional().nullable(),
  hipCircumference: z.string().optional().nullable(),
  chestCircumference: z.string().optional().nullable(),
  armCircumference: z.string().optional().nullable(),
  thighCircumference: z.string().optional().nullable(),
  calfCircumference: z.string().optional().nullable(),
  bodyFatPercentage: z.string().optional().nullable(),
  activityLevel: z.string().min(1, "Aktivite seviyesi seçilmelidir"),
  notes: z.string().optional().nullable(),
});

const formatDate = (date: string | Date) => {
  if (!date) return "-";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "dd MMMM yyyy", { locale: tr });
};

function calculateBMI(weight: string, height: string): string {
  const w = parseFloat(weight);
  const h = parseFloat(height) / 100; // cm to m conversion
  if (isNaN(w) || isNaN(h) || h === 0) return "0.00";
  const bmi = w / (h * h);
  return bmi.toFixed(2);
}

function calculateBMR(weight: string, height: string, age: number, gender: string): number {
  const w = parseFloat(weight);
  const h = parseFloat(height);

  if (isNaN(w) || isNaN(h) || isNaN(age)) return 0;

  // Harris-Benedict denklemi
  if (gender === "male") {
    return Math.round(88.362 + (13.397 * w) + (4.799 * h) - (5.677 * age));
  } else {
    return Math.round(447.593 + (9.247 * w) + (3.098 * h) - (4.330 * age));
  }
}

function calculateTDEE(bmr: number, activityLevel: string): number {
  const activityMultipliers: { [key: string]: number } = {
    sedentary: 1.2,    // Hareketsiz (ofis işi)
    light: 1.375,      // Hafif aktivite (haftada 1-3 gün egzersiz)
    moderate: 1.55,    // Orta aktivite (haftada 3-5 gün egzersiz)
    active: 1.725,     // Aktif (haftada 6-7 gün egzersiz)
    veryActive: 1.9    // Çok aktif (günde çift antrenman)
  };

  return Math.round(bmr * (activityMultipliers[activityLevel] || 1.2));
}

function getHealthStatus(bmi: number): { status: string; color: string } {
  if (bmi < 18.5) {
    return { status: "Zayıf", color: "text-amber-500" };
  } else if (bmi >= 18.5 && bmi < 25) {
    return { status: "Normal", color: "text-green-500" };
  } else if (bmi >= 25 && bmi < 30) {
    return { status: "Fazla Kilolu", color: "text-amber-500" };
  } else if (bmi >= 30 && bmi < 35) {
    return { status: "Obez (Sınıf I)", color: "text-red-500" };
  } else if (bmi >= 35 && bmi < 40) {
    return { status: "Obez (Sınıf II)", color: "text-red-600" };
  } else {
    return { status: "Aşırı Obez (Sınıf III)", color: "text-red-700" };
  }
}

const getStatusColor = (value: number, bounds: { min: number; max: number; }): string => {
  if (value < bounds.min) return "text-amber-500";
  if (value > bounds.max) return "text-red-500";
  return "text-green-500";
};

const getBMIColor = (bmi: number) => {
  if (bmi < 18.5 || (bmi >= 25 && bmi < 30)) return "orange";
  if (bmi >= 30) return "red";
  return "green";
};

const getBodyFatColor = (bodyFat: number, gender: string) => {
  if (gender === "male") {
    if (bodyFat < 6) return "orange"; // Çok düşük
    if (bodyFat >= 6 && bodyFat < 14) return "green"; // Atletik
    if (bodyFat >= 14 && bodyFat < 18) return "green"; // Fit
    if (bodyFat >= 18 && bodyFat < 25) return "orange"; // Ortalama
    return "red"; // Obez
  } else {
    if (bodyFat < 16) return "orange"; // Çok düşük
    if (bodyFat >= 16 && bodyFat < 24) return "green"; // Atletik
    if (bodyFat >= 24 && bodyFat < 30) return "green"; // Fit
    if (bodyFat >= 30 && bodyFat < 35) return "orange"; // Ortalama
    return "red"; // Obez
  }
};

export default function ClientDetail() {
  const [setLocation] = useLocation();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [openNewMeasurementDialog, setOpenNewMeasurementDialog] = useState(false);
  const [openEditMeasurementDialog, setOpenEditMeasurementDialog] = useState(false);
  const [selectedMeasurement, setSelectedMeasurement] = useState<any>(null);

  // API İstekleri
  async function getClient() {
    const response = await apiRequest("GET", `/api/clients/${id}`);
    if (!response.ok) {
      throw new Error("Danışan bilgileri yüklenemedi");
    }
    return response.json();
  }

  async function getMeasurements() {
    const response = await apiRequest("GET", `/api/clients/${id}/measurements`);
    if (!response.ok) {
      throw new Error("Ölçüm verileri yüklenemedi");
    }
    return response.json();
  }

  async function createMeasurement(data: any) {
    const response = await apiRequest("POST", `/api/clients/${id}/measurements`, data);
    if (!response.ok) {
      throw new Error("Ölçüm kaydedilemedi");
    }
    return response.json();
  }

  async function updateMeasurement(measurementId: number, data: any) {
    const response = await apiRequest("PATCH", `/api/clients/${id}/measurements/${measurementId}`, data);
    if (!response.ok) {
      throw new Error("Ölçüm güncellenemedi");
    }
    return response.json();
  }

  async function deleteMeasurement(measurementId: number) {
    const response = await apiRequest("DELETE", `/api/clients/${id}/measurements/${measurementId}`);
    if (!response.ok) {
      throw new Error("Ölçüm silinemedi");
    }
    return response.json();
  }

  // Veri Sorgulama
  const { 
    data: client, 
    isLoading: isClientLoading, 
    error: clientError 
  } = useQuery({
    queryKey: [`/api/clients/${id}`],
    queryFn: getClient,
    retry: 1,
  });

  const { 
    data: measurements, 
    isLoading: isMeasurementsLoading, 
    error: measurementsError 
  } = useQuery({
    queryKey: [`/api/clients/${id}/measurements`],
    queryFn: getMeasurements,
    retry: 1,
  });

  // Mutasyonlar
  const createMeasurementMutation = useMutation({
    mutationFn: createMeasurement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${id}/measurements`] });
      toast({
        title: "Başarılı",
        description: "Yeni ölçüm kaydedildi",
      });
      setOpenNewMeasurementDialog(false);
      form.reset({
        date: new Date().toISOString().split('T')[0],
        weight: "",
        height: "",
        activityLevel: "light",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMeasurementMutation = useMutation({
    mutationFn: (data: any) => updateMeasurement(selectedMeasurement.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${id}/measurements`] });
      toast({
        title: "Başarılı",
        description: "Ölçüm güncellendi",
      });
      setOpenEditMeasurementDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMeasurementMutation = useMutation({
    mutationFn: (measurementId: number) => deleteMeasurement(measurementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${id}/measurements`] });
      toast({
        title: "Başarılı",
        description: "Ölçüm silindi",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Formlar
  const form = useForm<z.infer<typeof measurementSchema>>({
    resolver: zodResolver(measurementSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      weight: "",
      height: "",
      waistCircumference: "",
      hipCircumference: "",
      bodyFatPercentage: "",
      activityLevel: "light",
      notes: "",
    },
  });

  const editForm = useForm<z.infer<typeof measurementSchema>>({
    resolver: zodResolver(measurementSchema),
    defaultValues: {
      date: "",
      weight: "",
      height: "",
      waistCircumference: "",
      hipCircumference: "",
      bodyFatPercentage: "",
      activityLevel: "light",
      notes: "",
    },
  });

  // Form İşlemleri
  const onSubmit = (data: z.infer<typeof measurementSchema>) => {
    const bmi = calculateBMI(data.weight, data.height);

    // Client yaşı hesaplama
    let age = 30; // Varsayılan
    if (client && client.birthDate) {
      const birthDate = new Date(client.birthDate);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
    }

    // BMR ve TDEE hesaplama
    const bmr = calculateBMR(data.weight, data.height, age, client?.gender || "female");
    const tdee = calculateTDEE(bmr, data.activityLevel);

    // Verileri hazırlama
    const measurementData = {
      ...data,
      bmi,
      basalMetabolicRate: bmr,
      totalDailyEnergyExpenditure: tdee,
    };

    createMeasurementMutation.mutate(measurementData);
  };

  const onEditSubmit = (data: z.infer<typeof measurementSchema>) => {
    const bmi = calculateBMI(data.weight, data.height);

    // Client yaşı hesaplama
    let age = 30; // Varsayılan
    if (client && client.birthDate) {
      const birthDate = new Date(client.birthDate);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
    }

    // BMR ve TDEE hesaplama
    const bmr = calculateBMR(data.weight, data.height, age, client?.gender || "female");
    const tdee = calculateTDEE(bmr, data.activityLevel);

    // Verileri hazırlama
    const measurementData = {
      ...data,
      bmi,
      basalMetabolicRate: bmr,
      totalDailyEnergyExpenditure: tdee,
    };

    updateMeasurementMutation.mutate(measurementData);
  };

  const handleEditMeasurement = (measurement: any) => {
    setSelectedMeasurement(measurement);
    editForm.reset({
      date: measurement.date,
      weight: measurement.weight,
      height: measurement.height,
      waistCircumference: measurement.waistCircumference || "",
      hipCircumference: measurement.hipCircumference || "",
      bodyFatPercentage: measurement.bodyFatPercentage || "",
      activityLevel: measurement.activityLevel || "light",
      notes: measurement.notes || "",
    });
    setOpenEditMeasurementDialog(true);
  };

  const handleDeleteMeasurement = (measurementId: number) => {
    if (window.confirm("Bu ölçümü silmek istediğinizden emin misiniz?")) {
      deleteMeasurementMutation.mutate(measurementId);
    }
  };

  // Grafik Verileri
  const chartData = measurements?.map((measurement: any) => ({
    date: format(new Date(measurement.date), "dd/MM/yy"),
    weight: parseFloat(measurement.weight),
    bmi: parseFloat(measurement.bmi),
    bodyFat: measurement.bodyFatPercentage ? parseFloat(measurement.bodyFatPercentage) : null,
    waist: measurement.waistCircumference ? parseFloat(measurement.waistCircumference) : null,
    hip: measurement.hipCircumference ? parseFloat(measurement.hipCircumference) : null,
    tdee: measurement.totalDailyEnergyExpenditure ? Math.round(measurement.totalDailyEnergyExpenditure) : 0,
    bmh: measurement.basalMetabolicRate ? Math.round(measurement.basalMetabolicRate) : 0
  })).sort((a: any, b: any) => {
    const dateA = new Date(a.date.split('/').reverse().join('/'));
    const dateB = new Date(b.date.split('/').reverse().join('/'));
    return dateA.getTime() - dateB.getTime();
  });

  // Son ölçüm
  const lastMeasurement = measurements && measurements.length > 0 
    ? measurements.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] 
    : null;

  // İlk ölçüm
  const firstMeasurement = measurements && measurements.length > 0
    ? measurements.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]
    : null;

  // Değişim hesaplama
  const calculateChange = (current: number, initial: number) => {
    if (!initial) return { value: 0, percentage: 0 };
    const change = current - initial;
    const percentage = (change / initial) * 100;
    return {
      value: change.toFixed(2),
      percentage: percentage.toFixed(2)
    };
  };

  // Kilo değişimi
  const weightChange = lastMeasurement && firstMeasurement
    ? calculateChange(parseFloat(lastMeasurement.weight), parseFloat(firstMeasurement.weight))
    : { value: 0, percentage: 0 };

  // BMI değişimi
  const bmiChange = lastMeasurement && firstMeasurement
    ? calculateChange(parseFloat(lastMeasurement.bmi), parseFloat(firstMeasurement.bmi))
    : { value: 0, percentage: 0 };
    
  // BMH değişimi
  const bmhChange = lastMeasurement && firstMeasurement && lastMeasurement.basalMetabolicRate && firstMeasurement.basalMetabolicRate
    ? calculateChange(Math.round(lastMeasurement.basalMetabolicRate), Math.round(firstMeasurement.basalMetabolicRate))
    : { value: 0, percentage: 0 };
    
  // TDEE değişimi
  const tdeeChange = lastMeasurement && firstMeasurement && lastMeasurement.totalDailyEnergyExpenditure && firstMeasurement.totalDailyEnergyExpenditure
    ? calculateChange(Math.round(lastMeasurement.totalDailyEnergyExpenditure), Math.round(firstMeasurement.totalDailyEnergyExpenditure))
    : { value: 0, percentage: 0 };

  // Yaş hesaplama
  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const clientAge = calculateAge(client?.birthDate);

  // Bel-Kalça Oranı hesaplama
  const calculateWHR = (waist?: string, hip?: string) => {
    if (!waist || !hip) return null;
    const w = parseFloat(waist);
    const h = parseFloat(hip);
    if (isNaN(w) || isNaN(h) || h === 0) return null;
    return (w / h).toFixed(2);
  };

  const getWHRStatus = (whr: number, gender: string) => {
    if (gender === "male") {
      if (whr <= 0.9) return { status: "Sağlıklı", color: "text-green-500" };
      if (whr <= 0.99) return { status: "Orta Risk", color: "text-amber-500" };
      return { status: "Yüksek Risk", color: "text-red-500" };
    } else {
      if (whr <= 0.8) return { status: "Sağlıklı", color: "text-green-500" };
      if (whr <= 0.89) return { status: "Orta Risk", color: "text-amber-500" };
      return { status: "Yüksek Risk", color: "text-red-500" };
    }
  };

  const whr = lastMeasurement ? calculateWHR(lastMeasurement.waistCircumference, lastMeasurement.hipCircumference) : null;
  const whrStatus = whr && client ? getWHRStatus(parseFloat(whr), client.gender) : null;

  // Vücut Yağ Oranı Durumu
  const getBodyFatStatus = (bf: number, gender: string) => {
    if (gender === "male") {
      if (bf < 6) return { status: "Çok Düşük", color: "text-amber-500" };
      if (bf >= 6 && bf < 14) return { status: "Atletik", color: "text-green-500" };
      if (bf >= 14 && bf < 18) return { status: "Fit", color: "text-green-500" };
      if (bf >= 18 && bf < 25) return { status: "Normal", color: "text-green-500" };
      return { status: "Yüksek", color: "text-red-500" };
    } else {
      if (bf < 16) return { status: "Çok Düşük", color: "text-amber-500" };
      if (bf >= 16 && bf < 24) return { status: "Atletik", color: "text-green-500" };
      if (bf >= 24 && bf < 30) return { status: "Fit", color: "text-green-500" };
      if (bf >= 30 && bf < 32) return { status: "Normal", color: "text-green-500" };
      return { status: "Yüksek", color: "text-red-500" };
    }
  };

  const bodyFatStatus = lastMeasurement && lastMeasurement.bodyFatPercentage && client
    ? getBodyFatStatus(parseFloat(lastMeasurement.bodyFatPercentage), client.gender)
    : null;

  if (isClientLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (clientError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-destructive text-lg">Hata: {(clientError as Error).message}</p>
        <Button onClick={() => setLocation("/clients")} className="mt-4">
          <ChevronLeft className="mr-2 h-4 w-4" /> Danışanlara Dön
        </Button>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-lg">Danışan bulunamadı</p>
        <Button onClick={() => setLocation("/clients")} className="mt-4">
          <ChevronLeft className="mr-2 h-4 w-4" /> Danışanlara Dön
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setLocation("/clients")}
          className="mr-4"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Danışanlara Dön
        </Button>
        <h1 className="text-2xl font-bold">{client.firstName} {client.lastName}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Kişisel Bilgiler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Ad Soyad</Label>
                <p className="font-medium">{client.firstName} {client.lastName}</p>
              </div>
              <div>
                <Label>Cinsiyet</Label>
                <p className="font-medium">
                  {client.gender === 'female' ? 'Kadın' : 
                  client.gender === 'male' ? 'Erkek' : 'Diğer'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="truncate">
                <Label>E-posta</Label>
                <p className="font-medium truncate">{client.email}</p>
              </div>
              <div className="truncate">
                <Label>Telefon</Label>
                <p className="font-medium">{client.phone || "-"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Yaş</Label>
                <p className="font-medium">{clientAge || "-"}</p>
              </div>
              <div>
                <Label>Meslek</Label>
                <p className="font-medium">{client.occupation || "-"}</p>
              </div>
            </div>
            <div>
              <Label>Kayıt Tarihi</Label>
              <p className="font-medium">{formatDate(client.createdAt)}</p>
            </div>
                <div>
                  <Label>Kullanıcı ID</Label>
                  <p className="font-medium">{client.userId || "-"}</p>
                </div>
              </CardContent>
            </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sağlık Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <Label>Sağlık Durumu</Label>
              <p className="font-medium">{client.medicalConditions || "-"}</p>
            </div>
            <div>
              <Label>Alerjiler</Label>
              <p className="font-medium">{client.allergies || "-"}</p>
            </div>
            <div>
              <Label>Notlar</Label>
              <p className="font-medium">{client.notes || "-"}</p>
            </div>
          </CardContent>
        </Card>

        {lastMeasurement && (
          <Card>
            <CardHeader>
              <CardTitle>Son Ölçüm</CardTitle>
              <CardDescription>{formatDate(lastMeasurement.date)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Kilo</Label>
                  <p className="text-lg font-semibold">{lastMeasurement.weight} kg</p>
                </div>
                <div>
                  <Label>Boy</Label>
                  <p className="text-lg font-semibold">{lastMeasurement.height} cm</p>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <Label>VKİ (BMI)</Label>
                  <span className={getHealthStatus(parseFloat(lastMeasurement.bmi)).color}>
                    {lastMeasurement.bmi} - {getHealthStatus(parseFloat(lastMeasurement.bmi)).status}
                  </span>
                </div>
                <Progress 
                  value={Math.min(parseFloat(lastMeasurement.bmi) * 2, 100)} 
                  className="h-2" 
                  indicatorClassName={`${parseFloat(lastMeasurement.bmi) < 18.5 ? "bg-amber-500" : 
                    parseFloat(lastMeasurement.bmi) >= 18.5 && parseFloat(lastMeasurement.bmi) < 25 ? "bg-green-500" :
                    parseFloat(lastMeasurement.bmi) >= 25 && parseFloat(lastMeasurement.bmi) < 30 ? "bg-amber-500" :
                    "bg-red-500"}`}
                />
              </div>

              {lastMeasurement.bodyFatPercentage && (
                <div>
                  <div className="flex justify-between mb-1">
                    <Label>Vücut Yağ Oranı</Label>
                    <span className={bodyFatStatus?.color}>
                      %{lastMeasurement.bodyFatPercentage} - {bodyFatStatus?.status}
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(parseFloat(lastMeasurement.bodyFatPercentage) * 2, 100)} 
                    className="h-2"
                    indicatorClassName={`${bodyFatStatus?.color.replace('text-', 'bg-').replace('-500', '-500')}`}
                  />
                </div>
              )}

              {whr && (
                <div>
                  <div className="flex justify-between mb-1">
                    <Label>Bel/Kalça Oranı</Label>
                    <span className={whrStatus?.color}>
                      {whr} - {whrStatus?.status}
                    </span>
                  </div>
                </div>
              )}
              
              {lastMeasurement.basalMetabolicRate && (
                <div>
                  <div className="flex justify-between mb-1">
                    <Label>Bazal Metabolizma Hızı (BMH)</Label>
                    <span className="font-medium">
                      {Math.round(lastMeasurement.basalMetabolicRate)} kcal/gün
                    </span>
                  </div>
                </div>
              )}
              
              {lastMeasurement.totalDailyEnergyExpenditure && (
                <div>
                  <div className="flex justify-between mb-1">
                    <Label>Toplam Günlük Enerji (TDEE)</Label>
                    <span className="font-medium">
                      {Math.round(lastMeasurement.totalDailyEnergyExpenditure)} kcal/gün
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <Label>Aktivite Seviyesi</Label>
                  <p className="font-medium">
                    {lastMeasurement.activityLevel === 'sedentary' ? 'Hareketsiz' :
                     lastMeasurement.activityLevel === 'light' ? 'Az Hareketli' :
                     lastMeasurement.activityLevel === 'moderate' ? 'Orta Derecede Aktif' :
                     lastMeasurement.activityLevel === 'active' ? 'Aktif' :
                     lastMeasurement.activityLevel === 'very_active' ? 'Çok Aktif' : '-'}
                  </p>
                </div>
                <div>
                  <Label>Günlük Kalori İhtiyacı</Label>
                  <p className="font-medium">{lastMeasurement.totalDailyEnergyExpenditure ? `${Math.round(lastMeasurement.totalDailyEnergyExpenditure)} kcal` : "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Tabs defaultValue="overview" className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="measurements">Ölçümler</TabsTrigger>
          <TabsTrigger value="analytics">Analiz</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Kilo Değişimi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-2xl font-bold">
                      {weightChange.value > 0 ? "+" : ""}{weightChange.value} kg
                    </p>
                    <p className={`text-sm ${parseFloat(weightChange.percentage) > 0 ? "text-red-500" : parseFloat(weightChange.percentage) < 0 ? "text-green-500" : "text-muted-foreground"}`}>
                      {weightChange.percentage}%
                    </p>
                  </div>
                  <Activity className={`h-8 w-8 ${parseFloat(weightChange.percentage) > 0 ? "text-red-500" : parseFloat(weightChange.percentage) < 0 ? "text-green-500" : "text-muted-foreground"}`} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">VKİ Değişimi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-2xl font-bold">
                      {bmiChange.value > 0 ? "+" : ""}{bmiChange.value}
                    </p>
                    <p className={`text-sm ${parseFloat(bmiChange.percentage) > 0 ? "text-red-500" : parseFloat(bmiChange.percentage) < 0 ? "text-green-500" : "text-muted-foreground"}`}>
                      {bmiChange.percentage}%
                    </p>
                  </div>
                  <Ruler className={`h-8 w-8 ${parseFloat(bmiChange.percentage) > 0 ? "text-red-500" : parseFloat(bmiChange.percentage) < 0 ? "text-green-500" : "text-muted-foreground"}`} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Aktif Veri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-2xl font-bold">
                      {measurements?.length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Toplam ölçüm sayısı</p>
                  </div>
                  <LineChart className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Dialog>
              <DialogTrigger asChild>
                <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">Günlük Kalori İhtiyacı</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div>
                        <div>
                          <p className="text-lg font-semibold">{Math.round(lastMeasurement?.basalMetabolicRate || 0)} kcal</p>
                          <p className="text-sm text-muted-foreground">Bazal Metabolizma Hızı (BMH)</p>
                        </div>
                        <div className="mt-2">
                          <p className="text-2xl font-bold">{Math.round(lastMeasurement?.totalDailyEnergyExpenditure || 0)} kcal</p>
                          <p className="text-sm text-muted-foreground">Toplam Günlük Enerji Tüketimi (TDEE)</p>
                        </div>
                      </div>
                      <Activity className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Kalori ve Besin Değerleri</DialogTitle>
                    <DialogDescription>
                      Son ölçüme göre hesaplanan günlük kalori ve makro besin ihtiyaçları. Bu değerler kişisel özelliklerinize ve aktivite seviyenize göre hesaplanmıştır.
                    </DialogDescription>
                  </DialogHeader>
                {lastMeasurement ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Bazal Metabolizma Hızı (BMH)</Label>
                        <p className="text-xl font-bold">{Math.round(lastMeasurement.basalMetabolicRate)} kcal</p>
                      </div>
                      <div>
                        <Label>Toplam Günlük Enerji Tüketimi (TDEE)</Label>
                        <p className="text-xl font-bold">{Math.round(lastMeasurement.totalDailyEnergyExpenditure)} kcal</p>
                      </div>
                    </div>

                    <Separator />

                    <div>
                        <h3 className="font-semibold mb-2">Önerilen Makro Besin Dağılımı</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Makro besinler, vücudunuzun ihtiyaç duyduğu temel besin gruplarıdır. Dengeli bir diyet için bu oranları takip etmeniz önemlidir.
                        </p>
                        <div className="space-y-4">
                            <div>
                            <div className="flex justify-between mb-1">
                              <Label>Protein (%30)</Label>
                              <span className="font-medium">{Math.round(lastMeasurement.totalDailyEnergyExpenditure * 0.30 / 4)}g</span>
                            </div>
                            <Progress value={30} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-1">
                              Kas yapımı, onarımı ve bağışıklık sistemi için gerekli. Her gram 4 kalori enerji sağlar.
                            </p>
                          </div>

                          <div>
                            <div className="flex justify-between mb-1">
                              <Label>Karbonhidrat (%40)</Label>
                              <span className="font-medium">{Math.round(lastMeasurement.totalDailyEnergyExpenditure * 0.40 / 4)}g</span>
                            </div>
                            <Progress value={40} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-1">
                              Ana enerji kaynağı. Beyin ve merkezi sinir sistemi için temel yakıt. Her gram 4 kalori enerji sağlar.
                            </p>
                          </div>

                          <div>
                            <div className="flex justify-between mb-1">
                              <Label>Yağ (%30)</Label>
                              <span className="font-medium">{Math.round(lastMeasurement.totalDailyEnergyExpenditure * 0.30 / 9)}g</span>
                            </div>
                            <Progress value={30} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-1">
                              Hormon üretimi ve vitamin emilimi için önemli. Her gram 9 kalori enerji sağlar.
                            </p>
                          </div>
                      </div>
                    </div>

                    <Alert>
                      <AlertTitle>Aktivite Seviyesi</AlertTitle>
                      <AlertDescription>
                        {lastMeasurement.activityLevel === "sedentary" && "Hareketsiz: Çok az veya hiç egzersiz yapmayan kişiler"}
                        {lastMeasurement.activityLevel === "light" && "Hafif: Haftada 1-3 kez hafif egzersiz yapan kişiler"}
                        {lastMeasurement.activityLevel === "moderate" && "Orta: Haftada 3-5 kez orta yoğunlukta egzersiz yapan kişiler"}
                        {lastMeasurement.activityLevel === "active" && "Aktif: Haftada 5-7 kez yoğun egzersiz yapan kişiler"}
                        {lastMeasurement.activityLevel === "very_active" && "Çok Aktif: Günde iki kez veya ekstra ağır egzersiz yapan kişiler"}
                      </AlertDescription>
                    </Alert>

                    <div>
                        <h3 className="font-semibold mb-2">Günlük Vitamin ve Mineral İhtiyaçları</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Vitamin ve mineraller, vücudunuzun düzgün çalışması için gerekli olan mikro besinlerdir. Bu değerler sağlıklı bir yaşam için gerekli günlük alım miktarlarıdır.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium mb-2">Vitaminler</h4>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between bg-primary/5 p-3 rounded-md">
                                <div>
                                  <span className="text-sm font-medium">A vitamini</span>
                                  <p className="text-xs text-muted-foreground">Göz sağlığı ve bağışıklık için</p>
                                </div>
                                <span className="text-sm">900 mcg</span>
                              </div>
                              <div className="flex items-center justify-between bg-primary/5 p-3 rounded-md">
                                <div>
                                  <span className="text-sm font-medium">C vitamini</span>
                                  <p className="text-xs text-muted-foreground">Bağışıklık ve cilt sağlığı için</p>
                                </div>
                                <span className="text-sm">90 mg</span>
                              </div>
                              <div className="flex items-center justify-between bg-primary/5 p-3 rounded-md">
                                <div>
                                  <span className="text-sm font-medium">D vitamini</span>
                                  <p className="text-xs text-muted-foreground">Kemik sağlığı ve kalsiyum emilimi için</p>
                                </div>
                                <span className="text-sm">15 mcg</span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium mb-2">Mineraller</h4>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between bg-primary/5 p-3 rounded-md">
                                <div>
                                  <span className="text-sm font-medium">Kalsiyum</span>
                                  <p className="text-xs text-muted-foreground">Kemik ve diş sağlığı için</p>
                                </div>
                                <span className="text-sm">1000 mg</span>
                              </div>
                              <div className="flex items-center justify-between bg-primary/5 p-3 rounded-md">
                                <div>
                                  <span className="text-sm font-medium">Demir</span>
                                  <p className="text-xs text-muted-foreground">Kan hücresi üretimi için</p>
                                </div>
                                <span className="text-sm">18 mg</span>
                              </div>
                              <div className="flex items-center justify-between bg-primary/5 p-3 rounded-md">
                                <div>
                                  <span className="text-sm font-medium">Magnezyum</span>
                                  <p className="text-xs text-muted-foreground">Kas ve sinir fonksiyonu için</p>
                                </div>
                                <span className="text-sm">400 mg</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-4">
                          Bu değerler ortalama bir erişkin için belirlenen günlük önerilen miktarlardır. Kişisel ihtiyaçlarınız yaş, cinsiyet ve sağlık durumunuza göre farklılık gösterebilir.
                        </p>
                      </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    Hesaplanmış kalori değeri bulunmuyor
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>

          {measurements && measurements.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Kilo Değişimi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <ReLineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="weight" stroke="#3b82f6" name="Kilo (kg)" strokeWidth={2} />
                      </ReLineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>VKİ (BMI) Değişimi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[15, 40]} />
                        <Tooltip />
                        <Legend />
                        <Bar 
                          dataKey="bmi" 
                          name="VKİ (BMI)" 
                          barSize={20}
                          fill="#3b82f6"
                          radius={[4, 4, 0, 0]}
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getBMIColor(entry.bmi)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>BMH Değişimi</CardTitle>
                    <CardDescription>
                      Bazal Metabolizma Hızı (BMH) zaman içindeki değişimi
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis 
                            domain={['dataMin - 100', 'dataMax + 100']} 
                            tickFormatter={(value) => `${value} kcal`}
                          />
                          <Tooltip formatter={(value) => [`${value} kcal`, "BMH"]} />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="bmh" 
                            name="Bazal Metabolizma Hızı" 
                            stroke="#10b981"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            activeDot={{ r: 8 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">BMH Değişimi</h4>
                      <div className="flex space-x-4">
                        <div className="bg-gray-100 rounded-lg p-3 flex-1">
                          <p className="text-sm text-muted-foreground mb-1">İlk Ölçüm</p>
                          <p className="text-lg font-bold">
                            {firstMeasurement?.basalMetabolicRate ? Math.round(firstMeasurement.basalMetabolicRate) : "-"} kcal
                          </p>
                        </div>
                        <div className="bg-gray-100 rounded-lg p-3 flex-1">
                          <p className="text-sm text-muted-foreground mb-1">Son Ölçüm</p>
                          <p className="text-lg font-bold">
                            {lastMeasurement?.basalMetabolicRate ? Math.round(lastMeasurement.basalMetabolicRate) : "-"} kcal
                          </p>
                        </div>
                        <div className="bg-gray-100 rounded-lg p-3 flex-1">
                          <p className="text-sm text-muted-foreground mb-1">Değişim</p>
                          <p className={`text-lg font-bold ${Number(bmhChange.value) > 0 ? 'text-green-600' : Number(bmhChange.value) < 0 ? 'text-red-600' : ''}`}>
                            {bmhChange.value !== '0.00' ? `${bmhChange.value > 0 ? '+' : ''}${bmhChange.value} kcal (${bmhChange.percentage}%)` : 'Değişim yok'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>TDEE Değişimi</CardTitle>
                    <CardDescription>
                      Toplam Günlük Enerji Tüketimi (TDEE) zaman içindeki değişimi
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis 
                            domain={['dataMin - 100', 'dataMax + 100']} 
                            tickFormatter={(value) => `${value} kcal`}
                          />
                          <Tooltip formatter={(value) => [`${value} kcal`, "TDEE"]} />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="tdee" 
                            name="Toplam Günlük Enerji Tüketimi" 
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            activeDot={{ r: 8 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">TDEE Değişimi</h4>
                      <div className="flex space-x-4">
                        <div className="bg-gray-100 rounded-lg p-3 flex-1">
                          <p className="text-sm text-muted-foreground mb-1">İlk Ölçüm</p>
                          <p className="text-lg font-bold">
                            {firstMeasurement?.totalDailyEnergyExpenditure ? Math.round(firstMeasurement.totalDailyEnergyExpenditure) : "-"} kcal
                          </p>
                        </div>
                        <div className="bg-gray-100 rounded-lg p-3 flex-1">
                          <p className="text-sm text-muted-foreground mb-1">Son Ölçüm</p>
                          <p className="text-lg font-bold">
                            {lastMeasurement?.totalDailyEnergyExpenditure ? Math.round(lastMeasurement.totalDailyEnergyExpenditure) : "-"} kcal
                          </p>
                        </div>
                        <div className="bg-gray-100 rounded-lg p-3 flex-1">
                          <p className="text-sm text-muted-foreground mb-1">Değişim</p>
                          <p className={`text-lg font-bold ${Number(tdeeChange.value) > 0 ? 'text-green-600' : Number(tdeeChange.value) < 0 ? 'text-red-600' : ''}`}>
                            {tdeeChange.value !== '0.00' ? `${tdeeChange.value > 0 ? '+' : ''}${tdeeChange.value} kcal (${tdeeChange.percentage}%)` : 'Değişim yok'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="measurements">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Ölçüm Kayıtları</h2>
            <Button onClick={() => setOpenNewMeasurementDialog(true)}>
              <Plus className="mr-2 h-4 w-4" /> Yeni Ölçüm
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Kilo (kg)</TableHead>
                  <TableHead>Boy (cm)</TableHead>
                  <TableHead>VKİ</TableHead>
                  <TableHead>Vücut Yağ %</TableHead>
                  <TableHead>Bel (cm)</TableHead>
                  <TableHead>Kalça (cm)</TableHead>
                  <TableHead>BMH (kcal)</TableHead>
                  <TableHead>Günlük İhtiyaç (kcal)</TableHead>
                  <TableHead>İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isMeasurementsLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : measurements && measurements.length > 0 ? (
                  measurements
                    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((measurement: any) => (
                      <TableRow key={measurement.id}>
                        <TableCell>{formatDate(measurement.date)}</TableCell>
                        <TableCell>{measurement.weight}</TableCell>
                        <TableCell>{measurement.height}</TableCell>
                        <TableCell className={getHealthStatus(parseFloat(measurement.bmi)).color}>
                          {measurement.bmi}
                        </TableCell>
                        <TableCell>
                          {measurement.bodyFatPercentage ? `%${measurement.bodyFatPercentage}` : "-"}
                        </TableCell>
                        <TableCell>{measurement.waistCircumference || "-"}</TableCell>
                        <TableCell>{measurement.hipCircumference || "-"}</TableCell>
                        <TableCell>{measurement.basalMetabolicRate ? Math.round(measurement.basalMetabolicRate) : "-"}</TableCell>
                        <TableCell>{measurement.totalDailyEnergyExpenditure ? Math.round(measurement.totalDailyEnergyExpenditure) : "-"}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => handleEditMeasurement(measurement)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => handleDeleteMeasurement(measurement.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center">
                      Henüz ölçüm kaydı bulunmuyor
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          {measurements && measurements.length > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {chartData.some(d => d.bodyFat !== null) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Vücut Yağ Oranı Değişimi</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData.filter(d => d.bodyFat !== null)} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar 
                              dataKey="bodyFat" 
                              name="Vücut Yağ Oranı (%)" 
                              barSize={20}
                              fill="#10b981"
                              radius={[4, 4, 0, 0]}
                            >
                              {chartData
                                .filter(d => d.bodyFat !== null)
                                .map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={getBodyFatColor(entry.bodyFat, client.gender)} 
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {chartData.some(d => d.waist !== null) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Bel Çevresi Değişimi</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <ReLineChart data={chartData.filter(d => d.waist !== null)} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="waist" stroke="#f59e0b" name="Bel (cm)" strokeWidth={2} />
                          </ReLineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Bazal Metabolizma Hızı (BMR)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <ReLineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="bmr" stroke="#8b5cf6" name="BMR (kcal)" strokeWidth={2} />
                        </ReLineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Toplam Günlük Enerji İhtiyacı (TDEE)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <ReLineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="tdee" stroke="#ec4899" name="TDEE (kcal)" strokeWidth={2} />
                        </ReLineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="text-center p-12">
              <p className="text-lg text-muted-foreground">Grafik gösterimi için en az bir ölçüm kaydı gerekiyor</p>
              <Button onClick={() => setOpenNewMeasurementDialog(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" /> Yeni Ölçüm Ekle
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Yeni Ölçüm Modal */}
      <Dialog open={openNewMeasurementDialog} onOpenChange={setOpenNewMeasurementDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Yeni Ölçüm Ekle</DialogTitle>
            <DialogDescription>
              Danışanın yeni ölçüm verilerini girin. Tarih, kilo, boy ve aktivite seviyesi zorunludur.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
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
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kilo (kg)</FormLabel>
                      <FormControl>
                        <Input placeholder="Örn: 70.5" {...field} />
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
                        <Input placeholder="Örn: 175" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="bodyFatPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vücut Yağ Oranı (%)</FormLabel>
                      <FormControl>
                        <Input placeholder="Örn: 20.5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="waistCircumference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bel Çevresi (cm)</FormLabel>
                      <FormControl>
                        <Input placeholder="Örn: 85" {...field} />
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
                        <Input placeholder="Örn: 95" {...field} />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Aktivite seviyesi seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sedentary">Hareketsiz (ofis işi, az/hiç egzersiz yok)</SelectItem>
                        <SelectItem value="light">Hafif Aktivite (haftada 1-3 gün egzersiz)</SelectItem>
                        <SelectItem value="moderate">Orta Aktivite (haftada 3-5 gün orta şiddette egzersiz)</SelectItem>
                        <SelectItem value="active">Aktif (haftada 6-7 gün egzersiz)</SelectItem>
                        <SelectItem value="veryActive">Çok Aktif (günde 2 kez antrenman, fiziksel iş)</SelectItem>
                      </SelectContent>
                    </Select>
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
                      <Textarea placeholder="Ekstra notlar veya yorumlar..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenNewMeasurementDialog(false)}>
                  İptal
                </Button>
                <Button type="submit" disabled={createMeasurementMutation.isPending}>
                  {createMeasurementMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Ölçüm Düzenleme Modal */}
      <Dialog open={openEditMeasurementDialog} onOpenChange={setOpenEditMeasurementDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Ölçüm Düzenle</DialogTitle>
            <DialogDescription>
              Ölçüm verilerini güncelleyin. Tarih, kilo, boy ve aktivite seviyesi zorunludur.
            </DialogDescription>
          </DialogHeader>

          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={editForm.control}
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
                <FormField
                  control={editForm.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kilo (kg)</FormLabel>
                      <FormControl>
                        <Input placeholder="Örn: 70.5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="height"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Boy (cm)</FormLabel>
                      <FormControl>
                        <Input placeholder="Örn: 175" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={editForm.control}
                  name="bodyFatPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vücut Yağ Oranı (%)</FormLabel>
                      <FormControl>
                        <Input placeholder="Örn: 20.5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="waistCircumference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bel Çevresi (cm)</FormLabel>
                      <FormControl>
                        <Input placeholder="Örn: 85" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="hipCircumference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kalça Çevresi (cm)</FormLabel>
                      <FormControl>
                        <Input placeholder="Örn: 95" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="activityLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aktivite Seviyesi</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Aktivite seviyesi seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sedentary">Hareketsiz (ofis işi, az/hiç egzersiz yok)</SelectItem>
                        <SelectItem value="light">Hafif Aktivite (haftada 1-3 gün egzersiz)</SelectItem>
                        <SelectItem value="moderate">Orta Aktivite (haftada 3-5 gün orta şiddette egzersiz)</SelectItem>
                        <SelectItem value="active">Aktif (haftada 6-7 gün egzersiz)</SelectItem>
                        <SelectItem value="veryActive">Çok Aktif (günde 2 kez antrenman, fiziksel iş)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notlar</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Ekstra notlar veya yorumlar..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenEditMeasurementDialog(false)}>
                  İptal
                </Button>
                <Button type="submit" disabled={updateMeasurementMutation.isPending}>
                  {updateMeasurementMutation.isPending ? "Güncelleniyor..." : "Güncelle"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}