"use client";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <Loader2
      className={cn("animate-spin text-muted-foreground", sizeClasses[size], className)}
    />
  );
}

interface LoadingPageProps {
  message?: string;
}

export function LoadingPage({ message = "Loading..." }: LoadingPageProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <LoadingSpinner size="lg" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-8 w-1/2" />
      </div>
    </div>
  );
}

export function LoadingStatsGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <LoadingCard key={i} />
      ))}
    </div>
  );
}

export function LoadingTableRow() {
  return (
    <div className="flex items-center gap-4 border-b py-4">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-8 w-20" />
    </div>
  );
}

export function LoadingTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-lg border">
      <div className="border-b p-4">
        <Skeleton className="h-5 w-1/6" />
      </div>
      <div className="divide-y px-4">
        {Array.from({ length: rows }).map((_, i) => (
          <LoadingTableRow key={i} />
        ))}
      </div>
    </div>
  );
}

export function LoadingChat() {
  return (
    <div className="flex h-full gap-4">
      {/* Chat list */}
      <div className="w-80 border-r pr-4">
        <Skeleton className="mb-4 h-10 w-full" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat messages */}
      <div className="flex-1 space-y-4">
        <Skeleton className="ml-auto h-12 w-2/3 rounded-lg" />
        <Skeleton className="h-12 w-1/2 rounded-lg" />
        <Skeleton className="ml-auto h-16 w-3/4 rounded-lg" />
        <Skeleton className="h-10 w-1/3 rounded-lg" />
      </div>
    </div>
  );
}
