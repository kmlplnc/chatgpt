import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
import { AppointmentDialog } from "@/components/appointments/appointment-dialog";
import { MessageList } from "@/components/messages/message-list";
import { Badge } from "@/components/ui/badge";
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
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
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
  ReferenceLine,
} from "recharts";

// Ölçüm şeması
const measurementSchema = z.object({
  date: z.string().nonempty("Tarih gereklidir"),
  weight: z.string().nonempty("Kilo gereklidir"),
  height: z.string().nonempty("Boy gereklidir"),
  waistCircumference: z.string().optional(),
  hipCircumference: z.string().optional(),
  chestCircumference: z.string().optional(),
  armCircumference: z.string().optional(),
  thighCircumference: z.string().optional(),
  calfCircumference: z.string().optional(),
  bodyFatPercentage: z.string().optional(),
  activityLevel: z.string().min(1, "Aktivite seviyesi seçilmelidir"),
  notes: z.string().optional(),
  time: z.string().nonempty("Saat gereklidir"),
});

type MeasurementFormData = z.infer<typeof measurementSchema>;

const formatDate = (date: string | Date) => {
  if (!date) return "-";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "dd MMMM yyyy", { locale: tr });
};

// String tipinden verileri işleyip sayısal değerlere çeviren yardımcı fonksiyonlar
function parseWeight(weight: string): number {
  return parseFloat(weight) || 0;
}

function parseHeight(height: string): number {
  return parseFloat(height) || 0;
}

// BMI hesaplama - string tipinde veriler için
function calculateBmiFromString(weight: string, height: string): string {
  const w = parseFloat(weight);
  const h = parseFloat(height) / 100; // cm to m conversion
  if (isNaN(w) || isNaN(h) || h === 0) return "0.00";
  const bmi = w / (h * h);
  return bmi.toFixed(2);
}

