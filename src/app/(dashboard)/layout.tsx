"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MainContent } from "@/components/layout/main-content";
import { TooltipProvider } from "@/components/ui/tooltip";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <TooltipProvider>
      <div className="relative min-h-screen bg-background">
        {/* Sidebar */}
        <Sidebar isConnected={false} />

        {/* Main content wrapper - offset by sidebar width */}
        <MainContent>
          {/* Header */}
          <Header />

          {/* Page content */}
          <main className="flex-1 p-6">
            {children}
          </main>
        </MainContent>
      </div>
    </TooltipProvider>
  );
}
