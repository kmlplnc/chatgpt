import React, { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import MeasurementChart from "@/components/clients/measurement-chart";
import BodyVisualization from "@/components/clients/body-visualization";
import { queryClient } from "@/lib/queryClient";
import { calculateBMI, formatDate } from "@/lib/utils";

// Measurement schema for the form
const measurementSchema = z.object({
  date: z.string().default(() => new Date().toISOString().split('T')[0]),
  weight: z.coerce.number().min(20, "En az 20 kg olmalıdır").max(300, "En fazla 300 kg olabilir"),
  height: z.coerce.number().min(50, "En az 50 cm olmalıdır").max(250, "En fazla 250 cm olabilir"),
  bodyFatPercentage: z.coerce.number().min(1, "En az %1 olmalıdır").max(70, "En fazla %70 olabilir").optional(),
  waistCircumference: z.coerce.number().min(30, "En az 30 cm olmalıdır").max(200, "En fazla 200 cm olabilir").optional(),
  hipCircumference: z.coerce.number().min(30, "En az 30 cm olmalıdır").max(200, "En fazla 200 cm olabilir").optional(),
  chestCircumference: z.coerce.number().min(30, "En az 30 cm olmalıdır").max(200, "En fazla 200 cm olabilir").optional(),
  armCircumference: z.coerce.number().min(10, "En az 10 cm olmalıdır").max(100, "En fazla 100 cm olabilir").optional(),
  thighCircumference: z.coerce.number().min(20, "En az 20 cm olmalıdır").max(120, "En fazla 120 cm olabilir").optional(),
  calfCircumference: z.coerce.number().min(10, "En az 10 cm olmalıdır").max(80, "En fazla 80 cm olabilir").optional(),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"]).optional(),
  notes: z.string().optional(),
});

type MeasurementFormValues = z.infer<typeof measurementSchema>;

// API istekleri
async function getClient(id: string) {
  const response = await fetch(`/api/clients/${id}`);
  if (!response.ok) {
    throw new Error("Danışan bilgisi yüklenemedi");
  }
  return response.json();
}

async function getClientMeasurements(id: string) {
  const response = await fetch(`/api/clients/${id}/measurements`);
  if (!response.ok) {
    throw new Error("Ölçüm bilgileri yüklenemedi");
  }
  return response.json();
}

async function addMeasurement(clientId: string, data: MeasurementFormValues) {
  try {
    console.log("Gönderilen veri:", JSON.stringify(data));
    
    const response = await fetch(`/api/clients/${clientId}/measurements`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Sunucu yanıtı:", errorText);
      throw new Error(`Ölçüm eklenemedi: ${errorText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error("Ölçüm ekleme hatası:", error);
    throw error;
  }
}

// Ölçüm düzenleme
async function updateMeasurement(clientId: string, measurementId: number, data: MeasurementFormValues) {
  try {
    console.log("Düzenlenen veri:", JSON.stringify(data));
    
    // PATCH isteği için sadece değişen alanları gönder
    // NaN, undefined, null değerleri temizle
    const cleanedData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined && v !== null && !isNaN(Number(v)))
    );
    
    console.log("Temizlenmiş veri:", JSON.stringify(cleanedData));
    
    const response = await fetch(`/api/clients/${clientId}/measurements/${measurementId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cleanedData),
    });
    
    if (!response.ok) {
      let errorMessage = "Ölçüm düzenlenemedi";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // JSON parse hatası durumunda text olarak al
        errorMessage = await response.text();
      }
      throw new Error(errorMessage);
    }
    
    return response.json();
  } catch (error) {
    console.error("Ölçüm düzenleme hatası:", error);
    throw error;
  }
}

