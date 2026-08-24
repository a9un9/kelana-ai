"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

type TripResult = {
  id?: number;
  destination: string;
  days: number;
  budget: number;
  travel_style: string;
  daily_budget: number;
  category: string;
  recommendation_transport: string;
};

type DaySection = {
  title: string;
  morning: string;
  afternoon: string;
  evening: string;
  other: string;
};

/** Parse AI markdown into per-day sections with morning/afternoon/evening columns */
function parseItinerary(markdown: string): { intro: string; days: DaySection[] } {
  const lines = markdown.split("\n");
  const days: DaySection[] = [];
  let intro = "";
  let currentDay: DaySection | null = null;
  let currentSection: "morning" | "afternoon" | "evening" | "other" | "intro" = "intro";
  const introLines: string[] = [];

  for (const line of lines) {
    const isDay = /^#{1,2}\s+day\s+\d+/i.test(line);
    const isMorning = /^#{2,3}\s+morning/i.test(line);
    const isAfternoon = /^#{2,3}\s+afternoon/i.test(line);
    const isEvening = /^#{2,3}\s+(evening|night)/i.test(line);

    if (isDay) {
      if (currentDay) days.push(currentDay);
      currentDay = { title: line.replace(/^#+\s*/, ""), morning: "", afternoon: "", evening: "", other: "" };
      currentSection = "other";
    } else if (isMorning && currentDay) {
      currentSection = "morning";
    } else if (isAfternoon && currentDay) {
      currentSection = "afternoon";
    } else if (isEvening && currentDay) {
      currentSection = "evening";
    } else if (currentDay) {
      currentDay[currentSection === "intro" ? "other" : currentSection] += line + "\n";
    } else {
      introLines.push(line);
    }
  }

  if (currentDay) days.push(currentDay);
  intro = introLines.join("\n").trim();

  return { intro, days };
}

const sectionLabel: Record<string, { label: string; color: string; bg: string }> = {
  morning:   { label: "🌅 Morning",   color: "text-amber-700",  bg: "bg-amber-50 border-amber-100" },
  afternoon: { label: "☀️ Afternoon", color: "text-orange-700", bg: "bg-orange-50 border-orange-100" },
  evening:   { label: "🌙 Evening",   color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-100" },
};

function ItineraryRenderer({ markdown }: { markdown: string }) {
  const { intro, days } = parseItinerary(markdown);

  // Fallback: if no days parsed, render plain markdown
  if (days.length === 0) {
    return (
      <div className="prose prose-sm max-w-none prose-headings:text-zinc-800 prose-h2:text-indigo-700 prose-li:text-zinc-600">
        <ReactMarkdown>{markdown}</ReactMarkdown>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Intro section (budget breakdown etc) */}
      {intro && (
        <div className="prose prose-sm max-w-none prose-p:text-zinc-600 prose-strong:text-zinc-800 prose-li:text-zinc-600">
          <ReactMarkdown>{intro}</ReactMarkdown>
        </div>
      )}

      {/* Per-day cards */}
      {days.map((day, i) => (
        <div key={i} className="rounded-xl border border-zinc-100 overflow-hidden shadow-sm">
          {/* Day header */}
          <div className="bg-indigo-600 px-5 py-3">
            <h3 className="text-sm font-bold text-white">{day.title}</h3>
          </div>

          {/* 3-column grid */}
          <div className="grid grid-cols-3 divide-x divide-zinc-100">
            {(["morning", "afternoon", "evening"] as const).map((period) => {
              const content = day[period].trim();
              const meta = sectionLabel[period];
              return (
                <div key={period} className={`p-4 ${meta.bg} border-t border-zinc-100`}>
                  <p className={`text-xs font-bold mb-2 ${meta.color}`}>{meta.label}</p>
                  {content ? (
                    <div className="prose prose-xs max-w-none
                      prose-p:text-zinc-600 prose-p:text-xs prose-p:my-0.5 prose-p:leading-relaxed
                      prose-ul:pl-3 prose-ul:my-1
                      prose-li:text-zinc-600 prose-li:text-xs prose-li:my-0.5
                      prose-strong:text-zinc-700 prose-strong:font-semibold
                    ">
                      <ReactMarkdown>{content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400 italic">—</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Other content per day (transportation, food, etc) */}
          {day.other.trim() && (
            <div className="px-5 py-3 bg-white border-t border-zinc-100">
              <div className="prose prose-xs max-w-none prose-p:text-zinc-500 prose-p:text-xs prose-li:text-zinc-500 prose-li:text-xs prose-strong:text-zinc-700">
                <ReactMarkdown>{day.other}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [form, setForm] = useState({
    destination: "",
    budget: "",
    days: "",
    travel_style: "",
  });
  const [result, setResult] = useState<TripResult | null>(null);
  const [aiRec, setAiRec] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    setAiRec("");

    try {
      const res = await fetch("http://localhost:8000/api/v1/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: form.destination,
          days: Number(form.days),
          budget: Number(form.budget),
          travel_style: form.travel_style,
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Server error ${res.status}: ${errBody}`);
      }

      const data: TripResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!result?.id) return;
    setLoadingAI(true);
    setError("");

    try {
      const res = await fetch(
        `http://localhost:8000/api/v1/trips/${result.id}/generate`,
        { method: "POST" }
      );

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`AI error ${res.status}: ${errBody}`);
      }

      const data = await res.json();
      setAiRec(data.recommendation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI generation failed.");
    } finally {
      setLoadingAI(false);
    }
  };

  const categoryColor: Record<string, string> = {
    Backpacker: "bg-emerald-100 text-emerald-700",
    Standard: "bg-blue-100 text-blue-700",
    Luxury: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-200 selection:text-indigo-900">
      
      {/* Hero Section */}
      <div className="relative w-full h-[500px] md:h-[550px] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop" 
          alt="Beautiful Tropical Beach" 
          className="absolute inset-0 w-full h-full object-cover" 
        />
        {/* Gradient Overlay for seamless transition */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/40 to-slate-50"></div>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-4 text-center mt-[-100px]">
          <span className="mb-4 inline-block py-1.5 px-4 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-xs font-bold tracking-widest uppercase shadow-lg">Discover Your Next Journey</span>
          <h1 className="text-5xl md:text-7xl font-black mb-6 drop-shadow-2xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-white">
            KelanaAI
          </h1>
          <p className="text-lg md:text-xl max-w-2xl drop-shadow-lg font-medium text-slate-100">
            Crafting personalized, AI-driven itineraries in seconds. Skip the planning, start exploring.
          </p>
        </div>
      </div>

      {/* Main Application Area */}
      <div className="flex-1 w-full max-w-[1600px] mx-auto px-4 md:px-8 -mt-40 md:-mt-52 relative z-10 pb-24">
        <div className={`flex flex-col md:flex-row gap-8 w-full transition-all duration-700 ease-out mx-auto ${result ? "max-w-[1600px]" : "max-w-[440px]"}`}>

          {/* Left — Form */}
          <div className="w-full rounded-lg md:w-96 flex-shrink-0 bg-white/95 backdrop-blur-2xl border border-white/60 rounded-[2rem] p-6 md:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] self-start">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-extrabold bg-gradient-to-br from-indigo-600 to-violet-600 bg-clip-text text-transparent">Plan Your Trip</h2>
              <p className="text-sm text-slate-500 mt-2 font-medium">Where is your dream destination?</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-indigo-900/60 ml-1">Destination</label>
                <input type="text" name="destination" value={form.destination} onChange={handleChange}
                  placeholder="e.g. Kyoto, Japan" required
                  className="w-full border-2 border-slate-100 rounded-lg px-4 py-3.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 bg-slate-50 focus:bg-white transition-all duration-300 font-semibold" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-indigo-900/60 ml-1">Budget ($)</label>
                  <input type="number" name="budget" value={form.budget} onChange={handleChange}
                    placeholder="2000" min={1} required
                    className="w-full border-2 border-slate-100 rounded-lg px-4 py-3.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 bg-slate-50 focus:bg-white transition-all duration-300 font-semibold" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-indigo-900/60 ml-1">Days</label>
                  <input type="number" name="days" value={form.days} onChange={handleChange}
                    placeholder="5" min={1} required
                    className="w-full border-2 border-slate-100 rounded-lg px-4 py-3.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 bg-slate-50 focus:bg-white transition-all duration-300 font-semibold" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-indigo-900/60 ml-1">Travel Style</label>
                <input type="text" name="travel_style" value={form.travel_style} onChange={handleChange}
                  placeholder="e.g. Relaxing, Adventure" required
                  className="w-full border-2 border-slate-100 rounded-lg px-4 py-3.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 bg-slate-50 focus:bg-white transition-all duration-300 font-semibold" />
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 border border-red-100 rounded-lg px-4 py-3 text-sm flex items-start gap-3 mt-1">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="font-semibold break-words">{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="mt-4 w-full rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-70 text-white font-bold text-base py-4 transition-all duration-300 shadow-[0_8px_20px_-6px_rgba(99,102,241,0.6)] hover:shadow-[0_12px_25px_-6px_rgba(99,102,241,0.8)] cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Generating...
                  </span>
                ) : (
                  "✨ Create Trip Summary"
                )}
              </button>
            </form>
          </div>

          {/* Right — Results */}
          {result && (
            <div className="flex-1 flex flex-col gap-6 min-w-0 animate-in fade-in slide-in-from-bottom-8 duration-700">

              {/* Trip Summary Card */}
              <div className="rounded-lg border border-slate-200/60 rounded-[2rem] bg-white/95 backdrop-blur-xl p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)]">
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
                  <h2 className="text-2xl font-bold text-slate-800">Trip Overview</h2>
                  <span className={`inline-flex items-center rounded-lg px-4 py-1.5 text-sm font-bold shadow-sm ${categoryColor[result.category] ?? "bg-slate-100 text-slate-700"}`}>
                    {result.category}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-8">
                  <div>
                    <span className="flex items-center gap-2 text-slate-400 uppercase tracking-wider text-[11px] font-bold mb-2">
                      📍 Destination
                    </span>
                    <p className="font-extrabold text-slate-900 text-lg line-clamp-1" title={result.destination}>{result.destination}</p>
                  </div>
                  <div>
                    <span className="flex items-center gap-2 text-slate-400 uppercase tracking-wider text-[11px] font-bold mb-2">
                      ⏱️ Duration
                    </span>
                    <p className="font-extrabold text-slate-900 text-lg">{result.days} Days</p>
                  </div>
                  <div>
                    <span className="flex items-center gap-2 text-slate-400 uppercase tracking-wider text-[11px] font-bold mb-2">
                      💼 Style
                    </span>
                    <p className="font-extrabold text-slate-900 text-lg capitalize">{result.travel_style}</p>
                  </div>
                  <div>
                    <span className="flex items-center gap-2 text-slate-400 uppercase tracking-wider text-[11px] font-bold mb-2">
                      💰 Budget
                    </span>
                    <p className="font-extrabold text-emerald-600 text-lg">${result.budget.toLocaleString()}</p>
                    <p className="text-xs font-semibold text-slate-400 mt-1">${result.daily_budget.toFixed(2)} / day</p>
                  </div>
                </div>

                {!aiRec && (
                  <div className="mt-10 bg-indigo-50/50 rounded-lg p-6 border border-indigo-100 text-center">
                    <p className="text-sm font-medium text-indigo-900/70 mb-4">Ready for the details? Let our AI craft your day-by-day itinerary.</p>
                    <button onClick={handleGenerateAI} disabled={loadingAI}
                      className="w-full md:w-auto rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-bold text-sm px-8 py-3.5 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer mx-auto">
                      {loadingAI ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                          </svg>
                          Generating your adventure...
                        </>
                      ) : "✨ Generate Full Itinerary"}
                    </button>
                  </div>
                )}
              </div>

              {/* AI Itinerary */}
              {aiRec && (
                <div className="rounded-lg border border-slate-200/60 rounded-[2rem] bg-white p-6 md:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] animate-in fade-in slide-in-from-bottom-8 duration-700">
                  <h2 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent mb-8 pb-6 border-b border-slate-100 flex items-center gap-3">
                    <span className="text-2xl">✨</span> Your Personalized Itinerary
                  </h2>
                  <ItineraryRenderer markdown={aiRec} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Footer */}
      <footer className="w-full bg-slate-950 text-slate-400 py-12 border-t border-slate-900 mt-auto relative z-10">
        <div className="max-w-[1600px] mx-auto px-6 md:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h3 className="text-white font-black text-xl mb-2 tracking-tight">KelanaAI</h3>
            <p className="text-sm font-medium">© {new Date().getFullYear()} KelanaAI Inc. All rights reserved.</p>
          </div>
          
          <nav className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-semibold">
            <a href="#" className="hover:text-white transition-colors">About Us</a>
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
