import Link from "next/link";
import type { Trip } from "@/types";
import { formatCurrency, getCategoryClass, getDestinationIcon, getTravelStyleIcon } from "@/lib/utils";

type TripCardProps = {
  trip: Trip;
};

export default function TripCard({ trip }: TripCardProps) {
  return (
    <Link
      href={`/trips/${trip.id}`}
      className="group block rounded-lg border border-slate-200/60 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <h3 className="text-lg font-extrabold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">
          <span className="mr-2 text-xl">{getDestinationIcon(trip.destination)}</span>
          {trip.destination}
        </h3>
        <div className="flex flex-col items-end gap-2">
          <span
            className={`flex-shrink-0 inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${getCategoryClass(trip.category)}`}
          >
            {trip.category}
          </span>
          <span className="flex-shrink-0 inline-flex items-center rounded-full px-3 py-1 text-xs font-bold bg-slate-100 text-slate-700 capitalize">
            <span className="mr-1.5">{getTravelStyleIcon(trip.travel_style)}</span>
            {trip.travel_style || "General"}
          </span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            ⏱️ Days
          </p>
          <p className="text-base font-extrabold text-slate-800">{trip.days}</p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            💰 Budget
          </p>
          <p className="text-base font-extrabold text-emerald-600">
            {formatCurrency(trip.budget)}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            📅 /day
          </p>
          <p className="text-base font-extrabold text-slate-800">
            {formatCurrency(trip.daily_budget)}
          </p>
        </div>
      </div>

      {/* AI badge */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
        {trip.ai_recommendation ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            Itinerary ready
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
            No itinerary yet
          </span>
        )}
        <span className="text-xs font-bold text-blue-500 group-hover:underline">
          View →
        </span>
      </div>
    </Link>
  );
}
