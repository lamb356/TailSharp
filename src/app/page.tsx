// src/app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { TraderProfile } from '@/types/trader';

// Icons as inline SVGs for simplicity
const SearchIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const SlidersIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
  </svg>
);

const BoltIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const WebhookIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.288 15.038a5.25 5.25 0 01-2.789-6.18 5.25 5.25 0 016.18-2.789m0 0a5.25 5.25 0 016.181 2.789 5.25 5.25 0 01-2.789 6.18m-3.392-2.97a1.875 1.875 0 112.652 2.652L12 18.75m0 0l-3.18 3.18a1.875 1.875 0 01-2.652-2.652L9.348 16.1m2.652 2.652l3.18-3.18a1.875 1.875 0 00-2.652-2.652L9.348 16.1" />
  </svg>
);

const MatchIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);

const BellIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
  </svg>
);

const WalletIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
  </svg>
);

export default function Home() {
  const [topTraders, setTopTraders] = useState<TraderProfile[]>([]);
  const [loadingTraders, setLoadingTraders] = useState(true);

  // Waitlist state
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [waitlistError, setWaitlistError] = useState('');
  const [signupCount, setSignupCount] = useState(500);

  useEffect(() => {
    async function fetchTopTraders() {
      try {
        const res = await fetch('/api/traders?limit=3&sortBy=roi&sortOrder=desc');
        if (res.ok) {
          const data = await res.json();
          setTopTraders(data.traders || []);
        }
      } catch (error) {
        console.error('Failed to fetch top traders:', error);
      } finally {
        setLoadingTraders(false);
      }
    }
    fetchTopTraders();
  }, []);

  // Fetch waitlist count
  useEffect(() => {
    async function fetchWaitlistCount() {
      try {
        const res = await fetch('/api/waitlist');
        if (res.ok) {
          const data = await res.json();
          setSignupCount(data.displayCount || 500);
        }
      } catch (error) {
        console.error('Failed to fetch waitlist count:', error);
      }
    }
    fetchWaitlistCount();
  }, []);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWaitlistError('');
    setWaitlistLoading(true);

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: waitlistEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        setWaitlistError(data.error || 'Something went wrong');
        return;
      }

      setWaitlistSuccess(true);
      if (data.count) {
        setSignupCount(data.count);
      }
    } catch (error) {
      setWaitlistError('Failed to join waitlist. Please try again.');
    } finally {
      setWaitlistLoading(false);
    }
  };

  const scrollToHowItWorks = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 py-20 text-center">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '50px 50px'
            }}
          />
          {/* Animated gradient orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[128px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-500/10 to-teal-500/10 rounded-full blur-[100px]" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-full mb-8 backdrop-blur-sm">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-slate-300 text-sm">Now live on Solana</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Copy{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
              Elite
            </span>{' '}
            Prediction
            <br />
            Market Traders
          </h1>

          <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Automatically mirror winning strategies from top Solana traders directly to Kalshi.
            One click. Real-time. On-chain.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/leaderboard"
              className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-teal-400 text-white font-semibold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02]"
            >
              Browse Top Traders
              <span className="inline-block ml-2 transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <button
              onClick={scrollToHowItWorks}
              className="px-8 py-4 bg-slate-800/80 border border-slate-700 text-white font-semibold rounded-xl hover:bg-slate-700/80 transition-all backdrop-blur-sm"
            >
              How It Works
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-slate-600 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-slate-500 rounded-full" />
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative py-8 border-y border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4">
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
                500+
              </p>
              <p className="text-slate-400 mt-2 text-lg">Traders Tracked</p>
            </div>
            <div className="text-center border-y md:border-y-0 md:border-x border-slate-800 py-8 md:py-0">
              <p className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
                $2.5M+
              </p>
              <p className="text-slate-400 mt-2 text-lg">Volume Tracked</p>
            </div>
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
                85%
              </p>
              <p className="text-slate-400 mt-2 text-lg">Avg Win Rate (Top 10)</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Start copying winning traders in three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {/* Step 1 */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-teal-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 hover:border-slate-600 transition-colors h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-teal-500/20 rounded-xl flex items-center justify-center text-blue-400 mb-6">
                  <SearchIcon />
                </div>
                <div className="text-sm font-semibold text-blue-400 mb-2">Step 1</div>
                <h3 className="text-2xl font-bold text-white mb-3">Find Traders</h3>
                <p className="text-slate-400 leading-relaxed">
                  Browse our leaderboard of verified traders. See real performance metrics, win rates, ROI, and trading history—all on-chain and transparent.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-teal-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 hover:border-slate-600 transition-colors h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-teal-500/20 rounded-xl flex items-center justify-center text-teal-400 mb-6">
                  <SlidersIcon />
                </div>
                <div className="text-sm font-semibold text-teal-400 mb-2">Step 2</div>
                <h3 className="text-2xl font-bold text-white mb-3">Set Your Rules</h3>
                <p className="text-slate-400 leading-relaxed">
                  Configure position sizing, set risk limits, and filter by market categories. You stay in control while the system handles execution.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-teal-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 hover:border-slate-600 transition-colors h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-teal-500/20 rounded-xl flex items-center justify-center text-green-400 mb-6">
                  <BoltIcon />
                </div>
                <div className="text-sm font-semibold text-green-400 mb-2">Step 3</div>
                <h3 className="text-2xl font-bold text-white mb-3">Auto-Copy</h3>
                <p className="text-slate-400 leading-relaxed">
                  Trades execute automatically when your chosen traders make moves. Real-time webhooks ensure you never miss a winning opportunity.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Top Traders Preview */}
      <section className="py-24 px-6 bg-gradient-to-b from-slate-900 to-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Top Performing Traders
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              See who&apos;s leading the leaderboard right now
            </p>
          </div>

          {loadingTraders ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 animate-pulse">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-slate-700 rounded-full" />
                    <div className="flex-1">
                      <div className="h-5 bg-slate-700 rounded w-24 mb-2" />
                      <div className="h-4 bg-slate-700 rounded w-16" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-16 bg-slate-700 rounded-lg" />
                    <div className="h-16 bg-slate-700 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : topTraders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {topTraders.map((trader, index) => (
                <Link
                  key={trader.username}
                  href={`/traders/${trader.username}`}
                  className="group relative bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600 transition-all hover:scale-[1.02]"
                >
                  {/* Rank badge */}
                  <div className={`absolute -top-3 -right-3 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                    index === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500' :
                    index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400' :
                    'bg-gradient-to-br from-orange-400 to-amber-600'
                  }`}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </div>

                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-teal-400 rounded-full flex items-center justify-center text-xl font-bold text-white">
                      {trader.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors flex items-center gap-2">
                        {trader.displayName}
                        {trader.verified && (
                          <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">✓</span>
                        )}
                      </h3>
                      <p className="text-slate-500 text-sm">@{trader.username}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <p className="text-slate-500 text-xs mb-1">ROI</p>
                      <p className={`text-xl font-bold ${trader.stats.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {trader.stats.roi >= 0 ? '+' : ''}{trader.stats.roi.toFixed(1)}%
                      </p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <p className="text-slate-500 text-xs mb-1">Win Rate</p>
                      <p className="text-xl font-bold text-white">{trader.stats.winRate.toFixed(0)}%</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <p className="text-slate-500 text-xs mb-1">Trades</p>
                      <p className="text-xl font-bold text-white">{trader.stats.totalTrades}</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <p className="text-slate-500 text-xs mb-1">Followers</p>
                      <p className="text-xl font-bold text-white">{trader.stats.followers}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-800/30 rounded-2xl border border-slate-700/50">
              <p className="text-slate-400">No traders found. Check back soon!</p>
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              href="/leaderboard"
              className="inline-flex items-center gap-2 px-8 py-4 bg-slate-800/80 border border-slate-700 text-white font-semibold rounded-xl hover:bg-slate-700/80 transition-all"
            >
              View Full Leaderboard
              <span className="text-slate-400">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Built for Serious Traders
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Powerful features designed to maximize your edge
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 hover:border-slate-600 transition-colors">
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400 mb-4">
                <WebhookIcon />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Real-Time Webhooks</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Helius-powered webhooks detect trades instantly. No delays, no missed opportunities.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 hover:border-slate-600 transition-colors">
              <div className="w-12 h-12 bg-teal-500/10 rounded-lg flex items-center justify-center text-teal-400 mb-4">
                <MatchIcon />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Semantic Market Matching</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                AI-powered matching finds equivalent Kalshi markets for Solana trades automatically.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 hover:border-slate-600 transition-colors">
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center text-green-400 mb-4">
                <ShieldIcon />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Risk Controls</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Set max position sizes, stop losses, and daily limits. Your capital, your rules.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 hover:border-slate-600 transition-colors">
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-400 mb-4">
                <ChartIcon />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Verified Performance</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                All trader stats are verified on-chain. No fake numbers, no inflated win rates.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 hover:border-slate-600 transition-colors">
              <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-400 mb-4">
                <BellIcon />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Instant Notifications</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Get notified when traders you follow make moves. Stay informed, stay ahead.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 hover:border-slate-600 transition-colors">
              <div className="w-12 h-12 bg-pink-500/10 rounded-lg flex items-center justify-center text-pink-400 mb-4">
                <WalletIcon />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Non-Custodial</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Your wallet, your funds. We never hold your assets. Connect and trade securely.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-teal-500/20 rounded-3xl blur-3xl" />
            <div className="relative bg-slate-800/50 border border-slate-700/50 rounded-3xl p-12 md:p-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to Trade Smarter?
              </h2>
              <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
                Join hundreds of traders already copying the best. Start with one click.
              </p>
              <Link
                href="/leaderboard"
                className="inline-flex items-center gap-2 px-10 py-5 bg-gradient-to-r from-blue-500 to-teal-400 text-white text-lg font-semibold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02]"
              >
                Get Started Now
                <span className="text-xl">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Waitlist Section */}
      <section className="py-20 px-6 relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-teal-600/10" />
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-500/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-teal-500/20 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/80 border border-slate-700 rounded-full mb-6">
            <span className="text-yellow-400">✨</span>
            <span className="text-slate-300 text-sm font-medium">
              {signupCount.toLocaleString()}+ traders on the waitlist
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Get Early Access
          </h2>
          <p className="text-lg text-slate-400 mb-8 max-w-lg mx-auto">
            Join {signupCount.toLocaleString()}+ traders waiting for launch. Be first to copy the best.
          </p>

          {waitlistSuccess ? (
            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-8">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">You&apos;re on the list!</h3>
              <p className="text-slate-400">We&apos;ll be in touch soon with exclusive early access.</p>
            </div>
          ) : (
            <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <div className="flex-1 relative">
                <input
                  type="email"
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full px-5 py-4 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={waitlistLoading}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-teal-400 text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 whitespace-nowrap"
              >
                {waitlistLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Joining...
                  </span>
                ) : (
                  'Join Waitlist'
                )}
              </button>
            </form>
          )}

          {waitlistError && (
            <p className="mt-4 text-red-400 text-sm">{waitlistError}</p>
          )}

          <p className="mt-6 text-slate-500 text-sm">
            No spam, ever. Unsubscribe anytime.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Image src="/logo.jpg" alt="TailSharp" width={32} height={32} className="rounded-lg" />
            <span className="text-white font-semibold">TailSharp</span>
          </div>
          <p className="text-slate-500 text-sm">
            Built with Kalshi Builder Codes on Solana
          </p>
          <div className="flex items-center gap-6">
            <Link href="/leaderboard" className="text-slate-400 hover:text-white transition-colors text-sm">
              Leaderboard
            </Link>
            <Link href="/how-it-works" className="text-slate-400 hover:text-white transition-colors text-sm">
              How It Works
            </Link>
            <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors text-sm">
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
