// src/app/api/admin/stats/route.ts
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
    // Get total traders
    const tradersCount = await redis.hlen('traders');

    // Get total trades (sum up recent trades list)
    const tradesCount = await redis.llen('trades:recent');

    // Get waitlist count
    const waitlistCount = await redis.scard('waitlist:emails');

    // Get active copy relationships (from copy settings)
    const copySettingsKeys = await redis.keys('copy-settings:*');
    let activeCopyCount = 0;
    for (const key of copySettingsKeys) {
      const settings = await redis.get(key);
      if (settings) {
        const parsed = JSON.parse(settings);
        if (Array.isArray(parsed)) {
          activeCopyCount += parsed.filter((s: any) => s.isActive).length;
        }
      }
    }

    // Get some additional stats
    const notificationKeys = await redis.keys('notifications:*');

    await redis.quit();

    return NextResponse.json({
      traders: tradersCount,
      trades: tradesCount,
      waitlist: waitlistCount,
      activeCopies: activeCopyCount,
      notificationUsers: notificationKeys.length,
    });
  } catch (error) {
    console.error('[Admin/Stats] Error:', error);
    await redis.quit();
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
