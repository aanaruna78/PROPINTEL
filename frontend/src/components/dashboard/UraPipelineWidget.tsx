"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  Database, RefreshCw, CheckCircle2, AlertCircle, 
  MapPin, Calendar, CircleDollarSign, Loader2, Play 
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Transaction {
  id: number;
  project_id: number;
  project_name: string;
  district: string;
  contract_date: string;
  price: number;
  area_sqm: number;
  area_sqft: number;
  psf: number;
  property_type: string;
  tenure: string;
  floor_range: string;
  type_of_sale: string;
  no_of_units: number;
  type_of_area: string;
}

interface PipelineStatus {
  total_projects: number;
  total_transactions: number;
  last_sync_timestamp: string | null;
  status: string;
}

export function UraPipelineWidget() {
  const { token, refreshSession } = useAuth();
  const [status, setStatus] = useState<PipelineStatus>({
    total_projects: 0,
    total_transactions: 0,
    last_sync_timestamp: null,
    status: "Healthy"
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [useMock, setUseMock] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchStatus = async (authToken: string) => {
    try {
      const res = await fetch(`${API_URL}/api/v1/ura/status`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.error("Failed to fetch pipeline status:", err);
    }
  };

  const fetchTransactions = async (authToken: string) => {
    try {
      const res = await fetch(`${API_URL}/api/v1/ura/transactions?limit=15`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    }
  };

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      let activeToken = token;
      // Fetch initial details
      const res = await fetch(`${API_URL}/api/v1/ura/status`, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      
      if (res.status === 401) {
        const newToken = await refreshSession();
        if (newToken) {
          activeToken = newToken;
        }
      }
      
      await Promise.all([
        fetchStatus(activeToken),
        fetchTransactions(activeToken)
      ]);
    } catch (err) {
      console.error("Failed to load URA data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleSyncTrigger = async () => {
    if (!token) return;
    setSyncing(true);
    setFeedback(null);
    try {
      let activeToken = token;
      let res = await fetch(`${API_URL}/api/v1/ura/trigger-sync?use_mock=${useMock}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${activeToken}` }
      });

      if (res.status === 401) {
        const newToken = await refreshSession();
        if (newToken) {
          activeToken = newToken;
          res = await fetch(`${API_URL}/api/v1/ura/trigger-sync?use_mock=${useMock}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${activeToken}` }
          });
        }
      }

      const data = await res.json();
      if (res.ok) {
        if (data.status === "Success") {
          setFeedback({
            type: "success",
            message: `Sync Completed! Ingested ${data.new_transactions_ingested} transactions, resolved ${data.new_projects_created} new projects. (Duplicates skipped: ${data.duplicates_skipped})`
          });
        } else {
          setFeedback({
            type: "error",
            message: `Sync finished with warnings/errors: ${data.errors?.join("; ") || "Unknown backend issue."} (Successfully Ingested: ${data.new_transactions_ingested}, resolved: ${data.new_projects_created}, duplicates skipped: ${data.duplicates_skipped})`
          });
        }
        // Reload dashboard stats
        await Promise.all([
          fetchStatus(activeToken),
          fetchTransactions(activeToken)
        ]);
      } else {
        setFeedback({
          type: "error",
          message: data.detail || "Sync failed. Please check backend configuration."
        });
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to trigger synchronization."
      });
    } finally {
      setSyncing(false);
    }
  };

  // Helper formatting functions
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

  const formatContractDate = (mmyy: string) => {
    if (mmyy.length !== 4) return mmyy;
    const mm = mmyy.substring(0, 2);
    const yy = mmyy.substring(2, 4);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthIdx = parseInt(mm, 10) - 1;
    const month = months[monthIdx] || mm;
    return `${month} 20${yy}`;
  };

  if (loading && !syncing) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse">Initializing market database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Total Transactions</span>
              <span className="text-2xl font-black text-foreground mt-0.5 block">{status.total_transactions}</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-violet-500/10 rounded-lg text-violet-500">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Resolved Projects</span>
              <span className="text-2xl font-black text-foreground mt-0.5 block">{status.total_projects}</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-500">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Pipeline Status</span>
              <span className="text-sm font-bold text-emerald-400 mt-1 flex items-center gap-1.5 uppercase tracking-wide">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                {status.status}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 rounded-lg text-amber-500">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Last Synced</span>
              <span className="text-xs font-semibold text-foreground mt-1.5 block truncate">
                {status.last_sync_timestamp 
                  ? new Date(status.last_sync_timestamp).toLocaleString()
                  : "Never Synced"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sync Operations Card */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-foreground mb-1.5 flex items-center gap-2">
          <RefreshCw className={`w-5 h-5 text-primary ${syncing ? 'animate-spin' : ''}`} />
          URA Sync Engine Control
        </h2>
        <p className="text-xs text-muted-foreground mb-6">
          Synchronize PropIntel database with the Singapore Urban Redevelopment Authority (URA) API. By default, developers use mocked feeds to verify incremental logic offline.
        </p>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/20 border border-border/60 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-foreground">
              <input 
                type="checkbox" 
                checked={useMock} 
                onChange={(e) => setUseMock(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 bg-background"
                disabled={syncing}
              />
              Force Mock Ingestion Feed (Offline Mode)
            </label>
          </div>

          <Button 
            onClick={handleSyncTrigger} 
            disabled={syncing}
            className="bg-primary hover:bg-primary/90 text-white font-semibold flex items-center gap-2"
          >
            {syncing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Ingesting Transactions...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                Run Pipeline Sync
              </>
            )}
          </Button>
        </div>

        {feedback && (
          <div className={`p-4 rounded-xl text-xs font-medium border animate-in fade-in duration-200 flex items-start gap-2.5 ${
            feedback.type === "success" 
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}>
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
            ) : (
              <AlertCircle className="w-4.5 h-4.5 shrink-0" />
            )}
            <div>
              <p className="font-bold">{feedback.type === "success" ? "Pipeline Execution Succeeded" : "Pipeline Execution Failed"}</p>
              <p className="mt-0.5 leading-relaxed">{feedback.message}</p>
            </div>
          </div>
        )}
      </div>

      {/* Transactions Table Card */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm overflow-hidden">
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <CircleDollarSign className="w-5 h-5 text-primary" />
          Recent Ingested Transactions
        </h2>

        {transactions.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm border border-dashed border-border/80 rounded-xl">
            No transactions ingested yet. Click "Run Pipeline Sync" above to fetch transactions.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-bold">
                  <th className="py-3 px-4">Project Name</th>
                  <th className="py-3 px-4">District</th>
                  <th className="py-3 px-4">Property Type</th>
                  <th className="py-3 px-4 text-right">Price (SGD)</th>
                  <th className="py-3 px-4 text-right">Size (Sqft)</th>
                  <th className="py-3 px-4 text-right">PSF</th>
                  <th className="py-3 px-4">Type of Sale</th>
                  <th className="py-3 px-4">Contract Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-muted/10 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-foreground uppercase">{tx.project_name}</td>
                    <td className="py-3.5 px-4">
                      <span className="bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">
                        {tx.district}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">{tx.property_type}</td>
                    <td className="py-3.5 px-4 font-bold text-right text-foreground">{formatPrice(tx.price)}</td>
                    <td className="py-3.5 px-4 text-right text-muted-foreground">{Math.round(tx.area_sqft)} sqft</td>
                    <td className="py-3.5 px-4 text-right font-semibold text-primary">{formatPSF(tx.psf)}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        tx.type_of_sale === "New Sale" 
                          ? "bg-blue-500/10 border border-blue-500/20 text-blue-400"
                          : "bg-zinc-500/10 border border-zinc-500/20 text-zinc-400"
                      }`}>
                        {tx.type_of_sale}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-foreground">{formatContractDate(tx.contract_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
