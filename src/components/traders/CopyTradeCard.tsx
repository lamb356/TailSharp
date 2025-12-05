// src/components/traders/CopyTradeCard.tsx
'use client';

import { FC } from 'react';
import { SimulatedTrade, formatUsd } from '@/lib/solana/copyTrade';

interface CopyTradeCardProps {
  trade: SimulatedTrade;
  onExecute: (id: string) => void;
  onReject: (id: string) => void;
  autoExecute?: boolean;
}

export const CopyTradeCard: FC<CopyTradeCardProps> = ({
  trade,
  onExecute,
  onReject,
  autoExecute = false,
}) => {
  const isBuy = trade.action === 'BUY';

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 text-xs font-bold rounded ${
              isBuy
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            {trade.action}
          </span>
          <span className="text-white font-semibold">{trade.tokenSymbol}</span>
        </div>
        <span className="text-slate-500 text-xs">
          {trade.timestamp.toLocaleTimeString()}
        </span>
      </div>

      {/* Trade Details */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Trader</span>
          <span className="text-white font-mono">{trade.traderShortAddress}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Trader Amount</span>
          <span className="text-white">
            {trade.traderAmount.toLocaleString()} {trade.tokenSymbol}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Your Copy Amount</span>
          <span className={`font-semibold ${isBuy ? 'text-green-400' : 'text-red-400'}`}>
            {trade.yourAmount.toLocaleString()} {trade.tokenSymbol}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Proportion</span>
          <span className="text-slate-300">{trade.proportionPercent.toFixed(2)}%</span>
        </div>
        <div className="flex justify-between text-sm border-t border-slate-700 pt-2 mt-2">
          <span className="text-slate-400">Estimated Cost</span>
          <span className="text-white font-semibold">{formatUsd(trade.estimatedCost)}</span>
        </div>
      </div>

      {/* Actions */}
      {trade.status === 'pending' && (
        <div className="flex gap-2">
          {autoExecute ? (
            <div className="flex-1 py-2 bg-yellow-500/20 text-yellow-400 text-center text-sm rounded-lg">
              Auto-executing...
            </div>
          ) : (
            <>
              <button
                onClick={() => onExecute(trade.id)}
                className="flex-1 py-2 bg-gradient-to-r from-blue-500 to-teal-400 text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all"
              >
                Execute
              </button>
              <button
                onClick={() => onReject(trade.id)}
                className="flex-1 py-2 bg-slate-700 text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-600 transition-all"
              >
                Skip
              </button>
            </>
          )}
        </div>
      )}

      {trade.status === 'executed' && (
        <div className="py-2 bg-green-500/20 text-green-400 text-center text-sm rounded-lg">
          ✓ Executed
        </div>
      )}

      {trade.status === 'failed' && (
        <div className="py-2 bg-red-500/20 text-red-400 text-center text-sm rounded-lg">
          ✗ Failed
        </div>
      )}
    </div>
  );
};

