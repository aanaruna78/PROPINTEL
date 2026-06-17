"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { AiSystemStats } from "@/components/dashboard/AiSystemStats";
import { LogOut, User as UserIcon, Loader2, Sparkles } from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  disabled?: boolean;
}

const getNavItems = (role: string): NavItem[] => {
  const common: NavItem[] = [
    { name: "Dashboard", href: "/" },
    { name: "HDB Intelligence", href: "/hdb" }
  ];
  
  switch (role) {
    case "buyer":
      return [
        ...common,
        { name: "Demand Analytics", href: "/districts" },
        { name: "Intelligence Compare", href: "/compare" },
        { name: "Best Buy AI", href: "#", disabled: true },
        { name: "War Room", href: "#", disabled: true }
      ];
    case "seller":
      return [
        ...common,
        { name: "Sell Timing", href: "#", disabled: true },
        { name: "Demand Analytics", href: "/districts" }
      ];
    case "investor":
      return [
        ...common,
        { name: "Intelligence Compare", href: "/compare" },
        { name: "Demand Analytics", href: "/districts" },
        { name: "Portfolio Monitoring", href: "#", disabled: true },
        { name: "High-Yield Signals", href: "#", disabled: true }
      ];
    case "tenant":
      return [
        ...common,
        { name: "Matchmaking", href: "#", disabled: true },
        { name: "Commute Search", href: "#", disabled: true }
      ];
    case "landlord":
      return [
        ...common,
        { name: "Demand Analytics", href: "/districts" },
        { name: "Yield Optimize", href: "#", disabled: true },
        { name: "Tenant Fit", href: "#", disabled: true }
      ];
    case "agency_manager":
      return [
        ...common,
        { name: "Demand Analytics", href: "/districts" },
        { name: "Org Settings", href: "/settings" },
        { name: "Team Roster", href: "#", disabled: true }
      ];
    case "admin":
      return [
        ...common,
        { name: "Intelligence Compare", href: "/compare" },
        { name: "Demand Analytics", href: "/districts" },
        { name: "Org Settings", href: "/settings" },
        { name: "Admin Console", href: "#", disabled: true }
      ];
    default:
      return common;
  }
};

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  const isAuthPage = pathname === "/login" || pathname === "/register";

  useEffect(() => {
    if (!loading && !user && !isAuthPage) {
      router.push("/login");
    }
  }, [user, loading, isAuthPage, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <span className="text-sm font-semibold tracking-wider uppercase opacity-70">PROPINTEL AI Loading...</span>
      </div>
    );
  }

  // Auth pages (Login/Register) get a clean full-screen layout without navigation bars
  if (isAuthPage) {
    return <div className="min-h-screen w-full bg-background">{children}</div>;
  }

  // If user is not authenticated and we're redirecting, render a placeholder to prevent flicker
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  // Get User Initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="min-h-screen flex w-full">
      {/* Sidebar — fixed to viewport height, no internal scroll */}
      <aside className="w-64 border-r border-border bg-card/60 backdrop-blur-2xl hidden md:flex flex-col relative z-20 h-screen overflow-hidden sticky top-0 shrink-0">
        <div className="h-20 flex items-center justify-center border-b border-border/50 px-4 shrink-0">
          <Link href="/" className="flex items-center justify-center w-full h-full">
            <img src="/logo-light.png" alt="PROPINTEL Logo" className="max-h-14 w-auto object-contain mix-blend-multiply" />
          </Link>
        </div>
        <nav className="flex-1 flex flex-col p-3 justify-between min-h-0">
          <div className="flex flex-col gap-0.5">
            {getNavItems(user.role).map((item, idx) => {
              if (item.disabled) {
                return (
                  <div
                    key={idx}
                    className="px-3 py-2 rounded-lg text-muted-foreground/60 text-xs font-semibold border border-transparent flex items-center justify-between cursor-not-allowed hover:bg-muted/30 transition-colors"
                  >
                    <span>{item.name}</span>
                    <span className="text-[8px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Premium</span>
                  </div>
                );
              }
              return (
                <Link
                  key={idx}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                    pathname === item.href
                      ? "bg-primary/10 text-primary border-primary/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] font-semibold"
                      : "hover:bg-muted text-muted-foreground border-transparent"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* User profile footer in sidebar */}
          <div className="pt-4 border-t border-border flex flex-col gap-3">
            <div className="flex items-center gap-3 px-2">
              <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary shadow-sm">
                {getInitials(user.full_name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{user.full_name}</p>
                <p className="text-[10px] text-muted-foreground capitalize truncate">{user.role} Account</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-500 hover:text-rose-600 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-background relative overflow-hidden">
        {/* Ambient Background Glows */}
        <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
        <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-slate-400/10 blur-[120px] pointer-events-none" />

        {/* Desktop / Mobile Header */}
        <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-background/80 backdrop-blur-xl sticky top-0 z-30">
          <div className="md:hidden flex items-center h-full">
            <Link href="/" className="flex items-center h-full">
              <img src="/logo-light.png" alt="PROPINTEL Logo" className="max-h-10 w-auto object-contain mix-blend-multiply" />
            </Link>
          </div>
          <div className="flex-1 flex justify-center md:justify-start">
            <AiSystemStats />
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-foreground">{user.full_name}</span>
              <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">{user.role}</span>
            </div>
            
            <div className="w-9 h-9 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-xs font-bold text-indigo-700 shadow-sm shrink-0">
              {getInitials(user.full_name)}
            </div>
            
            <button onClick={logout} className="p-2 text-muted-foreground hover:text-rose-500 rounded-full hover:bg-rose-500/5 md:hidden transition-colors" title="Log Out">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
