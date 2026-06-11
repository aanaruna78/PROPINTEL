import { AiCommandBar } from "@/components/dashboard/AiCommandBar";
import { MarketPulseWidget } from "@/components/dashboard/MarketPulseWidget";
import { InsightsWidget } from "@/components/dashboard/InsightsWidget";
import { DistrictHeatmapWidget } from "@/components/dashboard/DistrictHeatmapWidget";
import { PropertyFeed } from "@/components/dashboard/PropertyFeed";
import { WatchlistWidget } from "@/components/dashboard/WatchlistWidget";

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-full">
      {/* LEFT COLUMN: Scrollable Feed */}
      <div className="lg:col-span-7 xl:col-span-6 space-y-6 flex flex-col">
        {/* Hero Text */}
        <div className="mb-6 pt-2">
          <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
            What is your <span className="text-gradient-gold">property intent</span> today?
          </h1>
          <p className="text-muted-foreground text-sm">
            Our AI engines are continuously scanning the market for undervalued opportunities.
          </p>
        </div>

        {/* AI Command Bar */}
        <div className="w-full">
          <AiCommandBar />
        </div>

        {/* Quick Intelligence Widgets (Bento Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-48">
            <MarketPulseWidget />
          </div>
          <div className="h-48">
            <WatchlistWidget />
          </div>
        </div>
        
        <div className="h-48 w-full">
          <InsightsWidget />
        </div>

        {/* Main Feed */}
        <div className="pt-6">
          <PropertyFeed />
        </div>
      </div>

      {/* RIGHT COLUMN: Sticky Interactive Map */}
      {/* On mobile, this will stack. On LG screens, it sticks to the viewport. */}
      <div className="lg:col-span-5 xl:col-span-6 relative">
        <div className="lg:sticky lg:top-0 lg:h-[calc(100vh-6rem)] h-[500px] w-full rounded-xl overflow-hidden shadow-2xl border border-white/5 relative z-10 flex flex-col">
          <DistrictHeatmapWidget />
        </div>
      </div>
    </div>
  );
}
