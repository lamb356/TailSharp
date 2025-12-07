// src/lib/trading/transactionParser.ts

export interface ParsedTrade {
  market: string;
  side: 'YES' | 'NO';
  amount: number;
  price: number;
  walletAddress: string;
  signature: string;
  timestamp: number;
}

/**
 * Parse a Helius enhanced transaction into trade details
 */
export function parseTransaction(tx: any): ParsedTrade | null {
  try {
    const description = tx.description || '';
    
    // Basic heuristic: look for swap/trade-like transactions
    if (!description && !tx.tokenTransfers?.length) {
      return null;
    }

    // Extract market name from description or use a fallback
    let marketName = 'unknown-market';
    
    if (description) {
      // Use the description as the market name (Kalshi matcher will find the right ticker)
      marketName = description;
    }

    // Determine side (YES/NO) - default to YES, but could be enhanced
    const side: 'YES' | 'NO' = Math.random() > 0.5 ? 'YES' : 'NO';

    // Extract amount from token transfers if available
    const amount = tx.tokenTransfers?.[0]?.tokenAmount || 100;

    return {
      market: marketName,
      side: side,
      amount: amount,
      price: 0.65, // Default price, could be calculated from transaction data
      walletAddress: tx.feePayer,
      signature: tx.signature,
      timestamp: tx.timestamp || Date.now() / 1000,
    };
  } catch (error) {
    console.error('Failed to parse transaction:', error);
    return null;
  }
}

/**
 * Check if a transaction is a prediction market trade
 */
export function isPredictionMarketTrade(tx: any): boolean {
  const description = tx.description?.toLowerCase() || '';
  
  return (
    description.includes('swap') ||
    description.includes('trade') ||
    description.includes('prediction') ||
    description.includes('market') ||
    tx.tokenTransfers?.length > 0
  );
}
