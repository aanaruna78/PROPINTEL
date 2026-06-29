"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  TrendingUp, Flame, MapPin, ArrowLeft, Loader2, Sparkles,
  Search, Activity, BarChart2, Zap, Users, DollarSign
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, LineChart, Line
} from "recharts";

// Dynamically import map (SSR-disabled)
const AnalyticsMapPanel = dynamic(() => import("@/components/dashboard/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[320px] bg-muted/20 rounded-xl border border-border/50 flex flex-col items-center justify-center text-muted-foreground animate-pulse">
      <MapPin className="w-6 h-6 mb-2 opacity-20" />
      <span className="text-xs font-semibold">Loading Intelligence Map...</span>
    </div>
  ),
});

interface DistrictStats {
  district: string;
  name: string;
  coords: number[];
  month: string;
  avg_price_psf: number;
  price_movement_percent: number;
  rental_pressure: number;
  buyer_activity: number;
  demand_index: number;
  transaction_count: number;
}

interface DistrictTrend {
  month: string;
  avg_price_psf: number;
  price_movement_percent: number;
  rental_pressure: number;
  buyer_activity: number;
  demand_index: number;
  transaction_count: number;
}

type SortKey = "demand_index" | "avg_price_psf" | "price_movement_percent" | "transaction_count";
type MetricTab = "price" | "demand" | "rental" | "buyer";

const METRIC_TABS: { key: MetricTab; label: string; icon: React.ReactNode; color: string }[] = [
  { key: "demand", label: "Demand Index", icon: <Sparkles className="w-3.5 h-3.5" />, color: "#6366f1" },
  { key: "price", label: "Price PSF", icon: <DollarSign className="w-3.5 h-3.5" />, color: "#10b981" },
  { key: "rental", label: "Rental Pressure", icon: <Flame className="w-3.5 h-3.5" />, color: "#22d3ee" },
  { key: "buyer", label: "Buyer Activity", icon: <Users className="w-3.5 h-3.5" />, color: "#f43f5e" },
];

const PERIOD_OPTIONS = [
  { label: "1M", months: 1 },
  { label: "3M", months: 3 },
  { label: "6M", months: 6 },
  { label: "All", months: 7 },
];

