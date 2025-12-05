// src/lib/store/useCopyTrades.ts
import { create } from 'zustand';
import { SimulatedTrade } from '@/lib/solana/copyTrade';

interface CopyTradeState {
  simulatedTrades: SimulatedTrade[];
  executedTrades: SimulatedTrade[];
  
  addSimulatedTrade: (trade: SimulatedTrade) => void;
  removeSimulatedTrade: (id: string) => void;
  clearSimulatedTrades: () => void;
  
  executeTrade: (id: string) => void;
  rejectTrade: (id: string) => void;
  
  getTradesByTrader: (traderId: string) => SimulatedTrade[];
  getPendingCount: () => number;
}

export const useCopyTrades = create<CopyTradeState>((set, get) => ({
  simulatedTrades: [],
  executedTrades: [],

  addSimulatedTrade: (trade) =>
    set((state) => ({
      simulatedTrades: [trade, ...state.simulatedTrades].slice(0, 100), // Keep last 100
    })),

  removeSimulatedTrade: (id) =>
    set((state) => ({
      simulatedTrades: state.simulatedTrades.filter((t) => t.id !== id),
    })),

  clearSimulatedTrades: () =>
    set({ simulatedTrades: [] }),

  executeTrade: (id) =>
    set((state) => {
      const trade = state.simulatedTrades.find((t) => t.id === id);
      if (!trade) return state;

      return {
        simulatedTrades: state.simulatedTrades.filter((t) => t.id !== id),
        executedTrades: [
          { ...trade, status: 'executed' as const, timestamp: new Date() },
          ...state.executedTrades,
        ].slice(0, 100),
      };
    }),

  rejectTrade: (id) =>
    set((state) => ({
      simulatedTrades: state.simulatedTrades.filter((t) => t.id !== id),
    })),

  getTradesByTrader: (traderId) => {
    return get().simulatedTrades.filter((t) => t.traderId === traderId);
  },

  getPendingCount: () => {
    return get().simulatedTrades.filter((t) => t.status === 'pending').length;
  },
}));
