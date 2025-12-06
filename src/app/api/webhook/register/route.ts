// src/app/api/webhook/register/route.ts
import { NextRequest, NextResponse } from 'next/server';

const HELIUS_API_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY;
const WEBHOOK_URL = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook`
  : 'https://tail-sharp.vercel.app/api/webhook';

export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json();

    console.log('Registering webhook for:', walletAddress);

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    if (!HELIUS_API_KEY) {
      return NextResponse.json({ error: 'Helius API key not configured' }, { status: 500 });
    }

    // First, get existing webhooks
    const existingResponse = await fetch(
      `https://api-mainnet.helius-rpc.com/v0/webhooks?api-key=${HELIUS_API_KEY}`
    );
    const existingWebhooks = await existingResponse.json();

    let heliusUrl: string;
    let method: string;
    let body: object;

    if (existingWebhooks.length > 0) {
      // UPDATE existing webhook - add new address to it
      const webhookId = existingWebhooks[0].webhookID;
      
      // IMPORTANT: Fetch the LATEST state of this specific webhook to avoid race conditions
      const currentWebhookResponse = await fetch(
        `https://api-mainnet.helius-rpc.com/v0/webhooks/${webhookId}?api-key=${HELIUS_API_KEY}`
      );
      const currentWebhook = await currentWebhookResponse.json();
      const currentAddresses: string[] = currentWebhook.accountAddresses || [];
      
      // Skip if already tracking this address
      if (currentAddresses.includes(walletAddress)) {
        return NextResponse.json({
          success: true,
          webhookId,
          message: `Already tracking wallet: ${walletAddress}`
        });
      }

      heliusUrl = `https://api-mainnet.helius-rpc.com/v0/webhooks/${webhookId}?api-key=${HELIUS_API_KEY}`;
      method = 'PUT';
      body = {
        webhookURL: WEBHOOK_URL,
        transactionTypes: ['ANY'],
        accountAddresses: [...currentAddresses, walletAddress],
        webhookType: 'enhanced',
      };
      console.log('Updating webhook:', webhookId, 'adding to', currentAddresses.length, 'existing addresses');
    } else {
      // CREATE new webhook
      heliusUrl = `https://api-mainnet.helius-rpc.com/v0/webhooks?api-key=${HELIUS_API_KEY}`;
      method = 'POST';
      body = {
        webhookURL: WEBHOOK_URL,
        transactionTypes: ['ANY'],
        accountAddresses: [walletAddress],
        webhookType: 'enhanced',
      };
      console.log('Creating new webhook');
    }

    const response = await fetch(heliusUrl, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    console.log('Helius response status:', response.status);
    console.log('Helius response:', responseText);

    if (!response.ok) {
      return NextResponse.json({
        error: 'Failed to register webhook',
        heliusError: responseText
      }, { status: 500 });
    }

    const data = JSON.parse(responseText);

    return NextResponse.json({
      success: true,
      webhookId: data.webhookID,
      message: `Now tracking wallet: ${walletAddress}`
    });

  } catch (error) {
    console.error('Webhook registration error:', error);
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}
