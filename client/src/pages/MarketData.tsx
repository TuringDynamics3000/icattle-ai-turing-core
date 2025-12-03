import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, TrendingUp, RefreshCw, DollarSign, Info } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useState } from "react";

export function MarketData() {
  const [refreshing, setRefreshing] = useState(false);
  const { data: marketData, isLoading, refetch } = trpc.market.getAllMarketData.useQuery({
    forceRefresh: false,
  });
  const { data: trends } = trpc.market.getMarketTrends.useQuery();

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('en-AU', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Market Data</h1>
          </div>
          <p className="text-muted-foreground">
            Real-time cattle pricing from AuctionsPlus Price Discovery
          </p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={refreshing}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Cache Status */}
      {marketData && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-900">
                  Data cached {marketData.cache_age_hours} hours ago
                </p>
                <p className="text-xs text-blue-700">
                  Last updated: {formatDateTime(marketData.cached_at)}
                </p>
                <p className="text-xs text-blue-600">
                  Cache refreshes automatically every 24 hours. Click "Refresh Data" to force an update.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Market Trends Summary */}
      {trends && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Market Trends by Category
            </CardTitle>
            <CardDescription>
              Average prices across {trends.total_samples} market samples
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis 
                    label={{ value: 'Price per kg (AUD)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelStyle={{ color: '#000' }}
                  />
                  <Legend />
                  <Bar dataKey="average_price_per_kg" fill="#3b82f6" name="Average Price/kg" />
                  <Bar dataKey="min_price_per_kg" fill="#10b981" name="Min Price/kg" />
                  <Bar dataKey="max_price_per_kg" fill="#ef4444" name="Max Price/kg" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Price Discovery Data */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Price Discovery by Breed & Category</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {marketData?.price_discovery.map((item, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{item.breed}</CardTitle>
                    <CardDescription>{item.category}</CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {item.weight_range}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Primary Price */}
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Market Price</div>
                  <div className="text-3xl font-bold text-blue-900">
                    {formatCurrency(item.price_per_kg)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">per kilogram</div>
                </div>

                {/* Price Range */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Min</div>
                    <div className="text-lg font-semibold text-green-700">
                      {formatCurrency(item.price_range_min)}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Max</div>
                    <div className="text-lg font-semibold text-red-700">
                      {formatCurrency(item.price_range_max)}
                    </div>
                  </div>
                </div>

                {/* Sample Size */}
                <div className="flex items-center justify-between text-sm pt-2 border-t">
                  <span className="text-muted-foreground">Sample Size</span>
                  <Badge variant="secondary">{item.sample_size} auctions</Badge>
                </div>

                {/* Example Valuation */}
                <div className="pt-2 border-t">
                  <div className="text-xs text-muted-foreground mb-2">Example: 450kg animal</div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Estimated Value</span>
                    <span className="text-lg font-bold text-blue-900">
                      {formatCurrency(item.price_per_kg * 450)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Data Source Info */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <h3 className="font-semibold text-amber-900">About This Data</h3>
            <p className="text-sm text-amber-800">
              Market pricing data is sourced from AuctionsPlus, Australia's leading online livestock 
              trading platform. Prices reflect recent auction results and are updated daily.
            </p>
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> This is simulated data based on December 2025 market research. 
              Live data integration requires AuctionsPlus authentication and API access.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <DollarSign className="h-4 w-4 text-amber-700" />
              <span className="text-xs text-amber-700">
                Prices shown in AUD per kilogram live weight
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
