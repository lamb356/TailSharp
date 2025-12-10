'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import Link from 'next/link';

interface UserSettings {
  notifications: {
    tradeExecuted: boolean;
    traderFollowed: boolean;
    priceMovement: boolean;
    emailEnabled: boolean;
    email: string;
  };
  copyDefaults: {
    positionSizing: 'percent' | 'fixed';
    defaultAmount: number;
    maxExposure: number;
    dailyLossLimit: number;
  };
  accounts: {
    kalshiConnected: boolean;
    kalshiUsername?: string;
  };
}

interface Profile {
  wallet: string;
  username: string | null;
  activeCopies: number;
}

export default function SettingsPage() {
  const { publicKey, connected } = useWallet();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  useEffect(() => {
    if (!connected || !publicKey) {
      setLoading(false);
      return;
    }

    const fetchSettings = async () => {
      try {
        const res = await fetch(`/api/settings?wallet=${publicKey.toBase58()}`);
        if (!res.ok) throw new Error('Failed to fetch settings');
        const data = await res.json();
        setSettings(data.settings);
        setProfile(data.profile);
      } catch (err) {
        setError('Failed to load settings');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [connected, publicKey]);

  const handleSave = async () => {
    if (!publicKey || !settings) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/settings?wallet=${publicKey.toBase58()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      if (!res.ok) throw new Error('Failed to save settings');
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleStopAllCopies = async () => {
    if (!publicKey) return;

    try {
      const res = await fetch(`/api/settings?wallet=${publicKey.toBase58()}&action=stop-copies`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to stop copies');
      setSuccess('All copy trading stopped!');
      if (profile) {
        setProfile({ ...profile, activeCopies: 0 });
      }
    } catch (err) {
      setError('Failed to stop copies');
    }
  };

  const handleDeleteData = async () => {
    if (!publicKey || deleteConfirm !== 'DELETE') return;

    try {
      const res = await fetch(`/api/settings?wallet=${publicKey.toBase58()}&action=delete-data`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete data');
      setShowDeleteModal(false);
      setDeleteConfirm('');
      setSuccess('All data deleted. Refreshing...');
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      setError('Failed to delete data');
    }
  };

  const updateNotification = (key: keyof UserSettings['notifications'], value: boolean | string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      notifications: { ...settings.notifications, [key]: value },
    });
  };

  const updateCopyDefaults = (key: keyof UserSettings['copyDefaults'], value: string | number) => {
    if (!settings) return;
    setSettings({
      ...settings,
      copyDefaults: { ...settings.copyDefaults, [key]: value },
    });
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-6">Manage your TailSharp settings</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-400 mb-4">Failed to load settings</p>
          <button onClick={() => window.location.reload()} className="text-emerald-400 hover:underline">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Manage your account and preferences</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-red-400">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <p className="text-emerald-400">{success}</p>
          </div>
        )}

        {/* Profile Section */}
        <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Profile</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Wallet Address</p>
                <p className="text-white font-mono">{profile?.wallet ? shortenAddress(profile.wallet) : '-'}</p>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(profile?.wallet || '')}
                className="px-3 py-1 bg-gray-800 text-gray-300 text-sm rounded-lg hover:bg-gray-700 transition-colors"
              >
                Copy
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Username</p>
                <p className="text-white">{profile?.username ? `@${profile.username}` : 'Not claimed'}</p>
              </div>
              {!profile?.username && (
                <Link
                  href="/claim"
                  className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-sm rounded-lg hover:bg-emerald-500/30 transition-colors"
                >
                  Claim Username
                </Link>
              )}
            </div>
            <div>
              <p className="text-gray-400 text-sm">Active Copies</p>
              <p className="text-white">{profile?.activeCopies || 0} traders</p>
            </div>
          </div>
        </section>

        {/* Notification Preferences */}
        <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Notification Preferences</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Trade Executed Alerts</p>
                <p className="text-gray-400 text-sm">Get notified when a copy trade is executed</p>
              </div>
              <button
                onClick={() => updateNotification('tradeExecuted', !settings.notifications.tradeExecuted)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.notifications.tradeExecuted ? 'bg-emerald-500' : 'bg-gray-700'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.notifications.tradeExecuted ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">New Trader Followed</p>
                <p className="text-gray-400 text-sm">Get notified when you start following a trader</p>
              </div>
              <button
                onClick={() => updateNotification('traderFollowed', !settings.notifications.traderFollowed)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.notifications.traderFollowed ? 'bg-emerald-500' : 'bg-gray-700'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.notifications.traderFollowed ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Price Movement Alerts</p>
                <p className="text-gray-400 text-sm">Get notified of significant price changes</p>
              </div>
              <button
                onClick={() => updateNotification('priceMovement', !settings.notifications.priceMovement)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.notifications.priceMovement ? 'bg-emerald-500' : 'bg-gray-700'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.notifications.priceMovement ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
            <div className="border-t border-gray-800 pt-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-white font-medium">Email Notifications</p>
                  <p className="text-gray-400 text-sm">Receive notifications via email</p>
                </div>
                <button
                  onClick={() => updateNotification('emailEnabled', !settings.notifications.emailEnabled)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings.notifications.emailEnabled ? 'bg-emerald-500' : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      settings.notifications.emailEnabled ? 'translate-x-6' : ''
                    }`}
                  />
                </button>
              </div>
              {settings.notifications.emailEnabled && (
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={settings.notifications.email}
                  onChange={(e) => updateNotification('email', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              )}
            </div>
          </div>
        </section>

        {/* Copy Trading Defaults */}
        <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-2">Copy Trading Defaults</h2>
          <p className="text-gray-400 text-sm mb-4">These settings apply when following new traders</p>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Position Sizing</label>
              <div className="flex gap-3">
                <button
                  onClick={() => updateCopyDefaults('positionSizing', 'fixed')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    settings.copyDefaults.positionSizing === 'fixed'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  Fixed Amount
                </button>
                <button
                  onClick={() => updateCopyDefaults('positionSizing', 'percent')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    settings.copyDefaults.positionSizing === 'percent'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  Percentage
                </button>
              </div>
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                Default Amount {settings.copyDefaults.positionSizing === 'percent' ? '(%)' : '($)'}
              </label>
              <input
                type="number"
                min="1"
                value={settings.copyDefaults.defaultAmount}
                onChange={(e) => updateCopyDefaults('defaultAmount', Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">Max Exposure Per Trade ($)</label>
              <input
                type="number"
                min="1"
                value={settings.copyDefaults.maxExposure}
                onChange={(e) => updateCopyDefaults('maxExposure', Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2">Daily Loss Limit ($)</label>
              <input
                type="number"
                min="0"
                value={settings.copyDefaults.dailyLossLimit}
                onChange={(e) => updateCopyDefaults('dailyLossLimit', Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </section>

        {/* Connected Accounts */}
        <section className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Connected Accounts</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-medium">Kalshi</p>
                  <p className={`text-sm ${settings.accounts.kalshiConnected ? 'text-emerald-400' : 'text-gray-400'}`}>
                    {settings.accounts.kalshiConnected ? `Connected as ${settings.accounts.kalshiUsername}` : 'Not connected'}
                  </p>
                </div>
              </div>
              <button className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors">
                {settings.accounts.kalshiConnected ? 'Reconnect' : 'Connect'}
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-medium">Solana Wallet</p>
                  <p className="text-emerald-400 text-sm">Connected</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-sm rounded-lg">Active</span>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-red-500/5 border border-red-500/20 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-red-400 mb-4">Danger Zone</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Stop All Copy Trading</p>
                <p className="text-gray-400 text-sm">Pause all active copy trading immediately</p>
              </div>
              <button
                onClick={handleStopAllCopies}
                className="px-4 py-2 bg-yellow-500/20 text-yellow-400 text-sm font-medium rounded-lg hover:bg-yellow-500/30 transition-colors"
              >
                Stop All Copies
              </button>
            </div>
            <div className="border-t border-red-500/20 pt-4 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Delete My Data</p>
                <p className="text-gray-400 text-sm">Permanently delete all your TailSharp data</p>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 bg-red-500/20 text-red-400 text-sm font-medium rounded-lg hover:bg-red-500/30 transition-colors"
              >
                Delete Data
              </button>
            </div>
          </div>
        </section>

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <Link
            href="/settings/preflight"
            className="px-6 py-3 bg-gray-800 text-white font-medium rounded-xl hover:bg-gray-700 transition-colors"
          >
            Preflight Checks
          </Link>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-2">Delete All Data?</h3>
            <p className="text-gray-400 mb-4">
              This will permanently delete all your settings, copy trading history, and notifications. This action cannot be undone.
            </p>
            <div className="mb-4">
              <label className="block text-gray-400 text-sm mb-2">Type DELETE to confirm</label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirm('');
                }}
                className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteData}
                disabled={deleteConfirm !== 'DELETE'}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
