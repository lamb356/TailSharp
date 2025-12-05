// src/lib/solana/tokens.ts

// Known token registry (we'll expand this)
// In production, you'd use Helius DAS API or Jupiter token list
const KNOWN_TOKENS: Record<string, { symbol: string; name: string; decimals: number }> = {
  'So11111111111111111111111111111111111111112': {
    symbol: 'SOL',
    name: 'Wrapped SOL',
    decimals: 9,
  },
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
  },
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': {
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
  },
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': {
    symbol: 'BONK',
    name: 'Bonk',
    decimals: 5,
  },
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': {
    symbol: 'JUP',
    name: 'Jupiter',
    decimals: 6,
  },
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': {
    symbol: 'mSOL',
    name: 'Marinade Staked SOL',
    decimals: 9,
  },
  'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3': {
    symbol: 'PYTH',
    name: 'Pyth Network',
    decimals: 6,
  },
  'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof': {
    symbol: 'RENDER',
    name: 'Render Token',
    decimals: 8,
  },
};

export interface TokenInfo {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  isKnown: boolean;
}

export const getTokenInfo = (mint: string): TokenInfo => {
  const known = KNOWN_TOKENS[mint];
  
  if (known) {
    return {
      mint,
      symbol: known.symbol,
      name: known.name,
      decimals: known.decimals,
      isKnown: true,
    };
  }

  // Unknown token - return truncated mint as symbol
  return {
    mint,
    symbol: `${mint.slice(0, 4)}...`,
    name: 'Unknown Token',
    decimals: 0,
    isKnown: false,
  };
};

export const formatTokenAmount = (amount: number, decimals: number): string => {
  if (amount === 0) return '0';
  
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(2)}K`;
  }
  
  return amount.toLocaleString(undefined, { maximumFractionDigits: 4 });
};
