"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const MOCK_PROPERTIES = [
  {
    id: "PROP-001",
    name: "Marina One Residences",
    district: "D01",
    price: 1850000,
    bedrooms: 2,
    size: 1100,
    bestBuyScore: 94,
    valuationDiff: -5.2, // undervalued by 5.2%
    yield: 4.8,
  },
  {
    id: "PROP-002",
    name: "The Sail @ Marina Bay",
    district: "D01",
    price: 1420000,
    bedrooms: 1,
    size: 680,
    bestBuyScore: 88,
    valuationDiff: -2.1,
    yield: 4.2,
  },
  {
    id: "PROP-003",
    name: "Reflections at Keppel Bay",
    district: "D04",
    price: 2100000,
    bedrooms: 3,
    size: 1500,
    bestBuyScore: 76,
    valuationDiff: 1.5,
    yield: 3.5,
  }
];

export function PropertyFeed() {
  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-100 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-indigo-400" />
          Top AI Recommendations
        </h2>
        <span className="text-xs text-zinc-500">Ranked by Best Buy Score</span>
      </div>
      
      <div className="grid gap-4">
        {MOCK_PROPERTIES.map((prop) => (
          <Card key={prop.id} className="bg-zinc-900/80 border-zinc-800 hover:border-indigo-500/50 transition-colors cursor-pointer group overflow-hidden">
            <CardContent className="p-0 flex flex-col sm:flex-row">
              {/* Image Placeholder */}
              <div className="w-full sm:w-48 h-48 sm:h-auto bg-zinc-800 flex items-center justify-center relative overflow-hidden">
                <Building2 className="w-10 h-10 text-zinc-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent sm:bg-gradient-to-r" />
                <Badge className="absolute top-2 left-2 bg-indigo-500/20 text-indigo-300 border-indigo-500/30 font-semibold backdrop-blur-md">
                  Score: {prop.bestBuyScore}
                </Badge>
              </div>
              
              {/* Content */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-base font-bold text-zinc-100 group-hover:text-indigo-400 transition-colors">{prop.name}</h3>
                      <p className="text-sm text-zinc-400 flex items-center mt-1">
                        <MapPin className="w-3 h-3 mr-1" /> {prop.district} • {prop.bedrooms} Bed • {prop.size} sqft
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-zinc-100">
                        ${(prop.price / 1000000).toFixed(2)}M
                      </div>
                      <div className={`text-xs font-medium mt-1 ${prop.valuationDiff < 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {prop.valuationDiff < 0 ? '↓' : '↑'} {Math.abs(prop.valuationDiff)}% vs Fair Value
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800/50">
                  <div className="flex gap-4 text-sm">
                    <div className="flex flex-col">
                      <span className="text-zinc-500 text-xs">Est. Yield</span>
                      <span className="text-zinc-300 font-medium">{prop.yield}%</span>
                    </div>
                  </div>
                  <Button size="sm" variant="secondary" className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border-0">
                    View Intelligence
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
