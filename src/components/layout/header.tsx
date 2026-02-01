"use client";

import { Menu, PanelLeftClose, PanelLeft, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "./user-menu";
import { useUIStore } from "@/stores/ui-store";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const { sidebarCollapsed, toggleCollapse, setSidebarOpen } = useUIStore();

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
      {/* Mobile menu toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      {/* Desktop sidebar collapse toggle */}
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex"
            onClick={toggleCollapse}
          >
            {sidebarCollapsed ? (
              <PanelLeft className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
            <span className="sr-only">
              {sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          {sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        </TooltipContent>
      </Tooltip>

      {/* Page title */}
      {title && (
        <h1 className="text-lg font-semibold md:text-xl">{title}</h1>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Notifications */}
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              3
            </Badge>
            <span className="sr-only">Notifications</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Notifications</TooltipContent>
      </Tooltip>

      {/* User menu */}
      <UserMenu />
    </header>
  );
}
