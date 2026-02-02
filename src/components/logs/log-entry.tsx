"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { LogEntry as LogEntryType, LogLevel } from "@/lib/socket/events";

interface LogEntryProps {
  log: LogEntryType;
}

const levelColors: Record<LogLevel, string> = {
  debug: "text-neutral-400",
  info: "text-blue-500",
  warn: "text-yellow-500",
  error: "text-red-500",
};

const levelBgColors: Record<LogLevel, string> = {
  debug: "bg-neutral-500/10",
  info: "bg-blue-500/10",
  warn: "bg-yellow-500/10",
  error: "bg-red-500/10",
};

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function LogEntry({ log }: LogEntryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasMetadata = log.metadata && Object.keys(log.metadata).length > 0;

  return (
    <div
      className={cn(
        "group flex flex-col border-b border-border/50 font-mono text-sm",
        "hover:bg-muted/50 transition-colors"
      )}
    >
      <div
        className={cn(
          "flex items-start gap-2 px-4 py-2",
          hasMetadata && "cursor-pointer"
        )}
        onClick={() => hasMetadata && setIsExpanded(!isExpanded)}
      >
        {/* Expand indicator */}
        <div className="w-4 shrink-0 pt-0.5">
          {hasMetadata && (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )
          )}
        </div>

        {/* Timestamp */}
        <span className="shrink-0 text-muted-foreground">
          {formatTimestamp(log.timestamp)}
        </span>

        {/* Level badge */}
        <span
          className={cn(
            "shrink-0 rounded px-1.5 py-0.5 text-xs font-medium uppercase",
            levelColors[log.level],
            levelBgColors[log.level]
          )}
        >
          {log.level}
        </span>

        {/* Message */}
        <span className="flex-1 break-all">{log.message}</span>
      </div>

      {/* Metadata (expanded) */}
      {isExpanded && hasMetadata && (
        <div className="mx-4 mb-2 ml-10 rounded-md bg-muted/50 p-3">
          <pre className="text-xs text-muted-foreground overflow-x-auto">
            {JSON.stringify(log.metadata, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// Compact version for dense display
export function LogEntryCompact({ log }: LogEntryProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1 font-mono text-xs",
        "hover:bg-muted/50 transition-colors border-b border-border/30"
      )}
    >
      {/* Timestamp */}
      <span className="shrink-0 text-muted-foreground">
        {formatTimestamp(log.timestamp)}
      </span>

      {/* Level */}
      <span
        className={cn(
          "shrink-0 w-12 uppercase font-medium",
          levelColors[log.level]
        )}
      >
        [{log.level}]
      </span>

      {/* Message */}
      <span className="flex-1 truncate">{log.message}</span>
    </div>
  );
}