// BMR/BMH hesaplama - string tipinde veriler için
function calculateBmrFromString(weight: string, height: string, age: number, gender: string): number {
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

// TDEE hesaplama
function calculateTdeeFromBmr(bmr: number, activityLevel: string): number {
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

// Randevu form şeması
const appointmentFormSchema = z.object({
  title: z.string().min(1, "Başlık zorunludur"),
  date: z.string().min(1, "Tarih zorunludur"),
  time: z.string().min(1, "Saat zorunludur"),
  status: z.enum(["scheduled", "completed", "canceled"]),
  location: z.string().optional(),
  notes: z.string().optional(),
  duration: z.number().min(15).max(240)
});

type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  if (!id) {
    return <div>Danışan ID'si bulunamadı</div>;
  }

  // API functions
  const getClient = async () => {
    const response = await apiRequest("GET", `/api/clients/${id}`);
    if (!response.ok) {
      throw new Error("Danışan bilgileri yüklenemedi");
    }
    return response.json();
  };

  const getMeasurements = async () => {
    const response = await apiRequest("GET", `/api/clients/${id}/measurements`);
    if (!response.ok) {
      throw new Error("Ölçüm verileri yüklenemedi");
    }
    return response.json();
  };

  const getAppointments = async () => {
    const response = await apiRequest("GET", `/api/appointments?clientId=${id}`);
    if (!response.ok) {
      throw new Error(`Randevular yüklenirken bir hata oluştu: ${response.status}`);
    }
    return response.json();
  };

  const getMessages = async () => {
    const response = await apiRequest("GET", `/api/messages?clientId=${id}`);
    if (!response.ok) {
      throw new Error(`Mesajlar yüklenirken bir hata oluştu: ${response.status}`);
    }
    return response.json();
  };

  const createMeasurement = async (data: any) => {
    const response = await apiRequest("POST", `/api/clients/${id}/measurements`, data);
    if (!response.ok) {
      throw new Error("Ölçüm eklenemedi");
    }
    return response.json();
  };

  const updateMeasurement = async (measurementId: number, data: any) => {
    const response = await apiRequest("PUT", `/api/measurements/${measurementId}`, data);
    if (!response.ok) {
      throw new Error("Ölçüm güncellenemedi");
    }
    return response.json();
  };

  const deleteMeasurement = async (measurementId: number) => {
    const response = await apiRequest("DELETE", `/api/clients/${id}/measurements/${measurementId}`);
    if (!response.ok) {
      throw new Error("Ölçüm silinemedi");
    }
    return response.json();
  };

  const deleteClient = async () => {
    const response = await apiRequest("DELETE", `/api/clients/${id}`);
    if (!response.ok) {
      throw new Error("Danışan silinemedi");
    }
    return true;
  };

  const createAppointment = async (data: any) => {
    const appointmentDate = new Date(data.date);
    const [hours, minutes] = data.time.split(":").map(Number);
    const startTime = new Date(appointmentDate);
    startTime.setHours(hours, minutes, 0, 0);
    const duration = data.duration || 60;
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + duration);
    const appointmentData = {
      ...data,
      clientId: Number(id),
      userId: data.userId || undefined,
      startTime,
      endTime,
      duration: 30,
      time: data.time,
    };
    const response = await apiRequest("POST", "/api/appointments", appointmentData);
    if (!response.ok) {
      throw new Error("Randevu oluşturulamadı");
    }
    return response.json();
  };

  const updateAppointment = async (appointmentId: number, data: any) => {
    const appointmentDate = new Date(data.date);
    const [hours, minutes] = data.time.split(":").map(Number);
    const startTime = new Date(appointmentDate);
    startTime.setHours(hours, minutes, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 1);
    const appointmentData = {
      ...data,
      startTime,
      endTime,
      duration: 30,
      time: data.time,
    };
    const response = await apiRequest("PATCH", `/api/appointments/${appointmentId}`, appointmentData);
    if (!response.ok) {
      throw new Error("Randevu güncellenemedi");
    }
    return response.json();
  };

  const deleteAppointment = async (appointmentId: number) => {
    const response = await apiRequest("DELETE", `/api/appointments/${appointmentId}`);
    if (!response.ok) {
      throw new Error("Randevu silinemedi");
    }
    return response.json();
  };

  const sendMessage = async (content: string) => {
    const messageData = { content, clientId: Number(id), fromClient: false };
    const response = await apiRequest("POST", `/api/messages`, messageData);
    if (!response.ok) {
      throw new Error("Mesaj gönderilemedi");
    }
    return response.json();
  };

  const markMessagesAsRead = async (messageIds: number[]) => {
    if (messageIds && messageIds.length > 0) {
      const response = await apiRequest("PATCH", "/api/messages/mark-read", { messageIds });
      if (!response.ok) {
        throw new Error("Mesajlar okundu olarak işaretlenemedi");
      }
      return response.json();
    }
    const response = await apiRequest("PATCH", `/api/messages/read?clientId=${id}`);
    if (!response.ok) {
      throw new Error("Mesajlar okundu olarak işaretlenemedi");
    }
    return response.json();
  };

  const generateAccessCode = async () => {
    const response = await apiRequest("POST", `/api/clients/${id}/access-code`);
    if (!response.ok) {
      throw new Error("Erişim kodu oluşturulamadı");
    }
    return response.json();
  };

  // Tüm hook'lar component fonksiyonunun en başında, koşulsuz şekilde çağrılmalı
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [viewedTab, setViewedTab] = useState<"measurements" | "health" | "diet" | "notes" | "appointments">('measurements');
  const [clientNotes, setClientNotes] = useState<string>();
  const [clientPublicNotes, setClientPublicNotes] = useState<string>();
  const [openNewMeasurementDialog, setOpenNewMeasurementDialog] = useState(false);
  const [openEditMeasurementDialog, setOpenEditMeasurementDialog] = useState(false);
  const [selectedMeasurement, setSelectedMeasurement] = useState<any>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [openNewAppointmentDialog, setOpenNewAppointmentDialog] = useState(false);
  const [openEditAppointmentDialog, setOpenEditAppointmentDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");
  const [selectedAppointmentDate, setSelectedAppointmentDate] = useState<string>("");

  // useForm hook'ları
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
      time: "",
    },
  });
  const editForm = useForm<MeasurementFormData>({
    resolver: zodResolver(measurementSchema),
    defaultValues: {
      date: "",
      weight: "",
      height: "",
      waistCircumference: "",
      hipCircumference: "",
      bodyFatPercentage: "",
      activityLevel: "moderate",
      notes: "",
    },
  });
  const appointmentForm = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      title: "",
      date: new Date().toISOString().split('T')[0],
      time: "",
      status: "scheduled",
      location: "",
      notes: "",
      duration: 60
    },
  });

  // 1. Yeni bir editAppointmentForm oluştur
  const editAppointmentForm = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      title: "",
      date: "",
      time: "",
      status: "scheduled",
      location: "",
      notes: "",
      duration: 60
    }
  });

  // useQuery hook'ları
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
  const {
    data: appointments,
    isLoading: isAppointmentsLoading,
    error: appointmentsError
  } = useQuery({
    queryKey: [`/api/appointments`, id],
    queryFn: getAppointments,
    retry: 1,
  });
  const {
    data: messages,
    isLoading: isMessagesLoading,
    error: messagesError
  } = useQuery({
    queryKey: [`/api/messages`, id],
    queryFn: getMessages,
    retry: 1,
  });

  // useMutation hook'ları
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
        notes: "",
        time: "",
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

  const deleteClientMutation = useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Danışan başarıyla silindi",
      });
      setLocation('/clients');
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
  
  const createAppointmentMutation = useMutation({
    mutationFn: createAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/appointments`, id] });
      toast({
        title: "Başarılı",
        description: "Yeni randevu oluşturuldu",
      });
      setOpenNewAppointmentDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const updateAppointmentMutation = useMutation({
    mutationFn: async (data: AppointmentFormValues & { id: string }) => {
      const { id, ...appointmentData } = data;
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      });
      
      if (!response.ok) {
        throw new Error('Randevu güncellenirken bir hata oluştu');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Randevu başarıyla güncellendi.",
      });
      setOpenEditAppointmentDialog(false);
      setSelectedAppointment(null);
      // Randevuları yeniden yükle
      queryClient.invalidateQueries({ queryKey: [`/api/appointments`, id] });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: error.message || "Randevu güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });
  
  const deleteAppointmentMutation = useMutation({
    mutationFn: (appointmentId: number) => deleteAppointment(appointmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/appointments`, id] });
      toast({
        title: "Başarılı",
        description: "Randevu silindi",
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
  
  const sendMessageMutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/messages`, id] });
      toast({
        title: "Başarılı",
        description: "Mesaj gönderildi",
      });
      setNewMessage("");
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const markMessagesAsReadMutation = useMutation({
    mutationFn: markMessagesAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/messages`, id] });
    },
    onError: (error: any) => {
      console.error("Mesajlar okundu olarak işaretlenemedi:", error);
    },
  });

  // Form İşlemleri
  const onSubmit = (data: MeasurementFormData) => {
    const bmi = calculateBmiFromString(data.weight, data.height);
    const age = calculateAge(client?.birthDate) || 0;
    const bmr = calculateBmrFromString(data.weight, data.height, age, client?.gender || "female");
    const tdee = calculateTdeeFromBmr(bmr, data.activityLevel);

    const measurementData = {
      date: data.date,
      weight: data.weight,
      height: data.height,
      waistCircumference: data.waistCircumference,
      hipCircumference: data.hipCircumference,
      bodyFatPercentage: data.bodyFatPercentage,
      activityLevel: data.activityLevel,
      notes: data.notes,
      bmi,
      basalMetabolicRate: bmr,
      totalDailyEnergyExpenditure: tdee,
    };

    createMeasurementMutation.mutate(measurementData);
  };

  const onEditSubmit = (data: MeasurementFormData) => {
    const bmi = calculateBmiFromString(data.weight, data.height);
    const age = calculateAge(client?.birthDate) || 0;
    const bmr = calculateBmrFromString(data.weight, data.height, age, client?.gender || "female");
    const tdee = calculateTdeeFromBmr(bmr, data.activityLevel);

    const measurementData = {
      id: selectedMeasurement?.id || 0,
      date: data.date,
      weight: data.weight,
      height: data.height,
      waistCircumference: data.waistCircumference,
      hipCircumference: data.hipCircumference,
      bodyFatPercentage: data.bodyFatPercentage,
      activityLevel: data.activityLevel,
      notes: data.notes,
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
  }).reverse();  // X eksenini ters çevir

  // Ölçümleri tarih sırasına göre sırala (kopyasını alarak orjinal diziyi değiştirmiyoruz)
  const sortedMeasurements = measurements && measurements.length > 0
    ? [...measurements].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
    : [];

  // İlk ölçüm (tarih sırasına göre en eski)
  const firstMeasurement = sortedMeasurements.length > 0 ? sortedMeasurements[0] : null;

  // Son ölçüm (tarih sırasına göre en yeni)
  // Sadece bir ölçüm varsa ilk ve son aynı olacak, karşılaştırma yapılmayacak
  const lastMeasurement = sortedMeasurements.length > 1 ? sortedMeasurements[sortedMeasurements.length - 1] : firstMeasurement;

  // Değişim hesaplama
  const calculateChange = (current: number, initial: number) => {
    if (!initial || current === initial) return { value: 0, percentage: 0 };
    const change = current - initial;
    const percentage = (change / initial) * 100;
    return {
      value: change.toFixed(2),
      percentage: percentage.toFixed(2)
    };
  };

  // Kilo değişimi
  const weightChange = lastMeasurement && firstMeasurement && lastMeasurement !== firstMeasurement
    ? calculateChange(parseFloat(lastMeasurement.weight), parseFloat(firstMeasurement.weight))
    : { value: 0, percentage: 0 };

  // BKI değişimi
  const bmiChange = lastMeasurement && firstMeasurement && lastMeasurement !== firstMeasurement
    ? calculateChange(parseFloat(lastMeasurement.bmi), parseFloat(firstMeasurement.bmi))
    : { value: 0, percentage: 0 };

  // BMH değişimi
  const bmhChange = lastMeasurement && firstMeasurement && lastMeasurement !== firstMeasurement && 
      lastMeasurement.basalMetabolicRate && firstMeasurement.basalMetabolicRate
    ? calculateChange(Math.round(lastMeasurement.basalMetabolicRate), Math.round(firstMeasurement.basalMetabolicRate))
    : { value: 0, percentage: 0 };

  // TDEE değişimi
  const tdeeChange = lastMeasurement && firstMeasurement && lastMeasurement !== firstMeasurement && 
      lastMeasurement.totalDailyEnergyExpenditure && firstMeasurement.totalDailyEnergyExpenditure
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

  const clientAge = calculateAge(client?.birth_date);

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

  // Kilo aralıkları bilgilendirme kutusu
  let kiloAralikBilgi = null;
  const heightCm = client?.height;
  const heightM = heightCm ? parseFloat(heightCm) / 100 : null;
  if (heightM && !isNaN(heightM) && heightM !== 0) {
    const minNormal = (18.5 * heightM * heightM).toFixed(1);
    const maxNormal = (24.9 * heightM * heightM).toFixed(1);
    const maxUnder = (18.5 * heightM * heightM).toFixed(1);
    const maxOver = (29.9 * heightM * heightM).toFixed(1);
    const minObese = (30 * heightM * heightM).toFixed(1);
    kiloAralikBilgi = (
      <div className="mt-2 text-xs bg-indigo-50 border border-indigo-200 rounded px-3 py-2 text-indigo-800 font-medium w-fit">
        <span className="mr-3"><span className="font-bold">Kilo Aralıkları (Boy: {heightCm} cm):</span></span>
        <span className="mr-2">Zayıf: &lt;{maxUnder} kg</span>
        <span className="mr-2">Normal: {minNormal}–{maxNormal} kg</span>
        <span className="mr-2">Fazla Kilolu: {parseFloat(maxNormal)+0.1}-{maxOver} kg</span>
        <span>Obez: ≥{minObese} kg</span>
      </div>
    );
  }

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

  // Saat select'inden önce, JSX'in üstünde:
  const bookedTimes = appointments && selectedAppointmentDate
    ? appointments.filter((a: any) => a.date === selectedAppointmentDate).map((a: any) => a.time)
    : [];

  // --- YENİ RANDEVU DIALOGU ---
  // Saat select'inden önce:
  const bookedTimesNew = appointments && selectedAppointment?.date
    ? appointments.filter((a: any) => a.date === selectedAppointment.date).map((a: any) => a.time)
    : [];

  // 09:00-18:00 arası 30 dakika arayla saatler
  const APPOINTMENT_TIMES: string[] = Array.from({ length: 18 }, (_, i) => {
    const hour = 9 + Math.floor(i / 2);
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  });

  // Randevu düzenleme dialogunu aç
  const handleEditAppointment = (appointment: any) => {
    setSelectedAppointment({
      ...appointment,
      id: appointment.id, // id'yi mutlaka ekle!
      date: appointment.date || (appointment.startTime ? appointment.startTime.split('T')[0] : ""),
      time: appointment.time || (appointment.startTime ? appointment.startTime.split('T')[1]?.substring(0, 5) : ""),
      duration: appointment.duration || 60,
      status: appointment.status || "scheduled",
      title: appointment.title || "",
      location: appointment.location || "",
      notes: appointment.notes || ""
    });
    setOpenEditAppointmentDialog(true);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 pt-20 pb-12">
      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent className="rounded-xl border-none shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Bu danışanı silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem danışanın tüm verilerini ve ölçümlerini kalıcı olarak silecektir. Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">İptal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteClientMutation.mutate()} 
              className="bg-destructive hover:bg-destructive/90 rounded-xl"
            >
              {deleteClientMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <div className="min-h-screen pb-20 flex justify-end">
        <div className="py-8 mt-8 w-full max-w-6xl px-4">
          <div className="flex items-center mb-16 space-x-3">
            <Button 
              variant="outline" 
              size="icon"
              className="rounded-full h-10 w-10 hover:bg-slate-100 hover:scale-110 transition-all duration-300 shadow-sm" 
              onClick={() => setLocation("/clients")}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{client.first_name} {client.last_name}</h1>
              <p className="text-muted-foreground text-sm mt-1.5">
                {client.gender === 'female' ? 'Kadın' : client.gender === 'male' ? 'Erkek' : 'Diğer'}
                {clientAge ? `, ${clientAge} yaş` : ''}
                {client.email ? ` • ${client.email}` : ''}
              </p>
            </div>

            <div className="flex-1 flex justify-end">
              <Button 
                variant="destructive" 
                size="sm"
                className="rounded-xl hover:bg-destructive/90 hover:scale-105 transition-all duration-300 shadow-sm"
                onClick={() => setConfirmDeleteOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Danışanı Sil
              </Button>
            </div>
          </div>

          <Tabs defaultValue="overview" className="mb-10">
            <TabsList className="rounded-lg bg-white shadow-md p-1.5 border-none mb-10 overflow-x-auto flex w-full">
              <TabsTrigger value="overview" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all duration-200">Genel Bakış</TabsTrigger>
              <TabsTrigger value="measurements" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all duration-200">Ölçümler</TabsTrigger>
              <TabsTrigger value="analytics" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all duration-200">Analiz</TabsTrigger>
              <TabsTrigger value="notes" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all duration-200">Diyetisyen Notları</TabsTrigger>
              <TabsTrigger value="clientNotes" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all duration-200">Danışana Görünecek Notlar</TabsTrigger>
              <TabsTrigger value="appointments" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all duration-200">Randevular</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                <Card className="bg-white shadow-md rounded-xl border-none hover:shadow-lg transition-all duration-300 overflow-hidden group transform hover:-translate-y-1">
                  <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-white border-b group-hover:from-blue-50 group-hover:to-white transition-all duration-300">
                    <CardTitle className="text-xl font-medium flex items-center">
                      <div className="bg-blue-100 p-2 rounded-full mr-3 group-hover:bg-blue-200 transition-colors duration-300">
                        <Info className="h-5 w-5 text-blue-600" />
                      </div>
                      Kişisel Bilgiler
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5 pt-5">
                    <div className="grid grid-cols-2 gap-5">
                      <div className="bg-slate-50 p-4 rounded-lg group-hover:bg-blue-50 transition-colors duration-300">
                        <Label className="text-xs text-muted-foreground">Ad Soyad</Label>
                        <p className="font-medium">{client.first_name} {client.last_name}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-lg group-hover:bg-blue-50 transition-colors duration-300">
                        <Label className="text-xs text-muted-foreground">Cinsiyet</Label>
                        <p className="font-medium">
                          {client.gender === 'female' ? 'Kadın' : 
                          client.gender === 'male' ? 'Erkek' : 'Diğer'}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div className="truncate bg-slate-50 p-4 rounded-lg group-hover:bg-blue-50 transition-colors duration-300">
                        <Label className="text-xs text-muted-foreground">E-posta</Label>
                        <p className="font-medium truncate">{client.email}</p>
                      </div>
                      <div className="truncate bg-slate-50 p-4 rounded-lg group-hover:bg-blue-50 transition-colors duration-300">
                        <Label className="text-xs text-muted-foreground">Telefon</Label>
                        <p className="font-medium">{client.phone || "-"}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-2 gap-5">
                      <div className="bg-slate-50 p-4 rounded-lg group-hover:bg-blue-50 transition-colors duration-300">
                        <Label className="text-xs text-muted-foreground">Yaş</Label>
                        <p className="font-medium">{clientAge || "-"}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-lg group-hover:bg-blue-50 transition-colors duration-300">
                        <Label className="text-xs text-muted-foreground">Meslek</Label>
                        <p className="font-medium">{client.occupation || "-"}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-2 gap-5 mt-2">
                      <div className="bg-slate-50 p-4 rounded-lg group-hover:bg-blue-50 transition-colors duration-300">
                        <Label className="text-xs text-muted-foreground">Kayıt Tarihi</Label>
                        <p className="font-medium">{formatDate(client.created_at)}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-lg group-hover:bg-blue-50 transition-colors duration-300">
                        <Label className="text-xs text-muted-foreground">Boy</Label>
                        <p className="font-medium">{client.height ? `${client.height} cm` : '-'}</p>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg group-hover:bg-blue-50 transition-colors duration-300">
                      <Label className="text-xs text-muted-foreground">Danışan Portalı Erişim Kodu</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <p className={`font-medium ${client.access_code ? "" : "text-muted-foreground italic"}`}>
                          {client.access_code || "Oluşturulmadı"}
                        </p>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="rounded-xl hover:bg-blue-100 transition-all"
                            onClick={async () => {
                              try {
                                await generateAccessCode();
                                queryClient.invalidateQueries({ queryKey: [`/api/clients/${id}`] });
                              } catch (error: any) {
                                toast({
                                  title: "Hata",
                                  description: error.message || "Erişim kodu oluşturulamadı",
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            {client.access_code ? "Yenile" : "Oluştur"}
                          </Button>
                          
                          {client.access_code && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-xl hover:bg-blue-100 transition-all"
                              onClick={() => window.open('/client-portal', '_blank')}
                            >
                              <Link className="h-4 w-4 mr-1" />
                              Portalı Aç
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {lastMeasurement && (
                  <Card className="bg-white shadow-md rounded-xl border-none hover:shadow-lg transition-all duration-300 overflow-hidden group transform hover:-translate-y-1">
                    <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-white border-b group-hover:from-green-50 group-hover:to-white transition-all duration-300">
                      <CardTitle className="text-xl font-medium flex items-center">
                        <div className="bg-green-100 p-2 rounded-full mr-3 group-hover:bg-green-200 transition-colors duration-300">
                          <Activity className="h-5 w-5 text-green-600" />
                        </div>
                        Son Ölçüm
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">{formatDate(lastMeasurement.date)}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-5">
                      <div className="grid grid-cols-2 gap-5">
                        <div className="bg-slate-50 p-5 rounded-lg group-hover:bg-green-50 transition-colors duration-300 transform hover:scale-105">
                          <Label className="text-xs text-muted-foreground">Kilo</Label>
                          <p className="text-2xl font-bold mt-1">{lastMeasurement.weight} <span className="text-base font-normal text-muted-foreground">kg</span></p>
                        </div>
                        <div className="bg-slate-50 p-5 rounded-lg group-hover:bg-green-50 transition-colors duration-300 transform hover:scale-105">
                          <Label className="text-xs text-muted-foreground">Boy</Label>
                          <p className="text-2xl font-bold mt-1">{lastMeasurement.height} <span className="text-base font-normal text-muted-foreground">cm</span></p>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-5 rounded-lg group-hover:bg-green-50 transition-colors duration-300">
                        <div className="flex justify-between mb-2">
                          <Label className="text-sm font-medium">VKİ (BMI)</Label>
                          <span className={`font-bold ${getHealthStatus(parseFloat(lastMeasurement.bmi)).color}`}>
                            {lastMeasurement.bmi} - {getHealthStatus(parseFloat(lastMeasurement.bmi)).status}
                          </span>
                        </div>
                        <Progress 
                          value={Math.min(parseFloat(lastMeasurement.bmi) * 2, 100)} 
                          className="h-2.5 mt-1" 
                          indicatorClassName={`${parseFloat(lastMeasurement.bmi) < 18.5 ? "bg-amber-500" : 
                            parseFloat(lastMeasurement.bmi) >= 18.5 && parseFloat(lastMeasurement.bmi) < 25 ? "bg-green-500" :
                            parseFloat(lastMeasurement.bmi) >= 25 && parseFloat(lastMeasurement.bmi) < 30 ? "bg-amber-500" :
                            "bg-red-500"}`}
                        />
                      </div>

                      {lastMeasurement.bodyFatPercentage && (
                        <div className="bg-slate-50 p-5 rounded-lg group-hover:bg-green-50 transition-colors duration-300">
                          <div className="flex justify-between mb-2">
                            <Label className="text-sm font-medium">Vücut Yağ Oranı</Label>
                            <span className={`font-bold ${bodyFatStatus?.color}`}>
                              %{lastMeasurement.bodyFatPercentage} - {bodyFatStatus?.status}
                            </span>
                          </div>
                          <Progress 
                            value={Math.min(parseFloat(lastMeasurement.bodyFatPercentage) * 2, 100)} 
                            className="h-2.5 mt-1"
                            indicatorClassName={`${bodyFatStatus?.color.replace('text-', 'bg-').replace('-500', '-500')}`}
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-5">
                        {lastMeasurement.basalMetabolicRate && (
                          <div className="bg-slate-50 p-5 rounded-lg group-hover:bg-green-50 transition-colors duration-300 transform hover:scale-105">
                            <Label className="text-xs text-muted-foreground">Bazal Metabolizma (BMH)</Label>
                            <p className="text-xl font-bold mt-1">{Math.round(lastMeasurement.basalMetabolicRate)} <span className="text-sm font-normal text-muted-foreground">kcal/gün</span></p>
                          </div>
                        )}

                        {lastMeasurement.totalDailyEnergyExpenditure && (
                          <div className="bg-slate-50 p-5 rounded-lg group-hover:bg-green-50 transition-colors duration-300 transform hover:scale-105">
                            <Label className="text-xs text-muted-foreground">Toplam Enerji (TDEE)</Label>
                            <p className="text-xl font-bold mt-1">{Math.round(lastMeasurement.totalDailyEnergyExpenditure)} <span className="text-sm font-normal text-muted-foreground">kcal/gün</span></p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
              
              {/* İlerleme Kartı */}
              {firstMeasurement && lastMeasurement && firstMeasurement !== lastMeasurement && (
                <Card className="bg-white shadow-md rounded-xl border-none hover:shadow-lg transition-all duration-300 overflow-hidden group transform hover:-translate-y-1 mb-10">
                  <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-white border-b group-hover:from-purple-50 group-hover:to-white transition-all duration-300">
                    <CardTitle className="text-xl font-medium flex items-center">
                      <div className="bg-purple-100 p-2 rounded-full mr-3 group-hover:bg-purple-200 transition-colors duration-300">
                        <LineChart className="h-5 w-5 text-purple-600" />
                      </div>
                      İlerleme Özeti
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      İlk ölçüm: {formatDate(firstMeasurement.date)} • Son ölçüm: {formatDate(lastMeasurement.date)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                      <div className={`bg-slate-50 p-5 rounded-lg group-hover:bg-purple-50 transition-colors duration-300 transform hover:scale-105 ${Number(weightChange.value) < 0 ? 'border-l-4 border-green-500' : Number(weightChange.value) > 0 ? 'border-l-4 border-amber-500' : ''}`}>
                        <Label className="text-xs text-muted-foreground">Kilo Değişimi</Label>
                        <p className={`text-2xl font-bold mt-1 ${Number(weightChange.value) < 0 ? 'text-green-500' : Number(weightChange.value) > 0 ? 'text-amber-500' : ''}`}>
                          {Number(weightChange.value) > 0 ? '+' : ''}{weightChange.value} <span className="text-sm font-normal text-muted-foreground">kg</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {Number(weightChange.percentage) !== 0 ? `%${weightChange.percentage} değişim` : 'Değişim yok'}
                        </p>
                      </div>
                      
                      <div className={`bg-slate-50 p-5 rounded-lg group-hover:bg-purple-50 transition-colors duration-300 transform hover:scale-105 ${Number(bmiChange.value) < 0 ? 'border-l-4 border-green-500' : Number(bmiChange.value) > 0 ? 'border-l-4 border-amber-500' : ''}`}>
                        <Label className="text-xs text-muted-foreground">VKİ Değişimi</Label>
                        <p className={`text-2xl font-bold mt-1 ${Number(bmiChange.value) < 0 ? 'text-green-500' : Number(bmiChange.value) > 0 ? 'text-amber-500' : ''}`}>
                          {Number(bmiChange.value) > 0 ? '+' : ''}{bmiChange.value}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {Number(bmiChange.percentage) !== 0 ? `%${bmiChange.percentage} değişim` : 'Değişim yok'}
                        </p>
                      </div>
                      
                      {lastMeasurement.basalMetabolicRate && firstMeasurement.basalMetabolicRate && (
                        <div className={`bg-slate-50 p-5 rounded-lg group-hover:bg-purple-50 transition-colors duration-300 transform hover:scale-105 ${Number(bmhChange.value) > 0 ? 'border-l-4 border-green-500' : Number(bmhChange.value) < 0 ? 'border-l-4 border-amber-500' : ''}`}>
                          <Label className="text-xs text-muted-foreground">BMH Değişimi</Label>
                          <p className={`text-2xl font-bold mt-1 ${Number(bmhChange.value) > 0 ? 'text-green-500' : Number(bmhChange.value) < 0 ? 'text-amber-500' : ''}`}>
                            {Number(bmhChange.value) > 0 ? '+' : ''}{bmhChange.value} <span className="text-sm font-normal text-muted-foreground">kcal</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {Number(bmhChange.percentage) !== 0 ? `%${bmhChange.percentage} değişim` : 'Değişim yok'}
                          </p>
                        </div>
                      )}
                      
                      {lastMeasurement.totalDailyEnergyExpenditure && firstMeasurement.totalDailyEnergyExpenditure && (
                        <div className={`bg-slate-50 p-5 rounded-lg group-hover:bg-purple-50 transition-colors duration-300 transform hover:scale-105 ${Number(tdeeChange.value) > 0 ? 'border-l-4 border-green-500' : Number(tdeeChange.value) < 0 ? 'border-l-4 border-amber-500' : ''}`}>
                          <Label className="text-xs text-muted-foreground">TDEE Değişimi</Label>
                          <p className={`text-2xl font-bold mt-1 ${Number(tdeeChange.value) > 0 ? 'text-green-500' : Number(tdeeChange.value) < 0 ? 'text-amber-500' : ''}`}>
                            {Number(tdeeChange.value) > 0 ? '+' : ''}{tdeeChange.value} <span className="text-sm font-normal text-muted-foreground">kcal</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {Number(tdeeChange.percentage) !== 0 ? `%${tdeeChange.percentage} değişim` : 'Değişim yok'}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="measurements">
              <Card className="bg-white shadow-md rounded-xl border-none hover:shadow-lg transition-all duration-300 overflow-hidden group transform hover:-translate-y-1">
                <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-white border-b group-hover:from-blue-50 group-hover:to-white transition-all duration-300">
                  <CardTitle className="text-xl font-medium flex items-center">
                    <div className="bg-blue-100 p-2 rounded-full mr-3 group-hover:bg-blue-200 transition-colors duration-300">
                      <Ruler className="h-5 w-5 text-blue-600" />
                    </div>
                    Ölçüm Geçmişi
                  </CardTitle>
                  <div className="flex justify-between items-center">
                    <CardDescription>Tüm ölçüm kayıtları ve vücut kompozisyon verileri</CardDescription>
                    <Button 
                      className="rounded-xl bg-blue-600 hover:bg-blue-700 hover:scale-105 transition-all duration-300"
                      onClick={() => setOpenNewMeasurementDialog(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Yeni Ölçüm
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-5 overflow-auto">
                  {isMeasurementsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : measurements && measurements.length > 0 ? (
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="text-center">Tarih</TableHead>
                          <TableHead className="text-center">Kilo (kg)</TableHead>
                          <TableHead className="text-center">Boy (cm)</TableHead>
                          <TableHead className="text-center">VKİ</TableHead>
                          <TableHead className="text-center">Vücut Yağ (%)</TableHead>
                          <TableHead className="text-center">Bel (cm)</TableHead>
                          <TableHead className="text-center">Kalça (cm)</TableHead>
                          <TableHead className="text-center">Aktivite</TableHead>
                          <TableHead className="text-center">İşlemler</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...sortedMeasurements].reverse().map((measurement: any) => (
                          <TableRow key={measurement.id} className="hover:bg-blue-50/50 transition-colors group/row">
                            <TableCell className="text-center font-medium">{formatDate(measurement.date)}</TableCell>
                            <TableCell className="text-center">{measurement.weight}</TableCell>
                            <TableCell className="text-center">{measurement.height}</TableCell>
                            <TableCell className="text-center">
                              <span className={getHealthStatus(parseFloat(measurement.bmi)).color}>
                                {measurement.bmi}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">{measurement.bodyFatPercentage || "-"}</TableCell>
                            <TableCell className="text-center">{measurement.waistCircumference || "-"}</TableCell>
                            <TableCell className="text-center">{measurement.hipCircumference || "-"}</TableCell>
                            <TableCell className="text-center">
                              {measurement.activityLevel === "sedentary" && "Hareketsiz"}
                              {measurement.activityLevel === "light" && "Hafif Aktif"}
                              {measurement.activityLevel === "moderate" && "Orta Aktif"}
                              {measurement.activityLevel === "active" && "Aktif"}
                              {measurement.activityLevel === "veryActive" && "Çok Aktif"}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center space-x-2 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-8 w-8 rounded-full hover:bg-blue-100"
                                  onClick={() => handleEditMeasurement(measurement)}
                                >
                                  <Pencil className="h-4 w-4 text-blue-600" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-8 w-8 rounded-full hover:bg-red-100"
                                  onClick={() => handleDeleteMeasurement(measurement.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Henüz ölçüm kaydı bulunmuyor.</p>
                      <Button 
                        variant="outline"
                        className="mt-4 rounded-xl hover:bg-blue-100 transition-all"
                        onClick={() => setOpenNewMeasurementDialog(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        İlk Ölçümü Ekle
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Yeni Ölçüm Ekleme Dialog */}
              <Dialog open={openNewMeasurementDialog} onOpenChange={setOpenNewMeasurementDialog}>
                <DialogContent className="sm:max-w-[600px] rounded-xl border-none shadow-xl">
                  <DialogHeader>
                    <DialogTitle>Yeni Ölçüm Ekle</DialogTitle>
                    <DialogDescription>
                      Danışanın yeni ölçüm ve vücut kompozisyon verilerini girin.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tarih</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} onChange={e => {
                                  field.onChange(e);
                                  setSelectedAppointmentDate(e.target.value);
                                  setSelectedAppointment({ ...selectedAppointment, date: e.target.value });
                                }} />
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
                                  <SelectItem value="sedentary">Hareketsiz (ofis işi)</SelectItem>
                                  <SelectItem value="light">Hafif Aktif (haftada 1-3 gün egzersiz)</SelectItem>
                                  <SelectItem value="moderate">Orta Aktif (haftada 3-5 gün egzersiz)</SelectItem>
                                  <SelectItem value="active">Aktif (haftada 6-7 gün egzersiz)</SelectItem>
                                  <SelectItem value="veryActive">Çok Aktif (günde çift antrenman)</SelectItem>
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
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setOpenNewMeasurementDialog(false)} 
                          className="rounded-xl"
                        >
                          İptal
                        </Button>
                        <Button 
                          type="submit" 
                          className="rounded-xl"
                          disabled={createMeasurementMutation.isPending}
                        >
                          {createMeasurementMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Kaydet
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              
              {/* Ölçüm Düzenleme Dialog */}
              <Dialog open={openEditMeasurementDialog} onOpenChange={setOpenEditMeasurementDialog}>
                <DialogContent className="sm:max-w-[600px] rounded-xl border-none shadow-xl">
                  <DialogHeader>
                    <DialogTitle>Ölçüm Düzenle</DialogTitle>
                    <DialogDescription>
                      Seçili ölçüm verilerini düzenleyin.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...editForm}>
                    <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                      {/* Tarih alanı */}
                      <div className="grid grid-cols-2 gap-4">
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
                                  <SelectItem value="sedentary">Hareketsiz (ofis işi)</SelectItem>
                                  <SelectItem value="light">Hafif Aktif (haftada 1-3 gün egzersiz)</SelectItem>
                                  <SelectItem value="moderate">Orta Aktif (haftada 3-5 gün egzersiz)</SelectItem>
                                  <SelectItem value="active">Aktif (haftada 6-7 gün egzersiz)</SelectItem>
                                  <SelectItem value="veryActive">Çok Aktif (günde çift antrenman)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={editForm.control}
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
                          control={editForm.control}
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
                          control={editForm.control}
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
                          control={editForm.control}
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
                        control={editForm.control}
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
                        control={editForm.control}
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
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setOpenEditMeasurementDialog(false)} 
                          className="rounded-xl"
                        >
                          İptal
                        </Button>
                        <Button 
                          type="submit" 
                          className="rounded-xl"
                          disabled={updateMeasurementMutation.isPending}
                        >
                          {updateMeasurementMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Güncelle
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </TabsContent>

            <TabsContent value="notes">
              <Card className="bg-white shadow-md rounded-xl border-none hover:shadow-lg transition-all duration-300 overflow-hidden group transform hover:-translate-y-1">
                <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-white border-b group-hover:from-amber-50 group-hover:to-white transition-all duration-300">
                  <CardTitle className="text-xl font-medium flex items-center">
                    <div className="bg-amber-100 p-2 rounded-full mr-3 group-hover:bg-amber-200 transition-colors duration-300">
                      <Edit className="h-5 w-5 text-amber-600" />
                    </div>
                    Diyetisyen Notları
                  </CardTitle>
                  <CardDescription>Bu notlar sadece sizin görebileceğiniz özel notlardır. Danışana gösterilmez.</CardDescription>
                </CardHeader>
                <CardContent className="pt-5">
                  <div className="space-y-4">
                    <Textarea 
                      placeholder="Danışan hakkında özel notlarınızı buraya yazın..."
                      className="min-h-[250px] border-slate-200 rounded-lg focus:border-amber-300 focus:ring-amber-200"
                      value={clientNotes === undefined ? client.notes || "" : clientNotes}
                      onChange={(e) => {
                        setClientNotes(e.target.value);
                      }}
                    />
                    <Button 
                      className="rounded-xl hover:scale-105 transition-all duration-300 bg-amber-600 hover:bg-amber-700"
                      onClick={async () => {
                        try {
                          await apiRequest("PATCH", `/api/clients/${id}`, { notes: clientNotes });
                          queryClient.invalidateQueries({ queryKey: [`/api/clients/${id}`] });
                          toast({
                            title: "Özel Notlar kaydedildi",
                            description: "Diyetisyen notları başarıyla güncellendi.",
                          });
                        } catch (error: any) {
                          toast({
                            title: "Hata",
                            description: "Notlar kaydedilirken bir hata oluştu.",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      Notları Kaydet
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="clientNotes">
              <Card className="bg-white shadow-md rounded-xl border-none hover:shadow-lg transition-all duration-300 overflow-hidden group transform hover:-translate-y-1">
                <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-white border-b group-hover:from-green-50 group-hover:to-white transition-all duration-300">
                  <CardTitle className="text-xl font-medium flex items-center">
                    <div className="bg-green-100 p-2 rounded-full mr-3 group-hover:bg-green-200 transition-colors duration-300">
                      <MessageSquare className="h-5 w-5 text-green-600" />
                    </div>
                    Danışana Görünecek Notlar
                  </CardTitle>
                  <CardDescription>Bu notlar danışan portalında görünecektir. Danışanlarınız için talimatlarınızı buraya yazabilirsiniz.</CardDescription>
                </CardHeader>
                <CardContent className="pt-5">
                  <div className="space-y-4">
                    <Textarea 
                      placeholder="Danışanınızın görmesini istediğiniz notları buraya yazın..."
                      className="min-h-[250px] border-slate-200 rounded-lg focus:border-green-300 focus:ring-green-200"
                      value={clientPublicNotes === undefined ? client.clientVisibleNotes || "" : clientPublicNotes}
                      onChange={(e) => {
                        setClientPublicNotes(e.target.value);
                      }}
                    />
                    <Button 
                      className="rounded-xl hover:scale-105 transition-all duration-300 bg-green-600 hover:bg-green-700"
                      onClick={async () => {
                        try {
                          await apiRequest("PATCH", `/api/clients/${id}`, { clientVisibleNotes: clientPublicNotes });
                          queryClient.invalidateQueries({ queryKey: [`/api/clients/${id}`] });
                          toast({
                            title: "Danışan Notları Kaydedildi",
                            description: "Danışan portalında görünecek notlar başarıyla güncellendi.",
                          });
                        } catch (error) {
                          toast({
                            title: "Hata",
                            description: "Notlar kaydedilirken bir hata oluştu.",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      Notları Kaydet
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="appointments">
              <Card className="bg-white shadow-md rounded-xl border-none hover:shadow-lg transition-all duration-300 overflow-hidden group transform hover:-translate-y-1">
                <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-white border-b group-hover:from-emerald-50 group-hover:to-white transition-all duration-300">
                  <CardTitle className="text-xl font-medium flex items-center">
                    <div className="bg-emerald-100 p-2 rounded-full mr-3 group-hover:bg-emerald-200 transition-colors duration-300">
                      <Calendar className="h-5 w-5 text-emerald-600" />
                    </div>
                    Randevular
                  </CardTitle>
                  <div className="flex justify-between items-center">
                    <CardDescription>Danışan ile planlanan görüşme ve kontrol randevuları</CardDescription>
                    <Button 
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-700 hover:scale-105 transition-all duration-300"
                      onClick={() => {
                        form.reset({
                          date: "",
                          notes: ""
                        });
                        setOpenNewAppointmentDialog(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Yeni Randevu
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-5">
                  {isAppointmentsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : appointments && appointments.length > 0 ? (
                    <div className="space-y-4">
                      {appointments
                        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
                        .map((appointment: any) => {
                          console.log("appointment", appointment);
                          const appointmentDate = new Date(appointment.date);
                          const isToday = new Date().toDateString() === appointmentDate.toDateString();
                          const isPast = appointmentDate < new Date() && !isToday;
                          const isFuture = appointmentDate > new Date();
                          
                          return (
                            <div 
                              key={appointment.id} 
                              className={`border rounded-lg p-4 group/app hover:border-emerald-300 transition-all hover:shadow-sm 
                                ${isToday ? 'bg-emerald-50/50 border-emerald-200' : 
                                  isPast ? 'bg-slate-50/50 border-slate-200' : 
                                  'bg-white border-slate-200'}`}
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <h3 className="font-medium">
                                      {appointment.title || "Randevu"}
                                    </h3>
                                    {isToday && (
                                      <Badge className="bg-emerald-500 hover:bg-emerald-600">Bugün</Badge>
                                    )}
                                    {isPast && (
                                      <Badge variant="outline" className="bg-slate-100">Geçmiş</Badge>
                                    )}
                                    {appointment.status === "completed" && (
                                      <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Tamamlandı</Badge>
                                    )}
                                    {appointment.status === "canceled" && (
                                      <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">İptal Edildi</Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {format(appointmentDate, "EEEE, d MMMM yyyy", { locale: tr })} - {appointment.time}
                                  </p>
                                  {appointment.location && (
                                    <p className="text-sm mt-2">
                                      <span className="text-muted-foreground">Yer: </span> 
                                      {appointment.location}
                                    </p>
                                  )}
                                </div>
                                
                                <div className="flex space-x-1 opacity-0 group-hover/app:opacity-100 transition-opacity">
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    className="h-8 w-8 rounded-full hover:bg-emerald-100"
                                    onClick={() => handleEditAppointment(appointment)}
                                  >
                                    <Pencil className="h-4 w-4 text-emerald-600" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    className="h-8 w-8 rounded-full hover:bg-red-100"
                                    onClick={() => {
                                      if (window.confirm("Bu randevuyu silmek istediğinizden emin misiniz?")) {
                                        deleteAppointmentMutation.mutate(appointment.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              </div>
                              
                              {appointment.notes && (
                                <div className="mt-3 pt-3 border-t text-sm">
                                  <p>{appointment.notes}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="bg-slate-50 rounded-lg p-8 max-w-lg mx-auto">
                        <Calendar className="w-12 h-12 mx-auto text-emerald-300 mb-4" />
                        <p className="mb-2">Henüz randevu kaydı bulunmuyor.</p>
                        <p className="text-sm mb-4">Danışan için kontrol randevuları, görüşmeler ve takip planı oluşturabilirsiniz.</p>
                        <Button 
                          variant="outline"
                          className="rounded-xl hover:bg-emerald-100 transition-all"
                          onClick={() => {
                            form.reset({
                              date: "",
                              notes: ""
                            });
                            setOpenNewAppointmentDialog(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Yeni Randevu
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Yeni Randevu Ekleme Dialog */}
              <Dialog open={openNewAppointmentDialog} onOpenChange={setOpenNewAppointmentDialog}>
                <DialogContent className="sm:max-w-[600px] rounded-xl border-none shadow-xl">
                  <DialogHeader>
                    <DialogTitle>Yeni Randevu Oluştur</DialogTitle>
                    <DialogDescription>
                      Danışan için yeni bir randevu veya görüşme ekleyin.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...appointmentForm}>
                    <form onSubmit={appointmentForm.handleSubmit((data) => {
                      createAppointmentMutation.mutate(data);
                    })} className="space-y-4">
                      <FormField
                        control={appointmentForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Başlık</FormLabel>
                            <FormControl>
                              <Input placeholder="Kontrol Randevusu" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={appointmentForm.control}
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
                          control={appointmentForm.control}
                          name="time"
                          render={({ field }) => {
                            // Seçili tarihteki dolu saatleri bul
                            const selectedDate = appointmentForm.watch('date');
                            const bookedTimes = appointments
                              ? appointments.filter((a: any) => a.date === selectedDate).map((a: any) => a.time)
                              : [];
                            return (
                              <FormItem>
                                <FormLabel>Saat</FormLabel>
                                <FormControl>
                                  <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Saat seçin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {APPOINTMENT_TIMES.map((time: string) => (
                                        <SelectItem key={time} value={time} disabled={bookedTimes.includes(time)}>
                                          {time}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            );
                          }}
                        />
                      </div>

                      <FormField
                        control={appointmentForm.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Durum</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Durum seçin" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="scheduled">Planlanan</SelectItem>
                                <SelectItem value="completed">Tamamlandı</SelectItem>
                                <SelectItem value="canceled">İptal Edildi</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={appointmentForm.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Yer</FormLabel>
                            <FormControl>
                              <Input placeholder="Klinik, Online görüşme, vb." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={appointmentForm.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notlar</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Randevu ile ilgili notlar..."
                                className="min-h-[100px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <DialogFooter>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setOpenNewAppointmentDialog(false);
                            appointmentForm.reset();
                          }} 
                          className="rounded-xl"
                        >
                          İptal
                        </Button>
                        <Button 
                          type="submit" 
                          className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
                          disabled={createAppointmentMutation.isPending}
                        >
                          {createAppointmentMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Kaydet
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </TabsContent>

            <TabsContent value="analytics">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                {/* Grafikler Kartı */}
                <Card className="bg-white shadow-md rounded-xl border-none hover:shadow-lg transition-all duration-300 overflow-hidden group transform hover:-translate-y-1">
                  <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-white border-b group-hover:from-indigo-50 group-hover:to-white transition-all duration-300">
                    <CardTitle className="text-xl font-medium flex items-center">
                      <div className="bg-indigo-100 p-2 rounded-full mr-3 group-hover:bg-indigo-200 transition-colors duration-300">
                        <LineChart className="h-5 w-5 text-indigo-600" />
                      </div>
                      Kilo Takibi
                    </CardTitle>
                    <CardDescription>Danışanın zaman içindeki kilo değişimi</CardDescription>
                    {kiloAralikBilgi}
                  </CardHeader>
                  <CardContent className="pt-5 h-[400px]">
                    {chartData && chartData.length > 1 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <ReLineChart
                          data={chartData}
                          margin={{ top: 10, right: 15, left: 5, bottom: 10 }}
                        >
                          <defs>
                            <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            tickLine={{ stroke: '#94a3b8' }}
                            axisLine={{ stroke: '#94a3b8' }}
                            padding={{ left: 10, right: 10 }}
                            height={40}
                          />
                          <YAxis 
                            yAxisId="left" 
                            orientation="left"
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            tickLine={{ stroke: '#94a3b8' }}
                            axisLine={{ stroke: '#94a3b8' }}
                            tickFormatter={(value) => `${value} kg`}
                            width={45}
                          />
                          <Tooltip
                            contentStyle={{ 
                              backgroundColor: 'white',
                              borderRadius: '12px',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                              border: '1px solid #e2e8f0',
                              padding: '12px'
                            }}
                            labelStyle={{ 
                              color: '#1e293b',
                              fontWeight: '600',
                              marginBottom: '8px',
                              fontSize: '12px'
                            }}
                            itemStyle={{ 
                              color: '#6366f1',
                              padding: '4px 0',
                              fontSize: '12px'
                            }}
                          />
                          <Legend 
                            verticalAlign="top" 
                            height={36}
                            wrapperStyle={{
                              paddingBottom: '10px',
                              fontSize: '12px'
                            }}
                          />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="weight"
                            name="Kilo (kg)"
                            stroke="#6366f1"
                            strokeWidth={2.5}
                            dot={{ 
                              r: 4,
                              strokeWidth: 2,
                              fill: '#fff',
                              stroke: '#6366f1'
                            }}
                            activeDot={{ 
                              r: 6,
                              strokeWidth: 2,
                              fill: '#4f46e5',
                              stroke: '#fff'
                            }}
                          />
                        </ReLineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground text-center">
                          Grafik için en az iki ölçüm gereklidir.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* VKİ Grafik Kartı */}
                <Card className="bg-white shadow-md rounded-xl border-none hover:shadow-lg transition-all duration-300 overflow-hidden group transform hover:-translate-y-1">
                  <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-white border-b group-hover:from-violet-50 group-hover:to-white transition-all duration-300">
                    <CardTitle className="text-xl font-medium flex items-center">
                      <div className="bg-violet-100 p-2 rounded-full mr-3 group-hover:bg-violet-200 transition-colors duration-300">
                        <Activity className="h-5 w-5 text-violet-600" />
                      </div>
                      VKİ Takibi
                    </CardTitle>
                    <CardDescription>Danışanın vücut kitle indeksi değişimi</CardDescription>
                    <div className="mt-4 text-xs bg-indigo-50 border border-indigo-200 rounded px-3 py-2 text-indigo-800 font-medium w-fit">
                      <span className="mr-3"><span className="font-bold">VKİ Aralıkları:</span></span>
                      <span className="mr-2">Zayıf: &lt;18.5</span>
                      <span className="mr-2">Normal: 18.5-24.9</span>
                      <span className="mr-2">Fazla Kilolu: 25-29.9</span>
                      <span>Obez: ≥30</span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-5 h-[400px]">
                    {chartData && chartData.length > 1 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <ReLineChart
                          data={chartData}
                          margin={{ top: 10, right: 15, left: 5, bottom: 10 }}
                        >
                          <defs>
                            <linearGradient id="bmiGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            tickLine={{ stroke: '#94a3b8' }}
                            axisLine={{ stroke: '#94a3b8' }}
                            padding={{ left: 10, right: 10 }}
                            height={40}
                          />
                          <YAxis 
                            yAxisId="left" 
                            orientation="left" 
                            domain={[
                              (minBy: number | undefined) => Math.max(0, (minBy || 0) * 0.9), 
                              (maxBy: number | undefined) => (maxBy || 0) * 1.1
                            ]}
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            tickLine={{ stroke: '#94a3b8' }}
                            axisLine={{ stroke: '#94a3b8' }}
                            width={45}
                          />
                          <Tooltip
                            contentStyle={{ 
                              backgroundColor: 'white',
                              borderRadius: '12px',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                              border: '1px solid #e2e8f0',
                              padding: '12px'
                            }}
                            labelStyle={{ 
                              color: '#1e293b',
                              fontWeight: '600',
                              marginBottom: '8px',
                              fontSize: '12px'
                            }}
                            itemStyle={{ 
                              color: '#8b5cf6',
                              padding: '4px 0',
                              fontSize: '12px'
                            }}
                            formatter={(value, name) => {
                              if (name === 'VKİ') {
                                const status = getHealthStatus(parseFloat(value as string)).status;
                                return [`${value} (${status})`, name];
                              }
                              return [value, name];
                            }}
                          />
                          <Legend 
                            verticalAlign="top" 
                            height={36}
                            wrapperStyle={{
                              paddingBottom: '10px',
                              fontSize: '12px'
                            }}
                          />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="bmi"
                            name="VKİ"
                            stroke="#8b5cf6"
                            strokeWidth={2.5}
                            dot={{ 
                              r: 4,
                              strokeWidth: 2,
                              fill: '#fff',
                              stroke: '#8b5cf6'
                            }}
                            activeDot={{ 
                              r: 6,
                              strokeWidth: 2,
                              fill: '#7c3aed',
                              stroke: '#fff'
                            }}
                          />
                          <ReferenceLine 
                            y={18.5} 
                            yAxisId="left" 
                            stroke="#f59e0b" 
                            strokeDasharray="3 3" 
                          />
                          <ReferenceLine 
                            y={25} 
                            yAxisId="left" 
                            stroke="#10b981" 
                            strokeDasharray="3 3" 
                          />
                          <ReferenceLine 
                            y={30} 
                            yAxisId="left" 
                            stroke="#ef4444" 
                            strokeDasharray="3 3" 
                          />
                        </ReLineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground text-center">
                          Grafik için en az iki ölçüm gereklidir.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                {/* Sağlık Bilgileri Kartı */}
                <Card className="bg-white shadow-md rounded-xl border-none hover:shadow-lg transition-all duration-300 overflow-hidden group transform hover:-translate-y-1 md:col-span-2">
                  <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-white border-b group-hover:from-red-50 group-hover:to-white transition-all duration-300">
                    <CardTitle className="text-xl font-medium flex items-center">
                      <div className="bg-red-100 p-2 rounded-full mr-3 group-hover:bg-red-200 transition-colors duration-300">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      </div>
                      Sağlık Bilgileri
                    </CardTitle>
                    <CardDescription>Danışanın sağlık durumu, hastalıkları ve alerjileri</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                      <div className="flex flex-col space-y-5">
                        <div className="bg-slate-50 p-4 rounded-lg group-hover:bg-red-50/50 transition-colors duration-300">
                          <h3 className="font-medium text-sm mb-2 text-slate-500">Kronik Hastalıklar</h3>
                          <div className="space-y-2">
                            {client.medicalConditions ? (
                              client.medicalConditions.split(',').map((condition: string, index: number) => (
                                <Badge key={index} variant="outline" className="bg-white mr-2 py-1.5">
                                  {condition.trim()}
                                </Badge>
                              ))
                            ) : (
                              <div className="text-sm text-muted-foreground italic">Bilgi girilmemiş</div>
                            )}
                            
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 mt-2 text-xs px-2 rounded-md hover:bg-red-100"
                              onClick={async () => {
                                const conditions = prompt("Kronik hastalıkları virgülle ayırarak girin:", client.medicalConditions || "");
                                if (conditions !== null) {
                                  try {
                                    await apiRequest("PATCH", `/api/clients/${id}`, { medicalConditions: conditions });
                                    queryClient.invalidateQueries({ queryKey: [`/api/clients/${id}`] });
                                    toast({
                                      title: "Sağlık bilgileri güncellendi",
                                      description: "Kronik hastalık bilgileri kaydedildi.",
                                    });
                                  } catch (error: any) {
                                    toast({
                                      title: "Hata",
                                      description: error.message || "Bilgiler kaydedilemedi",
                                      variant: "destructive",
                                    });
                                  }
                                }
                              }}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Düzenle
                            </Button>
                          </div>
                        </div>
                        
                        <div className="bg-slate-50 p-4 rounded-lg group-hover:bg-red-50/50 transition-colors duration-300">
                          <h3 className="font-medium text-sm mb-2 text-slate-500">Alerjiler</h3>
                          <div className="space-y-2">
                            {client.allergies ? (
                              client.allergies.split(',').map((allergy: string, index: number) => (
                                <Badge key={index} variant="outline" className="bg-white mr-2 py-1.5">
                                  {allergy.trim()}
                                </Badge>
                              ))
                            ) : (
                              <div className="text-sm text-muted-foreground italic">Bilgi girilmemiş</div>
                            )}
                            
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 mt-2 text-xs px-2 rounded-md hover:bg-red-100"
                              onClick={async () => {
                                const allergies = prompt("Alerjileri virgülle ayırarak girin:", client.allergies || "");
                                if (allergies !== null) {
                                  try {
                                    await apiRequest("PATCH", `/api/clients/${id}`, { allergies: allergies });
                                    queryClient.invalidateQueries({ queryKey: [`/api/clients/${id}`] });
                                    toast({
                                      title: "Sağlık bilgileri güncellendi",
                                      description: "Alerji bilgileri kaydedildi.",
                                    });
                                  } catch (error: any) {
                                    toast({
                                      title: "Hata",
                                      description: error.message || "Bilgiler kaydedilemedi",
                                      variant: "destructive",
                                    });
                                  }
                                }
                              }}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Düzenle
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col space-y-5">
                        <div className="bg-slate-50 p-4 rounded-lg group-hover:bg-red-50/50 transition-colors duration-300">
                          <h3 className="font-medium text-sm mb-2 text-slate-500">İlaçlar</h3>
                          <div className="space-y-2">
                            {client.medications ? (
                              client.medications.split(',').map((medication: string, index: number) => (
                                <Badge key={index} variant="outline" className="bg-white mr-2 py-1.5">
                                  {medication.trim()}
                                </Badge>
                              ))
                            ) : (
                              <div className="text-sm text-muted-foreground italic">Bilgi girilmemiş</div>
                            )}
                            
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 mt-2 text-xs px-2 rounded-md hover:bg-red-100"
                              onClick={async () => {
                                const medications = prompt("Kullandığı ilaçları virgülle ayırarak girin:", client.medications || "");
                                if (medications !== null) {
                                  try {
                                    await apiRequest("PATCH", `/api/clients/${id}`, { medications: medications });
                                    queryClient.invalidateQueries({ queryKey: [`/api/clients/${id}`] });
                                    toast({
                                      title: "Sağlık bilgileri güncellendi",
                                      description: "İlaç bilgileri kaydedildi.",
                                    });
                                  } catch (error: any) {
                                    toast({
                                      title: "Hata",
                                      description: error.message || "Bilgiler kaydedilemedi",
                                      variant: "destructive",
                                    });
                                  }
                                }
                              }}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Düzenle
                            </Button>
                          </div>
                        </div>
                        
                        <div className="bg-slate-50 p-4 rounded-lg group-hover:bg-red-50/50 transition-colors duration-300">
                          <h3 className="font-medium text-sm mb-2 text-slate-500">Diğer Notlar</h3>
                          <div className="text-sm">
                            {client.healthNotes ? (
                              <p>{client.healthNotes}</p>
                            ) : (
                              <p className="text-muted-foreground italic">Bilgi girilmemiş</p>
                            )}
                            
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 mt-2 text-xs px-2 rounded-md hover:bg-red-100"
                              onClick={async () => {
                                const notes = prompt("Sağlık ile ilgili ek notlar:", client.healthNotes || "");
                                if (notes !== null) {
                                  try {
                                    await apiRequest("PATCH", `/api/clients/${id}`, { healthNotes: notes });
                                    queryClient.invalidateQueries({ queryKey: [`/api/clients/${id}`] });
                                    toast({
                                      title: "Sağlık bilgileri güncellendi",
                                      description: "Sağlık notları kaydedildi.",
                                    });
                                  } catch (error: any) {
                                    toast({
                                      title: "Hata",
                                      description: error.message || "Bilgiler kaydedilemedi",
                                      variant: "destructive",
                                    });
                                  }
                                }
                              }}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Düzenle
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {lastMeasurement && (
                      <div className="bg-red-50/30 p-4 rounded-lg border border-red-100 mt-5">
                        <h3 className="font-medium mb-2 flex items-center">
                          <Info className="h-4 w-4 mr-2 text-red-500" />
                          Sağlık Uyarıları
                        </h3>
                        <ul className="space-y-2 text-sm">
                          {parseFloat(lastMeasurement.bmi) >= 30 && (
                            <li className="flex items-start">
                              <AlertTriangle className="h-4 w-4 mr-2 text-red-500 mt-0.5 flex-shrink-0" />
                              <span>
                                <strong>Obezite:</strong> Vücut kitle indeksi {lastMeasurement.bmi} ile obezite sınıfında.
                                Kilo yönetimi için özel bir beslenme planı gerekebilir.
                              </span>
                            </li>
                          )}
                          {parseFloat(lastMeasurement.bmi) <= 18.5 && (
                            <li className="flex items-start">
                              <AlertTriangle className="h-4 w-4 mr-2 text-amber-500 mt-0.5 flex-shrink-0" />
                              <span>
                                <strong>Düşük Kilo:</strong> Vücut kitle indeksi {lastMeasurement.bmi} ile normalin altında.
                                Sağlıklı kilo alımı için beslenme desteği değerlendirilmeli.
                              </span>
                            </li>
                          )}
                          {whr && whrStatus && whrStatus.status !== "Sağlıklı" && (
                            <li className="flex items-start">
                              <AlertTriangle className="h-4 w-4 mr-2 text-amber-500 mt-0.5 flex-shrink-0" />
                              <span>
                                <strong>Bel-Kalça Oranı:</strong> {whr} değeri ile {whrStatus.status} durumunda.
                                Kardiyo egzersizleri ve karın bölgesi yağlanmasına yönelik diyet önerilir.
                              </span>
                            </li>
                          )}
                          {!lastMeasurement.bodyFatPercentage && (
                            <li className="flex items-start">
                              <Info className="h-4 w-4 mr-2 text-blue-500 mt-0.5 flex-shrink-0" />
                              <span>
                                Vücut yağ oranı ölçülmemiş. Daha detaylı bir sağlık analizi için vücut kompozisyon 
                                ölçümü yapılması önerilir.
                              </span>
                            </li>
                          )}
                          {!client.medicalConditions && !client.allergies && (
                            <li className="flex items-start">
                              <Info className="h-4 w-4 mr-2 text-blue-500 mt-0.5 flex-shrink-0" />
                              <span>
                                Danışanın sağlık bilgileri (kronik hastalıklar, alerjiler) girilmemiş.
                                Beslenme planı oluşturulurken bu bilgilerin eklenmesi önerilir.
                              </span>
                            </li>
                          )}
                          {!lastMeasurement.waistCircumference && (
                            <li className="flex items-start">
                              <Info className="h-4 w-4 mr-2 text-blue-500 mt-0.5 flex-shrink-0" />
                              <span>
                                Bel çevresi ölçülmemiş. Abdominal obezite riskini değerlendirmek için 
                                bu ölçümün yapılması önerilir.
                              </span>
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Risk Değerlendirme Kartı */}
                <Card className="bg-white shadow-md rounded-xl border-none hover:shadow-lg transition-all duration-300 overflow-hidden group transform hover:-translate-y-1 md:col-span-1">
                  <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-white border-b group-hover:from-amber-50 group-hover:to-white transition-all duration-300">
                    <CardTitle className="text-xl font-medium flex items-center">
                      <div className="bg-amber-100 p-2 rounded-full mr-3 group-hover:bg-amber-200 transition-colors duration-300">
                        <Activity className="h-5 w-5 text-amber-600" />
                      </div>
                      Risk Değerlendirme
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-5">
                    {lastMeasurement ? (
                      <div className="space-y-6">
                        <div>
                          <div className="flex justify-between mb-2">
                            <Label className="text-sm font-medium">Vücut Kitle İndeksi (VKİ)</Label>
                            <span className={`font-bold ${getHealthStatus(parseFloat(lastMeasurement.bmi)).color}`}>
                              {lastMeasurement.bmi} - {getHealthStatus(parseFloat(lastMeasurement.bmi)).status}
                            </span>
                          </div>
                          <Progress 
                            value={Math.min(parseFloat(lastMeasurement.bmi) * 2, 100)} 
                            className="h-2.5" 
                            indicatorClassName={`${parseFloat(lastMeasurement.bmi) < 18.5 ? "bg-amber-500" : 
                              parseFloat(lastMeasurement.bmi) >= 18.5 && parseFloat(lastMeasurement.bmi) < 25 ? "bg-green-500" :
                              parseFloat(lastMeasurement.bmi) >= 25 && parseFloat(lastMeasurement.bmi) < 30 ? "bg-amber-500" :
                              "bg-red-500"}`}
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>Zayıf</span>
                            <span>Normal</span>
                            <span>Kilolu</span>
                            <span>Obez</span>
                          </div>
                        </div>

                        {whr && (
                          <div>
                            <div className="flex justify-between mb-2">
                              <Label className="text-sm font-medium">Bel-Kalça Oranı</Label>
                              <span className={`font-bold ${whrStatus?.color}`}>
                                {whr} - {whrStatus?.status}
                              </span>
                            </div>
                            <Progress 
                              value={Math.min(parseFloat(whr) * (client.gender === 'male' ? 80 : 90), 100)} 
                              className="h-2.5" 
                              indicatorClassName={whrStatus?.color.replace('text-', 'bg-')}
                            />
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                              <span>Düşük</span>
                              <span>Sağlıklı</span>
                              <span>Risk</span>
                              <span>Yüksek Risk</span>
                            </div>
                          </div>
                        )}

                        {lastMeasurement.bodyFatPercentage && (
                          <div>
                            <div className="flex justify-between mb-2">
                              <Label className="text-sm font-medium">Vücut Yağ Oranı</Label>
                              <span className={`font-bold ${bodyFatStatus?.color}`}>
                                %{lastMeasurement.bodyFatPercentage} - {bodyFatStatus?.status}
                              </span>
                            </div>
                            <Progress 
                              value={Math.min(parseFloat(lastMeasurement.bodyFatPercentage) * 2, 100)} 
                              className="h-2.5" 
                              indicatorClassName={bodyFatStatus?.color.replace('text-', 'bg-')}
                            />
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                              <span>Düşük</span>
                              <span>Atletik</span>
                              <span>Normal</span>
                              <span>Yüksek</span>
                            </div>
                          </div>
                        )}

                        <Alert className="bg-amber-50 border-amber-200">
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                          <AlertTitle className="text-amber-800 text-sm font-medium">Sağlık Riski Değerlendirmesi</AlertTitle>
                          <AlertDescription className="text-amber-800 text-xs">
                            {parseFloat(lastMeasurement.bmi) >= 30 && "Obezite riski yüksek. "}
                            {parseFloat(lastMeasurement.bmi) >= 25 && parseFloat(lastMeasurement.bmi) < 30 && "Fazla kilo, metabolik hastalık riski taşıyor. "}
                            {whr && parseFloat(whr) > (client.gender === "male" ? 0.9 : 0.8) && "Bel-kalça oranı yüksek, kardiyo egzersizleri önerilir. "}
                            {client.medicalConditions && "Kronik hastalıklar için özel beslenme planı gerekli."}
                            {!client.medicalConditions && !whr && parseFloat(lastMeasurement.bmi) < 25 && "Şu anda belirgin sağlık riski görünmüyor."}
                          </AlertDescription>
                        </Alert>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <p>Risk değerlendirmesi için ölçüm kaydı bulunmuyor.</p>
                      </div>
                    )}
                                        </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      
    </div>
  );
}