// src/components/traders/WalletDisplay.tsx
'use client';

import { FC, useState } from 'react';
import { WalletData } from '@/lib/solana/tracker';
import { formatSol } from '@/lib/solana/connection';
import { getTokenInfo, formatTokenAmount } from '@/lib/solana/tokens';
import { TransactionFeed } from './TransactionFeed';

interface WalletDisplayProps {
  wallet: WalletData;
  onFollow: (address: string) => void;
  onRemove: (address: string) => void;
  isFollowing: boolean;
}

export const WalletDisplay: FC<WalletDisplayProps> = ({
  wallet,
  onFollow,
  onRemove,
  isFollowing,
}) => {
  const [activeTab, setActiveTab] = useState<'tokens' | 'transactions'>('tokens');
  const shortAddress = `${wallet.address.slice(0, 4)}...${wallet.address.slice(-4)}`;

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {wallet.address.slice(0, 2)}
          </div>
          <div>
            <p className="text-white font-semibold">{shortAddress}</p>
            <p className="text-slate-500 text-sm">
              Updated {wallet.lastUpdated.toLocaleTimeString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onFollow(wallet.address)}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              isFollowing
                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                : 'bg-gradient-to-r from-blue-500 to-teal-400 text-white hover:opacity-90'
            }`}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
          <button
            onClick={() => onRemove(wallet.address)}
            className="p-2 text-slate-500 hover:text-red-400 transition-colors"
            title="Remove"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-slate-900/50 rounded-xl p-4">
          <p className="text-slate-500 text-sm">SOL Balance</p>
          <p className="text-xl font-bold text-white">{formatSol(wallet.solBalance)}</p>
        </div>
        <div className="bg-slate-900/50 rounded-xl p-4">
          <p className="text-slate-500 text-sm">Token Positions</p>
          <p className="text-xl font-bold text-white">{wallet.tokens.length}</p>
        </div>
        <div className="bg-slate-900/50 rounded-xl p-4">
          <p className="text-slate-500 text-sm">Known Tokens</p>
          <p className="text-xl font-bold text-green-400">
            {wallet.tokens.filter((t) => getTokenInfo(t.mint).isKnown).length}
          </p>
        </div>
        <div className="bg-slate-900/50 rounded-xl p-4">
          <p className="text-slate-500 text-sm">Unknown</p>
          <p className="text-xl font-bold text-slate-400">
            {wallet.tokens.filter((t) => !getTokenInfo(t.mint).isKnown).length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('tokens')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'tokens'
              ? 'border-blue-500 text-white'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Tokens ({wallet.tokens.length})
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'transactions'
              ? 'border-blue-500 text-white'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Transactions
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'tokens' && (
        <>
          {wallet.tokens.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {wallet.tokens.map((token, index) => {
                const info = getTokenInfo(token.mint);
                return (
                  <div
                    key={`${token.mint}-${index}`}
                    className="flex items-center justify-between bg-slate-900/50 rounded-lg p-3 hover:bg-slate-900/70 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                          info.isKnown
                            ? 'bg-gradient-to-r from-blue-500 to-teal-400 text-white'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {info.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-white font-medium">{info.symbol}</p>
                        <p className="text-slate-500 text-xs">
                          {info.isKnown ? info.name : `${token.mint.slice(0, 12)}...`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">
                        {formatTokenAmount(token.uiAmount, token.decimals)}
                      </p>
                      {info.isKnown && (
                        <p className="text-slate-500 text-xs">{info.symbol}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4 text-slate-500">
              No token positions found
            </div>
          )}
        </>
      )}

      {activeTab === 'transactions' && (
        <TransactionFeed walletAddress={wallet.address} limit={5} />
      )}

      {/* Full Address */}
      <div className="mt-4 pt-4 border-t border-slate-700 flex items-center justify-between">
        <p className="text-slate-500 text-xs font-mono truncate max-w-[80%]">{wallet.address}</p>
        <a
          href={`https://solscan.io/account/${wallet.address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 text-xs"
        >
          Solscan ↗
        </a>
      </div>
    </div>
  );
};
