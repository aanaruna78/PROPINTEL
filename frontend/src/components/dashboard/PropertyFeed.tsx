"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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
      <div className="flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-10 py-2 border-b border-border/50">
        <h2 className="text-lg font-semibold text-foreground flex items-center">
          <Building2 className="w-5 h-5 mr-2 text-primary" />
          Recommended Properties
        </h2>
        <span className="text-xs text-muted-foreground">Ranked by Best Buy Score</span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-2">
        {MOCK_PROPERTIES.map((prop) => (
          <Card key={prop.id} className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer group overflow-hidden shadow-sm flex flex-col">
            {/* Image Placeholder */}
            <div className="w-full h-40 bg-muted flex items-center justify-center relative overflow-hidden shrink-0">
              <Building2 className="w-10 h-10 text-muted-foreground/30" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <Badge className="absolute top-2 left-2 bg-primary/20 text-primary border-primary/30 font-semibold backdrop-blur-md">
                Score: {prop.bestBuyScore}
              </Badge>
            </div>
            
            {/* Content */}
            <div className="flex-1 p-4 flex flex-col justify-between">
              <div>
                <div className="flex flex-col items-start gap-1">
                  <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">{prop.name}</h3>
                  <p className="text-xs text-muted-foreground flex items-center">
                    <MapPin className="w-3 h-3 mr-1 shrink-0" /> <span className="truncate">{prop.district} • {prop.bedrooms} Bed • {prop.size} sqft</span>
                  </p>
                </div>
                <div className="mt-3">
                  <div className="text-lg font-bold text-foreground">
                    ${(prop.price / 1000000).toFixed(2)}M
                  </div>
                  <div className={`text-xs font-medium mt-1 ${prop.valuationDiff < 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {prop.valuationDiff < 0 ? '↓' : '↑'} {Math.abs(prop.valuationDiff)}% vs Fair Value
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Est. Yield</span>
                  <span className="text-foreground text-sm font-medium">{prop.yield}%</span>
                </div>
                <Link href="/compare" onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" variant="secondary" className="bg-secondary hover:bg-secondary/80 text-foreground border-0 text-xs h-8">
                    Intelligence
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
