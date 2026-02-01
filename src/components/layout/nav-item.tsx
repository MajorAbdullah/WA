"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  collapsed?: boolean;
  badge?: number;
}

export function NavItem({ href, icon: Icon, label, collapsed = false, badge }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));

  const content = (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        "hover:bg-muted",
        isActive
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "text-muted-foreground hover:text-foreground",
        collapsed && "justify-center px-2"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1">{label}</span>
          {badge !== undefined && badge > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-xs font-medium text-primary">
              {badge > 99 ? "99+" : badge}
            </span>
          )}
        </>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2">
          {label}
          {badge !== undefined && badge > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-xs font-medium text-primary">
              {badge > 99 ? "99+" : badge}
            </span>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}
