// src/lib/solana/transactions.ts
import { PublicKey } from '@solana/web3.js';
import { getConnection } from './connection';

export interface Transaction {
  signature: string;
  slot: number;
  timestamp: number | null;
  success: boolean;
  fee: number;
  type: 'unknown' | 'transfer' | 'swap' | 'stake' | 'other';
}

export interface TransactionDetail {
  signature: string;
  timestamp: number | null;
  success: boolean;
  fee: number;
  instructions: string[];
  balanceChanges: BalanceChange[];
}

export interface BalanceChange {
  mint: string;
  amount: number;
  direction: 'in' | 'out';
}

/**
 * Get recent transaction signatures for a wallet
 */
export const getRecentTransactions = async (
  walletAddress: string,
  limit: number = 10
): Promise<Transaction[]> => {
  const connection = getConnection();
  const pubkey = new PublicKey(walletAddress);

  const signatures = await connection.getSignaturesForAddress(pubkey, { limit });

  return signatures.map((sig) => ({
    signature: sig.signature,
    slot: sig.slot,
    timestamp: sig.blockTime,
    success: sig.err === null,
    fee: 0, // We'd need to fetch full tx for this
    type: 'unknown' as const,
  }));
};

/**
 * Get transaction details
 */
export const getTransactionDetail = async (
  signature: string
): Promise<TransactionDetail | null> => {
  const connection = getConnection();

  try {
    const tx = await connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });

    if (!tx) return null;

    const instructions = tx.transaction.message.instructions.map((ix) => {
      if ('program' in ix) {
        return ix.program;
      }
      if ('programId' in ix) {
        return ix.programId.toString();
      }
      return 'unknown';
    });

    // Parse balance changes from pre/post token balances
    const balanceChanges: BalanceChange[] = [];
    
    if (tx.meta?.preTokenBalances && tx.meta?.postTokenBalances) {
      const preBalances = new Map(
        tx.meta.preTokenBalances.map((b) => [
          `${b.accountIndex}-${b.mint}`,
          b.uiTokenAmount.uiAmount || 0,
        ])
      );

      tx.meta.postTokenBalances.forEach((post) => {
        const key = `${post.accountIndex}-${post.mint}`;
        const pre = preBalances.get(key) || 0;
        const postAmount = post.uiTokenAmount.uiAmount || 0;
        const diff = postAmount - pre;

        if (diff !== 0) {
          balanceChanges.push({
            mint: post.mint,
            amount: Math.abs(diff),
            direction: diff > 0 ? 'in' : 'out',
          });
        }
      });
    }

    return {
      signature,
      timestamp: tx.blockTime,
      success: tx.meta?.err === null,
      fee: tx.meta?.fee || 0,
      instructions,
      balanceChanges,
    };
  } catch (error) {
    console.error('Failed to fetch transaction:', error);
    return null;
  }
};

/**
 * Format timestamp to relative time
 */
export const formatTimeAgo = (timestamp: number | null): string => {
  if (!timestamp) return 'Unknown';

  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;

  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

/**
 * Shorten signature for display
 */
export const shortenSignature = (sig: string): string => {
  return `${sig.slice(0, 8)}...${sig.slice(-8)}`;
};
