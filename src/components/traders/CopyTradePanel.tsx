// src/components/traders/CopyTradePanel.tsx
'use client';

import { FC, useState } from 'react';
import { useCopyTrades } from '@/lib/store/useCopyTrades';
import { CopyTradeCard } from './CopyTradeCard';
import { MarketCopyTradeCard } from './MarketCopyTradeCard';
import { useNotifications } from '@/lib/store/useNotifications';
import { SimulatedTrade } from '@/lib/solana/copyTrade';
import { MarketCopyTrade, generateMarketCopyTrade, executeMarketCopyTrade } from '@/lib/dflow/copyTradeMarkets';
import { useStore } from '@/lib/store/useStore';

// Type guard to check if trade is a market trade
const isMarketTrade = (trade: SimulatedTrade): trade is MarketCopyTrade => {
  return 'marketId' in trade;
};

export const CopyTradePanel: FC = () => {
  const { simulatedTrades, executedTrades, executeTrade, rejectTrade, clearSimulatedTrades, addSimulatedTrade } =
    useCopyTrades();
  const { addNotification } = useNotifications();
  const { copySettings } = useStore();
  const [simulating, setSimulating] = useState(false);

  const pendingTrades = simulatedTrades.filter((t) => t.status === 'pending');

  const handleExecute = async (id: string) => {
    const trade = simulatedTrades.find((t) => t.id === id);
    
    if (trade && isMarketTrade(trade)) {
      // Execute market trade
      const result = await executeMarketCopyTrade(trade);
      
      if (result.success) {
        executeTrade(id);
        addNotification({
          type: 'info',
          title: '✅ Market Order Executed',
          message: `Bought ${trade.contracts} ${trade.side.toUpperCase()} on ${trade.marketTicker}`,
        });
      } else {
        addNotification({
          type: 'error',
          title: '❌ Order Failed',
          message: result.error || 'Failed to execute trade',
        });
      }
    } else {
      // Regular token trade
      executeTrade(id);
      if (trade) {
        addNotification({
          type: 'info',
          title: '✅ Trade Executed',
          message: `${trade.action} ${trade.yourAmount.toFixed(4)} ${trade.tokenSymbol}`,
        });
      }
    }
  };

  const handleReject = (id: string) => {
    rejectTrade(id);
  };

  // Simulate a market copy trade
  const simulateMarketTrade = async () => {
    setSimulating(true);
    
    // Get a random active trader
    const activeSettings = copySettings.filter((s) => s.isActive);
    if (activeSettings.length === 0) {
      addNotification({
        type: 'warning',
        title: '⚠️ No Active Traders',
        message: 'Follow and activate a trader first',
      });
      setSimulating(false);
      return;
    }

    const settings = activeSettings[Math.floor(Math.random() * activeSettings.length)];
    
    // Random market and side
    const marketIds = ['fed-rate-dec-2025', 'btc-100k-2025', 'cpi-jan-2026', 'eth-5k-q1-2026'];
    const marketId = marketIds[Math.floor(Math.random() * marketIds.length)];
    const side = Math.random() > 0.5 ? 'yes' : 'no';
    const traderContracts = Math.floor(Math.random() * 500) + 50;

    const trade = await generateMarketCopyTrade(
      settings.traderId,
      marketId,
      side as 'yes' | 'no',
      traderContracts,
      settings
    );

    if (trade) {
      addSimulatedTrade(trade);
      addNotification({
        type: 'trade',
        title: '🔔 Market Copy Trade',
        message: `${trade.traderShortAddress} bought ${side.toUpperCase()} on ${trade.marketTicker}`,
      });
    }

    setSimulating(false);
  };

  // Simulate regular token trade
  const simulateTokenTrade = () => {
    const testTrade: SimulatedTrade = {
      id: `test-${Date.now()}`,
      traderId: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      traderShortAddress: '7xKX...gAsU',
      tokenMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      tokenSymbol: 'USDC',
      tokenName: 'USD Coin',
      action: Math.random() > 0.5 ? 'BUY' : 'SELL',
      traderAmount: Math.floor(Math.random() * 1000) + 100,
      yourAmount: Math.floor(Math.random() * 100) + 10,
      yourAllocation: 100,
      proportionPercent: 1,
      estimatedCost: Math.floor(Math.random() * 50) + 10,
      timestamp: new Date(),
      status: 'pending',
    };

    addSimulatedTrade(testTrade);
    addNotification({
      type: 'trade',
      title: '🔔 Copy Trade Detected',
      message: `${testTrade.traderShortAddress} ${testTrade.action === 'BUY' ? 'bought' : 'sold'} ${testTrade.tokenSymbol}`,
    });
  };

  return (
    <div className="bg-slate-800/30 border border-slate-700 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Copy Trades</h2>
          <p className="text-slate-400 text-sm mt-1">
            {pendingTrades.length} pending · {executedTrades.length} executed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={simulateMarketTrade}
            disabled={simulating}
            className="text-sm text-green-400 hover:text-green-300 transition-colors disabled:opacity-50"
          >
            {simulating ? '...' : '+ Market'}
          </button>
          <button
            onClick={simulateTokenTrade}
            className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors"
          >
            + Token
          </button>
          {simulatedTrades.length > 0 && (
            <button
              onClick={clearSimulatedTrades}
              className="text-sm text-slate-400 hover:text-red-400 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Pending Trades */}
      {pendingTrades.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-400 mb-3">Pending</h3>
          <div className="space-y-3">
            {pendingTrades.map((trade) => (
              isMarketTrade(trade) ? (
                <MarketCopyTradeCard
                  key={trade.id}
                  trade={trade}
                  onExecute={handleExecute}
                  onReject={handleReject}
                />
              ) : (
                <CopyTradeCard
                  key={trade.id}
                  trade={trade}
                  onExecute={handleExecute}
                  onReject={handleReject}
                />
              )
            ))}
          </div>
        </div>
      )}

      {/* Executed Trades */}
      {executedTrades.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-400 mb-3">Recently Executed</h3>
          <div className="space-y-3">
            {executedTrades.slice(0, 5).map((trade) => (
              isMarketTrade(trade) ? (
                <MarketCopyTradeCard
                  key={trade.id}
                  trade={trade}
                  onExecute={() => {}}
                  onReject={() => {}}
                />
              ) : (
                <CopyTradeCard
                  key={trade.id}
                  trade={trade}
                  onExecute={() => {}}
                  onReject={() => {}}
                />
              )
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {simulatedTrades.length === 0 && executedTrades.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <p>No copy trades yet</p>
          <p className="text-sm mt-1">Click &quot;+ Market&quot; to simulate a prediction market trade</p>
        </div>
      )}
    </div>
  );
};
