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
    
    // Normalize and extract key terms
    const normalized = marketDescription.toLowerCase().trim();
    
    // Extract key entities and concepts
    const searchTerms = normalized
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(term => term.length > 2)
      // Filter out common words
      .filter(term => !['the', 'will', 'wins', 'win', 'election', 'market'].includes(term));
    
    console.log('🔍 Searching for market with terms:', searchTerms);
    
    // Score each market with weighted criteria
    const scoredMarkets = markets.map(market => {
      const searchableText = `${market.title} ${market.subtitle || ''} ${market.ticker}`.toLowerCase();
      
      let score = 0;
      
      // Exact phrase match (highest weight)
      if (searchableText.includes(normalized)) {
        score += 100;
      }
      
      // Individual term matches
      for (const term of searchTerms) {
        if (searchableText.includes(term)) {
          // Higher score for title matches
          if (market.title.toLowerCase().includes(term)) {
            score += 3;
          } else {
            score += 1;
          }
        }
      }
      
      // Bonus for multiple term matches (likely more relevant)
      const matchedTerms = searchTerms.filter(term => searchableText.includes(term));
      if (matchedTerms.length > 1) {
        score += matchedTerms.length * 2;
      }
      
      return { market, score, matchedTerms: matchedTerms.length };
    });
    
    // Sort by score (highest first)
    scoredMarkets.sort((a, b) => {
      // Prioritize by score, then by number of matched terms
      if (b.score !== a.score) return b.score - a.score;
      return b.matchedTerms - a.matchedTerms;
    });
    
    const bestMatch = scoredMarkets[0];
    
    // Require minimum score threshold
    if (bestMatch.score < 3) {
      console.warn(`❌ No good match found for: "${marketDescription}" (best score: ${bestMatch.score})`);
      return null;
    }
    
    console.log(`✅ Found match: ${bestMatch.market.ticker} - "${bestMatch.market.title}" (score: ${bestMatch.score}, matched terms: ${bestMatch.matchedTerms})`);
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
