"use client";

import { useState } from "react";
import { Search, Sparkles, X, Loader2, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

const SUGGESTIONS = [
  "Find undervalued condos under SGD 1.5M near MRT",
  "Top rental yield in District 15",
  "Hold or sell my current HDB in Tampines?",
];

// Mock parsed tokens based on a complex query
const MOCK_TOKENS = [
  { label: "Intent", value: "Search Buy", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  { label: "Asset", value: "Condo", color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" },
  { label: "Budget", value: "< 1.5M SGD", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  { label: "Location", value: "Near MRT", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  { label: "Strategy", value: "Undervalued", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
];

export function AiCommandBar() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'parsed'>('idle');

  const handleAnalyze = () => {
    if (!query.trim()) return;
    setStatus('analyzing');
    // Simulate network delay for NLP processing
    setTimeout(() => {
      setStatus('parsed');
    }, 1500);
  };

  const handleClear = () => {
    setQuery("");
    setStatus('idle');
  };

  const handleSuggestionClick = (text: string) => {
    setQuery(text);
    setStatus('analyzing');
    setTimeout(() => {
      setStatus('parsed');
    }, 1500);
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto mb-8 group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/50 to-yellow-200/50 rounded-xl blur-md opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
      
      <div className="relative glass-panel rounded-xl p-2 transition-all">
        {/* Input Area */}
        <div className="flex items-center">
          <Sparkles className={`w-5 h-5 ml-3 mr-2 ${status === 'analyzing' ? 'text-amber-400 animate-spin' : 'text-amber-500/70'}`} />
          
          <div className="flex-1 overflow-hidden relative h-10">
            <AnimatePresence mode="wait">
              {status === 'parsed' ? (
                <motion.div 
                  key="parsed"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute inset-0 flex items-center gap-2 overflow-x-auto whitespace-nowrap px-2 scrollbar-hide"
                >
                  {MOCK_TOKENS.map((token, idx) => (
                    <Badge key={idx} variant="outline" className={`px-2 py-1 flex items-center gap-1.5 ${token.color}`}>
                      <span className="opacity-70 text-[10px] uppercase tracking-wider">{token.label}</span>
                      <span className="font-semibold text-xs">{token.value}</span>
                    </Badge>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="input"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute inset-0"
                >
                  <Input 
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                    disabled={status === 'analyzing'}
                    placeholder="e.g. Find undervalued 2-bedroom condos under SGD 1.4M near MRT..."
                    className="h-full border-0 bg-transparent text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 text-base placeholder:text-muted-foreground disabled:opacity-50"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {status === 'parsed' ? (
            <Button variant="ghost" onClick={handleClear} className="text-zinc-400 hover:text-zinc-100 px-3">
              <X className="w-4 h-4 mr-2" />
              Clear
            </Button>
          ) : (
            <Button 
              onClick={handleAnalyze} 
              disabled={!query.trim() || status === 'analyzing'}
              className="bg-amber-500 hover:bg-amber-400 text-amber-950 rounded-lg px-6 font-semibold shadow-[0_0_15px_rgba(245,158,11,0.4)] disabled:opacity-50 transition-all"
            >
              {status === 'analyzing' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              {status === 'analyzing' ? 'Processing...' : 'Analyze'}
            </Button>
          )}
        </div>
      </div>

      {/* Suggestion Prompts */}
      <AnimatePresence>
        {status === 'idle' && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-wrap items-center gap-2 mt-4 px-2"
          >
            <span className="text-xs text-zinc-500 mr-1 flex items-center">
              <LightbulbIcon className="w-3 h-3 mr-1" /> Try asking:
            </span>
            {SUGGESTIONS.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(suggestion)}
                className="text-xs text-zinc-400 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 rounded-full px-3 py-1.5 transition-colors text-left"
              >
                {suggestion}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LightbulbIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1.3.5 2.6 1.5 3.5.8.8 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </svg>
  );
}
