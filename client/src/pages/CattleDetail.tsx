import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, Calendar, MapPin, Activity, DollarSign,
  CheckCircle2, AlertCircle, TrendingUp, Syringe, Scale, FileText, Shield, Sparkles
} from "lucide-react";
import { AuditTrailViewer } from "@/components/AuditTrailViewer";
import { EventReplayViewer } from "@/components/EventReplayViewer";
import { FraudDetectionViewer } from "@/components/FraudDetectionViewer";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export function CattleDetail() {
  const params = useParams();
  const cattleId = params.id ? parseInt(params.id) : undefined;

  const { data: cattle, isLoading: cattleLoading } = trpc.cattle.active.useQuery();
  const { data: events, isLoading: eventsLoading } = trpc.events.forCattle.useQuery(
    { cattleId: cattleId! },
    { enabled: !!cattleId }
  );
  const { data: valuations, isLoading: valuationsLoading } = trpc.valuations.history.useQuery(
    { cattleId: cattleId! },
    { enabled: !!cattleId }
  );
  const { data: clients } = trpc.clients.active.useQuery();

  const animal = cattle?.find(c => c.id === cattleId);
  const { data: marketPrice } = trpc.market.getMarketPrice.useQuery(
    {
      breed: animal?.breed || '',
      category: animal?.sex || '',
      weight: animal?.currentWeight || 0,
    },
    { enabled: !!animal?.breed && !!animal?.sex && !!animal?.currentWeight }
  );

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
      day: 'numeric'
    });
  };

  if (cattleLoading || eventsLoading || valuationsLoading) {
    return (
      <div className="min-h-screen bg-lavender-50 p-6">
        <Skeleton className="h-12 w-64 mb-6" />
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
      <div className="min-h-screen bg-lavender-50 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/cattle">
            <button className="p-2 rounded-full hover:bg-plum-100 transition-colors">
              <ArrowLeft className="h-5 w-5 text-plum-700" />
            </button>
          </Link>
          <h1 className="text-4xl font-serif font-bold text-plum-900">Cattle Not Found</h1>
        </div>
        <p className="text-gray-600">The requested cattle record could not be found.</p>
      </div>
    );
  }

  const ageInMonths = animal.dateOfBirth 
    ? Math.floor((Date.now() - new Date(animal.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 30))
    : null;

  const timelineEvents = events?.sort((a: any, b: any) => 
    new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
  ) || [];

  const valuationChartData = valuations?.map((v: any) => ({
    date: formatDate(v.valuationDate),
    value: v.amount / 100,
  })).reverse() || [];

  const healthEvents = timelineEvents.filter((e: any) => 
    ['health_check', 'vaccination', 'treatment'].includes(e.eventType)
  );

  const weightHistory = timelineEvents
    .filter((e: any) => e.weight !== null)
    .map((e: any) => ({
      date: formatDate(e.eventDate),
      weight: e.weight,
    }));

  const isBlockchainVerified = !!animal.biometricId;
  const isNLISRegistered = !!animal.nlisId;

  return (
    <div className="min-h-screen bg-lavender-50">
      {/* Header with Gradient */}
      <section className="relative overflow-hidden bg-gradient-purple-deep">
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute top-10 right-20 w-64 h-64 bg-gradient-coral-cream shape-blob blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-6 py-12 relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Link href="/cattle">
                <button className="p-3 rounded-full glass-card-dark text-white hover:bg-white/20 transition-colors">
                  <ArrowLeft className="h-5 w-5" />
                </button>
              </Link>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="font-serif font-bold text-4xl text-white">
                    {animal.visualId || `Cattle #${animal.id}`}
                  </h1>
                  <Badge className={`${
                    animal.healthStatus === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                  } text-white`}>
                    {animal.healthStatus}
                  </Badge>
                  <Badge className="glass-card-dark text-white border-white/20">
                    {animal.status}
                  </Badge>
                </div>
                <p className="text-lavender-100 text-lg">
                  {animal.breed} • {animal.sex} • {ageInMonths ? `${ageInMonths} months old` : 'Age unknown'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-12">
        {/* Key Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
          <MetricCard
            title="Book Value"
            value={formatCurrency(animal.currentValuation || 0)}
            subtitle={`Last updated ${formatDate(animal.lastValuationDate)}`}
            icon={<DollarSign className="w-6 h-6" />}
            gradient="from-plum-500 to-plum-700"
          />
          
          <MetricCard
            title="Market Value"
            value={marketPrice ? `$${marketPrice.estimated_value.toLocaleString()}` : 'N/A'}
            subtitle={marketPrice ? `$${marketPrice.price_per_kg}/kg × ${animal.currentWeight}kg` : 'No market data'}
            icon={<TrendingUp className="w-6 h-6" />}
            gradient="from-coral-500 to-coral-700"
          />
          
          <MetricCard
            title="Current Weight"
            value={`${animal.currentWeight || 'N/A'}kg`}
            subtitle={`Last weighed ${formatDate(animal.lastWeighDate)}`}
            icon={<Scale className="w-6 h-6" />}
            gradient="from-plum-600 to-coral-500"
          />
          
          <MetricCard
            title="Location"
            value={animal.currentLocation || 'Unknown'}
            subtitle={animal.latitude && animal.longitude ? `${animal.latitude}, ${animal.longitude}` : 'No GPS data'}
            icon={<MapPin className="w-6 h-6" />}
            gradient="from-lavender-600 to-plum-600"
          />
        </div>

        {/* Verification Status */}
        <div className="glass-card rounded-3xl p-8 shadow-soft-lg mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-plum-500 to-plum-700 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-plum-900">Verification & Compliance</h2>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            {animal.muzzleImageUrl && (
              <div className="flex items-start gap-4">
                <img 
                  src={animal.muzzleImageUrl} 
                  alt="Muzzle biometric"
                  className="w-24 h-24 rounded-2xl object-cover shadow-soft-md"
                />
                <div>
                  <h4 className="font-semibold text-lg text-plum-900">Biometric Muzzle Pattern</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Unique identification verified
                  </p>
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              <VerificationBadge
                label="Blockchain Verified"
                verified={isBlockchainVerified}
                details={animal.biometricId || 'Not verified'}
              />
              <VerificationBadge
                label="NLIS Registered"
                verified={isNLISRegistered}
                details={animal.nlisId || 'Not registered'}
              />
            </div>
          </div>
        </div>

        {/* Tabs for Details */}
        <Tabs defaultValue="details" className="space-y-6">
          <TabsList className="glass-card p-2 rounded-2xl">
            <TabsTrigger value="details" className="rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-plum-500 data-[state=active]:to-plum-700 data-[state=active]:text-white">
              Details
            </TabsTrigger>
            <TabsTrigger value="health" className="rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-coral-500 data-[state=active]:to-coral-700 data-[state=active]:text-white">
              Health History
            </TabsTrigger>
            <TabsTrigger value="valuation" className="rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-plum-600 data-[state=active]:to-coral-500 data-[state=active]:text-white">
              Valuation
            </TabsTrigger>
            <TabsTrigger value="audit" className="rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-lavender-600 data-[state=active]:to-plum-600 data-[state=active]:text-white">
              Audit Trail
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <div className="glass-card rounded-3xl p-8 shadow-soft-lg">
              <h3 className="text-xl font-serif font-bold text-plum-900 mb-6">Animal Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <DetailRow label="NLIS ID" value={animal.nlisId || 'N/A'} />
                <DetailRow label="Visual ID" value={animal.visualId || 'N/A'} />
                <DetailRow label="Breed" value={animal.breed} />
                <DetailRow label="Sex" value={animal.sex} />
                <DetailRow label="Date of Birth" value={formatDate(animal.dateOfBirth)} />
                <DetailRow label="Color" value={animal.color || 'N/A'} />
                <DetailRow label="Type" value={animal.cattleType} />
                <DetailRow label="Grade" value={animal.grade || 'N/A'} />
              </div>
            </div>

            <div className="glass-card rounded-3xl p-8 shadow-soft-lg">
              <h3 className="text-xl font-serif font-bold text-plum-900 mb-6">Ownership</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <DetailRow label="Owner" value={client?.name || 'Unknown'} />
                <DetailRow label="Acquisition Date" value={formatDate(animal.acquisitionDate)} />
                <DetailRow label="Acquisition Cost" value={formatCurrency(animal.acquisitionCost || 0)} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="health">
            <div className="glass-card rounded-3xl p-8 shadow-soft-lg">
              <h3 className="text-xl font-serif font-bold text-plum-900 mb-6">Health Events</h3>
              {healthEvents.length > 0 ? (
                <div className="space-y-4">
                  {healthEvents.map((event: any) => (
                    <div key={event.id} className="flex items-start gap-4 p-4 bg-lavender-50 rounded-2xl">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-coral-500 to-coral-700 flex items-center justify-center flex-shrink-0">
                        <Syringe className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-plum-900">{event.eventType.replace('_', ' ').toUpperCase()}</div>
                        <div className="text-sm text-gray-600 mt-1">{formatDate(event.eventDate)}</div>
                        {event.notes && <div className="text-sm text-gray-700 mt-2">{event.notes}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No health events recorded</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="valuation">
            <div className="glass-card rounded-3xl p-8 shadow-soft-lg">
              <h3 className="text-xl font-serif font-bold text-plum-900 mb-6">Valuation History</h3>
              {valuationChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={valuationChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E9D5FF" />
                    <XAxis dataKey="date" stroke="#6B21A8" />
                    <YAxis stroke="#6B21A8" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#FAFAFC', 
                        border: '1px solid #E9D5FF',
                        borderRadius: '12px'
                      }} 
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="url(#colorGradient)" 
                      strokeWidth={3}
                      dot={{ fill: '#EC4899', r: 4 }}
                    />
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#6B21A8" />
                        <stop offset="100%" stopColor="#EC4899" />
                      </linearGradient>
                    </defs>
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-600">No valuation history available</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="audit">
            <div className="glass-card rounded-3xl p-8 shadow-soft-lg">
              <h3 className="text-xl font-serif font-bold text-plum-900 mb-6">Blockchain Audit Trail</h3>
              <AuditTrailViewer cattleId={cattleId!} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function MetricCard({ title, value, subtitle, icon, gradient }: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  gradient: string;
}) {
  return (
    <div className="glass-card rounded-3xl p-6 shadow-soft-lg hover:shadow-3d-purple transition-all group">
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform text-white`}>
        {icon}
      </div>
      <div className="text-sm text-gray-600 mb-1">{title}</div>
      <div className="text-2xl font-bold text-plum-900 mb-1">{value}</div>
      <div className="text-xs text-gray-500">{subtitle}</div>
    </div>
  );
}

function VerificationBadge({ label, verified, details }: {
  label: string;
  verified: boolean;
  details: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-lavender-50 rounded-2xl">
      {verified ? (
        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
      ) : (
        <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-plum-900">{label}</div>
        <div className="text-xs text-gray-600 truncate">{details}</div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-lavender-200">
      <span className="text-gray-600">{label}</span>
      <span className="font-semibold text-plum-900">{value}</span>
    </div>
  );
}
