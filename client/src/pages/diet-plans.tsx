import React, { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { PlusCircle, Filter, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DietPlanCard from "@/components/diet/diet-plan-card";
import { useToast } from "@/hooks/use-toast";
import { deleteDietPlan } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import ProtectedFeature from "@/components/premium/protected-feature";

export default function DietPlans() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    status: ["active", "draft"],
    dietType: [] as string[],
  });
  
  // Fetch all diet plans
  const { data: dietPlans, isLoading, error } = useQuery({
    queryKey: ["/api/diet-plans"],
  });
  
  // Filter diet plans based on search term and filters
  const filteredPlans = React.useMemo(() => {
    if (!dietPlans) return [];
    
    return dietPlans.filter((plan: any) => {
      // Filter by search term
      if (search && !plan.name.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      
      // Filter by status
      if (filters.status.length > 0 && !filters.status.includes(plan.status)) {
        return false;
      }
      
      // Filter by diet type
      if (filters.dietType.length > 0 && !filters.dietType.includes(plan.dietType)) {
        return false;
      }
      
      return true;
    });
  }, [dietPlans, search, filters]);
  
  // Handle diet plan deletion
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
        description: "Diyet planı silinirken hata oluştu",
        variant: "destructive",
      });
    }
  };
  
  // Toggle filter values
  const toggleStatusFilter = (status: string) => {
    setFilters(prev => {
      const statusFilters = prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status];
      
      return { ...prev, status: statusFilters };
    });
  };
  
  const toggleDietTypeFilter = (type: string) => {
    setFilters(prev => {
      const typeFilters = prev.dietType.includes(type)
        ? prev.dietType.filter(t => t !== type)
        : [...prev.dietType, type];
      
      return { ...prev, dietType: typeFilters };
    });
  };
  
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 animate-page-transition">
      <div className="w-full max-w-6xl mx-auto px-4 ml-8 md:ml-24">
        <ProtectedFeature featureName="Diyet Planları">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h1 className="text-3xl font-bold">Diyet Planları</h1>
              <Link href="/diet-plans/create-ai">
                <Button className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  <span>Yapay Zeka ile Oluştur</span>
                </Button>
              </Link>
            </div>
          
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Input
                  placeholder="Diyet planları ara..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10"
                />
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    <span className="hidden sm:inline">Filtreler</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Duruma Göre Filtrele</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={filters.status.includes("active")}
                    onCheckedChange={() => toggleStatusFilter("active")}
                  >
                    Aktif
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filters.status.includes("draft")}
                    onCheckedChange={() => toggleStatusFilter("draft")}
                  >
                    Taslak
                  </DropdownMenuCheckboxItem>
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Diyet Türüne Göre Filtrele</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {["balanced", "low_carb", "high_protein", "vegetarian", "vegan", "keto", "paleo", "mediterranean"].map((type) => (
                    <DropdownMenuCheckboxItem
                      key={type}
                      checked={filters.dietType.includes(type)}
                      onCheckedChange={() => toggleDietTypeFilter(type)}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="all">Tüm Planlar</TabsTrigger>
                <TabsTrigger value="active">Aktif</TabsTrigger>
                <TabsTrigger value="draft">Taslak</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all">
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-72 animate-pulse bg-muted rounded-lg"></div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="text-center p-8 text-destructive">
                    Diyet planları yüklenirken hata oluştu. Lütfen tekrar deneyin.
                  </div>
                ) : filteredPlans.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground">
                    {search || filters.status.length < 2 || filters.dietType.length > 0 ? (
                      <p>Mevcut filtrelere uygun diyet planı bulunamadı.</p>
                    ) : (
                      <div className="space-y-4">
                        <p>Henüz hiç diyet planınız yok.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPlans.map((plan: any) => (
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
                ) : error ? (
                  <div className="text-center p-8 text-destructive">
                    Diyet planları yüklenirken hata oluştu. Lütfen tekrar deneyin.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPlans
                      .filter((plan: any) => plan.status === "active")
                      .map((plan: any) => (
                        <DietPlanCard 
                          key={plan.id} 
                          dietPlan={plan} 
                          onDelete={handleDelete}
                        />
                      ))}
                  </div>
                )}
                
                {!isLoading && !error && filteredPlans.filter((plan: any) => plan.status === "active").length === 0 && (
                  <div className="text-center p-8 text-muted-foreground">
                    Aktif diyet planı bulunamadı.
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
                ) : error ? (
                  <div className="text-center p-8 text-destructive">
                    Diyet planları yüklenirken hata oluştu. Lütfen tekrar deneyin.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPlans
                      .filter((plan: any) => plan.status === "draft")
                      .map((plan: any) => (
                        <DietPlanCard 
                          key={plan.id} 
                          dietPlan={plan} 
                          onDelete={handleDelete}
                        />
                      ))}
                  </div>
                )}
                
                {!isLoading && !error && filteredPlans.filter((plan: any) => plan.status === "draft").length === 0 && (
                  <div className="text-center p-8 text-muted-foreground">
                    Taslak diyet planı bulunamadı.
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