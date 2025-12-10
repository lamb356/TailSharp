'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { TraderProfile } from '@/types/trader';
import { CopyTradesModal } from '@/components/traders/CopyTradesModal';
import { useNotifications } from '@/lib/store/useNotifications';
import { Trade } from '@/lib/trades';

function ExternalLink({ href, className, children }: { href: string; className: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}

function TradeCard({ trade }: { trade: Trade }) {
  const isYes = trade.position === 'yes';
  const isBuy = trade.action === 'buy';

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const platformColors: Record<string, string> = {
    polymarket: 'bg-purple-500/20 text-purple-400',
    drift: 'bg-blue-500/20 text-blue-400',
    kalshi: 'bg-orange-500/20 text-orange-400',
    unknown: 'bg-slate-500/20 text-slate-400',
  };

  return (
    <div className="bg-slate-900/50 border border-slate-700 rounded-lg md:rounded-xl p-3 md:p-4 hover:border-slate-600 transition-colors">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mb-1">
            <span className={`px-1.5 md:px-2 py-0.5 text-[10px] md:text-xs font-semibold rounded ${
              isYes ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {trade.position.toUpperCase()}
            </span>
            <span className={`px-1.5 md:px-2 py-0.5 text-[10px] md:text-xs rounded ${platformColors[trade.platform]}`}>
              {trade.platform}
            </span>
            {trade.market.category && (
              <span className="px-1.5 md:px-2 py-0.5 text-[10px] md:text-xs bg-slate-700 text-slate-300 rounded">
                {trade.market.category}
              </span>
            )}
            {/* Mobile timestamp */}
            <span className="md:hidden text-slate-500 text-[10px] ml-auto">{formatTime(trade.timestamp)}</span>
          </div>
          <p className="text-white text-sm md:text-base font-medium line-clamp-2 md:truncate">{trade.market.title}</p>
          <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-1.5 md:mt-2 text-xs md:text-sm">
            <span className="text-slate-400">
              {isBuy ? 'Bought' : 'Sold'} <span className="text-white">{trade.size.toFixed(0)}</span>
            </span>
            <span className="text-slate-400">
              @ <span className="text-white">${trade.price.toFixed(2)}</span>
            </span>
            <span className={isBuy ? 'text-red-400' : 'text-green-400'}>
              {isBuy ? '-' : '+'}${trade.cost.toFixed(2)}
            </span>
          </div>
        </div>
        {/* Desktop timestamp and link */}
        <div className="hidden md:block text-right shrink-0">
          <p className="text-slate-500 text-sm">{formatTime(trade.timestamp)}</p>
          <a
            href={`https://solscan.io/tx/${trade.signature}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 font-mono"
          >
            {trade.signature.slice(0, 8)}...
          </a>
        </div>
        {/* Mobile transaction link */}
        <a
          href={`https://solscan.io/tx/${trade.signature}`}
          target="_blank"
          rel="noopener noreferrer"
          className="md:hidden text-[10px] text-blue-400 hover:text-blue-300 font-mono"
        >
          View tx: {trade.signature.slice(0, 6)}...
        </a>
      </div>
    </div>
  );
}

export default function TraderProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [trader, setTrader] = useState<TraderProfile | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [tradesLoading, setTradesLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCopyModal, setShowCopyModal] = useState(false);

  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { addNotification } = useNotifications();

  useEffect(() => {
    async function fetchTrader() {
      try {
        const url = '/api/traders/' + username;
        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Trader not found');
          return;
        }
        setTrader(data.trader);
      } catch (e) {
        setError('Failed to load trader');
      } finally {
        setLoading(false);
      }
    }
    fetchTrader();
  }, [username]);

  // Fetch trades when trader is loaded
  useEffect(() => {
    async function fetchTrades() {
      if (!trader?.walletAddress) return;

      setTradesLoading(true);
      try {
        const res = await fetch(`/api/trades/${trader.walletAddress}?limit=20`);
        const data = await res.json();
        if (res.ok && data.trades) {
          setTrades(data.trades);
        }
      } catch (e) {
        console.error('Failed to fetch trades:', e);
      } finally {
        setTradesLoading(false);
      }
    }
    fetchTrades();
  }, [trader?.walletAddress]);

  const handleCopyTrades = () => {
    if (!connected) {
      setVisible(true);
      return;
    }

    if (!trader) return;

    setShowCopyModal(true);
  };

  const handleCopySuccess = () => {
    addNotification({
      type: 'info',
      title: 'Copy Trading Activated',
      message: `Now copying trades from ${trader?.displayName}`,
    });
  };

  const shortenAddress = (address: string) => {
    return address.slice(0, 4) + '...' + address.slice(-4);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 md:py-20 px-4">
        <div className="text-white text-lg md:text-xl">Loading profile...</div>
      </div>
    );
  }

  if (error || !trader) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-2xl mx-auto text-center py-16 md:py-20">
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-3 md:mb-4">Trader Not Found</h1>
          <p className="text-slate-400 mb-6 md:mb-8 text-sm md:text-base">{error || 'This trader profile does not exist.'}</p>
          <Link
            href="/traders"
            className="px-5 md:px-6 py-2.5 md:py-3 bg-gradient-to-r from-blue-500 to-teal-400 text-white text-sm md:text-base font-semibold rounded-lg md:rounded-xl hover:opacity-90 transition-all"
          >
            Browse Traders
          </Link>
        </div>
      </div>
    );
  }

  const solscanUrl = 'https://solscan.io/account/' + trader.walletAddress;
  const xUrl = trader.twitter ? 'https://x.com/' + trader.twitter : null;
  const roiClass = trader.stats.roi >= 0 ? 'text-green-400' : 'text-red-400';
  const roiPrefix = trader.stats.roi >= 0 ? '+' : '';

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl md:rounded-2xl p-4 md:p-8 mb-4 md:mb-8">
          <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
            {/* Avatar and Name - Mobile layout */}
            <div className="flex items-center gap-4 md:block">
              <div className="w-16 h-16 md:w-24 md:h-24 bg-gradient-to-br from-blue-500 to-teal-400 rounded-xl md:rounded-2xl flex items-center justify-center text-2xl md:text-4xl font-bold text-white shrink-0">
                {trader.displayName.charAt(0).toUpperCase()}
              </div>
              {/* Mobile-only name section */}
              <div className="md:hidden flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-white truncate">{trader.displayName}</h1>
                  {trader.verified && (
                    <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-semibold rounded-full shrink-0">
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-sm">@{trader.username}</p>
              </div>
            </div>

            {/* Desktop name and details */}
            <div className="flex-1">
              <div className="hidden md:flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{trader.displayName}</h1>
                {trader.verified && (
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-full">
                    Verified
                  </span>
                )}
              </div>
              <p className="hidden md:block text-slate-400 mb-3">@{trader.username}</p>
              {trader.bio && <p className="text-slate-300 text-sm md:text-base mb-3 md:mb-4">{trader.bio}</p>}
              <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm">
                <ExternalLink href={solscanUrl} className="text-blue-400 hover:text-blue-300 font-mono">
                  {shortenAddress(trader.walletAddress)}
                </ExternalLink>
                {xUrl && (
                  <ExternalLink href={xUrl} className="text-slate-400 hover:text-white">
                    @{trader.twitter}
                  </ExternalLink>
                )}
              </div>
            </div>

            {/* Copy Button - Full width on mobile */}
            <button
              onClick={handleCopyTrades}
              className="w-full md:w-auto px-5 md:px-6 py-2.5 md:py-3 bg-gradient-to-r from-blue-500 to-teal-400 text-white text-sm md:text-base font-semibold rounded-lg md:rounded-xl hover:opacity-90 transition-all mt-2 md:mt-0"
            >
              {connected ? 'Copy Trades' : 'Connect to Follow'}
            </button>
          </div>
        </div>
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4 mb-4 md:mb-8">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg md:rounded-xl p-3 md:p-4 text-center">
            <p className="text-lg md:text-2xl font-bold text-white">{trader.stats.followers}</p>
            <p className="text-slate-400 text-xs md:text-sm">Followers</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg md:rounded-xl p-3 md:p-4 text-center">
            <p className="text-lg md:text-2xl font-bold text-white">{trader.stats.totalTrades}</p>
            <p className="text-slate-400 text-xs md:text-sm">Trades</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg md:rounded-xl p-3 md:p-4 text-center">
            <p className={'text-lg md:text-2xl font-bold ' + roiClass}>
              {roiPrefix}{trader.stats.roi.toFixed(1)}%
            </p>
            <p className="text-slate-400 text-xs md:text-sm">ROI</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg md:rounded-xl p-3 md:p-4 text-center">
            <p className="text-lg md:text-2xl font-bold text-white">{trader.stats.winRate.toFixed(0)}%</p>
            <p className="text-slate-400 text-xs md:text-sm">Win Rate</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg md:rounded-xl p-3 md:p-4 text-center col-span-2 md:col-span-1">
            <p className="text-lg md:text-2xl font-bold text-white">${(trader.stats.totalVolume / 1000).toFixed(1)}K</p>
            <p className="text-slate-400 text-xs md:text-sm">Volume</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl md:rounded-2xl p-4 md:p-8">
          <h2 className="text-lg md:text-xl font-semibold text-white mb-3 md:mb-4">Recent Activity</h2>
          {tradesLoading ? (
            <div className="space-y-2 md:space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-slate-700/50 rounded-lg md:rounded-xl p-3 md:p-4 h-16 md:h-20" />
              ))}
            </div>
          ) : trades.length > 0 ? (
            <div className="space-y-2 md:space-y-3">
              {trades.map((trade) => (
                <TradeCard key={trade.id} trade={trade} />
              ))}
            </div>
          ) : (
            <div className="text-center py-6 md:py-8">
              <p className="text-slate-400 mb-2 text-sm md:text-base">No trades recorded yet</p>
              <p className="text-slate-500 text-xs md:text-sm">
                Trades will appear here once the wallet is monitored
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Copy Trades Modal */}
      {trader && (
        <CopyTradesModal
          trader={trader}
          isOpen={showCopyModal}
          onClose={() => setShowCopyModal(false)}
          onSuccess={handleCopySuccess}
        />
      )}
    </div>
  );
}