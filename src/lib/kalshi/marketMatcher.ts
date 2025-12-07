import { KalshiClient, KalshiMarket } from './client';

/**
 * Cache of markets to avoid repeated API calls
 */
let marketCache: KalshiMarket[] = [];
let cacheTimestamp = 0;
const CACHE_DURATION = 1 * 60 * 1000; // 1 minute

/**
 * Get all open markets (with caching)
 */
async function getOpenMarkets(client: KalshiClient): Promise<KalshiMarket[]> {
  const now = Date.now();
  
  if (marketCache.length > 0 && now - cacheTimestamp < CACHE_DURATION) {
    console.log('📦 Using cached markets:', marketCache.length);
    return marketCache;
  }
  
  console.log('🌐 Fetching fresh market data from Kalshi...');
  try {
    marketCache = await client.searchMarkets({ status: 'open', limit: 1000 });
    cacheTimestamp = now;
    console.log(`✅ Fetched ${marketCache.length} markets from Kalshi`);
  } catch (error) {
    console.error('❌ Failed to fetch markets from Kalshi:', error);
    marketCache = [];
  }
  
  return marketCache;
}

/**
 * Find the best matching Kalshi ticker for a trade description
 */
export async function findMatchingTicker(
  client: KalshiClient,
  marketDescription: string
): Promise<string | null> {
  try {
    const markets = await getOpenMarkets(client);
    
    if (markets.length === 0) {
      console.warn('⚠️ No open markets found on Kalshi');
      return null;
    }
    
    // Normalize search string
    const searchTerms = marketDescription
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(term => term.length > 2);
    
    console.log('Searching for market with terms:', searchTerms);
    
    // Score each market based on keyword matches
    const scoredMarkets = markets.map(market => {
      const searchableText = `${market.title} ${market.subtitle || ''} ${market.ticker}`.toLowerCase();
      
      let score = 0;
      for (const term of searchTerms) {
        if (searchableText.includes(term)) {
          score += 1;
        }
      }
      
      return { market, score };
    });
    
    // Sort by score (highest first)
    scoredMarkets.sort((a, b) => b.score - a.score);
    
    const bestMatch = scoredMarkets[0];
    
    if (bestMatch.score === 0) {
      console.warn(`No matching market found for: ${marketDescription}`);
      return null;
    }
    
    console.log(`✅ Found match: ${bestMatch.market.ticker} - "${bestMatch.market.title}" (score: ${bestMatch.score})`);
    return bestMatch.market.ticker;
    
  } catch (error) {
    console.error('Error finding matching ticker:', error);
    return null;
  }
}

/**
 * Clear the market cache (useful for testing)
 */
export function clearMarketCache() {
  marketCache = [];
  cacheTimestamp = 0;
}
