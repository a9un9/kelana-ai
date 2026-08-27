"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { ItineraryRenderer } from "@/components/ItineraryRenderer";
import { getTrip, generateItinerary, deleteTrip } from "@/services/tripService";
import { formatCurrency, getCategoryClass } from "@/lib/utils";
import type { Trip } from "@/types";

export default function TripDetailPage(props: PageProps<"/trips/[id]">) {
  const [tripId, setTripId] = useState<number | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generatingAI, setGeneratingAI] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Resolve params (async in Next.js 16)
  useEffect(() => {
    props.params.then(({ id }) => setTripId(Number(id)));
  }, [props.params]);

  useEffect(() => {
    if (tripId === null) return;
    getTrip(tripId)
      .then(setTrip)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load trip.")
      )
      .finally(() => setLoading(false));
  }, [tripId]);

  const handleGenerateAI = async () => {
    if (!trip) return;
    setGeneratingAI(true);
    setError("");
    try {
      const result = await generateItinerary(trip.id);
      setTrip((prev) =>
        prev ? { ...prev, ai_recommendation: result.recommendation } : prev
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "AI generation failed."
      );
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleDelete = async () => {
    if (!trip) return;
    if (!confirm(`Delete trip to ${trip.destination}? This cannot be undone.`))
      return;
    setDeleting(true);
    try {
      await deleteTrip(trip.id);
      window.location.href = "/trips";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
      setDeleting(false);
    }
  };

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
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
    );
  }

  // ─── Error ──────────────────────────────────────────────────────────────────
  if (error && !trip) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-4xl">😕</p>
        <p className="text-lg font-bold text-slate-700">Trip not found</p>
        <p className="text-sm text-slate-500">{error}</p>
        <Link
          href="/trips"
          className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-6 py-3 transition-colors"
        >
          Back to Trips
        </Link>
      </div>
    );
  }

  if (!trip) return null;

  // ─── Main ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen font-sans pb-24 relative">
      {/* Fullscreen Background */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img 
        src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop" 
        alt="Beautiful Tropical Beach" 
        className="fixed inset-0 w-full h-full object-cover -z-20 blur-sm scale-105" 
      />
      <div className="fixed inset-0 bg-slate-900/40 -z-10"></div>

      {/* Hero Header */}
      <div className="w-full pt-32 pb-32 md:pt-40 md:pb-32 px-6">
        <div className="w-full max-w-4xl mx-auto flex items-end justify-between mt-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white mt-1 flex items-center gap-4 drop-shadow-2xl tracking-tight">
              {trip.destination}
              <span
                className={`inline-flex items-center rounded-lg px-3 py-1 text-sm font-bold shadow-lg ${getCategoryClass(trip.category)}`}
              >
                {trip.category}
              </span>
            </h1>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full max-w-4xl mx-auto px-6 -mt-24 relative z-10 flex flex-col gap-8">
        {/* Error banner */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-100 text-red-600 px-5 py-4 text-sm font-semibold">
            {error}
          </div>
        )}

        {/* Stats card */}
        <div className="rounded-lg border border-slate-200/60 bg-white p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
            <h2 className="text-xl font-extrabold text-slate-800">
              Trip Overview
            </h2>
            <div className="flex items-center gap-3">
              <Link
                href="/trips"
                className="inline-flex items-center justify-center rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold px-4 py-2 transition-colors border border-slate-200 shadow-sm"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to History
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="cursor-pointer inline-flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold px-4 py-2 transition-colors disabled:opacity-50 border border-red-100 shadow-sm"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {deleting ? "Deleting…" : "Delete Trip"}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                📍 Destination
              </p>
              <p className="text-lg font-extrabold text-slate-900">
                {trip.destination}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                ⏱️ Duration
              </p>
              <p className="text-lg font-extrabold text-slate-900">
                {trip.days} Days
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                💰 Total Budget
              </p>
              <p className="text-lg font-extrabold text-emerald-600">
                {formatCurrency(trip.budget)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                📅 Daily Budget
              </p>
              <p className="text-lg font-extrabold text-slate-900">
                {formatCurrency(trip.daily_budget)}
              </p>
            </div>
          </div>
        </div>

        {/* AI Itinerary */}
        {trip.ai_recommendation ? (
          <div className="rounded-lg border border-slate-200/60 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-extrabold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-6 pb-4 border-b border-slate-100 flex items-center gap-2">
              <span>✨</span> AI Itinerary
            </h2>
            <ItineraryRenderer markdown={trip.ai_recommendation} />
          </div>
        ) : (
          <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-8 text-center">
            <p className="text-sm font-medium text-blue-900/70 mb-4">
              No itinerary yet. Let AI craft a personalised day-by-day plan for
              this trip.
            </p>
            <button
              onClick={handleGenerateAI}
              disabled={generatingAI}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm px-8 py-3.5 transition-all shadow-md hover:shadow-lg inline-flex items-center gap-2 cursor-pointer"
            >
              {generatingAI ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
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
                  Generating…
                </>
              ) : (
                "✨ Generate Itinerary"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
