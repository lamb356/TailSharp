'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { TraderProfile } from '@/types/trader';

export default function TraderProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [trader, setTrader] = useState<TraderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrader() {
      try {
        const res = await fetch('/api/traders/' + username);
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

  const shortenAddress = (address: string) => {
    return address.slice(0, 4) + '...' + address.slice(-4);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-white text-xl">Loading profile...</div>
      </div>
    );
  }

  if (error || !trader) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto text-center py-20">
          <h1 className="text-4xl font-bold text-white mb-4">Trader Not Found</h1>
          <p className="text-slate-400 mb-8">{error || 'This trader profile does not exist.'}</p>
          <Link
            href="/traders"
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-400 text-white font-semibold rounded-xl hover:opacity-90 transition-all"
          >
            Browse Traders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 mb-8">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-teal-400 rounded-2xl flex items-center justify-center text-4xl font-bold text-white">
              {trader.displayName.charAt(0).toUpperCase()}
            </div>
            
            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{trader.displayName}</h1>
                {trader.verified && (
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-full">
                    Verified
                  </span>
                )}
              </div>
              <p className="text-slate-400 mb-3">@{trader.username}</p>
              
              {trader.bio && (
                <p className="text-slate-300 mb-4">{trader.bio}</p>
              )}
              
              <div className="flex items-center gap-4 text-sm">
                
                  href={'https://solscan.io/account/' + trader.walletAddress}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 font-mono"
                >
                  {shortenAddress(trader.walletAddress)}
                </a>
                {trader.twitter && (
                  
                    href={'https://twitter.com/' + trader.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-white"
                  >
                    @{trader.twitter}
                  </a>
                )}
              </div>
            </div>

            {/* Follow Button */}
            <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-400 text-white font-semibold rounded-xl hover:opacity-90 transition-all">
              Follow
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{trader.stats.followers}</p>
            <p className="text-slate-400 text-sm">Followers</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{trader.stats.totalTrades}</p>
            <p className="text-slate-400 text-sm">Trades</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
            <p className={'text-2xl font-bold ' + (trader.stats.roi >= 0 ? 'text-green-400' : 'text-red-400')}>
              {trader.stats.roi >= 0 ? '+' : ''}{trader.stats.roi.toFixed(1)}%
            </p>
            <p className="text-slate-400 text-sm">ROI</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{trader.stats.winRate.toFixed(0)}%</p>
            <p className="text-slate-400 text-sm">Win Rate</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">${(trader.stats.totalVolume / 1000).toFixed(1)}K</p>
            <p className="text-slate-400 text-sm">Volume</p>
          </div>
        </div>

        {/* Recent Activity Placeholder */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
          <p className="text-slate-400 text-center py-8">
            Trade history coming soon...
          </p>
        </div>
      </div>
    </div>
  );
}