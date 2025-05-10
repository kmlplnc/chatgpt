import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2, LogOut, User, LineChart, CalendarDays, Apple, MessageSquare } from 'lucide-react';

// Client Portal Layout
function ClientPortalLayout({ children }) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [clientInfo, setClientInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function fetchClientInfo() {
      try {
        const response = await apiRequest('GET', '/api/client-portal/me');
        
        if (!response.ok) {
          throw new Error('Oturum bilgileri alınamadı');
        }
        
        const data = await response.json();
        setClientInfo(data);
      } catch (error) {
        console.error('Error fetching client info:', error);
        navigate('/client-portal');
        toast({
          title: 'Giriş yapmanız gerekiyor',
          description: 'Lütfen erişim kodunuzla giriş yapın.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchClientInfo();
  }, [navigate, toast]);
  
  async function handleLogout() {
    try {
      await apiRequest('POST', '/api/client-portal/logout');
      navigate('/client-portal');
      toast({
        title: 'Çıkış yapıldı',
        description: 'Başarıyla çıkış yaptınız.',
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: 'Çıkış yapılırken hata oluştu',
        description: 'Lütfen tekrar deneyin.',
        variant: 'destructive',
      });
    }
  }
  
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img src="/assets/logo.png" alt="DietKEM Logo" className="w-8 h-8" />
            <h1 className="font-bold text-lg">Danışan Portalı</h1>
          </div>
          
          {clientInfo && (
            <div className="flex items-center space-x-4">
              <div className="text-sm font-medium">
                {clientInfo.firstName} {clientInfo.lastName}
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-1" />
                Çıkış
              </Button>
            </div>
          )}
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}

// Client Dashboard
export default function ClientDashboard() {
  const [measurements, setMeasurements] = useState([]);
  const [dietPlans, setDietPlans] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    async function fetchClientData() {
      try {
        setIsLoading(true);
        
        // Ölçümleri getir
        const measurementsResponse = await apiRequest('GET', '/api/client-portal/measurements');
        if (measurementsResponse.ok) {
          const measurementsData = await measurementsResponse.json();
          setMeasurements(measurementsData);
        }
        
        // Diyet planlarını getir
        const dietPlansResponse = await apiRequest('GET', '/api/client-portal/diet-plans');
        if (dietPlansResponse.ok) {
          const dietPlansData = await dietPlansResponse.json();
          setDietPlans(dietPlansData);
        }
        
        // Tavsiyeleri getir
        const recommendationsResponse = await apiRequest('GET', '/api/client-portal/recommendations');
        if (recommendationsResponse.ok) {
          const recommendationsData = await recommendationsResponse.json();
          setRecommendations(recommendationsData);
        }
      } catch (error) {
        console.error('Error fetching client data:', error);
        toast({
          title: 'Veri yüklenirken hata',
          description: 'Bilgileriniz yüklenirken bir sorun oluştu.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchClientData();
  }, [toast]);
  
  // Son ölçümü göster
  const lastMeasurement = measurements.length > 0 
    ? measurements[measurements.length - 1] 
    : null;
  
  return (
    <ClientPortalLayout>
      <h1 className="text-2xl font-bold mb-6">Hoş Geldiniz</h1>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs defaultValue="overview">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">
              <User className="h-4 w-4 mr-2" />
              Genel Bakış
            </TabsTrigger>
            <TabsTrigger value="measurements">
              <LineChart className="h-4 w-4 mr-2" />
              Ölçümlerim
            </TabsTrigger>
            <TabsTrigger value="diet-plans">
              <Apple className="h-4 w-4 mr-2" />
              Diyet Planım
            </TabsTrigger>
            <TabsTrigger value="recommendations">
              <MessageSquare className="h-4 w-4 mr-2" />
              Tavsiyeler
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Son Ölçümlerim</CardTitle>
                  <CardDescription>
                    {lastMeasurement ? (
                      <span>
                        {new Date(lastMeasurement.date).toLocaleDateString('tr-TR')} tarihli ölçüm
                      </span>
                    ) : (
                      'Henüz ölçüm bulunmuyor'
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {lastMeasurement ? (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Kilo</span>
                        <span className="font-medium">{lastMeasurement.weight} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Boy</span>
                        <span className="font-medium">{lastMeasurement.height} cm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Vücut Kitle İndeksi (BKİ)</span>
                        <span className="font-medium">{lastMeasurement.bmi}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bazal Metabolizma Hızı (BMH)</span>
                        <span className="font-medium">{lastMeasurement.bmr || '-'} kcal</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Günlük Enerji İhtiyacı</span>
                        <span className="font-medium">{lastMeasurement.totalDailyEnergyExpenditure || '-'} kcal</span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 text-center text-muted-foreground">
                      Henüz ölçüm kaydınız bulunmuyor.
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Diyet Planım</CardTitle>
                  <CardDescription>
                    {dietPlans.length > 0 ? (
                      <span>
                        {dietPlans.length} aktif diyet planınız var
                      </span>
                    ) : (
                      'Henüz diyet planı bulunmuyor'
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {dietPlans.length > 0 ? (
                    <div className="space-y-2">
                      {dietPlans.slice(0, 3).map((plan) => (
                        <div key={plan.id} className="pb-2">
                          <div className="font-medium">{plan.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {plan.description || 'Diyet planı açıklaması'}
                          </div>
                        </div>
                      ))}
                      {dietPlans.length > 3 && (
                        <Button variant="link" className="p-0 h-auto">
                          {dietPlans.length - 3} diğer planı görüntüle
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="py-4 text-center text-muted-foreground">
                      Diyetisyeniniz henüz bir diyet planı oluşturmamış.
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Diyetisyen Tavsiyeleri</CardTitle>
                  <CardDescription>
                    Sağlıklı yaşam için ipuçları
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recommendations.length > 0 ? (
                    <div className="space-y-2">
                      {recommendations.map((rec) => (
                        <div key={rec.id} className="pb-2">
                          <div className="font-medium">{rec.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {rec.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-4 text-center text-muted-foreground">
                      Henüz tavsiye bulunmuyor.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="measurements">
            <Card>
              <CardHeader>
                <CardTitle>Ölçümlerim</CardTitle>
                <CardDescription>
                  Diyetisyeniniz tarafından kaydedilen tüm ölçümleriniz
                </CardDescription>
              </CardHeader>
              <CardContent>
                {measurements.length > 0 ? (
                  <div className="rounded-md border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50 border-b">
                          <th className="font-medium p-2 text-left">Tarih</th>
                          <th className="font-medium p-2 text-left">Kilo (kg)</th>
                          <th className="font-medium p-2 text-left">Boy (cm)</th>
                          <th className="font-medium p-2 text-left">BKİ</th>
                          <th className="font-medium p-2 text-left">BMH (kcal)</th>
                          <th className="font-medium p-2 text-left">GDEI (kcal)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {measurements.map((measurement, index) => (
                          <tr key={measurement.id} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                            <td className="p-2">{new Date(measurement.date).toLocaleDateString('tr-TR')}</td>
                            <td className="p-2">{measurement.weight}</td>
                            <td className="p-2">{measurement.height}</td>
                            <td className="p-2">{measurement.bmi}</td>
                            <td className="p-2">{measurement.bmr || '-'}</td>
                            <td className="p-2">{measurement.totalDailyEnergyExpenditure || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-4 text-center text-muted-foreground">
                    Henüz ölçüm kaydınız bulunmuyor.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="diet-plans">
            <Card>
              <CardHeader>
                <CardTitle>Diyet Planım</CardTitle>
                <CardDescription>
                  Diyetisyeniniz tarafından oluşturulan diyet planları
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dietPlans.length > 0 ? (
                  <div className="space-y-6">
                    {dietPlans.map((plan) => (
                      <div key={plan.id} className="border rounded-lg p-4">
                        <h3 className="text-lg font-medium mb-2">{plan.name}</h3>
                        <p className="text-muted-foreground mb-4">{plan.description}</p>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Kalori Hedefi</h4>
                            <p className="font-medium">{plan.calorieGoal} kcal/gün</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-1">Diyet Tipi</h4>
                            <p className="font-medium">{plan.dietType || 'Standart'}</p>
                          </div>
                        </div>
                        
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Makro Besin Dağılımı</h4>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-xs">Protein</p>
                            <p className="font-medium">{plan.proteinPercentage}%</p>
                          </div>
                          <div>
                            <p className="text-xs">Karbonhidrat</p>
                            <p className="font-medium">{plan.carbsPercentage}%</p>
                          </div>
                          <div>
                            <p className="text-xs">Yağ</p>
                            <p className="font-medium">{plan.fatPercentage}%</p>
                          </div>
                        </div>
                        
                        <Separator className="my-4" />
                        
                        <div>
                          <h4 className="text-sm font-medium mb-2">Diyet İçeriği</h4>
                          <div className="prose prose-sm max-w-none text-foreground">
                            {plan.content ? (
                              <div dangerouslySetInnerHTML={{ __html: plan.content }} />
                            ) : (
                              <p className="text-muted-foreground">İçerik bulunmuyor.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    Diyetisyeniniz henüz bir diyet planı oluşturmamış.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="recommendations">
            <Card>
              <CardHeader>
                <CardTitle>Tavsiyeler</CardTitle>
                <CardDescription>
                  Diyetisyeniniz tarafından size özel tavsiyeler
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recommendations.length > 0 ? (
                  <div className="space-y-4">
                    {recommendations.map((rec) => (
                      <div key={rec.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <h3 className="text-lg font-medium">{rec.title}</h3>
                          <div className="text-xs text-muted-foreground">
                            {new Date(rec.createdAt).toLocaleDateString('tr-TR')}
                          </div>
                        </div>
                        <p className="mt-2">{rec.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    Henüz tavsiye bulunmuyor.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </ClientPortalLayout>
  );
}
