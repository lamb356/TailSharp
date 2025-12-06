// src/app/api/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Store recent transactions in memory (in production, use a database)
const recentTransactions: Map<string, any[]> = new Map();

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
        timestamp: tx.timestamp,
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
        const existing = recentTransactions.get(walletAddress) || [];
        existing.unshift(enrichedTx);
        // Keep only last 50 transactions per wallet
        recentTransactions.set(walletAddress, existing.slice(0, 50));
      }

      console.log(`Transaction from ${walletAddress}: ${tx.type} - ${tx.description}`);
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

  const transactions = recentTransactions.get(wallet) || [];
  
  return NextResponse.json({ 
    wallet,
    transactions,
    count: transactions.length 
  });
}
