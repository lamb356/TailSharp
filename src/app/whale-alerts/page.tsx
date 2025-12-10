'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { ConnectButton } from '@/components/wallet/ConnectButton';

interface WhaleAlert {
  id: string;
  traderUsername: string;
  traderWallet: string;
  market: string;
  ticker: string;
  position: 'yes' | 'no';
  size: number;
  price: number;
  timestamp: number;
  category: string;
}

export const dynamic = 'force-dynamic';

const DEV_MODE = true;
const IS_PRO = false; // Set to true when Pro is live

const CATEGORIES = ['all', 'Politics', 'Crypto', 'Sports', 'Weather', 'Economics', 'Other'];
const TIME_RANGES = [
  { value: 'all', label: 'All Time' },
  { value: '24h', label: 'Last 24h' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
];

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function WhaleAlertsPage() {
  const { connected } = useWallet();
  const [alerts, setAlerts] = useState<WhaleAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Filters
  const [traderFilter, setTraderFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('all');

  const isAuthenticated = DEV_MODE || connected;

  useEffect(() => {
    async function fetchAlerts() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('limit', '50');
        if (traderFilter) params.set('trader', traderFilter);
        if (categoryFilter !== 'all') params.set('category', categoryFilter);
        params.set('timeRange', timeRange);

        const res = await fetch(`/api/whale-alerts?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setAlerts(data.alerts || []);
          setTotal(data.total || 0);
        }
      } catch (error) {
        console.error('Failed to fetch whale alerts:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAlerts();
  }, [traderFilter, categoryFilter, timeRange]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-20 md:py-32 px-4 md:px-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-4 text-center">Connect Your Wallet</h1>
        <p className="text-slate-400 mb-8 text-center">Connect your wallet to access Whale Alerts</p>
        <ConnectButton />
      </div>
    );
  }

  // Free users see blurred overlay
  if (!IS_PRO) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-3xl">🐋</span>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Whale Alerts</h1>
                <span className="px-2 py-1 bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-400 text-xs font-medium rounded-full border border-purple-500/30">
                  PRO
                </span>
              </div>
              <p className="text-slate-400 mt-2 text-sm md:text-base">
                Track large trades ($500+) from top performers in real-time
              </p>
            </div>
          </div>

          {/* Preview with blur overlay */}
          <div className="relative">
            {/* Filters (blurred) */}
            <div className="blur-sm pointer-events-none mb-6">
              <div className="flex flex-wrap gap-3">
                <input
                  type="text"
                  placeholder="Filter by trader..."
                  className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                  disabled
                />
                <select className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm" disabled>
                  <option>All Categories</option>
                </select>
                <select className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm" disabled>
                  <option>All Time</option>
                </select>
              </div>
            </div>

            {/* Sample data (blurred) */}
            <div className="blur-sm pointer-events-none select-none">
              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="text-left p-4 text-sm font-medium text-slate-400">Time</th>
                        <th className="text-left p-4 text-sm font-medium text-slate-400">Trader</th>
                        <th className="text-left p-4 text-sm font-medium text-slate-400">Market</th>
                        <th className="text-left p-4 text-sm font-medium text-slate-400">Position</th>
                        <th className="text-right p-4 text-sm font-medium text-slate-400">Size</th>
                        <th className="text-left p-4 text-sm font-medium text-slate-400">Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...Array(8)].map((_, i) => (
                        <tr key={i} className="border-b border-slate-800/50">
                          <td className="p-4 text-sm text-slate-300">2h ago</td>
                          <td className="p-4">
                            <span className="text-blue-400 font-medium">TopTrader{i + 1}</span>
                          </td>
                          <td className="p-4 text-sm text-white">Will Bitcoin hit $100k by Dec?</td>
                          <td className="p-4">
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded">
                              YES
                            </span>
                          </td>
                          <td className="p-4 text-right text-sm font-semibold text-white">
                            ${(500 + i * 200).toLocaleString()}
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded">
                              Crypto
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Unlock overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 backdrop-blur-[2px] rounded-2xl">
              <div className="text-center p-8 max-w-md">
                <span className="text-5xl mb-4 block">🐋</span>
                <h2 className="text-2xl font-bold text-white mb-3">Unlock Whale Alerts</h2>
                <p className="text-slate-400 mb-6">
                  Get real-time alerts when top traders make large moves. See what smart money is doing before the market reacts.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-left text-sm text-slate-300">
                    <span className="text-green-400">✓</span>
                    <span>Real-time alerts for $500+ trades</span>
                  </div>
                  <div className="flex items-center gap-3 text-left text-sm text-slate-300">
                    <span className="text-green-400">✓</span>
                    <span>Filter by trader, category, and time</span>
                  </div>
                  <div className="flex items-center gap-3 text-left text-sm text-slate-300">
                    <span className="text-green-400">✓</span>
                    <span>Full history of whale movements</span>
                  </div>
                  <div className="flex items-center gap-3 text-left text-sm text-slate-300">
                    <span className="text-green-400">✓</span>
                    <span>Email alerts for tracked traders</span>
                  </div>
                </div>
                <button className="mt-8 px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-500 hover:to-blue-500 transition-all shadow-lg shadow-purple-500/25">
                  Upgrade to Pro
                </button>
                <p className="text-slate-500 text-xs mt-4">Coming soon</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pro users see full page
  return (
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-3xl">🐋</span>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Whale Alerts</h1>
            </div>
            <p className="text-slate-400 mt-2 text-sm md:text-base">
              Large trades ($500+) from top 10 performers • {total} whale trades found
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input
            type="text"
            placeholder="Filter by trader..."
            value={traderFilter}
            onChange={(e) => setTraderFilter(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
          >
            {TIME_RANGES.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
          {(traderFilter || categoryFilter !== 'all' || timeRange !== 'all') && (
            <button
              onClick={() => {
                setTraderFilter('');
                setCategoryFilter('all');
                setTimeRange('all');
              }}
              className="px-4 py-2 text-slate-400 hover:text-white text-sm transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Alerts Table */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-slate-400">Loading whale alerts...</p>
            </div>
          ) : alerts.length === 0 ? (
            <div className="p-8 text-center">
              <span className="text-4xl mb-4 block">🐋</span>
              <p className="text-slate-400">No whale trades found matching your filters</p>
              <p className="text-slate-500 text-sm mt-2">Try adjusting your filters or check back later</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left p-4 text-sm font-medium text-slate-400">Time</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-400">Trader</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-400">Market</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-400">Position</th>
                    <th className="text-right p-4 text-sm font-medium text-slate-400">Size</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-400">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((alert) => (
                    <tr
                      key={alert.id}
                      className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-sm text-white">{formatTimeAgo(alert.timestamp)}</span>
                          <span className="text-xs text-slate-500">{formatDate(alert.timestamp)}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Link
                          href={`/traders/${alert.traderUsername}`}
                          className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                        >
                          {alert.traderUsername}
                        </Link>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-white">
                          {alert.market.length > 50 ? `${alert.market.slice(0, 50)}...` : alert.market}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            alert.position === 'yes'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {alert.position.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-sm font-semibold text-white">
                          {formatCurrency(alert.size)}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded">
                          {alert.category}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Stats Footer */}
        {!loading && alerts.length > 0 && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <p className="text-slate-400 text-xs">Total Volume</p>
              <p className="text-xl font-bold text-white mt-1">
                {formatCurrency(alerts.reduce((sum, a) => sum + a.size, 0))}
              </p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <p className="text-slate-400 text-xs">Avg Trade Size</p>
              <p className="text-xl font-bold text-white mt-1">
                {formatCurrency(alerts.reduce((sum, a) => sum + a.size, 0) / alerts.length)}
              </p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <p className="text-slate-400 text-xs">YES Positions</p>
              <p className="text-xl font-bold text-green-400 mt-1">
                {alerts.filter((a) => a.position === 'yes').length}
              </p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <p className="text-slate-400 text-xs">NO Positions</p>
              <p className="text-xl font-bold text-red-400 mt-1">
                {alerts.filter((a) => a.position === 'no').length}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
