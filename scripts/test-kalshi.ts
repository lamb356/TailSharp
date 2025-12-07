import { KalshiClient } from '../src/lib/kalshi/client';
import dotenv from 'dotenv';
import path from 'path';

// Explicitly load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testKalshiAuth() {
  console.log('Testing Kalshi API connection...\n');

  // Debug: Check if env vars are loaded
  console.log('KALSHI_API_KEY_ID:', process.env.KALSHI_API_KEY_ID ? '✅ Loaded' : '❌ Missing');
  console.log('KALSHI_PRIVATE_KEY:', process.env.KALSHI_PRIVATE_KEY ? '✅ Loaded' : '❌ Missing');
  console.log('');

  if (!process.env.KALSHI_API_KEY_ID || !process.env.KALSHI_PRIVATE_KEY) {
    console.error('❌ Environment variables not loaded properly');
    return;
  }

  const client = new KalshiClient(
    process.env.KALSHI_API_KEY_ID!,
    process.env.KALSHI_PRIVATE_KEY!,
    true
  );

  try {
    console.log('1. Testing balance endpoint...');
    const balance = await client.getBalance();
    console.log('✅ Balance retrieved:', JSON.stringify(balance, null, 2));
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testKalshiAuth();
