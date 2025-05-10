import React, { useState } from "react";
import { useLocation } from "wouter";
import { Bell, HelpCircle, User, Search, LogOut, Settings, UserIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const [location, navigate] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  
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
  
  // Arama işlemi
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/food-database?search=${encodeURIComponent(searchTerm)}`);
    }
  };
  
  // Arama string'ini izle
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Arama terimi:", e.target.value);
    setSearchTerm(e.target.value);
    
    // Türkçe karakterleri değiştirelim
    const translated = e.target.value
      .replace(/ı/g, "i")
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/İ/g, "I")
      .replace(/Ğ/g, "G")
      .replace(/Ü/g, "U")
      .replace(/Ş/g, "S")
      .replace(/Ö/g, "O")
      .replace(/Ç/g, "C");
      
    console.log("Çevrilen terim:", translated);
  };
  
  // Kullanıcı avatar'ı için harfi al
  const getInitial = () => {
    if (!user) return "?";
    
    return user.name ? 
      user.name.charAt(0).toUpperCase() : 
      user.username.charAt(0).toUpperCase();
  };
  
  // Çıkış işlemi
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  
  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
      <div className="flex items-center justify-between px-6 py-4">
        <div onClick={() => navigate('/')} className="cursor-pointer flex items-center">
          <div className="font-bold text-primary text-2xl mr-2">DietKEM</div>
          <div>
            <h1 className="text-xl font-heading font-semibold">{getPageTitle()}</h1>
            <p className="text-sm text-muted-foreground">Kişisel diyet asistanınız</p>
          </div>
        </div>
        
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Besin, vitamin, mineral ara..."
                className="pl-8 bg-muted"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
          </form>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Bell className="h-5 w-5" />
          </Button>
          
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <HelpCircle className="h-5 w-5" />
          </Button>
          
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-neutral-200">
                    <span className="text-primary font-medium">{getInitial()}</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name || user.username}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Profil</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Ayarlar</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Çıkış Yap</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" className="relative h-8 rounded-full" onClick={() => navigate('/login')}>
              Giriş Yap
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
