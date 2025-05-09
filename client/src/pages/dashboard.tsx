import React from "react";
import { Link } from "wouter";
import { 
  Utensils, 
  Database, 
  Users,
  Calculator,
  Activity,
  ArrowRight, 
  BarChart,
  SparklesIcon,
  Search,
  Heart
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  return (
    <div className="space-y-10 max-w-5xl mx-auto py-6">
      {/* Hero Section */}
      <section className="text-center space-y-6 py-8">
        <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full text-primary mb-4">
          <SparklesIcon className="h-6 w-6 mr-2" />
          <span className="text-sm font-medium">DietKEM - Beslenme ve Diyet Takip Platformu</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Beslenme ve Danışan Takibinde<br />Diyetisyenlere Özel Çözüm
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          DietKEM, diyetisyenlerin danışanlarını takip etmesini, beslenme değerlerini analiz etmesini ve 
          etkili diyet planları oluşturmasını sağlayan kapsamlı bir araçtır.
        </p>
        <div className="flex flex-wrap gap-4 justify-center pt-4">
          <Button asChild size="lg" className="rounded-full px-8">
            <Link href="/clients">
              Danışanlara Göz At
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full px-8">
            <Link href="/health-calculator">
              Sağlık Hesaplayıcı
            </Link>
          </Button>
        </div>
      </section>
      
      {/* App Features */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold text-center">DietKEM Ne İşe Yarar?</h2>
        <p className="text-center text-muted-foreground max-w-3xl mx-auto">
          Diyetisyenler için geliştirilmiş kapsamlı hizmetlerle danışanlarınızın beslenmesini
          ve sağlığını kolayca takip edin.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card className="border-2 border-primary/10 hover:border-primary/30 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-primary" />
                Danışan Yönetimi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Tüm danışanlarınızı tek platformda yönetin. Kişisel bilgilerini ve sağlık verilerini
                güvenle kaydedin ve takip edin.
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-primary/10 hover:border-primary/30 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart className="h-5 w-5 mr-2 text-primary" />
                İlerleme Takibi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Danışanlarınızın vücut ölçümlerini ve sağlık göstergelerini takip edin. 
                Gelişimi grafiklerle görselleştirin ve analiz edin.
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-primary/10 hover:border-primary/30 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2 text-primary" />
                Besin Veritabanı
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                300.000'den fazla besini içeren kapsamlı veritabanımızda detaylı besin değerlerine
                ulaşın ve danışanlarınıza doğru öneriler sunun.
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-primary/10 hover:border-primary/30 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Utensils className="h-5 w-5 mr-2 text-primary" />
                Diyet Planları
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Danışanlarınızın ihtiyaçlarına uygun özelleştirilmiş diyet planları oluşturun.
                Makro besin değerlerini hesaplayın ve öneriler sunun.
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-primary/10 hover:border-primary/30 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="h-5 w-5 mr-2 text-primary" />
                Sağlık Hesaplayıcı
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                VKİ, BMH ve diğer önemli sağlık göstergelerini hesaplayın. Aktivite seviyesine
                göre enerji gereksinimlerini belirleyin.
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-primary/10 hover:border-primary/30 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="h-5 w-5 mr-2 text-primary" />
                Beslenme Analizi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Besinlerin vitamin ve mineral içeriklerini detaylı olarak analiz edin.
                Makro ve mikro besin değerlerini karşılaştırın.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
      
      {/* How to Use */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold text-center">Nasıl Kullanılır?</h2>
        <p className="text-center text-muted-foreground max-w-3xl mx-auto">
          DietKEM'i kullanarak danışanlarınızın beslenmesini optimize etmek çok kolay.
          İşte başlamanız için adımlar:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <div className="flex">
            <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              1
            </div>
            <div>
              <h3 className="font-bold">Danışan Ekleyin</h3>
              <p className="text-muted-foreground mt-1">
                Danışan sayfasından yeni danışanlarınızı sisteme ekleyin. Temel bilgilerini, 
                sağlık durumunu ve beslenme hedeflerini kaydedin.
              </p>
              <Button asChild variant="link" className="px-0 mt-2">
                <Link href="/clients" className="flex items-center">
                  Danışan Ekle
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
          
          <div className="flex">
            <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              2
            </div>
            <div>
              <h3 className="font-bold">Ölçüm Kaydedin</h3>
              <p className="text-muted-foreground mt-1">
                Danışanlarınızın vücut ölçümlerini ve sağlık verilerini düzenli olarak kaydedin.
                Bu veriler ilerlemeyi izlemek için kullanılacaktır.
              </p>
            </div>
          </div>
          
          <div className="flex">
            <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              3
            </div>
            <div>
              <h3 className="font-bold">Besinleri Araştırın</h3>
              <p className="text-muted-foreground mt-1">
                Besin veritabanında arama yaparak besinlerin besin değerlerini inceleyebilir ve
                danışanlarınız için uygun besinleri belirleyebilirsiniz.
              </p>
              <Button asChild variant="link" className="px-0 mt-2">
                <Link href="/food-database" className="flex items-center">
                  Besin Veritabanını İncele
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
          
          <div className="flex">
            <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              4
            </div>
            <div>
              <h3 className="font-bold">Diyet Planı Oluşturun</h3>
              <p className="text-muted-foreground mt-1">
                Danışanın ihtiyaçlarına ve hedeflerine uygun kişiselleştirilmiş diyet planları
                oluşturun ve takip edin.
              </p>
            </div>
          </div>
          
          <div className="flex">
            <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              5
            </div>
            <div>
              <h3 className="font-bold">Gelişimi Takip Edin</h3>
              <p className="text-muted-foreground mt-1">
                Grafikler ve raporlar aracılığıyla danışanlarınızın ilerlemesini takip edin,
                hedeflere ne kadar yaklaştıklarını görün.
              </p>
            </div>
          </div>
          
          <div className="flex">
            <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              6
            </div>
            <div>
              <h3 className="font-bold">Sağlık Değerlerini Hesaplayın</h3>
              <p className="text-muted-foreground mt-1">
                Sağlık hesaplayıcı ile VKİ, BMH değerlerini ve gerekli kalori miktarlarını
                otomatik olarak hesaplayın.
              </p>
              <Button asChild variant="link" className="px-0 mt-2">
                <Link href="/health-calculator" className="flex items-center">
                  Hesaplayıcıyı Kullan
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Why Use */}
      <section className="space-y-6 bg-gradient-to-b from-primary/5 to-background rounded-3xl p-8">
        <h2 className="text-3xl font-bold text-center">Neden DietKEM Kullanmalısınız?</h2>
        <p className="text-center text-muted-foreground max-w-3xl mx-auto">
          DietKEM, diyetisyenlerin işini kolaylaştırmak ve danışanlarına daha iyi hizmet vermek için
          tasarlanmış özel bir platformdur.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Card className="bg-white/50 backdrop-blur border-0">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2 text-primary" />
                Verimli Çalışma
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Tüm besin değerlerini manuel olarak hesaplamak yerine, platformdaki verileri kullanarak
                zamandan tasarruf edin ve daha fazla danışana hizmet verin.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/50 backdrop-blur border-0">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Heart className="h-5 w-5 mr-2 text-primary" />
                Doğru Beslenme Önerileri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Kapsamlı besin veritabanı sayesinde, danışanlarınız için en doğru ve sağlıklı
                beslenme önerilerini oluşturun.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/50 backdrop-blur border-0 md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart className="h-5 w-5 mr-2 text-primary" />
                Görsel İlerleme Takibi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Danışanlarınızın verilerini görselleştirerek ilerlemeyi daha net gösterir, motivasyonu artırır
                ve hedeflere ulaşmayı kolaylaştırır. Renkli grafikler ve tablolar ile sağlık durumundaki
                değişiklikleri anında fark edin.
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="text-center mt-8">
          <Button asChild size="lg" className="rounded-full px-8">
            <Link href="/clients">
              Hemen Başlayın
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
