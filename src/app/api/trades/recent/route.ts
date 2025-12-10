// src/app/api/trades/recent/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getRecentTrades } from '@/lib/trades';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const { trades, total } = await getRecentTrades(limit, offset);

    return NextResponse.json({
      success: true,
      trades,
      total,
      limit,
      offset,
      hasMore: offset + trades.length < total,
    });
  } catch (error) {
    console.error('[Recent Trades API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent trades', details: String(error) },
      { status: 500 }
    );
  }
}
