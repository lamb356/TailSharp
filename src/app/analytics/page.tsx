'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import Link from 'next/link';

interface AnalyticsData {
  summary: {
    totalPnL: number;
    winRate: number;
    totalTrades: number;
    activeTraders: number;
  };
  simpleStats: {
    avgTradeSize: number;
    biggestWin: number;
    biggestLoss: number;
    currentStreak: number;
    wins: number;
    losses: number;
    pending: number;
  };
  recentTrades: Array<{
    id: string;
    traderUsername: string;
    market: string;
    position: string;
    outcome: 'win' | 'loss' | 'pending';
    pnl: number;
    amount: number;
    timestamp: number;
  }>;
  pro: {
    monthlyPnL: Array<{ month: string; label: string; pnl: number }>;
    traderBreakdown: Array<{ trader: string; pnl: number; trades: number }>;
    categoryBreakdown: Array<{ category: string; pnl: number; trades: number }>;
    drawdown: { max: number; current: number };
  };
}

export default function AnalyticsPage() {
  const { publicKey, connected } = useWallet();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!connected || !publicKey) {
      setLoading(false);
      return;
    }

    const fetchAnalytics = async () => {
      try {
        const res = await fetch(`/api/analytics?wallet=${publicKey.toBase58()}`);
        if (!res.ok) throw new Error('Failed to fetch analytics');
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError('Failed to load analytics');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [connected, publicKey]);

  if (!connected) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-6">View your copy trading performance analytics</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'No data available'}</p>
          <Link href="/dashboard" className="text-emerald-400 hover:underline">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const formatPnL = (value: number) => {
    const formatted = Math.abs(value).toFixed(2);
    return value >= 0 ? `+$${formatted}` : `-$${formatted}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Find max value for chart scaling
  const maxMonthlyPnL = Math.max(...data.pro.monthlyPnL.map((m) => Math.abs(m.pnl)), 1);

  return (
    <div className="min-h-screen bg-gray-950 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Performance Analytics</h1>
          <p className="text-gray-400">Track your copy trading results</p>
        </div>

        {/* FREE TIER: Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <p className="text-gray-400 text-sm mb-1">Total P&L</p>
            <p className={`text-2xl font-bold ${data.summary.totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatPnL(data.summary.totalPnL)}
            </p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <p className="text-gray-400 text-sm mb-1">Win Rate</p>
            <p className="text-2xl font-bold text-white">{data.summary.winRate}%</p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <p className="text-gray-400 text-sm mb-1">Trades Copied</p>
            <p className="text-2xl font-bold text-white">{data.summary.totalTrades}</p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <p className="text-gray-400 text-sm mb-1">Active Traders</p>
            <p className="text-2xl font-bold text-white">{data.summary.activeTraders}</p>
          </div>
        </div>

        {/* FREE TIER: Simple Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-1">Avg Trade Size</p>
            <p className="text-lg font-semibold text-white">${data.simpleStats.avgTradeSize}</p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-1">Biggest Win</p>
            <p className="text-lg font-semibold text-emerald-400">+${data.simpleStats.biggestWin}</p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-1">Biggest Loss</p>
            <p className="text-lg font-semibold text-red-400">-${Math.abs(data.simpleStats.biggestLoss)}</p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-1">Current Streak</p>
            <p className={`text-lg font-semibold ${data.simpleStats.currentStreak >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {data.simpleStats.currentStreak >= 0 ? `${data.simpleStats.currentStreak} wins` : `${Math.abs(data.simpleStats.currentStreak)} losses`}
            </p>
          </div>
        </div>

        {/* FREE TIER: Recent Trades */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Recent Trades</h2>
          {data.recentTrades.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No trades yet. Start copying traders to see your history.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 text-sm border-b border-gray-800">
                    <th className="pb-3 pr-4">Trader</th>
                    <th className="pb-3 pr-4">Market</th>
                    <th className="pb-3 pr-4">Position</th>
                    <th className="pb-3 pr-4">Outcome</th>
                    <th className="pb-3 pr-4 text-right">P&L</th>
                    <th className="pb-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentTrades.map((trade) => (
                    <tr key={trade.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="py-3 pr-4">
                        <span className="text-white font-medium">@{trade.traderUsername}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-gray-300 text-sm truncate max-w-[200px] block">{trade.market}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          trade.position === 'yes' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {trade.position.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          trade.outcome === 'win'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : trade.outcome === 'loss'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {trade.outcome === 'win' ? 'WIN' : trade.outcome === 'loss' ? 'LOSS' : 'PENDING'}
                        </span>
                      </td>
                      <td className={`py-3 pr-4 text-right font-medium ${
                        trade.pnl > 0 ? 'text-emerald-400' : trade.pnl < 0 ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {trade.outcome === 'pending' ? '-' : formatPnL(trade.pnl)}
                      </td>
                      <td className="py-3 text-right text-gray-400 text-sm">
                        {formatDate(trade.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* PRO TIER: Locked Section */}
        <div className="relative">
          {/* Blur overlay */}
          <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm z-10 rounded-xl flex items-center justify-center">
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Unlock Pro Analytics</h3>
              <p className="text-gray-400 mb-6 max-w-md">
                Get detailed insights with monthly P&L charts, trader performance breakdown, category analysis, and CSV exports.
              </p>
              <button className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity">
                Upgrade to Pro - Coming Soon
              </button>
            </div>
          </div>

          {/* Pro content (blurred) */}
          <div className="space-y-6 opacity-50">
            {/* Monthly P&L Chart */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">P&L by Month</h2>
                <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs font-semibold rounded">PRO</span>
              </div>
              <div className="h-64 flex items-end gap-2">
                {data.pro.monthlyPnL.map((month) => {
                  const height = Math.max((Math.abs(month.pnl) / maxMonthlyPnL) * 100, 5);
                  return (
                    <div key={month.month} className="flex-1 flex flex-col items-center">
                      <div
                        className={`w-full rounded-t ${month.pnl >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-xs text-gray-400 mt-2">{month.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* P&L by Trader */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">P&L by Trader</h2>
                <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs font-semibold rounded">PRO</span>
              </div>
              <div className="space-y-3">
                {data.pro.traderBreakdown.slice(0, 5).map((item) => (
                  <div key={item.trader} className="flex items-center justify-between">
                    <div>
                      <span className="text-white font-medium">@{item.trader}</span>
                      <span className="text-gray-400 text-sm ml-2">({item.trades} trades)</span>
                    </div>
                    <span className={item.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {formatPnL(item.pnl)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* P&L by Category */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">P&L by Category</h2>
                <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs font-semibold rounded">PRO</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {data.pro.categoryBreakdown.map((item) => (
                  <div key={item.category} className="bg-gray-800/50 rounded-lg p-4">
                    <p className="text-gray-400 text-sm">{item.category}</p>
                    <p className={`text-lg font-bold ${item.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatPnL(item.pnl)}
                    </p>
                    <p className="text-gray-500 text-xs">{item.trades} trades</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Drawdown & Export */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">Drawdown Analysis</h2>
                  <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs font-semibold rounded">PRO</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Max Drawdown</p>
                    <p className="text-2xl font-bold text-red-400">-${data.pro.drawdown.max}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Current Drawdown</p>
                    <p className="text-2xl font-bold text-yellow-400">-${data.pro.drawdown.current}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">Export Data</h2>
                  <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs font-semibold rounded">PRO</span>
                </div>
                <p className="text-gray-400 text-sm mb-4">Download your complete trading history for analysis.</p>
                <button className="w-full py-3 bg-gray-800 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export to CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
