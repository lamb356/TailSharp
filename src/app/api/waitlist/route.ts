// src/app/api/waitlist/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Redis from 'ioredis';

const redis = new Redis(process.env.KV_REDIS_URL!);

const WAITLIST_KEY = 'waitlist:emails';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// GET /api/waitlist - Get signup count
export async function GET() {
  try {
    const count = await redis.scard(WAITLIST_KEY);

    return NextResponse.json({
      count,
      // Add a base number for social proof (can be removed once real signups grow)
      displayCount: count + 500,
    });
  } catch (error) {
    console.error('[Waitlist] Error getting count:', error);
    return NextResponse.json(
      { error: 'Failed to get waitlist count' },
      { status: 500 }
    );
  }
}

// POST /api/waitlist - Add email to waitlist
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const normalizedEmail = email.toLowerCase().trim();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if already exists (sadd returns 0 if already in set)
    const added = await redis.sadd(WAITLIST_KEY, normalizedEmail);

    if (added === 0) {
      return NextResponse.json({
        success: true,
        message: 'You\'re already on the list!',
        alreadyExists: true,
      });
    }

    // Get new count
    const count = await redis.scard(WAITLIST_KEY);

    return NextResponse.json({
      success: true,
      message: 'Successfully joined the waitlist!',
      alreadyExists: false,
      count: count + 500, // Display count with base
    });
  } catch (error) {
    console.error('[Waitlist] Error adding email:', error);
    return NextResponse.json(
      { error: 'Failed to join waitlist' },
      { status: 500 }
    );
  }
}
