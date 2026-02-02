'use client';

/**
 * Bot Configuration Settings Page
 * Configure bot name, prefix, owner, and basic behavior
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bot,
  ArrowLeft,
  Save,
  RefreshCw,
  Info,
} from 'lucide-react';
import Link from 'next/link';
import { useSettings, type BotConfig } from '@/hooks/use-settings';

// =============================================================================
// Form Schema
// =============================================================================

const botConfigSchema = z.object({
  name: z.string().min(1, 'Bot name is required').max(50, 'Bot name is too long'),
  prefix: z.string().min(1, 'Prefix is required').max(5, 'Prefix should be 1-5 characters'),
  owner: z.string().regex(/^[0-9]*$/, 'Owner should be a phone number (digits only)'),
  enableGroups: z.boolean(),
  autoRead: z.boolean(),
  showTyping: z.boolean(),
});

type BotConfigForm = z.infer<typeof botConfigSchema>;

// =============================================================================
// Main Page Component
// =============================================================================

export default function BotSettingsPage() {
  const router = useRouter();
  const { config, loading, saving, error, updateBotConfig, resetConfig } = useSettings();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<BotConfigForm>({
    resolver: zodResolver(botConfigSchema),
    defaultValues: {
      name: '',
      prefix: '!',
      owner: '',
      enableGroups: true,
      autoRead: false,
      showTyping: true,
    },
  });

  // Update form when config loads
  useEffect(() => {
    if (config?.bot) {
      reset({
        name: config.bot.name,
        prefix: config.bot.prefix,
        owner: config.bot.owner,
        enableGroups: config.bot.enableGroups,
        autoRead: config.bot.autoRead,
        showTyping: config.bot.showTyping,
      });
    }
  }, [config, reset]);

  // Handle form submission
  const onSubmit = async (data: BotConfigForm) => {
    const success = await updateBotConfig(data);
    if (success) {
      reset(data);
    }
  };

  // Handle reset to defaults
  const handleReset = async () => {
    if (confirm('Reset bot configuration to defaults?')) {
      const success = await resetConfig('bot');
      if (success && config?.bot) {
        reset(config.bot);
      }
    }
  };

  // Watch toggle values for controlled switches
  const enableGroups = watch('enableGroups');
  const autoRead = watch('autoRead');
  const showTyping = watch('showTyping');

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Card>
          <CardContent className="p-6 space-y-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bot className="h-6 w-6" />
              Bot Configuration
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure basic bot settings and behavior
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} disabled={saving}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-6">
          {/* Basic Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Settings</CardTitle>
              <CardDescription>
                Configure the bot&apos;s identity and command prefix
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Bot Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Bot Name</Label>
                <Input
                  id="name"
                  placeholder="WhatsApp Bot"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  This name is used in bot responses and logs
                </p>
              </div>

              {/* Command Prefix */}
              <div className="space-y-2">
                <Label htmlFor="prefix">Command Prefix</Label>
                <Input
                  id="prefix"
                  placeholder="!"
                  className="font-mono w-24"
                  maxLength={5}
                  {...register('prefix')}
                />
                {errors.prefix && (
                  <p className="text-sm text-destructive">{errors.prefix.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Characters that trigger bot commands (e.g., !, /, .)
                </p>
              </div>

              {/* Owner Number */}
              <div className="space-y-2">
                <Label htmlFor="owner">Owner Phone Number</Label>
                <Input
                  id="owner"
                  placeholder="1234567890"
                  {...register('owner')}
                />
                {errors.owner && (
                  <p className="text-sm text-destructive">{errors.owner.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Phone number with country code (digits only, no + or spaces)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Behavior Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Behavior Settings</CardTitle>
              <CardDescription>
                Control how the bot interacts with messages and groups
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable Groups */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Group Messages</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow the bot to respond to messages in groups
                  </p>
                </div>
                <Switch
                  checked={enableGroups}
                  onCheckedChange={(checked) => setValue('enableGroups', checked, { shouldDirty: true })}
                />
              </div>

              {/* Auto Read */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-Read Messages</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically mark incoming messages as read
                  </p>
                </div>
                <Switch
                  checked={autoRead}
                  onCheckedChange={(checked) => setValue('autoRead', checked, { shouldDirty: true })}
                />
              </div>

              {/* Show Typing */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Typing Indicator</Label>
                  <p className="text-sm text-muted-foreground">
                    Display &quot;typing...&quot; before sending responses
                  </p>
                </div>
                <Switch
                  checked={showTyping}
                  onCheckedChange={(checked) => setValue('showTyping', checked, { shouldDirty: true })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Response Timing */}
          <Card>
            <CardHeader>
              <CardTitle>Response Timing</CardTitle>
              <CardDescription>
                Configure delays to make responses feel more natural
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    Response timing settings
                  </p>
                  <p className="text-blue-700 dark:text-blue-200">
                    Advanced response timing settings are available in the Rate Limiting section.
                    These settings help prevent detection and bans by adding natural delays.
                  </p>
                  <Button variant="link" size="sm" className="px-0 h-auto mt-2" asChild>
                    <Link href="/settings/rate-limit">Go to Rate Limiting →</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/settings')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !isDirty}>
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
