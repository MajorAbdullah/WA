'use client';

/**
 * Settings Overview Page
 * Main settings page with navigation to sub-pages
 */

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Bot,
  Shield,
  Smartphone,
  Clock,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { useSettings } from '@/hooks/use-settings';
import { useBotStatus } from '@/hooks/use-bot-status';

// =============================================================================
// Settings Section Card Component
// =============================================================================

interface SettingsSectionProps {
  title: string;
  description: string;
  href: string;
  icon: typeof Settings;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

function SettingsSection({
  title,
  description,
  href,
  icon: Icon,
  badge,
  badgeVariant = 'secondary',
}: SettingsSectionProps) {
  return (
    <Link href={href}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{title}</h3>
                  {badge && <Badge variant={badgeVariant}>{badge}</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// =============================================================================
// Main Page Component
// =============================================================================

export default function SettingsPage() {
  const { config, loading, resetConfig, saving } = useSettings();
  const { isConnected, phoneNumber } = useBotStatus();

  const handleResetAll = async () => {
    if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      await resetConfig('all');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure your WhatsApp bot behavior and preferences
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleResetAll}
          disabled={saving}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${saving ? 'animate-spin' : ''}`} />
          Reset All
        </Button>
      </div>

      {/* Current Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Bot Name</p>
              <p className="font-medium">{config?.bot.name || 'Loading...'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Prefix</p>
              <p className="font-medium font-mono">{config?.bot.prefix || '!'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Connection</p>
              <Badge variant={isConnected ? 'default' : 'secondary'}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{phoneNumber || 'Not connected'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Sections */}
      <div className="grid gap-4">
        <SettingsSection
          title="Bot Configuration"
          description="Configure bot name, prefix, owner, and basic behavior"
          href="/settings/bot"
          icon={Bot}
        />

        <SettingsSection
          title="Rate Limiting"
          description="Set message limits and anti-spam protection"
          href="/settings/rate-limit"
          icon={Shield}
        />

        <SettingsSection
          title="Response Settings"
          description="Configure typing delays and response behavior"
          href="/settings/bot"
          icon={Clock}
          badge="Advanced"
        />

        <SettingsSection
          title="Session Management"
          description="Manage WhatsApp connection and session data"
          href="/settings/session"
          icon={Smartphone}
          badge={isConnected ? 'Active' : 'Inactive'}
          badgeVariant={isConnected ? 'default' : 'secondary'}
        />
      </div>

      {/* Quick Settings Preview */}
      {config && !loading && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Overview</CardTitle>
            <CardDescription>Current configuration summary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Bot Settings</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>Groups: {config.bot.enableGroups ? 'Enabled' : 'Disabled'}</li>
                  <li>Auto-read: {config.bot.autoRead ? 'On' : 'Off'}</li>
                  <li>Typing indicator: {config.bot.showTyping ? 'On' : 'Off'}</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Rate Limits</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>Per user: {config.rateLimit.perUser}/min</li>
                  <li>Per group: {config.rateLimit.perGroup}/min</li>
                  <li>Global: {config.rateLimit.global}/min</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Response Timing</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>Min delay: {config.response.minDelay}ms</li>
                  <li>Max delay: {config.response.maxDelay}ms</li>
                  <li>Typing speed: {config.response.typingSpeed}ms/char</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
