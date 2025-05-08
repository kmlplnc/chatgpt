import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Utensils, 
  Apple, 
  Search, 
  Calendar, 
  BarChart, 
  Settings, 
  LogOut
} from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();
  
  const navItems = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Diet Plans", href: "/diet-plans", icon: Utensils },
    { name: "Food Database", href: "/food-database", icon: Apple },
    { name: "Nutrition Information", href: "/food-database", icon: BarChart },
    { name: "Settings", href: "/settings", icon: Settings },
  ];
  
  return (
    <aside className="w-64 bg-white border-r border-neutral-200 h-screen fixed">
      <div className="p-4 border-b border-neutral-200">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-white mr-2">
            <Utensils className="h-4 w-4" />
          </div>
          <h1 className="font-heading font-semibold text-xl text-primary">NutriSage</h1>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Nutrition & Diet Planning</p>
      </div>
      
      <nav className="py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <a
                    className={cn(
                      "flex items-center px-4 py-3 text-sm font-medium rounded-md",
                      isActive
                        ? "text-primary bg-primary bg-opacity-10"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5 mr-2" />
                    {item.name}
                  </a>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="absolute bottom-8 w-full px-4">
        <div className="p-4 bg-accent rounded-lg">
          <h3 className="font-medium text-sm mb-2">Need Help?</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Our support team is always ready to assist you with any questions.
          </p>
          <Link href="/support">
            <a className="text-xs text-primary font-medium">Contact Support</a>
          </Link>
        </div>
        
        <button className="flex items-center px-4 py-3 text-sm font-medium rounded-md text-muted-foreground hover:bg-muted hover:text-foreground w-full mt-4">
          <LogOut className="h-5 w-5 mr-2" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
