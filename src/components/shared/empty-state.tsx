"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LucideIcon, Inbox, MessageSquare, Users, FileText, Radio } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[400px] flex-col items-center justify-center gap-4 text-center",
        className
      )}
    >
      <div className="rounded-full bg-muted p-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className="max-w-md text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {action && (
        <Button onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  );
}

export function NoMessages() {
  return (
    <EmptyState
      icon={MessageSquare}
      title="No messages yet"
      description="When you receive messages, they will appear here."
    />
  );
}

export function NoUsers() {
  return (
    <EmptyState
      icon={Users}
      title="No users found"
      description="Users who interact with your bot will appear here."
    />
  );
}

export function NoGroups() {
  return (
    <EmptyState
      icon={Users}
      title="No groups found"
      description="Groups your bot has joined will appear here."
    />
  );
}

export function NoLogs() {
  return (
    <EmptyState
      icon={FileText}
      title="No logs available"
      description="Activity logs will appear here once the bot starts running."
    />
  );
}

export function NoBroadcasts() {
  return (
    <EmptyState
      icon={Radio}
      title="No broadcasts"
      description="Create a broadcast to send messages to multiple users at once."
    />
  );
}

interface NoSearchResultsProps {
  query?: string;
  onClear?: () => void;
}

export function NoSearchResults({ query, onClear }: NoSearchResultsProps) {
  return (
    <EmptyState
      title="No results found"
      description={
        query
          ? `No results match "${query}". Try adjusting your search.`
          : "No results found for your search."
      }
      action={
        onClear
          ? {
              label: "Clear search",
              onClick: onClear,
            }
          : undefined
      }
    />
  );
}
