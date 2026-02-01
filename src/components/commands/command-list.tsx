"use client";

import { useState } from "react";
import { CommandCard } from "./command-card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Terminal } from "lucide-react";

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

interface CommandListProps {
  commands: Command[];
  onToggle: (name: string, enabled: boolean) => Promise<void>;
  onUpdateCooldown: (name: string, cooldown: number) => Promise<void>;
}

const categories = [
  { value: "all", label: "All" },
  { value: "general", label: "General" },
  { value: "utility", label: "Utility" },
  { value: "admin", label: "Admin" },
  { value: "owner", label: "Owner" },
  { value: "fun", label: "Fun" },
];

export function CommandList({ commands, onToggle, onUpdateCooldown }: CommandListProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  // Filter commands based on search and category
  const filteredCommands = commands.filter((cmd) => {
    const matchesSearch =
      search === "" ||
      cmd.name.toLowerCase().includes(search.toLowerCase()) ||
      cmd.description.toLowerCase().includes(search.toLowerCase()) ||
      cmd.aliases.some((a) => a.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = category === "all" || cmd.category === category;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search commands..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category tabs */}
        <Tabs value={category} onValueChange={setCategory}>
          <TabsList>
            {categories.map((cat) => (
              <TabsTrigger key={cat.value} value={cat.value}>
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Command grid */}
      {filteredCommands.length === 0 ? (
        <EmptyState
          icon={Terminal}
          title="No commands found"
          description={
            search
              ? `No commands match "${search}". Try a different search term.`
              : "No commands available in this category."
          }
          action={
            search
              ? {
                  label: "Clear search",
                  onClick: () => setSearch(""),
                }
              : undefined
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredCommands.map((command) => (
            <CommandCard
              key={command.name}
              command={command}
              onToggle={onToggle}
              onUpdateCooldown={onUpdateCooldown}
            />
          ))}
        </div>
      )}
    </div>
  );
}
