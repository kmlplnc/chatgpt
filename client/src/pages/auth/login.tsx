import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
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

  return (
    <div className="flex min-h-screen">
      {/* Giriş Formu */}
      <div className="flex flex-1 items-center justify-center bg-white p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">DietKEM'e Giriş Yap</CardTitle>
            <CardDescription>
              Hesabınıza giriş yaparak diyet yönetim sisteminize erişin
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
                      <FormLabel>Kullanıcı Adı</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            placeholder="Kullanıcı adınızı girin"
                            className="pl-10"
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
                      <FormLabel>Şifre</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Şifrenizi girin"
                            className="pl-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-10 w-10 text-muted-foreground"
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

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                </Button>
              </form>
            </Form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">
                    Hesabınız yok mu?
                  </span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <Button
                  variant="outline"
                  onClick={() => navigate('/register')}
                  className="w-full"
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
      <div className="hidden bg-gradient-to-br from-primary to-primary-foreground lg:flex lg:flex-1 lg:flex-col lg:justify-between p-8 text-white">
        <div className="mx-auto max-w-md">
          <div className="mb-8">
            <h1 className="text-4xl font-bold">DietKEM</h1>
            <p className="text-lg mt-2 opacity-90">Profesyonel Diyet Yönetim Platformu</p>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Diyetisyenler için Tasarlandı</h2>
              <p className="opacity-90">
                Türkçe besin veritabanı ve gelişmiş analiz araçlarıyla danışanlarınız için en iyi diyet planlarını oluşturun.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-2">Kapsamlı Danışan Takibi</h2>
              <p className="opacity-90">
                İlerleme grafiklerini görüntüleyin, ölçümleri takip edin ve beslenme programlarını kolayca yönetin.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-2">Detaylı Besin Bilgileri</h2>
              <p className="opacity-90">
                Besinlerin makro ve mikro besin değerleri hakkında kapsamlı bilgilerle danışanlarınıza en doğru şekilde yardımcı olun.
              </p>
            </div>
          </div>
        </div>

        <div className="text-sm opacity-70">
          Tüm özelliklere erişmek için abonelik planlarımızı inceleyin.
        </div>
      </div>
    </div>
  );
}