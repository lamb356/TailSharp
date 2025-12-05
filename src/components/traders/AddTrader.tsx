// src/components/traders/AddTrader.tsx
'use client';

import { FC, useState } from 'react';
import { isValidSolanaAddress, getWalletData, WalletData } from '@/lib/solana/tracker';

interface AddTraderProps {
  onAddTrader: (walletData: WalletData) => void;
}

export const AddTrader: FC<AddTraderProps> = ({ onAddTrader }) => {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!address.trim()) {
      setError('Please enter a wallet address');
      return;
    }

    if (!isValidSolanaAddress(address.trim())) {
      setError('Invalid Solana wallet address');
      return;
    }

    setLoading(true);

    try {
      const walletData = await getWalletData(address.trim());
      onAddTrader(walletData);
      setAddress('');
    } catch (err) {
      console.error('Failed to fetch wallet:', err);
      setError('Failed to fetch wallet data. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter Solana wallet address to track..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-400 text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Loading...
            </span>
          ) : (
            'Track Wallet'
          )}
        </button>
      </div>
    </form>
  );
};
