"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

export function MarketPulseWidget() {
  return (
    <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-zinc-400 flex items-center">
          <Activity className="w-4 h-4 mr-2 text-cyan-400" />
          Market Pulse
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div className="flex flex-col">
            <span className="text-xs text-zinc-500">URA Property Index</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xl font-bold text-zinc-100">182.4</span>
              <span className="flex items-center text-xs text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">
                <TrendingUp className="w-3 h-3 mr-1" />
                1.2%
              </span>
            </div>
          </div>
          
          <div className="flex flex-col">
            <span className="text-xs text-zinc-500">Avg Rental Yield</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xl font-bold text-zinc-100">4.1%</span>
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
