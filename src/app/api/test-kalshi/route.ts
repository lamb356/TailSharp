import { NextResponse } from 'next/server';
import { KalshiClient } from '@/lib/kalshi/client';

export async function GET() {
  try {
    const apiKeyId = process.env.KALSHI_API_KEY_ID;
    const privateKey = process.env.KALSHI_PRIVATE_KEY;

    if (!apiKeyId || !privateKey) {
      return NextResponse.json(
        { error: 'Missing Kalshi env vars' },
        { status: 500 }
      );
    }

    const client = new KalshiClient(
      apiKeyId,
      privateKey,
      process.env.KALSHI_USE_DEMO === 'true'
    );

    const balance = await client.getBalance();

    return NextResponse.json({ ok: true, balance });
  } catch (err: any) {
    console.error('Kalshi test error', err);
    return NextResponse.json(
      { error: err?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
