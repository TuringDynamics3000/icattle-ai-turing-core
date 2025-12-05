import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { ArrowLeft, Building2, MapPin, Phone, Mail, TrendingUp, FileDown, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportClientsToCSV, type ClientExportData } from "@/lib/exportCSV";

export function Clients() {
  const { data: clients, isLoading } = trpc.clients.active.useQuery();

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-lavender-50 p-6">
        <Skeleton className="h-12 w-64 mb-6" />
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  const totalCattle = clients?.reduce((sum, c) => sum + (c.cattle_count || 0), 0) || 0;
  const totalValue = clients?.reduce((sum, c) => sum + (c.total_value || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-lavender-50">
      {/* Hero Header with Gradient */}
      <section className="relative overflow-hidden bg-gradient-purple-deep">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-10 w-64 h-64 bg-gradient-purple-pink opacity-30 shape-blob blur-3xl"></div>
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-gradient-coral-cream opacity-20 shape-circle blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-6 py-16 relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Link href="/">
                  <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <ArrowLeft className="h-5 w-5 text-white" />
                  </button>
                </Link>
                <h1 className="font-serif font-bold text-5xl text-white">Client Accounts</h1>
              </div>
              <p className="text-lavender-100 text-xl">
                Producer and feedlot portfolio management
              </p>
            </div>
            <Button
              onClick={() => {
                if (clients) {
                  const exportData: ClientExportData[] = clients.map(client => ({
                    id: client.id,
                    name: client.name,
                    contactEmail: client.contactEmail || '',
                    contactPhone: client.contactPhone || '',
                    abn: client.abn || '',
                    address: client.address || '',
                    cattleCount: client.cattle_count || 0,
                    totalValue: client.total_value || 0,
                  }));
                  exportClientsToCSV(exportData);
                }
              }}
              className="bg-white text-plum-800 hover:bg-lavender-50 gap-2"
            >
              <FileDown className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-12">
        {/* Portfolio Summary */}
        <div className="bg-white rounded-3xl p-8 shadow-soft-md mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-gradient-to-br from-plum-600 to-coral-500">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-plum-900">Portfolio Summary</h2>
          </div>
          <p className="text-gray-600 mb-6">Aggregate statistics across all clients</p>
          
          <div className="grid gap-6 md:grid-cols-3">
            <div className="p-6 bg-gradient-to-br from-lavender-50 to-lavender-100 rounded-2xl">
              <div className="text-sm text-plum-600 font-medium mb-2">Total Clients</div>
              <div className="text-4xl font-bold text-plum-900">{clients?.length || 0}</div>
            </div>
            <div className="p-6 bg-gradient-to-br from-coral-50 to-coral-100 rounded-2xl">
              <div className="text-sm text-coral-700 font-medium mb-2">Total Cattle</div>
              <div className="text-4xl font-bold text-coral-900">{totalCattle.toLocaleString()}</div>
            </div>
            <div className="p-6 bg-gradient-to-br from-plum-50 to-plum-100 rounded-2xl">
              <div className="text-sm text-plum-600 font-medium mb-2">Combined Portfolio Value</div>
              <div className="text-4xl font-bold text-plum-900">
                {formatCurrency(totalValue)}
              </div>
            </div>
          </div>
        </div>

        {/* Client List */}
        <div className="space-y-6">
          {clients?.map((client) => (
            <Link key={client.id} href={`/clients/${client.id}`}>
              <div className="bg-white rounded-3xl p-8 shadow-soft-md hover:shadow-3d-purple transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-plum-600 to-coral-500 group-hover:scale-110 transition-transform">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-plum-900 group-hover:text-plum-700 transition-colors">
                        {client.name}
                      </h3>
                      <p className="text-gray-600">ABN: {client.abn}</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700 border-green-300">
                    Active
                  </Badge>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {/* Contact Information */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-plum-600 uppercase tracking-wide">
                      Contact Information
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Mail className="h-4 w-4 text-coral-500" />
                        <span>{client.contactEmail}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Phone className="h-4 w-4 text-coral-500" />
                        <span>{client.contactPhone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <MapPin className="h-4 w-4 text-coral-500" />
                        <span>{client.address}, {client.state} {client.postcode}</span>
                      </div>
                    </div>
                  </div>

                  {/* Portfolio Statistics */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-plum-600 uppercase tracking-wide">
                      Portfolio Statistics
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-lavender-50 rounded-xl border-2 border-lavender-200">
                        <div className="text-sm text-plum-600 font-medium mb-1">Total Cattle</div>
                        <div className="text-2xl font-bold text-plum-900">
                          {(client.cattle_count || 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="p-4 bg-coral-50 rounded-xl border-2 border-coral-200">
                        <div className="text-sm text-coral-700 font-medium mb-1">Portfolio Value</div>
                        <div className="text-2xl font-bold text-coral-900">
                          {formatCurrency(client.total_value || 0)}
                        </div>
                      </div>
                    </div>
                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-gray-600">Average Value per Head</span>
                      <span className="font-semibold text-plum-900">
                        {formatCurrency(
                          client.cattle_count && client.cattle_count > 0
                            ? (client.total_value || 0) / client.cattle_count
                            : 0
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-lavender-200">
                  <div className="flex items-center justify-end gap-2 text-plum-600 group-hover:text-plum-700 font-semibold">
                    <TrendingUp className="h-4 w-4" />
                    <span>View Detailed Portfolio</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {clients?.length === 0 && (
          <div className="bg-white rounded-3xl p-12 text-center shadow-soft-md">
            <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Clients Found</h3>
            <p className="text-gray-500">Start by adding your first client account.</p>
          </div>
        )}
      </div>
    </div>
  );
}
