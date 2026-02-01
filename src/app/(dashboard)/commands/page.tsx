"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CommandList } from "@/components/commands/command-list";
import { LoadingPage } from "@/components/shared/loading";
import { ErrorDisplay } from "@/components/shared/error";
import { Terminal, ToggleLeft, Clock, Hash } from "lucide-react";

interface Command {
  name: string;
  description: string;
  aliases: string[];
  category: string;
  cooldown: number;
  ownerOnly: boolean;
  enabled: boolean;
  usageCount: number;
}

interface CommandsResponse {
  commands: Command[];
  total: number;
}

interface StatsResponse {
  summary: {
    totalCommands: number;
    enabledCommands: number;
    disabledCommands: number;
    totalUsage: number;
  };
}

export default function CommandsPage() {
  const [commands, setCommands] = useState<Command[]>([]);
  const [stats, setStats] = useState<StatsResponse["summary"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCommands = useCallback(async () => {
    try {
      const [commandsRes, statsRes] = await Promise.all([
        fetch("/api/commands"),
        fetch("/api/commands/stats"),
      ]);

      if (!commandsRes.ok || !statsRes.ok) {
        throw new Error("Failed to fetch commands");
      }

      const commandsData: CommandsResponse = await commandsRes.json();
      const statsData: StatsResponse = await statsRes.json();

      setCommands(commandsData.commands);
      setStats(statsData.summary);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCommands();
  }, [fetchCommands]);

  const handleToggle = async (name: string, enabled: boolean) => {
    try {
      const res = await fetch(`/api/commands/${name}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });

      if (!res.ok) throw new Error("Failed to update command");

      // Update local state
      setCommands((prev) =>
        prev.map((cmd) =>
          cmd.name === name ? { ...cmd, enabled } : cmd
        )
      );

      // Update stats
      if (stats) {
        setStats({
          ...stats,
          enabledCommands: enabled
            ? stats.enabledCommands + 1
            : stats.enabledCommands - 1,
          disabledCommands: enabled
            ? stats.disabledCommands - 1
            : stats.disabledCommands + 1,
        });
      }
    } catch (err) {
      console.error("Failed to toggle command:", err);
      // Revert optimistic update by refetching
      fetchCommands();
    }
  };

  const handleUpdateCooldown = async (name: string, cooldown: number) => {
    try {
      const res = await fetch(`/api/commands/${name}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cooldown }),
      });

      if (!res.ok) throw new Error("Failed to update cooldown");

      // Update local state
      setCommands((prev) =>
        prev.map((cmd) =>
          cmd.name === name ? { ...cmd, cooldown } : cmd
        )
      );
    } catch (err) {
      console.error("Failed to update cooldown:", err);
      fetchCommands();
    }
  };

  if (loading) {
    return <LoadingPage message="Loading commands..." />;
  }

  if (error) {
    return (
      <ErrorDisplay
        title="Failed to load commands"
        message={error}
        onRetry={fetchCommands}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Commands</h1>
        <p className="text-muted-foreground">
          Manage and configure bot commands. Enable or disable commands and adjust cooldowns.
        </p>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Commands
              </CardTitle>
              <Terminal className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCommands}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Enabled
              </CardTitle>
              <ToggleLeft className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.enabledCommands}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Disabled
              </CardTitle>
              <ToggleLeft className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.disabledCommands}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Usage
              </CardTitle>
              <Hash className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalUsage.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Commands list */}
      <Card>
        <CardHeader>
          <CardTitle>All Commands</CardTitle>
          <CardDescription>
            Click the toggle to enable or disable a command. Use the settings icon to
            adjust cooldown.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CommandList
            commands={commands}
            onToggle={handleToggle}
            onUpdateCooldown={handleUpdateCooldown}
          />
        </CardContent>
      </Card>
    </div>
  );
}
