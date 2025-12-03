import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus, AlertCircle, Brain, ShoppingCart, DollarSign, PauseCircle } from "lucide-react";

function PortfolioRecommendations() {
  const { data: recommendations, isLoading } = trpc.market.getPortfolioRecommendations.useQuery();

  if (isLoading) {
    return (
      <div className="container py-8 space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!recommendations) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No recommendations available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { overall_strategy, actions, market_sentiment, risk_level, model_info } = recommendations;

  // Sentiment colors
  const sentimentColors = {
    BULLISH: 'bg-green-100 text-green-800 border-green-200',
    BEARISH: 'bg-red-100 text-red-800 border-red-200',
    NEUTRAL: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const riskColors = {
    LOW: 'text-green-600',
    MEDIUM: 'text-amber-600',
    HIGH: 'text-red-600',
  };

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Portfolio Recommendations</h1>
        <p className="text-muted-foreground">
          AI-powered buy/sell/hold recommendations for optimal portfolio management
        </p>
      </div>

      {/* Model Info Banner */}
      <Card className="border-purple-200 bg-purple-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Brain className="h-5 w-5 text-purple-600 mt-0.5" />
            <div className="space-y-2 flex-1">
              <h3 className="font-semibold text-purple-900">RL Agent Information</h3>
              <div className="text-sm text-purple-800 space-y-1">
                <p><strong>Method:</strong> {model_info.method}</p>
                <p><strong>Training Data:</strong> {model_info.trained_on}</p>
                <p><strong>Last Updated:</strong> {new Date(model_info.last_updated).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <AlertCircle className="h-4 w-4 text-purple-600" />
                <p className="text-xs text-purple-700">
                  <strong>Demo Version:</strong> Recommendations use rule-based heuristics combining trend analysis, seasonal patterns, and momentum.
                  Production version would use PPO/DQN trained on historical portfolio performance.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Strategy */}
      <Card className={sentimentColors[market_sentiment]}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Overall Strategy</span>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-white">
                Sentiment: {market_sentiment}
              </Badge>
              <Badge variant="outline" className="bg-white">
                <span className={riskColors[risk_level]}>Risk: {risk_level}</span>
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold">{overall_strategy}</p>
        </CardContent>
      </Card>

      {/* Action Recommendations */}
      <div className="grid gap-6">
        {actions.map((action) => {
          const actionIcons = {
            BUY: <ShoppingCart className="h-5 w-5" />,
            SELL: <DollarSign className="h-5 w-5" />,
            HOLD: <PauseCircle className="h-5 w-5" />,
          };

          const actionColors = {
            BUY: 'border-green-200 bg-green-50',
            SELL: 'border-red-200 bg-red-50',
            HOLD: 'border-blue-200 bg-blue-50',
          };

          const actionBadgeColors = {
            BUY: 'bg-green-600 text-white',
            SELL: 'bg-red-600 text-white',
            HOLD: 'bg-blue-600 text-white',
          };

          return (
            <Card key={action.category} className={actionColors[action.action]}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${actionBadgeColors[action.action]}`}>
                      {actionIcons[action.action]}
                    </div>
                    <div>
                      <CardTitle>{action.category}</CardTitle>
                      <CardDescription className="mt-1">
                        Timeframe: {action.timeframe}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={actionBadgeColors[action.action]}>
                      {action.action}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-2">
                      Confidence: {action.confidence}%
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Expected ROI */}
                {action.expected_roi !== null && (
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <span className="text-sm font-medium">Expected ROI:</span>
                    <span className={`text-lg font-semibold ${action.expected_roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {action.expected_roi > 0 ? '+' : ''}{action.expected_roi.toFixed(1)}%
                    </span>
                  </div>
                )}

                {/* Reasoning */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Reasoning:</h4>
                  <ul className="space-y-1">
                    {action.reasoning.map((reason, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
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
              These recommendations are generated by an AI system and should not be considered financial advice.
              Portfolio decisions should be made in consultation with qualified agricultural advisors and market experts.
              Past performance does not guarantee future results. Market conditions can change rapidly and unpredictably.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PortfolioRecommendations;
