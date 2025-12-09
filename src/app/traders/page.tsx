'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TraderProfile } from '@/types/trader';

export default function TradersPage() {
  const [traders, setTraders] = useState<TraderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('followers');

  useEffect(() => {
    fetchTraders();
  }, [sortBy]);

  const fetchTraders = async () => {
    try {
      const res = await fetch('/api/traders?sort=' + sortBy);
      const data = await res.json();
      setTraders(data.traders || []);
    } catch (error) {
      console.error('Failed to fetch traders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchTraders();
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/traders?q=' + encodeURIComponent(searchQuery));
      const data = await res.json();
      setTraders(data.traders || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const shortenAddress = (address: string) => {
    return address.slice(0, 4) + '...' + address.slice(-4);
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Traders</h1>
            <p className="text-slate-400">Find and follow top prediction market traders</p>
          </div>
          <Link
            href="/claim"
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-400 text-white font-semibold rounded-xl hover:opacity-90 transition-all"
          >
            Claim Your Profile
          </Link>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by username or wallet address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Search
            </button>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="followers">Most Followers</option>
            <option value="roi">Highest ROI</option>
            <option value="winRate">Best Win Rate</option>
            <option value="volume">Highest Volume</option>
          </select>
        </div>

        {/* Traders Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-white text-xl">Loading traders...</div>
          </div>
        ) : traders.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-12 text-center">
            <p className="text-slate-400 text-lg mb-2">No traders found</p>
            <p className="text-slate-500 text-sm mb-6">
              {searchQuery ? 'Try a different search term' : 'Be the first to claim your profile!'}
            </p>
            <Link
              href="/claim"
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-400 text-white font-semibold rounded-xl hover:opacity-90 transition-all"
            >
              Claim Your Profile
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {traders.map((trader) => (
              <Link
                key={trader.username}
                href={'/traders/' + trader.username}
                className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 hover:bg-slate-800/70 hover:border-slate-600 transition-all"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-teal-400 rounded-xl flex items-center justify-center text-xl font-bold text-white">
                    {trader.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-white">{trader.displayName}</h3>
                      {trader.verified && (
                        <span className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-sm">@{trader.username}</p>
                  </div>
                </div>
                
                {trader.bio && (
                  <p className="text-slate-400 text-sm mb-4 line-clamp-2">{trader.bio}</p>
                )}
                
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-white font-semibold">{trader.stats.followers}</p>
                    <p className="text-slate-500 text-xs">Followers</p>
                  </div>
                  <div>
                    <p className={'font-semibold ' + (trader.stats.roi >= 0 ? 'text-green-400' : 'text-red-400')}>
                      {trader.stats.roi >= 0 ? '+' : ''}{trader.stats.roi.toFixed(1)}%
                    </p>
                    <p className="text-slate-500 text-xs">ROI</p>
                  </div>
                  <div>
                    <p className="text-white font-semibold">{trader.stats.winRate.toFixed(0)}%</p>
                    <p className="text-slate-500 text-xs">Win Rate</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}