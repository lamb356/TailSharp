import { NextRequest, NextResponse } from 'next/server';
import Redis from 'ioredis';
import { parseTransaction, isPredictionMarketTrade } from '@/lib/trading/transactionParser';
import { shouldCopyTrade } from '@/lib/trading/copyEngine';
import { executeCopyTrade } from '@/lib/trading/tradeExecutor';

const redis = new Redis(process.env.KV_REDIS_URL!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const marketDescription = body.market || 'Will Trump reduce inequality';
    const side = body.side || 'YES';
    const amount = body.amount || 50;
    const walletAddress = body.wallet || '4Nd1mBzzpXdGDDB4T';

    console.log('\n========== PIPELINE TEST ==========');
    console.log('Input:', { marketDescription, side, amount, walletAddress });
    console.log('====================================\n');

    const mockTransaction = {
      signature: 'test-' + Date.now(),
      timestamp: Math.floor(Date.now() / 1000),
      type: 'SWAP',
      description: marketDescription,
      source: 'POLYMARKET',
      fee: 5000,
      feePayer: walletAddress,
      nativeTransfers: [],
      tokenTransfers: [],
      accountData: [],
    };

    console.log('[Pipeline] Step 1: Checking if prediction market trade...');
    const isPrediction = isPredictionMarketTrade(mockTransaction);
    console.log('[Pipeline] Is prediction market trade:', isPrediction);

    if (!isPrediction) {
      return NextResponse.json({
        success: false,
        step: 'isPredictionMarketTrade',
        error: 'Transaction not recognized as prediction market trade',
      });
    }

    console.log('[Pipeline] Step 2: Parsing transaction...');
    const parsedTrade = parseTransaction(mockTransaction);
    console.log('[Pipeline] Parsed trade:', parsedTrade);

    if (!parsedTrade) {
      return NextResponse.json({
        success: false,
        step: 'parseTransaction',
        error: 'Failed to parse transaction',
      });
    }

    console.log('[Pipeline] Step 3: Checking copy settings...');
    const settingsData = await redis.get('copy-settings');
    const settings = settingsData ? JSON.parse(settingsData) : [];
    console.log('[Pipeline] Copy settings:', settings);

    const decision = shouldCopyTrade(parsedTrade, settings);
    console.log('[Pipeline] Copy decision:', decision);

    if (!decision.shouldCopy) {
      return NextResponse.json({
        success: false,
        step: 'shouldCopyTrade',
        error: decision.reason,
        settings: settings,
        hint: settings.length === 0 
          ? 'No copy settings found. Add a trader in /settings first.' 
          : 'Trader not found or not active in settings.',
      });
    }

    console.log('[Pipeline] Step 4: Executing copy trade...');
    const executedTrade = await executeCopyTrade(parsedTrade, decision);
    console.log('[Pipeline] Executed trade:', executedTrade);

    console.log('[Pipeline] Step 5: Saving to Redis...');
    await redis.lpush('executed-trades', JSON.stringify(executedTrade));
    await redis.ltrim('executed-trades', 0, 99);

    console.log('[Pipeline] Complete!');

    return NextResponse.json({
      success: true,
      trade: executedTrade,
      steps: {
        isPredictionMarketTrade: true,
        parseTransaction: true,
        shouldCopyTrade: true,
        executeCopyTrade: executedTrade.status === 'executed',
        savedToRedis: true,
      },
    });

  } catch (error) {
    console.error('[Pipeline] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    usage: 'POST to this endpoint with optional body: { market, side, amount, wallet }',
    example: {
      market: 'Will Trump reduce inequality',
      side: 'YES',
      amount: 50,
      wallet: '4Nd1mBzzpXdGDDB4T',
    },
  });
}