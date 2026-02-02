'use client';

/**
 * New Broadcast Page
 * Form to create a new broadcast
 */

import Link from 'next/link';
import { BroadcastForm } from '@/components/broadcast';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Radio } from 'lucide-react';

export default function NewBroadcastPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/broadcast">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Radio className="h-6 w-6" />
            New Broadcast
          </h1>
          <p className="text-muted-foreground mt-1">
            Create a new broadcast message
          </p>
        </div>
      </div>

      {/* Form */}
      <BroadcastForm />
    </div>
  );
}
