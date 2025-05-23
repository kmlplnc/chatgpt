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

import { useSession } from "@/hooks/use-session";
import { Appointment } from "@/types/client";
import { ErrorBoundary } from '@/components/error-boundary';

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
  medicalConditions?: string;
  allergies?: string;
  medications?: string;
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
  if (!response.ok) throw new Error("Ölçüm verileri yüklenemedi");
  return response.data as Measurement[];
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
  return <ClientDetail />;
}

function ClientDetail() {
  console.log('ClientDetail render');
  const [_, setLocation] = useLocation();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { session } = useSession();
  const clientId = parseInt(id as string);

  // All useState hooks
  const [viewedTab, setViewedTab] = useState<"measurements" | "health" | "diet" | "notes" | "appointments">('measurements');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isMeasurementDialogOpen, setIsMeasurementDialogOpen] = useState(false);
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

  // All useForm hooks
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

  const { data: measurements, isLoading: isLoadingMeasurements } = useQuery({
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
    mutationFn: (data: any) => updateMeasurement(id as string, selectedMeasurement?.id as number, data),
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
    mutationFn: () => deleteClient(id as string),
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Müşteri başarıyla silindi.",
      });
      setLocation("/clients");
    },
  });

  const deleteMeasurementMutation = useMutation({
    mutationFn: (measurementId: number) => deleteMeasurement(id as string, measurementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${id}/measurements`] });
      toast({
        title: "Başarılı",
        description: "Ölçüm başarıyla silindi.",
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
        waistCircumference: editingMeasurement.waistCircumference,
        hipCircumference: editingMeasurement.hipCircumference,
        bodyFatPercentage: editingMeasurement.bodyFatPercentage,
        activityLevel: editingMeasurement.activityLevel,
        notes: editingMeasurement.notes,
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

  const handleDeleteMeasurement = useCallback((measurementId: number) => {
    if (window.confirm("Bu ölçümü silmek istediğinizden emin misiniz?")) {
      deleteMeasurementMutation.mutate(measurementId);
    }
  }, [deleteMeasurementMutation]);

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
        <Button onClick={() => setLocation("/clients")} className="mt-4">
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
              onClick={() => setLocation("/clients")}
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

          <Tabs defaultValue="overview" className="mb-10">
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
                      className="rounded-xl bg-blue-600 hover:bg-blue-700 hover:scale-105 transition-all duration-300"
                      onClick={() => setIsMeasurementDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Yeni Ölçüm
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-5 overflow-auto">
                  {isLoadingMeasurements ? (
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
                        onClick={() => setIsMeasurementDialogOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        İlk Ölçümü Ekle
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Yeni Ölçüm Ekleme Dialog */}
              <Dialog open={isMeasurementDialogOpen} onOpenChange={setIsMeasurementDialogOpen}>
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
                          onClick={() => setIsMeasurementDialogOpen(false)} 
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
              <Dialog open={isMeasurementDialogOpen} onOpenChange={setIsMeasurementDialogOpen}>
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
                                    await apiRequest(`/api/clients/${id}`, {
                                      method: "PATCH",
                                      body: JSON.stringify({ medicalConditions: conditions })
                                    });
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
                                    await apiRequest(`/api/clients/${id}`, {
                                      method: "PATCH",
                                      body: JSON.stringify({ allergies: allergies })
                                    });
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
                                    await apiRequest(`/api/clients/${id}`, {
                                      method: "PATCH",
                                      body: JSON.stringify({ medications: medications })
                                    });
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
                                    await apiRequest(`/api/clients/${id}`, {
                                      method: "PATCH",
                                      body: JSON.stringify({ healthNotes: notes })
                                    });
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