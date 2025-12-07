import { KalshiClient } from '../src/lib/kalshi/client';
import { findMatchingTicker } from '../src/lib/kalshi/marketMatcher';
import { executeCopyTrade } from '../src/lib/trading/tradeExecutor';
import { ParsedTrade } from '../src/lib/trading/transactionParser';
import { CopyDecision } from '../src/lib/trading/copyEngine';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testCopyTradeFlow() {
  console.log('=== Testing TailSharp Copy Trade System ===\n');

  // Step 1: Test Kalshi connection
  console.log('1️⃣ Testing Kalshi connection...');
  const client = new KalshiClient(
    process.env.KALSHI_API_KEY_ID!,
    process.env.KALSHI_PRIVATE_KEY!,
    true
  );

  const balance = await client.getBalance();
  console.log(`✅ Connected! Balance: $${balance.balance / 100}\n`);

  // Step 2: Test market search
  console.log('2️⃣ Testing market search...');
  const markets = await client.searchMarkets({ status: 'open', limit: 5 });
  console.log(`✅ Found ${markets.length} markets`);
  if (markets.length > 0) {
    console.log('Sample markets:');
    markets.slice(0, 3).forEach(m => {
      console.log(`  - ${m.ticker}: ${m.title}`);
    });
  }
  console.log('');

  // Step 3: Test market matching
  console.log('3️⃣ Testing market matcher...');
  const testMarketNames = ['Bitcoin', 'Trump', 'S&P 500', 'Election'];
  
  for (const name of testMarketNames) {
    const ticker = await findMatchingTicker(client, name);
    if (ticker) {
      console.log(`  ✅ "${name}" → ${ticker}`);
    } else {
      console.log(`  ⚠️  No match found for "${name}"`);
    }
  }
  console.log('');

  // Step 4: Test full trade execution (mock trade)
  if (markets.length > 0) {
    console.log('4️⃣ Testing full trade execution...');
    
    const mockTrade: ParsedTrade = {
      signature: 'test-sig-123',
      walletAddress: 'test-wallet',
      timestamp: Date.now() / 1000,
      market: markets[0].title, // Use real market title
      side: 'long',
      amount: 10,
      price: 0.50,
    };

    const mockDecision: CopyDecision = {
      shouldCopy: true,
      reason: 'Test trade',
      positionSize: 1, // Just 1 contract for testing
      followedTrader: {
        address: 'test-wallet',
        allocationPct: 5,
        maxPositionSize: 100,
      },
    };

    console.log(`Attempting to execute: ${mockTrade.market}`);
    const result = await executeCopyTrade(mockTrade, mockDecision);
    
    if (result.status === 'executed') {
      console.log('✅ Trade executed successfully!');
      console.log(`   Order ID: ${result.ourOrderId}`);
      console.log(`   Kalshi Ticker: ${result.kalshiTicker}`);
    } else {
      console.log('❌ Trade failed:', result.error);
    }
  }

  console.log('\n=== Test Complete ===');
}

testCopyTradeFlow().catch(console.error);
