"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Map, Maximize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";

// Dynamically import the map component with SSR disabled
const MapComponent = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[250px] bg-muted/30 rounded-xl border border-border/50 flex flex-col items-center justify-center text-muted-foreground animate-pulse">
      <Map className="w-8 h-8 mb-2 opacity-20 animate-bounce" />
      <span className="text-sm">Loading Intelligence Map...</span>
    </div>
  ),
});

export function DistrictHeatmapWidget() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <Card className="glass-panel h-full min-h-[300px] flex flex-col w-full rounded-xl border-0 shadow-sm">
        <CardHeader className="pb-2 flex flex-row items-center justify-between shrink-0">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
            <Map className="w-4 h-4 mr-2 text-primary" />
            Liquidity & Demand Heatmap
          </CardTitle>
          <div className="flex gap-2 items-center">
            <span className="flex items-center text-[10px] text-muted-foreground"><span className="w-2 h-2 rounded-full bg-indigo-500 mr-1"></span> Undervalued</span>
            <span className="flex items-center text-[10px] text-muted-foreground"><span className="w-2 h-2 rounded-full bg-rose-500 mr-1"></span> Overvalued</span>
            <Button variant="ghost" size="icon" className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground" onClick={() => setIsExpanded(true)}>
              <Maximize2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-3 pt-0 relative min-h-[250px]">
          <div className="absolute inset-3 top-0">
            <MapComponent />
          </div>
        </CardContent>
      </Card>

      {/* Expanded Fullscreen Overlay */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm p-4 md:p-8 flex items-center justify-center animate-in fade-in duration-200">
          <Card className="w-full h-full max-w-[1400px] flex flex-col bg-card shadow-2xl border-border rounded-2xl overflow-hidden relative">
            <CardHeader className="py-3 px-4 border-b border-border flex flex-row items-center justify-between shrink-0 bg-secondary/30">
              <CardTitle className="text-base font-bold text-foreground flex items-center">
                <Map className="w-5 h-5 mr-2 text-primary" />
                Liquidity & Demand Heatmap
              </CardTitle>
              <div className="flex gap-4 items-center">
                <span className="hidden sm:flex items-center text-xs text-muted-foreground"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500 mr-2"></span> Undervalued Zone</span>
                <span className="hidden sm:flex items-center text-xs text-muted-foreground"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 mr-2"></span> Overvalued Zone</span>
                <div className="hidden sm:block h-6 w-px bg-border mx-1"></div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full" onClick={() => setIsExpanded(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 relative">
              <MapComponent />
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
