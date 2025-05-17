import React from "react";
import { useLocation } from "wouter";

export default function Header() {
  const [location, setLocation] = useLocation();
  
  return (
    <header className="bg-white dark:bg-neutral-900 dark:text-white border-b border-neutral-200 sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex-none">
          <button
            onClick={() => setLocation("/")}
            className="focus:outline-none hover:opacity-80 transition-opacity"
            style={{ padding: 0, background: 'none', border: 'none' }}
            aria-label="Anasayfa"
          >
            <img
              src="/logo.png"
              alt="Logo"
              style={{ height: 40, width: 'auto', display: 'block' }}
            />
          </button>
        </div>
        <div className="flex items-center gap-4">
          {/* Boş header */}
        </div>
      </div>
    </header>
  );
}
