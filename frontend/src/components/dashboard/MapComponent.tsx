"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Fix Leaflet icons (not strictly necessary for CircleMarker, but good practice)
import L from "leaflet";
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });
}

const SINGAPORE_CENTER: [number, number] = [1.3521, 103.8198];

interface ZoneData {
  district: string;
  name: string;
  coords: [number, number];
  month: string;
  avg_price_psf: number;
  price_movement_percent: number;
  rental_pressure: number;
  buyer_activity: number;
  demand_index: number;
  transaction_count: number;
}

export default function MapComponent() {
  const { token } = useAuth();
  const [zones, setZones] = useState<ZoneData[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    const fetchZones = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/analytics/districts`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          // Map backend coordinates list to [lat, lon] tuple
          const formattedZones = data.map((z: any) => ({
            ...z,
            coords: [z.coords[1], z.coords[0]] as [number, number] // backend yields [lon, lat], leaflet needs [lat, lon]
          }));
          setZones(formattedZones);
        }
      } catch (err) {
        console.error("Failed to fetch map zones:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchZones();
  }, [token]);

  const getZoneColor = (priceMovement: number) => {
    if (priceMovement > 0.3) {
      return "#818cf8"; // Indigo (Rising / Good opportunities)
    } else if (priceMovement < -0.3) {
      return "#f43f5e"; // Rose (Dropping / High risk)
    } else {
      return "#a1a1aa"; // Zinc (Stable)
    }
  };

  const getMovementLabel = (priceMovement: number) => {
    if (priceMovement > 0.3) return "Rising";
    if (priceMovement < -0.3) return "Dropping";
    return "Stable";
  };

  if (loading) {
    return (
      <div className="w-full h-full min-h-[250px] bg-muted/10 rounded-xl border border-border/50 flex flex-col items-center justify-center text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
        <span className="text-xs font-semibold">Loading map data...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative rounded-lg overflow-hidden border border-border">
      <MapContainer 
        center={SINGAPORE_CENTER} 
        zoom={11.5} 
        style={{ height: "100%", width: "100%", backgroundColor: "#0b0f19", zIndex: 0 }}
        zoomControl={false}
      >
        {/* Dark style tile layer to match the premium dark theme of PROPINTEL */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        {zones.map((zone) => (
          <CircleMarker
            key={zone.district}
            center={zone.coords}
            // Radius proportional to the demand index (higher demand = larger circle)
            radius={8 + (zone.demand_index * 2)}
            pathOptions={{ 
              fillColor: getZoneColor(zone.price_movement_percent), 
              fillOpacity: 0.5,
              color: getZoneColor(zone.price_movement_percent),
              weight: 1.5
            }}
          >
            <Tooltip className="bg-card border-border text-foreground shadow-2xl p-3 rounded-lg" direction="top" opacity={0.95}>
              <div className="font-extrabold text-xs mb-1.5 border-b border-border/40 pb-1 flex items-center justify-between gap-4">
                <span>{zone.district}: {zone.name.split(" / ")[0]}</span>
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-black">
                  Demand: {zone.demand_index}
                </span>
              </div>
              <div className="space-y-1 text-[10px]">
                <div className="text-muted-foreground flex justify-between gap-4">
                  Avg Price: <span className="text-foreground font-bold">{Math.round(zone.avg_price_psf)} psf</span>
                </div>
                <div className="text-muted-foreground flex justify-between gap-4">
                  MoM Growth: <span className={`font-bold ${zone.price_movement_percent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {zone.price_movement_percent >= 0 ? "+" : ""}{zone.price_movement_percent.toFixed(2)}%
                  </span>
                </div>
                <div className="text-muted-foreground flex justify-between gap-4">
                  Rental Pressure: <span className="text-foreground font-bold">{zone.rental_pressure}/10</span>
                </div>
                <div className="text-muted-foreground flex justify-between gap-4">
                  Buyer Activity: <span className="text-foreground font-bold">{zone.buyer_activity}/10</span>
                </div>
              </div>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
