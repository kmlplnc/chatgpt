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
  firstName: string;
  lastName: string;
  email: string;
  clientVisibleNotes?: string;
}

interface Measurement {
  id: number;
  date: string;
  weight: string;
  height: string;
  bmi: string;
  basalMetabolicRate?: number;
  totalDailyEnergyExpenditure?: number;
  createdAt: string;
}

interface Recommendation {
  id: number;
  title: string;
  content: string;
  createdAt: string;
}

export default function ClientPortalDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  
  // Verileri yüklemek için bir fonksiyon tanımlayalım
  const fetchData = useCallback(async () => {
    try {
      // Fetch client data
      const clientResponse = await apiRequest('GET', '/api/client-portal/me');
      if (!clientResponse.ok) {
        throw new Error('Danışan bilgileri alınamadı');
      }
      const clientData = await clientResponse.json();
      setClientData(clientData);

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

      setLoading(false);
    } catch (error) {
      console.error('Error fetching client data:', error);
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
  
  // Her 10 saniyede bir verileri otomatik güncelle
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchData();
    }, 10000); // 10 saniyede bir güncelle
    
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
    const date = new Date(dateStr);
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
        trendIcon: null,
        change: 0,
        percent: '0'
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

  const latestMeasurement = measurements.length > 0 
    ? measurements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              Hoş Geldiniz, {clientData?.firstName || 'Danışan'}
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
                      <p className="font-medium">{clientData?.firstName} {clientData?.lastName}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">E-posta</Label>
                      <p className="font-medium">{clientData?.email}</p>
                    </div>
                    {clientData?.clientVisibleNotes && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Notlar</Label>
                        <p className="text-sm text-muted-foreground">{clientData.clientVisibleNotes}</p>
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
                        {latestMeasurement?.basalMetabolicRate ? latestMeasurement.basalMetabolicRate.toFixed(0) : "N/A"} kcal
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

            {/* Recommendations */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recommendations.map(recommendation => (
                <Card key={recommendation.id} className="bg-white/80 dark:bg-slate-900/80 border-slate-200/50 dark:border-slate-700/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-medium">{recommendation.title}</CardTitle>
                      <span className="text-xs text-muted-foreground">{formatDate(recommendation.createdAt)}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{recommendation.content}</p>
                  </CardContent>
                </Card>
              ))}
              {recommendations.length === 0 && (
                <Card className="bg-white/80 dark:bg-slate-900/80 border-slate-200/50 dark:border-slate-700/50 col-span-full">
                  <CardContent className="text-center py-6">
                    <p className="text-muted-foreground">Henüz tavsiye bulunamadı.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}