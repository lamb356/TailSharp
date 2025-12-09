// src/app/api/traders/[username]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Redis from 'ioredis';
import { TraderProfile } from '@/types/trader';

const redis = new Redis(process.env.KV_REDIS_URL!);
const TRADERS_KEY = 'traders';
const TRADERS_BY_WALLET_KEY = 'traders-by-wallet';

// GET /api/traders/[username] - Get a single trader profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const cleanUsername = username.toLowerCase().trim();

    // First try to find by username
    let traderData = await redis.hget(TRADERS_KEY, cleanUsername);

    // If not found, check if it's a wallet address
    if (!traderData && cleanUsername.length >= 32) {
      const usernameFromWallet = await redis.hget(TRADERS_BY_WALLET_KEY, cleanUsername);
      if (usernameFromWallet) {
        traderData = await redis.hget(TRADERS_KEY, usernameFromWallet);
      }
    }

    if (!traderData) {
      return NextResponse.json(
        { error: 'Trader not found' },
        { status: 404 }
      );
    }

    const trader: TraderProfile = JSON.parse(traderData);

    return NextResponse.json({ trader });
  } catch (error) {
    console.error('Error fetching trader:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trader' },
      { status: 500 }
    );
  }
}

// PATCH /api/traders/[username] - Update a trader profile
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const cleanUsername = username.toLowerCase().trim();
    const body = await request.json();

    const traderData = await redis.hget(TRADERS_KEY, cleanUsername);
    if (!traderData) {
      return NextResponse.json(
        { error: 'Trader not found' },
        { status: 404 }
      );
    }

    const trader: TraderProfile = JSON.parse(traderData);

    // Update allowed fields
    if (body.displayName) trader.displayName = body.displayName.trim().slice(0, 50);
    if (body.bio !== undefined) trader.bio = body.bio.trim().slice(0, 160);
    if (body.twitter !== undefined) trader.twitter = body.twitter.replace('@', '').trim();
    if (body.profileImage) trader.profileImage = body.profileImage;

    // Save updated profile
    await redis.hset(TRADERS_KEY, cleanUsername, JSON.stringify(trader));

    return NextResponse.json({
      success: true,
      trader,
    });
  } catch (error) {
    console.error('Error updating trader:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}