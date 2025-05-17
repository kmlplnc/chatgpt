import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Bell, Smartphone, Palette, Globe, CreditCard, Lock, HelpCircle, User, KeyRound, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function SettingsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("profile");
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    avatar: "",
  });
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") || "light";
    }
    return "light";
  });
  const [lang, setLang] = useState("tr");
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [appNotif, setAppNotif] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const tabList = [
    { value: "profile", label: "Profil", icon: <User className="w-4 h-4 mr-1" /> },
    { value: "notifications", label: "Bildirimler", icon: <Bell className="w-4 h-4 mr-1" /> },
    { value: "appearance", label: "Görünüm", icon: <Palette className="w-4 h-4 mr-1" /> },
    { value: "subscription", label: "Abonelik", icon: <CreditCard className="w-4 h-4 mr-1" /> },
    { value: "privacy", label: "Gizlilik", icon: <Lock className="w-4 h-4 mr-1" /> },
    { value: "help", label: "Yardım", icon: <HelpCircle className="w-4 h-4 mr-1" /> },
  ];

  useEffect(() => {
    if (user) {
      setProfile({
        firstName: user.name?.split(" ")[0] || "",
        lastName: user.name?.split(" ").slice(1).join(" ") || "",
        email: user.email || "",
        phone: (user as any).phone || "",
        avatar: (user as any).avatar || "",
      });
    }
  }, [user]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const root = window.document.documentElement;
      if (theme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
      localStorage.setItem("theme", theme);
    }
  }, [theme]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 animate-page-transition">
      <div className="w-full max-w-6xl mx-auto px-4 ml-8 md:ml-24">
        <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 dark:border-slate-800">
          <CardHeader className="dark:bg-slate-900 dark:text-white rounded-t-xl">
            <CardTitle className="text-2xl font-bold tracking-tight dark:text-white">Ayarlar</CardTitle>
            <CardDescription className="text-base dark:text-slate-300">Kişisel bilgilerinizi ve uygulama tercihlerinizi yönetin.</CardDescription>
          </CardHeader>
          <CardContent className="dark:bg-slate-900 dark:text-white rounded-b-xl">
            <Tabs value={tab} onValueChange={setTab} className="w-full">
              <TabsList className="mb-8 grid grid-cols-3 md:grid-cols-6 gap-2 bg-muted/50 rounded-lg p-1 dark:bg-slate-800 dark:border dark:border-slate-700">
                {tabList.map(t => (
                  <TabsTrigger key={t.value} value={t.value} className="flex items-center justify-center gap-1 py-2 px-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-white dark:text-slate-200">
                    {t.icon}{t.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Profil */}
              <TabsContent value="profile">
                <div className="flex flex-col gap-8">
                  <div className="flex items-center gap-6 bg-primary/5 rounded-xl p-6 shadow-sm dark:bg-slate-800">
                    <Avatar className="h-20 w-20 shadow-md">
                      {profile.avatar ? <AvatarImage src={profile.avatar} /> : <AvatarFallback className="bg-primary/20 text-primary font-bold text-2xl dark:bg-slate-700 dark:text-white">{profile.firstName[0]}{profile.lastName[0]}</AvatarFallback>}
                    </Avatar>
                    <div>
                      <Button size="sm" variant="outline" className="dark:bg-slate-700 dark:text-white dark:border-slate-600">Fotoğraf Yükle</Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input placeholder="Ad" value={profile.firstName} onChange={e => setProfile(p => ({ ...p, firstName: e.target.value }))} className="dark:bg-slate-800 dark:text-white dark:border-slate-700" />
                    <Input placeholder="Soyad" value={profile.lastName} onChange={e => setProfile(p => ({ ...p, lastName: e.target.value }))} className="dark:bg-slate-800 dark:text-white dark:border-slate-700" />
                    <Input placeholder="E-posta" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} className="dark:bg-slate-800 dark:text-white dark:border-slate-700" />
                    <Input placeholder="Telefon" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} className="dark:bg-slate-800 dark:text-white dark:border-slate-700" />
                  </div>
                  <div>
                    <Button className="w-full md:w-auto dark:bg-primary dark:text-white dark:hover:bg-primary/80">Kaydet</Button>
                  </div>
                  <div className="mt-4">
                    <button
                      className="flex items-center gap-2 text-primary font-semibold hover:underline focus:outline-none dark:text-blue-400"
                      onClick={() => setShowPassword(v => !v)}
                    >
                      <KeyRound className="w-4 h-4" /> Şifre Değiştir {showPassword ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {showPassword && (
                      <div className="animate-fade-in mt-4 bg-muted/50 rounded-lg p-4 shadow-inner dark:bg-slate-800">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Input type="password" placeholder="Mevcut Şifre" className="dark:bg-slate-800 dark:text-white dark:border-slate-700" />
                          <Input type="password" placeholder="Yeni Şifre" className="dark:bg-slate-800 dark:text-white dark:border-slate-700" />
                          <Input type="password" placeholder="Yeni Şifre (Tekrar)" className="dark:bg-slate-800 dark:text-white dark:border-slate-700" />
                        </div>
                        <Button className="mt-2 dark:bg-primary dark:text-white dark:hover:bg-primary/80">Şifreyi Güncelle</Button>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Bildirimler */}
              <TabsContent value="notifications">
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg dark:bg-slate-800">
                    <span className="flex items-center gap-2"><Mail className="w-4 h-4 text-primary" /> E-posta Bildirimleri</span>
                    <Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg dark:bg-slate-800">
                    <span className="flex items-center gap-2"><Smartphone className="w-4 h-4 text-primary" /> SMS Bildirimleri</span>
                    <Switch checked={smsNotif} onCheckedChange={setSmsNotif} />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg dark:bg-slate-800">
                    <span className="flex items-center gap-2"><Bell className="w-4 h-4 text-primary" /> Uygulama İçi Bildirimler</span>
                    <Switch checked={appNotif} onCheckedChange={setAppNotif} />
                  </div>
                </div>
              </TabsContent>

              {/* Görünüm */}
              <TabsContent value="appearance">
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg dark:bg-slate-800">
                    <span className="flex items-center gap-2"><Palette className="w-4 h-4 text-primary" /> Tema</span>
                    <select value={theme} onChange={e => setTheme(e.target.value)} className="border rounded px-2 py-1 dark:bg-slate-800 dark:text-white dark:border-slate-700">
                      <option value="light">Açık</option>
                      <option value="dark">Koyu</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg dark:bg-slate-800">
                    <span className="flex items-center gap-2"><Globe className="w-4 h-4 text-primary" /> Dil</span>
                    <select value={lang} onChange={e => setLang(e.target.value)} className="border rounded px-2 py-1 dark:bg-slate-800 dark:text-white dark:border-slate-700">
                      <option value="tr">Türkçe</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>
              </TabsContent>

              {/* Abonelik */}
              <TabsContent value="subscription">
                <div className="space-y-6">
                  <div className="p-4 bg-muted/50 rounded-lg dark:bg-slate-800">
                    <h3 className="font-semibold flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary" /> Mevcut Plan</h3>
                    <p className="mt-1">Ücretsiz (Free)</p>
                    <Button size="sm" className="mt-2 dark:bg-primary dark:text-white dark:hover:bg-primary/80">Planı Yükselt</Button>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg dark:bg-slate-800">
                    <h3 className="font-semibold flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary" /> Fatura Geçmişi</h3>
                    <p className="text-muted-foreground text-sm mt-1">Henüz fatura yok.</p>
                  </div>
                </div>
              </TabsContent>

              {/* Gizlilik */}
              <TabsContent value="privacy">
                <div className="space-y-6">
                  <div className="p-4 bg-muted/50 rounded-lg dark:bg-slate-800">
                    <h3 className="font-semibold flex items-center gap-2"><Trash2 className="w-4 h-4 text-destructive" /> Hesabı Sil</h3>
                    <p className="text-muted-foreground text-sm mb-2">Bu işlem geri alınamaz. Tüm verileriniz silinir.</p>
                    <Button variant="destructive">Hesabımı Sil</Button>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg dark:bg-slate-800">
                    <h3 className="font-semibold flex items-center gap-2"><Smartphone className="w-4 h-4 text-primary" /> Aktif Oturumlar</h3>
                    <p className="text-muted-foreground text-sm">Şu anki cihazınızda aktifsiniz. (Demo)</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg dark:bg-slate-800">
                    <h3 className="font-semibold flex items-center gap-2"><Lock className="w-4 h-4 text-primary" /> İki Faktörlü Doğrulama</h3>
                    <p className="text-muted-foreground text-sm">Yakında eklenecek.</p>
                  </div>
                </div>
              </TabsContent>

              {/* Yardım */}
              <TabsContent value="help">
                <div className="space-y-6">
                  <div className="p-4 bg-muted/50 rounded-lg dark:bg-slate-800">
                    <h3 className="font-semibold flex items-center gap-2"><HelpCircle className="w-4 h-4 text-primary" /> Sıkça Sorulan Sorular</h3>
                    <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1 mt-2 dark:text-slate-300">
                      <li><span className="font-medium text-foreground dark:text-white">Bilgilerim güvende mi?</span> Tüm verileriniz güvenli sunucularda saklanır.</li>
                      <li><span className="font-medium text-foreground dark:text-white">Şifremi unuttum, ne yapmalıyım?</span> Giriş ekranından "Şifremi Unuttum" seçeneğini kullanabilirsiniz.</li>
                      <li><span className="font-medium text-foreground dark:text-white">Abonelik nasıl yükseltilir?</span> Abonelik sekmesinden planınızı yükseltebilirsiniz.</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg dark:bg-slate-800">
                    <h3 className="font-semibold flex items-center gap-2"><Mail className="w-4 h-4 text-primary" /> Destek Talebi Oluştur</h3>
                    <Textarea placeholder="Sorununuzu kısaca açıklayın..." className="dark:bg-slate-800 dark:text-white dark:border-slate-700" />
                    <Button className="mt-2 dark:bg-primary dark:text-white dark:hover:bg-primary/80">Gönder</Button>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg dark:bg-slate-800">
                    <h3 className="font-semibold flex items-center gap-2"><Globe className="w-4 h-4 text-primary" /> Hakkında</h3>
                    <p className="text-muted-foreground text-sm dark:text-slate-300">DietKEM v1.0.0 &copy; 2024</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 