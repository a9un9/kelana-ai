"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ItineraryRenderer } from "@/components/ItineraryRenderer";
import { getTrip, generateItinerary, deleteTrip } from "@/services/tripService";
import { formatCurrency, getCategoryClass, getDestinationIcon, getTravelStyleIcon } from "@/lib/utils";
import { isAuthenticated } from "@/lib/auth";
import type { Trip } from "@/types";

export default function TripDetailPage(props: PageProps<"/trips/[id]">) {
  const router = useRouter();
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
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    if (tripId === null) return;
    getTrip(tripId)
      .then(setTrip)
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Failed to load trip.";
        if (
          msg.includes("401") ||
          msg.includes("403") ||
          msg.includes("Not authenticated") ||
          msg.includes("Forbidden")
        ) {
          router.push("/login");
        } else {
          setError(msg);
        }
      })
      .finally(() => setLoading(false));
  }, [tripId, router]);

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
      setError(err instanceof Error ? err.message : "AI generation failed.");
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
      router.push("/trips");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
      setDeleting(false);
    }
  };

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen font-sans relative flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop"
          alt="Background"
          className="fixed inset-0 w-full h-full object-cover -z-20 blur-[2px] scale-105"
        />
        <div className="fixed inset-0 bg-gradient-to-b from-slate-950/75 via-slate-900/60 to-slate-950/85 -z-10" />
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
      </div>
    );
  }

  // ─── Error ──────────────────────────────────────────────────────────────────
  if (error && !trip) {
    return (
      <div className="min-h-screen font-sans relative flex flex-col items-center justify-center gap-4 px-4 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop"
          alt="Background"
          className="fixed inset-0 w-full h-full object-cover -z-20 blur-[2px] scale-105"
        />
        <div className="fixed inset-0 bg-gradient-to-b from-slate-950/75 via-slate-900/60 to-slate-950/85 -z-10" />
        <div className="p-8 rounded-lg bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl text-white max-w-md">
          <p className="text-4xl mb-2">😕</p>
          <p className="text-xl font-bold mb-1">Trip Not Found</p>
          <p className="text-sm text-white/70 mb-6">{error}</p>
          <Link
            href="/trips"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 text-sm font-bold text-white shadow-lg"
          >
            ← Back to Trips
          </Link>
        </div>
      </div>
    );
  }

  if (!trip) return null;

  // ─── Main ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-blue-200 selection:text-blue-900 relative">
      {/* Fullscreen Background & Gradient Overlay */}
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
      <div className="w-full pt-28 pb-8 px-4 md:px-8 text-center animate-float-up">
        <div className="inline-flex items-center gap-2 py-1.5 px-4 rounded-lg bg-white/10 backdrop-blur-md border border-white/25 shadow-lg mb-3">
          <span className="text-lg">{getDestinationIcon(trip.destination)}</span>
          <span className="text-[11px] font-bold tracking-wider uppercase text-cyan-200">
            Trip Itinerary Details
          </span>
        </div>

        <h1 className="text-3xl md:text-5xl font-black text-white drop-shadow-2xl tracking-tight mb-3 flex items-center justify-center gap-3">
          <span>{trip.destination}</span>
          <span
            className={`inline-flex items-center rounded-lg px-3 py-1 text-xs font-bold shadow-lg ${getCategoryClass(
              trip.category
            )}`}
          >
            {trip.category}
          </span>
        </h1>
        <p className="text-white/80 text-sm md:text-base font-medium">
          Created on {trip.created_at ? new Date(trip.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "Recently"}
        </p>
      </div>

      {/* Main Content Details */}
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 md:px-6 pb-28 relative z-10 flex flex-col gap-6 animate-float-up">
        {/* Error banner */}
        {error && (
          <div className="rounded-lg bg-red-500/20 backdrop-blur-md border border-red-400/30 text-red-200 px-6 py-4 text-sm font-semibold shadow-xl">
            {error}
          </div>
        )}

        {/* Stats card (Glassmorphic) */}
        <div className="rounded-lg border border-white/60 bg-white/95 backdrop-blur-xl p-6 md:p-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <span>📋</span> Trip Overview
            </h2>
            <div className="flex items-center gap-2.5">
              <Link
                href="/trips"
                className="inline-flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2 transition-all border border-slate-200 shadow-2xs cursor-pointer"
              >
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to History
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="cursor-pointer inline-flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold px-3.5 py-2 transition-all disabled:opacity-50 border border-red-200 shadow-2xs"
              >
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {deleting ? "Deleting…" : "Delete Trip"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold block mb-1">
                📍 Destination
              </span>
              <p className="font-black text-slate-900 text-base truncate" title={trip.destination}>
                {trip.destination}
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold block mb-1">
                ⏱️ Duration
              </span>
              <p className="font-black text-slate-900 text-base">
                {trip.days} Days
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold block mb-1">
                💼 Style
              </span>
              <p className="font-black text-slate-900 text-base capitalize flex items-center gap-1.5">
                <span>{getTravelStyleIcon(trip.travel_style)}</span>
                <span>{trip.travel_style || "General"}</span>
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-emerald-50/60 border border-emerald-100">
              <span className="text-emerald-700 uppercase tracking-wider text-[10px] font-bold block mb-1">
                💰 Budget
              </span>
              <p className="font-black text-emerald-600 text-base">
                {formatCurrency(trip.budget)}
              </p>
              <p className="text-[11px] font-bold text-emerald-600/70 mt-0.5">
                {formatCurrency(trip.daily_budget)} / day
              </p>
            </div>
          </div>
        </div>

        {/* AI Itinerary Card */}
        {trip.ai_recommendation ? (
          <div className="rounded-lg border border-white/60 bg-white/95 backdrop-blur-xl p-6 md:p-8 shadow-2xl">
            <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
              <h2 className="text-xl font-black bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent flex items-center gap-2">
                <span>✨</span> AI Day-by-Day Itinerary
              </h2>
              <button
                onClick={handleGenerateAI}
                disabled={generatingAI}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold transition-all border border-blue-200 cursor-pointer disabled:opacity-50"
              >
                {generatingAI ? "Regenerating..." : "🔄 Regenerate"}
              </button>
            </div>
            <ItineraryRenderer markdown={trip.ai_recommendation} />
          </div>
        ) : (
          <div className="rounded-lg border border-white/20 bg-white/10 backdrop-blur-xl p-8 md:p-12 text-center text-white shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="text-3xl">✨</span>
            </div>
            <h3 className="text-xl font-black mb-2">No Itinerary Generated Yet</h3>
            <p className="text-sm font-medium text-white/80 max-w-md mx-auto mb-6">
              Let Kelana AI craft a personalized, day-by-day itinerary tailored to your budget and travel style.
            </p>
            <button
              onClick={handleGenerateAI}
              disabled={generatingAI}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 text-white font-extrabold text-sm px-8 py-3.5 transition-all shadow-lg shadow-blue-500/30 hover:scale-105 cursor-pointer"
            >
              {generatingAI ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
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
                  <span>Generating Itinerary...</span>
                </>
              ) : (
                <>
                  <span>Generate AI Itinerary</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
