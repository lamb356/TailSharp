// src/lib/dflow/copyTradeMarkets.ts
import { Market, getMarket, placeOrder } from './api';
import { SimulatedTrade } from '@/lib/solana/copyTrade';
import { CopySettings } from '@/types';

export interface MarketCopyTrade extends SimulatedTrade {
  marketId: string;
  marketTitle: string;
  marketTicker: string;
  side: 'yes' | 'no';
  pricePerContract: number;
  contracts: number;
}

/**
 * Generate a copy trade for a market position
 */
export const generateMarketCopyTrade = async (
  traderId: string,
  marketId: string,
  side: 'yes' | 'no',
  traderContracts: number,
  settings: CopySettings
): Promise<MarketCopyTrade | null> => {
  const market = await getMarket(marketId);
  if (!market) return null;

  const price = side === 'yes' ? market.yesPrice : market.noPrice;
  
  // Calculate your position based on allocation
  const traderValue = traderContracts * price;
  const proportion = settings.allocationUsd / 10000; // Assume $10k trader portfolio
  const yourContracts = Math.floor(traderContracts * proportion);
  const yourValue = yourContracts * price;

  // Cap at max position
  const maxPositionValue = settings.allocationUsd * (settings.maxPositionPercent / 100);
  const cappedContracts = yourValue > maxPositionValue 
    ? Math.floor(maxPositionValue / price) 
    : yourContracts;

  if (cappedContracts <= 0) return null;

  const shortAddress = `${traderId.slice(0, 4)}...${traderId.slice(-4)}`;

  return {
    id: `market-${marketId}-${Date.now()}`,
    traderId,
    traderShortAddress: shortAddress,
    tokenMint: marketId,
    tokenSymbol: market.ticker,
    tokenName: market.title,
    action: 'BUY',
    traderAmount: traderContracts,
    yourAmount: cappedContracts,
    yourAllocation: settings.allocationUsd,
    proportionPercent: proportion * 100,
    estimatedCost: cappedContracts * price,
    timestamp: new Date(),
    status: 'pending',
    // Market-specific fields
    marketId,
    marketTitle: market.title,
    marketTicker: market.ticker,
    side,
    pricePerContract: price,
    contracts: cappedContracts,
  };
};

/**
 * Execute a market copy trade
 */
export const executeMarketCopyTrade = async (
  trade: MarketCopyTrade
): Promise<{ success: boolean; orderId?: string; error?: string }> => {
  try {
    const response = await placeOrder({
      marketId: trade.marketId,
      side: trade.side,
      quantity: trade.contracts,
      type: 'market',
    });

    return {
      success: response.status === 'filled',
      orderId: response.orderId,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
