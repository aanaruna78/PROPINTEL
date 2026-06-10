"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Map } from "lucide-react";

export function DistrictHeatmapWidget() {
  return (
    <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm h-full min-h-[300px] flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-zinc-400 flex items-center">
          <Map className="w-4 h-4 mr-2 text-indigo-400" />
          Liquidity & Demand Heatmap
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center p-6">
        <div className="w-full h-full min-h-[250px] bg-zinc-800/30 rounded-xl border border-zinc-700/50 border-dashed flex flex-col items-center justify-center text-zinc-500">
          <Map className="w-8 h-8 mb-2 opacity-20" />
          <span className="text-sm">Interactive Map Integration Pending</span>
        </div>
      </CardContent>
    </Card>
  );
}
