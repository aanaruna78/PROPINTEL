"use client";

import React, { useState } from "react";
import { useTenant } from "@/context/TenantContext";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, Globe, Building2, Palette, ArrowRight, Check } from "lucide-react";
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

export default function OnboardPage() {
  const { onboardTenant, error, clearError } = useTenant();
  const router = useRouter();

  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#4338ca");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    clearError();

    try {
      await onboardTenant(
        id.toLowerCase().trim().replace(" ", "-"),
        name,
        domain || undefined,
        logoUrl || undefined,
        primaryColor
      );
      setSuccess(true);
      setTimeout(() => {
        router.push("/settings");
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative bg-slate-950 px-4 py-12">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex items-center gap-2 mb-3 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-full text-xs font-bold text-indigo-400">
            <Building2 className="w-3.5 h-3.5" />
            PROPINTEL Agency Onboarding
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Provision Organization</h2>
          <p className="text-zinc-400 text-sm mt-2">Setup white-label branding and domain isolation</p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-3 px-4 rounded-lg font-medium">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs py-3 px-4 rounded-lg font-medium flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              Organization provisioned successfully! Redirecting to settings...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Workspace ID (Slug)</label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. propnex"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  className="bg-zinc-950/80 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-primary h-11"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Agency/Firm Name</label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. PropNex Realty"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-zinc-950/80 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-primary h-11"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-zinc-400" />
                  Custom Domain
                </label>
                <Input
                  type="text"
                  placeholder="e.g. propnex.propintel.ai"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="bg-zinc-950/80 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-primary h-11"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Logo Image URL</label>
                <Input
                  type="url"
                  placeholder="e.g. https://domain.com/logo.png"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="bg-zinc-950/80 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-primary h-11"
                />
              </div>
            </div>

            {/* Custom Brand Colors */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-zinc-400" />
                Primary Branding Color
              </label>

              <div className="flex flex-wrap items-center gap-3">
                {/* Color presets */}
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => setPrimaryColor(color.hex)}
                    className="w-8 h-8 rounded-full border-2 transition-transform cursor-pointer relative"
                    style={{
                      backgroundColor: color.hex,
                      borderColor: primaryColor === color.hex ? "#ffffff" : "transparent"
                    }}
                    title={color.name}
                  >
                    {primaryColor === color.hex && (
                      <Check className="w-4 h-4 text-white absolute inset-0 m-auto" />
                    )}
                  </button>
                ))}

                {/* Custom Color Input */}
                <div className="flex items-center gap-2 border border-zinc-800 rounded-lg px-2 bg-zinc-950 h-10 ml-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-6 h-6 border-0 bg-transparent cursor-pointer rounded"
                  />
                  <span className="text-xs font-mono text-zinc-400 uppercase">{primaryColor}</span>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting || success}
              className="w-full bg-primary hover:bg-primary/95 text-white font-semibold h-11 shadow-[0_4px_20px_0_rgb(67,56,202,0.3)] transition-all flex items-center justify-center gap-2 mt-4"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Provision Workspace
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
