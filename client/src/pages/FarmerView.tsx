import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { CattleMap, CattleMapSkeleton } from "@/components/CattleMap";
import { useState, useMemo } from "react";
import { Link } from "wouter";
import { 
  ArrowLeft, Search, RefreshCw, MapPin, Activity, 
  TrendingUp, AlertCircle, CheckCircle2, Cloud, CloudOff 
} from "lucide-react";

export function FarmerView() {
  // Use paginated query instead of loading all cattle
  const { data: cattleData, isLoading: cattleLoading } = trpc.cattle.list.useQuery({
    limit: 100, // Show first 100 cattle
    cursor: 0,
  });
  const cattle = cattleData?.items || [];
  const { data: summary } = trpc.portfolio.summary.useQuery({});
  const { data: clients } = trpc.clients.active.useQuery();
  const { data: recentEvents } = trpc.events.recent.useQuery({ limit: 20 });
  
  const [searchTerm, setSearchTerm] = useState("");

  // Assuming farmer is viewing their own herd (first client for demo)
  const farmerClient = clients?.[0];
  const isAgriwebbConnected = farmerClient?.agriwebbConnected || false;
  const lastSync = farmerClient?.agriwebbLastSync;

  // Filter cattle by search
  const filteredCattle = useMemo(() => {
    if (!cattle) return [];
    
    return cattle.filter(c => {
      const matchesSearch = 
        c.visualId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.nlisId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.breed?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.currentLocation?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  }, [cattle, searchTerm]);

  // Group cattle by location
  const cattleByLocation = useMemo(() => {
    const grouped: Record<string, typeof cattle> = {};
    filteredCattle.forEach(animal => {
      const location = animal.currentLocation || "Unknown";
      if (!grouped[location]) grouped[location] = [];
      grouped[location]!.push(animal);
    });
    return grouped;
  }, [filteredCattle]);

  // Health summary
  const healthSummary = useMemo(() => {
    if (!cattle) return { healthy: 0, sick: 0, quarantine: 0 };
    return {
      healthy: cattle.filter(c => c.healthStatus === 'healthy').length,
      sick: cattle.filter(c => c.healthStatus === 'sick').length,
      quarantine: cattle.filter(c => c.healthStatus === 'quarantine').length,
    };
  }, [cattle]);

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "Never";
    return new Date(date).toLocaleString('en-AU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (cattleLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
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
            <h1 className="text-4xl font-bold tracking-tight">My Herd</h1>
          </div>
          <p className="text-muted-foreground mt-2">
            Operational view for {farmerClient?.name || "your farm"}
          </p>
        </div>
      </div>

      {/* AgriWebb Sync Status */}
      <Card className={isAgriwebbConnected ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isAgriwebbConnected ? (
                <Cloud className="h-6 w-6 text-green-600" />
              ) : (
                <CloudOff className="h-6 w-6 text-orange-600" />
              )}
              <div>
                <CardTitle className="text-lg">AgriWebb Integration</CardTitle>
                <CardDescription>
                  {isAgriwebbConnected 
                    ? `Last synced: ${formatDate(lastSync)}`
                    : "Connect your AgriWebb account to sync livestock data"}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isAgriwebbConnected ? (
                <>
                  <Badge className="bg-green-600">Connected</Badge>
                  <Button size="sm" variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync Now
                  </Button>
                </>
              ) : (
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Cloud className="h-4 w-4 mr-2" />
                  Connect AgriWebb
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Cattle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{cattle?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Healthy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div className="text-3xl font-bold">{healthSummary.healthy}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Need Attention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div className="text-3xl font-bold">{healthSummary.sick}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              <div className="text-3xl font-bold">{Object.keys(cattleByLocation).length}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Herd Location Map */}
      {cattleLoading ? (
        <CattleMapSkeleton />
      ) : (
        <CattleMap cattle={cattle || []} />
      )}

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Herd</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by tag, NLIS, breed, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Cattle by Location */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Cattle by Location</h2>
        
        {Object.entries(cattleByLocation).map(([location, animals]) => (
          <Card key={location}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <CardTitle>{location}</CardTitle>
                  <Badge variant="outline">{animals?.length || 0} head</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {animals?.map((animal) => (
                  <div
                    key={animal.id}
                    className="border rounded-lg p-4 hover:bg-accent cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-semibold text-lg">{animal.visualId}</div>
                        <div className="text-sm text-muted-foreground">
                          {animal.breed} • {animal.sex}
                        </div>
                      </div>
                      {animal.healthStatus === 'healthy' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                      <div>
                        <div className="text-muted-foreground">Weight</div>
                        <div className="font-semibold">{animal.currentWeight}kg</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">NLIS</div>
                        <div className="font-mono text-xs">{animal.nlisId?.substring(0, 10)}...</div>
                      </div>
                    </div>

                    {animal.agriwebbId && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <Cloud className="h-3 w-3" />
                          <span>Synced with AgriWebb</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <CardTitle>Recent Activity</CardTitle>
          </div>
          <CardDescription>Latest events across your herd</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentEvents?.slice(0, 10).map((event) => {
              const animal = cattle?.find(c => c.id === event.cattleId);
              return (
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
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {animal?.visualId || `Cattle #${event.cattleId}`} - {event.notes || 'No notes'}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(event.eventDate)}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <Button variant="outline" className="justify-start">
              <TrendingUp className="h-4 w-4 mr-2" />
              Record Weight
            </Button>
            <Button variant="outline" className="justify-start">
              <Activity className="h-4 w-4 mr-2" />
              Health Check
            </Button>
            <Button variant="outline" className="justify-start">
              <MapPin className="h-4 w-4 mr-2" />
              Move Cattle
            </Button>
            <Button variant="outline" className="justify-start">
              <AlertCircle className="h-4 w-4 mr-2" />
              Report Issue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
