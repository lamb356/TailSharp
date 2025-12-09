'use client';

import { useState, useEffect } from 'react';
import { Market, getMarkets, formatPrice, formatVolume } from '@/lib/dflow/api';
import Link from 'next/link';

const CATEGORIES = ['All', 'Crypto', 'Economics', 'Politics', 'Stocks'];

export default function Markets() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchMarkets = async () => {
      setLoading(true);
      try {
        const data = await getMarkets();
        setMarkets(data);
      } catch (error) {
        console.error('Failed to fetch markets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMarkets();
  }, []);

  const filteredMarkets = markets.filter((market) => {
    const matchesCategory = selectedCategory === 'All' || market.category === selectedCategory;
    const matchesSearch = market.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          market.ticker.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Prediction Markets</h1>
          <p className="text-slate-400">Trade on real-world events via tokenized Kalshi markets</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search markets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={
                  selectedCategory === category
                    ? 'px-4 py-2 rounded-lg font-medium bg-blue-500 text-white transition-all'
                    : 'px-4 py-2 rounded-lg font-medium bg-slate-800 text-slate-400 hover:text-white transition-all'
                }
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Markets Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-48 bg-slate-800/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMarkets.map((market) => (
              <Link
                key={market.id}
                href={'/markets/' + market.id}
                className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 hover:border-slate-600 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded">
                        {market.category}
                      </span>
                      <span className="text-slate-500 text-xs font-mono">{market.ticker}</span>
                    </div>
                    <h3 className="text-white font-semibold group-hover:text-blue-400 transition-colors">
                      {market.title}
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-center">
                    <p className="text-green-400 text-2xl font-bold">{formatPrice(market.yesPrice)}</p>
                    <p className="text-green-400/70 text-sm">Yes</p>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-center">
                    <p className="text-red-400 text-2xl font-bold">{formatPrice(market.noPrice)}</p>
                    <p className="text-red-400/70 text-sm">No</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-slate-500">24h Vol: </span>
                    <span className="text-white">{formatVolume(market.volume24h)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Total: </span>
                    <span className="text-white">{formatVolume(market.totalVolume)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Liquidity: </span>
                    <span className="text-white">{formatVolume(market.liquidity)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && filteredMarkets.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <p className="text-lg">No markets found</p>
            <p className="text-sm mt-1">Try a different search or category</p>
          </div>
        )}
      </div>
    </div>
  );
}