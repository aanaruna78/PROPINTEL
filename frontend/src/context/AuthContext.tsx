"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  mobile_number: string | null;
  is_active: boolean;
  tenant_id?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  registerUser: (name: string, email: string, password: string, mobile?: string, role?: string) => Promise<void>;
  loginWithOtp: (emailOrMobile: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<string | null>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Helper to refresh session tokens
  const refreshSession = async (): Promise<string | null> => {
    const storedRefreshToken = localStorage.getItem("propintel_refresh_token");
    if (!storedRefreshToken) {
      console.warn("No refresh token found in storage.");
      return null;
    }

    try {
      const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: storedRefreshToken }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("propintel_token", data.access_token);
        localStorage.setItem("propintel_refresh_token", data.refresh_token);
        setToken(data.access_token);
        return data.access_token;
      } else {
        console.error("Refresh token verification failed on backend.");
        // Clear tokens if refresh token is expired or revoked
        localStorage.removeItem("propintel_token");
        localStorage.removeItem("propintel_refresh_token");
        setToken(null);
        setUser(null);
        return null;
      }
    } catch (err) {
      console.error("Token refresh API error:", err);
      return null;
    }
  };

  useEffect(() => {
    async function loadUserFromStorage() {
      const storedToken = localStorage.getItem("propintel_token");
      if (storedToken) {
        setToken(storedToken);
        try {
          let res = await fetch(`${API_URL}/api/v1/auth/me`, {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          });

          // If token expired (401), try refreshing
          if (res.status === 401) {
            console.log("Access token expired. Attempting token refresh...");
            const newAccess = await refreshSession();
            if (newAccess) {
              res = await fetch(`${API_URL}/api/v1/auth/me`, {
                headers: {
                  Authorization: `Bearer ${newAccess}`,
                },
              });
            }
          }

          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
          } else {
            // Token and refresh token failed
            localStorage.removeItem("propintel_token");
            localStorage.removeItem("propintel_refresh_token");
            setToken(null);
            setUser(null);
          }
        } catch (err) {
          console.error("Failed to load user profile:", err);
        }
      }
      setLoading(false);
    }
    loadUserFromStorage();
  }, []);

  // Inactivity timeout effect (15 minutes)
  useEffect(() => {
    if (!token) return;

    let timeoutId: NodeJS.Timeout;

    const resetTimeout = () => {
      clearTimeout(timeoutId);
      // Auto log out after 15 minutes of inactivity
      timeoutId = setTimeout(async () => {
        console.log("User inactive for 15 minutes, auto logging out...");
        await logout();
        router.push("/login?reason=timeout");
      }, 15 * 60 * 1000); 
    };

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    const handler = () => resetTimeout();
    
    events.forEach((name) => document.addEventListener(name, handler));
    resetTimeout();

    return () => {
      clearTimeout(timeoutId);
      events.forEach((name) => document.removeEventListener(name, handler));
    };
  }, [token]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Incorrect email or password");
      }

      localStorage.setItem("propintel_token", data.access_token);
      localStorage.setItem("propintel_refresh_token", data.refresh_token);
      setToken(data.access_token);

      // Fetch user details
      const profileRes = await fetch(`${API_URL}/api/v1/auth/me`, {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
        },
      });
      if (profileRes.ok) {
        const userData = await profileRes.json();
        setUser(userData);
        router.push("/");
      } else {
        throw new Error("Failed to load user profile after login.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected login error occurred");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async (name: string, email: string, password: string, mobile?: string, role?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: name,
          email,
          password,
          role: role || "buyer",
          mobile_number: mobile || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Registration failed. Please try again.");
      }

      localStorage.setItem("propintel_token", data.access_token);
      localStorage.setItem("propintel_refresh_token", data.refresh_token);
      setToken(data.access_token);

      // Fetch user details
      const profileRes = await fetch(`${API_URL}/api/v1/auth/me`, {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
        },
      });
      if (profileRes.ok) {
        const userData = await profileRes.json();
        setUser(userData);
        router.push("/");
      } else {
        throw new Error("Failed to load user profile after registration.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected registration error occurred");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithOtp = async (emailOrMobile: string, code: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email_or_mobile: emailOrMobile, code }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Invalid OTP code.");
      }

      localStorage.setItem("propintel_token", data.access_token);
      localStorage.setItem("propintel_refresh_token", data.refresh_token);
      setToken(data.access_token);

      const profileRes = await fetch(`${API_URL}/api/v1/auth/me`, {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
        },
      });
      if (profileRes.ok) {
        const userData = await profileRes.json();
        setUser(userData);
        router.push("/");
      } else {
        throw new Error("Failed to load profile after OTP validation.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected OTP verification error occurred");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    const currentToken = localStorage.getItem("propintel_token");
    if (currentToken) {
      try {
        // Send a logout call to the backend to immediately revoke tokens
        await fetch(`${API_URL}/api/v1/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        });
      } catch (err) {
        console.error("Backend logout token revocation failed:", err);
      }
    }

    localStorage.removeItem("propintel_token");
    localStorage.removeItem("propintel_refresh_token");
    setToken(null);
    setUser(null);
    router.push("/login");
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        registerUser,
        loginWithOtp,
        logout,
        refreshSession,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
