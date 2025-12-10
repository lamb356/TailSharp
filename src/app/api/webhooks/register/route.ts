// src/app/api/webhooks/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Redis from 'ioredis';

const HELIUS_API_KEY = process.env.HELIUS_API_KEY || process.env.NEXT_PUBLIC_HELIUS_API_KEY;
const WEBHOOK_SECRET = process.env.HELIUS_WEBHOOK_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://tail-sharp.vercel.app';
const WEBHOOK_URL = `${APP_URL}/api/webhooks/helius`;

const redis = new Redis(process.env.KV_REDIS_URL!);

const REGISTERED_WALLETS_KEY = 'helius:registered-wallets';
const WEBHOOK_ID_KEY = 'helius:webhook-id';

interface HeliusWebhook {
  webhookID: string;
  webhookURL: string;
  transactionTypes: string[];
  accountAddresses: string[];
  webhookType: string;
}

/**
 * Get existing webhooks from Helius
 */
async function getExistingWebhooks(): Promise<HeliusWebhook[]> {
  const response = await fetch(
    `https://api.helius.xyz/v0/webhooks?api-key=${HELIUS_API_KEY}`
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch webhooks: ${error}`);
  }

  return response.json();
}

/**
 * Get a specific webhook by ID
 */
async function getWebhook(webhookId: string): Promise<HeliusWebhook | null> {
  const response = await fetch(
    `https://api.helius.xyz/v0/webhooks/${webhookId}?api-key=${HELIUS_API_KEY}`
  );

  if (!response.ok) {
    if (response.status === 404) return null;
    const error = await response.text();
    throw new Error(`Failed to fetch webhook: ${error}`);
  }

  return response.json();
}

/**
 * Create a new webhook
 */
async function createWebhook(addresses: string[]): Promise<HeliusWebhook> {
  const body: Record<string, any> = {
    webhookURL: WEBHOOK_URL,
    transactionTypes: ['ANY'],
    accountAddresses: addresses,
    webhookType: 'enhanced',
  };

  // Add auth header if secret is configured
  if (WEBHOOK_SECRET) {
    body.authHeader = WEBHOOK_SECRET;
  }

  const response = await fetch(
    `https://api.helius.xyz/v0/webhooks?api-key=${HELIUS_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create webhook: ${error}`);
  }

  return response.json();
}

/**
 * Update an existing webhook
 */
async function updateWebhook(
  webhookId: string,
  addresses: string[]
): Promise<HeliusWebhook> {
  const body: Record<string, any> = {
    webhookURL: WEBHOOK_URL,
    transactionTypes: ['ANY'],
    accountAddresses: addresses,
    webhookType: 'enhanced',
  };

  if (WEBHOOK_SECRET) {
    body.authHeader = WEBHOOK_SECRET;
  }

  const response = await fetch(
    `https://api.helius.xyz/v0/webhooks/${webhookId}?api-key=${HELIUS_API_KEY}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update webhook: ${error}`);
  }

  return response.json();
}

/**
 * Delete a webhook
 */
async function deleteWebhook(webhookId: string): Promise<void> {
  const response = await fetch(
    `https://api.helius.xyz/v0/webhooks/${webhookId}?api-key=${HELIUS_API_KEY}`,
    { method: 'DELETE' }
  );

  if (!response.ok && response.status !== 404) {
    const error = await response.text();
    throw new Error(`Failed to delete webhook: ${error}`);
  }
}

/**
 * Register a wallet for monitoring
 */
