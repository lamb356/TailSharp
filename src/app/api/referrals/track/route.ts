// src/app/api/referrals/track/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Redis from 'ioredis';

interface Referral {
  wallet: string;
  signedUpAt: number;
  firstTradeAt: number | null;
  tenTradesAt: number | null;
  earned: number;
}

interface ReferralData {
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

const FIRST_TRADE_REWARD = 5;
const TEN_TRADES_BONUS = 5;

export async function POST(request: NextRequest) {
  const redis = new Redis(process.env.KV_REDIS_URL!);

  try {
    const body = await request.json();
    const { referralCode, wallet, milestone } = body;

    // milestone: 'signup' | 'first_trade' | 'ten_trades'

    if (!referralCode || !wallet || !milestone) {
      await redis.quit();
      return NextResponse.json(
        { error: 'referralCode, wallet, and milestone required' },
        { status: 400 }
      );
    }

    // Look up referrer by code
    const referrerWallet = await redis.get(`referral-codes:${referralCode}`);
    if (!referrerWallet) {
      await redis.quit();
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
    }

    // Prevent self-referral
    if (referrerWallet === wallet) {
      await redis.quit();
      return NextResponse.json({ error: 'Cannot refer yourself' }, { status: 400 });
    }

    // Get referrer's data
    const referralDataRaw = await redis.get(`referrals:${referrerWallet}`);
    if (!referralDataRaw) {
      await redis.quit();
      return NextResponse.json({ error: 'Referrer data not found' }, { status: 404 });
    }

    const data: ReferralData = JSON.parse(referralDataRaw);

    // Find or create referral entry
    let referral = data.referrals.find(r => r.wallet === wallet);

    if (milestone === 'signup') {
      if (referral) {
        await redis.quit();
        return NextResponse.json({
          success: true,
          message: 'User already signed up with this referral',
        });
      }

      // Create new referral entry
      referral = {
        wallet,
        signedUpAt: Date.now(),
        firstTradeAt: null,
        tenTradesAt: null,
        earned: 0,
      };
      data.referrals.push(referral);

      // Store that this user was referred (to track their progress)
      await redis.set(`referred-by:${wallet}`, referralCode);
    } else if (milestone === 'first_trade') {
      if (!referral) {
        await redis.quit();
        return NextResponse.json(
          { error: 'User must sign up first' },
          { status: 400 }
        );
      }

      if (referral.firstTradeAt) {
        await redis.quit();
        return NextResponse.json({
          success: true,
          message: 'First trade already tracked',
        });
      }

      // Award first trade bonus
      referral.firstTradeAt = Date.now();
      referral.earned += FIRST_TRADE_REWARD;
      data.balance += FIRST_TRADE_REWARD;
      data.totalEarned += FIRST_TRADE_REWARD;

      // Create notification for referrer
      await redis.lpush(`notifications:${referrerWallet}`, JSON.stringify({
        id: `ref-${Date.now()}`,
        type: 'referral_earned',
        message: `You earned $${FIRST_TRADE_REWARD}! Your referral made their first trade.`,
        timestamp: Date.now(),
        read: false,
      }));
    } else if (milestone === 'ten_trades') {
      if (!referral) {
        await redis.quit();
        return NextResponse.json(
          { error: 'User must sign up first' },
          { status: 400 }
        );
      }

      if (!referral.firstTradeAt) {
        await redis.quit();
        return NextResponse.json(
          { error: 'User must complete first trade milestone first' },
          { status: 400 }
        );
      }

      if (referral.tenTradesAt) {
        await redis.quit();
        return NextResponse.json({
          success: true,
          message: 'Ten trades already tracked',
        });
      }

      // Award 10 trades bonus
      referral.tenTradesAt = Date.now();
      referral.earned += TEN_TRADES_BONUS;
      data.balance += TEN_TRADES_BONUS;
      data.totalEarned += TEN_TRADES_BONUS;

      // Create notification for referrer
      await redis.lpush(`notifications:${referrerWallet}`, JSON.stringify({
        id: `ref-${Date.now()}`,
        type: 'referral_bonus',
        message: `Bonus! You earned $${TEN_TRADES_BONUS} - your referral hit 10 trades!`,
        timestamp: Date.now(),
        read: false,
      }));
    } else {
      await redis.quit();
      return NextResponse.json({ error: 'Invalid milestone' }, { status: 400 });
    }

    // Update referrer's data
    await redis.set(`referrals:${referrerWallet}`, JSON.stringify(data));

    await redis.quit();

    return NextResponse.json({
      success: true,
      milestone,
      referrerBalance: data.balance,
    });
  } catch (error) {
    console.error('[Referrals Track] Error:', error);
    await redis.quit();
    return NextResponse.json(
      { error: 'Failed to track referral milestone' },
      { status: 500 }
    );
  }
}

// Check if a user was referred
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');

  if (!wallet) {
    return NextResponse.json({ error: 'Wallet required' }, { status: 400 });
  }

  const redis = new Redis(process.env.KV_REDIS_URL!);

  try {
    const referralCode = await redis.get(`referred-by:${wallet}`);
    await redis.quit();

    return NextResponse.json({
      wasReferred: !!referralCode,
      referralCode: referralCode || null,
    });
  } catch (error) {
    console.error('[Referrals Track] GET Error:', error);
    await redis.quit();
    return NextResponse.json({ error: 'Failed to check referral status' }, { status: 500 });
  }
}
