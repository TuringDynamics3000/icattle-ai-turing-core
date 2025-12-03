import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, TrendingUp, TrendingDown, DollarSign, FileText, CheckCircle2, XCircle } from 'lucide-react';

export default function FinancialDashboard() {
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  
  // Check if Xero is connected
  const { data: tenants, isLoading: tenantsLoading } = trpc.xero.getTenants.useQuery();
  const { data: authUrl } = trpc.xero.getAuthUrl.useQuery();
  
  // Get AASB 141 disclosure
  const { data: disclosure, isLoading: disclosureLoading } = trpc.xero.generateAASB141Disclosure.useQuery({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString(),
    endDate: new Date().toISOString(),
  });
  
  // Mutations
  const syncMutation = trpc.xero.syncLivestockToXero.useMutation();
  const disconnectMutation = trpc.xero.disconnect.useMutation();
  
  const isConnected = tenants && tenants.length > 0;
  
  const handleConnect = () => {
    if (authUrl?.url) {
      window.location.href = authUrl.url;
    }
  };
  
  const handleSync = async () => {
    if (!selectedTenant && tenants?.[0]) {
      setSelectedTenant(tenants[0].tenantId);
    }
    
    try {
      await syncMutation.mutateAsync({
        tenantId: selectedTenant || tenants?.[0]?.tenantId || '',
      });
      alert('Livestock synced to Xero successfully!');
    } catch (error) {
      alert('Failed to sync livestock: ' + (error as Error).message);
    }
  };
  
  const handleDisconnect = async () => {
    if (confirm('Are you sure you want to disconnect Xero?')) {
      await disconnectMutation.mutateAsync();
      window.location.reload();
    }
  };
  
  if (tenantsLoading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  
  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Financial Dashboard</h1>
        <p className="text-muted-foreground">
          Livestock asset management with AASB 141 compliance
        </p>
      </div>
      
      {/* Xero Connection Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Xero Integration
          </CardTitle>
          <CardDescription>
            Connect your Xero account to sync livestock assets and financial data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isConnected ? (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  Connect Xero to automatically sync your livestock valuations as biological assets (AASB 141 compliant).
                </AlertDescription>
              </Alert>
              <Button onClick={handleConnect} disabled={!authUrl}>
                <Building2 className="mr-2 h-4 w-4" />
                Connect Xero
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Connected to Xero</span>
              </div>
              
              {tenants && tenants.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Connected Organizations:</p>
                  <ul className="space-y-1">
                    {tenants.map((tenant: any) => (
                      <li key={tenant.tenantId} className="text-sm">
                        • {tenant.tenantName || tenant.tenantId}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleSync} 
                  disabled={syncMutation.isPending}
                >
                  {syncMutation.isPending ? 'Syncing...' : 'Sync Livestock to Xero'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleDisconnect}
                  disabled={disconnectMutation.isPending}
                >
                  Disconnect
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* AASB 141 Disclosure */}
      {disclosure && (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Opening Balance
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${disclosure.biologicalAssets.openingBalance.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Start of period
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Fair Value Gains
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  +${disclosure.biologicalAssets.fairValueGains.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Valuation increases
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Fair Value Losses
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  -${disclosure.biologicalAssets.fairValueLosses.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Valuation decreases
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Closing Balance
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${disclosure.biologicalAssets.closingBalance.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Current value
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Livestock Groups */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Livestock Groups (AASB 141 Disclosure)</CardTitle>
              <CardDescription>
                Biological assets by type - measured at fair value less costs to sell
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {disclosure.livestockGroups.map((group) => (
                  <div key={group.type} className="flex items-center justify-between border-b pb-3">
                    <div>
                      <p className="font-medium">{group.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {group.quantity} head @ ${group.averageFairValue.toLocaleString()} avg
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        ${group.totalFairValue.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Total fair value</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Valuation Basis</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {disclosure.valuationBasis}
                </p>
                
                <h4 className="font-medium mb-2">Significant Assumptions</h4>
                <ul className="space-y-1">
                  {disclosure.significantAssumptions.map((assumption, i) => (
                    <li key={i} className="text-sm text-muted-foreground">
                      • {assumption}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
          
          {/* Reconciliation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Biological Assets Reconciliation
              </CardTitle>
              <CardDescription>
                Movement in carrying amount (AASB 141 requirement)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Opening balance</span>
                  <span className="font-medium">
                    ${disclosure.biologicalAssets.openingBalance.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Purchases</span>
                  <span className="font-medium text-green-600">
                    +${disclosure.biologicalAssets.purchases.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Sales</span>
                  <span className="font-medium text-red-600">
                    -${disclosure.biologicalAssets.sales.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Fair value gains</span>
                  <span className="font-medium text-green-600">
                    +${disclosure.biologicalAssets.fairValueGains.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Fair value losses</span>
                  <span className="font-medium text-red-600">
                    -${disclosure.biologicalAssets.fairValueLosses.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-3 bg-muted px-3 rounded-lg mt-2">
                  <span className="font-bold">Closing balance</span>
                  <span className="font-bold text-lg">
                    ${disclosure.biologicalAssets.closingBalance.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
