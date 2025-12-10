// src/app/api/webhooks/helius/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { saveTrade, tradeExists, Trade } from '@/lib/trades';
import { parseTransaction, isPredictionMarketTrade } from '@/lib/trading/transactionParser';
import { shouldCopyTrade } from '@/lib/trading/copyEngine';
import { executeCopyTrade } from '@/lib/trading/tradeExecutor';
import Redis from 'ioredis';

const redis = new Redis(process.env.KV_REDIS_URL!);

const HELIUS_AUTH_HEADER = process.env.HELIUS_WEBHOOK_SECRET;

// Known prediction market program IDs on Solana
const PREDICTION_MARKET_PROGRAMS = {
  // Drift Protocol
  drift: 'dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH',
  // Polymarket (if bridged to Solana)
  polymarket: 'poly1111111111111111111111111111111111111111',
  // Hedgehog Markets
  hedgehog: 'HHoG5E6SPqwvMj8GQVDCFCvKGF63eZBwAkCFcFgrMkEE',
  // Monaco Protocol
  monaco: 'monacoUXKtUi6vKsQwaLyxmXKSievfNWEcYXTgkbCih',
};

// Token mints commonly used in prediction markets
const PREDICTION_MARKET_TOKENS = {
  usdc: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  usdt: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
};

interface HeliusTransaction {
  signature: string;
  timestamp: number;
  type: string;
  description: string;
  source: string;
  fee: number;
  feePayer: string;
  nativeTransfers?: Array<{
    fromUserAccount: string;
    toUserAccount: string;
    amount: number;
  }>;
  tokenTransfers?: Array<{
    fromUserAccount: string;
    toUserAccount: string;
    tokenAmount: number;
    mint: string;
    tokenStandard: string;
  }>;
  accountData?: Array<{
    account: string;
    nativeBalanceChange: number;
    tokenBalanceChanges?: Array<{
      mint: string;
      rawTokenAmount: { tokenAmount: string; decimals: number };
      userAccount: string;
    }>;
  }>;
  instructions?: Array<{
    programId: string;
    accounts: string[];
    data: string;
    innerInstructions?: Array<{
      programId: string;
      accounts: string[];
      data: string;
    }>;
  }>;
  events?: {
    swap?: {
      tokenInputs: Array<{ mint: string; amount: number }>;
      tokenOutputs: Array<{ mint: string; amount: number }>;
    };
  };
}

/**
 * Validate Helius webhook signature
 */
function validateWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature || !secret) {
    console.warn('[Webhook] No signature or secret provided, skipping validation');
    return true; // Allow in dev/test environments
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('[Webhook] Signature validation error:', error);
    return false;
  }
}

/**
 * Detect prediction market platform from transaction
 */
function detectPlatform(tx: HeliusTransaction): Trade['platform'] {
  const source = tx.source?.toLowerCase() || '';
  const description = tx.description?.toLowerCase() || '';

  // Check source field
  if (source.includes('drift')) return 'drift';
  if (source.includes('polymarket')) return 'polymarket';
  if (source.includes('kalshi')) return 'kalshi';

  // Check program IDs
  const programIds = tx.instructions?.map((i) => i.programId) || [];
  for (const progId of programIds) {
    if (progId === PREDICTION_MARKET_PROGRAMS.drift) return 'drift';
    if (progId === PREDICTION_MARKET_PROGRAMS.hedgehog) return 'unknown';
    if (progId === PREDICTION_MARKET_PROGRAMS.monaco) return 'unknown';
  }

  // Check description for keywords
  if (description.includes('drift')) return 'drift';
  if (description.includes('polymarket')) return 'polymarket';

  return 'unknown';
}

/**
 * Extract market information from transaction
 */
function extractMarketInfo(tx: HeliusTransaction): {
  id: string;
  title: string;
  category?: string;
} {
  const description = tx.description || 'Unknown Market';

  // Try to extract market title from description
  let title = description;
  let id = 'unknown';
  let category: string | undefined;

  // Common patterns in prediction market transactions
  const patterns = [
    /market[:\s]+([^,]+)/i,
    /bet[:\s]+([^,]+)/i,
    /(?:will|won't)\s+(.+?)(?:\?|$)/i,
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match) {
      title = match[1].trim();
      break;
    }
  }

  // Extract category from keywords
  const categoryKeywords: Record<string, string[]> = {
    politics: ['trump', 'biden', 'election', 'president', 'congress', 'senate'],
    crypto: ['bitcoin', 'btc', 'ethereum', 'eth', 'solana', 'sol', 'crypto'],
    economics: ['fed', 'rate', 'inflation', 'gdp', 'cpi', 'jobs', 'unemployment'],
    sports: ['nfl', 'nba', 'mlb', 'super bowl', 'world series', 'championship'],
    tech: ['apple', 'google', 'tesla', 'ai', 'openai', 'microsoft'],
  };

  const lowerDesc = description.toLowerCase();
  for (const [cat, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some((kw) => lowerDesc.includes(kw))) {
      category = cat;
      break;
    }
  }

  // Generate ID from signature or description
  id = tx.signature.slice(0, 16);

  return { id, title, category };
}

