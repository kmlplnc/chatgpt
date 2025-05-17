import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, User } from "lucide-react";

type FruitType = 'apple' | 'orange' | 'strawberry' | 'watermelon' | 'grape';

const AVOCADO_AVATAR = (
  <svg viewBox="0 0 40 40" width="40" height="40" fill="none" className="w-10 h-10">
    <ellipse cx="20" cy="20" rx="19" ry="19" fill="#A3E635"/>
    <ellipse cx="20" cy="20" rx="15" ry="15" fill="#65A30D"/>
    <ellipse cx="20" cy="26" rx="7" ry="8" fill="#FBBF24"/>
    <ellipse cx="20" cy="29" rx="3.5" ry="4" fill="#92400E"/>
    <ellipse cx="14.5" cy="15.5" rx="2.5" ry="1.7" fill="#fff" opacity=".7"/>
    <ellipse cx="25.5" cy="15.5" rx="2.5" ry="1.7" fill="#fff" opacity=".7"/>
    <ellipse cx="14.5" cy="17" rx=".7" ry=".7" fill="#333"/>
    <ellipse cx="25.5" cy="17" rx=".7" ry=".7" fill="#333"/>
    <path d="M16 24 Q20 30 24 24" stroke="#333" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
  </svg>
);

const FRUIT_AVATARS: Record<FruitType, JSX.Element> = {
  apple: (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none" className="w-10 h-10">
      <ellipse cx="20" cy="20" rx="19" ry="19" fill="#FF6B6B"/>
      <ellipse cx="20" cy="28" rx="13" ry="11" fill="#FF6B6B"/>
      <rect x="18" y="4" width="4" height="16" rx="2" fill="#FF6B6B"/>
    </svg>
  ),
  orange: (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none" className="w-10 h-10">
      <circle cx="20" cy="20" r="19" fill="#FFA500"/>
      <ellipse cx="20" cy="13" rx="13" ry="11" fill="#FF8C00"/>
    </svg>
  ),
  strawberry: (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none" className="w-10 h-10">
      <ellipse cx="20" cy="20" rx="19" ry="19" fill="#FF69B4"/>
      <ellipse cx="20" cy="28" rx="13" ry="11" fill="#FF1493"/>
      <circle cx="13" cy="10" r="2" fill="#FFB6C1"/>
      <circle cx="20" cy="7" r="2" fill="#FFB6C1"/>
      <circle cx="27" cy="10" r="2" fill="#FFB6C1"/>
    </svg>
  ),
  watermelon: (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none" className="w-10 h-10">
      <ellipse cx="20" cy="20" rx="19" ry="19" fill="#90EE90"/>
      <ellipse cx="20" cy="28" rx="13" ry="11" fill="#FF69B4"/>
      <circle cx="13" cy="10" r="2" fill="#000"/>
      <circle cx="20" cy="7" r="2" fill="#000"/>
      <circle cx="27" cy="10" r="2" fill="#000"/>
    </svg>
  ),
  grape: (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none" className="w-10 h-10">
      <circle cx="13" cy="13" r="7" fill="#9370DB"/>
      <circle cx="27" cy="13" r="7" fill="#9370DB"/>
      <circle cx="20" cy="27" r="7" fill="#9370DB"/>
      <circle cx="13" cy="20" r="7" fill="#9370DB"/>
      <circle cx="27" cy="20" r="7" fill="#9370DB"/>
    </svg>
  )
};

const getRandomAvatar = (): JSX.Element => {
  const avatars = Object.keys(FRUIT_AVATARS) as FruitType[];
  const randomIndex = Math.floor(Math.random() * avatars.length);
  return FRUIT_AVATARS[avatars[randomIndex]];
};

const NAV_GROUPS = [
  {
    label: "Ana Sayfa",
    items: [
      { name: "Dashboard", href: "/" },
    ],
  },
  {
    label: "Genel",
    items: [
      { name: "Danışanlar", href: "/clients" },
      { name: "Diyet Planları", href: "/diet-plans" },
      { name: "Mesajlar", href: "/messages" },
    ],
  },
  {
    label: "Araçlar",
    items: [
      { name: "Besin Veritabanı", href: "/food-database" },
      { name: "Sağlık Hesaplayıcı", href: "/health-calculator" },
      { name: "Vitamin & Mineral Bilgi", href: "/vitaminler" },
    ],
  },
  {
    label: "Portal",
    items: [
      { name: "Danışan Portalı", href: "/client-portal" },
    ],
  },
  {
    label: "Ayarlar",
    items: [
      { name: "Ayarlar", href: "/settings" },
      { name: "Yönetim Paneli", href: "/admin" },
    ],
  },
  {
    label: "Abonelik",
    items: [
      { name: "Abonelik Planları", href: "/subscription" },
    ],
  },
];

