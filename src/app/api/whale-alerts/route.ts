// src/app/api/whale-alerts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Redis from 'ioredis';

const WHALE_THRESHOLD = 500; // $500+ trades are considered whale trades
const TOP_TRADERS_COUNT = 10;

export interface WhaleAlert {
  id: string;
  traderUsername: string;
  traderWallet: string;
  market: string;
  ticker: string;
  position: 'yes' | 'no';
  size: number;
  price: number;
  timestamp: number;
  category: string;
}

function categorizeMarket(market: string): string {
  const lower = market.toLowerCase();
  if (lower.includes('trump') || lower.includes('biden') || lower.includes('election') || lower.includes('president')) {
    return 'Politics';
  }
  if (lower.includes('btc') || lower.includes('eth') || lower.includes('crypto') || lower.includes('bitcoin')) {
    return 'Crypto';
  }
  if (lower.includes('nfl') || lower.includes('nba') || lower.includes('mlb') || lower.includes('sports') || lower.includes('game')) {
    return 'Sports';
  }
  if (lower.includes('weather') || lower.includes('temperature') || lower.includes('hurricane')) {
    return 'Weather';
  }
  if (lower.includes('fed') || lower.includes('rate') || lower.includes('inflation') || lower.includes('gdp')) {
    return 'Economics';
  }
  return 'Other';
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50');
  const trader = searchParams.get('trader');
  const category = searchParams.get('category');
  const timeRange = searchParams.get('timeRange') || 'all'; // '24h', '7d', '30d', 'all'

  const redis = new Redis(process.env.KV_REDIS_URL!);

  try {
    // Get top traders by profit
    const tradersData = await redis.hgetall('traders');
    const traders = Object.entries(tradersData)
      .map(([username, json]) => {
        try {
          return { username, ...JSON.parse(json) };
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .sort((a: any, b: any) => (b.totalProfit || 0) - (a.totalProfit || 0))
      .slice(0, TOP_TRADERS_COUNT);

    const topTraderWallets = new Set(traders.map((t: any) => t.walletAddress));
    const topTraderUsernames = new Map(traders.map((t: any) => [t.walletAddress, t.username]));

    // Get all trades from top traders
    const whaleAlerts: WhaleAlert[] = [];

    for (const traderData of traders) {
      const t = traderData as any;
      const tradesRaw = await redis.lrange(`trades:${t.walletAddress}`, 0, 200);

      for (const tradeJson of tradesRaw) {
        try {
          const trade = JSON.parse(tradeJson);
          const amount = trade.amount || trade.size || 0;

          // Only include trades >= threshold from top traders
          if (amount >= WHALE_THRESHOLD) {
            const alert: WhaleAlert = {
              id: trade.id || `${t.walletAddress}-${trade.timestamp}`,
              traderUsername: t.username,
              traderWallet: t.walletAddress,
              market: trade.marketTitle || trade.ticker || 'Unknown Market',
              ticker: trade.ticker || '',
              position: trade.side || 'yes',
              size: amount,
              price: trade.price || 0.5,
              timestamp: trade.timestamp || Date.now(),
              category: categorizeMarket(trade.marketTitle || trade.ticker || ''),
            };
            whaleAlerts.push(alert);
          }
        } catch {
          // Skip invalid entries
        }
      }
    }

    // Also check recent trades stream for any whale trades
    const recentTradesRaw = await redis.lrange('trades:recent', 0, 500);
    for (const tradeJson of recentTradesRaw) {
      try {
        const trade = JSON.parse(tradeJson);
        const amount = trade.amount || trade.size || 0;

        if (amount >= WHALE_THRESHOLD && topTraderWallets.has(trade.walletAddress)) {
          // Check if we already have this trade
          const existingId = `${trade.walletAddress}-${trade.timestamp}`;
          if (!whaleAlerts.some(a => a.id === existingId || a.id === trade.id)) {
            const alert: WhaleAlert = {
              id: trade.id || existingId,
              traderUsername: topTraderUsernames.get(trade.walletAddress) || 'Unknown',
              traderWallet: trade.walletAddress,
              market: trade.marketTitle || trade.ticker || 'Unknown Market',
              ticker: trade.ticker || '',
              position: trade.side || 'yes',
              size: amount,
              price: trade.price || 0.5,
              timestamp: trade.timestamp || Date.now(),
              category: categorizeMarket(trade.marketTitle || trade.ticker || ''),
            };
            whaleAlerts.push(alert);
          }
        }
      } catch {
        // Skip invalid entries
      }
    }

    // Apply filters
    let filtered = whaleAlerts;

    // Filter by trader
    if (trader) {
      filtered = filtered.filter(a =>
        a.traderUsername.toLowerCase().includes(trader.toLowerCase())
      );
    }

    // Filter by category
    if (category && category !== 'all') {
      filtered = filtered.filter(a => a.category === category);
    }

    // Filter by time range
    const now = Date.now();
    if (timeRange === '24h') {
      filtered = filtered.filter(a => now - a.timestamp < 24 * 60 * 60 * 1000);
    } else if (timeRange === '7d') {
      filtered = filtered.filter(a => now - a.timestamp < 7 * 24 * 60 * 60 * 1000);
    } else if (timeRange === '30d') {
      filtered = filtered.filter(a => now - a.timestamp < 30 * 24 * 60 * 60 * 1000);
    }

    // Sort by timestamp descending
    filtered.sort((a, b) => b.timestamp - a.timestamp);

    // Limit results
    const limited = filtered.slice(0, Math.min(limit, 100));

    await redis.quit();

    return NextResponse.json({
      alerts: limited,
      total: filtered.length,
      threshold: WHALE_THRESHOLD,
      topTradersCount: traders.length,
    });
  } catch (error) {
    console.error('[WhaleAlerts] Error:', error);
    await redis.quit();
    return NextResponse.json(
      { error: 'Failed to fetch whale alerts' },
      { status: 500 }
    );
  }
}