/**
 * Determine position (yes/no) from transaction
 */
function extractPosition(tx: HeliusTransaction): 'yes' | 'no' {
  const description = tx.description?.toLowerCase() || '';

  // Check for explicit yes/no in description
  if (description.includes(' yes') || description.includes('yes ')) return 'yes';
  if (description.includes(' no') || description.includes('no ')) return 'no';

  // Check token outputs - YES tokens typically have different mints than NO tokens
  const events = tx.events;
  if (events?.swap?.tokenOutputs) {
    // Heuristic: first output often indicates position type
    // This would need to be refined based on actual market implementations
  }

  // Default to yes if can't determine
  return 'yes';
}

/**
 * Extract trade size and price from transaction
 */
function extractTradeDetails(tx: HeliusTransaction): {
  size: number;
  price: number;
  cost: number;
  action: 'buy' | 'sell';
} {
  let size = 0;
  let cost = 0;
  let price = 0.5; // Default price
  let action: 'buy' | 'sell' = 'buy';

  // Check token transfers for USDC/USDT (cost)
  const stableTransfers = tx.tokenTransfers?.filter(
    (t) =>
      t.mint === PREDICTION_MARKET_TOKENS.usdc ||
      t.mint === PREDICTION_MARKET_TOKENS.usdt
  );

  if (stableTransfers && stableTransfers.length > 0) {
    // Find the transfer from the user (buy) or to the user (sell)
    const outgoing = stableTransfers.find((t) => t.fromUserAccount === tx.feePayer);
    const incoming = stableTransfers.find((t) => t.toUserAccount === tx.feePayer);

    if (outgoing) {
      cost = outgoing.tokenAmount;
      action = 'buy';
    } else if (incoming) {
      cost = incoming.tokenAmount;
      action = 'sell';
    }
  }

  // Check swap events for better price/size data
  if (tx.events?.swap) {
    const inputs = tx.events.swap.tokenInputs;
    const outputs = tx.events.swap.tokenOutputs;

    if (inputs.length > 0 && outputs.length > 0) {
      const stableInput = inputs.find(
        (i) =>
          i.mint === PREDICTION_MARKET_TOKENS.usdc ||
          i.mint === PREDICTION_MARKET_TOKENS.usdt
      );
      const stableOutput = outputs.find(
        (o) =>
          o.mint === PREDICTION_MARKET_TOKENS.usdc ||
          o.mint === PREDICTION_MARKET_TOKENS.usdt
      );

      if (stableInput) {
        cost = stableInput.amount;
        action = 'buy';
        // Position tokens are likely the output
        const positionOutput = outputs.find(
          (o) =>
            o.mint !== PREDICTION_MARKET_TOKENS.usdc &&
            o.mint !== PREDICTION_MARKET_TOKENS.usdt
        );
        if (positionOutput) {
          size = positionOutput.amount;
          price = cost / size;
        }
      } else if (stableOutput) {
        cost = stableOutput.amount;
        action = 'sell';
        const positionInput = inputs.find(
          (i) =>
            i.mint !== PREDICTION_MARKET_TOKENS.usdc &&
            i.mint !== PREDICTION_MARKET_TOKENS.usdt
        );
        if (positionInput) {
          size = positionInput.amount;
          price = cost / size;
        }
      }
    }
  }

  // Fallback: estimate from native transfers or token amounts
  if (size === 0 && tx.tokenTransfers && tx.tokenTransfers.length > 0) {
    const nonStableTransfer = tx.tokenTransfers.find(
      (t) =>
        t.mint !== PREDICTION_MARKET_TOKENS.usdc &&
        t.mint !== PREDICTION_MARKET_TOKENS.usdt
    );
    if (nonStableTransfer) {
      size = nonStableTransfer.tokenAmount;
    }
  }

  // If still no size, use a default
  if (size === 0) size = 100;
  if (cost === 0) cost = size * price;

  return { size, price, cost, action };
}

/**
 * Parse Helius transaction into our Trade format
 */
function parseHeliusTrade(tx: HeliusTransaction): Trade | null {
  try {
    const platform = detectPlatform(tx);
    const market = extractMarketInfo(tx);
    const position = extractPosition(tx);
    const { size, price, cost, action } = extractTradeDetails(tx);

    const trade: Trade = {
      id: `${tx.signature}-${Date.now()}`,
      walletAddress: tx.feePayer,
      signature: tx.signature,
      timestamp: tx.timestamp || Math.floor(Date.now() / 1000),
      platform,
      market,
      position,
      action,
      size,
      price,
      cost,
      raw: tx,
    };

    return trade;
  } catch (error) {
    console.error('[Webhook] Failed to parse trade:', error);
    return null;
  }
}

