"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatCurrency, getCategoryClass, getDestinationIcon, getTravelStyleIcon } from "@/lib/utils";
import { listTrips } from "@/services/tripService";
import { isAuthenticated } from "@/lib/auth";
import type { Trip } from "@/types";

export default function TripsPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterText, setFilterText] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const sortRef = useRef<HTMLDivElement>(null);
  const ITEMS_PER_PAGE = 8;

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    listTrips()
      .then(setTrips)
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Failed to load trips.";
        if (msg.includes("401") || msg.includes("403") || msg.includes("Not authenticated")) {
          router.push("/login");
        } else {
          setError(msg);
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredAndSortedTrips = useMemo(() => {
    const filtered = trips.filter(
      (t) =>
        t.destination.toLowerCase().includes(filterText.toLowerCase()) ||
        t.category.toLowerCase().includes(filterText.toLowerCase()) ||
        (t.travel_style && t.travel_style.toLowerCase().includes(filterText.toLowerCase()))
    );

    return filtered.sort((a, b) => {
      if (sortBy === "budget_asc") {
        return a.budget - b.budget;
      } else if (sortBy === "budget_desc") {
        return b.budget - a.budget;
      } else if (sortBy === "days_desc") {
        return b.days - a.days;
      }
      return (b.id ?? 0) - (a.id ?? 0);
    });
  }, [trips, filterText, sortBy]);

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    setCurrentPage(1);
    setIsSortOpen(false);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterText(e.target.value);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredAndSortedTrips.length / ITEMS_PER_PAGE);
  const paginatedTrips = filteredAndSortedTrips.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-blue-200 selection:text-blue-900 relative">
      {/* Background Image & Gradient Overlay */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop"
        alt="Background"
        className="fixed inset-0 w-full h-full object-cover -z-20 blur-[2px] scale-105"
      />
      <div className="fixed inset-0 bg-gradient-to-b from-slate-950/75 via-slate-900/60 to-slate-950/85 -z-10" />

      {/* Floating Animated Particles */}
      <div className="particle particle-1 top-24 left-16" />
      <div className="particle particle-2 top-48 right-24" />
      <div className="particle particle-3 top-96 left-1/4" />
      <div className="particle particle-2 bottom-32 right-1/3" />

      {/* Hero Header */}
      <div className="w-full pt-28 pb-10 px-4 md:px-8 text-center animate-float-up">
        <div className="inline-flex items-center gap-2 py-1.5 px-4 rounded-lg bg-white/10 backdrop-blur-md border border-white/25 shadow-lg mb-3">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[11px] font-bold tracking-wider uppercase text-cyan-200">
            Trip History • Saved Plans
          </span>
        </div>

        <h1 className="text-3xl md:text-5xl font-black text-white drop-shadow-2xl tracking-tight mb-2">
          My Saved <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Adventures</span>
        </h1>
        <p className="text-white/80 text-sm md:text-base font-medium max-w-xl mx-auto">
          Review, manage, and explore all your AI-generated travel itineraries and budget plans in one place.
        </p>
      </div>

      {/* Main Content Container */}
      <div className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-6 pb-28 relative z-10">
        
        {/* Loading Spinner */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 animate-float-up">
            <div className="w-14 h-14 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl">
              <svg
                className="animate-spin h-7 w-7 text-cyan-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            </div>
            <p className="text-sm font-bold text-white/80">Loading your itineraries...</p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="rounded-lg bg-red-500/20 backdrop-blur-md border border-red-400/30 text-red-200 px-6 py-4 text-sm font-semibold shadow-xl mb-6 animate-float-up">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && trips.length === 0 && (
          <div className="rounded-lg bg-white/10 backdrop-blur-xl border border-white/20 p-8 md:p-14 text-center text-white shadow-2xl flex flex-col items-center justify-center gap-4 animate-float-up">
            <div className="w-20 h-20 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-xl shadow-blue-500/30 mb-2 transform -rotate-6 hover:rotate-0 transition-transform">
              <svg
                className="w-10 h-10 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M21 16V14L13 9V3.5C13 2.67 12.33 2 11.5 2C10.67 2 10 2.67 10 3.5V9L2 14V16L10 13.5V19L8 20.5V22L11.5 21L15 22V20.5L13 19V13.5L21 16Z" />
              </svg>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">No saved trips yet</h2>
            <p className="text-base text-white/80 max-w-md">
              Start planning your next adventure with our AI travel planner and save your personalized itinerary here.
            </p>
            <Link
              href="/"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-sm font-extrabold px-8 py-4 transition-all shadow-lg shadow-blue-500/30 hover:scale-105 cursor-pointer"
            >
              <span>Plan a New Trip</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        )}

        {/* Trips Table & Controls */}
        {!loading && !error && trips.length > 0 && (
          <div className="flex flex-col gap-6 animate-float-up">
            
            {/* Control Bar (Search, Filter, New Trip) */}
            <div className="relative z-30 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/10 backdrop-blur-xl p-4 rounded-lg border border-white/20 shadow-2xl">
              
              {/* Trip Count Chip */}
              <div className="flex items-center gap-2 px-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <p className="text-sm font-bold text-white/90">
                  <span className="text-cyan-300 font-extrabold text-base">{filteredAndSortedTrips.length}</span>{" "}
                  {filteredAndSortedTrips.length === 1 ? "trip found" : "trips found"}
                </p>
              </div>

              {/* Actions & Filters */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                
                {/* Search Bar */}
                <div className="relative flex-1 sm:w-72">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search destination, style..."
                    value={filterText}
                    onChange={handleFilterChange}
                    className="w-full pl-10 pr-10 py-2.5 bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 rounded-lg text-sm font-semibold text-white placeholder-white/50 focus:outline-none focus:border-cyan-300 transition-all backdrop-blur-md"
                  />
                  {filterText && (
                    <button
                      onClick={() => { setFilterText(""); setCurrentPage(1); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Sort Dropdown */}
                <div className="relative" ref={sortRef}>
                  <button
                    onClick={() => setIsSortOpen(!isSortOpen)}
                    className="w-full sm:w-auto sm:min-w-[215px] px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg text-sm font-bold text-white backdrop-blur-md transition-all text-left flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <span className="whitespace-nowrap">
                      {sortBy === "latest" && "Sort: Latest"}
                      {sortBy === "budget_desc" && "Budget: High → Low"}
                      {sortBy === "budget_asc" && "Budget: Low → High"}
                      {sortBy === "days_desc" && "Days: Longest"}
                    </span>
                    <svg className={`w-4 h-4 text-cyan-300 transition-transform duration-200 flex-shrink-0 ${isSortOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isSortOpen && (
                    <div className="absolute right-0 z-50 w-full min-w-[215px] mt-2 bg-slate-900/95 backdrop-blur-2xl border border-white/20 rounded-lg shadow-2xl py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                      <button
                        onClick={() => handleSortChange("latest")}
                        className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer ${sortBy === "latest" ? "bg-cyan-500/20 text-cyan-300" : "text-white/80 hover:bg-white/10"}`}
                      >
                        Sort: Latest
                      </button>
                      <button
                        onClick={() => handleSortChange("budget_desc")}
                        className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer ${sortBy === "budget_desc" ? "bg-cyan-500/20 text-cyan-300" : "text-white/80 hover:bg-white/10"}`}
                      >
                        Budget: High to Low
                      </button>
                      <button
                        onClick={() => handleSortChange("budget_asc")}
                        className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer ${sortBy === "budget_asc" ? "bg-cyan-500/20 text-cyan-300" : "text-white/80 hover:bg-white/10"}`}
                      >
                        Budget: Low to High
                      </button>
                      <button
                        onClick={() => handleSortChange("days_desc")}
                        className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer ${sortBy === "days_desc" ? "bg-cyan-500/20 text-cyan-300" : "text-white/80 hover:bg-white/10"}`}
                      >
                        Duration: Longest Days
                      </button>
                    </div>
                  )}
                </div>

                {/* New Trip CTA */}
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-sm font-extrabold px-5 py-2.5 transition-all shadow-md shadow-blue-500/20 hover:scale-102 whitespace-nowrap cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>New Trip</span>
                </Link>
              </div>
            </div>

            {/* Table Container */}
            <div className="relative z-10 bg-white/95 backdrop-blur-xl rounded-lg border border-white/60 shadow-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[780px]">
                  <thead>
                    <tr className="bg-slate-100/75 border-b border-slate-200/80 text-slate-500 text-[11px] uppercase tracking-wider font-extrabold">
                      <th className="px-6 py-4">Destination</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Category & Style</th>
                      <th className="px-6 py-4">Duration</th>
                      <th className="px-6 py-4">Budget</th>
                      <th className="px-6 py-4">AI Itinerary</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedTrips.map((trip) => (
                      <tr
                        key={trip.id}
                        className="hover:bg-blue-50/40 transition-colors group"
                      >
                        {/* Destination */}
                        <td className="px-6 py-4">
                          <Link
                            href={`/trips/${trip.id}`}
                            className="text-sm font-black text-slate-800 group-hover:text-blue-600 transition-colors flex items-center gap-2"
                          >
                            <span className="text-xl transform group-hover:scale-110 transition-transform">
                              {getDestinationIcon(trip.destination)}
                            </span>
                            <span>{trip.destination}</span>
                          </Link>
                        </td>

                        {/* Date */}
                        <td className="px-6 py-4">
                          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                            {trip.created_at
                              ? new Date(trip.created_at).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "—"}
                          </span>
                        </td>

                        {/* Category & Style */}
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            <span
                              className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-bold ${getCategoryClass(
                                trip.category
                              )}`}
                            >
                              {trip.category}
                            </span>
                            <span className="inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-bold bg-slate-100 text-slate-700 capitalize">
                              <span className="mr-1">{getTravelStyleIcon(trip.travel_style)}</span>
                              {trip.travel_style || "General"}
                            </span>
                          </div>
                        </td>

                        {/* Duration */}
                        <td className="px-6 py-4">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/80 text-xs font-black text-slate-700">
                            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {trip.days} {trip.days === 1 ? "Day" : "Days"}
                          </div>
                        </td>

                        {/* Budget */}
                        <td className="px-6 py-4">
                          <p className="text-sm font-black text-emerald-600">
                            {formatCurrency(trip.budget)}
                          </p>
                          <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                            {formatCurrency(trip.daily_budget)} / day
                          </p>
                        </td>

                        {/* AI Status */}
                        <td className="px-6 py-4">
                          {trip.ai_recommendation ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                              Generated
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 text-xs font-bold">
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                              Pending
                            </span>
                          )}
                        </td>

                        {/* Action Link */}
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/trips/${trip.id}`}
                            className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white text-xs font-bold transition-all shadow-2xs group/btn"
                          >
                            <span>Details</span>
                            <svg className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </td>
                      </tr>
                    ))}

                    {paginatedTrips.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center">
                          <p className="text-slate-500 text-sm font-semibold">
                            No trips match your search query &quot;{filterText}&quot;.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2">
                <span className="text-xs font-bold text-white/80 drop-shadow-md">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedTrips.length)} of{" "}
                  {filteredAndSortedTrips.length} itineraries
                </span>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all backdrop-blur-md cursor-pointer"
                  >
                    ← Previous
                  </button>
                  
                  <div className="flex items-center px-3 py-1 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 text-xs font-bold text-cyan-300">
                    {currentPage} / {totalPages}
                  </div>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all backdrop-blur-md cursor-pointer"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
