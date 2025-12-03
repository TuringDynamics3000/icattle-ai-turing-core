import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus, AlertCircle, Brain } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";

function PriceForecast() {
  const { data: predictions, isLoading } = trpc.market.predictPrices.useQuery({ days: 7 });

  if (isLoading) {
    return (
      <div className="container py-8 space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!predictions || predictions.length === 0) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No predictions available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const modelInfo = predictions[0].model_info;

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Price Forecast</h1>
        <p className="text-muted-foreground">
          7-day cattle price predictions using machine learning
        </p>
      </div>

      {/* Model Info Banner */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Brain className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="space-y-2 flex-1">
              <h3 className="font-semibold text-blue-900">ML Model Information</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>Method:</strong> {modelInfo.method}</p>
                <p><strong>Training Data:</strong> {modelInfo.trained_on}</p>
                <p><strong>Last Updated:</strong> {new Date(modelInfo.last_updated).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <p className="text-xs text-blue-700">
                  <strong>Demo Version:</strong> Predictions use real-time MLA API data with statistical forecasting.
                  Production version would use LSTM/XGBoost trained on historical data.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
            <Card key={prediction.indicator_desc}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{prediction.indicator_desc}</CardTitle>
                    <CardDescription className="mt-2">
                      Current: <strong>${prediction.current_price.toFixed(2)}/kg</strong>
                    </CardDescription>
                  </div>
                  <Badge variant={isRising ? "default" : isFlat ? "secondary" : "destructive"} className="gap-1">
                    {isRising ? <TrendingUp className="h-3 w-3" /> : isFlat ? <Minus className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {day7.change_percent > 0 ? '+' : ''}{day7.change_percent.toFixed(1)}% in 7 days
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Chart */}
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="day" 
                      label={{ value: 'Days Ahead', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      label={{ value: 'Price ($/kg)', angle: -90, position: 'insideLeft' }}
                      domain={['dataMin - 0.5', 'dataMax + 0.5']}
                    />
                    <Tooltip 
                      formatter={(value: number) => `$${value.toFixed(2)}/kg`}
                      labelFormatter={(label) => `Day ${label}`}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="upper" 
                      stackId="1"
                      stroke="none" 
                      fill="#93c5fd" 
                      fillOpacity={0.3}
                      name="95% Confidence Upper"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="lower" 
                      stackId="2"
                      stroke="none" 
                      fill="#93c5fd" 
                      fillOpacity={0.3}
                      name="95% Confidence Lower"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#2563eb" 
                      strokeWidth={2}
                      dot={{ fill: '#2563eb', r: 4 }}
                      name="Predicted Price"
                    />
                  </AreaChart>
                </ResponsiveContainer>

                {/* 7-Day Forecast Summary */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">7-Day Forecast</p>
                    <p className="text-lg font-semibold">${day7.predicted_price.toFixed(2)}/kg</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Confidence Range</p>
                    <p className="text-lg font-semibold text-muted-foreground">
                      ${day7.confidence_lower.toFixed(2)} - ${day7.confidence_upper.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Expected Change</p>
                    <p className={`text-lg font-semibold ${isRising ? 'text-green-600' : isFlat ? 'text-gray-600' : 'text-red-600'}`}>
                      {day7.change_percent > 0 ? '+' : ''}{day7.change_percent.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Disclaimer */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <h3 className="font-semibold text-amber-900">Important Disclaimer</h3>
            <p className="text-sm text-amber-800">
              These predictions are for informational purposes only and should not be considered financial advice.
              Actual market prices may vary significantly due to unforeseen events, supply/demand shocks, weather conditions,
              and other factors not captured in the model. Always consult with industry experts before making trading decisions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PriceForecast;
