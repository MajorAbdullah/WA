import { NextResponse } from 'next/server';
import { getAllCommands, seedDefaultCommands } from '@/lib/db/queries';

/**
 * GET /api/commands
 * List all bot commands
 */
export async function GET() {
  try {
    // Seed default commands if database is empty
    seedDefaultCommands();

    const commands = getAllCommands();

    // Transform database format to API format
    const transformedCommands = commands.map((cmd) => ({
      name: cmd.name,
      description: cmd.description,
      aliases: JSON.parse(cmd.aliases) as string[],
      category: cmd.category,
      cooldown: cmd.cooldown,
      ownerOnly: Boolean(cmd.owner_only),
      enabled: Boolean(cmd.enabled),
      usageCount: cmd.usage_count,
    }));

    return NextResponse.json({
      commands: transformedCommands,
      total: transformedCommands.length,
    });
  } catch (error) {
    console.error('Error fetching commands:', error);
    return NextResponse.json(
      { error: 'Failed to fetch commands' },
      { status: 500 }
    );
  }
}
