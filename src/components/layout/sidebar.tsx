"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

export function Sidebar({ isConnected = false }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <MessageSquare className="h-6 w-6 text-primary" />
        <span className="text-lg font-semibold">WA Dashboard</span>
      </div>

      {/* Connection Status */}
      <div className="border-b px-4 py-3">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <Wifi className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Connected</span>
              <Badge variant="outline" className="ml-auto text-green-500 border-green-500">
                Online
              </Badge>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Disconnected</span>
              <Badge variant="outline" className="ml-auto text-red-500 border-red-500">
                Offline
              </Badge>
            </>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground text-center">
          Powered by @syed-abdullah-shah/wa-bot-cli
        </p>
      </div>
    </div>
  );
}
