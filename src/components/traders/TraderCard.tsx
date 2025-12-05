// src/components/traders/TraderCard.tsx
'use client';

import { FC } from 'react';
import type { Trader } from '@/types';

interface TraderCardProps {
  trader: Trader;
  onFollow: (address: string) => void;
  isFollowing: boolean;
}

export const TraderCard: FC<TraderCardProps> = ({ trader, onFollow, isFollowing }) => {
  const roiColor = trader.stats.roi >= 0 ? 'text-green-400' : 'text-red-400';
  const roiSign = trader.stats.roi >= 0 ? '+' : '';

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 hover:border-slate-600 transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-teal-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {trader.displayName?.[0] || trader.address.slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-white font-semibold">
                {trader.displayName || `${trader.address.slice(0, 4)}...${trader.address.slice(-4)}`}
              </p>
              {trader.isVerified && (
                <span className="text-blue-400">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </div>
            <p className="text-slate-500 text-sm">{trader.followers} followers</p>
          </div>
        </div>
        <button
          onClick={() => onFollow(trader.address)}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            isFollowing
              ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              : 'bg-gradient-to-r from-blue-500 to-teal-400 text-white hover:opacity-90'
          }`}
        >
          {isFollowing ? 'Following' : 'Follow'}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-slate-900/50 rounded-xl">
          <p className={`text-xl font-bold ${roiColor}`}>
            {roiSign}{trader.stats.roi.toFixed(1)}%
          </p>
          <p className="text-slate-500 text-sm">ROI</p>
        </div>
        <div className="text-center p-3 bg-slate-900/50 rounded-xl">
          <p className="text-xl font-bold text-white">
            {trader.stats.winRate.toFixed(0)}%
          </p>
          <p className="text-slate-500 text-sm">Win Rate</p>
        </div>
        <div className="text-center p-3 bg-slate-900/50 rounded-xl">
          <p className="text-xl font-bold text-white">
            {trader.stats.totalTrades}
          </p>
          <p className="text-slate-500 text-sm">Trades</p>
        </div>
      </div>

      {/* Active Positions Preview */}
      {trader.positions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <p className="text-slate-400 text-sm mb-2">Active Positions</p>
          <div className="space-y-2">
            {trader.positions.slice(0, 2).map((position) => (
              <div
                key={position.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-slate-300 truncate max-w-[200px]">
                  {position.marketTitle}
                </span>
                <span className={position.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {position.pnl >= 0 ? '+' : ''}{position.pnlPercent.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
