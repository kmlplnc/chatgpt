import * as React from "react";
import Sidebar from "./sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen h-screen w-full flex flex-col md:flex-row bg-background text-foreground dark:bg-neutral-900 dark:text-white">
      <Sidebar />
      
      <div className="flex-1 flex flex-col h-full min-h-0 md:ml-64 dark:bg-neutral-900">
        <main className="flex-1 flex flex-col h-full min-h-0 p-6 dark:bg-neutral-900 progressive-load-container">
          <div className="w-full max-w-6xl mx-auto px-4 ml-8 md:ml-24 mt-16">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
