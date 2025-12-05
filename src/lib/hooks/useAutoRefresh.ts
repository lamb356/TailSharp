// src/lib/hooks/useAutoRefresh.ts
import { useEffect, useCallback } from 'react';
import { getWalletData, WalletData } from '@/lib/solana/tracker';

interface UseAutoRefreshProps {
  wallets: WalletData[];
  setWallets: React.Dispatch<React.SetStateAction<WalletData[]>>;
  intervalMs?: number;
  enabled?: boolean;
}

export const useAutoRefresh = ({
  wallets,
  setWallets,
  intervalMs = 15000, // 15 seconds default
  enabled = true,
}: UseAutoRefreshProps) => {
  const refreshWallets = useCallback(async () => {
    if (wallets.length === 0) return;

    try {
      const updatedWallets = await Promise.all(
        wallets.map((wallet) => getWalletData(wallet.address))
      );
      setWallets(updatedWallets);
    } catch (error) {
      console.error('Failed to refresh wallets:', error);
    }
  }, [wallets, setWallets]);

  useEffect(() => {
    if (!enabled || wallets.length === 0) return;

    const interval = setInterval(refreshWallets, intervalMs);

    return () => clearInterval(interval);
  }, [enabled, wallets.length, intervalMs, refreshWallets]);

  return { refreshWallets };
};
