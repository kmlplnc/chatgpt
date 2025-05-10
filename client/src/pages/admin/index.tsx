import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, LineChart, ShieldCheck, Settings } from "lucide-react";
import { useLocation } from "wouter";
import UserManagement from "./user-management";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("users");
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
        return (
          <Card>
            <CardHeader>
              <CardTitle>İstatistikler</CardTitle>
              <CardDescription>Sistem kullanım istatistikleri</CardDescription>
            </CardHeader>
            <CardContent>
              <p>İstatistik özellikleri geliştirme aşamasındadır.</p>
            </CardContent>
          </Card>
        );
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