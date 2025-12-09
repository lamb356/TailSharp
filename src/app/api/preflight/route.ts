import { NextResponse } from 'next/server';
import Redis from 'ioredis';
import { KalshiClient } from '@/lib/kalshi/client';
import { IS_SIMULATION_SERVER } from '@/lib/env';

export async function GET() {
  const checks: {
    name: string;
    status: 'pass' | 'fail' | 'warn';
    message: string;
  }[] = [];

  // Check 1: Environment variables
  const hasKalshiKeyId = !!process.env.KALSHI_API_KEY_ID;
  const hasKalshiPrivateKey = !!process.env.KALSHI_PRIVATE_KEY;
  const isDemo = process.env.KALSHI_USE_DEMO === 'true';
  
  checks.push({
    name: 'Kalshi API Key ID',
    status: hasKalshiKeyId ? 'pass' : 'fail',
    message: hasKalshiKeyId ? 'API Key ID is configured' : 'Missing KALSHI_API_KEY_ID',
  });

  checks.push({
    name: 'Kalshi Private Key',
    status: hasKalshiPrivateKey ? 'pass' : 'fail',
    message: hasKalshiPrivateKey ? 'Private key is configured' : 'Missing KALSHI_PRIVATE_KEY',
  });

  checks.push({
    name: 'Kalshi Environment',
    status: isDemo ? 'warn' : 'pass',
    message: isDemo ? 'Using DEMO API (not production)' : 'Using PRODUCTION API',
  });

  checks.push({
    name: 'Simulation Mode',
    status: IS_SIMULATION_SERVER ? 'warn' : 'pass',
    message: IS_SIMULATION_SERVER 
      ? 'Simulation mode ON - trades will NOT execute' 
      : 'Simulation mode OFF - trades WILL execute with real money',
  });

  // Check 2: Redis connection
  let redisOk = false;
  try {
    const redis = new Redis(process.env.KV_REDIS_URL!);
    await redis.ping();
    redisOk = true;
    await redis.quit();
  } catch (e) {
    redisOk = false;
  }

  checks.push({
    name: 'Redis Connection',
    status: redisOk ? 'pass' : 'fail',
    message: redisOk ? 'Redis is connected' : 'Cannot connect to Redis',
  });

  // Check 3: Kalshi API connection and balance
  let kalshiOk = false;
  let balance = 0;
  try {
    const client = new KalshiClient(
      process.env.KALSHI_API_KEY_ID!,
      process.env.KALSHI_PRIVATE_KEY!,
      isDemo
    );
    const balanceData = await client.getBalance();
    balance = balanceData.balance || 0;
    kalshiOk = true;
  } catch (e) {
    kalshiOk = false;
  }

  checks.push({
    name: 'Kalshi API Connection',
    status: kalshiOk ? 'pass' : 'fail',
    message: kalshiOk ? 'Successfully connected to Kalshi' : 'Cannot connect to Kalshi API',
  });

  checks.push({
    name: 'Kalshi Balance',
    status: kalshiOk ? (balance > 0 ? 'pass' : 'warn') : 'fail',
    message: kalshiOk ? 'Balance: $' + (balance / 100).toFixed(2) : 'Could not fetch balance',
  });

  // Check 4: Copy settings
  let settingsCount = 0;
  let activeCount = 0;
  let totalAllocation = 0;
  try {
    const redis = new Redis(process.env.KV_REDIS_URL!);
    const settingsData = await redis.get('copy-settings');
    const settings = settingsData ? JSON.parse(settingsData) : [];
    settingsCount = settings.length;
    activeCount = settings.filter((s: any) => s.isActive).length;
    totalAllocation = settings.reduce((sum: number, s: any) => sum + (s.allocationUsd || 0), 0);
    await redis.quit();
  } catch (e) {
    // ignore
  }

  checks.push({
    name: 'Tracked Traders',
    status: settingsCount > 0 ? 'pass' : 'warn',
    message: settingsCount + ' traders tracked, ' + activeCount + ' active',
  });

  checks.push({
    name: 'Total Allocation',
    status: totalAllocation > 0 ? 'pass' : 'warn',
    message: '$' + totalAllocation.toFixed(2) + ' allocated for copy trading',
  });

  // Summary
  const failCount = checks.filter(c => c.status === 'fail').length;
  const warnCount = checks.filter(c => c.status === 'warn').length;
  const passCount = checks.filter(c => c.status === 'pass').length;

  let readyForLive = failCount === 0 && !IS_SIMULATION_SERVER && !isDemo;

  return NextResponse.json({
    summary: {
      pass: passCount,
      warn: warnCount,
      fail: failCount,
      readyForLive,
      currentMode: IS_SIMULATION_SERVER ? 'SIMULATION' : 'LIVE',
      kalshiEnv: isDemo ? 'DEMO' : 'PRODUCTION',
    },
    checks,
    instructions: readyForLive 
      ? 'All checks passed. System is ready for live trading.'
      : IS_SIMULATION_SERVER
        ? 'Set NEXT_PUBLIC_TAILSHARP_SIMULATION=false in .env.local to enable live trading'
        : 'Fix failing checks before enabling live trading',
  });
}