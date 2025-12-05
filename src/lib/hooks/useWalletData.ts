// src/lib/hooks/useWalletData.ts
import { useQuery } from '@tanstack/react-query';
import { getWalletData, WalletData } from '@/lib/solana/tracker';

export const useWalletData = (walletAddress: string | null) => {
  return useQuery<WalletData>({
    queryKey: ['wallet', walletAddress],
    queryFn: () => getWalletData(walletAddress!),
    enabled: !!walletAddress,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};
