import React from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getQueryFn } from "@/lib/queryClient";
import type { DietPlan } from "@shared/schema";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export default function DietPlanDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  const { data: plan, isLoading, error } = useQuery<DietPlan>({
    queryKey: ["/api/diet-plans/" + id],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-32 bg-muted rounded"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <Button variant="outline" onClick={() => setLocation("/diet-plans")}>← Tüm Planlara Dön</Button>
        <div className="mt-6 text-center p-8 text-red-500">
          Diyet planı yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.
        </div>
      </div>
    );
  }

  // İçerik düz metin mi JSON mu?
  let parsedContent: any = plan.content;
  if (typeof plan.content === "string") {
    try {
      parsedContent = JSON.parse(plan.content);
    } catch {
      parsedContent = plan.content;
    }
  }

  let contentNode: React.ReactNode = null;
  if (typeof parsedContent === "object" && parsedContent !== null) {
    contentNode = (
      <div className="space-y-4">
        <div>
          <strong>Günlük Kalori:</strong> {parsedContent.dailyCalories} kcal
        </div>
        {parsedContent.macros && (
          <div>
            <strong>Makrolar:</strong> Protein {parsedContent.macros.protein}g, Karbonhidrat {parsedContent.macros.carbs}g, Yağ {parsedContent.macros.fat}g
          </div>
        )}
        {parsedContent.meals && Array.isArray(parsedContent.meals) && (
          <div>
            <strong>Öğünler:</strong>
            <ul className="list-disc ml-6">
              {parsedContent.meals.map((meal: any, idx: number) => (
                <li key={idx}>
                  <strong>{meal.name} ({meal.time})</strong>
                  <ul className="list-disc ml-6">
                    {meal.foods && meal.foods.map((food: any, fidx: number) => (
                      <li key={fidx}>
                        {food.name} ({food.portion}) - {food.calories} kcal
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        )}
        {parsedContent.waterIntake && (
          <div>
            <strong>Su:</strong> {parsedContent.waterIntake}
          </div>
        )}
        {parsedContent.exercise && (
          <div>
            <strong>Egzersiz:</strong> {parsedContent.exercise.type}, {parsedContent.exercise.duration}, {parsedContent.exercise.frequency}
          </div>
        )}
        {parsedContent.notes && (
          <div>
            <strong>Notlar:</strong> {parsedContent.notes}
          </div>
        )}
      </div>
    );
  } else if (typeof parsedContent === "string") {
    contentNode = (
      <div className="prose prose-sm max-w-none">
        {parsedContent.split('\n').map((line, i) => (
          <p key={i} className="mb-2">{line}</p>
        ))}
      </div>
    );
  } else {
    contentNode = <div className="text-muted-foreground">İçerik bulunamadı.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <Button variant="outline" onClick={() => setLocation("/diet-plans")}>← Tüm Planlara Dön</Button>
      <Card className="mt-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription className="mt-2">{plan.description}</CardDescription>
            </div>
            <div className="text-sm text-muted-foreground">
              {format(new Date(plan.createdAt || new Date()), "d MMMM yyyy", {
                locale: tr,
              })}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-accent bg-opacity-20 rounded-lg p-4">
              <div className="text-sm text-muted-foreground">Kalori Hedefi</div>
              <div className="text-lg font-semibold">{plan.calorieGoal} kcal</div>
            </div>
            <div className="bg-accent bg-opacity-20 rounded-lg p-4">
              <div className="text-sm text-muted-foreground">Protein</div>
              <div className="text-lg font-semibold">%{plan.proteinPercentage}</div>
            </div>
            <div className="bg-accent bg-opacity-20 rounded-lg p-4">
              <div className="text-sm text-muted-foreground">Karbonhidrat</div>
              <div className="text-lg font-semibold">%{plan.carbsPercentage}</div>
            </div>
            <div className="bg-accent bg-opacity-20 rounded-lg p-4">
              <div className="text-sm text-muted-foreground">Yağ</div>
              <div className="text-lg font-semibold">%{plan.fatPercentage}</div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Diyet Planı İçeriği</h3>
            {contentNode}
          </div>

          {plan.tags && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Etiketler</h3>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(plan.tags) ? (
                  plan.tags.map((tag, index) => (
                    <span key={index} className="px-3 py-1 bg-accent rounded-full text-sm">
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="px-3 py-1 bg-accent rounded-full text-sm">
                    {plan.tags}
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 