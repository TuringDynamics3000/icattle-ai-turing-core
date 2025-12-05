import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Users, Database, MapPin, BarChart3, PieChart, Shield, Activity, Building2, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from "recharts";

export function HomeDashboard() {
  const { data: summary, isLoading: summaryLoading } = trpc.portfolio.summary.useQuery({});
  const { data: breedDist, isLoading: breedLoading } = trpc.portfolio.breedDistribution.useQuery({});
  const { data: typeDist, isLoading: typeLoading } = trpc.portfolio.typeDistribution.useQuery({});
  const { data: activeClients, isLoading: clientsLoading } = trpc.clients.active.useQuery();

  if (summaryLoading || breedLoading || typeLoading) {
    return (
      <div className="min-h-screen bg-lavender-50">
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

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  const COLORS = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#6366F1'];

  return (
    <div className="min-h-screen bg-lavender-50">
      {/* Header with gradient background */}
      <div className="bg-gradient-purple-deep relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 right-20 w-64 h-64 bg-gradient-purple-pink opacity-30 shape-blob blur-3xl"></div>
          <div className="absolute bottom-10 left-20 w-96 h-96 bg-gradient-coral-cream opacity-20 shape-circle blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-6 py-16 relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-coral-400" />
            <span className="text-lavender-100 text-sm font-medium">Live Dashboard</span>
          </div>
          <h1 className="font-serif font-bold text-5xl text-white mb-3">Portfolio Overview</h1>
          <p className="text-lavender-100 text-xl">
            Real-time insights across {totalCattle.toLocaleString()} cattle on {totalClients} Australian farms
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 -mt-20 mb-12 relative z-20">
          <MetricCard
            label="Total Cattle"
            value={totalCattle.toLocaleString()}
            icon={<Database className="w-6 h-6" />}
            gradient="from-plum-500 to-plum-700"
          />
          <MetricCard
            label="Portfolio Value"
            value={formatCurrency(totalValue)}
            icon={<TrendingUp className="w-6 h-6" />}
            gradient="from-coral-500 to-coral-700"
          />
          <MetricCard
            label="Active Farms"
            value={totalClients.toString()}
            icon={<MapPin className="w-6 h-6" />}
            gradient="from-plum-600 to-coral-500"
          />
          <MetricCard
            label="Avg Value/Head"
            value={formatCurrency(avgValue)}
            icon={<BarChart3 className="w-6 h-6" />}
            gradient="from-plum-400 to-plum-600"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Link href="/demo">
            <a className="block">
              <div className="bg-white rounded-3xl p-6 shadow-soft-md hover:shadow-3d-purple transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-plum-500 to-plum-700 text-white group-hover:scale-110 transition-transform">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-plum-900 group-hover:text-plum-700 transition-colors">
                      Golden Record Demo
                    </h3>
                    <p className="text-sm text-gray-600">Verified provenance system</p>
                  </div>
                </div>
              </div>
            </a>
          </Link>

          <Link href="/bank">
            <a className="block">
              <div className="bg-white rounded-3xl p-6 shadow-soft-md hover:shadow-3d-coral transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-coral-500 to-coral-700 text-white group-hover:scale-110 transition-transform">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-plum-900 group-hover:text-coral-700 transition-colors">
                      Bank & Investor View
                    </h3>
                    <p className="text-sm text-gray-600">Portfolio analytics</p>
                  </div>
                </div>
              </div>
            </a>
          </Link>

          <Link href="/cattle">
            <a className="block">
              <div className="bg-white rounded-3xl p-6 shadow-soft-md hover:shadow-soft-lg transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-plum-600 to-coral-500 text-white group-hover:scale-110 transition-transform">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-plum-900 group-hover:text-plum-700 transition-colors">
                      View All Cattle
                    </h3>
                    <p className="text-sm text-gray-600">Browse complete registry</p>
                  </div>
                </div>
              </div>
            </a>
          </Link>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Breed Distribution */}
          <div className="bg-white rounded-3xl p-8 shadow-soft-md">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-plum-500 to-plum-700">
                <PieChart className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-plum-900">Breed Distribution</h2>
            </div>
            <div className="space-y-4">
              {breedDist?.slice(0, 6).map((breed, i) => (
                <div key={breed.breed}>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold text-gray-900">{breed.breed}</span>
                    <span className="text-gray-600">{breed.count.toLocaleString()} head</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full bg-gradient-to-r ${
                        i % 3 === 0 ? 'from-plum-400 to-plum-600' :
                        i % 3 === 1 ? 'from-coral-400 to-coral-600' :
                        'from-plum-600 to-coral-500'
                      }`}
                      style={{ width: `${(breed.count / totalCattle) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Type Distribution */}
          <div className="bg-white rounded-3xl p-8 shadow-soft-md">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-coral-500 to-coral-700">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-plum-900">Cattle Type Distribution</h2>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={typeDist}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="cattle_type" 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Bar dataKey="count" fill="url(#colorGradient)" radius={[12, 12, 0, 0]} />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#6D28D9" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Farms Table */}
        <div className="bg-white rounded-3xl p-8 shadow-soft-md">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-gradient-to-br from-plum-600 to-coral-500">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-plum-900">Top Performing Farms</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-lavender-200">
                  <th className="text-left py-4 px-4 font-bold text-plum-900">Farm Name</th>
                  <th className="text-left py-4 px-4 font-bold text-plum-900">Location</th>
                  <th className="text-right py-4 px-4 font-bold text-plum-900">Cattle</th>
                  <th className="text-right py-4 px-4 font-bold text-plum-900">Value</th>
                </tr>
              </thead>
              <tbody>
                {activeClients?.slice(0, 10).map((client, i) => (
                  <tr key={client.id} className="border-b border-lavender-100 hover:bg-lavender-50 transition-colors">
                    <td className="py-4 px-4">
                      <Link href={`/clients/${client.id}`}>
                        <a className="font-semibold text-plum-900 hover:text-plum-700 cursor-pointer">
                          {client.name}
                        </a>
                      </Link>
                    </td>
                    <td className="py-4 px-4 text-gray-600">{client.state}</td>
                    <td className="py-4 px-4 text-right text-gray-900 font-medium">{client.cattle_count?.toLocaleString() || 0}</td>
                    <td className="py-4 px-4 text-right font-bold text-coral-600">
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

function MetricCard({ label, value, icon, gradient }: {
  label: string;
  value: string;
  icon: React.ReactNode;
  gradient: string;
}) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-soft-md hover:shadow-3d-purple transition-all">
      <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${gradient} text-white mb-4`}>
        {icon}
      </div>
      <div className="text-sm text-gray-600 mb-2 font-medium">{label}</div>
      <div className="text-3xl font-bold text-plum-900">{value}</div>
    </div>
  );
}
