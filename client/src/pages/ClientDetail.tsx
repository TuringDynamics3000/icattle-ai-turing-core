import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, Building2, Phone, Mail, MapPin, DollarSign, 
  TrendingUp, Activity, PieChart, Calendar, CheckCircle2, AlertCircle
} from "lucide-react";
import { PieChart as RechartsPie, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useState } from "react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function ClientDetail() {
  const params = useParams();
  const clientId = params.id ? parseInt(params.id) : undefined;

  const { data: clients, isLoading: clientsLoading } = trpc.clients.active.useQuery();
  const { data: allCattle, isLoading: cattleLoading } = trpc.cattle.active.useQuery();
  const { data: events } = trpc.events.recent.useQuery({ limit: 100 });

  const [searchTerm, setSearchTerm] = useState("");
  const [filterBreed, setFilterBreed] = useState("all");
  const [filterHealth, setFilterHealth] = useState("all");

  const client = clients?.find(c => c.id === clientId);
  const clientCattle = allCattle?.filter(c => c.clientId === clientId) || [];

  // Apply filters
  const filteredCattle = clientCattle.filter(animal => {
    const matchesSearch = searchTerm === "" || 
      animal.visualId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      animal.nlisId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      animal.breed.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBreed = filterBreed === "all" || animal.breed === filterBreed;
    const matchesHealth = filterHealth === "all" || animal.healthStatus === filterHealth;
    
    return matchesSearch && matchesBreed && matchesHealth;
  });

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

  if (clientsLoading || cattleLoading) {
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

  if (!client) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/clients">
            <button className="hover:bg-accent p-2 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <h1 className="text-4xl font-bold tracking-tight">Client Not Found</h1>
        </div>
        <p className="text-muted-foreground">The requested client record could not be found.</p>
      </div>
    );
  }

  // Portfolio metrics
  const totalValue = clientCattle.reduce((sum, c) => sum + (c.currentValuation || 0), 0);
  const totalAcquisitionCost = clientCattle.reduce((sum, c) => sum + (c.acquisitionCost || 0), 0);
  const unrealizedGain = totalValue - totalAcquisitionCost;
  const unrealizedGainPercent = totalAcquisitionCost > 0 ? (unrealizedGain / totalAcquisitionCost) * 100 : 0;
  const avgValue = clientCattle.length > 0 ? totalValue / clientCattle.length : 0;

  // Health metrics
  const healthyCattle = clientCattle.filter(c => c.healthStatus === 'healthy').length;
  const sickCattle = clientCattle.filter(c => c.healthStatus === 'sick').length;
  const healthPercent = clientCattle.length > 0 ? (healthyCattle / clientCattle.length) * 100 : 0;

  // Breed distribution
  const breedCounts = clientCattle.reduce((acc: any, c) => {
    acc[c.breed] = (acc[c.breed] || 0) + 1;
    return acc;
  }, {});
  const breedData = Object.entries(breedCounts).map(([breed, count]) => ({
    name: breed,
    value: count as number,
  })).sort((a, b) => b.value - a.value);

  // Type distribution
  const typeCounts = clientCattle.reduce((acc: any, c) => {
    acc[c.cattleType] = (acc[c.cattleType] || 0) + 1;
    return acc;
  }, {});
  const typeData = Object.entries(typeCounts).map(([type, count]) => ({
    type,
    count: count as number,
  }));

  // Transaction history (events for this client's cattle)
  const clientCattleIds = clientCattle.map(c => c.id);
  const clientEvents = events?.filter(e => clientCattleIds.includes(e.cattleId))
    .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())
    .slice(0, 20) || [];

  // Unique breeds for filter
  const breeds = Array.from(new Set(clientCattle.map(c => c.breed))).sort();

  // AgriWebb status
  const isAgriWebbConnected = client.agriwebbConnected;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/clients">
            <button className="hover:bg-accent p-2 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold tracking-tight">{client.name}</h1>
            <p className="text-muted-foreground mt-1">
              {client.contactName && `${client.contactName} • `}
              {client.abn && `ABN: ${client.abn}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isAgriWebbConnected && (
            <Badge variant="default">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              AgriWebb Connected
            </Badge>
          )}
          <Badge variant="outline">{clientCattle.length} head</Badge>
        </div>
      </div>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {client.contactEmail && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Email</div>
                  <div className="font-medium">{client.contactEmail}</div>
                </div>
              </div>
            )}
            {client.contactPhone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Phone</div>
                  <div className="font-medium">{client.contactPhone}</div>
                </div>
              </div>
            )}
            {client.address && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Address</div>
                  <div className="font-medium">{client.address}</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {clientCattle.length} head
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unrealized Gain</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${unrealizedGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(unrealizedGain)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {unrealizedGainPercent >= 0 ? '+' : ''}{unrealizedGainPercent.toFixed(1)}% from acquisition
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Value</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(avgValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Per head
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthPercent.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {healthyCattle} healthy, {sickCattle} need attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="cattle" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cattle">Cattle ({clientCattle.length})</TabsTrigger>
          <TabsTrigger value="analytics">Portfolio Analytics</TabsTrigger>
          <TabsTrigger value="transactions">Transaction History</TabsTrigger>
        </TabsList>

        {/* Cattle Tab */}
        <TabsContent value="cattle" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cattle Inventory</CardTitle>
              <CardDescription>All cattle owned by {client.name}</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Input
                  placeholder="Search by ID, NLIS, breed..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                
                <Select value={filterBreed} onValueChange={setFilterBreed}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Breeds" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Breeds</SelectItem>
                    {breeds.map(breed => (
                      <SelectItem key={breed} value={breed}>{breed}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterHealth} onValueChange={setFilterHealth}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Health Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="healthy">Healthy</SelectItem>
                    <SelectItem value="sick">Sick/At Risk</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Cattle Grid */}
              {filteredCattle.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No cattle found matching filters</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredCattle.map((animal) => (
                    <Link key={animal.id} href={`/cattle/${animal.id}`}>
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{animal.visualId}</CardTitle>
                              <CardDescription className="mt-1">
                                {animal.breed} • {animal.sex}
                              </CardDescription>
                            </div>
                            <Badge variant={animal.healthStatus === 'healthy' ? 'default' : 'destructive'}>
                              {animal.healthStatus}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <div className="text-muted-foreground">Weight</div>
                              <div className="font-semibold">{animal.currentWeight}kg</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Type</div>
                              <div className="capitalize">{animal.cattleType}</div>
                            </div>
                          </div>
                          <div className="pt-2 border-t">
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-muted-foreground">Value</div>
                              <div className="font-bold text-green-600">
                                {formatCurrency(animal.currentValuation || 0)}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Breed Distribution
                </CardTitle>
                <CardDescription>Portfolio composition by breed</CardDescription>
              </CardHeader>
              <CardContent>
                {breedData.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No data available</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPie>
                      <Pie
                        data={breedData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name} (${entry.value})`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {breedData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPie>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cattle Type Distribution</CardTitle>
                <CardDescription>By production purpose</CardDescription>
              </CardHeader>
              <CardContent>
                {typeData.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No data available</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={typeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#0088FE" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
              <CardDescription>Key portfolio metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <div className="text-sm text-muted-foreground">Total Acquisition Cost</div>
                  <div className="text-2xl font-bold">{formatCurrency(totalAcquisitionCost)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Current Market Value</div>
                  <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Return on Investment</div>
                  <div className={`text-2xl font-bold ${unrealizedGainPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {unrealizedGainPercent >= 0 ? '+' : ''}{unrealizedGainPercent.toFixed(1)}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Transaction History
              </CardTitle>
              <CardDescription>Recent events for {client.name}'s cattle</CardDescription>
            </CardHeader>
            <CardContent>
              {clientEvents.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No transactions recorded</p>
              ) : (
                <div className="space-y-4">
                  {clientEvents.map((event, index) => {
                    const cattle = clientCattle.find(c => c.id === event.cattleId);
                    return (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold capitalize">{event.eventType.replace('_', ' ')}</h4>
                            <p className="text-sm text-muted-foreground">
                              {cattle?.visualId || `Cattle #${event.cattleId}`}
                            </p>
                          </div>
                          <Badge variant="outline">{formatDate(event.eventDate)}</Badge>
                        </div>
                        {event.weight && (
                          <p className="text-sm"><strong>Weight:</strong> {event.weight}kg</p>
                        )}
                        {event.fromLocation && event.toLocation && (
                          <p className="text-sm">
                            <strong>Movement:</strong> {event.fromLocation} → {event.toLocation}
                          </p>
                        )}
                        {event.amount && (
                          <p className="text-sm"><strong>Amount:</strong> {formatCurrency(event.amount)}</p>
                        )}
                        {event.notes && (
                          <p className="text-sm text-muted-foreground italic mt-2">{event.notes}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
