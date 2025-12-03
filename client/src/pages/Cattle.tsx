import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";
import { Link } from "wouter";
import { ArrowLeft, Search, Filter } from "lucide-react";

export function Cattle() {
  const { data: cattle, isLoading } = trpc.cattle.active.useQuery();
  const { data: clients } = trpc.clients.active.useQuery();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBreed, setFilterBreed] = useState<string>("all");
  const [filterClient, setFilterClient] = useState<string>("all");
  const [filterHealth, setFilterHealth] = useState<string>("all");

  // Get unique breeds for filter
  const breeds = useMemo(() => {
    if (!cattle) return [];
    const uniqueBreeds = Array.from(new Set(cattle.map(c => c.breed).filter(Boolean)));
    return uniqueBreeds.sort();
  }, [cattle]);

  // Filter cattle
  const filteredCattle = useMemo(() => {
    if (!cattle) return [];
    
    return cattle.filter(c => {
      const matchesSearch = 
        c.visualId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.nlisId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.breed?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesBreed = filterBreed === "all" || c.breed === filterBreed;
      const matchesClient = filterClient === "all" || c.clientId.toString() === filterClient;
      const matchesHealth = filterHealth === "all" || c.healthStatus === filterHealth;
      
      return matchesSearch && matchesBreed && matchesClient && matchesHealth;
    });
  }, [cattle, searchTerm, filterBreed, filterClient, filterHealth]);

  const formatCurrency = (cents: number | null) => {
    if (!cents) return "N/A";
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  const getHealthBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-600">Healthy</Badge>;
      case 'sick':
        return <Badge className="bg-orange-600">Requires Attention</Badge>;
      case 'quarantine':
        return <Badge className="bg-red-600">Quarantine</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getClientName = (clientId: number) => {
    const client = clients?.find(c => c.id === clientId);
    return client?.name || `Client ${clientId}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(9)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
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
            <h1 className="text-4xl font-bold tracking-tight">Cattle Registry</h1>
          </div>
          <p className="text-muted-foreground mt-2">
            Digital twin registry with biometric verification
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold">{filteredCattle.length}</div>
          <div className="text-sm text-muted-foreground">Active cattle</div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ID, NLIS, breed..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
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

            <Select value={filterClient} onValueChange={setFilterClient}>
              <SelectTrigger>
                <SelectValue placeholder="All Clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clients?.map(client => (
                  <SelectItem key={client.id} value={client.id.toString()}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterHealth} onValueChange={setFilterHealth}>
              <SelectTrigger>
                <SelectValue placeholder="All Health Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Health Status</SelectItem>
                <SelectItem value="healthy">Healthy</SelectItem>
                <SelectItem value="sick">Requires Attention</SelectItem>
                <SelectItem value="quarantine">Quarantine</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cattle Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCattle.map((animal) => (
          <Link key={animal.id} href={`/cattle/${animal.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{animal.visualId}</CardTitle>
                    <CardDescription className="mt-1">
                      {animal.breed} • {animal.sex}
                    </CardDescription>
                  </div>
                  {getHealthBadge(animal.healthStatus)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-muted-foreground">NLIS ID</div>
                    <div className="font-mono text-xs">{animal.nlisId}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Weight</div>
                    <div className="font-semibold">{animal.currentWeight}kg</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Type</div>
                    <div className="capitalize">{animal.cattleType}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Location</div>
                    <div className="text-xs">{animal.currentLocation}</div>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">Current Value</div>
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(animal.currentValuation)}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Owner: {getClientName(animal.clientId)}
                  </div>
                </div>

                {animal.biometricId && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                      <span className="text-xs text-muted-foreground">
                        Biometric ID: {animal.biometricId.substring(0, 8)}...
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filteredCattle.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No cattle found matching your filters.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
