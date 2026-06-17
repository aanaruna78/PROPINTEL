"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, ArrowRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

interface DistrictStat {
  district: string;
  name: string;
  demand_index: number;
  rental_pressure: number;
  buyer_activity: number;
  price_movement_percent: number;
  avg_price_psf: number;
}

function DemandBar({ value, max = 10 }: { value: number; max?: number }) {
  const pct = Math.min((value / max) * 100, 100);
  const color =
    value >= 8
      ? "from-violet-500 to-indigo-500"
      : value >= 6
      ? "from-amber-500 to-orange-500"
      : "from-zinc-500 to-zinc-600";

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 bg-muted/40 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] font-black text-foreground w-6 text-right tabular-nums">
        {value}
      </span>
    </div>
  );
}

function MovementBadge({ pct }: { pct: number }) {
  if (pct > 0.1) {
    return (
      <span className="flex items-center gap-0.5 text-[9px] font-bold text-emerald-400">
        <TrendingUp className="w-2.5 h-2.5" />
        +{pct.toFixed(2)}%
      </span>
    );
  }
  if (pct < -0.1) {
    return (
      <span className="flex items-center gap-0.5 text-[9px] font-bold text-rose-400">
        <TrendingDown className="w-2.5 h-2.5" />
        {pct.toFixed(2)}%
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 text-[9px] font-bold text-zinc-400">
      <Minus className="w-2.5 h-2.5" />
      Stable
    </span>
  );
}

export function DistrictAnalyticsEngineWidget() {
  const { token } = useAuth();
  const [topDistricts, setTopDistricts] = useState<DistrictStat[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    if (!token) return;
    const fetchTop = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/v1/analytics/districts/top/demand_index?n=3`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          setTopDistricts(await res.json());
        }
      } catch (err) {
        console.error("Failed to fetch top districts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTop();
  }, [token]);

  const tierLabel = (score: number) =>
    score >= 8 ? "🔥 Hot" : score >= 6 ? "⚡ Warm" : "— Stable";

  return (
    <Card className="glass-panel h-full min-h-[300px] flex flex-col w-full rounded-xl border-0 shadow-sm">
      <CardHeader className="pb-2 flex flex-row items-center justify-between shrink-0">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          District Demand Engine
        </CardTitle>
        <Link
          href="/districts"
          className="flex items-center gap-1 text-[10px] font-bold text-primary/70 hover:text-primary transition-colors group"
        >
          View All
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-3 pt-1">
        {loading ? (
          <div className="flex-1 flex flex-col gap-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-muted/20 rounded-lg" />
            ))}
          </div>
        ) : topDistricts.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
            No data available
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 flex-1">
            {topDistricts.map((d, idx) => (
              <Link
                key={d.district}
                href="/districts"
                className="group flex flex-col gap-1.5 rounded-xl border border-border/50 bg-card/40 hover:bg-card/80 hover:border-primary/30 px-3 py-2.5 transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-muted-foreground w-4">
                      #{idx + 1}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-foreground leading-tight">
                        {d.district}
                      </span>
                      <span className="text-[9px] text-muted-foreground leading-tight truncate max-w-[100px]">
                        {d.name.split(" / ")[0]}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-[10px] font-bold text-muted-foreground">
                      {tierLabel(d.demand_index)}
                    </span>
                    <MovementBadge pct={d.price_movement_percent} />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-muted-foreground font-semibold">
                      Demand Index
                    </span>
                  </div>
                  <DemandBar value={d.demand_index} />
                </div>
              </Link>
            ))}

            {/* Footer row with aggregate stats */}
            <div className="mt-auto pt-2 border-t border-border/40 grid grid-cols-2 gap-2 text-center">
              <div>
                <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider block">
                  Rental Pressure
                </span>
                <span className="text-xs font-black text-foreground">
                  {topDistricts[0]
                    ? `${topDistricts[0].rental_pressure}/10`
                    : "—"}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider block">
                  Buyer Activity
                </span>
                <span className="text-xs font-black text-foreground">
                  {topDistricts[0]
                    ? `${topDistricts[0].buyer_activity}/10`
                    : "—"}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
