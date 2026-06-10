"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, ArrowRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const MOCK_INSIGHTS = [
  { id: 1, text: "District 15 listings are currently 5% below fair value on average.", type: "opportunity" },
  { id: 2, text: "Rental demand in D09 has surged 12% following recent expat influx.", type: "trend" },
  { id: 3, text: "New cooling measures may stabilize D10 luxury segment in Q3.", type: "risk" },
];

export function InsightsWidget() {
  return (
    <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-zinc-400 flex items-center">
          <Lightbulb className="w-4 h-4 mr-2 text-yellow-400" />
          AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-6 pb-4">
          <div className="flex flex-col gap-3 mt-2">
            {MOCK_INSIGHTS.map((insight) => (
              <div key={insight.id} className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50 hover:bg-zinc-800 transition-colors group cursor-pointer">
                <p className="text-sm text-zinc-300 leading-relaxed">{insight.text}</p>
                <div className="flex items-center text-xs text-indigo-400 mt-2 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Explore <ArrowRight className="w-3 h-3 ml-1" />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
