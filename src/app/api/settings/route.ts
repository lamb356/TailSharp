// src/app/api/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Redis from 'ioredis';

export interface UserSettings {
  // Notification preferences
  notifications: {
    tradeExecuted: boolean;
    traderFollowed: boolean;
    priceMovement: boolean;
    emailEnabled: boolean;
    email: string;
  };
  // Copy trading defaults
  copyDefaults: {
    positionSizing: 'percent' | 'fixed';
    defaultAmount: number;
    maxExposure: number;
    dailyLossLimit: number;
  };
  // Connected accounts
  accounts: {
    kalshiConnected: boolean;
    kalshiUsername?: string;
  };
}

const defaultSettings: UserSettings = {
  notifications: {
    tradeExecuted: true,
    traderFollowed: true,
    priceMovement: false,
    emailEnabled: false,
    email: '',
  },
  copyDefaults: {
    positionSizing: 'fixed',
    defaultAmount: 10,
    maxExposure: 100,
    dailyLossLimit: 50,
  },
  accounts: {
    kalshiConnected: false,
  },
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');

  if (!wallet) {
    return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
  }

  const redis = new Redis(process.env.KV_REDIS_URL!);

  try {
    const settingsRaw = await redis.get(`settings:${wallet}`);
    const settings = settingsRaw ? JSON.parse(settingsRaw) : defaultSettings;

    // Get username if claimed
    const tradersData = await redis.hgetall('traders');
    let username = null;
    for (const [, traderJson] of Object.entries(tradersData)) {
      try {
        const trader = JSON.parse(traderJson);
        if (trader.walletAddress === wallet) {
          username = trader.username;
          break;
        }
      } catch {
        // skip invalid entries
      }
    }

    // Get copy settings count
    const copySettingsRaw = await redis.get(`copy-settings:${wallet}`);
    const copySettings = copySettingsRaw ? JSON.parse(copySettingsRaw) : [];
    const activeCopies = copySettings.filter((s: any) => s.isActive).length;

    await redis.quit();

    return NextResponse.json({
      settings: { ...defaultSettings, ...settings },
      profile: {
        wallet,
        username,
        activeCopies,
      },
    });
  } catch (error) {
    console.error('[Settings] Error:', error);
    await redis.quit();
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');

  if (!wallet) {
    return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
  }

  const redis = new Redis(process.env.KV_REDIS_URL!);

  try {
    const body = await request.json();
    const { settings } = body;

    if (!settings) {
      return NextResponse.json({ error: 'Settings required' }, { status: 400 });
    }

    // Merge with defaults to ensure all fields exist
    const mergedSettings = {
      notifications: { ...defaultSettings.notifications, ...settings.notifications },
      copyDefaults: { ...defaultSettings.copyDefaults, ...settings.copyDefaults },
      accounts: { ...defaultSettings.accounts, ...settings.accounts },
    };

    await redis.set(`settings:${wallet}`, JSON.stringify(mergedSettings));
    await redis.quit();

    return NextResponse.json({ success: true, settings: mergedSettings });
  } catch (error) {
    console.error('[Settings] Error:', error);
    await redis.quit();
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}

// DELETE - Stop all copies or delete data
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');
  const action = searchParams.get('action'); // 'stop-copies' or 'delete-data'

  if (!wallet) {
    return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
  }

  const redis = new Redis(process.env.KV_REDIS_URL!);

  try {
    if (action === 'stop-copies') {
      // Stop all active copies
      const copySettingsRaw = await redis.get(`copy-settings:${wallet}`);
      if (copySettingsRaw) {
        const copySettings = JSON.parse(copySettingsRaw);
        const updatedSettings = copySettings.map((s: any) => ({ ...s, isActive: false }));
        await redis.set(`copy-settings:${wallet}`, JSON.stringify(updatedSettings));
      }
      await redis.quit();
      return NextResponse.json({ success: true, message: 'All copies stopped' });
    }

    if (action === 'delete-data') {
      // Delete all user data
      await redis.del(`settings:${wallet}`);
      await redis.del(`copy-settings:${wallet}`);
      await redis.del(`executed-trades:${wallet}`);
      await redis.del(`notifications:${wallet}`);
      await redis.quit();
      return NextResponse.json({ success: true, message: 'All data deleted' });
    }

    await redis.quit();
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[Settings] Error:', error);
    await redis.quit();
    return NextResponse.json(
      { error: 'Failed to perform action' },
      { status: 500 }
    );
  }
}
