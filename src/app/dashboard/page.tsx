// src/app/dashboard/page.tsx
'use client';

import { ConnectButton } from '@/components/wallet/ConnectButton';
import { useStore } from '@/lib/store/useStore';
import { useCopyTrades } from '@/lib/store/useCopyTrades';
import { useWallet } from '@solana/wallet-adapter-react';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { CopyTradePanel } from '@/components/traders/CopyTradePanel';
import Link from 'next/link';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

// Enable this for testing without wallet
const DEV_MODE = true;

export default function Dashboard() {
  const { connected } = useWallet();
  const { copySettings, removeCopySettings, updateCopySettings } = useStore();
  const { simulatedTrades } = useCopyTrades();

  const isAuthenticated = DEV_MODE || connected;
  const pendingTradesCount = simulatedTrades.filter((t) => t.status === 'pending').length;

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
      {/* Header */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-800 sticky top-0 bg-slate-950/80 backdrop-blur-md z-50">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.jpg" alt="TailSharp" width={32} height={32} className="rounded-lg" />
          <span className="text-xl font-bold text-white">TailSharp</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-slate-400 hover:text-white transition-colors">
            Leaderboard
          </Link>
          <Link href="/explore" className="text-slate-400 hover:text-white transition-colors">
            Explore
          </Link>
          {DEV_MODE && (
            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded">
              DEV MODE
            </span>
          )}
          <NotificationBell />
          <ConnectButton />
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-400 mt-1">Manage your copy trading</p>
          </div>
          {pendingTradesCount > 0 && (
            <div className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium animate-pulse">
              {pendingTradesCount} pending trade{pendingTradesCount > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Stats Overview */}
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
              ${copySettings.reduce((sum, s) => sum + s.allocationUsd, 0)}
            </p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
            <p className="text-slate-400 text-sm">Pending Trades</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">{pendingTradesCount}</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Following List */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Following</h2>

            {copySettings.length === 0 ? (
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
                <p className="text-slate-400 mb-4">You&apos;re not following any traders yet</p>
                <Link
                  href="/explore"
                  className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-400 text-white font-semibold rounded-xl hover:opacity-90 transition-all"
                >
                  Find Traders
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {copySettings.map((settings) => (
                  <div
                    key={settings.traderId}
                    className="bg-slate-800/50 border border-slate-700 rounded-xl p-5"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-teal-400 rounded-full flex items-center justify-center text-white font-bold">
                          {settings.traderId.slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {settings.traderId.slice(0, 4)}...{settings.traderId.slice(-4)}
                          </p>
                          <p className="text-sm">
                            {settings.isActive ? (
                              <span className="text-green-400">● Active</span>
                            ) : (
                              <span className="text-slate-500">● Paused</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeCopySettings(settings.traderId)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Unfollow
                      </button>
                    </div>

                    {/* Settings */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-slate-500 text-xs block mb-1">Allocation</label>
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
                        <label className="text-slate-500 text-xs block mb-1">Max %</label>
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
                ))}
              </div>
            )}
          </div>

          {/* Right: Copy Trade Panel */}
          <div>
            <CopyTradePanel />
          </div>
        </div>
      </div>
    </main>
  );
}
