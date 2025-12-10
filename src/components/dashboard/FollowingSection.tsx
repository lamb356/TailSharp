// src/components/dashboard/FollowingSection.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store/useStore';
import { TraderProfile } from '@/types/trader';

interface FollowedTrader {
  settings: {
    traderId: string;
    allocationUsd: number;
    maxPositionPercent: number;
    isActive: boolean;
  };
  profile?: TraderProfile;
}

export function FollowingSection() {
  const { copySettings, updateCopySettings, removeCopySettings } = useStore();
  const [followedTraders, setFollowedTraders] = useState<FollowedTrader[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch trader profiles for all followed wallets
  useEffect(() => {
    async function fetchTraderProfiles() {
      const traders: FollowedTrader[] = [];

      for (const settings of copySettings) {
        try {
          const res = await fetch(`/api/traders?q=${settings.traderId}&limit=1`);
          const data = await res.json();

          traders.push({
            settings,
            profile: data.traders?.[0] || undefined,
          });
        } catch {
          traders.push({ settings });
        }
      }

      setFollowedTraders(traders);
      setLoading(false);
    }

    if (copySettings.length > 0) {
      fetchTraderProfiles();
    } else {
      setFollowedTraders([]);
      setLoading(false);
    }
  }, [copySettings]);

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (loading && copySettings.length > 0) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Following</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-700 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-700 rounded w-1/2" />
                <div className="h-3 bg-slate-700 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (followedTraders.length === 0) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Following</h2>
        <div className="text-center py-6">
          <p className="text-slate-400 mb-4">You are not following any traders yet</p>
          <Link
            href="/traders"
            className="inline-block px-4 py-2 bg-gradient-to-r from-blue-500 to-teal-400 text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all"
          >
            Browse Traders
          </Link>
        </div>
      </div>
    );
  }

  const activeCount = followedTraders.filter((t) => t.settings.isActive).length;
  const totalAllocation = followedTraders.reduce(
    (sum, t) => sum + t.settings.allocationUsd,
    0
  );

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Following</h2>
          <p className="text-slate-500 text-sm">
            {activeCount} active / {followedTraders.length} total
          </p>
        </div>
        <div className="text-right">
          <p className="text-white font-semibold">${totalAllocation.toLocaleString()}</p>
          <p className="text-slate-500 text-xs">allocated</p>
        </div>
      </div>

      {/* Trader List */}
      <div className="divide-y divide-slate-700/50">
        {followedTraders.map(({ settings, profile }) => {
          const displayName = profile?.displayName || shortenAddress(settings.traderId);
          const username = profile?.username;

          return (
            <div
              key={settings.traderId}
              className="px-6 py-4 hover:bg-slate-700/30 transition-colors"
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-400 rounded-full flex items-center justify-center text-white font-bold shrink-0">
                  {displayName.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {username ? (
                      <Link
                        href={`/traders/${username}`}
                        className="text-white font-medium hover:text-blue-400 transition-colors"
                      >
                        {displayName}
                      </Link>
                    ) : (
                      <span className="text-white font-medium font-mono">
                        {displayName}
                      </span>
                    )}
                    {profile?.verified && (
                      <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">
                        Verified
                      </span>
                    )}
                    <span
                      className={`px-1.5 py-0.5 text-xs rounded ${
                        settings.isActive
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-slate-600 text-slate-400'
                      }`}
                    >
                      {settings.isActive ? 'Active' : 'Paused'}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mt-1 text-sm">
                    {profile?.stats ? (
                      <>
                        <span
                          className={
                            profile.stats.roi >= 0
                              ? 'text-green-400'
                              : 'text-red-400'
                          }
                        >
                          {profile.stats.roi >= 0 ? '+' : ''}
                          {profile.stats.roi.toFixed(1)}% ROI
                        </span>
                        <span className="text-slate-400">
                          {profile.stats.winRate.toFixed(0)}% win
                        </span>
                      </>
                    ) : (
                      <span className="text-slate-500">No stats available</span>
                    )}
                    <span className="text-slate-500">
                      ${settings.allocationUsd} allocated
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() =>
                      updateCopySettings(settings.traderId, {
                        isActive: !settings.isActive,
                      })
                    }
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      settings.isActive
                        ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {settings.isActive ? 'Pause' : 'Resume'}
                  </button>
                  <button
                    onClick={() => removeCopySettings(settings.traderId)}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Unfollow"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-slate-700 flex items-center justify-between">
        <Link
          href="/traders"
          className="text-blue-400 hover:text-blue-300 text-sm"
        >
          + Add more traders
        </Link>
        <Link
          href="/settings"
          className="text-slate-400 hover:text-white text-sm"
        >
          Manage settings
        </Link>
      </div>
    </div>
  );
}
