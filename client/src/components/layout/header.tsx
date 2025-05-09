import React from "react";
import { useLocation } from "wouter";
import { Bell, HelpCircle, User, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const [location] = useLocation();
  
  // Get page title based on current location
  const getPageTitle = () => {
    switch (location) {
      case "/":
        return "Ana Sayfa";
      case "/clients":
        return "Danışanlar";
      case "/diet-plans":
        return "Diyet Planları";
      case "/create-diet-plan":
        return "Diyet Planı Oluştur";
      case "/food-database":
        return "Besin Veritabanı";
      case "/nutrition":
        return "Beslenme Analizi";
      case "/health-calculator":
        return "Sağlık Hesaplayıcı";
      case "/settings":
        return "Ayarlar";
      default:
        if (location.startsWith("/food/")) {
          return "Besin Detayları";
        }
        if (location.startsWith("/clients/")) {
          return "Danışan Detayları";
        }
        return "DietKEM";
    }
  };
  
  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-xl font-heading font-semibold">{getPageTitle()}</h1>
          <p className="text-sm text-muted-foreground">Kişisel diyet asistanınız</p>
        </div>
        
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Besin, vitamin, mineral ara..."
              className="pl-8 bg-muted"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Bell className="h-5 w-5" />
          </Button>
          
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <HelpCircle className="h-5 w-5" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <div className="w-8 h-8 rounded-full bg-neutral-300 flex items-center justify-center overflow-hidden border border-neutral-200">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Dr. Ahmet Yılmaz</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    diyetisyen@dietkem.com
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Profil
              </DropdownMenuItem>
              <DropdownMenuItem>
                Ayarlar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Çıkış Yap
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
