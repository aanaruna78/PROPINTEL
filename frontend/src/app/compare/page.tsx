import { ComparativeRadarChart } from "@/components/compare/ComparativeRadarChart";
import { ComparisonMatrix } from "@/components/compare/ComparisonMatrix";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ComparePage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/" className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-zinc-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Property Comparison</h1>
          <p className="text-zinc-500 text-sm">Deep dive intelligence analysis</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Radar Chart Section */}
        <div className="lg:col-span-5 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 flex flex-col">
          <h2 className="text-lg font-semibold text-zinc-100 mb-6">AI Metric Breakdown</h2>
          <div className="flex-1">
            <ComparativeRadarChart />
          </div>
        </div>

        {/* Matrix Section */}
        <div className="lg:col-span-7 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 overflow-hidden">
          <h2 className="text-lg font-semibold text-zinc-100 mb-6">Quantitative Matrix</h2>
          <ComparisonMatrix />
        </div>
      </div>
    </div>
  );
}
