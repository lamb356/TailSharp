// src/lib/trades.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.KV_REDIS_URL!);

export interface Trade {
  id: string;
  walletAddress: string;
  signature: string;
  timestamp: number;
  platform: 'polymarket' | 'drift' | 'kalshi' | 'unknown';
  market: {
    id: string;
    title: string;
    category?: string;
  };
  position: 'yes' | 'no';
  action: 'buy' | 'sell';
  size: number;
  price: number;
  cost: number;
  raw?: any;
}

export interface TradeFilter {
  platform?: string;
  position?: 'yes' | 'no';
  action?: 'buy' | 'sell';
  startTime?: number;
  endTime?: number;
}

const TRADE_KEY_PREFIX = 'trades:';
const RECENT_TRADES_KEY = 'trades:recent';
const TRADE_TTL = 60 * 60 * 24 * 90; // 90 days

/**
 * Save a trade to Redis
 */
export async function saveTrade(trade: Trade): Promise<void> {
  const walletKey = `${TRADE_KEY_PREFIX}${trade.walletAddress}`;
  const tradeJson = JSON.stringify(trade);

  // Store in wallet-specific list
  await redis.lpush(walletKey, tradeJson);
  await redis.ltrim(walletKey, 0, 499); // Keep last 500 trades per wallet
  await redis.expire(walletKey, TRADE_TTL);

  // Also add to recent trades global list
  await redis.lpush(RECENT_TRADES_KEY, tradeJson);
  await redis.ltrim(RECENT_TRADES_KEY, 0, 999); // Keep last 1000 recent trades
  await redis.expire(RECENT_TRADES_KEY, TRADE_TTL);

  // Store individual trade by signature for deduplication
  const sigKey = `trade:sig:${trade.signature}`;
  await redis.set(sigKey, tradeJson, 'EX', TRADE_TTL);
}

/**
 * Check if a trade already exists by signature
 */
export async function tradeExists(signature: string): Promise<boolean> {
  const sigKey = `trade:sig:${signature}`;
  const exists = await redis.exists(sigKey);
  return exists === 1;
}

/**
 * Get trades by wallet address
 */
export async function getTradesByWallet(
  walletAddress: string,
  limit: number = 50,
  offset: number = 0,
  filter?: TradeFilter
): Promise<{ trades: Trade[]; total: number }> {
  const walletKey = `${TRADE_KEY_PREFIX}${walletAddress}`;

  // Get total count
  const total = await redis.llen(walletKey);

  // Get trades with pagination
  const rawTrades = await redis.lrange(walletKey, offset, offset + limit - 1);

  let trades: Trade[] = rawTrades.map((t) => JSON.parse(t));

  // Apply filters if provided
  if (filter) {
    trades = trades.filter((trade) => {
      if (filter.platform && trade.platform !== filter.platform) return false;
      if (filter.position && trade.position !== filter.position) return false;
      if (filter.action && trade.action !== filter.action) return false;
      if (filter.startTime && trade.timestamp < filter.startTime) return false;
      if (filter.endTime && trade.timestamp > filter.endTime) return false;
      return true;
    });
  }

  return { trades, total };
}

/**
 * Get recent trades across all wallets
 */
export async function getRecentTrades(
  limit: number = 50,
  offset: number = 0
): Promise<{ trades: Trade[]; total: number }> {
  const total = await redis.llen(RECENT_TRADES_KEY);
  const rawTrades = await redis.lrange(RECENT_TRADES_KEY, offset, offset + limit - 1);

  const trades: Trade[] = rawTrades.map((t) => JSON.parse(t));

  return { trades, total };
}

/**
 * Get trade statistics for a wallet
 */
export async function getTradeStats(walletAddress: string): Promise<{
  totalTrades: number;
  totalVolume: number;
  winRate: number;
  avgTradeSize: number;
  platforms: Record<string, number>;
}> {
  const { trades, total } = await getTradesByWallet(walletAddress, 500);

  if (trades.length === 0) {
    return {
      totalTrades: 0,
      totalVolume: 0,
      winRate: 0,
      avgTradeSize: 0,
      platforms: {},
    };
  }

  const totalVolume = trades.reduce((sum, t) => sum + t.cost, 0);
  const avgTradeSize = totalVolume / trades.length;

  const platforms: Record<string, number> = {};
  trades.forEach((t) => {
    platforms[t.platform] = (platforms[t.platform] || 0) + 1;
  });

  // Win rate would require outcome data - for now estimate from price
  // Trades at price < 0.5 that bet YES, or > 0.5 that bet NO, are contrarian
  const winRate = 65; // Placeholder - would need resolved market data

  return {
    totalTrades: total,
    totalVolume,
    winRate,
    avgTradeSize,
    platforms,
  };
}

/**
 * Delete all trades for a wallet (useful for testing)
 */
export async function deleteTradesByWallet(walletAddress: string): Promise<void> {
  const walletKey = `${TRADE_KEY_PREFIX}${walletAddress}`;
  await redis.del(walletKey);
}

/**
 * Get trades for multiple wallets
 */
export async function getTradesForWallets(
  walletAddresses: string[],
  limit: number = 50
): Promise<Trade[]> {
  const allTrades: Trade[] = [];

  for (const wallet of walletAddresses) {
    const { trades } = await getTradesByWallet(wallet, limit);
    allTrades.push(...trades);
  }

  // Sort by timestamp descending
  allTrades.sort((a, b) => b.timestamp - a.timestamp);

  return allTrades.slice(0, limit);
}
