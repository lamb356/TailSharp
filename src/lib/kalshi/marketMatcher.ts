import { KalshiClient, KalshiMarket } from './client';

let marketCache: KalshiMarket[] = [];
let cacheTimestamp = 0;
const CACHE_DURATION = 1 * 60 * 1000;

type MarketCategory =
  | 'election_outcome'
  | 'legal'
  | 'policy_action'
  | 'event'
  | 'numeric'
  | 'unknown';

function detectCategory(text: string): MarketCategory {
  const lower = text.toLowerCase();

  const legalPatterns = [
    /\b(lawsuit|lawsuits|sue|sued|suing)\b/,
    /\b(court|courts|judge|judges|ruling|verdict)\b/,
    /\b(trial|trials|prosecute|prosecution|prosecutor)\b/,
    /\b(convicted|conviction|acquit|acquitted|guilty|innocent)\b/,
    /\b(indicted|indictment|charged|charges)\b/,
    /\b(settlement|settle|appeal|appeals)\b/,
    /\b(supreme court|circuit court|district court)\b/,
    /\bjustice\s+(department|system)\b/,
    /\bwin\s+(his|her|the|their)\s+(lawsuit|case|trial|appeal)\b/,
  ];

  for (const pattern of legalPatterns) {
    if (pattern.test(lower)) {
      return 'legal';
    }
  }

  const electionPatterns = [
    /\b(wins?|won|winning)\s+(the\s+)?(election|race|primary|caucus|presidency)\b/,
    /\b(election|race|primary|caucus)\b.*\b(wins?|won|winning)\b/,
    /\b(elected|reelected)\s+(as\s+)?(president|senator|governor|mayor|representative)\b/,
    /\bwho\s+(wins?|will win)\s+(the\s+)?(election|race|presidency)\b/,
    /\b(president|senator|governor|mayor|representative)\s+(election|race)\b/,
    /\bwin\s+(the\s+)?(2024|2025|2026|2028)\s+(election|race|presidency)\b/,
    /\b(2024|2025|2026|2028)\s+(election|race|presidential)\b/,
    /\bpresidential\s+(election|race|winner|candidate)\b/,
    /\b(democrat|republican|gop|dnc|rnc)\s+(wins?|nominee|candidate)\b/,
    /\belectoral\s+(college|vote|votes)\b/,
    /\bwin\s+the\s+white\s+house\b/,
  ];

  for (const pattern of electionPatterns) {
    if (pattern.test(lower)) {
      return 'election_outcome';
    }
  }

  const policyPatterns = [
    /\bwill\s+\w+\s+(sign|veto|pass|approve|reject|reduce|increase|implement|announce|ban|allow)\b/,
    /\b(sign|veto|pass|approve|reject)\s+(a\s+)?(bill|law|legislation|order)\b/,
    /\b(tariff|tax|rate|policy|legislation)\b/,
    /\breduce\s+(inequality|debt|deficit|spending)\b/,
    /\bincrease\s+(spending|taxes|tariffs)\b/,
    /\bexecutive\s+order\b/,
  ];

  for (const pattern of policyPatterns) {
    if (pattern.test(lower)) {
      return 'policy_action';
    }
  }

  const numericPatterns = [
    /\b(above|below|over|under|exceed|reach)\s+\d/,
    /\b\d+(\.\d+)?%/,
    /\b(price|rate|index|gdp|inflation)\b.*\b\d/,
  ];

  for (const pattern of numericPatterns) {
    if (pattern.test(lower)) {
      return 'numeric';
    }
  }

  const eventPatterns = [
    /\bwill\s+.+\s+before\b/,
    /\bby\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{4})\b/i,
    /\bwill\s+.+\s+(happen|occur|take place|visit|travel|go to)\b/,
  ];

  for (const pattern of eventPatterns) {
    if (pattern.test(lower)) {
      return 'event';
    }
  }

  return 'unknown';
}

function extractEntities(text: string): { people: string[]; years: string[]; keywords: string[] } {
  const lower = text.toLowerCase();

  const knownPeople = [
    'trump', 'biden', 'harris', 'desantis', 'newsom', 'pence', 'obama',
    'clinton', 'sanders', 'warren', 'buttigieg', 'haley', 'ramaswamy',
    'scott', 'christie', 'burgum', 'hutchinson', 'elder', 'lake',
    'vance', 'walz', 'pelosi', 'schumer', 'mcconnell', 'musk', 'elon'
  ];

  const people = knownPeople.filter(person => lower.includes(person));

  const yearMatches = lower.match(/\b(202\d|203\d)\b/g) || [];
  const years = [...new Set(yearMatches)];

  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall', 'can', 'this', 'that',
    'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
    'his', 'her', 'its', 'their', 'our', 'your', 'who', 'what', 'when',
    'where', 'why', 'how', 'which', 'there', 'here', 'all', 'each',
    'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such',
    'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'also'
  ]);

  const words = lower.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);
  const keywords = words.filter(w => !stopWords.has(w) && !knownPeople.includes(w));

  return { people, years, keywords };
}

