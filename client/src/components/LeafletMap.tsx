import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

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

interface LeafletMapProps {
  cattle: CattleLocation[];
  height?: string;
}

export function LeafletMap({ cattle, height = '500px' }: LeafletMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map centered on Australia
    if (!mapInstance.current) {
      mapInstance.current = L.map(mapContainer.current).setView([-25.2744, 133.7751], 5);

      // Add OpenStreetMap tile layer (free, no API key needed)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapInstance.current);
    }

    const map = mapInstance.current;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Filter cattle with valid GPS coordinates
    const cattleWithGps = cattle.filter(c => c.latitude && c.longitude);

    if (cattleWithGps.length === 0) return;

    // Add markers for each cattle
    const bounds = L.latLngBounds([]);

    cattleWithGps.forEach(animal => {
      const lat = parseFloat(animal.latitude!);
      const lng = parseFloat(animal.longitude!);

      if (isNaN(lat) || isNaN(lng)) return;

      // Color code by health status
      let markerColor = '#10b981'; // green for healthy
      if (animal.healthStatus === 'sick') markerColor = '#f59e0b'; // orange
      if (animal.healthStatus === 'quarantine') markerColor = '#ef4444'; // red
      if (animal.healthStatus === 'deceased') markerColor = '#6b7280'; // gray

      // Create custom icon with health status color
      const customIcon = L.divIcon({
        className: 'custom-cattle-marker',
        html: `<div style="
          width: 16px;
          height: 16px;
          background-color: ${markerColor};
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      const marker = L.marker([lat, lng], { icon: customIcon })
        .addTo(map)
        .bindPopup(`
          <div style="min-width: 200px;">
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
        `);

      markersRef.current.push(marker);
      bounds.extend([lat, lng]);
    });

    // Fit map to show all markers
    if (cattleWithGps.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    return () => {
      // Cleanup on unmount
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [cattle]);

  return (
    <div 
      ref={mapContainer} 
      style={{ 
        width: '100%', 
        height,
        borderRadius: '0.5rem',
      }} 
    />
  );
}
