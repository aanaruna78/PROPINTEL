"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Lightbulb, ArrowRight, TrendingDown, Flame,
  AlertTriangle, TrendingUp, Zap, Loader2
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

interface OpportunityAlert {
  type: string;
  district: string;
  district_name: string;
  severity: "high" | "medium" | "low";
  message: string;
  metric: number;
}

const ALERT_CONFIG: Record<string, {
  icon: React.ReactNode;
  label: string;
  severityColor: Record<string, string>;
}> = {
  price_dip: {
    icon: <TrendingDown className="w-3.5 h-3.5 shrink-0" />,
    label: "Price Dip",
    severityColor: {
      high: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
      medium: "text-emerald-300 bg-emerald-500/5 border-emerald-500/15",
      low: "text-emerald-200 bg-emerald-500/5 border-emerald-500/10",
    },
  },
  hot_streak: {
    icon: <Flame className="w-3.5 h-3.5 shrink-0" />,
    label: "Hot Streak",
    severityColor: {
      high: "text-orange-400 bg-orange-500/10 border-orange-500/25",
      medium: "text-orange-300 bg-orange-500/5 border-orange-500/15",
      low: "text-orange-200 bg-orange-500/5 border-orange-500/10",
    },
  },
  rental_surge: {
    icon: <Zap className="w-3.5 h-3.5 shrink-0" />,
    label: "Rental Surge",
    severityColor: {
      high: "text-cyan-400 bg-cyan-500/10 border-cyan-500/25",
      medium: "text-cyan-300 bg-cyan-500/5 border-cyan-500/15",
      low: "text-cyan-200 bg-cyan-500/5 border-cyan-500/10",
    },
  },
  cooling_warning: {
    icon: <AlertTriangle className="w-3.5 h-3.5 shrink-0" />,
    label: "Cooling",
    severityColor: {
      high: "text-rose-400 bg-rose-500/10 border-rose-500/25",
      medium: "text-amber-400 bg-amber-500/10 border-amber-500/25",
      low: "text-amber-300 bg-amber-500/5 border-amber-500/15",
    },
  },
  high_demand: {
    icon: <TrendingUp className="w-3.5 h-3.5 shrink-0" />,
    label: "High Demand",
    severityColor: {
      high: "text-violet-400 bg-violet-500/10 border-violet-500/25",
      medium: "text-violet-300 bg-violet-500/5 border-violet-500/15",
      low: "text-violet-200 bg-violet-500/5 border-violet-500/10",
    },
  },
};

const SEVERITY_DOT: Record<string, string> = {
  high: "bg-rose-400",
  medium: "bg-amber-400",
  low: "bg-blue-400",
};

export function InsightsWidget() {
  const { token } = useAuth();
  const [alerts, setAlerts] = useState<OpportunityAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    if (!token) return;
    const fetchAlerts = async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/analytics/alerts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setAlerts(await res.json());
      } catch (err) {
        console.error("Failed to fetch opportunity alerts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, [token]);

  return (
    <Card className="glass-panel h-full flex flex-col border-0 shadow-sm overflow-hidden">
      <CardHeader className="pb-2 shrink-0">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-400" />
            Opportunity Alerts
          </span>
          {!loading && alerts.length > 0 && (
            <span className="text-[9px] font-bold bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded-full">
              {alerts.length} active
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 py-6">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
              Scanning market...
            </span>
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 py-6 px-4 text-center">
            <Lightbulb className="w-6 h-6 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">
              No active alerts for your role right now. Check back soon.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-full px-4 pb-4">
            <div className="flex flex-col gap-2.5 mt-1">
              {alerts.map((alert, idx) => {
                const cfg = ALERT_CONFIG[alert.type] ?? ALERT_CONFIG.hot_streak;
                const colorClass = cfg.severityColor[alert.severity] ?? cfg.severityColor.medium;
                return (
                  <Link
                    key={idx}
                    href="/districts"
                    className={`group flex flex-col gap-2 p-3 rounded-xl border transition-all duration-200 hover:scale-[1.01] ${colorClass}`}
                  >
                    {/* Header row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {cfg.icon}
                        <span className="text-[10px] font-black uppercase tracking-wider">
                          {cfg.label}
                        </span>
                        <span className="text-[10px] font-bold opacity-70">
                          · {alert.district}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${SEVERITY_DOT[alert.severity]}`} />
                        <span className="text-[9px] font-bold uppercase tracking-wider opacity-70">
                          {alert.severity}
                        </span>
                      </div>
                    </div>

                    {/* Message */}
                    <p className="text-[11px] leading-relaxed font-medium opacity-90">
                      {alert.message}
                    </p>

                    {/* CTA */}
                    <div className="flex items-center gap-1 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      View District <ArrowRight className="w-3 h-3" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
