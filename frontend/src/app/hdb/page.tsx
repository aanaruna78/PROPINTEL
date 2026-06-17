"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  TrendingUp, Percent, Flame, Clock, 
  MapPin, HelpCircle, ArrowLeft, Loader2, Landmark
} from "lucide-react";
import Link from "next/link";

interface TrendPoint {
  quarter: string;
  avg_price: number;
  avg_psf: number;
  volume: number;
}

interface RentalAnalysis {
  avg_rent: number;
  active_listings: number;
  rental_yield: number;
  rental_pressure: number;
}

interface LiquidityScore {
  liquidity_score: number;
  rating: string;
  avg_days_on_market: number;
  turnover_rate: number;
}

interface MarketData {
  town: string;
  flat_type: string;
  resale_trends: TrendPoint[];
  rental_analysis: RentalAnalysis;
  liquidity: LiquidityScore;
}

export default function HdbIntelligencePage() {
  const { token, refreshSession } = useAuth();
  
  const [towns, setTowns] = useState<string[]>([]);
  const [flatTypes, setFlatTypes] = useState<string[]>([]);
  
  const [selectedTown, setSelectedTown] = useState("Tampines");
  const [selectedFlatType, setSelectedFlatType] = useState("4-Room");
  
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [customPrice, setCustomPrice] = useState<string>("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Fetch Towns and Flat Types list
  const initializeSelectors = async (authToken: string) => {
    try {
      const [townsRes, typesRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/hdb/towns`, {
          headers: { Authorization: `Bearer ${authToken}` }
        }),
        fetch(`${API_URL}/api/v1/hdb/flat-types`, {
          headers: { Authorization: `Bearer ${authToken}` }
        })
      ]);
      
      if (townsRes.ok && typesRes.ok) {
        const townsData = await townsRes.json();
        const typesData = await typesRes.json();
        setTowns(townsData);
        setFlatTypes(typesData);
      }
    } catch (err) {
      console.error("Failed to load HDB selector options:", err);
    }
  };

  // Fetch Market Data details
  const fetchMarketData = async (authToken: string, town: string, type: string) => {
    setLoadingData(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/hdb/market-intelligence?town=${town}&flat_type=${type}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMarketData(data);
        // Default custom yield calculator price to the latest Q4 average price
        if (data.resale_trends && data.resale_trends.length > 0) {
          setCustomPrice(data.resale_trends[data.resale_trends.length - 1].avg_price.toString());
        }
      }
    } catch (err) {
      console.error("Failed to load HDB market statistics:", err);
    } finally {
      setLoadingData(false);
    }
  };

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      let activeToken = token;
      
      // Check validation session
      const res = await fetch(`${API_URL}/api/v1/hdb/towns`, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      
      if (res.status === 401) {
        const newToken = await refreshSession();
        if (newToken) {
          activeToken = newToken;
        }
      }
      
      await initializeSelectors(activeToken);
      await fetchMarketData(activeToken, selectedTown, selectedFlatType);
    } catch (err) {
      console.error("Failed to initialize HDB dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  // Handle updates when selectors change
  const handleQueryUpdate = async (newTown: string, newType: string) => {
    if (!token) return;
    let activeToken = token;
    await fetchMarketData(activeToken, newTown, newType);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-SG", {
      style: "currency",
      currency: "SGD",
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatPSF = (psf: number) => {
    return new Intl.NumberFormat("en-SG", {
      style: "currency",
      currency: "SGD",
      maximumFractionDigits: 0
    }).format(psf) + " psf";
  };

  // Custom Yield Calculation Math
  const getCustomYield = () => {
    if (!marketData || !customPrice) return 0;
    const priceNum = parseFloat(customPrice);
    if (isNaN(priceNum) || priceNum <= 0) return 0;
    const annualRent = marketData.rental_analysis.avg_rent * 12;
    return round((annualRent / priceNum) * 100, 2);
  };

  const round = (val: number, precision: number) => {
    const multiplier = Math.pow(10, precision);
    return Math.round(val * multiplier) / multiplier;
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse font-semibold">Analyzing Singapore HDB Market...</p>
      </div>
    );
  }

  const latestTrend = marketData?.resale_trends?.[marketData.resale_trends.length - 1];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 hover:bg-muted border border-transparent hover:border-border rounded-lg transition-all">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
              <Landmark className="w-6 h-6 text-primary" />
              HDB Market Intelligence
            </h1>
            <p className="text-muted-foreground text-xs font-semibold">Resale trends, rental analysis, and transaction speed scores</p>
          </div>
        </div>

        {/* Dynamic Filters */}
        <div className="flex items-center gap-2">
          <select 
            value={selectedTown} 
            onChange={(e) => {
              setSelectedTown(e.target.value);
              handleQueryUpdate(e.target.value, selectedFlatType);
            }}
            disabled={loadingData}
            className="bg-card border border-border rounded-lg px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-sm"
          >
            {towns.map((town) => (
              <option key={town} value={town}>{town}</option>
            ))}
          </select>

          <select 
            value={selectedFlatType} 
            onChange={(e) => {
              setSelectedFlatType(e.target.value);
              handleQueryUpdate(selectedTown, e.target.value);
            }}
            disabled={loadingData}
            className="bg-card border border-border rounded-lg px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-sm"
          >
            {flatTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {loadingData && (
        <div className="py-2 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 text-primary animate-spin" />
          <span className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase">Loading stats...</span>
        </div>
      )}

      {marketData && (
        <div className="space-y-6">
          {/* KPI Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Average Resale Price</span>
              <span className="text-xl font-black text-foreground mt-1 block">
                {latestTrend ? formatPrice(latestTrend.avg_price) : "-"}
              </span>
              <span className="text-[10px] font-bold text-emerald-400 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                +3.5% vs Q1 2025
              </span>
            </div>

            <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Average Unit PSF</span>
              <span className="text-xl font-black text-foreground mt-1 block">
                {latestTrend ? formatPSF(latestTrend.avg_psf) : "-"}
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold mt-1 block">
                Estimated Area: {selectedFlatType === "3-Room" ? "700" : (selectedFlatType === "4-Room" ? "1,000" : (selectedFlatType === "5-Room" ? "1,200" : "1,400"))} sqft
              </span>
            </div>

            <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Average Monthly Rent</span>
              <span className="text-xl font-black text-foreground mt-1 block">
                {formatPrice(marketData.rental_analysis.avg_rent)}/mo
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold mt-1 block">
                Active Listings: {marketData.rental_analysis.active_listings} in town
              </span>
            </div>

            <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Estimated Rental Yield</span>
              <span className="text-xl font-black text-primary mt-1 block">
                {marketData.rental_analysis.rental_yield}%
              </span>
              <span className="text-[10px] font-bold text-primary mt-1 flex items-center gap-1">
                <Percent className="w-3.5 h-3.5" />
                High Yield compared to Condo Avg (4.2%)
              </span>
            </div>
          </div>

          {/* Primary Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Resale Trends table */}
            <div className="lg:col-span-7 bg-card border border-border rounded-xl p-6 shadow-sm overflow-hidden flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Historical Resale Price Trends
                </h2>
                <p className="text-[10px] text-muted-foreground mb-4 font-medium">
                  Quarterly average transaction price movement for {selectedFlatType} flats in {selectedTown}
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground font-bold">
                        <th className="py-2.5 px-3">Quarter</th>
                        <th className="py-2.5 px-3 text-right">Avg Price</th>
                        <th className="py-2.5 px-3 text-right">Avg PSF</th>
                        <th className="py-2.5 px-3 text-right">Volume</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {marketData.resale_trends.map((pt) => (
                        <tr key={pt.quarter} className="hover:bg-muted/10 transition-colors">
                          <td className="py-3 px-3 font-semibold text-foreground">{pt.quarter}</td>
                          <td className="py-3 px-3 text-right font-bold text-foreground">{formatPrice(pt.avg_price)}</td>
                          <td className="py-3 px-3 text-right font-medium text-muted-foreground">{formatPSF(pt.avg_psf)}</td>
                          <td className="py-3 px-3 text-right text-foreground font-bold">{pt.volume} sales</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Dynamic Trend Indicator Chart simulation */}
              <div className="mt-6 pt-4 border-t border-border/80 flex items-center gap-6">
                <div>
                  <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block">CAGR (4 Quarters)</span>
                  <span className="text-xs font-black text-emerald-400 block">+3.63% appreciation</span>
                </div>
                <div>
                  <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider block">Demand Rating</span>
                  <span className="text-xs font-black text-foreground block">Healthy Market Momentum</span>
                </div>
              </div>
            </div>

            {/* Right: Liquidity Scorecard + Yield Optimizer */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Liquidity Score Card */}
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <h2 className="text-sm font-bold text-foreground mb-1.5 flex items-center gap-2">
                  <Flame className="w-4.5 h-4.5 text-orange-500 animate-pulse" />
                  Market Liquidity Score
                </h2>
                <p className="text-[10px] text-muted-foreground mb-5 font-medium">
                  Evaluates demand speed and transaction velocity relative to town flat stock
                </p>

                <div className="flex items-center gap-5 mb-5 bg-muted/20 border border-border/60 rounded-xl p-4">
                  {/* Gauge representation */}
                  <div className="relative w-16 h-16 flex items-center justify-center rounded-full bg-background border border-border shadow-sm">
                    <span className="text-lg font-black text-foreground">{marketData.liquidity.liquidity_score}</span>
                  </div>
                  <div>
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      marketData.liquidity.rating === "High" 
                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                        : (marketData.liquidity.rating === "Moderate" ? "bg-amber-500/10 border border-amber-500/20 text-amber-400" : "bg-red-500/10 border border-red-500/20 text-red-400")
                    }`}>
                      {marketData.liquidity.rating} Liquidity
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-1.5 font-medium leading-relaxed">
                      Flats in this town sell faster than the national HDB averages.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/10 border border-border/40 rounded-lg p-3">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Avg Days on Market</span>
                    <span className="text-sm font-black text-foreground mt-0.5 block flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-primary" />
                      {marketData.liquidity.avg_days_on_market} Days
                    </span>
                  </div>

                  <div className="bg-muted/10 border border-border/40 rounded-lg p-3">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Town Turnover Rate</span>
                    <span className="text-sm font-black text-foreground mt-0.5 block">
                      {marketData.liquidity.turnover_rate}% / year
                    </span>
                  </div>
                </div>
              </div>

              {/* Yield Optimizer Tool */}
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <h2 className="text-sm font-bold text-foreground mb-1.5 flex items-center gap-2">
                  <Percent className="w-4.5 h-4.5 text-primary" />
                  Yield Optimizer Calculator
                </h2>
                <p className="text-[10px] text-muted-foreground mb-5 font-medium">
                  Estimate dynamic yields based on custom purchase prices against monthly rental rates
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Purchase Price (SGD)
                    </label>
                    <input 
                      type="number"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      placeholder="e.g. 550000"
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
                    />
                  </div>

                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-bold text-primary uppercase tracking-wider block">Calculated Net Yield</span>
                      <span className="text-xs text-muted-foreground mt-0.5 block">
                        Based on monthly rent of {formatPrice(marketData.rental_analysis.avg_rent)}
                      </span>
                    </div>
                    <span className="text-2xl font-black text-primary">
                      {getCustomYield()}%
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
