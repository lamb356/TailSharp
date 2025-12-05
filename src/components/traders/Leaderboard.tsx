// src/components/traders/Leaderboard.tsx
'use client';

import { FC, useState } from 'react';
import { TraderCard } from './TraderCard';
import { useStore } from '@/lib/store/useStore';
import type { Trader } from '@/types';

// Mock data for now - we'll replace with real on-chain data
const MOCK_TRADERS: Trader[] = [
  {
    address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    displayName: 'SharpWhale',
    avatar: null,
    followers: 1243,
    isVerified: true,
    stats: {
      totalTrades: 156,
      winRate: 68.5,
      roi: 42.3,
      sharpeRatio: 1.8,
      avgPositionSize: 2500,
      totalVolume: 390000,
      lastActiveAt: new Date(),
    },
    positions: [
      {
        id: '1',
        marketId: 'fed-rate-dec',
        marketTitle: 'Fed cuts rates in December?',
        outcome: 'YES',
        contracts: 500,
        avgPrice: 0.65,
        currentPrice: 0.72,
        pnl: 35,
        pnlPercent: 10.7,
        openedAt: new Date(),
      },
    ],
  },
  {
    address: '9aE476sH92Vz7DMPyq5WLPkrKWivxeuTKEFKd2sZZcde',
    displayName: 'PredictorAlpha',
    avatar: null,
    followers: 892,
    isVerified: true,
    stats: {
      totalTrades: 234,
      winRate: 61.2,
      roi: 28.7,
      sharpeRatio: 1.5,
      avgPositionSize: 1800,
      totalVolume: 421200,
      lastActiveAt: new Date(),
    },
    positions: [
      {
        id: '2',
        marketId: 'btc-100k',
        marketTitle: 'BTC above $100k by year end?',
        outcome: 'YES',
        contracts: 300,
        avgPrice: 0.45,
        currentPrice: 0.58,
        pnl: 39,
        pnlPercent: 28.8,
        openedAt: new Date(),
      },
    ],
  },
  {
    address: '4Nd1mBQtrMJVYVfKf2PJy9NZUZdTAsp7D4xWLs4gDB4T',
    displayName: 'EventEdge',
    avatar: null,
    followers: 567,
    isVerified: false,
    stats: {
      totalTrades: 89,
      winRate: 72.1,
      roi: 55.2,
      sharpeRatio: 2.1,
      avgPositionSize: 3200,
      totalVolume: 284800,
      lastActiveAt: new Date(),
    },
    positions: [],
  },
  {
    address: '6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J',
    displayName: null,
    avatar: null,
    followers: 234,
    isVerified: false,
    stats: {
      totalTrades: 312,
      winRate: 58.9,
      roi: 19.4,
      sharpeRatio: 1.2,
      avgPositionSize: 950,
      totalVolume: 296400,
      lastActiveAt: new Date(),
    },
    positions: [
      {
        id: '3',
        marketId: 'inflation-3',
        marketTitle: 'CPI above 3% in January?',
        outcome: 'NO',
        contracts: 200,
        avgPrice: 0.38,
        currentPrice: 0.32,
        pnl: -12,
        pnlPercent: -15.7,
        openedAt: new Date(),
      },
    ],
  },
];

type SortOption = 'roi' | 'winRate' | 'volume' | 'followers';

export const Leaderboard: FC = () => {
  const [sortBy, setSortBy] = useState<SortOption>('roi');
  const { copySettings, addCopySettings, removeCopySettings } = useStore();

  const followingAddresses = copySettings.map((s) => s.traderId);

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

  const sortedTraders = [...MOCK_TRADERS].sort((a, b) => {
    switch (sortBy) {
      case 'roi':
        return b.stats.roi - a.stats.roi;
      case 'winRate':
        return b.stats.winRate - a.stats.winRate;
      case 'volume':
        return b.stats.totalVolume - a.stats.totalVolume;
      case 'followers':
        return b.followers - a.followers;
      default:
        return 0;
    }
  });

  return (
    <section className="px-6 py-12 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white">Top Traders</h2>
          <p className="text-slate-400 mt-1">Follow the sharps and auto-copy their positions</p>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-sm">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="roi">ROI</option>
            <option value="winRate">Win Rate</option>
            <option value="volume">Volume</option>
            <option value="followers">Followers</option>
          </select>
        </div>
      </div>

      {/* Trader Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sortedTraders.map((trader) => (
          <TraderCard
            key={trader.address}
            trader={trader}
            onFollow={handleFollow}
            isFollowing={followingAddresses.includes(trader.address)}
          />
        ))}
      </div>
    </section>
  );
};
