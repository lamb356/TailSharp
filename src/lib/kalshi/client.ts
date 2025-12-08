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
  // If env already contains PEM with BEGIN/END, just use it
  if (rawKey.includes('BEGIN')) {
    return rawKey;
  }

  // Otherwise assume base64-encoded PEM string
  const decoded = Buffer.from(rawKey, 'base64').toString('utf-8');

  // If decoded already looks like PEM, return as-is
  if (decoded.includes('BEGIN')) {
    return decoded;
  }

  // Fallback: if in the future you store only the base64 body,
  // you could reconstruct full PEM here. For now just return decoded.
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

    const signature = sign.sign(
      {
        key: this.privateKey,
        format: 'pem',
        // Your Kalshi key is an RSA PKCS#1 key; use pkcs1 so OpenSSL can decode it
        type: 'pkcs1',
        padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
        saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
      },
      'base64'
    );

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
