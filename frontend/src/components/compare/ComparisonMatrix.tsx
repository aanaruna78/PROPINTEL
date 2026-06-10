import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

export function ComparisonMatrix() {
  return (
    <div className="overflow-x-auto pb-4">
      <table className="w-full text-left border-collapse min-w-[600px]">
        <thead>
          <tr>
            <th className="p-4 border-b border-zinc-800 text-zinc-400 font-medium w-1/4">Metric</th>
            <th className="p-4 border-b border-zinc-800 text-zinc-100 font-bold w-3/8 text-lg">
              Marina One Residences
            </th>
            <th className="p-4 border-b border-zinc-800 text-zinc-100 font-bold w-3/8 text-lg">
              The Sail @ Marina Bay
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/50">
          <tr className="hover:bg-zinc-900/30 transition-colors">
            <td className="p-4 text-zinc-400">Best Buy Score</td>
            <td className="p-4"><Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-base py-1 px-3">94 / 100</Badge></td>
            <td className="p-4"><Badge className="bg-zinc-800 text-zinc-300 border-zinc-700 text-base py-1 px-3">88 / 100</Badge></td>
          </tr>
          
          <tr className="hover:bg-zinc-900/30 transition-colors">
            <td className="p-4 text-zinc-400">Current Ask</td>
            <td className="p-4 text-zinc-100 font-medium">$1.85M</td>
            <td className="p-4 text-zinc-100 font-medium">$1.42M</td>
          </tr>
          
          <tr className="hover:bg-zinc-900/30 transition-colors">
            <td className="p-4 text-zinc-400">Fair Value Estimate</td>
            <td className="p-4 text-zinc-300">$1.95M <span className="text-emerald-400 text-xs ml-2">(Undervalued 5.2%)</span></td>
            <td className="p-4 text-zinc-300">$1.45M <span className="text-emerald-400 text-xs ml-2">(Undervalued 2.1%)</span></td>
          </tr>
          
          <tr className="hover:bg-zinc-900/30 transition-colors">
            <td className="p-4 text-zinc-400">Rental Yield</td>
            <td className="p-4 text-zinc-300 flex items-center">4.8% <TrendingUp className="w-4 h-4 ml-2 text-emerald-400" /></td>
            <td className="p-4 text-zinc-300 flex items-center">4.2% <TrendingDown className="w-4 h-4 ml-2 text-rose-400" /></td>
          </tr>

          <tr className="hover:bg-zinc-900/30 transition-colors">
            <td className="p-4 text-zinc-400 align-top pt-5">Key Risks</td>
            <td className="p-4">
              <div className="flex items-center text-sm text-zinc-300 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mr-2" /> High liquidity
              </div>
              <div className="flex items-center text-sm text-zinc-300">
                <AlertTriangle className="w-4 h-4 text-amber-400 mr-2" /> Upcoming supply in 2027
              </div>
            </td>
            <td className="p-4">
              <div className="flex items-center text-sm text-zinc-300 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 mr-2" /> Leasehold decay
              </div>
              <div className="flex items-center text-sm text-zinc-300">
                <AlertTriangle className="w-4 h-4 text-amber-400 mr-2" /> High maintenance fees
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
