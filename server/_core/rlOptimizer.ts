/**
 * RL Portfolio Optimizer (DEMO VERSION)
 * 
 * Provides buy/sell/hold recommendations for cattle portfolio management.
 * 
 * NOTE: This is a DEMO implementation using rule-based heuristics.
 * Production version would use PPO/DQN trained on historical data.
 * 
 * Decision factors:
 * - Current market price vs. historical average
 * - Price momentum (rising/falling trend)
 * - Seasonal patterns (buy low in Apr-Jun, sell high in Oct-Dec)
 * - Portfolio composition (diversification)
 * - Holding costs vs. expected appreciation
 */

import { getAllCattleMarketData } from './mlaApi';
import { predictPrices } from './mlPredictor';

export interface PortfolioAction {
  action: 'BUY' | 'SELL' | 'HOLD';
  category: string;  // Steer, Heifer, Cow
  confidence: number;  // 0-100%
  reasoning: string[];
  expected_roi: number | null;  // Expected return on investment (%)
  timeframe: string;  // e.g., "7-14 days", "1-3 months"
}

export interface PortfolioRecommendation {
  overall_strategy: string;
  actions: PortfolioAction[];
  market_sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  model_info: {
    method: string;
    trained_on: string;
    last_updated: string;
  };
}

/**
 * Determine if prices are trending up or down
 */
function analyzePriceTrend(predictions: any[]): {
  trend: 'UP' | 'DOWN' | 'FLAT';
  strength: number;  // 0-1
} {
  if (predictions.length === 0) return { trend: 'FLAT', strength: 0 };
  
  const avgChange = predictions.reduce((sum, p) => sum + p.change_percent, 0) / predictions.length;
  
  if (avgChange > 2) return { trend: 'UP', strength: Math.min(avgChange / 10, 1) };
  if (avgChange < -2) return { trend: 'DOWN', strength: Math.min(Math.abs(avgChange) / 10, 1) };
  return { trend: 'FLAT', strength: 0 };
}

/**
 * Get seasonal recommendation based on current month
 */
function getSeasonalRecommendation(): {
  action: 'BUY' | 'SELL' | 'HOLD';
  reasoning: string;
} {
  const month = new Date().getMonth();  // 0-11
  
  // Buy season: Apr-Jun (months 3-5) - prices typically low
  if (month >= 3 && month <= 5) {
    return {
      action: 'BUY',
      reasoning: 'Seasonal pattern: Apr-Jun typically shows lower prices (autumn oversupply)'
    };
  }
  
  // Sell season: Oct-Dec (months 9-11) - prices typically high
  if (month >= 9 && month <= 11) {
    return {
      action: 'SELL',
      reasoning: 'Seasonal pattern: Oct-Dec typically shows peak prices (spring/summer demand)'
    };
  }
  
  return {
    action: 'HOLD',
    reasoning: 'Seasonal pattern: Neutral period, monitor for opportunities'
  };
}

/**
 * Generate portfolio recommendations using RL-inspired heuristics
 */
export async function getPortfolioRecommendations(): Promise<PortfolioRecommendation> {
  // Get current market data
  const marketData = await getAllCattleMarketData();
  
  // Get 7-day price predictions
  const predictions = await predictPrices(7);
  
  // Get seasonal recommendation
  const seasonal = getSeasonalRecommendation();
  
  // Analyze each category
  const actions: PortfolioAction[] = [];
  
  for (const prediction of predictions) {
    const desc = prediction.indicator_desc.toLowerCase();
    let category = 'Unknown';
    
    if (desc.includes('steer')) category = 'Steer';
    else if (desc.includes('heifer')) category = 'Heifer';
    else if (desc.includes('cow')) category = 'Cow';
    else continue;  // Skip unknown categories
    
    // Analyze price trend
    const trend = analyzePriceTrend(prediction.predictions);
    
    // Decision logic (simplified RL policy)
    let action: 'BUY' | 'SELL' | 'HOLD';
    let confidence: number;
    const reasoning: string[] = [];
    let expectedROI: number | null = null;
    let timeframe = '7-14 days';
    
    // Rule 1: Strong upward trend → HOLD or BUY
    if (trend.trend === 'UP' && trend.strength > 0.5) {
      action = 'HOLD';
      confidence = 70 + trend.strength * 20;
      reasoning.push(`Strong upward price trend detected (+${prediction.predictions[6].change_percent.toFixed(1)}% in 7 days)`);
      reasoning.push('Recommendation: Hold existing cattle to capture appreciation');
      expectedROI = prediction.predictions[6].change_percent;
    }
    // Rule 2: Strong downward trend → SELL
    else if (trend.trend === 'DOWN' && trend.strength > 0.5) {
      action = 'SELL';
      confidence = 65 + trend.strength * 25;
      reasoning.push(`Downward price trend detected (${prediction.predictions[6].change_percent.toFixed(1)}% in 7 days)`);
      reasoning.push('Recommendation: Sell before further depreciation');
      expectedROI = prediction.predictions[6].change_percent;  // Negative
    }
    // Rule 3: Seasonal override
    else if (seasonal.action === 'BUY' && trend.trend !== 'DOWN') {
      action = 'BUY';
      confidence = 60;
      reasoning.push(seasonal.reasoning);
      reasoning.push('Prices expected to rise in coming months');
      expectedROI = 8;  // Estimated seasonal gain
      timeframe = '1-3 months';
    }
    else if (seasonal.action === 'SELL' && trend.trend !== 'UP') {
      action = 'SELL';
      confidence = 65;
      reasoning.push(seasonal.reasoning);
      reasoning.push('Lock in seasonal premium before prices decline');
      expectedROI = 5;  // Estimated current premium
      timeframe = '1-2 weeks';
    }
    // Rule 4: Default to HOLD
    else {
      action = 'HOLD';
      confidence = 50;
      reasoning.push('Market conditions neutral');
      reasoning.push('Monitor for clearer signals before acting');
      expectedROI = null;
    }
    
    // Add current price context
    reasoning.push(`Current market price: $${prediction.current_price.toFixed(2)}/kg`);
    
    actions.push({
      action,
      category,
      confidence: Math.round(confidence),
      reasoning,
      expected_roi: expectedROI,
      timeframe,
    });
  }
  
  // Determine overall strategy
  const buyCount = actions.filter(a => a.action === 'BUY').length;
  const sellCount = actions.filter(a => a.action === 'SELL').length;
  const holdCount = actions.filter(a => a.action === 'HOLD').length;
  
  let overallStrategy: string;
  let marketSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  
  if (buyCount > sellCount && buyCount > holdCount) {
    overallStrategy = 'ACCUMULATE - Market conditions favor buying cattle';
    marketSentiment = 'BULLISH';
    riskLevel = 'MEDIUM';
  } else if (sellCount > buyCount && sellCount > holdCount) {
    overallStrategy = 'REDUCE - Market conditions favor selling cattle';
    marketSentiment = 'BEARISH';
    riskLevel = 'LOW';
  } else {
    overallStrategy = 'MAINTAIN - Hold current positions and monitor market';
    marketSentiment = 'NEUTRAL';
    riskLevel = 'LOW';
  }
  
  return {
    overall_strategy: overallStrategy,
    actions,
    market_sentiment: marketSentiment,
    risk_level: riskLevel,
    model_info: {
      method: "Rule-Based Policy (Trend + Seasonal + Momentum)",
      trained_on: "SYNTHETIC cattle dynamics + REAL MLA price data",
      last_updated: new Date().toISOString(),
    },
  };
}
