"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTenant } from "@/context/TenantContext";
import { Sparkles, Loader2, Users, Palette, Trash2, UserPlus, CreditCard, ShieldCheck, Check, Laptop, Smartphone, MessageSquare, Power, Clock, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PRESET_COLORS = [
  { name: "Indigo", hex: "#4338ca" },
  { name: "Emerald", hex: "#059669" },
  { name: "Cyan", hex: "#0891b2" },
  { name: "Amber", hex: "#d97706" },
  { name: "Rose", hex: "#e11d48" },
  { name: "Violet", hex: "#7c3aed" }
];

interface Member {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

interface UserSession {
  session_id: string;
  device: string;
  channel: string;
  ip_address: string;
  last_active: string;
  is_current: boolean;
}

export default function SettingsPage() {
  const { user, token, refreshSession } = useAuth();
  const { tenant, updateBranding } = useTenant();

  // Helper: get a fresh valid token, refreshing if needed
  const getValidToken = async (): Promise<string | null> => {
    if (!token) return null;
    return token;
  };

  const [activeTab, setActiveTab] = useState<"branding" | "team" | "usage" | "security">("branding");
  
  // Branding state
  const [logoUrl, setLogoUrl] = useState(tenant?.logo_url || "");
  const [primaryColor, setPrimaryColor] = useState(tenant?.primary_color || "#4338ca");
  const [updatingBranding, setUpdatingBranding] = useState(false);
  const [brandingSuccess, setBrandingSuccess] = useState(false);

  // Team state
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("agent");
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Sessions state
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Inline confirmation state (replaces native confirm() dialogs)
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Load team members
  const fetchMembers = async () => {
    if (!token || !user?.tenant_id) return;
    setLoadingMembers(true);
    try {
      let activeToken = token;
      let res = await fetch(`${API_URL}/api/v1/tenants/members`, {
        headers: {
          Authorization: `Bearer ${activeToken}`,
          "X-Tenant-ID": user.tenant_id,
        },
      });
      // Token may have expired (15 min lifetime) — refresh and retry once
      if (res.status === 401) {
        const newToken = await refreshSession();
        if (newToken) {
          activeToken = newToken;
          res = await fetch(`${API_URL}/api/v1/tenants/members`, {
            headers: {
              Authorization: `Bearer ${activeToken}`,
              "X-Tenant-ID": user.tenant_id,
            },
          });
        }
      }
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (err) {
      console.error("Failed to load members:", err);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Load active sessions
  const fetchSessions = async () => {
    if (!token) return;
    setLoadingSessions(true);
    try {
      let activeToken = token;
      let res = await fetch(`${API_URL}/api/v1/auth/sessions`, {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      // Token may have expired (15 min lifetime) — refresh and retry once
      if (res.status === 401) {
        const newToken = await refreshSession();
        if (newToken) {
          activeToken = newToken;
          res = await fetch(`${API_URL}/api/v1/auth/sessions`, {
            headers: { Authorization: `Bearer ${activeToken}` },
          });
        }
      }
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (err) {
      console.error("Failed to load sessions:", err);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    if (activeTab === "team") {
      fetchMembers();
    } else if (activeTab === "security") {
      fetchSessions();
    }
  }, [activeTab, user, token]);

  // Handle branding save
  const handleBrandingSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingBranding(true);
    setBrandingSuccess(false);

    try {
      await updateBranding(logoUrl, primaryColor);
      setBrandingSuccess(true);
      setTimeout(() => setBrandingSuccess(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingBranding(false);
    }
  };

  // Handle invite
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setInviteSuccess(false);
    setInviteError(null);

    try {
      const res = await fetch(`${API_URL}/api/v1/tenants/members/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": user?.tenant_id || "propintel",
        },
        body: JSON.stringify({
          email: inviteEmail,
          full_name: inviteName,
          role: inviteRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Invitation failed.");
      }

      setInviteSuccess(true);
      setInviteEmail("");
      setInviteName("");
      setInviteRole("agent");
      fetchMembers(); // refresh list
      setTimeout(() => setInviteSuccess(false), 2000);
    } catch (err: any) {
      setInviteError(err.message || "Could not invite member.");
    } finally {
      setInviting(false);
    }
  };

  // Handle delete member (called after inline confirm)
  const handleDeleteMember = async (memberId: number) => {
    setDeletingId(memberId);
    setConfirmDeleteId(null);
    try {
      let activeToken = token;
      let res = await fetch(`${API_URL}/api/v1/tenants/members/${memberId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${activeToken}`,
          "X-Tenant-ID": user?.tenant_id || "propintel",
        },
      });
      // Refresh token if expired and retry
      if (res.status === 401) {
        const newToken = await refreshSession();
        if (newToken) {
          activeToken = newToken;
          res = await fetch(`${API_URL}/api/v1/tenants/members/${memberId}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${activeToken}`,
              "X-Tenant-ID": user?.tenant_id || "propintel",
            },
          });
        }
      }
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
      } else {
        const data = await res.json();
        console.error("Delete member failed:", data.detail);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  // Handle revoke session (called after inline confirm)
  const handleRevokeSession = async (sessionId: string) => {
    setRevokingId(sessionId);
    setConfirmRevokeId(null);
    try {
      let activeToken = token;
      let res = await fetch(`${API_URL}/api/v1/auth/sessions/${sessionId}/revoke`, {
        method: "POST",
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      // Refresh token if expired and retry
      if (res.status === 401) {
        const newToken = await refreshSession();
        if (newToken) {
          activeToken = newToken;
          res = await fetch(`${API_URL}/api/v1/auth/sessions/${sessionId}/revoke`, {
            method: "POST",
            headers: { Authorization: `Bearer ${activeToken}` },
          });
        }
      }
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
      } else {
        const data = await res.json();
        console.error("Revoke failed:", data.detail);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRevokingId(null);
    }
  };

  const isAdmin = user?.role === "admin" || user?.role === "agency_manager";

  const getChannelIcon = (channel: string) => {
    switch (channel.toLowerCase()) {
      case "whatsapp":
        return <MessageSquare className="w-5 h-5 text-emerald-500" />;
      case "mobile":
        return <Smartphone className="w-5 h-5 text-violet-500" />;
      default:
        return <Laptop className="w-5 h-5 text-cyan-500" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Organization Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure branding settings, manage team seats, and monitor security sessions for <span className="font-bold text-foreground capitalize">{tenant?.name || user?.tenant_id}</span>
        </p>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setActiveTab("branding")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "branding" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Palette className="w-4 h-4" />
          Tenant Branding
        </button>
        <button
          onClick={() => setActiveTab("team")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "team" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="w-4 h-4" />
          Team Members
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "security" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Security & Sessions
        </button>
        <button
          onClick={() => setActiveTab("usage")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "usage" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Plan & Subscription
        </button>
      </div>

      {/* Branding Settings Tab */}
      {activeTab === "branding" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-foreground mb-4">White-Label Settings</h2>
            
            <form onSubmit={handleBrandingSave} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Logo URL</label>
                <Input
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="bg-background border-border h-11"
                  disabled={!isAdmin}
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Primary Theme Color</label>
                <div className="flex flex-wrap items-center gap-3">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => isAdmin && setPrimaryColor(color.hex)}
                      className="w-8 h-8 rounded-full border-2 transition-transform cursor-pointer relative"
                      style={{
                        backgroundColor: color.hex,
                        borderColor: primaryColor === color.hex ? "var(--foreground)" : "transparent"
                      }}
                      disabled={!isAdmin}
                      title={color.name}
                    >
                      {primaryColor === color.hex && (
                        <Check className="w-4 h-4 text-white absolute inset-0 m-auto" />
                      )}
                    </button>
                  ))}

                  <div className="flex items-center gap-2 border border-border rounded-lg px-2 bg-background h-10 ml-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => isAdmin && setPrimaryColor(e.target.value)}
                      className="w-6 h-6 border-0 bg-transparent cursor-pointer rounded"
                      disabled={!isAdmin}
                    />
                    <span className="text-xs font-mono text-muted-foreground uppercase">{primaryColor}</span>
                  </div>
                </div>
              </div>

              {isAdmin ? (
                <div className="flex items-center gap-4">
                  <Button
                    type="submit"
                    disabled={updatingBranding}
                    className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-[0_4px_10px_rgba(var(--primary-rgb),0.3)] transition-all"
                  >
                    {updatingBranding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Settings"}
                  </Button>

                  {brandingSuccess && (
                    <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1.5 animate-pulse">
                      <Check className="w-4 h-4" /> Custom theme applied!
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-xs text-rose-500 font-semibold">
                  ⚠️ View-only mode. Only Organization Admins can modify branding configurations.
                </p>
              )}
            </form>
          </div>

          {/* Branding Preview */}
          <div className="bg-card/50 border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">Branding Preview</h3>
              <p className="text-xs text-muted-foreground mb-6">See how your agency's logo and accent colors apply dynamically to navigation items and dashboards.</p>
              
              {/* Fake Sidebar Preview */}
              <div className="border border-border/80 rounded-lg p-3 bg-slate-900/10 flex flex-col gap-2 relative">
                <div className="h-8 border-b border-border/40 flex items-center justify-center p-2 mb-2">
                  <div className="w-20 h-4 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-6 rounded bg-primary/15 border border-primary/20 text-[9px] font-bold text-primary flex items-center px-2">
                  Dashboard Active (Theme Color)
                </div>
                <div className="h-6 rounded hover:bg-muted text-[9px] text-muted-foreground flex items-center px-2">
                  Inactive Item
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-4 border-t border-border flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                {user?.full_name ? user.full_name.substring(0,2).toUpperCase() : "SG"}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-extrabold text-foreground block truncate">{user?.full_name}</span>
                <span className="text-[8px] text-muted-foreground uppercase font-bold tracking-wider">Tenant: {tenant?.id}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Members Tab */}
      {activeTab === "team" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Members List */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-foreground mb-4">Active Team Seats</h2>

            {loadingMembers ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : (
              <div className="divide-y divide-border">
                {members.map((member) => (
                  <div key={member.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-bold text-muted-foreground uppercase">
                        {member.full_name.substring(0, 2)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-foreground flex items-center gap-1.5">
                          {member.full_name}
                          {member.role === "admin" && (
                            <span className="bg-primary/10 text-primary border border-primary/20 text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded">Admin</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{member.email}</div>
                      </div>
                    </div>

                    {isAdmin && member.email !== user?.email ? (
                      confirmDeleteId === member.id ? (
                        // Inline confirmation — no native confirm() dialog
                        <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                          <span className="text-[10px] text-rose-400 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Remove?
                          </span>
                          <button
                            onClick={() => handleDeleteMember(member.id)}
                            disabled={deletingId === member.id}
                            className="px-2 py-1 text-[10px] font-bold bg-rose-500 hover:bg-rose-600 text-white rounded-md transition-colors cursor-pointer"
                          >
                            {deletingId === member.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Yes, Remove"}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 text-[10px] font-bold border border-border text-muted-foreground hover:text-foreground rounded-md transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(member.id)}
                          className="p-2 text-muted-foreground hover:text-rose-500 rounded-lg hover:bg-rose-500/5 transition-colors cursor-pointer"
                          title="Remove Seat"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Invite Form */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm h-fit">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-primary" />
              Invite Team Member
            </h3>

            {inviteSuccess && (
              <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs py-2.5 px-3 rounded-lg font-medium">
                Invitation sent successfully!
              </div>
            )}

            {inviteError && (
              <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-2.5 px-3 rounded-lg font-medium">
                {inviteError}
              </div>
            )}

            {isAdmin ? (
              <form onSubmit={handleInviteSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Full Name</label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. Agent Smith"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="bg-background border-border"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Email Address</label>
                  <Input
                    type="email"
                    required
                    placeholder="e.g. smith@agency.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="bg-background border-border"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary text-foreground"
                  >
                    <option value="agent">Agent (Seat)</option>
                    <option value="admin">Admin (Billing & Branding)</option>
                  </select>
                </div>

                <Button
                  type="submit"
                  disabled={inviting}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-semibold transition-all mt-2"
                >
                  {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Invitation"}
                </Button>
              </form>
            ) : (
              <p className="text-xs text-muted-foreground">
                Only Organization Admins can invite team members.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Security & Sessions Tab */}
      {activeTab === "security" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Sessions List */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">Active Session Monitoring</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Real-time device tracking and authorization blocklisting.</p>
              </div>
              <Button onClick={fetchSessions} variant="outline" size="sm" className="h-8 border-border">
                Refresh
              </Button>
            </div>

            {loadingSessions ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                No active sessions tracked.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {sessions.map((s) => (
                  <div key={s.session_id} className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center mt-0.5">
                        {getChannelIcon(s.channel)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-foreground flex items-center gap-2">
                          {s.device}
                          {s.is_current && (
                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded">
                              Current Session
                            </span>
                          )}
                          {!s.is_current && (
                            <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-3 gap-y-1">
                          <span>IP: <span className="font-mono font-medium text-foreground">{s.ip_address}</span></span>
                          <span>Channel: <span className="capitalize text-foreground font-medium">{s.channel}</span></span>
                          <span>Last Active: <span className="text-foreground font-medium">{new Date(s.last_active).toLocaleString()}</span></span>
                        </div>
                      </div>
                    </div>

                    {!s.is_current && (
                      confirmRevokeId === s.session_id ? (
                        // Inline confirmation — no native confirm() dialog needed
                        <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                          <span className="text-[10px] text-rose-400 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Terminate?
                          </span>
                          <button
                            onClick={() => handleRevokeSession(s.session_id)}
                            disabled={revokingId === s.session_id}
                            className="px-2.5 py-1.5 text-[10px] font-bold bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                          >
                            {revokingId === s.session_id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <><Power className="w-3 h-3" /> Confirm</>  
                            )}
                          </button>
                          <button
                            onClick={() => setConfirmRevokeId(null)}
                            className="px-2.5 py-1.5 text-[10px] font-bold border border-border text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <X className="w-3 h-3" /> Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmRevokeId(s.session_id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:text-white bg-rose-500/5 hover:bg-rose-500 border border-rose-500/20 hover:border-transparent rounded-lg transition-all cursor-pointer"
                          title="Force Terminate Session"
                        >
                          <Power className="w-3.5 h-3.5" />
                          Revoke
                        </button>
                      )
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Session Expiration Policies */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm h-fit space-y-6">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border pb-3">
              <Clock className="w-4 h-4 text-primary" />
              Security Policies
            </h3>

            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-foreground block">Inactivity Timeout</span>
                <p className="text-xs text-muted-foreground">
                  Sessions are automatically terminated after <span className="font-bold text-foreground">15 minutes</span> of inactivity. Any keyboard, mouse, or screen interaction resets this window.
                </p>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] text-amber-400 font-bold uppercase mt-1">
                  Enforced
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-foreground block">JWT Refresh Rotation</span>
                <p className="text-xs text-muted-foreground">
                  Stateless authentication uses short-lived tokens and secure Refresh Token Rotation. Using a refresh token invalidates previous access tokens immediately to prevent token harvesting.
                </p>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[10px] text-emerald-400 font-bold uppercase mt-1">
                  Active
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-foreground block">Multi-Device Channel Support</span>
                <p className="text-xs text-muted-foreground">
                  PROPINTEL monitors session footprints across Web dashboards, Mobile iOS/Android apps, and simulated WhatsApp automation gateways to ensure complete corporate visibility.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Monitor Tab */}
      {activeTab === "usage" && (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm max-w-2xl">
          <h2 className="text-lg font-bold text-foreground mb-4">Subscription Overview</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="border border-border/80 rounded-xl p-4 bg-muted/20">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Current Plan</span>
              <span className="text-2xl font-black text-primary block mt-1">Enterprise Pro</span>
              <span className="text-xs text-muted-foreground block mt-2">Active until 2027-01-01</span>
            </div>

            <div className="border border-border/80 rounded-xl p-4 bg-muted/20">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Monthly Charge</span>
              <span className="text-2xl font-black text-foreground block mt-1">$499 <span className="text-xs font-normal text-muted-foreground">/ SGD</span></span>
              <span className="text-xs text-muted-foreground block mt-2">Billed automatically to Huttons HQ</span>
            </div>
          </div>

          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">Resource Allocation</h3>
          <div className="space-y-4">
            {/* Seat Seat usage */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-foreground">
                <span>Team Seats Usage</span>
                <span>2 / 10 Seats Used</span>
              </div>
              <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: "20%" }} />
              </div>
            </div>

            {/* AI usage */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-foreground">
                <span>AI Insights & Heatmap Queries</span>
                <span>342 / 1,000 Queries</span>
              </div>
              <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: "34.2%" }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
