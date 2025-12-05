// src/components/providers/TransactionWatcher.tsx
'use client';

import { useTransactionWatcher } from '@/lib/hooks/useTransactionWatcher';

export const TransactionWatcher = () => {
  useTransactionWatcher(true);
  return null; // This component just runs the hook
};
