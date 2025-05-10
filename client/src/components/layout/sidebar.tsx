import React from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { 
  Home, 
  Utensils, 
  Apple, 
  Search, 
  Calendar, 
  BarChart, 
  Settings, 
  LogOut,
  LogIn,
  UserPlus,
  CreditCard,
  Lock,
  ShieldCheck
} from "lucide-react";

export default function Sidebar() {
  const [location, navigate] = useLocation();
  const { isAuthenticated, user, logout, isPremium } = useAuth();
  
  const navItems = [
    { name: "Ana Sayfa", href: "/", icon: Home },
    { name: "Danışanlar", href: "/clients", icon: BarChart, requireAuth: true, requirePremium: true },
    { name: "Diyet Planları", href: "/diet-plans", icon: Utensils, requireAuth: true, requirePremium: true },
    { name: "Besin Veritabanı", href: "/food-database", icon: Apple, requirePremium: false },
    { name: "Sağlık Hesaplayıcı", href: "/health-calculator", icon: Search, requirePremium: false },
    { name: "Abonelik", href: "/subscription", icon: CreditCard },
    { name: "Ayarlar", href: "/settings", icon: Settings, requireAuth: true, requirePremium: false },
  ];
  
  // Filtrelenmiş menü öğeleri - Sadece kimlik doğrulaması ve premium kontrolü
  const filteredNavItems = navItems;
  
  // Çıkış işlemi
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  
  return (
    <aside className="w-64 bg-white border-r border-neutral-200 h-screen fixed">
      <div className="p-4 border-b border-neutral-200">
        <div className="flex items-center">
          <img src="/dietkem-logo.png" alt="DietKEM Logo" className="w-12 h-12 mr-2" />
          <h1 className="font-heading font-semibold text-xl text-primary">DietKEM</h1>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Beslenme ve Diyet Planlama</p>
      </div>
      
      {isAuthenticated && user && (
        <div className="p-4 border-b border-neutral-200">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="ml-2">
              <p className="text-sm font-medium">{user.name || user.username}</p>
              <p className="text-xs text-muted-foreground">
                {user.subscriptionPlan ? `${user.subscriptionPlan.charAt(0).toUpperCase() + user.subscriptionPlan.slice(1)} Abonelik` : 'Ücretsiz Kullanıcı'}
              </p>
            </div>
          </div>
        </div>
      )}
      
      <nav className="py-4">
        <ul className="space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = location === item.href;
            const isLocked = 
              isAuthenticated && 
              item.requirePremium && 
              !isPremium && 
              item.href !== "/subscription";
            
            return (
              <li key={item.name}>
                <button
                  onClick={() => navigate(item.href)}
                  className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-md w-full text-left relative",
                    isActive
                      ? "text-primary bg-primary/5 border-l-2 border-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    isLocked && "opacity-75"
                  )}
                >
                  <item.icon className="h-5 w-5 mr-2" />
                  {item.name}
                  {isLocked && (
                    <Lock className="h-4 w-4 ml-2 text-amber-500" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="absolute bottom-8 w-full px-4">
        <div className="p-4 bg-accent rounded-lg">
          <h3 className="font-medium text-sm mb-2">Yardıma Mı İhtiyacınız Var?</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Destek ekibimiz her türlü sorunuzda size yardımcı olmaya hazır.
          </p>
          <button 
            onClick={() => navigate("/support")} 
            className="text-xs text-primary font-medium hover:underline cursor-pointer"
          >
            Destek Hattı
          </button>
        </div>
        
        {isAuthenticated ? (
          <button 
            onClick={handleLogout}
            className="flex items-center px-4 py-3 text-sm font-medium rounded-md text-muted-foreground hover:bg-muted hover:text-foreground w-full mt-4"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Çıkış Yap
          </button>
        ) : (
          <div className="mt-4 space-y-2">
            <button 
              onClick={() => navigate('/login')}
              className="flex items-center px-4 py-3 text-sm font-medium rounded-md text-muted-foreground hover:bg-muted hover:text-foreground w-full text-left"
            >
              <LogIn className="h-5 w-5 mr-2" />
              Giriş Yap
            </button>
            <button 
              onClick={() => navigate('/register')}
              className="flex items-center px-4 py-3 text-sm font-medium rounded-md text-muted-foreground hover:bg-muted hover:text-foreground w-full text-left"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Kayıt Ol
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
