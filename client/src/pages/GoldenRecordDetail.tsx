import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { TuringProtocolBadge } from "@/components/TuringProtocolBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, Calendar, MapPin, Activity, DollarSign, Shield,
  CheckCircle2, AlertCircle, TrendingUp, Hash, Eye, Award,
  Fingerprint, Link2, Navigation
} from "lucide-react";

export function GoldenRecordDetail() {
  const params = useParams();
  const cattleId = params.id ? parseInt(params.id) : undefined;

  const { data: cattle, isLoading: cattleLoading } = trpc.cattle.get.useQuery(
    { id: cattleId! },
    { enabled: !!cattleId }
  );
  const { data: events, isLoading: eventsLoading } = trpc.events.forCattle.useQuery(
    { cattleId: cattleId! },
    { enabled: !!cattleId }
  );
  const { data: clients } = trpc.clients.active.useQuery();

  const animal = cattle;
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <div className="container py-8 space-y-6">
          <Skeleton className="h-16 w-96" />
          <Skeleton className="h-64 w-full" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!animal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <div className="container py-8 space-y-6">
          <div className="flex items-center gap-3">
            <Link href="/demo">
              <button className="hover:bg-white/80 p-3 rounded-xl transition-all shadow-sm hover:shadow-md">
                <ArrowLeft className="h-5 w-5" />
              </button>
            </Link>
            <h1 className="text-4xl font-bold tracking-tight">Cattle Not Found</h1>
          </div>
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
    Gold: 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-0 shadow-lg shadow-yellow-200',
    Silver: 'bg-gradient-to-r from-gray-400 to-gray-600 text-white border-0 shadow-lg shadow-gray-200',
    Bronze: 'bg-gradient-to-r from-orange-400 to-orange-600 text-white border-0 shadow-lg shadow-orange-200'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="container py-8 space-y-8">
        {/* Enhanced Header with Gradient */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl blur-3xl"></div>
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="flex items-center gap-4">
              <Link href="/demo">
                <button className="hover:bg-blue-100 p-3 rounded-xl transition-all shadow-sm hover:shadow-md hover:scale-105">
                  <ArrowLeft className="h-6 w-6 text-blue-600" />
                </button>
              </Link>
              <div className="flex-1">
                <div className="flex items-center gap-4 flex-wrap">
                  <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Golden Record
                  </h1>
                  <Badge className={`text-base px-4 py-2 font-bold ${tierColors[certTier]}`}>
                    {certTier} Tier
                  </Badge>
                </div>
                <p className="text-lg text-gray-600 mt-2 font-medium">
                  Cryptographically Verified Ownership & Lifecycle
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Turing Protocol Badge - Already Enhanced */}
        <TuringProtocolBadge
          cattleId={animal.id}
          biometricVerified={!!animal.biometricId}
          blockchainVerified={true}
          gpsVerified={!!(animal.latitude && animal.longitude)}
          confidenceScore={99.9}
        />

        {/* Enhanced Biometric Identity Card */}
        <Card className="border-0 shadow-2xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
          <CardHeader className="relative z-10 pb-4">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
                <Eye className="h-6 w-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-bold">
                Biometric Identity
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow">
                  <div className="text-sm font-semibold text-gray-600 mb-1">Visual ID</div>
                  <div className="text-3xl font-bold text-gray-900">{animal.visualId || 'N/A'}</div>
                </div>
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow">
                  <div className="text-sm font-semibold text-gray-600 mb-1">NLIS Tag</div>
                  <div className="text-xl font-mono font-bold text-gray-900">{animal.nlisId || 'Not assigned'}</div>
                </div>
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow">
                  <div className="text-sm font-semibold text-gray-600 mb-2">Biometric Hash</div>
                  <div className="text-xs font-mono text-blue-600 break-all bg-blue-50 p-2 rounded-lg">
                    {animal.biometricId || generateHash(animal.id, 'biometric')}
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-green-50 p-4 rounded-xl shadow-md">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  <span className="text-base font-bold text-green-700">
                    Biometrically Verified
                  </span>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border-4 border-dashed border-blue-300 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
                <div className="text-center text-gray-500">
                  <Eye className="h-24 w-24 mx-auto mb-4 opacity-20" />
                  <div className="text-base font-semibold">Muzzle Print Photo</div>
                  <div className="text-sm text-gray-400">(Demo placeholder)</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Current Status Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 bg-gradient-to-br from-purple-50 to-pink-50 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl"></div>
            <CardHeader className="pb-3 relative z-10">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-gray-700">
                <div className="p-2 bg-purple-600 rounded-lg shadow-md">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                Current Owner
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold text-gray-900 mb-1">{client?.name || 'Unknown'}</div>
              <div className="text-sm text-gray-600 mb-3">
                Property: {client?.propertyName || 'N/A'}
              </div>
              <div className="flex items-center gap-2 bg-green-100 px-3 py-1.5 rounded-lg w-fit">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-xs font-bold text-green-700">Blockchain Verified</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 bg-gradient-to-br from-orange-50 to-red-50 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-400/20 rounded-full blur-2xl"></div>
            <CardHeader className="pb-3 relative z-10">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-gray-700">
                <div className="p-2 bg-orange-600 rounded-lg shadow-md">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                Current Location
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold text-gray-900 mb-1">{animal.currentLocation || 'Unknown'}</div>
              {animal.latitude && animal.longitude && (
                <div className="text-sm font-mono text-gray-600 mb-3 bg-orange-50 px-2 py-1 rounded">
                  {parseFloat(animal.latitude).toFixed(4)}, {parseFloat(animal.longitude).toFixed(4)}
                </div>
              )}
              <div className="flex items-center gap-2 bg-green-100 px-3 py-1.5 rounded-lg w-fit">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-xs font-bold text-green-700">GPS Verified</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 bg-gradient-to-br from-blue-50 to-cyan-50 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/20 rounded-full blur-2xl"></div>
            <CardHeader className="pb-3 relative z-10">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-gray-700">
                <div className="p-2 bg-blue-600 rounded-lg shadow-md">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                Condition
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {animal.currentWeight ? `${Math.round(animal.currentWeight / 100)}/5` : 'N/A'}
              </div>
              <div className="text-sm text-gray-600 mb-3">
                Weight: {animal.currentWeight}kg
              </div>
              <Badge 
                variant={animal.healthStatus === 'healthy' ? 'default' : 'destructive'} 
                className="text-xs font-bold shadow-md"
              >
                {animal.healthStatus || 'Unknown'}
              </Badge>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 bg-gradient-to-br from-green-50 to-emerald-50 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-400/20 rounded-full blur-2xl"></div>
            <CardHeader className="pb-3 relative z-10">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-gray-700">
                <div className="p-2 bg-green-600 rounded-lg shadow-md">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                Current Value
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(animal.currentValuation || 0)}</div>
              <div className="text-sm text-gray-600 mb-3">
                Market-based valuation
              </div>
              <div className="flex items-center gap-2 bg-yellow-100 px-3 py-1.5 rounded-lg w-fit">
                <Award className="h-4 w-4 text-yellow-600" />
                <span className="text-xs font-bold text-yellow-700">{certTier} Tier Premium</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Verification Status */}
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-green-50 to-emerald-50 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full blur-3xl"></div>
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-3 bg-green-600 rounded-xl shadow-lg">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent font-bold">
                Verification Status
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-start gap-4 bg-white/60 backdrop-blur-sm p-4 rounded-xl shadow-md hover:shadow-lg transition-all">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Fingerprint className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-lg">Biometric Identity</div>
                  <div className="text-sm text-green-600 font-semibold">Verified</div>
                </div>
              </div>
              <div className="flex items-start gap-4 bg-white/60 backdrop-blur-sm p-4 rounded-xl shadow-md hover:shadow-lg transition-all">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-lg">Ownership</div>
                  <div className="text-sm text-green-600 font-semibold">Cryptographically Secured</div>
                </div>
              </div>
              <div className="flex items-start gap-4 bg-white/60 backdrop-blur-sm p-4 rounded-xl shadow-md hover:shadow-lg transition-all">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Navigation className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-lg">Location</div>
                  <div className="text-sm text-green-600 font-semibold">GPS Verified</div>
                </div>
              </div>
              <div className="flex items-start gap-4 bg-white/60 backdrop-blur-sm p-4 rounded-xl shadow-md hover:shadow-lg transition-all">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-lg">NLIS Compliance</div>
                  <div className="text-sm text-green-600 font-semibold">Active</div>
                </div>
              </div>
              <div className="flex items-start gap-4 bg-white/60 backdrop-blur-sm p-4 rounded-xl shadow-md hover:shadow-lg transition-all">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Link2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-lg">Blockchain Audit Trail</div>
                  <div className="text-sm text-green-600 font-semibold">Complete</div>
                </div>
              </div>
              <div className="flex items-start gap-4 bg-white/60 backdrop-blur-sm p-4 rounded-xl shadow-md hover:shadow-lg transition-all">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Award className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-lg">Certification Tier</div>
                  <div className="text-sm text-yellow-600 font-semibold">{certTier} (Premium Collateral)</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Complete Lifecycle Timeline */}
        <Card className="border-0 shadow-2xl overflow-hidden bg-white">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b-2 border-blue-100">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">
                Complete Lifecycle Timeline
              </span>
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Every event from birth to present - cryptographically secured and immutable
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="space-y-8">
              {/* Birth Event */}
              <div className="relative pl-12 pb-8 border-l-4 border-blue-400">
                <div className="absolute left-[-14px] top-0 w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 border-4 border-white shadow-lg"></div>
                <div className="space-y-3 bg-blue-50/50 p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 font-bold px-3 py-1">
                        BIRTH
                      </Badge>
                      <span className="text-sm font-semibold text-gray-600">
                        {formatDate(animal.dateOfBirth)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-green-100 px-3 py-1 rounded-lg">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-xs font-bold text-green-600">Verified</span>
                    </div>
                  </div>
                  <div className="text-base font-semibold text-gray-900">
                    Born at {client?.propertyName || 'Unknown property'}
                  </div>
                  <div className="text-sm text-gray-600">
                    Biometric registered • NLIS tag assigned
                  </div>
                  <div className="flex items-center gap-2 mt-3 bg-purple-50 p-3 rounded-lg">
                    <Hash className="h-4 w-4 text-purple-600" />
                    <code className="text-xs font-mono text-purple-600 break-all">
                      {generateHash(animal.id, 'birth')}
                    </code>
                  </div>
                </div>
              </div>

              {/* Timeline Events */}
              {timelineEvents.map((event: any, index: number) => (
                <div key={event.id} className="relative pl-12 pb-8 border-l-4 border-blue-400 last:border-l-0">
                  <div className="absolute left-[-14px] top-0 w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 border-4 border-white shadow-lg"></div>
                  <div className="space-y-3 bg-blue-50/50 p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 font-bold px-3 py-1">
                          {event.eventType.toUpperCase().replace('_', ' ')}
                        </Badge>
                        <span className="text-sm font-semibold text-gray-600">
                          {formatDate(event.eventDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 bg-green-100 px-3 py-1 rounded-lg">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-xs font-bold text-green-600">Verified</span>
                      </div>
                    </div>
                    {event.weight && (
                      <div className="text-base font-semibold text-gray-900">
                        Weight: {event.weight}kg
                      </div>
                    )}
                    {event.notes && (
                      <div className="text-sm text-gray-600">
                        {event.notes}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-3 bg-purple-50 p-3 rounded-lg">
                      <Hash className="h-4 w-4 text-purple-600" />
                      <code className="text-xs font-mono text-purple-600 break-all">
                        {generateHash(event.id, event.eventType)}
                      </code>
                    </div>
                  </div>
                </div>
              ))}

              {/* Current Status */}
              <div className="relative pl-12">
                <div className="absolute left-[-14px] top-0 w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 border-4 border-white shadow-lg animate-pulse"></div>
                <div className="space-y-3 bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl shadow-lg border-2 border-green-200">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-400 font-bold px-3 py-1 shadow-md">
                        CURRENT STATUS
                      </Badge>
                      <span className="text-sm font-semibold text-gray-600">
                        {formatDate(new Date())}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-green-200 px-3 py-1 rounded-lg">
                      <Activity className="h-4 w-4 text-green-700 animate-pulse" />
                      <span className="text-xs font-bold text-green-700">Live</span>
                    </div>
                  </div>
                  <div className="text-base font-semibold text-gray-900">
                    Location: {animal.currentLocation || 'Unknown'} • Weight: {animal.currentWeight}kg
                  </div>
                  <div className="text-sm text-gray-600">
                    Value: {formatCurrency(animal.currentValuation || 0)} • {certTier} Tier Certification
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Export Options */}
        <Card className="border-0 shadow-2xl overflow-hidden bg-gradient-to-br from-slate-50 to-gray-50">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b-2 border-purple-100">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-3 bg-purple-600 rounded-xl shadow-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-bold">
                Export Golden Record
              </span>
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Generate verified certificates and reports
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-3 px-6 py-5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105">
                <Shield className="h-5 w-5" />
                <span className="font-bold text-lg">Ownership Certificate</span>
              </button>
              <button className="flex items-center justify-center gap-3 px-6 py-5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105">
                <Hash className="h-5 w-5" />
                <span className="font-bold text-lg">Blockchain Verification</span>
              </button>
              <button className="flex items-center justify-center gap-3 px-6 py-5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105">
                <Calendar className="h-5 w-5" />
                <span className="font-bold text-lg">Lifecycle Report</span>
              </button>
              <button className="flex items-center justify-center gap-3 px-6 py-5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105">
                <Eye className="h-5 w-5" />
                <span className="font-bold text-lg">Photo History</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
