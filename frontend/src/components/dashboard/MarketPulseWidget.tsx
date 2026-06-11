"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

export function MarketPulseWidget() {
  return (
    <Card className="glass-panel h-full flex flex-col border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
          <Activity className="w-4 h-4 mr-2 text-cyan-400" />
          Market Pulse
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">URA Property Index</span>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-xl font-bold text-foreground">182.4</span>
              <span className="flex items-center text-xs text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">
                <TrendingUp className="w-3 h-3 mr-1" />
                1.2%
              </span>
            </div>
          </div>
          
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Avg Rental Yield</span>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-xl font-bold text-foreground">4.1%</span>
              <span className="flex items-center text-xs text-rose-400 bg-rose-400/10 px-1.5 py-0.5 rounded">
                <TrendingDown className="w-3 h-3 mr-1" />
                0.3%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
