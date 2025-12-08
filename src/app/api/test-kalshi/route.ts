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

    // DEBUG: Check key format
    const keyPreview = {
      length: privateKey.length,
      startsWithLS: privateKey.startsWith('LS0tLS'),
      hasBEGIN: privateKey.includes('BEGIN'),
      first50: privateKey.substring(0, 50),
      hasNewlines: privateKey.includes('\n'),
    };

    console.log('Key debug info:', keyPreview);

    // Try to decode and see what we get
    let decoded = '';
    try {
      decoded = Buffer.from(privateKey, 'base64').toString('utf-8');
      console.log('Decoded preview:', decoded.substring(0, 100));
    } catch (e) {
      console.log('Failed to decode:', e);
    }

    const client = new KalshiClient(
      apiKeyId,
      privateKey,
      process.env.KALSHI_USE_DEMO === 'true'
    );

    const balance = await client.getBalance();

    return NextResponse.json({ ok: true, balance, debug: keyPreview });
  } catch (err: any) {
    console.error('Kalshi test error', err);
    return NextResponse.json(
      { error: err?.message || 'Unknown error', stack: err?.stack },
      { status: 500 }
    );
  }
}
