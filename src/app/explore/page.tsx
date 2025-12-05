// src/app/explore/page.tsx
'use client';

import { useState } from 'react';
import { ConnectButton } from '@/components/wallet/ConnectButton';
import { AddTrader } from '@/components/traders/AddTrader';
import { WalletDisplay } from '@/components/traders/WalletDisplay';
import { useStore } from '@/lib/store/useStore';
import { useAutoRefresh } from '@/lib/hooks/useAutoRefresh';
import { WalletData } from '@/lib/solana/tracker';
import Link from 'next/link';

export default function Explore() {
  const [trackedWallets, setTrackedWallets] = useState<WalletData[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { copySettings, addCopySettings, removeCopySettings } = useStore();

  const followingAddresses = copySettings.map((s) => s.traderId);

  // Auto-refresh every 15 seconds
  const { refreshWallets } = useAutoRefresh({
    wallets: trackedWallets,
    setWallets: setTrackedWallets,
    intervalMs: 15000,
    enabled: autoRefresh,
  });

  const handleAddTrader = (walletData: WalletData) => {
    if (trackedWallets.some((w) => w.address === walletData.address)) {
      return;
    }
    setTrackedWallets((prev) => [walletData, ...prev]);
  };

  const handleRemoveWallet = (address: string) => {
    setTrackedWallets((prev) => prev.filter((w) => w.address !== address));
  };

  const handleFollow = (address: string) => {
    if (followingAddresses.includes(address)) {
      removeCopySettings(address);
    } else {
      addCopySettings({
        traderId: address,
        allocationUsd: 100,
        maxPositionPercent: 25,
        stopLossPercent: 20,
        copyOpenPositions: false,
        isActive: true,
      });
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-800 sticky top-0 bg-slate-950/80 backdrop-blur-md z-50">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-teal-400 rounded-lg" />
          <span className="text-xl font-bold text-white">TailSharp</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-slate-400 hover:text-white transition-colors">
            Leaderboard
          </Link>
          <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors">
            Dashboard
          </Link>
          <ConnectButton />
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-white">Explore Wallets</h1>
          
          {/* Auto-refresh toggle */}
          {trackedWallets.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                onClick={refreshWallets}
                className="p-2 text-slate-400 hover:text-white transition-colors"
                title="Refresh now"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`relative w-10 h-6 rounded-full transition-colors ${
                    autoRefresh ? 'bg-blue-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      autoRefresh ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </div>
                <span className="text-slate-400 text-sm">Auto-refresh</span>
              </label>
            </div>
          )}
        </div>
        <p className="text-slate-400 mb-8">
          Track any Solana wallet to see their positions. Find sharps and follow them.
        </p>

        {/* Add Wallet Form */}
        <AddTrader onAddTrader={handleAddTrader} />

        {/* Example Wallets */}
        <div className="mb-8 p-4 bg-slate-800/30 border border-slate-700 rounded-xl">
          <p className="text-slate-400 text-sm mb-2">Try these example wallets:</p>
          <div className="flex flex-wrap gap-2">
            {[
              { addr: 'vines1vzrYbzLMRdu58ou5XTby4qAqVRLmqo36NKPTg', label: 'Vines' },
              { addr: 'GThUX1Atko4tqhN2NaiTazWSeFWMuiUvfFnyJyUghFMJ', label: 'Active Trader' },
            ].map(({ addr, label }) => (
              <button
                key={addr}
                onClick={async () => {
                  const { getWalletData } = await import('@/lib/solana/tracker');
                  const walletData = await getWalletData(addr);
                  handleAddTrader(walletData);
                }}
                className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-lg transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tracked Wallets */}
        {trackedWallets.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                Tracked Wallets ({trackedWallets.length})
              </h2>
              {autoRefresh && (
                <span className="flex items-center gap-1 text-green-400 text-sm">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  Live
                </span>
              )}
            </div>
            {trackedWallets.map((wallet) => (
              <WalletDisplay
                key={wallet.address}
                wallet={wallet}
                onFollow={handleFollow}
                onRemove={handleRemoveWallet}
                isFollowing={followingAddresses.includes(wallet.address)}
              />
            ))}
          </div>
        )}

        {trackedWallets.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <p className="text-lg mb-2">No wallets tracked yet</p>
            <p className="text-sm">Enter a Solana wallet address above or click an example</p>
          </div>
        )}
      </div>
    </main>
  );
}
