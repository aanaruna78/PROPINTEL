"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Sparkles, Loader2, Mail, Lock, Phone, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const { login, loginWithOtp, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpMode, setOtpMode] = useState(false);
  const [otpTarget, setOtpTarget] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    clearError();

    try {
      if (otpMode) {
        if (!otpSent) {
          // Send OTP request
          const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
          const res = await fetch(`${API_URL}/api/v1/auth/send-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email_or_mobile: otpTarget }),
          });
          if (res.ok) {
            setOtpSent(true);
            setMessage("OTP sent! Enter '123456' to log in.");
          } else {
            const data = await res.json();
            throw new Error(data.detail || "Failed to send OTP.");
          }
        } else {
          // Verify OTP
          await loginWithOtp(otpTarget, otpCode);
        }
      } else {
        // Password login
        await login(email, password);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleOtpMode = () => {
    setOtpMode(!otpMode);
    setOtpSent(false);
    setOtpTarget("");
    setOtpCode("");
    setMessage(null);
    clearError();
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
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Welcome Back</h2>
          <p className="text-zinc-400 text-sm mt-2">Enter credentials or OTP to access dashboard</p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-3 px-4 rounded-lg font-medium">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-6 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs py-3 px-4 rounded-lg font-medium">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!otpMode ? (
              // Email & Password Mode
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input
                      type="email"
                      required
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-11 bg-zinc-950/80 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-primary h-11"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Password</label>
                    <span className="text-xs text-primary/80 hover:text-primary cursor-pointer font-medium">Forgot password?</span>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-11 bg-zinc-950/80 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-primary h-11"
                    />
                  </div>
                </div>
              </>
            ) : (
              // OTP Mode
              <>
                {!otpSent ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Email or Mobile Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <Input
                        type="text"
                        required
                        placeholder="e.g. +65 9123 4567 or email@domain.com"
                        value={otpTarget}
                        onChange={(e) => setOtpTarget(e.target.value)}
                        className="pl-11 bg-zinc-950/80 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-primary h-11"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Enter OTP Code</label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <Input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="123456"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        className="pl-11 bg-zinc-950/80 border-zinc-800 text-white tracking-[0.2em] font-mono text-center text-lg placeholder:tracking-normal placeholder:text-center placeholder:text-zinc-600 focus-visible:ring-primary h-11"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary hover:bg-primary/95 text-white font-semibold h-11 shadow-[0_4px_20px_0_rgb(67,56,202,0.3)] transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {otpMode ? (otpSent ? "Verify & Sign In" : "Request OTP Code") : "Sign In with Password"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Toggle OTP/Password */}
          <div className="mt-5 text-center">
            <button
              onClick={toggleOtpMode}
              className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              {otpMode ? "Sign In with password instead" : "Sign In with secure OTP instead"}
            </button>
          </div>

          {/* Social Logins */}
          <div className="mt-8 pt-6 border-t border-zinc-800">
            <div className="relative flex justify-center mb-6">
              <span className="absolute inset-0 top-1/2 bg-zinc-800 h-px"></span>
              <span className="relative bg-[#111116] px-3 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Or continue with</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setEmail("dev@propintel.ai");
                  setPassword("password123");
                  setMessage("Mock developer credentials pre-loaded. Click 'Sign In'!");
                }}
                type="button"
                className="flex items-center justify-center gap-2 border border-zinc-800 hover:bg-zinc-800/40 text-xs text-zinc-300 font-semibold py-2.5 px-4 rounded-lg transition-colors cursor-pointer"
              >
                Google (Dev Auto-fill)
              </button>
              <button
                onClick={() => {
                  setOtpMode(true);
                  setOtpTarget("dev@propintel.ai");
                  setMessage("OTP target set. Request OTP and enter '123456'!");
                }}
                type="button"
                className="flex items-center justify-center gap-2 border border-zinc-800 hover:bg-zinc-800/40 text-xs text-zinc-300 font-semibold py-2.5 px-4 rounded-lg transition-colors cursor-pointer"
              >
                LinkedIn (OTP Mock)
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-zinc-500 text-xs text-center mt-6">
          Don't have an account?{" "}
          <Link href="/register" className="text-primary/90 hover:text-primary font-bold">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
