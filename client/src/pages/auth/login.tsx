import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Lock, User, Sparkles, ChevronRight, LineChart, Users, Apple } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// Form şeması
const loginFormSchema = z.object({
  username: z.string().min(3, 'Kullanıcı adı en az 3 karakter olmalıdır'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [_, navigate] = useLocation();
  const { login, isAuthenticated, isLoading, error } = useAuth();
  const { toast } = useToast();

  // Kullanıcı zaten giriş yapmışsa ana sayfaya yönlendir
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Form
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  // Giriş işlemi
  const onSubmit = async (data: LoginFormValues) => {
    await login(data.username, data.password);
  };

  // Özellik kartı bileşeni
  const FeatureCard = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
    <div className="flex items-start space-x-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm transition-all duration-300 hover:bg-white/20 hover:scale-105">
      <div className="flex-shrink-0">
        <div className="p-2 rounded-lg bg-white/20">
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-lg mb-1">{title}</h3>
        <p className="text-sm opacity-90">{description}</p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* Giriş Formu */}
      <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <Card className="w-full max-w-md border-none shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm animate-fade-up">
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-3xl font-serif">DietKEM</CardTitle>
            </div>
            <CardDescription className="text-base">
              Profesyonel diyet yönetim platformuna hoş geldiniz
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Kullanıcı Adı</FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                          <Input
                            {...field}
                            placeholder="Kullanıcı adınızı girin"
                            className="pl-10 h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20 transition-all"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Şifre</FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                          <Input
                            {...field}
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Şifrenizi girin"
                            className="pl-10 h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20 transition-all"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-10 w-10 text-muted-foreground hover:text-primary transition-colors"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full h-10 bg-primary hover:bg-primary/90 text-white transition-all duration-300 hover:scale-[1.02]" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin size-4 border-2 border-current border-t-transparent rounded-full"></div>
                      <span>Giriş yapılıyor...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span>Giriş Yap</span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-slate-900 px-2 text-muted-foreground">
                    Hesabınız yok mu?
                  </span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <Button
                  variant="outline"
                  onClick={() => navigate('/register')}
                  className="w-full h-10 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300"
                >
                  Yeni Hesap Oluştur
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center text-sm text-muted-foreground">
            <p>
              DietKEM &copy; {new Date().getFullYear()}
            </p>
          </CardFooter>
        </Card>
      </div>

      {/* Yan panel - Bilgi */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-between p-12 bg-gradient-to-br from-primary via-primary/90 to-primary-foreground text-white overflow-hidden relative">
        {/* Arkaplan efekti */}
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,.2)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] opacity-20"></div>
        
        <div className="relative mx-auto max-w-xl">
          <div className="mb-12 space-y-4">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-medium">Profesyonel Diyet Yönetim Platformu</span>
            </div>
            <h1 className="text-5xl font-serif font-bold">DietKEM ile Danışan Takibi Artık Çok Kolay</h1>
            <p className="text-xl opacity-90">
              Türkiye'nin en kapsamlı diyet yönetim platformu ile tanışın
            </p>
          </div>

          <div className="space-y-6">
            <FeatureCard
              icon={Users}
              title="Kapsamlı Danışan Takibi"
              description="İlerleme grafiklerini görüntüleyin, ölçümleri takip edin ve beslenme programlarını kolayca yönetin."
            />
            <FeatureCard
              icon={LineChart}
              title="Detaylı Analiz ve Raporlar"
              description="Danışanlarınızın gelişimini grafikler ve detaylı raporlarla takip edin."
            />
            <FeatureCard
              icon={Apple}
              title="Zengin Besin Veritabanı"
              description="Binlerce besinin detaylı besin değeri bilgilerine anında erişin."
            />
          </div>
        </div>

        <div className="relative text-sm opacity-70">
          <p>Tüm hakları saklıdır &copy; DietKEM {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
}