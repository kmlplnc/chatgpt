import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { CheckCircle2, CreditCard, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Layout from '@/components/layout/layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

// Ödeme formu şeması
const paymentFormSchema = z.object({
  cardNumber: z.string().min(16, "Kart numarası en az 16 karakter olmalıdır").max(19, "Kart numarası en fazla 19 karakter olmalıdır"),
  cardHolder: z.string().min(3, "Kart sahibi adı en az 3 karakter olmalıdır"),
  expiryDate: z.string().min(5, "Geçerlilik tarihi MM/YY formatında olmalıdır").max(5, "Geçerlilik tarihi MM/YY formatında olmalıdır"),
  cvv: z.string().min(3, "CVV en az 3 karakter olmalıdır").max(4, "CVV en fazla 4 karakter olmalıdır"),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

export default function CheckoutPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  // window.location.search kullanarak URL parametrelerini al
  const params = new URLSearchParams(window.location.search);
  const planFromUrl = params.get('plan');
  
  // Debug için plan değerini konsola yazdır
  console.log("Checkout page plan değeri:", planFromUrl);
  console.log("Tam URL:", window.location.href);
  console.log("URL search params:", window.location.search);
  
  // Plan seçilmemişse ve sayfa yeni yükleniyorsa anasayfaya yönlendir
  useEffect(() => {
    if (!planFromUrl) {
      toast({
        title: "Hata",
        description: "Abonelik planı seçilmedi. Lütfen önce bir plan seçin.",
        variant: "destructive"
      });
      
      // Kısa bir gecikme ile yönlendir (toast'un görünmesine izin ver)
      setTimeout(() => {
        navigate('/subscription');
      }, 1500);
    }
  }, []);
  
  // Kullanıcı bilgilerini getir
  const { data: user, isLoading } = useQuery({ 
    queryKey: ['/api/auth/me'],
    staleTime: 1000 * 60
  });
  
  // Ödeme formu
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      cardNumber: "",
      cardHolder: "",
      expiryDate: "",
      cvv: "",
    },
  });
  
  const handleCreditCardPayment = async (values: PaymentFormValues) => {
    // Plan kontrolü
    if (!planFromUrl) {
      toast({
        title: "Hata",
        description: "Abonelik planı seçilmedi. Abonelik sayfasına yönlendiriliyorsunuz.",
        variant: "destructive",
      });
      setTimeout(() => window.location.href = '/subscription', 1500);
      return;
    }

    // Gerçek bir ödeme sistemi olmadığından, simüle ediyoruz
    setIsSubmitting(true);
    
    try {
      // Ödeme işlemini simüle et (sadece 300ms bekle - kullanıcı deneyimini hızlandırmak için)
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      // Plan parametresi ile abonelik oluştur
      await apiRequest("POST", "/api/subscription/create", { plan: planFromUrl });
      
      // Başarılı ödeme
      setIsSuccess(true);
      
      toast({
        title: "Ödeme başarılı",
        description: "Aboneliğiniz başarıyla aktifleştirildi",
        variant: "default",
      });
      
      // 1 saniye sonra ana sayfaya yönlendir
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (error) {
      console.error("Ödeme hatası:", error);
      toast({
        title: "Ödeme hatası",
        description: "Ödeme işlemi sırasında bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Kart numarası formatı
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  // Tarih formatı
  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
  };

  // Input change handlers
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    form.setValue("cardNumber", formatted);
  };

  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiryDate(e.target.value);
    form.setValue("expiryDate", formatted);
  };
  
  // Ödeme başarı durumunu gösterip ana sayfaya yönlendiriyoruz
  if (isSuccess) {
    return (
      <Layout>
        <div className="container mx-auto max-w-3xl py-12">
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-green-100 p-3">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-center text-2xl">Ödeme Başarılı</CardTitle>
              <CardDescription className="text-center">
                Aboneliğiniz başarıyla aktifleştirildi.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="mb-6 text-muted-foreground">
                Artık DietKEM'in tüm premium özelliklerine erişebilirsiniz.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button onClick={() => navigate("/")}>
                Ana Sayfaya Dön
              </Button>
            </CardFooter>
          </Card>
        </div>
      </Layout>
    );
  }
  
  // Yükleniyor ekranı
  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto max-w-3xl py-12 flex justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }
  
  // Kullanıcı giriş yapmamışsa veya seçili plan yoksa
  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto max-w-3xl py-12">
          <Card>
            <CardHeader>
              <CardTitle>Giriş Yapmanız Gerekiyor</CardTitle>
              <CardDescription>
                Abonelik işlemi yapabilmek için önce giriş yapmanız gerekmektedir.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="outline" onClick={() => navigate("/login")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Giriş Yap
              </Button>
            </CardFooter>
          </Card>
        </div>
      </Layout>
    );
  }
  
  // Plan parametresi yoksa
  if (!planFromUrl) {
    // Plan belirtilmemiş, bir plan seçmeye yönlendir
    return (
      <Layout>
        <div className="container mx-auto max-w-3xl py-12">
          <Card>
            <CardHeader>
              <CardTitle>Plan Seçilmedi</CardTitle>
              <CardDescription>
                Önce bir abonelik planı seçmeniz gerekmektedir.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="outline" onClick={() => navigate("/subscription")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Abonelik Planlarını Görüntüle
              </Button>
            </CardFooter>
          </Card>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container mx-auto max-w-3xl py-12">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate("/subscription")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Abonelik Planlarına Dön
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Ödeme İşlemi</CardTitle>
            <CardDescription>
              Abonelik planınız için ödeme bilgilerinizi girin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Satın Alma Detayları</h3>
              <div className="bg-muted p-4 rounded-md">
                <div className="flex justify-between mb-2">
                  <span>Plan:</span>
                  <span className="font-medium capitalize">{planFromUrl}</span>
                </div>
                {planFromUrl === "basic" && (
                  <div className="flex justify-between">
                    <span>Tutar:</span>
                    <span className="font-medium">₺199.00</span>
                  </div>
                )}
                {planFromUrl === "pro" && (
                  <div className="flex justify-between">
                    <span>Tutar:</span>
                    <span className="font-medium">₺349.00</span>
                  </div>
                )}
                {planFromUrl === "premium" && (
                  <div className="flex justify-between">
                    <span>Tutar:</span>
                    <span className="font-medium">₺599.00</span>
                  </div>
                )}
              </div>
            </div>
            
            <Tabs defaultValue="card">
              <TabsList className="grid w-full grid-cols-1">
                <TabsTrigger value="card" className="flex items-center">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Kredi Kartı
                </TabsTrigger>
              </TabsList>
              <TabsContent value="card" className="pt-4">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleCreditCardPayment)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="cardNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kart Numarası</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="0000 0000 0000 0000" 
                              {...field} 
                              onChange={handleCardNumberChange}
                              maxLength={19}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="cardHolder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kart Sahibi</FormLabel>
                          <FormControl>
                            <Input placeholder="Ad Soyad" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="expiryDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Son Kullanma Tarihi</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="AA/YY" 
                                {...field} 
                                onChange={handleExpiryDateChange}
                                maxLength={5}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="cvv"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CVV</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="123" 
                                {...field} 
                                maxLength={4}
                                type="password"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="pt-4">
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="mr-2 animate-spin w-4 h-4 border-2 border-t-transparent rounded-full" />
                            İşleniyor...
                          </>
                        ) : (
                          'Ödemeyi Tamamla'
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Bu bir demo uygulamasıdır. Gerçek ödeme işlemi gerçekleştirilmeyecektir.</p>
          <p>Herhangi bir kart bilgisi girebilirsiniz, ödeme simüle edilecektir.</p>
        </div>
      </div>
    </Layout>
  );
}