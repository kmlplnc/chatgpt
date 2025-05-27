import React, { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";
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
  Loader2,
  Calculator
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

import { useSession } from "@/hooks/use-session";
import { Appointment } from "@/types/client";
import { ErrorBoundary } from '@/components/error-boundary';
import ReactSelect from 'react-select';

// Client interface definition
interface Client {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  gender: 'male' | 'female' | 'other';
  birth_date?: string;
  height?: string;
  occupation?: string;
  medical_conditions?: string;
  allergies?: string;
  medications?: string;
  diet_preferences?: string;
  healthNotes?: string;
  clientVisibleNotes?: string;
  client_visible_notes?: string[];
  access_code?: string;
  created_at: string;
}

interface Measurement {
  id: number;
  date: string;
  weight: string;
  height: string;
  waistCircumference?: string;
  hipCircumference?: string;
  bodyFatPercentage?: string;
  activityLevel: string;
  notes?: string;
  bmi: string;
  basalMetabolicRate: number;
  totalDailyEnergyExpenditure: number;
  // Micro-nutrients
  vitaminA?: string;
  vitaminC?: string;
  vitaminD?: string;
  vitaminE?: string;
  vitaminK?: string;
  thiamin?: string;
  riboflavin?: string;
  niacin?: string;
  vitaminB6?: string;
  folate?: string;
  vitaminB12?: string;
  biotin?: string;
  pantothenicAcid?: string;
  calcium?: string;
  iron?: string;
  magnesium?: string;
  phosphorus?: string;
  zinc?: string;
  potassium?: string;
  sodium?: string;
  copper?: string;
  manganese?: string;
  selenium?: string;
  chromium?: string;
  molybdenum?: string;
  iodine?: string;
}

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
  time: z.string().optional(),
  // Mikrobesinler
  vitaminA: z.string().optional(),
  vitaminC: z.string().optional(),
  vitaminD: z.string().optional(),
  vitaminE: z.string().optional(),
  vitaminK: z.string().optional(),
  thiamin: z.string().optional(),
  riboflavin: z.string().optional(),
  niacin: z.string().optional(),
  vitaminB6: z.string().optional(),
  folate: z.string().optional(),
  vitaminB12: z.string().optional(),
  calcium: z.string().optional(),
  iron: z.string().optional(),
  magnesium: z.string().optional(),
  phosphorus: z.string().optional(),
  zinc: z.string().optional(),
  potassium: z.string().optional(),
  sodium: z.string().optional(),
  copper: z.string().optional(),
  manganese: z.string().optional(),
  selenium: z.string().optional(),
  chromium: z.string().optional(),
  molybdenum: z.string().optional(),
  iodine: z.string().optional(),
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
  date: z.string().min(1, "Tarih zorunludur").refine((date) => {
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate >= today;
  }, "Geçmiş bir tarih seçilemez"),
  time: z.string().min(1, "Saat zorunludur"),
  status: z.enum(["scheduled", "completed", "canceled"]),
  location: z.string().optional(),
  notes: z.string().optional(),
  duration: z.number().min(15).max(240),
  type: z.string().min(1, "Randevu tipi zorunludur")
});

type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 9; hour < 18; hour++) {
    slots.push(`${hour.toString().padStart(2, "0")}:00`);
    slots.push(`${hour.toString().padStart(2, "0")}:30`);
  }
  slots.push("18:00");
  return slots;
};

// API Functions
const getClient = async (id: string): Promise<Client> => {
  const response = await apiRequest(`/api/clients/${id}`);
  if (!response.ok) throw new Error("Danışan bilgileri yüklenemedi");
  return response.data as Client;
};

const getMeasurements = async (id: string): Promise<Measurement[]> => {
  const response = await apiRequest(`/api/clients/${id}/measurements`);
  if (!response.ok) {
    throw new Error("Ölçümler alınamadı");
  }
  return response.data;
};