/**
 * Check if transaction is a prediction market trade
 */
function isPredictionMarketTransaction(tx: HeliusTransaction): boolean {
  // Use existing parser logic
  if (isPredictionMarketTrade(tx)) {
    return true;
  }

  // Additional checks for Helius-specific data
  const programIds = tx.instructions?.map((i) => i.programId) || [];

  // Check for known prediction market programs
  for (const progId of programIds) {
    if (Object.values(PREDICTION_MARKET_PROGRAMS).includes(progId)) {
      return true;
    }
  }

  // Check for swap events with non-standard tokens (potential outcome tokens)
  if (tx.events?.swap) {
    const outputs = tx.events.swap.tokenOutputs || [];
    const hasOutcomeToken = outputs.some(
      (o) =>
        o.mint !== PREDICTION_MARKET_TOKENS.usdc &&
        o.mint !== PREDICTION_MARKET_TOKENS.usdt
    );
    if (hasOutcomeToken) {
      return true;
    }
  }

  return false;
}

/**
 * Trigger copy trade logic for followers
 */
async function triggerCopyTrades(trade: Trade): Promise<void> {
  try {
    // Get copy settings from Redis
    const settingsKey = 'copy-settings';
    const settingsData = await redis.get(settingsKey);
    const settings = settingsData ? JSON.parse(settingsData) : [];

    // Convert to ParsedTrade format for existing copy engine
    const parsedTrade = {
      market: trade.market.title,
      side: trade.position.toUpperCase() as 'YES' | 'NO',
      amount: trade.size,
      price: trade.price,
      walletAddress: trade.walletAddress,
      signature: trade.signature,
      timestamp: trade.timestamp,
    };

    const decision = shouldCopyTrade(parsedTrade, settings);

    if (decision.shouldCopy) {
      console.log('[Webhook] Triggering copy trade:', {
        trader: trade.walletAddress,
        market: trade.market.title,
        position: trade.position,
        size: decision.positionSize,
      });

      const executedTrade = await executeCopyTrade(parsedTrade, decision);

      // Store executed trade
      const tradesKey = 'executed-trades';
      await redis.lpush(tradesKey, JSON.stringify(executedTrade));
      await redis.ltrim(tradesKey, 0, 99);

      console.log('[Webhook] Copy trade executed:', executedTrade.status);
    } else {
      console.log('[Webhook] Trade not copied:', decision.reason);
    }
  } catch (error) {
    console.error('[Webhook] Failed to trigger copy trades:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-helius-signature');

    // Validate webhook signature
    if (HELIUS_AUTH_HEADER) {
      const isValid = validateWebhookSignature(rawBody, signature, HELIUS_AUTH_HEADER);
      if (!isValid) {
        console.error('[Webhook] Invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);
    console.log('[Webhook] Helius webhook received:', payload.length || 1, 'transactions');

    const transactions: HeliusTransaction[] = Array.isArray(payload)
      ? payload
      : [payload];

    let processed = 0;
    let skipped = 0;
    let trades: Trade[] = [];

    for (const tx of transactions) {
      // Check for duplicate
      if (await tradeExists(tx.signature)) {
        console.log('[Webhook] Duplicate transaction, skipping:', tx.signature);
        skipped++;
        continue;
      }

      // Check if it's a prediction market trade
      if (!isPredictionMarketTransaction(tx)) {
        console.log('[Webhook] Not a prediction market trade:', tx.signature);
        skipped++;
        continue;
      }

      // Parse the trade
      const trade = parseHeliusTrade(tx);
      if (!trade) {
        console.log('[Webhook] Failed to parse trade:', tx.signature);
        skipped++;
        continue;
      }

      // Save to Redis
      await saveTrade(trade);
      trades.push(trade);
      processed++;

      console.log('[Webhook] Trade saved:', {
        wallet: trade.walletAddress,
        market: trade.market.title,
        position: trade.position,
        size: trade.size,
        platform: trade.platform,
      });

      // Trigger copy trade logic
      await triggerCopyTrades(trade);
    }

    return NextResponse.json({
      success: true,
      processed,
      skipped,
      trades: trades.map((t) => ({
        signature: t.signature,
        wallet: t.walletAddress,
        market: t.market.title,
        position: t.position,
      })),
    });
  } catch (error) {
    console.error('[Webhook] Processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook', details: String(error) },
      { status: 500 }
    );
  }
}

// GET endpoint for testing/health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/webhooks/helius',
    description: 'Helius webhook receiver for prediction market trades',
    timestamp: new Date().toISOString(),
  });
}
