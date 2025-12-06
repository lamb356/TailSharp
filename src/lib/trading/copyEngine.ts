// src/lib/trading/copyEngine.ts
import { ParsedTrade } from './transactionParser';

export interface CopySettings {
  traderId: string;
  isActive: boolean;
  allocationUsd: number;
  maxPositionPercent: number;
}

export interface CopyDecision {
  shouldCopy: boolean;
  reason?: string;
  positionSize?: number;
  settings?: CopySettings;
}

/**
 * Decide if we should copy a trade based on user settings
 */
export function shouldCopyTrade(
  trade: ParsedTrade,
  settings: CopySettings[]
): CopyDecision {
  // Find settings for this trader
  const traderSettings = settings.find(s => s.traderId === trade.walletAddress);

  if (!traderSettings) {
    return {
      shouldCopy: false,
      reason: 'Trader not followed',
    };
  }

  if (!traderSettings.isActive) {
    return {
      shouldCopy: false,
      reason: 'Auto-copy is paused for this trader',
    };
  }

  // Calculate position size
  const positionSize = calculatePositionSize(trade, traderSettings);

  if (positionSize <= 0) {
    return {
      shouldCopy: false,
      reason: 'Position size too small',
    };
  }

  return {
    shouldCopy: true,
    positionSize,
    settings: traderSettings,
  };
}

/**
 * Calculate how much to trade based on user's allocation settings
 */
function calculatePositionSize(
  trade: ParsedTrade,
  settings: CopySettings
): number {
  // Max position is a percentage of total allocation
  const maxPosition = settings.allocationUsd * (settings.maxPositionPercent / 100);

  // Scale the trade amount proportionally
  // For now, use a simple 1:1 ratio up to max position
  const scaledAmount = Math.min(trade.amount, maxPosition);

  return scaledAmount;
}

/**
 * Check if we have enough balance to execute the trade
 */
export function hasEnoughBalance(
  positionSize: number,
  availableBalance: number
): boolean {
  return availableBalance >= positionSize;
}
