// src/app/layout.tsx
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { WalletProvider } from '@/components/wallet/WalletProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { TransactionWatcher } from '@/components/providers/TransactionWatcher';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'TailSharp | Copy Trading for Prediction Markets',
  description: 'Copy the sharps. Auto-mirror top prediction market traders on tokenized Kalshi markets via Solana.',
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
            {children}
          </WalletProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
