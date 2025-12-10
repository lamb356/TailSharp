'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { ConnectButton } from '@/components/wallet/ConnectButton';

interface Referral {
  wallet: string;
  signedUpAt: number;
  firstTradeAt: number | null;
  tenTradesAt: number | null;
  earned: number;
}

interface ReferralData {
  hasReferralCode: boolean;
  code: string | null;
  balance: number;
  totalEarned: number;
  referrals: Referral[];
  referralCount: number;
  activeReferrals: number;
  payoutThreshold: number;
  canWithdraw: boolean;
  rewards: {
    firstTrade: number;
    tenTrades: number;
  };
}

export const dynamic = 'force-dynamic';

const DEV_MODE = true;

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ReferralsPage() {
  const { connected, publicKey } = useWallet();
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const isAuthenticated = DEV_MODE || connected;
  const wallet = publicKey?.toBase58() || (DEV_MODE ? 'DEV_WALLET_123' : null);

  useEffect(() => {
    async function fetchData() {
      if (!wallet) return;

      try {
        const res = await fetch(`/api/referrals?wallet=${wallet}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error('Failed to fetch referral data:', error);
      } finally {
        setLoading(false);
      }
    }

    if (isAuthenticated) {
      fetchData();
    }
  }, [wallet, isAuthenticated]);

  async function generateCode() {
    if (!wallet) return;
    setGenerating(true);

    try {
      const res = await fetch(`/api/referrals?wallet=${wallet}`, {
        method: 'POST',
      });

      if (res.ok) {
        const json = await res.json();
        setData(prev => prev ? { ...prev, hasReferralCode: true, code: json.code } : null);
        // Refresh data
        const refresh = await fetch(`/api/referrals?wallet=${wallet}`);
        if (refresh.ok) {
          setData(await refresh.json());
        }
      }
    } catch (error) {
      console.error('Failed to generate code:', error);
    } finally {
      setGenerating(false);
    }
  }

  async function copyReferralLink() {
    if (!data?.code) return;

    const link = `https://tailsharp.vercel.app?ref=${data.code}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function shareTwitter() {
    if (!data?.code) return;

    const link = `https://tailsharp.vercel.app?ref=${data.code}`;
    const text = `I'm using TailSharp to copy trade top prediction market traders. Join me and we both earn rewards! 🎯`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`;
    window.open(url, '_blank');
  }

  async function shareTelegram() {
    if (!data?.code) return;

    const link = `https://tailsharp.vercel.app?ref=${data.code}`;
    const text = `I'm using TailSharp to copy trade top prediction market traders. Join me and we both earn rewards!`;
    const url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }

  async function requestPayout() {
    if (!wallet || !data?.canWithdraw) return;
    setRequesting(true);

    try {
      const res = await fetch(`/api/referrals?wallet=${wallet}&action=request-payout`, {
        method: 'PUT',
      });

      if (res.ok) {
        // Refresh data
        const refresh = await fetch(`/api/referrals?wallet=${wallet}`);
        if (refresh.ok) {
          setData(await refresh.json());
        }
        alert('Payout requested! We will process it within 3-5 business days.');
      }
    } catch (error) {
      console.error('Failed to request payout:', error);
    } finally {
      setRequesting(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-20 md:py-32 px-4 md:px-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-4 text-center">
          Connect Your Wallet
        </h1>
        <p className="text-slate-400 mb-8 text-center">
          Connect your wallet to access referrals
        </p>
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-6 shadow-lg shadow-green-500/25">
            <span className="text-4xl">💸</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Earn Cash for Inviting Friends
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Share TailSharp with friends and earn real money when they start trading.
            No limits on how much you can earn.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : !data?.hasReferralCode ? (
          /* No referral code yet */
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 text-center">
            <h2 className="text-xl font-semibold text-white mb-3">
              Get Your Referral Link
            </h2>
            <p className="text-slate-400 mb-6">
              Generate your unique referral code to start earning
            </p>
            <button
              onClick={generateCode}
              disabled={generating}
              className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-500 hover:to-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? 'Generating...' : 'Generate Referral Code'}
            </button>
          </div>
        ) : (
          /* Has referral code */
          <>
            {/* Balance & Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl border border-green-500/30 p-6">
                <p className="text-green-400 text-sm font-medium mb-1">Current Balance</p>
                <p className="text-3xl font-bold text-white">
                  ${data.balance.toFixed(2)}
                </p>
                {data.canWithdraw ? (
                  <button
                    onClick={requestPayout}
                    disabled={requesting}
                    className="mt-3 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-500 transition-colors disabled:opacity-50"
                  >
                    {requesting ? 'Requesting...' : 'Withdraw'}
                  </button>
                ) : (
                  <p className="text-green-400/70 text-xs mt-2">
                    ${(data.payoutThreshold - data.balance).toFixed(2)} more to withdraw
                  </p>
                )}
              </div>

              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
                <p className="text-slate-400 text-sm font-medium mb-1">Total Earned</p>
                <p className="text-3xl font-bold text-white">
                  ${data.totalEarned.toFixed(2)}
                </p>
                <p className="text-slate-500 text-xs mt-2">
                  Lifetime earnings
                </p>
              </div>

              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
                <p className="text-slate-400 text-sm font-medium mb-1">Referrals</p>
                <p className="text-3xl font-bold text-white">
                  {data.referralCount}
                </p>
                <p className="text-slate-500 text-xs mt-2">
                  {data.activeReferrals} active traders
                </p>
              </div>
            </div>

            {/* Progress to payout */}
            {!data.canWithdraw && (
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 mb-8">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-slate-400">Progress to payout</span>
                  <span className="text-sm text-white font-medium">
                    ${data.balance.toFixed(2)} / ${data.payoutThreshold}
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((data.balance / data.payoutThreshold) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-slate-500 text-xs mt-2">
                  Refer {Math.ceil((data.payoutThreshold - data.balance) / data.rewards.firstTrade)} more friends who trade to unlock payout
                </p>
              </div>
            )}

            {/* Referral Link */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">Your Referral Link</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 px-4 py-3 bg-slate-800 rounded-xl border border-slate-700">
                  <code className="text-blue-400 text-sm break-all">
                    https://tailsharp.vercel.app?ref={data.code}
                  </code>
                </div>
                <button
                  onClick={copyReferralLink}
                  className={`px-6 py-3 font-medium rounded-xl transition-all ${
                    copied
                      ? 'bg-green-600 text-white'
                      : 'bg-blue-600 text-white hover:bg-blue-500'
                  }`}
                >
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>

              {/* Share buttons */}
              <div className="flex flex-wrap gap-3 mt-4">
                <button
                  onClick={shareTwitter}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  Share on X
                </button>
                <button
                  onClick={shareTelegram}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                  Share on Telegram
                </button>
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 mb-8">
              <h3 className="text-lg font-semibold text-white mb-6">How It Works</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">1️⃣</span>
                  </div>
                  <h4 className="font-medium text-white mb-1">Friend Signs Up</h4>
                  <p className="text-slate-400 text-sm">
                    They use your referral link to create an account
                  </p>
                  <p className="text-slate-500 text-xs mt-2">You earn: $0</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">2️⃣</span>
                  </div>
                  <h4 className="font-medium text-white mb-1">First Trade</h4>
                  <p className="text-slate-400 text-sm">
                    They make their first copy trade
                  </p>
                  <p className="text-green-400 text-sm font-semibold mt-2">
                    You earn: ${data.rewards.firstTrade}
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">3️⃣</span>
                  </div>
                  <h4 className="font-medium text-white mb-1">10+ Trades Bonus</h4>
                  <p className="text-slate-400 text-sm">
                    They complete 10 trades total
                  </p>
                  <p className="text-green-400 text-sm font-semibold mt-2">
                    Bonus: +${data.rewards.tenTrades}
                  </p>
                </div>
              </div>
              <div className="mt-6 p-4 bg-slate-800/50 rounded-xl">
                <p className="text-center text-slate-300 text-sm">
                  <span className="text-green-400 font-semibold">
                    = ${data.rewards.firstTrade + data.rewards.tenTrades} per active referral
                  </span>
                  {' '}• Minimum ${data.payoutThreshold} to withdraw
                </p>
              </div>
            </div>

            {/* Referrals List */}
            {data.referrals.length > 0 && (
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Your Referrals</h3>
                <div className="space-y-3">
                  {data.referrals.map((referral, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                          <span className="text-lg">👤</span>
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {referral.wallet.slice(0, 4)}...{referral.wallet.slice(-4)}
                          </p>
                          <p className="text-slate-500 text-xs">
                            Joined {formatTimeAgo(referral.signedUpAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex gap-2">
                          {referral.firstTradeAt ? (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                              First Trade ✓
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-slate-700 text-slate-400 text-xs rounded">
                              No trades yet
                            </span>
                          )}
                          {referral.tenTradesAt && (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                              10+ Trades ✓
                            </span>
                          )}
                        </div>
                        <span className="text-green-400 font-semibold">
                          +${referral.earned.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* FAQ Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
              <h4 className="font-medium text-white mb-2">When do I get paid?</h4>
              <p className="text-slate-400 text-sm">
                Once you reach ${data?.payoutThreshold || 25} in earnings, you can request a payout.
                We process payouts via PayPal, Venmo, or crypto within 3-5 business days.
              </p>
            </div>
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
              <h4 className="font-medium text-white mb-2">Is there a limit to how much I can earn?</h4>
              <p className="text-slate-400 text-sm">
                No limits! The more friends you refer who actively trade, the more you earn.
                Top referrers have earned hundreds of dollars.
              </p>
            </div>
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
              <h4 className="font-medium text-white mb-2">What counts as a "trade"?</h4>
              <p className="text-slate-400 text-sm">
                Any copy trade executed through TailSharp counts. This includes both simulated
                and live trades.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
