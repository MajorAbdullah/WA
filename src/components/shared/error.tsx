"use client";

import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ErrorDisplayProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showHome?: boolean;
  className?: string;
}

export function ErrorDisplay({
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  onRetry,
  showHome = false,
  className,
}: ErrorDisplayProps) {
  return (
    <div
      className={cn(
        "flex min-h-[400px] flex-col items-center justify-center gap-4 text-center",
        className
      )}
    >
      <div className="rounded-full bg-destructive/10 p-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      </div>

      <div className="flex items-center gap-3">
        {onRetry && (
          <Button onClick={onRetry} variant="default">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        )}
        {showHome && (
          <Button variant="outline" asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go home
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

interface ErrorBoundaryFallbackProps {
  error: Error;
  resetErrorBoundary?: () => void;
}

export function ErrorBoundaryFallback({
  error,
  resetErrorBoundary,
}: ErrorBoundaryFallbackProps) {
  return (
    <ErrorDisplay
      title="Application Error"
      message={error.message || "An unexpected error occurred in the application."}
      onRetry={resetErrorBoundary}
      showHome
    />
  );
}

interface ErrorAlertProps {
  message: string;
  className?: string;
}

export function ErrorAlert({ message, className }: ErrorAlertProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4",
        className
      )}
    >
      <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
      <p className="text-sm text-destructive">{message}</p>
    </div>
  );
}
