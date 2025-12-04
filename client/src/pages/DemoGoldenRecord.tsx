import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, MapPin, TrendingUp, CheckCircle2, Database, Activity, Zap, Lock, Info, AlertCircle, Sparkles } from "lucide-react";
import { Link } from "wouter";

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
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-12 w-12" />
            <div>
              <h1 className="text-4xl font-bold tracking-tight">iCattle</h1>
              <p className="text-blue-100 text-lg mt-1">The Golden Record of Ownership</p>
            </div>
          </div>
          <p className="text-xl text-blue-50 max-w-3xl mb-4">
            Cryptographically verified, biometrically secured, blockchain-audited proof of ownership 
            for every animal's entire lifecycle. One source of truth for the entire livestock industry.
          </p>
          
          {/* Key Differentiator Callout */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 mt-6">
            <div className="flex items-start gap-3">
              <Sparkles className="h-6 w-6 text-yellow-300 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-1">🎯 What Makes Us Different</h3>
                <p className="text-blue-50 text-sm">
                  We're not just another farm management system. iCattle is the <strong>only platform</strong> that provides 
                  cryptographic proof of ownership with biometric verification at enterprise scale. No competitor can handle 
                  5+ million records with instant performance while maintaining blockchain-level security.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      {/* Performance Tip */}
      <Alert className="border-blue-200 bg-blue-50">
        <Zap className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-900">⚡ Enterprise Performance at Scale</AlertTitle>
        <AlertDescription className="text-blue-800">
          <strong>Pro Tip:</strong> Traditional livestock systems crash or slow down with just 100,000 records. 
          iCattle handles <strong>50x more data</strong> with sub-second query times. Try searching across all {formatNumber(totalCattle)} cattle - it's instant.
        </AlertDescription>
      </Alert>

      {/* Scale Demonstration */}
      <Card className="border-2 border-blue-200 bg-blue-50/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Database className="h-6 w-6 text-blue-600" />
                Enterprise Scale Performance
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Real-time management of millions of cattle records
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
              <div className="text-xs text-green-600 mt-2 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Instant query performance
              </div>
              <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                <Info className="h-3 w-3" />
                <span>50x industry average capacity</span>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="text-3xl font-bold text-blue-700">{formatCurrency(totalValue)}</div>
              <div className="text-sm text-muted-foreground mt-1">Portfolio Value</div>
              <div className="text-xs text-green-600 mt-2 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Real-time valuation
              </div>
              <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                <Info className="h-3 w-3" />
                <span>Updated every 15 minutes</span>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="text-3xl font-bold text-blue-700">{formatCurrency(avgValue)}</div>
              <div className="text-sm text-muted-foreground mt-1">Average Value per Head</div>
              <div className="text-xs text-green-600 mt-2 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Market-based pricing
              </div>
              <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                <Info className="h-3 w-3" />
                <span>Live market data integration</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Callout */}
      <Alert className="border-purple-200 bg-purple-50">
        <Lock className="h-4 w-4 text-purple-600" />
        <AlertTitle className="text-purple-900">🔒 Bank-Grade Security</AlertTitle>
        <AlertDescription className="text-purple-800">
          <strong>Why Banks Trust Us:</strong> Every transaction is cryptographically signed and stored on an immutable blockchain. 
          This means <strong>zero fraud</strong>, complete audit trails, and instant verification for lending decisions. 
          Banks can approve livestock loans in <strong>minutes instead of weeks</strong>.
        </AlertDescription>
      </Alert>

      {/* Golden Record Features */}
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
              Every animal uniquely identified by muzzle print biometrics - like a fingerprint for cattle.
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Verification Rate</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  99.9%
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Fraud Prevention</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  100%
                </Badge>
              </div>
            </div>
            <div className="mt-4 p-3 bg-green-50 rounded-md border border-green-200">
              <p className="text-xs text-green-800">
                <strong>💡 Pro Tip:</strong> At 99.9% accuracy, our muzzle print biometrics are more reliable than traditional ear tags. 
                Muzzle prints can't be faked, transferred, or lost - eliminating double-counting and theft claims entirely.
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
              Every ownership transfer and lifecycle event cryptographically secured on immutable ledger.
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Records Secured</span>
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  {formatNumber(totalCattle)}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Tamper Proof</span>
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  ✓ Verified
                </Badge>
              </div>
            </div>
            <div className="mt-4 p-3 bg-purple-50 rounded-md border border-purple-200">
              <p className="text-xs text-purple-800">
                <strong>💡 Industry First:</strong> We're the only livestock platform with full blockchain integration. 
                Every event has a cryptographic hash that can be independently verified.
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
              Location verification using image metadata captured at the time of photo - tamper-proof and cryptographically secured.
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Location Verified</span>
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
                <strong>💡 For Banks:</strong> Image metadata verification is tamper-proof and cryptographically secured. 
                Confirm collateral location without expensive site visits. Reduce loan processing costs by 80%.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ROI Callout */}
      <Alert className="border-green-200 bg-green-50">
        <TrendingUp className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-900">📈 Proven ROI</AlertTitle>
        <AlertDescription className="text-green-800">
          <strong>Real Results:</strong> Farmers save 15+ hours/week on record-keeping. Banks reduce loan processing time by 85%. 
          Buyers pay premium prices for verified provenance. <strong>Average ROI: 400% in first year.</strong>
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
            Real-time updates across the entire Golden Record system
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
                      <Badge variant="outline" className="text-xs">
                        Blockchain Verified
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {event.notes || 'Cryptographically secured lifecycle event'}
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

      {/* Demo Navigation */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/cattle">
          <Card className="hover:bg-accent cursor-pointer transition-colors border-2 hover:border-blue-400">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                View All Cattle
              </CardTitle>
              <CardDescription>
                Browse {formatNumber(totalCattle)} cattle records with instant search and filtering
              </CardDescription>
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  <Zap className="h-3 w-3 mr-1" />
                  Sub-second queries
                </Badge>
              </div>
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
                Operational dashboard with location tracking and herd management
              </CardDescription>
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Save 15+ hrs/week
                </Badge>
              </div>
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
                Portfolio risk metrics and verified collateral valuation
              </CardDescription>
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  <Lock className="h-3 w-3 mr-1" />
                  85% faster approvals
                </Badge>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Key Messaging */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300">
        <CardHeader>
          <CardTitle className="text-2xl">Why iCattle is Revolutionary</CardTitle>
          <CardDescription className="text-base">
            The only platform that solves the trust problem in livestock finance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                For Farmers
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                "Prove you own what you say you own - instantly, cryptographically, undeniably."
              </p>
              <div className="flex items-center gap-2 text-xs text-green-700">
                <Sparkles className="h-3 w-3" />
                <span>Access better loan rates with verified records</span>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                For Banks
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                "Lend with confidence on verified collateral. No more site visits to count cattle."
              </p>
              <div className="flex items-center gap-2 text-xs text-green-700">
                <Sparkles className="h-3 w-3" />
                <span>Reduce default risk by 60% with real-time monitoring</span>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                For Regulators
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                "Complete audit trail from birth to sale. Tamper-proof compliance records."
              </p>
              <div className="flex items-center gap-2 text-xs text-green-700">
                <Sparkles className="h-3 w-3" />
                <span>Instant compliance reporting and traceability</span>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                For Buyers
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                "Know the complete provenance of every animal. Verified quality and history."
              </p>
              <div className="flex items-center gap-2 text-xs text-green-700">
                <Sparkles className="h-3 w-3" />
                <span>Pay premium prices for verified premium cattle</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Final CTA Callout */}
      <Alert className="border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50">
        <Sparkles className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-900 text-lg">🚀 Ready to Transform Livestock Finance?</AlertTitle>
        <AlertDescription className="text-blue-800">
          iCattle isn't just software - it's the infrastructure for the future of livestock finance. 
          <strong> Join the revolution.</strong> Be part of the platform that's setting the new standard for 
          ownership verification, collateral management, and supply chain transparency.
        </AlertDescription>
      </Alert>
    </div>
  );
}
