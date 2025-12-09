import { useEffect, useRef, useCallback } from 'react';
import { useNotifications } from '@/lib/store/useNotifications';

interface ExecutedTrade {
  id: string;
  originalTrade: {
    market: string;
    side: 'YES' | 'NO';
    walletAddress: string;
  };
  status: 'pending' | 'executed' | 'failed';
  error?: string;
  kalshiTicker?: string;
  isSimulation?: boolean;
}

export const useTradeNotifications = (enabled: boolean = true) => {
  const { addNotification } = useNotifications();
  const seenTradeIds = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);

  const checkForNewTrades = useCallback(async () => {
    try {
      const res = await fetch('/api/executed-trades');
      const data = await res.json();
      const trades: ExecutedTrade[] = data.trades || [];

      if (isFirstLoad.current) {
        trades.forEach(t => seenTradeIds.current.add(t.id));
        isFirstLoad.current = false;
        return;
      }

      for (const trade of trades) {
        if (seenTradeIds.current.has(trade.id)) continue;

        seenTradeIds.current.add(trade.id);

        const shortWallet = trade.originalTrade.walletAddress.slice(0, 4) + '...' + trade.originalTrade.walletAddress.slice(-4);
        const simLabel = trade.isSimulation ? ' (Sim)' : '';

        if (trade.status === 'executed') {
          addNotification({
            type: 'trade',
            title: 'Copy Trade Executed' + simLabel,
            message: trade.originalTrade.side + ' ' + (trade.kalshiTicker || trade.originalTrade.market) + ' - ' + shortWallet,
          });
        } else if (trade.status === 'failed') {
          const isNoMatch = trade.error?.includes('No matching');
          addNotification({
            type: isNoMatch ? 'warning' : 'error',
            title: isNoMatch ? 'No Market Match' : 'Trade Failed',
            message: trade.originalTrade.market + ' - ' + (trade.error || 'Unknown error'),
          });
        }
      }
    } catch (error) {
      console.error('[TradeNotifications] Error checking trades:', error);
    }
  }, [addNotification]);

  useEffect(() => {
    if (!enabled) return;

    checkForNewTrades();

    const interval = setInterval(checkForNewTrades, 5000);

    return () => clearInterval(interval);
  }, [enabled, checkForNewTrades]);
};