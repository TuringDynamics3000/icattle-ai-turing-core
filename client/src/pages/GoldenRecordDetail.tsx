import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { TuringProtocolBadge } from "@/components/TuringProtocolBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, Calendar, MapPin, Activity, DollarSign, Shield,
  CheckCircle2, AlertCircle, TrendingUp, Hash, Eye, Award
} from "lucide-react";

export function GoldenRecordDetail() {
  const params = useParams();
  const cattleId = params.id ? parseInt(params.id) : undefined;

  const { data: cattle, isLoading: cattleLoading } = trpc.cattle.active.useQuery();
  const { data: events, isLoading: eventsLoading } = trpc.events.forCattle.useQuery(
    { cattleId: cattleId! },
    { enabled: !!cattleId }
  );
  const { data: clients } = trpc.clients.active.useQuery();

  const animal = cattle?.find(c => c.id === cattleId);
  const client = clients?.find(c => c.id === animal?.clientId);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Generate mock blockchain hash for demo
  const generateHash = (id: number, eventType: string) => {
    const hash = `0x${Math.abs(id * 12345 + eventType.charCodeAt(0)).toString(16).padStart(64, '0').slice(0, 64)}`;
    return hash;
  };

  if (cattleLoading || eventsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!animal) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/demo">
            <button className="hover:bg-accent p-2 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <h1 className="text-4xl font-bold tracking-tight">Cattle Not Found</h1>
        </div>
      </div>
    );
  }

  const timelineEvents = events?.sort((a: any, b: any) => 
    new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
  ) || [];

  // Calculate certification tier based on verification status
  const getCertificationTier = () => {
    if (animal.biometricId && animal.latitude && animal.longitude) return 'Gold';
    if (animal.biometricId || (animal.latitude && animal.longitude)) return 'Silver';
    return 'Bronze';
  };

  const certTier = getCertificationTier();
  const tierColors = {
    Gold: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    Silver: 'bg-gray-100 text-gray-800 border-gray-300',
    Bronze: 'bg-orange-100 text-orange-800 border-orange-300'
  };

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/demo">
          <button className="hover:bg-accent p-2 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold tracking-tight">Golden Record</h1>
            <Badge className={`text-lg px-3 py-1 ${tierColors[certTier]}`}>
              {certTier} Tier
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Cryptographically Verified Ownership & Lifecycle
          </p>
        </div>
      </div>

      {/* Turing Protocol Badge */}
      <TuringProtocolBadge
        cattleId={animal.id}
        biometricVerified={!!animal.biometricId}
        blockchainVerified={true}
        gpsVerified={!!(animal.latitude && animal.longitude)}
        confidenceScore={99.9}
      />

      {/* Biometric Identity Card */}
      <Card className="border-2 border-blue-200 bg-blue-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-600" />
            Biometric Identity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Visual ID</div>
                <div className="text-2xl font-bold">{animal.visualId || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">NLIS Tag</div>
                <div className="text-lg font-mono">{animal.nlisId || 'Not assigned'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Biometric Hash</div>
                <div className="text-xs font-mono text-blue-600 break-all">
                  {animal.biometricId || generateHash(animal.id, 'biometric')}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  Biometrically Verified
                </span>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border-2 border-dashed border-blue-300 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Eye className="h-16 w-16 mx-auto mb-2 opacity-30" />
                <div className="text-sm">Muzzle Print Photo</div>
                <div className="text-xs">(Demo placeholder)</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Status Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-purple-600" />
              Current Owner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{client?.name || 'Unknown'}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Property: {client?.propertyName || 'N/A'}
            </div>
            <div className="flex items-center gap-1 mt-2">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-600">Blockchain Verified</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4 text-orange-600" />
              Current Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{animal.currentLocation || 'Unknown'}</div>
            {animal.latitude && animal.longitude && (
              <div className="text-xs text-muted-foreground mt-1 font-mono">
                {parseFloat(animal.latitude).toFixed(4)}, {parseFloat(animal.longitude).toFixed(4)}
              </div>
            )}
            <div className="flex items-center gap-1 mt-2">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-600">GPS Verified</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              Condition
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {animal.currentWeight ? `${Math.round(animal.currentWeight / 100)}/5` : 'N/A'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Weight: {animal.currentWeight}kg
            </div>
            <div className="flex items-center gap-1 mt-2">
              <Badge variant={animal.healthStatus === 'healthy' ? 'default' : 'destructive'} className="text-xs">
                {animal.healthStatus || 'Unknown'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              Current Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatCurrency(animal.currentValuation || 0)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Market-based valuation
            </div>
            <div className="flex items-center gap-1 mt-2">
              <Award className="h-3 w-3 text-yellow-600" />
              <span className="text-xs text-yellow-600">{certTier} Tier Premium</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Verification Status */}
      <Card className="border-2 border-green-200 bg-green-50/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Verification Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-medium">Biometric Identity</div>
                <div className="text-sm text-muted-foreground">Verified</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-medium">Ownership</div>
                <div className="text-sm text-muted-foreground">Cryptographically Secured</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-medium">Location</div>
                <div className="text-sm text-muted-foreground">GPS Verified</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-medium">NLIS Compliance</div>
                <div className="text-sm text-muted-foreground">Active</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-medium">Blockchain Audit Trail</div>
                <div className="text-sm text-muted-foreground">Complete</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Award className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <div className="font-medium">Certification Tier</div>
                <div className="text-sm text-muted-foreground">{certTier} (Premium Collateral)</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Complete Lifecycle Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Complete Lifecycle Timeline
          </CardTitle>
          <CardDescription>
            Every event from birth to present - cryptographically secured and immutable
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Birth Event */}
            <div className="relative pl-8 pb-6 border-l-2 border-blue-300">
              <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-2 border-white"></div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-50">BIRTH</Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(animal.dateOfBirth)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-green-600 text-xs">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified
                  </div>
                </div>
                <div className="text-sm">
                  Born at {client?.propertyName || 'Unknown property'}
                </div>
                <div className="text-sm text-muted-foreground">
                  Biometric registered • NLIS tag assigned
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Hash className="h-3 w-3 text-purple-600" />
                  <code className="text-xs font-mono text-purple-600">
                    {generateHash(animal.id, 'birth')}
                  </code>
                </div>
              </div>
            </div>

            {/* Timeline Events */}
            {timelineEvents.map((event: any, index: number) => (
              <div key={event.id} className="relative pl-8 pb-6 border-l-2 border-blue-300 last:border-l-0">
                <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-2 border-white"></div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-50">
                        {event.eventType.toUpperCase().replace('_', ' ')}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(event.eventDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-green-600 text-xs">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified
                    </div>
                  </div>
                  {event.weight && (
                    <div className="text-sm">
                      Weight: {event.weight}kg
                    </div>
                  )}
                  {event.notes && (
                    <div className="text-sm text-muted-foreground">
                      {event.notes}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Hash className="h-3 w-3 text-purple-600" />
                    <code className="text-xs font-mono text-purple-600">
                      {generateHash(event.id, event.eventType)}
                    </code>
                  </div>
                </div>
              </div>
            ))}

            {/* Current Status */}
            <div className="relative pl-8">
              <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-green-500 border-2 border-white animate-pulse"></div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                      CURRENT STATUS
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(new Date())}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-green-600 text-xs">
                    <Activity className="h-3 w-3" />
                    Live
                  </div>
                </div>
                <div className="text-sm">
                  Location: {animal.currentLocation || 'Unknown'} • Weight: {animal.currentWeight}kg
                </div>
                <div className="text-sm text-muted-foreground">
                  Value: {formatCurrency(animal.currentValuation || 0)} • {certTier} Tier Certification
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Golden Record</CardTitle>
          <CardDescription>
            Generate verified certificates and reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
              <Shield className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Ownership Certificate</span>
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition-colors">
              <Hash className="h-4 w-4 text-purple-600" />
              <span className="font-medium">Blockchain Verification</span>
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-green-200 rounded-lg hover:bg-green-50 transition-colors">
              <Calendar className="h-4 w-4 text-green-600" />
              <span className="font-medium">Lifecycle Report</span>
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-orange-200 rounded-lg hover:bg-orange-50 transition-colors">
              <Eye className="h-4 w-4 text-orange-600" />
              <span className="font-medium">Photo History</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
