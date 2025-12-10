// src/app/api/admin/activity/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Redis from 'ioredis';

const ADMIN_SECRET = process.env.ADMIN_SECRET;

export async function GET(request: NextRequest) {
  // Verify admin secret
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');

  if (!ADMIN_SECRET || key !== ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const redis = new Redis(process.env.KV_REDIS_URL!);

  try {
    // Get recent trades
    const recentTradesRaw = await redis.lrange('trades:recent', 0, 19);
    const recentTrades = recentTradesRaw.map((t) => {
      try {
        return JSON.parse(t);
      } catch {
        return null;
      }
    }).filter(Boolean);

    // Get all traders and sort by createdAt to find recent registrations
    const tradersData = await redis.hgetall('traders');
    const traders = Object.values(tradersData)
      .map((t) => {
        try {
          return JSON.parse(t);
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 10);

    await redis.quit();

    return NextResponse.json({
      recentTrades,
      recentTraders: traders,
    });
  } catch (error) {
    console.error('[Admin/Activity] Error:', error);
    await redis.quit();
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    );
  }
}
