import { AiCommandBar } from "@/components/dashboard/AiCommandBar";
import { MarketPulseWidget } from "@/components/dashboard/MarketPulseWidget";
import { InsightsWidget } from "@/components/dashboard/InsightsWidget";
import { DistrictHeatmapWidget } from "@/components/dashboard/DistrictHeatmapWidget";
import { PropertyFeed } from "@/components/dashboard/PropertyFeed";
import { WatchlistWidget } from "@/components/dashboard/WatchlistWidget";
import { RoleDashboardWidget } from "@/components/dashboard/RoleDashboardWidget";
import { DistrictAnalyticsEngineWidget } from "@/components/dashboard/DistrictAnalyticsEngineWidget";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 min-h-full">
      {/* Hero Text */}
      <div className="pt-4 flex flex-col items-center text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 tracking-tight">
          What is your <span className="text-gradient-indigo">property intent</span> today?
        </h1>
        <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
          Our AI engines are continuously scanning the market for undervalued opportunities.
        </p>
      </div>

      {/* AI Command Bar */}
      <div className="w-full">
        <AiCommandBar />
      </div>

      {/* Role-Based Intelligence Panel */}
      <div className="w-full">
        <RoleDashboardWidget />
      </div>

      {/* Top Intelligence Dashboard (Widgets + Map) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Side: 4 Small Widgets (3 + District Engine) */}
        <div className="xl:col-span-7 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="h-[320px]">
            <MarketPulseWidget />
          </div>
          <div className="h-[320px]">
            <WatchlistWidget />
          </div>
          <div className="h-[320px]">
            <InsightsWidget />
          </div>
          <div className="h-[320px]">
            <DistrictAnalyticsEngineWidget />
          </div>
        </div>
        
        {/* Right Side: Heatmap Map */}
        <div className="xl:col-span-5 h-[320px]">
          <DistrictHeatmapWidget />
        </div>
      </div>

      {/* Full Width Feed */}
      <div className="pt-4">
        <PropertyFeed />
      </div>
    </div>
  );
}
