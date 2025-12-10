// src/app/api/referrals/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Redis from 'ioredis';
import crypto from 'crypto';

export interface Referral {
  wallet: string;
  signedUpAt: number;
  firstTradeAt: number | null;
  tenTradesAt: number | null;
  earned: number;
}

export interface ReferralData {
  code: string;
  balance: number;
  totalEarned: number;
  totalPaidOut: number;
  referrals: Referral[];
  payouts: {
    amount: number;
    timestamp: number;
    method: string;
    status: 'pending' | 'completed';
  }[];
  createdAt: number;
}

const FIRST_TRADE_REWARD = 5; // $5 for first trade
const TEN_TRADES_BONUS = 5; // $5 bonus for 10+ trades
const PAYOUT_THRESHOLD = 25; // Minimum $25 to withdraw

function generateReferralCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');

  if (!wallet) {
    return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
  }

  const redis = new Redis(process.env.KV_REDIS_URL!);

  try {
    const referralDataRaw = await redis.get(`referrals:${wallet}`);

    if (!referralDataRaw) {
      await redis.quit();
      return NextResponse.json({
        hasReferralCode: false,
        code: null,
        balance: 0,
        totalEarned: 0,
        referrals: [],
        payouts: [],
        payoutThreshold: PAYOUT_THRESHOLD,
        rewards: {
          firstTrade: FIRST_TRADE_REWARD,
          tenTrades: TEN_TRADES_BONUS,
        },
      });
    }

    const data: ReferralData = JSON.parse(referralDataRaw);

    await redis.quit();

    return NextResponse.json({
      hasReferralCode: true,
      code: data.code,
      balance: data.balance,
      totalEarned: data.totalEarned,
      totalPaidOut: data.totalPaidOut,
      referrals: data.referrals,
      referralCount: data.referrals.length,
      activeReferrals: data.referrals.filter(r => r.firstTradeAt).length,
      payouts: data.payouts,
      payoutThreshold: PAYOUT_THRESHOLD,
      canWithdraw: data.balance >= PAYOUT_THRESHOLD,
      rewards: {
        firstTrade: FIRST_TRADE_REWARD,
        tenTrades: TEN_TRADES_BONUS,
      },
    });
  } catch (error) {
    console.error('[Referrals] GET Error:', error);
    await redis.quit();
    return NextResponse.json({ error: 'Failed to fetch referral data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');

  if (!wallet) {
    return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
  }

  const redis = new Redis(process.env.KV_REDIS_URL!);

  try {
    // Check if user already has a referral code
    const existingData = await redis.get(`referrals:${wallet}`);
    if (existingData) {
      const data: ReferralData = JSON.parse(existingData);
      await redis.quit();
      return NextResponse.json({
        success: true,
        code: data.code,
        message: 'Referral code already exists',
      });
    }

    // Generate unique code
    let code = generateReferralCode();
    let attempts = 0;
    while (await redis.exists(`referral-codes:${code}`)) {
      code = generateReferralCode();
      attempts++;
      if (attempts > 10) {
        // Add wallet suffix if having collision issues
        code = generateReferralCode() + wallet.slice(-2).toUpperCase();
        break;
      }
    }

    // Create referral data
    const referralData: ReferralData = {
      code,
      balance: 0,
      totalEarned: 0,
      totalPaidOut: 0,
      referrals: [],
      payouts: [],
      createdAt: Date.now(),
    };

    // Store in Redis
    await redis.set(`referrals:${wallet}`, JSON.stringify(referralData));
    await redis.set(`referral-codes:${code}`, wallet);

    await redis.quit();

    return NextResponse.json({
      success: true,
      code,
      message: 'Referral code created',
    });
  } catch (error) {
    console.error('[Referrals] POST Error:', error);
    await redis.quit();
    return NextResponse.json({ error: 'Failed to create referral code' }, { status: 500 });
  }
}

// Request payout
export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');
  const action = searchParams.get('action');

  if (!wallet) {
    return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
  }

  const redis = new Redis(process.env.KV_REDIS_URL!);

  try {
    const referralDataRaw = await redis.get(`referrals:${wallet}`);
    if (!referralDataRaw) {
      await redis.quit();
      return NextResponse.json({ error: 'No referral data found' }, { status: 404 });
    }

    const data: ReferralData = JSON.parse(referralDataRaw);

    if (action === 'request-payout') {
      if (data.balance < PAYOUT_THRESHOLD) {
        await redis.quit();
        return NextResponse.json({
          error: `Minimum balance of $${PAYOUT_THRESHOLD} required for payout`,
        }, { status: 400 });
      }

      // Create payout request
      const payoutAmount = data.balance;
      data.payouts.push({
        amount: payoutAmount,
        timestamp: Date.now(),
        method: 'pending', // Will be filled when admin processes
        status: 'pending',
      });
      data.totalPaidOut += payoutAmount;
      data.balance = 0;

      await redis.set(`referrals:${wallet}`, JSON.stringify(data));

      // Add to admin payout queue
      await redis.lpush('referral-payouts-pending', JSON.stringify({
        wallet,
        amount: payoutAmount,
        timestamp: Date.now(),
      }));

      await redis.quit();

      return NextResponse.json({
        success: true,
        message: 'Payout requested',
        amount: payoutAmount,
      });
    }

    await redis.quit();
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[Referrals] PUT Error:', error);
    await redis.quit();
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
