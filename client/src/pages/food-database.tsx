import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Apple, BookmarkIcon, Search, FastForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import FoodSearch from "@/components/food/food-search";
import FoodCard from "@/components/food/food-card";
import { useQuery } from "@tanstack/react-query";
import ProtectedFeature from "@/components/premium/protected-feature";

export default function FoodDatabase() {
  // Fetch saved foods
  const { 
    data: savedFoods, 
    isLoading: isLoadingSavedFoods 
  } = useQuery({
    queryKey: ["/api/saved-foods"],
  });
  
  // Fetch recent foods
  const { 
    data: recentFoods, 
    isLoading: isLoadingRecentFoods 
  } = useQuery({
    queryKey: ["/api/foods/recent"],
  });
  
  return (
    <ProtectedFeature featureName="Besin Veritabanı">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Besin Veritabanı</h1>
          <p className="text-muted-foreground">
            300.000'den fazla besini içeren kapsamlı veritabanımızda besin değerlerini arayın
          </p>
        </div>
      
        <Tabs defaultValue="search" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="search">
              <Search className="h-4 w-4 mr-2" />
              Besin Ara
            </TabsTrigger>
            <TabsTrigger value="saved">
              <BookmarkIcon className="h-4 w-4 mr-2" />
              Kaydedilen Besinler
            </TabsTrigger>
            <TabsTrigger value="recent">
              <FastForward className="h-4 w-4 mr-2" />
              Son Görüntülenenler
            </TabsTrigger>
          </TabsList>
        
          <TabsContent value="search">
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle>Besin Ara</CardTitle>
                <CardDescription>
                  Besin adı, marka veya içerik girerek veritabanımızda arama yapın
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FoodSearch />
              </CardContent>
            </Card>
          
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>Besin Veri Türleri</CardTitle>
                  <CardDescription>
                    Farklı besin veri kaynaklarını anlama
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Temel Besinler</h3>
                    <p className="text-sm text-muted-foreground">
                      Analizlerden, tariflerden ve diğer hesaplamalardan elde edilen besin değerleri. En doğru ve eksiksiz veriler.
                    </p>
                    <Separator className="my-2" />
                  </div>
                
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Standart Referans</h3>
                    <p className="text-sm text-muted-foreground">
                      USDA'nın Ulusal Besin Veritabanından besin değeri verileri içeren temel gıdalar ve içerikler.
                    </p>
                    <Separator className="my-2" />
                  </div>
                
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Anket Besinleri</h3>
                    <p className="text-sm text-muted-foreground">
                      Amerika'da Ne Yediğimiz (WWEIA) beslenme anketinde bildirilen yiyecekler.
                    </p>
                    <Separator className="my-2" />
                  </div>
                
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Markalı Besinler</h3>
                    <p className="text-sm text-muted-foreground">
                      Besin Değerleri etiketlerine sahip üreticilerden gelen ticari ürünler.
                    </p>
                  </div>
                </CardContent>
              </Card>
            
              <Card>
                <CardHeader>
                  <CardTitle>Besin Değerleri Bilgisi</CardTitle>
                  <CardDescription>
                    Her besin için mevcut olan besin değerleri verilerini anlayın
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Makro Besinler</h3>
                    <p className="text-sm text-muted-foreground">
                      Protein, karbonhidrat, yağ ve kaloriler hakkında veriler - gıdanın ana enerji sağlayan bileşenleri.
                    </p>
                    <Separator className="my-2" />
                  </div>
                
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Vitaminler ve Mineraller</h3>
                    <p className="text-sm text-muted-foreground">
                      Tüm önemli vitaminleri (A, B kompleksi, C, D, E, K) ve mineralleri (kalsiyum, demir, çinko, vb.) içeren temel mikro besinler.
                    </p>
                    <Separator className="my-2" />
                  </div>
                
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Diğer Bileşenler</h3>
                    <p className="text-sm text-muted-foreground">
                      Lif, kolesterol, yağ asidi profilleri, amino asitler ve daha fazlası gibi ek beslenme faktörleri.
                    </p>
                    <Separator className="my-2" />
                  </div>
                
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Günlük Değerler</h3>
                    <p className="text-sm text-muted-foreground">
                      2.000 kalorilik bir diyete dayalı olarak birçok besin maddesi için önerilen günlük alım yüzdesi.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        
          <TabsContent value="saved">
            {isLoadingSavedFoods ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-56 animate-pulse bg-muted rounded-lg"></div>
                ))}
              </div>
            ) : !savedFoods || savedFoods.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Apple className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Kaydedilmiş Besin Yok</h3>
                  <p className="text-muted-foreground mb-4">
                    Henüz hiç besin kaydetmediniz. Besinleri aramak ve kolay erişim için yer işareti koymak için besin arayın.
                  </p>
                  <Button asChild>
                    <TabsTrigger value="search">Besin Ara</TabsTrigger>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="food-grid">
                {savedFoods.map((food: any) => (
                  <FoodCard key={food.fdcId} food={food} />
                ))}
              </div>
            )}
          </TabsContent>
        
          <TabsContent value="recent">
            {isLoadingRecentFoods ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-56 animate-pulse bg-muted rounded-lg"></div>
                ))}
              </div>
            ) : !recentFoods || recentFoods.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <FastForward className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Son Görüntülenen Besin Yok</h3>
                  <p className="text-muted-foreground mb-4">
                    Henüz hiç besin görüntülemediniz. Ayrıntılı besin değerleri bilgilerini görmek için besinleri arayın.
                  </p>
                  <Button asChild>
                    <TabsTrigger value="search">Besin Ara</TabsTrigger>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="food-grid">
                {recentFoods.map((food: any) => (
                  <FoodCard key={food.fdcId} food={food} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedFeature>
  );
}