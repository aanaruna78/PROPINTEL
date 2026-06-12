"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Sparkles, Loader2, Mail, Lock, Phone, User as UserIcon, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const { registerUser, error, clearError } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [role, setRole] = useState("buyer");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    clearError();

    try {
      await registerUser(name, email, password, mobile, role);
    } catch (err: any) {
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

      <div className="w-full max-w-md relative z-10">
        {/* Logo and Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex items-center gap-2 mb-3 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-full text-xs font-bold text-indigo-400">
            <Sparkles className="w-3.5 h-3.5" />
            PROPINTEL AI Real Estate Ecosystem
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Create Account</h2>
          <p className="text-zinc-400 text-sm mt-2">Get started with predictive property insights</p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-3 px-4 rounded-lg font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-11 bg-zinc-950/80 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-primary h-11"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  type="email"
                  required
                  placeholder="john@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 bg-zinc-950/80 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-primary h-11"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Mobile Number (Optional)</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  type="tel"
                  placeholder="+65 9123 4567"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="pl-11 bg-zinc-950/80 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-primary h-11"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Account Role</label>
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-primary h-11 px-3.5 rounded-lg text-sm appearance-none outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                >
                  <option value="buyer">Buyer - Discovery, War Room, AI Search</option>
                  <option value="seller">Seller - Listings, Demand Analytics</option>
                  <option value="investor">Investor - Portfolio, High-Yield Signals</option>
                  <option value="tenant">Tenant - Rental Matchmaking, Commute Search</option>
                  <option value="landlord">Landlord - Yield Optimize, Tenant Fit</option>
                  <option value="agency_manager">Agency Manager - Team Management, Leads</option>
                  <option value="admin">Admin - Governance & Compliance</option>
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 text-xs">▼</div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  type="password"
                  required
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 bg-zinc-950/80 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-primary h-11"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary hover:bg-primary/95 text-white font-semibold h-11 shadow-[0_4px_20px_0_rgb(67,56,202,0.3)] transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Register Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-zinc-500 text-xs text-center mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-primary/90 hover:text-primary font-bold">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
