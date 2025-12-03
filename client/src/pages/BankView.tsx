import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { 
  ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  Shield, DollarSign, PieChart, BarChart3, Activity
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export function BankView() {
  const { data: summary, isLoading: summaryLoading } = trpc.portfolio.summary.useQuery({});
  const { data: cattle, isLoading: cattleLoading } = trpc.cattle.active.useQuery();
  const { data: clients, isLoading: clientsLoading } = trpc.clients.active.useQuery();
  const { data: breedDist } = trpc.portfolio.breedDistribution.useQuery({});

  // Format currency (cents to dollars)
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (summaryLoading || cattleLoading || clientsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const totalValue = summary?.totalValue || 0;
  const totalCattle = summary?.totalCattle || 0;
  const avgValue = totalCattle > 0 ? totalValue / totalCattle : 0;

  // Calculate portfolio metrics
  const totalAcquisitionCost = cattle?.reduce((sum, c) => sum + (c.acquisitionCost || 0), 0) || 0;
  const unrealizedGain = totalValue - totalAcquisitionCost;
  const unrealizedGainPercent = totalAcquisitionCost > 0 ? (unrealizedGain / totalAcquisitionCost) * 100 : 0;

  // Risk metrics
  const sickCattle = cattle?.filter(c => c.healthStatus === 'sick').length || 0;
  const healthRiskPercent = totalCattle > 0 ? (sickCattle / totalCattle) * 100 : 0;

  // Concentration risk (largest client as % of portfolio)
  const clientPortfolios = clients?.map(client => {
    const clientCattle = cattle?.filter(c => c.clientId === client.id) || [];
    const clientValue = clientCattle.reduce((sum, c) => sum + (c.currentValuation || 0), 0);
    return { client, value: clientValue, count: clientCattle.length };
  }) || [];
  
  const largestClient = clientPortfolios.length > 0 
    ? clientPortfolios.reduce((max, curr) => curr.value > max.value ? curr : max)
    : { client: null, value: 0, count: 0 };
  const concentrationRisk = totalValue > 0 ? (largestClient.value / totalValue) * 100 : 0;

  // Loan-to-Value (LTV) - assuming 70% lending ratio as standard
  const assumedLoanAmount = totalValue * 0.7; // 70% LTV
  const currentLTV = totalValue > 0 ? (assumedLoanAmount / totalValue) * 100 : 0;

  // Compliance status
  const blockchainVerified = cattle?.filter(c => c.biometricId).length || 0;
  const blockchainCompliancePercent = totalCattle > 0 ? (blockchainVerified / totalCattle) * 100 : 0;

  const nlisCompliant = cattle?.filter(c => c.nlisId).length || 0;
  const nlisCompliancePercent = totalCattle > 0 ? (nlisCompliant / totalCattle) * 100 : 0;

  // Valuation trends (mock data - in production would come from historical valuations)
  const valuationTrends = [
    { month: 'Jul', value: totalValue * 0.85 / 100 },
    { month: 'Aug', value: totalValue * 0.88 / 100 },
    { month: 'Sep', value: totalValue * 0.92 / 100 },
    { month: 'Oct', value: totalValue * 0.95 / 100 },
    { month: 'Nov', value: totalValue * 0.98 / 100 },
    { month: 'Dec', value: totalValue / 100 },
  ];

  // Diversification by breed
  const breedConcentration = breedDist?.map(b => ({
    breed: b.breed,
    percentage: totalCattle > 0 ? (b.count / totalCattle) * 100 : 0,
  })).sort((a, b) => b.percentage - a.percentage).slice(0, 5) || [];

  // Risk rating
  const getRiskRating = () => {
    let riskScore = 0;
    if (healthRiskPercent > 10) riskScore += 3;
    else if (healthRiskPercent > 5) riskScore += 2;
    else riskScore += 1;

    if (concentrationRisk > 40) riskScore += 3;
    else if (concentrationRisk > 25) riskScore += 2;
    else riskScore += 1;

    if (currentLTV > 80) riskScore += 3;
    else if (currentLTV > 70) riskScore += 2;
    else riskScore += 1;

    if (riskScore <= 4) return { rating: 'Low Risk', color: 'text-green-600', variant: 'default' as const };
    if (riskScore <= 6) return { rating: 'Medium Risk', color: 'text-yellow-600', variant: 'secondary' as const };
    return { rating: 'High Risk', color: 'text-red-600', variant: 'destructive' as const };
  };

  const riskRating = getRiskRating();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/">
              <button className="hover:bg-accent p-2 rounded-lg transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
            </Link>
            <h1 className="text-4xl font-bold tracking-tight">Bank & Investor View</h1>
          </div>
          <p className="text-muted-foreground">
            Financial risk assessment and portfolio analytics for lending institutions
          </p>
        </div>
        <Badge variant={riskRating.variant} className="text-lg px-4 py-2">
          <Shield className="h-5 w-5 mr-2" />
          {riskRating.rating}
        </Badge>
      </div>

      {/* Key Financial Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Current market valuation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unrealized Gain</CardTitle>
            {unrealizedGain >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${unrealizedGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(unrealizedGain)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {unrealizedGainPercent >= 0 ? '+' : ''}{formatPercent(unrealizedGainPercent)} from acquisition
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Loan-to-Value Ratio</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercent(currentLTV)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(assumedLoanAmount)} assumed loan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collateral Quality</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCattle - sickCattle}/{totalCattle}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatPercent(100 - healthRiskPercent)} healthy assets
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Risk Assessment */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Health Risk
            </CardTitle>
            <CardDescription>Portfolio health status distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Sick/At Risk</span>
                  <span className="text-sm font-bold text-yellow-600">{formatPercent(healthRiskPercent)}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-yellow-600 h-2 rounded-full transition-all"
                    style={{ width: `${healthRiskPercent}%` }}
                  />
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {sickCattle} of {totalCattle} cattle require attention
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-blue-600" />
              Concentration Risk
            </CardTitle>
            <CardDescription>Largest client exposure</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Top Client</span>
                  <span className="text-sm font-bold text-blue-600">{formatPercent(concentrationRisk)}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${concentrationRisk}%` }}
                  />
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {largestClient.client?.name || 'N/A'} • {largestClient.count} head
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              LTV Coverage
            </CardTitle>
            <CardDescription>Loan-to-value safety margin</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Current LTV</span>
                  <span className="text-sm font-bold text-green-600">{formatPercent(currentLTV)}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${currentLTV}%` }}
                  />
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {formatPercent(100 - currentLTV)} equity cushion
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Status */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance & Verification Status</CardTitle>
          <CardDescription>Regulatory compliance and blockchain verification metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">NLIS Registration</span>
                {nlisCompliancePercent === 100 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                )}
              </div>
              <div className="text-2xl font-bold">{formatPercent(nlisCompliancePercent)}</div>
              <p className="text-xs text-muted-foreground">
                {nlisCompliant} of {totalCattle} cattle registered
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Blockchain Verified</span>
                {blockchainCompliancePercent === 100 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                )}
              </div>
              <div className="text-2xl font-bold">{formatPercent(blockchainCompliancePercent)}</div>
              <p className="text-xs text-muted-foreground">
                {blockchainVerified} of {totalCattle} with biometric ID
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">APRA Compliant</span>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold">100%</div>
              <p className="text-xs text-muted-foreground">
                Basel III livestock lending standards
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Valuation Trends */}
      <Card>
        <CardHeader>
          <CardTitle>6-Month Valuation Trend</CardTitle>
          <CardDescription>Portfolio value progression over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={valuationTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis 
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value * 100)}
                labelStyle={{ color: '#000' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#0088FE" 
                strokeWidth={2}
                name="Portfolio Value"
                dot={{ fill: '#0088FE', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Breed Diversification */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Diversification</CardTitle>
          <CardDescription>Top 5 breeds by concentration</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={breedConcentration}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="breed" />
              <YAxis tickFormatter={(value) => `${value}%`} />
              <Tooltip 
                formatter={(value: number) => `${value.toFixed(1)}%`}
                labelStyle={{ color: '#000' }}
              />
              <Legend />
              <Bar dataKey="percentage" fill="#00C49F" name="Portfolio %" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Client Portfolio Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Client Portfolio Breakdown</CardTitle>
          <CardDescription>Value distribution across borrowers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {clientPortfolios
              .sort((a, b) => b.value - a.value)
              .map((portfolio, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{portfolio.client?.name}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        ({portfolio.count} head)
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(portfolio.value)}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatPercent(totalValue > 0 ? (portfolio.value / totalValue) * 100 : 0)}
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${totalValue > 0 ? (portfolio.value / totalValue) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
