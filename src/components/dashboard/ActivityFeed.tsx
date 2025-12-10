// src/components/dashboard/ActivityFeed.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Trade } from '@/lib/trades';

type Platform = 'all' | 'polymarket' | 'drift' | 'kalshi' | 'unknown';

interface TraderInfo {
  walletAddress: string;
  username?: string;
  displayName?: string;
}

interface ActivityFeedProps {
  limit?: number;
  autoRefreshInterval?: number;
  showFilters?: boolean;
}

export function ActivityFeed({
  limit = 20,
  autoRefreshInterval = 30000,
  showFilters = true,
}: ActivityFeedProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [platform, setPlatform] = useState<Platform>('all');
  const [traderMap, setTraderMap] = useState<Record<string, TraderInfo>>({});
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Fetch trader info for wallet addresses
  const fetchTraderInfo = useCallback(async (walletAddresses: string[]) => {
    const uniqueAddresses = [...new Set(walletAddresses)];
    const newTraderMap: Record<string, TraderInfo> = { ...traderMap };

    for (const wallet of uniqueAddresses) {
      if (newTraderMap[wallet]) continue;

      try {
        // Try to find trader by wallet address
        const res = await fetch(`/api/traders?q=${wallet}&limit=1`);
        const data = await res.json();

        if (data.traders && data.traders.length > 0) {
          const trader = data.traders[0];
          newTraderMap[wallet] = {
            walletAddress: wallet,
            username: trader.username,
            displayName: trader.displayName,
          };
        } else {
          newTraderMap[wallet] = { walletAddress: wallet };
        }
      } catch {
        newTraderMap[wallet] = { walletAddress: wallet };
      }
    }

    setTraderMap(newTraderMap);
  }, [traderMap]);

  // Fetch trades
  const fetchTrades = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`/api/trades/recent?limit=${limit}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch trades');
      }

      const newTrades: Trade[] = data.trades || [];
      setTrades(newTrades);
      setLastRefresh(new Date());

      // Fetch trader info for all wallets
      const wallets = newTrades.map((t) => t.walletAddress);
      fetchTraderInfo(wallets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trades');
    } finally {
      setLoading(false);
    }
  }, [limit, fetchTraderInfo]);

  // Initial fetch
  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;

    const interval = setInterval(fetchTrades, autoRefreshInterval);
    return () => clearInterval(interval);
  }, [autoRefreshInterval, fetchTrades]);

  // Filter trades by platform
  const filteredTrades = platform === 'all'
    ? trades
    : trades.filter((t) => t.platform === platform);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const platformColors: Record<Platform, string> = {
    all: '',
    polymarket: 'bg-purple-500/20 text-purple-400',
    drift: 'bg-blue-500/20 text-blue-400',
    kalshi: 'bg-orange-500/20 text-orange-400',
    unknown: 'bg-slate-500/20 text-slate-400',
  };

  const platformOptions: { value: Platform; label: string }[] = [
    { value: 'all', label: 'All Platforms' },
    { value: 'polymarket', label: 'Polymarket' },
    { value: 'drift', label: 'Drift' },
    { value: 'kalshi', label: 'Kalshi' },
  ];

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Live Activity Feed</h2>
          <p className="text-slate-500 text-sm">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        {showFilters && (
          <div className="flex items-center gap-2">
            {platformOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPlatform(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  platform === opt.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="divide-y divide-slate-700/50">
        {loading ? (
          // Loading skeleton
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-700 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-700 rounded w-3/4" />
                  <div className="h-3 bg-slate-700 rounded w-1/2" />
                </div>
                <div className="w-16 h-4 bg-slate-700 rounded" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-400 mb-2">{error}</p>
            <button
              onClick={fetchTrades}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              Try again
            </button>
          </div>
        ) : filteredTrades.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-400 mb-2">No trades found</p>
            <p className="text-slate-500 text-sm">
              {platform !== 'all'
                ? `No ${platform} trades recorded yet`
                : 'Trades will appear here as they are detected'}
            </p>
          </div>
        ) : (
          filteredTrades.map((trade) => {
            const trader = traderMap[trade.walletAddress];
            const isYes = trade.position === 'yes';
            const isBuy = trade.action === 'buy';

            return (
              <div
                key={trade.id}
                className="px-6 py-4 hover:bg-slate-700/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Trader Avatar */}
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-400 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {trader?.displayName?.charAt(0).toUpperCase() ||
                      trade.walletAddress.slice(0, 2).toUpperCase()}
                  </div>

                  {/* Trade Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Trader Name/Link */}
                      {trader?.username ? (
                        <Link
                          href={`/traders/${trader.username}`}
                          className="text-white font-medium hover:text-blue-400 transition-colors"
                        >
                          {trader.displayName || trader.username}
                        </Link>
                      ) : (
                        <a
                          href={`https://solscan.io/account/${trade.walletAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white font-medium font-mono hover:text-blue-400 transition-colors"
                        >
                          {shortenAddress(trade.walletAddress)}
                        </a>
                      )}

                      {/* Action */}
                      <span className="text-slate-400">
                        {isBuy ? 'bought' : 'sold'}
                      </span>

                      {/* Position */}
                      <span
                        className={`px-2 py-0.5 text-xs font-semibold rounded ${
                          isYes
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {trade.position.toUpperCase()}
                      </span>

                      {/* Platform */}
                      <span
                        className={`px-2 py-0.5 text-xs rounded ${
                          platformColors[trade.platform as Platform] ||
                          platformColors.unknown
                        }`}
                      >
                        {trade.platform}
                      </span>
                    </div>

                    {/* Market */}
                    <p className="text-slate-300 text-sm mt-1 truncate">
                      {trade.market.title}
                    </p>

                    {/* Details */}
                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                      <span>
                        {trade.size.toFixed(0)} contracts @ ${trade.price.toFixed(2)}
                      </span>
                      <span className={isBuy ? 'text-red-400' : 'text-green-400'}>
                        {isBuy ? '-' : '+'}${trade.cost.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="text-right shrink-0">
                    <p className="text-slate-500 text-sm">{formatTime(trade.timestamp)}</p>
                    <a
                      href={`https://solscan.io/tx/${trade.signature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 font-mono"
                    >
                      View tx
                    </a>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {!loading && filteredTrades.length > 0 && (
        <div className="px-6 py-3 border-t border-slate-700 flex items-center justify-between">
          <p className="text-slate-500 text-sm">
            Showing {filteredTrades.length} of {trades.length} trades
          </p>
          <button
            onClick={fetchTrades}
            className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
        </div>
      )}
    </div>
  );
}
