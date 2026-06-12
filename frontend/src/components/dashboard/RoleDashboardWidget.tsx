"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  Sparkles, 
  Loader2, 
  ShieldAlert, 
  TrendingUp, 
  TrendingDown, 
  MapPin, 
  Coins, 
  Users2, 
  ShieldCheck, 
  BarChart3,
  ArrowRight,
  Flame,
  Award
} from "lucide-react";

interface RoleData {
  role: string;
  title: string;
  description: string;
  metrics: Record<string, any>;
}

export function RoleDashboardWidget() {
  const { user, token } = useAuth();
  const [data, setData] = useState<RoleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Maps roles to their corresponding API subpath
  const getEndpointPath = (role: string) => {
    switch (role) {
      case "buyer": return "buyer/war-room";
      case "seller": return "seller/analytics";
      case "investor": return "investor/signals";
      case "tenant": return "tenant/matchmaking";
      case "landlord": return "landlord/yield";
      case "agency_manager": return "agency-manager/leads";
      case "admin": return "admin/governance";
      default: return "buyer/war-room";
    }
  };

  useEffect(() => {
    async function fetchRoleData() {
      if (!user || !token) return;
      setLoading(true);
      setError(null);

      const path = getEndpointPath(user.role);
      try {
        const res = await fetch(`${API_URL}/api/v1/rbac/${path}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Tenant-ID": user.role === "agency_manager" ? "era" : "propintel" // Match demo client flow
          }
        });
        
        if (res.status === 403) {
          throw new Error("Access denied. You do not have the required role to view this intelligence stream.");
        }
        if (!res.ok) {
          throw new Error("Failed to load role-specific intelligence feed.");
        }

        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || "An error occurred.");
      } finally {
        setLoading(false);
      }
    }

    fetchRoleData();
  }, [user, token, API_URL]);

  if (loading) {
    return (
      <div className="bg-card/40 border border-border/50 rounded-2xl p-6 backdrop-blur-xl h-[320px] flex flex-col items-center justify-center text-foreground">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
        <p className="text-xs font-semibold tracking-wider uppercase opacity-60">Configuring Role-Scoped Sandbox...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-6 backdrop-blur-xl h-[320px] flex flex-col items-center justify-center text-rose-500 text-center">
        <ShieldAlert className="w-8 h-8 mb-2" />
        <p className="font-semibold text-sm">Security Restriction</p>
        <p className="text-xs max-w-xs mt-1 opacity-80">{error || "Failed to fetch data."}</p>
      </div>
    );
  }

  // Define Icon based on active role
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "buyer": return <TrendingDown className="w-6 h-6 text-indigo-400" />;
      case "seller": return <TrendingUp className="w-6 h-6 text-emerald-400" />;
      case "investor": return <Award className="w-6 h-6 text-amber-400" />;
      case "tenant": return <MapPin className="w-6 h-6 text-sky-400" />;
      case "landlord": return <Coins className="w-6 h-6 text-rose-400" />;
      case "agency_manager": return <Users2 className="w-6 h-6 text-violet-400" />;
      case "admin": return <ShieldCheck className="w-6 h-6 text-teal-400" />;
      default: return <Sparkles className="w-6 h-6 text-primary" />;
    }
  };

  const roleLabels: Record<string, string> = {
    buyer: "Buyer Workspace",
    seller: "Seller Workspace",
    investor: "Investor Analytics",
    tenant: "Tenant Portal",
    landlord: "Landlord Yield Console",
    agency_manager: "Agency Manager Suite",
    admin: "Admin Governance"
  };

  return (
    <div className="group relative bg-card/30 hover:bg-card/45 border border-border/50 hover:border-primary/20 rounded-2xl p-6 backdrop-blur-xl transition-all duration-300 shadow-xl overflow-hidden flex flex-col justify-between h-full">
      {/* Light glow effects */}
      <div className="absolute top-0 right-0 w-[150px] h-[150px] rounded-full bg-primary/5 blur-[50px] pointer-events-none group-hover:bg-primary/10 transition-all duration-300" />
      
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs font-bold text-primary">
            {getRoleIcon(data.role)}
            {roleLabels[data.role] || "Workspace"}
          </span>
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Guarded Feed
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
          {data.title}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed mb-4">
          {data.description}
        </p>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-2">
          {Object.entries(data.metrics).map(([key, val], i) => {
            const displayKey = key.replace(/_/g, " ").toUpperCase();
            
            // Check if val is an array (like tactics or hot deals or optimizations)
            if (Array.isArray(val)) {
              return (
                <div key={i} className="md:col-span-2 bg-zinc-950/40 border border-border/30 rounded-xl p-3.5">
                  <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">{displayKey}</span>
                  <div className="mt-2 space-y-2">
                    {val.map((item, idx) => {
                      if (typeof item === "object") {
                        return (
                          <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-border/20 last:border-0">
                            <span className="font-semibold text-foreground">{item.name || item.title}</span>
                            <span className="text-muted-foreground">{item.discount || item.rent || item.closings}</span>
                          </div>
                        );
                      }
                      return (
                        <div key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
                          <Flame className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }
            
            // Check if val is an object (like agreement_intelligence)
            if (typeof val === "object") {
              return (
                <div key={i} className="md:col-span-2 bg-zinc-950/40 border border-border/30 rounded-xl p-3.5">
                  <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">{displayKey}</span>
                  <div className="mt-1.5 flex items-center justify-between text-xs text-zinc-300">
                    <span className="font-bold text-primary">{val.risk_profile}</span>
                    <span className="opacity-80 italic">{val.warnings?.[0]}</span>
                  </div>
                </div>
              );
            }

            return (
              <div key={i} className="bg-zinc-950/40 border border-border/30 rounded-xl p-3.5 flex flex-col justify-center">
                <span className="text-[9px] font-bold tracking-wider text-muted-foreground uppercase">{displayKey}</span>
                <span className="text-sm font-bold text-foreground mt-1 truncate">{String(val)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">Authorized Context: <strong className="text-foreground capitalize">{user.role}</strong></span>
        <button className="flex items-center gap-1 text-primary hover:text-primary/80 font-bold transition-colors">
          Initialize Suite
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
