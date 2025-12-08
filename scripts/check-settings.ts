import Redis from 'ioredis';
import * as dotenv from 'dotenv';

// Load .env.local for local development
dotenv.config({ path: '.env.local' });

const redis = new Redis(process.env.KV_REDIS_URL!);

async function checkSettings() {
  try {
    const settingsData = await redis.get('copy-settings');
    console.log('Current copy settings:', settingsData);
    
    if (settingsData) {
      const settings = JSON.parse(settingsData);
      console.log('\nParsed settings:', JSON.stringify(settings, null, 2));
    } else {
      console.log('No settings found.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await redis.quit();
  }
}

checkSettings();
