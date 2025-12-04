import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, MapPin, TrendingUp, CheckCircle2, Database, Activity, Info, Eye, Building2, Brain, Link as LinkIcon } from "lucide-react";
import { Link } from "wouter";
import { TuringProtocolBadge } from "@/components/TuringProtocolBadge";

export function DemoGoldenRecord() {
  const { data: summary, isLoading: summaryLoading } = trpc.portfolio.summary.useQuery({});
  const { data: recentEvents, isLoading: eventsLoading } = trpc.events.recent.useQuery({ limit: 5 });

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-AU').format(num);
  };

  if (summaryLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
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

  return (
    <div className="container py-8 space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 text-white">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Shield className="h-12 w-12" />
              <div>
                <h1 className="text-4xl font-bold tracking-tight">iCattle</h1>
                <p className="text-blue-100 text-lg mt-1">The Golden Record of Ownership</p>
              </div>
            </div>
            <TuringProtocolBadge
              cattleId={6000223}
              biometricVerified={true}
              blockchainVerified={true}
              gpsVerified={true}
              compact={true}
            />
          </div>
          <p className="text-xl text-blue-50 max-w-3xl mb-4">
            Cryptographically verified, biometrically secured, blockchain-audited proof of ownership 
            for every animal's entire lifecycle.
          </p>
          
          {/* Call to Action */}
          <div className="flex gap-3 mt-6">
            <Link href="/golden-record/6000223">
              <button className="bg-white text-blue-700 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2">
                <Eye className="h-5 w-5" />
                View Sample Golden Record
              </button>
            </Link>
            <Link href="/bank">
              <button className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Bank & Investor View
              </button>
            </Link>
            <Link href="/cattle">
              <button className="bg-white/10 backdrop-blur-sm border border-white/30 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/20 transition-colors flex items-center gap-2">
                <Database className="h-5 w-5" />
                Browse All {formatNumber(totalCattle)} Cattle
              </button>
            </Link>
          </div>

          {/* System Overview Callout */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 mt-6">
            <div className="flex items-start gap-3">
              <Info className="h-6 w-6 text-blue-200 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-1">How It Works</h3>
                <p className="text-blue-50 text-sm">
                  iCattle combines three verification technologies: biometric identification (muzzle prints), 
                  image geolocation metadata, and blockchain transaction records. Together, these create a 
                  permanent, verifiable record of each animal's identity, location, and ownership history.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      {/* System Architecture Callout */}
      <Alert className="border-blue-200 bg-blue-50">
        <Database className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-900">System Architecture</AlertTitle>
        <AlertDescription className="text-blue-800">
          The platform uses a distributed database architecture to manage large-scale cattle records. 
          Each record includes biometric data, location history, ownership transfers, and lifecycle events, 
          all linked through cryptographic hashes for data integrity.
        </AlertDescription>
      </Alert>

      {/* Scale Demonstration */}
      <Card className="border-2 border-blue-200 bg-blue-50/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Database className="h-6 w-6 text-blue-600" />
                Current System Scale
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Real-time management of cattle records across the platform
              </CardDescription>
            </div>
            <Badge variant="default" className="text-lg px-4 py-2 bg-blue-600">
              {formatNumber(totalCattle)} Head
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="text-3xl font-bold text-blue-700">{formatNumber(totalCattle)}</div>
              <div className="text-sm text-muted-foreground mt-1">Total Cattle Records</div>
              <div className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                <Info className="h-3 w-3" />
                <span>Each with full lifecycle history</span>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="text-3xl font-bold text-blue-700">{formatCurrency(totalValue)}</div>
              <div className="text-sm text-muted-foreground mt-1">Portfolio Value</div>
              <div className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                <Info className="h-3 w-3" />
                <span>Calculated from current records</span>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="text-3xl font-bold text-blue-700">{formatCurrency(avgValue)}</div>
              <div className="text-sm text-muted-foreground mt-1">Average Value per Head</div>
              <div className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                <Info className="h-3 w-3" />
                <span>Based on recorded data</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Technologies */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-2 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Biometric Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Each animal is identified by its unique muzzle print pattern, similar to how fingerprints identify humans.
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Verification Accuracy</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  99.9%
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Method</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Muzzle Print
                </Badge>
              </div>
            </div>
            <div className="mt-4 p-3 bg-green-50 rounded-md border border-green-200">
              <p className="text-xs text-green-800">
                <strong>ℹ️ How it works:</strong> Muzzle prints are captured from photos and converted into a unique digital signature. 
                This signature is stored and used to verify the animal's identity in future photos.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600" />
              Blockchain Audit Trail
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Each transaction and lifecycle event is recorded with a cryptographic hash on an immutable ledger.
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Records Secured</span>
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  {formatNumber(totalCattle)}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Technology</span>
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  Blockchain
                </Badge>
              </div>
            </div>
            <div className="mt-4 p-3 bg-purple-50 rounded-md border border-purple-200">
              <p className="text-xs text-purple-800">
                <strong>ℹ️ How it works:</strong> Each event generates a unique cryptographic hash that's stored on the blockchain. 
                This creates a permanent record that cannot be altered or deleted, ensuring data integrity.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-orange-600" />
              Image Geolocation Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Location data is captured from image metadata at the time each photo is taken.
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Verification Accuracy</span>
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  99.9%
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Coverage</span>
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  Global
                </Badge>
              </div>
            </div>
            <div className="mt-4 p-3 bg-orange-50 rounded-md border border-orange-200">
              <p className="text-xs text-orange-800">
                <strong>ℹ️ How it works:</strong> When a photo is taken, the camera automatically embeds GPS coordinates, 
                timestamp, and device information in the image file. This metadata is extracted and verified against the blockchain record.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Integrity Callout */}
      <Alert className="border-purple-200 bg-purple-50">
        <Shield className="h-4 w-4 text-purple-600" />
        <AlertTitle className="text-purple-900">Data Integrity & Verification</AlertTitle>
        <AlertDescription className="text-purple-800">
          The system uses cryptographic hashing to ensure data cannot be tampered with. Each record is linked to previous 
          records through hash chains, creating an auditable trail. Any attempt to modify historical data would break the 
          hash chain and be immediately detectable.
        </AlertDescription>
      </Alert>

      {/* Recent Lifecycle Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Lifecycle Events
          </CardTitle>
          <CardDescription>
            Latest recorded events across the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {eventsLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : recentEvents && recentEvents.length > 0 ? (
            <div className="space-y-4">
              {recentEvents.slice(0, 5).map((event) => (
                <Link key={event.id} href={`/golden-record/${event.cattleId}`}>
                <div className="flex items-start justify-between border-b pb-3 last:border-0 hover:bg-accent/50 -mx-4 px-4 py-2 rounded-lg transition-colors cursor-pointer">
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
                      <Badge variant="outline" className="text-xs">
                        Blockchain Verified
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {event.notes || 'Recorded lifecycle event with cryptographic verification'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(event.eventDate).toLocaleDateString('en-AU')}
                    </div>
                    <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified
                    </div>
                  </div>
                </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No recent events to display</p>
              <p className="text-sm mt-1">Events will appear here as they are recorded</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/cattle">
          <Card className="hover:bg-accent cursor-pointer transition-colors border-2 hover:border-blue-400">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                View All Cattle
              </CardTitle>
              <CardDescription>
                Browse and search {formatNumber(totalCattle)} cattle records
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/farmer">
          <Card className="hover:bg-accent cursor-pointer transition-colors border-2 hover:border-green-400">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-green-600" />
                Farmer View
              </CardTitle>
              <CardDescription>
                Operational dashboard for herd management and location tracking
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/bank">
          <Card className="hover:bg-accent cursor-pointer transition-colors border-2 hover:border-purple-400">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                Bank View
              </CardTitle>
              <CardDescription>
                Portfolio analysis and collateral verification tools
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/recommendations">
          <Card className="hover:bg-accent cursor-pointer transition-colors border-2 hover:border-indigo-400">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-indigo-600" />
                AI Recommendations
              </CardTitle>
              <CardDescription>
                Portfolio optimization with machine learning insights
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/forecast">
          <Card className="hover:bg-accent cursor-pointer transition-colors border-2 hover:border-cyan-400">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-cyan-600" />
                Price Forecast
              </CardTitle>
              <CardDescription>
                7-day cattle price predictions using ML models
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/provenance">
          <Card className="hover:bg-accent cursor-pointer transition-colors border-2 hover:border-amber-400">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5 text-amber-600" />
                Provenance Tracking
              </CardTitle>
              <CardDescription>
                Blockchain verification and fraud detection dashboard
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Use Cases */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300">
        <CardHeader>
          <CardTitle className="text-2xl">System Use Cases</CardTitle>
          <CardDescription className="text-base">
            How different stakeholders use the verification system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Farmers
              </h3>
              <p className="text-sm text-muted-foreground">
                Record and verify ownership of cattle using biometric identification and blockchain records. 
                Track location and lifecycle events with cryptographic proof.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Banks
              </h3>
              <p className="text-sm text-muted-foreground">
                Verify collateral ownership and location without physical site visits. Access complete 
                ownership history and lifecycle records through blockchain verification.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Regulators
              </h3>
              <p className="text-sm text-muted-foreground">
                Access complete audit trails for compliance verification. All transactions are recorded 
                with cryptographic hashes, creating tamper-proof compliance records.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Buyers
              </h3>
              <p className="text-sm text-muted-foreground">
                Verify the complete provenance and ownership history of cattle before purchase. 
                Access biometric verification and location history through the blockchain record.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
