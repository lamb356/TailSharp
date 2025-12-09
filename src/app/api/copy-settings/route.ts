import { NextRequest, NextResponse } from 'next/server';
import Redis from 'ioredis';

const redis = new Redis(process.env.KV_REDIS_URL!);
const SETTINGS_KEY = 'copy-settings';

export async function GET() {
  try {
    const data = await redis.get(SETTINGS_KEY);
    const settings = data ? JSON.parse(data) : [];
    return NextResponse.json({ settings });
  } catch (err) {
    console.error('Error fetching copy settings:', err);
    return NextResponse.json(
      { error: 'Failed to fetch copy settings' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: 'Body must be an array of settings' },
        { status: 400 }
      );
    }

    // Basic validation / normalization
    const cleaned = body.map((s) => ({
      traderId: String(s.traderId),
      isActive: Boolean(s.isActive),
      allocationUsd: Number(s.allocationUsd) || 0,
      maxPositionPercent: Number(s.maxPositionPercent) || 0,
    }));

    await redis.set(SETTINGS_KEY, JSON.stringify(cleaned));
    return NextResponse.json({ ok: true, settings: cleaned });
  } catch (err) {
    console.error('Error updating copy settings:', err);
    return NextResponse.json(
      { error: 'Failed to update copy settings' },
      { status: 500 }
    );
  }
}
