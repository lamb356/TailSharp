// src/app/api/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Redis from 'ioredis';
import { parseTransaction, isPredictionMarketTrade } from '@/lib/trading/transactionParser';
import { shouldCopyTrade } from '@/lib/trading/copyEngine';
import { executeCopyTrade } from '@/lib/trading/tradeExecutor';

// Initialize Redis with the URL directly
const redis = new Redis(process.env.KV_REDIS_URL!);

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    console.log('Webhook received:', JSON.stringify(payload, null, 2));

    const transactions = Array.isArray(payload) ? payload : [payload];

    for (const tx of transactions) {
      const enrichedTx = {
        signature: tx.signature,
        timestamp: tx.timestamp || Date.now() / 1000,
        type: tx.type,
        description: tx.description,
        source: tx.source,
        fee: tx.fee,
        feePayer: tx.feePayer,
        nativeTransfers: tx.nativeTransfers || [],
        tokenTransfers: tx.tokenTransfers || [],
        accountData: tx.accountData || [],
      };

      const walletAddress = tx.feePayer;
      if (walletAddress) {
        const key = `wallet:${walletAddress}:transactions`;
        
        await redis.lpush(key, JSON.stringify(enrichedTx));
        await redis.ltrim(key, 0, 49);
        await redis.expire(key, 60 * 60 * 24 * 30);

        console.log(`Transaction stored: ${tx.signature}`);

        if (isPredictionMarketTrade(tx)) {
          const parsedTrade = parseTransaction(tx);
          
          if (parsedTrade) {
            console.log('Prediction market trade detected:', parsedTrade);

            const settingsKey = 'copy-settings';
            const settingsData = await redis.get(settingsKey);
            const settings = settingsData ? JSON.parse(settingsData) : [];

            const decision = shouldCopyTrade(parsedTrade, settings);

            if (decision.shouldCopy) {
              console.log('Executing auto-copy trade:', decision);

              const executedTrade = await executeCopyTrade(parsedTrade, decision);

              const tradesKey = 'executed-trades';
              await redis.lpush(tradesKey, JSON.stringify(executedTrade));
              await redis.ltrim(tradesKey, 0, 99);

              console.log('Copy trade executed:', executedTrade);
            } else {
              console.log('Trade not copied:', decision.reason);
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');

  if (!wallet) {
    return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
  }

  try {
    const key = `wallet:${wallet}:transactions`;
    const transactions = await redis.lrange(key, 0, 49);
    
    const parsed = transactions.map((tx: string) => JSON.parse(tx));

    return NextResponse.json({
      wallet,
      transactions: parsed,
      count: parsed.length
    });
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}
