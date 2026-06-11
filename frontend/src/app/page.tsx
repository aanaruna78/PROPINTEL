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
      <div className="lg:col-span-7 xl:col-span-6 space-y-6 flex flex-col min-w-0">
        {/* Hero Text */}
        <div className="mb-6 pt-2">
          <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
            What is your <span className="text-gradient-indigo">property intent</span> today?
          </h1>
          <p className="text-muted-foreground text-sm">
            Our AI engines are continuously scanning the market for undervalued opportunities.
          </p>
        </div>

        {/* AI Command Bar */}
        <div className="w-full">
          <AiCommandBar />
        </div>

        {/* Quick Intelligence Widgets (Horizontal Scroll Row) */}
        <div className="flex flex-nowrap overflow-x-auto gap-4 pb-4 snap-x scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          <div className="w-[300px] lg:w-[320px] shrink-0 snap-start h-56">
            <MarketPulseWidget />
          </div>
          <div className="w-[300px] lg:w-[320px] shrink-0 snap-start h-56">
            <WatchlistWidget />
          </div>
          <div className="w-[300px] lg:w-[320px] shrink-0 snap-start h-56">
            <InsightsWidget />
          </div>
        </div>

        {/* Main Feed */}
        <div className="pt-6">
          <PropertyFeed />
        </div>
      </div>

      {/* RIGHT COLUMN: Sticky Interactive Map */}
      {/* On mobile, this will stack. On LG screens, it sticks to the viewport. */}
      <div className="lg:col-span-5 xl:col-span-6 relative min-w-0">
        <div className="lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] h-[500px] w-full rounded-xl overflow-hidden shadow-sm relative z-10 flex flex-col">
          <DistrictHeatmapWidget />
        </div>
      </div>
    </div>
  );
}
