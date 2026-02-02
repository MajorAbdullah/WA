"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  Pause,
  Play,
  Trash2,
  Download,
  ChevronDown,
} from "lucide-react";
import { useLogsStore } from "@/stores/logs-store";
import type { LogLevel } from "@/lib/socket/events";
import { cn } from "@/lib/utils";

interface LogFiltersProps {
  onDownload: () => void;
}

const levels: Array<{ value: LogLevel | "all"; label: string; color?: string }> = [
  { value: "all", label: "All Levels" },
  { value: "debug", label: "Debug", color: "text-neutral-400" },
  { value: "info", label: "Info", color: "text-blue-500" },
  { value: "warn", label: "Warning", color: "text-yellow-500" },
  { value: "error", label: "Error", color: "text-red-500" },
];

export function LogFilters({ onDownload }: LogFiltersProps) {
  const {
    levelFilter,
    searchQuery,
    isPaused,
    logs,
    setLevelFilter,
    setSearchQuery,
    togglePause,
    clearLogs,
    getFilteredLogs,
  } = useLogsStore();

  const filteredCount = getFilteredLogs().length;
  const totalCount = logs.length;

  const currentLevel = levels.find((l) => l.value === levelFilter);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center gap-2">
        {/* Level filter dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-[140px] justify-between">
              <span className={cn(currentLevel?.color)}>
                {currentLevel?.label}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[140px]">
            <DropdownMenuRadioGroup
              value={levelFilter}
              onValueChange={(value) => setLevelFilter(value as LogLevel | "all")}
            >
              {levels.map((level) => (
                <DropdownMenuRadioItem
                  key={level.value}
                  value={level.value}
                  className={cn(level.color)}
                >
                  {level.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Search input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Log count badge */}
        <Badge variant="secondary" className="hidden sm:flex">
          {filteredCount === totalCount
            ? `${totalCount} logs`
            : `${filteredCount} / ${totalCount}`}
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        {/* Pause/Resume button */}
        <Button
          variant={isPaused ? "default" : "outline"}
          size="sm"
          onClick={togglePause}
          className="gap-2"
        >
          {isPaused ? (
            <>
              <Play className="h-4 w-4" />
              <span className="hidden sm:inline">Resume</span>
            </>
          ) : (
            <>
              <Pause className="h-4 w-4" />
              <span className="hidden sm:inline">Pause</span>
            </>
          )}
        </Button>

        {/* Clear button */}
        <Button
          variant="outline"
          size="sm"
          onClick={clearLogs}
          disabled={totalCount === 0}
          className="gap-2"
        >
          <Trash2 className="h-4 w-4" />
          <span className="hidden sm:inline">Clear</span>
        </Button>

        {/* Download button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onDownload}
          disabled={filteredCount === 0}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Download</span>
        </Button>
      </div>
    </div>
  );
}
