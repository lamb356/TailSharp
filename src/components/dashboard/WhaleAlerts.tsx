'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface WhaleAlert {
  id: string;
  traderUsername: string;
  market: string;
  position: 'yes' | 'no';
  size: number;
  timestamp: number;
}

interface WhaleAlertsProps {
  isPro?: boolean;
  maxAlerts?: number;
}

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

export function WhaleAlerts({ isPro = false, maxAlerts = 5 }: WhaleAlertsProps) {
  const [alerts, setAlerts] = useState<WhaleAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAlertId, setNewAlertId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const res = await fetch(`/api/whale-alerts?limit=${maxAlerts}`);
        if (res.ok) {
          const data = await res.json();
          setAlerts(data.alerts || []);
        }
      } catch (error) {
        console.error('Failed to fetch whale alerts:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAlerts();

    // Poll for new alerts every 30 seconds
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/whale-alerts?limit=${maxAlerts}`);
        if (res.ok) {
          const data = await res.json();
          const newAlerts = data.alerts || [];

          // Check for new alerts
          if (newAlerts.length > 0 && alerts.length > 0) {
            const latestNew = newAlerts[0];
            const latestOld = alerts[0];
            if (latestNew.id !== latestOld.id) {
              setNewAlertId(latestNew.id);
              setTimeout(() => setNewAlertId(null), 3000);
            }
          }

          setAlerts(newAlerts);
        }
      } catch (error) {
        // Silently fail on poll
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [maxAlerts]);

  // For free users, show teaser
  if (!isPro) {
    return (
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐋</span>
            <h3 className="text-lg font-semibold text-white">Whale Alerts</h3>
          </div>
          <span className="px-2 py-1 bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-400 text-xs font-medium rounded-full border border-purple-500/30">
            PRO
          </span>
        </div>

        {/* Teaser with one blurred alert */}
        <div className="space-y-3">
          {loading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-16 bg-slate-800 rounded-xl" />
            </div>
          ) : alerts.length > 0 ? (
            <>
              {/* First alert - visible but truncated */}
              <div className="relative">
                <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">🐋</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white">
                        <span className="font-medium text-blue-400">
                          {alerts[0].traderUsername}
                        </span>
                        {' '}
                        {alerts[0].position === 'yes' ? 'bought' : 'sold'}{' '}
                        <span className="font-semibold text-green-400">
                          {formatCurrency(alerts[0].size)}
                        </span>
                        {' on '}
                        <span className="text-slate-300 truncate">
                          {alerts[0].market.slice(0, 30)}...
                        </span>
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatTimeAgo(alerts[0].timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Blurred alerts */}
              <div className="relative">
                <div className="space-y-2 blur-sm pointer-events-none select-none">
                  {[1, 2].map((i) => (
                    <div key={i} className="p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                      <div className="flex items-start gap-3">
                        <span className="text-xl">🐋</span>
                        <div className="flex-1">
                          <p className="text-sm text-white">
                            <span className="font-medium text-blue-400">TopTrader</span>
                            {' bought '}
                            <span className="font-semibold text-green-400">$1,000</span>
                            {' on Market Name'}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">2h ago</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-sm text-slate-400 mb-2">See all whale moves</p>
                    <Link
                      href="/whale-alerts"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-purple-500 hover:to-blue-500 transition-all"
                    >
                      Unlock with Pro
                    </Link>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <p className="text-slate-500 text-sm">No whale alerts yet</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Pro users see full alerts
  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐋</span>
          <h3 className="text-lg font-semibold text-white">Whale Alerts</h3>
        </div>
        <Link
          href="/whale-alerts"
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          View All
        </Link>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-800 rounded-xl" />
          ))}
        </div>
      ) : alerts.length > 0 ? (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 bg-slate-800/50 rounded-xl border transition-all duration-500 ${
                newAlertId === alert.id
                  ? 'border-blue-500 animate-pulse shadow-lg shadow-blue-500/20'
                  : 'border-slate-700'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className={`text-xl ${newAlertId === alert.id ? 'animate-bounce' : ''}`}>
                  🐋
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">
                    <Link
                      href={`/traders/${alert.traderUsername}`}
                      className="font-medium text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      {alert.traderUsername}
                    </Link>
                    {' '}
                    <span className={alert.position === 'yes' ? 'text-green-400' : 'text-red-400'}>
                      {alert.position === 'yes' ? 'bought' : 'sold'}
                    </span>
                    {' '}
                    <span className="font-semibold text-white">
                      {formatCurrency(alert.size)}
                    </span>
                    {' on '}
                    <span className="text-slate-300">
                      {alert.market.length > 40 ? `${alert.market.slice(0, 40)}...` : alert.market}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {formatTimeAgo(alert.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <span className="text-4xl mb-3 block">🐋</span>
          <p className="text-slate-400">No whale trades detected yet</p>
          <p className="text-slate-500 text-sm mt-1">Large trades ($500+) will appear here</p>
        </div>
      )}
    </div>
  );
}
