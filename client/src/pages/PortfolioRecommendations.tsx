import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Brain, ShoppingCart, DollarSign, PauseCircle, Sparkles } from "lucide-react";

function PortfolioRecommendations() {
  const { data: recommendations, isLoading } = trpc.market.getPortfolioRecommendations.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-lavender-50 p-6">
        <Skeleton className="h-32 w-full mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!recommendations) {
    return (
      <div className="min-h-screen bg-lavender-50 p-6">
        <div className="glass-card rounded-3xl p-8">
          <p className="text-gray-600">No recommendations available</p>
        </div>
      </div>
    );
  }

  const { overall_strategy, actions, market_sentiment, risk_level, model_info } = recommendations;

  const sentimentGradients = {
    BULLISH: 'from-green-500 to-green-700',
    BEARISH: 'from-red-500 to-red-700',
    NEUTRAL: 'from-gray-500 to-gray-700',
  };

  const riskColors = {
    LOW: 'text-green-600',
    MEDIUM: 'text-amber-600',
    HIGH: 'text-red-600',
  };

  return (
    <div className="min-h-screen bg-lavender-50">
      {/* Header with Gradient */}
      <section className="relative overflow-hidden bg-gradient-purple-deep">
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute top-10 right-20 w-64 h-64 bg-gradient-coral-cream shape-blob blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-6 py-16 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card-dark text-white mb-6">
            <Sparkles className="w-4 h-4 text-coral-400" />
            <span className="text-sm font-medium">AI-Powered Insights</span>
          </div>
          
          <h1 className="font-serif font-bold text-5xl text-white mb-4">
            Portfolio Recommendations
          </h1>
          <p className="text-xl text-lavender-100 max-w-3xl">
            Machine learning-powered buy/sell/hold recommendations for optimal portfolio management
          </p>
        </div>
      </section>

      <div className="container mx-auto px-6 py-12 space-y-8">
        {/* Model Info Banner */}
        <div className="glass-card rounded-3xl p-8 shadow-soft-lg border-2 border-plum-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-plum-500 to-plum-700 flex items-center justify-center flex-shrink-0">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 space-y-3">
              <h3 className="text-xl font-serif font-bold text-plum-900">RL Agent Information</h3>
              <div className="grid gap-2 md:grid-cols-3 text-sm">
                <div>
                  <span className="text-gray-600">Method:</span>
                  <span className="ml-2 font-semibold text-plum-900">{model_info.method}</span>
                </div>
                <div>
                  <span className="text-gray-600">Training Data:</span>
                  <span className="ml-2 font-semibold text-plum-900">{model_info.trained_on}</span>
                </div>
                <div>
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="ml-2 font-semibold text-plum-900">
                    {new Date(model_info.last_updated).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-2 p-4 bg-lavender-50 rounded-2xl">
                <AlertCircle className="w-5 h-5 text-plum-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">
                  <strong className="text-plum-900">Demo Version:</strong> Recommendations use rule-based heuristics combining trend analysis, seasonal patterns, and momentum.
                  Production version would use PPO/DQN trained on historical portfolio performance.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Overall Strategy */}
        <div className="glass-card rounded-3xl p-8 shadow-soft-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-serif font-bold text-plum-900">Overall Strategy</h2>
            <div className="flex gap-3">
              <Badge className={`bg-gradient-to-br ${sentimentGradients[market_sentiment]} text-white`}>
                Sentiment: {market_sentiment}
              </Badge>
              <Badge className="bg-white border-2 border-plum-200">
                <span className={riskColors[risk_level]}>Risk: {risk_level}</span>
              </Badge>
            </div>
          </div>
          <p className="text-lg text-gray-700 leading-relaxed">{overall_strategy}</p>
        </div>

        {/* Action Recommendations */}
        <div className="grid gap-6">
          {actions.map((action) => {
            const actionIcons = {
              BUY: <ShoppingCart className="w-6 h-6" />,
              SELL: <DollarSign className="w-6 h-6" />,
              HOLD: <PauseCircle className="w-6 h-6" />,
            };

            const actionGradients = {
              BUY: 'from-green-500 to-green-700',
              SELL: 'from-red-500 to-red-700',
              HOLD: 'from-blue-500 to-blue-700',
            };

            return (
              <div key={action.category} className="glass-card rounded-3xl p-8 shadow-soft-lg hover:shadow-3d-purple transition-all">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${actionGradients[action.action]} flex items-center justify-center text-white`}>
                      {actionIcons[action.action]}
                    </div>
                    <div>
                      <h3 className="text-2xl font-serif font-bold text-plum-900">{action.category}</h3>
                      <p className="text-gray-600 mt-1">Timeframe: {action.timeframe}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={`bg-gradient-to-br ${actionGradients[action.action]} text-white text-lg px-4 py-1`}>
                      {action.action}
                    </Badge>
                    <p className="text-sm text-gray-600 mt-2">
                      Confidence: <span className="font-semibold text-plum-900">{action.confidence}%</span>
                    </p>
                  </div>
                </div>

                {/* Expected ROI */}
                {action.expected_roi !== null && (
                  <div className="flex items-center justify-between p-4 bg-lavender-50 rounded-2xl mb-4">
                    <span className="text-sm font-medium text-gray-700">Expected ROI:</span>
                    <span className={`text-2xl font-bold ${action.expected_roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {action.expected_roi > 0 ? '+' : ''}{action.expected_roi.toFixed(1)}%
                    </span>
                  </div>
                )}

                {/* Reasoning */}
                <div>
                  <h4 className="font-semibold text-plum-900 mb-3">Reasoning:</h4>
                  <ul className="space-y-2">
                    {action.reasoning.map((reason, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-gray-700">
                        <span className="w-2 h-2 rounded-full bg-gradient-to-br from-plum-500 to-coral-500 mt-2 flex-shrink-0"></span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Disclaimer */}
        <div className="glass-card rounded-3xl p-8 shadow-soft-lg border-2 border-amber-300 bg-amber-50/50">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-serif font-bold text-lg text-amber-900 mb-2">Important Disclaimer</h3>
              <p className="text-sm text-amber-800 leading-relaxed">
                These recommendations are generated by an AI system and should not be considered financial advice.
                Portfolio decisions should be made in consultation with qualified agricultural advisors and market experts.
                Past performance does not guarantee future results. Market conditions can change rapidly and unpredictably.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PortfolioRecommendations;
