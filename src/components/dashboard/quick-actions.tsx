'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  MessageSquare,
  Users,
  Radio,
  Settings,
  BarChart3,
  Terminal,
  Send,
  UserPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

interface QuickAction {
  label: string;
  description?: string;
  href: string;
  icon: LucideIcon;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
}

interface QuickActionsProps {
  className?: string;
  compact?: boolean;
}

// =============================================================================
// Default Actions
// =============================================================================

const defaultActions: QuickAction[] = [
  {
    label: 'Messages',
    description: 'View conversations',
    href: '/messages',
    icon: MessageSquare,
  },
  {
    label: 'Users',
    description: 'Manage users',
    href: '/users',
    icon: Users,
  },
  {
    label: 'Broadcast',
    description: 'Send bulk messages',
    href: '/broadcast',
    icon: Radio,
  },
  {
    label: 'Settings',
    description: 'Bot configuration',
    href: '/settings',
    icon: Settings,
  },
];

const extendedActions: QuickAction[] = [
  ...defaultActions,
  {
    label: 'Analytics',
    description: 'View statistics',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    label: 'Commands',
    description: 'Manage commands',
    href: '/commands',
    icon: Terminal,
  },
];

// =============================================================================
// Quick Action Button Component
// =============================================================================

interface QuickActionButtonProps {
  action: QuickAction;
  compact?: boolean;
}

function QuickActionButton({ action, compact = false }: QuickActionButtonProps) {
  const Icon = action.icon;

  if (compact) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="justify-start gap-2"
        asChild
      >
        <Link href={action.href}>
          <Icon className="h-4 w-4" />
          <span>{action.label}</span>
        </Link>
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      className="h-auto flex-col items-start gap-1 p-4 hover:bg-accent"
      asChild
    >
      <Link href={action.href}>
        <div className="flex w-full items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="text-left">
            <span className="font-medium">{action.label}</span>
            {action.description && (
              <p className="text-xs text-muted-foreground">
                {action.description}
              </p>
            )}
          </div>
        </div>
      </Link>
    </Button>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function QuickActions({ className, compact = false }: QuickActionsProps) {
  const actions = compact ? defaultActions : defaultActions;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks and shortcuts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className={cn(
          'grid gap-3',
          compact ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2'
        )}>
          {actions.map((action) => (
            <QuickActionButton
              key={action.href}
              action={action}
              compact={compact}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Inline Quick Actions (for compact layouts)
// =============================================================================

interface InlineQuickActionsProps {
  className?: string;
}

export function InlineQuickActions({ className }: InlineQuickActionsProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {defaultActions.map((action) => (
        <Button
          key={action.href}
          variant="outline"
          size="sm"
          asChild
        >
          <Link href={action.href}>
            <action.icon className="mr-2 h-4 w-4" />
            {action.label}
          </Link>
        </Button>
      ))}
    </div>
  );
}

export default QuickActions;
