// src/app/leaderboard/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { TraderProfile } from '@/types/trader';
import { CopyTradesModal } from '@/components/traders/CopyTradesModal';
import { useNotifications } from '@/lib/store/useNotifications';

type TimePeriod = '24h' | '7d' | '30d' | 'all';
type SortField = 'roi' | 'winRate' | 'totalTrades' | 'totalVolume' | 'followers';
type SortOrder = 'asc' | 'desc';

interface LeaderboardEntry extends TraderProfile {
  rank: number;
  change?: number;
}

const TIME_PERIODS: { value: TimePeriod; label: string }[] = [
  { value: '24h', label: '24 Hours' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: 'all', label: 'All Time' },
];

export default function LeaderboardPage() {
  const [traders, setTraders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<TimePeriod>('7d');
  const [sortBy, setSortBy] = useState<SortField>('roi');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTrader, setSelectedTrader] = useState<TraderProfile | null>(null);
  const [showCopyModal, setShowCopyModal] = useState(false);

  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { addNotification } = useNotifications();

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        period,
        sort: sortBy,
        order: sortOrder,
        page: page.toString(),
        limit: '20',
      });

      const res = await fetch(`/api/leaderboard?${params}`);
      const data = await res.json();

      if (res.ok && data.traders) {
        setTraders(data.traders);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }, [period, sortBy, sortOrder, page]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const handleCopy = (trader: TraderProfile) => {
    if (!connected) {
      setVisible(true);
      return;
    }
    setSelectedTrader(trader);
    setShowCopyModal(true);
  };

  const handleCopySuccess = () => {
    addNotification({
      type: 'info',
      title: 'Copy Trading Activated',
      message: `Now copying trades from ${selectedTrader?.displayName}`,
    });
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/50';
    if (rank === 2) return 'bg-gradient-to-r from-slate-400/20 to-slate-300/20 border-slate-400/50';
    if (rank === 3) return 'bg-gradient-to-r from-orange-600/20 to-amber-600/20 border-orange-500/50';
    return 'bg-slate-800/50 border-slate-700';
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/30">
          <span className="text-lg">🥇</span>
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center shadow-lg shadow-slate-400/30">
          <span className="text-lg">🥈</span>
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
          <span className="text-lg">🥉</span>
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
        <span className="text-white font-bold">{rank}</span>
      </div>
    );
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) {
      return (
        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return (
      <svg className={`w-4 h-4 text-blue-400 ${sortOrder === 'asc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-teal-600/20" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative max-w-7xl mx-auto px-6 py-16">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-white mb-4">
              Top <span className="bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">Traders</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Discover the best performing prediction market traders and copy their winning strategies
            </p>
          </div>

          {/* Time Period Selector */}
          <div className="flex justify-center mt-8">
            <div className="inline-flex bg-slate-800/80 backdrop-blur-sm rounded-xl p-1 border border-slate-700">
              {TIME_PERIODS.map((tp) => (
                <button
                  key={tp.value}
                  onClick={() => {
                    setPeriod(tp.value);
                    setPage(1);
                  }}
                  className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    period === tp.value
                      ? 'bg-gradient-to-r from-blue-500 to-teal-400 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tp.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Top 3 Cards (Mobile/Tablet) */}
        {!loading && traders.length >= 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 lg:hidden">
            {traders.slice(0, 3).map((trader) => (
              <div
                key={trader.username}
                className={`relative rounded-2xl border p-6 ${getRankStyle(trader.rank)}`}
              >
                <div className="absolute -top-3 -left-3">
                  {getRankBadge(trader.rank)}
                </div>
                <div className="pt-4 text-center">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-teal-400 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-3">
                    {trader.displayName.charAt(0).toUpperCase()}
                  </div>
                  <Link
                    href={`/traders/${trader.username}`}
                    className="text-lg font-semibold text-white hover:text-blue-400 transition-colors"
                  >
                    {trader.displayName}
                  </Link>
                  <p className="text-slate-400 text-sm">@{trader.username}</p>
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className={`text-lg font-bold ${trader.stats.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {trader.stats.roi >= 0 ? '+' : ''}{trader.stats.roi.toFixed(1)}%
                      </p>
                      <p className="text-slate-500">ROI</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">{trader.stats.winRate.toFixed(0)}%</p>
                      <p className="text-slate-500">Win Rate</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopy(trader)}
                    className="w-full mt-4 py-2 bg-gradient-to-r from-blue-500 to-teal-400 text-white font-semibold rounded-xl hover:opacity-90 transition-all"
                  >
                    Copy Trader
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Desktop Table */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
          {/* Table Header */}
          <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-6 py-4 bg-slate-900/50 border-b border-slate-700 text-sm font-medium text-slate-400">
            <div className="col-span-1">Rank</div>
            <div className="col-span-3">Trader</div>
            <button
              onClick={() => handleSort('roi')}
              className="col-span-2 flex items-center gap-1 hover:text-white transition-colors"
            >
              ROI <SortIcon field="roi" />
            </button>
            <button
              onClick={() => handleSort('winRate')}
              className="col-span-1 flex items-center gap-1 hover:text-white transition-colors"
            >
              Win % <SortIcon field="winRate" />
            </button>
            <button
              onClick={() => handleSort('totalTrades')}
              className="col-span-1 flex items-center gap-1 hover:text-white transition-colors"
            >
              Trades <SortIcon field="totalTrades" />
            </button>
            <button
              onClick={() => handleSort('totalVolume')}
              className="col-span-2 flex items-center gap-1 hover:text-white transition-colors"
            >
              Volume <SortIcon field="totalVolume" />
            </button>
            <button
              onClick={() => handleSort('followers')}
              className="col-span-1 flex items-center gap-1 hover:text-white transition-colors"
            >
              Followers <SortIcon field="followers" />
            </button>
            <div className="col-span-1"></div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-700 rounded-full" />
                  <div className="w-12 h-12 bg-slate-700 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-700 rounded w-1/3" />
                    <div className="h-3 bg-slate-700 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && traders.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-slate-400 mb-4">No traders found</p>
              <Link
                href="/traders"
                className="text-blue-400 hover:text-blue-300"
              >
                Browse all traders
              </Link>
            </div>
          )}

          {/* Table Rows */}
          {!loading && traders.length > 0 && (
            <div className="divide-y divide-slate-700/50">
              {traders.map((trader) => (
                <div
                  key={trader.username}
                  className={`grid grid-cols-1 lg:grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-700/30 transition-colors ${
                    trader.rank <= 3 ? getRankStyle(trader.rank) : ''
                  }`}
                >
                  {/* Rank */}
                  <div className="lg:col-span-1 flex items-center gap-3">
                    {getRankBadge(trader.rank)}
                    {trader.change !== undefined && trader.change !== 0 && (
                      <span className={`text-xs ${trader.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {trader.change > 0 ? '↑' : '↓'}{Math.abs(trader.change)}
                      </span>
                    )}
                  </div>

                  {/* Trader Info */}
                  <div className="lg:col-span-3 flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-400 rounded-full flex items-center justify-center text-xl font-bold text-white shrink-0">
                      {trader.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <Link
                        href={`/traders/${trader.username}`}
                        className="text-white font-medium hover:text-blue-400 transition-colors flex items-center gap-2"
                      >
                        {trader.displayName}
                        {trader.verified && (
                          <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">
                            ✓
                          </span>
                        )}
                      </Link>
                      <p className="text-slate-500 text-sm">@{trader.username}</p>
                    </div>
                  </div>

                  {/* ROI */}
                  <div className="lg:col-span-2">
                    <span className="lg:hidden text-slate-500 text-xs mr-2">ROI:</span>
                    <span className={`text-lg font-bold ${trader.stats.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {trader.stats.roi >= 0 ? '+' : ''}{trader.stats.roi.toFixed(1)}%
                    </span>
                  </div>

                  {/* Win Rate */}
                  <div className="lg:col-span-1">
                    <span className="lg:hidden text-slate-500 text-xs mr-2">Win Rate:</span>
                    <span className="text-white">{trader.stats.winRate.toFixed(0)}%</span>
                  </div>

                  {/* Trades */}
                  <div className="lg:col-span-1">
                    <span className="lg:hidden text-slate-500 text-xs mr-2">Trades:</span>
                    <span className="text-white">{trader.stats.totalTrades}</span>
                  </div>

                  {/* Volume */}
                  <div className="lg:col-span-2">
                    <span className="lg:hidden text-slate-500 text-xs mr-2">Volume:</span>
                    <span className="text-white">${(trader.stats.totalVolume / 1000).toFixed(1)}K</span>
                  </div>

                  {/* Followers */}
                  <div className="lg:col-span-1">
                    <span className="lg:hidden text-slate-500 text-xs mr-2">Followers:</span>
                    <span className="text-white">{trader.stats.followers}</span>
                  </div>

                  {/* Copy Button */}
                  <div className="lg:col-span-1">
                    <button
                      onClick={() => handleCopy(trader)}
                      className="w-full lg:w-auto px-4 py-2 bg-gradient-to-r from-blue-500 to-teal-400 text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-700 flex items-center justify-between">
              <p className="text-slate-500 text-sm">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <div className="inline-block bg-gradient-to-r from-blue-500/10 to-teal-500/10 border border-blue-500/20 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-white mb-2">Want to be on the leaderboard?</h3>
            <p className="text-slate-400 mb-6">
              Claim your trader profile and start building your reputation
            </p>
            <Link
              href="/claim"
              className="inline-block px-8 py-3 bg-gradient-to-r from-blue-500 to-teal-400 text-white font-semibold rounded-xl hover:opacity-90 transition-all"
            >
              Claim Your Profile
            </Link>
          </div>
        </div>
      </div>

      {/* Copy Trades Modal */}
      {selectedTrader && (
        <CopyTradesModal
          trader={selectedTrader}
          isOpen={showCopyModal}
          onClose={() => {
            setShowCopyModal(false);
            setSelectedTrader(null);
          }}
          onSuccess={handleCopySuccess}
        />
      )}
    </div>
  );
}
