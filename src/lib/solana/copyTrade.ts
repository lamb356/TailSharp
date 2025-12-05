// src/lib/solana/copyTrade.ts
import { CopySettings } from '@/types';
import { TokenBalance } from './tracker';
import { getTokenInfo } from './tokens';

export interface SimulatedTrade {
  id: string;
  traderId: string;
  traderShortAddress: string;
  tokenMint: string;
  tokenSymbol: string;
  tokenName: string;
  action: 'BUY' | 'SELL';
  traderAmount: number;
  yourAmount: number;
  yourAllocation: number;
  proportionPercent: number;
  estimatedCost: number;
  timestamp: Date;
  status: 'pending' | 'ready' | 'executed' | 'failed';
}

export interface PositionDiff {
  mint: string;
  symbol: string;
  name: string;
  previousAmount: number;
  currentAmount: number;
  change: number;
  changePercent: number;
  action: 'BUY' | 'SELL' | 'HOLD';
}

/**
 * Calculate position differences between two snapshots
 */
export const calculatePositionDiff = (
  previousTokens: TokenBalance[],
  currentTokens: TokenBalance[]
): PositionDiff[] => {
  const diffs: PositionDiff[] = [];
  const previousMap = new Map(previousTokens.map((t) => [t.mint, t.uiAmount]));
  const currentMap = new Map(currentTokens.map((t) => [t.mint, t.uiAmount]));

  // Check all current tokens
  currentTokens.forEach((token) => {
    const previous = previousMap.get(token.mint) || 0;
    const current = token.uiAmount;
    const change = current - previous;

    if (Math.abs(change) > 0.0001) {
      const info = getTokenInfo(token.mint);
      diffs.push({
        mint: token.mint,
        symbol: info.symbol,
        name: info.name,
        previousAmount: previous,
        currentAmount: current,
        change,
        changePercent: previous > 0 ? (change / previous) * 100 : 100,
        action: change > 0 ? 'BUY' : 'SELL',
      });
    }
  });

  // Check for tokens that were sold completely (in previous but not in current)
  previousTokens.forEach((token) => {
    if (!currentMap.has(token.mint) || currentMap.get(token.mint) === 0) {
      const info = getTokenInfo(token.mint);
      diffs.push({
        mint: token.mint,
        symbol: info.symbol,
        name: info.name,
        previousAmount: token.uiAmount,
        currentAmount: 0,
        change: -token.uiAmount,
        changePercent: -100,
        action: 'SELL',
      });
    }
  });

  return diffs;
};

/**
 * Calculate simulated copy trade based on settings
 */
export const calculateCopyTrade = (
  diff: PositionDiff,
  settings: CopySettings,
  traderTotalValue: number = 10000 // Estimated trader portfolio value
): SimulatedTrade => {
  // Calculate proportion: your allocation / trader's estimated portfolio
  const proportion = settings.allocationUsd / traderTotalValue;

  // Your mirrored amount
  const yourAmount = Math.abs(diff.change) * proportion;

  // Cap at max position percent
  const maxPosition = settings.allocationUsd * (settings.maxPositionPercent / 100);
  const cappedAmount = Math.min(yourAmount, maxPosition);

  // Estimate cost (simplified - would need price feeds for accuracy)
  const estimatedCost = cappedAmount; // Assuming 1:1 for now

  const shortAddress = `${settings.traderId.slice(0, 4)}...${settings.traderId.slice(-4)}`;

  return {
    id: `${settings.traderId}-${diff.mint}-${Date.now()}`,
    traderId: settings.traderId,
    traderShortAddress: shortAddress,
    tokenMint: diff.mint,
    tokenSymbol: diff.symbol,
    tokenName: diff.name,
    action: diff.action as 'BUY' | 'SELL',
    traderAmount: Math.abs(diff.change),
    yourAmount: cappedAmount,
    yourAllocation: settings.allocationUsd,
    proportionPercent: proportion * 100,
    estimatedCost,
    timestamp: new Date(),
    status: 'pending',
  };
};

/**
 * Validate if a trade should be executed based on settings
 */
export const shouldExecuteTrade = (
  trade: SimulatedTrade,
  settings: CopySettings
): { valid: boolean; reason?: string } => {
  if (!settings.isActive) {
    return { valid: false, reason: 'Copy trading is paused for this trader' };
  }

  if (trade.estimatedCost > settings.allocationUsd) {
    return { valid: false, reason: 'Trade exceeds allocation' };
  }

  const maxPositionValue = settings.allocationUsd * (settings.maxPositionPercent / 100);
  if (trade.estimatedCost > maxPositionValue) {
    return { valid: false, reason: 'Trade exceeds max position size' };
  }

  return { valid: true };
};

/**
 * Format currency for display
 */
export const formatUsd = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};
