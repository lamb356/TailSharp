// src/lib/solana/tracker.ts
import { PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { getConnection } from './connection';

export interface TokenBalance {
  mint: string;
  amount: number;
  decimals: number;
  uiAmount: number;
}

export interface WalletData {
  address: string;
  solBalance: number;
  tokens: TokenBalance[];
  lastUpdated: Date;
}

/**
 * Fetch SOL balance for a wallet
 */
export const getSolBalance = async (walletAddress: string): Promise<number> => {
  const connection = getConnection();
  const pubkey = new PublicKey(walletAddress);
  const balance = await connection.getBalance(pubkey);
  return balance;
};

/**
 * Fetch all SPL token balances for a wallet
 * This includes Kalshi prediction market positions (they're SPL tokens on Solana)
 */
export const getTokenBalances = async (walletAddress: string): Promise<TokenBalance[]> => {
  const connection = getConnection();
  const pubkey = new PublicKey(walletAddress);

  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubkey, {
    programId: TOKEN_PROGRAM_ID,
  });

  return tokenAccounts.value
    .map((account) => {
      const parsed = account.account.data.parsed.info;
      return {
        mint: parsed.mint,
        amount: Number(parsed.tokenAmount.amount),
        decimals: parsed.tokenAmount.decimals,
        uiAmount: parsed.tokenAmount.uiAmount || 0,
      };
    })
    .filter((token) => token.uiAmount > 0); // Only tokens with balance
};

/**
 * Get full wallet data including SOL and all tokens
 */
export const getWalletData = async (walletAddress: string): Promise<WalletData> => {
  const [solBalance, tokens] = await Promise.all([
    getSolBalance(walletAddress),
    getTokenBalances(walletAddress),
  ]);

  return {
    address: walletAddress,
    solBalance,
    tokens,
    lastUpdated: new Date(),
  };
};

/**
 * Validate if a string is a valid Solana address
 */
export const isValidSolanaAddress = (address: string): boolean => {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
};
