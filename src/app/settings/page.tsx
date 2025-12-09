'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type CopySetting = {
  traderId: string;
  isActive: boolean;
  allocationUsd: number;
  maxPositionPercent: number;
};

type ValidationErrors = {
  [traderId: string]: {
    allocationUsd?: string;
    maxPositionPercent?: string;
  };
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<CopySetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/copy-settings');
        const data = await res.json();
        setSettings(data.settings || []);
      } catch (e) {
        setError('Failed to load settings');
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const validateField = (
    field: 'allocationUsd' | 'maxPositionPercent',
    value: number
  ): string | undefined => {
    if (field === 'allocationUsd') {
      if (isNaN(value)) return 'Invalid number';
      if (value < 0) return 'Must be ≥ 0';
    }

    if (field === 'maxPositionPercent') {
      if (isNaN(value)) return 'Invalid number';
      if (value < 0) return 'Must be ≥ 0';
      if (value > 100) return 'Must be ≤ 100';
    }

    return undefined;
  };

  const validateAllSettings = (): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;

    settings.forEach((s) => {
      const allocError = validateField('allocationUsd', s.allocationUsd);
      const maxPosError = validateField('maxPositionPercent', s.maxPositionPercent);

      if (allocError || maxPosError) {
        isValid = false;
        errors[s.traderId] = {
          allocationUsd: allocError,
          maxPositionPercent: maxPosError,
        };
      }
    });

    setValidationErrors(errors);
    return isValid;
  };

  const updateField = (index: number, field: keyof CopySetting, value: any) => {
    const setting = settings[index];
    const numValue = Number(value);

    setSettings((prev) =>
      prev.map((s, i) =>
        i === index
          ? {
              ...s,
              [field]:
                field === 'allocationUsd' || field === 'maxPositionPercent'
                  ? numValue
                  : field === 'isActive'
                  ? Boolean(value)
                  : value,
            }
          : s
      )
    );

    if (field === 'allocationUsd' || field === 'maxPositionPercent') {
      const validationError = validateField(field, numValue);

      setValidationErrors((prev) => ({
        ...prev,
        [setting.traderId]: {
          ...prev[setting.traderId],
          [field]: validationError,
        },
      }));
    }
  };

  const handleSave = async () => {
    if (!validateAllSettings()) {
      setError('Please fix validation errors before saving');
      setSuccess(null);
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/copy-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        throw new Error('Failed to save settings');
      }
      setSuccess('Settings saved successfully!');
    } catch (e) {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const hasErrors = Object.keys(validationErrors).some(
    (traderId) =>
      validationErrors[traderId].allocationUsd ||
      validationErrors[traderId].maxPositionPercent
  );

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-white text-xl">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Copy Settings</h1>
          <p className="text-slate-400">Configure auto-copy settings for each tracked trader</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
            <p className="text-green-400">{success}</p>
          </div>
        )}

        {settings.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 text-center">
            <p className="text-slate-400 text-lg">No traders configured</p>
            <p className="text-slate-500 text-sm mt-2">
              Follow traders from the dashboard to configure copy settings
            </p>
          </div>
        ) : (
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400">
                    Trader Address
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400">
                    Active
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400">
                    Allocation (USD)
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-400">
                    Max Position (%)
                  </th>
                </tr>
              </thead>
              <tbody>
                {settings.map((s, i) => (
                  <tr
                    key={s.traderId}
                    className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-white">
                        {shortenAddress(s.traderId)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={s.isActive}
                          onChange={(e) =>
                            updateField(i, 'isActive', e.target.checked)
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-teal-400"></div>
                      </label>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className={`w-28 bg-slate-900 border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 transition-colors ${
                            validationErrors[s.traderId]?.allocationUsd
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-slate-700 focus:ring-blue-500 focus:border-transparent'
                          }`}
                          value={s.allocationUsd}
                          onChange={(e) =>
                            updateField(i, 'allocationUsd', e.target.value)
                          }
                        />
                        {validationErrors[s.traderId]?.allocationUsd && (
                          <span className="text-xs text-red-400 mt-1">
                            {validationErrors[s.traderId].allocationUsd}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          className={`w-24 bg-slate-900 border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 transition-colors ${
                            validationErrors[s.traderId]?.maxPositionPercent
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-slate-700 focus:ring-blue-500 focus:border-transparent'
                          }`}
                          value={s.maxPositionPercent}
                          onChange={(e) =>
                            updateField(i, 'maxPositionPercent', e.target.value)
                          }
                        />
                        {validationErrors[s.traderId]?.maxPositionPercent && (
                          <span className="text-xs text-red-400 mt-1">
                            {validationErrors[s.traderId].maxPositionPercent}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving || hasErrors}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-400 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>

          <Link
            href="/settings/preflight"
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-colors border border-slate-700"
          >
            Preflight Checks
          </Link>
        </div>
      </div>
    </div>
  );
}