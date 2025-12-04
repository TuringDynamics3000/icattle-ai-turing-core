import { useState, useMemo } from "react";
import { Link } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ExternalLink } from "lucide-react";

interface CattleRecord {
  id: number;
  visualId: string;
  nlisId: string | null;
  breed: string;
  sex: string;
  cattleType: string;
  healthStatus: string;
  currentWeight: number | null;
  currentLocation: string | null;
  currentValuation: number | null;
  clientId: number;
  biometricId: string | null;
  muzzleImageUrl: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface CattleDataTableProps {
  cattle: CattleRecord[];
  clients: Array<{ id: number; name: string }> | undefined;
  selectedCattle: Set<number>;
  onToggleSelect: (id: number) => void;
  onSelectAll: () => void;
}

type SortField = 'visualId' | 'breed' | 'sex' | 'healthStatus' | 'currentWeight' | 'currentValuation' | 'clientId';
type SortDirection = 'asc' | 'desc';

export function CattleDataTable({
  cattle,
  clients,
  selectedCattle,
  onToggleSelect,
  onSelectAll,
}: CattleDataTableProps) {
  const [sortField, setSortField] = useState<SortField>('visualId');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedCattle = useMemo(() => {
    return [...cattle].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      // Handle null values
      if (aVal === null) return 1;
      if (bVal === null) return -1;

      // String comparison
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [cattle, sortField, sortDirection]);

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
        return <Badge className="bg-orange-600">Attention</Badge>;
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

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="-ml-3 h-8 data-[state=open]:bg-accent"
    >
      {label}
      <ArrowUpDown className="ml-2 h-3 w-3" />
    </Button>
  );

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={selectedCattle.size === cattle.length && cattle.length > 0}
                onCheckedChange={onSelectAll}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead className="w-[80px]">Photo</TableHead>
            <TableHead>
              <SortButton field="visualId" label="ID" />
            </TableHead>
            <TableHead>
              <SortButton field="breed" label="Breed" />
            </TableHead>
            <TableHead>
              <SortButton field="sex" label="Sex/Type" />
            </TableHead>
            <TableHead>
              <SortButton field="healthStatus" label="Health" />
            </TableHead>
            <TableHead className="text-right">
              <SortButton field="currentWeight" label="Weight" />
            </TableHead>
            <TableHead>Location</TableHead>
            <TableHead className="text-right">
              <SortButton field="currentValuation" label="Value" />
            </TableHead>
            <TableHead>
              <SortButton field="clientId" label="Owner" />
            </TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedCattle.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11} className="h-24 text-center text-muted-foreground">
                No cattle found matching your filters.
              </TableCell>
            </TableRow>
          ) : (
            sortedCattle.map((animal) => (
              <TableRow
                key={animal.id}
                className={`hover:bg-muted/50 ${
                  selectedCattle.has(animal.id) ? 'bg-blue-50' : ''
                }`}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedCattle.has(animal.id)}
                    onCheckedChange={() => onToggleSelect(animal.id)}
                    aria-label={`Select ${animal.visualId}`}
                  />
                </TableCell>
                <TableCell>
                  {animal.muzzleImageUrl ? (
                    <img
                      src={animal.muzzleImageUrl}
                      alt={`${animal.visualId} muzzle`}
                      className="w-12 h-12 rounded object-cover border"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                      No photo
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">
                  <div>{animal.visualId}</div>
                  {animal.nlisId && (
                    <div className="text-xs text-muted-foreground font-mono">
                      {animal.nlisId}
                    </div>
                  )}
                </TableCell>
                <TableCell>{animal.breed}</TableCell>
                <TableCell>
                  <div className="capitalize">{animal.sex}</div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {animal.cattleType}
                  </div>
                </TableCell>
                <TableCell>{getHealthBadge(animal.healthStatus)}</TableCell>
                <TableCell className="text-right">
                  {animal.currentWeight ? `${animal.currentWeight}kg` : 'N/A'}
                </TableCell>
                <TableCell className="text-sm">
                  {animal.currentLocation || 'Unknown'}
                </TableCell>
                <TableCell className="text-right font-semibold text-green-600">
                  {formatCurrency(animal.currentValuation)}
                </TableCell>
                <TableCell className="text-sm">
                  {getClientName(animal.clientId)}
                </TableCell>
                <TableCell>
                  <Link href={`/cattle/${animal.id}`}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <ExternalLink className="h-4 w-4" />
                      <span className="sr-only">View details</span>
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
