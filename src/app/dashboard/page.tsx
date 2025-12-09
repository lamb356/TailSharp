// src/app/dashboard/page.tsx
'use client';

import { ConnectButton } from '@/components/wallet/ConnectButton';
import { useStore } from '@/lib/store/useStore';
import { useCopyTrades } from '@/lib/store/useCopyTrades';
import { useWallet } from '@solana/wallet-adapter-react';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { CopyTradePanel } from '@/components/traders/CopyTradePanel';
import { TransactionFeed } from '@/components/traders/TransactionFeed';
import Link from 'next/link';
import Image from 'next/image';
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
  const { copySettings, removeCopySettings, updateCopySettings } = useStore();
  const { simulatedTrades } = useCopyTrades();
  const [expandedTrader, setExpandedTrader] = useState<string | null>(null);
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
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.jpg" alt="TailSharp" width={32} height={32} className="rounded-lg" />
            <span className="text-xl font-bold text-white">TailSharp</span>
          </Link>
          <ConnectButton />
        </nav>
        <div className="flex flex-col items-center justify-center py-32 px-6">
          <h1 className="text-3xl font-bold text-white mb-4">Connect Your Wallet</h1>
          <p className="text-slate-400 mb-8">Connect your wallet to view your dashboard</p>
          <ConnectButton />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-800 sticky top-0 bg-slate-950/80 backdrop-blur-md z-50">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.jpg" alt="TailSharp" width={32} height={32} className="rounded-lg" />
          <span className="text-xl font-bold text-white">TailSharp</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-slate-400 hover:text-white transition-colors">
            Home
          </Link>
          <Link href="/markets" className="text-slate-400 hover:text-white transition-colors">
            Markets
          </Link>
          <Link href="/explore" className="text-slate-400 hover:text-white transition-colors">
            Explore
          </Link>
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
          <NotificationBell />
          <ConnectButton />
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Portfolio Dashboard</h1>
            <p className="text-slate-400 mt-1">Track and manage your copy trading positions</p>
          </div>
          {pendingTradesCount > 0 && (
            <div className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium animate-pulse">
              {pendingTradesCount} pending trade{pendingTradesCount > 1 ? 's' : ''}
            </div>
          )}
        </div>

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

        <div className="mb-8 rounded-lg border border-slate-800 bg-slate-900/80 p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-slate-100">Recent Trades</h2>
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
            <p className="text-xs text-slate-500">No trades executed yet.</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-white mb-4">Tracked Traders</h2>

            {copySettings.length === 0 ? (
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
                <p className="text-slate-400 mb-4">You are not following any traders yet</p>
                <Link
                  href="/"
                  className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-400 text-white font-semibold rounded-xl hover:opacity-90 transition-all"
                >
                  Find Traders
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {copySettings.map((settings) => {
                  const isExpanded = expandedTrader === settings.traderId;

                  return (
                    <div
                      key={settings.traderId}
                      className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden"
                    >
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-teal-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                              {settings.traderId.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-white font-medium font-mono">
                                {settings.traderId.slice(0, 6)}...{settings.traderId.slice(-6)}
                              </p>
                              <p className="text-sm">
                                {settings.isActive ? (
                                  <span className="text-green-400">Active</span>
                                ) : (
                                  <span className="text-slate-500">Paused</span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setExpandedTrader(isExpanded ? null : settings.traderId)}
                              className="text-slate-400 hover:text-white text-sm px-3 py-1 rounded-lg hover:bg-slate-700 transition-colors"
                            >
                              {isExpanded ? 'Hide' : 'View'} Activity
                            </button>
                            <button
                              onClick={() => removeCopySettings(settings.traderId)}
                              className="text-red-400 hover:text-red-300 text-sm px-3 py-1 rounded-lg hover:bg-red-500/10 transition-colors"
                            >
                              Unfollow
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-slate-500 text-xs block mb-1">Allocation (USD)</label>
                            <input
                              type="number"
                              value={settings.allocationUsd}
                              onChange={(e) =>
                                updateCopySettings(settings.traderId, {
                                  allocationUsd: Number(e.target.value),
                                })
                              }
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="text-slate-500 text-xs block mb-1">Max Position %</label>
                            <input
                              type="number"
                              value={settings.maxPositionPercent}
                              onChange={(e) =>
                                updateCopySettings(settings.traderId, {
                                  maxPositionPercent: Number(e.target.value),
                                })
                              }
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div className="flex items-end">
                            <button
                              onClick={() =>
                                updateCopySettings(settings.traderId, {
                                  isActive: !settings.isActive,
                                })
                              }
                              className={`w-full py-2 rounded-lg text-sm font-medium transition-all ${
                                settings.isActive
                                  ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                  : 'bg-gradient-to-r from-blue-500 to-teal-400 text-white hover:opacity-90'
                              }`}
                            >
                              {settings.isActive ? 'Pause' : 'Activate'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-slate-700 bg-slate-900/50 p-5">
                          <h3 className="text-sm font-medium text-slate-300 mb-3">Recent Activity</h3>
                          <TransactionFeed walletAddress={settings.traderId} limit={10} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <CopyTradePanel />
          </div>
        </div>
      </div>
    </main>
  );
}