// Ölçüm silme
async function deleteMeasurement(clientId: string, measurementId: number) {
  try {
    const response = await fetch(`/api/clients/${clientId}/measurements/${measurementId}`, {
      method: "DELETE",
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Sunucu yanıtı:", errorText);
      throw new Error(`Ölçüm silinemedi: ${errorText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error("Ölçüm silme hatası:", error);
    throw error;
  }
}

export default function ClientDetail() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const [openNewMeasurementDialog, setOpenNewMeasurementDialog] = useState(false);
  const [openEditMeasurementDialog, setOpenEditMeasurementDialog] = useState(false);
  const [selectedMeasurement, setSelectedMeasurement] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Client verilerini getir
  const { 
    data: client, 
    isLoading: isClientLoading, 
    error: clientError 
  } = useQuery({
    queryKey: [`/api/clients/${id}`],
    queryFn: () => getClient(id),
  });
  
  // Ölçüm verilerini getir
  const { 
    data: measurements, 
    isLoading: isMeasurementsLoading, 
    error: measurementsError 
  } = useQuery({
    queryKey: [`/api/clients/${id}/measurements`],
    queryFn: () => getClientMeasurements(id),
  });
  
  // Yeni ölçüm form tanımı
  const form = useForm<MeasurementFormValues>({
    resolver: zodResolver(measurementSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      weight: 0,
      height: 0,
      bodyFatPercentage: undefined,
      waistCircumference: undefined,
      hipCircumference: undefined,
      chestCircumference: undefined,
      armCircumference: undefined,
      thighCircumference: undefined,
      calfCircumference: undefined,
      activityLevel: "moderate",
      notes: "",
    },
  });
  
  // Düzenleme form tanımı
  const editForm = useForm<MeasurementFormValues>({
    resolver: zodResolver(measurementSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      weight: 0,
      height: 0,
      bodyFatPercentage: undefined,
      waistCircumference: undefined,
      hipCircumference: undefined,
      chestCircumference: undefined,
      armCircumference: undefined,
      thighCircumference: undefined,
      calfCircumference: undefined,
      activityLevel: "moderate",
      notes: "",
    },
  });
  
  // Ölçüm ekleme mutation
  const addMeasurementMutation = useMutation({
    mutationFn: (data: MeasurementFormValues) => addMeasurement(id, data),
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Ölçüm başarıyla kaydedildi",
      });
      form.reset();
      setOpenNewMeasurementDialog(false);
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${id}/measurements`] });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: `Ölçüm kaydedilirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Ölçüm düzenleme mutation
  const updateMeasurementMutation = useMutation({
    mutationFn: ({ measurementId, data }: { measurementId: number, data: MeasurementFormValues }) => 
      updateMeasurement(id, measurementId, data),
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Ölçüm başarıyla güncellendi",
      });
      editForm.reset();
      setOpenEditMeasurementDialog(false);
      setSelectedMeasurement(null);
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${id}/measurements`] });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: `Ölçüm güncellenirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Ölçüm silme mutation
  const deleteMeasurementMutation = useMutation({
    mutationFn: ({ measurementId }: { measurementId: number }) => 
      deleteMeasurement(id, measurementId),
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Ölçüm başarıyla silindi",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${id}/measurements`] });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: `Ölçüm silinirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Yeni ölçüm ekleme - geliştirilmiş veri validasyonu
  function onSubmit(data: MeasurementFormValues) {
    // Sayısal değerler için güvenli dönüşüm fonksiyonu
    const safeNumericValue = (value: any): number | null => {
      if (value === "" || value === null || value === undefined) return null;
      const numValue = Number(value);
      return isNaN(numValue) ? null : numValue;
    };
    
    // Temel gerekli verileri ayarla - sayısal değerlerin güvenli olduğundan emin ol
    const weight = safeNumericValue(data.weight) || 0; // Ağırlık gerekli, bu yüzden 0 kullan
    const height = safeNumericValue(data.height) || 0; // Boy gerekli, bu yüzden 0 kullan
    
    // BMI'ı otomatik hesapla
    const bmi = calculateBMI(weight, height);
    
    // İsteğe bağlı alanları güvenli bir şekilde işle
    const optionalMeasurements = {
      bodyFatPercentage: safeNumericValue(data.bodyFatPercentage),
      waistCircumference: safeNumericValue(data.waistCircumference),
      hipCircumference: safeNumericValue(data.hipCircumference),
      chestCircumference: safeNumericValue(data.chestCircumference),
      armCircumference: safeNumericValue(data.armCircumference),
      thighCircumference: safeNumericValue(data.thighCircumference),
      calfCircumference: safeNumericValue(data.calfCircumference)
    };
    
    // Diğer alanları ekle
    const measurementData = {
      date: data.date || new Date().toISOString().split("T")[0], // Tarih gereklidir
      weight,
      height,
      bmi: bmi.toString(),
      clientId: Number(id),
      activityLevel: data.activityLevel || "moderate",
      notes: data.notes || "",
      ...optionalMeasurements
    };
    
    console.log("Yeni ölçüm için hazırlanan veri:", JSON.stringify(measurementData, null, 2));
    
    // Yeni ölçüm ekle
    addMeasurementMutation.mutate(measurementData);
  }
  
  // Ölçüm düzenleme - geliştirilmiş veri doğrulama ve temizleme
  function onEditSubmit(data: MeasurementFormValues) {
    if (!selectedMeasurement) return;
    
    // Sayısal değerler için güvenli dönüşüm fonksiyonu
    const safeNumericValue = (value: any): number | null => {
      if (value === "" || value === null || value === undefined) return null;
      const numValue = Number(value);
      return isNaN(numValue) ? null : numValue;
    };
    
    // Temel gerekli verileri ayarla - sayısal değerlerin güvenli olduğundan emin ol
    const weight = safeNumericValue(data.weight) || 0; // Ağırlık gerekli, bu yüzden 0 kullan
    const height = safeNumericValue(data.height) || 0; // Boy gerekli, bu yüzden 0 kullan
    
    // BMI'ı otomatik hesapla
    const bmi = calculateBMI(weight, height);
    
    // İsteğe bağlı alanları güvenli bir şekilde işle
    const optionalMeasurements = {
      bodyFatPercentage: safeNumericValue(data.bodyFatPercentage),
      waistCircumference: safeNumericValue(data.waistCircumference),
      hipCircumference: safeNumericValue(data.hipCircumference),
      chestCircumference: safeNumericValue(data.chestCircumference),
      armCircumference: safeNumericValue(data.armCircumference),
      thighCircumference: safeNumericValue(data.thighCircumference),
      calfCircumference: safeNumericValue(data.calfCircumference)
    };
    
    // Diğer alanları ekle
    const measurementData = {
      date: data.date || new Date().toISOString().split("T")[0], // Tarih gereklidir
      weight,
      height,
      bmi: bmi.toString(),
      clientId: Number(id),
      activityLevel: data.activityLevel || "moderate",
      notes: data.notes || "",
      ...optionalMeasurements
    };
    
    console.log("Güncelleme için hazırlanan veri:", JSON.stringify(measurementData, null, 2));
    
    // Ölçümü güncelle
    updateMeasurementMutation.mutate({ 
      measurementId: selectedMeasurement.id, 
      data: measurementData 
    });
  }
  
  // Son ölçümü bul
  const lastMeasurement = measurements && measurements.length > 0 
    ? measurements[0] 
    : null;
  
  // Yükleme durumu
  if (isClientLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <p>Danışan bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }
  
  // Hata durumu
  if (clientError) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <p className="text-red-500">Hata: Danışan bilgileri yüklenemedi.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Button 
            variant="outline" 
            onClick={() => setLocation("/clients")}
            className="mb-4"
          >
            &larr; Danışanlara Dön
          </Button>
          <h1 className="text-3xl font-bold">{client.firstName} {client.lastName}</h1>
          <p className="text-muted-foreground">{client.email} | {client.phone || "Telefon yok"}</p>
        </div>
        
        {/* Yeni ölçüm ekleme diyaloğu */}
        <Dialog open={openNewMeasurementDialog} onOpenChange={setOpenNewMeasurementDialog}>
          <DialogTrigger asChild>
            <Button>Yeni Ölçüm Ekle</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Yeni Ölçüm Ekle</DialogTitle>
              <DialogDescription>
                {client.firstName} {client.lastName} için yeni ölçüm bilgilerini girin.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ölçüm Tarihi*</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ağırlık (kg)*</FormLabel>
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
                        <FormLabel>Boy (cm)*</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  
                  <FormField
                    control={form.control}
                    name="chestCircumference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Göğüs Çevresi (cm)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="armCircumference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kol Çevresi (cm)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="thighCircumference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Uyluk Çevresi (cm)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="calfCircumference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Baldır Çevresi (cm)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpenNewMeasurementDialog(false)}>
                    İptal
                  </Button>
                  <Button type="submit" disabled={addMeasurementMutation.isPending}>
                    {addMeasurementMutation.isPending ? "Kaydediliyor..." : "Ölçümü Kaydet"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        {/* Ölçüm düzenleme diyaloğu */}
        <Dialog open={openEditMeasurementDialog} onOpenChange={setOpenEditMeasurementDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Ölçüm Düzenle</DialogTitle>
              <DialogDescription>
                {client.firstName} {client.lastName} için ölçüm bilgilerini düzenleyin.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
                <FormField
                  control={editForm.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ölçüm Tarihi*</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ağırlık (kg)*</FormLabel>
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
                        <FormLabel>Boy (cm)*</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  
                  <FormField
                    control={editForm.control}
                    name="chestCircumference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Göğüs Çevresi (cm)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="armCircumference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kol Çevresi (cm)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="thighCircumference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Uyluk Çevresi (cm)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="calfCircumference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Baldır Çevresi (cm)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => {
                    setOpenEditMeasurementDialog(false);
                    setSelectedMeasurement(null);
                  }}>
                    İptal
                  </Button>
                  <Button type="submit" disabled={updateMeasurementMutation.isPending}>
                    {updateMeasurementMutation.isPending ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Genel Bilgiler</TabsTrigger>
          <TabsTrigger value="progress">Gelişim Takibi</TabsTrigger>
          <TabsTrigger value="measurements">Tüm Ölçümler</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Kişisel Bilgiler</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Doğum Tarihi</Label>
                  <p>{client.birthDate ? formatDate(client.birthDate) : "Belirtilmemiş"}</p>
                </div>
                <div>
                  <Label>Cinsiyet</Label>
                  <p>{client.gender === "male" ? "Erkek" : client.gender === "female" ? "Kadın" : "Diğer"}</p>
                </div>
                <div>
                  <Label>Meslek</Label>
                  <p>{client.occupation || "Belirtilmemiş"}</p>
                </div>
                <div>
                  <Label>Durum</Label>
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    client.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                  }`}>
                    {client.status === "active" ? "Aktif" : "Pasif"}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Sağlık Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Sağlık Durumu</Label>
                  <p>{client.medicalConditions || "Belirtilmemiş"}</p>
                </div>
                <div>
                  <Label>Alerjiler</Label>
                  <p>{client.allergies || "Belirtilmemiş"}</p>
                </div>
                <Separator className="my-4" />
                <div>
                  <Label>Güncel BMI</Label>
                  <p className="text-2xl font-bold">{lastMeasurement?.bmi ? lastMeasurement.bmi : "Ölçüm yok"}</p>
                </div>
                <div>
                  <Label>Güncel Kilo</Label>
                  <p>{lastMeasurement?.weight ? `${lastMeasurement.weight} kg` : "Ölçüm yok"}</p>
                </div>
              </CardContent>
            </Card>
            
            {measurements && measurements.length >= 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>İlerleme Raporu</CardTitle>
                  <CardDescription>
                    {measurements[0].date && measurements[measurements.length - 1].date && (
                      <>
                        <span className="font-medium">
                          {formatDate(measurements[measurements.length - 1].date)} - {formatDate(measurements[0].date)}
                        </span> 
                        {" "}tarih aralığındaki ilerleme
                      </>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {(() => {
                      // İlk ölçüm ile son ölçüm arasındaki değişimleri hesapla
                      const firstMeasurement = measurements[measurements.length - 1];
                      const lastMeasurement = measurements[0];
                      
                      // Toplam kilo kaybı
                      const totalWeightChange = firstMeasurement.weight && lastMeasurement.weight
                        ? Number(lastMeasurement.weight) - Number(firstMeasurement.weight) 
                        : null;
                        
                      // Toplam bel değişimi
                      const totalWaistChange = firstMeasurement.waistCircumference && lastMeasurement.waistCircumference
                        ? Number(lastMeasurement.waistCircumference) - Number(firstMeasurement.waistCircumference)
                        : null;
                        
                      // Toplam BMI değişimi
                      const totalBMIChange = firstMeasurement.bmi && lastMeasurement.bmi
                        ? Number(lastMeasurement.bmi) - Number(firstMeasurement.bmi)
                        : null;
                      
                      // Toplam geçen gün sayısı
                      const daysDiff = firstMeasurement.date && lastMeasurement.date
                        ? Math.round((new Date(lastMeasurement.date).getTime() - new Date(firstMeasurement.date).getTime()) / (1000 * 60 * 60 * 24))
                        : null;
                      
                      return (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Toplam kilo değişimi */}
                            {totalWeightChange !== null && (
                              <div className="p-4 border rounded-lg bg-muted/20">
                                <h4 className="text-sm font-medium text-muted-foreground mb-1">Toplam Kilo Değişimi</h4>
                                <div className="flex items-center">
                                  <span className={`text-3xl font-bold ${totalWeightChange < 0 ? "text-green-600" : totalWeightChange > 0 ? "text-red-600" : "text-muted"}`}>
                                    {totalWeightChange < 0 ? "" : "+"}{totalWeightChange.toFixed(1)}
                                  </span>
                                  <span className="text-base ml-1">kg</span>
                                </div>
                                {daysDiff && daysDiff > 7 && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    {daysDiff} günde {Math.abs(totalWeightChange / (daysDiff / 7)).toFixed(1)} kg/hafta
                                  </p>
                                )}
                              </div>
                            )}
                            
                            {/* Toplam bel çevresi değişimi */}
                            {totalWaistChange !== null && (
                              <div className="p-4 border rounded-lg bg-muted/20">
                                <h4 className="text-sm font-medium text-muted-foreground mb-1">Bel Çevresi Değişimi</h4>
                                <div className="flex items-center">
                                  <span className={`text-3xl font-bold ${totalWaistChange < 0 ? "text-green-600" : totalWaistChange > 0 ? "text-red-600" : "text-muted"}`}>
                                    {totalWaistChange < 0 ? "" : "+"}{totalWaistChange.toFixed(1)}
                                  </span>
                                  <span className="text-base ml-1">cm</span>
                                </div>
                                {daysDiff && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Toplam {Math.abs(totalWaistChange).toFixed(1)} cm değişim
                                  </p>
                                )}
                              </div>
                            )}
                            
                            {/* Toplam BMI değişimi */}
                            {totalBMIChange !== null && (
                              <div className="p-4 border rounded-lg bg-muted/20">
                                <h4 className="text-sm font-medium text-muted-foreground mb-1">BMI Değişimi</h4>
                                <div className="flex items-center">
                                  <span className={`text-3xl font-bold ${totalBMIChange < 0 ? "text-green-600" : totalBMIChange > 0 ? "text-red-600" : "text-muted"}`}>
                                    {totalBMIChange < 0 ? "" : "+"}{totalBMIChange.toFixed(1)}
                                  </span>
                                  <span className="text-base ml-1">puan</span>
                                </div>
                                {lastMeasurement.bmi && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Mevcut BMI: {Number(lastMeasurement.bmi).toFixed(1)}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Vücut çevresi değişimleri */}
                          <div className="pt-2">
                            <h4 className="text-sm font-medium mb-3">Vücut Ölçüleri Değişimleri</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {[
                                { label: "Kalça", key: "hipCircumference", unit: "cm" },
                                { label: "Göğüs", key: "chestCircumference", unit: "cm" },
                                { label: "Kol", key: "armCircumference", unit: "cm" },
                                { label: "Uyluk", key: "thighCircumference", unit: "cm" },
                                { label: "Baldır", key: "calfCircumference", unit: "cm" }
                              ].map(metric => {
                                const firstValue = firstMeasurement[metric.key];
                                const lastValue = lastMeasurement[metric.key];
                                
                                if (!firstValue || !lastValue) return null;
                                
                                const change = Number(lastValue) - Number(firstValue);
                                const isReduced = change < 0;
                                
                                return (
                                  <div key={metric.key} className="p-3 border rounded-lg">
                                    <h5 className="text-xs text-muted-foreground">{metric.label}</h5>
                                    <div className="flex justify-between items-center mt-1">
                                      <span className="text-sm">{firstValue} → {lastValue} {metric.unit}</span>
                                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${isReduced ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}>
                                        {isReduced ? "" : "+"}{change.toFixed(1)}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          
                          {daysDiff && (
                            <div className="flex items-center justify-center pt-2">
                              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                                {daysDiff} gündür danışanınızla çalışıyorsunuz
                              </span>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            )}
            
            <Card>
              <CardHeader>
                <CardTitle>Notlar ve Detaylar</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label>Danışan Notları</Label>
                  <p className="mt-2">{client.notes || "Not bulunmamaktadır."}</p>
                </div>
                <Separator className="my-4" />
                <div>
                  <Label>Başlangıç Tarihi</Label>
                  <p>{formatDate(client.startDate)}</p>
                </div>
                {client.endDate && (
                  <div className="mt-2">
                    <Label>Bitiş Tarihi</Label>
                    <p>{formatDate(client.endDate)}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="progress" className="space-y-6">
          {isMeasurementsLoading ? (
            <div className="flex justify-center items-center h-64">
              <p>Ölçüm verileri yükleniyor...</p>
            </div>
          ) : measurementsError ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-red-500">Hata: Ölçüm verileri yüklenemedi.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-xl font-semibold">2D Vücut Modeli</h2>
                </div>
                
                <BodyVisualization 
                  measurements={measurements}
                  gender={client?.gender === "female" ? "female" : "male"}
                  title="Vücut Yapısı Görselleştirmesi"
                  showComparison={true}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>BMI ve Kilogram Özeti</CardTitle>
                    <CardDescription>Son ölçümlerden değişim verileri</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {measurements.length >= 2 ? (
                      <div className="space-y-4">
                        <div className="py-2 border-b">
                          <Label>Son Ölçüm</Label>
                          <div className="flex items-center mt-1 space-x-2">
                            <span className="text-lg font-semibold">{measurements[0].weight} kg</span>
                            <span className="px-2 py-1 text-sm bg-blue-100 text-blue-700 rounded">BMI: {parseFloat(measurements[0].bmi).toFixed(1)}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{formatDate(measurements[0].date)}</p>
                        </div>
                        
                        <div className="py-2 border-b">
                          <Label>Önceki Ölçüm</Label>
                          <div className="flex items-center mt-1 space-x-2">
                            <span className="text-base font-medium">{measurements[1].weight} kg</span> 
                            <span className="px-2 py-0.5 text-sm bg-blue-50 text-blue-600 rounded">BMI: {parseFloat(measurements[1].bmi).toFixed(1)}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{formatDate(measurements[1].date)}</p>
                        </div>
                        
                        <div className="py-2">
                          <Label>Değişim</Label>
                          {(() => {
                            const weightChange = Number(measurements[0].weight) - Number(measurements[1].weight);
                            const bmiChange = Number(measurements[0].bmi) - Number(measurements[1].bmi);
                            
                            const isWeightReduced = weightChange < 0;
                            const isBmiReduced = bmiChange < 0;
                            const weightChangeAbs = Math.abs(weightChange);
                            const bmiChangeAbs = Math.abs(bmiChange);
                            
                            const daysDiff = Math.round((new Date(measurements[0].date).getTime() - new Date(measurements[1].date).getTime()) / (1000 * 60 * 60 * 24));
                            
                            return (
                              <div className="mt-1 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">Kilo:</span>
                                  <span className={`${isWeightReduced ? "text-green-600" : "text-red-600"} font-medium px-2 py-1 rounded-md ${isWeightReduced ? "bg-green-100" : "bg-red-100"}`}>
                                    {isWeightReduced ? "-" : "+"}{weightChangeAbs.toFixed(1)} kg
                                  </span>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">BMI:</span>
                                  <span className={`${isBmiReduced ? "text-green-600" : "text-red-600"} font-medium px-2 py-1 rounded-md ${isBmiReduced ? "bg-green-100" : "bg-red-100"}`}>
                                    {isBmiReduced ? "-" : "+"}{bmiChangeAbs.toFixed(1)} birim
                                  </span>
                                </div>
                                
                                {daysDiff > 0 && (
                                  <div className="flex items-center justify-between mt-2 pt-2 border-t">
                                    <span className="text-sm font-medium">Süre:</span>
                                    <span className="text-sm text-muted-foreground">{daysDiff} gün</span>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Karşılaştırma için en az 2 ölçüm gereklidir.</p>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Çevre Ölçümleri Değişim</CardTitle>
                    <CardDescription>Son ölçümlerden vücut çevresi değişimleri</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {measurements.length >= 2 ? (
                      <div className="space-y-4">
                        {(() => {
                          const circMetrics = [
                            { name: "Bel Çevresi", key: "waistCircumference" },
                            { name: "Kalça Çevresi", key: "hipCircumference" },
                            { name: "Göğüs Çevresi", key: "chestCircumference" },
                            { name: "Kol Çevresi", key: "armCircumference" },
                            { name: "Uyluk Çevresi", key: "thighCircumference" },
                            { name: "Baldır Çevresi", key: "calfCircumference" },
                          ];
                          
                          return circMetrics.map((metric) => {
                            const current = measurements[0][metric.key];
                            const previous = measurements[1][metric.key];
                            
                            if (!current || !previous) return null;
                            
                            const change = Number(current) - Number(previous);
                            const isReduced = change < 0;
                            
                            return (
                              <div key={metric.key} className="py-2 border-b last:border-0">
                                <Label>{metric.name}</Label>
                                <div className="flex justify-between items-center mt-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{previous} cm</span>
                                    <span className="text-muted-foreground">→</span>
                                    <span className="text-base font-semibold">{current} cm</span>
                                  </div>
                                  <span className={`${isReduced ? "text-green-600" : "text-red-600"} font-medium px-2 py-1 rounded-md bg-opacity-10 ${isReduced ? "bg-green-100" : "bg-red-100"}`}>
                                    {isReduced ? "" : "+"}{change.toFixed ? change.toFixed(1) : change} cm
                                  </span>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Karşılaştırma için en az 2 ölçüm gereklidir.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="measurements">
          {isMeasurementsLoading ? (
            <div className="flex justify-center items-center h-64">
              <p>Ölçüm verileri yükleniyor...</p>
            </div>
          ) : measurementsError ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-red-500">Hata: Ölçüm verileri yüklenemedi.</p>
            </div>
          ) : measurements.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-muted-foreground">Henüz ölçüm kaydı bulunmamaktadır.</p>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Tüm Ölçümler</CardTitle>
                <CardDescription>Tüm kaydedilen ölçüm bilgileri</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Görüntüleme seçenekleri" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tüm metrikler</SelectItem>
                        <SelectItem value="basic">Temel metrikler</SelectItem>
                        <SelectItem value="body">Vücut ölçümleri</SelectItem>
                        <SelectItem value="circumference">Çevre ölçümleri</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="py-3 px-4 text-left font-medium text-xs md:text-sm sticky left-0 bg-muted/50 z-10">Tarih</th>
                          <th className="py-3 px-4 text-left font-medium text-xs md:text-sm">Kilo (kg)</th>
                          <th className="py-3 px-4 text-left font-medium text-xs md:text-sm">BMI</th>
                          <th className="py-3 px-4 text-left font-medium text-xs md:text-sm">Vücut Yağı (%)</th>
                          <th className="py-3 px-4 text-left font-medium text-xs md:text-sm">Bel (cm)</th>
                          <th className="py-3 px-4 text-left font-medium text-xs md:text-sm">Kalça (cm)</th>
                          <th className="py-3 px-4 text-left font-medium text-xs md:text-sm">Göğüs (cm)</th>
                          <th className="py-3 px-4 text-left font-medium text-xs md:text-sm">Kol (cm)</th>
                          <th className="py-3 px-4 text-left font-medium text-xs md:text-sm">Uyluk (cm)</th>
                          <th className="py-3 px-4 text-left font-medium text-xs md:text-sm">Baldır (cm)</th>
                          <th className="py-3 px-4 text-left font-medium text-xs md:text-sm">Boy (cm)</th>
                          <th className="py-3 px-4 text-left font-medium text-xs md:text-sm">İşlemler</th>
                        </tr>
                      </thead>
                      <tbody>
                        {measurements.map((measurement, index) => {
                          // Bir önceki değer ile karşılaştırma için
                          const prevMeasurement = index < measurements.length - 1 ? measurements[index + 1] : null;
                          
                          // Değişim yönünü belirleyen fonksiyon
                          const getChangeDirection = (current: any, previous: any, isLowerBetter = true) => {
                            if (!current || !previous) return null;
                            const change = Number(current) - Number(previous);
                            const isReduced = change < 0;
                            
                            return {
                              improved: isLowerBetter ? isReduced : !isReduced,
                              change: Math.abs(change).toFixed(1)
                            };
                          };
                          
                          return (
                            <tr key={measurement.id} className="border-t hover:bg-muted/30 transition-colors">
                              <td className="py-3 px-4 text-sm font-medium sticky left-0 bg-white z-10">
                                {formatDate(measurement.date)}
                              </td>
                              
                              {/* Kilo */}
                              <td className="py-3 px-4 text-sm">
                                <div className="flex items-center">
                                  <span>{measurement.weight}</span>
                                  {prevMeasurement && (
                                    <>
                                      {(() => {
                                        const change = getChangeDirection(measurement.weight, prevMeasurement.weight);
                                        if (!change) return null;
                                        
                                        return (
                                          <span className={`ml-2 text-xs font-medium px-1.5 py-0.5 rounded ${change.improved ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}>
                                            {change.improved ? "-" : "+"}{change.change}
                                          </span>
                                        );
                                      })()}
                                    </>
                                  )}
                                </div>
                              </td>
                              
                              {/* BMI */}
                              <td className="py-3 px-4 text-sm">
                                <div className="flex items-center">
                                  <span>{measurement.bmi || "-"}</span>
                                  {prevMeasurement && measurement.bmi && prevMeasurement.bmi && (
                                    <>
                                      {(() => {
                                        const change = getChangeDirection(measurement.bmi, prevMeasurement.bmi);
                                        if (!change) return null;
                                        
                                        return (
                                          <span className={`ml-2 text-xs font-medium px-1.5 py-0.5 rounded ${change.improved ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}>
                                            {change.improved ? "-" : "+"}{change.change}
                                          </span>
                                        );
                                      })()}
                                    </>
                                  )}
                                </div>
                              </td>
                              
                              {/* Vücut Yağı */}
                              <td className="py-3 px-4 text-sm">
                                <div className="flex items-center">
                                  <span>{measurement.bodyFatPercentage || "-"}</span>
                                  {prevMeasurement && measurement.bodyFatPercentage && prevMeasurement.bodyFatPercentage && (
                                    <>
                                      {(() => {
                                        const change = getChangeDirection(measurement.bodyFatPercentage, prevMeasurement.bodyFatPercentage);
                                        if (!change) return null;
                                        
                                        return (
                                          <span className={`ml-2 text-xs font-medium px-1.5 py-0.5 rounded ${change.improved ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}>
                                            {change.improved ? "-" : "+"}{change.change}
                                          </span>
                                        );
                                      })()}
                                    </>
                                  )}
                                </div>
                              </td>
                              
                              {/* Bel */}
                              <td className="py-3 px-4 text-sm">
                                <div className="flex items-center">
                                  <span>{measurement.waistCircumference || "-"}</span>
                                  {prevMeasurement && measurement.waistCircumference && prevMeasurement.waistCircumference && (
                                    <>
                                      {(() => {
                                        const change = getChangeDirection(measurement.waistCircumference, prevMeasurement.waistCircumference);
                                        if (!change) return null;
                                        
                                        return (
                                          <span className={`ml-2 text-xs font-medium px-1.5 py-0.5 rounded ${change.improved ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}>
                                            {change.improved ? "-" : "+"}{change.change}
                                          </span>
                                        );
                                      })()}
                                    </>
                                  )}
                                </div>
                              </td>
                              
                              {/* Kalça */}
                              <td className="py-3 px-4 text-sm">
                                <div className="flex items-center">
                                  <span>{measurement.hipCircumference || "-"}</span>
                                  {prevMeasurement && measurement.hipCircumference && prevMeasurement.hipCircumference && (
                                    <>
                                      {(() => {
                                        const change = getChangeDirection(measurement.hipCircumference, prevMeasurement.hipCircumference);
                                        if (!change) return null;
                                        
                                        return (
                                          <span className={`ml-2 text-xs font-medium px-1.5 py-0.5 rounded ${change.improved ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}>
                                            {change.improved ? "-" : "+"}{change.change}
                                          </span>
                                        );
                                      })()}
                                    </>
                                  )}
                                </div>
                              </td>
                              
                              {/* Göğüs */}
                              <td className="py-3 px-4 text-sm">
                                <div className="flex items-center">
                                  <span>{measurement.chestCircumference || "-"}</span>
                                  {prevMeasurement && measurement.chestCircumference && prevMeasurement.chestCircumference && (
                                    <>
                                      {(() => {
                                        const change = getChangeDirection(measurement.chestCircumference, prevMeasurement.chestCircumference);
                                        if (!change) return null;
                                        
                                        return (
                                          <span className={`ml-2 text-xs font-medium px-1.5 py-0.5 rounded ${change.improved ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}>
                                            {change.improved ? "-" : "+"}{change.change}
                                          </span>
                                        );
                                      })()}
                                    </>
                                  )}
                                </div>
                              </td>
                              
                              {/* Kol */}
                              <td className="py-3 px-4 text-sm">
                                <div className="flex items-center">
                                  <span>{measurement.armCircumference || "-"}</span>
                                  {prevMeasurement && measurement.armCircumference && prevMeasurement.armCircumference && (
                                    <>
                                      {(() => {
                                        const change = getChangeDirection(measurement.armCircumference, prevMeasurement.armCircumference);
                                        if (!change) return null;
                                        
                                        return (
                                          <span className={`ml-2 text-xs font-medium px-1.5 py-0.5 rounded ${change.improved ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}>
                                            {change.improved ? "-" : "+"}{change.change}
                                          </span>
                                        );
                                      })()}
                                    </>
                                  )}
                                </div>
                              </td>
                              
                              {/* Uyluk */}
                              <td className="py-3 px-4 text-sm">
                                <div className="flex items-center">
                                  <span>{measurement.thighCircumference || "-"}</span>
                                  {prevMeasurement && measurement.thighCircumference && prevMeasurement.thighCircumference && (
                                    <>
                                      {(() => {
                                        const change = getChangeDirection(measurement.thighCircumference, prevMeasurement.thighCircumference);
                                        if (!change) return null;
                                        
                                        return (
                                          <span className={`ml-2 text-xs font-medium px-1.5 py-0.5 rounded ${change.improved ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}>
                                            {change.improved ? "-" : "+"}{change.change}
                                          </span>
                                        );
                                      })()}
                                    </>
                                  )}
                                </div>
                              </td>
                              
                              {/* Baldır */}
                              <td className="py-3 px-4 text-sm">
                                <div className="flex items-center">
                                  <span>{measurement.calfCircumference || "-"}</span>
                                  {prevMeasurement && measurement.calfCircumference && prevMeasurement.calfCircumference && (
                                    <>
                                      {(() => {
                                        const change = getChangeDirection(measurement.calfCircumference, prevMeasurement.calfCircumference);
                                        if (!change) return null;
                                        
                                        return (
                                          <span className={`ml-2 text-xs font-medium px-1.5 py-0.5 rounded ${change.improved ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}>
                                            {change.improved ? "-" : "+"}{change.change}
                                          </span>
                                        );
                                      })()}
                                    </>
                                  )}
                                </div>
                              </td>
                              
                              {/* Boy */}
                              <td className="py-3 px-4 text-sm">{measurement.height || "-"}</td>
                              
                              {/* İşlemler */}
                              <td className="py-3 px-4 text-sm">
                                <div className="flex gap-2">
                                  <button 
                                    className="text-xs text-blue-600 hover:text-blue-800"
                                    title="Ölçümü düzenle"
                                    onClick={() => {
                                      // Düzenleme için ölçümü seç
                                      setSelectedMeasurement(measurement);
                                      // Form değerlerini güvenli bir şekilde ayarla
                                      const safeNumericConversion = (value: any) => {
                                        if (value === null || value === undefined || value === "") return undefined;
                                        const parsed = Number(value);
                                        return isNaN(parsed) ? undefined : parsed;
                                      };
                                      
                                      // Edit formunu ayarla - güvenli dönüşümlerle
                                      editForm.reset({
                                        date: measurement.date || new Date().toISOString().split("T")[0],
                                        weight: safeNumericConversion(measurement.weight) || 0,
                                        height: safeNumericConversion(measurement.height) || 0,
                                        bodyFatPercentage: safeNumericConversion(measurement.bodyFatPercentage),
                                        waistCircumference: safeNumericConversion(measurement.waistCircumference),
                                        hipCircumference: safeNumericConversion(measurement.hipCircumference),
                                        chestCircumference: safeNumericConversion(measurement.chestCircumference),
                                        armCircumference: safeNumericConversion(measurement.armCircumference),
                                        thighCircumference: safeNumericConversion(measurement.thighCircumference),
                                        calfCircumference: safeNumericConversion(measurement.calfCircumference),
                                        activityLevel: measurement.activityLevel || "moderate",
                                        notes: measurement.notes || "",
                                      });
                                      // Dialogu aç
                                      setOpenEditMeasurementDialog(true);
                                    }}
                                  >
                                    Düzenle
                                  </button>
                                  <button 
                                    className="text-xs text-red-600 hover:text-red-800"
                                    title="Ölçümü sil"
                                    onClick={() => {
                                      if (confirm("Bu ölçümü silmek istediğinizden emin misiniz?")) {
                                        deleteMeasurementMutation.mutate({ measurementId: measurement.id });
                                      }
                                    }}
                                  >
                                    Sil
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}