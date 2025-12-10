// src/app/layout.tsx
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { WalletProvider } from '@/components/wallet/WalletProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { TransactionWatcher } from '@/components/providers/TransactionWatcher';
import { ReferralTracker } from '@/components/providers/ReferralTracker';
import { Navbar } from '@/components/layout/Navbar';

export const dynamic = 'force-dynamic';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'TailSharp | Copy Elite Prediction Market Traders',
  description: 'Automatically mirror winning strategies from top Solana traders to Kalshi. Real-time copy trading for prediction markets.',
  keywords: ['prediction markets', 'copy trading', 'Solana', 'Kalshi', 'trading', 'crypto'],
  authors: [{ name: 'TailSharp' }],
  creator: 'TailSharp',
  metadataBase: new URL('https://tail-sharp.vercel.app'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://tail-sharp.vercel.app',
    siteName: 'TailSharp',
    title: 'TailSharp | Copy Elite Prediction Market Traders',
    description: 'Automatically mirror winning strategies from top Solana traders to Kalshi. Real-time copy trading for prediction markets.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TailSharp - Copy Elite Prediction Market Traders',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TailSharp | Copy Elite Prediction Market Traders',
    description: 'Automatically mirror winning strategies from top Solana traders to Kalshi. Real-time copy trading for prediction markets.',
    images: ['/og-image.png'],
    creator: '@tailsharp',
  },
  icons: {
    icon: [
      { url: '/logo.jpg', type: 'image/jpeg' },
    ],
    apple: [
      { url: '/logo.jpg', type: 'image/jpeg' },
    ],
    shortcut: '/logo.jpg',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <QueryProvider>
          <WalletProvider>
            <TransactionWatcher />
            <ReferralTracker />
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
              <Navbar />
              {children}
            </div>
          </WalletProvider>
        </QueryProvider>
      </body>
    </html>
  );
}