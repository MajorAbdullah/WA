"use client";

import { useEffect, useRef, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LogEntry } from "./log-entry";
import { useLogsStore } from "@/stores/logs-store";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";

interface LogViewerProps {
  className?: string;
}

export function LogViewer({ className }: LogViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const userScrolledRef = useRef(false);

  const { autoScroll, setAutoScroll, getFilteredLogs, isPaused } = useLogsStore();
  const filteredLogs = getFilteredLogs();

  // Handle user scroll to detect if they've scrolled up
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;

    // If user scrolls up, disable auto-scroll
    if (!isAtBottom && !userScrolledRef.current) {
      userScrolledRef.current = true;
      setAutoScroll(false);
    }

    // If user scrolls to bottom, re-enable auto-scroll
    if (isAtBottom && userScrolledRef.current) {
      userScrolledRef.current = false;
      setAutoScroll(true);
    }
  }, [setAutoScroll]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [filteredLogs.length, autoScroll]);

  // Scroll to bottom button click
  const scrollToBottom = useCallback(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
      setAutoScroll(true);
      userScrolledRef.current = false;
    }
  }, [setAutoScroll]);

  if (filteredLogs.length === 0) {
    return (
      <div
        className={cn(
          "flex min-h-[400px] flex-col items-center justify-center text-center",
          className
        )}
      >
        <FileText className="mb-4 h-12 w-12 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          {isPaused ? "Logging paused" : "No logs to display"}
        </p>
        <p className="text-xs text-muted-foreground">
          {isPaused
            ? "Click Resume to continue receiving logs"
            : "Logs will appear here as they are generated"}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <ScrollArea
        ref={scrollRef}
        className="h-[600px] rounded-md border bg-background"
        onScroll={handleScroll}
      >
        <div className="min-w-[600px]">
          {filteredLogs.map((log) => (
            <LogEntry key={log.id} log={log} />
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Scroll to bottom button - shown when not auto-scrolling */}
      {!autoScroll && (
        <button
          onClick={scrollToBottom}
          className={cn(
            "absolute bottom-4 right-4 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg",
            "hover:bg-primary/90 transition-colors"
          )}
        >
          Scroll to bottom
        </button>
      )}

      {/* Paused indicator */}
      {isPaused && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 rounded-full bg-yellow-500/90 px-3 py-1 text-xs font-medium text-white shadow-lg">
          Paused
        </div>
      )}
    </div>
  );
}
