import { useState } from "react";
import { LeafletMap } from "@/components/LeafletMap";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface CattleLocation {
  id: number;
  visualId: string | null;
  nlisId: string | null;
  breed: string;
  sex: string;
  healthStatus: string;
  currentWeight: number | null;
  currentLocation: string | null;
  latitude: string | null;
  longitude: string | null;
}

interface CattleMapProps {
  cattle: CattleLocation[];
}

export function CattleMap({ cattle }: CattleMapProps) {
  // Filter cattle with GPS coordinates
  const cattleWithGps = cattle.filter(c => c.latitude && c.longitude);

  if (cattleWithGps.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Herd Location Map</CardTitle>
          <CardDescription>GPS tracking not available for any cattle</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
            <p className="text-muted-foreground">
              No GPS coordinates available. Enable GPS tracking to see cattle locations on the map.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Herd Location Map</CardTitle>
            <CardDescription>
              Real-time GPS tracking • {cattleWithGps.length} of {cattle.length} cattle tracked
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm">Healthy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-sm">Sick</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm">Quarantine</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg overflow-hidden border">
          <LeafletMap cattle={cattleWithGps} height="500px" />
        </div>
      </CardContent>
    </Card>
  );
}

export function CattleMapSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[500px] w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}
