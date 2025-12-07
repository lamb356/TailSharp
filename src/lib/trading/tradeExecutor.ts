// src/lib/trading/tradeExecutor.ts
import { ParsedTrade } from './transactionParser';
import { CopyDecision } from './copyEngine';
import { KalshiClient } from '../kalshi/client';
import { findMatchingTicker } from '../kalshi/marketMatcher';

export interface ExecutedTrade {
  id: string;
  originalTrade: ParsedTrade;
  decision: CopyDecision;
  status: 'pending' | 'executed' | 'failed';
  executedAt?: number;
  error?: string;
  ourOrderId?: string;
  kalshiTicker?: string;
  kalshiResponse?: any;
}

/**
 * Execute a copy trade via Kalshi API with smart market matching
 */
export async function executeCopyTrade(
  trade: ParsedTrade,
  decision: CopyDecision
): Promise<ExecutedTrade> {
  const tradeId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    console.log('🔄 Executing copy trade:', {
      market: trade.market,
      side: trade.side,
      amount: decision.positionSize,
      originalTrader: trade.walletAddress,
    });

    // Initialize Kalshi client
    const client = new KalshiClient(
      process.env.KALSHI_API_KEY_ID!,
      process.env.KALSHI_PRIVATE_KEY!,
      process.env.KALSHI_USE_DEMO === 'true'
    );

    // Find matching Kalshi ticker
    console.log('🔍 Finding matching Kalshi market...');
    const kalshiTicker = await findMatchingTicker(client, trade.market);
    
    if (!kalshiTicker) {
      throw new Error(`No matching Kalshi market found for: ${trade.market}`);
    }

    // Check balance before trading
    const balanceData = await client.getBalance();
    console.log('💰 Current Kalshi balance:', balanceData.balance);

    // Calculate position size in number of contracts (with fallback)
    const numContracts = Math.ceil(decision.positionSize || 1);
    
    // Estimate max cost (assuming worst case: buying at 99 cents per contract)
    const estimatedCost = numContracts * 99;
    
    if (balanceData.balance < estimatedCost) {
      throw new Error(`Insufficient balance: have $${balanceData.balance / 100}, need ~$${estimatedCost / 100}`);
    }

    // Execute the order
    console.log('📊 Placing order on Kalshi:', {
      ticker: kalshiTicker,
      contracts: numContracts,
      side: trade.side === 'YES' ? 'yes' : 'no',
    });

    const orderResponse = await client.createOrder(
      kalshiTicker,
      'buy',
      numContracts,
      trade.side === 'YES' ? 'yes' : 'no'
    );

    console.log('✅ Kalshi order executed:', orderResponse);

    return {
      id: tradeId,
      originalTrade: trade,
      decision,
      status: 'executed',
      executedAt: Date.now() / 1000,
      ourOrderId: orderResponse.order?.order_id || 'unknown',
      kalshiTicker,
      kalshiResponse: orderResponse,
    };
  } catch (error) {
    console.error('❌ Trade execution failed:', error);
    
    return {
      id: tradeId,
      originalTrade: trade,
      decision,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
