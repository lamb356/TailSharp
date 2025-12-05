// src/components/traders/MarketCopyTradeCard.tsx
'use client';

import { FC } from 'react';
import { MarketCopyTrade } from '@/lib/dflow/copyTradeMarkets';
import { formatPrice } from '@/lib/dflow/api';
import Link from 'next/link';

interface MarketCopyTradeCardProps {
  trade: MarketCopyTrade;
  onExecute: (id: string) => void;
  onReject: (id: string) => void;
}

export const MarketCopyTradeCard: FC<MarketCopyTradeCardProps> = ({
  trade,
  onExecute,
  onReject,
}) => {
  const isYes = trade.side === 'yes';

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 text-xs font-bold rounded ${
              isYes
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            {trade.side.toUpperCase()}
          </span>
          <span className="text-white font-semibold">{trade.marketTicker}</span>
        </div>
        <span className="text-slate-500 text-xs">
          {trade.timestamp.toLocaleTimeString()}
        </span>
      </div>

      {/* Market Title */}
      <Link 
        href={`/markets/${trade.marketId}`}
        className="text-slate-300 text-sm hover:text-blue-400 transition-colors block mb-3"
      >
        {trade.marketTitle}
      </Link>

      {/* Trade Details */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Trader</span>
          <span className="text-white font-mono">{trade.traderShortAddress}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Trader Contracts</span>
          <span className="text-white">{trade.traderAmount}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Your Contracts</span>
          <span className={`font-semibold ${isYes ? 'text-green-400' : 'text-red-400'}`}>
            {trade.contracts}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Price</span>
          <span className="text-slate-300">{formatPrice(trade.pricePerContract)}</span>
        </div>
        <div className="flex justify-between text-sm border-t border-slate-700 pt-2 mt-2">
          <span className="text-slate-400">Total Cost</span>
          <span className="text-white font-semibold">${trade.estimatedCost.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Potential Payout</span>
          <span className="text-white">${trade.contracts.toFixed(2)}</span>
        </div>
      </div>

      {/* Actions */}
      {trade.status === 'pending' && (
        <div className="flex gap-2">
          <button
            onClick={() => onExecute(trade.id)}
            className={`flex-1 py-2 text-white text-sm font-semibold rounded-lg transition-all ${
              isYes
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            Execute {trade.side.toUpperCase()}
          </button>
          <button
            onClick={() => onReject(trade.id)}
            className="flex-1 py-2 bg-slate-700 text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-600 transition-all"
          >
            Skip
          </button>
        </div>
      )}

      {trade.status === 'executed' && (
        <div className="py-2 bg-green-500/20 text-green-400 text-center text-sm rounded-lg">
          ✓ Executed
        </div>
      )}
    </div>
  );
};
