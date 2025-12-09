'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import { ConnectButton } from '@/components/wallet/ConnectButton';

export default function ClaimPage() {
  const { publicKey, connected } = useWallet();
  const router = useRouter();
  
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [twitter, setTwitter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!publicKey) {
      setError('Please connect your wallet first');
      return;
    }

    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/traders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          displayName: displayName.trim() || username.trim(),
          walletAddress: publicKey.toString(),
          bio: bio.trim(),
          twitter: twitter.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to claim profile');
        return;
      }

      // Success - redirect to profile
      router.push('/traders/' + data.trader.username);
    } catch (e) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Claim Your Profile</h1>
          <p className="text-slate-400">
            Create your trader profile and let others follow your trades
          </p>
        </div>

        {!connected ? (
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 text-center">
            <p className="text-slate-400 mb-6">Connect your wallet to claim your profile</p>
            <ConnectButton />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-red-400">{error}</p>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-slate-400 text-sm font-medium mb-2">
                Wallet Address
              </label>
              <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-400 font-mono text-sm">
                {publicKey?.toString()}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-slate-400 text-sm font-medium mb-2">
                Username *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="sharpwhale"
                  maxLength={20}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="text-slate-500 text-xs mt-1">3-20 characters, letters, numbers, and underscores only</p>
            </div>

            <div className="mb-6">
              <label className="block text-slate-400 text-sm font-medium mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Sharp Whale 🐋"
                maxLength={50}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-6">
              <label className="block text-slate-400 text-sm font-medium mb-2">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell others about your trading strategy..."
                maxLength={160}
                rows={3}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <p className="text-slate-500 text-xs mt-1">{bio.length}/160 characters</p>
            </div>

            <div className="mb-8">
              <label className="block text-slate-400 text-sm font-medium mb-2">
                Twitter
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">@</span>
                <input
                  type="text"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value.replace('@', ''))}
                  placeholder="username"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !username.trim()}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-teal-400 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all"
            >
              {loading ? 'Creating Profile...' : 'Claim Profile'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}