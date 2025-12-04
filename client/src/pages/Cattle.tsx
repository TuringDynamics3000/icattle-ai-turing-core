import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CattleDataTable } from "@/components/CattleDataTable";

import { Link } from "wouter";
import { ArrowLeft, Search, Filter, FileDown, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [limit] = useState(50); // Items per page

  const { data: clients } = trpc.clients.active.useQuery();
  
  // Use paginated query with filters
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

  // Reset cursor when filters change
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

  // Get unique breeds for filter
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
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64" />
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
            Digital twin registry with biometric verification • {total.toLocaleString()} total cattle
            {role && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Role: {role.toUpperCase()}
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
          variant="outline"
          className="gap-2"
        >
          <FileDown className="h-4 w-4" />
            Export CSV
          </Button>
        )}
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
          <div className={`grid gap-4 ${features.showFarmFilter ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>
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

            <Select value={filterSex} onValueChange={setFilterSex}>
              <SelectTrigger>
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
            )}

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

      {/* Batch Operations Toolbar */}
      {features.showBatchOperations && selectedCattle.size > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-semibold">
                  {selectedCattle.size} cattle selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCattle(new Set())}
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
                >
                  Mark Healthy
                </Button>
                <Button
                  size="sm"
                  variant="outline"
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
                >
                  Move Cattle
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (confirm(`Update valuations for ${selectedCattle.size} cattle?`)) {
                      batchValuation.mutate({
                        cattleIds: Array.from(selectedCattle),
                        valuationMethod: "market",
                      });
                    }
                  }}
                  disabled={batchValuation.isPending}
                >
                  Update Valuations
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Table */}
      <CattleDataTable
        cattle={cattle}
        clients={clients}
        selectedCattle={selectedCattle}
        onToggleSelect={handleToggleSelect}
        onSelectAll={handleSelectAll}
      />

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {cursor + 1} to {Math.min(cursor + limit, total)} of {total.toLocaleString()} cattle
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
            disabled={cursor === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <div className="text-sm font-medium">
            Page {currentPage} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={!hasMore}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
