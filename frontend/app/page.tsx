"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { createTrip, generateItinerary } from "@/services/tripService";

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

import { ItineraryRenderer } from "@/components/ItineraryRenderer";


export default function Home() {
  const router = useRouter();
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

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.push("/login");
    }
  }, [router]);

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
      const data = await createTrip({
        destination: form.destination,
        days: Number(form.days),
        budget: Number(form.budget),
        travel_style: form.travel_style,
      });

      setResult(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      if (msg.includes("401") || msg.includes("403") || msg.includes("Not authenticated")) {
        setError("You need to sign in to plan a trip.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!result?.id) return;
    setLoadingAI(true);
    setError("");

    try {
      await generateItinerary(result.id);
      router.push("/trips");
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
    <div className="min-h-screen flex flex-col font-sans selection:bg-blue-200 selection:text-blue-900 relative">
      
      {/* Fullscreen Background */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img 
        src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop" 
        alt="Beautiful Tropical Beach" 
        className="fixed inset-0 w-full h-full object-cover -z-20 blur-sm scale-105" 
      />
      <div className="fixed inset-0 bg-gradient-to-b from-slate-900/50 via-slate-900/30 to-slate-900/60 -z-10"></div>

      {/* Hero Section */}
      <div className="w-full pt-32 pb-48 md:pt-40 md:pb-56 flex flex-col items-center justify-center text-white px-4 text-center relative overflow-hidden">
        {/* Floating Particles */}
        <div className="particle particle-1" style={{ top: '20%', left: '15%' }}></div>
        <div className="particle particle-2" style={{ top: '60%', left: '75%' }}></div>
        <div className="particle particle-3" style={{ top: '40%', left: '45%' }}></div>
        <div className="particle particle-1" style={{ top: '70%', left: '25%' }}></div>
        <div className="particle particle-2" style={{ top: '30%', left: '85%' }}></div>
        <div className="particle particle-3" style={{ top: '80%', left: '60%' }}></div>

        <span className="animate-float-up mb-4 inline-block py-1.5 px-4 rounded-lg bg-white/20 backdrop-blur-md border border-white/30 text-xs font-bold tracking-widest uppercase shadow-lg animate-badge-pulse">Discover Your Next Journey</span>
        <h1 className="animate-float-up text-5xl md:text-7xl font-black mb-6 drop-shadow-2xl tracking-tight bg-gradient-to-r from-white via-blue-200 to-cyan-200 via-white to-blue-200 bg-clip-text text-transparent animate-shimmer" style={{ backgroundSize: '200% auto' }}>
          KelanaAI
        </h1>
        <p className="animate-float-up-delayed text-lg md:text-xl max-w-2xl drop-shadow-lg font-medium text-slate-100">
          Crafting personalized, AI-driven itineraries in seconds. Skip the planning, start exploring.
        </p>
      </div>

      {/* Main Application Area */}
      <div className="flex-1 w-full max-w-[1600px] mx-auto px-4 md:px-8 -mt-40 md:-mt-52 relative z-10 pb-24">
        <div className={`flex flex-col md:flex-row gap-8 w-full transition-all duration-700 ease-out mx-auto ${result ? "max-w-[1600px]" : "max-w-md justify-center"}`}>

          {/* Left — Form */}
          <div className="form-card-glow animate-float-up-delayed w-full max-w-md mx-auto md:mx-0 flex-shrink-0 bg-white backdrop-blur-2xl border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12)] self-start">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 via-blue-600 to-teal-500 bg-clip-text text-transparent">Plan Your Trip</h2>
              <p className="text-sm text-slate-400 mt-2 font-medium">Where is your dream destination?</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Destination</label>
                <input type="text" name="destination" value={form.destination} onChange={handleChange}
                  placeholder="e.g. Kyoto, Japan" required
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 bg-slate-50 focus:bg-white transition-all duration-300 font-semibold" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Budget ($)</label>
                  <input type="number" name="budget" value={form.budget} onChange={handleChange}
                    placeholder="2000" min={1} required
                    className="w-full border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 bg-slate-50 focus:bg-white transition-all duration-300 font-semibold" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Days</label>
                  <input type="number" name="days" value={form.days} onChange={handleChange}
                    placeholder="5" min={1} required
                    className="w-full border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 bg-slate-50 focus:bg-white transition-all duration-300 font-semibold" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Travel Style</label>
                <input type="text" name="travel_style" value={form.travel_style} onChange={handleChange}
                  placeholder="e.g. Relaxing, Adventure" required
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 bg-slate-50 focus:bg-white transition-all duration-300 font-semibold" />
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 border border-red-100 rounded-2xl px-4 py-3 text-sm flex items-start gap-3 mt-1">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="font-semibold break-words">{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="animate-pulse-glow mt-4 w-full rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-teal-500 hover:from-indigo-500 hover:via-blue-500 hover:to-teal-400 disabled:opacity-70 text-white font-bold text-base py-4 transition-all duration-300 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0">
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
                  <div className="mt-10 bg-blue-50/50 rounded-lg p-6 border border-blue-100 text-center">
                    <p className="text-sm font-medium text-blue-900/70 mb-4">Ready for the details? Let our AI craft your day-by-day itinerary.</p>
                    <button onClick={handleGenerateAI} disabled={loadingAI}
                      className="w-full md:w-auto rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-bold text-sm px-8 py-3.5 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer mx-auto">
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
                  <h2 className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-8 pb-6 border-b border-slate-100 flex items-center gap-3">
                    <span className="text-2xl">✨</span> Your Personalized Itinerary
                  </h2>
                  <ItineraryRenderer markdown={aiRec} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}
