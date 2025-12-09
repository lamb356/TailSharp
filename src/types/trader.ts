// src/types/trader.ts

export interface TraderProfile {
  username: string;           // unique, lowercase, no spaces (e.g., "sharpwhale")
  displayName: string;        // Display name (e.g., "Sharp Whale 🐋")
  walletAddress: string;      // Solana wallet address
  bio?: string;               // Optional bio
  twitter?: string;           // Twitter handle without @
  profileImage?: string;      // URL to profile image
  verified: boolean;          // Verified trader status
  createdAt: number;          // Unix timestamp
  stats: TraderStats;
}

export interface TraderStats {
  totalTrades: number;
  winRate: number;            // Percentage (0-100)
  roi: number;                // Percentage
  followers: number;
  totalVolume: number;        // USD
}

export interface TraderSearchResult {
  traders: TraderProfile[];
  total: number;
}