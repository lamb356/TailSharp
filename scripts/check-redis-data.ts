import Redis from 'ioredis';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const redis = new Redis(process.env.KV_REDIS_URL!);

async function checkRedisData() {
  console.log('=== Checking Redis Data ===\n');

  try {
    // Check stored transactions
    console.log('1️⃣ Checking stored transactions...');
    const txKey = 'wallet:TestWallet123ABC:transactions';
    const transactions = await redis.lrange(txKey, 0, 10);
    console.log(`Found ${transactions.length} transactions for TestWallet123ABC`);
    if (transactions.length > 0) {
      console.log('Latest transaction:', JSON.parse(transactions[0]));
    }
    console.log('');

    // Check copy settings
    console.log('2️⃣ Checking copy settings...');
    const settingsData = await redis.get('copy-settings');
    const settings = settingsData ? JSON.parse(settingsData) : [];
    console.log(`Found ${settings.length} followed wallets`);
    console.log('Settings:', settings);
    console.log('');

    // Check executed trades
    console.log('3️⃣ Checking executed trades...');
    const executedTrades = await redis.lrange('executed-trades', 0, 10);
    console.log(`Found ${executedTrades.length} executed trades`);
    if (executedTrades.length > 0) {
      console.log('Latest trade:', JSON.parse(executedTrades[0]));
    } else {
      console.log('⚠️  No executed trades found - trade may not have passed copy engine checks');
    }

    await redis.quit();
    console.log('\n=== Check Complete ===');
  } catch (error) {
    console.error('Error checking Redis:', error);
    await redis.quit();
  }
}

checkRedisData();
