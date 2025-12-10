// src/app/admin/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Stats {
  traders: number;
  trades: number;
  waitlist: number;
  activeCopies: number;
  notificationUsers: number;
}

interface Trade {
  id: string;
  walletAddress: string;
  market: { title: string; category?: string };
  position: string;
  action: string;
  size: number;
  price: number;
  timestamp: number;
  platform: string;
}

interface Trader {
  username: string;
  displayName: string;
  verified: boolean;
  createdAt: number;
  stats: {
    totalTrades: number;
    winRate: number;
    roi: number;
  };
}

interface Health {
  status: string;
  timestamp: number;
  redis: { status: string; latency?: number; error?: string };
  helius: { status: string; lastWebhook?: number };
  environment: { [key: string]: boolean };
}

export default function AdminDashboard() {
  const searchParams = useSearchParams();
  const adminKey = searchParams.get('key');

  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [waitlistEmails, setWaitlistEmails] = useState<string[]>([]);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [recentTraders, setRecentTraders] = useState<Trader[]>([]);
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchData = useCallback(async () => {
    if (!adminKey) {
      setAuthorized(false);
      setLoading(false);
      return;
    }

    try {
      // Fetch all data in parallel
      const [statsRes, waitlistRes, activityRes, healthRes] = await Promise.all([
        fetch(`/api/admin/stats?key=${adminKey}`),
        fetch(`/api/admin/waitlist?key=${adminKey}`),
        fetch(`/api/admin/activity?key=${adminKey}`),
        fetch(`/api/admin/health?key=${adminKey}`),
      ]);

      if (statsRes.status === 401) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      setAuthorized(true);

      const [statsData, waitlistData, activityData, healthData] = await Promise.all([
        statsRes.json(),
        waitlistRes.json(),
        activityRes.json(),
        healthRes.json(),
      ]);

      setStats(statsData);
      setWaitlistEmails(waitlistData.emails || []);
      setRecentTrades(activityData.recentTrades || []);
      setRecentTraders(activityData.recentTraders || []);
      setHealth(healthData);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSeedData = async () => {
    if (!adminKey) return;
    setActionLoading('seed');
    setActionResult(null);

    try {
      const res = await fetch(`/api/admin/seed?key=${adminKey}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminKey}` },
      });
      const data = await res.json();

      if (res.ok) {
        setActionResult({
          type: 'success',
          message: `Seeded ${data.tradersCreated} traders and ${data.tradesCreated} trades`,
        });
        fetchData();
      } else {
        setActionResult({ type: 'error', message: data.error || 'Failed to seed data' });
      }
    } catch (error) {
      setActionResult({ type: 'error', message: 'Failed to seed data' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleClearData = async () => {
    if (!adminKey || !confirm('Are you sure you want to clear all demo data?')) return;
    setActionLoading('clear');
    setActionResult(null);

    try {
      const res = await fetch(`/api/admin/seed?key=${adminKey}&clear=true`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminKey}` },
      });
      const data = await res.json();

      if (res.ok) {
        setActionResult({ type: 'success', message: 'Demo data cleared successfully' });
        fetchData();
      } else {
        setActionResult({ type: 'error', message: data.error || 'Failed to clear data' });
      }
    } catch (error) {
      setActionResult({ type: 'error', message: 'Failed to clear data' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleExportCSV = () => {
    if (!adminKey) return;
    window.open(`/api/admin/waitlist?key=${adminKey}&format=csv`, '_blank');
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = Math.floor((now - timestamp * 1000) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  // Unauthorized view
  if (authorized === false) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-8V7a4 4 0 118 0v4h-4V7a4 4 0 00-8 0v4h4z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-slate-400 mb-6">Valid admin key required</p>
          <Link href="/" className="text-blue-400 hover:text-blue-300">
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }

  // Loading view
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-slate-400 mt-1">TailSharp Operations</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              health?.status === 'healthy'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-yellow-500/20 text-yellow-400'
            }`}>
              {health?.status === 'healthy' ? '● Healthy' : '● Degraded'}
            </span>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Traders</p>
                <p className="text-3xl font-bold text-white mt-1">{stats?.traders || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Trades Tracked</p>
                <p className="text-3xl font-bold text-white mt-1">{stats?.trades || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Waitlist Signups</p>
                <p className="text-3xl font-bold text-white mt-1">{stats?.waitlist || 0}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Active Copies</p>
                <p className="text-3xl font-bold text-white mt-1">{stats?.activeCopies || 0}</p>
              </div>
              <div className="w-12 h-12 bg-teal-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Waitlist Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Waitlist Emails</h2>
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 text-sm rounded-lg hover:bg-slate-700 transition-colors"
              >
                Export CSV
              </button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {waitlistEmails.length === 0 ? (
                <p className="text-slate-500 text-sm">No signups yet</p>
              ) : (
                waitlistEmails.map((email, i) => (
                  <div
                    key={email}
                    className="flex items-center justify-between py-2 px-3 bg-slate-800/50 rounded-lg"
                  >
                    <span className="text-slate-300 text-sm truncate">{email}</span>
                    <span className="text-slate-500 text-xs">#{i + 1}</span>
                  </div>
                ))
              )}
            </div>
            <p className="text-slate-500 text-xs mt-4">
              Total: {waitlistEmails.length} emails
            </p>
          </div>

          {/* Recent Trades */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Recent Trades</h2>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recentTrades.length === 0 ? (
                <p className="text-slate-500 text-sm">No trades yet</p>
              ) : (
                recentTrades.slice(0, 10).map((trade) => (
                  <div key={trade.id} className="py-2 border-b border-slate-800 last:border-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-1.5 py-0.5 text-xs rounded ${
                        trade.position === 'yes' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {trade.position.toUpperCase()}
                      </span>
                      <span className="text-slate-500 text-xs">{trade.platform}</span>
                      <span className="text-slate-600 text-xs ml-auto">{formatTimeAgo(trade.timestamp)}</span>
                    </div>
                    <p className="text-slate-300 text-sm truncate">{trade.market.title}</p>
                    <p className="text-slate-500 text-xs mt-1">
                      {trade.action} {trade.size} @ ${trade.price.toFixed(2)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Traders */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Recent Traders</h2>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recentTraders.length === 0 ? (
                <p className="text-slate-500 text-sm">No traders yet</p>
              ) : (
                recentTraders.map((trader) => (
                  <div key={trader.username} className="flex items-center gap-3 py-2 border-b border-slate-800 last:border-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-400 rounded-full flex items-center justify-center text-white font-bold">
                      {trader.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium truncate">{trader.displayName}</span>
                        {trader.verified && (
                          <span className="px-1 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">✓</span>
                        )}
                      </div>
                      <p className="text-slate-500 text-xs">
                        {trader.stats.totalTrades} trades · {trader.stats.roi.toFixed(1)}% ROI
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* System Health & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Health */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">System Health</h2>
            <div className="space-y-4">
              {/* Redis */}
              <div className="flex items-center justify-between py-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    health?.redis.status === 'connected' ? 'bg-green-400' : 'bg-red-400'
                  }`} />
                  <span className="text-white">Redis Connection</span>
                </div>
                <span className="text-slate-400 text-sm">
                  {health?.redis.status === 'connected'
                    ? `${health.redis.latency}ms latency`
                    : health?.redis.status}
                </span>
              </div>

              {/* Helius */}
              <div className="flex items-center justify-between py-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    health?.helius.status === 'active' ? 'bg-green-400' : 'bg-yellow-400'
                  }`} />
                  <span className="text-white">Helius Webhooks</span>
                </div>
                <span className="text-slate-400 text-sm">
                  {health?.helius.lastWebhook
                    ? `Last: ${formatTimeAgo(health.helius.lastWebhook)}`
                    : 'No data'}
                </span>
              </div>

              {/* Environment */}
              <div className="py-3">
                <p className="text-white mb-2">Environment Variables</p>
                <div className="grid grid-cols-2 gap-2">
                  {health?.environment && Object.entries(health.environment).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${value ? 'bg-green-400' : 'bg-red-400'}`} />
                      <span className="text-slate-400 text-xs truncate">{key}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>

            {actionResult && (
              <div className={`mb-4 p-3 rounded-lg ${
                actionResult.type === 'success'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {actionResult.message}
              </div>
            )}

            <div className="space-y-4">
              <button
                onClick={handleSeedData}
                disabled={actionLoading === 'seed'}
                className="w-full flex items-center justify-between p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium">Seed Demo Data</p>
                    <p className="text-slate-400 text-sm">Populate with sample traders and trades</p>
                  </div>
                </div>
                {actionLoading === 'seed' && (
                  <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
                )}
              </button>

              <button
                onClick={handleClearData}
                disabled={actionLoading === 'clear'}
                className="w-full flex items-center justify-between p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium">Clear Demo Data</p>
                    <p className="text-slate-400 text-sm">Remove all seeded data</p>
                  </div>
                </div>
                {actionLoading === 'clear' && (
                  <div className="animate-spin w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full" />
                )}
              </button>

              <a
                href={`/api/admin/seed?key=${adminKey}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-3 p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">API Status</p>
                  <p className="text-slate-400 text-sm">View seed endpoint info</p>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-slate-500 text-sm">
          Last updated: {health ? new Date(health.timestamp).toLocaleString() : '-'}
        </div>
      </div>
    </div>
  );
}
