"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Sparkles, Send, Bot, User as UserIcon, Loader2,
  Building2, Landmark, TrendingUp, Percent, Clock,
  Flame, ArrowRight, MapPin, AlertCircle, RefreshCw
} from "lucide-react";
import Link from "next/link";

interface ChatMessage {
  role: "user" | "assistant";
  content: str;
  metadata?: any;
}

const QUICK_PROMPTS = [
  { label: "Find properties in D01", query: "Find properties in D01" },
  { label: "Show Reflections at Keppel Bay", query: "Show Reflections at Keppel Bay" },
  { label: "What's Tampines 4-Room HDB yield?", query: "What is the HDB market intelligence for Tampines 4-Room flats?" },
  { label: "Show current market pulse", query: "What is the overall market pulse and momentum?" }
];

export default function ChatAdvisorPage() {
  const { token, user, refreshSession } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | None>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Initial welcome message tailored to user role
  useEffect(() => {
    if (user) {
      setMessages([
        {
          role: "assistant",
          content: `Hello **${user.full_name}**! I am your AI Property Advisor.\n\nI can help you navigate the Singapore real estate market. You can ask me to:\n1. **Search Property Projects**: Try *'Find properties in D01'* or *'Show me Reflections at Keppel Bay'*.\n2. **View HDB Market Intelligence**: Try *'Show HDB stats for Punggol 5-Room'* or *'What is Yishun 4-Room rental yield?'*.\n3. **Analyze Market Trends**: Try *'What is the current market pulse?'* or *'Show overall market momentum'*.\n\nSince you are logged in as a **${user.role}** account, I will customize my answers for you!`
        }
      ]);
    }
  }, [user]);

  // Scroll to bottom whenever messages list changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (messageText: string) => {
    if (!messageText.trim() || !token) return;
    setError(null);
    setIsLoading(true);

    const newUserMessage: ChatMessage = {
      role: "user",
      content: messageText
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInputValue("");

    try {
      let activeToken = token;
      
      // Perform token validation and get response
      let response = await fetch(`${API_URL}/api/v1/chat/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`
        },
        body: JSON.stringify({
          message: messageText,
          history: messages.map((m) => ({
            role: m.role,
            content: m.content,
            metadata: m.metadata || null
          }))
        })
      });

      if (response.status === 401) {
        const newToken = await refreshSession();
        if (newToken) {
          activeToken = newToken;
          response = await fetch(`${API_URL}/api/v1/chat/message`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${activeToken}`
            },
            body: JSON.stringify({
              message: messageText,
              history: messages.map((m) => ({
                role: m.role,
                content: m.content,
                metadata: m.metadata || null
              }))
            })
          });
        } else {
          throw new Error("Session expired. Please log in again.");
        }
      }

      if (!response.ok) {
        throw new Error("Failed to retrieve advisor analysis.");
      }

      const responseData = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: responseData.response,
          metadata: responseData.metadata
        }
      ]);
    } catch (err: any) {
      console.error("Chat message processing failed:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(inputValue);
    }
  };

  // Helper to format currency
  const formatSGD = (val: number) => {
    return new Intl.NumberFormat("en-SG", {
      style: "currency",
      currency: "SGD",
      maximumFractionDigits: 0
    }).format(val);
  };

  // Lightweight custom markdown parser to convert basic bold/bullet styles to HTML
  const parseMarkdown = (text: string) => {
    if (!text) return "";
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    
    // Bold: **text**
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    
    // Italics/Emphasis: *text*
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
    
    // Headers: ### text
    html = html.replace(/^### (.*?)$/gm, '<h3 class="text-base font-bold text-foreground mt-3 mb-1.5">$1</h3>');
    
    // Unordered lists: - text
    html = html.replace(/^- (.*?)$/gm, '<li class="ml-4 list-disc text-muted-foreground">$1</li>');
    
    // Line breaks
    html = html.replace(/\n/g, "<br />");
    
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col h-[calc(100vh-8.5rem)] min-h-[450px]">
      
      {/* Top Banner Header */}
      <div className="flex items-center justify-between border-b border-border pb-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm relative">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-background rounded-full animate-ping" />
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-background rounded-full" />
          </div>
          <div>
            <h1 className="text-xl font-black text-foreground flex items-center gap-1.5">
              AI Conversational Property Advisor
            </h1>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
              Autonomous real estate intelligence assistant
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-400/5 border border-emerald-400/10 rounded-full px-3 py-1">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          Active Context Mode
        </div>
      </div>

      {/* Main Messaging Window */}
      <div className="flex-1 overflow-y-auto py-6 space-y-6 min-h-0 pr-1 select-text">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex gap-3 max-w-[85%] ${
              msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            }`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold shadow-sm border ${
              msg.role === "user"
                ? "bg-primary/10 border-primary/20 text-primary"
                : "bg-muted border-border text-muted-foreground"
            }`}>
              {msg.role === "user" ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4 text-primary" />}
            </div>

            {/* Bubble */}
            <div className="space-y-4 flex-1">
              <div className={`rounded-xl p-4 text-sm leading-relaxed border shadow-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground border-primary/30 font-medium"
                  : "bg-card/70 backdrop-blur-md border-border/80 text-foreground"
              }`}>
                {msg.role === "user" ? msg.content : parseMarkdown(msg.content)}
              </div>

              {/* Inline Rich Widgets based on Metadata */}
              {msg.role === "assistant" && msg.metadata && (
                <div className="space-y-3">
                  
                  {/* WIDGET: Property list search */}
                  {msg.metadata.properties && (
                    <div className="w-full">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">Discovered Private Properties</span>
                      <div className="flex overflow-x-auto pb-3 gap-4 scrollbar-thin">
                        {msg.metadata.properties.map((prop: any) => (
                          <div
                            key={prop.id}
                            className="w-72 shrink-0 bg-card border border-border/80 rounded-xl p-4 shadow-sm hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded text-[9px] font-bold uppercase">
                                  {prop.project_type}
                                </span>
                                <span className="text-[10px] font-bold text-muted-foreground">
                                  {prop.district}
                                </span>
                              </div>
                              <h4 className="font-black text-foreground text-sm truncate">{prop.name}</h4>
                              <p className="text-[10px] text-muted-foreground mt-1 truncate">
                                Developer: {prop.developer || "Unknown"}
                              </p>
                              
                              <div className="grid grid-cols-2 gap-3 mt-4">
                                <div className="bg-muted/10 border border-border/40 rounded p-2">
                                  <span className="text-[8px] text-muted-foreground font-bold uppercase block">Est. PSF</span>
                                  <span className="text-xs font-extrabold text-foreground mt-0.5 block">
                                    {prop.fair_value_psf ? `${formatSGD(prop.fair_value_psf)}` : "N/A"}
                                  </span>
                                </div>
                                <div className="bg-muted/10 border border-border/40 rounded p-2">
                                  <span className="text-[8px] text-muted-foreground font-bold uppercase block">Rental Yield</span>
                                  <span className="text-xs font-extrabold text-primary mt-0.5 block flex items-center gap-0.5">
                                    <Percent className="w-3 h-3" />
                                    {prop.rental_yield_estimate}%
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                              <span className="text-[9px] text-muted-foreground font-semibold">
                                Completed {prop.completion_year || "N/A"}
                              </span>
                              <Link
                                href="/compare"
                                className="bg-primary hover:bg-indigo-700 text-primary-foreground text-[10px] font-bold py-1 px-3 rounded-lg transition-all flex items-center gap-1 shadow-sm shrink-0"
                              >
                                Compare
                                <ArrowRight className="w-3 h-3" />
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* WIDGET: HDB town intelligence */}
                  {msg.metadata.hdb_intel && (
                    <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm space-y-4 max-w-xl">
                      <div className="flex items-center justify-between border-b border-border/60 pb-3">
                        <div className="flex items-center gap-2">
                          <Landmark className="w-5 h-5 text-primary" />
                          <div>
                            <h4 className="font-black text-foreground text-sm">HDB Town Analysis</h4>
                            <p className="text-[9px] text-muted-foreground font-semibold uppercase">{msg.metadata.hdb_intel.town} / {msg.metadata.hdb_intel.flat_type}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded font-bold text-[9px] border ${
                          msg.metadata.hdb_intel.liquidity?.rating === "High"
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                            : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                        }`}>
                          {msg.metadata.hdb_intel.liquidity?.rating} Liquidity
                        </span>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-muted/10 border border-border/40 rounded-lg p-3">
                          <span className="text-[8px] font-bold text-muted-foreground uppercase block">Avg rent</span>
                          <span className="text-sm font-black text-foreground block mt-0.5">
                            {formatSGD(msg.metadata.hdb_intel.rental_analysis?.avg_rent)}/mo
                          </span>
                        </div>
                        <div className="bg-muted/10 border border-border/40 rounded-lg p-3">
                          <span className="text-[8px] font-bold text-muted-foreground uppercase block">Rental Yield</span>
                          <span className="text-sm font-black text-primary block mt-0.5">
                            {msg.metadata.hdb_intel.rental_analysis?.rental_yield}%
                          </span>
                        </div>
                        <div className="bg-muted/10 border border-border/40 rounded-lg p-3">
                          <span className="text-[8px] font-bold text-muted-foreground uppercase block">Avg Days On Market</span>
                          <span className="text-sm font-black text-foreground block mt-0.5 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                            {msg.metadata.hdb_intel.liquidity?.avg_days_on_market}d
                          </span>
                        </div>
                      </div>

                      {/* Resale Trends snippet */}
                      {msg.metadata.hdb_intel.resale_trends && (
                        <div className="border border-border/60 rounded-lg overflow-hidden">
                          <table className="w-full text-left border-collapse text-[10px]">
                            <thead>
                              <tr className="bg-muted/30 border-b border-border/60 text-muted-foreground font-bold">
                                <th className="p-2">Quarter</th>
                                <th className="p-2 text-right">Avg Price</th>
                                <th className="p-2 text-right">Avg PSF</th>
                                <th className="p-2 text-right">Volume</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                              {msg.metadata.hdb_intel.resale_trends.map((t: any) => (
                                <tr key={t.quarter} className="hover:bg-muted/10">
                                  <td className="p-2 font-bold text-foreground">{t.quarter}</td>
                                  <td className="p-2 text-right font-semibold text-foreground">{formatSGD(t.avg_price)}</td>
                                  <td className="p-2 text-right text-muted-foreground">${t.avg_psf} psf</td>
                                  <td className="p-2 text-right text-foreground font-medium">{t.volume} sales</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* WIDGET: Market pulse index */}
                  {msg.metadata.market_pulse && (
                    <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm space-y-4 max-w-md">
                      <div className="flex items-center justify-between border-b border-border/60 pb-3">
                        <div className="flex items-center gap-2">
                          <Flame className="w-5 h-5 text-indigo-500 animate-pulse" />
                          <div>
                            <h4 className="font-black text-foreground text-sm">Real Estate Market Pulse</h4>
                            <p className="text-[9px] text-muted-foreground font-semibold uppercase">Latest singapore aggregated metrics</p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded font-bold text-[9px] border ${
                          msg.metadata.market_pulse.market_momentum === "bullish"
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                            : (msg.metadata.market_pulse.market_momentum === "bearish" ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400")
                        }`}>
                          {msg.metadata.market_pulse.market_momentum.toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted/10 border border-border/40 rounded-lg p-3">
                          <span className="text-[8px] font-bold text-muted-foreground uppercase block">URA Price Index Proxy</span>
                          <span className="text-lg font-black text-foreground mt-0.5 block">
                            {msg.metadata.market_pulse.ura_property_index}
                          </span>
                          <span className={`text-[9px] font-bold mt-1 block flex items-center gap-0.5 ${
                            msg.metadata.market_pulse.ura_index_change >= 0 ? "text-emerald-400" : "text-rose-400"
                          }`}>
                            <TrendingUp className="w-3 h-3" />
                            {msg.metadata.market_pulse.ura_index_change >= 0 ? "+" : ""}{msg.metadata.market_pulse.ura_index_change}% MoM
                          </span>
                        </div>

                        <div className="bg-muted/10 border border-border/40 rounded-lg p-3">
                          <span className="text-[8px] font-bold text-muted-foreground uppercase block">Average Rental Yield</span>
                          <span className="text-lg font-black text-primary mt-0.5 block">
                            {msg.metadata.market_pulse.avg_rental_yield}%
                          </span>
                          <span className="text-[9px] text-muted-foreground font-semibold block mt-1">
                            Condo sector baseline
                          </span>
                        </div>
                      </div>

                      {/* Top mover */}
                      <div className="bg-muted/20 border border-border/60 rounded-lg p-3 text-xs flex items-center justify-between gap-3">
                        <div>
                          <span className="text-[8px] font-bold text-muted-foreground uppercase block">Top District Mover</span>
                          <span className="font-extrabold text-foreground block mt-0.5">
                            {msg.metadata.market_pulse.top_mover?.district} — {msg.metadata.market_pulse.top_mover?.name}
                          </span>
                        </div>
                        <span className="text-xs font-black text-emerald-400 text-right shrink-0">
                          +{msg.metadata.market_pulse.top_mover?.price_movement_percent}%
                        </span>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          </div>
        ))}

        {/* Animated Bot Typing indicator */}
        {isLoading && (
          <div className="flex gap-3 max-w-[85%] mr-auto">
            <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold border bg-muted border-border text-muted-foreground">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-card/70 backdrop-blur-md border border-border/80 rounded-xl p-4 text-sm text-foreground flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
              <span className="text-xs font-bold text-muted-foreground animate-pulse">
                Advisor is scanning real estate intelligence...
              </span>
            </div>
          </div>
        )}

        {/* Error notice */}
        {error && (
          <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-4 flex items-center gap-3 text-xs text-rose-500 max-w-[85%] mx-auto">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div className="flex-1">
              <span className="font-bold">Transaction Analysis Failed:</span> {error}
            </div>
            <button
              onClick={() => handleSend(messages[messages.length - 1]?.content || "")}
              className="p-1 hover:bg-rose-500/10 rounded transition-colors"
              title="Retry last query"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested actions chips */}
      {messages.length <= 2 && !isLoading && (
        <div className="pb-4 shrink-0">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">Suggested Inquiries</span>
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt.query)}
                className="bg-card hover:bg-muted border border-border rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                {prompt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input box */}
      <div className="pt-2 border-t border-border shrink-0 pb-2">
        <div className="relative flex items-center glass-panel rounded-xl p-1 bg-card/65 border border-border/80 shadow-md">
          <div className="pl-3 pr-2 text-muted-foreground shrink-0">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          </div>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder={
              isLoading
                ? "Waiting for property advisor analysis..."
                : "Ask about properties, HDB town data, rental yields, or market trends..."
            }
            className="flex-1 bg-transparent border-0 py-3 text-xs text-foreground focus:outline-none focus:ring-0 placeholder:text-muted-foreground/60 min-w-0"
          />
          <button
            onClick={() => handleSend(inputValue)}
            disabled={isLoading || !inputValue.trim()}
            className="bg-primary hover:bg-indigo-700 disabled:bg-muted disabled:text-muted-foreground/40 text-primary-foreground p-2.5 rounded-lg transition-all shrink-0 cursor-pointer shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[9px] text-muted-foreground text-center mt-2 font-medium">
          PROPINTEL AI Advisor parses transaction registers & dynamic valuations.
        </p>
      </div>

    </div>
  );
}
