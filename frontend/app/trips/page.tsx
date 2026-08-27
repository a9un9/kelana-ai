"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { formatCurrency, getCategoryClass, getDestinationIcon, getTravelStyleIcon } from "@/lib/utils";
import { listTrips } from "@/services/tripService";
import type { Trip } from "@/types";
import TripCard from "@/components/TripCard";

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterText, setFilterText] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const sortRef = useRef<HTMLDivElement>(null);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    listTrips()
      .then(setTrips)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load trips.")
      )
      .finally(() => setLoading(false));
  }, []);

  const filteredAndSortedTrips = useMemo(() => {
    const filtered = trips.filter(
      (t) =>
        t.destination.toLowerCase().includes(filterText.toLowerCase()) ||
        t.category.toLowerCase().includes(filterText.toLowerCase())
    );

    return filtered.sort((a, b) => {
      if (sortBy === "budget_asc") {
        return a.budget - b.budget;
      } else if (sortBy === "budget_desc") {
        return b.budget - a.budget;
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
    <div className="min-h-screen font-sans relative">
      {/* Fullscreen Background */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img 
        src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop" 
        alt="Beautiful Tropical Beach" 
        className="fixed inset-0 w-full h-full object-cover -z-20 blur-sm scale-105" 
      />
      <div className="fixed inset-0 bg-slate-900/40 -z-10"></div>

      {/* Hero Header */}
      <div className="w-full pt-32 pb-32 md:pt-40 md:pb-40 px-4 md:px-6">
        <div className="w-full max-w-6xl mx-auto flex items-center justify-between mt-4">
          <div>
            <span className="mb-3 inline-block py-1.5 px-4 rounded-lg bg-white/20 backdrop-blur-md border border-white/30 text-[10px] font-bold tracking-widest uppercase shadow-lg text-white">Dashboard</span>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-2 drop-shadow-2xl tracking-tight">
              Trip History
            </h1>
            <p className="text-base text-white/90 font-medium drop-shadow-lg">
              All your saved trips in one place.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-6 -mt-20 relative z-10 pb-24">
        {loading && (
          <div className="flex items-center justify-center py-24">
            <svg
              className="animate-spin h-8 w-8 text-blue-500"
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
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-100 text-red-600 px-5 py-4 text-sm font-semibold">
            {error}
          </div>
        )}

        {!loading && !error && trips.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center gap-3 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-3xl shadow-lg mt-4">
            <svg
              className="w-14 h-14 text-white mb-1 transform rotate-45"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M21 16V14L13 9V3.5C13 2.67 12.33 2 11.5 2C10.67 2 10 2.67 10 3.5V9L2 14V16L10 13.5V19L8 20.5V22L11.5 21L15 22V20.5L13 19V13.5L21 16Z" />
            </svg>
            <p className="text-2xl font-bold text-white">No trips found.</p>
            <p className="text-base text-white/90 font-medium">
              Create your first itinerary.
            </p>
            <Link
              href="/"
              className="mt-4 rounded-full bg-white hover:bg-slate-50 text-blue-600 text-sm font-extrabold px-8 py-3.5 transition-colors shadow-md hover:shadow-lg inline-flex items-center gap-2"
            >
              Generate a Trip &rarr;
            </Link>
          </div>
        )}

        {!loading && !error && trips.length > 0 && (
          <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <p className="text-sm font-bold text-slate-500 px-2">
                <span className="text-blue-600 text-base">{filteredAndSortedTrips.length}</span> trips found
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div className="relative" ref={sortRef}>
                  <button
                    onClick={() => setIsSortOpen(!isSortOpen)}
                    className="w-full sm:w-56 pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-left flex items-center justify-between"
                  >
                    <span>
                      {sortBy === "latest" && "Sort: Latest"}
                      {sortBy === "budget_desc" && "Budget: High to Low"}
                      {sortBy === "budget_asc" && "Budget: Low to High"}
                    </span>
                    <svg className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-transform duration-200 ${isSortOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isSortOpen && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-lg shadow-xl py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                      <button
                        onClick={() => handleSortChange("latest")}
                        className={`w-full text-left px-4 py-2 text-sm font-bold transition-colors ${sortBy === "latest" ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"}`}
                      >
                        Sort: Latest
                      </button>
                      <button
                        onClick={() => handleSortChange("budget_desc")}
                        className={`w-full text-left px-4 py-2 text-sm font-bold transition-colors ${sortBy === "budget_desc" ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"}`}
                      >
                        Budget: High to Low
                      </button>
                      <button
                        onClick={() => handleSortChange("budget_asc")}
                        className={`w-full text-left px-4 py-2 text-sm font-bold transition-colors ${sortBy === "budget_asc" ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"}`}
                      >
                        Budget: Low to High
                      </button>
                    </div>
                  )}
                </div>

                <div className="relative w-full sm:w-72">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search destination or category..."
                    value={filterText}
                    onChange={handleFilterChange}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                  {filterText && (
                    <button 
                      onClick={() => { setFilterText(""); setCurrentPage(1); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                <Link
                  href="/"
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-600 text-sm font-extrabold px-6 py-2.5 transition-colors shadow-sm whitespace-nowrap"
                >
                  + New Trip
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider font-bold">
                    <th className="px-6 py-4">Destination</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Days</th>
                    <th className="px-6 py-4">Budget</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedTrips.map((trip) => (
                    <tr key={trip.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="text-sm font-extrabold text-slate-800 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                          <span className="text-lg">{getDestinationIcon(trip.destination)}</span>
                          {trip.destination}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-slate-500 whitespace-nowrap">
                          {trip.created_at ? new Date(trip.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex flex-col gap-1.5">
                        <span className={`inline-flex items-center rounded-full w-max px-2.5 py-1 text-[11px] font-bold ${getCategoryClass(trip.category)}`}>
                          {trip.category}
                        </span>
                        <span className="inline-flex items-center rounded-full w-max px-2.5 py-1 text-[11px] font-bold bg-slate-100 text-slate-700 capitalize">
                          <span className="mr-1">{getTravelStyleIcon(trip.travel_style)}</span>
                          {trip.travel_style || "General"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-extrabold text-slate-700">
                          {trip.days}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-extrabold text-emerald-600">
                          {formatCurrency(trip.budget)}
                        </p>
                        <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                          {formatCurrency(trip.daily_budget)} / day
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {trip.ai_recommendation ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                            Ready
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/trips/${trip.id}`} className="cursor-pointer inline-flex items-center text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline">
                          View &rarr;
                        </Link>
                      </td>
                    </tr>
                  ))}
                  
                  {paginatedTrips.length === 0 && trips.length > 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <p className="text-slate-500 text-sm font-medium">
                          No trips match &quot;{filterText}&quot;.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 px-1">
                <span className="text-sm font-bold text-white/90 drop-shadow-md">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedTrips.length)} of {filteredAndSortedTrips.length} entries
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="cursor-pointer px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="cursor-pointer px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
