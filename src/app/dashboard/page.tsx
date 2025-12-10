'use client';

import { ConnectButton } from '@/components/wallet/ConnectButton';
import { useStore } from '@/lib/store/useStore';
import { useCopyTrades } from '@/lib/store/useCopyTrades';
import { useWallet } from '@solana/wallet-adapter-react';
import { CopyTradePanel } from '@/components/traders/CopyTradePanel';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { FollowingSection } from '@/components/dashboard/FollowingSection';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { IS_SIMULATION } from '@/lib/env';

export const dynamic = 'force-dynamic';

const DEV_MODE = true;

type RecentTrade = {
  id: string;
  originalTrade: {
    market: string;
    side: 'YES' | 'NO';
    amount: number;
    walletAddress: string;
    timestamp: number;
  };
  status: 'pending' | 'executed' | 'failed';
  kalshiTicker?: string;
  isSimulation?: boolean;
};

export default function Dashboard() {
  const { connected } = useWallet();
  const { copySettings } = useStore();
  const { simulatedTrades } = useCopyTrades();
  const [recentTrades, setRecentTrades] = useState<RecentTrade[]>([]);
  const [tradesLoading, setTradesLoading] = useState(true);

  const isAuthenticated = DEV_MODE || connected;
  const pendingTradesCount = simulatedTrades.filter((t) => t.status === 'pending').length;

  useEffect(() => {
    async function loadRecentTrades() {
      try {
        const res = await fetch('/api/executed-trades');
        const data = await res.json();
        const trades = (data.trades || []) as RecentTrade[];
        setRecentTrades(trades.slice(0, 5));
      } catch {
        // ignore for now
      } finally {
        setTradesLoading(false);
      }
    }
    loadRecentTrades();
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-6">
        <h1 className="text-3xl font-bold text-white mb-4">Connect Your Wallet</h1>
        <p className="text-slate-400 mb-8">Connect your wallet to view your dashboard</p>
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Portfolio Dashboard</h1>
            <p className="text-slate-400 mt-1">Track and manage your copy trading positions</p>
          </div>
          <div className="flex items-center gap-3">
            {DEV_MODE && (
              <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                DEV MODE
              </span>
            )}
            {IS_SIMULATION ? (
              <span className="inline-flex items-center rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300 ring-1 ring-amber-500/40">
                Mode: Simulation
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300 ring-1 ring-emerald-500/40">
                Mode: Live
              </span>
            )}
            {pendingTradesCount > 0 && (
              <div className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium animate-pulse">
                {pendingTradesCount} pending trade{pendingTradesCount > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
            <p className="text-slate-400 text-sm">Following</p>
            <p className="text-2xl font-bold text-white mt-1">{copySettings.length}</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
            <p className="text-slate-400 text-sm">Active Copies</p>
            <p className="text-2xl font-bold text-white mt-1">
              {copySettings.filter((s) => s.isActive).length}
            </p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
            <p className="text-slate-400 text-sm">Total Allocated</p>
            <p className="text-2xl font-bold text-white mt-1">
              ${copySettings.reduce((sum, s) => sum + s.allocationUsd, 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
            <p className="text-slate-400 text-sm">Pending Trades</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">{pendingTradesCount}</p>
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Activity Feed */}
          <div className="xl:col-span-2 space-y-8">
            {/* Activity Feed */}
            <ActivityFeed limit={15} autoRefreshInterval={30000} showFilters={true} />

            {/* Executed Copy Trades */}
            <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-slate-100">Your Copy Trades</h2>
                <Link
                  href="/executed-trades"
                  className="text-xs font-medium text-blue-400 hover:text-blue-300"
                >
                  View all
                </Link>
              </div>
              {tradesLoading && (
                <p className="text-xs text-slate-500">Loading trades...</p>
              )}
              {!tradesLoading && recentTrades.length === 0 && (
                <p className="text-xs text-slate-500">No copy trades executed yet.</p>
              )}
              {!tradesLoading && recentTrades.length > 0 && (
                <ul className="space-y-2 text-xs">
                  {recentTrades.map((t) => {
                    const dt = new Date(t.originalTrade.timestamp * 1000);
                    return (
                      <li
                        key={t.id}
                        className="flex items-center justify-between border-t border-slate-800 pt-2 first:border-t-0 first:pt-0"
                      >
                        <div className="flex flex-col">
                          <span className="text-slate-100">
                            {t.originalTrade.side} - {t.originalTrade.market}
                          </span>
                          <span className="text-slate-500">
                            {t.originalTrade.amount} contracts - {t.originalTrade.walletAddress.slice(0, 4)}...{t.originalTrade.walletAddress.slice(-4)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="block text-slate-500">
                            {dt.toLocaleTimeString()}
                          </span>
                          <span
                            className={
                              t.status === 'executed'
                                ? 'text-green-400'
                                : t.status === 'failed'
                                ? 'text-red-400'
                                : 'text-yellow-400'
                            }
                          >
                            {t.status}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Right Column - Following & Copy Trade Panel */}
          <div className="xl:col-span-1 space-y-8">
            {/* Following Section */}
            <FollowingSection />

            {/* Copy Trade Panel */}
            <CopyTradePanel />
          </div>
        </div>
      </div>
    </div>
  );
}