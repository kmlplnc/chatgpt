import React from 'react';
import { Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { translateUI } from '@/lib/translations';

interface SubscriptionPlanProps {
  onSelectPlan: (plan: string) => void;
  selectedPlan?: string;
}

export function SubscriptionPlans({ onSelectPlan, selectedPlan }: SubscriptionPlanProps) {
  const plans = [
    {
      id: "basic",
      name: "Temel",
      price: "₺199",
      priceLabel: "aylık",
      description: "Diyet uzmanları için temel kullanım",
      features: [
        "Müşteri takip sistemi (5 müşteri)",
        "Temel besin veritabanı erişimi",
        "Beslenme hesaplayıcısı",
        "Temel ölçüm grafikleri"
      ]
    },
    {
      id: "pro",
      name: "Profesyonel",
      price: "₺349",
      priceLabel: "aylık",
      description: "Aktif çalışan diyetisyenler için",
      features: [
        "Müşteri takip sistemi (20 müşteri)",
        "Gelişmiş besin veritabanı erişimi",
        "Gelişmiş beslenme hesaplayıcısı",
        "Detaylı ölçüm grafikleri ve raporlar",
        "Diyet planı oluşturma araçları"
      ],
      popular: true
    },
    {
      id: "premium",
      name: "Premium",
      price: "₺599",
      priceLabel: "aylık",
      description: "Profesyonel klinikler için",
      features: [
        "Sınırsız müşteri takibi",
        "Tam veritabanı erişimi",
        "Tüm vitamin ve mineral hesaplamaları",
        "Gelişmiş ilerleme raporları",
        "Diyet planı şablonları",
        "Öncelikli destek"
      ]
    }
  ];

  return (
    <>
      {plans.map((plan) => (
        <Card 
          key={plan.id} 
          className={`flex flex-col ${plan.popular ? 'border-primary shadow-md relative' : ''}`}
        >
          {plan.popular && (
            <div className="absolute -top-5 left-0 right-0 text-center">
              <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                {translateUI("Popular")}
              </span>
            </div>
          )}
          
          <CardHeader>
            <CardTitle>{plan.name}</CardTitle>
            <div className="mt-4 flex items-baseline text-5xl font-extrabold">
              {plan.price}
              <span className="ml-1 text-2xl font-medium text-muted-foreground">/{plan.priceLabel}</span>
            </div>
            <CardDescription className="mt-4">{plan.description}</CardDescription>
          </CardHeader>
          
          <CardContent className="flex-grow">
            <ul className="space-y-3">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mr-2" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          
          <CardFooter>
            <Button 
              onClick={() => {
                console.log("Plan seçildi:", plan.id);
                onSelectPlan(plan.id);
              }}
              className="w-full" 
              variant={selectedPlan === plan.id ? "default" : "outline"}
            >
              {selectedPlan === plan.id ? 'Seçildi' : 'Seç'}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </>
  );
}