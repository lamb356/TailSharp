// src/app/api/test-matcher/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { KalshiClient } from '@/lib/kalshi/client';
import { findMatchingTicker, clearMarketCache } from '@/lib/kalshi/marketMatcher';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || 'Trump wins 2024 election';
  const fresh = searchParams.get('fresh') === 'true';

  try {
    const client = new KalshiClient(
      process.env.KALSHI_API_KEY_ID!,
      process.env.KALSHI_PRIVATE_KEY!,
      process.env.KALSHI_USE_DEMO === 'true'
    );

    if (fresh) {
      clearMarketCache();
    }

    console.log('\n========== MARKET MATCHER TEST ==========');
    console.log('Query:', query);
    console.log('==========================================\n');

    const ticker = await findMatchingTicker(client, query);

    return NextResponse.json({
      query,
      matchedTicker: ticker,
      success: ticker !== null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Test matcher error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        query
      },
      { status: 500 }
    );
  }
}