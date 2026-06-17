"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp, TrendingDown, Activity, ArrowUpRight,
  ArrowDownRight, Minus, Zap
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface TopMover {
  district: string;
  name: string;
  price_movement_percent: number;
  demand_index: number;
}

interface MarketPulse {
  ura_property_index: number;
  ura_index_change: number;
  avg_rental_yield: number;
  rental_yield_change: number;
  rising_count: number;
  cooling_count: number;
  stable_count: number;
  total_districts: number;
  top_mover: TopMover | null;
  market_momentum: "bullish" | "neutral" | "bearish";
}

const MOMENTUM_CONFIG = {
  bullish: {
    label: "Bullish",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    icon: <TrendingUp className="w-3 h-3" />,
  },
  neutral: {
    label: "Neutral",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    icon: <Minus className="w-3 h-3" />,
  },
  bearish: {
    label: "Bearish",
    color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/20",
    icon: <TrendingDown className="w-3 h-3" />,
  },
};

export function MarketPulseWidget() {
  const { token } = useAuth();
  const [pulse, setPulse] = useState<MarketPulse | null>(null);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    if (!token) return;
    const fetch_pulse = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/analytics/market-pulse`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setPulse(await res.json());
      } catch (err) {
        console.error("Failed to fetch market pulse:", err);
      } finally {
        setLoading(false);
      }
    };
    fetch_pulse();
  }, [token]);

  const momentum = pulse ? MOMENTUM_CONFIG[pulse.market_momentum] : null;

  return (
    <Card className="glass-panel h-full flex flex-col border-0 shadow-sm overflow-hidden">
      <CardHeader className="pb-2 shrink-0">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            Market Pulse
          </span>
          {/* Live indicator */}
          <span className="flex items-center gap-1 text-[9px] font-bold text-cyan-400 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Live
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-3 pt-0">
        {loading ? (
          <div className="flex-1 flex flex-col gap-3 animate-pulse">
            <div className="h-10 bg-muted/20 rounded-lg" />
            <div className="h-10 bg-muted/20 rounded-lg" />
            <div className="h-6 bg-muted/10 rounded-lg" />
          </div>
        ) : pulse ? (
          <>
            {/* URA Property Index */}
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                URA Property Index
              </span>
              <div className="flex items-end gap-2">
                <span className="text-xl font-black text-foreground tabular-nums">
                  {pulse.ura_property_index.toFixed(1)}
                </span>
                <span
                  className={`flex items-center gap-0.5 text-[11px] font-bold mb-0.5 ${
                    pulse.ura_index_change >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {pulse.ura_index_change >= 0 ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  {pulse.ura_index_change >= 0 ? "+" : ""}
                  {pulse.ura_index_change.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Rental Yield */}
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                Avg Rental Yield
              </span>
              <div className="flex items-end gap-2">
                <span className="text-xl font-black text-foreground tabular-nums">
                  {pulse.avg_rental_yield.toFixed(1)}%
                </span>
                <span
                  className={`flex items-center gap-0.5 text-[11px] font-bold mb-0.5 ${
                    pulse.rental_yield_change >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {pulse.rental_yield_change >= 0 ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  {pulse.rental_yield_change >= 0 ? "+" : ""}
                  {pulse.rental_yield_change.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Momentum badge */}
            {momentum && (
              <div
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border ${momentum.bg}`}
              >
                <span className={`flex items-center gap-1.5 text-[11px] font-bold ${momentum.color}`}>
                  {momentum.icon}
                  {momentum.label} Market
                </span>
                <span className="text-[10px] text-muted-foreground font-semibold">
                  <span className="text-emerald-400 font-bold">{pulse.rising_count}↑</span>
                  {" / "}
                  <span className="text-rose-400 font-bold">{pulse.cooling_count}↓</span>
                  {" of "}
                  {pulse.total_districts} districts
                </span>
              </div>
            )}

            {/* Top Mover */}
            {pulse.top_mover && (
              <div className="mt-auto pt-2 border-t border-border/40">
                <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  Top Mover
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-foreground">
                      {pulse.top_mover.district}
                    </span>
                    <span className="text-[9px] text-muted-foreground truncate max-w-[90px]">
                      {pulse.top_mover.name}
                    </span>
                  </div>
                  <span className="text-xs font-black text-emerald-400">
                    +{pulse.top_mover.price_movement_percent.toFixed(2)}%
                  </span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
            Data unavailable
          </div>
        )}
      </CardContent>
    </Card>
  );
}
