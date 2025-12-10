// src/scripts/seedDemoData.ts
import Redis from 'ioredis';
import { TraderProfile } from '@/types/trader';
import { Trade } from '@/lib/trades';

// Realistic trader profiles data
const TRADER_TEMPLATES = [
  // Verified high performers
  { username: 'sharpwhale', displayName: 'Sharp Whale', bio: 'Full-time prediction market trader. 5+ years experience. Focus on politics & macro.', twitter: 'sharpwhale', verified: true, tier: 'elite' },
  { username: 'alphahunter', displayName: 'Alpha Hunter', bio: 'Former quant. Data-driven predictions. DMs open for collabs.', twitter: 'alphahunter_pm', verified: true, tier: 'elite' },
  { username: 'cryptooracle', displayName: 'Crypto Oracle', bio: 'Crypto markets specialist. Called 10 out of last 12 major moves.', twitter: 'cryptooracle', verified: true, tier: 'elite' },

  // Verified good performers
  { username: 'polyking', displayName: 'Poly King', bio: 'Polymarket OG since 2020. Specializing in election markets.', twitter: 'polykingpm', verified: true, tier: 'high' },
  { username: 'marketmaven', displayName: 'Market Maven', bio: 'Economics PhD. Fed watcher. Interest rate predictions.', twitter: null, verified: true, tier: 'high' },

  // Regular good performers
  { username: 'betbrain', displayName: 'Bet Brain', bio: 'Sports and politics junkie. Volume trader.', twitter: 'betbrain22', verified: false, tier: 'high' },
  { username: 'predictionpro', displayName: 'PredictionPro', bio: 'Making markets since 2021.', twitter: null, verified: false, tier: 'high' },
  { username: 'oddshark', displayName: 'Odd Shark', bio: 'Finding edge where others see noise.', twitter: 'oddshark_trades', verified: false, tier: 'medium' },

  // Medium performers
  { username: 'forecaster_dave', displayName: 'Forecaster Dave', bio: 'Part-time trader, full-time optimist.', twitter: null, verified: false, tier: 'medium' },
  { username: 'lucky_luna', displayName: 'Lucky Luna', bio: 'Trust the process. WAGMI.', twitter: 'luckyluna_sol', verified: false, tier: 'medium' },
  { username: 'marketwatcher', displayName: 'Market Watcher', bio: 'Watching markets so you don\'t have to.', twitter: null, verified: false, tier: 'medium' },
  { username: 'traderjoe_pm', displayName: 'Trader Joe', bio: 'Average Joe making above-average returns.', twitter: 'traderjoe_pm', verified: false, tier: 'medium' },
  { username: 'riskrunner', displayName: 'Risk Runner', bio: 'High conviction plays only.', twitter: null, verified: false, tier: 'medium' },

  // Lower performers (adds realism)
  { username: 'degendan', displayName: 'Degen Dan', bio: 'YOLO into everything. NFA.', twitter: 'degendan420', verified: false, tier: 'low' },
  { username: 'paperhand_pete', displayName: 'Paperhand Pete', bio: 'Learning the hard way.', twitter: null, verified: false, tier: 'low' },
  { username: 'hopium_dealer', displayName: 'Hopium Dealer', bio: 'Diamond hands, smooth brain.', twitter: 'hopiumdealer', verified: false, tier: 'low' },
  { username: 'newbie_trader', displayName: 'Newbie Trader', bio: 'Just started trading prediction markets!', twitter: null, verified: false, tier: 'low' },
  { username: 'contrarian_carl', displayName: 'Contrarian Carl', bio: 'Always fading the consensus. Sometimes it works.', twitter: null, verified: false, tier: 'low' },
];

