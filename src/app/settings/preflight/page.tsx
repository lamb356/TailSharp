'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Check = {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
};

type PreflightData = {
  summary: {
    pass: number;
    warn: number;
    fail: number;
    readyForLive: boolean;
    currentMode: string;
    kalshiEnv: string;
  };
  checks: Check[];
  instructions: string;
};

export default function PreflightPage() {
  const [data, setData] = useState<PreflightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPreflight() {
      try {
        const res = await fetch('/api/preflight');
        const json = await res.json();
        setData(json);
      } catch (e) {
        setError('Failed to load preflight checks');
      } finally {
        setLoading(false);
      }
    }
    loadPreflight();
  }, []);

  function getStatusIcon(status: string) {
    if (status === 'pass') return <span className="text-green-400">✓</span>;
    if (status === 'warn') return <span className="text-amber-400">⚠</span>;
    return <span className="text-red-400">✗</span>;
  }

  function getStatusBg(status: string) {
    if (status === 'pass') return 'bg-green-500/10 border-green-500/30';
    if (status === 'warn') return 'bg-amber-500/10 border-amber-500/30';
    return 'bg-red-500/10 border-red-500/30';
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-6 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/settings" className="text-slate-400 hover:text-white text-sm">
            ← Back to Settings
          </Link>
        </div>

        <h1 className="text-2xl font-semibold mb-2">Preflight Checks</h1>
        <p className="text-slate-400 text-sm mb-8">System status before enabling live trading</p>

        {loading && <p className="text-slate-400">Running checks...</p>}
        {error && <p className="text-red-400">{error}</p>}

        {data && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-green-400">{data.summary.pass}</p>
                <p className="text-slate-400 text-sm">Passed</p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-amber-400">{data.summary.warn}</p>
                <p className="text-slate-400 text-sm">Warnings</p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-red-400">{data.summary.fail}</p>
                <p className="text-slate-400 text-sm">Failed</p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center">
                <p className={`text-xl font-bold ${data.summary.currentMode === 'SIMULATION' ? 'text-amber-400' : 'text-green-400'}`}>
                  {data.summary.currentMode}
                </p>
                <p className="text-slate-400 text-sm">Mode</p>
              </div>
            </div>

            <div className={`p-4 rounded-lg border mb-8 ${data.summary.readyForLive ? 'bg-green-500/10 border-green-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
              <p className={data.summary.readyForLive ? 'text-green-400' : 'text-amber-400'}>
                {data.instructions}
              </p>
            </div>

            <div className="space-y-3">
              {data.checks.map((check, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between p-4 rounded-lg border ${getStatusBg(check.status)}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{getStatusIcon(check.status)}</span>
                    <span className="font-medium">{check.name}</span>
                  </div>
                  <span className="text-sm text-slate-400">{check.message}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
              <h3 className="font-medium mb-2">To enable live trading:</h3>
              <ol className="text-sm text-slate-400 space-y-1 list-decimal list-inside">
                <li>Get production API keys from Kalshi</li>
                <li>Set <code className="text-amber-400">KALSHI_USE_DEMO=false</code> in .env.local</li>
                <li>Set <code className="text-amber-400">NEXT_PUBLIC_TAILSHARP_SIMULATION=false</code> in .env.local</li>
                <li>Fund your Kalshi account</li>
                <li>Restart the dev server</li>
              </ol>
            </div>
          </>
        )}
      </div>
    </main>
  );
}