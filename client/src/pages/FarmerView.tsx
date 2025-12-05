import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CattleMap, CattleMapSkeleton } from "@/components/CattleMap";
import { useState, useMemo } from "react";
import { Link } from "wouter";
import { 
  ArrowLeft, Search, RefreshCw, MapPin, Activity, 
  TrendingUp, AlertCircle, CheckCircle2, Cloud, CloudOff, Building2, Tractor
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
  const [locationFilter, setLocationFilter] = useState<string>("all");

  // Assuming farmer is viewing their own herd (first client for demo)
  const farmerClient = clients?.[0];
  const isAgriwebbConnected = farmerClient?.agriwebbConnected || false;
  const lastSync = farmerClient?.agriwebbLastSync;

  // Get unique locations for filter dropdown
  const uniqueLocations = useMemo(() => {
    if (!cattle) return [];
    const locations = new Set(cattle.map(c => c.currentLocation || "Unknown"));
    return Array.from(locations).sort();
  }, [cattle]);

  // Filter cattle by search and location
  const filteredCattle = useMemo(() => {
    if (!cattle) return [];
    
    return cattle.filter(c => {
      const matchesSearch = 
        c.visualId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.nlisId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.breed?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.currentLocation?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesLocation = locationFilter === "all" || c.currentLocation === locationFilter;
      
      return matchesSearch && matchesLocation;
    });
  }, [cattle, searchTerm, locationFilter]);

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
      <div className="min-h-screen bg-lavender-50">
        <div className="container mx-auto px-6 py-12">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-lavender-50">
      {/* Hero Header with Purple Gradient */}
      <section className="relative overflow-hidden bg-gradient-purple-deep">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-10 w-64 h-64 bg-gradient-purple-pink opacity-30 shape-blob blur-3xl"></div>
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-gradient-coral-cream opacity-20 shape-circle blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-6 py-16 relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/">
              <a className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <ArrowLeft className="h-6 w-6 text-white" />
              </a>
            </Link>
            <div>
              <h1 className="font-serif font-bold text-5xl text-white">My Herd</h1>
              <p className="text-lavender-100 text-xl mt-2">
                Operational view for {farmerClient?.name || "your farm"}
              </p>
            </div>
          </div>

          {/* Quick Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4 mt-8">
            <div className="glass-card-dark rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Tractor className="w-5 h-5 text-coral-400" />
                <div className="text-sm text-lavender-200">Total Cattle</div>
              </div>
              <div className="text-4xl font-bold text-white">{cattle?.length || 0}</div>
            </div>

            <div className="glass-card-dark rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <div className="text-sm text-lavender-200">Healthy</div>
              </div>
              <div className="text-4xl font-bold text-white">{healthSummary.healthy}</div>
            </div>

            <div className="glass-card-dark rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="w-5 h-5 text-orange-400" />
                <div className="text-sm text-lavender-200">Need Attention</div>
              </div>
              <div className="text-4xl font-bold text-white">{healthSummary.sick}</div>
            </div>

            <div className="glass-card-dark rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="w-5 h-5 text-blue-400" />
                <div className="text-sm text-lavender-200">Locations</div>
              </div>
              <div className="text-4xl font-bold text-white">{Object.keys(cattleByLocation).length}</div>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z" fill="#FAFAFC"/>
          </svg>
        </div>
      </section>

      <div className="container mx-auto px-6 py-12 space-y-8">
        {/* AgriWebb Sync Status */}
        <div className={`glass-card rounded-3xl p-6 shadow-soft-lg ${isAgriwebbConnected ? 'border-2 border-green-200' : 'border-2 border-orange-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {isAgriwebbConnected ? (
                <div className="p-3 bg-green-100 rounded-2xl">
                  <Cloud className="h-6 w-6 text-green-600" />
                </div>
              ) : (
                <div className="p-3 bg-orange-100 rounded-2xl">
                  <CloudOff className="h-6 w-6 text-orange-600" />
                </div>
              )}
              <div>
                <h3 className="font-semibold text-lg text-plum-900">AgriWebb Integration</h3>
                <p className="text-gray-600 text-sm">
                  {isAgriwebbConnected 
                    ? `Last synced: ${formatDate(lastSync)}`
                    : "Connect your AgriWebb account to sync livestock data"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isAgriwebbConnected ? (
                <>
                  <Badge className="bg-green-600 text-white px-4 py-1">Connected</Badge>
                  <Button size="sm" className="bg-white text-plum-800 hover:bg-lavender-50 shadow-soft-md">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync Now
                  </Button>
                </>
              ) : (
                <Button size="sm" className="bg-gradient-purple-deep text-white hover:opacity-90 shadow-3d-purple">
                  <Cloud className="h-4 w-4 mr-2" />
                  Connect AgriWebb
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="glass-card rounded-3xl p-6 shadow-soft-lg">
          <h2 className="font-serif font-bold text-2xl text-plum-900 mb-4">Search & Filter Herd</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search by tag, NLIS, breed, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 bg-white border-gray-200 focus:border-plum-500"
              />
            </div>
            <div className="relative">
              <Building2 className="absolute left-3 top-3 h-5 w-5 text-gray-400 pointer-events-none z-10" />
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="pl-10 h-12 bg-white border-gray-200 focus:border-plum-500">
                  <SelectValue placeholder="Filter by location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {uniqueLocations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {filteredCattle.length !== cattle.length && (
            <div className="mt-4 text-sm text-gray-600">
              Showing {filteredCattle.length} of {cattle.length} cattle
            </div>
          )}
        </div>

        {/* Herd Location Map */}
        {cattleLoading ? (
          <CattleMapSkeleton />
        ) : (
          <div className="glass-card rounded-3xl overflow-hidden shadow-soft-lg">
            <div className="p-6 border-b border-gray-200">
              <h2 className="font-serif font-bold text-2xl text-plum-900">Herd Location Map</h2>
              <p className="text-gray-600 mt-1">Real-time GPS tracking of your livestock</p>
            </div>
            <CattleMap cattle={filteredCattle || []} />
          </div>
        )}

        {/* Cattle by Location */}
        <div className="space-y-6">
          <h2 className="font-serif font-bold text-3xl text-plum-900">Cattle by Location</h2>
          
          {Object.entries(cattleByLocation).map(([location, animals]) => (
            <div key={location} className="glass-card rounded-3xl p-6 shadow-soft-lg">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-2xl">
                    <MapPin className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xl text-plum-900">{location}</h3>
                    <p className="text-gray-600 text-sm">{animals?.length || 0} head</p>
                  </div>
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {animals?.map((animal) => (
                  <Link key={animal.id} href={`/cattle/${animal.id}`}>
                    <a className="block bg-white rounded-2xl p-5 hover:shadow-3d-purple transition-all cursor-pointer border border-gray-100">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="font-bold text-lg text-plum-900">{animal.visualId}</div>
                          <div className="text-sm text-gray-600">
                            {animal.breed} • {animal.sex}
                          </div>
                        </div>
                        {animal.healthStatus === 'healthy' ? (
                          <CheckCircle2 className="h-6 w-6 text-green-600" />
                        ) : (
                          <AlertCircle className="h-6 w-6 text-orange-600" />
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm mt-4 pt-4 border-t border-gray-100">
                        <div>
                          <div className="text-gray-500 text-xs mb-1">Weight</div>
                          <div className="font-semibold text-plum-900">{animal.currentWeight}kg</div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-xs mb-1">NLIS</div>
                          <div className="font-mono text-xs text-plum-900">{animal.nlisId?.substring(0, 10)}...</div>
                        </div>
                      </div>

                      {animal.agriwebbId && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-2 text-xs text-green-600">
                            <Cloud className="h-3 w-3" />
                            <span className="font-medium">Synced with AgriWebb</span>
                          </div>
                        </div>
                      )}
                    </a>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="glass-card rounded-3xl p-6 shadow-soft-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-coral-100 rounded-2xl">
              <Activity className="h-6 w-6 text-coral-600" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-2xl text-plum-900">Recent Activity</h2>
              <p className="text-gray-600 text-sm">Latest events across your herd</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {recentEvents?.slice(0, 10).map((event) => {
              const animal = cattle?.find(c => c.id === event.cattleId);
              return (
                <div key={event.id} className="flex items-start justify-between bg-white rounded-2xl p-4 border border-gray-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-blue-600" />
                      <span className="font-semibold text-plum-900 capitalize">
                        {event.eventType.replace('_', ' ')}
                      </span>
                      {event.weight && (
                        <span className="text-sm text-gray-600">
                          • {event.weight}kg
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {animal?.visualId || `Cattle #${event.cattleId}`} - {event.notes || 'No notes'}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {formatDate(event.eventDate)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-card rounded-3xl p-6 shadow-soft-lg">
          <h2 className="font-serif font-bold text-2xl text-plum-900 mb-6">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-4">
            <Button className="h-auto py-4 bg-white text-plum-800 hover:bg-lavender-50 border border-gray-200 shadow-soft-md justify-start">
              <TrendingUp className="h-5 w-5 mr-3 text-coral-600" />
              <span className="font-semibold">Record Weight</span>
            </Button>
            <Button className="h-auto py-4 bg-white text-plum-800 hover:bg-lavender-50 border border-gray-200 shadow-soft-md justify-start">
              <Activity className="h-5 w-5 mr-3 text-blue-600" />
              <span className="font-semibold">Health Check</span>
            </Button>
            <Button className="h-auto py-4 bg-white text-plum-800 hover:bg-lavender-50 border border-gray-200 shadow-soft-md justify-start">
              <MapPin className="h-5 w-5 mr-3 text-green-600" />
              <span className="font-semibold">Move Cattle</span>
            </Button>
            <Button className="h-auto py-4 bg-white text-plum-800 hover:bg-lavender-50 border border-gray-200 shadow-soft-md justify-start">
              <AlertCircle className="h-5 w-5 mr-3 text-orange-600" />
              <span className="font-semibold">Report Issue</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