// Realistic market topics by category
const MARKET_TEMPLATES = {
  politics: [
    { title: 'Will Trump win the 2024 Presidential Election?', id: 'trump-2024' },
    { title: 'Will Democrats win the Senate in 2024?', id: 'dem-senate-2024' },
    { title: 'Will Biden drop out before the election?', id: 'biden-dropout' },
    { title: 'Will there be a government shutdown in 2024?', id: 'gov-shutdown-2024' },
    { title: 'Will Nikki Haley win any primary state?', id: 'haley-primary' },
    { title: 'Will RFK Jr get on ballot in 45+ states?', id: 'rfk-ballot' },
    { title: 'Will there be a new Speaker of the House by March?', id: 'new-speaker' },
    { title: 'Will Ukraine receive $50B+ in US aid in 2024?', id: 'ukraine-aid' },
  ],
  crypto: [
    { title: 'Will Bitcoin hit $100k before 2025?', id: 'btc-100k-2025' },
    { title: 'Will Ethereum flip Bitcoin market cap?', id: 'eth-flip-btc' },
    { title: 'Will Solana reach $200 in 2024?', id: 'sol-200-2024' },
    { title: 'Will a spot ETH ETF be approved in 2024?', id: 'eth-etf-2024' },
    { title: 'Will Bitcoin dominance exceed 60%?', id: 'btc-dom-60' },
    { title: 'Will there be a major exchange hack (>$100M)?', id: 'exchange-hack' },
    { title: 'Will USDC market cap exceed USDT?', id: 'usdc-flip-usdt' },
    { title: 'Will any L2 token enter top 10 by market cap?', id: 'l2-top-10' },
  ],
  economics: [
    { title: 'Will the Fed cut rates in March 2024?', id: 'fed-march-cut' },
    { title: 'Will US inflation drop below 3% in 2024?', id: 'inflation-3pct' },
    { title: 'Will there be a US recession in 2024?', id: 'us-recession-2024' },
    { title: 'Will unemployment exceed 5% in 2024?', id: 'unemployment-5pct' },
    { title: 'Will the S&P 500 hit 5500 in 2024?', id: 'sp500-5500' },
    { title: 'Will oil prices exceed $100/barrel?', id: 'oil-100' },
    { title: 'Will the 10Y Treasury yield exceed 5%?', id: '10y-5pct' },
    { title: 'Will housing prices drop 10%+ in any major city?', id: 'housing-drop' },
  ],
  sports: [
    { title: 'Will the Chiefs win Super Bowl LVIII?', id: 'chiefs-sb-58' },
    { title: 'Will Shohei Ohtani hit 50+ home runs?', id: 'ohtani-50hr' },
    { title: 'Will Real Madrid win the Champions League?', id: 'real-madrid-ucl' },
    { title: 'Will LeBron retire after this season?', id: 'lebron-retire' },
    { title: 'Will there be a perfect game in MLB 2024?', id: 'perfect-game-2024' },
    { title: 'Will any team go undefeated in college football?', id: 'cfb-undefeated' },
    { title: 'Will the Lakers make the playoffs?', id: 'lakers-playoffs' },
    { title: 'Will Messi win the Ballon d\'Or?', id: 'messi-ballondor' },
  ],
  tech: [
    { title: 'Will Apple release a foldable iPhone in 2024?', id: 'apple-foldable' },
    { title: 'Will OpenAI release GPT-5 in 2024?', id: 'gpt5-2024' },
    { title: 'Will Twitter/X go bankrupt?', id: 'x-bankrupt' },
    { title: 'Will TikTok be banned in the US?', id: 'tiktok-ban' },
    { title: 'Will Nvidia market cap exceed Apple?', id: 'nvda-exceed-aapl' },
    { title: 'Will any company achieve AGI in 2024?', id: 'agi-2024' },
    { title: 'Will there be a major AI regulation bill passed?', id: 'ai-regulation' },
    { title: 'Will Meta stock price double in 2024?', id: 'meta-double' },
  ],
  entertainment: [
    { title: 'Will Taylor Swift get engaged in 2024?', id: 'taylor-engaged' },
    { title: 'Will Barbie win Best Picture Oscar?', id: 'barbie-oscar' },
    { title: 'Will GTA 6 be delayed past 2025?', id: 'gta6-delay' },
    { title: 'Will Netflix lose subscribers in Q1 2024?', id: 'netflix-subs' },
    { title: 'Will a Marvel movie gross $1B+ in 2024?', id: 'marvel-1b' },
    { title: 'Will Joe Rogan leave Spotify?', id: 'rogan-spotify' },
  ],
};

