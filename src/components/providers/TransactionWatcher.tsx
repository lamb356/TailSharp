'use client';

import { useTransactionWatcher } from '@/lib/hooks/useTransactionWatcher';
import { useTradeNotifications } from '@/lib/hooks/useTradeNotifications';

export const TransactionWatcher = () => {
  useTransactionWatcher(true);
  useTradeNotifications(true);
  return null;
};