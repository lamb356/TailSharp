import { NextResponse } from 'next/server';
import Redis from 'ioredis';

const redis = new Redis(process.env.KV_REDIS_URL!);
const TRADES_KEY = 'executed-trades';

export async function GET() {
  try {
    // Get last 50 executed trades (most recent first)
    const items = await redis.lrange(TRADES_KEY, 0, 49);
    const trades = items.map((t) => JSON.parse(t));

    return NextResponse.json({ trades });
  } catch (err) {
    console.error('Error fetching executed trades:', err);
    return NextResponse.json(
      { error: 'Failed to fetch executed trades' },
      { status: 500 }
    );
  }
}
