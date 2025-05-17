import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
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
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Home, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const accessCodeSchema = z.object({
  accessCode: z.string().min(1, { message: 'Erişim kodu gereklidir' }).max(10)
});

type AccessCodeFormValues = z.infer<typeof accessCodeSchema>;

export default function ClientPortalLogin() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<AccessCodeFormValues>({
    resolver: zodResolver(accessCodeSchema),
    defaultValues: {
      accessCode: ''
    }
  });
  
  async function onSubmit(data: AccessCodeFormValues) {
    try {
      setIsLoading(true);
      const response = await apiRequest('POST', '/api/client-portal/login', { accessCode: data.accessCode });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Giriş yapılırken bir hata oluştu');
      }
      
      // Giriş başarılı, ana sayfaya yönlendir
      navigate('/client-portal/dashboard');
      
      toast({
        title: 'Giriş başarılı',
        description: 'Danışan portalına hoş geldiniz.',
      });
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: 'Giriş yapılamadı',
        description: error.message || 'Lütfen doğru erişim kodunu girdiğinizden emin olun.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 dark:from-slate-900 dark:via-blue-900 dark:to-slate-900 p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-100/20 to-transparent rounded-full animate-blob" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-emerald-100/20 to-transparent rounded-full animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-tr from-purple-100/20 to-transparent rounded-full animate-blob animation-delay-4000" />
      </div>

      <div className="absolute top-4 left-4 z-10">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => window.location.href = '/'} 
          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors duration-200"
        >
          <Home className="h-4 w-4" />
          <span>Ana Sayfaya Dön</span>
        </Button>
      </div>

      <Card className="w-full max-w-md relative backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardHeader className="space-y-1 text-center pb-6">
          <div className="mx-auto w-16 h-16 mb-4 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-2xl p-0.5 transform -rotate-6 hover:rotate-0 transition-transform duration-300">
            <div className="w-full h-full bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center transform rotate-6 hover:rotate-0 transition-transform duration-300">
              <User className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
            Danışan Portalı
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Diyetisyeninizin size verdiği erişim kodunu girin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="accessCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground">Erişim Kodu</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="6 haneli kodu giriniz" 
                        {...field} 
                        autoComplete="off"
                        className="text-center tracking-[0.5em] text-xl uppercase font-medium bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                        disabled={isLoading}
                        maxLength={6}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Giriş yapılıyor...
                  </>
                ) : (
                  'Giriş Yap'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-muted-foreground">
          <p>Erişim kodunuzu diyetisyeninizden alabilirsiniz.</p>
        </CardFooter>
      </Card>
    </div>
  );
}