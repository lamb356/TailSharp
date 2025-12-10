// src/app/api/notifications/read/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  markNotificationAsRead,
  markNotificationsAsRead,
  markAllNotificationsAsRead,
} from '@/lib/notifications';

// POST /api/notifications/read - Mark notification(s) as read
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet, notificationId, notificationIds, all } = body;

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Mark all as read
    if (all === true) {
      const count = await markAllNotificationsAsRead(wallet);
      return NextResponse.json({
        success: true,
        message: `Marked ${count} notifications as read`,
        count,
      });
    }

    // Mark multiple as read
    if (notificationIds && Array.isArray(notificationIds)) {
      const count = await markNotificationsAsRead(wallet, notificationIds);
      return NextResponse.json({
        success: true,
        message: `Marked ${count} notifications as read`,
        count,
      });
    }

    // Mark single as read
    if (notificationId) {
      const success = await markNotificationAsRead(wallet, notificationId);
      if (!success) {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        message: 'Notification marked as read',
      });
    }

    return NextResponse.json(
      { error: 'Must provide notificationId, notificationIds, or all=true' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Notifications] Error marking as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}
