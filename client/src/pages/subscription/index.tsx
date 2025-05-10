import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Link, useLocation } from 'wouter';
import { CalendarClock, CheckCircle, Lock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SubscriptionPlans } from '@/components/auth/subscription-plans';
import { apiRequest } from '@/lib/queryClient';

export default function SubscriptionPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  // Fetch current user
  const { data: user, isLoading } = useQuery({ 
    queryKey: ['/api/auth/me'],
    staleTime: 1000 * 60
  });
  
  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };
  
  // Check subscription status
  const isActiveSubscription = user?.subscriptionStatus === 'active';
  const isCanceledSubscription = user?.subscriptionStatus === 'canceled';
  const isSubscriptionExpired = user?.subscriptionStatus === 'expired';
  
  // Get formatted dates
  const startDate = formatDate(user?.subscriptionStartDate);
  const endDate = formatDate(user?.subscriptionEndDate);
  
  // Handle plan purchase
  const handlePurchase = () => {
    // Plan seçilmediğinde bile devam et - ödeme sayfasında kontrol edilecek
    if (!user) {
      toast({
        title: "Hata",
        description: "Oturum açmanız gerekiyor",
        variant: "destructive"
      });
      return;
    }
    
    // Sadece plan seçilmediyse uyarı göster ama yine de ödeme sayfasına yönlendirebiliriz
    if (!selectedPlan) {
      toast({
        title: "Uyarı",
        description: "Devam etmeden önce bir abonelik planı seçmeniz önerilir",
        variant: "default"
      });
      return;
    }
    
    // Doğrudan ödeme sayfasına yönlendir (hata yakalama bloğuna gerek yok çünkü asenkron işlem yok)
    navigate(`/subscription/checkout?plan=${selectedPlan}`);
  };
  
  // Handle subscription cancellation
  const handleCancel = async () => {
    if (!user) return;
    
    try {
      await apiRequest("POST", "/api/subscription/cancel");
      
      toast({
        title: "Başarılı",
        description: "Aboneliğiniz başarıyla iptal edildi",
        variant: "default"
      });
      
      // Refresh page after cancellation
      window.location.reload();
    } catch (error) {
      console.error("Cancellation error:", error);
      toast({
        title: "Hata",
        description: "Abonelik iptali sırasında bir hata oluştu",
        variant: "destructive"
      });
    }
  };
  
  // If user is not logged in, show login prompt
  if (!isLoading && !user) {
    return (
      <div className="container mx-auto max-w-5xl py-8">
        <Alert className="mb-8">
          <Lock className="h-4 w-4" />
          <AlertTitle>Oturum açmanız gerekiyor</AlertTitle>
          <AlertDescription>
            Abonelik planlarını görüntülemek ve satın almak için lütfen oturum açın.
          </AlertDescription>
        </Alert>
        
        <div className="flex justify-center gap-4 mt-8">
          <Button asChild>
            <Link href="/login">Giriş Yap</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/register">Kayıt Ol</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto max-w-6xl py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Abonelik Planları</h1>
        <p className="text-muted-foreground">
          DietKEM'in sunduğu tüm özelliklere erişmek için aşağıdaki planlardan birini seçin
        </p>
      </div>
      
      {/* Current subscription info */}
      {user && (isActiveSubscription || isCanceledSubscription) && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarClock className="mr-2 h-5 w-5" />
              Mevcut Abonelik Durumu
            </CardTitle>
            <CardDescription>
              Abonelik bilgileriniz ve durumunuz aşağıda gösterilmektedir
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Durum:</p>
                <p className="flex items-center">
                  {isActiveSubscription ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                      <span className="text-green-600 font-medium">Aktif</span>
                    </>
                  ) : (
                    <span className="text-yellow-600 font-medium">İptal Edildi (Süre sonuna kadar kullanılabilir)</span>
                  )}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium">Plan:</p>
                <p className="font-medium capitalize">{user.subscriptionPlan}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium">Başlangıç Tarihi:</p>
                <p>{startDate}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium">Bitiş Tarihi:</p>
                <p>{endDate}</p>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              {isActiveSubscription && (
                <Button variant="destructive" onClick={handleCancel}>
                  Aboneliği İptal Et
                </Button>
              )}
              
              {isCanceledSubscription && (
                <div className="text-muted-foreground text-sm">
                  Aboneliğiniz süre sonunda otomatik olarak sona erecektir
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Subscription plans */}
      {(!isActiveSubscription || isSubscriptionExpired) && (
        <>
          <SubscriptionPlans onSelectPlan={(plan) => setSelectedPlan(plan)} selectedPlan={selectedPlan || undefined} />
          
          <div className="mt-8 flex justify-center">
            <Button size="lg" onClick={handlePurchase} disabled={!selectedPlan}>
              {isSubscriptionExpired ? 'Aboneliği Yenile' : 'Aboneliği Başlat'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}