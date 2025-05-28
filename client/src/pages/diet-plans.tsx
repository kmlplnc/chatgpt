import React, { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { PlusCircle, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DietPlanCard from "@/components/diet/diet-plan-card";
import { useToast } from "@/hooks/use-toast";
import { deleteDietPlan } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import ProtectedFeature from "@/components/premium/protected-feature";
import { getQueryFn } from "@/lib/queryClient";
import type { DietPlan } from "@shared/schema";

export default function DietPlans() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<string>("all");
  
  const { data: plans, isLoading, error } = useQuery<DietPlan[]>({
    queryKey: ["/api/diet-plans"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  const filteredPlans = plans?.filter(plan => {
    const matchesSearch = plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         plan.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === "all" || plan.status === filter;
    return matchesSearch && matchesFilter;
  }) || [];
  
  const handleDelete = async (id: number) => {
    try {
      await deleteDietPlan(id);
      
      toast({
        title: "Diyet planı silindi",
        description: "Diyet planı başarıyla silindi",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/diet-plans"] });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Diyet planı silinirken bir hata oluştu",
        variant: "destructive",
      });
    }
  };
  
  if (error) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="w-full max-w-6xl mx-auto px-4 ml-8 md:ml-24">
          <div className="text-center p-8 text-red-500">
            Diyet planları yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 animate-page-transition">
      <div className="w-full max-w-6xl mx-auto px-4 ml-8 md:ml-24">
        <ProtectedFeature featureName="Diet Plans">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h1 className="text-3xl font-bold">Diyet Planları</h1>
              <Link href="/diet-plans/create-ai">
                <Button className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  <span>AI ile Diyet Planı Oluştur</span>
                </Button>
              </Link>
            </div>
          
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Input
                  placeholder="Diyet planlarını ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10"
                />
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">Tüm Planlar</option>
                <option value="draft">Taslaklar</option>
                <option value="active">Aktif</option>
              </select>
            </div>
            
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="all">Tüm Planlar</TabsTrigger>
                <TabsTrigger value="active">Aktif</TabsTrigger>
                <TabsTrigger value="draft">Taslaklar</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all">
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-72 animate-pulse bg-muted rounded-lg"></div>
                    ))}
                  </div>
                ) : filteredPlans.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground">
                    {searchQuery ? (
                      <p>Aramanızla eşleşen diyet planı bulunamadı.</p>
                    ) : (
                      <div className="space-y-4">
                        <p>Henüz diyet planınız bulunmuyor.</p>
                        <Link href="/diet-plans/create-ai">
                          <Button variant="outline">İlk Diyet Planınızı Oluşturun</Button>
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPlans.map((plan) => (
                      <DietPlanCard 
                        key={plan.id} 
                        dietPlan={plan} 
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="active">
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-72 animate-pulse bg-muted rounded-lg"></div>
                    ))}
                  </div>
                ) : filteredPlans.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground">
                    Aktif diyet planı bulunamadı.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPlans
                      .filter((plan) => plan.status === "active")
                      .map((plan) => (
                        <DietPlanCard 
                          key={plan.id} 
                          dietPlan={plan} 
                          onDelete={handleDelete}
                        />
                      ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="draft">
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-72 animate-pulse bg-muted rounded-lg"></div>
                    ))}
                  </div>
                ) : filteredPlans.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground">
                    Taslak diyet planı bulunamadı.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPlans
                      .filter((plan) => plan.status === "draft")
                      .map((plan) => (
                        <DietPlanCard 
                          key={plan.id} 
                          dietPlan={plan} 
                          onDelete={handleDelete}
                        />
                      ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </ProtectedFeature>
      </div>
    </div>
  );
}