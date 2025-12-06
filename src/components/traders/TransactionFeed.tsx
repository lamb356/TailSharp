// src/components/traders/TransactionFeed.tsx
'use client';

import { FC, useEffect, useState } from 'react';
import {
  Transaction,
  getCombinedTransactions,
  formatTimeAgo,
  shortenSignature,
} from '@/lib/solana/transactions';

interface TransactionFeedProps {
  walletAddress: string;
  limit?: number;
}

export const TransactionFeed: FC<TransactionFeedProps> = ({
  walletAddress,
  limit = 5,
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);

      try {
        const txs = await getCombinedTransactions(walletAddress, limit);
        setTransactions(txs);
      } catch (err) {
        console.error('Failed to fetch transactions:', err);
        setError('Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();

    // Refresh every 30 seconds
    const interval = setInterval(fetchTransactions, 30000);
    return () => clearInterval(interval);
  }, [walletAddress, limit]);

  if (loading && transactions.length === 0) {
    return (
      <div className="animate-pulse space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 bg-slate-800 rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-red-400 text-sm">{error}</div>;
  }

  if (transactions.length === 0) {
    return <div className="text-slate-500 text-sm">No recent transactions</div>;
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => (
        <a
          key={tx.signature}
          href={`https://solscan.io/tx/${tx.signature}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between bg-slate-900/50 hover:bg-slate-900/70 rounded-lg p-3 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-2 h-2 rounded-full ${
                tx.success ? 'bg-green-400' : 'bg-red-400'
              }`}
            />
            <div className="flex flex-col">
              <span className="text-slate-300 font-mono text-sm">
                {shortenSignature(tx.signature)}
              </span>
              {tx.description && (
                <span className="text-slate-500 text-xs truncate max-w-[200px]">
                  {tx.description}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-500 text-sm">
              {formatTimeAgo(tx.timestamp)}
            </span>
            <svg
              className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </div>
        </a>
      ))}
    </div>
  );
};
