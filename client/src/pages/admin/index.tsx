import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, LineChart, ShieldCheck, Settings, UserPlus, CreditCard, UserCheck, Calendar } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import UserManagement from "./user-management";
import { apiRequest } from "@/lib/queryClient";

// Admin İstatistikler Bileşeni
function AdminStats() {
  // Tüm kullanıcıları getir
  const { data: users = [] } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/users");
      return response.json();
    }
  });

  // İstatistikler
  const totalUsers = users.length;
  const activeSubscriptions = users.filter(user => user.subscriptionStatus === "active").length;
  const trialSubscriptions = users.filter(user => user.subscriptionStatus === "trial").length;
  const premiumPlans = users.filter(user => user.subscriptionPlan === "premium").length;
  const proPlans = users.filter(user => user.subscriptionPlan === "pro").length;
  const basicPlans = users.filter(user => user.subscriptionPlan === "basic").length;
  
  // Son 30 günde eklenen kullanıcılar
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newUsers = users.filter(user => new Date(user.createdAt) > thirtyDaysAgo).length;
  
  // Son hafta eklenen kullanıcılar
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const lastWeekUsers = users.filter(user => new Date(user.createdAt) > sevenDaysAgo).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Kullanıcı</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">Kayıtlı tüm kullanıcılar</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Abonelik</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground mt-1">Aktif aboneliği olan kullanıcılar</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yeni Kullanıcı</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">Son 30 günde kaydolan</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Premium Paketler</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{premiumPlans + proPlans}</div>
            <p className="text-xs text-muted-foreground mt-1">Premium veya Pro paket</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Abonelik Dağılımı</CardTitle>
          <CardDescription>Kullanıcıların abonelik planlarına göre dağılımı</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-primary mr-2"></span>
                  <span>Pro Plan</span>
                </div>
                <span className="font-medium">{proPlans} kullanıcı</span>
              </div>
              <Progress value={(proPlans / totalUsers) * 100} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                  <span>Premium Plan</span>
                </div>
                <span className="font-medium">{premiumPlans} kullanıcı</span>
              </div>
              <Progress value={(premiumPlans / totalUsers) * 100} className="h-2 bg-blue-200" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                  <span>Basic Plan</span>
                </div>
                <span className="font-medium">{basicPlans} kullanıcı</span>
              </div>
              <Progress value={(basicPlans / totalUsers) * 100} className="h-2 bg-green-200" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-gray-300 mr-2"></span>
                  <span>Ücretsiz</span>
                </div>
                <span className="font-medium">{totalUsers - premiumPlans - proPlans - basicPlans} kullanıcı</span>
              </div>
              <Progress value={((totalUsers - premiumPlans - proPlans - basicPlans) / totalUsers) * 100} className="h-2 bg-gray-200" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Haftalık Kayıtlar</CardTitle>
            <CardDescription>Son 7 günde kaydolan kullanıcılar</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="text-5xl font-bold">{lastWeekUsers}</div>
            <p className="text-sm text-muted-foreground mt-2">Yeni kullanıcı</p>
          </CardContent>
          <CardFooter className="bg-muted/50 p-3">
            <div className="text-center w-full text-sm text-muted-foreground">
              {new Date(sevenDaysAgo).toLocaleDateString('tr-TR')} - {new Date().toLocaleDateString('tr-TR')}
            </div>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Abonelik Durumu</CardTitle>
            <CardDescription>Kullanıcıların abonelik durumları</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                <span className="text-sm">Aktif</span>
              </div>
              <div className="font-medium">{activeSubscriptions} kullanıcı</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                <span className="text-sm">Deneme</span>
              </div>
              <div className="font-medium">{trialSubscriptions} kullanıcı</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>
                <span className="text-sm">Süresi Dolmuş</span>
              </div>
              <div className="font-medium">{users.filter(user => user.subscriptionStatus === "expired").length} kullanıcı</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                <span className="text-sm">İptal Edilmiş</span>
              </div>
              <div className="font-medium">{users.filter(user => user.subscriptionStatus === "canceled").length} kullanıcı</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("stats");
  const [_, setLocation] = useLocation();

  // Admin yetkisi kontrolü
  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle className="text-center text-destructive">Yetkisiz Erişim</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "users":
        return <UserManagement />;
      case "stats":
        return <AdminStats />;
      case "security":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Güvenlik</CardTitle>
              <CardDescription>Sistem güvenlik ayarları</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Güvenlik özellikleri geliştirme aşamasındadır.</p>
            </CardContent>
          </Card>
        );
      case "settings":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Genel Ayarlar</CardTitle>
              <CardDescription>Sistem ayarları ve yapılandırma</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Ayar özellikleri geliştirme aşamasındadır.</p>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-3xl">Yönetim Paneli</CardTitle>
          <CardDescription>
            Sistem yönetimi ve kullanıcı kontrolü için gelişmiş yönetici araçları
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 gap-4">
          <TabsTrigger value="users" className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>Kullanıcılar</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-1">
            <LineChart className="w-4 h-4" />
            <span>İstatistikler</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Güvenlik</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-1">
            <Settings className="w-4 h-4" />
            <span>Ayarlar</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab}>
          {renderTabContent()}
        </TabsContent>
      </Tabs>
    </div>
  );
}