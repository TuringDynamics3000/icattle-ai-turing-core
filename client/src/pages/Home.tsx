import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Users, DollarSign, AlertCircle, Activity, Brain, Shield } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { Link } from "wouter";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export function Home() {
  const { data: summary, isLoading: summaryLoading } = trpc.portfolio.summary.useQuery({});
  const { data: breedDist, isLoading: breedLoading } = trpc.portfolio.breedDistribution.useQuery({});
  const { data: typeDist, isLoading: typeLoading } = trpc.portfolio.typeDistribution.useQuery({});
  const { data: marketVal, isLoading: marketLoading } = trpc.portfolio.marketValuation.useQuery({});
  const { data: recentEvents, isLoading: eventsLoading } = trpc.events.recent.useQuery({ limit: 10 });
  const { data: activeClients, isLoading: clientsLoading } = trpc.clients.active.useQuery();
  const { data: activeCattle, isLoading: cattleLoading } = trpc.cattle.active.useQuery();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B9D'];

  if (summaryLoading || breedLoading || typeLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const totalValue = summary?.totalValue || 0;
  const totalCattle = summary?.totalCattle || 0;
  const avgValue = totalCattle > 0 ? totalValue / totalCattle : 0;
  const totalClients = activeClients?.length || 0;
  const sickCattle = activeCattle?.filter(c => c.healthStatus === 'sick').length || 0;

  // Format currency (cents to dollars)
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Real-time livestock asset management and valuation platform
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {totalCattle} head of cattle
            </p>
          </CardContent>
        </Card>

        <Card className={marketVal?.marketPremium !== null && marketVal?.marketPremium !== undefined ? ((marketVal?.marketPremium || 0) > 0 ? "border-green-200 bg-green-50/30" : "border-red-200 bg-red-50/30") : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Premium/Discount</CardTitle>
            {marketVal?.marketPremium !== null && marketVal?.marketPremium !== undefined ? (
              (marketVal?.marketPremium || 0) > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )
            ) : (
              <Activity className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            {marketVal?.marketPremium !== null && marketVal?.marketPremium !== undefined ? (
              <>
                <div className={`text-2xl font-bold ${(marketVal?.marketPremium || 0) > 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {(marketVal?.marketPremium || 0) > 0 ? '+' : ''}{formatCurrency(marketVal?.marketPremium || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {marketVal?.cattleWithMarketData || 0} of {marketVal?.totalCattle || 0} cattle valued
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-muted-foreground">N/A</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Market data unavailable
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClients}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Producers and feedlots
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Alerts</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sickCattle}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Require attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Breed Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Breed Distribution</CardTitle>
            <CardDescription>Portfolio composition by breed</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={breedDist}
                  dataKey="count"
                  nameKey="breed"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.breed} (${entry.count})`}
                >
                  {breedDist?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Cattle Type Distribution</CardTitle>
            <CardDescription>By production purpose</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={typeDist}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Lifecycle Events</CardTitle>
          <CardDescription>Latest updates across all cattle</CardDescription>
        </CardHeader>
        <CardContent>
          {eventsLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {recentEvents?.slice(0, 8).map((event) => (
                <div key={event.id} className="flex items-start justify-between border-b pb-3 last:border-0">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-blue-600" />
                      <span className="font-medium capitalize">
                        {event.eventType.replace('_', ' ')}
                      </span>
                      {event.weight && (
                        <span className="text-sm text-muted-foreground">
                          • {event.weight}kg
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {event.notes || 'No notes'}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(event.eventDate).toLocaleDateString('en-AU')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/cattle">
          <Card className="hover:bg-accent cursor-pointer transition-colors">
            <CardHeader>
              <CardTitle>View All Cattle</CardTitle>
              <CardDescription>Browse digital twin registry</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/clients">
          <Card className="hover:bg-accent cursor-pointer transition-colors">
            <CardHeader>
              <CardTitle>Client Accounts</CardTitle>
              <CardDescription>Manage producer portfolios</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/reports">
          <Card className="hover:bg-accent cursor-pointer transition-colors">
            <CardHeader>
              <CardTitle>Financial Reports</CardTitle>
              <CardDescription>Bank-grade reporting</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/farmer">
          <Card className="hover:bg-accent cursor-pointer transition-colors">
            <CardHeader>
              <CardTitle>Farmer's Herd View</CardTitle>
              <CardDescription>GPS tracking & operations</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/bank">
          <Card className="hover:bg-accent cursor-pointer transition-colors">
            <CardHeader>
              <CardTitle>Bank & Investor View</CardTitle>
              <CardDescription>Risk metrics & compliance</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/market">
          <Card className="hover:bg-accent cursor-pointer transition-colors">
            <CardHeader>
              <CardTitle>Market Data</CardTitle>
              <CardDescription>Live MLA NLRS pricing</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/forecast">
          <Card className="hover:bg-accent cursor-pointer transition-colors border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Price Forecast
              </CardTitle>
              <CardDescription>ML 7-day predictions</CardDescription>
            </CardHeader>
          </Card>
        </Link>

            <Link href="/provenance">
              <Card className="hover:bg-accent cursor-pointer transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Provenance Dashboard
                  </CardTitle>
                  <CardDescription>
                    Turing Protocol confidence scores & fraud detection
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
            
            <Link href="/recommendations">
          <Card className="hover:bg-accent cursor-pointer transition-colors border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-600" />
                AI Recommendations
              </CardTitle>
              <CardDescription>Portfolio optimization</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        
        <Link href="/financial">
          <Card className="hover:bg-accent cursor-pointer transition-colors border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                Financial Dashboard
              </CardTitle>
              <CardDescription>Xero integration & AASB 141</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