const createMeasurement = async (id: string, data: any) => {
  const response = await apiRequest(`/api/clients/${id}/measurements`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Ölçüm kaydedilemedi");
  return response.data;
};

const updateMeasurement = async (id: string, measurementId: number, data: any) => {
  const response = await apiRequest(`/api/clients/${id}/measurements/${measurementId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Ölçüm güncellenemedi");
  return response.data;
};

const deleteClient = async (id: string) => {
  const response = await apiRequest(`/api/clients/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Danışan silinemedi");
  return true;
};

const deleteMeasurement = async (id: string, measurementId: number) => {
  const response = await apiRequest(`/api/clients/${id}/measurements/${measurementId}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Ölçüm silinemedi");
  return response.data;
};

const getAppointments = async (id: string): Promise<Appointment[]> => {
  const response = await apiRequest(`/api/appointments?clientId=${id}`);
  if (!response.ok) throw new Error(`Randevular yüklenirken bir hata oluştu: ${response.error}`);
  return response.data as Appointment[];
};

const createAppointment = async (id: string, data: any) => {
  const appointmentDate = new Date(data.date);
  const [hours, minutes] = data.time.split(":").map(Number);
  const startTime = new Date(appointmentDate);
  startTime.setHours(hours, minutes, 0, 0);
  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + 30); // Süreyi 30 dk yap
  const appointmentData = {
    ...data,
    clientId: Number(id),
    userId: data.userId ? Number(data.userId) : undefined,
    startTime,
    endTime,
    duration: Number(data.duration) || 30, // number olarak gönder
    time: data.time,
    type: data.type,
  };
  const response = await apiRequest(`/api/appointments`, {
    method: "POST",
    body: JSON.stringify(appointmentData),
  });
  console.log("API RESPONSE:", response.data);
  if (!response.ok) throw new Error("Randevu oluşturulamadı");
  return response.data;
};

const updateAppointment = async (appointmentId: number, data: any) => {
  const appointmentDate = new Date(data.date);
  const [hours, minutes] = data.time.split(":").map(Number);
  const startTime = new Date(appointmentDate);
  startTime.setHours(hours, minutes, 0, 0);
  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + 30); // Süreyi 30 dk yap
  const appointmentData = {
    ...data,
    startTime,
    endTime,
    duration: 30, // Her zaman 30
    time: data.time,
    type: data.type,
  };
  const response = await apiRequest(`/api/appointments/${appointmentId}`, {
    method: "PATCH",
    body: JSON.stringify(appointmentData),
  });
  if (!response.ok) throw new Error("Randevu güncellenemedi");
  return response.data;
};

const deleteAppointment = async (appointmentId: number) => {
  const response = await apiRequest(`/api/appointments/${appointmentId}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Randevu silinemedi");
  return response.data;
};

const getMessages = async (id: string) => {
  const response = await apiRequest(`/api/messages?clientId=${id}`);
  if (!response.ok) throw new Error(`Mesajlar yüklenirken bir hata oluştu: ${response.error}`);
  return response.data;
};

const sendMessage = async (id: string, content: string) => {
  const messageData = { content, clientId: Number(id), fromClient: false };
  const response = await apiRequest(`/api/messages`, {
    method: "POST",
    body: JSON.stringify(messageData),
  });
  if (!response.ok) throw new Error("Mesaj gönderilemedi");
  return response.data;
};

const markMessagesAsRead = async (id: string, messageIds: number[]) => {
  if (messageIds && messageIds.length > 0) {
    const response = await apiRequest(`/api/messages/mark-read`, {
      method: "PATCH",
      body: JSON.stringify({ messageIds }),
    });
    if (!response.ok) throw new Error("Mesajlar okundu olarak işaretlenemedi");
    return response.data;
  }
  const response = await apiRequest(`/api/messages/read?clientId=${id}`, { method: "PATCH" });
  if (!response.ok) throw new Error("Mesajlar okundu olarak işaretlenemedi");
  return response.data;
};

const generateAccessCode = async (id: string) => {
  const response = await apiRequest(`/api/clients/${id}/access-code`, { method: "POST" });
  if (!response.ok) throw new Error("Erişim kodu oluşturulamadı");
  return response.data;
};

export default function ClientDetailWrapper() {
  const { id } = useParams();
  const [_, navigate] = useLocation();

  if (!id) {
    return <div>Geçersiz müşteri ID'si</div>;
  }

  return <ClientDetail id={id} navigate={navigate} />;
}

function ClientDetail({ id, navigate }: { id: string; navigate: any }) {
  console.log('ClientDetail render');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { session } = useSession();
  const clientId = parseInt(id as string);

  // All useState hooks
  const [viewedTab, setViewedTab] = useState<"measurements" | "health" | "diet" | "notes" | "appointments">('measurements');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [isAccessCodeDialogOpen, setIsAccessCodeDialogOpen] = useState(false);
  const [editingMeasurement, setEditingMeasurement] = useState<Measurement | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | undefined>(undefined);
  const [deletingAppointment, setDeletingAppointment] = useState<Appointment | undefined>(undefined);
  const [selectedMeasurement, setSelectedMeasurement] = useState<Measurement | null>(null);
  const [messageContent, setMessageContent] = useState("");
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [newNote, setNewNote] = useState("");
  const [clientPublicNotes, setClientPublicNotes] = useState("");
  const [selectedAppointmentDate, setSelectedAppointmentDate] = useState<string>("");
  const [selectedAppointment, setSelectedAppointment] = useState<{ date: string } | null>(null);
  const [openEditMeasurementDialog, setOpenEditMeasurementDialog] = useState(false);
  const [showMicroNutrientsDialog, setShowMicroNutrientsDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [medicalState, setMedicalState] = useState<any[]>([]);
  const [allergyState, setAllergyState] = useState<any[]>([]);
  const [medicationState, setMedicationState] = useState<any[]>([]);
  const [dietPreferencesState, setDietPreferencesState] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [hasDietChanges, setHasDietChanges] = useState(false);

  // All useForm hooks
  const form = useForm<MeasurementFormData>({
    resolver: zodResolver(measurementSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      weight: "",
      height: "",
      waistCircumference: "",
      hipCircumference: "",
      bodyFatPercentage: "",
      activityLevel: "sedentary",
      notes: "",
      // Mikrobesinler
      vitaminA: "",
      vitaminC: "",
      vitaminD: "",
      vitaminE: "",
      vitaminK: "",
      thiamin: "",
      riboflavin: "",
      niacin: "",
      vitaminB6: "",
      folate: "",
      vitaminB12: "",
      calcium: "",
      iron: "",
      magnesium: "",
      phosphorus: "",
      zinc: "",
      potassium: "",
      sodium: "",
      copper: "",
      manganese: "",
      selenium: "",
      chromium: "",
      molybdenum: "",
      iodine: "",
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
      date: new Date().toISOString().split('T')[0],
      time: "",
      duration: 30,
      notes: "",
      type: "kontrol",
      status: "scheduled"
    },
  });

  // All useQuery hooks
  const { data: client, isLoading: isLoadingClient } = useQuery({
    queryKey: [`/api/clients/${id}`],
    queryFn: () => getClient(id as string),
    retry: 1,
    enabled: !!id,
  });

  const { data: measurements, isLoading: isLoadingMeasurements, error: measurementsError } = useQuery({
    queryKey: [`/api/clients/${id}/measurements`],
    queryFn: () => getMeasurements(id as string),
    retry: 1,
    enabled: !!id,
  });

  const { data: appointments, isLoading: isLoadingAppointments } = useQuery({
    queryKey: [`/api/appointments`, id],
    queryFn: () => getAppointments(id as string),
    retry: 1,
    enabled: !!id,
  });

  // All useMutation hooks
  const createMeasurementMutation = useMutation({
    mutationFn: (data: any) => createMeasurement(id as string, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${id}/measurements`] });
      setIsMeasurementDialogOpen(false);
      toast({
        title: "Başarılı",
        description: "Ölçüm başarıyla eklendi.",
      });
    },
  });

  const updateMeasurementMutation = useMutation({
    mutationFn: (data: MeasurementFormData) => {
      if (!selectedMeasurement) return Promise.reject("Ölçüm seçilmedi");
      return updateMeasurement(id, selectedMeasurement.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${id}/measurements`] });
      setShowEditDialog(false);
      toast({
        title: "Başarılı",
        description: "Ölçüm başarıyla güncellendi",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Ölçüm güncellenemedi",
        variant: "destructive",
      });
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: () => deleteClient(id as string),
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Müşteri başarıyla silindi.",
      });
      navigate("/clients");
    },
  });

  const deleteMeasurementMutation = useMutation({
    mutationFn: () => {
      if (!selectedMeasurement) return Promise.reject("Ölçüm seçilmedi");
      return deleteMeasurement(id, selectedMeasurement.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${id}/measurements`] });
      setShowDeleteDialog(false);
      toast({
        title: "Başarılı",
        description: "Ölçüm başarıyla silindi",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Ölçüm silinemedi",
        variant: "destructive",
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => sendMessage(id as string, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/messages`, id] });
      toast({
        title: "Başarılı",
        description: "Mesaj başarıyla gönderildi.",
      });
      setMessageContent("");
    },
  });

  const markMessagesAsReadMutation = useMutation({
    mutationFn: (messageIds: number[]) => markMessagesAsRead(id as string, messageIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/messages`, id] });
    },
  });

  const appointmentMutation = useMutation({
    mutationFn: (data: any) => {
      if (data.action === 'delete') {
        return deleteAppointment(data.appointmentId);
      }
      if (data.action === 'update') {
        return updateAppointment(data.appointmentId, data);
      }
      return createAppointment(id as string, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/appointments`, id] });
      setIsAppointmentDialogOpen(false);
      setEditingAppointment(undefined);
      toast({
        title: "Başarılı",
        description: "Randevu işlemi başarıyla tamamlandı.",
      });
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: (note: any) => {
      return apiRequest(`/api/clients/${id}/notes`, {
        method: "POST",
        body: JSON.stringify(note),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${id}`] });
      setNewNote("");
      toast({
        title: "Başarılı",
        description: "Not başarıyla eklendi.",
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

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: number) => {
      const response = await apiRequest(`/api/clients/${id}/notes/${noteId}`, { method: "DELETE" });
      if (!response.ok) throw new Error(response.error || "Not silinemedi");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", id] });
      toast({
        title: "Başarılı",
        description: "Not silindi",
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

  // All useEffect hooks
  useEffect(() => {
    if (editingAppointment) {
      appointmentForm.reset({
        date: editingAppointment.date,
        time: editingAppointment.time,
        duration: editingAppointment.duration,
        notes: editingAppointment.notes,
        type: editingAppointment.type,
        status: editingAppointment.status
      });
    }
  }, [editingAppointment, appointmentForm]);

  useEffect(() => {
    if (editingMeasurement) {
      editForm.reset({
        date: editingMeasurement.date,
        weight: editingMeasurement.weight,
        height: editingMeasurement.height,
        waistCircumference: editingMeasurement.waistCircumference || "",
        hipCircumference: editingMeasurement.hipCircumference || "",
        bodyFatPercentage: editingMeasurement.bodyFatPercentage || "",
        activityLevel: editingMeasurement.activityLevel || "light",
        notes: editingMeasurement.notes || "",
      });
    }
  }, [editingMeasurement, editForm]);

  useEffect(() => {
    if (client && Array.isArray(client.client_visible_notes) && typeof client.client_visible_notes[0] === 'string') {
      const migratedNotes = client.client_visible_notes.map((n: any) => ({ content: n, created_at: new Date().toISOString() }));
      apiRequest(`/api/clients/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ client_visible_notes: migratedNotes })
      }).then(() => {
        queryClient.invalidateQueries({ queryKey: [`/api/clients/${id}`] });
      });
    }
  }, [client, id, queryClient]);

  // Seçili ölçüm değiştiğinde form değerlerini güncelle
  useEffect(() => {
    if (selectedMeasurement) {
      form.reset({
        date: selectedMeasurement.date,
        weight: selectedMeasurement.weight,
        height: selectedMeasurement.height,
        waistCircumference: selectedMeasurement.waistCircumference || "",
        hipCircumference: selectedMeasurement.hipCircumference || "",
        bodyFatPercentage: selectedMeasurement.bodyFatPercentage || "",
        activityLevel: selectedMeasurement.activityLevel,
        notes: selectedMeasurement.notes || "",
      });
    }
  }, [selectedMeasurement, form]);

  useEffect(() => {
    setMedicalState(parseMultiValue(client?.medical_conditions));
    setAllergyState(parseMultiValue(client?.allergies));
    setMedicationState(parseMultiValue(client?.medications));
    setDietPreferencesState(parseMultiValue(client?.diet_preferences));
    setHasChanges(false);
    setHasDietChanges(false);
  }, [client]);

  // All useCallback hooks
  const handleEditMeasurement = useCallback((measurement: Measurement) => {
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
  }, [editForm]);

  const handleDeleteMeasurement = async () => {
    if (!selectedMeasurement) return;
    
    try {
      await deleteMeasurement(id, selectedMeasurement.id);
      toast({
        title: "Başarılı",
        description: "Ölçüm başarıyla silindi",
      });
      setShowDeleteDialog(false);
      setSelectedMeasurement(null);
      // Refresh measurements list
      const updatedMeasurements = await getMeasurements(id);
      setMeasurements(updatedMeasurements);
    } catch (error) {
      console.error("Error deleting measurement:", error);
      toast({
        title: "Hata",
        description: "Ölçüm silinirken bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  const handleEditAppointment = useCallback((appointment: any) => {
    setEditingAppointment({
      ...appointment,
      id: appointment.id,
      date: appointment.date || (appointment.startTime ? appointment.startTime.split('T')[0] : ""),
      time: appointment.time || (appointment.startTime ? appointment.startTime.split('T')[1]?.substring(0, 5) : ""),
      duration: appointment.duration || 60,
      status: appointment.status || "scheduled",
      title: appointment.title || "",
      location: appointment.location || "",
      notes: appointment.notes || ""
    });
    setIsAppointmentDialogOpen(true);
  }, []);

  const handleDeleteAppointment = useCallback(async () => {
    if (!deletingAppointment) return;
    try {
      await appointmentMutation.mutateAsync({
        action: 'delete',
        appointmentId: deletingAppointment.id
      });
      setDeletingAppointment(undefined);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Randevu silinemedi",
        variant: "destructive",
      });
    }
  }, [deletingAppointment, appointmentMutation]);

  const handleAddNote = useCallback(async () => {
    if (!newNote.trim()) return;
    const now = new Date();
    const noteObj = { content: newNote, created_at: now.toISOString() };
    let newNotes = [];
    if (Array.isArray(client?.client_visible_notes)) {
      if (typeof client.client_visible_notes[0] === 'string') {
        newNotes = [...client.client_visible_notes.map((n: any) => ({ content: n })), noteObj];
      } else {
        newNotes = [...client.client_visible_notes, noteObj];
      }
    } else {
      newNotes = [noteObj];
    }
    try {
      await apiRequest(`/api/clients/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ client_visible_notes: newNotes })
      });
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${id}`] });
      setNewNote("");
      toast({
        title: "Not eklendi",
        description: "Not başarıyla eklendi.",
      });
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Not eklenemedi",
        variant: "destructive",
      });
    }
  }, [newNote, client, id, queryClient, toast]);

  const onEditSubmit = (data: MeasurementFormData) => {
    const measurementData = {
      ...data,
      bmi: calculateBmiFromString(data.weight, data.height),
      basalMetabolicRate: calculateBmrFromString(
        data.weight,
        data.height,
        clientAge || 0,
        client?.gender || "male"
      ),
      totalDailyEnergyExpenditure: calculateTdeeFromBmr(
        calculateBmrFromString(
          data.weight,
          data.height,
          clientAge || 0,
          client?.gender || "male"
        ),
        data.activityLevel
      ),
    };

    updateMeasurementMutation.mutate(measurementData);
  };

  // Grafik Verileri
  const chartData = Array.isArray(measurements) ? measurements.map((measurement: any) => ({
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
  }).reverse() : [];

  const sortedMeasurements = Array.isArray(measurements) && measurements.length > 0
    ? [...measurements].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
    : [];

  const firstMeasurement = sortedMeasurements.length > 0 ? sortedMeasurements[0] : null;
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
      if (bf >= 30 && bf < 35) return { status: "Normal", color: "text-green-500" };
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

  // Early returns after all hooks
  if (isLoadingClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-lg">Danışan bulunamadı</p>
        <Button onClick={() => navigate("/clients")} className="mt-4">
          <ChevronLeft className="mr-2 h-4 w-4" /> Danışanlara Dön
        </Button>
      </div>
    );
  }

  // Saat select'inden önce, JSX'in üstünde:
  const bookedTimes = appointments && selectedAppointmentDate
    ? appointments.filter((a: any) => {
        const dateStr = a.date || (a.startTime ? a.startTime.split('T')[0] : "");
        return dateStr === selectedAppointmentDate;
      }).map((a: any) => {
        if (a.time) return a.time;
        if (a.startTime) {
          const d = new Date(a.startTime);
          const hour = d.getHours().toString().padStart(2, '0');
          const min = d.getMinutes().toString().padStart(2, '0');
          return `${hour}:${min}`;
        }
        return "";
      })
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

  console.log("bookedTimes:", bookedTimes);
  console.log("APPOINTMENT_TIMES:", APPOINTMENT_TIMES);

  // --- EN YAKIN RANDEVU PANELİ ---
  const now = new Date();
  const upcomingAppointments = Array.isArray(appointments)
    ? appointments.filter((a: any) => a.startTime && new Date(a.startTime) > now && a.clientId === client?.id)
      .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    : [];
  const nextAppointment = upcomingAppointments?.[0];

  // Randevuya kalan gün sayısı ve renk hesaplama
  let appointmentColor = {
    panel: "bg-gradient-to-r from-green-200 via-green-100 to-green-50 border-l-8 border-green-500",
    icon: "text-green-600",
    title: "text-green-800",
    subtitle: "text-green-900",
    date: "text-green-700",
    location: "text-green-600"
  };

  // Notes güvenli erişim
  const safeNotes = Array.isArray(client?.client_visible_notes) ? client.client_visible_notes : [];
  console.log('safeNotes:', safeNotes);

  console.log('ClientDetail return');

  const disabledTimes = appointments
    ? appointments
        .filter(a => {
          const apptDate = a.date?.split('T')[0];
          const selectedDate = appointmentForm.getValues('date');
          return apptDate === selectedDate;
        })
        .map(a => a.time)
        .filter((v): v is string => !!v)
    : [];
  console.log("disabledTimes:", disabledTimes);

  // Add type definition for appointment actions
  type AppointmentAction = 'create' | 'update' | 'delete';

  // Add type definition for appointment mutation variables
  interface AppointmentMutationVariables {
    action: AppointmentAction;
    appointmentId?: number;
    duration?: number;
    [key: string]: any;
  }

  const onSubmit = (data: MeasurementFormData) => {
    if (!client) return;
    const bmi = calculateBmiFromString(data.weight, data.height);
    const age = calculateAge(client.birth_date) || 0;
    const bmr = calculateBmrFromString(data.weight, data.height, age, client.gender || "female");
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
      // Mikrobesinler
      vitaminA: data.vitaminA,
      vitaminC: data.vitaminC,
      vitaminD: data.vitaminD,
      vitaminE: data.vitaminE,
      vitaminK: data.vitaminK,
      thiamin: data.thiamin,
      riboflavin: data.riboflavin,
      niacin: data.niacin,
      vitaminB6: data.vitaminB6,
      folate: data.folate,
      vitaminB12: data.vitaminB12,
      calcium: data.calcium,
      iron: data.iron,
      magnesium: data.magnesium,
      phosphorus: data.phosphorus,
      zinc: data.zinc,
      potassium: data.potassium,
      sodium: data.sodium,
      copper: data.copper,
      manganese: data.manganese,
      selenium: data.selenium,
      chromium: data.chromium,
      molybdenum: data.molybdenum,
      iodine: data.iodine,
    };

    createMeasurementMutation.mutate(measurementData);
  };

  const handleAddOrEditAppointment = async (data: any) => {
    console.log("APPOINTMENT SUBMIT DATA:", data);
    try {
      const appointmentData = {
        ...data,
        time: data.time, // Saati doğrudan kullan
        date: data.date,
        duration: 30,
        status: data.status || 'scheduled'
      };

      if (editingAppointment) {
        await appointmentMutation.mutateAsync({
          action: 'update',
          appointmentId: editingAppointment.id,
          ...appointmentData
        });
      } else {
        await appointmentMutation.mutateAsync({
          action: 'create',
          ...appointmentData
        });
      }
      setIsAppointmentDialogOpen(false);
      setEditingAppointment(undefined);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Randevu işlemi başarısız oldu",
        variant: "destructive",
      });
    }
  };

  const appointmentTypeLabels: Record<string, string> = {
    gorusme: "Görüşme",
    kontrol: "Kontrol",
    online: "Online",
    telefon: "Telefon",
    takip: "Takip"
  };

  const activityLevelDescriptions: Record<string, string> = {
    sedentary: "Hareketsiz (ofis işi)",
    light: "Hafif aktivite (haftada 1-3 gün egzersiz)",
    moderate: "Orta aktivite (haftada 3-5 gün egzersiz)",
    active: "Aktif (haftada 6-7 gün egzersiz)",
    veryActive: "Çok aktif (günde çift antrenman)"
  };

  // Dialog'ları kapatırken seçili ölçümü temizle
  const handleCloseEditDialog = () => {
    setShowEditDialog(false);
    setSelectedMeasurement(null);
  };

  const handleCloseDeleteDialog = () => {
    setShowDeleteDialog(false);
    setSelectedMeasurement(null);
  };

  const handleCloseMicroNutrientsDialog = () => {
    setShowMicroNutrientsDialog(false);
    setSelectedMeasurement(null);
  };

  // Checkbox seçenekleri
  const medicalOptions = [
    { value: "tip1", label: "🩸 Tip 1 Diyabet" },
    { value: "tip2", label: "🩸 Tip 2 Diyabet" },
    { value: "insulin_resistance", label: "💉 İnsülin Direnci" },
    { value: "metabolic_syndrome", label: "🧬 Metabolik Sendrom" },
    { value: "obesity", label: "⚖️ Obezite" },
    { value: "pcos", label: "👩‍🦱 Polikistik Over Sendromu (PCOS)" },
    { value: "hypothyroidism", label: "🦋 Hipotiroidi" },
    { value: "hyperthyroidism", label: "🦋 Hipertiroidi" },
    { value: "hashimoto", label: "🦋 Hashimoto Tiroiditi" },
    { value: "addison", label: "🧑‍⚕️ Addison Hastalığı" },
    { value: "hypertension", label: "💉 Hipertansiyon" },
    { value: "prehypertension", label: "💉 Prehipertansiyon" },
    { value: "hypercholesterolemia", label: "🧬 Yüksek Kolesterol (Hiperkolesterolemi)" },
    { value: "high_triglycerides", label: "🧬 Trigliserid Yüksekliği" },
    { value: "coronary_artery", label: "❤️ Koroner Arter Hastalığı" },
    { value: "heart_failure", label: "❤️ Kalp Yetmezliği" },
    { value: "arrhythmia", label: "❤️ Aritmi" },
    { value: "celiac", label: "🌾 Çölyak Hastalığı" },
    { value: "non_celiac_gluten", label: "🌾 Non-çölyak gluten hassasiyeti" },
    { value: "ibs", label: "💩 İrritabl Bağırsak Sendromu (IBS)" },
    { value: "crohn", label: "🦠 Crohn Hastalığı" },
    { value: "ulcerative_colitis", label: "🦠 Ülseratif Kolit" },
    { value: "reflux", label: "🤢 Reflü (GERD)" },
    { value: "gastritis", label: "🤢 Gastrit" },
    { value: "peptic_ulcer", label: "🤢 Peptik Ülser" },
    { value: "chronic_constipation", label: "🚽 Kronik Kabızlık" },
    { value: "chronic_diarrhea", label: "🚽 Kronik İshal" },
    { value: "chronic_kidney_failure", label: "🩺 Kronik Böbrek Yetmezliği" },
    { value: "nephrotic_syndrome", label: "🩺 Nefrotik Sendrom" },
    { value: "kidney_stones", label: "🪨 Taş Oluşumu (Böbrek taşı)" },
    { value: "fatty_liver", label: "🟠 Karaciğer Yağlanması (NAFLD)" },
    { value: "cirrhosis", label: "🟠 Siroz" },
    { value: "hepatitis", label: "🟠 Hepatit B/C" },
    { value: "anemia", label: "🩸 Anemi (Demir Eksikliği)" },
    { value: "b12_deficiency", label: "🩸 B12 Eksikliği" },
    { value: "vitamin_d_deficiency", label: "🌞 D Vitamini Eksikliği" },
    { value: "epilepsy", label: "⚡ Epilepsi" },
    { value: "migraine", label: "🤕 Migren" },
    { value: "depression", label: "😔 Depresyon" },
    { value: "anxiety", label: "😰 Anksiyete Bozukluğu" },
    { value: "eating_disorders", label: "🍽️ Yeme Bozuklukları (Anoreksiya, Bulimia)" },
    { value: "cancer", label: "🎗️ Kanser (kemoterapi alan)" },
    { value: "osteoporosis", label: "🦴 Kemik Erimesi (Osteoporoz)" },
    { value: "rheumatoid_arthritis", label: "🦴 Romatoid Artrit" },
    { value: "lupus", label: "🦋 Lupus" },
    { value: "ms", label: "🧠 Multipl Skleroz (MS)" },
  ];
  const allergyOptions = [
    { value: "gluten", label: "🌾 Gluten" },
    { value: "lactose", label: "🥛 Laktoz" },
    { value: "casein", label: "🧀 Süt Proteini (Kazein)" },
    { value: "egg_white", label: "🥚 Yumurta Beyazı" },
    { value: "egg_yolk", label: "🥚 Yumurta Sarısı" },
    { value: "hazelnut", label: "🌰 Fındık" },
    { value: "walnut", label: "🌰 Ceviz" },
    { value: "almond", label: "🌰 Badem" },
    { value: "peanut", label: "🥜 Yer Fıstığı" },
    { value: "pistachio", label: "🥜 Antep Fıstığı" },
    { value: "shrimp", label: "🦐 Karides" },
    { value: "mussel", label: "🦪 Midye" },
    { value: "fish", label: "🐟 Balık" },
    { value: "mollusks", label: "🐙 Yumuşakçalar (kalamar, ahtapot)" },
    { value: "soy", label: "🌱 Soya" },
    { value: "sesame", label: "🌻 Susam" },
    { value: "corn", label: "🌽 Mısır" },
    { value: "strawberry", label: "🍓 Çilek" },
    { value: "tomato", label: "🍅 Domates" },
    { value: "citrus", label: "🍊 Portakal / Turunçgiller" },
    { value: "kiwi", label: "🥝 Kivi" },
    { value: "mushroom", label: "🍄 Mantar" },
    { value: "pea", label: "🟢 Bezelye" },
    { value: "mustard", label: "🌶️ Hardal" },
    { value: "sulfites", label: "🧪 Sülfitler (koruyucu katkı maddesi)" },
    { value: "aspartame", label: "🍬 Aspartam" },
    { value: "pollen", label: "🌼 Polen" },
    { value: "dust_mites", label: "🪳 Toz Akarları" },
    { value: "animal_dander", label: "🐾 Hayvan Tüyü (kedi/köpek)" },
    { value: "food_colorings", label: "🧃 Gıda Boyaları (ör. tartrazin)" },
  ];
  const medicationOptions = [
    { value: "metformin", label: "💊 Metformin" },
    { value: "insulin", label: "💉 İnsülin (kısa ve uzun etkili)" },
    { value: "euthyrox", label: "💊 Euthyrox / Levotiroksin" },
    { value: "warfarin", label: "💊 Warfarin (Coumadin)" },
    { value: "heparin", label: "💉 Heparin" },
    { value: "statins", label: "💊 Statinler (Atorvastatin, Simvastatin)" },
    { value: "ace_inhibitors", label: "💊 ACE İnhibitörleri (Ramipril, Enalapril)" },
    { value: "beta_blockers", label: "💊 Beta Blokerler (Metoprolol, Bisoprolol)" },
    { value: "calcium_channel_blockers", label: "💊 Kalsiyum Kanal Blokerleri" },
    { value: "diuretics", label: "💊 Diüretikler (Furosemid, Hidroklorotiazid)" },
    { value: "antidepressants", label: "💊 Antidepresanlar (SSRI: Sertralin, Fluoksetin)" },
    { value: "snri", label: "💊 SNRI'lar (Duloksetin)" },
    { value: "antipsychotics", label: "💊 Antipsikotikler (Olanzapin, Risperidon)" },
    { value: "corticosteroids", label: "💊 Kortikosteroidler (Prednizolon)" },
    { value: "antihistamines", label: "💊 Antihistaminikler (Loratadin, Feksadin)" },
    { value: "birth_control", label: "💊 Doğum Kontrol Hapları (Yaz, Diane-35)" },
    { value: "immunosuppressants", label: "💊 İmmünosupresanlar (Azathioprin)" },
    { value: "chemotherapy", label: "💉 Kemoterapi İlaçları (Cisplatin, Methotrexate)" },
    { value: "nsaid", label: "💊 NSAID'ler (İbuprofen, Naproksen)" },
    { value: "antibiotics", label: "💊 Antibiyotikler (Amoksisilin, Doksisiklin)" },
    { value: "iron_supplements", label: "💉 Demir Takviyeleri" },
    { value: "b12_injections", label: "💉 B12 Enjeksiyonları" },
    { value: "omega3", label: "🧬 Omega-3 Takviyeleri" },
    { value: "multivitamins", label: "💊 Multivitaminler" },
    { value: "antacids", label: "💊 Antiasitler (Nexium, Pantoprazol)" },
    { value: "laxatives", label: "💊 Laksatifler" },
    { value: "antiemetics", label: "💊 Antiemetikler (Zofran)" },
    { value: "antiepileptics", label: "💊 Antiepileptikler (Karbamazepin)" },
    { value: "levothyronine", label: "💊 Levothyronin (T3 hormonu)" },
    { value: "glp1_analogs", label: "💉 GLP-1 Analogları (Ozempic, Wegovy)" },
    { value: "sglt2_inhibitors", label: "💊 SGLT2 İnhibitörleri (Jardiance, Forxiga)" },
  ];

  const dietOptions = [
    { value: "vegan", label: "🌱 Vegan" },
    { value: "vegetarian", label: "🥗 Vejetaryen" },
    { value: "pescatarian", label: "🐟 Pesketaryen" },
    { value: "gluten_free", label: "🌾 Glutensiz" },
    { value: "lactose_free", label: "🥛 Laktozsuz" },
    { value: "keto", label: "🥑 Ketojenik" },
    { value: "paleo", label: "🥩 Paleo" },
    { value: "mediterranean", label: "🫒 Akdeniz" },
    { value: "dash", label: "💪 DASH" },
    { value: "low_carb", label: "🍞 Düşük Karbonhidrat" },
    { value: "low_fat", label: "🥑 Düşük Yağ" },
    { value: "low_sodium", label: "🧂 Düşük Sodyum" },
    { value: "low_sugar", label: "🍬 Düşük Şeker" },
    { value: "high_protein", label: "🥩 Yüksek Protein" },
    { value: "halal", label: "🕌 Helal" },
    { value: "kosher", label: "✡️ Koşer" },
    { value: "raw_food", label: "🥕 Çiğ Beslenme" },
    { value: "macrobiotic", label: "🍚 Makrobiyotik" },
    { value: "ayurvedic", label: "🧘 Ayurvedik" },
    { value: "fodmap", label: "🥬 FODMAP" },
    { value: "anti_inflammatory", label: "🌿 Anti-inflamatuar" },
    { value: "diabetic", label: "🩸 Diyabetik" },
    { value: "heart_healthy", label: "❤️ Kalp Sağlığı" },
    { value: "weight_loss", label: "⚖️ Kilo Verme" },
    { value: "weight_gain", label: "💪 Kilo Alma" },
    { value: "muscle_gain", label: "💪 Kas Kazanımı" },
    { value: "sports", label: "🏃 Sporcu Beslenmesi" },
    { value: "pregnancy", label: "🤰 Hamilelik" },
    { value: "breastfeeding", label: "🤱 Emzirme" },
    { value: "child", label: "👶 Çocuk Beslenmesi" },
    { value: "elderly", label: "👴 Yaşlı Beslenmesi" },
    { value: "detox", label: "🧪 Detoks" },
    { value: "immune_boosting", label: "🛡️ Bağışıklık Güçlendirici" },
    { value: "gut_health", label: "🦠 Bağırsak Sağlığı" },
    { value: "brain_health", label: "🧠 Beyin Sağlığı" },
    { value: "bone_health", label: "🦴 Kemik Sağlığı" },
    { value: "skin_health", label: "✨ Cilt Sağlığı" },
    { value: "hair_health", label: "💇 Saç Sağlığı" },
    { value: "energy_boosting", label: "⚡ Enerji Artırıcı" },
    { value: "sleep_improving", label: "😴 Uyku Düzenleyici" },
    { value: "stress_reducing", label: "🧘 Stres Azaltıcı" },
    { value: "hormone_balancing", label: "⚖️ Hormon Dengeleyici" },
    { value: "thyroid_support", label: "🦋 Tiroid Desteği" },
    { value: "adrenal_support", label: "🧬 Adrenal Desteği" },
    { value: "liver_support", label: "🟠 Karaciğer Desteği" },
    { value: "kidney_support", label: "🩺 Böbrek Desteği" },
    { value: "joint_support", label: "🦵 Eklem Desteği" },
    { value: "eye_health", label: "👁️ Göz Sağlığı" },
    { value: "dental_health", label: "🦷 Diş Sağlığı" },
    { value: "allergen_free", label: "🚫 Alerjen İçermeyen" }
  ];

  function normalizeMedicalValue(val: string) {
    if (!val) return "";
    const v = val.toLowerCase().replace(/\s+/g, "");
    if (v === "tip1" || v === "tip1diyabet" || v === "tip1 diyabet" || v === "tip1diyabeti") return "tip1";
    if (v === "tip2" || v === "tip2diyabet" || v === "tip2 diyabet" || v === "tip2diyabeti") return "tip2";
    return val;
  }

  function parseMultiValue(val: any) {
    if (!val) return [];
    if (Array.isArray(val)) return val.map(normalizeMedicalValue);
    if (typeof val === "string") {
      if (val.trim().startsWith("[")) {
        try { return JSON.parse(val).map(normalizeMedicalValue); } catch { return []; }
      }
      return val.split(",").map((v) => normalizeMedicalValue(v.trim())).filter(Boolean);
    }
    return [];
  }

  const handleSaveHealthInfo = async () => {
    setSaving(true);
    await apiRequest(`/api/clients/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        medical_conditions: JSON.stringify(medicalState),
        allergies: JSON.stringify(allergyState),
        medications: JSON.stringify(medicationState),
      })
    });
    await queryClient.invalidateQueries({ queryKey: [`/api/clients/${id}`] });
    toast({ title: "Başarılı", description: "Sağlık bilgileri kaydedildi." });
    setSaving(false);
    setHasChanges(false);
  };

  const handleSaveDietPreferences = async () => {
    setSaving(true);
    await apiRequest(`/api/clients/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        diet_preferences: JSON.stringify(dietPreferencesState)
      })
    });
    await queryClient.invalidateQueries({ queryKey: [`/api/clients/${id}`] });
    toast({ title: "Başarılı", description: "Diyet tercihleri kaydedildi." });
    setSaving(false);
    setHasDietChanges(false);
  };

  console.log("client:", client);
  console.log("medical_conditions:", client?.medical_conditions);
  console.log("parsed medicalState:", parseMultiValue(client?.medical_conditions));

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 pt-10 pb-12 min-h-[calc(100vh-64px)]">
      {/* Danışan detay başlığı ve içerik */}
      <div className="min-h-screen pb-20 flex justify-end">
        <div className="py-8 mt-8 w-full max-w-6xl px-4">
          <div className="flex items-center mb-16 space-x-3">
            <Button 
              variant="outline" 
              size="icon"
              className="rounded-full h-10 w-10 hover:bg-slate-100 hover:scale-110 transition-all duration-300 shadow-sm" 
              onClick={() => navigate("/clients")}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{client?.first_name || ""} {client?.last_name || ""}</h1>
              <p className="text-muted-foreground text-sm mt-1.5">
                {client?.gender === 'female' ? 'Kadın' : client?.gender === 'male' ? 'Erkek' : 'Diğer'}
                {clientAge ? `, ${clientAge} yaş` : ''}
                {client?.email ? ` • ${client.email}` : ''}
              </p>
            </div>

            <div className="flex-1 flex justify-end">
              <Button 
                variant="destructive" 
                size="sm"
                className="rounded-xl hover:bg-destructive/90 hover:scale-105 transition-all duration-300 shadow-sm"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Danışanı Sil
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-10">
            <TabsList
              className="rounded-lg bg-white shadow-md p-1.5 border-none mb-10 flex w-full gap-2 overflow-x-hidden custom-scrollbar-hide"
              style={{ overflowX: 'hidden' }}
            >
              <TabsTrigger value="overview" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all duration-200 px-5 py-2 min-w-[110px] text-sm font-medium">
                Genel Bakış
              </TabsTrigger>
              <TabsTrigger value="measurements" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all duration-200 px-5 py-2 min-w-[110px] text-sm font-medium">
                Ölçümler
              </TabsTrigger>
              <TabsTrigger value="health-info" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all duration-200 px-5 py-2 min-w-[140px] text-sm font-medium">Sağlık Bilgileri</TabsTrigger>
              <TabsTrigger value="analytics" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all duration-200 px-5 py-2 min-w-[110px] text-sm font-medium">
                Analiz
              </TabsTrigger>
              <TabsTrigger value="notes" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all duration-200 px-5 py-2 min-w-[140px] text-sm font-medium">
                Diyetisyen Notları
              </TabsTrigger>
              <TabsTrigger value="clientNotes" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all duration-200 px-5 py-2 min-w-[110px] text-sm font-medium">
                Danışana Görünecek Notlar
              </TabsTrigger>
              <TabsTrigger value="appointments" className="rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all duration-200 px-5 py-2 min-w-[110px] text-sm font-medium">
                Randevular
              </TabsTrigger>
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
                                await generateAccessCode(id as string);
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
                      variant="outline"
                      className="mt-4 rounded-xl hover:bg-blue-100 transition-all"
                      onClick={() => navigate("/health-calculator")}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      İlk Ölçümü Ekle
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-5 overflow-auto">
                  {isLoadingMeasurements ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">Ölçümler yükleniyor...</p>
                    </div>
                  ) : measurementsError ? (
                    <div className="text-center py-8 text-red-500">
                      <p>Ölçümler yüklenirken bir hata oluştu.</p>
                      <Button 
                        variant="outline"
                        className="mt-4 rounded-xl hover:bg-blue-100 transition-all"
                        onClick={() => queryClient.invalidateQueries({ queryKey: [`/api/clients/${id}/measurements`] })}
                      >
                        Yeniden Dene
                      </Button>
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
                          <TableHead className="text-center">Mikro Besinler</TableHead>
                          <TableHead className="text-center">İşlemler</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {measurements.map((measurement) => (
                          <TableRow key={measurement.id}>
                            <TableCell className="text-center">{formatDate(measurement.date)}</TableCell>
                            <TableCell className="text-center">{measurement.weight}</TableCell>
                            <TableCell className="text-center">{measurement.height}</TableCell>
                            <TableCell className="text-center">
                              <span className={getBMIColor(parseFloat(measurement.bmi))}>
                                {measurement.bmi}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              {measurement.bodyFatPercentage ? (
                                <span className={getBodyFatColor(parseFloat(measurement.bodyFatPercentage), client.gender)}>
                                  {measurement.bodyFatPercentage}
                                </span>
                              ) : "-"}
                            </TableCell>
                            <TableCell className="text-center">{measurement.waistCircumference || "-"}</TableCell>
                            <TableCell className="text-center">{measurement.hipCircumference || "-"}</TableCell>
                            <TableCell className="text-center">
                              {activityLevelDescriptions[measurement.activityLevel] || "-"}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 hover:bg-slate-100"
                                onClick={() => {
                                  setSelectedMeasurement(measurement);
                                  setShowMicroNutrientsDialog(true);
                                }}
                              >
                                <Info className="h-4 w-4" />
                              </Button>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 hover:bg-slate-100"
                                  onClick={() => {
                                    setSelectedMeasurement(measurement);
                                    setShowEditDialog(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 hover:bg-red-100 text-red-600"
                                  onClick={() => {
                                    setSelectedMeasurement(measurement);
                                    setShowDeleteDialog(true);
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
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Henüz ölçüm kaydı bulunmuyor.</p>
                      <Button 
                        variant="outline"
                        className="mt-4 rounded-xl hover:bg-blue-100 transition-all"
                        onClick={() => setIsMeasurementDialogOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        İlk Ölçümü Ekle
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Silme Dialog */}
              <Dialog open={showDeleteDialog} onOpenChange={handleCloseDeleteDialog}>
                <DialogContent className="sm:max-w-[425px] rounded-xl border-none shadow-xl">
                  <DialogHeader>
                    <DialogTitle>Ölçümü Sil</DialogTitle>
                    <DialogDescription>
                      Bu ölçümü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={handleCloseDeleteDialog}>
                      İptal
                    </Button>
                    <Button 
                      type="button" 
                      variant="destructive"
                      onClick={() => deleteMeasurementMutation.mutate()}
                    >
                      Sil
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Mikrobesinler Dialog */}
              <Dialog open={showMicroNutrientsDialog} onOpenChange={handleCloseMicroNutrientsDialog}>
                <DialogContent className="sm:max-w-[600px] rounded-xl border-none shadow-xl">
                  <DialogHeader>
                    <DialogTitle>Mikrobesin Değerleri</DialogTitle>
                    <DialogDescription>
                      {selectedMeasurement && formatDate(selectedMeasurement.date)} tarihli ölçümün mikrobesin değerleri
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedMeasurement && Object.entries(selectedMeasurement)
                      .filter(([key, value]) => 
                        key.startsWith('vitamin') || 
                        ['thiamin', 'riboflavin', 'niacin', 'vitaminB6', 'folate', 'vitaminB12',
                         'calcium', 'iron', 'magnesium', 'phosphorus', 'zinc', 'potassium',
                         'sodium', 'copper', 'manganese', 'selenium', 'chromium', 'molybdenum',
                         'iodine'].includes(key)
                      )
                      .map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                          <span className="font-medium">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                          <span className="text-blue-600">{value || '-'}</span>
                        </div>
                      ))}
                  </div>
                </DialogContent>
              </Dialog>
            </TabsContent>

            <TabsContent value="health-info">
              <div className="space-y-8">
                {/* Sağlık Bilgileri Kartı */}
                <Card className="bg-gradient-to-br from-blue-50 via-white to-purple-50 shadow-xl rounded-2xl border-none p-8 transition-all duration-300 hover:shadow-2xl">
                  <CardHeader className="flex flex-row items-center gap-3 mb-6">
                    <div className="bg-blue-200 p-3 rounded-full shadow-md">
                      <Info className="h-6 w-6 text-blue-700" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-blue-800 tracking-tight">Sağlık Bilgileri</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {/* Kronik Hastalıklar */}
                      <div className="space-y-4">
                        <Label className="text-base font-semibold flex items-center gap-2 text-blue-700">
                          🩺 Kronik Hastalıklar
                        </Label>
                        <ReactSelect
                          isMulti
                          options={medicalOptions}
                          onChange={(selected) => {
                            setMedicalState(selected.map((s: any) => s.value));
                            setHasChanges(true);
                          }}
                          placeholder="Kronik hastalıkları seçin"
                          classNamePrefix="react-select"
                          styles={{
                            control: (base) => ({ ...base, borderRadius: 12, borderColor: '#3b82f6', minHeight: 44 }),
                            multiValue: (base) => ({ ...base, background: '#dbeafe', color: '#1e40af', borderRadius: 8 }),
                            multiValueLabel: (base) => ({ ...base, color: '#1e40af' }),
                            option: (base, state) => ({ ...base, background: state.isSelected ? '#3b82f6' : undefined, color: state.isSelected ? 'white' : undefined })
                          }}
                        />
                        <div className="flex flex-wrap gap-2">
                          {medicalState.map((val) => {
                            const opt = medicalOptions.find(o => o.value === val);
                            return opt ? <span key={val} className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium shadow hover:scale-105 transition-transform duration-200">{opt.label}</span> : null;
                          })}
                        </div>
                      </div>
                      {/* Alerjiler */}
                      <div className="space-y-4">
                        <Label className="text-base font-semibold flex items-center gap-2 text-pink-700">
                          🌸 Alerjiler
                        </Label>
                        <ReactSelect
                          isMulti
                          options={allergyOptions}
                          onChange={(selected) => {
                            setAllergyState(selected.map((s: any) => s.value));
                            setHasChanges(true);
                          }}
                          placeholder="Alerjileri seçin"
                          classNamePrefix="react-select"
                          styles={{
                            control: (base) => ({ ...base, borderRadius: 12, borderColor: '#ec4899', minHeight: 44 }),
                            multiValue: (base) => ({ ...base, background: '#fce7f3', color: '#be185d', borderRadius: 8 }),
                            multiValueLabel: (base) => ({ ...base, color: '#be185d' }),
                            option: (base, state) => ({ ...base, background: state.isSelected ? '#ec4899' : undefined, color: state.isSelected ? 'white' : undefined })
                          }}
                        />
                        <div className="flex flex-wrap gap-2">
                          {allergyState.map((val) => {
                            const opt = allergyOptions.find(o => o.value === val);
                            return opt ? <span key={val} className="inline-flex items-center px-3 py-1 rounded-full bg-pink-100 text-pink-800 text-sm font-medium shadow hover:scale-105 transition-transform duration-200">{opt.label}</span> : null;
                          })}
                        </div>
                      </div>
                      {/* Kullandığı İlaçlar */}
                      <div className="space-y-4">
                        <Label className="text-base font-semibold flex items-center gap-2 text-green-700">
                          💊 Kullandığı İlaçlar
                        </Label>
                        <ReactSelect
                          isMulti
                          options={medicationOptions}
                          onChange={(selected) => {
                            setMedicationState(selected.map((s: any) => s.value));
                            setHasChanges(true);
                          }}
                          placeholder="İlaçları seçin"
                          classNamePrefix="react-select"
                          styles={{
                            control: (base) => ({ ...base, borderRadius: 12, borderColor: '#22c55e', minHeight: 44 }),
                            multiValue: (base) => ({ ...base, background: '#bbf7d0', color: '#166534', borderRadius: 8 }),
                            multiValueLabel: (base) => ({ ...base, color: '#166534' }),
                            option: (base, state) => ({ ...base, background: state.isSelected ? '#22c55e' : undefined, color: state.isSelected ? 'white' : undefined })
                          }}
                        />
                        <div className="flex flex-wrap gap-2">
                          {medicationState.map((val) => {
                            const opt = medicationOptions.find(o => o.value === val);
                            return opt ? <span key={val} className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium shadow hover:scale-105 transition-transform duration-200">{opt.label}</span> : null;
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="mt-8 flex justify-end">
                      <button
                        className="px-6 py-2 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-bold shadow-lg hover:scale-105 hover:from-blue-600 hover:to-pink-600 transition-all duration-300 disabled:opacity-60"
                        onClick={handleSaveHealthInfo}
                        disabled={saving || !hasChanges}
                        type="button"
                      >
                        {saving ? "Kaydediliyor..." : "Kaydet"}
                      </button>
                    </div>
                  </CardContent>
                </Card>

                {/* Diyet Tercihleri Kartı */}
                <Card className="bg-gradient-to-br from-purple-50 via-white to-blue-50 shadow-xl rounded-2xl border-none p-8 transition-all duration-300 hover:shadow-2xl">
                  <CardHeader className="flex flex-row items-center gap-3 mb-6">
                    <div className="bg-purple-200 p-3 rounded-full shadow-md">
                      <Activity className="h-6 w-6 text-purple-700" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-purple-800 tracking-tight">Diyet Tercihleri</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-4">
                        <Label className="text-base font-semibold flex items-center gap-2 text-purple-700">
                          🥗 Diyet Tercihleri
                        </Label>
                        <ReactSelect
                          isMulti
                          options={dietOptions}
                          onChange={(selected) => {
                            setDietPreferencesState(selected.map((s: any) => s.value));
                            setHasDietChanges(true);
                          }}
                          placeholder="Diyet tercihlerini seçin"
                          classNamePrefix="react-select"
                          styles={{
                            control: (base) => ({ ...base, borderRadius: 12, borderColor: '#a21caf', minHeight: 44 }),
                            multiValue: (base) => ({ ...base, background: '#ede9fe', color: '#6d28d9', borderRadius: 8 }),
                            multiValueLabel: (base) => ({ ...base, color: '#6d28d9' }),
                            option: (base, state) => ({ ...base, background: state.isSelected ? '#a21caf' : undefined, color: state.isSelected ? 'white' : undefined })
                          }}
                        />
                        <div className="flex flex-wrap gap-2">
                          {dietPreferencesState.map((val) => {
                            const opt = dietOptions.find(o => o.value === val);
                            return opt ? <span key={val} className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-sm font-medium shadow hover:scale-105 transition-transform duration-200">{opt.label}</span> : null;
                          })}
                        </div>
                      </div>
                      <div className="mt-8 flex justify-end w-full">
                        <button
                          className="px-6 py-2 rounded-xl bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500 text-white font-bold shadow-lg hover:scale-105 hover:from-purple-600 hover:to-pink-600 transition-all duration-300 disabled:opacity-60"
                          onClick={handleSaveDietPreferences}
                          disabled={saving || !hasDietChanges}
                          type="button"
                        >
                          {saving ? "Kaydediliyor..." : "Kaydet"}
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
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

              <div className="grid grid-cols-1 md:grid-cols-1 gap-8 mb-10">
                {/* Risk Değerlendirme Kartı */}
                <Card className="bg-white shadow-md rounded-xl border-none hover:shadow-lg transition-all duration-300 overflow-hidden group transform hover:-translate-y-1">
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
                            {client.medical_conditions && "Kronik hastalıklar için özel beslenme planı gerekli."}
                            {!client.medical_conditions && !whr && parseFloat(lastMeasurement.bmi) < 25 && "Şu anda belirgin sağlık riski görünmüyor."}
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

              <TabsContent value="notes">
                <Card className="bg-white shadow-lg rounded-2xl border border-slate-200 mb-8">
                  <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
                    <CardTitle className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                      <Edit className="h-6 w-6 text-amber-600" />
                      Diyetisyen Notları
                    </CardTitle>
                    <CardDescription className="text-sm text-slate-500 mt-1">Bu notlar sadece sizin görebileceğiniz özel notlardır. Danışana gösterilmez.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Textarea 
                        placeholder="Yeni not ekle..."
                        className="min-h-[100px] border-slate-300 rounded-lg focus:border-amber-400 focus:ring-amber-200 text-base"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                      />
                      <Button 
                        className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                        onClick={handleAddNote}
                        disabled={!newNote.trim() || addNoteMutation.isPending}
                      >
                        {addNoteMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Ekleniyor...
                          </>
                        ) : (
                          "Not Ekle"
                        )}
                      </Button>
                      <div className="mt-8">
                        <h3 className="text-lg font-semibold mb-4 text-slate-700">Notlar</h3>
                        <div className="space-y-3">
                          {safeNotes.length > 0 ? (
                            safeNotes.map((note: any) => (
                              <div
                                key={note.id}
                                className="group flex items-center justify-between bg-white border border-slate-200 rounded-lg px-5 py-4 shadow-sm hover:shadow-md transition-all duration-200 relative"
                              >
                                <div className="flex flex-col w-full">
                                  <span className="text-slate-900 text-base font-medium tracking-tight break-words">{note.content}</span>
                                  {note.created_at && (
                                    <span className="text-xs text-slate-400 mt-2 self-end select-none">{new Date(note.created_at).toLocaleString("tr-TR")}</span>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="ml-2 rounded-full hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2"
                                  onClick={() => deleteNoteMutation.mutate(note.id)}
                                  aria-label="Notu Sil"
                                >
                                  <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500 transition-colors" />
                                </Button>
                              </div>
                            ))
                          ) : (
                            <div className="flex flex-col items-center justify-center py-10 text-slate-300 border border-dashed border-slate-200 rounded-lg bg-slate-50">
                              <Edit className="w-10 h-10 mb-2" />
                              <span className="text-base font-medium">Henüz hiç not eklenmemiş</span>
                              <span className="text-xs mt-1 text-slate-400">Yukarıdan ilk notunuzu ekleyin</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="clientNotes">
                <Card className="bg-white shadow-lg rounded-2xl border border-slate-200 mb-8">
                  <CardHeader className="pb-4 bg-white border-b border-green-200">
                    <CardTitle className="text-2xl font-bold flex items-center gap-3">
                      <MessageSquare className="h-6 w-6 text-green-600" />
                      Danışana Görünecek Notlar
                    </CardTitle>
                    <CardDescription className="text-sm mt-1">Bu notlar danışan portalında görünecektir. Danışanlarınız için talimatlarınızı buraya yazabilirsiniz.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Textarea 
                        placeholder="Yeni not ekle..."
                        className="min-h-[100px] border-green-300 rounded-lg focus:border-green-400 focus:ring-green-200 text-base"
                        value={clientPublicNotes || ""}
                        onChange={(e) => setClientPublicNotes(e.target.value)}
                      />
                      <Button 
                        className="rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold"
                        onClick={async () => {
                          if (!clientPublicNotes?.trim()) return;
                          const now = new Date();
                          const noteObj = { content: clientPublicNotes, created_at: now.toISOString() };
                          let newNotes = [];
                          if (Array.isArray(client?.client_visible_notes)) {
                            if (typeof client.client_visible_notes[0] === 'string') {
                              newNotes = [...client.client_visible_notes.map((n: any) => ({ content: n })), noteObj];
                            } else {
                              newNotes = [...client.client_visible_notes, noteObj];
                            }
                          } else {
                            newNotes = [noteObj];
                          }
                          await apiRequest(`/api/clients/${id}`, {
                            method: "PATCH",
                            body: JSON.stringify({ client_visible_notes: newNotes })
                          });
                          queryClient.invalidateQueries({ queryKey: [`/api/clients/${id}`] });
                          setClientPublicNotes("");
                          toast({
                            title: "Not eklendi",
                            description: "Danışana görünecek not başarıyla eklendi.",
                          });
                        }}
                        disabled={!clientPublicNotes?.trim()}
                      >
                        Not Ekle
                      </Button>
                      <div className="mt-8">
                        <h3 className="text-lg font-semibold mb-4">Notlar</h3>
                        <div className="space-y-3">
                          {Array.isArray(client?.client_visible_notes) && client.client_visible_notes.length > 0 ? (
                            (client.client_visible_notes || []).map((note: any, idx: number) => {
                              const noteContent = typeof note === 'string' ? note : note.content;
                              const noteDate = typeof note === 'object' && note.created_at ? note.created_at : null;
                              return (
                                <div
                                  key={idx}
                                  className="group flex items-center justify-between bg-white border border-slate-200 rounded-lg px-5 py-4 shadow-sm hover:shadow-md transition-all duration-200 relative"
                                >
                                  <div className="flex flex-col w-full">
                                    <span className="text-base font-medium tracking-tight break-words">{noteContent}</span>
                                    {noteDate && (
                                      <span className="text-xs mt-2 self-end select-none">{new Date(noteDate).toLocaleString("tr-TR")}</span>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="ml-2 rounded-full hover:bg-green-50 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2"
                                    onClick={async () => {
                                      let notesArr: any[] = Array.isArray(client?.client_visible_notes) ? client.client_visible_notes : [];
                                      const newNotes = notesArr.filter((_: any, i: number) => i !== idx);
                                      await apiRequest(`/api/clients/${id}`, {
                                        method: "PATCH",
                                        body: JSON.stringify({ client_visible_notes: newNotes })
                                      });
                                      queryClient.invalidateQueries({ queryKey: [`/api/clients/${id}`] });
                                      toast({
                                        title: "Not silindi",
                                        description: "Not başarıyla silindi.",
                                      });
                                    }}
                                    aria-label="Notu Sil"
                                  >
                                    <Trash2 className="h-4 w-4 text-green-400 hover:text-red-500 transition-colors" />
                                  </Button>
                                </div>
                              );
                            })
                          ) : (
                            <div className="flex flex-col items-center justify-center py-10 text-green-300 border border-dashed border-slate-200 rounded-lg bg-slate-50">
                              <MessageSquare className="w-10 h-10 mb-2" />
                              <span className="text-base font-medium">Henüz hiç not eklenmemiş</span>
                              <span className="text-xs mt-1 text-green-400">Yukarıdan ilk notunuzu ekleyin</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="appointments">
                <Card>
                  <CardHeader>
                    <CardTitle>Randevular</CardTitle>
                    <CardDescription>
                      Müşterinin randevu geçmişi ve planlanan randevular
                    </CardDescription>
                    <Button className="mt-2" onClick={() => { setEditingAppointment(undefined); setIsAppointmentDialogOpen(true); }}>
                      <Plus className="w-4 h-4 mr-2" /> Randevu Ekle
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {isLoadingAppointments ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : appointments && appointments.length > 0 ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {appointments.map((appointment) => {
                            const appointmentDate = new Date(appointment.date);
                            const appointmentTime = appointment.time ? new Date(`${appointment.date}T${appointment.time}`) : null;
                            const now = new Date();
                            const isPast = appointmentTime ? appointmentTime < now : false;
                            const isToday = appointmentDate.toDateString() === now.toDateString();
                            const isUpcoming = appointmentTime ? appointmentTime > now : false;
                            
                            const getStatusColor = (status: string) => {
                              switch (status) {
                                case 'completed': return 'bg-green-100 text-green-800';
                                case 'canceled': return 'bg-red-100 text-red-800';
                                default: return 'bg-blue-100 text-blue-800';
                              }
                            };

                            const getTimeStatus = () => {
                              if (isPast) return { text: 'Geçmiş', color: 'text-gray-500' };
                              if (isToday) return { text: 'Bugün', color: 'text-blue-600' };
                              if (isUpcoming) return { text: 'Yaklaşan', color: 'text-green-600' };
                              return { text: '', color: '' };
                            };

                            const timeStatus = getTimeStatus();
                            const formattedTime = appointment.time
                              || (appointment.startTime ? new Date(appointment.startTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '-');

                            return (
                              <Card key={appointment.id} className="shadow-md border border-gray-100 hover:shadow-lg transition-all duration-200">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                  <div>
                                    <CardTitle className="text-lg font-semibold text-emerald-700 flex items-center gap-2">
                                      <Calendar className="w-5 h-5 text-emerald-500" />
                                      {formatDate(appointment.date)}
                                      {timeStatus.text && (
                                        <Badge variant="outline" className={`ml-2 ${timeStatus.color}`}>
                                          {timeStatus.text}
                                        </Badge>
                                      )}
                                    </CardTitle>
                                    <CardDescription className="text-gray-500 mt-1">
                                      Saat: <span className="font-medium text-gray-800">
                                        {formattedTime}
                                      </span> |
                                      Süre: <span className="font-medium text-gray-800">30 dk</span>
                                    </CardDescription>
                                  </div>
                                  <div className="flex gap-2">
                                    {!isPast && (
                                      <>
                                        <Button size="icon" variant="outline" onClick={() => { setEditingAppointment(appointment); setIsAppointmentDialogOpen(true); }} title="Düzenle">
                                          <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button size="icon" variant="destructive" onClick={() => setDeletingAppointment(appointment)} title="Sil">
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge className={getStatusColor(appointment.status)}>
                                      {appointment.status === 'completed' ? 'Tamamlandı' : 
                                       appointment.status === 'canceled' ? 'İptal Edildi' : 
                                       'Planlandı'}
                                    </Badge>
                                    <span className="text-xs text-gray-500">
                                      Randevu Tipi: <span className="font-semibold">{appointmentTypeLabels[appointment.type] || appointment.type}</span>
                                    </span>
                                  </div>
                                  {appointment.notes && (
                                    <div className="text-sm text-gray-700 mt-2">
                                      <Info className="inline w-4 h-4 mr-1 text-blue-400" />
                                      {appointment.notes}
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <Alert>
                        <AlertTitle>Bilgi</AlertTitle>
                        <AlertDescription>
                          Henüz randevu kaydı bulunmuyor.
                        </AlertDescription>
                      </Alert>
                    )}
                    <AppointmentDialog
                      open={isAppointmentDialogOpen}
                      onOpenChange={(open) => {
                        setIsAppointmentDialogOpen(open);
                        if (!open) setEditingAppointment(undefined);
                      }}
                      onSubmit={handleAddOrEditAppointment}
                      appointment={editingAppointment}
                      timeSlots={generateTimeSlots()}
                      disabledTimes={disabledTimes}
                    />
                    <AlertDialog open={!!deletingAppointment} onOpenChange={open => !open && setDeletingAppointment(undefined)}>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Randevuyu silmek istediğinize emin misiniz?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Bu işlem geri alınamaz.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteAppointment}>Sil</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      
    </div>
  );
}