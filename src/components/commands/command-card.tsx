"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Clock, Hash, Shield, Settings2 } from "lucide-react";

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

interface CommandCardProps {
  command: Command;
  onToggle: (name: string, enabled: boolean) => Promise<void>;
  onUpdateCooldown: (name: string, cooldown: number) => Promise<void>;
}

const categoryColors: Record<string, string> = {
  general: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  owner: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  utility: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  fun: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
};

export function CommandCard({ command, onToggle, onUpdateCooldown }: CommandCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [cooldownValue, setCooldownValue] = useState(command.cooldown.toString());

  const handleToggle = async () => {
    setIsUpdating(true);
    try {
      await onToggle(command.name, !command.enabled);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCooldownSave = async () => {
    const newCooldown = parseInt(cooldownValue, 10);
    if (isNaN(newCooldown) || newCooldown < 0) return;

    setIsUpdating(true);
    try {
      await onUpdateCooldown(command.name, newCooldown);
      setIsEditOpen(false);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className={cn("transition-opacity", !command.enabled && "opacity-60")}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-mono text-lg font-semibold">!{command.name}</h3>
              {command.ownerOnly && (
                <Badge variant="outline" className="gap-1">
                  <Shield className="h-3 w-3" />
                  Owner
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{command.description}</p>
          </div>
          <Switch
            checked={command.enabled}
            onCheckedChange={handleToggle}
            disabled={isUpdating}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          {/* Category */}
          <Badge
            variant="secondary"
            className={cn("capitalize", categoryColors[command.category])}
          >
            {command.category}
          </Badge>

          {/* Aliases */}
          {command.aliases.length > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Hash className="h-3.5 w-3.5" />
              <span>
                {command.aliases.map((a) => `!${a}`).join(", ")}
              </span>
            </div>
          )}

          {/* Cooldown */}
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>{command.cooldown}s</span>
          </div>

          {/* Usage count */}
          <div className="ml-auto text-muted-foreground">
            <span className="font-medium text-foreground">
              {command.usageCount.toLocaleString()}
            </span>{" "}
            uses
          </div>

          {/* Edit button */}
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings2 className="h-4 w-4" />
                <span className="sr-only">Edit command settings</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit !{command.name}</DialogTitle>
                <DialogDescription>
                  Update the cooldown settings for this command.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="cooldown">Cooldown (seconds)</Label>
                  <Input
                    id="cooldown"
                    type="number"
                    min="0"
                    value={cooldownValue}
                    onChange={(e) => setCooldownValue(e.target.value)}
                    placeholder="Enter cooldown in seconds"
                  />
                  <p className="text-xs text-muted-foreground">
                    Time users must wait between using this command.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCooldownSave} disabled={isUpdating}>
                  {isUpdating ? "Saving..." : "Save changes"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
