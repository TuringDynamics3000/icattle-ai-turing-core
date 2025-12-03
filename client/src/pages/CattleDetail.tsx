import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, Calendar, MapPin, Activity, DollarSign, Shield,
  CheckCircle2, AlertCircle, TrendingUp, Syringe, Scale, FileText
} from "lucide-react";
import { AuditTrailViewer } from "@/components/AuditTrailViewer";
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

  // Get market price for this cattle
  const animal = cattle?.find(c => c.id === cattleId);
  const { data: marketPrice } = trpc.market.getMarketPrice.useQuery(
    {
      breed: animal?.breed || '',
      category: animal?.sex || '', // Using sex (Steer/Heifer/Bull/Cow) for market category
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
          <Link href="/cattle">
            <button className="hover:bg-accent p-2 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <h1 className="text-4xl font-bold tracking-tight">Cattle Not Found</h1>
        </div>
        <p className="text-muted-foreground">The requested cattle record could not be found.</p>
      </div>
    );
  }

  // Calculate age
  const ageInMonths = animal.dateOfBirth 
    ? Math.floor((Date.now() - new Date(animal.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 30))
    : null;

  // Prepare timeline events
  const timelineEvents = events?.sort((a: any, b: any) => 
    new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
  ) || [];

  // Prepare valuation chart data
  const valuationChartData = valuations?.map((v: any) => ({
    date: formatDate(v.valuationDate),
    value: v.amount / 100,
  })).reverse() || [];

  // Health events
  const healthEvents = timelineEvents.filter((e: any) => 
    ['health_check', 'vaccination', 'treatment'].includes(e.eventType)
  );

  // Weight history
  const weightHistory = timelineEvents
    .filter((e: any) => e.weight !== null)
    .map((e: any) => ({
      date: formatDate(e.eventDate),
      weight: e.weight,
    }));

  // Blockchain verification status
  const isBlockchainVerified = !!animal.biometricId;
  const isNLISRegistered = !!animal.nlisId;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/cattle">
            <button className="hover:bg-accent p-2 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold tracking-tight">{animal.visualId || `Cattle #${animal.id}`}</h1>
            <p className="text-muted-foreground mt-1">
              {animal.breed} • {animal.sex} • {ageInMonths ? `${ageInMonths} months old` : 'Age unknown'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant={animal.healthStatus === 'healthy' ? 'default' : 'destructive'}>
            {animal.healthStatus}
          </Badge>
          <Badge variant="outline">{animal.status}</Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Book Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(animal.currentValuation || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Last updated {formatDate(animal.lastValuationDate)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {marketPrice ? (
              <>
                <div className="text-2xl font-bold text-blue-900">
                  ${marketPrice.estimated_value.toLocaleString()}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-muted-foreground">
                    ${marketPrice.price_per_kg}/kg × {animal.currentWeight}kg
                  </p>
                  {(() => {
                    const bookValue = (animal.currentValuation || 0) / 100;
                    const difference = marketPrice.estimated_value - bookValue;
                    const percentDiff = bookValue > 0 ? (difference / bookValue) * 100 : 0;
                    const isPositive = difference > 0;
                    return (
                      <Badge 
                        variant={isPositive ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {isPositive ? '+' : ''}{percentDiff.toFixed(1)}%
                      </Badge>
                    );
                  })()}
                </div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-muted-foreground">N/A</div>
                <p className="text-xs text-muted-foreground mt-1">
                  No market data available
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Weight</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{animal.currentWeight || 'N/A'}kg</div>
            <p className="text-xs text-muted-foreground mt-1">
              Last weighed {formatDate(animal.lastWeighDate)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Location</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{animal.currentLocation || 'Unknown'}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {animal.latitude && animal.longitude ? `${animal.latitude}, ${animal.longitude}` : 'No GPS data'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Owner</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{client?.name || 'Unknown'}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Since {formatDate(animal.acquisitionDate)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Verification Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Verification & Compliance Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {animal.muzzleImageUrl && (
            <div className="mb-6">
              <div className="flex items-center gap-4">
                <img 
                  src={animal.muzzleImageUrl} 
                  alt={`${animal.visualId} muzzle biometric`}
                  className="w-32 h-32 rounded-lg object-cover border-2 border-border shadow-md"
                />
                <div>
                  <h4 className="font-semibold text-lg">Biometric Muzzle Pattern</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Unique muzzle pattern used for visual identification and fraud prevention.
                    Each cattle's muzzle pattern is as unique as a human fingerprint.
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">NLIS Registration</span>
                {isNLISRegistered ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                )}
              </div>
              <div className="text-lg font-bold">{animal.nlisId || 'Not Registered'}</div>
              <p className="text-xs text-muted-foreground">
                National Livestock Identification System
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Blockchain Verified</span>
                {isBlockchainVerified ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                )}
              </div>
              <div className="text-lg font-bold">{animal.biometricId || 'Not Verified'}</div>
              <p className="text-xs text-muted-foreground">
                Biometric identity on iCattle blockchain
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Visual ID</span>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-lg font-bold">{animal.visualId || `#${animal.id}`}</div>
              <p className="text-xs text-muted-foreground">
                Farm visual identification tag
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline">Lifecycle Timeline</TabsTrigger>
          <TabsTrigger value="health">Health Records</TabsTrigger>
          <TabsTrigger value="valuation">Valuation History</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lifecycle Timeline</CardTitle>
              <CardDescription>Complete history from birth/acquisition to present</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {timelineEvents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No events recorded</p>
                ) : (
                  <div className="relative border-l-2 border-muted pl-6 space-y-6">
                    {timelineEvents.map((event: any, index: number) => (
                      <div key={index} className="relative">
                        <div className="absolute -left-[1.6rem] top-0 w-4 h-4 rounded-full bg-primary border-4 border-background" />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold capitalize">{event.eventType.replace('_', ' ')}</span>
                            <Badge variant="outline" className="text-xs">
                              {formatDate(event.eventDate)}
                            </Badge>
                          </div>
                          {event.weight && (
                            <p className="text-sm text-muted-foreground">Weight: {event.weight}kg</p>
                          )}
                          {event.fromLocation && event.toLocation && (
                            <p className="text-sm text-muted-foreground">
                              Moved from {event.fromLocation} to {event.toLocation}
                            </p>
                          )}
                          {event.veterinarian && (
                            <p className="text-sm text-muted-foreground">Veterinarian: {event.veterinarian}</p>
                          )}
                          {event.amount && (
                            <p className="text-sm text-muted-foreground">Amount: {formatCurrency(event.amount)}</p>
                          )}
                          {event.notes && (
                            <p className="text-sm text-muted-foreground italic">{event.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Weight History Chart */}
          {weightHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Weight Progression</CardTitle>
                <CardDescription>Growth tracking over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={weightHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="#0088FE" 
                      strokeWidth={2}
                      name="Weight (kg)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Health Records Tab */}
        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Syringe className="h-5 w-5" />
                Health Records
              </CardTitle>
              <CardDescription>Vaccinations, treatments, and health checks</CardDescription>
            </CardHeader>
            <CardContent>
              {healthEvents.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No health records available</p>
              ) : (
                <div className="space-y-4">
                  {healthEvents.map((event: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold capitalize">{event.eventType.replace('_', ' ')}</h4>
                          <p className="text-sm text-muted-foreground">{formatDate(event.eventDate)}</p>
                        </div>
                        <Badge variant={event.healthStatus === 'healthy' ? 'default' : 'destructive'}>
                          {event.healthStatus || 'N/A'}
                        </Badge>
                      </div>
                      {event.veterinarian && (
                        <p className="text-sm"><strong>Veterinarian:</strong> {event.veterinarian}</p>
                      )}
                      {event.notes && (
                        <p className="text-sm text-muted-foreground mt-2">{event.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Health Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <span className="text-sm text-muted-foreground">Status</span>
                  <p className="text-lg font-semibold capitalize">{animal.healthStatus}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Last Health Check</span>
                  <p className="text-lg font-semibold">{formatDate(animal.lastHealthCheck)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Valuation History Tab */}
        <TabsContent value="valuation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Valuation History
              </CardTitle>
              <CardDescription>Market value progression over time</CardDescription>
            </CardHeader>
            <CardContent>
              {valuationChartData.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No valuation history available</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={valuationChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
                    <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#00C49F" 
                      strokeWidth={2}
                      name="Value (AUD)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <span className="text-sm text-muted-foreground">Acquisition Cost</span>
                  <p className="text-lg font-semibold">{formatCurrency(animal.acquisitionCost || 0)}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Current Value</span>
                  <p className="text-lg font-semibold">{formatCurrency(animal.currentValuation || 0)}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Unrealized Gain</span>
                  <p className={`text-lg font-semibold ${(animal.currentValuation || 0) - (animal.acquisitionCost || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency((animal.currentValuation || 0) - (animal.acquisitionCost || 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Complete Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="font-semibold">Identification</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-muted-foreground">Visual ID</span>
                      <p className="font-medium">{animal.visualId || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">NLIS ID</span>
                      <p className="font-medium">{animal.nlisId || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Biometric ID</span>
                      <p className="font-medium">{animal.biometricId || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Physical Attributes</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-muted-foreground">Breed</span>
                      <p className="font-medium">{animal.breed}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Sex</span>
                      <p className="font-medium capitalize">{animal.sex}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Color</span>
                      <p className="font-medium">{animal.color || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Type</span>
                      <p className="font-medium capitalize">{animal.cattleType}</p>
                    </div>
                    {animal.grade && (
                      <div>
                        <span className="text-sm text-muted-foreground">Grade</span>
                        <p className="font-medium">{animal.grade}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Dates</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-muted-foreground">Date of Birth</span>
                      <p className="font-medium">{formatDate(animal.dateOfBirth)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Acquisition Date</span>
                      <p className="font-medium">{formatDate(animal.acquisitionDate)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Last Health Check</span>
                      <p className="font-medium">{formatDate(animal.lastHealthCheck)}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Additional Info</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-muted-foreground">Status</span>
                      <p className="font-medium capitalize">{animal.status}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Owner</span>
                      <p className="font-medium">{client?.name || 'Unknown'}</p>
                    </div>
                    {animal.notes && (
                      <div>
                        <span className="text-sm text-muted-foreground">Notes</span>
                        <p className="font-medium">{animal.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Trail Tab */}
        <TabsContent value="audit" className="space-y-4">
          <AuditTrailViewer cattleId={cattleId!} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
