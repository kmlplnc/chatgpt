import React from "react";
import { Link } from "wouter";
import { Check, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const SUBSCRIPTION_PLANS = [
  {
    id: "basic",
    name: "Başlangıç",
    price: "49.99",
    interval: "monthly",
    description: "Diyetisyenler için temel özellikler",
    features: [
      { name: "10 danışan yönetimi", included: true },
      { name: "Temel ölçüm takibi", included: true },
      { name: "Besin veritabanı erişimi", included: true },
      { name: "Sağlık hesaplayıcı (BMH, VKİ)", included: true },
      { name: "Diyet planları oluşturma", included: false },
      { name: "Detaylı raporlama", included: false },
    ],
  },
  {
    id: "pro",
    name: "Profesyonel",
    price: "89.99",
    interval: "monthly",
    description: "Aktif çalışan diyetisyenler için",
    features: [
      { name: "Sınırsız danışan yönetimi", included: true },
      { name: "Kapsamlı ölçüm takibi", included: true },
      { name: "Besin veritabanı erişimi", included: true },
      { name: "Sağlık hesaplayıcı (BMH, VKİ)", included: true },
      { name: "Diyet planları oluşturma", included: true },
      { name: "Detaylı raporlama", included: true },
    ],
    mostPopular: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: "149.99",
    interval: "monthly",
    description: "Klinikler ve danışmanlık merkezleri için",
    features: [
      { name: "Sınırsız danışan yönetimi", included: true },
      { name: "Kapsamlı ölçüm takibi", included: true },
      { name: "Genişletilmiş besin veritabanı", included: true },
      { name: "Tüm sağlık hesaplayıcılar", included: true },
      { name: "Gelişmiş diyet planları", included: true },
      { name: "Özelleştirilebilir raporlar", included: true },
    ],
  },
];

export interface SubscriptionPlansProps {
  currentPlan?: string | null;
}

export default function SubscriptionPlans({ currentPlan }: SubscriptionPlansProps) {
  return (
    <div className="grid gap-8 md:grid-cols-3">
      {SUBSCRIPTION_PLANS.map((plan) => (
        <Card
          key={plan.id}
          className={`flex flex-col ${
            plan.mostPopular
              ? "border-primary/50 shadow-lg relative"
              : "border-border"
          }`}
        >
          {plan.mostPopular && (
            <div className="absolute -top-4 left-0 right-0 flex justify-center">
              <div className="bg-primary text-primary-foreground text-sm font-medium py-1 px-4 rounded-full">
                En Popüler
              </div>
            </div>
          )}
          <CardHeader>
            <CardTitle>{plan.name}</CardTitle>
            <CardDescription>{plan.description}</CardDescription>
            <div className="mt-4">
              <span className="text-3xl font-bold">₺{plan.price}</span>
              <span className="text-muted-foreground ml-1">
                / {plan.interval === "monthly" ? "ay" : "yıl"}
              </span>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-3">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  {feature.included ? (
                    <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  ) : (
                    <X className="h-5 w-5 text-muted-foreground mr-2 mt-0.5 flex-shrink-0" />
                  )}
                  <span className={feature.included ? "" : "text-muted-foreground"}>
                    {feature.name}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              asChild
              className={`w-full ${
                currentPlan === plan.id
                  ? "bg-green-600 hover:bg-green-700"
                  : plan.mostPopular
                  ? ""
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/90"
              }`}
              disabled={currentPlan === plan.id}
            >
              {currentPlan === plan.id ? (
                <div>Aktif Plan</div>
              ) : (
                <Link href={`/subscription/checkout?plan=${plan.id}`}>
                  Abone Ol
                </Link>
              )}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}