export async function POST(request: NextRequest) {
  try {
    const { walletAddress, action } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    if (!HELIUS_API_KEY) {
      return NextResponse.json(
        { error: 'Helius API key not configured' },
        { status: 500 }
      );
    }

    console.log(`[Register] ${action || 'register'} wallet:`, walletAddress);

    // Handle unregister action
    if (action === 'unregister') {
      return handleUnregister(walletAddress);
    }

    // Get current registered wallets from Redis
    const registeredWallets = await redis.smembers(REGISTERED_WALLETS_KEY);

    // Check if already registered
    if (registeredWallets.includes(walletAddress)) {
      return NextResponse.json({
        success: true,
        message: 'Wallet already registered',
        walletAddress,
      });
    }

    // Get stored webhook ID
    let webhookId = await redis.get(WEBHOOK_ID_KEY);
    let webhook: HeliusWebhook | null = null;

    if (webhookId) {
      // Verify webhook still exists
      webhook = await getWebhook(webhookId);
      if (!webhook) {
        console.log('[Register] Stored webhook not found, will create new');
        webhookId = null;
      }
    }

    // Get all existing webhooks if no stored ID
    if (!webhookId) {
      const existingWebhooks = await getExistingWebhooks();
      const ourWebhook = existingWebhooks.find((w) =>
        w.webhookURL.includes('/api/webhooks/helius')
      );

      if (ourWebhook) {
        webhookId = ourWebhook.webhookID;
        webhook = ourWebhook;
        await redis.set(WEBHOOK_ID_KEY, webhookId);
      }
    }

    // Create or update webhook
    const newAddresses = [...registeredWallets, walletAddress];

    if (webhookId && webhook) {
      // Update existing webhook
      console.log(
        '[Register] Updating webhook with',
        newAddresses.length,
        'addresses'
      );
      await updateWebhook(webhookId, newAddresses);
    } else {
      // Create new webhook
      console.log('[Register] Creating new webhook');
      const newWebhook = await createWebhook(newAddresses);
      webhookId = newWebhook.webhookID;
      await redis.set(WEBHOOK_ID_KEY, webhookId);
    }

    // Add wallet to registered set
    await redis.sadd(REGISTERED_WALLETS_KEY, walletAddress);

    // Also add to copy-settings for copy trade functionality
    const settingsKey = 'copy-settings';
    const settingsData = await redis.get(settingsKey);
    const settings = settingsData ? JSON.parse(settingsData) : [];

    if (!settings.find((s: any) => s.traderId === walletAddress)) {
      settings.push({
        traderId: walletAddress,
        isActive: true,
        allocationUsd: 100,
        maxPositionPercent: 25,
      });
      await redis.set(settingsKey, JSON.stringify(settings));
    }

    return NextResponse.json({
      success: true,
      message: `Wallet registered for monitoring`,
      walletAddress,
      webhookId,
      totalWallets: newAddresses.length,
    });
  } catch (error) {
    console.error('[Register] Error:', error);
    return NextResponse.json(
      { error: 'Failed to register wallet', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Handle wallet unregistration
 */
async function handleUnregister(walletAddress: string) {
  try {
    // Remove from registered wallets
    await redis.srem(REGISTERED_WALLETS_KEY, walletAddress);

    // Get remaining wallets
    const remainingWallets = await redis.smembers(REGISTERED_WALLETS_KEY);

    // Update or delete webhook
    const webhookId = await redis.get(WEBHOOK_ID_KEY);

    if (webhookId) {
      if (remainingWallets.length > 0) {
        await updateWebhook(webhookId, remainingWallets);
      } else {
        await deleteWebhook(webhookId);
        await redis.del(WEBHOOK_ID_KEY);
      }
    }

    // Remove from copy settings
    const settingsKey = 'copy-settings';
    const settingsData = await redis.get(settingsKey);
    if (settingsData) {
      const settings = JSON.parse(settingsData);
      const filtered = settings.filter((s: any) => s.traderId !== walletAddress);
      await redis.set(settingsKey, JSON.stringify(filtered));
    }

    return NextResponse.json({
      success: true,
      message: 'Wallet unregistered',
      walletAddress,
      remainingWallets: remainingWallets.length,
    });
  } catch (error) {
    console.error('[Unregister] Error:', error);
    return NextResponse.json(
      { error: 'Failed to unregister wallet', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Get registered wallets and webhook status
 */
export async function GET() {
  try {
    if (!HELIUS_API_KEY) {
      return NextResponse.json(
        { error: 'Helius API key not configured' },
        { status: 500 }
      );
    }

    const registeredWallets = await redis.smembers(REGISTERED_WALLETS_KEY);
    const webhookId = await redis.get(WEBHOOK_ID_KEY);

    let webhook: HeliusWebhook | null = null;
    if (webhookId) {
      webhook = await getWebhook(webhookId);
    }

    return NextResponse.json({
      success: true,
      registeredWallets,
      totalWallets: registeredWallets.length,
      webhook: webhook
        ? {
            id: webhook.webhookID,
            url: webhook.webhookURL,
            type: webhook.webhookType,
            addressCount: webhook.accountAddresses?.length || 0,
          }
        : null,
    });
  } catch (error) {
    console.error('[Register GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get registration status', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Delete webhook and clear all registrations
 */
export async function DELETE() {
  try {
    const webhookId = await redis.get(WEBHOOK_ID_KEY);

    if (webhookId) {
      await deleteWebhook(webhookId);
    }

    await redis.del(WEBHOOK_ID_KEY);
    await redis.del(REGISTERED_WALLETS_KEY);

    return NextResponse.json({
      success: true,
      message: 'Webhook deleted and all registrations cleared',
    });
  } catch (error) {
    console.error('[Register DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete webhook', details: String(error) },
      { status: 500 }
    );
  }
}
