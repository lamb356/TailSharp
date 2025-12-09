import { ParsedTrade } from './transactionParser';
import { CopyDecision } from './copyEngine';
import { KalshiClient } from '../kalshi/client';
import { findMatchingTicker } from '../kalshi/marketMatcher';
import { IS_SIMULATION_SERVER } from '../env';

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
  isSimulation?: boolean;
}

export async function executeCopyTrade(
  trade: ParsedTrade,
  decision: CopyDecision
): Promise<ExecutedTrade> {
  const tradeId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  const isSimulation = IS_SIMULATION_SERVER;

  try {
    console.log('[TradeExecutor] Executing copy trade:', {
      market: trade.market,
      side: trade.side,
      amount: decision.positionSize,
      originalTrader: trade.walletAddress,
      simulation: isSimulation,
    });

    const client = new KalshiClient(
      process.env.KALSHI_API_KEY_ID!,
      process.env.KALSHI_PRIVATE_KEY!,
      process.env.KALSHI_USE_DEMO === 'true'
    );

    console.log('[TradeExecutor] Finding matching Kalshi market...');
    const kalshiTicker = await findMatchingTicker(client, trade.market);

    if (!kalshiTicker) {
      throw new Error('No matching Kalshi market found for: ' + trade.market);
    }

    const numContracts = Math.ceil(decision.positionSize || 1);

    if (isSimulation) {
      console.log('[TradeExecutor] SIMULATION MODE: Skipping real Kalshi API calls');
      console.log('[TradeExecutor] Simulated order:', {
        ticker: kalshiTicker,
        contracts: numContracts,
        side: trade.side === 'YES' ? 'yes' : 'no',
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      return {
        id: tradeId,
        originalTrade: trade,
        decision,
        status: 'executed',
        executedAt: Date.now() / 1000,
        ourOrderId: 'sim-order-' + tradeId,
        kalshiTicker,
        kalshiResponse: {
          simulated: true,
          order: {
            order_id: 'sim-order-' + tradeId,
            ticker: kalshiTicker,
            side: trade.side === 'YES' ? 'yes' : 'no',
            action: 'buy',
            count: numContracts,
            status: 'filled',
          }
        },
        isSimulation: true,
      };
    }

    console.log('[TradeExecutor] LIVE MODE: Checking Kalshi balance...');
    const balanceData = await client.getBalance();
    console.log('[TradeExecutor] Current balance:', balanceData.balance);

    const estimatedCost = numContracts * 99;

    if (balanceData.balance < estimatedCost) {
      throw new Error('Insufficient balance: have $' + (balanceData.balance / 100) + ', need ~$' + (estimatedCost / 100));
    }

    console.log('[TradeExecutor] Placing order on Kalshi:', {
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

    console.log('[TradeExecutor] Kalshi order executed:', orderResponse);

    return {
      id: tradeId,
      originalTrade: trade,
      decision,
      status: 'executed',
      executedAt: Date.now() / 1000,
      ourOrderId: orderResponse.order?.order_id || 'unknown',
      kalshiTicker,
      kalshiResponse: orderResponse,
      isSimulation: false,
    };
  } catch (error) {
    console.error('[TradeExecutor] Trade execution failed:', error);

    return {
      id: tradeId,
      originalTrade: trade,
      decision,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      isSimulation,
    };
  }
}