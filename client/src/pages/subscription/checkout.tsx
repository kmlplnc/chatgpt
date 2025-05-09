import React, { useState, useEffect } from "react";
import { useLocation, useRoute, Link } from "wouter";
import { ArrowLeft, CreditCard, CheckCircle } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SUBSCRIPTION_PLANS } from "@/components/auth/subscription-plans";

export default function CheckoutPage() {
  const [, params] = useRoute("/subscription/checkout?:query");
  const queryParams = new URLSearchParams(params?.query);
  const planId = queryParams.get("plan") || "pro";
  const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId) || SUBSCRIPTION_PLANS[1]; // Default to Pro
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    cardHolderName: "",
    expireMonth: "",
    expireYear: "",
    cvc: ""
  });
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!cardDetails.cardNumber.trim() || 
        !cardDetails.cardHolderName.trim() || 
        !cardDetails.expireMonth.trim() || 
        !cardDetails.expireYear.trim() || 
        !cardDetails.cvc.trim()) {
      toast({
        title: "Hata",
        description: "Lütfen tüm alanları doldurun.",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Bu bir demo, gerçek ödeme işlemi bulunmuyor
      // Normalde burada apiRequest ile ödeme işlemi gerçekleştirilir
      // await apiRequest("POST", "/api/subscription/create", { planId, cardDetails });
      
      // Demo amaçlı 2 saniye bekletelim
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsSuccessful(true);
      
      // Demo amaçlı 3 saniye sonra anasayfaya yönlendirelim
      setTimeout(() => {
        navigate("/");
      }, 3000);
      
    } catch (error) {
      toast({
        title: "Hata",
        description: "Ödeme işlemi sırasında bir hata oluştu. Lütfen tekrar deneyin.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCardDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="container py-10 max-w-3xl mx-auto">
      <div className="mb-10">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/subscription" className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Abonelik Planlarına Geri Dön
          </Link>
        </Button>
        
        <h1 className="text-3xl font-bold tracking-tight mb-4">
          Ödeme
        </h1>
        <p className="text-muted-foreground">
          {plan.name} planını seçtiniz. Aylık ₺{plan.price} ödeyerek DietKEM'in tüm özelliklerine erişim sağlayacaksınız.
        </p>
      </div>
      
      {isSuccessful ? (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Ödeme Başarılı!</h2>
            <p className="mb-6">
              {plan.name} planına başarıyla abone oldunuz. Artık DietKEM'in tüm özelliklerine erişebilirsiniz.
            </p>
            <p className="text-sm text-muted-foreground">
              Anasayfaya yönlendiriliyorsunuz...
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-8 md:grid-cols-5">
          <div className="md:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Ödeme Bilgileri
                </CardTitle>
                <CardDescription>
                  Bu bir demo sayfasıdır. Gerçek ödeme alınmayacaktır.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="cardHolderName">Kart Üzerindeki İsim</Label>
                      <Input
                        id="cardHolderName"
                        name="cardHolderName"
                        placeholder="Ad Soyad"
                        value={cardDetails.cardHolderName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="cardNumber">Kart Numarası</Label>
                      <Input
                        id="cardNumber"
                        name="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={cardDetails.cardNumber}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="expireMonth">Ay</Label>
                        <Input
                          id="expireMonth"
                          name="expireMonth"
                          placeholder="MM"
                          value={cardDetails.expireMonth}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="expireYear">Yıl</Label>
                        <Input
                          id="expireYear"
                          name="expireYear"
                          placeholder="YY"
                          value={cardDetails.expireYear}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="cvc">CVC</Label>
                        <Input
                          id="cvc"
                          name="cvc"
                          placeholder="123"
                          value={cardDetails.cvc}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <span className="mr-2">İşleniyor</span>
                        <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
                      </>
                    ) : (
                      `₺${plan.price} Öde ve Abone Ol`
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Sipariş Özeti</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>{plan.name} Plan</span>
                  <span>₺{plan.price}/ay</span>
                </div>
                <div className="border-t pt-4 flex justify-between font-bold">
                  <span>Toplam</span>
                  <span>₺{plan.price}</span>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 text-xs text-muted-foreground">
                <p>
                  Abone olarak, aboneliğiniz otomatik olarak yenilenecektir. İstediğiniz zaman aboneliğinizi iptal edebilirsiniz.
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}