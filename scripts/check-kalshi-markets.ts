import { KalshiClient } from '@/lib/kalshi/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkMarkets() {
  const client = new KalshiClient(
    process.env.KALSHI_API_KEY_ID!,
    process.env.KALSHI_PRIVATE_KEY!,
    process.env.KALSHI_USE_DEMO === 'true'
  );

  const markets = await client.searchMarkets({ status: 'open', limit: 1000 });
  
  console.log(`\nTotal markets: ${markets.length}\n`);
  
  // Search for Trump-related markets
  const trumpMarkets = markets.filter(m => 
    m.title.toLowerCase().includes('trump') || 
    m.subtitle?.toLowerCase().includes('trump')
  );
  
  console.log(`Trump-related markets (${trumpMarkets.length}):\n`);
  trumpMarkets.slice(0, 10).forEach(m => {
    console.log(`- ${m.ticker}: ${m.title}`);
    if (m.subtitle) console.log(`  ${m.subtitle}`);
  });
}

checkMarkets();
