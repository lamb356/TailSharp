// src/lib/hooks/useTransactionWatcher.ts
import { useEffect, useRef, useCallback } from 'react';
import { getRecentTransactions, Transaction } from '@/lib/solana/transactions';
import { useNotifications } from '@/lib/store/useNotifications';
import { useStore } from '@/lib/store/useStore';

interface WatcherState {
  lastSignatures: Map<string, string>; // walletAddress -> lastSeenSignature
}

export const useTransactionWatcher = (enabled: boolean = true) => {
  const { copySettings } = useStore();
  const { addNotification } = useNotifications();
  const stateRef = useRef<WatcherState>({ lastSignatures: new Map() });

  const activeWallets = copySettings.filter((s) => s.isActive).map((s) => s.traderId);

  const checkForNewTransactions = useCallback(async () => {
    if (activeWallets.length === 0) return;

    for (const walletAddress of activeWallets) {
      try {
        const transactions = await getRecentTransactions(walletAddress, 1);
        
        if (transactions.length === 0) continue;

        const latestTx = transactions[0];
        const lastSeen = stateRef.current.lastSignatures.get(walletAddress);

        // First run - just store the signature
        if (!lastSeen) {
          stateRef.current.lastSignatures.set(walletAddress, latestTx.signature);
          continue;
        }

        // New transaction detected!
        if (latestTx.signature !== lastSeen) {
          stateRef.current.lastSignatures.set(walletAddress, latestTx.signature);

          const shortAddr = `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;

          addNotification({
            type: 'trade',
            title: '🔔 New Transaction Detected',
            message: `${shortAddr} just made a move!`,
            walletAddress,
            txSignature: latestTx.signature,
          });
        }
      } catch (error) {
        console.error(`Failed to check transactions for ${walletAddress}:`, error);
      }
    }
  }, [activeWallets, addNotification]);

  useEffect(() => {
    if (!enabled || activeWallets.length === 0) return;

    // Initial check
    checkForNewTransactions();

    // Poll every 10 seconds
    const interval = setInterval(checkForNewTransactions, 10000);

    return () => clearInterval(interval);
  }, [enabled, activeWallets.length, checkForNewTransactions]);

  return { activeWallets: activeWallets.length };
};