async function getOpenMarkets(client: KalshiClient): Promise<KalshiMarket[]> {
  const now = Date.now();

  if (marketCache.length > 0 && now - cacheTimestamp < CACHE_DURATION) {
    console.log('[MarketMatcher] Using cached markets:', marketCache.length);
    return marketCache;
  }

  console.log('[MarketMatcher] Fetching fresh market data from Kalshi...');
  try {
    marketCache = await client.searchMarkets({ status: 'open', limit: 1000 });
    cacheTimestamp = now;
    console.log('[MarketMatcher] Fetched', marketCache.length, 'markets from Kalshi');
  } catch (error) {
    console.error('[MarketMatcher] Failed to fetch markets from Kalshi:', error);
    marketCache = [];
  }

  return marketCache;
}

export async function findMatchingTicker(
  client: KalshiClient,
  marketDescription: string
): Promise<string | null> {
  try {
    const markets = await getOpenMarkets(client);

    if (markets.length === 0) {
      console.warn('[MarketMatcher] No open markets found on Kalshi');
      return null;
    }

    const sourceCategory = detectCategory(marketDescription);
    const sourceEntities = extractEntities(marketDescription);

    console.log('[MarketMatcher] Source:', marketDescription);
    console.log('[MarketMatcher] Category:', sourceCategory);
    console.log('[MarketMatcher] Entities:', sourceEntities);

    const scoredMarkets = markets.map(market => {
      const marketText = (market.title + ' ' + (market.subtitle || '') + ' ' + market.ticker).toLowerCase();
      const marketCategory = detectCategory(marketText);
      const marketEntities = extractEntities(marketText);

      let score = 0;
      const matchReasons: string[] = [];

      // Check if source has people and if market matches them
      const sourcePeopleCount = sourceEntities.people.length;
      let matchedPeopleCount = 0;

      for (const person of sourceEntities.people) {
        if (marketEntities.people.includes(person)) {
          matchedPeopleCount++;
          score += 30;
          matchReasons.push('person:' + person);
        }
      }

      // CRITICAL: If source mentions specific people, market MUST include at least one
      // Otherwise apply heavy penalty
      if (sourcePeopleCount > 0 && matchedPeopleCount === 0) {
        score -= 200;
        matchReasons.push('missing_person_penalty');
      }

      // Category matching
      const categoryMatch = sourceCategory === marketCategory ||
                           sourceCategory === 'unknown' ||
                           marketCategory === 'unknown';

      if (sourceCategory !== 'unknown' && marketCategory !== 'unknown') {
        if (categoryMatch) {
          score += 50;
          matchReasons.push('category:' + sourceCategory);
        } else {
          score -= 100;
          matchReasons.push('category_mismatch:' + sourceCategory + '!=' + marketCategory);
        }
      }

      // Year matches
      for (const year of sourceEntities.years) {
        if (marketEntities.years.includes(year)) {
          score += 20;
          matchReasons.push('year:' + year);
        }
      }

      // Keyword matches
      for (const keyword of sourceEntities.keywords) {
        if (marketText.includes(keyword)) {
          score += 3;
          matchReasons.push('keyword:' + keyword);
        }
      }

      // Exact phrase match bonus
      const normalizedSource = marketDescription.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
      if (marketText.includes(normalizedSource)) {
        score += 100;
        matchReasons.push('exact_phrase');
      }

      return {
        market,
        score,
        category: marketCategory,
        matchReasons
      };
    });

    scoredMarkets.sort((a, b) => b.score - a.score);

    console.log('[MarketMatcher] Top 5 candidates:');
    scoredMarkets.slice(0, 5).forEach((m, i) => {
      console.log('  ' + (i + 1) + '. [' + m.score + '] ' + m.market.ticker + ' - "' + m.market.title + '" (' + m.category + ') [' + m.matchReasons.join(', ') + ']');
    });

    const bestMatch = scoredMarkets[0];

    // Require minimum score threshold
    if (bestMatch.score < 50) {
      console.warn('[MarketMatcher] No good match found for:', marketDescription, '(best score:', bestMatch.score + ')');
      return null;
    }

    console.log('[MarketMatcher] Selected:', bestMatch.market.ticker, '-', bestMatch.market.title, '(score:', bestMatch.score + ')');
    return bestMatch.market.ticker;

  } catch (error) {
    console.error('[MarketMatcher] Error finding matching ticker:', error);
    return null;
  }
}

export function clearMarketCache() {
  marketCache = [];
  cacheTimestamp = 0;
}
