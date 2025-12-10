'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';

const REFERRAL_STORAGE_KEY = 'tailsharp_ref';
const REFERRAL_TRACKED_KEY = 'tailsharp_ref_tracked';

function ReferralTrackerInner() {
  const searchParams = useSearchParams();
  const { connected, publicKey } = useWallet();
  const hasTracked = useRef(false);

  // Step 1: Check for ?ref= parameter and store in localStorage
  useEffect(() => {
    const refCode = searchParams.get('ref');

    if (refCode) {
      // Store the referral code
      localStorage.setItem(REFERRAL_STORAGE_KEY, refCode);
      console.log('[Referral] Stored referral code:', refCode);

      // Clean the URL (remove ?ref= parameter) without refresh
      const url = new URL(window.location.href);
      url.searchParams.delete('ref');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams]);

  // Step 2: When wallet connects, track the signup
  useEffect(() => {
    async function trackReferralSignup() {
      if (!connected || !publicKey || hasTracked.current) return;

      const wallet = publicKey.toBase58();
      const refCode = localStorage.getItem(REFERRAL_STORAGE_KEY);
      const alreadyTracked = localStorage.getItem(REFERRAL_TRACKED_KEY);

      // Don't track if no referral code or already tracked this wallet
      if (!refCode) return;
      if (alreadyTracked === wallet) {
        console.log('[Referral] Already tracked for this wallet');
        return;
      }

      hasTracked.current = true;

      try {
        // First check if this wallet was already referred
        const checkRes = await fetch(`/api/referrals/track?wallet=${wallet}`);
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (checkData.wasReferred) {
            console.log('[Referral] Wallet already referred');
            localStorage.setItem(REFERRAL_TRACKED_KEY, wallet);
            return;
          }
        }

        // Track the signup
        const res = await fetch('/api/referrals/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            referralCode: refCode,
            wallet,
            milestone: 'signup',
          }),
        });

        if (res.ok) {
          console.log('[Referral] Signup tracked successfully');
          localStorage.setItem(REFERRAL_TRACKED_KEY, wallet);
        } else {
          const error = await res.json();
          console.log('[Referral] Track failed:', error.error);
          // If invalid code, clear it
          if (error.error === 'Invalid referral code') {
            localStorage.removeItem(REFERRAL_STORAGE_KEY);
          }
        }
      } catch (error) {
        console.error('[Referral] Error tracking signup:', error);
        hasTracked.current = false; // Allow retry
      }
    }

    trackReferralSignup();
  }, [connected, publicKey]);

  // This component doesn't render anything
  return null;
}

// Wrap in Suspense for useSearchParams
export function ReferralTracker() {
  return (
    <Suspense fallback={null}>
      <ReferralTrackerInner />
    </Suspense>
  );
}
