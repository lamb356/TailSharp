import crypto from 'crypto';

export interface KalshiMarket {
  ticker: string;
  event_ticker: string;
  title: string;
  subtitle?: string;
  status: string;
  yes_bid: number;
  yes_ask: number;
  volume: number;
}

// Normalize the private key coming from env (base64 or PEM) so OpenSSL on Vercel accepts it
function normalizePrivateKey(rawKey: string): string {
  // Already a properly formatted PEM key with proper headers
  if (rawKey.includes('-----BEGIN') && rawKey.includes('-----END')) {
    return rawKey;
  }

  // Decode from base64
  let decoded: string;
  try {
    decoded = Buffer.from(rawKey, 'base64').toString('utf-8');
  } catch (e) {
    // If decoding fails, assume it's already decoded
    decoded = rawKey;
  }

  // Check if decoded string contains PEM markers
  if (decoded.includes('-----BEGIN')) {
    // Clean up any whitespace issues and ensure proper formatting
    const lines = decoded.split('\n').map(line => line.trim()).filter(line => line);
    
    // Extract header, body, and footer
    const headerIndex = lines.findIndex(line => line.includes('BEGIN'));
    const footerIndex = lines.findIndex(line => line.includes('END'));
    
    if (headerIndex !== -1 && footerIndex !== -1) {
      const header = lines[headerIndex];
      const footer = lines[footerIndex];
      const body = lines.slice(headerIndex + 1, footerIndex).join('');
      
      // Reformat with proper 64-char line breaks (PEM standard)
      const formattedBody = body.match(/.{1,64}/g)?.join('\n') || body;
      
      return `${header}\n${formattedBody}\n${footer}`;
    }
  }

  return decoded;
}

export class KalshiClient {
  private privateKey: string;
  private apiKeyId: string;
  private baseUrl: string;

  constructor(apiKeyId: string, privateKey: string, isDemo = true) {
    this.apiKeyId = apiKeyId;

    // Normalize for Vercel / OpenSSL 3 strict parsing
    this.privateKey = normalizePrivateKey(privateKey);

    this.baseUrl = isDemo
      ? 'https://demo-api.kalshi.co'
      : 'https://api.kalshi.com';
  }

 private signRequest(timestamp: string, method: string, path: string): string {
  const pathWithoutQuery = path.split('?')[0];
  const message = `${timestamp}${method}${pathWithoutQuery}`;

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(message);
  sign.end();

  // Simplified: let Node.js auto-detect the key format
  const signature = sign.sign(this.privateKey, 'base64');

  return signature;
}

  private getHeaders(method: string, path: string) {
    const timestamp = Date.now().toString();
    const signature = this.signRequest(timestamp, method, path);

    return {
      'KALSHI-ACCESS-KEY': this.apiKeyId,
      'KALSHI-ACCESS-TIMESTAMP': timestamp,
      'KALSHI-ACCESS-SIGNATURE': signature,
    };
  }

  async getBalance() {
    const path = '/trade-api/v2/portfolio/balance';
    const headers = this.getHeaders('GET', path);

    const response = await fetch(this.baseUrl + path, { headers });
    return response.json();
  }

  async searchMarkets(params?: {
    status?: 'open' | 'closed' | 'settled';
    limit?: number;
    series_ticker?: string;
  }): Promise<KalshiMarket[]> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.series_ticker) queryParams.append('series_ticker', params.series_ticker);

    const queryString = queryParams.toString();
    const path = `/trade-api/v2/markets${queryString ? '?' + queryString : ''}`;
    const headers = this.getHeaders('GET', path);

    const response = await fetch(this.baseUrl + path, { headers });
    const data = await response.json();

    return data.markets || [];
  }

  async getMarket(ticker: string): Promise<KalshiMarket | null> {
    const path = `/trade-api/v2/markets/${ticker}`;
    const headers = this.getHeaders('GET', path);

    const response = await fetch(this.baseUrl + path, { headers });
    const data = await response.json();

    return data.market || null;
  }

  async createOrder(
    ticker: string,
    action: 'buy' | 'sell',
    count: number,
    side: 'yes' | 'no'
  ) {
    const path = '/trade-api/v2/portfolio/orders';
    const headers = this.getHeaders('POST', path);

    const body = {
      ticker,
      action,
      count,
      side,
      type: 'market',
    };

    const response = await fetch(this.baseUrl + path, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    return response.json();
  }
}
