import React, { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { apiRequest, getQueryFn } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Activity, 
  Calendar, 
  ClipboardList, 
  User, 
  LogOut,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  ArrowLeft,
  MessageSquare
} from 'lucide-react';
import { 
  FaSmile, 
  FaSadTear, 
  FaMeh,
  FaArrowUp,
  FaArrowDown
} from 'react-icons/fa';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';

interface ClientData {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  client_visible_notes?: string;
  firstName?: string;
  lastName?: string;
}

interface Measurement {
  id: number;
  date: string;
  weight: string;
  height: string;
  bmi: string;
  basalMetabolicRate?: number;
  totalDailyEnergyExpenditure?: number;
  created_at: string;
}

interface Recommendation {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

export default function ClientPortalDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  
  // Debug log
  console.log('clientData:', clientData);
  console.log('measurements:', measurements);
  
  // Verileri yüklemek için bir fonksiyon tanımlayalım
  const fetchData = useCallback(async () => {
    try {
      // Fetch client data
      const clientResponse = await apiRequest('GET', '/api/client-portal/me');
      if (!clientResponse.ok) {
        if (clientResponse.status === 401) {
          // Oturum geçersiz, login sayfasına yönlendir
          navigate('/client-portal');
          return;
        }
        throw new Error('Danışan bilgileri alınamadı');
      }
      const clientData = await clientResponse.json();
      setClientData(clientData.client);

      // Fetch measurements
      const measurementsResponse = await apiRequest('GET', '/api/client-portal/measurements');
      if (measurementsResponse.ok) {
        const measurementsData = await measurementsResponse.json();
        setMeasurements(measurementsData);
      }

      // Fetch recommendations
      const recommendationsResponse = await apiRequest('GET', '/api/client-portal/recommendations');
      if (recommendationsResponse.ok) {
        const recommendationsData = await recommendationsResponse.json();
        setRecommendations(recommendationsData);
      }

      // Fetch appointments
      const appointmentsResponse = await apiRequest('GET', '/api/appointments?clientPortal=1');
      if (appointmentsResponse.ok) {
        const appointmentsData = await appointmentsResponse.json();
        setAppointments(appointmentsData);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching client data:', error);
      if (error instanceof Error && error.message.includes('401')) {
        // Oturum geçersiz, login sayfasına yönlendir
        navigate('/client-portal');
        return;
      }
      toast({
        title: 'Hata',
        description: 'Veriler yüklenirken bir hata oluştu. Lütfen tekrar giriş yapın.',
        variant: 'destructive',
      });
      navigate('/client-portal');
    }
  }, [navigate, toast]);

  // Sayfa ilk yüklendiğinde verileri getir
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Her 30 saniyede bir verileri otomatik güncelle
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchData();
    }, 30000); // 30 saniyede bir güncelle
    
    // Component unmount olduğunda intervali temizle
    return () => clearInterval(intervalId);
  }, [fetchData]);

  const handleLogout = async () => {
    try {
      const response = await apiRequest('POST', '/api/client-portal/logout');
      if (response.ok) {
        toast({
          title: 'Çıkış yapıldı',
          description: 'Başarıyla çıkış yaptınız.',
        });
        navigate('/client-portal');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: 'Hata',
        description: 'Çıkış yapılırken bir hata oluştu.',
        variant: 'destructive',
      });
    }
  };

  // Format a date string to a more readable format
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };
  
  // Kilo değişimini hesapla ve durum emojisini göster
  const getWeightChangeStatus = (measurements: Measurement[]) => {
    if (measurements.length < 2) return { icon: <FaMeh className="text-yellow-500" />, trend: 'stable', change: 0 };
    
    // Ölçümleri tarih sırasına göre sırala (en yeni ilk)
    const sortedMeasurements = [...measurements].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    // En son iki ölçümü al
    const latest = sortedMeasurements[0];
    const previous = sortedMeasurements[1];
    
    // Kilo değişimini hesapla
    const latestWeight = parseFloat(latest.weight);
    const previousWeight = parseFloat(previous.weight);
    const change = latestWeight - previousWeight;
    
    // Değişim oranını hesapla (yüzde olarak)
    const changePercent = (change / previousWeight) * 100;
    
    if (change < -0.5) {
      // Kilo verme durumu (olumlu)
      return { 
        icon: <FaSmile className="text-green-500 text-xl" />, 
        trend: 'down',
        trendIcon: <FaArrowDown className="text-green-500" />,
        change: Math.abs(change).toFixed(2),
        percent: Math.abs(changePercent).toFixed(1)
      };
    } else if (change > 0.5) {
      // Kilo alma durumu (olumsuz)
      return { 
        icon: <FaSadTear className="text-red-500 text-xl" />, 
        trend: 'up',
        trendIcon: <FaArrowUp className="text-red-500" />,
        change: change.toFixed(2),
        percent: changePercent.toFixed(1)
      };
    } else {
      // Değişim yok veya çok az
      return { 
        icon: <FaMeh className="text-yellow-500 text-xl" />, 
        trend: 'stable',
        change: 0
      };
    }
  };
  
  // BKI değişimini hesapla ve durum emojisini göster
  const getBmiChangeStatus = (measurements: Measurement[]) => {
    if (measurements.length < 2) return { icon: <FaMeh className="text-yellow-500" />, trend: 'stable', change: 0 };
    
    // Ölçümleri tarih sırasına göre sırala (en yeni ilk)
    const sortedMeasurements = [...measurements].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    // En son iki ölçümü al
    const latest = sortedMeasurements[0];
    const previous = sortedMeasurements[1];
    
    // BKI değişimini hesapla
    const latestBmi = parseFloat(latest.bmi);
    const previousBmi = parseFloat(previous.bmi);
    const change = latestBmi - previousBmi;
    
    // Değişim oranını hesapla (yüzde olarak)
    const changePercent = (change / previousBmi) * 100;
    
    // İdeal BKI aralığı: 18.5 - 24.9
    const isCurrentBmiHealthy = latestBmi >= 18.5 && latestBmi <= 24.9;
    
    if (change < -0.3) {
      // BKI düşme durumu
      return { 
        icon: isCurrentBmiHealthy ? <FaSmile className="text-green-500 text-xl" /> : <FaMeh className="text-yellow-500 text-xl" />, 
        trend: 'down',
        trendIcon: <FaArrowDown className={isCurrentBmiHealthy ? "text-green-500" : "text-yellow-500"} />,
        change: Math.abs(change).toFixed(2),
        percent: Math.abs(changePercent).toFixed(1)
      };
    } else if (change > 0.3) {
      // BKI artma durumu
      return { 
        icon: isCurrentBmiHealthy ? <FaMeh className="text-yellow-500 text-xl" /> : <FaSadTear className="text-red-500 text-xl" />, 
        trend: 'up',
        trendIcon: <FaArrowUp className={isCurrentBmiHealthy ? "text-yellow-500" : "text-red-500"} />,
        change: change.toFixed(2),
        percent: changePercent.toFixed(1)
      };
    } else {
      // Değişim yok veya çok az
      return { 
        icon: isCurrentBmiHealthy ? <FaSmile className="text-green-500 text-xl" /> : <FaMeh className="text-yellow-500 text-xl" />, 
        trend: 'stable',
        trendIcon: null,
        change: 0,
        percent: '0'
      };
    }
  };

  // Yaklaşan randevuyu bul
  const now = new Date();
  const upcomingAppointments = appointments
    ?.filter((a: any) => a.startTime && new Date(a.startTime) > now)
    .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  const nextAppointment = upcomingAppointments?.[0];

  // Renk ve animasyon state
  let appointmentColor = {
    panel: "bg-gradient-to-r from-green-200 via-green-100 to-green-50 border-l-8 border-green-500",
    icon: "text-green-600",
    title: "text-green-800",
    subtitle: "text-green-900",
    date: "text-green-700",
    location: "text-green-600"
  };
  if (nextAppointment && nextAppointment.startTime) {
    const diffMs = new Date(nextAppointment.startTime).getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 2) {
      appointmentColor = {
        panel: "bg-gradient-to-r from-red-200 via-red-100 to-red-50 border-l-8 border-red-500",
        icon: "text-red-600",
        title: "text-red-800",
        subtitle: "text-red-900",
        date: "text-red-700",
        location: "text-red-600"
      };
    } else if (diffDays <= 6) {
      appointmentColor = {
        panel: "bg-gradient-to-r from-yellow-200 via-yellow-100 to-yellow-50 border-l-8 border-yellow-500",
        icon: "text-yellow-600",
        title: "text-yellow-800",
        subtitle: "text-yellow-900",
        date: "text-yellow-700",
        location: "text-yellow-600"
      };
    }
  }
  const [showPulse, setShowPulse] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setShowPulse(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  // Tavsiyeleri manuel yenilemek için fonksiyon
  const refreshRecommendations = async () => {
    try {
      const recommendationsResponse = await apiRequest('GET', '/api/client-portal/recommendations');
      if (recommendationsResponse.ok) {
        const recommendationsData = await recommendationsResponse.json();
        setRecommendations(recommendationsData);
      }
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Tavsiyeler güncellenemedi',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-background flex flex-col">
        <header className="border-b">
          <div className="container mx-auto py-4">
            <Skeleton className="h-8 w-48" />
          </div>
        </header>
        <main className="container mx-auto py-6 flex-1">
          <Skeleton className="h-12 w-64 mb-6" />
          <div className="grid gap-6">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[300px] w-full" />
          </div>
        </main>
      </div>
    );
  }

  // Ölçümleri tarihe göre artan şekilde sırala (en eski başta, en yeni sonda)
  const sortedMeasurements = measurements.slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const latestMeasurement = sortedMeasurements[sortedMeasurements.length - 1] || null;
  const previousMeasurement = sortedMeasurements[sortedMeasurements.length - 2] || null;

  const firstName = clientData?.first_name || "";
  const lastName = clientData?.last_name || "";

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-8 pt-20 pb-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            Hoş Geldiniz, {firstName} {lastName}
          </h1>
          <p className="text-muted-foreground mt-1">
            Sağlıklı yaşam yolculuğunuzu takip edin
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/client-portal/messages')}
            className="relative flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
          >
            <MessageSquare className="h-4 w-4" />
            Mesajlar
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLogout}
            className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
          >
            <LogOut className="h-4 w-4" />
            Çıkış Yap
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-[200px] rounded-xl" />
          <Skeleton className="h-[200px] rounded-xl" />
          <Skeleton className="h-[200px] rounded-xl" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
            <Card className="bg-white/80 dark:bg-slate-900/80 border-slate-200/50 dark:border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-500" />
                  Kişisel Bilgiler
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm text-muted-foreground">Ad Soyad</Label>
                    <p className="font-medium">
                      {clientData?.first_name || clientData?.firstName || "-"} {clientData?.last_name || clientData?.lastName || "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">E-posta</Label>
                    <p className="font-medium">{clientData?.email || "-"}</p>
                  </div>
                  {clientData?.client_visible_notes && (
                    <div>
                      <Label className="text-sm text-muted-foreground">Notlar</Label>
                      <p className="text-sm text-muted-foreground">{clientData?.client_visible_notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-900/80 border-slate-200/50 dark:border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-blue-500" />
                  Mevcut Durum
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold">{latestMeasurement?.weight} kg / {latestMeasurement?.height} cm</p>
                    {measurements.length > 1 && (
                      <div className="flex items-center gap-1">
                        {getWeightChangeStatus(measurements).icon}
                      </div>
                    )}
                  </div>
                  {measurements.length > 1 && (
                    <div className="flex items-center gap-1 mt-2 text-sm">
                      {getWeightChangeStatus(measurements).trendIcon}
                      <span className={getWeightChangeStatus(measurements).trend === 'down' ? 'text-green-500' : getWeightChangeStatus(measurements).trend === 'up' ? 'text-red-500' : 'text-yellow-500'}>
                        {getWeightChangeStatus(measurements).trend === 'stable' 
                          ? 'Değişim yok' 
                          : getWeightChangeStatus(measurements).trend === 'down'
                            ? `-${getWeightChangeStatus(measurements).change} kg (%${getWeightChangeStatus(measurements).percent})`
                            : `+${getWeightChangeStatus(measurements).change} kg (%${getWeightChangeStatus(measurements).percent})`
                        }
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Ölçüm: {formatDate(latestMeasurement?.date || '')}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-900/80 border-slate-200/50 dark:border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  Vücut Kitle İndeksi (BKİ)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold">{latestMeasurement?.bmi}</p>
                    {measurements.length > 1 && (
                      <div className="flex items-center gap-1">
                        {getBmiChangeStatus(measurements).icon}
                      </div>
                    )}
                  </div>
                  {measurements.length > 1 && (
                    <div className="flex items-center gap-1 mt-2 text-sm">
                      {getBmiChangeStatus(measurements).trendIcon}
                      <span className={
                        getBmiChangeStatus(measurements).trend === 'down' && parseFloat(latestMeasurement?.bmi || '0') < 25 && parseFloat(latestMeasurement?.bmi || '0') > 18.5
                          ? 'text-green-500' 
                          : getBmiChangeStatus(measurements).trend === 'up' && parseFloat(latestMeasurement?.bmi || '0') > 25
                            ? 'text-red-500' 
                            : 'text-yellow-500'
                      }>
                        {getBmiChangeStatus(measurements).trend === 'stable' 
                          ? 'Değişim yok' 
                          : getBmiChangeStatus(measurements).trend === 'down'
                            ? `-${getBmiChangeStatus(measurements).change} (%${getBmiChangeStatus(measurements).percent})`
                            : `+${getBmiChangeStatus(measurements).change} (%${getBmiChangeStatus(measurements).percent})`
                        }
                      </span>
                    </div>
                  )}
                  <div className="mt-2 text-xs">
                    {parseFloat(latestMeasurement?.bmi || '0') < 18.5 && (
                      <span className="text-yellow-500">Düşük (Zayıf)</span>
                    )}
                    {parseFloat(latestMeasurement?.bmi || '0') >= 18.5 && parseFloat(latestMeasurement?.bmi || '0') < 25 && (
                      <span className="text-green-500">Normal</span>
                    )}
                    {parseFloat(latestMeasurement?.bmi || '0') >= 25 && parseFloat(latestMeasurement?.bmi || '0') < 30 && (
                      <span className="text-yellow-500">Fazla Kilolu</span>
                    )}
                    {parseFloat(latestMeasurement?.bmi || '0') >= 30 && (
                      <span className="text-red-500">Obez</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ölçüm: {formatDate(latestMeasurement?.date || '')}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-900/80 border-slate-200/50 dark:border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-blue-500" />
                  Bazal Metabolizma Hızı (BMH)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-2xl font-bold">
                      {latestMeasurement?.basalMetabolicRate != null
                        ? Number(latestMeasurement.basalMetabolicRate).toFixed(0)
                        : "N/A"} kcal
                    </p>
                    {measurements.length > 1 && (
                      <div className="flex items-center gap-1 mt-2 text-sm">
                        {measurements[0].basalMetabolicRate && measurements[1].basalMetabolicRate && (
                          <>
                            {measurements[0].basalMetabolicRate > measurements[1].basalMetabolicRate ? (
                              <>
                                <TrendingUp className="h-4 w-4 text-green-500" />
                                <span className="text-green-500">
                                  +{(measurements[0].basalMetabolicRate - measurements[1].basalMetabolicRate).toFixed(0)} kcal
                                </span>
                              </>
                            ) : measurements[0].basalMetabolicRate < measurements[1].basalMetabolicRate ? (
                              <>
                                <TrendingDown className="h-4 w-4 text-yellow-500" />
                                <span className="text-yellow-500">
                                  -{(measurements[1].basalMetabolicRate - measurements[0].basalMetabolicRate).toFixed(0)} kcal
                                </span>
                              </>
                            ) : (
                              <span className="text-muted-foreground">Değişim yok</span>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Ölçüm: {formatDate(latestMeasurement?.date || '')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Yaklaşan Randevu Paneli */}
            {Array.isArray(upcomingAppointments) && upcomingAppointments.length > 0 && nextAppointment && (
              <Card className={`rounded-3xl min-h-[80px] flex items-center shadow-2xl transition-all duration-500 border-0 ${showPulse ? 'animate-pulse' : ''} ${appointmentColor.panel} col-span-2`}>
                <div className="mr-8 ml-6 flex-shrink-0">
                  <Calendar className={`w-10 h-10 ${showPulse ? 'animate-bounce' : ''} ${appointmentColor.icon}`} />
                </div>
                <div className="py-4">
                  <div className={`font-extrabold text-xl mb-2 tracking-wide ${appointmentColor.title}`}>Yaklaşan Randevu</div>
                  <div className={`text-lg font-bold mb-1 ${appointmentColor.subtitle}`}>{nextAppointment.title}</div>
                  <div className={`text-base mb-1 ${appointmentColor.date}`}>{formatDate(nextAppointment.startTime)} - {nextAppointment.time || (nextAppointment.startTime ? new Date(nextAppointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "")}</div>
                  <div className={`text-sm ${appointmentColor.location}`}>{nextAppointment.location}</div>
                </div>
              </Card>
            )}
          </div>

          {/* Measurement History */}
          <div className="grid gap-4 md:grid-cols-2 mb-8">
            <Card className="bg-white/80 dark:bg-slate-900/80 border-slate-200/50 dark:border-slate-700/50 col-span-2">
              <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-blue-500" />
                  Ölçüm Geçmişi
                </CardTitle>
                <CardDescription>Son ölçümleriniz ve değişimler</CardDescription>
              </CardHeader>
              <CardContent>
                {measurements.length > 0 ? (
                  <div className="rounded-lg overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">Tarih</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">Ağırlık (kg)</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">Boy (cm)</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">BKİ</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">BMH (kcal)</th>
                            <th className="text-left p-3 text-sm font-medium text-muted-foreground">Durum</th>
                          </tr>
                        </thead>
                        <tbody>
                          {measurements
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map((measurement, index, arr) => {
                              const bmi = parseFloat(measurement.bmi);
                              let bmiStatus;
                              if (bmi < 18.5) {
                                bmiStatus = <span className="text-yellow-500 flex items-center"><FaMeh className="mr-1" /> Zayıf</span>;
                              } else if (bmi >= 18.5 && bmi < 25) {
                                bmiStatus = <span className="text-green-500 flex items-center"><FaSmile className="mr-1" /> Normal</span>;
                              } else if (bmi >= 25 && bmi < 30) {
                                bmiStatus = <span className="text-yellow-500 flex items-center"><FaMeh className="mr-1" /> Fazla Kilolu</span>;
                              } else {
                                bmiStatus = <span className="text-red-500 flex items-center"><FaSadTear className="mr-1" /> Obez</span>;
                              }
                              
                              let changeIndicator = null;
                              if (index < arr.length - 1) {
                                const nextMeasurement = arr[index + 1];
                                const weightDiff = parseFloat(measurement.weight) - parseFloat(nextMeasurement.weight);
                                
                                if (weightDiff < -0.5) {
                                  changeIndicator = <span className="text-green-500 flex items-center text-xs"><FaArrowDown className="mr-1" /> {Math.abs(weightDiff).toFixed(1)} kg</span>;
                                } else if (weightDiff > 0.5) {
                                  changeIndicator = <span className="text-red-500 flex items-center text-xs"><FaArrowUp className="mr-1" /> {weightDiff.toFixed(1)} kg</span>;
                                }
                              }
                              
                              return (
                                <tr key={measurement.id} className="border-t border-slate-200/50 dark:border-slate-700/50">
                                  <td className="p-3 text-sm">{formatDate(measurement.date)}</td>
                                  <td className="p-3 text-sm">
                                    <div className="flex flex-col">
                                      <span>{measurement.weight}</span>
                                      {changeIndicator && (
                                        <span className="mt-1">{changeIndicator}</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-3 text-sm">{measurement.height}</td>
                                  <td className="p-3 text-sm">{measurement.bmi}</td>
                                  <td className="p-3 text-sm">{measurement.basalMetabolicRate || "-"}</td>
                                  <td className="p-3 text-sm">{bmiStatus}</td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    Henüz ölçüm kaydı bulunamadı.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Randevu Bilgileri */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="bg-white/80 dark:bg-slate-900/80 border-slate-200/50 dark:border-slate-700/50 col-span-full">
              <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  Randevu Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Array.isArray(upcomingAppointments) && upcomingAppointments.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingAppointments.map((appt, idx) => (
                      <div key={appt.id || idx} className="border border-slate-200 rounded-xl px-4 py-3 bg-white shadow-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-blue-700">{appt.type}</span>
                          <span className="text-xs text-muted-foreground">{formatDate(appt.startTime)}</span>
                          <span className="text-xs text-muted-foreground">{appt.time || (appt.startTime ? new Date(appt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "")}</span>
                        </div>
                        {appt.notes && <div className="text-xs text-slate-600 mt-1">{appt.notes}</div>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Yaklaşan randevunuz bulunmuyor.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tavsiyeler */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="bg-white/80 dark:bg-slate-900/80 border-slate-200/50 dark:border-slate-700/50 col-span-full">
              <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-green-500" />
                  Tavsiyeler
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Array.isArray(clientData?.client_visible_notes) ? (
                  clientData.client_visible_notes.length > 0 ? (
                    <div className="space-y-3">
                      {clientData.client_visible_notes.map((note: any, idx: number) => {
                        const noteContent = typeof note === 'string' ? note : note.content;
                        const noteDate = typeof note === 'object' && note.created_at ? note.created_at : null;
                        return (
                          <div key={idx} className="border border-slate-200 rounded-xl px-5 py-4 shadow-md bg-white">
                            <span className="text-base font-medium tracking-tight break-words">{noteContent}</span>
                            {noteDate && (
                              <span className="block text-xs mt-2 text-muted-foreground">{new Date(noteDate).toLocaleString('tr-TR')}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Henüz diyetisyeninizden bir tavsiye eklenmemiş.</p>
                  )
                ) : clientData?.client_visible_notes ? (
                  <div className="border border-slate-200 rounded-xl px-5 py-4 shadow-md bg-white">
                    <span className="text-base font-medium tracking-tight break-words">
                      {typeof clientData.client_visible_notes === 'object' && clientData.client_visible_notes !== null && 'content' in (clientData.client_visible_notes as any)
                        ? (clientData.client_visible_notes as any).content
                        : clientData.client_visible_notes}
                    </span>
                    {typeof clientData.client_visible_notes === 'object' && clientData.client_visible_notes !== null && 'created_at' in (clientData.client_visible_notes as any) && (clientData.client_visible_notes as any).created_at && (
                      <span className="block text-xs mt-2 text-muted-foreground">{new Date((clientData.client_visible_notes as any).created_at).toLocaleString('tr-TR')}</span>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Henüz diyetisyeninizden bir tavsiye eklenmemiş.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}