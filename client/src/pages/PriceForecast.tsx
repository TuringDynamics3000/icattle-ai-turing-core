import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus, AlertCircle, Brain, ArrowLeft, Sparkles } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Link } from "wouter";

function PriceForecast() {
  const { data: predictions, isLoading } = trpc.market.predictPrices.useQuery({ days: 7 });
  const { data: recommendations } = trpc.market.getPortfolioRecommendations.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-lavender-50">
        <div className="container mx-auto px-6 py-12">
          <Skeleton className="h-32 w-full mb-8" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!predictions || predictions.length === 0) {
    return (
      <div className="min-h-screen bg-lavender-50">
        <div className="container mx-auto px-6 py-12">
          <div className="glass-card rounded-3xl p-8 shadow-soft-lg">
            <p className="text-gray-600">No predictions available</p>
          </div>
        </div>
      </div>
    );
  }

  const modelInfo = predictions[0].model_info;

  return (
    <div className="min-h-screen bg-lavender-50">
      {/* Hero Header with Purple Gradient */}
      <section className="relative overflow-hidden bg-gradient-purple-deep">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-10 w-64 h-64 bg-gradient-purple-pink opacity-30 shape-blob blur-3xl"></div>
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-gradient-coral-cream opacity-20 shape-circle blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-6 py-16 relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/">
              <a className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <ArrowLeft className="h-6 w-6 text-white" />
              </a>
            </Link>
            <div>
              <h1 className="font-serif font-bold text-5xl text-white">Price Forecast</h1>
              <p className="text-lavender-100 text-xl mt-2">
                7-day cattle price predictions using machine learning
              </p>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z" fill="#FAFAFC"/>
          </svg>
        </div>
      </section>

      <div className="container mx-auto px-6 py-12 space-y-8">
        {/* Model Info Banner */}
        <div className="glass-card rounded-3xl p-6 shadow-soft-lg border-2 border-blue-200">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-2xl">
              <Brain className="h-6 w-6 text-blue-600" />
            </div>
            <div className="space-y-3 flex-1">
              <h3 className="font-semibold text-xl text-plum-900">ML Model Information</h3>
              <div className="text-sm text-gray-700 space-y-2">
                <p><strong>Method:</strong> {modelInfo.method}</p>
                <p><strong>Training Data:</strong> {modelInfo.trained_on}</p>
                <p><strong>Last Updated:</strong> {new Date(modelInfo.last_updated).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2 mt-4 bg-blue-50 p-3 rounded-xl">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <p className="text-xs text-blue-700">
                  <strong>Demo Version:</strong> Predictions use real-time MLA API data with statistical forecasting.
                  Production version would use LSTM/XGBoost trained on historical data.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Portfolio Recommendations */}
        {recommendations && (
          <div className="glass-card rounded-3xl p-6 shadow-soft-lg border-2 border-purple-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-100 rounded-2xl">
                <Sparkles className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-xl text-plum-900 mb-3">AI Portfolio Recommendations</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  {recommendations.recommendations.map((rec: any, idx: number) => (
                    <div key={idx} className="bg-white rounded-2xl p-4 border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={`${
                          rec.action === 'buy' ? 'bg-green-600' : 
                          rec.action === 'sell' ? 'bg-red-600' : 
                          'bg-gray-600'
                        } text-white`}>
                          {rec.action.toUpperCase()}
                        </Badge>
                        <span className="font-semibold text-plum-900">{rec.indicator_desc}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{rec.reason}</p>
                      <p className="text-xs text-gray-500">Confidence: {(rec.confidence * 100).toFixed(0)}%</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-purple-700 mt-4">
                  <strong>RL Agent:</strong> {recommendations.agent_info.policy} • Trained on {recommendations.agent_info.trained_on}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Predictions Grid */}
        <div className="grid gap-6">
          {predictions.map((prediction) => {
            const day7 = prediction.predictions[6];  // 7-day forecast
            const isRising = day7.change_percent > 0;
            const isFlat = Math.abs(day7.change_percent) < 1;

            // Prepare chart data
            const chartData = [
              {
                day: 0,
                price: prediction.current_price,
                lower: prediction.current_price,
                upper: prediction.current_price,
              },
              ...prediction.predictions.map(p => ({
                day: p.day,
                price: p.predicted_price,
                lower: p.confidence_lower,
                upper: p.confidence_upper,
              }))
            ];

            return (
              <div key={prediction.indicator_desc} className="glass-card rounded-3xl p-6 shadow-soft-lg">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="font-serif font-bold text-2xl text-plum-900">{prediction.indicator_desc}</h3>
                    <p className="text-gray-600 mt-1">
                      Current: <strong className="text-plum-900">${prediction.current_price.toFixed(2)}/kg</strong>
                    </p>
                  </div>
                  <Badge className={`${
                    isRising ? 'bg-green-600' : isFlat ? 'bg-gray-600' : 'bg-red-600'
                  } text-white px-4 py-2 gap-2`}>
                    {isRising ? <TrendingUp className="h-4 w-4" /> : isFlat ? <Minus className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    {day7.change_percent > 0 ? '+' : ''}{day7.change_percent.toFixed(1)}% in 7 days
                  </Badge>
                </div>

                {/* Chart */}
                <div className="bg-white rounded-2xl p-4 mb-6">
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="day" 
                        label={{ value: 'Days Ahead', position: 'insideBottom', offset: -5 }}
                        stroke="#6b7280"
                      />
                      <YAxis 
                        label={{ value: 'Price ($/kg)', angle: -90, position: 'insideLeft' }}
                        domain={['dataMin - 0.5', 'dataMax + 0.5']}
                        stroke="#6b7280"
                      />
                      <Tooltip 
                        formatter={(value: number) => `$${value.toFixed(2)}/kg`}
                        labelFormatter={(label) => `Day ${label}`}
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="upper" 
                        stackId="1"
                        stroke="none" 
                        fill="#c4b5fd" 
                        fillOpacity={0.3}
                        name="95% Confidence Upper"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="lower" 
                        stackId="2"
                        stroke="none" 
                        fill="#c4b5fd" 
                        fillOpacity={0.3}
                        name="95% Confidence Lower"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="price" 
                        stroke="#7c3aed" 
                        strokeWidth={3}
                        dot={{ fill: '#7c3aed', r: 5 }}
                        name="Predicted Price"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* 7-Day Forecast Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white rounded-2xl p-4 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">7-Day Forecast</p>
                    <p className="text-2xl font-bold text-plum-900">${day7.predicted_price.toFixed(2)}/kg</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Confidence Range</p>
                    <p className="text-lg font-semibold text-gray-700">
                      ${day7.confidence_lower.toFixed(2)} - ${day7.confidence_upper.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Expected Change</p>
                    <p className={`text-2xl font-bold ${isRising ? 'text-green-600' : isFlat ? 'text-gray-600' : 'text-red-600'}`}>
                      {day7.change_percent > 0 ? '+' : ''}{day7.change_percent.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Disclaimer */}
        <div className="glass-card rounded-3xl p-6 shadow-soft-lg border-2 border-amber-200">
          <div className="space-y-3">
            <h3 className="font-semibold text-xl text-amber-900">Important Disclaimer</h3>
            <p className="text-sm text-amber-800">
              These predictions are for informational purposes only and should not be considered financial advice.
              Actual market prices may vary significantly due to unforeseen events, supply/demand shocks, weather conditions,
              and other factors not captured in the model. Always consult with industry experts before making trading decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PriceForecast;
