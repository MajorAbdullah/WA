'use client';

/**
 * Command Palette Component
 * Cmd+K quick navigation and actions
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Home,
  MessageSquare,
  Users,
  Users2,
  Terminal,
  Radio,
  Settings,
  BarChart3,
  ScrollText,
  Search,
  Moon,
  Sun,
  LogOut,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { cn } from '@/lib/utils';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  action: () => void;
  keywords?: string[];
  category: 'navigation' | 'actions' | 'settings';
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const { setTheme, theme } = useTheme();

  // Define all commands
  const commands: CommandItem[] = useMemo(
    () => [
      // Navigation
      {
        id: 'home',
        label: 'Dashboard',
        description: 'Go to dashboard home',
        icon: Home,
        action: () => router.push('/'),
        keywords: ['home', 'overview'],
        category: 'navigation',
      },
      {
        id: 'messages',
        label: 'Messages',
        description: 'View all messages',
        icon: MessageSquare,
        action: () => router.push('/messages'),
        keywords: ['chat', 'inbox'],
        category: 'navigation',
      },
      {
        id: 'users',
        label: 'Users',
        description: 'Manage users',
        icon: Users,
        action: () => router.push('/users'),
        keywords: ['contacts', 'people'],
        category: 'navigation',
      },
      {
        id: 'groups',
        label: 'Groups',
        description: 'Manage groups',
        icon: Users2,
        action: () => router.push('/groups'),
        keywords: ['channels'],
        category: 'navigation',
      },
      {
        id: 'commands',
        label: 'Commands',
        description: 'Bot commands',
        icon: Terminal,
        action: () => router.push('/commands'),
        keywords: ['bot', 'cli'],
        category: 'navigation',
      },
      {
        id: 'broadcast',
        label: 'Broadcast',
        description: 'Send broadcasts',
        icon: Radio,
        action: () => router.push('/broadcast'),
        keywords: ['send', 'mass'],
        category: 'navigation',
      },
      {
        id: 'analytics',
        label: 'Analytics',
        description: 'View statistics',
        icon: BarChart3,
        action: () => router.push('/analytics'),
        keywords: ['stats', 'charts'],
        category: 'navigation',
      },
      {
        id: 'logs',
        label: 'Logs',
        description: 'View system logs',
        icon: ScrollText,
        action: () => router.push('/logs'),
        keywords: ['debug', 'errors'],
        category: 'navigation',
      },
      {
        id: 'settings',
        label: 'Settings',
        description: 'Configure settings',
        icon: Settings,
        action: () => router.push('/settings'),
        keywords: ['config', 'preferences'],
        category: 'navigation',
      },
      // Actions
      {
        id: 'new-broadcast',
        label: 'New Broadcast',
        description: 'Create a new broadcast message',
        icon: Radio,
        action: () => router.push('/broadcast/new'),
        keywords: ['send', 'message'],
        category: 'actions',
      },
      // Settings
      {
        id: 'toggle-theme',
        label: theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
        description: 'Toggle between light and dark theme',
        icon: theme === 'dark' ? Sun : Moon,
        action: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
        keywords: ['theme', 'mode', 'appearance'],
        category: 'settings',
      },
      {
        id: 'logout',
        label: 'Log Out',
        description: 'Sign out of the dashboard',
        icon: LogOut,
        action: async () => {
          await fetch('/api/auth/logout', { method: 'POST' });
          router.push('/login');
          router.refresh();
        },
        keywords: ['sign out', 'exit'],
        category: 'settings',
      },
    ],
    [router, setTheme, theme]
  );

  // Filter commands based on search
  const filteredCommands = useMemo(() => {
    if (!search) return commands;

    const searchLower = search.toLowerCase();
    return commands.filter((cmd) => {
      const matchLabel = cmd.label.toLowerCase().includes(searchLower);
      const matchDescription = cmd.description?.toLowerCase().includes(searchLower);
      const matchKeywords = cmd.keywords?.some((k) => k.includes(searchLower));
      return matchLabel || matchDescription || matchKeywords;
    });
  }, [commands, search]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {
      navigation: [],
      actions: [],
      settings: [],
    };

    filteredCommands.forEach((cmd) => {
      groups[cmd.category].push(cmd);
    });

    return groups;
  }, [filteredCommands]);

  // Reset selection when filtered results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Handle command execution
  const executeCommand = useCallback(
    (command: CommandItem) => {
      setOpen(false);
      setSearch('');
      command.action();
    },
    []
  );

  // Handle keyboard navigation within palette
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const totalItems = filteredCommands.length;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % totalItems);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            executeCommand(filteredCommands[selectedIndex]);
          }
          break;
      }
    },
    [filteredCommands, selectedIndex, executeCommand]
  );

  // Global keyboard shortcut to open palette
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: 'k',
        meta: true,
        callback: () => setOpen(true),
      },
      {
        key: 'Escape',
        callback: () => {
          if (open) {
            setOpen(false);
            setSearch('');
          }
        },
      },
    ],
  });

  const categoryLabels: Record<string, string> = {
    navigation: 'Navigation',
    actions: 'Actions',
    settings: 'Settings',
  };

  let currentIndex = 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 gap-0 max-w-lg">
        <DialogHeader className="sr-only">
          <DialogTitle>Command Palette</DialogTitle>
        </DialogHeader>
        <div className="flex items-center border-b px-3">
          <Search className="h-4 w-4 shrink-0 opacity-50" />
          <Input
            placeholder="Type a command or search..."
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            ESC
          </kbd>
        </div>

        <ScrollArea className="max-h-[300px]">
          {filteredCommands.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No commands found
            </div>
          ) : (
            <div className="p-2">
              {(['navigation', 'actions', 'settings'] as const).map((category) => {
                const items = groupedCommands[category];
                if (items.length === 0) return null;

                return (
                  <div key={category} className="mb-2">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      {categoryLabels[category]}
                    </div>
                    {items.map((cmd) => {
                      const itemIndex = currentIndex++;
                      const Icon = cmd.icon;
                      return (
                        <button
                          key={cmd.id}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors',
                            selectedIndex === itemIndex
                              ? 'bg-accent text-accent-foreground'
                              : 'hover:bg-muted'
                          )}
                          onClick={() => executeCommand(cmd)}
                          onMouseEnter={() => setSelectedIndex(itemIndex)}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <div className="flex-1 text-left">
                            <div className="font-medium">{cmd.label}</div>
                            {cmd.description && (
                              <div className="text-xs text-muted-foreground">
                                {cmd.description}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="flex items-center justify-between border-t p-2 text-xs text-muted-foreground">
          <div className="flex gap-2">
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-muted px-1">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-muted px-1">↵</kbd>
              Select
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="rounded border bg-muted px-1">⌘K</kbd>
            Toggle
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
