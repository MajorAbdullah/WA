import { NextResponse } from 'next/server';
import { getCommandStats, getAllCommands } from '@/lib/db/queries';

/**
 * GET /api/commands/stats
 * Get command usage statistics
 */
export async function GET() {
  try {
    // Get usage stats from command_logs
    const usageStats = getCommandStats();

    // Get all commands to include commands with zero usage
    const commands = getAllCommands();

    // Create a map of usage stats
    const statsMap = new Map(
      usageStats.map((stat) => [stat.command, stat])
    );

    // Merge command data with stats
    const stats = commands.map((cmd) => {
      const cmdStats = statsMap.get(cmd.name);
      return {
        command: cmd.name,
        category: cmd.category,
        enabled: Boolean(cmd.enabled),
        usageCount: cmd.usage_count,
        loggedCount: cmdStats?.count ?? 0,
        successRate: cmdStats?.successRate ?? 100,
      };
    });

    // Sort by usage count descending
    stats.sort((a, b) => b.usageCount - a.usageCount);

    // Calculate totals
    const totalCommands = commands.length;
    const enabledCommands = commands.filter((c) => c.enabled).length;
    const totalUsage = commands.reduce((sum, c) => sum + c.usage_count, 0);

    // Get top commands
    const topCommands = stats.slice(0, 10);

    // Group by category
    const byCategory = commands.reduce(
      (acc, cmd) => {
        const category = cmd.category;
        if (!acc[category]) {
          acc[category] = { count: 0, enabled: 0, usage: 0 };
        }
        acc[category].count++;
        if (cmd.enabled) acc[category].enabled++;
        acc[category].usage += cmd.usage_count;
        return acc;
      },
      {} as Record<string, { count: number; enabled: number; usage: number }>
    );

    return NextResponse.json({
      summary: {
        totalCommands,
        enabledCommands,
        disabledCommands: totalCommands - enabledCommands,
        totalUsage,
      },
      topCommands,
      byCategory,
      allStats: stats,
    });
  } catch (error) {
    console.error('Error fetching command stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch command statistics' },
      { status: 500 }
    );
  }
}
