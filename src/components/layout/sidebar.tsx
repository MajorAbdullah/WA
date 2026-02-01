"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  UsersRound,
  Terminal,
  BarChart3,
  Radio,
  Settings,
  FileText,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NavItem } from "./nav-item";
import { useUIStore } from "@/stores/ui-store";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Messages", href: "/messages", icon: MessageSquare },
  { name: "Users", href: "/users", icon: Users },
  { name: "Groups", href: "/groups", icon: UsersRound },
  { name: "Commands", href: "/commands", icon: Terminal },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Broadcast", href: "/broadcast", icon: Radio },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Logs", href: "/logs", icon: FileText },
];

interface SidebarProps {
  isConnected?: boolean;
}

function SidebarContent({ isConnected = false, collapsed = false }: SidebarProps & { collapsed?: boolean }) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={cn(
        "flex h-16 items-center border-b px-4",
        collapsed ? "justify-center" : "gap-2 px-6"
      )}>
        <MessageSquare className="h-6 w-6 shrink-0 text-[#25D366]" />
        {!collapsed && (
          <span className="text-lg font-semibold">WA Dashboard</span>
        )}
      </div>

      {/* Connection Status */}
      <div className={cn(
        "border-b py-3",
        collapsed ? "px-2" : "px-4"
      )}>
        <div className={cn(
          "flex items-center",
          collapsed ? "justify-center" : "gap-2"
        )}>
          {isConnected ? (
            <>
              <Wifi className="h-4 w-4 shrink-0 text-green-500" />
              {!collapsed && (
                <>
                  <span className="text-sm text-muted-foreground">Connected</span>
                  <Badge variant="outline" className="ml-auto text-green-500 border-green-500">
                    Online
                  </Badge>
                </>
              )}
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 shrink-0 text-red-500" />
              {!collapsed && (
                <>
                  <span className="text-sm text-muted-foreground">Disconnected</span>
                  <Badge variant="outline" className="ml-auto text-red-500 border-red-500">
                    Offline
                  </Badge>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <nav className={cn(
          "space-y-1 py-4",
          collapsed ? "px-2" : "px-3"
        )}>
          <TooltipProvider>
            {navigation.map((item) => (
              <NavItem
                key={item.name}
                href={item.href}
                icon={item.icon}
                label={item.name}
                collapsed={collapsed}
              />
            ))}
          </TooltipProvider>
        </nav>
      </ScrollArea>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t p-4">
          <p className="text-xs text-muted-foreground text-center">
            Powered by wa-bot-cli
          </p>
        </div>
      )}
    </div>
  );
}

export function Sidebar({ isConnected = false }: SidebarProps) {
  const { sidebarCollapsed, sidebarOpen, setSidebarOpen } = useUIStore();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-30 hidden h-screen border-r bg-card transition-all duration-300 md:block",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarContent isConnected={isConnected} collapsed={sidebarCollapsed} />
      </aside>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <div className="absolute right-4 top-4 z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          <SidebarContent isConnected={isConnected} />
        </SheetContent>
      </Sheet>
    </>
  );
}

export function SidebarSpacer() {
  const { sidebarCollapsed } = useUIStore();

  return (
    <div
      className={cn(
        "hidden shrink-0 transition-all duration-300 md:block",
        sidebarCollapsed ? "w-16" : "w-64"
      )}
    />
  );
}
