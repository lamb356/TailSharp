// src/app/api/trades/[wallet]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getTradesByWallet, getTradeStats, TradeFilter } from '@/lib/trades';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ wallet: string }> }
) {
  try {
    const { wallet } = await params;

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const includeStats = searchParams.get('stats') === 'true';

    // Build filter from query params
    const filter: TradeFilter = {};
    const platform = searchParams.get('platform');
    const position = searchParams.get('position');
    const action = searchParams.get('action');
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');

    if (platform) filter.platform = platform;
    if (position === 'yes' || position === 'no') filter.position = position;
    if (action === 'buy' || action === 'sell') filter.action = action;
    if (startTime) filter.startTime = parseInt(startTime);
    if (endTime) filter.endTime = parseInt(endTime);

    const { trades, total } = await getTradesByWallet(wallet, limit, offset, filter);

    let stats = null;
    if (includeStats) {
      stats = await getTradeStats(wallet);
    }

    return NextResponse.json({
      success: true,
      wallet,
      trades,
      total,
      limit,
      offset,
      hasMore: offset + trades.length < total,
      stats,
    });
  } catch (error) {
    console.error('[Trades API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trades', details: String(error) },
      { status: 500 }
    );
  }
}
