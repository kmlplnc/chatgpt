import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
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
import { 
  BarChart, 
  Activity, 
  Calendar, 
  ClipboardList, 
  User, 
  LogOut 
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ClientData {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
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

  useEffect(() => {
    async function fetchData() {
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
    }

    fetchData();
  }, [navigate, toast]);

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
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b">
        <div className="container mx-auto py-4 px-4 md:px-6 flex justify-between items-center">
          <h1 className="text-xl font-semibold">Danışan Portalı</h1>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Çıkış Yap
          </Button>
        </div>
      </header>

      <main className="container mx-auto py-6 px-4 md:px-6 flex-1">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold">
              Hoşgeldiniz, {clientData?.firstName} {clientData?.lastName}
            </h2>
            <p className="text-muted-foreground mt-1">
              Bu sayfadan sağlık verilerinizi takip edebilirsiniz.
            </p>
          </div>
        </div>

        <Tabs defaultValue="summary" className="space-y-6">
          <TabsList>
            <TabsTrigger value="summary">
              <Activity className="h-4 w-4 mr-2" />
              Özet
            </TabsTrigger>
            <TabsTrigger value="measurements">
              <BarChart className="h-4 w-4 mr-2" />
              Ölçümler
            </TabsTrigger>
            <TabsTrigger value="recommendations">
              <ClipboardList className="h-4 w-4 mr-2" />
              Tavsiyeler
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mevcut Durum</CardTitle>
                <CardDescription>
                  En son ölçüm sonuçlarınız ve sağlık verileriniz
                </CardDescription>
              </CardHeader>
              <CardContent>
                {latestMeasurement ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <h3 className="text-sm font-medium">Boy / Kilo</h3>
                      </div>
                      <div className="mt-3">
                        <p className="text-2xl font-bold">{latestMeasurement.weight} kg / {latestMeasurement.height} cm</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Ölçüm: {formatDate(latestMeasurement.date)}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                      <div className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-muted-foreground" />
                        <h3 className="text-sm font-medium">Vücut Kitle İndeksi (BKİ)</h3>
                      </div>
                      <div className="mt-3">
                        <p className="text-2xl font-bold">{latestMeasurement.bmi}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Ölçüm: {formatDate(latestMeasurement.date)}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                      <div className="flex items-center gap-2">
                        <BarChart className="h-5 w-5 text-muted-foreground" />
                        <h3 className="text-sm font-medium">Bazal Metabolizma Hızı (BMH)</h3>
                      </div>
                      <div className="mt-3">
                        <p className="text-2xl font-bold">
                          {latestMeasurement.basalMetabolicRate || "N/A"} kcal
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Ölçüm: {formatDate(latestMeasurement.date)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">Henüz ölçüm kaydı bulunamadı.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Son Tavsiyeler</CardTitle>
                <CardDescription>
                  Diyetisyeninizin son tavsiyeleri
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recommendations.length > 0 ? (
                  <div className="space-y-4">
                    {recommendations.slice(0, 2).map(recommendation => (
                      <div key={recommendation.id} className="p-4 border rounded-lg">
                        <h3 className="font-medium">{recommendation.title}</h3>
                        <p className="text-sm text-muted-foreground mt-2">
                          {recommendation.content}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDate(recommendation.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">Henüz tavsiye bulunamadı.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="measurements" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ölçümler</CardTitle>
                <CardDescription>
                  Tüm ölçüm kayıtlarınız ve zaman içindeki değişim
                </CardDescription>
              </CardHeader>
              <CardContent>
                {measurements.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted">
                          <th className="text-left p-3 text-sm font-medium">Tarih</th>
                          <th className="text-left p-3 text-sm font-medium">Ağırlık (kg)</th>
                          <th className="text-left p-3 text-sm font-medium">Boy (cm)</th>
                          <th className="text-left p-3 text-sm font-medium">BKİ</th>
                          <th className="text-left p-3 text-sm font-medium">BMH (kcal)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {measurements
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((measurement, index) => (
                          <tr key={measurement.id} className={index % 2 === 0 ? "bg-card" : "bg-muted/30"}>
                            <td className="p-3 text-sm">{formatDate(measurement.date)}</td>
                            <td className="p-3 text-sm">{measurement.weight}</td>
                            <td className="p-3 text-sm">{measurement.height}</td>
                            <td className="p-3 text-sm">{measurement.bmi}</td>
                            <td className="p-3 text-sm">{measurement.basalMetabolicRate || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">Henüz ölçüm kaydı bulunamadı.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Diyetisyen Tavsiyeleri</CardTitle>
                <CardDescription>
                  Diyetisyeninizin size özel sağlık ve beslenme tavsiyeleri
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recommendations.length > 0 ? (
                  <div className="space-y-6">
                    {recommendations.map(recommendation => (
                      <div key={recommendation.id} className="p-4 border rounded-lg">
                        <h3 className="text-lg font-semibold">{recommendation.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatDate(recommendation.createdAt)}
                        </p>
                        <Separator className="my-3" />
                        <p className="text-sm">{recommendation.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">Henüz tavsiye bulunamadı.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t py-4 text-center text-sm text-muted-foreground">
        <div className="container mx-auto px-4 md:px-6">
          DietKEM Danışan Portalı &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}