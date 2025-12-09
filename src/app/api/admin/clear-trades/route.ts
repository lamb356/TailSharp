import { NextRequest, NextResponse } from 'next/server';
import Redis from 'ioredis';

const redis = new Redis(process.env.KV_REDIS_URL!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const confirm = body.confirm;

    if (confirm !== 'DELETE_ALL_TRADES') {
      return NextResponse.json({
        error: 'Safety check failed',
        message: 'Send { "confirm": "DELETE_ALL_TRADES" } to confirm deletion',
      }, { status: 400 });
    }

    const deleted = await redis.del('executed-trades');

    return NextResponse.json({
      success: true,
      message: 'All executed trades have been cleared',
      keysDeleted: deleted,
    });
  } catch (error) {
    console.error('[Admin] Clear trades error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const count = await redis.llen('executed-trades');
    return NextResponse.json({
      tradesCount: count,
      message: 'POST with { "confirm": "DELETE_ALL_TRADES" } to clear all trades',
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}