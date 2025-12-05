// src/types/index.ts

export interface Trader {
  address: string;
  displayName: string | null;
  avatar: string | null;
  stats: TraderStats;
  positions: Position[];
  followers: number;
  isVerified: boolean;
}

export interface TraderStats {
  totalTrades: number;
  winRate: number;
  roi: number;
  sharpeRatio: number;
  avgPositionSize: number;
  totalVolume: number;
  lastActiveAt: Date;
}

export interface Position {
  id: string;
  marketId: string;
  marketTitle: string;
  outcome: 'YES' | 'NO';
  contracts: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  openedAt: Date;
}

export interface Market {
  id: string;
  title: string;
  description: string;
  category: string;
  yesPrice: number;
  noPrice: number;
  volume24h: number;
  expiresAt: Date;
  status: 'open' | 'closed' | 'settled';
}

export interface CopySettings {
  traderId: string;
  allocationUsd: number;
  maxPositionPercent: number;
  stopLossPercent: number;
  copyOpenPositions: boolean;
  isActive: boolean;
}

export interface User {
  walletAddress: string;
  following: CopySettings[];
  createdAt: Date;
}
