"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bookmark, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

const MOCK_WATCHLIST = [
  { id: 1, name: "OUE Twin Peaks", price: "2.1M", status: "Price Dropped" },
  { id: 2, name: "Martin Modern", price: "3.4M", status: "Stable" },
];

export function WatchlistWidget() {
  return (
    <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm h-full flex flex-col">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-zinc-400 flex items-center">
          <Bookmark className="w-4 h-4 mr-2 text-cyan-400" />
          Watchlist
        </CardTitle>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-500 hover:text-zinc-300">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-3 mt-2">
          {MOCK_WATCHLIST.map((item) => (
            <div key={item.id} className="flex justify-between items-center p-2 rounded hover:bg-zinc-800/50 cursor-pointer transition-colors">
              <div>
                <p className="text-sm font-medium text-zinc-200">{item.name}</p>
                <p className={`text-xs ${item.status.includes('Drop') ? 'text-emerald-400' : 'text-zinc-500'}`}>{item.status}</p>
              </div>
              <div className="text-sm font-bold text-zinc-300">
                ${item.price}
              </div>
            </div>
          ))}
          <Button variant="outline" className="w-full mt-4 text-xs bg-transparent border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200">
            View Full List
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
