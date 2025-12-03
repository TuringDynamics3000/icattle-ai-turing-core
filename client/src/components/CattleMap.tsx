import { useEffect, useRef, useState } from "react";
import { MapView } from "@/components/Map";
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
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedCattle, setSelectedCattle] = useState<CattleLocation | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  // Filter cattle with GPS coordinates
  const cattleWithGps = cattle.filter(c => c.latitude && c.longitude);

  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Create info window if not exists
    if (!infoWindowRef.current) {
      infoWindowRef.current = new google.maps.InfoWindow();
    }

    // Add markers for each cattle with GPS
    cattleWithGps.forEach(animal => {
      const lat = parseFloat(animal.latitude!);
      const lng = parseFloat(animal.longitude!);

      if (isNaN(lat) || isNaN(lng)) return;

      // Color code by health status
      let markerColor = "#10b981"; // green for healthy
      if (animal.healthStatus === "sick") markerColor = "#f59e0b"; // orange
      if (animal.healthStatus === "quarantine") markerColor = "#ef4444"; // red
      if (animal.healthStatus === "deceased") markerColor = "#6b7280"; // gray

      const marker = new google.maps.Marker({
        position: { lat, lng },
        map: map,
        title: animal.visualId || `Cattle #${animal.id}`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: markerColor,
          fillOpacity: 0.8,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });

      // Add click listener
      marker.addListener("click", () => {
        setSelectedCattle(animal);
        
        const contentString = `
          <div style="padding: 8px; min-width: 200px;">
            <h3 style="font-weight: bold; font-size: 16px; margin-bottom: 8px;">
              ${animal.visualId || `Cattle #${animal.id}`}
            </h3>
            <div style="display: grid; gap: 4px; font-size: 14px;">
              <div><strong>Breed:</strong> ${animal.breed}</div>
              <div><strong>Sex:</strong> ${animal.sex}</div>
              <div><strong>Weight:</strong> ${animal.currentWeight || 'N/A'}kg</div>
              <div><strong>Location:</strong> ${animal.currentLocation || 'Unknown'}</div>
              <div><strong>Health:</strong> 
                <span style="color: ${markerColor}; text-transform: capitalize;">
                  ${animal.healthStatus}
                </span>
              </div>
              <div style="margin-top: 8px; font-size: 12px; color: #666;">
                <strong>NLIS:</strong> ${animal.nlisId || 'N/A'}
              </div>
            </div>
          </div>
        `;

        infoWindowRef.current!.setContent(contentString);
        infoWindowRef.current!.open(map, marker);
      });

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers
    if (cattleWithGps.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      cattleWithGps.forEach(animal => {
        const lat = parseFloat(animal.latitude!);
        const lng = parseFloat(animal.longitude!);
        if (!isNaN(lat) && !isNaN(lng)) {
          bounds.extend({ lat, lng });
        }
      });
      map.fitBounds(bounds);
      
      // Adjust zoom if only one marker
      if (cattleWithGps.length === 1) {
        map.setZoom(15);
      }
    }
  }, [map, cattleWithGps]);

  const handleMapReady = (mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  };

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
          <div style={{ width: "100%", height: "500px" }}>
            <MapView onMapReady={handleMapReady} />
          </div>
        </div>
        
        {selectedCattle && (
          <div className="mt-4 p-4 bg-accent rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">Selected: {selectedCattle.visualId}</h4>
              <Badge variant={selectedCattle.healthStatus === 'healthy' ? 'default' : 'destructive'}>
                {selectedCattle.healthStatus}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Breed:</span> {selectedCattle.breed}
              </div>
              <div>
                <span className="text-muted-foreground">Weight:</span> {selectedCattle.currentWeight}kg
              </div>
              <div>
                <span className="text-muted-foreground">Location:</span> {selectedCattle.currentLocation}
              </div>
              <div>
                <span className="text-muted-foreground">Sex:</span> {selectedCattle.sex}
              </div>
            </div>
          </div>
        )}
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
