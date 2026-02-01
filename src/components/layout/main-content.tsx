"use client";

import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";

interface MainContentProps {
  children: React.ReactNode;
  className?: string;
}

export function MainContent({ children, className }: MainContentProps) {
  const { sidebarCollapsed } = useUIStore();

  return (
    <div
      className={cn(
        "flex min-h-screen flex-col transition-all duration-300",
        sidebarCollapsed ? "md:pl-16" : "md:pl-64",
        className
      )}
    >
      {children}
    </div>
  );
}
