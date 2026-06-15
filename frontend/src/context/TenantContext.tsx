"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

interface Tenant {
  id: string;
  name: string;
  domain: string | null;
  logo_url: string | null;
  primary_color: string;
  is_active: boolean;
}

interface TenantContextType {
  tenant: Tenant | null;
  loading: boolean;
  onboardTenant: (id: string, name: string, domain?: string, logoUrl?: string, primaryColor?: string) => Promise<void>;
  updateBranding: (logoUrl: string, primaryColor: string) => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const applyTenantBranding = (hexColor: string) => {
    if (typeof window !== "undefined" && hexColor) {
      document.documentElement.style.setProperty("--primary", hexColor);
      const r = parseInt(hexColor.slice(1, 3), 16);
      const g = parseInt(hexColor.slice(3, 5), 16);
      const b = parseInt(hexColor.slice(5, 7), 16);
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        document.documentElement.style.setProperty("--primary-rgb", `${r}, ${g}, ${b}`);
      }
    }
  };

  // Req[1]: Apply cached white-label branding from localStorage immediately on mount
  // This runs once on startup before user/token are resolved to avoid a flash of un-branded UI
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("propintel_tenant_branding");
      if (cached) {
        try {
          const tenantData = JSON.parse(cached);
          if (tenantData?.primary_color) {
            // Apply branding immediately — don't wait for user to be resolved
            setTenant(tenantData);
            applyTenantBranding(tenantData.primary_color);
          }
        } catch (e) {
          console.error("Failed to parse cached tenant branding:", e);
        }
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    async function loadTenantBranding() {
      if (!token || !user?.tenant_id) {
        // If user is resolved but has no tenant_id, clear stale cached branding
        if (user !== undefined && !user?.tenant_id) {
          setTenant(null);
        }
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/v1/tenants/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Tenant-ID": user.tenant_id,
          },
        });
        if (res.ok) {
          const tenantData = await res.json();
          setTenant(tenantData);
          localStorage.setItem("propintel_tenant_branding", JSON.stringify(tenantData));
          applyTenantBranding(tenantData.primary_color);
        }
      } catch (err) {
        console.error("Failed to load tenant configuration:", err);
      } finally {
        setLoading(false);
      }
    }

    loadTenantBranding();
  }, [user, token]);


  const onboardTenant = async (
    id: string,
    name: string,
    domain?: string,
    logoUrl?: string,
    primaryColor?: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/tenants/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          name,
          domain: domain || null,
          logo_url: logoUrl || null,
          primary_color: primaryColor || "#4338ca",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Onboarding failed. Organization ID might already be taken.");
      }

      // If user is logged in and belongs to this new tenant, update UI branding
      if (user && user.tenant_id === id) {
        setTenant(data);
        localStorage.setItem("propintel_tenant_branding", JSON.stringify(data));
        applyTenantBranding(data.primary_color);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during onboarding.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateBranding = async (logoUrl: string, primaryColor: string) => {
    if (!token || !user?.tenant_id) {
      throw new Error("Unauthorized");
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/tenants/branding`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": user.tenant_id,
        },
        body: JSON.stringify({
          logo_url: logoUrl,
          primary_color: primaryColor,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to update branding settings.");
      }

      setTenant(data);
      localStorage.setItem("propintel_tenant_branding", JSON.stringify(data));
      applyTenantBranding(data.primary_color);
    } catch (err: any) {
      setError(err.message || "Branding update error.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <TenantContext.Provider
      value={{
        tenant,
        loading,
        onboardTenant,
        updateBranding,
        error,
        clearError,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}