declare global {
  interface Window {
    __logoutButtonRef?: React.RefObject<HTMLButtonElement>;
  }
}

export default function Navbar() {
  const [location, navigate] = useLocation();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const closeTimeout = useRef<NodeJS.Timeout | null>(null);
  const { user, isAuthenticated, logout } = useAuth();
  const [userAvatar] = useState(() => getRandomAvatar());
  const logoutButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    // Expose the logout button ref on window for dashboard
    if (logoutButtonRef.current) {
      window.__logoutButtonRef = logoutButtonRef;
    }
  }, [logoutButtonRef.current]);

  const handleMouseEnter = (label: string) => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    setOpenDropdown(label);
  };

  const handleMouseLeave = () => {
    closeTimeout.current = setTimeout(() => setOpenDropdown(null), 300);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="w-full h-16 flex items-center bg-white border-b border-neutral-200 fixed top-0 left-0 z-50 font-serif">
      <button
        onClick={() => navigate("/")}
        className="focus:outline-none hover:opacity-80 transition-opacity"
        style={{ padding: 0, background: 'none', border: 'none', marginLeft: 0 }}
        aria-label="Anasayfa"
      >
        <img
          src="/ChatGPT Image 15 May 2025 20_03_00.png"
          alt="Logo"
          style={{ height: 52, width: 'auto', display: 'block', marginLeft: 16 }}
        />
      </button>
      <div className="flex gap-10 justify-center items-center h-full w-full max-w-6xl mx-auto px-6">
        {NAV_GROUPS.map((group) => {
          const isDirect = group.items.length === 1 && (group.label === "Ana Sayfa" || group.label === "Abonelik");
          if (isDirect) {
            return (
              <button
                key={group.label}
                onClick={() => navigate(group.items[0].href)}
                className={cn(
                  "px-4 py-2 text-base font-medium text-neutral-700 dark:text-white hover:text-black dark:hover:text-white transition border-b-2 border-transparent rounded-md text-left",
                  location === group.items[0].href && "border-neutral-900 text-neutral-900 dark:text-white font-semibold bg-neutral-100 dark:bg-neutral-800 border-b-2"
                )}
              >
                {group.label}
              </button>
            );
          } else {
            return (
              <div
                key={group.label}
                className="relative flex flex-col items-center justify-center h-full"
                onMouseEnter={() => handleMouseEnter(group.label)}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  className={cn(
                    "px-4 py-2 text-base font-medium text-neutral-700 dark:text-white hover:text-black dark:hover:text-white transition border-b-2 border-transparent rounded-md text-left",
                    openDropdown === group.label && "border-neutral-900 text-neutral-900 dark:text-white font-semibold bg-neutral-100 dark:bg-neutral-800 border-b-2"
                  )}
                >
                  {group.label}
                </button>
                {openDropdown === group.label && (
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 min-w-[180px] bg-white border border-neutral-200 rounded shadow-lg py-1 flex flex-col z-50 text-left"
                    onMouseEnter={() => handleMouseEnter(group.label)}
                    onMouseLeave={handleMouseLeave}
                  >
                    {group.items.map((item) => (
                      <button
                        key={item.name}
                        onClick={() => navigate(item.href)}
                        className={cn(
                          "px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 hover:text-black transition font-serif",
                          location === item.href && "font-semibold text-primary"
                        )}
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          }
        })}
      </div>

      {!isAuthenticated ? (
        <div className="absolute top-4 right-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 text-base font-medium text-neutral-700 dark:text-white hover:text-black dark:hover:text-white transition border-b-2 border-transparent rounded-md"
          >
            Giriş Yap
          </button>
          <button
            onClick={() => navigate('/register')}
            className="px-4 py-2 text-base font-medium text-white bg-primary hover:bg-primary/90 transition rounded-md"
          >
            Kaydol
          </button>
        </div>
      ) : (
        <div className="absolute top-4 right-4">
          <button
            className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-lg font-bold focus:outline-none hover:bg-neutral-300 dark:hover:bg-neutral-700 transition"
            onClick={() => setOpenDropdown(openDropdown === 'account' ? null : 'account')}
          >
            {user?.role === 'admin' ? AVOCADO_AVATAR : userAvatar}
          </button>
          {openDropdown === 'account' && (
            <div
              className="absolute top-full right-0 mt-2 min-w-[180px] bg-white border border-neutral-200 rounded shadow-lg py-1 flex flex-col z-50 text-left"
            >
              <div className="px-4 py-2 text-sm font-medium text-neutral-700 border-b border-neutral-200">
                {user?.name || user?.username}
              </div>
              <button
                ref={logoutButtonRef}
                onClick={handleLogout}
                className="px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 hover:text-black transition font-serif flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Çıkış Yap
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
