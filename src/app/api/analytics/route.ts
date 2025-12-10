// src/app/api/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Redis from 'ioredis';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');

  if (!wallet) {
    return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
  }

  const redis = new Redis(process.env.KV_REDIS_URL!);

  try {
    // Get user's executed trades
    const executedTradesRaw = await redis.lrange(`executed-trades:${wallet}`, 0, -1);
    const executedTrades = executedTradesRaw.map((t) => {
      try {
        return JSON.parse(t);
      } catch {
        return null;
      }
    }).filter(Boolean);

    // Get copy settings to find active traders
    const copySettingsRaw = await redis.get(`copy-settings:${wallet}`);
    const copySettings = copySettingsRaw ? JSON.parse(copySettingsRaw) : [];
    const activeTraders = copySettings.filter((s: any) => s.isActive).length;

    // Calculate analytics
    let totalPnL = 0;
    let wins = 0;
    let losses = 0;
    let pending = 0;
    let biggestWin = 0;
    let biggestLoss = 0;
    let totalTradeSize = 0;
    let currentStreak = 0;
    let lastOutcome: string | null = null;

    const pnlByTrader: Record<string, number> = {};
    const pnlByCategory: Record<string, number> = {};
    const pnlByMonth: Record<string, number> = {};

    // Process trades for analytics
    const processedTrades = executedTrades.map((trade: any) => {
      // Simulate outcome based on trade data (in real app, this would come from Kalshi API)
      // For demo, randomly assign outcomes to some trades
      const tradeAge = Date.now() - (trade.timestamp || Date.now());
      const isSettled = tradeAge > 24 * 60 * 60 * 1000; // Settled if older than 24h

      let outcome: 'win' | 'loss' | 'pending' = 'pending';
      let pnl = 0;

      if (isSettled) {
        // Simulate ~55% win rate for demo
        const random = Math.random();
        outcome = random > 0.45 ? 'win' : 'loss';
        const amount = trade.amount || 10;
        pnl = outcome === 'win' ? amount * 0.8 : -amount;
      }

      return {
        ...trade,
        outcome,
        pnl,
        isSettled,
      };
    });

    // Sort by timestamp descending
    processedTrades.sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));

    // Calculate aggregates
    for (const trade of processedTrades) {
      totalTradeSize += trade.amount || 10;

      if (trade.outcome === 'win') {
        wins++;
        totalPnL += trade.pnl;
        if (trade.pnl > biggestWin) biggestWin = trade.pnl;

        // Streak calculation
        if (lastOutcome === null || lastOutcome === 'win') {
          currentStreak++;
        }
        lastOutcome = 'win';
      } else if (trade.outcome === 'loss') {
        losses++;
        totalPnL += trade.pnl;
        if (trade.pnl < biggestLoss) biggestLoss = trade.pnl;

        // Streak resets on loss
        if (lastOutcome === 'loss') {
          currentStreak = Math.min(currentStreak - 1, -1);
          currentStreak--;
        } else {
          currentStreak = -1;
        }
        lastOutcome = 'loss';
      } else {
        pending++;
      }

      // P&L by trader
      const traderName = trade.traderUsername || 'Unknown';
      pnlByTrader[traderName] = (pnlByTrader[traderName] || 0) + trade.pnl;

      // P&L by category (extract from market name or use default)
      const market = trade.marketTitle || trade.ticker || '';
      let category = 'Other';
      if (market.toLowerCase().includes('trump') || market.toLowerCase().includes('biden') || market.toLowerCase().includes('election')) {
        category = 'Politics';
      } else if (market.toLowerCase().includes('btc') || market.toLowerCase().includes('eth') || market.toLowerCase().includes('crypto')) {
        category = 'Crypto';
      } else if (market.toLowerCase().includes('nfl') || market.toLowerCase().includes('nba') || market.toLowerCase().includes('sports')) {
        category = 'Sports';
      } else if (market.toLowerCase().includes('weather') || market.toLowerCase().includes('temperature')) {
        category = 'Weather';
      } else if (market.toLowerCase().includes('fed') || market.toLowerCase().includes('rate') || market.toLowerCase().includes('inflation')) {
        category = 'Economics';
      }
      pnlByCategory[category] = (pnlByCategory[category] || 0) + trade.pnl;

      // P&L by month
      const tradeDate = new Date(trade.timestamp || Date.now());
      const monthKey = `${tradeDate.getFullYear()}-${String(tradeDate.getMonth() + 1).padStart(2, '0')}`;
      pnlByMonth[monthKey] = (pnlByMonth[monthKey] || 0) + trade.pnl;
    }

    const totalSettled = wins + losses;
    const winRate = totalSettled > 0 ? (wins / totalSettled) * 100 : 0;
    const avgTradeSize = processedTrades.length > 0 ? totalTradeSize / processedTrades.length : 0;

    // Generate last 12 months for chart
    const monthlyData = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      monthlyData.push({
        month: key,
        label,
        pnl: pnlByMonth[key] || 0,
      });
    }

    // Calculate drawdown (simplified)
    let peak = 0;
    let maxDrawdown = 0;
    let runningPnL = 0;
    for (const trade of processedTrades.reverse()) {
      runningPnL += trade.pnl;
      if (runningPnL > peak) peak = runningPnL;
      const drawdown = peak - runningPnL;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }
    const currentDrawdown = peak - totalPnL;

    // Trader breakdown for pro tier
    const traderBreakdown = Object.entries(pnlByTrader)
      .map(([trader, pnl]) => ({
        trader,
        pnl,
        trades: processedTrades.filter((t: any) => t.traderUsername === trader).length,
      }))
      .sort((a, b) => b.pnl - a.pnl);

    // Category breakdown for pro tier
    const categoryBreakdown = Object.entries(pnlByCategory)
      .map(([category, pnl]) => ({
        category,
        pnl,
        trades: processedTrades.filter((t: any) => {
          const market = t.marketTitle || t.ticker || '';
          // Same categorization logic
          if (category === 'Politics') return market.toLowerCase().includes('trump') || market.toLowerCase().includes('biden') || market.toLowerCase().includes('election');
          if (category === 'Crypto') return market.toLowerCase().includes('btc') || market.toLowerCase().includes('eth') || market.toLowerCase().includes('crypto');
          if (category === 'Sports') return market.toLowerCase().includes('nfl') || market.toLowerCase().includes('nba') || market.toLowerCase().includes('sports');
          if (category === 'Weather') return market.toLowerCase().includes('weather') || market.toLowerCase().includes('temperature');
          if (category === 'Economics') return market.toLowerCase().includes('fed') || market.toLowerCase().includes('rate') || market.toLowerCase().includes('inflation');
          return category === 'Other';
        }).length,
      }))
      .sort((a, b) => b.pnl - a.pnl);

    await redis.quit();

    return NextResponse.json({
      // Free tier data
      summary: {
        totalPnL: Math.round(totalPnL * 100) / 100,
        winRate: Math.round(winRate * 10) / 10,
        totalTrades: processedTrades.length,
        activeTraders,
      },
      simpleStats: {
        avgTradeSize: Math.round(avgTradeSize * 100) / 100,
        biggestWin: Math.round(biggestWin * 100) / 100,
        biggestLoss: Math.round(biggestLoss * 100) / 100,
        currentStreak,
        wins,
        losses,
        pending,
      },
      recentTrades: processedTrades.slice(0, 20).map((t: any) => ({
        id: t.id || t.timestamp,
        traderUsername: t.traderUsername || 'Unknown',
        market: t.marketTitle || t.ticker || 'Unknown Market',
        position: t.side || 'yes',
        outcome: t.outcome,
        pnl: Math.round(t.pnl * 100) / 100,
        amount: t.amount || 10,
        timestamp: t.timestamp,
      })),
      // Pro tier data
      pro: {
        monthlyPnL: monthlyData,
        traderBreakdown,
        categoryBreakdown,
        drawdown: {
          max: Math.round(maxDrawdown * 100) / 100,
          current: Math.round(currentDrawdown * 100) / 100,
        },
      },
    });
  } catch (error) {
    console.error('[Analytics] Error:', error);
    await redis.quit();
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
