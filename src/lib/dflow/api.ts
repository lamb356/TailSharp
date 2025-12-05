// src/lib/dflow/api.ts

const DFLOW_API_BASE = 'https://api.dflow.net';

export interface Market {
  id: string;
  ticker: string;
  title: string;
  description: string;
  category: string;
  status: 'open' | 'closed' | 'resolved';
  expirationDate: string;
  yesPrice: number;
  noPrice: number;
  volume24h: number;
  totalVolume: number;
  liquidity: number;
}

export interface Position {
  marketId: string;
  side: 'yes' | 'no';
  quantity: number;
  avgPrice: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
}

export interface OrderRequest {
  marketId: string;
  side: 'yes' | 'no';
  quantity: number;
  price?: number; // Limit price, omit for market order
  type: 'market' | 'limit';
}

export interface OrderResponse {
  orderId: string;
  status: 'pending' | 'filled' | 'partial' | 'cancelled';
  filledQuantity: number;
  avgFillPrice: number;
  timestamp: string;
}

// Mock data until API is live
const MOCK_MARKETS: Market[] = [
  {
    id: 'fed-rate-dec-2025',
    ticker: 'FED-DEC25',
    title: 'Fed cuts rates in December 2025?',
    description: 'Will the Federal Reserve cut interest rates at their December 2025 meeting?',
    category: 'Economics',
    status: 'open',
    expirationDate: '2025-12-18T19:00:00Z',
    yesPrice: 0.72,
    noPrice: 0.28,
    volume24h: 125000,
    totalVolume: 2450000,
    liquidity: 89000,
  },
  {
    id: 'btc-100k-2025',
    ticker: 'BTC-100K',
    title: 'Bitcoin above $100k by year end?',
    description: 'Will Bitcoin trade above $100,000 at any point before January 1, 2026?',
    category: 'Crypto',
    status: 'open',
    expirationDate: '2025-12-31T23:59:59Z',
    yesPrice: 0.65,
    noPrice: 0.35,
    volume24h: 340000,
    totalVolume: 8900000,
    liquidity: 245000,
  },
  {
    id: 'cpi-jan-2026',
    ticker: 'CPI-JAN26',
    title: 'CPI above 3% in January 2026?',
    description: 'Will the Consumer Price Index year-over-year reading be above 3% for January 2026?',
    category: 'Economics',
    status: 'open',
    expirationDate: '2026-02-12T13:30:00Z',
    yesPrice: 0.41,
    noPrice: 0.59,
    volume24h: 67000,
    totalVolume: 1230000,
    liquidity: 56000,
  },
  {
    id: 'eth-5k-q1-2026',
    ticker: 'ETH-5K-Q1',
    title: 'Ethereum above $5k in Q1 2026?',
    description: 'Will Ethereum trade above $5,000 at any point in Q1 2026?',
    category: 'Crypto',
    status: 'open',
    expirationDate: '2026-03-31T23:59:59Z',
    yesPrice: 0.38,
    noPrice: 0.62,
    volume24h: 89000,
    totalVolume: 1890000,
    liquidity: 78000,
  },
  {
    id: 'sp500-6000-2025',
    ticker: 'SPX-6000',
    title: 'S&P 500 closes above 6000 in 2025?',
    description: 'Will the S&P 500 index close above 6000 at least once before end of 2025?',
    category: 'Stocks',
    status: 'open',
    expirationDate: '2025-12-31T21:00:00Z',
    yesPrice: 0.82,
    noPrice: 0.18,
    volume24h: 210000,
    totalVolume: 5670000,
    liquidity: 189000,
  },
  {
    id: 'trump-approval-50',
    ticker: 'TRUMP-50',
    title: 'Trump approval above 50% by March?',
    description: 'Will President Trump\'s approval rating be above 50% in any major poll by March 31, 2026?',
    category: 'Politics',
    status: 'open',
    expirationDate: '2026-03-31T23:59:59Z',
    yesPrice: 0.34,
    noPrice: 0.66,
    volume24h: 156000,
    totalVolume: 3450000,
    liquidity: 134000,
  },
];

// API mode flag
const USE_MOCK = true; // Set to false when DFlow API is available

/**
 * Fetch all available markets
 */
export const getMarkets = async (): Promise<Market[]> => {
  if (USE_MOCK) {
    // Simulate API delay
    await new Promise((r) => setTimeout(r, 500));
    return MOCK_MARKETS;
  }

  const response = await fetch(`${DFLOW_API_BASE}/v1/markets`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch markets');
  }

  return response.json();
};

/**
 * Fetch a single market by ID
 */
export const getMarket = async (marketId: string): Promise<Market | null> => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 200));
    return MOCK_MARKETS.find((m) => m.id === marketId) || null;
  }

  const response = await fetch(`${DFLOW_API_BASE}/v1/markets/${marketId}`);
  
  if (!response.ok) {
    return null;
  }

  return response.json();
};

/**
 * Fetch markets by category
 */
export const getMarketsByCategory = async (category: string): Promise<Market[]> => {
  const markets = await getMarkets();
  return markets.filter((m) => m.category.toLowerCase() === category.toLowerCase());
};

/**
 * Place an order (mock for now)
 */
export const placeOrder = async (order: OrderRequest): Promise<OrderResponse> => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 800));
    
    // Simulate order execution
    return {
      orderId: `order-${Date.now()}`,
      status: 'filled',
      filledQuantity: order.quantity,
      avgFillPrice: order.price || 0.5,
      timestamp: new Date().toISOString(),
    };
  }

  const response = await fetch(`${DFLOW_API_BASE}/v1/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // 'Authorization': `Bearer ${API_KEY}`, // Add when available
    },
    body: JSON.stringify(order),
  });

  if (!response.ok) {
    throw new Error('Failed to place order');
  }

  return response.json();
};

/**
 * Format price as percentage
 */
export const formatPrice = (price: number): string => {
  return `${(price * 100).toFixed(0)}¢`;
};

/**
 * Format volume
 */
export const formatVolume = (volume: number): string => {
  if (volume >= 1_000_000) {
    return `$${(volume / 1_000_000).toFixed(1)}M`;
  }
  if (volume >= 1_000) {
    return `$${(volume / 1_000).toFixed(0)}K`;
  }
  return `$${volume}`;
};
