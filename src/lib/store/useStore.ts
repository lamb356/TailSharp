// src/lib/store/useStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Trader, CopySettings } from '@/types';

interface AppState {
  // Tracked traders (the "sharps" we're watching)
  trackedTraders: Trader[];
  addTrader: (trader: Trader) => void;
  removeTrader: (address: string) => void;
  updateTrader: (address: string, data: Partial<Trader>) => void;

  // User's copy settings
  copySettings: CopySettings[];
  addCopySettings: (settings: CopySettings) => Promise<void>;
  removeCopySettings: (traderId: string) => void;
  updateCopySettings: (traderId: string, data: Partial<CopySettings>) => void;

  // Webhook IDs (to track registered webhooks)
  webhookIds: Record<string, string>;

  // UI State
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Traders
      trackedTraders: [],
      addTrader: (trader) =>
        set((state) => ({
          trackedTraders: [...state.trackedTraders, trader],
        })),
      removeTrader: (address) =>
        set((state) => ({
          trackedTraders: state.trackedTraders.filter((t) => t.address !== address),
        })),
      updateTrader: (address, data) =>
        set((state) => ({
          trackedTraders: state.trackedTraders.map((t) =>
            t.address === address ? { ...t, ...data } : t
          ),
        })),

      // Copy Settings - now registers webhook with Helius
      copySettings: [],
      addCopySettings: async (settings) => {
        // Add to local state first
        set((state) => ({
          copySettings: [...state.copySettings, settings],
        }));

        // Register webhook with Helius
        try {
          const response = await fetch('/api/webhook/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress: settings.traderId }),
          });

          if (response.ok) {
            const data = await response.json();
            console.log('Webhook registered:', data);
            
            // Store webhook ID
            if (data.webhookId) {
              set((state) => ({
                webhookIds: { ...state.webhookIds, [settings.traderId]: data.webhookId },
              }));
            }
                  } else {
            const errorData = await response.text();
            console.error('Failed to register webhook:', response.status, errorData);
          } 
        } catch (error) {
          console.error('Webhook registration error:', error);
        }
      },
      removeCopySettings: (traderId) =>
        set((state) => ({
          copySettings: state.copySettings.filter((s) => s.traderId !== traderId),
        })),
      updateCopySettings: (traderId, data) =>
        set((state) => ({
          copySettings: state.copySettings.map((s) =>
            s.traderId === traderId ? { ...s, ...data } : s
          ),
        })),

      // Webhook tracking
      webhookIds: {},

      // UI
      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'tailsharp-storage',
    }
  )
);
