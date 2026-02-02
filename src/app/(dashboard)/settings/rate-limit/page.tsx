'use client';

/**
 * Rate Limiting Settings Page
 * Configure message rate limits and response timing
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  Shield,
  ArrowLeft,
  Save,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { useSettings } from '@/hooks/use-settings';
import { toast } from 'sonner';

// =============================================================================
// Form Schema
// =============================================================================

const rateLimitSchema = z.object({
  // Rate limits
  perUser: z.number().min(1).max(1000),
  perGroup: z.number().min(1).max(1000),
  global: z.number().min(1).max(10000),
  blockDuration: z.number().min(1).max(3600),
  // Response timing
  minDelay: z.number().min(0).max(10000),
  maxDelay: z.number().min(0).max(30000),
  typingSpeed: z.number().min(0).max(500),
}).refine((data) => data.maxDelay >= data.minDelay, {
  message: 'Max delay must be greater than or equal to min delay',
  path: ['maxDelay'],
});

type RateLimitForm = z.infer<typeof rateLimitSchema>;

// =============================================================================
// Main Page Component
// =============================================================================

export default function RateLimitSettingsPage() {
  const router = useRouter();
  const {
    config,
    loading,
    saving,
    error,
    updateRateLimitConfig,
    updateResponseConfig,
    resetConfig,
  } = useSettings();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<RateLimitForm>({
    resolver: zodResolver(rateLimitSchema),
    defaultValues: {
      perUser: 30,
      perGroup: 60,
      global: 300,
      blockDuration: 60,
      minDelay: 500,
      maxDelay: 2000,
      typingSpeed: 50,
    },
  });

  // Update form when config loads
  useEffect(() => {
    if (config) {
      reset({
        perUser: config.rateLimit.perUser,
        perGroup: config.rateLimit.perGroup,
        global: config.rateLimit.global,
        blockDuration: config.rateLimit.blockDuration,
        minDelay: config.response.minDelay,
        maxDelay: config.response.maxDelay,
        typingSpeed: config.response.typingSpeed,
      });
    }
  }, [config, reset]);

  // Handle form submission
  const onSubmit = async (data: RateLimitForm) => {
    const rateLimitSuccess = await updateRateLimitConfig({
      perUser: data.perUser,
      perGroup: data.perGroup,
      global: data.global,
      blockDuration: data.blockDuration,
    });

    const responseSuccess = await updateResponseConfig({
      minDelay: data.minDelay,
      maxDelay: data.maxDelay,
      typingSpeed: data.typingSpeed,
    });

    if (rateLimitSuccess && responseSuccess) {
      reset(data);
      toast.success('Rate limiting settings saved successfully');
    } else {
      toast.error('Failed to save settings');
    }
  };

  // Handle reset to defaults
  const handleReset = async () => {
    if (confirm('Reset rate limiting and response settings to defaults?')) {
      const rateLimitResult = await resetConfig('rateLimit');
      const responseResult = await resetConfig('response');
      if (rateLimitResult && responseResult) {
        toast.success('Settings reset to defaults');
      } else {
        toast.error('Failed to reset settings');
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Card>
          <CardContent className="p-6 space-y-6">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
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
              <Shield className="h-6 w-6" />
              Rate Limiting
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure anti-spam protection and response timing
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

      {/* Warning Banner */}
      <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-900 dark:text-yellow-100">
                Important: Anti-Ban Protection
              </p>
              <p className="text-yellow-700 dark:text-yellow-200">
                These settings help prevent your number from being banned by WhatsApp.
                Setting values too high may result in account restrictions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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
          {/* Rate Limits */}
          <Card>
            <CardHeader>
              <CardTitle>Message Rate Limits</CardTitle>
              <CardDescription>
                Maximum messages per minute for different scopes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Per User */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="perUser">Per User Limit</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="perUser"
                      type="number"
                      min={1}
                      max={1000}
                      {...register('perUser', { valueAsNumber: true })}
                    />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      /min
                    </span>
                  </div>
                  {errors.perUser && (
                    <p className="text-sm text-destructive">{errors.perUser.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Maximum messages from a single user per minute
                  </p>
                </div>

                {/* Per Group */}
                <div className="space-y-2">
                  <Label htmlFor="perGroup">Per Group Limit</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="perGroup"
                      type="number"
                      min={1}
                      max={1000}
                      {...register('perGroup', { valueAsNumber: true })}
                    />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      /min
                    </span>
                  </div>
                  {errors.perGroup && (
                    <p className="text-sm text-destructive">{errors.perGroup.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Maximum messages in a single group per minute
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Global */}
                <div className="space-y-2">
                  <Label htmlFor="global">Global Limit</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="global"
                      type="number"
                      min={1}
                      max={10000}
                      {...register('global', { valueAsNumber: true })}
                    />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      /min
                    </span>
                  </div>
                  {errors.global && (
                    <p className="text-sm text-destructive">{errors.global.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Maximum total messages per minute across all chats
                  </p>
                </div>

                {/* Block Duration */}
                <div className="space-y-2">
                  <Label htmlFor="blockDuration">Block Duration</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="blockDuration"
                      type="number"
                      min={1}
                      max={3600}
                      {...register('blockDuration', { valueAsNumber: true })}
                    />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      seconds
                    </span>
                  </div>
                  {errors.blockDuration && (
                    <p className="text-sm text-destructive">{errors.blockDuration.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    How long to block after exceeding rate limits
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Response Timing */}
          <Card>
            <CardHeader>
              <CardTitle>Response Timing</CardTitle>
              <CardDescription>
                Add delays to make bot responses feel more natural
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Min Delay */}
                <div className="space-y-2">
                  <Label htmlFor="minDelay">Minimum Delay</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="minDelay"
                      type="number"
                      min={0}
                      max={10000}
                      {...register('minDelay', { valueAsNumber: true })}
                    />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      ms
                    </span>
                  </div>
                  {errors.minDelay && (
                    <p className="text-sm text-destructive">{errors.minDelay.message}</p>
                  )}
                </div>

                {/* Max Delay */}
                <div className="space-y-2">
                  <Label htmlFor="maxDelay">Maximum Delay</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="maxDelay"
                      type="number"
                      min={0}
                      max={30000}
                      {...register('maxDelay', { valueAsNumber: true })}
                    />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      ms
                    </span>
                  </div>
                  {errors.maxDelay && (
                    <p className="text-sm text-destructive">{errors.maxDelay.message}</p>
                  )}
                </div>

                {/* Typing Speed */}
                <div className="space-y-2">
                  <Label htmlFor="typingSpeed">Typing Speed</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="typingSpeed"
                      type="number"
                      min={0}
                      max={500}
                      {...register('typingSpeed', { valueAsNumber: true })}
                    />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      ms/char
                    </span>
                  </div>
                  {errors.typingSpeed && (
                    <p className="text-sm text-destructive">{errors.typingSpeed.message}</p>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Response delay is randomly chosen between min and max. Typing indicator duration
                is based on message length × typing speed.
              </p>
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
