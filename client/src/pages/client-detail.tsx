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
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import MeasurementChart from "@/components/clients/measurement-chart";
import { queryClient } from "@/lib/queryClient";
import { calculateBMI, formatDate } from "@/lib/utils";

// Measurement schema for the form
const measurementSchema = z.object({
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

export default function ClientDetail() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const [openNewMeasurementDialog, setOpenNewMeasurementDialog] = useState(false);
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
  
  // Form gönderim işlemi
  function onSubmit(data: MeasurementFormValues) {
    // BMI'ı otomatik hesapla
    const bmi = calculateBMI(data.weight, data.height);
    const measurementData = {
      ...data,
      clientId: Number(id),
      bmi: bmi.toString(), // Stringe dönüştür
      date: new Date().toISOString().split('T')[0] // Bugünün tarihi
    };
    
    addMeasurementMutation.mutate(measurementData);
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
              <MeasurementChart 
                measurements={measurements} 
                title="Gelişim Grafiği" 
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>BMI ve Kilogram Özeti</CardTitle>
                    <CardDescription>Son ölçümlerden değişim verileri</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {measurements.length >= 2 ? (
                      <div className="space-y-4">
                        <div>
                          <Label>Son Ölçüm</Label>
                          <p className="text-lg font-medium">{measurements[0].weight} kg | BMI: {measurements[0].bmi}</p>
                          <p className="text-sm text-muted-foreground">{formatDate(measurements[0].date)}</p>
                        </div>
                        <div>
                          <Label>Önceki Ölçüm</Label>
                          <p>{measurements[1].weight} kg | BMI: {measurements[1].bmi}</p>
                          <p className="text-sm text-muted-foreground">{formatDate(measurements[1].date)}</p>
                        </div>
                        <div>
                          <Label>Değişim</Label>
                          {(() => {
                            const weightChange = Number(measurements[0].weight) - Number(measurements[1].weight);
                            const bmiChange = Number(measurements[0].bmi) - Number(measurements[1].bmi);
                            const isWeightReduced = weightChange < 0;
                            
                            return (
                              <div>
                                <p className={`${isWeightReduced ? "text-green-600" : "text-red-600"} font-medium`}>
                                  {isWeightReduced ? "" : "+"}{weightChange.toFixed ? weightChange.toFixed(1) : weightChange} kg
                                </p>
                                <p className={`${bmiChange < 0 ? "text-green-600" : "text-red-600"}`}>
                                  BMI: {bmiChange < 0 ? "" : "+"}{bmiChange.toFixed ? bmiChange.toFixed(1) : bmiChange}
                                </p>
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
                          ];
                          
                          return circMetrics.map((metric) => {
                            const current = measurements[0][metric.key];
                            const previous = measurements[1][metric.key];
                            
                            if (!current || !previous) return null;
                            
                            const change = Number(current) - Number(previous);
                            const isReduced = change < 0;
                            
                            return (
                              <div key={metric.key}>
                                <Label>{metric.name}</Label>
                                <div className="flex justify-between">
                                  <span>{current} cm</span>
                                  <span className={`${isReduced ? "text-green-600" : "text-red-600"} font-medium`}>
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
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="py-3 px-4 text-left font-medium">Tarih</th>
                        <th className="py-3 px-4 text-left font-medium">Kilo (kg)</th>
                        <th className="py-3 px-4 text-left font-medium">BMI</th>
                        <th className="py-3 px-4 text-left font-medium">Bel (cm)</th>
                        <th className="py-3 px-4 text-left font-medium">Kalça (cm)</th>
                        <th className="py-3 px-4 text-left font-medium">Vücut Yağı (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {measurements.map((measurement) => (
                        <tr key={measurement.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">{formatDate(measurement.date)}</td>
                          <td className="py-3 px-4">{measurement.weight}</td>
                          <td className="py-3 px-4">{measurement.bmi || "-"}</td>
                          <td className="py-3 px-4">{measurement.waistCircumference || "-"}</td>
                          <td className="py-3 px-4">{measurement.hipCircumference || "-"}</td>
                          <td className="py-3 px-4">{measurement.bodyFatPercentage || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}