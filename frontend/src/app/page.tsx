import { AiCommandBar } from "@/components/dashboard/AiCommandBar";
import { MarketPulseWidget } from "@/components/dashboard/MarketPulseWidget";
import { InsightsWidget } from "@/components/dashboard/InsightsWidget";
import { DistrictHeatmapWidget } from "@/components/dashboard/DistrictHeatmapWidget";
import { PropertyFeed } from "@/components/dashboard/PropertyFeed";
import { WatchlistWidget } from "@/components/dashboard/WatchlistWidget";

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="text-center mb-10 pt-4">
        <h1 className="text-3xl font-bold text-zinc-100 mb-3 tracking-tight">
          What is your <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">property intent</span> today?
        </h1>
        <p className="text-zinc-500 text-sm">Our AI engines are continuously scanning the market for undervalued opportunities.</p>
      </div>

      {/* Main AI Intent Bar */}
      <AiCommandBar />

      {/* Dashboard Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
        
        {/* Left Column (Feed) */}
        <div className="lg:col-span-8 space-y-6">
          <PropertyFeed />
        </div>

        {/* Right Column (Widgets) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="h-48">
            <MarketPulseWidget />
          </div>
          <div className="h-64">
            <InsightsWidget />
          </div>
          <div className="h-64">
            <DistrictHeatmapWidget />
          </div>
          <div className="h-64">
            <WatchlistWidget />
          </div>
        </div>
      </div>
    </div>
  );
}
