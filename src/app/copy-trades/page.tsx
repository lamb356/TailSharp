'use client';

import { useEffect, useState } from 'react';

interface ExecutedTrade {
  id: string;
  originalTrade: {
    market: string;
    side: 'YES' | 'NO';
    amount: number;
    price: number;
    walletAddress: string;
    signature: string;
    timestamp: number;
  };
  decision: {
    shouldCopy: boolean;
    positionSize: number;
  };
  status: 'pending' | 'executed' | 'failed';
  executedAt?: number;
  error?: string;
  ourSignature?: string;
}

export default function CopyTradesPage() {
  const [trades, setTrades] = useState<ExecutedTrade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrades();
    // Refresh every 5 seconds
    const interval = setInterval(fetchTrades, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchTrades = async () => {
    try {
      const res = await fetch('/api/copy-trades');
      const data = await res.json();
      setTrades(data.trades || []);
    } catch (error) {
      console.error('Failed to fetch trades:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading trades...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Copy Trades</h1>
          <p className="text-gray-400">Automatically executed trades following your tracked traders</p>
        </div>

        {trades.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8 text-center">
            <p className="text-gray-400 text-lg">No copy trades yet</p>
            <p className="text-gray-500 text-sm mt-2">
              When your tracked traders make prediction market trades, they'll appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {trades.map((trade) => (
              <div
                key={trade.id}
                className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-white">
                        {trade.originalTrade.market}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          trade.originalTrade.side === 'YES'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {trade.originalTrade.side}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          trade.status === 'executed'
                            ? 'bg-blue-500/20 text-blue-400'
                            : trade.status === 'failed'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}
                      >
                        {trade.status}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      Following:{' '}
                      <a
                        href={`https://solscan.io/account/${trade.originalTrade.walletAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:text-purple-300 underline"
                      >
                        {shortenAddress(trade.originalTrade.walletAddress)}
                      </a>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">
                      ${trade.decision.positionSize}
                    </p>
                    <p className="text-gray-400 text-sm">
                      (${trade.originalTrade.amount} original)
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Price</p>
                    <p className="text-white font-semibold">
                      ${trade.originalTrade.price.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Executed At</p>
                    <p className="text-white font-semibold">
                      {trade.executedAt ? formatTime(trade.executedAt) : 'Pending'}
                    </p>
                  </div>
                </div>

                {trade.ourSignature && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-gray-500 text-xs mb-1">Transaction</p>
                    <a
                      href={`https://solscan.io/tx/${trade.ourSignature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 text-sm font-mono underline"
                    >
                      {trade.ourSignature}
                    </a>
                  </div>
                )}

                {trade.error && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-sm">{trade.error}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
