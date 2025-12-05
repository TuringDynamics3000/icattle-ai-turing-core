import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Users, Database, MapPin, BarChart3, PieChart, Shield, Activity } from "lucide-react";
import { Link } from "wouter";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export function HomeDashboard() {
  const { data: summary, isLoading: summaryLoading } = trpc.portfolio.summary.useQuery({});
  const { data: breedDist, isLoading: breedLoading } = trpc.portfolio.breedDistribution.useQuery({});
  const { data: typeDist, isLoading: typeLoading } = trpc.portfolio.typeDistribution.useQuery({});
  const { data: marketVal, isLoading: marketLoading } = trpc.portfolio.marketValuation.useQuery({});
  const { data: activeClients, isLoading: clientsLoading } = trpc.clients.active.useQuery();

  if (summaryLoading || breedLoading || typeLoading) {
    return (
      <div className="min-h-screen bg-cream-50">
        <div className="container mx-auto px-6 py-12">
          <Skeleton className="h-12 w-64 mb-12" />
          <div className="grid gap-6 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
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
  const totalClients = activeClients?.length || 0;
  const sickCattle = summary?.sickCattle || 0;

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="container mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="font-serif font-light text-5xl text-mauve-600 mb-2">Portfolio Dashboard</h1>
          <p className="text-gray-600 text-lg">
            Real-time overview of {totalCattle.toLocaleString()} cattle across {totalClients} Australian farms
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <MetricCard
            label="Total Cattle"
            value={totalCattle.toLocaleString()}
            icon={<Database className="w-6 h-6" />}
            color="mauve"
          />
          <MetricCard
            label="Portfolio Value"
            value={formatCurrency(totalValue)}
            icon={<TrendingUp className="w-6 h-6" />}
            color="coral"
          />
          <MetricCard
            label="Active Farms"
            value={totalClients.toString()}
            icon={<MapPin className="w-6 h-6" />}
            color="lavender"
          />
          <MetricCard
            label="Avg Value/Head"
            value={formatCurrency(avgValue)}
            icon={<BarChart3 className="w-6 h-6" />}
            color="cream"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Link href="/golden-record">
            <div className="bg-white rounded-2xl p-6 shadow-soft-md hover:shadow-soft-lg transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-mauve-400 to-mauve-600 text-white">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-mauve-600 transition-colors">
                    Golden Record
                  </h3>
                  <p className="text-sm text-gray-600">Verified provenance</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/bank-view">
            <div className="bg-white rounded-2xl p-6 shadow-soft-md hover:shadow-soft-lg transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-coral-400 to-coral-600 text-white">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-coral-600 transition-colors">
                    Bank & Investor View
                  </h3>
                  <p className="text-sm text-gray-600">Portfolio analytics</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/provenance">
            <div className="bg-white rounded-2xl p-6 shadow-soft-md hover:shadow-soft-lg transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-lavender-400 to-lavender-600 text-white">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-lavender-600 transition-colors">
                    Provenance Tracking
                  </h3>
                  <p className="text-sm text-gray-600">Ownership history</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Breed Distribution */}
          <div className="bg-white rounded-2xl p-8 shadow-soft-md">
            <div className="flex items-center gap-3 mb-6">
              <PieChart className="w-6 h-6 text-mauve-600" />
              <h2 className="text-2xl font-semibold text-gray-900">Breed Distribution</h2>
            </div>
            <div className="space-y-4">
              {breedDist?.slice(0, 6).map((breed, i) => (
                <div key={breed.breed}>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium text-gray-900">{breed.breed}</span>
                    <span className="text-gray-600">{breed.count.toLocaleString()} head</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full bg-gradient-to-r ${
                        i % 3 === 0 ? 'from-mauve-400 to-mauve-600' :
                        i % 3 === 1 ? 'from-coral-400 to-coral-600' :
                        'from-lavender-400 to-lavender-600'
                      }`}
                      style={{ width: `${(breed.count / totalCattle) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Type Distribution */}
          <div className="bg-white rounded-2xl p-8 shadow-soft-md">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="w-6 h-6 text-mauve-600" />
              <h2 className="text-2xl font-semibold text-gray-900">Cattle Type Distribution</h2>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={typeDist}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="cattle_type" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Bar dataKey="count" fill="url(#colorGradient)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Market Valuation Trend */}
        {marketVal && marketVal.length > 0 && (
          <div className="bg-white rounded-2xl p-8 shadow-soft-md mb-12">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-6 h-6 text-mauve-600" />
              <h2 className="text-2xl font-semibold text-gray-900">Portfolio Valuation Trend</h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={marketVal}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#a78bfa" 
                  strokeWidth={3}
                  dot={{ fill: '#7c3aed', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Farms Table */}
        <div className="bg-white rounded-2xl p-8 shadow-soft-md">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Top Performing Farms</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Farm Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Location</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Cattle</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Value</th>
                </tr>
              </thead>
              <tbody>
                {activeClients?.slice(0, 10).map((client) => (
                  <tr key={client.id} className="border-b border-gray-100 hover:bg-lavender-50 transition-colors">
                    <td className="py-4 px-4">
                      <Link href={`/clients/${client.id}`}>
                        <span className="font-medium text-gray-900 hover:text-mauve-600 cursor-pointer">
                          {client.name}
                        </span>
                      </Link>
                    </td>
                    <td className="py-4 px-4 text-gray-600">{client.state}</td>
                    <td className="py-4 px-4 text-right text-gray-900">{client.cattle_count?.toLocaleString() || 0}</td>
                    <td className="py-4 px-4 text-right font-medium text-mauve-600">
                      {formatCurrency(client.total_value || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, color }: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    mauve: 'from-mauve-400 to-mauve-600',
    coral: 'from-coral-400 to-coral-600',
    lavender: 'from-lavender-400 to-lavender-600',
    cream: 'from-cream-400 to-cream-600',
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-soft-md hover:shadow-soft-lg transition-all">
      <div className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${colorMap[color]} text-white mb-3`}>
        {icon}
      </div>
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
    </div>
  );
}
