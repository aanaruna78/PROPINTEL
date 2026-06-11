"use client";

import { BrainCircuit, Activity, DatabaseZap } from "lucide-react";

export function AiSystemStats() {
  return (
    <div className="hidden md:flex items-center gap-6 px-4">
      <div className="flex flex-col">
        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5 flex items-center">
          <BrainCircuit className="w-3 h-3 mr-1 text-primary" /> Active AI Models
        </span>
        <span className="text-xs font-semibold text-foreground">4 (Prophet-V2, GeoMatch)</span>
      </div>
      
      <div className="h-8 w-px bg-border"></div>
      
      <div className="flex flex-col">
        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5 flex items-center">
          <Activity className="w-3 h-3 mr-1 text-emerald-500" /> Listings Scanned (24h)
        </span>
        <span className="text-xs font-semibold text-foreground">14,208</span>
      </div>
      
      <div className="h-8 w-px bg-border"></div>
      
      <div className="flex flex-col">
        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5 flex items-center">
          <DatabaseZap className="w-3 h-3 mr-1 text-amber-500" /> Anomalies Found
        </span>
        <span className="text-xs font-semibold text-foreground">342 Undervalued</span>
      </div>
    </div>
  );
}
