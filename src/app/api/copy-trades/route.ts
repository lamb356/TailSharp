import { NextRequest, NextResponse } from 'next/server';
import Redis from 'ioredis';

const redis = new Redis(process.env.KV_REDIS_URL!);

export async function GET(request: NextRequest) {
  try {
    const tradesKey = 'executed-trades';
    const tradesData = await redis.lrange(tradesKey, 0, 99);
    
    const trades = tradesData.map((trade: string) => JSON.parse(trade));

    return NextResponse.json({
      trades,
      count: trades.length
    });
  } catch (error) {
    console.error('Failed to fetch copy trades:', error);
    return NextResponse.json({ error: 'Failed to fetch copy trades' }, { status: 500 });
  }
}
