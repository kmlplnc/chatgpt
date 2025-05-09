import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
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
const registerFormSchema = z
  .object({
    username: z.string().min(3, 'Kullanıcı adı en az 3 karakter olmalıdır'),
    email: z.string().email('Geçerli bir e-posta adresi giriniz'),
    password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
    confirmPassword: z.string(),
    name: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Şifreler eşleşmiyor',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerFormSchema>;

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [_, navigate] = useLocation();
  const { toast } = useToast();

  // Form
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
    },
  });

  // Kayıt işlemi
  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);

    try {
      // confirmPassword'ü API'ye göndermeyelim
      const { confirmPassword, ...registerData } = data;

      const response = await apiRequest('POST', '/api/auth/register', registerData);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Kayıt başarısız');
      }

      const userData = await response.json();

      toast({
        title: 'Kayıt başarılı',
        description: 'Hesabınız oluşturuldu! Giriş yapabilirsiniz.',
      });

      // Giriş sayfasına yönlendir
      navigate('/login');
    } catch (error: any) {
      toast({
        title: 'Kayıt başarısız',
        description: error.message || 'Lütfen bilgilerinizi kontrol edin',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Kayıt Formu */}
      <div className="flex flex-1 items-center justify-center bg-white p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">DietKEM'e Kayıt Ol</CardTitle>
            <CardDescription>
              Hesap oluşturarak DietKEM'in tüm özelliklerine erişin
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-posta</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            type="email"
                            placeholder="E-posta adresinizi girin"
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
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ad Soyad (İsteğe bağlı)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Adınız ve soyadınızı girin"
                        />
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

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Şifre Tekrar</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            {...field}
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Şifrenizi tekrar girin"
                            className="pl-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-10 w-10 text-muted-foreground"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
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
                  {isLoading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
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
                    Zaten bir hesabınız var mı?
                  </span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <Button
                  variant="outline"
                  onClick={() => navigate('/login')}
                  className="w-full"
                >
                  Giriş Yap
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center text-sm text-muted-foreground">
            <p>
              Kayıt olarak <a href="/terms" className="underline hover:text-primary">Kullanım Koşullarını</a> kabul etmiş olursunuz
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
              <h2 className="text-2xl font-semibold mb-2">Abonelik Planları</h2>
              <p className="opacity-90">
                İhtiyaçlarınıza uygun abonelik planlarıyla diyetisyen uygulamanızı özelleştirin.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-2">Türkçe Destek</h2>
              <p className="opacity-90">
                Tamamen Türkçe arayüz ve besin veritabanı ile Türk diyetisyenlerine özel olarak tasarlandı.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-2">Gelişmiş Raporlama</h2>
              <p className="opacity-90">
                Danışanlarınız için ilerleme raporları oluşturun ve müşteri memnuniyetini artırın.
              </p>
            </div>
          </div>
        </div>

        <div className="text-sm opacity-70">
          Hemen kaydolun ve DietKEM'in profesyonel özelliklerini keşfedin.
        </div>
      </div>
    </div>
  );
}