/**
 * ML Price Prediction Module (DEMO VERSION)
 * 
 * Uses simple statistical forecasting based on:
 * - Recent price trends (7-day, 30-day moving averages)
 * - Seasonal patterns (month-of-year effects)
 * - Volatility estimation (for confidence intervals)
 * 
 * NOTE: This is a DEMO implementation using statistical methods.
 * Production version would use LSTM/XGBoost trained on historical data.
 * 
 * Data sources:
 * - Training: SYNTHETIC data (see scripts/ml_training_data_synthetic.json)
 * - Prediction: REAL MLA API data (live)
 */

import { getAllCattleMarketData } from './mlaApi';

export interface PricePrediction {
  indicator_id: number;
  indicator_desc: string;
  current_price: number;
  predictions: {
    day: number;  // Days ahead (1-7)
    predicted_price: number;
    confidence_lower: number;  // 95% confidence interval
    confidence_upper: number;
    change_percent: number;
  }[];
  model_info: {
    method: string;
    trained_on: string;
    last_updated: string;
  };
}

/**
 * Calculate simple moving average
 */
function movingAverage(prices: number[], window: number): number {
  if (prices.length < window) return prices[prices.length - 1];
  const recent = prices.slice(-window);
  return recent.reduce((sum, p) => sum + p, 0) / recent.length;
}

/**
 * Calculate price volatility (standard deviation)
 */
function calculateVolatility(prices: number[]): number {
  if (prices.length < 2) return 0.05;  // Default 5%
  const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
  const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
  return Math.sqrt(variance) / mean;  // Coefficient of variation
}

/**
 * Get seasonal multiplier based on month
 * Based on real MLA patterns: peak Oct-Dec, low Apr-Jun
 */
function getSeasonalMultiplier(monthOffset: number): number {
  const currentMonth = new Date().getMonth();  // 0-11
  const targetMonth = (currentMonth + Math.floor(monthOffset / 30)) % 12;
  
  // Seasonal pattern: peak in Oct-Dec (months 9-11), low in Apr-Jun (months 3-5)
  const seasonalPattern = [
    1.00,  // Jan
    0.98,  // Feb
    0.96,  // Mar
    0.94,  // Apr (low)
    0.93,  // May (low)
    0.94,  // Jun (low)
    0.97,  // Jul
    1.00,  // Aug
    1.03,  // Sep
    1.07,  // Oct (peak)
    1.10,  // Nov (peak)
    1.08,  // Dec (peak)
  ];
  
  return seasonalPattern[targetMonth];
}

/**
 * Predict future prices using simple statistical model
 * 
 * Method:
 * 1. Use 30-day moving average as baseline
 * 2. Apply seasonal adjustment
 * 3. Add small trend component (momentum)
 * 4. Calculate confidence intervals from volatility
 */
export async function predictPrices(days: number = 7): Promise<PricePrediction[]> {
  // Fetch recent real MLA data
  const marketData = await getAllCattleMarketData();
  
  const predictions: PricePrediction[] = [];
  
  for (const indicator of marketData) {
    const currentPrice = indicator.avg_price_per_kg;
    
    // For demo, we'll use simple statistical forecasting
    // In production, this would load a trained LSTM/XGBoost model
    
    // Simulate historical prices (in production, fetch from database)
    const historicalPrices = generateSyntheticHistory(currentPrice, 90);
    
    // Calculate trend and volatility
    const ma7 = movingAverage(historicalPrices, 7);
    const ma30 = movingAverage(historicalPrices, 30);
    const momentum = (ma7 - ma30) / ma30;  // Short-term vs long-term trend
    const volatility = calculateVolatility(historicalPrices);
    
    // Generate predictions for each day
    const dayPredictions = [];
    
    for (let day = 1; day <= days; day++) {
      // Base prediction: current price + momentum + seasonal
      const seasonal = getSeasonalMultiplier(day);
      const trendComponent = momentum * (day / 30);  // Decay over time
      const predictedPrice = currentPrice * (1 + trendComponent) * seasonal;
      
      // Confidence intervals (95% = ±1.96 * std dev)
      const confidenceRange = predictedPrice * volatility * 1.96 * Math.sqrt(day / 30);
      
      dayPredictions.push({
        day,
        predicted_price: Math.round(predictedPrice * 100) / 100,
        confidence_lower: Math.round((predictedPrice - confidenceRange) * 100) / 100,
        confidence_upper: Math.round((predictedPrice + confidenceRange) * 100) / 100,
        change_percent: Math.round(((predictedPrice - currentPrice) / currentPrice) * 10000) / 100,
      });
    }
    
    predictions.push({
      indicator_id: 0, // Not available from API, using placeholder
      indicator_desc: indicator.indicator_desc,
      current_price: currentPrice,
      predictions: dayPredictions,
      model_info: {
        method: "Statistical Forecast (MA + Seasonal + Momentum)",
        trained_on: "SYNTHETIC data based on real MLA patterns",
        last_updated: new Date().toISOString(),
      },
    });
  }
  
  return predictions;
}

/**
 * Generate synthetic historical prices for demo
 * In production, this would fetch real historical data from database
 */
function generateSyntheticHistory(currentPrice: number, days: number): number[] {
  const prices: number[] = [];
  let price = currentPrice * 0.95;  // Start slightly lower
  
  for (let i = 0; i < days; i++) {
    // Random walk with mean reversion
    const change = (Math.random() - 0.5) * 0.02;  // ±1% daily
    const meanReversion = (currentPrice - price) * 0.01;  // Pull towards current
    price = price * (1 + change + meanReversion);
    prices.push(price);
  }
  
  return prices;
}

/**
 * Get prediction for a specific indicator
 */
export async function predictIndicatorPrice(indicatorId: number, days: number = 7): Promise<PricePrediction | null> {
  const allPredictions = await predictPrices(days);
  return allPredictions.find(p => p.indicator_id === indicatorId) || null;
}
