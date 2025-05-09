import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SubscriptionPlans from "@/components/auth/subscription-plans";

export default function SubscriptionPage() {
  // Fetch current user's subscription status
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  return (
    <div className="container py-10 max-w-7xl mx-auto">
      <div className="mb-10 text-center">
        <div className="mb-4 inline-flex items-center justify-center p-2 bg-primary/10 rounded-full text-primary">
          <Crown className="h-6 w-6 mr-2" />
          <span className="text-sm font-medium">DietKEM Premium</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          Abonelik Planları
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          DietKEM'in tüm özelliklerine erişim için abonelik planlarımızdan birini seçin.
          Profesyonel diyet danışmanlığınız için ihtiyacınız olan tüm araçlar burada.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : user?.subscriptionStatus === "active" ? (
        <div className="space-y-8">
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Crown className="h-5 w-5 mr-2 text-green-600" />
                Aktif Abonelik
              </CardTitle>
              <CardDescription>
                {user.subscriptionPlan === "basic" && "Başlangıç Planı"}
                {user.subscriptionPlan === "pro" && "Profesyonel Plan"}
                {user.subscriptionPlan === "premium" && "Premium Plan"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Aboneliğiniz {new Date(user.subscriptionEndDate).toLocaleDateString('tr-TR')} tarihine kadar aktiftir.
              </p>
              <div className="flex gap-4">
                <Button variant="outline">Aboneliği Yönet</Button>
                <Button variant="outline" className="text-destructive border-destructive">
                  Aboneliği İptal Et
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-6">Diğer Planlar</h2>
            <SubscriptionPlans currentPlan={user.subscriptionPlan} />
          </div>
        </div>
      ) : (
        <SubscriptionPlans />
      )}

      <div className="mt-16 bg-muted/50 p-8 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Sık Sorulan Sorular</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-bold mb-2">Aboneliğimi ne zaman iptal edebilirim?</h3>
            <p className="text-muted-foreground">
              Aboneliğinizi istediğiniz zaman iptal edebilirsiniz. İptal ettiğinizde mevcut dönem sonuna kadar tüm özelliklere erişiminiz devam eder.
            </p>
          </div>
          <div>
            <h3 className="font-bold mb-2">Planlar arasında geçiş yapabilir miyim?</h3>
            <p className="text-muted-foreground">
              Evet, istediğiniz zaman üst düzey bir plana yükseltme yapabilirsiniz. Alt düzey bir plana geçiş ise mevcut abonelik süreniz sonunda gerçekleşir.
            </p>
          </div>
          <div>
            <h3 className="font-bold mb-2">Deneme süresi var mı?</h3>
            <p className="text-muted-foreground">
              Şu anda tüm yeni üyeler için 14 günlük ücretsiz deneme süresi sunuyoruz. Deneme süresi içinde tüm özelliklere erişebilirsiniz.
            </p>
          </div>
          <div>
            <h3 className="font-bold mb-2">Ödeme bilgilerim güvende mi?</h3>
            <p className="text-muted-foreground">
              Tüm ödeme işlemleri güvenli bir şekilde gerçekleştirilir. Kredi kartı bilgileriniz sistemimizde saklanmaz, tüm ödeme işlemleri güvenli ödeme altyapımız üzerinden yapılır.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}