// src/app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getNotifications } from '@/lib/notifications';

// GET /api/notifications - Fetch user's notifications
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get('wallet');
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  if (!walletAddress) {
    return NextResponse.json(
      { error: 'Wallet address is required' },
      { status: 400 }
    );
  }

  try {
    const result = await getNotifications(walletAddress, limit, offset);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Notifications] Error fetching:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}
