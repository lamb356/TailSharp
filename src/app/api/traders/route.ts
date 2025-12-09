// src/app/api/traders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Redis from 'ioredis';
import { TraderProfile } from '@/types/trader';

const redis = new Redis(process.env.KV_REDIS_URL!);
const TRADERS_KEY = 'traders';
const TRADERS_BY_WALLET_KEY = 'traders-by-wallet';

// GET /api/traders - List or search traders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase().trim();
    const sortBy = searchParams.get('sort') || 'followers';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get all traders
    const tradersData = await redis.hgetall(TRADERS_KEY);
    let traders: TraderProfile[] = Object.values(tradersData).map((t) => JSON.parse(t));

    // Search filter
    if (query) {
      const isWalletAddress = query.length >= 32 && query.length <= 44;
      
      if (isWalletAddress) {
        // Search by wallet address
        traders = traders.filter((t) => 
          t.walletAddress.toLowerCase().includes(query)
        );
      } else {
        // Search by username or display name
        traders = traders.filter((t) =>
          t.username.toLowerCase().includes(query) ||
          t.displayName.toLowerCase().includes(query)
        );
      }
    }

    // Sort
    traders.sort((a, b) => {
      switch (sortBy) {
        case 'roi':
          return b.stats.roi - a.stats.roi;
        case 'winRate':
          return b.stats.winRate - a.stats.winRate;
        case 'volume':
          return b.stats.totalVolume - a.stats.totalVolume;
        case 'followers':
        default:
          return b.stats.followers - a.stats.followers;
      }
    });

    // Limit results
    traders = traders.slice(0, limit);

    return NextResponse.json({
      traders,
      total: traders.length,
    });
  } catch (error) {
    console.error('Error fetching traders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch traders' },
      { status: 500 }
    );
  }
}

// POST /api/traders - Create/claim a trader profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, displayName, walletAddress, bio, twitter } = body;

    // Validate username
    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
    
    if (cleanUsername.length < 3 || cleanUsername.length > 20) {
      return NextResponse.json(
        { error: 'Username must be 3-20 characters (letters, numbers, underscores only)' },
        { status: 400 }
      );
    }

    // Validate wallet address
    if (!walletAddress || walletAddress.length < 32 || walletAddress.length > 44) {
      return NextResponse.json(
        { error: 'Valid Solana wallet address is required' },
        { status: 400 }
      );
    }

    // Check if username already taken
    const existingByUsername = await redis.hget(TRADERS_KEY, cleanUsername);
    if (existingByUsername) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 409 }
      );
    }

    // Check if wallet already has a profile
    const existingByWallet = await redis.hget(TRADERS_BY_WALLET_KEY, walletAddress);
    if (existingByWallet) {
      return NextResponse.json(
        { error: 'This wallet already has a profile' },
        { status: 409 }
      );
    }

    // Create trader profile
    const traderProfile: TraderProfile = {
      username: cleanUsername,
      displayName: displayName?.trim() || cleanUsername,
      walletAddress,
      bio: bio?.trim().slice(0, 160) || '',
      twitter: twitter?.replace('@', '').trim() || '',
      profileImage: '',
      verified: false,
      createdAt: Date.now(),
      stats: {
        totalTrades: 0,
        winRate: 0,
        roi: 0,
        followers: 0,
        totalVolume: 0,
      },
    };

    // Save to Redis
    await redis.hset(TRADERS_KEY, cleanUsername, JSON.stringify(traderProfile));
    await redis.hset(TRADERS_BY_WALLET_KEY, walletAddress, cleanUsername);

    return NextResponse.json({
      success: true,
      trader: traderProfile,
    });
  } catch (error) {
    console.error('Error creating trader profile:', error);
    return NextResponse.json(
      { error: 'Failed to create profile' },
      { status: 500 }
    );
  }
}