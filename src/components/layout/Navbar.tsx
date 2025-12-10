'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@/components/wallet/ConnectButton';
import { NotificationBell } from '@/components/ui/NotificationBell';

export function Navbar() {
  const pathname = usePathname();

 const navLinks = [
  { href: '/markets', label: 'Markets' },
  { href: '/traders', label: 'Traders' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/explore', label: 'Explore' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/copy-trades', label: 'Copy Trades' },
  { href: '/executed-trades', label: 'Trades' },
  { href: '/settings', label: 'Settings' },
];

  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-800 sticky top-0 bg-slate-950/80 backdrop-blur-md z-50">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/logo.jpg" alt="TailSharp" width={32} height={32} className="rounded-lg" />
        <span className="text-xl font-bold text-white">TailSharp</span>
      </Link>
      <div className="flex items-center gap-4">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`transition-colors ${
              pathname === link.href
                ? 'text-white font-medium'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {link.label}
          </Link>
        ))}
        <NotificationBell />
        <ConnectButton />
      </div>
    </nav>
  );
}