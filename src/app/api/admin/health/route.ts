// src/app/api/admin/health/route.ts
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

  const health: {
    redis: { status: string; latency?: number; error?: string };
    helius: { status: string; lastWebhook?: number; error?: string };
    environment: { [key: string]: boolean };
  } = {
    redis: { status: 'unknown' },
    helius: { status: 'unknown' },
    environment: {},
  };

  // Check Redis
  try {
    const redis = new Redis(process.env.KV_REDIS_URL!);
    const start = Date.now();
    await redis.ping();
    const latency = Date.now() - start;

    // Get last webhook timestamp if stored
    const lastWebhook = await redis.get('system:last_webhook');

    health.redis = {
      status: 'connected',
      latency,
    };

    if (lastWebhook) {
      health.helius = {
        status: 'active',
        lastWebhook: parseInt(lastWebhook, 10),
      };
    } else {
      health.helius = {
        status: 'no_data',
      };
    }

    await redis.quit();
  } catch (error) {
    health.redis = {
      status: 'error',
      error: String(error),
    };
  }

  // Check environment variables
  health.environment = {
    KV_REDIS_URL: !!process.env.KV_REDIS_URL,
    ADMIN_SECRET: !!process.env.ADMIN_SECRET,
    NEXT_PUBLIC_HELIUS_API_KEY: !!process.env.NEXT_PUBLIC_HELIUS_API_KEY,
    NEXT_PUBLIC_HELIUS_RPC_URL: !!process.env.NEXT_PUBLIC_HELIUS_RPC_URL,
    KALSHI_API_KEY_ID: !!process.env.KALSHI_API_KEY_ID,
    KALSHI_PRIVATE_KEY: !!process.env.KALSHI_PRIVATE_KEY,
  };

  const allHealthy =
    health.redis.status === 'connected' &&
    Object.values(health.environment).every(Boolean);

  return NextResponse.json({
    status: allHealthy ? 'healthy' : 'degraded',
    timestamp: Date.now(),
    ...health,
  });
}
