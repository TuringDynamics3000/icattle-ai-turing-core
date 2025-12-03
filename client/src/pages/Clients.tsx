import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { ArrowLeft, Building2, MapPin, Phone, Mail, TrendingUp, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportClientsToCSV, type ClientExportData } from "@/lib/exportCSV";

export function Clients() {
  const { data: clients, isLoading } = trpc.clients.active.useQuery();
  const { data: allCattle } = trpc.cattle.active.useQuery();

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  const getClientStats = (clientId: number) => {
    if (!allCattle) return { count: 0, totalValue: 0 };
    
    const clientCattle = allCattle.filter(c => c.clientId === clientId);
    const totalValue = clientCattle.reduce((sum, c) => sum + (c.currentValuation || 0), 0);
    
    return {
      count: clientCattle.length,
      totalValue,
      avgValue: clientCattle.length > 0 ? totalValue / clientCattle.length : 0,
    };
  };

  const getClientTypeBadge = (type: string) => {
    switch (type) {
      case 'producer':
        return <Badge className="bg-blue-600">Producer</Badge>;
      case 'feedlot':
        return <Badge className="bg-purple-600">Feedlot</Badge>;
      case 'breeder':
        return <Badge className="bg-green-600">Breeder</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/">
              <button className="p-2 hover:bg-accent rounded-md">
                <ArrowLeft className="h-5 w-5" />
              </button>
            </Link>
            <h1 className="text-4xl font-bold tracking-tight">Client Accounts</h1>
          </div>
          <p className="text-muted-foreground mt-2">
            Producer and feedlot portfolio management
          </p>
        </div>
        <Button
          onClick={() => {
            if (clients && allCattle) {
              const exportData: ClientExportData[] = clients.map(client => {
                const stats = getClientStats(client.id);
                return {
                  id: client.id,
                  name: client.name,
                  contactEmail: client.contactEmail || '',
                  contactPhone: client.contactPhone || '',
                  abn: client.abn || '',
                  address: client.address || '',
                  cattleCount: stats.count,
                  totalValue: stats.totalValue,
                };
              });
              exportClientsToCSV(exportData);
            }
          }}
          variant="outline"
          className="gap-2"
        >
          <FileDown className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Client Cards */}
      <div className="grid gap-6">
        {clients?.map((client) => {
          const stats = getClientStats(client.id);
          
          return (
            <Link key={client.id} href={`/clients/${client.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-6 w-6 text-blue-600" />
                      <CardTitle className="text-2xl">{client.name}</CardTitle>
                      {getClientTypeBadge(client.clientType)}
                    </div>
                    <CardDescription>ABN: {client.abn}</CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                    Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Contact Information */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Contact Information
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{client.contactEmail}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{client.contactPhone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{client.address}, {client.state} {client.postcode}</span>
                      </div>
                    </div>
                    {client.propertySize && (
                      <div className="pt-2 border-t">
                        <div className="text-sm text-muted-foreground">Property Size</div>
                        <div className="text-lg font-semibold">
                          {client.propertySize.toLocaleString()} hectares
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Portfolio Statistics */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Portfolio Statistics
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="text-sm text-blue-600 font-medium">Total Cattle</div>
                        <div className="text-2xl font-bold text-blue-900">{stats.count}</div>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="text-sm text-green-600 font-medium">Portfolio Value</div>
                        <div className="text-2xl font-bold text-green-900">
                          {formatCurrency(stats.totalValue)}
                        </div>
                      </div>
                    </div>
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Average Value per Head</span>
                        <span className="font-semibold">{formatCurrency(stats.avgValue || 0)}</span>
                      </div>
                    </div>
                    <Link href={`/clients/${client.id}`}>
                      <button className="w-full mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        View Detailed Portfolio
                      </button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
            </Link>
          );
        })}
      </div>

      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50">
        <CardHeader>
          <CardTitle>Portfolio Summary</CardTitle>
          <CardDescription>Aggregate statistics across all clients</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="text-sm text-muted-foreground">Total Clients</div>
              <div className="text-3xl font-bold">{clients?.length || 0}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Cattle</div>
              <div className="text-3xl font-bold">{allCattle?.length || 0}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Combined Portfolio Value</div>
              <div className="text-3xl font-bold">
                {formatCurrency(
                  allCattle?.reduce((sum, c) => sum + (c.currentValuation || 0), 0) || 0
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
