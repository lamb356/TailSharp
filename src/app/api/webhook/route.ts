// src/app/api/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    console.log('Webhook received:', JSON.stringify(payload, null, 2));

    // Helius sends an array of transactions
    const transactions = Array.isArray(payload) ? payload : [payload];

    for (const tx of transactions) {
      // Extract relevant info from enhanced transaction
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

      // Store by fee payer (the wallet we're tracking)
      const walletAddress = tx.feePayer;
      if (walletAddress) {
        const key = `wallet:${walletAddress}:transactions`;
        
        // Get existing transactions
        const existing = await kv.lrange(key, 0, 49) || [];
        
        // Add new transaction to the front
        await kv.lpush(key, JSON.stringify(enrichedTx));
        
        // Keep only last 50 transactions
        await kv.ltrim(key, 0, 49);
        
        // Set expiration to 30 days
        await kv.expire(key, 60 * 60 * 24 * 30);

        console.log(`Transaction from ${walletAddress}: ${tx.type} - ${tx.description}`);
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}

// GET endpoint to retrieve recent transactions for a wallet
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');

  if (!wallet) {
    return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
  }

  try {
    const key = `wallet:${wallet}:transactions`;
    const transactions = await kv.lrange(key, 0, 49);
    
    // Parse JSON strings back to objects
    const parsed = transactions.map((tx: any) => 
      typeof tx === 'string' ? JSON.parse(tx) : tx
    );

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
