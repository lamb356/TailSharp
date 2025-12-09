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
    if (!address) return '';
    return address.slice(0, 4) + '...' + address.slice(-4);
  };

  const getSideClass = (side: string) => {
    if (side === 'YES') {
      return 'px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400';
    }
    return 'px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400';
  };

  const getStatusClass = (status: string) => {
    if (status === 'executed') {
      return 'px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400';
    }
    if (status === 'failed') {
      return 'px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400';
    }
    return 'px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-white text-xl">Loading trades...</div>
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Copy Trades</h1>
            <p className="text-slate-400">Automatically executed trades following your tracked traders</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 text-center">
            <p className="text-slate-400 text-lg">No copy trades yet</p>
            <p className="text-slate-500 text-sm mt-2">
              When your tracked traders make prediction market trades, they will appear here
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Copy Trades</h1>
          <p className="text-slate-400">Automatically executed trades following your tracked traders</p>
        </div>
        <div className="space-y-4">
          {trades.map((trade) => (
            <TradeCard key={trade.id} trade={trade} formatTime={formatTime} shortenAddress={shortenAddress} getSideClass={getSideClass} getStatusClass={getStatusClass} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TradeCard({ trade, formatTime, shortenAddress, getSideClass, getStatusClass }: any) {
  const walletUrl = 'https://solscan.io/account/' + trade.originalTrade.walletAddress;
  const txUrl = trade.ourSignature ? 'https://solscan.io/tx/' + trade.ourSignature : null;

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 hover:bg-slate-800/70 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-semibold text-white">{trade.originalTrade.market}</h3>
            <span className={getSideClass(trade.originalTrade.side)}>{trade.originalTrade.side}</span>
            <span className={getStatusClass(trade.status)}>{trade.status}</span>
          </div>
          <p className="text-slate-400 text-sm">
            Following: <a href={walletUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">{shortenAddress(trade.originalTrade.walletAddress)}</a>
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white"></p>
          <p className="text-slate-400 text-sm">( original)</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-slate-500">Price</p>
          <p className="text-white font-semibold"></p>
        </div>
        <div>
          <p className="text-slate-500">Executed At</p>
          <p className="text-white font-semibold">{trade.executedAt ? formatTime(trade.executedAt) : 'Pending'}</p>
        </div>
      </div>
      {txUrl && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <p className="text-slate-500 text-xs mb-1">Transaction</p>
          <a href={txUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-sm font-mono underline">{trade.ourSignature}</a>
        </div>
      )}
      {trade.error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">{trade.error}</p>
        </div>
      )}
    </div>
  );
}
