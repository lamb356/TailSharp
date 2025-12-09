export interface ParsedTrade {
  market: string;
  side: 'YES' | 'NO';
  amount: number;
  price: number;
  walletAddress: string;
  signature: string;
  timestamp: number;
}

export function parseTransaction(tx: any): ParsedTrade | null {
  try {
    const description = tx.description || '';
    
    if (!description && !tx.tokenTransfers?.length) {
      return null;
    }

    let marketName = 'unknown-market';
    if (description) {
      marketName = description;
    }

    // Determine side from description or default
    let side: 'YES' | 'NO' = 'YES';
    const lowerDesc = description.toLowerCase();
    if (lowerDesc.includes(' no ') || lowerDesc.startsWith('no ') || lowerDesc.endsWith(' no')) {
      side = 'NO';
    }
    
    // Check for explicit side in source field
    if (tx.side === 'NO' || tx.side === 'no') {
      side = 'NO';
    } else if (tx.side === 'YES' || tx.side === 'yes') {
      side = 'YES';
    }

    const amount = tx.tokenTransfers?.[0]?.tokenAmount || tx.amount || 100;

    return {
      market: marketName,
      side: side,
      amount: amount,
      price: 0.65,
      walletAddress: tx.feePayer,
      signature: tx.signature,
      timestamp: tx.timestamp || Date.now() / 1000,
    };
  } catch (error) {
    console.error('Failed to parse transaction:', error);
    return null;
  }
}

export function isPredictionMarketTrade(tx: any): boolean {
  const description = tx.description?.toLowerCase() || '';
  const source = tx.source?.toLowerCase() || '';
  
  // Check source for known prediction market platforms
  const predictionSources = ['polymarket', 'kalshi', 'predictit', 'manifold', 'metaculus'];
  if (predictionSources.some(s => source.includes(s))) {
    return true;
  }
  
  // Check description for prediction market keywords
  const predictionKeywords = [
    'swap', 'trade', 'prediction', 'market', 'bet', 'wager',
    'will ', 'won\'t ', 'trump', 'biden', 'election', 'president',
    'yes', 'no', 'outcome', 'contract'
  ];
  
  if (predictionKeywords.some(keyword => description.includes(keyword))) {
    return true;
  }
  
  // Check for token transfers (common in prediction market trades)
  if (tx.tokenTransfers?.length > 0) {
    return true;
  }
  
  return false;
}