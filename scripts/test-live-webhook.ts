import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testLiveWebhook() {
  console.log('=== Testing Live TailSharp Webhook ===\n');

  // Your deployed Vercel URL
  const webhookUrl = 'https://tail-sharp.vercel.app/api/webhook';

  // Mock Helius webhook payload (prediction market trade)
  const mockTransaction = {
    signature: 'test-' + Date.now(),
    timestamp: Date.now() / 1000,
    type: 'SWAP',
    description: 'Will Elon Musk visit Mars before Aug 1, 2099?', // Real Kalshi market
    source: 'POLYMARKET',
    fee: 5000,
    feePayer: '4Nd1mBQtrMJVYVfKf2PJy9NZUZdTAsp7D4xWLs4gDB4T', // One of your followed wallets
    nativeTransfers: [],
    tokenTransfers: [
      {
        fromUserAccount: '4Nd1mBQtrMJVYVfKf2PJy9NZUZdTAsp7D4xWLs4gDB4T',
        toUserAccount: 'MarketAddress',
        mint: 'USDC',
        tokenAmount: 50,
      }
    ],
    accountData: [
      {
        account: 'market-data',
        nativeBalanceChange: -50000000,
      }
    ],
  };

  console.log('📤 Sending mock transaction to webhook...');
  console.log('URL:', webhookUrl);
  console.log('Payload:', JSON.stringify(mockTransaction, null, 2));
  console.log('');

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockTransaction),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Webhook processed successfully!');
      console.log('Response:', result);
    } else {
      console.log('❌ Webhook failed');
      console.log('Status:', response.status);
      console.log('Response:', result);
    }
  } catch (error) {
    console.error('❌ Error calling webhook:', error);
  }

  console.log('\n=== Test Complete ===');
}

testLiveWebhook();
