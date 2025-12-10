// src/app/markets/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Market, getMarket, formatPrice, formatVolume, placeOrder } from '@/lib/dflow/api';
import { useNotifications } from '@/lib/store/useNotifications';
import Link from 'next/link';

export default function MarketDetail() {
  const params = useParams();
  const marketId = params.id as string;

  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSide, setSelectedSide] = useState<'yes' | 'no'>('yes');
  const [quantity, setQuantity] = useState<number>(10);
  const [orderLoading, setOrderLoading] = useState(false);
  const { addNotification } = useNotifications();

  useEffect(() => {
    const fetchMarket = async () => {
      setLoading(true);
      try {
        const data = await getMarket(marketId);
        setMarket(data);
      } catch (error) {
        console.error('Failed to fetch market:', error);
      } finally {
        setLoading(false);
      }
    };

    if (marketId) {
      fetchMarket();
    }
  }, [marketId]);

  const currentPrice = market ? (selectedSide === 'yes' ? market.yesPrice : market.noPrice) : 0;
  const totalCost = quantity * currentPrice;
  const potentialPayout = quantity * 1;
  const potentialProfit = potentialPayout - totalCost;

  const handlePlaceOrder = async () => {
    if (!market) return;

    setOrderLoading(true);
    try {
      const response = await placeOrder({
        marketId: market.id,
        side: selectedSide,
        quantity,
        type: 'market',
      });

      addNotification({
        type: 'info',
        title: '✅ Order Filled',
        message: `Bought ${quantity} ${selectedSide.toUpperCase()} contracts at ${formatPrice(response.avgFillPrice)}`,
      });

      setQuantity(10);
    } catch (error) {
      addNotification({
        type: 'error',
        title: '❌ Order Failed',
        message: 'Failed to place order. Please try again.',
      });
    } finally {
      setOrderLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-800 rounded w-3/4" />
          <div className="h-4 bg-slate-800 rounded w-1/2" />
          <div className="h-64 bg-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Market Not Found</h1>
        <Link href="/markets" className="text-blue-400 hover:text-blue-300">
          ← Back to Markets
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <Link href="/markets" className="text-slate-400 hover:text-white text-sm mb-4 inline-block">
        ← Back to Markets
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded">
            {market.category}
          </span>
          <span className="text-slate-500 text-sm font-mono">{market.ticker}</span>
          <span className={`px-2 py-0.5 text-xs rounded ${
            market.status === 'open' ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'
          }`}>
            {market.status.toUpperCase()}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">{market.title}</h1>
        <p className="text-slate-400">{market.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Current Prices</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedSide('yes')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedSide === 'yes'
                    ? 'border-green-500 bg-green-500/20'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                }`}
              >
                <p className="text-green-400 text-3xl font-bold">{formatPrice(market.yesPrice)}</p>
                <p className="text-green-400/70">Yes</p>
              </button>
              <button
                onClick={() => setSelectedSide('no')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedSide === 'no'
                    ? 'border-red-500 bg-red-500/20'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                }`}
              >
                <p className="text-red-400 text-3xl font-bold">{formatPrice(market.noPrice)}</p>
                <p className="text-red-400/70">No</p>
              </button>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Market Stats</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-slate-500 text-sm">24h Volume</p>
                <p className="text-white text-xl font-semibold">{formatVolume(market.volume24h)}</p>
              </div>
              <div>
                <p className="text-slate-500 text-sm">Total Volume</p>
                <p className="text-white text-xl font-semibold">{formatVolume(market.totalVolume)}</p>
              </div>
              <div>
                <p className="text-slate-500 text-sm">Liquidity</p>
                <p className="text-white text-xl font-semibold">{formatVolume(market.liquidity)}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-2">Resolution</h2>
            <p className="text-slate-400">
              This market resolves on{' '}
              <span className="text-white">
                {new Date(market.expirationDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </p>
          </div>
        </div>

        <div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-white mb-4">Place Order</h2>

            <div className="mb-4">
              <label className="text-slate-400 text-sm block mb-2">Side</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSelectedSide('yes')}
                  className={`py-2 rounded-lg font-medium transition-all ${
                    selectedSide === 'yes'
                      ? 'bg-green-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Yes
                </button>
                <button
                  onClick={() => setSelectedSide('no')}
                  className={`py-2 rounded-lg font-medium transition-all ${
                    selectedSide === 'no'
                      ? 'bg-red-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="text-slate-400 text-sm block mb-2">Contracts</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                min="1"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="bg-slate-900/50 rounded-xl p-4 mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Price per contract</span>
                <span className="text-white">{formatPrice(currentPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Total cost</span>
                <span className="text-white">${totalCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-slate-700 pt-2">
                <span className="text-slate-400">Potential payout</span>
                <span className="text-white">${potentialPayout.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Potential profit</span>
                <span className="text-green-400">+${potentialProfit.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={orderLoading || quantity <= 0}
              className={`w-full py-3 rounded-xl font-semibold transition-all ${
                selectedSide === 'yes'
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-red-500 hover:bg-red-600 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {orderLoading ? 'Placing Order...' : `Buy ${quantity} ${selectedSide.toUpperCase()} @ ${formatPrice(currentPrice)}`}
            </button>

            <p className="text-slate-500 text-xs text-center mt-3">
              Orders execute via DFlow on Solana
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
