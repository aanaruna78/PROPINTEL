import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PROPINTEL AI | Intelligence-Driven Real Estate",
  description: "An AI-Native Real Estate Intelligence & Predictive Transaction Ecosystem for Singapore",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.className} bg-zinc-950 text-zinc-50 antialiased min-h-screen flex`}
      >
        {/* Sidebar Placeholder */}
        <aside className="w-64 border-r border-zinc-800 bg-zinc-950/50 hidden md:flex flex-col p-4">
          <div className="font-bold text-xl tracking-tight mb-8 bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            PROPINTEL AI
          </div>
          <nav className="flex flex-col gap-2">
            <div className="px-3 py-2 rounded-md bg-zinc-900 text-sm font-medium">Dashboard</div>
            <div className="px-3 py-2 rounded-md hover:bg-zinc-900/50 text-zinc-400 text-sm font-medium cursor-pointer transition-colors">Best Buy AI</div>
            <div className="px-3 py-2 rounded-md hover:bg-zinc-900/50 text-zinc-400 text-sm font-medium cursor-pointer transition-colors">Matchmaking</div>
            <div className="px-3 py-2 rounded-md hover:bg-zinc-900/50 text-zinc-400 text-sm font-medium cursor-pointer transition-colors">War Room</div>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0">
          <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-950/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="md:hidden font-bold text-lg bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">PROPINTEL</div>
            <div className="flex-1" />
            <div className="h-8 w-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-medium">
              US
            </div>
          </header>
          <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
