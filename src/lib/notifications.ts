// src/lib/notifications.ts
// Server-side notification functions (uses Redis)
import Redis from 'ioredis';
import {
  NotificationType,
  Notification,
  CreateNotificationInput,
} from '@/types/notifications';

// Re-export types for convenience
export { NotificationType } from '@/types/notifications';
export type { Notification, CreateNotificationInput } from '@/types/notifications';

const redis = new Redis(process.env.KV_REDIS_URL!);

const NOTIFICATIONS_KEY_PREFIX = 'notifications:';
const NOTIFICATIONS_TTL = 60 * 60 * 24 * 30; // 30 days
const MAX_NOTIFICATIONS = 100;

/**
 * Generate a unique notification ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Create a new notification for a user
 */
export async function createNotification(
  walletAddress: string,
  input: CreateNotificationInput
): Promise<Notification> {
  const notification: Notification = {
    id: generateId(),
    type: input.type,
    title: input.title,
    message: input.message,
    read: false,
    createdAt: Math.floor(Date.now() / 1000),
    metadata: input.metadata,
  };

  const key = `${NOTIFICATIONS_KEY_PREFIX}${walletAddress}`;

  // Add to the beginning of the list (newest first)
  await redis.lpush(key, JSON.stringify(notification));

  // Trim to max notifications
  await redis.ltrim(key, 0, MAX_NOTIFICATIONS - 1);

  // Set/refresh TTL
  await redis.expire(key, NOTIFICATIONS_TTL);

  return notification;
}

/**
 * Get all notifications for a user
 */
export async function getNotifications(
  walletAddress: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> {
  const key = `${NOTIFICATIONS_KEY_PREFIX}${walletAddress}`;

  const total = await redis.llen(key);
  const rawNotifications = await redis.lrange(key, offset, offset + limit - 1);

  const notifications: Notification[] = rawNotifications.map((n) => JSON.parse(n));
  const unreadCount = notifications.filter((n) => !n.read).length;

  // For accurate unread count, we need to check all notifications
  if (offset > 0 || limit < total) {
    const allRaw = await redis.lrange(key, 0, -1);
    const allNotifications: Notification[] = allRaw.map((n) => JSON.parse(n));
    return {
      notifications,
      total,
      unreadCount: allNotifications.filter((n) => !n.read).length,
    };
  }

  return { notifications, total, unreadCount };
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsRead(
  walletAddress: string,
  notificationId: string
): Promise<boolean> {
  const key = `${NOTIFICATIONS_KEY_PREFIX}${walletAddress}`;

  const rawNotifications = await redis.lrange(key, 0, -1);
  const notifications: Notification[] = rawNotifications.map((n) => JSON.parse(n));

  const index = notifications.findIndex((n) => n.id === notificationId);
  if (index === -1) return false;

  notifications[index].read = true;

  // Replace the entire list (Redis doesn't support updating by index easily)
  await redis.del(key);
  if (notifications.length > 0) {
    await redis.rpush(key, ...notifications.map((n) => JSON.stringify(n)));
    await redis.expire(key, NOTIFICATIONS_TTL);
  }

  return true;
}

/**
 * Mark multiple notifications as read
 */
export async function markNotificationsAsRead(
  walletAddress: string,
  notificationIds: string[]
): Promise<number> {
  const key = `${NOTIFICATIONS_KEY_PREFIX}${walletAddress}`;

  const rawNotifications = await redis.lrange(key, 0, -1);
  const notifications: Notification[] = rawNotifications.map((n) => JSON.parse(n));

  let markedCount = 0;
  const idsSet = new Set(notificationIds);

  notifications.forEach((n) => {
    if (idsSet.has(n.id) && !n.read) {
      n.read = true;
      markedCount++;
    }
  });

  if (markedCount > 0) {
    await redis.del(key);
    if (notifications.length > 0) {
      await redis.rpush(key, ...notifications.map((n) => JSON.stringify(n)));
      await redis.expire(key, NOTIFICATIONS_TTL);
    }
  }

  return markedCount;
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(
  walletAddress: string
): Promise<number> {
  const key = `${NOTIFICATIONS_KEY_PREFIX}${walletAddress}`;

  const rawNotifications = await redis.lrange(key, 0, -1);
  const notifications: Notification[] = rawNotifications.map((n) => JSON.parse(n));

  let markedCount = 0;
  notifications.forEach((n) => {
    if (!n.read) {
      n.read = true;
      markedCount++;
    }
  });

  if (markedCount > 0) {
    await redis.del(key);
    if (notifications.length > 0) {
      await redis.rpush(key, ...notifications.map((n) => JSON.stringify(n)));
      await redis.expire(key, NOTIFICATIONS_TTL);
    }
  }

  return markedCount;
}

/**
 * Clear all notifications for a user
 */
export async function clearAllNotifications(
  walletAddress: string
): Promise<number> {
  const key = `${NOTIFICATIONS_KEY_PREFIX}${walletAddress}`;

  const total = await redis.llen(key);
  await redis.del(key);

  return total;
}

/**
 * Helper to create a trade detected notification
 */
export async function notifyTradeDetected(
  walletAddress: string,
  traderName: string,
  marketTitle: string,
  position: 'yes' | 'no',
  txSignature: string
): Promise<Notification> {
  return createNotification(walletAddress, {
    type: NotificationType.TRADE_DETECTED,
    title: `${traderName} made a trade`,
    message: `${position.toUpperCase()} on "${marketTitle}"`,
    metadata: {
      traderName,
      marketTitle,
      txSignature,
    },
  });
}

/**
 * Helper to create a copy executed notification
 */
export async function notifyCopyExecuted(
  walletAddress: string,
  traderName: string,
  marketTitle: string,
  amount: number,
  txSignature?: string
): Promise<Notification> {
  return createNotification(walletAddress, {
    type: NotificationType.COPY_EXECUTED,
    title: 'Copy trade executed',
    message: `Copied ${traderName}'s trade on "${marketTitle}" for $${amount.toFixed(2)}`,
    metadata: {
      traderName,
      marketTitle,
      amount,
      txSignature,
    },
  });
}

/**
 * Helper to create a trader followed notification
 */
export async function notifyTraderFollowed(
  walletAddress: string,
  traderId: string,
  traderName: string
): Promise<Notification> {
  return createNotification(walletAddress, {
    type: NotificationType.TRADER_FOLLOWED,
    title: 'Now copying trader',
    message: `You started copying ${traderName}. You'll receive alerts for their trades.`,
    metadata: {
      traderId,
      traderName,
    },
  });
}

/**
 * Helper to create a price alert notification
 */
export async function notifyPriceAlert(
  walletAddress: string,
  marketTitle: string,
  marketId: string,
  price: number,
  direction: 'up' | 'down'
): Promise<Notification> {
  return createNotification(walletAddress, {
    type: NotificationType.PRICE_ALERT,
    title: `Price ${direction === 'up' ? 'increased' : 'decreased'}`,
    message: `"${marketTitle}" is now at ${(price * 100).toFixed(0)}%`,
    metadata: {
      marketId,
      marketTitle,
      price,
    },
  });
}
