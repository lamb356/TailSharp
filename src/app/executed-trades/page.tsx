'use client';

import { useEffect, useState } from 'react';
import React from 'react';

type OriginalTrade = {
  market: string;
  side: 'YES' | 'NO';
  amount: number;
  price: number;
  walletAddress: string;
  signature: string;
  timestamp: number;
};

type CopyDecision = {
  shouldCopy: boolean;
  positionSize?: number;
  reason?: string;
};

type ExecutedTrade = {
  id: string;
  originalTrade: OriginalTrade;
  decision?: CopyDecision;
  status: 'pending' | 'executed' | 'failed';
  executedAt?: number;
  error?: string;
  ourOrderId?: string;
  kalshiTicker?: string;
  isSimulation?: boolean;
};

export default function ExecutedTradesPage() {
  const [trades, setTrades] = useState<ExecutedTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTrade, setExpandedTrade] = useState<string | null>(null);

  useEffect(() => {
    async function loadTrades() {
      try {
        const res = await fetch('/api/executed-trades');
        const data = await res.json();
        setTrades(data.trades || []);
      } catch (e) {
        setError('Failed to load executed trades');
      } finally {
        setLoading(false);
      }
    }
    loadTrades();
  }, []);

  function getStatusBadge(trade: ExecutedTrade) {
    if (trade.status === 'executed') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
          Executed
        </span>
      );
    }
    if (trade.status === 'failed') {
      const isNoMatch = trade.error?.includes('No matching');
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
          isNoMatch 
            ? 'bg-amber-500/10 text-amber-400' 
            : 'bg-red-500/10 text-red-400'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isNoMatch ? 'bg-amber-400' : 'bg-red-400'}`}></span>
          {isNoMatch ? 'No Match' : 'Failed'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></span>
        Pending
      </span>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-6 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Executed Trades</h1>
            <p className="text-slate-400 text-sm mt-1">History of all copy trade attempts</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
              <span className="text-slate-400">Executed</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span className="text-slate-400">No Match</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400"></span>
              <span className="text-slate-400">Failed</span>
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
        {loading && <p className="text-sm text-gray-400">Loading trades...</p>}

        {!loading && trades.length === 0 && (
          <div className="text-center py-12 border border-slate-800 rounded-lg">
            <p className="text-slate-400">No trades executed yet.</p>
            <p className="text-slate-500 text-sm mt-1">Trades will appear here when tracked wallets make prediction market trades.</p>
          </div>
        )}

        {!loading && trades.length > 0 && (
          <div className="overflow-x-auto border border-slate-800 rounded-lg">
            <table className="min-w-full text-xs md:text-sm">
              <thead className="bg-slate-900/80">
                <tr>
                  <th className="px-3 py-3 text-left font-medium text-slate-300">Time</th>
                  <th className="px-3 py-3 text-left font-medium text-slate-300">Trader</th>
                  <th className="px-3 py-3 text-left font-medium text-slate-300">Source Market</th>
                  <th className="px-3 py-3 text-left font-medium text-slate-300">Side</th>
                  <th className="px-3 py-3 text-left font-medium text-slate-300">Size</th>
                  <th className="px-3 py-3 text-left font-medium text-slate-300">Kalshi Match</th>
                  <th className="px-3 py-3 text-left font-medium text-slate-300">Status</th>
                  <th className="px-3 py-3 text-left font-medium text-slate-300">Mode</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((t) => {
                  const dt = new Date((t.executedAt || t.originalTrade.timestamp) * 1000);
                  const isExpanded = expandedTrade === t.id;
                  const hasError = t.status === 'failed' && t.error;
                  
                  return (
                    <React.Fragment key={t.id}>
                      <tr 
                        className={`border-t border-slate-800 hover:bg-slate-900/50 cursor-pointer ${hasError ? 'bg-red-950/20' : ''}`}
                        onClick={() => setExpandedTrade(isExpanded ? null : t.id)}
                      >
                        <td className="px-3 py-3 whitespace-nowrap text-slate-300">
                          {dt.toLocaleString()}
                        </td>
                        <td className="px-3 py-3 font-mono text-slate-400">
                          {t.originalTrade.walletAddress.slice(0, 4)}...
                          {t.originalTrade.walletAddress.slice(-4)}
                        </td>
                        <td className="px-3 py-3 max-w-xs">
                          <span className="truncate block" title={t.originalTrade.market}>
                            {t.originalTrade.market}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className={t.originalTrade.side === 'YES' ? 'text-green-400' : 'text-red-400'}>
                            {t.originalTrade.side}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-slate-300">
                          {t.decision?.positionSize ?? t.originalTrade.amount}
                        </td>
                        <td className="px-3 py-3">
                          {t.kalshiTicker ? (
                            <span className="font-mono text-blue-400">{t.kalshiTicker}</span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          {getStatusBadge(t)}
                        </td>
                        <td className="px-3 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            t.isSimulation 
                              ? 'bg-amber-500/10 text-amber-300' 
                              : 'bg-emerald-500/10 text-emerald-300'
                          }`}>
                            {t.isSimulation ? 'Sim' : 'Live'}
                          </span>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="border-t border-slate-800 bg-slate-900/30">
                          <td colSpan={8} className="px-4 py-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                              <div>
                                <p className="text-slate-500 mb-1">Trade ID</p>
                                <p className="font-mono text-slate-300">{t.id}</p>
                              </div>
                              <div>
                                <p className="text-slate-500 mb-1">Order ID</p>
                                <p className="font-mono text-slate-300">{t.ourOrderId || '-'}</p>
                              </div>
                              <div>
                                <p className="text-slate-500 mb-1">Original Amount</p>
                                <p className="text-slate-300">{t.originalTrade.amount} contracts</p>
                              </div>
                              <div>
                                <p className="text-slate-500 mb-1">Full Wallet</p>
                                <p className="font-mono text-slate-300 truncate">{t.originalTrade.walletAddress}</p>
                              </div>
                              {t.error && (
                                <div className="col-span-2 md:col-span-4">
                                  <p className="text-slate-500 mb-1">Error Details</p>
                                  <p className="text-red-400 bg-red-950/30 px-3 py-2 rounded border border-red-900/50">
                                    {t.error}
                                  </p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}