function DemandBadge({ score }: { score: number }) {
  const cls =
    score >= 8
      ? "bg-violet-500/15 text-violet-400 border border-violet-500/30"
      : score >= 6
      ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
      : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20";
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${cls}`}>
      {score}
    </span>
  );
}

export default function DistrictAnalyticsPage() {
  const { token, refreshSession } = useAuth();

  const [districts, setDistricts] = useState<DistrictStats[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>("D01");
  const [trends, setTrends] = useState<DistrictTrend[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiPoweredBy, setAiPoweredBy] = useState<string>("template");
  const [loadingAi, setLoadingAi] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("demand_index");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [activeMetric, setActiveMetric] = useState<MetricTab>("demand");
  const [periodMonths, setPeriodMonths] = useState(7);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchTrends = useCallback(async (authToken: string, districtCode: string) => {
    setLoadingTrends(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/analytics/districts/${districtCode}/trends`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) setTrends(await res.json());
    } catch (err) {
      console.error(`Failed to fetch trends for ${districtCode}:`, err);
    } finally {
      setLoadingTrends(false);
    }
  }, [API_URL]);

  const fetchAiSummary = useCallback(async (authToken: string, districtCode: string) => {
    setLoadingAi(true);
    setAiSummary(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/analytics/districts/${districtCode}/ai-summary`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAiSummary(data.summary);
        setAiPoweredBy(data.powered_by);
      }
    } catch (err) {
      console.error(`Failed to fetch AI summary for ${districtCode}:`, err);
    } finally {
      setLoadingAi(false);
    }
  }, [API_URL]);

  const fetchDistricts = useCallback(async (authToken: string) => {
    try {
      const res = await fetch(`${API_URL}/api/v1/analytics/districts`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDistricts(data);
        if (data.length > 0) {
          setSelectedDistrict(data[0].district);
          fetchTrends(authToken, data[0].district);
          fetchAiSummary(authToken, data[0].district);
        }
      }
    } catch (err) {
      console.error("Failed to fetch districts:", err);
    } finally {
      setLoadingList(false);
    }
  }, [API_URL, fetchTrends]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      setLoadingList(true);
      let activeToken = token;
      try {
        const res = await fetch(`${API_URL}/api/v1/analytics/districts`, {
          headers: { Authorization: `Bearer ${activeToken}` },
        });
        if (res.status === 401) {
          const newToken = await refreshSession();
          if (newToken) activeToken = newToken;
        }
        await fetchDistricts(activeToken);
      } catch {
        setLoadingList(false);
      }
    })();
  }, [token]);

  const handleDistrictSelect = (code: string) => {
    setSelectedDistrict(code);
    if (token) {
      fetchTrends(token, code);
      fetchAiSummary(token, code);
    }
  };

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else { setSortBy(key); setSortOrder("desc"); }
  };

  const formatPrice = (p: number) =>
    new Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD", maximumFractionDigits: 0 }).format(p) + " psf";

  const filteredDistricts = districts
    .filter(d =>
      d.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const va = a[sortBy], vb = b[sortBy];
      return sortOrder === "asc" ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });

  const top5 = [...districts].sort((a, b) => b.demand_index - a.demand_index).slice(0, 5);
  const selectedDistStats = districts.find(d => d.district === selectedDistrict);
  const filteredTrends = trends.slice(-periodMonths);

  // Chart config per metric
  const metricConfig = {
    demand: { dataKey: "demand_index", name: "Demand Index", stroke: "#6366f1", yDomain: [0, 10] as [number, number] },
    price: { dataKey: "avg_price_psf", name: "Avg Price PSF", stroke: "#10b981", yDomain: ["dataMin - 100", "dataMax + 100"] as [string, string] },
    rental: { dataKey: "rental_pressure", name: "Rental Pressure", stroke: "#22d3ee", yDomain: [0, 10] as [number, number] },
    buyer: { dataKey: "buyer_activity", name: "Buyer Activity", stroke: "#f43f5e", yDomain: [0, 10] as [number, number] },
  }[activeMetric];

  if (loadingList) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse font-semibold">Running District Analytics Engine...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 hover:bg-card border border-transparent hover:border-border rounded-lg transition-all">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary" />
              District Demand Analytics
            </h1>
            <p className="text-muted-foreground text-xs font-semibold">Pre-aggregated transaction trends, buyer searches, and rental yield signals</p>
          </div>
        </div>

        {/* Metric Tabs */}
        <div className="flex gap-1 bg-card/60 border border-border/60 rounded-xl p-1">
          {METRIC_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveMetric(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                activeMetric === tab.key
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Top-5 Hot Districts Leaderboard */}
      <div className="bg-card/30 border border-border/60 rounded-2xl p-4">
        <h2 className="text-xs font-black text-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          Top 5 Hottest Districts
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {top5.map((d, i) => (
            <button
              key={d.district}
              onClick={() => handleDistrictSelect(d.district)}
              className={`flex flex-col gap-1 p-3 rounded-xl border transition-all text-left ${
                selectedDistrict === d.district
                  ? "bg-primary/10 border-primary/40"
                  : "bg-card/40 border-border/50 hover:border-primary/30 hover:bg-card/70"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-muted-foreground">#{i + 1}</span>
                <DemandBadge score={d.demand_index} />
              </div>
              <span className="text-xs font-black text-foreground">{d.district}</span>
              <span className="text-[9px] text-muted-foreground truncate">{d.name.split(" / ")[0]}</span>
              {/* Mini demand bar */}
              <div className="w-full h-1 bg-muted/40 rounded-full mt-1">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                  style={{ width: `${(d.demand_index / 10) * 100}%` }}
                />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

        {/* Left: Districts List */}
        <div className="lg:col-span-4 bg-card/40 border border-border/60 rounded-2xl p-4 shadow-sm flex flex-col gap-3 max-h-[700px] overflow-hidden">
          {/* Search */}
          <div className="relative shrink-0">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search district or region..."
              className="w-full bg-background/50 border border-border/60 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
            />
          </div>

          {/* Sort Header */}
          <div className="grid grid-cols-12 gap-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-1 border-b border-border/40 shrink-0">
            <span className="col-span-4">District</span>
            <button onClick={() => toggleSort("demand_index")} className="col-span-3 text-right hover:text-foreground">
              Demand {sortBy === "demand_index" && (sortOrder === "asc" ? "▲" : "▼")}
            </button>
            <button onClick={() => toggleSort("avg_price_psf")} className="col-span-3 text-right hover:text-foreground">
              PSF {sortBy === "avg_price_psf" && (sortOrder === "asc" ? "▲" : "▼")}
            </button>
            <button onClick={() => toggleSort("price_movement_percent")} className="col-span-2 text-right hover:text-foreground">
              MoM {sortBy === "price_movement_percent" && (sortOrder === "asc" ? "▲" : "▼")}
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto space-y-0.5 pr-1">
            {filteredDistricts.map(d => (
              <button
                key={d.district}
                onClick={() => handleDistrictSelect(d.district)}
                className={`w-full grid grid-cols-12 gap-1 items-center px-2 py-2.5 rounded-xl border text-xs text-left transition-all ${
                  selectedDistrict === d.district
                    ? "bg-primary/10 border-primary/30 text-foreground font-bold"
                    : "bg-transparent border-transparent hover:bg-muted/30 text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="col-span-4 flex flex-col">
                  <span className="font-bold text-foreground">{d.district}</span>
                  <span className="text-[9px] text-muted-foreground truncate max-w-[70px]">{d.name.split(" / ")[0]}</span>
                </div>
                <div className="col-span-3 text-right">
                  <DemandBadge score={d.demand_index} />
                </div>
                <div className="col-span-3 text-right font-bold text-foreground">{Math.round(d.avg_price_psf)}</div>
                <div className={`col-span-2 text-right font-bold text-[10px] ${d.price_movement_percent >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {d.price_movement_percent >= 0 ? "+" : ""}{d.price_movement_percent.toFixed(1)}%
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Detail Panel */}
        <div className="lg:col-span-8 flex flex-col gap-4">

          {/* Selected District Header */}
          {selectedDistStats && (
            <>
              <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm flex justify-between items-start gap-4 shrink-0">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-primary/15 border border-primary/25 text-primary text-xs font-black px-2 py-0.5 rounded-md">{selectedDistStats.district}</span>
                    <h2 className="text-base font-bold text-foreground">{selectedDistStats.name}</h2>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground/60" />
                    [{selectedDistStats.coords.map(c => c.toFixed(4)).join(", ")}] · Data as of {selectedDistStats.month}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Demand Score</span>
                  <span className="text-2xl font-black text-primary">{selectedDistStats.demand_index}/10</span>
                </div>
              </div>

              {/* 4 Metric Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
                {[
                  { label: "Avg Price PSF", value: formatPrice(selectedDistStats.avg_price_psf), color: "text-foreground" },
                  {
                    label: "Price Growth MoM",
                    value: `${selectedDistStats.price_movement_percent >= 0 ? "+" : ""}${selectedDistStats.price_movement_percent.toFixed(2)}%`,
                    color: selectedDistStats.price_movement_percent >= 0 ? "text-emerald-400" : "text-rose-400",
                  },
                  { label: "Rental Pressure", value: `${selectedDistStats.rental_pressure}/10`, color: "text-foreground" },
                  { label: "Buyer Activity", value: `${selectedDistStats.buyer_activity}/10`, color: "text-foreground" },
                ].map(card => (
                  <div key={card.label} className="bg-card border border-border/80 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">{card.label}</span>
                    <span className={`text-lg font-black mt-1.5 block ${card.color}`}>{card.value}</span>
                  </div>
                ))}
              </div>

              {/* AI Market Summary */}
              <div className="bg-card/60 border border-primary/15 rounded-2xl p-4 shadow-sm shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    AI Market Summary
                  </h3>
                  <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                    {aiPoweredBy === "openai/gpt-4o-mini" ? "✦ GPT-4o mini" : "✦ Smart Template"}
                  </span>
                </div>
                {loadingAi ? (
                  <div className="flex items-center gap-2">
                    <div className="h-3 bg-muted/30 rounded animate-pulse flex-1" />
                    <div className="h-3 bg-muted/20 rounded animate-pulse w-2/3" />
                  </div>
                ) : aiSummary ? (
                  <p className="text-xs text-muted-foreground leading-relaxed">{aiSummary}</p>
                ) : (
                  <p className="text-xs text-muted-foreground/50 italic">Summary unavailable.</p>
                )}
              </div>

              {/* Trend Charts */}
              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex-1 flex flex-col gap-5 min-h-[400px]">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <BarChart2 className="w-4 h-4 text-primary" />
                    {METRIC_TABS.find(t => t.key === activeMetric)?.label} · Historical Trend
                  </h3>
                  {/* Period Selector */}
                  <div className="flex gap-1 bg-muted/40 rounded-lg p-0.5">
                    {PERIOD_OPTIONS.map(p => (
                      <button
                        key={p.label}
                        onClick={() => setPeriodMonths(p.months)}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                          periodMonths === p.months
                            ? "bg-card text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {loadingTrends ? (
                  <div className="flex-1 flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Loading charts...</span>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col gap-5">
                    {/* Primary Metric Chart (Area) */}
                    <div className="flex-1 min-h-[190px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={filteredTrends} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={metricConfig.stroke} stopOpacity={0.25} />
                              <stop offset="95%" stopColor={metricConfig.stroke} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                          <XAxis dataKey="month" tick={{ fill: "#71717a", fontSize: 10 }} />
                          <YAxis domain={metricConfig.yDomain as any} tick={{ fill: "#71717a", fontSize: 10 }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "8px", fontSize: 11 }}
                            itemStyle={{ color: "#ffffff" }}
                            labelStyle={{ color: "#71717a", fontWeight: "bold" }}
                          />
                          <Area type="monotone" dataKey={metricConfig.dataKey} name={metricConfig.name} stroke={metricConfig.stroke} strokeWidth={2.5} fillOpacity={1} fill="url(#metricGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Composite Index Comparison */}
                    <div className="flex-1 min-h-[180px] border-t border-border/40 pt-5">
                      <h4 className="text-[10px] font-bold text-muted-foreground mb-3 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        Composite Comparison: Demand · Rental · Buyer Activity
                      </h4>
                      <ResponsiveContainer width="100%" height={150}>
                        <LineChart data={filteredTrends} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                          <XAxis dataKey="month" tick={{ fill: "#71717a", fontSize: 10 }} />
                          <YAxis domain={[0, 10]} tick={{ fill: "#71717a", fontSize: 10 }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "8px", fontSize: 11 }}
                            itemStyle={{ color: "#ffffff" }}
                            labelStyle={{ color: "#71717a", fontWeight: "bold" }}
                          />
                          <Legend wrapperStyle={{ fontSize: 10, fill: "#71717a" }} />
                          <Line type="monotone" dataKey="demand_index" name="Demand Index" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="rental_pressure" name="Rental Pressure" stroke="#22d3ee" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                          <Line type="monotone" dataKey="buyer_activity" name="Buyer Activity" stroke="#f43f5e" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>

              {/* Inline Map Panel */}
              <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm shrink-0 h-[300px]">
                <div className="px-4 py-3 border-b border-border/40 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-foreground">Singapore District Demand Heatmap</span>
                  <span className="ml-auto flex items-center gap-2 text-[9px] text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" /> Rising
                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Dropping
                    <span className="w-2 h-2 rounded-full bg-zinc-500 inline-block" /> Stable
                  </span>
                </div>
                <div className="h-[256px]">
                  <AnalyticsMapPanel />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
