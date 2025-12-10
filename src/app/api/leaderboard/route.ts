// src/app/api/leaderboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Redis from 'ioredis';
import { TraderProfile } from '@/types/trader';

const redis = new Redis(process.env.KV_REDIS_URL!);
const TRADERS_KEY = 'traders';

type SortField = 'roi' | 'winRate' | 'totalTrades' | 'totalVolume' | 'followers';
type TimePeriod = '24h' | '7d' | '30d' | 'all';

interface LeaderboardEntry extends TraderProfile {
  rank: number;
  change?: number; // Position change from previous period
}

// GET /api/leaderboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') || '7d') as TimePeriod;
    const sortBy = (searchParams.get('sort') || 'roi') as SortField;
    const order = searchParams.get('order') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Get all traders
    const tradersData = await redis.hgetall(TRADERS_KEY);
    let traders: TraderProfile[] = Object.values(tradersData).map((t) =>
      JSON.parse(t)
    );

    // Filter by time period (in a real app, this would filter trades by timestamp)
    // For now, we'll use the stats as-is since we don't have historical data
    // In production, you'd have separate stats for each time period
    const periodMultiplier = getPeriodMultiplier(period);

    // Apply some variance to simulate period-specific stats
    traders = traders.map((trader) => ({
      ...trader,
      stats: {
        ...trader.stats,
        // Adjust ROI based on period (shorter periods = more volatile)
        roi: trader.stats.roi * periodMultiplier + (Math.random() - 0.5) * 10,
        // Adjust volume based on period
        totalVolume: Math.floor(trader.stats.totalVolume * getPeriodVolumeMultiplier(period)),
        // Trades in period
        totalTrades: Math.floor(trader.stats.totalTrades * getPeriodVolumeMultiplier(period)),
      },
    }));

    // Sort traders
    traders.sort((a, b) => {
      let aVal: number, bVal: number;

      switch (sortBy) {
        case 'roi':
          aVal = a.stats.roi;
          bVal = b.stats.roi;
          break;
        case 'winRate':
          aVal = a.stats.winRate;
          bVal = b.stats.winRate;
          break;
        case 'totalTrades':
          aVal = a.stats.totalTrades;
          bVal = b.stats.totalTrades;
          break;
        case 'totalVolume':
          aVal = a.stats.totalVolume;
          bVal = b.stats.totalVolume;
          break;
        case 'followers':
          aVal = a.stats.followers;
          bVal = b.stats.followers;
          break;
        default:
          aVal = a.stats.roi;
          bVal = b.stats.roi;
      }

      return order === 'desc' ? bVal - aVal : aVal - bVal;
    });

    // Get total count before pagination
    const total = traders.length;

    // Apply pagination
    const paginatedTraders = traders.slice(offset, offset + limit);

    // Add ranks
    const rankedTraders: LeaderboardEntry[] = paginatedTraders.map(
      (trader, index) => ({
        ...trader,
        rank: offset + index + 1,
        change: Math.floor(Math.random() * 5) - 2, // Simulated position change
      })
    );

    return NextResponse.json({
      success: true,
      traders: rankedTraders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + limit < total,
      },
      filters: {
        period,
        sortBy,
        order,
      },
    });
  } catch (error) {
    console.error('[Leaderboard] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard', details: String(error) },
      { status: 500 }
    );
  }
}

function getPeriodMultiplier(period: TimePeriod): number {
  switch (period) {
    case '24h':
      return 0.15;
    case '7d':
      return 0.5;
    case '30d':
      return 0.8;
    case 'all':
    default:
      return 1;
  }
}

function getPeriodVolumeMultiplier(period: TimePeriod): number {
  switch (period) {
    case '24h':
      return 0.03;
    case '7d':
      return 0.2;
    case '30d':
      return 0.6;
    case 'all':
    default:
      return 1;
  }
}
