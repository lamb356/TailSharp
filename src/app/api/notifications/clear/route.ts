// src/app/api/notifications/clear/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { clearAllNotifications } from '@/lib/notifications';

// POST /api/notifications/clear - Clear all notifications
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet } = body;

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const count = await clearAllNotifications(wallet);

    return NextResponse.json({
      success: true,
      message: `Cleared ${count} notifications`,
      count,
    });
  } catch (error) {
    console.error('[Notifications] Error clearing:', error);
    return NextResponse.json(
      { error: 'Failed to clear notifications' },
      { status: 500 }
    );
  }
}
