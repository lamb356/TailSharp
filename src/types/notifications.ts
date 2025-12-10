// src/types/notifications.ts
// Client-safe notification types (no server dependencies)

export enum NotificationType {
  TRADE_DETECTED = 'TRADE_DETECTED',
  COPY_EXECUTED = 'COPY_EXECUTED',
  TRADER_FOLLOWED = 'TRADER_FOLLOWED',
  PRICE_ALERT = 'PRICE_ALERT',
}

export interface NotificationMetadata {
  traderId?: string;
  traderName?: string;
  txSignature?: string;
  marketId?: string;
  marketTitle?: string;
  amount?: number;
  price?: number;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: number; // Unix timestamp
  metadata?: NotificationMetadata;
}

export interface CreateNotificationInput {
  type: NotificationType;
  title: string;
  message: string;
  metadata?: NotificationMetadata;
}
