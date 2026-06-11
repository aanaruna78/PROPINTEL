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
    <html lang="en">
      <body
        className={`${outfit.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background text-foreground selection:bg-amber-500/30 selection:text-amber-200`}
      >
        <div className="min-h-screen flex w-full">
          {/* Sidebar */}
          <aside className="w-64 border-r border-border bg-card/60 backdrop-blur-2xl hidden md:flex flex-col relative z-20">
            <div className="h-24 flex items-center justify-center border-b border-border/50 p-4">
              <Link href="/" className="flex items-center justify-center w-full">
                <img src="/logo-light.png" alt="PROPINTEL Logo" className="h-auto w-36 object-contain mix-blend-multiply" />
              </Link>
            </div>
            <nav className="flex flex-col gap-2 p-4">
              <Link href="/" className="px-3 py-2.5 rounded-lg bg-primary/10 text-primary text-sm font-medium border border-primary/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">Dashboard</Link>
              <div className="px-3 py-2.5 rounded-lg hover:bg-muted text-muted-foreground text-sm font-medium cursor-pointer transition-colors">Best Buy AI</div>
              <div className="px-3 py-2.5 rounded-lg hover:bg-muted text-muted-foreground text-sm font-medium cursor-pointer transition-colors">Matchmaking</div>
              <div className="px-3 py-2.5 rounded-lg hover:bg-muted text-muted-foreground text-sm font-medium cursor-pointer transition-colors">War Room</div>
            </nav>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col min-w-0 bg-background relative overflow-hidden">
            {/* Ambient Background Glows - Softer for light theme */}
            <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-slate-400/10 blur-[120px] pointer-events-none" />

            {/* Desktop / Mobile Header */}
            <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-background/80 backdrop-blur-xl sticky top-0 z-30">
              <div className="md:hidden flex items-center">
                <Link href="/" className="flex items-center">
                  <img src="/logo-light.png" alt="PROPINTEL Logo" className="h-auto w-28 object-contain mix-blend-multiply" />
                </Link>
              </div>
              <div className="flex-1 flex justify-center md:justify-start">
                <AiSystemStats />
              </div>
              <div className="h-9 w-9 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-xs font-bold text-indigo-700 shadow-sm shrink-0">
                SG
              </div>
            </header>
            <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 relative z-10">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
