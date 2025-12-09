// src/app/page.tsx
import { Leaderboard } from '@/components/traders/Leaderboard';
import Link from 'next/link';

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
          Copy the{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-teal-400">
            sharps
          </span>
          .
          <br />
          Trade the future.
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mb-10">
          Auto-mirror top prediction market traders on tokenized Kalshi markets via Solana.
          One click. Real-time. On-chain.
        </p>
        <div className="flex gap-4">
          <Link
            href="/markets"
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-teal-400 text-white font-semibold rounded-xl hover:opacity-90 transition-all"
          >
            View Markets
          </Link>
          <Link
            href="/explore"
            className="px-8 py-4 bg-slate-800 text-white font-semibold rounded-xl hover:bg-slate-700 transition-all"
          >
            Track Wallets
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 px-6 max-w-5xl mx-auto mb-12">
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 text-center">
          <p className="text-3xl font-bold text-white">$10B+</p>
          <p className="text-slate-400 mt-1">Monthly Volume</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 text-center">
          <p className="text-3xl font-bold text-white">100+</p>
          <p className="text-slate-400 mt-1">Markets Live</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 text-center">
          <p className="text-3xl font-bold text-white">24/7</p>
          <p className="text-slate-400 mt-1">Auto-Copy</p>
        </div>
      </section>

      {/* Leaderboard */}
      <Leaderboard />

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-20 py-8 px-6 text-center text-slate-500 text-sm">
        <p>Built with Kalshi Builder Codes on Solana</p>
      </footer>
    </main>
  );
}