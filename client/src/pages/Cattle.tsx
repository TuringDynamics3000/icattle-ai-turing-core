import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CattleDataTable } from "@/components/CattleDataTable";
import { Link } from "wouter";
import { ArrowLeft, Search, Filter, FileDown, ChevronLeft, ChevronRight, Database, Activity } from "lucide-react";
import { exportCattleToCSV, type CattleExportData } from "@/lib/exportCSV";
import { useRoleFeatures } from "@/hooks/useRoleFeatures";

export function Cattle() {
  const { features, role } = useRoleFeatures();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBreed, setFilterBreed] = useState<string>("all");
  const [filterClient, setFilterClient] = useState<string>("all");
  const [filterHealth, setFilterHealth] = useState<string>("all");
  const [filterSex, setFilterSex] = useState<string>("all");
  const [selectedCattle, setSelectedCattle] = useState<Set<number>>(new Set());
  const [cursor, setCursor] = useState(0);
  const [limit] = useState(50);

  const { data: clients } = trpc.clients.active.useQuery();
  
  const { data: paginatedData, isLoading } = trpc.cattle.list.useQuery({
    cursor,
    limit,
    filters: {
      clientId: filterClient !== "all" ? parseInt(filterClient) : undefined,
      healthStatus: filterHealth !== "all" ? (filterHealth as any) : undefined,
      breed: filterBreed !== "all" ? filterBreed : undefined,
      sex: filterSex !== "all" ? (filterSex as any) : undefined,
      searchQuery: searchTerm || undefined,
    },
  });

  const cattle = paginatedData?.items || [];
  const hasMore = paginatedData?.hasMore || false;
  const total = paginatedData?.total || 0;

  const utils = trpc.useUtils();
  const batchHealthCheck = trpc.cattle.batchHealthCheck.useMutation({
    onSuccess: () => {
      console.log("Health checks recorded successfully");
      setSelectedCattle(new Set());
      utils.cattle.list.invalidate();
    },
  });
  
  const batchMovement = trpc.cattle.batchMovement.useMutation({
    onSuccess: () => {
      console.log("Movements recorded successfully");
      setSelectedCattle(new Set());
      utils.cattle.list.invalidate();
    },
  });
  
  const batchValuation = trpc.cattle.batchValuation.useMutation({
    onSuccess: () => {
      console.log("Valuations updated successfully");
      setSelectedCattle(new Set());
      utils.cattle.list.invalidate();
    },
  });

  useEffect(() => {
    setCursor(0);
    setSelectedCattle(new Set());
  }, [searchTerm, filterBreed, filterClient, filterHealth, filterSex]);

  const handleSelectAll = () => {
    if (selectedCattle.size === cattle.length) {
      setSelectedCattle(new Set());
    } else {
      setSelectedCattle(new Set(cattle.map(c => c.id)));
    }
  };
  
  const handleToggleSelect = (id: number) => {
    const newSelected = new Set(selectedCattle);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCattle(newSelected);
  };

  const breeds = useMemo(() => {
    if (!cattle) return [];
    const uniqueBreeds = Array.from(new Set(cattle.map(c => c.breed).filter(Boolean)));
    return uniqueBreeds.sort();
  }, [cattle]);

  const handleNextPage = () => {
    if (hasMore) {
      setCursor(cursor + limit);
    }
  };

  const handlePrevPage = () => {
    if (cursor > 0) {
      setCursor(Math.max(0, cursor - limit));
    }
  };

  const currentPage = Math.floor(cursor / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  if (isLoading && cattle.length === 0) {
    return (
      <div className="min-h-screen bg-lavender-50">
        <div className="container mx-auto px-6 py-12">
          <Skeleton className="h-12 w-64 mb-12" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-lavender-50">
      {/* Header with gradient */}
      <div className="bg-gradient-purple-deep relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 right-20 w-64 h-64 bg-gradient-purple-pink opacity-30 shape-blob blur-3xl"></div>
          <div className="absolute bottom-10 left-20 w-96 h-96 bg-gradient-coral-cream opacity-20 shape-circle blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-6 py-16 relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Link href="/">
                  <a className="p-2 rounded-xl hover:bg-white/10 transition-colors">
                    <ArrowLeft className="h-6 w-6 text-white" />
                  </a>
                </Link>
                <Database className="w-8 h-8 text-coral-400" />
              </div>
              <h1 className="font-serif font-bold text-5xl text-white mb-3">Cattle Registry</h1>
              <p className="text-lavender-100 text-xl">
                Digital twin registry with biometric verification • {total.toLocaleString()} total cattle
                {role && (
                  <span className="ml-3 px-3 py-1 rounded-full bg-white/20 text-white text-sm font-semibold">
                    {role.toUpperCase()}
                  </span>
                )}
              </p>
            </div>
            {features.showExport && (
              <Button
                onClick={() => {
                  if (cattle) {
                    const exportData: CattleExportData[] = cattle.map(c => ({
                      id: c.id,
                      nlisId: c.nlisId || '',
                      biometricId: c.biometricId,
                      breed: c.breed,
                      color: c.color || '',
                      cattleType: c.cattleType,
                      birthDate: c.dateOfBirth ? c.dateOfBirth.toISOString().split('T')[0] : '',
                      currentWeight: c.currentWeight || 0,
                      currentLocation: c.currentLocation || '',
                      healthStatus: c.healthStatus,
                      currentValuation: c.currentValuation || 0,
                      acquisitionCost: c.acquisitionCost || 0,
                      clientId: c.clientId,
                      gpsLatitude: c.latitude,
                      gpsLongitude: c.longitude,
                    }));
                    exportCattleToCSV(exportData);
                  }
                }}
                className="bg-white text-plum-900 hover:bg-lavender-50 px-6 py-3 rounded-full font-semibold flex items-center gap-2"
              >
                <FileDown className="h-5 w-5" />
                Export CSV
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {/* Filters */}
        <div className="bg-white rounded-3xl p-8 shadow-soft-md mb-8 -mt-20 relative z-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-gradient-to-br from-plum-500 to-plum-700">
              <Filter className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-plum-900">Filters</h2>
          </div>
          <div className={`grid gap-4 ${features.showFarmFilter ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by ID, NLIS, breed..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 border-lavender-200 focus:border-plum-500 focus:ring-plum-500"
              />
            </div>
            
            <Select value={filterBreed} onValueChange={setFilterBreed}>
              <SelectTrigger className="border-lavender-200 focus:border-plum-500 focus:ring-plum-500">
                <SelectValue placeholder="All Breeds" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Breeds</SelectItem>
                {breeds.map(breed => (
                  <SelectItem key={breed} value={breed}>{breed}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterSex} onValueChange={setFilterSex}>
              <SelectTrigger className="border-lavender-200 focus:border-plum-500 focus:ring-plum-500">
                <SelectValue placeholder="All Sex/Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sex/Type</SelectItem>
                <SelectItem value="bull">Bull</SelectItem>
                <SelectItem value="steer">Steer</SelectItem>
                <SelectItem value="cow">Cow</SelectItem>
                <SelectItem value="heifer">Heifer</SelectItem>
                <SelectItem value="calf">Calf</SelectItem>
              </SelectContent>
            </Select>

            {features.showFarmFilter && (
              <Select value={filterClient} onValueChange={setFilterClient}>
                <SelectTrigger className="border-lavender-200 focus:border-plum-500 focus:ring-plum-500">
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
            )}

            <Select value={filterHealth} onValueChange={setFilterHealth}>
              <SelectTrigger className="border-lavender-200 focus:border-plum-500 focus:ring-plum-500">
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
        </div>

        {/* Batch Operations Toolbar */}
        {features.showBatchOperations && selectedCattle.size > 0 && (
          <div className="bg-gradient-to-br from-plum-100 to-lavender-100 rounded-3xl p-6 shadow-soft-md mb-8 border-2 border-plum-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-xl bg-gradient-to-br from-plum-500 to-plum-700">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-plum-900 text-lg">
                  {selectedCattle.size} cattle selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCattle(new Set())}
                  className="border-plum-300 text-plum-700 hover:bg-white"
                >
                  Clear Selection
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    if (confirm(`Mark ${selectedCattle.size} cattle as healthy?`)) {
                      batchHealthCheck.mutate({
                        cattleIds: Array.from(selectedCattle),
                        healthStatus: "healthy",
                      });
                    }
                  }}
                  disabled={batchHealthCheck.isPending}
                  className="bg-gradient-to-br from-green-500 to-green-700 text-white hover:from-green-600 hover:to-green-800"
                >
                  Mark Healthy
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    const location = prompt("Enter new location:");
                    if (location) {
                      batchMovement.mutate({
                        cattleIds: Array.from(selectedCattle),
                        toLocation: location,
                      });
                    }
                  }}
                  disabled={batchMovement.isPending}
                  className="bg-gradient-to-br from-plum-500 to-plum-700 text-white hover:from-plum-600 hover:to-plum-800"
                >
                  Move Cattle
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    if (confirm(`Update valuations for ${selectedCattle.size} cattle?`)) {
                      batchValuation.mutate({
                        cattleIds: Array.from(selectedCattle),
                        valuationMethod: "market",
                      });
                    }
                  }}
                  disabled={batchValuation.isPending}
                  className="bg-gradient-to-br from-coral-500 to-coral-700 text-white hover:from-coral-600 hover:to-coral-800"
                >
                  Update Valuations
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white rounded-3xl shadow-soft-md overflow-hidden mb-8">
          <CattleDataTable
            cattle={cattle}
            clients={clients}
            selectedCattle={selectedCattle}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
          />
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 font-medium">
            Showing {cursor + 1} to {Math.min(cursor + limit, total)} of {total.toLocaleString()} cattle
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={cursor === 0}
              className="border-lavender-200 text-plum-700 hover:bg-lavender-50 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <div className="px-4 py-2 rounded-full bg-gradient-to-br from-plum-500 to-plum-700 text-white font-bold text-sm">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={!hasMore}
              className="border-lavender-200 text-plum-700 hover:bg-lavender-50 disabled:opacity-50"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