// Generate realistic Solana-like wallet address
function generateWalletAddress(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let address = '';
  for (let i = 0; i < 44; i++) {
    address += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return address;
}

// Generate realistic transaction signature
function generateSignature(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let sig = '';
  for (let i = 0; i < 88; i++) {
    sig += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return sig;
}

// Generate stats based on tier
function generateStats(tier: string): {
  roi: number;
  winRate: number;
  totalTrades: number;
  totalVolume: number;
  followers: number;
} {
  switch (tier) {
    case 'elite':
      return {
        roi: 45 + Math.random() * 40, // 45-85%
        winRate: 62 + Math.random() * 13, // 62-75%
        totalTrades: 150 + Math.floor(Math.random() * 200), // 150-350
        totalVolume: 50000 + Math.floor(Math.random() * 150000), // $50k-$200k
        followers: 500 + Math.floor(Math.random() * 1500), // 500-2000
      };
    case 'high':
      return {
        roi: 15 + Math.random() * 35, // 15-50%
        winRate: 55 + Math.random() * 12, // 55-67%
        totalTrades: 80 + Math.floor(Math.random() * 120), // 80-200
        totalVolume: 15000 + Math.floor(Math.random() * 50000), // $15k-$65k
        followers: 100 + Math.floor(Math.random() * 400), // 100-500
      };
    case 'medium':
      return {
        roi: -5 + Math.random() * 25, // -5% to +20%
        winRate: 48 + Math.random() * 12, // 48-60%
        totalTrades: 30 + Math.floor(Math.random() * 70), // 30-100
        totalVolume: 3000 + Math.floor(Math.random() * 15000), // $3k-$18k
        followers: 10 + Math.floor(Math.random() * 90), // 10-100
      };
    case 'low':
    default:
      return {
        roi: -15 + Math.random() * 15, // -15% to 0%
        winRate: 40 + Math.random() * 12, // 40-52%
        totalTrades: 10 + Math.floor(Math.random() * 40), // 10-50
        totalVolume: 500 + Math.floor(Math.random() * 3000), // $500-$3500
        followers: Math.floor(Math.random() * 20), // 0-20
      };
  }
}

// Generate random trades for a trader
function generateTrades(
  walletAddress: string,
  tier: string,
  count: number
): Trade[] {
  const trades: Trade[] = [];
  const categories = Object.keys(MARKET_TEMPLATES) as (keyof typeof MARKET_TEMPLATES)[];
  const platforms: ('polymarket' | 'drift' | 'kalshi')[] = ['polymarket', 'drift', 'kalshi'];

  // Time range: last 30 days
  const now = Math.floor(Date.now() / 1000);
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60;

  // Determine win rate for realistic price simulation
  const baseWinRate = tier === 'elite' ? 0.68 : tier === 'high' ? 0.60 : tier === 'medium' ? 0.52 : 0.45;

  for (let i = 0; i < count; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const markets = MARKET_TEMPLATES[category];
    const market = markets[Math.floor(Math.random() * markets.length)];
    const platform = platforms[Math.floor(Math.random() * platforms.length)];

    // Generate realistic trade parameters
    const isWinningTrade = Math.random() < baseWinRate;
    const position: 'yes' | 'no' = Math.random() > 0.5 ? 'yes' : 'no';
    const action: 'buy' | 'sell' = Math.random() > 0.3 ? 'buy' : 'sell'; // More buys than sells

    // Price simulation - winners tend to buy at good prices
    let price: number;
    if (action === 'buy') {
      if (isWinningTrade) {
        // Good entry - bought low
        price = 0.25 + Math.random() * 0.35; // 0.25-0.60
      } else {
        // Bad entry - bought high
        price = 0.55 + Math.random() * 0.35; // 0.55-0.90
      }
    } else {
      // Selling
      if (isWinningTrade) {
        price = 0.60 + Math.random() * 0.30; // Sold high 0.60-0.90
      } else {
        price = 0.20 + Math.random() * 0.30; // Sold low 0.20-0.50
      }
    }

    // Size varies by tier
    const sizeMultiplier = tier === 'elite' ? 5 : tier === 'high' ? 2.5 : tier === 'medium' ? 1 : 0.5;
    const size = Math.floor((20 + Math.random() * 80) * sizeMultiplier); // 10-500 contracts
    const cost = size * price;

    // Random timestamp within last 30 days, weighted towards recent
    const recencyBias = Math.pow(Math.random(), 0.7); // More recent trades
    const timestamp = Math.floor(thirtyDaysAgo + recencyBias * (now - thirtyDaysAgo));

    trades.push({
      id: `trade-${walletAddress.slice(0, 8)}-${i}`,
      walletAddress,
      signature: generateSignature(),
      timestamp,
      platform,
      market: {
        id: market.id,
        title: market.title,
        category,
      },
      position,
      action,
      size,
      price: Math.round(price * 100) / 100,
      cost: Math.round(cost * 100) / 100,
    });
  }

  // Sort by timestamp descending (most recent first)
  trades.sort((a, b) => b.timestamp - a.timestamp);

  return trades;
}

// Main seed function
export async function seedDemoData(redisUrl: string): Promise<{
  tradersCreated: number;
  tradesCreated: number;
}> {
  const redis = new Redis(redisUrl);

  const TRADERS_KEY = 'traders';
  const TRADE_KEY_PREFIX = 'trades:';
  const RECENT_TRADES_KEY = 'trades:recent';

  let tradersCreated = 0;
  let tradesCreated = 0;
  const allRecentTrades: Trade[] = [];

  console.log('Starting demo data seed...');

  for (const template of TRADER_TEMPLATES) {
    const walletAddress = generateWalletAddress();
    const stats = generateStats(template.tier);
    const now = Math.floor(Date.now() / 1000);

    // Create trader profile
    const trader: TraderProfile = {
      username: template.username,
      displayName: template.displayName,
      walletAddress,
      bio: template.bio,
      twitter: template.twitter || undefined,
      verified: template.verified,
      createdAt: now - Math.floor(Math.random() * 365 * 24 * 60 * 60), // Random date within last year
      stats: {
        totalTrades: stats.totalTrades,
        winRate: Math.round(stats.winRate * 10) / 10,
        roi: Math.round(stats.roi * 10) / 10,
        followers: stats.followers,
        totalVolume: Math.round(stats.totalVolume),
      },
    };

    // Save trader to Redis
    await redis.hset(TRADERS_KEY, trader.username, JSON.stringify(trader));
    tradersCreated++;

    // Generate trades for this trader
    const tradeCount = 10 + Math.floor(Math.random() * 40); // 10-50 trades
    const trades = generateTrades(walletAddress, template.tier, tradeCount);

    // Save trades to wallet-specific list
    const walletKey = `${TRADE_KEY_PREFIX}${walletAddress}`;
    for (const trade of trades) {
      await redis.lpush(walletKey, JSON.stringify(trade));

      // Store individual trade by signature for deduplication
      const sigKey = `trade:sig:${trade.signature}`;
      await redis.set(sigKey, JSON.stringify(trade), 'EX', 60 * 60 * 24 * 90);

      tradesCreated++;
    }

    // Keep only last 500 trades per wallet
    await redis.ltrim(walletKey, 0, 499);
    await redis.expire(walletKey, 60 * 60 * 24 * 90); // 90 days TTL

    // Add trades to recent trades pool
    allRecentTrades.push(...trades);

    console.log(`Created trader: ${template.displayName} (${template.tier}) with ${trades.length} trades`);
  }

  // Sort all recent trades and add to global list
  allRecentTrades.sort((a, b) => b.timestamp - a.timestamp);
  const recentTradesToStore = allRecentTrades.slice(0, 1000);

  // Clear and repopulate recent trades
  await redis.del(RECENT_TRADES_KEY);
  for (const trade of recentTradesToStore) {
    await redis.rpush(RECENT_TRADES_KEY, JSON.stringify(trade));
  }
  await redis.expire(RECENT_TRADES_KEY, 60 * 60 * 24 * 90);

  console.log(`\nSeed complete!`);
  console.log(`Traders created: ${tradersCreated}`);
  console.log(`Trades created: ${tradesCreated}`);

  await redis.quit();

  return { tradersCreated, tradesCreated };
}

// Clear all demo data
export async function clearDemoData(redisUrl: string): Promise<void> {
  const redis = new Redis(redisUrl);

  console.log('Clearing demo data...');

  // Clear traders
  await redis.del('traders');

  // Clear all trades (by pattern)
  const tradeKeys = await redis.keys('trades:*');
  const sigKeys = await redis.keys('trade:sig:*');

  if (tradeKeys.length > 0) {
    await redis.del(...tradeKeys);
  }
  if (sigKeys.length > 0) {
    await redis.del(...sigKeys);
  }

  console.log(`Cleared ${tradeKeys.length + sigKeys.length} keys`);

  await redis.quit();
}
