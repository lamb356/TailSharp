// src/components/traders/CopyTradesModal.tsx
'use client';

import { FC, useState } from 'react';
import { TraderProfile } from '@/types/trader';
import { useStore } from '@/lib/store/useStore';

interface CopyTradesModalProps {
  trader: TraderProfile;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type SizingMode = 'percentage' | 'fixed';

const MARKET_CATEGORIES = [
  { id: 'politics', label: 'Politics', icon: '🏛️' },
  { id: 'crypto', label: 'Crypto', icon: '₿' },
  { id: 'economics', label: 'Economics', icon: '📊' },
  { id: 'sports', label: 'Sports', icon: '⚽' },
  { id: 'tech', label: 'Tech', icon: '💻' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎬' },
];

export const CopyTradesModal: FC<CopyTradesModalProps> = ({
  trader,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { addCopySettings } = useStore();

  // Form state
  const [sizingMode, setSizingMode] = useState<SizingMode>('percentage');
  const [percentageSize, setPercentageSize] = useState(10);
  const [fixedSize, setFixedSize] = useState(100);
  const [maxExposure, setMaxExposure] = useState(500);
  const [dailyLossLimit, setDailyLossLimit] = useState(200);
  const [enabledCategories, setEnabledCategories] = useState<string[]>(
    MARKET_CATEGORIES.map((c) => c.id)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const toggleCategory = (categoryId: string) => {
    setEnabledCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((c) => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleStartCopying = async () => {
    setIsSubmitting(true);

    try {
      await addCopySettings({
        traderId: trader.walletAddress,
        allocationUsd: sizingMode === 'fixed' ? fixedSize : 0,
        maxPositionPercent: sizingMode === 'percentage' ? percentageSize : 0,
        stopLossPercent: (dailyLossLimit / maxExposure) * 100,
        copyOpenPositions: false,
        isActive: true,
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to start copying:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const roiClass = trader.stats.roi >= 0 ? 'text-green-400' : 'text-red-400';
  const roiPrefix = trader.stats.roi >= 0 ? '+' : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Copy Trade Settings</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
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

        <div className="p-6 space-y-6">
          {/* Trader Preview */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-teal-400 rounded-xl flex items-center justify-center text-2xl font-bold text-white">
                {trader.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-white">
                    {trader.displayName}
                  </h3>
                  {trader.verified && (
                    <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded">
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-sm">@{trader.username}</p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-3 mt-4">
              <div className="text-center">
                <p className={`text-lg font-bold ${roiClass}`}>
                  {roiPrefix}{trader.stats.roi.toFixed(1)}%
                </p>
                <p className="text-slate-500 text-xs">ROI</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-white">
                  {trader.stats.winRate.toFixed(0)}%
                </p>
                <p className="text-slate-500 text-xs">Win Rate</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-white">
                  {trader.stats.totalTrades}
                </p>
                <p className="text-slate-500 text-xs">Trades</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-white">
                  {trader.stats.followers}
                </p>
                <p className="text-slate-500 text-xs">Followers</p>
              </div>
            </div>
          </div>

          {/* Position Sizing */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Position Sizing
            </label>
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setSizingMode('percentage')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  sizingMode === 'percentage'
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                % of Portfolio
              </button>
              <button
                onClick={() => setSizingMode('fixed')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  sizingMode === 'fixed'
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                Fixed Amount
              </button>
            </div>

            {sizingMode === 'percentage' ? (
              <div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={percentageSize}
                    onChange={(e) => setPercentageSize(Number(e.target.value))}
                    className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-center">
                    <span className="text-white font-semibold">{percentageSize}%</span>
                  </div>
                </div>
                <p className="text-slate-500 text-xs mt-2">
                  Each trade will use {percentageSize}% of your available balance
                </p>
              </div>
            ) : (
              <div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    $
                  </span>
                  <input
                    type="number"
                    min="10"
                    max="10000"
                    value={fixedSize}
                    onChange={(e) => setFixedSize(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-7 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="text-slate-500 text-xs mt-2">
                  Each trade will use ${fixedSize} USDC
                </p>
              </div>
            )}
          </div>

          {/* Max Exposure Per Trade */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Max Exposure Per Trade
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                $
              </span>
              <input
                type="number"
                min="50"
                max="10000"
                value={maxExposure}
                onChange={(e) => setMaxExposure(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-7 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="text-slate-500 text-xs mt-2">
              Maximum amount risked on a single trade
            </p>
          </div>

          {/* Daily Loss Limit */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Daily Loss Limit
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                $
              </span>
              <input
                type="number"
                min="50"
                max="5000"
                value={dailyLossLimit}
                onChange={(e) => setDailyLossLimit(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-7 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="text-slate-500 text-xs mt-2">
              Stop copying after losing ${dailyLossLimit} in a day
            </p>
          </div>

          {/* Market Categories */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Market Categories
            </label>
            <div className="grid grid-cols-2 gap-2">
              {MARKET_CATEGORIES.map((category) => {
                const isEnabled = enabledCategories.includes(category.id);
                return (
                  <button
                    key={category.id}
                    onClick={() => toggleCategory(category.id)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                      isEnabled
                        ? 'bg-blue-500/20 border-blue-500/50 text-white'
                        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <span>{category.icon}</span>
                    <span className="text-sm font-medium">{category.label}</span>
                    {isEnabled && (
                      <svg
                        className="w-4 h-4 ml-auto text-blue-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-slate-500 text-xs mt-2">
              Only copy trades in selected market categories
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-900 border-t border-slate-800 px-6 py-4">
          <button
            onClick={handleStartCopying}
            disabled={isSubmitting || enabledCategories.length === 0}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-teal-400 text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Setting up...' : 'Start Copying'}
          </button>
          <p className="text-slate-500 text-xs text-center mt-3">
            You can modify or stop copying at any time from your dashboard
          </p>
        </div>
      </div>
    </div>
  );
};
