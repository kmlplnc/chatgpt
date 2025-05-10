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
import { Loader2 } from 'lucide-react';

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
    } catch (error) {
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
    <div className="h-screen flex items-center justify-center bg-gradient-to-b from-background to-slate-50 dark:from-background dark:to-slate-900/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Danışan Portalı</CardTitle>
          <CardDescription>
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
                    <FormLabel>Erişim Kodu</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="6 haneli kodu giriniz" 
                        {...field} 
                        autoComplete="off"
                        className="text-center tracking-widest text-xl uppercase"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
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
