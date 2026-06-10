"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet icons (not strictly necessary for CircleMarker, but good practice)
import L from "leaflet";
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const SINGAPORE_CENTER: [number, number] = [1.3521, 103.8198];

const MOCK_ZONES = [
  {
    id: "D09",
    name: "Orchard / Cairnhill",
    coords: [1.3039, 103.8320] as [number, number],
    demand: 600, // Determines size
    movement: "stable", // Determines color
    valuationDiff: "+2.1%",
    yield: "3.2%",
  },
  {
    id: "D01",
    name: "Marina Bay",
    coords: [1.2834, 103.8509] as [number, number],
    demand: 800,
    movement: "rising",
    valuationDiff: "-4.5%", // Undervalued!
    yield: "4.8%",
  },
  {
    id: "D15",
    name: "East Coast / Marine Parade",
    coords: [1.3040, 103.9020] as [number, number],
    demand: 1200,
    movement: "rising",
    valuationDiff: "-6.2%", // Highly Undervalued!
    yield: "4.5%",
  },
  {
    id: "D18",
    name: "Tampines / Pasir Ris",
    coords: [1.3524, 103.9442] as [number, number],
    demand: 1500,
    movement: "dropping",
    valuationDiff: "+8.0%", // Overvalued
    yield: "3.9%",
  },
];

export default function MapComponent() {
  const getZoneColor = (movement: string) => {
    switch (movement) {
      case "rising": return "#818cf8"; // Indigo (Good opportunity)
      case "dropping": return "#f43f5e"; // Rose (Risk/Overvalued)
      default: return "#a1a1aa"; // Zinc (Stable)
    }
  };

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-zinc-800">
      <MapContainer 
        center={SINGAPORE_CENTER} 
        zoom={11} 
        style={{ height: "100%", width: "100%", backgroundColor: "#09090b" }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        {MOCK_ZONES.map((zone) => (
          <CircleMarker
            key={zone.id}
            center={zone.coords}
            radius={Math.sqrt(zone.demand) * 1.5}
            pathOptions={{ 
              fillColor: getZoneColor(zone.movement), 
              fillOpacity: 0.6,
              color: getZoneColor(zone.movement),
              weight: 2
            }}
          >
            <Tooltip className="bg-zinc-900 border-zinc-800 text-zinc-100 shadow-xl" direction="top" opacity={1}>
              <div className="font-bold text-sm mb-1">{zone.name} ({zone.id})</div>
              <div className="text-xs text-zinc-400">Demand Vol: <span className="text-zinc-100 font-medium">{zone.demand}</span></div>
              <div className="text-xs text-zinc-400">vs Fair Value: <span className={`font-medium ${zone.movement === 'rising' ? 'text-emerald-400' : 'text-rose-400'}`}>{zone.valuationDiff}</span></div>
              <div className="text-xs text-zinc-400">Est. Yield: <span className="text-zinc-100 font-medium">{zone.yield}</span></div>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
