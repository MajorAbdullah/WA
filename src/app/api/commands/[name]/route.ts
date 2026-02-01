import { NextRequest, NextResponse } from 'next/server';
import {
  getCommandByName,
  updateCommand,
  toggleCommand,
  getCommandUsageStats,
} from '@/lib/db/queries';

interface RouteParams {
  params: Promise<{ name: string }>;
}

/**
 * GET /api/commands/:name
 * Get a specific command with usage stats
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { name } = await params;
    const command = getCommandByName(name);

    if (!command) {
      return NextResponse.json(
        { error: 'Command not found' },
        { status: 404 }
      );
    }

    // Get usage statistics
    const stats = getCommandUsageStats(name);

    // Transform to API format
    const transformedCommand = {
      name: command.name,
      description: command.description,
      aliases: JSON.parse(command.aliases) as string[],
      category: command.category,
      cooldown: command.cooldown,
      ownerOnly: Boolean(command.owner_only),
      enabled: Boolean(command.enabled),
      usageCount: command.usage_count,
      stats: {
        totalUsage: stats.totalUsage,
        recentUsage: stats.recentUsage,
        successRate: stats.successRate,
        dailyUsage: stats.dailyUsage,
      },
    };

    return NextResponse.json({ command: transformedCommand });
  } catch (error) {
    console.error('Error fetching command:', error);
    return NextResponse.json(
      { error: 'Failed to fetch command' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/commands/:name
 * Update command settings (enabled, cooldown)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { name } = await params;
    const body = await request.json();

    // Validate input
    const updates: { enabled?: boolean; cooldown?: number } = {};

    if (typeof body.enabled === 'boolean') {
      updates.enabled = body.enabled;
    }

    if (typeof body.cooldown === 'number' && body.cooldown >= 0) {
      updates.cooldown = body.cooldown;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid updates provided' },
        { status: 400 }
      );
    }

    const updatedCommand = updateCommand(name, updates);

    if (!updatedCommand) {
      return NextResponse.json(
        { error: 'Command not found' },
        { status: 404 }
      );
    }

    // Transform to API format
    const transformedCommand = {
      name: updatedCommand.name,
      description: updatedCommand.description,
      aliases: JSON.parse(updatedCommand.aliases) as string[],
      category: updatedCommand.category,
      cooldown: updatedCommand.cooldown,
      ownerOnly: Boolean(updatedCommand.owner_only),
      enabled: Boolean(updatedCommand.enabled),
      usageCount: updatedCommand.usage_count,
    };

    return NextResponse.json({
      success: true,
      command: transformedCommand,
    });
  } catch (error) {
    console.error('Error updating command:', error);
    return NextResponse.json(
      { error: 'Failed to update command' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/commands/:name/toggle
 * Toggle command enabled state
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { name } = await params;
    const url = new URL(request.url);

    // Check if this is a toggle action
    if (url.searchParams.get('action') === 'toggle') {
      const toggled = toggleCommand(name);

      if (!toggled) {
        return NextResponse.json(
          { error: 'Command not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        enabled: Boolean(toggled.enabled),
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error toggling command:', error);
    return NextResponse.json(
      { error: 'Failed to toggle command' },
      { status: 500 }
    );
  }
}
