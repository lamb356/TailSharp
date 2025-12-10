// src/app/api/notifications/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  createNotification,
  notifyTraderFollowed,
  notifyTradeDetected,
  notifyCopyExecuted,
  NotificationType,
} from '@/lib/notifications';

// POST /api/notifications/create - Create a notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet, type, ...params } = body;

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        { error: 'Notification type is required' },
        { status: 400 }
      );
    }

    let notification;

    switch (type) {
      case NotificationType.TRADER_FOLLOWED:
        if (!params.traderId || !params.traderName) {
          return NextResponse.json(
            { error: 'traderId and traderName are required for TRADER_FOLLOWED' },
            { status: 400 }
          );
        }
        notification = await notifyTraderFollowed(
          wallet,
          params.traderId,
          params.traderName
        );
        break;

      case NotificationType.TRADE_DETECTED:
        if (!params.traderName || !params.marketTitle || !params.position) {
          return NextResponse.json(
            { error: 'traderName, marketTitle, and position are required for TRADE_DETECTED' },
            { status: 400 }
          );
        }
        notification = await notifyTradeDetected(
          wallet,
          params.traderName,
          params.marketTitle,
          params.position,
          params.txSignature || ''
        );
        break;

      case NotificationType.COPY_EXECUTED:
        if (!params.traderName || !params.marketTitle || !params.amount) {
          return NextResponse.json(
            { error: 'traderName, marketTitle, and amount are required for COPY_EXECUTED' },
            { status: 400 }
          );
        }
        notification = await notifyCopyExecuted(
          wallet,
          params.traderName,
          params.marketTitle,
          params.amount,
          params.txSignature
        );
        break;

      default:
        // Generic notification
        if (!params.title || !params.message) {
          return NextResponse.json(
            { error: 'title and message are required for generic notifications' },
            { status: 400 }
          );
        }
        notification = await createNotification(wallet, {
          type: type as NotificationType,
          title: params.title,
          message: params.message,
          metadata: params.metadata,
        });
    }

    return NextResponse.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error('[Notifications] Error creating:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}
