import * as React from "react";
import Sidebar from "./sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground dark:bg-neutral-900 dark:text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen dark:bg-neutral-900">
        <main className="flex-1 flex flex-col min-h-screen">
          <div>
            <div className="max-w-[1200px] mx-auto px-4 md:px-8 pt-20">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
