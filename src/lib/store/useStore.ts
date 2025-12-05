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
  addCopySettings: (settings: CopySettings) => void;
  removeCopySettings: (traderId: string) => void;
  updateCopySettings: (traderId: string, data: Partial<CopySettings>) => void;

  // UI State
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
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

      // Copy Settings
      copySettings: [],
      addCopySettings: (settings) =>
        set((state) => ({
          copySettings: [...state.copySettings, settings],
        })),
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

      // UI
      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'tailsharp-storage',
    }
  )
);
