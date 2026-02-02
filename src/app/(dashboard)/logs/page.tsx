"use client";

import { useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogFilters } from "@/components/logs/log-filters";
import { LogViewer } from "@/components/logs/log-viewer";
import { useLogsStore, generateSampleLogs } from "@/stores/logs-store";
import { useSocket } from "@/hooks/use-socket";
import { EVENTS } from "@/lib/socket/events";
import type { LogEntry, LogLevel } from "@/lib/socket/events";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff } from "lucide-react";

export default function LogsPage() {
  const { socket, isConnected, subscribeLogs, unsubscribeLogs } = useSocket();
  const { addLog, getFilteredLogs, logs, clearLogs } = useLogsStore();

  // Subscribe to logs when socket connects
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Subscribe to log events
    const handleLogEntry = (log: LogEntry) => {
      addLog(log);
    };

    socket.on(EVENTS.LOG_ENTRY, handleLogEntry);
    subscribeLogs();

    return () => {
      socket.off(EVENTS.LOG_ENTRY, handleLogEntry);
      unsubscribeLogs();
    };
  }, [socket, isConnected, addLog, subscribeLogs, unsubscribeLogs]);

  // Load sample logs for development/demo (remove in production)
  useEffect(() => {
    // Only load sample logs if we have no logs and socket is not connected
    if (logs.length === 0 && !isConnected) {
      const sampleLogs = generateSampleLogs(30);
      sampleLogs.forEach((log) => addLog(log));
    }
  }, [logs.length, isConnected, addLog]);

  // Download logs as JSON file
  const handleDownload = useCallback(() => {
    const filteredLogs = getFilteredLogs();
    if (filteredLogs.length === 0) return;

    const data = JSON.stringify(filteredLogs, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `wa-bot-logs-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [getFilteredLogs]);

  // Download logs as plain text
  const handleDownloadText = useCallback(() => {
    const filteredLogs = getFilteredLogs();
    if (filteredLogs.length === 0) return;

    const lines = filteredLogs.map((log) => {
      const time = new Date(log.timestamp).toISOString();
      return `${time} [${log.level.toUpperCase()}] ${log.message}`;
    });

    const data = lines.join("\n");
    const blob = new Blob([data], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `wa-bot-logs-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [getFilteredLogs]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Logs</h1>
          <p className="text-muted-foreground">
            Real-time log viewer for monitoring bot activity and debugging.
          </p>
        </div>

        {/* Connection status */}
        <Badge
          variant="outline"
          className={
            isConnected
              ? "border-green-500 text-green-500"
              : "border-red-500 text-red-500"
          }
        >
          {isConnected ? (
            <>
              <Wifi className="mr-1 h-3 w-3" />
              Live
            </>
          ) : (
            <>
              <WifiOff className="mr-1 h-3 w-3" />
              Offline
            </>
          )}
        </Badge>
      </div>

      {/* Main logs card */}
      <Card>
        <CardHeader>
          <CardTitle>Log Stream</CardTitle>
          <CardDescription>
            Filter logs by level, search content, and control the log stream.
            Click on a log entry to expand metadata.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <LogFilters onDownload={handleDownload} />

          {/* Log viewer */}
          <LogViewer />
        </CardContent>
      </Card>

      {/* Help section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Understanding Log Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-neutral-400" />
                <span className="font-medium">DEBUG</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Detailed information for debugging purposes
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-blue-500" />
                <span className="font-medium">INFO</span>
              </div>
              <p className="text-xs text-muted-foreground">
                General operational information
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-yellow-500" />
                <span className="font-medium">WARN</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Potential issues that need attention
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500" />
                <span className="font-medium">ERROR</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Errors that require immediate action
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
