"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Map } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import the map component with SSR disabled
const MapComponent = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[250px] bg-zinc-800/30 rounded-xl border border-zinc-700/50 flex flex-col items-center justify-center text-zinc-500 animate-pulse">
      <Map className="w-8 h-8 mb-2 opacity-20 animate-bounce" />
      <span className="text-sm">Loading Intelligence Map...</span>
    </div>
  ),
});

export function DistrictHeatmapWidget() {
  return (
    <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm h-full min-h-[300px] flex flex-col">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-zinc-400 flex items-center">
          <Map className="w-4 h-4 mr-2 text-indigo-400" />
          Liquidity & Demand Heatmap
        </CardTitle>
        <div className="flex gap-2 items-center">
          <span className="flex items-center text-[10px] text-zinc-400"><span className="w-2 h-2 rounded-full bg-indigo-400 mr-1"></span> Undervalued</span>
          <span className="flex items-center text-[10px] text-zinc-400"><span className="w-2 h-2 rounded-full bg-rose-400 mr-1"></span> Overvalued</span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-2 pb-3 px-3">
        <MapComponent />
      </CardContent>
    </Card>
  );
}
