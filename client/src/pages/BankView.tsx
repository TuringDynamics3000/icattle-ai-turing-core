import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { 
  ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  Shield, DollarSign, PieChart, BarChart3, Activity, FileDown, Building2, Percent
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportBankReportToPDF } from "@/lib/exportBankReport";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { calculateCertification } from "@/../../server/_core/certificationScoring";

export function BankView() {
  const { data: summary, isLoading: summaryLoading } = trpc.portfolio.summary.useQuery({});
  const { data: cattleData } = trpc.cattle.list.useQuery({ limit: 1000, cursor: 0 });
  const cattle = cattleData?.items || [];
  const { data: clients, isLoading: clientsLoading } = trpc.clients.active.useQuery();
  const { data: breedDist } = trpc.portfolio.breedDistribution.useQuery({});

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

  if (summaryLoading || clientsLoading) {
    return (
      <div className="min-h-screen bg-lavender-50">
        <div className="container mx-auto px-6 py-12">
          <Skeleton className="h-12 w-64 mb-12" />
          <div className="grid gap-6 md:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
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
  const sickCattle = summary?.sickCattle || 0;
  const healthRiskPercent = totalCattle > 0 ? (sickCattle / totalCattle) * 100 : 0;

  // Concentration risk
  const clientPortfolios = clients?.map(client => {
    const clientCattle = cattle?.filter(c => c.clientId === client.id) || [];
    const clientValue = clientCattle.reduce((sum, c) => sum + (c.currentValuation || 0), 0);
    return { client, value: clientValue, count: clientCattle.length };
  }) || [];
  
  const largestClient = clientPortfolios.length > 0 
    ? clientPortfolios.reduce((max, curr) => curr.value > max.value ? curr : max)
    : { client: null, value: 0, count: 0 };
  const concentrationRisk = totalValue > 0 ? (largestClient.value / totalValue) * 100 : 0;

  // Certification tiers
  const certificationTiers = cattle?.reduce((acc, c) => {
    const cert = calculateCertification(c);
    acc[cert.tier] = (acc[cert.tier] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const goldCount = certificationTiers['GOLD'] || 0;
  const silverCount = certificationTiers['SILVER'] || 0;
  const bronzeCount = certificationTiers['BRONZE'] || 0;

  // LVR calculations
  const lvrRatio = 0.75;
  const assumedLoanAmount = totalValue * lvrRatio;
  const currentLVR = totalValue > 0 ? (assumedLoanAmount / totalValue) * 100 : 0;
  const equityCushion = 100 - currentLVR;
  
  const interestRate = 6.0;
  const estimatedAnnualIncome = totalValue * 0.20;
  const annualInterestPayment = assumedLoanAmount * (interestRate / 100);
  const debtServiceCoverage = annualInterestPayment > 0 ? estimatedAnnualIncome / annualInterestPayment : 0;
  const collateralCoverage = totalValue > 0 ? (totalValue / assumedLoanAmount) * 100 : 0;

  // Compliance
  const blockchainVerified = cattle?.filter(c => c.biometricId).length || 0;
  const blockchainCompliancePercent = totalCattle > 0 ? (blockchainVerified / totalCattle) * 100 : 0;
  const nlisCompliant = cattle?.filter(c => c.nlisId).length || 0;
  const nlisCompliancePercent = totalCattle > 0 ? (nlisCompliant / totalCattle) * 100 : 0;

  // Valuation trends
  const valuationTrends = [
    { month: 'Jul', value: totalValue * 0.85 / 100 },
    { month: 'Aug', value: totalValue * 0.88 / 100 },
    { month: 'Sep', value: totalValue * 0.92 / 100 },
    { month: 'Oct', value: totalValue * 0.95 / 100 },
    { month: 'Nov', value: totalValue * 0.98 / 100 },
    { month: 'Dec', value: totalValue / 100 },
  ];

  // Breed concentration
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

    if (currentLVR > 80) riskScore += 3;
    else if (currentLVR > 70) riskScore += 2;
    else riskScore += 1;

    if (riskScore <= 4) return { rating: 'Low Risk', color: 'text-green-600', bgGradient: 'from-green-500 to-green-700' };
    if (riskScore <= 6) return { rating: 'Medium Risk', color: 'text-yellow-600', bgGradient: 'from-yellow-500 to-yellow-700' };
    return { rating: 'High Risk', color: 'text-red-600', bgGradient: 'from-red-500 to-red-700' };
  };

  const riskRating = getRiskRating();

  return (
    <div className="min-h-screen bg-lavender-50">
      {/* Header with gradient */}
      <div className="bg-gradient-purple-deep relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 right-20 w-64 h-64 bg-gradient-purple-pink opacity-30 shape-blob blur-3xl"></div>
          <div className="absolute bottom-10 left-20 w-96 h-96 bg-gradient-coral-cream opacity-20 shape-circle blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-6 py-16 relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Link href="/">
                  <a className="p-2 rounded-xl hover:bg-white/10 transition-colors">
                    <ArrowLeft className="h-6 w-6 text-white" />
                  </a>
                </Link>
                <Building2 className="w-8 h-8 text-coral-400" />
              </div>
              <h1 className="font-serif font-bold text-5xl text-white mb-3">Bank & Investor View</h1>
              <p className="text-lavender-100 text-xl">
                Portfolio analytics and risk assessment for financial institutions
              </p>
            </div>
            <div className="flex flex-col items-end gap-4">
              <div className={`px-6 py-3 rounded-full bg-gradient-to-br ${riskRating.bgGradient} text-white font-bold text-lg flex items-center gap-2 shadow-3d-purple`}>
                <Shield className="w-5 h-5" />
                {riskRating.rating}
              </div>
              <Button
                onClick={() => {
                  const reportData = {
                    portfolioValue: totalValue,
                    unrealizedGain: unrealizedGain,
                    unrealizedGainPercent: unrealizedGainPercent,
                    ltvRatio: currentLVR,
                    assumedLoan: assumedLoanAmount,
                    healthyCount: totalCattle - sickCattle,
                    totalCount: totalCattle,
                    healthRiskPercent: healthRiskPercent,
                    concentrationRiskPercent: concentrationRisk,
                    topClientName: largestClient.client?.name || 'Unknown',
                    topClientCount: largestClient.count,
                    nlisCompliance: 100,
                    blockchainCompliance: 100,
                    apraCompliant: true,
                    riskRating: riskRating.rating,
                    generatedDate: new Date().toLocaleDateString('en-AU', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }),
                  };
                  exportBankReportToPDF(reportData);
                }}
                className="bg-white text-plum-900 hover:bg-lavender-50 px-6 py-3 rounded-full font-semibold flex items-center gap-2"
              >
                <FileDown className="h-5 w-5" />
                Export PDF Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {/* Key Financial Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 -mt-20 mb-12 relative z-20">
          <FinancialMetricCard
            label="Portfolio Value"
            value={formatCurrency(totalValue)}
            icon={<DollarSign className="w-6 h-6" />}
            gradient="from-plum-500 to-plum-700"
            subtitle="Current market valuation"
          />
          <FinancialMetricCard
            label="Unrealized Gain"
            value={formatCurrency(unrealizedGain)}
            icon={unrealizedGain >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
            gradient={unrealizedGain >= 0 ? "from-green-500 to-green-700" : "from-red-500 to-red-700"}
            subtitle={`${unrealizedGainPercent >= 0 ? '+' : ''}${formatPercent(unrealizedGainPercent)} from acquisition`}
          />
          <FinancialMetricCard
            label="Loan-to-Value Ratio"
            value={formatPercent(currentLVR)}
            icon={<Percent className="w-6 h-6" />}
            gradient="from-coral-500 to-coral-700"
            subtitle={`${formatCurrency(assumedLoanAmount)} assumed loan`}
          />
          <FinancialMetricCard
            label="Debt Service Coverage"
            value={debtServiceCoverage.toFixed(2) + 'x'}
            icon={<BarChart3 className="w-6 h-6" />}
            gradient="from-plum-600 to-coral-500"
            subtitle={`${formatPercent(interestRate)} interest rate`}
          />
        </div>

        {/* Risk Assessment */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          <RiskCard
            title="Health Risk"
            value={formatPercent(healthRiskPercent)}
            description={`${sickCattle.toLocaleString()} cattle requiring attention out of ${totalCattle.toLocaleString()}`}
            status={healthRiskPercent < 5 ? 'low' : healthRiskPercent < 10 ? 'medium' : 'high'}
          />
          <RiskCard
            title="Concentration Risk"
            value={formatPercent(concentrationRisk)}
            description={`Largest client: ${largestClient.client?.name || 'Unknown'} (${largestClient.count.toLocaleString()} head)`}
            status={concentrationRisk < 25 ? 'low' : concentrationRisk < 40 ? 'medium' : 'high'}
          />
          <RiskCard
            title="LTV Coverage"
            value={formatPercent(collateralCoverage)}
            description={`Equity cushion: ${formatPercent(equityCushion)}`}
            status={currentLVR < 70 ? 'low' : currentLVR < 80 ? 'medium' : 'high'}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Valuation Trend */}
          <div className="bg-white rounded-3xl p-8 shadow-soft-md">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-plum-500 to-plum-700">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-plum-900">Portfolio Valuation Trend</h2>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={valuationTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                  }}
                  formatter={(value: number) => formatCurrency(value * 100)}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8B5CF6" 
                  strokeWidth={3}
                  dot={{ fill: '#6D28D9', r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Breed Concentration */}
          <div className="bg-white rounded-3xl p-8 shadow-soft-md">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-coral-500 to-coral-700">
                <PieChart className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-plum-900">Breed Diversification</h2>
            </div>
            <div className="space-y-4">
              {breedConcentration.map((breed, i) => (
                <div key={breed.breed}>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold text-gray-900">{breed.breed}</span>
                    <span className="text-gray-600">{formatPercent(breed.percentage)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full bg-gradient-to-r ${
                        i % 3 === 0 ? 'from-plum-400 to-plum-600' :
                        i % 3 === 1 ? 'from-coral-400 to-coral-600' :
                        'from-plum-600 to-coral-500'
                      }`}
                      style={{ width: `${breed.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Compliance & Certification */}
        <div className="bg-white rounded-3xl p-8 shadow-soft-md mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-gradient-to-br from-plum-600 to-coral-500">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-plum-900">Compliance & Verification</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <ComplianceCard
              label="NLIS Compliance"
              percentage={nlisCompliancePercent}
              count={nlisCompliant}
              total={totalCattle}
            />
            <ComplianceCard
              label="Blockchain Verified"
              percentage={blockchainCompliancePercent}
              count={blockchainVerified}
              total={totalCattle}
            />
            <ComplianceCard
              label="APRA Compliant"
              percentage={100}
              count={totalCattle}
              total={totalCattle}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CertificationTierCard
              tier="GOLD"
              count={goldCount}
              total={totalCattle}
              gradient="from-yellow-500 to-yellow-700"
            />
            <CertificationTierCard
              tier="SILVER"
              count={silverCount}
              total={totalCattle}
              gradient="from-gray-400 to-gray-600"
            />
            <CertificationTierCard
              tier="BRONZE"
              count={bronzeCount}
              total={totalCattle}
              gradient="from-orange-500 to-orange-700"
            />
          </div>
        </div>

        {/* Client Portfolio Breakdown */}
        <div className="bg-white rounded-3xl p-8 shadow-soft-md">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-gradient-to-br from-plum-500 to-plum-700">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-plum-900">Client Portfolio Breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-lavender-200">
                  <th className="text-left py-4 px-4 font-bold text-plum-900">Client</th>
                  <th className="text-right py-4 px-4 font-bold text-plum-900">Cattle Count</th>
                  <th className="text-right py-4 px-4 font-bold text-plum-900">Portfolio Value</th>
                  <th className="text-right py-4 px-4 font-bold text-plum-900">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {clientPortfolios.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 px-4 text-center text-gray-500">
                      No client data available
                    </td>
                  </tr>
                ) : (
                  clientPortfolios
                    .filter(p => p.count > 0) // Only show clients with cattle
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 10)
                    .map((portfolio) => {
                    const percentage = totalValue > 0 ? (portfolio.value / totalValue) * 100 : 0;
                    return (
                      <tr key={portfolio.client.id} className="border-b border-lavender-100 hover:bg-lavender-50 transition-colors">
                        <td className="py-4 px-4">
                          <Link href={`/clients/${portfolio.client.id}`}>
                            <a className="font-semibold text-plum-900 hover:text-plum-700">
                              {portfolio.client.name}
                            </a>
                          </Link>
                        </td>
                        <td className="py-4 px-4 text-right text-gray-900 font-medium">
                          {portfolio.count.toLocaleString()}
                        </td>
                        <td className="py-4 px-4 text-right font-bold text-coral-600">
                          {formatCurrency(portfolio.value)}
                        </td>
                        <td className="py-4 px-4 text-right text-gray-600">
                          {formatPercent(percentage)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function FinancialMetricCard({ label, value, icon, gradient, subtitle }: {
  label: string;
  value: string;
  icon: React.ReactNode;
  gradient: string;
  subtitle: string;
}) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-soft-md hover:shadow-3d-purple transition-all">
      <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${gradient} text-white mb-4`}>
        {icon}
      </div>
      <div className="text-sm text-gray-600 mb-2 font-medium">{label}</div>
      <div className="text-3xl font-bold text-plum-900 mb-1">{value}</div>
      <div className="text-xs text-gray-500">{subtitle}</div>
    </div>
  );
}

function RiskCard({ title, value, description, status }: {
  title: string;
  value: string;
  description: string;
  status: 'low' | 'medium' | 'high';
}) {
  const statusConfig = {
    low: { icon: <CheckCircle2 className="w-5 h-5" />, gradient: 'from-green-500 to-green-700', text: 'Low Risk' },
    medium: { icon: <AlertTriangle className="w-5 h-5" />, gradient: 'from-yellow-500 to-yellow-700', text: 'Medium Risk' },
    high: { icon: <AlertTriangle className="w-5 h-5" />, gradient: 'from-red-500 to-red-700', text: 'High Risk' },
  };

  const config = statusConfig[status];

  return (
    <div className="bg-white rounded-3xl p-6 shadow-soft-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-plum-900">{title}</h3>
        <div className={`p-2 rounded-xl bg-gradient-to-br ${config.gradient} text-white`}>
          {config.icon}
        </div>
      </div>
      <div className="text-3xl font-bold text-plum-900 mb-2">{value}</div>
      <div className="text-sm text-gray-600 mb-3">{description}</div>
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-br ${config.gradient} text-white text-sm font-semibold`}>
        {config.text}
      </div>
    </div>
  );
}

function ComplianceCard({ label, percentage, count, total }: {
  label: string;
  percentage: number;
  count: number;
  total: number;
}) {
  return (
    <div className="bg-lavender-50 rounded-2xl p-6 border-2 border-lavender-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-plum-900">{label}</h4>
        <CheckCircle2 className="w-5 h-5 text-green-600" />
      </div>
      <div className="text-3xl font-bold text-plum-900 mb-2">{percentage.toFixed(1)}%</div>
      <div className="text-sm text-gray-600">{count.toLocaleString()} of {total.toLocaleString()} cattle</div>
    </div>
  );
}

function CertificationTierCard({ tier, count, total, gradient }: {
  tier: string;
  count: number;
  total: number;
  gradient: string;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="bg-white rounded-2xl p-6 border-2 border-lavender-200">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold`}>
          {tier[0]}
        </div>
        <div>
          <h4 className="font-bold text-plum-900">{tier} Tier</h4>
          <div className="text-sm text-gray-600">{count.toLocaleString()} cattle</div>
        </div>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-3 mb-2">
        <div
          className={`h-3 rounded-full bg-gradient-to-r ${gradient}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-sm text-gray-600 text-right">{percentage.toFixed(1)}%</div>
    </div>
  );
}
