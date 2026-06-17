import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { AiSystemStats } from "@/components/dashboard/AiSystemStats";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

import { AuthProvider } from "@/context/AuthContext";
import { TenantProvider } from "@/context/TenantContext";
import { AppLayout } from "@/components/layout/AppLayout";

export const metadata: Metadata = {
  title: "PROPINTEL AI | Enterprise Real Estate Intelligence",
  description: "AI-Native Real Estate Intelligence Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background text-foreground selection:bg-amber-500/30 selection:text-amber-200`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <TenantProvider>
            <AppLayout>
              {children}
            </AppLayout>
          </TenantProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
